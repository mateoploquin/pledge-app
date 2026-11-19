import React, { useMemo } from "react";
import {
  AlphaType,
  Canvas,
  ColorType,
  Group,
  Image,
  Mask,
  PaintStyle,
  Path,
  Skia,
  useFont,
} from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { color } from "../../theme/tokens";
import { planSignature } from "../../utils/signature-plan";

/** The signature face (owner, 19 Nov 2026: "1", Herr Von Muellerhoff, SIL OFL). */
const FACE = require("../../../assets/fonts/Herr_Von_Muellerhoff/HerrVonMuellerhoff-Regular.ttf");
/** Worked out at twice the size, drawn at half. */
const K = 2;
/** The ink a touch heavier than the face (owner, 19 Nov 2026: "a bit thicker"). */
const EXTRA_INK = 1.2;
/** Brush sizes are grouped into this many strokes, one path each. */
const BUCKETS = 4;
/** A pen lift between words costs this share of the whole line. */
const LIFT = 0.06;

interface Props {
  name: string;
  /** 0 → 1: how much of the name is written. */
  progress: SharedValue<number>;
  size?: number;
  maxWidth: number;
}

/**
 * The user's name written by hand as the seal is held (owner, 19 Nov 2026:
 * "the animation to literally write itself", one line per word, the pen not
 * lifted until the word is done). The name is set in the signature face,
 * thinned to its centre line and walked like a pen (utils/signature-plan);
 * the ink is uncovered along that route with a brush as wide as the stroke
 * under it.
 */
const SignatureInk: React.FC<Props> = ({ name, progress, size = 46, maxWidth }) => {
  const font = useFont(FACE, size * K);

  const built = useMemo(() => {
    if (!font || !name) return null;
    const b = font.measureText(name);
    const pad = 8 * K;
    const W = Math.ceil(b.width + pad * 2), H = Math.ceil(b.height + pad * 2);
    const surface = Skia.Surface.Make(W, H);
    if (!surface) return null;
    const canvas = surface.getCanvas();
    const fill = Skia.Paint();
    fill.setColor(Skia.Color(color.text));
    fill.setAntiAlias(true);
    const stroke = fill.copy();
    stroke.setStyle(PaintStyle.Stroke);
    stroke.setStrokeWidth(EXTRA_INK * K);
    const ox = pad - b.x, oy = pad - b.y;
    canvas.drawText(name, ox, oy, fill, font);
    canvas.drawText(name, ox, oy, stroke, font);
    surface.flush();
    const image = surface.makeImageSnapshot();
    const px = image.readPixels(0, 0, { width: W, height: H, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul });
    if (!px) return null;
    const alpha = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) alpha[i] = px[i * 4 + 3] as number;
    // Where each word starts, so dots and crossbars are written after their own word.
    const starts: number[] = [];
    let pre = "";
    for (const word of name.split(" ")) {
      starts.push(ox + (pre ? font.getTextWidth(pre) : 0));
      pre += word + " ";
    }
    const plan = planSignature(alpha, W, H, size * K, starts);
    // Flatten for the UI thread: per point x, y, kind; per segment its brush.
    const n = plan.pts.length;
    const xs: number[] = [], ys: number[] = [], kinds: number[] = [], base: number[] = [], lifts: number[] = [];
    const radii = plan.pts.map((p) => p[2]).sort((a, c) => a - c);
    const edges = Array.from({ length: BUCKETS }, (_, k) => radii[Math.min(n - 1, Math.floor(((k + 1) / BUCKETS) * n) - 1)] ?? 1);
    const segs: number[][] = Array.from({ length: BUCKETS }, () => []);
    plan.pts.forEach((p, i) => {
      xs.push(p[0]); ys.push(p[1]); kinds.push(p[3]); base.push(plan.base[i]); lifts.push(plan.lifts[i]);
      if (i > 0 && p[3] !== 2) {
        const r = Math.max(p[2], plan.pts[i - 1][2]);
        let k = 0;
        while (k < BUCKETS - 1 && r > edges[k]) k++;
        segs[k].push(i);
      }
    });
    const widths = edges.map((r) => 2 * r);
    const fit = Math.min(1, maxWidth / (W / K));
    return { image, W, H, pad, xs, ys, kinds, base, lifts, L: plan.L, J: plan.J, segs, widths, fit };
  }, [font, name, size, maxWidth]);

  // Only plain numbers go to the UI thread.
  const route = useMemo(
    () => (built ? { xs: built.xs, ys: built.ys, base: built.base, lifts: built.lifts, L: built.L, J: built.J, segs: built.segs } : null),
    [built]
  );
  // How many points of the route are inked now.
  const count = useDerivedValue(() => {
    const r = progress.value;
    if (!route || r <= 0) return 0;
    if (r >= 1) return route.xs.length;
    const liftLen = route.J ? (LIFT * route.L) / route.J : 0;
    const target = r * (route.L + route.J * liftLen);
    let lo = 0, hi = route.xs.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (route.base[mid] + route.lifts[mid] * liftLen <= target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  });
  const bucketPath = (k: number) => () => {
    "worklet";
    const path = Skia.Path.Make();
    if (!route) return path;
    const n = count.value;
    const segs = route.segs[k];
    for (let j = 0; j < segs.length; j++) {
      const i = segs[j];
      if (i >= n) break;
      path.moveTo(route.xs[i - 1], route.ys[i - 1]);
      path.lineTo(route.xs[i] + 0.01, route.ys[i]);
    }
    return path;
  };
  const p0 = useDerivedValue(bucketPath(0));
  const p1 = useDerivedValue(bucketPath(1));
  const p2 = useDerivedValue(bucketPath(2));
  const p3 = useDerivedValue(bucketPath(3));
  const done = useDerivedValue(() => (progress.value >= 1 ? 1 : 0));

  if (!built) return null;
  const { image, W, H, pad, widths, fit } = built;
  const paths = [p0, p1, p2, p3];
  return (
    <Canvas
      style={{ width: (W / K) * fit, height: (H / K) * fit, marginLeft: (-pad / K) * fit, marginBottom: (-pad / K) * fit }}
      pointerEvents="none"
    >
      <Group transform={[{ scale: fit / K }]}>
        <Mask
          mode="alpha"
          mask={
            <Group>
              {paths.map((p, k) => (
                <Path key={k} path={p} style="stroke" strokeWidth={widths[k]} strokeCap="round" strokeJoin="round" color="black" />
              ))}
            </Group>
          }
        >
          <Image image={image} x={0} y={0} width={W} height={H} />
        </Mask>
        <Image image={image} x={0} y={0} width={W} height={H} opacity={done} />
      </Group>
    </Canvas>
  );
};

export default SignatureInk;
