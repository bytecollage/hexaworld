// Whales: Ocean only; spouts now and then and keeps swimming at night.
defineFauna({
  id: "whale",
  name: { one: "Whale", many: "Whales" },
  tags: ["underwater", "drawnInWater"],
  zone: i => terrain(i) === "deep",
  step: 5, speed: 0.6, wait: [1, 4],
  grows: { min: 0.5, days: 40 },
  life: { min: 600, max: 800 },
  breed: { seasons: [0], pct: 0.15, litter: [1, 1], cap: 1.5 },
  spawn: { phase: 80, run: ctx => ctx.sow("whale", 900) },
  draw(it) {                    // whale: big shadow under the surface; every now and then it spouts; grows with age
    const a = it.a, d = a.dir, c = Math.cos(d), s = Math.sin(d), beat = Math.sin(a.phase * 1.6) * 0.3, t = sizeOf(a);
    const P = (u, v) => project(it.x + (u * c - v * s) * t, it.y + (u * s + v * c) * t);
    ctx.save(); ctx.globalAlpha *= 0.55;
    ctx.beginPath(); groundEllipse(it.x, it.y, 1.05 * t, 0.34 * t, d); ctx.fillStyle = "#6f8ea8"; ctx.fill();
    ctx.beginPath(); groundEllipse(it.x + c * 0.15 * t, it.y + s * 0.15 * t, 0.7 * t, 0.18 * t, d); ctx.fillStyle = "#8eabc2"; ctx.fill();   // back
    const cb = Math.cos(d + beat), sb = Math.sin(d + beat), Q = (u, v) => project(it.x + (-c * 0.95 + u * cb - v * sb) * t, it.y + (-s * 0.95 + u * sb + v * cb) * t);
    const fin = [Q(0, 0), Q(-0.35, 0.38), Q(-0.18, 0), Q(-0.35, -0.38)];                 // tail fin
    if (fin.every(Boolean)) { ctx.beginPath(); fin.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = "#6f8ea8"; ctx.fill(); }
    ctx.restore();
    const cycle = (a.phase + (a.sem % 9)) % 9;                                                // spout every ~9 s
    const h = P(0.75, 0);
    if (cycle < 1.4 && h) {
      const scl = cam.zoom * h[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45), f = Math.sin(cycle / 1.4 * Math.PI);
      ctx.save(); ctx.globalAlpha *= 0.75 * f; ctx.fillStyle = "#f4f9fc";
      for (let k = 0; k < 5; k++) circle(h[0] + (k - 2) * scl * 0.05 * f, h[1] - tall * (0.25 + 0.25 * f) - Math.abs(k - 2) * tall * 0.05, scl * (0.07 + 0.03 * f), "#f4f9fc");
      ctx.restore();
    }
  },
});
