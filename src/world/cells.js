// ---- Each cell holds a single element (a pine, a tall grass tuft, a fruit, a nest, a burrow…), so a click on a cell
//      always means one thing. The element sits near the center of its cell, slightly jittered so rows do not look aligned.
const MAX_PER_CELL = 1, NONE = Object.freeze([]);
const objs = i => world.objects[i] || NONE;
const hasType = (i, type) => objs(i).some(o => o.type === type);
const howMany = (i, type) => objs(i).reduce((n, o) => n + (o.type === type), 0);
const freeCell = i => i !== undefined && objs(i).length < MAX_PER_CELL;
function addObject(i, type, extra = {}) {
  if (!DEF[type]) return null;                                 // not registered (removed from content/registry.js)
  if (type !== "house" && world.houseAt?.has(i)) return null;   // nothing grows or falls inside the house
  const l = world.objects[i] || (world.objects[i] = []);
  if (l.length >= MAX_PER_CELL) return null;
  const sem = world.objSeed++;
  const ox = (hash(sem, 61) - 0.5) * 0.35 * CELL_R, oy = (hash(sem, 62) - 0.5) * 0.3 * CELL_R;
  const o = { type, i, sem, ox, oy, ...extra };
  l.push(o);
  return o;
}
// puts an element in cell i or, if it is taken, in a free walkable cell around it (rings up to `rings` steps away)
function addAround(i, type, extra = {}, rings = 2) {
  if (freeCell(i) && !blocked(i)) return addObject(i, type, extra);
  const seen = new Set([i]); let layer = [i];
  for (let r = 0; r < rings; r++) {
    const next = [];
    for (const c of layer) for (const j of world.neighbors[c]) if (j !== undefined && !seen.has(j)) { seen.add(j); next.push(j); }
    const salt = world.objSeed;
    next.sort((a, b) => hash(a, salt) - hash(b, salt));
    for (const j of next) if (freeCell(j) && !blocked(j)) return addObject(j, type, extra);
    layer = next;
  }
  return null;
}
function removeObject(o) {
  const l = world.objects[o.i]; if (!l) return;
  const k = l.indexOf(o); if (k >= 0) l.splice(k, 1);
  o.removed = true;
}
function clearCell(i) { for (const o of [...objs(i)]) removeObject(o); }
