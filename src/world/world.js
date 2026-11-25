// =====================================================================================
//  WRAPPING WORLD: a big hexagon of radius N that tiles the plane by repeating itself.
//  Leaving through one side = entering through the opposite one. Every cell has 6 neighbors.
// =====================================================================================
const RADIUS_MIN = 200, RADIUS_MAX = 375, TEST_RADIUS = 60;   // in grid cells (CELL_SCALE per reference cell)
const world = { N: RADIUS_MIN, seed: 1 + Math.floor(Math.random() * 1e9), cells: [], index: new Map(),
                mirrors: [], base: [], painted: new Map(), colors: [], objects: [], animals: [], testMap: false };

function computeMirrors(N) {          // centers of the 6 neighboring copies
  let [a, b, c] = [2 * N + 1, -N - 1, -N];
  const m = [];
  for (let i = 0; i < 6; i++) { m.push([a, b]); [a, b, c] = [-c, -a, -b]; }
  return m;
}
function canon(q, r) {                 // cell of the original world that corresponds to (q,r)
  const N = world.N;
  while (dist(q, r) > N) {
    let best = null, md = Infinity;
    for (const [mq, mr] of world.mirrors) { const d = dist(q - mq, r - mr); if (d < md) { md = d; best = [mq, mr]; } }
    q -= best[0]; r -= best[1];
  }
  return [q, r];
}
const idx = (q, r) => { const [a, b] = canon(q, r); return world.index.get(a * 100000 + b); };
const idxAt = (x, y) => idx(...toHex(x, y));
// Difference between two points of the plane along the shortest path (taking into account that the world wraps around)
function wrapDelta(dx, dy) {
  const [q, r] = toHex(dx, dy), [cq, cr] = canon(q, r), [ox, oy] = toPixel(q - cq, r - cr);
  return [dx - ox, dy - oy];
}
function wrapDistance(a, b) {
  const [q1, r1] = world.cells[a], [q2, r2] = world.cells[b];
  return dist(...canon(q2 - q1, r2 - r1));
}
