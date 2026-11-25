// =====================================================================================
//  CHARACTER: walks through the world finding the best path (A*) and smooths it into straight lines
// =====================================================================================
const COST = { grass: 1, sand: 1.6, water: 2.6, medium: Infinity, deep: Infinity };
const SPEED = { grass: 4.5, sand: 2.8, water: 1.7, medium: 0, deep: 0 };   // cells per second (in water, wading)
const blockedForPlayer = i => i === undefined || world.outcropAt[i] >= 0 || !!world.houseAt?.has(i) || world.fenceAt?.get(i)?.type === "fence" ||
                              terrain(i) === "medium" || terrain(i) === "deep";   // gates let the character through
const player = { x: 0, y: 0, i: -1, route: [], destination: -1, step: 0, destPoint: null, gather: null, task: null, job: null, repeat: null };
let testTallGrass = null;                              // cell of the only tuft of the test map

function placeCharacter() {      // grassland cell closest to the center of the world
  player.route = []; player.destination = -1;
  const seen = new Set([idx(0, 0)]), tail = [idx(0, 0)];
  while (tail.length) {
    const i = tail.shift();
    const farFromTallGrass = !world.testMap || !testTallGrass || wrapDistance(i, testTallGrass) > cellsFor(6);   // test: do not scare the deer
    if (terrain(i) === "grass" && !objs(i).length && world.outcropAt[i] < 0 && farFromTallGrass) { player.i = i; break; }
    for (const j of world.neighbors[i]) if (!seen.has(j)) { seen.add(j); tail.push(j); }
  }
  [player.x, player.y] = toPixel(...world.cells[player.i]);
  cam.tx = player.x; cam.ty = player.y;
}

function aStar(start, end) {
  if (blockedForPlayer(end)) return null;
  const g = new Map([[start, 0]]), previous = new Map(), closed = new Set();
  const mound = [[wrapDistance(start, end), start]];
  const climb = () => { let k = mound.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (mound[p][0] <= mound[k][0]) break; [mound[p], mound[k]] = [mound[k], mound[p]]; k = p; } };
  const take = () => {
    const top = mound[0], lastT = mound.pop();
    if (mound.length) {
      mound[0] = lastT; let k = 0;
      for (;;) { const a = 2 * k + 1, b = a + 1; let m = k;
        if (a < mound.length && mound[a][0] < mound[m][0]) m = a;
        if (b < mound.length && mound[b][0] < mound[m][0]) m = b;
        if (m === k) break; [mound[m], mound[k]] = [mound[k], mound[m]]; k = m; }
    }
    return top;
  };
  while (mound.length) {
    const [, a] = take();
    if (a === end) { const way = [a]; while (previous.has(way[0])) way.unshift(previous.get(way[0])); return way; }
    if (closed.has(a)) continue;
    closed.add(a);
    for (const b of world.neighbors[a]) {
      if (blockedForPlayer(b) || closed.has(b)) continue;
      const c = COST[terrain(b)];
      const ng = g.get(a) + c;
      if (ng < (g.get(b) ?? Infinity)) { g.set(b, ng); previous.set(b, a); mound.push([ng + wrapDistance(b, end), b]); climb(); }
    }
  }
  return null;
}

const PLAYER_RADIUS = 0.3;
const terrainAt = (x, y) => terrain(idxAt(x, y));
function lineClear(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  if (L < 1e-6) return true;
  const nx = -dy / L * PLAYER_RADIUS, ny = dx / L * PLAYER_RADIUS, steps = Math.ceil(L / 0.2);
  for (let k = 0; k <= steps; k++) {
    const x = a.x + dx * k / steps, y = a.y + dy * k / steps, c = idxAt(x, y);
    if (blockedForPlayer(c) || blockedForPlayer(idxAt(x + nx, y + ny)) || blockedForPlayer(idxAt(x - nx, y - ny))) return false;
  }
  return true;
}
function lineCost(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), steps = Math.max(1, Math.ceil(L / 0.2));
  let c = 0;
  for (let k = 0; k < steps; k++) c += COST[terrainAt(a.x + dx * (k + 0.5) / steps, a.y + dy * (k + 0.5) / steps)];
  return c * L / steps;
}
function smoothPath(pts) {           // "pulling the string": long straight lines that do not step on water and are not slower
  const accum = [0];
  for (let k = 1; k < pts.length; k++) accum.push(accum[k - 1] + lineCost(pts[k - 1], pts[k]));
  const outside = [pts[0]], n = pts.length - 1;
  let a = 0;
  while (a < n) {
    let best = a + 1;
    for (let j = a + 2; j <= n; j++) {
      if (!lineClear(pts[a], pts[j])) break;
      if (lineCost(pts[a], pts[j]) <= accum[j] - accum[a] + 1e-6) best = j;
    }
    outside.push(pts[best]); a = best;
  }
  return outside;
}

