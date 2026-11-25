// Flowers: 1 unit of food for small animals and bees; regrow after being eaten.
defineFlora({
  id: "flowers",
  name: "Flowers",
  icon: "🌼",                                       // also an inventory resource
  fuel: 0.01,                                       // days of fire it adds when thrown on a fire
  chart: "Flower tufts",
  layer: "low",
  plantable: true,
  movedByHouse: true,
  sapling: { icon: "🌸", name: "Flower sapling", fuel: 0.01 },
  harvest: { gives: "flowers", time: 0.5, ready: o => o.food > 0, amount: () => 1, take: o => { o.food = 0; o.regrowAt = gameDay() + REGROW_DAYS; world.regrowths.push({ o, at: o.regrowAt }); } },   // cut; they regrow
  food: { units: 1, preference: 3 },
  driesInWinter: 0.02,
  draw(it) {                     // small tuft of little flowers
    const color = ["#f7d046", "#ffffff", "#f29ac0", "#b48cf2", "#ff8a5c"][Math.floor(hash(it.i, 76) * 5)];
    const n = 3 + Math.floor(hash(it.i, 77) * 3);
    for (let k = 0; k < n; k++) {
      const a = hash(it.i, 78 + k) * TAU, d = hash(it.i, 84 + k) * 0.3;
      const x = it.x + Math.cos(a) * d, y = it.y + Math.sin(a) * d, p = project(x, y);
      if (!p) continue;
      const scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45), h = tall * 0.18;
      ctx.strokeStyle = "#3d7a33"; ctx.lineWidth = Math.max(1, scl * 0.015);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - h); ctx.stroke();
      const f = it.o.food === 0 ? regrow(it.o) : 1;   // eaten: only stems; on the last day the flowers open up
      if (f <= 0) continue;
      for (let q = 0; q < 4; q++) circle(p[0] + Math.cos(q * 1.57) * scl * 0.025 * f, p[1] - h + Math.sin(q * 1.57) * scl * 0.02 * f, scl * 0.022 * f, color);
      circle(p[0], p[1] - h, scl * 0.015 * f, "#f5c518");
    }
  },
});
