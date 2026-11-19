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

The word is "pledge", never "challenge". A forfeited pledge is kept by
Pledge; there is no charity (dropped 19 Nov 2026, don't bring it back
without a real agreement).

## Flow

### Opener (`src/screens/onboarding/onboarding.tsx`)

One screen (owner, 10 Nov 2026): a film loops behind it, muted, under the
shade, vignette and grain (`assets/video/opener-dive.mp4`, a test clip;
`OPENER_FILM` in the file switches back to the still sun). The logo lockup
and "THE WORLD AWAITS" on top, "RECLAIM YOUR LIFE." at the bottom, and "TAP TO
START" centred at the bottom, apart from it, in spaced caps, fading slowly in and out (still with
Reduce Motion); a tap anywhere on the screen starts. No button, no sign-in buttons and no "I already have an account":
the pledge steps ask for an account just before the card, and that step
signs returning users in. "Cancel" on the first step comes back here. The
welcome and the four-beat deal that used to follow sign-in were removed.

### Making a pledge (`src/screens/onboarding/instructions.tsx`)

One question per screen, "STEP n OF N" top right, a solid ivory
"Continue" and a quiet "Back"/"Cancel" pinned at the bottom, content
dissolving between steps (v2, owner 8 Nov 2026). The first pledge reads as a
story (owner, 17 Nov 2026): what your screen time adds up to in a life, what you'd do with it back,
which apps take it, then the terms and the seal. Steps, in order:

| Step | Question | Control | Continue is enabled when |
| --- | --- | --- | --- |
| mirror (first pledge only, and only when the report extension is bundled) | Let's look at your screen time. | Asks Screen Time access immediately, then tells last week's Screen Time (all apps, all devices) as a story in four beats, each in the same order (owner, 18 Nov 2026: "dots, phrase, number"; readers are distracted and have no attention to spare): the last words fade, the squares grow (one ivory square per hour on the phone, a pile filled in rows like a calendar, the view pulling back to fit it), then the phrase, then the number. One shape for every beat, Inter only, told to the user straight (owner, 18 Nov 2026: "look at the user dead straight and show him his problem"; direct words, "this week", "this month"): a sentence that opens on its time frame in bold, the number with its unit big, "on your phone.": "**This week**, you spent **36 hours** on your phone." → "**This month**, you'll spend **7 days**" → "**This year**, you'll spend **79 days**" → then the life said slowly, with pauses (owner, 18 Nov 2026: "In your life. Pause. Give a person time to understand what that means. That's 13. Pause. Years on your phone."): "**In your life.**" alone for 2.2 s, then "That's", the number (0.6 s later), then "**Years**", Inter SemiBold 64 with a capital Y (1.8 s later, fading in over 1.1 s), then "on your phone." (STORY.life) (24-hour days, an 80-year life; month, year and life are last week's pace carried forward, as iOS keeps only a few weeks). The week's squares appear one by one at a steady beat; the others grow in log steps. The life keeps the year's square size and floods down past the box in rows exactly as wide as the content, fading before the bottom, with a running count ("109,500 HOURS · ONE SQUARE, ONE HOUR"); then the view pulls back over 2.4 s until every hour of the life is on screen, still separate squares (whole pixels, never under 1 pt; the life is laid out on that final grid from the start, so nothing moves), owner 18 Nov 2026: "zoom out and see the magnitude of the dots"; a 1.2 s pause; then they fade away and the last words take their place and stay. A report can't be tapped, so it plays on its own (about 25 s; Continue works throughout). Reduce Motion shows the last words only. Never an empty page: with no Screen Time data the same story is told about most people (the same four sentences with the average: 26 hours, 5 days, 57 days, 13 years; 3h 45m a day, DataReportal 2024; `averageDayHours`/`lifeYears` in SocialCut.swift, `AVERAGE_DAY_HOURS`/`LIFE_YEARS` in screen-time-mirror.tsx). Where iOS can't draw the report at all (no extension, the simulator) the app tells the same average story (Paper B1b). A report iOS silently fails to draw can't be detected. | Screen Time access approved, and the story told to its last number (owner, 18 Nov 2026). The report can't tell the app when it ends, so on a phone Continue opens after the story's length (about 34 s, from STORY) plus a second for iOS to start the extension; the app's own story signals its end; with Reduce Motion, at once |
| purpose (every pledge, owner 11 Nov 2026; picks 16 Nov 2026; straight after the mirror, 17 Nov 2026) | What would you do with that time back? ("What's this time for?" on a pledge without the mirror) | Four picks styled like the length step: Sleep, Focus, People, Presence; any number can be picked, each tap picks or drops one (owner, 18 Nov 2026). No text box (owner, 17 Nov 2026: the keyboard covered the picks). The last pick crossfades its film in behind (dropping it goes back to the one before) (`reason-sleep/focus/people.mp4`, Presence `reason-presence.mp4`, a couple watching the sun set over the sea; Pinterest, maker's approval still to get). The button reads "Skip for now" until a pick. Saved with the pledge in the order picked, as "Sleep, People"; analytics gets only the picks and how many | always |
| apps | Which apps take it from you? | "Choose apps" opens Apple's picker (never on its own, owner 31 Oct 2026); after, the chosen apps, "N apps chosen" and an underlined "Change apps" | at least one app, category or site chosen |
| limit | Set your daily limit. | the choice first (owner, 18 Nov 2026: make it obvious what to do): the slider 0–120 min with ticks 0/30/60/90/120 and presets 30/60/90, 0 meaning blocked all day; under it, what the limit gives back, personal (owner, 18 Nov 2026: "based on the numbers we saw on the first screen ... how many years of my life I'm getting back"): one sentence, nothing else (owner, 18 Nov 2026: "It has to be OBVIOUS what it means. Anything else is noise."): "You get back / **9 years** / of your life." (the number large; last week's daily time on the chosen apps less the limit, over an 80-year life, drawn by the report extension's `timeBack` view); "You already stay under this." when the limit is above their use. The report reads all of last week and picks the chosen apps out itself (asked for only those apps, it never drew on phones, 19 Nov 2026); if the data hasn't come in 2 s it draws from the average day. The limit reaches the extension through the App Group (`pledgeReport.limitMinutes`) and the view checks it ten times a second and redraws on a change, so the picture follows the slider without restarting the report. Without data for those apps, or where iOS can't draw the report (the simulator), the average day (3 h 45 min) in the app's own copy (`TimeBackFallback`) | always |
| duration | How long will you uphold that for? | 7 / 15 / 30 days | always |
| amount | What's your word worth? | slider 0–20 with ticks 0/5/10/15/20, presets 5/10/20 | amount ≥ 1 |
| signin (only when nobody is signed in) | Put your name to it. | "Continue with Apple" and "Continue with Google" at the bottom, above a quiet "Back" (owner, 18 Nov 2026: "move this down", where the thumb is). Signing in moves on by itself: to the card step, or to the seal when that account already has a card | signed in |
| card (skipped when a card is on file) | Put your card down. | Stripe PaymentSheet opens immediately; saving the card moves on to the seal. If it's closed or fails: "Your card wasn't saved." callout, with "Add a card" and "Back" in the footer | card saved |
| seal (every pledge, always last; owner 16 Nov 2026) | (none; the promise is the screen) | A poster: the sunset fills the screen (the owner's footage of the sun sinking into the sea, maker's approval to keep in writing), raised so the horizon sits at about 56% of the height and every word sits on the dark sea below it (owner, 18 Nov 2026: "all the text needs to be in the dark part"), with film grain over it. The promise in plain words, one face in two sizes, ivory: "**30 min a day. 30 days.**" and "or I pay $10." ("Apps blocked all day." at 0), then the user's name on a signature line with "SIGNED 18 NOV 2026" under it (owner, 18 Nov 2026: the signature and the simple wording; "I, Mateo, pledge" looked weird). Tap the name to change it. At rest the sun shimmers (`seal-idle.mp4`, its first 4 s forward and back, looping). The whole screen is held, "Press and hold to seal": for one breath (4 s) the sun sinks until its bottom edge touches the horizon and stops there (`seal-set.mp4`, the footage's first 12 s in 4 s) while haptics build; letting go runs it back. Then (owner, 18 Nov 2026: "turns into the logo and then the main menu appears") the sky fades to the ground while the sun, cut out as a disc from the clip's last frame (`seal-sun.jpg`), shrinks and glides to the centre, turns ivory on a thin line (the Pledge mark), "PLEDGE" fades in beside it, a beat, then Home. The pledge starts on the server while this plays; Home waits for both. If it fails, the sunset comes back with the reason. Both clips come from `scripts/make-seal-clips.swift`. Under the words, small: "Nothing is charged now. Sealing means you agree to the Terms and Privacy Policy." Replaces Review and the terms checkbox (`setup/seal.tsx`) | held through |

Sealing: backend records the
pledge (`POST /pledge`), the Screen Time schedule starts, the pledge is
saved locally, device is registered for push, success haptic, Home.

### Home (`src/screens/home/index.tsx`)

The list of pledges, several can run at once (v2, owner 8 Nov 2026). Top:
the logo lockup and an Account icon. A caps headline from the state
("NOTHING ON THE LINE YET.", "ONE PLEDGE RUNNING.", "N PLEDGES RUNNING.",
"THAT'S ENOUGH FOR TODAY.") and "$X on your word." Each pledge is a glass
bubble (Apple's Liquid Glass on iOS 26) with little in it (owner, 18 Nov
2026: "simpler and smaller with less text"): the apps and the amount on one
small line, then one quiet sentence with the number in bold, "**35 min**
left today.", "**4 min** left on your break.", "**Blocked** until
midnight.", "**Blocked** all day.", and an ivory bar while minutes are being
counted. Days left and the small print are on the pledge's page. Empty state shows the 7-day
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

Said the way onboarding says things (owner, 18 Nov 2026): the time left as
the title ("24 days left."), the pledge's glass bubble as on Home (long
press opens the hidden event log), "TODAY ON THESE APPS" with the top apps
for this selection and ivory bars (when the report extension is bundled),
then "THE PLEDGE" in one sentence: "60 min a day until 6 Dec, or you pay
$10." Quiet "Give up this pledge" opens the surrender
sheet: dark glass, "Wait.", a glass "No, keep going" and a red-outline
"Pay $X and unlock" (v2, owner 8 Nov 2026). Surrender charges the card, stops
monitoring, removes the pledge. There is no failure screen afterwards.

