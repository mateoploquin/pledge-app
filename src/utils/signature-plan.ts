// @ts-nocheck -- a straight port of the pen in the Seal Lab artifact
// (owner, 19 Nov 2026), checked there frame by frame; typed loosely on purpose.
/**
 * How a pen writes a name. The name is set in the signature face and
 * rasterised (by the caller); this thins the ink to its centre line, turns it
 * into ends, junctions and strokes, and plans one unbroken route per word
 * (retracing a stroke only where a real pen would, the dots and crossbars
 * after the word). The result is the route as points, each with the brush
 * radius under it, so the ink can be uncovered along it as the seal is held.
 *
 * alpha: the rasterised name's alpha, W × H. R0: the type size in the same
 * pixels. starts: where each word begins, in x.
 */
export type SignaturePlan = {
  /** x, y, brush radius, kind (0 ink, 1 going back over ink, 2 pen lifted) per point. */
  pts: number[][];
  /** Length along the route before each point, and pen lifts before it. */
  base: Float32Array;
  lifts: Uint16Array;
  L: number;
  J: number;
};

export function planSignature(alpha: Uint8Array, W: number, H: number, R0: number, starts: number[]): SignaturePlan {
  const N = W * H;
  const img = new Uint8Array(N);
  for (let i = 0; i < N; i++) img[i] = alpha[i] > 90 ? 1 : 0;
  // How far each inked pixel is from the edge: the brush size there.
  const dist = new Float32Array(N);
  for (let i = 0; i < N; i++) dist[i] = img[i] ? 1e6 : 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!img[i]) continue;
    dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - W] + 1, dist[i - W - 1] + 1.414, dist[i - W + 1] + 1.414); }
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) { const i = y * W + x; if (!img[i]) continue;
    dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + W] + 1, dist[i + W + 1] + 1.414, dist[i + W - 1] + 1.414); }
  // Zhang–Suen thinning to the centre line.
  const a = img.slice(), del: number[] = [];
  for (let changed = true; changed;) { changed = false;
    for (let step = 0; step < 2; step++) { del.length = 0;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!a[i]) continue;
        const p2 = a[i - W], p3 = a[i - W + 1], p4 = a[i + 1], p5 = a[i + W + 1], p6 = a[i + W], p7 = a[i + W - 1], p8 = a[i - 1], p9 = a[i - W - 1];
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (B < 2 || B > 6) continue;
        const A = (!p2 && p3 ? 1 : 0) + (!p3 && p4 ? 1 : 0) + (!p4 && p5 ? 1 : 0) + (!p5 && p6 ? 1 : 0) + (!p6 && p7 ? 1 : 0) + (!p7 && p8 ? 1 : 0) + (!p8 && p9 ? 1 : 0) + (!p9 && p2 ? 1 : 0);
        if (A !== 1) continue;
        if (step === 0 ? (p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0) : (p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0)) del.push(i); }
      if (del.length) { changed = true; for (const i of del) a[i] = 0; } } }
  // Walk the centre line.
  const OFF = [1, W + 1, W, W - 1, -1, -W - 1, -W, -W + 1];
  const nb = i => OFF.map(o => i + o).filter(j => a[j]);
  const seen = new Uint8Array(N);
  const skel: number[] = []; for (let x = 1; x < W - 1; x++) for (let y = 1; y < H - 1; y++) if (a[y * W + x]) skel.push(y * W + x);
  const pts: number[][] = []; // [x, y, r, kind]
  const add = (i, jump) => pts.push([i % W, (i / W) | 0, dist[i] * 1.25 + 1.5, jump]);
  // The pieces of ink. In a joined hand each word is one piece, plus the
  // dots and crossbars, which are written after the word as a hand would.
  const comps: any[] = [], owner = new Int32Array(N).fill(-1);
  for (const s0 of skel) {
    if (owner[s0] >= 0) continue;
    const c = { px: [s0], minx: s0 % W, sx: 0 }; owner[s0] = comps.length; const q = [s0];
    while (q.length) { const p = q.pop(); for (const n of nb(p)) if (owner[n] < 0) { owner[n] = comps.length; c.px.push(n); q.push(n); } }
    for (const p of c.px) { c.minx = Math.min(c.minx, p % W); c.sx += p % W; }
    c.cx = c.sx / c.px.length; comps.push(c);
  }
  // Which word each piece belongs to, from where the words sit in the line.
  comps.forEach(c => { c.word = 0; starts.forEach((s, i) => { if (c.cx >= s) c.word = i; }); });
  const biggest: Record<number, number> = {}; comps.forEach(c => biggest[c.word] = Math.max(biggest[c.word] || 0, c.px.length));
  comps.forEach(c => c.small = c.px.length < 0.18 * biggest[c.word]);
  comps.sort((p, q) => p.word - q.word || p.small - q.small || p.minx - q.minx);
  // One route per piece, the way a hand moves: the centre line becomes a
  // graph (ends and junctions joined by strokes), and the pen takes a single
  // unbroken path over every stroke, going back over a stroke only where a
  // real pen would (an i's stem, a d's upstroke), never lifting mid-word.
  const R = R0;
  function route(c) {
    const inC = new Set(c.px);
    const deg = p => nb(p).length;
    if (c.px.length < 3) return c.px.map(p => [p, 0]);
    // Nodes: loose ends, and junction pixels clustered together.
    const nodeOf = new Map(), nodes = [];
    const J = c.px.filter(p => deg(p) >= 3);
    for (const p of J) {
      if (nodeOf.has(p)) continue;
      const id = nodes.length, px = [p], q = [p]; nodeOf.set(p, id);
      while (q.length) { const u = q.pop(), ux = u % W, uy = (u / W) | 0;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const v = u + dy * W + dx;
          if (v !== u && inC.has(v) && !nodeOf.has(v) && deg(v) >= 3) { nodeOf.set(v, id); px.push(v); q.push(v); } } }
      nodes.push({ px });
    }
    for (const p of c.px) if (deg(p) === 1 && !nodeOf.has(p)) { nodeOf.set(p, nodes.length); nodes.push({ px: [p] }); }
    if (!nodes.length) { let p0 = c.px[0]; for (const p of c.px) if (p % W < p0 % W) p0 = p; nodeOf.set(p0, 0); nodes.push({ px: [p0] }); }
    for (const n of nodes) { let sx = 0, sy = 0; for (const p of n.px) { sx += p % W; sy += (p / W) | 0; }
      sx /= n.px.length; sy /= n.px.length; let best = n.px[0], bd = Infinity;
      for (const p of n.px) { const d = (p % W - sx) ** 2 + (((p / W) | 0) - sy) ** 2; if (d < bd) { bd = d; best = p; } }
      n.rep = best; n.x = best % W; n.y = (best / W) | 0; }
    // Strokes between nodes.
    const edges = [], used = new Set(), pairSeen = new Set();
    for (let id = 0; id < nodes.length; id++) { const n = nodes[id];
      for (const q of n.px) for (const r of nb(q)) {
        if (nodeOf.has(r)) { const m = nodeOf.get(r); if (m !== id) { const k = Math.min(id, m) + "-" + Math.max(id, m);
          if (!pairSeen.has(k)) { pairSeen.add(k); edges.push({ a: id, b: m, chain: [] }); } } continue; }
        if (used.has(r)) continue;
        const chain = [r]; used.add(r); let prev = q, cur = r, end = -1;
        for (;;) {
          const cs = nb(cur).filter(v => v !== prev && !chain.includes(v));
          const toNode = cs.find(v => nodeOf.has(v) && !(nodeOf.get(v) === id && chain.length < 3));
          if (toNode !== undefined) { end = nodeOf.get(toNode); break; }
          const nx = cs.find(v => !nodeOf.has(v) && !used.has(v));
          if (nx === undefined) { end = nodes.length; nodeOf.set(cur, end); chain.pop(); nodes.push({ px: [cur], rep: cur, x: cur % W, y: (cur / W) | 0 }); break; }
          used.add(nx); chain.push(nx); prev = cur; cur = nx;
        }
        edges.push({ a: id, b: end, chain });
      }
    }
    const len = e => e.chain.length + 1;
    // Drop the little spurs thinning leaves at junctions and ball ends.
    const degree = () => { const d = new Array(nodes.length).fill(0); edges.forEach(e => { if (!e.dead) { d[e.a]++; d[e.b]++; } }); return d; };
    for (let pass = 0; pass < 2; pass++) { const d0 = degree();
      edges.forEach(e => { for (const [x, y] of [[e.a, e.b], [e.b, e.a]])
        if (!e.dead && d0[x] === 1 && d0[y] >= 3 && len(e) < Math.max(6, dist[nodes[y].rep] * 3)) e.dead = true; }); }
    // A crossing comes out of thinning as two forks joined by a short link:
    // fold them into one crossing, which the pen goes straight through.
    const root = nodes.map((_, i) => i), find = x => root[x] === x ? x : (root[x] = find(root[x]));
    { const d1 = degree();
      edges.forEach(e => { if (!e.dead && e.a !== e.b && d1[e.a] >= 3 && d1[e.b] >= 3 && len(e) < Math.max(6, dist[nodes[e.a].rep] * 2.5)) { root[find(e.a)] = find(e.b); e.dead = true; } });
      edges.forEach(e => { e.a = find(e.a); e.b = find(e.b); }); }
    const live = edges.filter(e => !e.dead);
    if (!live.length) return c.px.map(p => [p, 0]);
    const deg2 = degree();
    // Shortest paths between nodes, to pair the odd ones with retraced strokes.
    const adj = nodes.map(() => []);
    live.forEach((e, i) => { e.id = i; adj[e.a].push(e); if (e.b !== e.a) adj[e.b].push(e); });
    const dijkstra = s => { const D = new Array(nodes.length).fill(Infinity), via = new Array(nodes.length).fill(null); D[s] = 0;
      const done = new Set(); for (;;) { let u = -1, best = Infinity; D.forEach((v, i) => { if (!done.has(i) && v < best) { best = v; u = i; } });
        if (u < 0) break; done.add(u); for (const e of adj[u]) { const v = e.a === u ? e.b : e.a; if (D[u] + len(e) < D[v]) { D[v] = D[u] + len(e); via[v] = e; } } }
      return { D, via }; };
    const odd = nodes.map((_, i) => i).filter(i => deg2[i] % 2 === 1);
    const all = nodes.map((_, i) => i).filter(i => deg2[i] > 0);
    const byX = (p, q) => nodes[p].x - nodes[q].x;
    let start, route = live.map(e => ({ ...e, orig: e.id }));
    const retrace = (u, v, sp) => { for (let x = v; x !== u && sp.via[x];) { const e = sp.via[x]; route.push({ ...e, orig: e.id }); x = e.a === x ? e.b : e.a; } };
    if (odd.length) {
      odd.sort(byX); start = odd[0];
      const rest = odd.slice(1, -1), sp = new Map(rest.map(u => [u, dijkstra(u)]));
      if (rest.length <= 16) {
        // The cheapest way to pair them up (exact, by subsets).
        const n = rest.length, FULL = (1 << n) - 1, dp = new Float64Array(1 << n).fill(Infinity), pick = new Int32Array(1 << n); dp[0] = 0;
        for (let m = 0; m < FULL; m++) { if (dp[m] === Infinity) continue; let i = 0; while (m & (1 << i)) i++;
          for (let j = i + 1; j < n; j++) if (!(m & (1 << j))) { const nm = m | (1 << i) | (1 << j), c2 = dp[m] + sp.get(rest[i]).D[rest[j]];
            if (c2 < dp[nm]) { dp[nm] = c2; pick[nm] = i * 64 + j; } } }
        for (let m = FULL; m;) { const i = (pick[m] / 64) | 0, j = pick[m] % 64; retrace(rest[i], rest[j], sp.get(rest[i])); m &= ~((1 << i) | (1 << j)); }
      } else {
        const left = rest.slice();
        while (left.length) { const u = left.shift(); const s2 = sp.get(u); let bi = 0;
          left.forEach((v, i) => { if (s2.D[v] < s2.D[left[bi]]) bi = i; }); retrace(u, left.splice(bi, 1)[0], s2); }
      }
    } else { all.sort(byX); start = all[0]; }
    // Walk it: at every node take the stroke that carries on most smoothly,
    // leaning towards what is left behind, never cutting off unwalked strokes.
    const at = nodes.map(() => []); route.forEach((e, i) => { e.i = i; at[e.a].push(e); if (e.b !== e.a) at[e.b].push(e); });
    const usedE = new Set(), drawn = new Set(), out = [];
    const oriented = (e, from) => { const fw = e.a === from; const ch = fw ? e.chain : e.chain.slice().reverse(); return { ch, to: fw ? e.b : e.a }; };
    const reach = (from, skip) => { const seenN = new Set([from]), q = [from]; let n = 0;
      while (q.length) { const u = q.pop(); for (const e of at[u]) { if (usedE.has(e.i) || e.i === skip) continue; n++; const v = e.a === u ? e.b : e.a; if (!seenN.has(v)) { seenN.add(v); q.push(v); } } } return { n, seenN }; };
    const deadAt = new Map(); edges.forEach(e => { if (e.dead) for (const x of [e.a, e.b]) { if (!deadAt.has(x)) deadAt.set(x, []); deadAt.get(x).push(e); } });
    const flick = x => { const list = deadAt.get(x); if (!list) return; deadAt.delete(x);
      for (const e of list) { if (e.flicked) continue; e.flicked = true; const ch = e.a === x ? e.chain : e.chain.slice().reverse();
        for (const p of ch) out.push([p, 1]); for (let k = ch.length - 1; k >= 0; k--) out.push([ch[k], 1]); out.push([nodes[x].rep, 1]); } };
    let cur = start, dir = [1, 0.25];
    out.push([nodes[cur].rep, 0]); flick(cur);
    for (;;) {
      const opts = at[cur].filter(e => !usedE.has(e.i));
      if (!opts.length) break;
      let best = null, bs = -Infinity;
      for (const e of opts) {
        const { ch, to } = oriented(e, cur);
        let bridge = false;
        if (opts.length > 1) { const r = reach(to, e.i); bridge = to !== cur && !r.seenN.has(cur) && reach(cur, e.i).n > 0; }
        const pts2 = ch.length ? ch : [nodes[to].rep];
        const t = pts2[Math.min(pts2.length - 1, 7)];
        const ox = t % W - nodes[cur].x, oy = ((t / W) | 0) - nodes[cur].y, ol = Math.hypot(ox, oy) || 1;
        const dl = Math.hypot(dir[0], dir[1]) || 1;
        let sc = (ox * dir[0] + oy * dir[1]) / (ol * dl);
        sc -= 0.5 * Math.max(-1, Math.min(2, (nodes[to].x - nodes[cur].x) / R));
        if (drawn.has(e.orig)) sc -= 0.3;
        if (bridge) sc -= 10;
        if (sc > bs) { bs = sc; best = e; }
      }
      usedE.add(best.i);
      const { ch, to } = oriented(best, cur);
      const kind = drawn.has(best.orig) ? 1 : 0; drawn.add(best.orig);
      for (const p of ch) out.push([p, kind]);
      out.push([nodes[to].rep, kind]); flick(to);
      const k = out.length - 1, b = out[Math.max(0, k - 6)][0];
      dir = [out[k][0] % W - b % W, ((out[k][0] / W) | 0) - ((b / W) | 0)];
      cur = to;
    }
    // Anything the walk could not reach (shouldn't happen) is written after, with a lift.
    route.forEach(e => { if (!drawn.has(e.orig)) { drawn.add(e.orig); out.push([nodes[e.a].rep, 2]); e.chain.forEach(p => out.push([p, 0])); out.push([nodes[e.b].rep, 0]); } });
    return out;
  }
  for (const c of comps) {
    const r = route(c);
    r.forEach(([p, kind], i) => add(p, i === 0 ? 2 : kind));
  }
  // Length along the line, and how many pen lifts came before each point.
  const base = new Float32Array(pts.length), lifts = new Uint16Array(pts.length);
  let L = 0, J = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) { if (pts[i][3] === 2) J++; else L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) * (pts[i][3] === 1 ? 0.15 : 1); }
    base[i] = L; lifts[i] = J;
  }
  return { pts, base, lifts, L, J };
}

/** How many points of the route are inked at progress r (0–1), with a pause of `liftShare` of the length per pen lift. */
export function inkedCount(plan: SignaturePlan, r: number, liftShare = 0.06): number {
  "worklet";
  if (r <= 0) return 0;
  if (r >= 1) return plan.pts.length;
  const liftLen = plan.J ? (liftShare * plan.L) / plan.J : 0;
  const target = r * (plan.L + plan.J * liftLen);
  let lo = 0, hi = plan.pts.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (plan.base[mid] + plan.lifts[mid] * liftLen <= target) lo = mid + 1; else hi = mid; }
  return lo;
}
