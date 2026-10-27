import Stripe from "stripe";
import type { DecodedIdToken } from "firebase-admin/auth";
import { db, pledgesRef, upsertUser, type PledgeRecord, type UserRecord } from "./firebase.js";

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
  if ("invoice_settings" in customer) {
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
 * Charges one pledge off-session. Idempotent per pledge: calling it twice for
 * the same pledge id returns the same PaymentIntent instead of charging again.
 */
export async function chargePledge(
  user: UserRecord,
  pledge: PledgeRecord,
  mode: { status: "surrendered" | "forfeited"; reason?: string } = { status: "surrendered" }
): Promise<ChargeOutcome> {
  if (!user.stripeCustomerId) {
    throw Object.assign(new Error("No payment method on file"), { status: 400 });
  }
  if (pledge.status === "completed") {
    throw Object.assign(new Error("This pledge was already completed"), { status: 400 });
  }
  const paymentMethod = await latestPaymentMethod(user.stripeCustomerId);
  if (!paymentMethod) {
    throw Object.assign(new Error("No saved card found"), { status: 400 });
  }

  const amount = Math.round(pledge.pledgeValue * 100);
  const idempotencyKey = `pledge-${user.uid}-${pledge.id}`;

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
        description:
          mode.status === "forfeited"
            ? `Pledge: forfeited screen-time pledge (${mode.reason ?? "terms"})`
            : "Pledge: surrendered screen-time pledge",
        metadata: { firebaseUid: user.uid, pledgeId: pledge.id, outcome: mode.status },
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

  const now = new Date().toISOString();
  await db()
    .collection("users")
    .doc(user.uid)
    .collection("charges")
    .doc(intent.id)
    .set({ status: intent.status, amount, currency: CURRENCY, pledgeId: pledge.id, createdAt: now });

  if (intent.status === "succeeded" || intent.status === "processing") {
    await pledgesRef(user.uid)
      .doc(pledge.id)
      .set(
        {
          status: mode.status,
          chargedAt: now,
          paymentIntentId: intent.id,
          ...(mode.reason ? { forfeitReason: mode.reason } : {}),
        },
        { merge: true }
      );
  }

  return { status: intent.status, paymentIntentId: intent.id, amount, currency: CURRENCY };
}

/** Whether the customer has any saved card. */
export async function hasPaymentMethod(user?: UserRecord): Promise<boolean> {
  if (!user?.stripeCustomerId) return false;
  return !!(await latestPaymentMethod(user.stripeCustomerId));
}