While the apps are blocked, the detail screen's footer offers "5 minutes
for $1" (ivory button, no count shown; "Unlock my apps" drops to quiet text
below): a paid break. Not in the surrender modal; that stays about giving
up (owner, 31 Oct 2026). The card is charged $1 (`POST /stripe/break`), the
pledge keeps running, and the apps unlock for 5 minutes on the clock, used
or not (owner changed this from "5 minutes of use", 31 Oct 2026). Up to 3 a
day per pledge, counted on the phone's local date and enforced by the
backend. The bubble reads "**4 min** left on your break.", on Home and on the pledge's page. A break that would end
after midnight is not re-blocked: the midnight reset unblocks anyway.

### Account (`src/screens/account/index.tsx`)

Opened from the icon top right on Home (v2, owner 8 Nov 2026). Plain on
purpose: onboarding's outlined rows, one per item (owner, 18 Nov 2026), for
Payment method ("Visa 4242"), Charges, Past pledges, Screen Time access
(On/Off), Terms, Privacy and Help (opens Mail to the support address; without a mail app it shows the address), then a quiet
"Sign out" and a red "Delete account".

- **Charges**: each given-up or forfeited pledge and paid break, with date
  and amount. Empty: "No charges. Keeping your word costs nothing."
- **Past pledges**: length and amount, end date, and "Kept" or "Paid $X".
  No streaks, no totals.
- **Sign out** is refused while a pledge runs (working default), because
  Pledge would stop watching the apps.
- **Delete account** says it removes the account, card and history and
  can't be undone. With pledges running it warns that they are given up and
  charged first, and the button reads "Pay $X and delete". Apple requires
  deletion in the app.

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
| Stripe mode | Live keys on Vercel production since 19 Nov 2026 (new Stripe account); test cards are declined | Vercel env `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |

## Decisions taken (don't reopen)

- Paid breaks stay on Stripe, not In-App Purchase (owner, 19 Nov 2026),
  knowing App Review may call paying for app time a digital purchase.
  Label "5 minutes for $1", never "donate". In the terms (section 4) and
  argued in `docs/app-review-notes.md`. If Apple rejects over it, ask the
  owner before switching to IAP.
- Opener film is the owner's own montage (`assets/video/montage.mp4`),
  stitched into a seamless loop. Not the earlier generated clip, not stock.
- No sign-in on the first screen, no welcome and no deal before the first
  pledge step (owner,
  10 Nov 2026). It used to be told after sign-in as a welcome plus four
  beats (29 Oct 2026, after testers said they did not know what they were
  signing up for); the seal's sentence about when money moves now
  carries that. Not a carousel to swipe either. Still no
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

- Shield look: an animation is impossible; options offered were solid ink
  with a cream "p" icon, ember accent, or a still from the montage. No pick.
- Coach: removed for now (owner, 16 Nov 2026), not in the App Store
  version. Text v1 was built 11 Nov 2026 (commit `a6ea121`, restore from
  there). Voice still planned (LiveKit full-duplex talker + Claude as the thinker,
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
