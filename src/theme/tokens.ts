/**
 * The look of the app, in one place. Dark editorial: Night grounds, solid
 * espresso surfaces, ivory type, orange only as concentrated light. Values
 * come from the Paper file "Pledge — Design System". Limits, money and consent
 * always sit on solid surfaces in plain Inter.
 */
export const color = {
  bg: "#140C0B",
  raised: "#241310",
  surface: "#301B17",
  surfacePressed: "#41251E",
  text: "#F8F0E6",
  /** The one secondary text colour, on ground, glass and film alike (owner, 17 Nov 2026). */
  textSecondary: "#E6D8CC",
  textTertiary: "#A89488",
  /** Hairlines. Under 3:1 on dark, so never the only edge of a control. */
  divider: "#6F5549",
  controlEdge: "#A89488",
  action: "#F8F0E6",
  onAction: "#241310",
  /**
   * The brand orange (the app icon's sun) and the one accent (owner, 17 Nov
   * 2026): the name on the seal, the hold ring, labels, usage bars, the
   * launch sun, and the glows. Ivory on it is under 3:1: never a button fill.
   * The owner does not want the light orange (#F4A052) anywhere.
   */
  solar: "#ED602A",
  ember: "#9F3425",
  oxblood: "#551A20",
  success: "#8FBF9A",
  warning: "#E8B65C",
  error: "#F2908F",
  scrim: "rgba(20, 12, 11, 0.72)",
};

export const fonts = {
  /** Brand moments only: uppercase, never money, forms or terms. */
  display: "NotoSerifDisplay-Regular",
  /** One handwritten word only: the unit of the mirror's last number, "13 years" (owner, 18 Nov 2026). */
  script: "GreatVibes-Regular",
  /** Functional titles. */
  title: "Inter-Medium",
  ui: "Inter-Regular",
  uiMedium: "Inter-Medium",
  uiSemibold: "Inter-SemiBold",
};

export const type = {
  /** Editorial headline on brand moments. */
  hero: { fontFamily: fonts.display, fontSize: 48, lineHeight: 50, letterSpacing: -1.2, textTransform: "uppercase" as const, color: color.text },
  /** A longer editorial line. */
  display: { fontFamily: fonts.display, fontSize: 42, lineHeight: 46, letterSpacing: -1.05, textTransform: "uppercase" as const, color: color.text },
  /** Title of a functional screen, sentence case. */
  heading: { fontFamily: fonts.title, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, color: color.text },
  /** Time and money. */
  value: { fontFamily: fonts.uiSemibold, fontSize: 44, lineHeight: 48, letterSpacing: -0.88, color: color.text },
  /** A sentence. */
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 24, color: color.textSecondary },
  /** One line next to a value, a list row, an option. */
  row: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 20, color: color.text },
  /** Meta: "12 days left", hints, legal. Nothing smaller except captions. */
  small: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20, color: color.textSecondary },
  /** Small caps label (`Caption`). */
  caption: { fontFamily: fonts.uiMedium, fontSize: 11, lineHeight: 14, letterSpacing: 1.54, textTransform: "uppercase" as const, color: color.textTertiary },
};

export const spacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 40 };

export const radius = {
  control: 12,
  card: 18,
  glass: 24,
  /** Old name; everything that was a pill is now a control. */
  pill: 12,
};

/** Laid over film so the words read on any frame. */
export const shade = {
  colors: ["rgba(20,12,11,0.10)", "rgba(20,12,11,0.35)", "rgba(20,12,11,0.88)"] as const,
  locations: [0, 0.45, 1] as const,
};

/** The low oxblood light at the top of screens. */
export const glow = {
  colors: ["rgba(85, 26, 32, 0.70)", "rgba(85, 26, 32, 0.22)", "rgba(20, 12, 11, 0)"] as const,
  locations: [0, 0.38, 1] as const,
};

/**
 * The "last light" glass (docs/design.md): a faint warm-white fill over a
 * blur, a bright rim on top, an orange rim on the bottom. Its colour comes
 * from whatever glows behind it, so a glass card always has a glow behind.
 */
export const glass = {
  fill: ["rgba(255,236,214,0.16)", "rgba(248,240,230,0.06)", "rgba(36,19,16,0.35)"] as const,
  fillLocations: [0, 0.45, 1] as const,
  border: "rgba(255,222,196,0.22)",
  rimTop: "rgba(255,240,224,0.45)",
  rimLeft: "rgba(255,214,170,0.18)",
  rimBottom: "rgba(237,96,42,0.35)",
  /** Hairlines inside a glass card. */
  rule: "rgba(255,222,196,0.14)",
  blur: 30,
};

/** Film grain strength: brand moments, then everything else. */
export const grain = { brand: 0.26, quiet: 0.18 };

export const motion = {
  /** Crossfade between two thoughts on the same screen. */
  dissolveMs: 450,
  /** How fast the outgoing thought leaves before the next one fades in. */
  outMs: 160,
};

