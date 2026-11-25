// ---- At night, fish, frogs and turtles stay still: frogs inside the lake, turtles at the edge of the beach
function restSpot(a, i) {                    // where each species spends the night (its `nightRest` trait)
  const where = SPECIES[a.type].nightRest;
  if (where === "water") return true;                                     // fish: wherever they are
  if (where === "lake") return world.lake[i] === 1;                       // frogs: inside the lake
  const shore = terrain(i) === "sand" && world.toWater[i] === 1;             // turtles: at the edge of the beach…
  return shore || (sizeOf(a) >= 1 && isWater(terrain(i)));                // …or, if adult, in the water
}
function nightRest(a) {                     // returns true if it is still, resting
  if (currentPhase().name !== "Night") { a.sleeping = false; a.goingToSleep = false; return false; }
  if (a.fleeing) { a.sleeping = false; return false; }   // fleeing it does not sleep; when it stops, it stays still again
  if (a.sleeping) return true;
  const i = idxAt(a.x, a.y);
  if (restSpot(a, i)) { a.moving = false; a.fleeing = false; a.sleeping = true; return true; }
  if (a.goingToSleep && a.moving) return false;     // on its way: let the usual code move it
  const route = findRoute(i, j => restSpot(a, j), zoneOf(a));
  if (!route) { a.moving = false; a.sleeping = true; return true; }   // there is no better spot: stays where it is
  const [cx, cy] = toPixel(...world.cells[route[route.length - 1]]), [dx, dy] = wrapDelta(cx - a.x, cy - a.y);
  a.tx = a.x + dx; a.ty = a.y + dy; a.moving = true; a.goingToSleep = true;
  return false;
}
function segmentInZone(zone, a, bx, by) {  // does the whole segment stay inside the species' zone?
  const dx = bx - a.x, dy = by - a.y, L = Math.hypot(dx, dy), steps = Math.max(1, Math.ceil(L / 0.3));
  for (let k = 1; k <= steps; k++) {
    const i = idxAt(a.x + dx * k / steps, a.y + dy * k / steps);
    if (i === undefined || !zone(i)) return false;   // outside its zone (fence posts are outside every land zone)
  }
  return true;
}
function chooseDestination(a, fleeFrom = null) {
  const e = SPECIES[a.type];
  for (let attempt = 0; attempt < 8; attempt++) {
    let ang = rnd() * TAU;
    if (fleeFrom) ang = Math.atan2(fleeFrom[1], fleeFrom[0]) + (rnd() - 0.5) * 1.6;       // move away from the character
    else if (AQUATIC.has(a.type) && rnd() < 0.7) ang = a.dir + (rnd() - 0.5) * 1.4;   // fish change course little
    const d = (fleeFrom ? e.step * 1.2 : 0.4 + rnd() * e.step) * SQ3;
    const tx = a.x + Math.cos(ang) * d, ty = a.y + Math.sin(ang) * d;
    if (segmentInZone(zoneOf(a), a, tx, ty)) { a.tx = tx; a.ty = ty; a.moving = true; a.fleeing = !!fleeFrom; return; }
  }
  a.wait = 0.5 + rnd();               // found nowhere to go: waits a little
}
// ---- Level of detail (live play only, not simulate()): animals far from the camera and from the character are
//      updated every FAR_EVERY frames (each one on its own frame, to spread the load) with the time they missed
const FAR_EVERY = 4;
const FAR_FROM_CHARACTER = 25;                       // reference cells: near the character everything runs every frame
let lodFrame = 0, lodIsFar = null;
function farFromView() {                             // the test for "far", fixed for this frame
  const r = 2 * Math.max(W, H) / cam.zoom + 8 * SQ3, rp = FAR_FROM_CHARACTER * SQ3;
  return a => {
    const [cx, cy] = wrapDelta(a.x - cam.tx, a.y - cam.ty);
    if (cx * cx + cy * cy < r * r) return false;
    if (player.i < 0) return true;
    const [px, py] = wrapDelta(a.x - player.x, a.y - player.y);
    return px * px + py * py >= rp * rp;
  };
}
function updateAnimals(dtReal, lod = false) {
  const total = dtReal * clock.speed;                 // game time: with the speed control, animals also go faster
  for (const a of world.animals) a.phase += dtReal; // legs animate at real pace
  const steps = Math.max(1, Math.ceil(total / 1.5));  // at high speed, in several short steps (chases)
  lodIsFar = lod ? farFromView() : null; lodFrame++;
  for (let k = 0; k < steps; k++) stepAnimals(total / steps);
  lodIsFar = null;
}
function stepAnimals(dtStep) {
  if (world.animals.some(a => a.toRemove)) world.animals = world.animals.filter(a => !a.toRemove);   // carcasses consumed, preys eaten
  world.predatorsNow = world.animals.filter(a => SPECIES[a.type].hunt?.preys.size && !a.dead && !a.toRemove && !a.dyingSince && sizeOf(a) >= 0.8);
  for (const a of world.animals) {
    if (a.toRemove) continue;
    if (lodIsFar) {                                     // far away: wait for its turn, keeping the time it missed
      a.lodSlot ??= Math.floor(Math.random() * FAR_EVERY);
      if ((lodFrame + a.lodSlot) % FAR_EVERY && lodIsFar(a)) { a.lag = (a.lag || 0) + dtStep; continue; }
    }
    const dt = dtStep + (a.lag || 0); a.lag = 0;
    const e = SPECIES[a.type];
    if (e.hunt) { updatePredator(a, dt); continue; }
    if (e.update) { e.update(a, dt); continue; }                            // species with their own behavior (parrot, beehive…)
    if (e.alert && !a.fleeing && !a.dead && !a.dyingSince && !a.goal?.runs && !stunned(a)) {   // a predator hunting nearby: flee
      const d = threatNearby(a, e);
      if (d) fleeFrom(a, e, wrapDelta(a.x - d.x, a.y - d.y), d);
    }
    if (e.needs && player.i >= 0 && !a.fleeing && !a.dead && !a.dyingSince && !a.goal?.runs && !(e.needs.house && a.inShelter) && !stunned(a)) {   // they flee if you come close
      const [dx, dy] = wrapDelta(a.x - player.x, a.y - player.y);
      if (Math.hypot(dx, dy) < e.needs.fleeing * SQ3) {
        if (e.needs.hidden) fleeToOtherForest(a, [dx, dy]);                                     // small ones: to another forest
        else chooseDestination(a, [dx, dy]);
      }
    }
    if (e.fleeing && player.i >= 0 && !a.fleeing) {                                       // small fish: flee at 1 cell
      const [dx, dy] = wrapDelta(a.x - player.x, a.y - player.y);
      if (Math.hypot(dx, dy) < e.fleeing * SQ3) chooseDestination(a, [dx, dy]);
    }
    if (e.nightRest && nightRest(a)) continue;
    if (e.needs && updateWithNeeds(a, dt)) continue;
    if (!a.moving) {
      a.wait -= dt;
      if (a.wait <= 0) chooseDestination(a);
      continue;
    }
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    const swims = e.swimSpeed && isWater(terrain(idxAt(a.x, a.y)));
    const v = (a.fleeing ? e.speed * (weak(a) ? 1.7 : 2.4) : e.walk ?? e.speed) * SQ3 * (swims ? e.swimSpeed : 1), av = v * dt;   // calm: walking pace
    if (d > 1e-4) a.dir = Math.atan2(dy, dx);
    if (av >= d) {
      a.x = a.tx; a.y = a.ty; a.moving = false; a.fleeing = false;
      a.wait = e.wait[0] + rnd() * (e.wait[1] - e.wait[0]);
    } else { a.x += dx / d * av; a.y += dy / d * av; }
    wrapAnimal(a);
  }
}
