import Stripe from "stripe";
import type { DecodedIdToken } from "firebase-admin/auth";
import { db, upsertUser, type UserRecord } from "./firebase.js";

let client: Stripe | undefined;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export const CURRENCY = (process.env.PLEDGE_CURRENCY ?? "eur").toLowerCase();

// Must match what the installed @stripe/stripe-react-native expects.
export const EPHEMERAL_KEY_API_VERSION =
  process.env.STRIPE_EPHEMERAL_API_VERSION ?? "2024-06-20";

export async function ensureCustomer(
  decoded: DecodedIdToken,
  user?: UserRecord
): Promise<string> {
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe().customers.create(
    {
      email: decoded.email,
      name: decoded.name,
      metadata: { firebaseUid: decoded.uid },
    },
    { idempotencyKey: `customer-${decoded.uid}` }
  );
  await upsertUser(decoded, { stripeCustomerId: customer.id });
  return customer.id;
}

export async function createPaymentSheetParams(customerId: string) {
  const [ephemeralKey, setupIntent] = await Promise.all([
    stripe().ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: EPHEMERAL_KEY_API_VERSION }
    ),
    stripe().setupIntents.create({
      customer: customerId,
      usage: "off_session",
      payment_method_types: ["card"],
    }),
  ]);
  return {
    setupIntent: setupIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customerId,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  };
}

/** Most recently saved card for the customer. */
async function latestPaymentMethod(customerId: string): Promise<string | undefined> {
  const customer = await stripe().customers.retrieve(customerId);
  if (!customer.deleted) {
    const def = customer.invoice_settings?.default_payment_method;
    if (typeof def === "string") return def;
    if (def && "id" in def) return def.id;
  }
  const methods = await stripe().paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 1,
  });
  return methods.data[0]?.id;
}

export type ChargeOutcome = {
  status: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
};

/**
 * Charges the pledge off-session. Idempotent per pledge: calling it twice for
 * the same pledgeSetAt returns the same PaymentIntent instead of charging again.
 */
export async function chargePledge(user: UserRecord): Promise<ChargeOutcome> {
  if (!user.stripeCustomerId) {
    throw Object.assign(new Error("No payment method on file"), { status: 400 });
  }
  if (!user.pledgeValue || !user.pledgeSetAt) {
    throw Object.assign(new Error("No active pledge to charge"), { status: 400 });
  }
  const paymentMethod = await latestPaymentMethod(user.stripeCustomerId);
  if (!paymentMethod) {
    throw Object.assign(new Error("No saved card found"), { status: 400 });
  }

  const amount = Math.round(user.pledgeValue * 100);
  const idempotencyKey = `pledge-${user.uid}-${user.pledgeSetAt}`;

  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe().paymentIntents.create(
      {
        amount,
        currency: CURRENCY,
        customer: user.stripeCustomerId,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        description: "Pledge: surrendered screen-time challenge",
        metadata: { firebaseUid: user.uid, pledgeSetAt: user.pledgeSetAt },
      },
      { idempotencyKey }
    );
  } catch (err) {
    // Card declined / needs authentication: surface the intent status if any.
    if (err instanceof Stripe.errors.StripeCardError && err.payment_intent) {
      intent = err.payment_intent as Stripe.PaymentIntent;
    } else {
      throw err;
    }
  }

  await db()
    .collection("users")
    .doc(user.uid)
    .collection("charges")
    .doc(intent.id)
    .set({
      status: intent.status,
      amount,
      currency: CURRENCY,
      pledgeSetAt: user.pledgeSetAt,
      createdAt: new Date().toISOString(),
    });

  return { status: intent.status, paymentIntentId: intent.id, amount, currency: CURRENCY };
}
