// Crabs: Sea beach shoreline; walks sideways.
defineFauna({
  id: "crab",
  name: { one: "Crab", many: "Crabs" },
  zone: i => !world.lake[i] && world.outcropAt[i] < 0 &&
    ((terrain(i) === "sand" && world.toWater[i] === 1) || (terrain(i) === "water" && world.toLand[i] === 1)),
  step: 1, speed: 0.9, walk: 0.5, wait: [3, 10],
  life: { min: 40, max: 60 },
  alert: 1,
  breed: { seasons: [1], pct: 0.5, litter: [2, 4], cap: 1.5 },
  spawn: {                                          // on the sea beaches
    phase: 120, normalOnly: true,
    run(ctx) {
      const beach = ctx.of(SPECIES.crab.zone);
      for (let k = 0; k < Math.round(beach.length / (35 * CELL_AREA)); k++) ctx.add("crab", ctx.pick(beach), 0.4);
    },
  },
  draw(it) {                   // red shell with pincers, walks sideways
    const [scl, tall] = sizes(it), { p } = it, a = it.a, w = scl * 0.09, h = tall * 0.06, leg = a.moving ? Math.sin(a.phase * 22) * scl * 0.012 : 0;
    ctx.strokeStyle = "#a8321f"; ctx.lineWidth = Math.max(1, scl * 0.015);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      ctx.beginPath(); ctx.moveTo(p[0] + s * w * 0.6, p[1] - h * 0.5); ctx.lineTo(p[0] + s * (w * 1.3 + leg), p[1] - h * 0.4 + (k - 1) * h * 0.7); ctx.stroke();
    }
    circle(p[0] - w * 1.2, p[1] - h * 1.4, scl * 0.03, "#e0533a"); circle(p[0] + w * 1.2, p[1] - h * 1.4, scl * 0.03, "#e0533a");
    ctx.beginPath(); ctx.ellipse(p[0], p[1] - h * 0.7, w, h, 0, 0, TAU); ctx.fillStyle = "#d6452f"; ctx.fill();
    circle(p[0] - w * 0.3, p[1] - h * 1.6, scl * 0.01, "#1f1e1c"); circle(p[0] + w * 0.3, p[1] - h * 1.6, scl * 0.01, "#1f1e1c");
  },
});
