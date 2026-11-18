# Pledge — design

> Dark editorial "last light": Noto Serif Display caps on brand moments,
> Inter for all UI and money, one accent (the brand orange #ED602A). Source: the Paper file
> "Pledge — Design System". The Tokens and Type sections below are current
> (17 Nov 2026); "The feel in one paragraph" and some component notes still
> describe the older look in places.

## Direction: "last light" (owner, 7 Nov 2026)

The owner picked this after seeing v2 in Paper ("I'm really liking this
vibe"). Source: their Pinterest board `pledge-20-uxuix`, and the v2 row at the
top of the "04 All screens (v2, what ships)" page in the Paper file. Every screen rebuilt
from here on follows it.

The feel: a sun at the horizon seen through haze, on film. Big soft fields of
light, fine grain, edges sinking into dark.

- **Blurred light, not shapes.** Backgrounds are two or three large radial
  glows in the brand oranges (amber core, solar, ember, oxblood) blurred until
  they have no edges, fading into espresso `#140C0B`. The glowing sun, often
  low or cut by a thin horizon rule, is the recurring image and echoes the
  Pure Horizon Sun logo.
- **Film grain on every background.** Monochrome noise (brightness only, no
  coloured specks), about one pixel per speck. It is one tile,
  `assets/textures/grain.png` (256 px, drawn at 128 pt and repeated), laid over
  the background and under the content. Strength: 26 % opacity on brand
  moments, 18 % on screens with money or limits. It also hides gradient
  banding.
- **Vignette on brand moments.** The edges darken to near-black so the light
  seems to come from inside the frame.
- **The glow scales with distance from money.** Strongest on the opener, empty
  Home, "You kept your word" and the launch screen. On Home with a
  pledge, the wizard, Review, give-up and Account, the glow is only a soft
  light at the top and bottom edges. Account and its sub-screens (Paper E1–E4)
  add one more: a radial gradient (ellipse 70 % × 30 % of the screen at
  30 %/38 %, solar 42 % → ember 24 % → clear) behind the glass list, drawn in
  the ground under the grain, not the blurred card glow. Pledge detail (Paper
  D1–D4) does the same with an ellipse 70 % × 28 % at 25 %/40 %, solar 50 % →
  ember 28 % at half → clear, behind the Today card.
- **Glass for cards and the main button (owner, 7 Nov 2026).** The pledge
  card is frosted glass: a faint warm-white fill, background blur, a bright
  1 px rim along the top edge, an orange rim along the bottom, and a soft
  shadow beneath. It needs light behind it to read, so a blurred glow sits
  behind each glass card. On Home that glow is part of the ground (passed as
  `InkScreen`'s `backdrop`, under the grain, fixed to the screen as in Paper
  C2–C5), not part of the scrolling content. In the app the glass has no
  system blur (9 Nov 2026): every iOS blur style adds a grey tint that made
  the cards muddy, and what sits behind glass is already a soft glow. It is
  Paper's 135° gradient (angle kept true on any card shape), the 1 px border,
  and the three inset rims drawn as one inner border so they follow the
  corners (`glass-surface.tsx`). Buttons are not glass any more: see
  "One main button" below. No shine line across the middle, no text shadow, no outer shadow or
  halo, no brand-colour tint: the owner found a tinted gradient pill
  "horrific" and a glossy clear one "AI generated". Ivory Inter Medium text. Reference: the stacked glowing pills and the frosted product
  card on the owner's board.
- **One main button, ivory, everywhere (owner, 17 Nov 2026).** The main
  action on every screen (wizard, Home, detail, Account, the surrender
  sheet's "No, keep going") is the solid ivory `PillButton` tone `primary`:
  `#F8F0E6` fill, espresso Inter SemiBold, radius 12, like the words around
  it. Tried and dropped the same day: liquid glass buttons and a black pill
  ("off brand"). The glass left is the cards and the seal's hold ring.
- **The seal's hold ring is liquid glass (owner, 14 Nov 2026).** Smoked
  glass after the owner's reference of dark glass status cards: a real blur
  (`BlurView`, dark, intensity 28) under a warm dark smoke
  `rgba(34,16,12,0.34)`, a soft sheen falling from the top edge, a light
  hairline all round with a brighter top rim, radius 18
  (`liquid-glass.tsx`, `liquidGlass` tokens). Cards keep the clear glass.
- **Three brand moments carried over from the v3 poster (owner, 16 Nov
  2026), redrawn in last light** (Paper "v2.1 B Making a pledge"): the
  mirror's daylight line and the seal's oath are Noto Serif caps, numbers
  stay Inter; "What's this time for?" and the seal have films behind them
  (the reason's clip, the sunrise), each under a shade that is dark where
  words sit. The rest of the v3 poster (Anton, Oswald, mono, full-screen
  posters) is not used; it is kept on the branch `v3-poster`.
- **Making a pledge uses solid buttons (owner, 8 Nov 2026).** In the wizard
  and the card step, the main button and the selected chip are solid
  ivory with espresso SemiBold text, radius 12, as in v1. Unselected chips and
  "Choose apps" are thin outlines; disabled Continue is a surface fill with
  tertiary text. The same ivory button is on Home, detail and Account.
- **Text on glass stays readable.** Secondary text on glass is lifted to
  `#E6D8CC` and main text is ivory, because the glow behind lowers contrast.
  The Sign in with Apple button stays solid ivory (Apple's rules for that
  button).
- **Type:** Noto Serif Display upright caps for brand headlines; small spaced
  caps in Inter (11 pt, +0.14 em) for captions and section labels, often with a
  thin rule; Inter for everything with a number in it.
- **Photography and films:** blurred, backlit silhouettes in orange haze, shot
  slow-shutter or slightly out of focus so nobody is identifiable. This is
  the grade for regrading `montage.mp4` and `still-in-traffic.mp4`.
- **Not this:** coloured digital noise, hard-edged gradient shapes, bright orange grounds
  behind small text.

How the app looks, moves and speaks. The owner set this direction on
27 October 2026 ("this is the vibe I want for the whole app") after seeing
the opener, and every screen has since been moved over to it. New work
matches it; nothing goes back to the old orange/cream card style.

## The feel in one paragraph

A dark room in golden-hour light, one thought at a time. Film loops quietly
under a shade; every other screen glows warm from the top, the sun of the
welcome film, fading into ink. Words are set in a serif with one italic word,
in ember, carrying the weight. There is one cream button on a screen; ember
is the warm accent, used where a number or a state matters (owner asked for
more colour, 31 Oct 2026, and picked "golden-hour light" over per-state
colours, a colour per pledge, or coloured grounds). Transitions dissolve;
nothing slides, bounces or shoves. Taps tick with a light haptic. It should
feel like a wellness app made by people with taste, not a productivity tool
or a finance app. The owner rejected a formal brand brief as "slop": don't
write manifestos, make screens.

## Tokens (`src/theme/tokens.ts`, use them, don't inline colours)

One system, set by the owner on 17 Nov 2026 after an audit found 19 font
sizes, six secondary-text colours and four oranges in use.

| token | value | use |
| --- | --- | --- |
| `color.bg` | #140C0B | every page ground, splash, launch sunset |
| `color.surface` / `surfacePressed` | #301B17 / #41251E | disabled fills, usage-bar track |
| `color.text` | #F8F0E6 ivory | all main text; the main button's fill |
| `color.textSecondary` | #E6D8CC | **the one** secondary text colour, on ground, glass and film |
| `color.textTertiary` | #A89488 | captions, slider ticks, disabled labels |
| `color.divider` / `controlEdge` | #6F5549 / #A89488 | hairlines / outlines of controls |
| `color.onAction` | #241310 espresso | the label on every ivory button (and the shield's) |
| `color.solar` | #ED602A, the icon's orange | **the one accent**: the name on the seal, the hold ring, labels like "SOCIAL MEDIA", usage bars, "back.", the launch sun, glows. Never a button fill |
| `color.ember` / `oxblood` | #9F3425 / #551A20 | light only: glows, film grades. Never text or bars |

No light orange (#F4A052 or #FFD1A3) anywhere: the owner finds it ugly
(17 Nov 2026).
| `color.success` / `warning` / `error` | #8FBF9A / #E8B65C / #F2908F | status dots, callouts, "Delete account" |
| `glass.*` | see file | the card glass (fill, rims, `rule` hairline) |
| `liquidGlass.*` | see file | the seal's hold ring only |
| `radius.control` / `card` / `glass` | 12 / 18 / 24 | buttons and rows / cards / glass cards |
| `shade` | ink gradient 10 → 35 → 88 % | laid over film so words read |
| `motion.dissolveMs` / `outMs` | 450 / 160 | fade-through timings |

Native code uses the same values: the shield as RGB 0–255
(`home.controller.ts`), the report extension through `ReportStyle.swift`
(the app passes ivory, #E6D8CC and #ED602A; the fallbacks are the same).

## Type

Two families: **Inter** (Regular, Medium, SemiBold) and **Noto Serif
Display** Regular, for brand moments in the app only. The mirror's story is
Inter only (owner, 18 Nov 2026: one font, the time frame and the unit big);
the report extension bundles Inter alone. No system font in the app's own UI (the shield can't set
a font; that is Apple's).

| style (`type.*`) | font | size / line | use |
| --- | --- | --- | --- |
| `hero` | Noto Serif Display caps, −0.025 em | 48/50 | the opener's line |
| `display` | Noto Serif Display caps, −0.025 em | 42/46 | brand moments: "You kept your word." |
| seal oath | Noto Serif Display caps | 64/66 | "I, MATEO, PLEDGE." only |
| `heading` | Inter Medium, −0.02 em | 30/36 | every screen title: wizard questions, Home, pledge detail, Account, the give-up sheet |
| `value` | Inter SemiBold, −0.02 em | 44/48 | time and money |
| `row` | Inter Regular (SemiBold for amounts) | 16/20 | list rows, options, units next to a value, buttons |
| `body` | Inter Regular, #E6D8CC | 16/24 | sentences |
| `small` | Inter Regular, #E6D8CC | 14/20 | meta ("12 days left"), hints, callout text, legal. Nothing smaller but captions |
| `caption` | Inter Medium caps, 0.14 em | 11/14 | `Caption`: step counters, section labels, "HOLD TO SEAL" |

- Serif caps are for brand moments only (owner, 17 Nov 2026): the opener,
  the mirror's daylight line, the seal, "You kept your word." Functional
  screens (Home, pledge detail, wizard, Account) use `heading`.
- Numbers are always Inter, never the serif.
- Big numbers stay at 44 (168 for the mirror's hours). Don't make them
  bigger without asking; the owner noticed and reverted a 72.

## Layout

- `InkScreen` is the ground for every screen: ink background, 28 pt side
  padding, safe-area top + 8, optional "‹ Back" top-left, and a `footer`
  slot that pins the buttons above the home indicator (bottom inset + 24).
- A pledge step is: "STEP n OF N" top right → question (24 pt under the
  top row) → the control at a fixed distance under it, as placed in Paper
  B1–B8 (28 pt; 120 for the sliders, 160 for the length list, 24 on
  Review) → footer buttons. Review's footer is the terms checkbox over the
  button with no quiet Back; the card step's footer is "Add a card" and
  "Back", shown only after the sheet was closed or failed.
- Nothing sits on the home indicator. Secondary links get 12/16 padding.
- The opener's content block is pinned to the bottom (sides 24): 40 pt from
  the screen edge (Paper "A1", on a phone with a 34 pt home indicator); the Apple button's
  slot is reserved before its availability is known. The
  Apple and Google buttons are one hand-drawn pill (`ProviderButton`, 16 pt
  glyph, 8 gap), not Apple's native button, so they match and always read in
  English. The line above the opener headline is gone (owner,
  9 Nov 2026).
- Rebrand only (owner, 9 Nov 2026): Paper sets the look, never the features.
  Where an artboard drops something the app does or shows (the apps hint, a
  Back button, the top three apps, the hours-back mirror), the app keeps it
  in the new style.
- Screen Time panels drawn by the report extension use Inter (bundled in
  `targets/ReportExtension`), never the system font.
  The pledge card and pledge detail's "Apps" row show the apps as small
  native icons, as many as fit, then "+N" (`ActivityIcons`). Not names: the
  system draws names from tokens but never reports their width, so a row of
  names either stretches apart or cuts to one letter (owner, 9 Nov 2026).
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
- `SetSlider`: ivory track fill and thumb on an espresso track, evenly spaced tick labels passed
  explicitly, animated jump when a preset chip is tapped, selection haptic
  on each value change, thumb must not drift from the value.
- `PresetChips`: outlined, `row` text in #E6D8CC; selected is solid ivory with espresso SemiBold.
- Social sign-in buttons use `tone="dark"` on the film.

## Motion

- Screen to screen: `forSoftFade` in `src/navigation/index.tsx`, a 420 ms
  ease-out crossfade with a 12 pt lift; the screen underneath dims to 60 %.
  Modals (app picker, share sheet) use the native iOS sheet. The give-up
  sheet (Paper D4) is dark glass rising from the bottom edge: full width, top
  corners 28, at least 344 pt tall with 32 pt under its buttons, in an RN
  `Modal` so its scrim (#0A0605 at 62 %) dims the whole screen, footer included.
- Within a screen: `Dissolve` only. No slides.
  One exception, the mirror's story (owner, 18 Nov 2026: "dots, phrase,
  number"). Each beat: the words fade out (350 ms), the squares grow, the
  sentence fades up 10 pt (500 ms, ease out cubic; Inter 26, its time frame
  SemiBold ivory, the rest #E6D8CC), the number 800 ms later (Inter SemiBold
  96, unit 44, then "on your phone." Inter 20), then 2.6 s to read. The
  squares: one ivory square per hour, 16 % gap, square corners, each row
  one dashed line so no square is ever cut, a square never moves once
  placed (a beat's squares fill in around the last beat's block, row by
  row). The week's 26 come one by one, linear, 1.6 s, after the screen has
  settled; month and year grow in log steps (ease in-out cubic, 1.7 s) while
  the view pulls back, square sizes snapped to pixels; the life keeps the
  year's size, rows exactly the content's width, and floods down over the
  words' place for 4.5 s (ease in), masked to fade from 55 % to 95 % of the
  story's height; after 0.9 s it fades out over 1.2 s and the last words
  move up into its place. The growth and the drawing run on the UI thread
  (Reanimated animated props on an SVG path, the count in a read-only
  TextInput): driven from JS they reached the screen in bursts. Reduce
  Motion shows the last words only. `AverageStory`, `Reveal`, `Pile` and
  `pileRows` in `screen-time-mirror.tsx`; `play()`, `Pile` and `PileShape`
  in `SocialCut.swift`, same timings.
- Launch (owner, 17 Nov 2026): the static splash comes to life as a sunset
  (`src/components/ink/launch-sunset.tsx`, mounted over everything in
  `App.tsx`). It starts as an exact copy of `assets/splash.png` (measured:
  sun r 85 px centred, line 342 × 6 px, "cover" scale), so the hand-off
  can't be seen. After 120 ms the sun sinks behind the line over 1.5 s
  (ease in-out cubic), warming from ivory to the brand orange `#ED602A` with an
  orange glow; then the app fades in over 450 ms once it has drawn. Reduce Motion
  skips the sinking.
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
  3.9 MB, looped seamlessly. Plays under the stanzas and sign-in.
- Welcome film: `assets/video/still-in-traffic.mp4` (8 s, 720×1280, audio
  stripped, a woman in the sun on a New York street), chosen by the owner.
  It plays once under the welcome's second line, never under the deal's
  beats: the owner dropped it there (30 Oct 2026) as too much noise and
  brought it back for the welcome only (31 Oct 2026). Don't propose other
  footage; the owner picks the film.
- Splash and launch screen: the ivory Pure Horizon Sun, 112 pt wide, on
  espresso #140C0B (`assets/splash.png`). iOS caches launch screens; after
  changing it the phone may need a reinstall and a reboot.
- App icon: the solar symbol (#ED602A) on espresso, 1024 px, no alpha
  (`assets/icon.png`, owner chose solar on 7 Nov 2026). Both images are drawn
  from the master geometry with exact colours, not exported from Paper,
  which shifts colours on export.
- Stripe card sheet and the Terms/Privacy pages use the same palette.
- Shield (block screen): ink material blur, cream title, muted subtitle,
  SF Symbol `lock.fill` (iOS tints it; the library ignores a custom tint),
  ivory primary with an espresso label, #E6D8CC secondary. Animation is not possible there.
- The 7-day mirror and top-apps panels are drawn by the report extension
  in SwiftUI with the same palette: big Inter total, orange bars for
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
