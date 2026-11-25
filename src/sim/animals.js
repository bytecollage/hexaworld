// =====================================================================================
//  LIFE CYCLE OF ANIMALS, PREDATORS, BIRDS AND INSECTS
// =====================================================================================
function recordDeath(a, cause) {                    // statistics: deaths by species and cause
  const m = (world.deaths ||= {}); (m[a.type] ||= {}); m[a.type][cause] = (m[a.type][cause] || 0) + 1;
}
const ageOf = a => gameDay() - (a.born ?? 0);
function isAdultAnimal(a) {
  const e = SPECIES[a.type];
  return e.grows ? sizeOf(a) >= 1 : ageOf(a) >= (e.breed?.maturity ?? 10);
}
function weak(p) {                                     // easy prey: young, old, dying or very hungry
  const e = SPECIES[p.type];
  return (e.grows && sizeOf(p) < 0.85) || !!p.dyingSince || (p.life && ageOf(p) > p.life * 0.85) || (p.hunger || 0) > 1.5;
}
const still = p => !!(p.inShelter || p.stunnedUntil > gameDay() || p.sleeping || (p.restUntil || 0) > gameDay() || p.dyingSince);
const posOf = p => p.isNest ? (([x, y]) => [x + p.ox, y + p.oy])(toPixel(...world.cells[p.i])) : [p.x, p.y];
const distA = (a, p) => { const [x, y] = posOf(p); return Math.hypot(...wrapDelta(x - a.x, y - a.y)); };
function visibleTo(p, d) {                            // can predator d see and reach prey p?
  if (p.isNest) return !p.removed;
  if (p.dead || p.toRemove) return false;
  const at = SPECIES[p.type].needs;
  if (at?.house && p.inShelter) return false;            // in the burrow, safe
  if (at?.hidden && p.inShelter && !SPECIES[d.type].hunt?.findsHidden) return false;   // hidden in the forest: only the fox finds them
  if (SPECIES[d.type].hunt?.fishInShallowOnly && FISH.has(p.type) && terrain(idxAt(p.x, p.y)) !== "water") return false;
  return true;
}
function createAnimal(type, x, y, extra = {}) {         // creates an animal of any species with all its fields
  const e = SPECIES[type], nowDay = gameDay();
  if (!e) return null;                                   // not registered (removed from content/registry.js)
  const a = { type, sem: Math.floor(rnd() * 1e6), x, y, tx: 0, ty: 0, moving: false, wait: rnd() * 3, dir: rnd() * TAU,
              phase: rnd() * TAU, fleeing: false, born: nowDay, alt: 0 };
  if (e.needs) Object.assign(a, { thirst: rnd() * 0.9, hunger: rnd() * 0.9, goal: null, action: null, retry: 0, drinks: 0, meals: 0,
                                dead: false, shelter: -1, inShelter: false, relocateAt: nowDay + rnd() * 1.5 });
  if (e.hunt) Object.assign(a, { hunger: rnd() * 0.8, chaseTarget: null, eating: 0, restsUntil: 0, house: { x, y },
                                 alt: e.flies ? 1 : 0, dead: false });
  if (e.life) a.life = e.life.min + rnd() * (e.life.max - e.life.min);
  Object.assign(a, extra);
  if ((e.needs || e.hunt) && a.lastMeal === undefined) a.lastMeal = nowDay - a.hunger * (e.needs ? e.needs.hunger : e.hunt.cycle);
  world.animals.push(a);
  return a;
}
function wellFed(a) {                            // to breed: no strong hunger in the last 3 days
  const e = SPECIES[a.type];
  if (e.needs) return !(a.strongHunger > gameDay() - 3);
  if (e.hunt) return gameDay() - a.lastMeal < e.hunt.cycle * 1.3;
  return true;
}
function flowersNear(i, radius) {                        // flower tufts at `radius` cells or less
  const seenOnes = new Set([i]); let layer = [i], n = 0;
  for (let r = 0, R = radius * CELL_SCALE; r <= R; r++) {   // radius in reference cells
    const nextPt = [];
    for (const c of layer) { n += howMany(c, "flowers"); for (const j of world.neighbors[c]) if (j !== undefined && !seenOnes.has(j)) { seenOnes.add(j); nextPt.push(j); } }
    layer = nextPt;
  }
  return n;
}
function updatePollination() {                     // fruit trees and bushes with a beehive within ≤6 cells and flowers within ≤3 give all their fruit
  const cells = new Set(world.animals.filter(a => hasTag(a.type, "pollinator") && !a.toRemove).map(a => a.tree.i));
  world.hiveDist = distances(i => cells.has(i));
  world.flowerDist = distances(i => hasType(i, "flowers"));
}
const pollinated = i => !!world.hiveDist && world.hiveDist[i] >= 0 && world.hiveDist[i] <= 6 &&
                        world.flowerDist[i] >= 0 && world.flowerDist[i] <= 3;
