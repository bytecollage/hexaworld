// =====================================================================================
//  DRAWING
// =====================================================================================
let hover = -1;
// the house or chest under the mouse: drawn brighter with a warm glow, so you know a click opens it
const hoverTarget = () => hover < 0 || player.inside ? null : world.houseAt?.get(hover) || objs(hover).find(o => o.type === "chest") || null;
const BACKGROUND = [16, 19, 23];

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function visibleRegion() {
  const ci = Math.cos(cam.tilt * Math.PI / 180), si = Math.sin(cam.tilt * Math.PI / 180);
  const horizon = si > 0.01 ? H * 0.55 - cam.D * ci / si : -Infinity;
  const upper = Math.max(0, horizon + 40);
  const points = [[0, upper], [W, upper], [0, H], [W, H], [W / 2, upper]].map(p => unproject(...p)).filter(Boolean);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of points) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const L = Math.min(3 * Math.max(W, H) / cam.zoom, 120);
  return [Math.max(x0, cam.tx - L) - 2, Math.min(x1, cam.tx + L) + 2, Math.max(y0, cam.ty - L) - 2, Math.min(y1, cam.ty + L) + 2];
}
const HEX_UNIT = CORNERS.map(([x, y]) => [x / CELL_R, y / CELL_R]);   // corners of a hexagon of radius 1
const fogOf = k => Math.min(1, Math.max(0, (0.62 - k) / 0.4));

