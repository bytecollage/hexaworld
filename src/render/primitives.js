// ---- drawing utilities
function groundEllipse(x, y, rx, ry, ang = 0, fromCell = 0, until = TAU, n = 14) {   // ellipse lying on the ground
  const c = Math.cos(ang), s = Math.sin(ang);
  let first = true;
  for (let k = 0; k <= n; k++) {
    const a = fromCell + (until - fromCell) * k / n, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
    const p = project(x + ex * c - ey * s, y + ex * s + ey * c);
    if (!p) continue;
    first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false;
  }
}
let noShadow = false;                              // when drawing a fallen (rotated) tree its shadow is not drawn
function shadow(x, y, r) { if (noShadow) return; ctx.beginPath(); groundEllipse(x, y, r, r * 0.8); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill(); }
// on-screen scale of 1 world unit, and height factor for standing things
function worldBar(x, y, w, v, color) {                // a small bar over something in the world (captives' health)
  ctx.fillStyle = "rgba(20,24,28,.75)"; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
  ctx.fillStyle = color; ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, v)), 4);
}
function sizes(it) { const scl = cam.zoom * it.p[2]; return [scl, scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45)]; }
function bird(it, c) {              // bird in flight (wings spread across its heading, flapping) or perched; shadow on the ground
  const [scl] = sizes(it), a = it.a, d = a.dir, span = c.wingspan;
  ctx.beginPath(); groundEllipse(it.x, it.y, span * 0.5, span * 0.2, d); ctx.fillStyle = `rgba(0,0,0,${0.06 + 0.12 * (1 - Math.min(1, a.alt || 0))})`; ctx.fill();
  const z = c.altitude * (a.alt || 0) + 0.12, perched = !a.moving && (a.alt || 0) < 0.85;
  const P = (u, v, dz = 0) => bodyPoint(it.x, it.y, d, u, v, z + dz);
  const eating = perched && a.eating > 0, t = performance.now() / 1000 + (a.sem || 0);
  const peck = eating ? Math.max(0, Math.sin(t * 7)) : 0;                       // eating: the head goes down to the food and up again
  const flutter = eating ? Math.max(0, Math.sin(t * 1.3) - 0.8) * 5 : 0;        // …and now and then it half opens its wings
  if (perched) {                                    // folded wings
    ctx.beginPath(); if (bodyEllipsoid(it.x, it.y, d, -span * 0.04, 0, z, span * 0.32, span * 0.09, 0.05)) { ctx.fillStyle = c.wings; ctx.fill(); }
    if (flutter > 0) for (const side of [1, -1]) {
      const pts = [P(span * 0.08, 0, 0.02), P(-span * 0.05, side * span * 0.42 * flutter, 0.05 + span * 0.25 * flutter), P(-span * 0.22, side * span * 0.2 * flutter, 0.02)];
      if (!pts.every(Boolean)) continue;
      ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = c.wings; ctx.fill();
    }
  } else {
    const wing = Math.sin(a.phase * c.flap) * 0.45, chord = span * 0.22;          // each wing: leading edge, tip, trailing edge
    for (const side of [1, -1]) {
      const pts = [P(chord * 0.5, 0, 0), P(chord * 0.45, side * span * 0.5, 0.06 + span * wing * 0.3), P(-chord * 0.2, side * span, span * wing),
                   P(-chord * 0.6, side * span * 0.5, 0.06 + span * wing * 0.3), P(-chord * 0.5, 0, 0)];
      if (!pts.every(Boolean)) continue;
      ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
      ctx.fillStyle = c.wings; ctx.fill(); ctx.strokeStyle = c.wings; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  ctx.beginPath(); if (bodyEllipsoid(it.x, it.y, d, 0, 0, z, span * 0.25, 0.04, 0.035)) { ctx.fillStyle = c.torso; ctx.fill(); }
  const H = P(span * (0.27 + 0.08 * peck), 0, 0.01 - 0.09 * peck), N = P(span * 0.18, 0, 0.02);
  if (eating && H && N) { ctx.strokeStyle = c.head; ctx.lineWidth = Math.max(1, scl * span * 0.07); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(N[0], N[1]); ctx.lineTo(H[0], H[1]); ctx.stroke(); ctx.lineCap = "butt"; }   // its bare neck
  if (H) circle(H[0], H[1], Math.max(1, scl * span * 0.1), c.head);
}
// a tree that has just sprouted from a seed: a thin stem with two pointed leaves; t 0 … 1 grows it
function seedling(it, t) {
  const s = lerp(0.6, 1.6, t), d = hash(it.i, 410) * TAU, h = 0.16 * s, x = it.x, y = it.y;
  shadow(x, y, 0.07 * s);
  const P = (u, v, z) => bodyPoint(x, y, d, u, v, z), B = P(0, 0, 0), top = P(0, 0, h), mid = P(0.02 * s, 0, h * 0.5);
  if (!B || !top || !mid) return;
  const [scl] = sizes(it);
  ctx.strokeStyle = "#5d9e3a"; ctx.lineWidth = Math.max(1, scl * 0.018 * s); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.quadraticCurveTo(mid[0], mid[1], top[0], top[1]); ctx.stroke();
  for (const side of [1, -1]) {                       // one leaf to each side, pointing up and out
    const T = P(0, side * 0.15 * s, h + 0.1 * s), C1 = P(0.08 * s, side * 0.03 * s, h + 0.13 * s), C2 = P(-0.08 * s, side * 0.13 * s, h);
    if (!T || !C1 || !C2) continue;
    ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.quadraticCurveTo(C1[0], C1[1], T[0], T[1]); ctx.quadraticCurveTo(C2[0], C2[1], top[0], top[1]);
    ctx.fillStyle = side > 0 ? "#6cc04a" : "#5aae3c"; ctx.fill();
    ctx.strokeStyle = "#3f7f2a"; ctx.lineWidth = Math.max(0.6, scl * 0.008); ctx.stroke();
  }
}
// ---- 3D helpers: points in world units with a height z (z uses the same scale as the `tall` of sizes()),
//      so drawings built from them turn and foreshorten with the camera
function projectUp(x, y, z = 0) {
  const p = project(x, y); if (!p) return null;
  return [p[0], p[1] - cam.zoom * p[2] * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45) * z, p[2]];
}
// point of something at (x, y) facing direction d: u forward, v to its left, z up
function bodyPoint(x, y, d, u, v, z) { const c = Math.cos(d), s = Math.sin(d); return projectUp(x + u * c - v * s, y + u * s + v * c, z); }
// outline of an ellipsoid: center C and the screen vectors of its semi-axes (exact for a parallel projection)
function ellipsoidPath(C, axes) {
  let a = 0, b = 0, d = 0;
  for (const [x, y] of axes) { a += x * x; b += x * y; d += y * y; }
  const m = (a + d) / 2, r = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  ctx.ellipse(C[0], C[1], Math.sqrt(m + r), Math.sqrt(Math.max(m - r, 0.25)), 0.5 * Math.atan2(2 * b, a - d), 0, TAU);
}
// ellipsoid of a body facing d, centered at (u, v, z) with half-sizes L (forward), Wd (sideways) and Hh (up); false if off screen
function bodyEllipsoid(x, y, d, u, v, z, L, Wd, Hh) {
  const P = (du, dv, dz) => bodyPoint(x, y, d, u + du, v + dv, z + dz), C = P(0, 0, 0), F = P(L, 0, 0), S = P(0, Wd, 0), U = P(0, 0, Hh);
  if (!C || !F || !S || !U) return false;
  ellipsoidPath(C, [[F[0] - C[0], F[1] - C[1]], [S[0] - C[0], S[1] - C[1]], [U[0] - C[0], U[1] - C[1]]]);
  return true;
}
// is the side of something turned d, with outward normal (nu forward, nw left), facing the camera?
function sideSeen(d, nu, nw) {
  const r = cam.rot * Math.PI / 180, c = Math.cos(d), s = Math.sin(d);
  return (c * nu - s * nw) * -Math.sin(r) + (s * nu + c * nw) * Math.cos(r) > 0.01;
}
// box of sticks (trap, cage) centered at (x, y) and turned d: back sides, then inside(), then the sides facing the camera
function stickBox(x, y, d, hu, hw, h, n, color, inside) {
  const Q = (u, w, z) => bodyPoint(x, y, d, u, w, z);
  const sides = [[hu, -hw, hu, hw, 1, 0], [hu, hw, -hu, hw, 0, 1], [-hu, hw, -hu, -hw, -1, 0], [-hu, -hw, hu, -hw, 0, -1]];
  const sticks = ([u0, w0, u1, w1, nu]) => {
    const m = nu ? Math.max(2, Math.round(n * hw / hu)) : n;            // fewer sticks on the short sides
    ctx.beginPath();
    for (let k = 0; k <= m; k++) { const t = k / m, b = Q(lerp(u0, u1, t), lerp(w0, w1, t), 0), top = Q(lerp(u0, u1, t), lerp(w0, w1, t), h); if (b && top) { ctx.moveTo(b[0], b[1]); ctx.lineTo(top[0], top[1]); } }
    for (const z of [h, h * 0.55]) { const p0 = Q(u0, w0, z), p1 = Q(u1, w1, z); if (p0 && p1) { ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); } }
    ctx.strokeStyle = color; ctx.stroke();
  };
  ctx.lineCap = "round";
  for (const sd of sides) if (!sideSeen(d, sd[4], sd[5])) sticks(sd);
  inside?.(Q);
  for (const sd of sides) if (sideSeen(d, sd[4], sd[5])) sticks(sd);
  return Q;
}
function small(it, c) {          // small four-legged animal (coati, raccoon, opossum, armadillo, rabbit, fox, peccary), built along its heading
  const a = it.a, f = sizeOf(a), [scl0, tall0] = sizes(it), scl = scl0 * f, tall = tall0 * f, d = a.dir;
  if (a.inShelter && !a.dead) ctx.globalAlpha *= 0.3;    // hidden among the pines: barely visible
  shadow(it.x, it.y, 0.16);
  const L = c.len * 1.25 * f, Hh = c.tall * 0.625 * f, Wd = L * 0.42, zb = c.legs * f + Hh;   // half-length, half-height, half-width; body height
  const P = (u, v, z) => bodyPoint(it.x, it.y, d, u, v, z);
  const front = P(L, 0, zb), back = P(-L, 0, zb);
  if (!front || !back) return;
  const s = (front[0] - back[0]) / (2 * L * scl0);       // screen-x of its heading: ±1 in profile, 0 facing toward or away from the camera
  const headBehind = front[1] < back[1];                 // facing away from the camera: the head is drawn behind the body
  if (a.dead || stunned(a)) {                            // lying on its side
    ctx.beginPath(); if (!bodyEllipsoid(it.x, it.y, d, 0, 0, Hh * 0.8, L, Hh * 0.9, Wd)) return;
    if (a.dead) { ctx.globalAlpha *= 0.85; ctx.fillStyle = "#7d746a"; ctx.fill(); return; }   // dull
    ctx.fillStyle = c.torso; ctx.fill();
    const H = P(L * 0.95, Hh * 0.5, Hh * 0.8); if (!H) return;
    circle(H[0], H[1], scl * 0.05, c.head);
    const t = performance.now() / 1000;                  // stunned: little stars spinning over its head
    for (let k = 0; k < 3; k++) {
      const an = t * 3 + k * TAU / 3, sx = H[0] + Math.cos(an) * scl * 0.09, sy = H[1] - scl * 0.1 + Math.sin(an) * scl * 0.03;
      ctx.fillStyle = "#f7d046"; ctx.font = `${Math.max(8, scl * 0.09)}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("✦", sx, sy);
    }
    return;
  }
  const walkCycle = a.moving ? Math.sin(a.phase * 18) : 0;
  ctx.strokeStyle = c.dark; ctx.lineWidth = Math.max(1.2, scl * 0.035); ctx.lineCap = "round";
  for (const [uf, side, ph] of [[-0.55, 1, 1], [-0.55, -1, -1], [0.5, 1, -1], [0.5, -1, 1]]) {   // legs: back/front, left/right
    const top = P(uf * L, side * Wd * 0.55, zb), foot = P(uf * L + walkCycle * ph * 0.03 * f, side * Wd * 0.55, 0);
    if (top && foot) { ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(foot[0], foot[1]); ctx.stroke(); }
  }
  const T = P(-L * 0.9, 0, zb + Hh * 0.2), H = P(L * 0.95, 0, zb + Hh * 0.3 - (a.action ? Hh * 0.8 : 0));   // lowers its head when eating or drinking
  const tail = () => T && c.tail(T[0], T[1], s, scl, tall);
  const head = () => {
    if (!H) return;
    circle(H[0], H[1], scl * 0.05, c.head);
    circle(H[0] - s * scl * 0.02, H[1] - scl * 0.045, scl * 0.018, c.dark);   // ear
    c.face(H[0] + s * scl * 0.03, H[1], s, scl);
  };
  // a cross-section of the body at u = uf × length, from angle `from` to `to` (0: its right side, π/2: the top, π: its left side)
  const ring = (uf, from = 0, to = Math.PI) => { for (let k = 0; k <= 12; k++) {
    const t = from + (to - from) * k / 12, q = P(uf * L, -Math.cos(t) * Wd * 1.02, zb + Math.sin(t) * Hh * 1.02);
    if (q) k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
  } };
  if (headBehind) head(); else tail();
  ctx.beginPath(); if (bodyEllipsoid(it.x, it.y, d, 0, 0, zb, L, Wd, Hh)) { ctx.fillStyle = c.torso; ctx.fill(); }
  c.shell?.(ring, scl);
  if (headBehind) tail(); else head();
}
function fishSilhouette(x, y, d, beat, sz, color, alpha) {   // body and tail of a fish seen from above, under the water
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.beginPath(); groundEllipse(x, y, 0.26 * sz, 0.09 * sz, d); ctx.fillStyle = color; ctx.fill();
  const tail = [[-0.24, 0], [-0.42, 0.12], [-0.42, -0.12]].map(([u, v]) => {
    const c = Math.cos(d + beat), s = Math.sin(d + beat);
    return project(x - Math.cos(d) * 0.24 * (sz - 1) + u * sz * c - v * sz * s, y - Math.sin(d) * 0.24 * (sz - 1) + u * sz * s + v * sz * c);
  });
  if (tail.every(Boolean)) { ctx.beginPath(); tail.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.fill(); }
  ctx.restore();
}
const fruitColor = i => ["#e5534b", "#f0a030", "#e5534b", "#f7d046"][Math.floor(hash(i, 66) * 4)];
function flames(x, y, wide, tall, t, sem) {          // animated flames (campfire, bonfire)
  for (const [k, color, f] of [[0, "#e74c3c", 1], [1, "#f39c12", 0.75], [2, "#ffe08a", 0.45]]) {
    const h = tall * f * (0.85 + Math.sin(t * 11 + sem + k) * 0.12), w = wide * 0.22 * f;
    const side = Math.sin(t * 7 + k * 2 + sem) * w * 0.25;
    ctx.beginPath(); ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 0.9, y - h * 0.55, x + side, y - h);
    ctx.quadraticCurveTo(x + w * 0.9, y - h * 0.55, x + w, y); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  }
}
function circle(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, Math.max(r, 0.5), 0, TAU); ctx.fillStyle = color; ctx.fill(); }
// signs of wear on something built (its `wear` goes from 0, new, to 1, broken): dark cracks that grow with it
function wearCracks(it, o) {
  const w = o.wear || 0; if (w < 0.35 || !it.p) return;
  const scl = cam.zoom * it.p[2], n = Math.round((w - 0.35) * 10);
  ctx.save(); ctx.strokeStyle = `rgba(40,25,10,${0.35 + w * 0.4})`; ctx.lineWidth = Math.max(1, scl * 0.015);
  for (let k = 0; k < n; k++) {
    const x = it.p[0] + (hash(o.sem, 900 + k) - 0.5) * scl * 0.3, y = it.p[1] - hash(o.sem, 920 + k) * scl * 0.35;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(o.sem, 940 + k) - 0.5) * scl * 0.1, y + scl * 0.06); ctx.stroke();
  }
  ctx.restore();
}
// ---- wind: one direction for the whole valley; it turns now and then (about 3 times a day) and blows harder in autumn and winter
const WIND_SEASON = [0.55, 0.4, 1, 0.8];             // strength by season (spring, summer, autumn, winter)
let frameWind = { dir: 0, strength: 0 };
function updateWind() {
  const d = gameDay() * 3, k = Math.floor(d), f = d - k, s = f * f * (3 - 2 * f);
  const a0 = hash(k, 990) * TAU, a1 = hash(k + 1, 990) * TAU, da = ((a1 - a0 + 3 * Math.PI) % TAU) - Math.PI;
  frameWind = { dir: a0 + da * s, strength: WIND_SEASON[seasonIndex()] * (0.45 + 0.55 * lerp(hash(k, 991), hash(k + 1, 991), s)) };
}
// how much something at `it` bends sideways on the screen right now (in drawing widths): always toward the wind, with gusts
function windBend(it) {
  const p = it.p, q = project(it.x + Math.cos(frameWind.dir) * 0.5, it.y + Math.sin(frameWind.dir) * 0.5);
  if (!p || !q) return 0;
  const across = (q[0] - p[0]) / (cam.zoom * p[2] * 0.5), t = performance.now() / 1000;
  const gust = 0.6 + 0.4 * Math.sin(t * 1.3 + it.x * 0.25 + it.y * 0.18) * Math.sin(t * 0.47 + it.y * 0.1);
  return across * frameWind.strength * gust;
}