function walkTo(destination, point = null) {
  if (destination === undefined || destination < 0) return;
  player.gather = hasHarvestable(destination) ? destination : null;   // if there is something to gather, it gathers it on arrival
  if (player.gather !== null && destination === player.i && !player.route.length) { harvestAt(destination); player.gather = null; return; }
  const way = aStar(idxAt(player.x, player.y), destination);
  if (!way) {
    notify(world.outcropAt[destination] >= 0 ? "There is a rock there: I cannot pass"
      : isWater(terrain(destination)) ? "The water is too deep for me there" : "I cannot find a way there");
    return;
  }
  let [q, r] = toHex(player.x, player.y);
  const pts = [{ x: player.x, y: player.y }];
  for (let k = 1; k < way.length; k++) {
    const d = world.neighbors[way[k - 1]].indexOf(way[k]);
    q += DIRS[d][0]; r += DIRS[d][1];
    const [x, y] = toPixel(q, r);
    pts.push({ x, y });
  }
  if (point) { const [cx, cy] = toPixel(q, r); pts.push({ x: cx + point.dx, y: cy + point.dy }); }
  const route = $("straightLine").checked ? smoothPath(pts) : pts;
  player.route = route.slice(1).filter((p, k, arr) => k === 0 || Math.hypot(p.x - arr[k - 1].x, p.y - arr[k - 1].y) > 1e-6);
  player.destination = destination; player.destPoint = point;
}

function normalizeCharacter() {
  const [q, r] = toHex(player.x, player.y), [cq, cr] = canon(q, r);
  if (cq === q && cr === r) return;
  const [ox, oy] = toPixel(q - cq, r - cr);
  player.x -= ox; player.y -= oy;
  for (const p of player.route) { p.x -= ox; p.y -= oy; }
}

function updateCharacter(dt) {
  if (player.job) { updateWork(dt); return; }          // working: still until finished
  if (!player.route.length) { if (player.task) finishTask(); return; }
  let remaining = dt;
  while (remaining > 0 && player.route.length) {
    const nextPt = player.route[0];
    const dx = nextPt.x - player.x, dy = nextPt.y - player.y, d = Math.hypot(dx, dy);
    const here = terrainAt(player.x, player.y);
    if (d > 1e-6 && !isWater(here)) {
      const m = Math.min(d, 0.5);
      if (blockedForPlayer(idxAt(player.x + dx / d * m, player.y + dy / d * m))) { player.route = []; walkTo(player.destination, player.destPoint); return; }
    }
    const v = (SPEED[here] || SPEED.sand) * SQ3, av = v * remaining;
    if (av >= d) { player.x = nextPt.x; player.y = nextPt.y; player.route.shift(); remaining -= d / v; }
    else { player.x += dx / d * av; player.y += dy / d * av; remaining = 0; }
    normalizeCharacter();
    player.i = idxAt(player.x, player.y);
  }
  player.step += dt;
  if (!player.route.length && player.task) finishTask();
  if (!player.route.length && player.gather !== null && player.gather !== undefined && !player.job) {   // arrived: gathers (if there is no other task)
    if (player.i === player.gather || world.neighbors[player.i]?.includes(player.gather)) harvestAt(player.gather);
    player.gather = null;
  }
}

function drawRoute() {
  if (player.i < 0 || !player.route.length) return;
  const [cx, cy] = nearCamera(player.x, player.y), ox = cx - player.x, oy = cy - player.y;
  const pts = [{ x: player.x, y: player.y }, ...player.route].map(p => project(p.x + ox, p.y + oy));
  ctx.save();
  ctx.setLineDash([7, 7]); ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.beginPath();
  let expanded = false;
  for (const p of pts) { if (!p) { expanded = false; continue; } expanded ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); expanded = true; }
  ctx.stroke(); ctx.restore();
  const end = player.route[player.route.length - 1], [q, r] = toHex(end.x + ox, end.y + oy), [hx, hy] = toPixel(q, r);   // the destination cell
  const hex = CORNERS.map(([ex, ey]) => project(hx + ex, hy + ey));
  if (hex.some(p => !p)) return;
  ctx.beginPath(); hex.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
}
