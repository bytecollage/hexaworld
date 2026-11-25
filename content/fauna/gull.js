// Gulls: sea birds; by day they circle over the coast and dive for fish and crabs; at night they rest on the beach.
defineFauna({
  id: "gull",
  name: { one: "Gull", many: "Gulls" },
  flies: true, zone: () => true, step: 6, speed: 2.4, wait: [1, 3],
  life: { min: 100, max: 160 },
  hunt: {
    preys: new Set(["fish", "school", "crab"]), cycle: 4, dies: 8, active: "day", mode: "chase",
    view: 6, attack: 1.5, huntSpeed: 2.2, success: 0.35, restTime: 0.25, chaseTime: 6, stealth: 0.5, reach: 0.6,
    huntsFrom: 0.4, soar: 3, perch: 0,                      // hunts as soon as it is a bit hungry; circles 3 cells around its beach
  },
  breed: { seasons: [0], pct: 0.4, litter: [1, 2], food: true, cap: 1.6 },
  spawn: {                                          // flocks on sea beaches: 1 per 60 beach cells (min. 4)
    phase: 205, normalOnly: true,
    run(ctx) {
      const beach = ctx.of(i => terrain(i) === "sand" && world.toWater[i] === 1 && !world.lakeShore[i]);
      for (let k = 0; k < Math.max(4, Math.round(beach.length / (60 * CELL_AREA))) && beach.length; k++) ctx.adult(ctx.add("gull", ctx.pick(beach), 0.3));
    },
  },
  draw(it) { bird(it, { wings: "#c4cbd2", torso: "#f6f8f9", head: "#ffffff", wingspan: 0.38, altitude: 2.2, flap: 6 }); },
});
