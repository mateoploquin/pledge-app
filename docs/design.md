# Pledge — design

How the app looks, moves and speaks. The owner set this direction on
27 October 2026 ("this is the vibe I want for the whole app") after seeing
the opener, and every screen has since been moved over to it. New work
matches it; nothing goes back to the old orange/cream card style.

## The feel in one paragraph

A dark room, one thought at a time. Film loops quietly under a shade. Words
are set in a serif with one italic word carrying the weight. There is one
cream button on a screen and at most one ember accent. Transitions dissolve;
nothing slides, bounces or shoves. Taps tick with a light haptic. It should
feel like a wellness app made by people with taste, not a productivity tool
or a finance app. The owner rejected a formal brand brief as "slop": don't
write manifestos, make screens.

## Tokens (`src/theme/tokens.ts`, use them, don't inline colours)

| token | value | use |
| --- | --- | --- |
| `ink.base` | #17130F | every page ground, splash, launch screen, icon background |
| `ink.raised` | #221C16 | cards, sheets, chips |
| `ink.line` | cream at 16 % | hairlines, ghost button borders |
| `cream.base` | #F8F4EC | display text, the primary pill, active dots |
| `cream.muted` | cream at 72 % | secondary text, quiet buttons |
| `cream.faint` | cream at 45 % | placeholders, disabled text |
| `ember` | #FF8A5B | the one accent: slider thumb/track fill, the report's bars, top-app highlight |
| `radius.pill` / `radius.card` | 30 / 22 | buttons / cards |
| `shade` | 3-stop ink gradient 10 → 35 → 88 % | laid over film so words read on any frame |
| `motion.dissolveMs` / `motion.outMs` | 450 / 160 | fade-through timings |

Colours in native code (shield, report extension) are the same values as
RGB 0–255 (`home.controller.ts`, `targets/ReportExtension/ReportStyle.swift`).

## Type

- Display and headings: **Instrument Serif** (Regular + Italic), loaded at
  startup from `assets/fonts/Instrument_Serif` via `src/utils/fonts.ts`.
  `type.display` is 42/46 with −0.6 tracking; `type.heading` 32/36.
- Body and UI: system font (SF). `type.body` 16/22 cream muted;
  `type.label` 14 cream muted. Buttons 17 semibold.
- The `Line` component (`src/components/ink/line.tsx`) sets one line with
  `*word*` marking the italic word. One italic word per line, the one that
  carries the meaning: "Your last *seven* days." "What's your word *worth?*"
- Numbers that matter are large and serif (the 7-day total at 44 pt in the
  mirror, 44 on Home's empty state). Don't make them bigger without asking;
  the owner noticed and reverted a 72.

## Layout

- `InkScreen` is the ground for every screen: ink background, 28 pt side
  padding, safe-area top + 8, optional "‹ Back" top-left, and a `footer`
  slot that pins the buttons above the home indicator (bottom inset + 24).
- A pledge step is: progress dots (6 pt, 6 gap) → `Line` question → the
  control vertically centred in the remaining space → footer buttons.
- Nothing sits on the home indicator. Secondary links get 12/16 padding.
- The opener's content block is absolutely pinned to the bottom (left/right
  28) so switching states never changes the buttons' position; the Apple
  button's slot (62 pt) is reserved before its availability is known.
- Horizontal lists of chosen apps scroll; they never wrap into a wall.

## Components (`src/components/ink/`, `src/components/buttons/`)

- `PillButton` tones: `primary` (cream fill, ink text, 54 min height),
  `ghost` (hairline outline, cream text), `quiet` (plain muted text, 40).
  One primary per screen. Disabled = 40 % opacity (the press dim multiplies
  it, it must not replace it).
- `PressableScale` wraps every tappable: shrinks to 0.97 (0.98 for quiet)
  and dims 12 % while held, springs back, haptic on press-in.
- `Dissolve` (`line.tsx`): wrapper keyed by `id`. Content is visible from
  the first frame; a change of `id` fades the old content out in 160 ms,
  swaps, then fades the new in over 450 ms, so two sets of controls are
  never on screen together. One wrapper per slot with a changing `id`, not
  one per state that mounts and unmounts (mount is a cut).
- Big number with a small word (the amount's currency sign, "min a day",
  "days"): one `Text` run with the small word nested, never two texts in a
  flex row with `alignItems: "baseline"`. iOS aligns flex items by their
  bottom edge, not the glyph baseline, so the small word sits low. The
  currency sign goes before the number, no space, as everywhere else
  ("$10 on your word").
- `SetSlider`: ember track and thumb, evenly spaced tick labels passed
  explicitly, animated jump when a preset chip is tapped, selection haptic
  on each value change, thumb must not drift from the value.
- `PresetChips`: raised ink pills, cream text, ember text when selected.
- Social sign-in buttons use `tone="dark"` on the film.

## Motion

- Screen to screen: `forSoftFade` in `src/navigation/index.tsx`, a 420 ms
  ease-out crossfade with a 12 pt lift; the screen underneath dims to 60 %.
  Modals (app picker, share sheet) use the native iOS sheet.
- Within a screen: `Dissolve` only. No slides.
- The deal beats (`deal-beats.tsx`) use React Native's `Animated` and only
  fade, fill or count. Figures are drawn in ink, cream and ember: raised
  ink pills, an ember ring, the serif amount, a miniature of the shield.
- Film: `expo-av` Video, looping, muted, cover; the montage is pre-stitched
  with a 0.5 s crossfade at the seam so the loop has no cut.
- Haptics (`src/utils/haptics.ts`): `tap` light for ordinary taps, `press`
  medium for the primary pill, `select` while dragging a slider, `success`
  on lock-in, `warning` before surrender, `error` on failures.
- Reduce Motion: `Dissolve` cuts instead of fading; `PressableScale` and
  the surrender modal go through Reanimated, which respects it on its own.
  Test that content still appears when it is on.

## Copy voice

- Second person, present tense, short. The app speaks like a calm friend
  who means it: "That's enough for today." "Keep my word." "Lock it in."
- Questions, not instructions, on pledge steps. No hint text under controls.
- "Pledge", "your word", "keep your word", "give up". Never "challenge",
  "penalty", "fine", "fee" (except the charity line), "fail".
- Plain money: "Unlock for $5", "What's your word worth?"
- Errors: say what happened and what to do, in one sentence each.

## Film and imagery

- Opener film: `assets/video/montage.mp4`, the owner's own 20 s montage,
  3.9 MB, looped seamlessly. It is the only film. The earlier generated
  clip was retired; don't propose stock or generated footage.
- Splash and launch screen: solid ink. iOS caches launch screens; after
  changing it the phone may need a reinstall and a reboot.
- App icon: ink background, cream mark (`assets/icon.png`).
- Shield (block screen): ink material blur, cream title, muted subtitle,
  SF Symbol `lock.fill` (iOS tints it; the library ignores a custom tint),
  cream primary, muted secondary. Animation is not possible there.
- The 7-day mirror and top-apps panels are drawn by the report extension
  in SwiftUI with the same palette: big serif-style total, ember bars for
  the top three apps with their real icons and names.

## Things the owner has corrected (don't repeat)

- Brand brief with footage rules → "slop". Build, don't theorise.
- Stock/AI footage shortlist → "bland and AI generated".
- Numbers made larger without being asked → reverted.
- Slider ticks must be evenly distributed and labelled.
- Buttons arriving late and pushing others up → unacceptable; reserve
  space, cache availability.
- Links too close to the home indicator; glitchy swap between login and
  signup; layout jumps → all fixed, keep it that way.
- Typos in rules ("::") and leftover country names ("France") → gone.
