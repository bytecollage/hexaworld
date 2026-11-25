// Fingerprint adapter for world.old.html (original Spanish code). Dev tool only.
const FP = {
  world: () => ({ cells: mundo.celdas, animals: mundo.animales.filter(a => !a.borrar).map(a => ({ type: a.tipo, dead: !!a.muerto, x: a.x, y: a.y })) }),
  terrains: () => TERRENOS,
  terrainAt: i => terreno(i),
  objectsAt: i => objs(i).map(o => ({ type: o.tipo, ox: o.ox, oy: o.oy })),
  day: () => diaDeJuego(),
  stats: () => ({ deaths: mundo.muertes, born: mundo.nacidos, arrived: mundo.llegados, hunts: mundo.cazas, misses: mundo.fallos,
                  births: mundo.nacimientos, migrations: mundo.migraciones, seeds: mundo.semillas, eggsEaten: mundo.huevosComidos,
                  immigrants: mundo.inmigrantes }),
  newWorld(seed, test) { mundo.prueba = test; mundo.N = test ? RADIO_PRUEBA : RADIO_MIN; mundo.semilla = seed; generar(); },
  simulate: days => simular(days),
};
