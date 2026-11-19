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
or a donation, so it is processed outside In-App Purchase. The same holds
for breaks: while their own chosen apps are blocked, the user can pay $1 to
break their word for 5 minutes (up to 3 a day). It is a smaller penalty on
the same commitment, not a purchase: it unlocks no content or feature in
Pledge, only lifts the block the user put on other apps, and it is in the
terms.

Sign in: Sign in with Apple only (email dropped 8 Nov, Google dropped 9 Nov 2026).
The reviewer can use their own Apple ID; check whether a demo account is still
needed.

Demo account:
- Email: [create a test account and put it here]
- Password: [here]
- Card: production uses live Stripe keys, so test cards are declined. The
  reviewer can add a real card: nothing is charged unless they unlock or
  take a break.

How to test in under two minutes:
1. Sign in, allow Screen Time access, see the 7-day summary, Continue.
2. Pick one or two apps in the picker, set a limit of 0 minutes (full
   block), 7 days, $5, accept the rules, add the card.
3. Open one of the chosen apps: the Pledge shield appears.
4. Tap "Unlock for $5" on the shield, then confirm in Pledge: the pledge
   ends and the card is charged. Or tap "Keep my word" and the app stays
   blocked.

## Before submitting

- [x] Live Stripe keys on Vercel production (19 Nov 2026).
- [ ] App Privacy questionnaire: collects email, name, payment info via
      Stripe, device token for push. No tracking.
- [ ] Screenshots from the real device: opener, mirror step, apps step,
      amount step, Home with a running pledge, pledge detail, shield.
