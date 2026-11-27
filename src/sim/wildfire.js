// =====================================================================================
//  WILDFIRE: a torch set to anything of plant origin (a tree, a bush, grass, flowers, branches, fruit…) starts a fire.
//  After a moment each burning thing lights others: a tree, every plant thing within 1 (reference) cell; grass, bushes
//  and flowers, only the cells touching theirs; things lying on the ground (branches, fruit…) burn but do not spread it.
//  It burns out leaving charcoal (adult trees 5, young ones 2). A lit campfire or bonfire can set fire to a plant in a
//  cell touching it. Animals caught by the flames: 60% escape, the rest burn (bones remain, as do
//  the bones of carcasses lying there). Animals nearby run away from it.
// =====================================================================================
const WILDFIRE = {
  burn: { tree: 14, small: 5 },                     // game seconds a thing burns (trees / the rest)
  spread: 2.5,                                      // game seconds after catching fire, it lights the cells around it
  escape: 0.6,                                      // share of the animals caught by the flames that get away
  scare: 6,                                         // reference cells: animals this close run away from a new flame
  charcoal: { adult: 5, young: 2 },                 // charcoal left by a burnt tree
  fromCampfire: 0.03,                               // chance per slow tick (0.5 s) that a lit fire sets a plant touching it on fire
};
// where a burning thing spreads the fire: trees within a reference cell, other plants to the touching cells, items nowhere
const spreadCells = o => TREES.has(o.type) ? cellsAround(o.i, cellsFor(1)) : DEF[o.type]?.kind === "flora" ? world.neighbors[o.i].filter(j => j !== undefined) : [];
// anything of plant origin on land: plants (flora) and plant items (those that burn on a campfire: `fuel`)
const flammable = o => !!o && !o.removed && !o.onFire && (DEF[o.type]?.kind === "flora" || FUEL[o.type] > 0) && !isWater(terrain(o.i));
const flammableAt = i => objs(i).find(flammable) || null;
const firePos = o => { const [cx, cy] = toPixel(...world.cells[o.i]); return [cx + (o.ox || 0), cy + (o.oy || 0)]; };
function ignite(o) {                                 // it catches fire; the animals there and around react
  o.onFire = { at: gameDay(), spread: false };
  (world.wildfire ||= []).push(o);
  const [x, y] = firePos(o);
  for (const a of world.animals) {
    if (a.toRemove || SPECIES[a.type].flies || AQUATIC.has(a.type)) continue;
    const d = Math.hypot(...wrapDelta(a.x - x, a.y - y)), here = d < SQ3;   // within a cell of the flames: caught by them
    if (here && a.dead) { leaveBones(a); continue; }  // a carcass in the flames: only its bones remain
    if (a.dead || a.dyingSince) { if (here) burnAnimal(a); continue; }
    if (here && rnd() >= WILDFIRE.escape) { burnAnimal(a); continue; }
    if (here || d < WILDFIRE.scare * SQ3) runFromFire(a, x, y);
  }
}
function runFromFire(a, x, y) {
  const e = SPECIES[a.type], away = wrapDelta(a.x - x, a.y - y);
  a.stunnedUntil = 0; a.action = null; a.eating = 0;
  if (e.hunt) { a.chaseTarget = null; evadeFrom(a, x, y, (WILDFIRE.scare + 2) * SQ3, 2, 10); }
  else fleeFrom(a, e, away, { x, y });
}
function burnAnimal(a) {
  recordDeath(a, "burned");
  leaveBones(a);
}
function leaveBones(a) {                             // the animal is gone; its bones stay on the ground (as a pile to gather)
  a.toRemove = true;
  const n = SPECIES[a.type].bones || 1;
  addAround(idxAt(a.x, a.y), "pile", { stack: { type: "bones", amount: n } }, 2);
}
function burnOut(o) {                                // burnt: charcoal for trees, scorched ground
  const i = o.i, tree = TREES.has(o.type);
  removeObject(o);
  if (tree) addAround(i, "pile", { stack: { type: "charcoal", amount: isAdult(o) ? WILDFIRE.charcoal.adult : WILDFIRE.charcoal.young } }, 1);
  const c = world.colors[i]; if (c) world.colors[i] = c.map(v => Math.round(v * 0.55));   // scorched
}
function updateWildfire() {                          // with the slow systems (every 0.5 s) and while skipping time
  for (const f of world.fires || []) {                // campfires and bonfires: a plant touching them may catch fire
    if (!burning(f)) continue;
    const near = world.neighbors[f.i].map(j => j === undefined ? null : flammableAt(j)).filter(o => o && DEF[o.type].kind === "flora");
    if (near.length && rnd() < WILDFIRE.fromCampfire) { ignite(near[Math.floor(rnd() * near.length)]); if (!simulating) notify(SAY.fireSpread); }
  }
  const list = world.wildfire; if (!list?.length) return;
  const now = gameDay();
  for (const o of [...list]) {
    if (o.removed) continue;
    const age = (now - o.onFire.at) * DAY_DURATION;
    if (!o.onFire.spread && age >= WILDFIRE.spread) {
      o.onFire.spread = true;
      for (const j of spreadCells(o)) { const n = flammableAt(j); if (n) ignite(n); }
    }
    if (age >= (TREES.has(o.type) ? WILDFIRE.burn.tree : WILDFIRE.burn.small)) burnOut(o);
  }
  world.wildfire = world.wildfire.filter(o => !o.removed);
}
function drawWildfire(items) {                       // flames over whatever is burning (after the scene, so they are on top)
  const t = performance.now() / 1000;
  for (const it of items) {
    const o = it.o; if (!o?.onFire || !it.p) continue;
    const [scl, tall] = sizes(it), tree = TREES.has(o.type) && o.fellAt === undefined;
    const k = Math.min(1, (gameDay() - o.onFire.at) * DAY_DURATION / 1.5);   // it flares up in a moment
    ctx.globalAlpha = 1 - (it.fog || 0);
    flames(it.p[0], it.p[1], scl * (tree ? 1.3 : 0.6) * k, tall * (tree ? 2.6 : 0.6) * k, t, o.sem || o.i);
    if (tree) flames(it.p[0] + scl * 0.12, it.p[1] - tall * 0.9, scl * 0.9 * k, tall * 1.6 * k, t + 1.7, (o.sem || o.i) + 3);   // in the crown too
  }
  ctx.globalAlpha = 1;
}
