// Branches: lie on the ground, mostly in forests; gathered as wood.
defineItem({
  id: "branches",
  name: "Wood",                                     // in the inventory
  icon: "🪵",
  groundName: "Branches",
  fuel: 0.12,                                       // days of fire it adds when thrown on a fire
  layer: "low",
  movedByHouse: true,
  harvest: { gives: "branches", time: 0.5, amount: o => 2 + Math.floor(hash(o.sem, 710) * 2), remove: true },   // as many as can be seen
  draw(it) {                      // 2-3 dry branches lying on the ground, with some twig
    const n = 2 + Math.floor(hash(it.i, 710) * 2);
    for (let k = 0; k < n; k++) {
      const a = hash(it.i, 711 + k) * Math.PI, L = 0.2 + hash(it.i, 715 + k) * 0.14;
      const cx = it.x + (hash(it.i, 720 + k) - 0.5) * 0.3, cy = it.y + (hash(it.i, 725 + k) - 0.5) * 0.25;
      const p0 = project(cx - Math.cos(a) * L, cy - Math.sin(a) * L), p1 = project(cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      if (!p0 || !p1) continue;
      const scl = cam.zoom * p0[2];
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(0,0,0,.22)"; ctx.lineWidth = Math.max(2, scl * 0.075);          // shadow
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1] + 1); ctx.lineTo(p1[0], p1[1] + 1); ctx.stroke();
      ctx.strokeStyle = ["#7a5230", "#8b6038", "#6b4528"][k % 3]; ctx.lineWidth = Math.max(1.6, scl * 0.06);
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      const t = 0.35 + hash(it.i, 730 + k) * 0.3, mx = p0[0] + (p1[0] - p0[0]) * t, my = p0[1] + (p1[1] - p0[1]) * t;   // twig
      const side = hash(it.i, 735 + k) < 0.5 ? -1 : 1;
      ctx.lineWidth = Math.max(1, scl * 0.032);
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + (p1[0] - p0[0]) * 0.25 + side * scl * 0.05, my + (p1[1] - p0[1]) * 0.25 - scl * 0.04); ctx.stroke();
    }
  },
});
