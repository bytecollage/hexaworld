function smoothNoise(layer, passes) {     // smoothed noise over the world graph (no seams when wrapping)
  // `passes` is given in reference cells: a finer grid needs CELL_AREA times more passes for blobs of the same size
  const n = world.cells.length, nb = flatNeighbors();
  let v = Float32Array.from({ length: n }, (_, i) => hash(i, layer)), w = new Float32Array(n);
  for (let p = 0, total = Math.round(passes * CELL_AREA); p < total; p++) {
    for (let i = 0, b = 0; i < n; i++, b += 6) w[i] = (v[i] * 2 + v[nb[b]] + v[nb[b + 1]] + v[nb[b + 2]] + v[nb[b + 3]] + v[nb[b + 4]] + v[nb[b + 5]]) / 8;
    [v, w] = [w, v];
  }
  let lo = Infinity, hi = -Infinity;
  for (const x of v) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
  return v.map(x => (x - lo) / (hi - lo || 1));
}

function components(belongs) {       // groups of connected cells that meet a condition
  const n = world.cells.length, comp = new Int32Array(n).fill(-1);
  let k = 0;
  for (let s = 0; s < n; s++) {
    if (comp[s] >= 0 || !belongs(s)) continue;
    const tail = [s]; comp[s] = k;
    while (tail.length) { const i = tail.pop(); for (const j of world.neighbors[i]) if (comp[j] < 0 && belongs(j)) { comp[j] = k; tail.push(j); } }
    k++;
  }
  return comp;
}

function flatNeighbors() {               // the 6 neighbors of every cell in one typed array (fast loops)
  if (world.nbFlat?.length === world.cells.length * 6) return world.nbFlat;
  const nb = new Int32Array(world.cells.length * 6);
  world.neighbors.forEach((l, i) => { for (let k = 0; k < 6; k++) nb[i * 6 + k] = l[k]; });
  return (world.nbFlat = nb);
}
function stepDistances(origin_) {       // multi-source BFS: grid steps to the nearest cell that meets `origin_`
  const n = world.cells.length, d = new Int16Array(n).fill(-1), tail = new Int32Array(n), nb = flatNeighbors();
  let len = 0;
  for (let i = 0; i < n; i++) if (origin_(i)) { d[i] = 0; tail[len++] = i; }
  for (let h = 0; h < len; h++) {
    const i = tail[h];
    for (let k = 0; k < 6; k++) { const j = nb[i * 6 + k]; if (d[j] < 0) { d[j] = d[i] + 1; tail[len++] = j; } }
  }
  return d;
}
function distances(origin_) {           // the same, in reference cells (rounded up): 1 = right next to it, as on the old grid
  const d = stepDistances(origin_);
  for (let i = 0; i < d.length; i++) if (d[i] > 0) d[i] = Math.ceil(d[i] / CELL_SCALE);
  return d;
}
