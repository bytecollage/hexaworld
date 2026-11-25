// Rabbits: Lives in burrows in meadows; eats tall grass and flowers.
defineFauna({
  id: "rabbit",
  name: { one: "Rabbit", many: "Rabbits" },
  tags: ["huntable", "stunnable", "catchable", "smallPrey"],
  hide: 1, bones: 1,                                // given when its meat is cut
  live: { icon: "🐇", name: "Live rabbit", diet: ["grass", "flowers"] },
  zone: landZone, step: 1.5, speed: 2.4, walk: 1.1, wait: [3, 9],
  life: { min: 30, max: 50 },
  alert: 3,
  needs: { thirst: 1, hunger: 1, dies: 3, diet: new Set(["tallGrass", "flowers"]), hidden: true, house: true, fleeing: 2.5 },   // they live in burrows
  breed: { seasons: [0, 1], pct: 0.6, litter: [2, 5], food: true, cap: 2 },
  spawn: {                                          // groups of 3-5 in their burrow, in meadows from which a lake can be reached
    phase: 100, normalOnly: true,
    run(ctx) {
      const meadow = ctx.grass.filter(i => objs(i).length < MAX_PER_CELL && !isGrove(i));
      for (let k = 0; k < Math.max(3, Math.round(ctx.grass.length / (900 * CELL_AREA))) && meadow.length; k++) {
        const i = ctx.pick(meadow);
        addObject(i, "burrow");
        for (let n = 3 + Math.floor(rnd() * 3); n > 0; n--) Object.assign(ctx.add("rabbit", i, 0.4), { burrow: i, inShelter: true, shelter: i });
      }
    },
  },
  draw(it) { small(it, { torso: "#9c8b76", dark: "#5d5144", head: "#a99781", len: 0.1, tall: 0.11, legs: 0.045,
    tail: (x, y, s, scl) => circle(x, y - scl * 0.01, scl * 0.03, "#f4f1ea"),
    face: (hx, hy, s, scl) => { ctx.fillStyle = "#a99781";                          // long ears
      for (const o of [-0.02, 0.01]) { ctx.beginPath(); ctx.ellipse(hx - s * scl * (0.03 - o), hy - scl * 0.085, scl * 0.014, scl * 0.05, s * 0.2, 0, TAU); ctx.fill(); }
      circle(hx + s * scl * 0.02, hy - scl * 0.005, scl * 0.01, "#1f1e1c"); } }); },
});
