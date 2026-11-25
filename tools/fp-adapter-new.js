// Fingerprint adapter for the refactored English code. Dev tool only.
const FP = {
  world: () => ({ cells: world.cells, animals: world.animals.filter(a => !a.toRemove).map(a => ({ type: a.type, dead: !!a.dead, x: a.x, y: a.y })) }),
  terrains: () => TERRAINS,
  terrainAt: i => terrain(i),
  objectsAt: i => objs(i).map(o => ({ type: o.type, ox: o.ox, oy: o.oy })),
  day: () => gameDay(),
  stats: () => ({ deaths: world.deaths, born: world.bornCount, arrived: world.arrived, hunts: world.hunts, misses: world.misses,
                  births: world.births, migrations: world.migrations, seeds: world.seeds, eggsEaten: world.eggsEaten,
                  immigrants: world.immigrants }),
  newWorld(seed, test) { world.testMap = test; world.N = test ? TEST_RADIUS : RADIUS_MIN; world.seed = seed; generate(); },
  simulate: days => simulate(days),
};
