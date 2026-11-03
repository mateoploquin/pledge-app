# Pledge backend

Small Hono API the Pledge iOS app talks to. Verifies Firebase ID tokens, saves a
card with Stripe (SetupIntent + PaymentSheet), records the pledge, and charges
the saved card off-session when the user surrenders.

## Endpoints

All routes except the first two require `Authorization: Bearer <Firebase ID token>`.

| Method | Path                       | Purpose                                                   |
| ------ | -------------------------- | --------------------------------------------------------- |
| GET    | `/health`                  | Liveness                                                  |
| GET    | `/stripe/publishable-key`  | Publishable key for the Stripe SDK                        |
| POST   | `/auth/firebase/signup`    | Upsert the user record (`{ displayName? }`)               |
| POST   | `/stripe/payment-sheet`    | Customer + ephemeral key + SetupIntent for PaymentSheet   |
| POST   | `/pledge`                  | Save `{ pledgeValue, timeValue }` for the current challenge |
| GET    | `/pledge`                  | Read the saved pledge                                     |
| POST   | `/stripe/charge`           | Charge the pledge to the saved card (idempotent per pledge) |

Data lives in Firestore: `users/{uid}` with a `charges` subcollection.

## Setup

1. Firebase console (project `pledgetrial`): enable **Firestore** (production mode is
   fine, the server uses admin credentials), then Project settings > Service accounts >
   *Generate new private key*.
2. Stripe dashboard: copy the test secret and publishable keys. Apple Pay needs the
   merchant id `merchant.pledge.applepay` registered under Settings > Payment methods >
   Apple Pay with the iOS app's certificate.
3. `cp .env.example .env` and fill it in.

## Run locally

```bash
cd backend
npm install
npm run dev          # http://localhost:3000
```

Point the app at it with `EXPO_PUBLIC_API_URL=http://<your-mac-ip>:3000` in the app's
`.env.local` (a physical iPhone cannot reach `localhost`).

## Deploy to Vercel

```bash
cd backend
vercel link           # create / pick the project
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add FIREBASE_SERVICE_ACCOUNT
vercel --prod
```

Hono is detected automatically; `src/index.ts` exporting the app is the function
entrypoint. Set `EXPO_PUBLIC_API_URL` in the app to the production URL.
