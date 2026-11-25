// =====================================================================================
//  OUTCROPS: rock mounds and monoliths over 4 cells (their drawings live in content/world/)
// =====================================================================================

// which outcrop feature to build: the first registered one 55% of the time, otherwise the second (rock mound / monolith)
function outcropKind(attempt) {
  const kinds = Registry.features.filter(d => d.outcrop).map(d => d.id);
  return kinds.length > 1 && hash(attempt, 82) >= 0.55 ? kinds[1] : kinds[0];
}
// cells within `radius` grid steps of cell a (a small hexagon of cells around it)
function cellsAround(a, radius) {
  const out = [a], seen = new Set([a]); let layer = [a];
  for (let r = 0; r < radius; r++) {
    const next = [];
    for (const c of layer) for (const j of world.neighbors[c]) if (j !== undefined && !seen.has(j)) { seen.add(j); next.push(j); out.push(j); }
    layer = next;
  }
  return out;
}
const OUTCROP_RADIUS = 2;                          // grid steps: about the 4 reference cells of the old rhombus
function placeOutcrops() {
  // a small hexagon of cells around an anchor. All grassland, far from water and apart from each other.
  const n = world.cells.length;
  const grass = []; for (let i = 0; i < n; i++) if (world.base[i] === "grass" && world.toWater[i] >= 3) grass.push(i);
  const target = world.testMap ? 1 : Math.max(6, Math.round(grass.length / (450 * CELL_AREA)));
  const free = i => world.base[i] === "grass" && world.toWater[i] >= 2 && world.outcropAt[i] < 0;
  for (let attempt = 0; attempt < target * 40 && world.outcrops.length < target; attempt++) {
    const a = grass[Math.floor(hash(attempt, 80) * grass.length)], k = Math.floor(hash(attempt, 81) * 6);
    const [ax, ay] = toPixel(...world.cells[a]), ph = hash(attempt, 83) * TAU;
    const cells = cellsAround(a, OUTCROP_RADIUS + 1).filter(c => {     // a roundish, irregular patch (not a hexagon)
      const [x, y] = toPixel(...world.cells[c]), [dx, dy] = wrapDelta(x - ax, y - ay), ang = Math.atan2(dy, dx);
      return Math.hypot(dx, dy) <= 1.3 + 0.3 * Math.sin(ang * 2 + ph) + 0.2 * Math.sin(ang * 3 - ph * 1.7);
    });
    if (!cellsAround(a, OUTCROP_RADIUS + 2).every(free)) continue;    // a free ring around it, too
    const id = world.outcrops.length;
    world.outcrops.push({ id, cells, anchor: a, ox: 0, oy: 0, type: outcropKind(attempt), turn: k });
    for (const i of cells) world.outcropAt[i] = id;
  }
}
