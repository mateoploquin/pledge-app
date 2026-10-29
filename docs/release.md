# Releasing Pledge

How a build gets from this repo to TestFlight and the App Store, and where
things stand. Keep this file current; it is the one place that says why a
store build differs from the dev build.

## Current status (29 October 2026)

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

## Before the App Store (not needed for TestFlight)

- [ ] Live Stripe keys on Vercel production (sandbox keys are there now so
      testers can use card 4242 4242 4242 4242).
- [x] Currency: US dollars (decided 29 Oct 2026). `CURRENCY_SYMBOL` in
      `src/config.ts`, `PLEDGE_CURRENCY` defaults to `usd` on the backend,
      the terms say "US dollars". Needs a backend deploy and a new build.
- [ ] Charity wording in the rules step and in `backend/src/legal.ts`.
      Current text names Make-A-Wish; reword to "Pledge donates its net
      proceeds from forfeited pledges to charity" unless an agreement exists.
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
