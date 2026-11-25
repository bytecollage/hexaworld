// Loose stones: scattered and around outcrops; gathered as stones.
defineItem({
  id: "stones",
  name: "Stones",
  icon: "🪨",
  groundName: "Loose stones",
  layer: "low",
  movedByHouse: true,
  harvest: { gives: "stones", time: 0.5, amount: o => 2 + Math.floor(hash(o.sem, 68) * 2), remove: true },
  draw(it) {                    // 2-3 small stones
    const n = 2 + Math.floor(hash(it.i, 68) * 2);
    for (let k = 0; k < n; k++) {
      const a = hash(it.i, 69 + k) * TAU, d = 0.12 + hash(it.i, 72 + k) * 0.15, r = 0.07 + hash(it.i, 75 + k) * 0.07;
      const x = it.x + Math.cos(a) * d, y = it.y + Math.sin(a) * d, p = project(x, y);
      if (!p) continue;
      const scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
      ctx.beginPath(); groundEllipse(x, y, r * 1.1, r * 0.9); ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fill();
      ctx.beginPath(); ctx.ellipse(p[0], p[1] - tall * r * 0.5, scl * r, tall * r * 0.8, 0, 0, TAU);
      ctx.fillStyle = ["#8c8a85", "#9a978f", "#7d7b76"][k % 3]; ctx.fill();
      ctx.beginPath(); ctx.ellipse(p[0] - scl * r * 0.25, p[1] - tall * r * 0.8, scl * r * 0.45, tall * r * 0.3, 0, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fill();
    }
  },
});
