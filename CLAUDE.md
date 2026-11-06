# Pledge — agent briefing

Read this first. It is the map; the detail lives in `docs/`.

Pledge is an iOS app: pick apps, set a daily screen-time limit, choose
7/15/30 days, put a card down. The apps are blocked by Screen Time when the
limit is hit. Unlocking early, deleting the app or revoking Screen Time
access charges the pledge. Keeping your word costs nothing.

| Want to know | Read |
| --- | --- |
| What the product is, every screen and rule, decisions taken and open | `docs/product.md` |
| How it must look and feel, tokens, motion, copy voice | `docs/design.md` |
| How it works, native targets, backend, Apple limits, dev loop, gotchas | `docs/architecture.md` |
| How a build gets to TestFlight / App Store, current status | `docs/release.md` |
| Notes for App Review | `docs/app-review-notes.md` |

## Commands

There are no tests or linter. Check your work with the type checkers and,
for anything touching Screen Time, a build on the owner's phone.

```sh
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
npx tsc --noEmit                         # app type check
(cd backend && npm run typecheck)        # backend type check
(cd backend && npm run dev)              # backend locally (Hono, tsx watch)
npx expo start --dev-client --tunnel     # Metro for the dev build on the phone
# TestFlight build: bumps buildNumber in app.json (commit it), submits itself
npx eas-cli@latest build --platform ios --profile production --auto-submit --non-interactive --no-wait
```

## Code map (the parts that span files)

- App code is in `src/`; local Expo modules in `modules/`; native
  extensions in `targets/`; backend (Vercel, Stripe, Firebase Admin) in
  `backend/`.
- Home, pledge detail and the pledge wizard keep their logic in a hook
  beside the screen (`use-home.ts`, `use-pledge-detail.ts`,
  `use-pledge-wizard.ts`); the screen file only draws. Redesign the screen,
  not the hook.
- Enforcement lives in `src/screens/home/home.controller.ts`: each pledge
  is a DeviceActivity schedule `Pledge<id>` with 5-min `tick<n>` events,
  `limitReached` and six blocking ticks past it. Constants are in
  `home.constants.ts`. Read "How a pledge is enforced" in
  `docs/architecture.md` before changing any of it.
- Every Screen Time name is built from the pledge's 10-char id. Ids must
  stay fixed length and names must not contain underscores, because the
  library clears events by prefix and joins its storage keys with `_`
  (`events_<activity>_<callback>_<event>`).
- `targets/ActivityMonitorExtension` is copied from
  `node_modules/react-native-device-activity` at prebuild (gitignored).
  Change the library with `patch-package` (`patches/`), not that folder.

## Working rules

- Branch `make-device-activity-work` is the live branch. Commit and push
  there when asked; the owner reviews on GitHub (mateoploquin/pledge-app).
  Commit as the owner: `git -c user.name=mateoploquin -c
  user.email=mateoploquina@gmail.com commit ...`.
- Node 20: `export PATH="/opt/homebrew/opt/node@20/bin:$PATH"` before any
  `npx`. Xcode 26.6 locally; EAS is pinned to the same.
- `ios/` is generated (gitignored). Native changes go through
  `npx expo prebuild --platform ios --no-install && (cd ios && pod install)`,
  with `--clean` when a target's structure changes. Never hand-edit `ios/`.
- Secrets: never print, echo, cat or commit them. `backend/.env`, `.env*`
  and the Firebase service account are gitignored and `.easignore`d. Vercel
  env vars are "Sensitive". Add values with `vercel env add NAME production
  --value "$(cat file)"` style commands, not by pasting into chat.
- Things the owner runs themselves (sandbox denies them to agents):
  production deploys (`cd backend && vercel --prod --yes`), interactive
  `eas login` / `eas build` credential setup, server-side deletions
  (wipe scripts). Ask for them with a `!`-prefixed command they can paste.
- The owner's phone is the only test device (iPhone 17 Pro, iOS 26.6.1,
  device id `00008150-00154C280AD8C01C`). Screen Time APIs do not work in
  the simulator.
- The owner's taste rules the design. Read `docs/design.md` before
  touching any screen; don't argue brand principles, build what they pick.
- Keep docs current. When you change a flow, a rule, a token or the build
  procedure, update the matching file in `docs/` in the same commit.
