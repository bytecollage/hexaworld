// Foxes: Night predator of small animals and nests; lives in a burrow at the forest edge.
defineFauna({
  id: "fox",
  name: { one: "Fox", many: "Foxes" },
  tags: ["huntable"],
  meat: 2,
  hide: 1, bones: 1,                              // also given when its meat is cut
  zone: i => !blocked(i), step: 2, speed: 1.4, walk: 0.8, wait: [4, 10],
  life: { min: 80, max: 120 },
  hunt: {
    preys: new Set(["coati", "raccoon", "opossum", "armadillo", "rabbit", "frog", "crab", "nest"]), cycle: 2.5, dies: 7,
    active: "night", mode: "chase", view: 8, attack: 1.6, huntSpeed: 3.2, success: 0.25, restTime: 0.3, chaseTime: 8, radius: 6,
    stealth: 0.5, reach: 0.6,
    findsHidden: true,                              // the only one that finds small mammals hidden among the pines
    fallbackFood: "fruit",                          // with no preys it eats fallen fruit
  },
  breed: { seasons: [0], pct: 0.6, litter: [2, 4], food: true, cap: 1.5 },
  spawn: {                                          // adults in a burrow at the forest edge: 1 per 25 small preys (min. 4)
    phase: 160, normalOnly: true,
    run(ctx) {
      const edges = ctx.of(i => landZone(i) && !isGrove(i) && world.neighbors[i].some(isGrove) && objs(i).length < MAX_PER_CELL && ctx.withLake.has(ctx.compD[i]));
      for (let k = 0; k < Math.max(4, Math.round(ctx.countTag("smallPrey") / 25)) && edges.length; k++) {
        const i = ctx.pick(edges); addObject(i, "burrow"); ctx.adult(ctx.add("fox", i, 0.2));
      }
    },
  },
  leavesCarcass: true,
  draw(it) { small(it, { torso: "#d2691e", dark: "#5a2d0c", head: "#de7b2c", len: 0.17, tall: 0.12, legs: 0.1,
    tail: (x, y, s, scl, tall) => {                // bushy tail with a white tip
      for (let k = 0; k < 4; k++) circle(x - s * scl * 0.05 * k, y + tall * 0.025 * k, scl * (0.045 - k * 0.004), k === 3 ? "#f3efe6" : "#c45f1a");
    },
    face: (hx, hy, s, scl) => { ctx.fillStyle = "#de7b2c"; ctx.beginPath();
      ctx.moveTo(hx, hy - scl * 0.03); ctx.lineTo(hx + s * scl * 0.1, hy + scl * 0.015); ctx.lineTo(hx, hy + scl * 0.035); ctx.closePath(); ctx.fill();
      circle(hx + s * scl * 0.1, hy + scl * 0.015, scl * 0.014, "#1f1e1c");
      ctx.fillStyle = "#5a2d0c"; ctx.beginPath(); ctx.moveTo(hx - s * scl * 0.04, hy - scl * 0.03); ctx.lineTo(hx - s * scl * 0.02, hy - scl * 0.1);
      ctx.lineTo(hx + s * scl * 0.01, hy - scl * 0.03); ctx.closePath(); ctx.fill(); } }); },
});
