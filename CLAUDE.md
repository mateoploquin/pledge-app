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

## Working rules

- Branch `make-device-activity-work` is the live branch. Commit and push
  there when asked; the owner reviews on GitHub (mateoploquin/pledge-app).
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
