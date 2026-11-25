// Eagles: Day predator: circles over its nest and dives on small animals in sight.
defineFauna({
  id: "eagle",
  name: { one: "Eagle", many: "Eagles" },
  flies: true, zone: () => true, step: 6, speed: 2.5, wait: [1, 3],
  life: { min: 300, max: 400 },
  hunt: {
    preys: new Set(["coati", "raccoon", "opossum", "armadillo", "rabbit", "frog", "fish", "school", "crab"]), cycle: 6, dies: 10,
    active: "day", mode: "chase", view: 10, attack: 2, huntsFrom: 0.5, soar: 3.5, huntSpeed: 2.5, success: 0.35, restTime: 0.4, chaseTime: 8, stealth: 0.4, reach: 0.7,
    fishInShallowOnly: true,                        // it only catches fish in shallow water
  },
  breed: { seasons: [0], pct: 0.3, litter: [1, 1], food: true, cap: 1.5 },
  spawn: {                                          // adults nesting in adult pines: 1 per 25 small preys (min. 2)
    phase: 170, normalOnly: true,
    run(ctx) {
      const pines = world.trees.filter(o => DEF[o.type].tree.nests && isAdult(o));
      for (let k = 0; k < Math.max(2, Math.round(ctx.countTag("smallPrey") / 25)) && pines.length; k++) ctx.adult(ctx.add("eagle", ctx.pick(pines).i, 0.2));
    },
  },
  draw(it) { bird(it, { wings: "#4a3320", torso: "#5a3d25", head: "#f1ede4", wingspan: 0.45, altitude: 3.2, flap: 4 }); },
});
