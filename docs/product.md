# Pledge — product

What the app does, screen by screen, and the decisions behind it. If a
behaviour here and the code disagree, the code is probably newer: fix the
doc.

## The idea

You pick the apps that take the most from you, set how much of them is
enough per day, choose for how long (7, 15 or 30 days), and put money on it.
Nothing is charged up front. The apps are blocked by iOS Screen Time the
moment the daily limit is hit, until midnight. If you unlock them before the
pledge ends, you pay the pledge. If you delete Pledge or revoke its Screen
Time access while a pledge runs, you pay the pledge. If you keep your word,
you pay nothing.

The word is "pledge", never "challenge". A forfeited pledge goes to charity
minus a small fee (wording still open, see decisions).

## Flow

### Opener (`src/screens/onboarding/onboarding.tsx`)

One screen, three states on the same looping film:

1. **film**: the montage loops full-bleed under a dark shade. Serif lines
   dissolve one at a time. One cream pill: "I'm new here"; a quiet link:
   "I already have an account".
2. **signup / login**: Sign in with Apple, Google, or email, on the film.
   Switching between the two is a dissolve, never a layout jump.
3. **email**: name (signup only), email, password.

Signed in with pledges → Home. Signed in without → Instructions.

### Making a pledge (`src/screens/onboarding/instructions.tsx`)

One question per screen, dots on top, "Continue" and "Back"/"Cancel"
pinned at the bottom, content dissolving between steps. Steps, in order:

| Step | Question | Control | Continue is enabled when |
| --- | --- | --- | --- |
| mirror (first pledge only, and only when the report extension is bundled) | Your last *seven* days. | Asks Screen Time access immediately, then the system-drawn 7-day total and top 3 apps | Screen Time access approved |
| apps | Which apps take the *most* from you? | Opens Apple's app picker right away; shows the chosen app icons after | at least one app, category or site chosen |
| limit | How much is *enough* a day? | slider 0–120 min with ticks 0/30/60/90/120, presets 30/60/90; 0 means blocked all day | always |
| duration | For how *long?* | 7 / 15 / 30 days | always |
| amount | What's your word *worth?* | slider 0–20 with ticks 0/5/10/15/20, presets 5/10/20 | amount ≥ 1 |
| terms (once per device) | The *rules.* | four rules, Terms and Privacy open in an in-app sheet, one checkbox | accepted |
| card (skipped when a card is on file) | Put your card *down.* | Stripe PaymentSheet opens immediately; saving the card continues on its own | card saved |

Last step's button reads "Lock it in". Locking in: backend records the
pledge (`POST /pledge`), the Screen Time schedule starts, the pledge is
saved locally, device is registered for push, success haptic, Home.

### Home (`src/screens/home/index.tsx`)

The list of pledges, several can run at once. Each card: apps, today's use
against the limit, days left (rounded up). Empty state shows the 7-day
mirror. A "+" starts another pledge. Heartbeat to the backend on every
foreground; forfeited pledges reported back are removed.

### Pledge detail (`src/screens/pledge-detail/index.tsx`)

Countdown ("N days left", same rounding as the card), today's usage, top
apps for this selection (when the report extension is bundled), and
"Give up" which opens the surrender modal. Surrender charges the card, stops
monitoring, removes the pledge. There is no failure screen afterwards.

### Shield (drawn by iOS from `shieldPayload` in `home.controller.ts`)

Title "That's enough for today." Subtitle names the pledge amount. Primary
"Keep my word" closes the shield. Secondary "Unlock for $N" posts a
time-sensitive local notification; tapping it opens Pledge on the surrender
modal for that pledge. (Shield extensions cannot open apps directly.)

### Completion

When a pledge's end time passes while the app is open or on next launch,
it is completed on the backend (`POST /pledge/:id/complete`), monitoring
stops, and the completion screen shows.

## Rules shown to the user (terms step)

1. Nothing is charged now.
2. Unlocking costs the pledge. Apps stay blocked until midnight.
3. Deleting the app, or turning off Screen Time access, forfeits it.
4. The pledge does good (charity, minus a small fee).

Legal pages are served by the backend at `/terms` and `/privacy`
(`backend/src/legal.ts`).

## Numbers

| | value | where |
| --- | --- | --- |
| Pledge amount | 0–20 on the slider, min 1 to continue; backend accepts 1–100 | `set-pledge.tsx`, backend `PLEDGE_MIN/MAX` |
| Daily limit | 0–120 min, 0 = full block | `set-time-limit.tsx` |
| Duration | 7 / 15 / 30 days, default 30 | `set-duration.tsx`, `CHALLENGE_DURATION` |
| Day boundary | midnight, device local time | Screen Time schedule |
| Pledge end | start + N × 24 h exactly (DST-safe) | `pledgeEndsAt` |
| Usage tick | every 5 min | `TICK_MINUTES` |
| Currency | $ in the app, `usd` on the backend | `src/config.ts`, `PLEDGE_CURRENCY` |
| Test card | 4242 4242 4242 4242 (sandbox Stripe keys are live on Vercel now) | |

## Decisions taken (don't reopen)

- Opener film is the owner's own montage (`assets/video/montage.mp4`),
  stitched into a seamless loop. Not the earlier generated clip, not stock.
- No explainer carousel, no slide-to-unlock splash, no separate payment
  page, no progress bar on Home, no failure screen after surrender, no hint
  texts under controls.
- The whole app is in the ink/cream/serif style (see `docs/design.md`).
- Amount slider ticks are 0, 5, 10, 15, 20, evenly spaced; presets 5/10/20.
- Time presets 30/60/90 only; slider can reach 0 (full block).
- Days left is rounded up everywhere.
- The 7-day mirror is the first step of the first pledge, number at 44 pt.
- The mirror and top-apps panels are display-only (Apple sandbox); the
  numbers never reach JS or the backend, and this cannot be worked around.
- The report extension ships in store builds (Apple approved it).
- Currency is US dollars everywhere: `$` in the app, `usd` on the backend,
  "US dollars" in the terms (29 Oct 2026).

## Open decisions (ask the owner, don't guess)

- Charity wording: "Make-A-Wish" is a placeholder; no agreement exists.
- Shield look: an animation is impossible; options offered were solid ink
  with a cream "p" icon, ember accent, or a still from the montage. No pick.
- Voice coach: planned (LiveKit full-duplex talker + Claude as the thinker,
  per-user folder, triggered from the shield and a daily check-in, free,
  English only). Design artifact: https://claude.ai/artifact/5ZYnYWAo4MGoUB1Y7tgEC2. Not started.
- Dynamic limits from a coach/agent: the phone enforces, so an agent can
  only push a new schedule to the app (push or live session); app choice
  always needs the user's thumb in Apple's picker. Hours can be set
  without the user.

## Known issues (29 Oct 2026)

- A TestFlight tester (build 20) saw the first pledge step blank: dots and
  buttons drawn, question and content invisible. Not reproduced yet; a
  local Release build is on the owner's phone to check. Suspects: the
  fade-through wrapper's entering animation, or a device setting (Reduce
  Motion). See `docs/architecture.md` → Known issues.
- Disabled buttons looked enabled (press animation overrode the dim).
  Fixed in `pressable-scale.tsx`, uncommitted at time of writing.
