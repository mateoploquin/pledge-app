# Releasing Pledge

How a build gets from this repo to TestFlight and the App Store, and where
things stand. Keep this file current; it is the one place that says why a
store build differs from the dev build.

## Current status (19 November 2026)

**Build 38 (1.1.0) is being built for TestFlight** (19 November 2026). On top
of build 37, a new seal, worked out with the owner in the Seal Lab artifact:
the owner's new footage of the sun setting behind a hill (`seal-set.mp4`, its
5.4 to 13.9 s in the 4 s hold, every frame a keyframe). At rest the sun's real
light flickers in place (`seal-rest.mp4`, `scripts/make-seal-rest.py`, played
at 2.6×). While held the screen darkens with the sun, fully dark as it goes,
and the user's name writes itself on the signature line in Herr Von
Muellerhoff, one unbroken line per word (`components/ink/signature-ink.tsx`,
`utils/signature-plan.ts`, new native dependency `@shopify/react-native-skia`
1.2.3). Then the words go, the logo comes up in the middle and moves to Home's
top left, and Home follows. The footage is a third-party clip: its maker's
written approval is needed before the App Store. Check on the phone: the
writing (no lifts mid-word, nothing spotty), the loop's speed, the dark landing
with the sun, and the logo landing where Home's sits.

**Build 37 (1.1.0) is being built for TestFlight** (19 November 2026, EAS
build 93964c80, submission eb78b385). On top of build 36: time back no
longer restarts on every slider tick (the report's identity compares
sorted tokens), and the limit step fits the iPhone SE.

**Build 36 (1.1.0) went to TestFlight** (19 November 2026, EAS
build b9644eb1, submission bb06d0a4; time back drew but blinked while sliding). On top of build 35, the limit step's
time back reads all of last week and picks the chosen apps out in the
extension (filtered to the apps it never drew on phones), with a 2 s
fallback to the average day and `timeBack` logs.

**Build 35 (1.1.0) went to TestFlight** (18 November 2026, EAS build 0d859dd8, submission 9e0cf632; confirm once TestFlight shows it processed). On
top of build 34, the rest of the app joins onboarding's brand: one ground
everywhere (the empty Home's) with its low sun drifting behind the content;
pledges as glass bubbles saying one quiet sentence ("**35 min** left
today."), Apple's Liquid Glass on iOS 26 (new local module
`modules/pledge-glass`, native: needs this full build); pledge detail and
Account in onboarding's pieces (small caps labels, outlined rows, the
pledge in one sentence); bars ivory; sign-in buttons at the bottom. The
seal: the promise in plain words with a signature line, all text on the
dark sea, grain on the film; holding sinks the sun only until it touches
the horizon (new `seal-set.mp4`, 0 to 12 s), then the sun becomes the logo
and Home follows. Check on the phone: the hold and the logo ending, the
glass bubbles with a pledge running, the drifting sun.

**Build 34 (1.1.0) is being built for TestFlight** (18 November 2026, EAS build 837a0e88, submission 9234f9af; confirm once TestFlight shows it processed). On
top of build 33: "Years" in Inter like the rest of the page (Great Vibes
removed again, app and extension); the life's pull back is smooth (the
square no longer snaps to whole pixels while zooming, which made it jump
between a few sizes). Check the zoom on the phone.

