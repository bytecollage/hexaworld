// Vultures: Flies to carcasses and consumes them.
defineFauna({
  id: "vulture",
  name: { one: "Vulture", many: "Vultures" },
  flies: true, zone: () => true, step: 6, speed: 2.2, wait: [1, 3],
  life: { min: 300, max: 400 },
  hunt: { preys: new Set(), cycle: 5, dies: 20, active: "day", mode: "scavenger", view: 14, soar: 6, huntsFrom: 0.25, restTime: 0.15 },   // searches whenever a bit hungry
  breed: { seasons: [0], pct: 0.3, litter: [1, 1], food: true, cap: 2 },
  spawn: {                                          // 3 adults in adult trees
    phase: 210, normalOnly: true,
    run(ctx) {
      const trees = world.trees.filter(o => isAdult(o));
      for (let k = 0; k < 3 && trees.length; k++) ctx.adult(ctx.add("vulture", ctx.pick(trees).i, 0.2));
    },
  },
  draw(it) { bird(it, { wings: "#1f1d1c", torso: "#2a2725", head: "#d69a8a", wingspan: 0.55, altitude: 4.2, flap: 2 }); },
});
