// Outcrop: group of rounded rocks over 4 cells (stone source with the pickaxe).
defineFeature({
  id: "rockMound",
  name: "Outcrop · rock mound",
  outcrop: true,
  draw(it) {                  // group of rounded rocks over 4 cells
    ctx.beginPath(); groundEllipse(it.x, it.y, 1.55, 1.3, it.outcropAt.turn); ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fill();
    const rocks = [[-0.7, -0.35, 0.55], [0.55, -0.45, 0.5], [0, -0.1, 0.8], [-0.45, 0.45, 0.5], [0.6, 0.35, 0.55], [0.05, 0.6, 0.4]];
    const pieces = rocks.map(([u, v, r], k) => {
      const a = it.outcropAt.turn * Math.PI / 3, x = it.x + u * Math.cos(a) - v * Math.sin(a), y = it.y + u * Math.sin(a) + v * Math.cos(a);
      return { x, y, r, k, p: project(x, y) };
    }).filter(r => r.p).sort((a, b) => a.p[1] - b.p[1]);
    for (const r of pieces) {
      const scl = cam.zoom * r.p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
      const cx = r.p[0], cy = r.p[1] - tall * r.r * 0.55;
      ctx.beginPath(); ctx.ellipse(cx, cy, scl * r.r, tall * r.r * 0.75, 0, 0, TAU);
      ctx.fillStyle = ["#86837c", "#918d85", "#7a776f"][r.k % 3]; ctx.fill();
      ctx.strokeStyle = "rgba(40,38,34,.5)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx - scl * r.r * 0.3, cy - tall * r.r * 0.3, scl * r.r * 0.45, tall * r.r * 0.28, -0.3, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fill();
      if (r.k % 2 === 0) { ctx.strokeStyle = "rgba(60,58,52,.55)"; ctx.beginPath(); ctx.moveTo(cx + scl * r.r * 0.1, cy - tall * r.r * 0.4); ctx.lineTo(cx + scl * r.r * 0.3, cy + tall * r.r * 0.2); ctx.stroke(); }
    }
  },
});
