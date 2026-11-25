const CARCASS_DAYS = 2, DYING_DAYS = 0.5;
function fertilize(i, a) {                              // where there was a carcass plants are born, if they fit:
  if (i === undefined || blocked(i)) return;       //   deer → 2 grass tufts and 1 of flowers; small one → 1 of grass or 1 of flowers
  const end = gameDay() + GROW_DURATION;        // they take a day to grow, like regrowths
  const big = !!SPECIES[a.type].bigCarcass;
  let plants = big ? ["tallGrass", "tallGrass", "flowers"] : [rnd() < 0.5 ? "tallGrass" : "flowers"];
  if (a.scavenged) plants = big ? ["tallGrass"] : rnd() < 0.5 ? [] : plants;   // vultures take a good part
  for (const type of plants) {
    const o = addAround(i, type, { food: 0, regrowAt: end }, 1);   // each plant in its own cell, around the carcass
    if (o) world.regrowths.push({ o, at: end });
  }
}
function updateWithNeeds(a, dt) {           // returns true if it already took care of moving it this frame
  if (a.dead) {
    if (gameDay() - a.deadAt >= CARCASS_DAYS && !a.toRemove) { a.toRemove = true; fertilize(idxAt(a.x, a.y), a); }
    return true;
  }
  const needs = SPECIES[a.type].needs;
  if (a.life && gameDay() - a.born >= a.life) {      // old age: lies down and waits for death without moving (half a day)
    if (!a.dyingSince) Object.assign(a, { dyingSince: gameDay(), moving: false, fleeing: false, goal: null, action: null });
    if (gameDay() - a.dyingSince >= DYING_DAYS) { Object.assign(a, { dead: true, deadAt: gameDay(), ofOldAge: true }); recordDeath(a, "oldAge"); }
    return true;
  }
  if (a.stunnedUntil) {                                // stunned by a stone: lying down; when it wakes up, it flees
    if (stunned(a)) { a.moving = false; return true; }
    a.stunnedUntil = 0;
    if (player.i >= 0) fleeFrom(a, SPECIES[a.type], wrapDelta(a.x - player.x, a.y - player.y), player);
  }
  if (gameDay() - a.lastMeal >= needs.dies) {     // too many days without eating: dies where it is
    recordDeath(a, "hunger");
    Object.assign(a, { dead: true, deadAt: gameDay(), moving: false, fleeing: false, goal: null, action: null });
      return true;
  }
  const days = dt / DAY_DURATION;
  a.thirst += days / needs.thirst; a.hunger += days / needs.hunger * (seasonIndex() === 3 ? 1.3 : 1);   // in winter, more hunger
  if (a.hunger >= 2) a.strongHunger = gameDay();   // real hunger (not the one of a normal night)
  if (a.fleeing) { a.goal = null; a.action = null; a.shelter = -1; a.inShelter = false; a.restUntil = 0; return false; }
  if (a.action) {                                    // drinking or eating, with its head down
    a.action.subtract -= dt;                            // game seconds (at ×1, about 4-8 real s)
    if (a.action.subtract <= 0) {
      if (a.action.type === "drink") { a.thirst = 0; a.drinks++; }
      else if (foodAt(a.action.cell, a.action.diet || needs.diet)?.type === "trap") { capture(a, foodAt(a.action.cell, a.action.diet || needs.diet)); return true; }
      else if (eatAt(a.action.cell, a.action.diet || needs.diet)) { a.hunger = 0; a.meals++; a.lastMeal = gameDay(); }
      a.action = null; a.wait = 1 + rnd() * 2;
    }
    return true;
  }
  a.retry -= dt;
  if (SPECIES[a.type].followsMother) { const r = followMother(a, dt); if (r) return true; }   // young ones go with an adult
  // thirst/hunger thresholds: by day 1; at dusk, before sheltering, it always drinks and eats if somewhat hungry;
  // once sheltered (or on its way) it only comes out if it really needs to (1.8). So it spends the night among the pines and drinks ≥2 times a day.
  const sheltering = a.inShelter || a.goal?.type === "shelter";
  const youngOne = SPECIES[a.type].followsMother && a.mother && sizeOf(a) < 1;   // young ones eat and drink mostly with the adult
  const [uThirst, uHunger] = youngOne && !shelterTime() ? [1.4, 1.4]
                         : needs.hidden ? (shelterTime() ? [1.5, 1.5] : [1, 1])   // small ones: at night they wait for daytime
                         : !shelterTime() ? [1, 1] : sheltering ? [1.8, 1.8] : [0.15, 0.5];
  const thirst = a.thirst >= uThirst, hunger = a.hunger >= uHunger, needsItem = thirst || hunger;
  if (a.goal?.type === "shelter" && needsItem && !a.goal.runs) a.goal = null;   // thirst or hunger rule (unless fleeing)
  if (!a.goal && needsItem && a.retry <= 0) {
    a.inShelter = false; a.shelter = -1;
    planTrip(a, thirst && (!hunger || a.thirst >= a.hunger) ? "drink" : "eat");
  }
  if (!a.goal && !needsItem && needs.hidden) {        // small ones: always hidden; by day, they sometimes move to another forest
    if (a.inShelter) {
      if (!needs.house && !shelterTime() && gameDay() >= a.relocateAt && a.retry <= 0) {
        a.relocateAt = gameDay() + 0.8 + rnd() * 1.5;
        planTrip(a, "relocateAt");
        if (a.goal) a.inShelter = false;
      }
    } else if (a.retry <= 0) planTrip(a, "shelter");
    if (!a.goal) { a.moving = false; return true; }                    // they never wander in sight
  }
  if (needsItem) a.restUntil = 0;                  // thirst or hunger gets it up
  if (!a.goal && !needsItem) {
    if (!shelterTime()) {                                              // by day: normal life…
      a.inShelter = false; a.shelter = -1;
      if ((a.restUntil || 0) > gameDay()) { a.moving = false; return true; }   // …resting a while, lying down
      if (SPECIES[a.type].restsByDay && a.retry <= 0 && rnd() < dt / DAY_DURATION / 0.3) planTrip(a, "rest");
    }
    else if (a.inShelter) { a.moving = false; return true; }           // at night, still among the pines
    else if (a.retry <= 0) planTrip(a, "shelter");
  }
  if (!a.goal) return false;
  const m = a.goal, e = SPECIES[a.type], last = m.route.length - 1;
  if (m.type === "eat" && !hasFood(m.route[last], m.diet || needs.diet)) { a.goal = null; return true; }  // another one ate it
  let [tx, ty] = routePoint(a, m.k);
  const av = SQ3 * dt * (m.runs ? e.speed * 1.3 * (weak(a) ? 1.7 : 2.4) : (e.walk ?? e.speed) * 1.3);   // they walk to drink or eat; fleeing they run (the weak ones, less)
  let d = Math.hypot(tx - a.x, ty - a.y);
  while (d <= av + 1e-6 || (m.k < last && d < 0.6)) {   // waypoint reached: jump to the farthest one visible in a straight line
    if (m.k === last) {
      a.x = tx; a.y = ty; a.moving = false; a.goal = null;
      if (m.type === "drink") {
        const i = m.route[last], l = world.neighbors[i].find(j => world.lake[j]);
        const [lx, ly] = toPixel(...world.cells[l]), [ix, iy] = toPixel(...world.cells[i]);
        a.dir = Math.atan2(...wrapDelta(lx - ix, ly - iy).reverse());
      }
      if (m.type === "shelter") { a.inShelter = true; wrapAnimal(a); return true; }
      if (m.type === "follow" || m.type === "migrate") { wrapAnimal(a); return true; }   // next to its mother / in its new zone
      if (m.type === "rest") { a.restUntil = gameDay() + 0.06 + rnd() * 0.1; wrapAnimal(a); return true; }
      a.action = { type: m.type, cell: m.route[last], diet: m.diet, subtract: m.type === "drink" ? 4 + rnd() * 3 : 5 + rnd() * 3 };
      wrapAnimal(a);
      return true;
    }
    let nextPt = m.k + 1;
    for (let j = Math.min(last, m.k + 8); j > m.k + 1; j--) {
      const [px, py] = routePoint(a, j);
      if (segmentInZone(zoneOf(a), a, px, py)) { nextPt = j; break; }
    }
    m.k = nextPt; [tx, ty] = routePoint(a, m.k); d = Math.hypot(tx - a.x, ty - a.y);
  }
  a.moving = true; a.dir = Math.atan2(ty - a.y, tx - a.x);
  a.x += (tx - a.x) / d * av; a.y += (ty - a.y) / d * av;
  wrapAnimal(a);
  return true;
}
