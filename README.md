cd pledge-app
## Prerequisites

You need to use at least `nvm` > 18:
```sh
nvm use 18
```

## Run the App in the Simulator

To run the app in the simulator, use:
```sh
npx expo run:[ios or android]
```

## TestFlight and the App Store

Store builds are made with EAS. See `docs/release.md` for the full
procedure, what is excluded from store builds right now and why (the
report extension is waiting on an Apple approval), and the pre-launch
checklist. `docs/app-review-notes.md` holds the notes for App Review.

```sh
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```