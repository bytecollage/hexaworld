// =====================================================================================
//  POPULATING A NEW WORLD: runs the spawn steps of every registered species, sorted by phase.
//  Each species file declares its own `spawn: { phase, normalOnly?, run(ctx) }` (or a list of them);
//  shared steps (e.g. the small forest mammals) use defineSpawner(). The phases keep the original
//  order, so the random sequence (and the generated world) stays the same.
// =====================================================================================
function placeAnimals() {
  animSeed = world.seed >>> 0;
  world.animals = [];
  const n = world.cells.length;
  world.pendingBirths = []; world.nests = []; world.breedingSeason = undefined; world.lastCycle = undefined;
  world.hunts = world.misses = world.births = world.migrations = world.seeds = world.eggsEaten = 0;
  world.deaths = {}; world.bornCount = {}; world.arrived = {}; world.immigrants = 0; world.immigration = undefined;
  resetHistory();
  world.forestComp = components(isGrove);       // each forest (connected groves) has its number
  const ctx = spawnContext(n);
  for (const step of spawnSteps()) if (!(step.normalOnly && world.testMap)) step.run(ctx);
  world.initialPopulation = {}; world.places = {};     // where each species lives at the start (for the immigrants)
  for (const a of world.animals) {
    world.initialPopulation[a.type] = (world.initialPopulation[a.type] || 0) + 1;
    (world.places[a.type] ||= []).push(a.burrow ?? idxAt(a.x, a.y));
  }
  updatePollination();
  samplePopulation(true);
}

// every spawn step: the species' own (`spawn` in their definition) plus the shared ones (defineSpawner), by phase
function spawnSteps() {
  const steps = [...Registry.spawners];
  for (const d of Registry.fauna) for (const s of [].concat(d.spawn || [])) steps.push({ id: d.id, ...s });
  return steps.sort((a, b) => a.phase - b.phase);
}

// what a spawn step gets: helpers to find cells and add animals, plus facts about the land shared by many species
function spawnContext(n) {
  const of = cond => { const l = []; for (let i = 0; i < n; i++) if (cond(i)) l.push(i); return l; };
  const add = (type, i, jit = 0.6) => {          // animal in cell i with a random age (none if there is no cell: small worlds)
    if (i === undefined) return null;
    const [x, y] = toPixel(...world.cells[i]), e = SPECIES[type];
    const a = createAnimal(type, x + (rnd() - 0.5) * jit, y + (rnd() - 0.5) * jit);
    if (e.grows) a.born = gameDay() - rnd() * e.grows.days * 2;   // varied ages: roughly half are already adults
    else if (a.life) a.born = gameDay() - rnd() * a.life * 0.7;
    if (e.flies) a.alt = 1;
    return a;
  };
  // only land from which a lake can be reached (otherwise land animals would have nowhere to drink)
  const compD = components(landZone), withLake = new Set();
  for (let i = 0; i < n; i++) if (world.lakeShore[i] && compD[i] >= 0) withLake.add(compD[i]);
  const ctx = {
    testMap: world.testMap, of, add,
    pick: l => { const r = rnd(); return l.length ? l[Math.floor(r * l.length)] : undefined; },   // undefined from an empty list
    adult: a => { if (!a) return a; const e = SPECIES[a.type]; a.born = gameDay() - (e.grows ? e.grows.days * (1 + rnd()) : 10 + rnd() * a.life * 0.5); return a; },
    count: t => world.animals.filter(a => a.type === t).length,
    countTag: tag => idsWithTag(tag).reduce((s, t) => s + ctx.count(t), 0),
    sow: (type, every, cond = SPECIES[type].zone, jit = 1.2) => {      // spread one animal per `every` reference cells that meet cond
      const l = of(cond);
      for (let k = 0; k < Math.round(l.length / (every * CELL_AREA)); k++) add(type, l[Math.floor(rnd() * l.length)], jit);
    },
    withLake, compD,
    grass: of(i => landZone(i) && withLake.has(compD[i])),         // grassland that reaches a lake
    inForest: () => of(i => isGrove(i) && withLake.has(compD[i])),  // groves that reach a lake
  };
  return ctx;
}
