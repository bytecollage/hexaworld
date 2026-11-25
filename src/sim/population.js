// ---- Births, old age of simple animals, nests, beehives, migration
function giveBirth(m, n) {
  const e = SPECIES[m.type], nowDay = gameDay();
  if (e.breed.nest) {                                    // turtles: lay a nest of eggs on the beach (hatches after 5 days)
    const route = findRoute(idxAt(m.x, m.y), i => terrain(i) === "sand" && world.toWater[i] === 1 && objs(i).length < MAX_PER_CELL &&
                            !world.neighbors[i].some(j => world.lake[j]), i => !world.lake[i] && world.outcropAt[i] < 0, 12);
    if (!route) return;
    const nest = addObject(route[route.length - 1], "nest", { isNest: true, eggs: n, hatchesAt: nowDay + NEST_DAYS, species: m.type });
    if (nest) world.nests.push(nest);
    return;
  }
  let x = m.x, y = m.y;
  if (e.breed.spawning) {                                  // fish: spawn in shallow water
    const route = findRoute(idxAt(m.x, m.y), i => terrain(i) === "water" && !world.lake[i], e.zone, 15);
    if (route) [x, y] = toPixel(...world.cells[route[route.length - 1]]);
  }
  for (let k = 0; k < n; k++) {
    const c = createAnimal(m.type, x + (rnd() - 0.5) * 0.5, y + (rnd() - 0.5) * 0.5, { born: nowDay, thirst: 0.1, hunger: 0.1, lastMeal: nowDay, mother: m });
    if (e.followsMother) Object.assign(c, { mode: "adjacent", modeUntil: nowDay + 0.3 });
    if (e.needs?.hidden) Object.assign(c, { burrow: m.burrow, inShelter: m.inShelter, shelter: m.shelter });
    if (e.hunt) c.house = { ...m.house };
    e.onBorn?.(c, m);                                      // species-specific setup (school size, parrot's tree…)
    world.births = (world.births || 0) + 1; world.bornCount[m.type] = (world.bornCount[m.type] || 0) + 1;
  }
}
const NEST_DAYS = 5;
function lifeCycle() {
  const nowDay = gameDay(), year = gameYear(), seasonIdx = seasonIndex(), seasonKey = year * 4 + seasonIdx;
  const dtDays = Math.max(0, nowDay - (world.lastCycle ?? nowDay)); world.lastCycle = nowDay;
  if (world.breedingSeason !== seasonKey) {             // at the start of each season: who breeds in it
    world.breedingSeason = seasonKey;
    const start = year * YEAR_DAYS + seasonIdx * SEASON_DAYS;
    for (const [type, e] of Object.entries(SPECIES)) {
      if (!e.breed || !e.breed.seasons.includes(seasonIdx)) continue;
      const living = world.animals.filter(a => a.type === type && !a.dead && !a.toRemove);
      if (e.breed.cap && living.length >= e.breed.cap * Math.max(2, world.initialPopulation[type] || 0)) continue;   // the environment cannot support more
      const adults = living.filter(a => isAdultAnimal(a) && !a.dyingSince);
      const expected = Math.floor(adults.length / 2) * e.breed.pct;
      const young = Math.floor(expected) + (rnd() < expected % 1 ? 1 : 0);
      const mothers = adults.filter(a => !e.breed.food || wellFed(a)).sort(() => rnd() - 0.5).slice(0, young);
      for (const m of mothers) {
        const [lo, hi] = e.breed.litter;
        world.pendingBirths.push({ mother: m, at: start + rnd() * (SEASON_DAYS - 0.5), n: lo + Math.floor(rnd() * (hi - lo + 1)) });
      }
    }
    for (const d of Registry.fauna) d.onSeasonStart?.(seasonIdx, nowDay);   // species-specific season events (beehives split or die…)
    updatePollination();
  }
  if (seasonIdx === 0 && world.immigration !== year) {        // spring: if a species has almost disappeared, immigrants arrive
    world.immigration = year;
    for (const [type, places] of Object.entries(world.places || {})) {
      const e = SPECIES[type];
      if (!e || e.immigrates === false) continue;
      const living = world.animals.filter(a => a.type === type && !a.dead && !a.toRemove).length;
      const minimum = Math.max(2, Math.round(0.15 * (world.initialPopulation[type] || 0)));
      for (let k = living; k < minimum; k++) {
        const i = places[Math.floor(rnd() * places.length)], [x, y] = toPixel(...world.cells[i]);
        const a = createAnimal(type, x + (rnd() - 0.5) * 0.4, y + (rnd() - 0.5) * 0.4, { immigrant: true });
        a.born = nowDay - (e.grows ? e.grows.days * 1.2 : 10 + rnd() * 5);
        if (e.needs?.hidden) Object.assign(a, { inShelter: true, shelter: i, burrow: e.needs.house ? i : undefined });
        if (e.flies) a.alt = 1;
        e.onBorn?.(a, null);                                 // species-specific setup (school size…)
        world.immigrants = (world.immigrants || 0) + 1; (world.arrived ||= {})[type] = (world.arrived[type] || 0) + 1;
      }
    }
  }
  world.pendingBirths = world.pendingBirths.filter(p => {
    if (nowDay < p.at) return true;
    const m = p.mother;
    if (!m.dead && !m.toRemove && !m.dyingSince) giveBirth(m, p.n);
    return false;
  });
  world.nests = world.nests.filter(n => {               // turtle eggs hatching
    if (n.removed) return false;
    if (nowDay < n.hatchesAt) return true;
    const [x, y] = posOf(n);
    const sp = n.species;
    for (let k = 0; k < n.eggs; k++) { createAnimal(sp, x + (rnd() - 0.5) * 0.4, y + (rnd() - 0.5) * 0.4, { born: nowDay }); world.bornCount[sp] = (world.bornCount[sp] || 0) + 1; }
    removeObject(n);
    return false;
  });
  for (const a of world.animals) {
    const e = SPECIES[a.type];
    if (a.toRemove || e.needs || e.hunt) continue;          // the rest (fish, frogs, turtles, birds, beehives…) simply die of old age
    if (a.life && ageOf(a) >= a.life) { a.toRemove = true; a.cause = "oldAge"; recordDeath(a, "oldAge"); }
    else if (e.homeLost?.(a)) { a.toRemove = true; recordDeath(a, "its tree fell"); }   // e.g. the beehive's tree fell
  }
  // migration (deer): if there are too many together, one leaves for an area with its food and none of its kind
  if (currentPhase().name === "Day") for (const a of world.animals) {
    if (!SPECIES[a.type].migrates || a.dead || a.goal || a.action || a.dyingSince || sizeOf(a) < 1 || rnd() > dtDays / 0.5) continue;
    const me = SPECIES[a.type];
    const neighbors = world.animals.filter(v => v.type === a.type && !v.dead && distA(a, v) < 6 * SQ3).length;
    if (neighbors <= 10) continue;
    const cells = new Set(world.animals.filter(v => v.type === a.type && !v.dead).map(v => idxAt(v.x, v.y))), here = idxAt(a.x, a.y);
    const kin = distances(i => cells.has(i));          // reference cells to the nearest one of its kind
    const route = findRoute(here, i => wrapDistance(i, here) >= cellsFor(12) && hasFood(i, me.needs.diet) && kin[i] > 3, me.zone, 40);
    if (route) { a.goal = { type: "migrate", route, k: 0, end: [0, 0] }; world.migrations = (world.migrations || 0) + 1; }
  }
}