**Build 33 (1.1.0) is being built for TestFlight** (18 November 2026, EAS build b3a8c401, submission 13a38951; confirm once TestFlight shows it processed). On
top of build 32: the seal as a full-bleed poster (the sunset film sets as
you hold, `seal-idle.mp4`/`seal-set.mp4` from the owner's footage; no ring,
no logo, Inter only); the mirror's life pulls back until every hour shows,
then is said slowly ("**In your life.** … That's … 13 … *Years* … on your
phone.", Great Vibes back for that one word, app and extension); Continue
waits for the story to end; several reasons on "What would you do with
that time back?"; the limit step's time back as one sentence ("You get
back **11 years** of your life."), no longer blinking; the footer no
longer jumps to the top after a keyboard elsewhere; Help opens Mail; new
titles ("Set your daily limit.", "How long will you uphold that for?").
Check on the phone: the seal's hold, the zoom and slow last beat drawn by
the extension, and Continue's timing there.

**Build 32 (1.1.0) is being built for TestFlight** (18 November 2026, EAS
build 440743d8, submission c05b2847; confirm once TestFlight shows it processed). On top of build 31: the mirror retold as
"dots, phrase, number" in Inter only ("**This week**, you spent 36 hours on
your phone." … "**In your life**, you'll spend 17 years"), ivory squares
drawn on the UI thread (no stutter, none ever cut, flush to the edges);
the onboarding titles as one story; the limit step's new `timeBack` report
(last week's time on the chosen apps as squares, the time back a day and
over a life, following the slider). Great Vibes and the extension's Noto
Serif are gone. First build with `timeBack`: check it on the phone.

**Build 31 (1.1.0) is being built for TestFlight** (18 November 2026, EAS build 498e8ce0,
submission 74c7e9ee; confirm once TestFlight shows it processed). On top of build 30: the launch sunset; the mirror told as a
story ("Let's look at your screen time.": a week in hours, a month, a year,
then "13 years OF YOUR *Life.*", zooming out, with one orange square per
hour piling up under it and fading at the end), drawn by the report
extension on a phone and by the app where it can't (average numbers);
"What would you do with that time back?" right after it, chips only; the
seal in the brand orange; one ivory main button everywhere; the type and
colour sweep (one accent, #ED602A, no light orange) and the dead screens
and components deleted. Ships `reason-presence.mp4`, a Pinterest clip that
needs its maker's written approval before the App Store.

**Build 30 (1.1.0) is on TestFlight** (17 November 2026, resubmitted with
`eas submit --id` after Apple's agreement was signed): the purpose step
("What's this time for?"), the coach removed, the backend redeployed.

**Build 29 (1.1.0) is being built for TestFlight** (10 November 2026, EAS
build 7c5cbc57, submission 6a400e56; confirm once TestFlight shows it
processed). On top of build 28: the opener with a film behind it
(`opener-dive.mp4`, a test clip whose rights aren't cleared, not for the
App Store), "The world awaits", a pulsing "Tap to start" and no buttons;
sign-in moved to a step after Review, only when nobody is signed in.

**Build 28 (1.1.0) is being built for TestFlight** (10 November 2026, EAS
build 948590f5, submission 207c2556; confirm once TestFlight shows it
processed). On top of build 27: no welcome and no deal, sign-in goes
straight to the first pledge step. It was built from a working tree that
also held uncommitted work: apps as icons on the pledge card and pledge
detail (`ActivityIcons`, Swift change in `modules/pledge-activity-labels`).

**Build 26 is confirmed on the owner's phone (7 November 2026): apps lock at
the limit.** It's the baseline for the brand rebuild. Commits after it (test
overrides removed, new brand foundations, logic moved into hooks) aren't in
any build yet.

**Build 26 (1.1.0) is being built for TestFlight** (5 November 2026, EAS build 8903867b, submission ce1113d9; confirm once TestFlight shows it processed). Fixes
build 25's limit never blocking: iOS delivers threshold events in bunches
(the owner's phone showed tick5, tick10 and tick15 at the same second), so
the 60 s guard skipped real limits. The block actions are unconditional
again; the ticks past the limit still block as a backup.

**Build 25 (1.1.0) is built and auto-submitted to TestFlight** (3 November
2026, EAS build 648040b6, submission 744a02b1; confirm here once TestFlight
shows it processed). On top of build 24: the guarded daily limit (a block
only counts when the 5-minute ticks agree, six backup ticks past the limit,
long-press "Today" for the event log; see `docs/architecture.md`) and
PostHog analytics. The first attempt (EAS build 11b881e5) failed on
`expo-device` reading `TARGET_OS_SIMULATOR` under the iOS 26 SDK;
`patches/expo-device+6.0.2.patch` fixes it. Before the App Store, the App
Privacy answers must add Product Interaction and User ID (Analytics, linked,
not tracking).

**Build 24 (1.1.0) is submitted to TestFlight** (uploaded 31 October 2026,
EAS build 5c2115bf). Same app as build 23, but the first store build that
carries the local Swift modules (`.easignore` fix): app icons on cards and
the pledge page, the Screen Time panels and time back. Checked in the .ipa.

**Build 23 (1.1.0) is submitted to TestFlight** (uploaded 31 October 2026,
EAS build 7ac75b8c, processing by Apple pending). On top of build 22: the
welcome on the New York film before the deal, deal beats centred, the
app picker only on tap, paid 5-minute breaks ("5 minutes for $1", Stripe,
backend deployed 31 Oct), time back on Home (`recovered` report), the
golden-hour palette, an empty-week line in the mirror's SocialCut, and
caught async errors on Home. Still ships the `TEMP-TEST` overrides (deal
and mirror on every sign-in, Home's "New pledge" walks through sign-in).

**Build 22 (1.1.0) is submitted to TestFlight** (uploaded 30 October 2026,
EAS build e7d7f85d, processing by Apple pending). It carries: the deal cut
to a welcome plus four short beats on plain ink (no deal film), darkening
at the end, Cancel on the first step replaying the deal while signed in,
the re-enabled Continue no longer looking dim, and `reassertBlocks` so
ending one pledge no longer unblocks another's shared apps. Still ships the
`TEMP-TEST` overrides (deal and mirror on every sign-in). Confirm here once
TestFlight shows it processed.

**Build 21 (1.1.0) is submitted to TestFlight** (uploaded 29 October 2026
at 16:50, EAS build 1fca3bb1, processing by Apple pending). It carries: the blank first pledge step fix, currency sign and units on the
number's baseline, US dollars and US merchant country, and the deal told
on the film after sign-in in six beats. Confirm here once TestFlight shows
it processed. **Build 20 (1.1.0) is on TestFlight**, processed by Apple on
29 October 2026 with all five targets, Screen Time panels included. Build 19 was
rejected at processing (ITMS-91179, see the ExtensionKit section). Build 18
is the same app without the report extension. Builds appear under
https://appstoreconnect.apple.com/apps/6738790677/testflight/ios. Add
testers there (Internal Testing for the team, External Testing with a
public link for others; external needs a short Beta App Review on the
first build).

**Report extension approved.** Apple granted Family Controls
(Distribution) for `com.pledgecompany.pledge.ReportExtension` on
29 October 2026 (request 3D9M9QX3QF). The temporary exclusion is removed:
`.easignore` no longer lists `targets/ReportExtension/` and `eas.json` no
longer sets `PLEDGE_WITHOUT_REPORT`. Store builds from build 19 on include
the Screen Time panels.

The app still checks at launch whether `ReportExtension.appex` is bundled
(`isActivityReportAvailable()` in `modules/pledge-activity-report`) and
hides every Screen Time panel when it is not. Keep that: it makes a build
without the extension degrade cleanly instead of drawing blanks. To ship
without the extension again, re-add the `.easignore` line and set
`PLEDGE_WITHOUT_REPORT=1` in the build profile's `env`; `app.config.js`
reads that flag to drop the target from the list EAS expects credentials
for.

## The report extension is an ExtensionKit extension

Apple's DeviceActivityReport extension point is ExtensionKit-based: the
bundle must sit in `Pledge.app/Extensions/` with an
`EXAppExtensionAttributes` Info.plist key, not in `PlugIns/` with
`NSExtension`. App Store Connect rejects the other form at upload with
ITMS-91179 (build 19 hit this), while dev builds happen to run it either
way. `patches/@kingstinct+expo-apple-targets+0.1.19.patch` teaches the
target generator the `device-activity-report` type: ExtensionKit product
type, `EXAppExtensionAttributes` plist, "Embed ExtensionKit Extensions"
phase, and `targets/ReportExtension/Info.plist` uses the EX key. If the
generator package is ever upgraded, re-check that the patch still applies
and that the built app has `Extensions/ReportExtension.appex`.

## Build and submit

- Credentials live on EAS (distribution certificate and one provisioning
  profile per target). `eas login` on the machine first.
- Production build: `npx eas build --platform ios --profile production`.
  Add `--non-interactive` once credentials are valid. The build number
  auto-increments in `app.json`; commit that change.
- Submit to TestFlight: `npx eas submit --platform ios --latest`. The App
  Store Connect app id (6738790677) is in `eas.json`.
- `plugins/with-pods-deployment-target.js` lifts every CocoaPods target to
  iOS 15.1 at `pod install`. Xcode 27 turns a deployment target below 15.0
  into a hard error, and third-party pods declare anything from 9.0 up;
  without the hook the archive fails with hundreds of "deployment target is
  set to 13.4" errors.
- The build image is still pinned in `eas.json` to Xcode 26.6, the same as
  the Macs we build on. Apps built with Xcode 27 only launch on iOS 27 when
  they use the UIKit scene life cycle, which Expo SDK 51 cannot turn on.
  Moving to the `latest` image therefore waits for the Expo SDK upgrade;
  the deployment-target hook is already in place for it.
- `.easignore` governs what is uploaded. EAS does not use `.gitignore`.
  Never add secrets to the upload; `backend/` and every `.env*` are excluded.
  Anchor folder rules to the root (`/ios/`, not `ios/`): an unanchored
  `ios/` also strips `modules/*/ios`, and the build then ships without the
  local Swift modules (app icons, Screen Time panels, time back). Builds
  20 to 23 shipped like that; fixed 31 Oct 2026. Check with
  `npx eas build:inspect --stage archive --profile production --platform ios --output <dir>`
  that `modules/*/ios` has its `.swift` files.

## Before the App Store (not needed for TestFlight)

- [x] Live Stripe keys on Vercel production (19 Nov 2026, new Stripe
      account; Apple Pay certificate for `merchant.pledge.applepay` uploaded
      to it). Test cards no longer work against this backend.
- [x] Currency: US dollars (decided 29 Oct 2026). `CURRENCY_SYMBOL` in
      `src/config.ts`, `PLEDGE_CURRENCY` defaults to `usd` on the backend,
      the terms say "US dollars". Needs a backend deploy and a new build.
- [x] Charity removed everywhere (19 Nov 2026): no charity line in the
      terms or the app. Needs a backend deploy.
- [x] Paid breaks stay on Stripe (19 Nov 2026); in the terms and the App
      Review notes. Needs a backend deploy.
- [ ] App Privacy questionnaire in App Store Connect. Include the purpose
      text (user content, linked to the user, not used for tracking).
- [ ] Screenshots from a real device.
- [ ] App Review notes pasted from `docs/app-review-notes.md`, with a demo
      account filled in.

## Targets and their Apple approvals

| Target | Bundle id suffix | Family Controls (Distribution) |
| --- | --- | --- |
| Pledge (main app) | (none) | approved |
| ActivityMonitorExtension | .ActivityMonitorExtension | approved |
| ShieldAction | .ShieldAction | approved |
| ShieldConfiguration | .ShieldConfiguration | approved |
| ReportExtension | .ReportExtension | approved 29 Oct 2026 |
