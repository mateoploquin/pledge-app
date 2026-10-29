# Releasing Pledge

How a build gets from this repo to TestFlight and the App Store, and where
things stand. Keep this file current; it is the one place that says why a
store build differs from the dev build.

## Current status (29 October 2026)

**Store builds ship without the report extension for now.**

- The `ReportExtension` target draws the user's own Screen Time: the
  "Your last seven days" step of the pledge flow, the seven-day panel on
  Home, and the "Today" top apps on the pledge detail screen.
- Apple approves the Family Controls (Distribution) capability per App ID.
  The four older targets (main app, `ActivityMonitorExtension`,
  `ShieldAction`, `ShieldConfiguration`) are approved. The report
  extension's App ID `com.pledgecompany.pledge.ReportExtension` was only
  created on 29 October 2026 and is not yet approved.
- Request filed with Apple on 29 October 2026, **Request ID 3D9M9QX3QF**.
  Apple emails the account owner (mateoploquina@gmail.com) when decided.
  Check under developer.apple.com → Identifiers → the ReportExtension App ID
  → Capability Requests → "Family Controls (Distribution)".
- Until then two switches keep it out of store builds: `.easignore`
  excludes `targets/ReportExtension/` from the upload, and
  `PLEDGE_WITHOUT_REPORT=1` in the `preview` and `production` profiles of
  `eas.json` makes `app.config.js` drop the target from the list EAS
  expects credentials for. The app notices at launch
  (`isActivityReportAvailable()` in `modules/pledge-activity-report`) and
  hides every Screen Time panel: the mirror step is skipped, Home shows the
  headline only, pledge detail shows the usage number and bar without the
  top apps. Pledging, blocking, paying and forfeiting are unaffected.
- Dev builds made on a Mac still include the extension, so the panels are
  visible there.

**When Apple approves:**

1. Delete the `targets/ReportExtension/` line from `.easignore` and the
   `PLEDGE_WITHOUT_REPORT` entries from `eas.json`.
2. Run `npx eas build --platform ios --profile production` interactively
   once, so EAS regenerates the ReportExtension provisioning profile with
   the new capability (say yes when it offers a new profile).
3. Nothing in the app code needs to change; the panels appear on their own.

## Build and submit

- Credentials live on EAS (distribution certificate and one provisioning
  profile per target). `eas login` on the machine first.
- Production build: `npx eas build --platform ios --profile production`.
  Add `--non-interactive` once credentials are valid. The build number
  auto-increments in `app.json`; commit that change.
- Submit to TestFlight: `npx eas submit --platform ios --latest`. The App
  Store Connect app id (6738790677) is in `eas.json`.
- The build image is pinned in `eas.json` to Xcode 26.6, the same as the
  Macs we build on. Expo's `latest` image is Xcode 27, which rejects the
  sub-15.0 deployment targets that many of our pods still declare, and the
  archive fails with hundreds of "deployment target is set to 13.4" errors.
  Move the pin only together with raising the pods' deployment targets.
- `.easignore` governs what is uploaded. EAS does not use `.gitignore`.
  Never add secrets to the upload; `backend/` and every `.env*` are excluded.

## Before the App Store (not needed for TestFlight)

- [ ] Live Stripe keys on Vercel production (sandbox keys are there now so
      testers can use card 4242 4242 4242 4242).
- [ ] Currency decided (eur or usd): `CURRENCY_SYMBOL` in `src/config.ts`
      and `PLEDGE_CURRENCY` on the backend.
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
| ReportExtension | .ReportExtension | requested 29 Oct 2026, ID 3D9M9QX3QF |
