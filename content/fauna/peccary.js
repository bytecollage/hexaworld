// Peccaries: Omnivore in herds; competes with deer for fruit and tall grass.
defineFauna({
  id: "peccary",
  name: { one: "Peccary", many: "Peccaries" },
  tags: ["huntable", "bigPrey"],
  meat: 3,
  hide: 1, bones: 2,                              // also given when its meat is cut
  zone: landZone, step: 2.5, speed: 1.8, walk: 0.6, wait: [4, 12],
  grows: { min: 0.5, days: 15 },
  life: { min: 120, max: 180 },
  alert: 2.5,
  needs: { thirst: 0.5, hunger: 0.6, dies: 4, diet: new Set(["fruit", "bush", "tallGrass"]), hidden: false, fleeing: 3 },
  breed: { seasons: [0], pct: 0.4, litter: [2, 3], food: true, cap: 2 },
  spawn: {                                          // herds of 4-6
    phase: 110, normalOnly: true,
    run(ctx) {
      for (let k = 0; k < Math.max(1, Math.round(ctx.grass.length / (2500 * CELL_AREA))); k++) {
        const c = ctx.pick(ctx.grass); if (c === undefined) break;   // no grassland that reaches a lake (tiny worlds)
        const near = [c, ...world.neighbors[c]].filter(i => SPECIES.peccary.zone(i));
        const herd = []; for (let n = 4 + Math.floor(rnd() * 3); n > 0; n--) herd.push(ctx.add("peccary", ctx.pick(near), 0.5));
        ctx.adult(herd[0]); ctx.adult(herd[1]);         // (null when a cell was missing: adult() skips it)
      }
    },
  },
  bigCarcass: true,
  draw(it) { small(it, { torso: "#4a4440", dark: "#262220", head: "#55504b", len: 0.2, tall: 0.17, legs: 0.1,
    tail: (x, y, s, scl) => circle(x, y, scl * 0.015, "#262220"),
    shell: (ring, scl) => { ctx.strokeStyle = "rgba(225,220,210,.75)"; ctx.lineWidth = Math.max(1, scl * 0.025);   // light collar
      ctx.beginPath(); ring(0.55, -0.2, Math.PI + 0.2); ctx.stroke(); },
    face: (hx, hy, s, scl) => { ctx.fillStyle = "#3a3532"; ctx.fillRect(hx + (s > 0 ? 0 : -scl * 0.09), hy - scl * 0.015, scl * 0.09, scl * 0.04);
      circle(hx + s * scl * 0.09, hy + scl * 0.005, scl * 0.02, "#2a2522"); } }); },
});
