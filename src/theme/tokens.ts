/**
 * The look of the app, in one place: dark ink grounds lit by golden-hour
 * light at the top, cream serif words with the italic word in ember, soft
 * pills for buttons.
 * New screens pull from here; older screens are being moved over.
 */
export const ink = {
  /** Page ground. */
  base: "#17130F",
  /** Raised surfaces on the ground (cards, sheets), warmed by the light. */
  raised: "#2A1F17",
  /** Hairlines on the ground. */
  line: "rgba(248, 244, 236, 0.16)",
  /** The warm edge of a card in the light. */
  edge: "rgba(255, 179, 107, 0.24)",
};

export const cream = {
  base: "#F8F4EC",
  /** Secondary text on ink. */
  muted: "rgba(248, 244, 236, 0.72)",
  /** Placeholder and disabled text on ink. */
  faint: "rgba(248, 244, 236, 0.45)",
};

/** The warm accent: the italic word, numbers that matter, active states. */
export const ember = "#FF8A5B";

/** The sun of the welcome film, a lighter step of ember. */
export const amber = "#FFB36B";

/**
 * Golden hour: the warm light of the welcome film glowing down from the top
 * of every screen and fading into the ink by about two thirds of the way.
 */
export const glow = {
  colors: ["rgba(255, 166, 92, 0.34)", "rgba(255, 138, 91, 0.12)", "rgba(23, 19, 15, 0)"] as const,
  locations: [0, 0.38, 1] as const,
};

export const fonts = {
  serif: "InstrumentSerif-Regular",
  serifItalic: "InstrumentSerif-Italic",
};

export const type = {
  /** The big spoken line: one thought per screen. */
  display: { fontFamily: fonts.serif, fontSize: 42, lineHeight: 46, letterSpacing: -0.6, color: cream.base },
  /** A smaller serif heading. */
  heading: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 36, letterSpacing: -0.4, color: cream.base },
  body: { fontSize: 16, lineHeight: 22, color: cream.muted },
  label: { fontSize: 14, color: cream.muted },
};

export const radius = {
  pill: 30,
  card: 22,
};

/** Dark shade laid over film so the words read on any frame. */
export const shade = {
  colors: ["rgba(23,19,15,0.10)", "rgba(23,19,15,0.35)", "rgba(23,19,15,0.88)"] as const,
  locations: [0, 0.45, 1] as const,
};

export const motion = {
  /** Crossfade between two thoughts on the same screen. */
  dissolveMs: 450,
  /** How fast the outgoing thought leaves before the next one fades in. */
  outMs: 160,
};
