# App Review notes for Pledge

Paste the "What to tell App Review" section into App Store Connect under
App Review Information → Notes. Fill in the demo account first.

## What to tell App Review

Pledge is a commitment app for screen time. The user picks apps, sets a
daily limit, chooses a duration (7, 15 or 30 days) and puts an amount on
it. The apps are blocked by Screen Time once the daily limit is hit. If the
user chooses to unlock the apps before the pledge ends, the amount is
charged to the card they saved. If they keep their word, nothing is ever
charged.

Why the app uses Family Controls / Screen Time:

- FamilyControls authorization: to let the user pick the apps they want to
  limit, with Apple's own picker. The app never learns which apps were
  chosen; it only holds opaque tokens.
- DeviceActivityMonitor extension: to count usage of the chosen apps
  against the daily limit and apply the shield when it is reached.
- ShieldConfiguration and ShieldAction extensions: to draw the block
  screen and offer "Keep my word" or "Unlock", which opens the app.
- DeviceActivityReport extension: to show the user their own last 7 days
  of screen time on the first run. This runs in Apple's sandbox; no usage
  data leaves the device.

Payments: the saved card is handled by Stripe. The charge is a penalty the
user agreed to when starting the pledge, not a purchase of digital content
or a donation, so it is processed outside In-App Purchase. Pledge donates
its net proceeds from forfeited pledges to charity at its own discretion.

Sign in: Sign in with Apple, Google, or email and password.

Demo account:
- Email: [create a test account and put it here]
- Password: [here]
- Test card in the sandbox build: 4242 4242 4242 4242, any future expiry,
  any CVC. (Production builds use live Stripe keys; reviewers can still
  complete the flow with a real card because nothing is charged unless they
  unlock.)

How to test in under two minutes:
1. Sign in, allow Screen Time access, see the 7-day summary, Continue.
2. Pick one or two apps in the picker, set a limit of 0 minutes (full
   block), 7 days, €5, accept the rules, add the card.
3. Open one of the chosen apps: the Pledge shield appears.
4. Tap "Unlock for €5" on the shield, then confirm in Pledge: the pledge
   ends and the card is charged. Or tap "Keep my word" and the app stays
   blocked.

## Before submitting

- [ ] Live Stripe keys on Vercel production (currently sandbox).
- [ ] Charity wording confirmed in the rules step and the terms page.
- [ ] Currency decided (eur or usd) in src/config.ts and backend PLEDGE_CURRENCY.
- [ ] App Privacy questionnaire: collects email, name, payment info via
      Stripe, device token for push. No tracking.
- [ ] Screenshots from the real device: opener, mirror step, apps step,
      amount step, Home with a running pledge, pledge detail, shield.
- [ ] Google OAuth consent screen verified so the sign-in shows "Pledge".
