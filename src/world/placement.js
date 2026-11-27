function placeElements() {
  const n = world.cells.length, forest = smoothNoise(3, 5), meadow = smoothNoise(4, 4), floral = smoothNoise(5, 3);
  world.objects = new Array(n).fill(null);
  world.objSeed = 1;
  placeOutcrops();
  // one element per cell; the probabilities are per reference cell divided by CELL_AREA, so the density per area
  // (pines per grove, tufts per meadow…) stays the same as on the old grid, only spread over more, smaller cells
  const A = CELL_AREA;
  for (let i = 0; i < n; i++) {
    if (world.outcropAt[i] >= 0) continue;
    const t = world.base[i], r = hash(i, 60), r2 = hash(i, 67), r3 = hash(i, 69), dT = world.toLand[i], dA = world.toWater[i];
    const put = type => addObject(i, type);
    if (t === "grass") {
      if (forest[i] > 0.63) { if (r < 2.45 / A) put("pine"); }                      // grove: dense pines
      else if (forest[i] > 0.57 && r < 0.55 / A) put("pine");                        // edge of the grove
      else if (r < 0.012 / A) put("pine");                                           // some loose pine
      else if (r > 1 - 0.015 / A) put("fruitTree");
      else if (r > 1 - 0.028 / A || (forest[i] > 0.5 && r2 < 0.08 / A)) put("bush");  // fruit bushes (loose and next to forests)
      else if (meadow[i] > 0.6 && r2 < 0.7 * (meadow[i] > 0.7 ? 2.3 : 1) / A) put("tallGrass");   // tall grass meadows
      if (!objs(i).length && forest[i] <= 0.63 && r3 < (floral[i] > 0.62 ? 0.45 : 0.03) / A) put("flowers");
      else if (!objs(i).length && hash(i, 68) < 0.015 / A) put("stones");
    } else if (t === "sand") {                                                      // beach
      if (dA === 1 && r < 0.2 / A) put("palm");
      else if (r2 > 1 - 0.05 / A) put("stones");
    } else if (t === "water" && world.lake[i]) {                                      // aquatic flora only in lakes
      if (dT === 1 && r < 0.3 / A * 2) put("reeds");
      else if (r < 0.35 / A * 2) put("waterLily");
      else if (r < 0.5 / A * 2) put("lotus");
    }
  }
  // loose branches: mostly inside forests and around them (up to 2 cells), and a few scattered over the meadow
  const toForest = distances(isGrove);
  for (let i = 0; i < n; i++) {
    if (world.base[i] !== "grass" || world.outcropAt[i] >= 0 || objs(i).length >= MAX_PER_CELL) continue;
    const d = toForest[i], prob = d === 0 ? 0.12 : d === 1 ? 0.1 : d === 2 ? 0.05 : 0.006;
    if (hash(i, 700) < prob / A) addObject(i, "branches");
  }
  // around each outcrop: loose stones in 4 of its neighboring cells (chosen at random)
  for (const y of world.outcrops) {
    const own = new Set(y.cells);
    const ring = [...new Set(y.cells.flatMap(c => world.neighbors[c]))]
      .filter(j => !own.has(j) && world.outcropAt[j] < 0 && !isWater(world.base[j]) && !hasType(j, "stones") && objs(j).length < MAX_PER_CELL)
      .sort((a, b) => hash(a, 95 + y.id) - hash(b, 95 + y.id));
    for (const j of ring.slice(0, 4)) addObject(j, "stones");
  }
  if (world.testMap) {                              // test map: a single tall grass tuft, a few cells from the lake
    for (let i = 0; i < n; i++) for (const o of [...objs(i)]) {
      if (o.type === "tallGrass") removeObject(o);
      else if ((o.type === "flowers" || o.type === "bush") && hash(o.sem, 500) > 0.15) removeObject(o);   // few flowers and bushes
    }
    const spot = world.cells.map((_, i) => i)
      .filter(i => world.base[i] === "grass" && world.outcropAt[i] < 0 && !objs(i).length && world.toWater[i] >= 4 && world.toWater[i] <= 6)
      .sort((a, b) => wrapDistance(a, idx(0, 0)) - wrapDistance(b, idx(0, 0)))[0];
    if (spot !== undefined) addObject(spot, "tallGrass");
    testTallGrass = spot ?? null;
  }
  // trees: half young (they do not grow until the 2nd spring) and half adult and mature
  const nowDay = gameDay();
  world.trees = []; world.springAssigned = 0; world.regrowths = []; world.bushes = []; world.groundFruits = []; world.sprouts = 0;
  world.sowings = []; world.hiveDist = null; world.winterDeaths = undefined; world.fires = []; world.fellings = []; world.wildfire = [];
  world.traps = []; world.cages = []; world.chests = []; world.fenceAt = new Map(); world.houses = []; world.houseAt = new Map(); if (typeof closeCage === "function") closeCage();
  for (let i = 0; i < n; i++) for (const o of objs(i)) {
    if (TREES.has(o.type)) {
      o.adultSince = hash(o.sem, 64) < 0.5 ? Infinity : nowDay - (GROW_DURATION + MATURE_DAYS + hash(o.sem, 65) * YEAR_DAYS);
      o.lastDrop = -1;
      const v = TREE_LIFE[o.type];
      o.life = v[0] + hash(o.sem, 66) * (v[1] - v[0]);                       // days it will live
      o.born = o.adultSince === Infinity ? nowDay - hash(o.sem, 67) * 15       // young: less than a year old
                                          : nowDay - (YEAR_DAYS + hash(o.sem, 67) * (o.life - YEAR_DAYS));   // adults: from 1 year to almost their lifespan
      world.trees.push(o);
    }
    const d = DEF[o.type];
    if (d.food?.units) o.food = d.food.units;           // plant food units (tall grass 5, flowers 1)
    if (d.berries) { o.fruit = d.berries.perSeason; world.bushes.push(o); }
  }
  world.seasonKey = 0;                                 // spring of year 1: bushes start with fruit
}
