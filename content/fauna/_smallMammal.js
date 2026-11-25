// Shared base for the small forest mammals (coati, raccoon, opossum, armadillo): spread it into their definitions.
// They live hidden in forests, eat fruit, berries and flowers once a day, starve after 5 days and are drawn to trap bait.
const SMALL_MAMMAL = Object.freeze({
  zone: landZone, step: 2, wait: [3, 10], alert: 2,
  bones: 1,                                         // given when its meat is cut (no hide: too small)
  needs: {
    thirst: 1, hunger: 1, dies: 5, hidden: true, fleeing: 2,
    diet: Object.assign(new Set(["fruit", "bush", "flowers"]), { takesBait: true }),   // trap bait (fruit or berries) attracts them
  },
  life: { min: 40, max: 60 },
  breed: { seasons: [0], pct: 0.8, litter: [2, 4], food: true, cap: 2.5 },
});

// They are placed together (one random species per spot), already hidden in the forests:
// 1-3 per forest that reaches a lake (test map: 2 of each species).
defineSpawner({
  id: "smallMammals", phase: 20,
  run(ctx) {
    const SMALL = idsWithTag("smallMammal"); if (!SMALL.length) return;
    const forests = {}, inForest = ctx.inForest();
    for (const i of inForest) (forests[world.forestComp[i]] ||= []).push(i);
    const place = (type, i) => { const a = ctx.add(type, i, 0.5); a.inShelter = true; a.shelter = i; };
    if (ctx.testMap) {
      for (let k = 0; k < 2 * SMALL.length && inForest.length; k++) place(SMALL[k % SMALL.length], inForest[Math.floor(rnd() * inForest.length)]);
    } else for (const cells of Object.values(forests)) {
      const size = cells.length / CELL_AREA;             // in reference cells
      if (size < 1) continue;                             // a couple of loose pines is not a forest
      const howMany = 1 + (size >= 8) + (size >= 20);
      for (let k = 0; k < howMany; k++) { const i = cells[Math.floor(rnd() * cells.length)]; place(SMALL[Math.floor(rnd() * SMALL.length)], i); }
    }
  },
});
