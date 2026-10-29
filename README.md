# Pledge

Pick apps, set a daily limit, choose 7/15/30 days, put a card down. Keep your
word and nothing is charged.

Start with `CLAUDE.md` (map for agents and humans), then `docs/`:

- `docs/product.md`: what the app does, screen by screen, decisions and open questions
- `docs/design.md`: look, motion, copy voice, tokens
- `docs/architecture.md`: stack, native targets, backend, Apple limits, dev loop, gotchas
- `docs/release.md`: TestFlight / App Store procedure and status
- `docs/app-review-notes.md`: notes for App Review

## Run on the phone

```sh
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
npm install                      # runs patch-package
npx expo prebuild --platform ios --no-install && (cd ios && pod install)
npx expo start --dev-client --tunnel
```

Then build and install with xcodebuild/devicectl as in `docs/architecture.md`.
Screen Time does not work in the simulator.

## Store builds

```sh
npx eas build --platform ios --profile production --non-interactive
npx eas submit --platform ios --latest
```
