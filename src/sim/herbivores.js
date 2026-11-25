// ---- Needs: deer (drink ≥2/day, eat ≥1/day, die after 3 days without eating, shelter at night)
//      and small ones (eat and drink once a day, last 5 days without eating, live hidden in forests)
function findRoute(fromCell, chaseTarget, zone, maxSteps = Infinity) {   // BFS through the zone to the nearest target cell
  const limit = maxSteps * CELL_SCALE;                 // maxSteps is in reference cells
  const previous = new Map([[fromCell, -1]]), steps = new Map([[fromCell, 0]]), tail = [fromCell];
  for (let h = 0; h < tail.length; h++) {
    const i = tail[h];
    if (chaseTarget(i)) { const route = []; for (let k = i; k !== -1; k = previous.get(k)) route.push(k); return route.reverse(); }
    if (steps.get(i) >= limit) continue;
    for (const j of world.neighbors[i]) if (j !== undefined && !previous.has(j) && zone(j)) { previous.set(j, i); steps.set(j, steps.get(i) + 1); tail.push(j); }
  }
  return null;
}
const SIGHT_CELLS = 12, VERY_HUNGRY = 1.5;        // cells it can see; hunger above which it eats anything
// grove (shelter): at least 2 standing pines in the cell and its 6 neighbors (about one reference cell)
const shelterTree = i => { const o = objs(i)[0]; return !!o && !!DEF[o.type]?.tree?.shelter && o.fellAt === undefined; };
const isGrove = i => { if (i === undefined) return false; let n = shelterTree(i) ? 1 : 0;
  for (const j of world.neighbors[i]) if (shelterTree(j) && ++n >= 2) return true; return n >= 2; };
