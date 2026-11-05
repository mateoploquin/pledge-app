# Releasing Pledge

How a build gets from this repo to TestFlight and the App Store, and where
things stand. Keep this file current; it is the one place that says why a
store build differs from the dev build.

## Current status (5 November 2026)

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

- [ ] Live Stripe keys on Vercel production (sandbox keys are there now so
      testers can use card 4242 4242 4242 4242).
- [x] Currency: US dollars (decided 29 Oct 2026). `CURRENCY_SYMBOL` in
      `src/config.ts`, `PLEDGE_CURRENCY` defaults to `usd` on the backend,
      the terms say "US dollars". Needs a backend deploy and a new build.
- [ ] Charity wording in the rules step and in `backend/src/legal.ts`.
      Current text names Make-A-Wish; reword to "Pledge donates its net
      proceeds from forfeited pledges to charity" unless an agreement exists.
- [ ] Paid breaks: decide IAP vs Stripe for "5 minutes for $1" (see
      `docs/product.md`, open decisions), add breaks to the terms and the
      rules step, and update `docs/app-review-notes.md`.
- [ ] App Privacy questionnaire in App Store Connect.
- [ ] Screenshots from a real device.
- [ ] Google OAuth consent screen verified.
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
