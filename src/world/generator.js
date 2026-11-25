function generate() {
  const N = world.N;
  world.mirrors = computeMirrors(N);
  world.cells = []; world.index.clear();
  for (let q = -N; q <= N; q++) for (let r = -N; r <= N; r++) if (dist(q, r) <= N) {
    world.index.set(q * 100000 + r, world.cells.length);
    world.cells.push([q, r]);
  }
  const n = world.cells.length;
  world.neighbors = world.cells.map(([q, r]) => DIRS.map(([dq, dr]) => idx(q + dq, r + dr)));
  world.nbFlat = null;

  // --- shape: continent in the center + two islands in open sea
  const coarse = smoothNoise(1, 10), fine = smoothNoise(2, 3);
  const center = idx(0, 0);
  const a1 = hash(1, 70) * TAU, a2 = a1 + Math.PI * (0.55 + 0.9 * hash(2, 70));
  const islands = [a1, a2].map(a => idxAt(Math.cos(a) * N * 0.8 * SQ3 * CELL_R, Math.sin(a) * N * 0.8 * SQ3 * CELL_R));
  const Rc = N * 0.52, Ri = Math.max(cellsFor(4), N * 0.07);   // in grid steps, like wrapDistance
  const val = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const vc = 1 - wrapDistance(i, center) / Rc + (coarse[i] - 0.5) * 1.1 + (fine[i] - 0.5) * 0.3;
    const vi = Math.max(...islands.map(c => 1 - wrapDistance(i, c) / Ri + (fine[i] - 0.5) * 0.6));
    val[i] = Math.max(vc, vi);
  }
  // keep only the continent and the two islands (drop loose islets)
  let land = i => val[i] > 0;
  const comp = components(land);
  const keep = new Set([comp[center], ...islands.map(c => comp[c])]);
  const isLand = Uint8Array.from({ length: n }, (_, i) => land(i) && keep.has(comp[i]) ? 1 : 0);

  // --- classification: beaches next to water, shallow water along the coast (and lakes)
  const toWater = distances(i => !isLand[i]), toLand = distances(i => isLand[i]);
  const sea = components(i => !isLand[i]);
  const seaId = (() => { const c = {}; for (let i = 0; i < n; i++) if (!isLand[i]) c[sea[i]] = (c[sea[i]] || 0) + 1;
                         return +Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; })();
  // distance bands on a hex grid come out as hexagons (long straight edges): a wobble noise bends them
  const wobble = smoothNoise(6, 0.6), seaSteps = stepDistances(i => isLand[i]);
  world.base = Array.from({ length: n }, (_, i) => {
    if (isLand[i]) return toWater[i] === 1 || (toWater[i] === 2 && fine[i] > 0.6) ? "sand" : "grass";
    const d = seaSteps[i] / CELL_SCALE + (wobble[i] - 0.5) * 3;         // distance to land, in reference cells, bent
    if (sea[i] !== seaId || toLand[i] <= 1 || d <= 2) return "water";   // lakes and the strip along the coast
    return d <= 5 + fine[i] * 3 ? "medium" : "deep";                     // then medium depth and, further out to sea, ocean
  });
  if (world.testMap) {                              // test map: a guaranteed lake near the center
    const l = idx(cellsFor(5), cellsFor(-3)), [lq, lr] = world.cells[l];
    for (let i = 0; i < n; i++) if (dist(...canon(world.cells[i][0] - lq, world.cells[i][1] - lr)) <= cellsFor(1)) world.base[i] = "water";
  }
  world.fine = fine;
  world.painted.clear();
  resetClock();
  world.outcropAt = new Int32Array(n).fill(-1);  // cell -> outcrop occupying it (-1: none)
  world.outcrops = [];
  recomputeDistances();

  $("radius").textContent = N;
  $("cellCount").textContent = `${n.toLocaleString("en")} cells`;
  for (const b of document.querySelectorAll(".stepper button")) {
    const v = N + +b.dataset.delta; b.disabled = v < RADIUS_MIN || v > RADIUS_MAX;
  }
  placeElements();
  world.colors = world.cells.map((_, i) => colorOf(i));   // rocky ground under the outcrops
  placeAnimals();
  placeCharacter();
  $("follow").checked = true;                          // a new world starts with the camera following the character
  renderMinimapBase();
}

function recomputeDistances() {        // after generating or painting: distances to water/land and colors
  world.toWater = distances(i => isWater(terrain(i)));
  world.toLand = distances(i => !isWater(terrain(i)));
  computeLakes();
  world.colors = world.cells.map((_, i) => colorOf(i));
}
function computeLakes() {               // lake = water not connected to the sea (the largest body of water)
  const n = world.cells.length, water = i => isWater(terrain(i)), comp = components(water), sz = {};
  for (let i = 0; i < n; i++) if (water(i)) sz[comp[i]] = (sz[comp[i]] || 0) + 1;
  const sea = Object.keys(sz).length ? +Object.entries(sz).sort((a, b) => b[1] - a[1])[0][0] : -2;
  world.lake = new Uint8Array(n); world.lakeShore = new Uint8Array(n); world.lakeEdge = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (water(i) && comp[i] !== sea) world.lake[i] = 1;
  // shore: the land strip next to a lake (as wide as the beach around it, 2 steps); edge: the cells touching the water (to drink)
  const toLake = stepDistances(i => world.lake[i] === 1);
  for (let i = 0; i < n; i++) {
    if (water(i) || (world.outcropAt && world.outcropAt[i] >= 0)) continue;
    if (toLake[i] >= 1 && toLake[i] <= 2) world.lakeShore[i] = 1;
    if (toLake[i] === 1) world.lakeEdge[i] = 1;
  }
}

function colorOf(i) {
  if (world.outcropAt[i] >= 0) {                                                 // rocky ground of an outcrop
    const v = (hash(i, 9) - 0.5) * 14;
    return [128 + v, 120 + v, 104 + v].map(x => Math.round(x));
  }
  const t = terrain(i), [r, g, b] = TERRAIN_COLOR[t], dT = world.toLand[i], dA = world.toWater[i], f = world.fine[i];
  let v = 0;
  if (t === "water") v = 14 - Math.min(dT, 4) * 6 + (f - 0.5) * 8;          // lighter next to the shore
  else if (t === "medium") v = 8 - (dT - 3) * 2.5 + (f - 0.5) * 6;
  else if (t === "deep") v = 6 - Math.min(dT - 6, 14) * 1.8;           // darker further out to sea
  else if (t === "sand") v = (f - 0.5) * 14;
  else v = 6 - Math.min(dA, 12) * 1.4 + (f - 0.5) * 22;                    // somewhat darker inland
  v += (hash(i, 9) - 0.5) * 8;
  return [r + v, g + v, b + v].map(x => Math.max(0, Math.min(255, Math.round(x))));
}
