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

One screen, three states, no film (v2 "last light", owner 8 Nov 2026). The
sun sits on the horizon behind sign-in and the welcome; the deal has a low
sun.

1. **signin**: the logo lockup and "THE WORLD IS STILL HERE" on top;
   "RECLAIM YOUR LIFE." and "Put money on your screen time. Keep your word
   and it costs nothing." at the bottom; one solid ivory button, "Continue
   with Apple"; a quiet "I already have an account", which runs the same
   Apple sign-in. Sign in with Apple is the only way in: Google and email
   were dropped on 8 Nov 2026, so accounts made that way can't sign in.
2. **welcome** (first time in, when no pledge is stored on the device):
   "WELCOME TO PLEDGE." on the same sun, then "It helps you use your phone
   less." fades in after 2.5 s; at 6.5 s it darkens (700 ms) onto the deal.
3. **deal**: four beats that play on their own, 3.4 s each, one caps line
   and a small glass card of plain figures per beat (`deal-beats.tsx`):
   "Pick your apps." (Your apps); "Set a limit. Put money on it." (Daily
   limit 30 min, Your pledge $10); "Hit it, and they lock." (Locked until
   midnight); "Unlock early? You lose it." ($10 charged). Beat marks along
   the bottom. After the last beat the screen darkens (700 ms) and the first
   question comes up. A tap skips ahead; "Cancel" on the first question goes
   back, still signed in, and plays the welcome and the deal again.

Signed in with pledges → Instructions straight away (Home when the app
launches already signed in). Signed in without → the deal, then Instructions.

### Making a pledge (`src/screens/onboarding/instructions.tsx`)

One question per screen, "STEP n OF N" top right, a solid ivory
"Continue" and a quiet "Back"/"Cancel" pinned at the bottom, content
dissolving between steps (v2, owner 8 Nov 2026). Steps, in order:

| Step | Question | Control | Continue is enabled when |
| --- | --- | --- | --- |
| mirror (first pledge only, and only when the report extension is bundled) | Your last seven days. | Asks Screen Time access immediately, then the system-drawn 7-day total and top 3 apps | Screen Time access approved |
| apps | Which apps take the most from you? | "Choose apps" opens Apple's picker (never on its own, owner 31 Oct 2026); shows the chosen app icons after | at least one app, category or site chosen |
| limit | How much is enough a day? | slider 0–120 min with ticks 0/30/60/90/120, presets 30/60/90; 0 means blocked all day | always |
| duration | For how long? | 7 / 15 / 30 days | always |
| amount | What's your word worth? | slider 0–20 with ticks 0/5/10/15/20, presets 5/10/20 | amount ≥ 1 |
| review (every pledge) | Your word, in full. | Apps (counts, since Apple hides app names), Daily limit ("resets at midnight"), Length (with end date), "Your pledge $X", then "Nothing is charged now. You pay $X only if you unlock early, delete Pledge or turn off Screen Time access." The Terms and Privacy checkbox shows once per device | terms accepted (first time only) |
| card (skipped when a card is on file) | Put your card down. | Stripe PaymentSheet opens immediately; saving the card continues on its own. If it's closed or fails: "Your card wasn't saved." callout and "Add a card" | card saved |

Review's button reads "Lock it in", or "Add a card to lock it in" when no
card is on file. Locking in: backend records the
pledge (`POST /pledge`), the Screen Time schedule starts, the pledge is
saved locally, device is registered for push, success haptic, Home.

### Home (`src/screens/home/index.tsx`)

The list of pledges, several can run at once (v2, owner 8 Nov 2026). Top:
the logo lockup and an Account icon. A caps headline from the state
("NOTHING ON THE LINE YET.", "ONE PLEDGE RUNNING.", "N PLEDGES RUNNING.",
"THAT'S ENOUGH FOR TODAY.") and "$X on your word." Each card is glass:
a status in words ("On track", "Close to your limit" when 20% or 5 min is
left, "Blocked until midnight", "On a 5-minute break", "No allowance"),
days left (rounded up), "N min left today", a thin bar, "X of Y min used",
"Resets at midnight", the apps and the amount. Empty state shows the 7-day
mirror under "YOUR LAST 7 DAYS" with a low sun. When Screen Time access is
off while pledges run: "Your apps aren't being limited.", a warning, and
"Open Settings". A glass "New pledge" starts another pledge. Heartbeat to the backend on every
foreground; forfeited pledges reported back are removed.