function draw() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0c0e12"); g.addColorStop(1, "#1a1f26");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (cloudCover() >= 0.97) {                       // only clouds can be seen: the world is not drawn (it is the costliest view)
    drawClouds(); drawDarkness();
    $("needle").style.transform = `rotate(${-cam.rot}deg)`;
    if ($("minimap").classList.contains("visible")) drawMinimap();
    return;
  }

  updateWind();
  const [x0, x1, y0, y1] = visibleRegion();
  const r0 = Math.floor(y0 / (1.5 * CELL_R)) - 1, r1 = Math.ceil(y1 / (1.5 * CELL_R)) + 1;
  const edges = [], flats = [], lows = [];
  let standing = [];
  const showEdge = $("edge").checked, showElements = $("elements").checked;
  ctx.lineJoin = "round";

  const groundCells = [];
  for (let r = r0; r <= r1; r++) {
    const q0 = Math.floor(x0 / (SQ3 * CELL_R) - r / 2) - 1, q1 = Math.ceil(x1 / (SQ3 * CELL_R) - r / 2) + 1;
    for (let q = q0; q <= q1; q++) {
      const [cx, cy] = toPixel(q, r);
      const center = project(cx, cy);
      if (!center || center[2] < 0.22) continue;
      if (center[0] < -cam.zoom * 3 || center[0] > W + cam.zoom * 3 || center[1] < -cam.zoom * 3 || center[1] > H + cam.zoom * 3) continue;
      // corners from the local (affine) projection around the center: 3 projections per cell instead of 7
      const pu = project(cx + CELL_R, cy), pv = project(cx, cy + CELL_R);
      if (!pu || !pv) continue;
      const ux = (pu[0] - center[0]) * 1.03, uy = (pu[1] - center[1]) * 1.03, vx = (pv[0] - center[0]) * 1.03, vy = (pv[1] - center[1]) * 1.03;
      const pts = HEX_UNIT.map(([ex, ey]) => [center[0] + ex * ux + ey * vx, center[1] + ex * uy + ey * vy, center[2]]);

      const [cq, cr] = canon(q, r), i = world.index.get(cq * 100000 + cr);
      const fog = fogOf(center[2]);
      groundCells.push({ i, center, pts, fog });       // filled after the loop, lowest terrain first (smooth borders)

      if (i === hover) edges.push({ type: "hover", x: cx, y: cy });
      if (showEdge) {
        const oq = q - cq, or = r - cr;
        for (let k = 0; k < 6; k++) {
          const nq = q + DIRS[k][0], nr = r + DIRS[k][1], [aq, ar] = canon(nq, nr);
          if (nq - aq !== oq || nr - ar !== or) edges.push({ a: pts[k], b: pts[(k + 1) % 6], fog });
        }
      }
      // fixed elements of this cell (in this copy of the world)
      if (showElements && center[2] > 0.3) for (const o of objs(i)) {
        const item = { type: o.type, x: cx + o.ox, y: cy + o.oy, i: o.sem, o, fog };
        (DEF[o.type]?.layer === "flat" ? flats : LOW.has(o.type) ? lows : standing).push(item);
        if (DEF[o.type]?.leaf && DRAW[DEF[o.type].leaf]) flats.push({ ...item, type: DEF[o.type].leaf });   // e.g. the lotus sits on a water lily leaf
      }
      const y = showElements && world.outcropAt[i] >= 0 && world.outcrops[world.outcropAt[i]];
      if (y && y.anchor === i && center[2] > 0.26) standing.push({ type: y.type, x: cx + y.ox, y: cy + y.oy, i, outcropAt: y, fog });
    }
  }
  drawGround(groundCells);
  // animals (the copy closest to the camera)
  if (showElements) for (const a of world.animals) {
    const [x, y] = nearCamera(a.x, a.y), p = project(x, y);
    if (!p || p[2] < 0.3 || p[0] < -80 || p[0] > W + 80 || p[1] < -80 || p[1] > H + 80) continue;
    if (a.toRemove || (SPECIES[a.type].needs?.house && a.inShelter)) continue;      // inside the burrow
    const item = { type: a.type, x, y, a, fog: fogOf(p[2]) };
    (FLAT.has(a.type) ? flats : standing).push(item);
  }
  // flat layer: water lily leaves and fish under the water
  for (const it of flats) { ctx.globalAlpha = 1 - it.fog; DRAW[it.type]?.(it); }
  // low layer: flowers and stones (almost at ground level)
  for (const it of lows) { it.p = project(it.x, it.y); if (it.p) { ctx.globalAlpha = 1 - it.fog; DRAW[it.type]?.(it); } }
  ctx.globalAlpha = 1;
  for (const b of edges) {
    if (b.type === "hover") {
      ctx.beginPath(); groundEllipse(b.x, b.y, CELL_R * 0.85, CELL_R * 0.85, 0, 0, TAU, 32);   // the cell under the mouse: a soft light circle
      ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(b.a[0], b.a[1]); ctx.lineTo(b.b[0], b.b[1]);
      ctx.strokeStyle = `rgba(227,179,65,${0.9 * (1 - b.fog)})`; ctx.lineWidth = 2.5 * Math.min(b.a[2], 1.6); ctx.stroke();
    }
  }
  drawRoute();
  drawPlacementPreview();
  drawHoverTarget();
  // standing layer: trees, animals and character, back to front
  if (player.i >= 0 && !player.dead && !player.sleeping && !player.inside) { const [x, y] = nearCamera(player.x, player.y); standing.push({ type: "character", x, y, fog: 0 }); }
  for (const it of standing) it.p = project(it.x, it.y);
  const sorted = standing.filter(it => it.p).sort((a, b) => a.p[1] - b.p[1]);
  rememberPickables(sorted);
  const lit = hoverTarget();
  sorted.forEach(it => {
    ctx.globalAlpha = 1 - it.fog;
    if (lit && it.o === lit) {                       // hovered house or chest: drawn, then drawn again added on top (brighter)
      DRAW[it.type]?.(it);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.4; noShadow = true;
      DRAW[it.type]?.(it); noShadow = false; ctx.restore(); return;
    }
    if (it.o?.fellAt !== undefined) {               // dead tree: rotates on its base until lying down, toward its own direction in the world
      const k = fall(it.o), kk = k * k, dir = hash(it.i, 310) * TAU, th = kk * Math.PI / 2 * 0.97;
      const [scl, tall] = sizes(it), p = it.p;
      // the drawing's "up" follows the trunk (from vertical to the fall direction on the ground) and its width
      // follows the ground across the trunk, so it lies toward the same place in the world from any camera turn
      const Pd = project(it.x + Math.cos(dir), it.y + Math.sin(dir)) || p, Ps = project(it.x - Math.sin(dir), it.y + Math.cos(dir)) || p;
      let sx = Ps[0] - p[0], sy = Ps[1] - p[1]; if (sx < 0) { sx = -sx; sy = -sy; }                 // keep it unmirrored
      const ax = Math.sin(th) * (Pd[0] - p[0]), ay = -Math.cos(th) * tall + Math.sin(th) * (Pd[1] - p[1]);
      const wx = lerp(scl, sx, kk), wy = lerp(0, sy, kk);
      if (k > 0.15) {                                                     // its shadow stretches along the trunk on the ground
        const len = (1 + 1.3 * growth(it.o)) * Math.sin(th);
        ctx.beginPath(); groundEllipse(it.x + Math.cos(dir) * len * 0.5, it.y + Math.sin(dir) * len * 0.5, len * 0.55, 0.3, dir);
        ctx.fillStyle = `rgba(0,0,0,${0.22 * k})`; ctx.fill();
      }
      ctx.save(); ctx.translate(p[0], p[1]); ctx.transform(wx / scl, wy / scl, -ax / tall, -ay / tall, 0, 0); ctx.translate(-p[0], -p[1]);
      ctx.filter = k >= 1 ? "saturate(0.55) brightness(0.85)" : "none";         // lying down, it loses color
      noShadow = k > 0.15; DRAW[it.type]?.(it); noShadow = false;
      ctx.restore();
    } else if (player.job?.tree && it.o === player.job.tree) {   // being chopped: the tree shakes with each axe blow
      const hit = Math.max(0, Math.sin(performance.now() / 1000 * 9 - 1.2));
      ctx.save(); ctx.translate(Math.sin(performance.now() / 30) * hit * Math.max(1, cam.zoom * it.p[2] * 0.03), 0);
      DRAW[it.type]?.(it); ctx.restore();
    } else if (it.o && TREES.has(it.o.type)) {      // standing trees sway with the wind, much less than the grass (palms a bit more)
      const k = windBend(it) * (DEF[it.o.type].tree.sway ?? 0.04);
      ctx.save(); ctx.translate(it.p[0], it.p[1]); ctx.transform(1, 0, -k, 1, 0, 0); ctx.translate(-it.p[0], -it.p[1]);
      const b = birth(it.o);
      if (b < SEEDLING_PART) seedling(it, b / SEEDLING_PART); else DRAW[it.type]?.(it);   // just sprouted: a seedling first
      ctx.restore();
    } else if (it.o?.bornAt !== undefined && birth(it.o) < SEEDLING_PART) seedling(it, birth(it.o) / SEEDLING_PART);   // a sown bush
    else DRAW[it.type]?.(it);
  });
  ctx.globalAlpha = 1;

  $("tilt").value = cam.tilt; $("rot").value = cam.rot;
  drawFlyingAxe();
  drawClouds();
  drawDarkness();
  $("needle").style.transform = `rotate(${-cam.rot}deg)`;
  if ($("minimap").classList.contains("visible")) drawMinimap();
}

