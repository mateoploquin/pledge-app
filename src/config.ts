// Runtime configuration. Values prefixed with EXPO_PUBLIC_ are inlined by Expo at
// build time from .env / .env.local (see .env.example).

const DEFAULT_API_URL = "http://localhost:3000";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "");

// Optional. If set, the app does not need to ask the backend for it.
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const STRIPE_MERCHANT_ID = "merchant.pledge.applepay";
export const STRIPE_MERCHANT_COUNTRY = "US";
export const CURRENCY_SYMBOL = "$";

// PostHog product analytics. The project key is public by design (it can only
// send events, not read them); an env value overrides it, an empty one turns
// analytics off.
export const POSTHOG_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "phc_ztoSEzTASqxW2qrwL8aDXZmy9onPBG2YuhTL3bVjSA6R";
export const POSTHOG_HOST = "https://us.i.posthog.com";