**Time back** (under the cards, `TimeRecovered` → `targets/ReportExtension/Recovered.swift`).
Plays once: a "Before" bar and a "Now" bar (daily use of the pledged
apps), the gap turns ember and a copy lifts off, then "**11h** *back.*",
"Since Oct 30, on the apps you pledged." and a small line "All screen
time: 4h 20m → 3h 50m a day". Method (owner's picks, 31 Oct 2026):

- Apps: every running pledge's apps, categories and sites, counted once
  (a pledged category counts whole). Total = everything on the phone,
  shown so time that moved to other apps is visible.
- Device: this iPhone only; blocks only apply here.
- Anchor: the start of the first running pledge. Pledges started later
  are counted from that same anchor (simplification).
- Before: average daily use over the 7 days before the anchor's day,
  counting only days with any recorded use. Under 3 such days: "Not
  enough Screen Time from before your pledge to compare yet."
- Now: average over full days after the start day, up to yesterday. The
  start day mixes before and after; today is not over.
- Back = (before − now) × full days, never below zero ("Not less than
  before yet." when it is).
- Day one (no full day yet): only "Before Pledge: Xh Ym a day on these
  apps. Your first full day counts from tomorrow."
- The numbers never reach JS (Apple's sandbox); the extension computes and
  draws them. How far back iOS serves history is unverified; 7 days plus a
  30-day pledge means a window of up to ~38 days.

### Pledge detail (`src/screens/pledge-detail/index.tsx`)

Countdown ("N days left", same rounding as the card), today's usage, top
apps for this selection (when the report extension is bundled), and
"Give up" which opens the surrender modal. Surrender charges the card, stops
monitoring, removes the pledge. There is no failure screen afterwards.

While the apps are blocked, the detail screen's footer offers "5 minutes
for $1" (cream pill, no count shown; "Unlock my apps" drops to quiet text
below): a paid break. Not in the surrender modal; that stays about giving
up (owner, 31 Oct 2026). The card is charged $1 (`POST /stripe/break`), the
pledge keeps running, and the apps unlock for 5 minutes on the clock, used
or not (owner changed this from "5 minutes of use", 31 Oct 2026). Up to 3 a
day per pledge, counted on the phone's local date and enforced by the
backend. The detail screen reads "On a break. The apps lock again at
14:05." and the Home card "On a 5-minute break". A break that would end
after midnight is not re-blocked: the midnight reset unblocks anyway.

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
| Paid break | $1 for 5 min on the clock, 3 a day per pledge | `BREAK_*` in `home.constants.ts`, backend `BREAK_AMOUNT_CENTS`, `BREAKS_PER_DAY` |
| Currency | $ in the app, `usd` on the backend | `src/config.ts`, `PLEDGE_CURRENCY` |
| Test card | 4242 4242 4242 4242 (sandbox Stripe keys are live on Vercel now) | |

## Decisions taken (don't reopen)

- Opener film is the owner's own montage (`assets/video/montage.mp4`),
  stitched into a seamless loop. Not the earlier generated clip, not stock.
- The deal is told once, on plain ink after sign-in, as four beats that play
  on their own (29 Oct 2026, after testers said they did not know what they
  were signing up for; cut from six to four short lines on 30 Oct 2026; the
  film behind the beats was dropped the same day as too much noise). Before
  it, a welcome on the New York film says what Pledge is for, so the how
  has a why (owner, 31 Oct 2026; at least 8 s). Not as a step, not as a carousel to swipe. Still no
  slide-to-unlock splash, no separate payment page, no progress bar on Home, no failure screen after surrender, no hint
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
- Paid breaks (30 Oct 2026): the owner chose Stripe and the wording
  "Donate $1 for 5 minutes", then changed the label to "5 minutes for $1"
  (31 Oct 2026), after being told the risks: App Review may see
  paying for more app time as a digital purchase that needs In-App Purchase,
  calling it a donation would contradict `docs/app-review-notes.md`, and
  Apple only lets nonprofits take donations outside IAP (the label no
  longer says "donate"). Not yet in the
  terms (`backend/src/legal.ts`) or the rules step. Revisit before App Review.
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
  Fixed in `pressable-scale.tsx`. That fix then left a re-enabled
  Continue looking dim on the limit and duration steps (still tappable);
  the dim now runs through a shared value so it always updates (30 Oct 2026).