// where the next click would put something (house, fence posts, fire, trap, cage, sapling, seed): green if it fits, red if not
function placementPreview() {
  if (!mouseWorld || player.inside) return null;
  const a = idxAt(...mouseWorld); if (a === undefined) return null;
  if (buildMode === "house") { const h = houseFootprint(a); return h ? { cells: h.cells, ok: true } : { cells: houseCells(a, houseTurn).cells, ok: false }; }
  if (buildMode === "fence") return fencePlan(a);
  if (buildMode === "gate" || buildMode === "chest" || PLACED_FIRES.includes(buildMode)) return { cells: [a], ok: canPlaceAt(a) };
  const t = inHand();
  if (!buildMode && (t === "trap" || t === "cage")) return { cells: [a], ok: canPlaceAt(a) };
  if (!buildMode && t?.startsWith("sapling_")) { const d = DEF[t.slice(8)]; return { cells: [a], ok: canPlaceAt(a) && terrain(a) === (d?.sapling?.ground || "grass") }; }
  if (!buildMode && seedOf(t) && canPlaceAt(a) && !isWater(terrain(a))) return { cells: [a], ok: terrain(a) === seedOf(t).ground };
  return null;
}
function drawHoverTarget() {                     // a warm outline on the cells of the hovered house or chest (cheap: no filters)
  const o = hoverTarget();
  canvas.classList.toggle("clickable", !!o);
  if (!o) return;
  ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(255,226,140,.95)"; ctx.fillStyle = "rgba(255,226,140,.22)";
  for (const c of o.cells || [o.i]) {
    const [cx, cy] = nearCamera(...toPixel(...world.cells[c])), pts = CORNERS.map(([ex, ey]) => project(cx + ex, cy + ey));
    if (pts.some(q => !q)) continue;
    ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function drawPlacementPreview() {
  const pv = placementPreview(); if (!pv) return;
  ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = pv.ok ? "#7fd47f" : "#e5534b"; ctx.fillStyle = pv.ok ? "rgba(127,212,127,.25)" : "rgba(229,83,75,.2)";
  for (const c of pv.cells) {
    const [cx, cy] = nearCamera(...toPixel(...world.cells[c])), pts = CORNERS.map(([ex, ey]) => project(cx + ex, cy + ey));
    if (pts.some(q => !q)) continue;
    ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// ---- picking what is under the mouse: what is drawn standing (trees, animals, builds) covers the ground behind it,
//      so a click on its drawing means it, not the ground cell the pointer happens to be over
let pickables = [];
function rememberPickables(sorted) {
  pickables = [];
  for (const it of sorted) {
    if (!(it.o || it.a) || it.fog > 0.6 || it.a?.alt > 0.5) continue;      // flying birds: not clickable here
    const [scl, tall] = sizes(it), o = it.o;
    let h = 0.45, w = 0.28;                                                 // in `tall` / `scl` units
    if (o && TREES.has(o.type) && o.fellAt === undefined) { h = 1.1 + 1.3 * growth(o); w = 0.4 + 0.15 * growth(o); }
    else if (o?.type === "house") continue;                                 // the house is picked by its cells
    else if (it.a) { h = BIG.has(it.a.type) || SPECIES[it.a.type].hunt ? 0.7 : 0.4; w = 0.35; }
    else if (o?.type === "chest") { h = 0.36; w = 0.3; }                      // a low box: just its drawing
    pickables.push({ it, x0: it.p[0] - scl * w, x1: it.p[0] + scl * w, y0: it.p[1] - tall * h, y1: it.p[1] + scl * 0.12 });
  }
}
function pickAt(sx, sy) {                     // { x, y, cell } on the ground for a screen point, honoring what is drawn on top
  const p = unproject(sx, sy), under = p ? idxAt(p[0], p[1]) : undefined;
  const hits = [];
  for (let k = pickables.length - 1; k >= 0; k--) {                         // front (bottom of the screen) first
    const b = pickables[k];
    if (sx < b.x0 || sx > b.x1 || sy < b.y0 || sy > b.y1) continue;
    hits.push(b);
  }
  // when boxes overlap (two chests side by side…), the one standing on the cell under the pointer wins; otherwise the front one
  const b = hits.find(b => b.it.o && b.it.o.i === under) || hits[0];
  if (b) {
    const x = b.it.a ? b.it.a.x : b.it.x, y = b.it.a ? b.it.a.y : b.it.y;
    return { x, y, cell: b.it.o ? b.it.o.i : idxAt(x, y), what: b.it };
  }
  return p ? { x: p[0], y: p[1], cell: under } : null;
}

// ---- smooth terrain borders: where cells of different terrain meet, the hexagon zigzag is rounded off (corner cutting).
//      At each corner shared by 3 cells, the corner of the highest terrain is cut with a curve and the corner of the lowest
//      is filled with one, so the border runs through the middle of each edge in soft arcs instead of along the hexagons.
const TERRAIN_LEVEL = { deep: 0, medium: 1, water: 2, sand: 3, grass: 4 };
const groundLevel = i => world.outcropAt[i] >= 0 ? 5 : TERRAIN_LEVEL[terrain(i)];   // outcrops: rocky ground above grass
function groundStyle(i, fog) {
  const [r, g, b] = world.colors[i];
  return `rgb(${r + (BACKGROUND[0] - r) * fog | 0},${g + (BACKGROUND[1] - g) * fog | 0},${b + (BACKGROUND[2] - b) * fog | 0})`;
}
function drawGround(cells) {
  const byLevel = [[], [], [], [], [], []];
  for (const c of cells) { c.l = groundLevel(c.i); byLevel[c.l].push(c); }
  for (const list of byLevel) for (const c of list) groundCell(c);
}
// one cell: its hexagon, with each corner either kept, cut (it is the only highest one there) or extended with lobes
// into the corners of its neighbors that the smooth border gives to it
function groundCell({ i, center, pts, fog, l }) {
  const nb = world.neighbors[i], lv = nb.map(groundLevel), mid = (A, B) => [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  ctx.fillStyle = groundStyle(i, fog);
  ctx.beginPath();
  if (lv.every(x => x === l)) {                        // inside a single terrain: the plain hexagon
    ctx.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < 6; k++) ctx.lineTo(pts[k][0], pts[k][1]); ctx.closePath(); ctx.fill(); return;
  }
  const lobes = [];
  let m = mid(pts[5], pts[0]); ctx.moveTo(m[0], m[1]);
  for (let k = 0; k < 6; k++) {
    const V = pts[k], mOut = mid(V, pts[(k + 1) % 6]), mIn = m, la = lv[(k + 5) % 6], lb = lv[k];
    if (l > la && l > lb) ctx.quadraticCurveTo(V[0], V[1], mOut[0], mOut[1]);   // the only highest: its corner is cut
    else { ctx.lineTo(V[0], V[1]); ctx.lineTo(mOut[0], mOut[1]); }
    const mR = [V[0] + (V[0] - center[0]) / 2, V[1] + (V[1] - center[1]) / 2];   // middle of the edge between the two neighbors
    // a neighbor that is the only highest there loses its corner, and one that is the only lowest gets it filled:
    // that corner is painted by the middle cell (or, with a tie, by the tied ones)
    if (la > l && la > lb && l >= lb) lobes.push([mIn, V, mR]);   // neighbor a is the only highest and this is the middle one
    if (lb > l && lb > la && l >= la) lobes.push([mOut, V, mR]);
    if (la < l && la < lb && l <= lb) lobes.push([mIn, V, mR]);   // neighbor a is the only lowest and this is the middle one
    if (lb < l && lb < la && l <= la) lobes.push([mOut, V, mR]);
    m = mOut;
  }
  ctx.closePath();
  for (const [m1, V, m2] of lobes) { ctx.moveTo(m1[0], m1[1]); ctx.lineTo(V[0], V[1]); ctx.lineTo(m2[0], m2[1]); ctx.quadraticCurveTo(V[0], V[1], m1[0], m1[1]); ctx.closePath(); }
  ctx.fill();
}
