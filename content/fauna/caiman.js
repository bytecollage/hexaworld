// Caimans: Lies in wait on lake shores; dangerous to the character in the dark.
defineFauna({
  id: "caiman",
  name: { one: "Caiman", many: "Caimans" },
  tags: ["drawnInWater"],
  zone: i => world.lake[i] === 1 || (world.lakeShore[i] === 1 && !blocked(i)), step: 1, speed: 0.5, wait: [6, 18],
  grows: { min: 0.4, days: 40 },
  life: { min: 400, max: 600 },
  hunt: {
    preys: new Set(["deer", "peccary", "coati", "raccoon", "opossum", "armadillo", "rabbit", "frog"]), cycle: 12, dies: 30,
    active: "always", mode: "ambusher", success: 0.25, restTime: 2, radius: 2, sates: 0.5,
    onlyWeak: new Set(["deer", "peccary"]), onlyShore: true, attackRadius: 1.3,   // big ones, only when weak
    threatensPlayer: "shore",                       // in the dark it attacks the character on the lake shore
  },
  breed: { seasons: [1], pct: 0.3, litter: [1, 1], food: true, cap: 1 },
  spawn: {                                          // one adult in each big lake (max. 3), on its shore
    phase: 180, normalOnly: true,
    run(ctx) {
      const lakes = {}, compL = components(i => world.lake[i] === 1);
      for (let i = 0; i < world.cells.length; i++) if (world.lake[i]) (lakes[compL[i]] ||= []).push(i);
      Object.values(lakes).filter(l => l.length >= 15).sort((a, b) => b.length - a.length).slice(0, 3).forEach(l => {
        const shore = l.filter(i => world.toLand[i] === 1);
        ctx.adult(ctx.add("caiman", ctx.pick(shore.length ? shore : l), 0.2));
      });
    },
  },
  draw(it) {                     // long and almost submerged: back, snout, tail and eyes
    const a = it.a, d = a.dir, f = sizeOf(a) * 1.1, c = Math.cos(d), s = Math.sin(d);
    ctx.save(); ctx.globalAlpha *= 0.88;
    ctx.beginPath(); groundEllipse(it.x - c * 0.62 * f, it.y - s * 0.62 * f, 0.36 * f, 0.06 * f, d + Math.sin(a.phase * 1.5) * 0.12); ctx.fillStyle = "#3a5229"; ctx.fill();
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.5 * f, 0.13 * f, d); ctx.fillStyle = "#3f5b2e"; ctx.fill();
    ctx.beginPath(); groundEllipse(it.x + c * 0.55 * f, it.y + s * 0.55 * f, 0.24 * f, 0.07 * f, d); ctx.fillStyle = "#4d6d37"; ctx.fill();
    for (const side of [-1, 1]) {
      const q = project(it.x + c * 0.42 * f - s * 0.06 * side * f, it.y + s * 0.42 * f + c * 0.06 * side * f);
      if (q) circle(q[0], q[1] - 2, cam.zoom * q[2] * 0.03, "#c9c04a");
    }
    ctx.restore();
  },
});