const shelterTime = () => currentPhase().name !== "Day";   // at dusk they go to the grove; they come out at dawn
function fleeToOtherForest(a, away, origin_ = player) {  // runs to the nearest forest that is not its own, without getting closer to the threat
  const d0 = Math.hypot(...away);
  a.action = null; a.goal = null;
  if (SPECIES[a.type].needs.house) planTrip(a, "shelter");          // rabbits: they run to their burrow
  else planTrip(a, "relocateAt", i => {
    const [x, y] = toPixel(...world.cells[i]);
    return Math.hypot(...wrapDelta(x - origin_.x, y - origin_.y)) > d0 + 1;
  });
  if (a.goal) { a.goal.runs = true; a.inShelter = false; }
  else { a.retry = 0; chooseDestination(a, away); }   // no other forest reachable: flees aimlessly
}
function planTrip(a, type = a.thirst >= 1 ? "drink" : "eat", predicate = null) {
  const e = SPECIES[a.type], diet = e.needs.diet, here = idxAt(a.x, a.y);
  const free = e.needs.house ? (i => i === a.burrow)                                                   // rabbits: their burrow
                           : (i => isGrove(i) && !world.animals.some(b => b !== a && b.shelter === i));   // one animal per cell
  const chaseTarget = type === "drink" ? (i => world.lakeEdge[i] === 1 && !ambusherNear(a, i))   // not next to a caiman
                 : type === "eat" ? (i => hasFood(i, diet))
                 : type === "relocateAt" ? (i => free(i) && world.forestComp[i] !== world.forestComp[here])   // to another forest
                 : type === "rest" ? (i => world.lakeShore[i] === 1 || isGrove(i))   // next to the lake or in the forest
                 : free;
  let route, dietUsed = diet;
  if (type === "eat" && e.needs.hungryDiet) {       // deer: grass in sight; if there is none and they are very hungry, flowers or fruit;
    const search = (d, max) => findRoute(here, i => hasFood(i, d), zoneOf(a), max);   // otherwise, they go farther for grass
    const hungry = a.hunger >= VERY_HUNGRY;
    route = search(diet, SIGHT_CELLS);
    if (!route && hungry) { route = search(e.needs.hungryDiet, SIGHT_CELLS); if (route) dietUsed = e.needs.hungryDiet; }
    if (!route) route = search(diet, Infinity);
    if (!route && hungry) { route = search(e.needs.hungryDiet, Infinity); if (route) dietUsed = e.needs.hungryDiet; }
  } else {
    if (type === "eat" && diet.takesBait === true && world.traps?.some(t => t.baitItem && !t.prey)) {   // the bait smells: they prefer it (≤8 cells)
      route = findRoute(here, i => objs(i).some(o => o.type === "trap" && o.baitItem && !o.prey), zoneOf(a), 8);
    }
    route ||= findRoute(here, predicate ? (i => chaseTarget(i) && predicate(i)) : chaseTarget, zoneOf(a), type === "rest" ? 10 : Infinity);
  }
  if (!route) { a.retry = 15; return; }   // nothing reachable: try again later
  if (type === "relocateAt") type = "shelter";
  const end = route[route.length - 1];
  const food = type === "eat" ? foodAt(end, dietUsed) : null;
  a.goal = { type, route, k: 0, diet: dietUsed,
             end: food ? [food.ox * 0.9, food.oy * 0.9 + 0.12] : [(rnd() - 0.5) * 0.5 * CELL_R, (rnd() - 0.5) * 0.4 * CELL_R] };
  if (type === "shelter") a.shelter = end;
  a.fleeing = false;
}
function routePoint(a, k) {                         // center of cell k of the route, in the copy closest to the deer
  const m = a.goal, i = m.route[k];
  let [x, y] = toPixel(...world.cells[i]);
  if (k === m.route.length - 1) {
    if (m.type === "drink") {                        // comes close to the water's edge
      const l = world.neighbors[i].find(j => world.lake[j]);
      const [lx, ly] = toPixel(...world.cells[l]), [dx, dy] = wrapDelta(lx - x, ly - y), d = Math.hypot(dx, dy);
      x += dx / d * 0.3; y += dy / d * 0.3;
    } else { x += m.end[0]; y += m.end[1]; }       // next to the food, or in its corner of the grove
  }
  const [dx, dy] = wrapDelta(x - a.x, y - a.y);
  return [a.x + dx, a.y + dy];
}
function wrapAnimal(a) {                         // keep inside the original world (shifting its destination too)
  const [q, r] = toHex(a.x, a.y), [cq, cr] = canon(q, r);
  if (cq !== q || cr !== r) { const [ox, oy] = toPixel(q - cq, r - cr); a.x -= ox; a.y -= oy; a.tx -= ox; a.ty -= oy; }
}
// ---- Young that follow their mother (deer fawns): always next to an adult (their mother; if she dies or there is none, the nearest adult)
function motherOf(a) {
  if (sizeOf(a) >= 1) { a.mother = null; return null; }   // already adult: becomes independent
  let m = a.mother;
  if (!m || m.dead || m.toRemove) {
    m = null; let md = Infinity;
    for (const b of world.animals) if (b.type === a.type && b !== a && !b.dead && sizeOf(b) >= 1) {
      const d = Math.hypot(...wrapDelta(b.x - a.x, b.y - a.y)); if (d < md) { md = d; m = b; }
    }
    a.mother = m;
  }
  return m;
}
function followMother(a, dt) {                        // true if it already moved it; false if it must act on its own
  const m = motherOf(a);
  if (!m || a.goal) return false;                    // no adult, or halfway through a trip: follows its own logic
  if (a.thirst >= 1.4 || a.hunger >= 1.4) return false;  // in great need: goes to drink or eat by itself (and then comes back)
  const e = SPECIES.deer, nowDay = gameDay(), [dx, dy] = wrapDelta(m.x - a.x, m.y - a.y), d = Math.hypot(dx, dy);
  const slots = d / SQ3;
  if (m.action && slots < 1.5 &&                  // the adult drinks or eats alongside: the fawn does the same
      (m.action.type === "drink" ? a.thirst > 0.2 : a.hunger > 0.2 && hasFood(m.action.cell, m.action.diet || e.needs.diet))) {
    a.action = { ...m.action, subtract: m.action.subtract + rnd() * 2 };
    a.moving = false; a.dir = m.dir; a.restUntil = 0;
    return true;
  }
  // modes: free (wanders without going past 3 cells), reach (strayed too far), adjacent (a while stuck to the adult)
  if (shelterTime() || m.inShelter || m.dyingSince) a.mode = "adjacent";          // at night, always with the adult
  else if (slots > 3) a.mode = "reach";
  else if (a.mode === "reach" && slots < 1) a.mode = "free";
  else if (a.mode === "adjacent" && nowDay > (a.modeUntil || 0)) a.mode = "free";
  else if ((a.mode || "free") === "free" && rnd() < dt / DAY_DURATION / 0.35) {   // every now and then it sticks close for a while
    a.mode = "adjacent"; a.modeUntil = nowDay + 0.06 + rnd() * 0.15;
  }
  if (a.mode === "free" || !a.mode) { a.mode = "free"; return false; }
  const ang = hash(a.sem, 7) * TAU, tx = m.x + Math.cos(ang) * 0.6, ty = m.y + Math.sin(ang) * 0.5;
  const [ex, ey] = wrapDelta(tx - a.x, ty - a.y), of_ = Math.hypot(ex, ey);
  if (of_ < 0.15) {                                   // by its side: still; rests or lies down with it
    a.moving = false;
    a.inShelter = m.inShelter; a.shelter = m.inShelter ? m.shelter : -1;
    a.restUntil = m.restUntil || 0;
    return true;
  }
  const v = (e.walk ?? e.speed) * SQ3 * (a.mode === "reach" ? 2.5 : 1.3) * dt, step = Math.min(of_, v);
  const nx = a.x + ex / of_ * step, ny = a.y + ey / of_ * step;
  a.inShelter = false; a.restUntil = 0;
  if (!e.zone(idxAt(nx, ny))) {   // something in between (water, rocks, fence): path to the adult
    const route = findRoute(idxAt(a.x, a.y), i => i === idxAt(m.x, m.y), e.zone);
    if (route) a.goal = { type: "follow", route, k: 0, end: [0, 0] };
    return !!route;
  }
  a.x = nx; a.y = ny; a.moving = true; a.dir = Math.atan2(ey, ex);
  wrapAnimal(a);
  return true;
}
