import Stripe from "stripe";
import type { DecodedIdToken } from "firebase-admin/auth";
import { db, FieldValue, pledgesRef, upsertUser, type PledgeRecord, type UserRecord } from "./firebase.js";

let client: Stripe | undefined;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export const CURRENCY = (process.env.PLEDGE_CURRENCY ?? "usd").toLowerCase();

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

export const BREAK_AMOUNT_CENTS = 100;
export const BREAKS_PER_DAY = 3;

/**
 * Charges one paid 5-minute break on a pledge that stays active. A slot for
 * the day is reserved first, so two taps can never buy a fourth break, and is
 * given back if the card does not go through.
 */
export async function chargeBreak(user: UserRecord, pledgeId: string, day: string): Promise<ChargeOutcome & { breaksToday: number }> {
  if (!user.stripeCustomerId) {
    throw Object.assign(new Error("No payment method on file"), { status: 400 });
  }
  const paymentMethod = await latestPaymentMethod(user.stripeCustomerId);
  if (!paymentMethod) {
    throw Object.assign(new Error("No saved card found"), { status: 400 });
  }

  const ref = pledgesRef(user.uid).doc(pledgeId);
  const slot = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const pledge = snap.data() as PledgeRecord | undefined;
    if (!pledge) throw Object.assign(new Error("No such pledge"), { status: 404 });
    if (pledge.status !== "active") throw Object.assign(new Error("This pledge is no longer running"), { status: 400 });
    const used = pledge.breaks?.[day] ?? 0;
    if (used >= BREAKS_PER_DAY) {
      throw Object.assign(new Error(`No breaks left today (${BREAKS_PER_DAY} a day)`), { status: 429 });
    }
    tx.set(ref, { breaks: { [day]: used + 1 } }, { merge: true });
    return used + 1;
  });

  const giveBack = () =>
    ref.set({ breaks: { [day]: FieldValue.increment(-1) } }, { merge: true }).catch(() => {});

  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe().paymentIntents.create(
      {
        amount: BREAK_AMOUNT_CENTS,
        currency: CURRENCY,
        customer: user.stripeCustomerId,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        description: "Pledge: 5-minute break",
        metadata: { firebaseUid: user.uid, pledgeId, outcome: "break", day, slot: String(slot) },
      },
      { idempotencyKey: `break-${user.uid}-${pledgeId}-${day}-${slot}` }
    );
  } catch (err) {
    if (err instanceof Stripe.errors.StripeCardError && err.payment_intent) {
      intent = err.payment_intent as Stripe.PaymentIntent;
    } else {
      await giveBack();
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
      amount: BREAK_AMOUNT_CENTS,
      currency: CURRENCY,
      pledgeId,
      kind: "break",
      day,
      createdAt: new Date().toISOString(),
    });

  const paid = intent.status === "succeeded" || intent.status === "processing";
  if (!paid) await giveBack();
  return {
    status: intent.status,
    paymentIntentId: intent.id,
    amount: BREAK_AMOUNT_CENTS,
    currency: CURRENCY,
    breaksToday: paid ? slot : slot - 1,
  };
}

/** Brand and last four digits of the saved card, for Account ("Visa 4242"). */
export async function cardSummary(user?: UserRecord): Promise<{ brand: string; last4: string } | null> {
  if (!user?.stripeCustomerId) return null;
  const id = await latestPaymentMethod(user.stripeCustomerId);
  if (!id) return null;
  const method = await stripe().paymentMethods.retrieve(id);
  return method.card ? { brand: method.card.brand, last4: method.card.last4 } : null;
}

/** Whether the customer has any saved card. */
export async function hasPaymentMethod(user?: UserRecord): Promise<boolean> {
  if (!user?.stripeCustomerId) return false;
  return !!(await latestPaymentMethod(user.stripeCustomerId));
}
