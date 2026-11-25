// Fruit: falls from fruit trees; rots after 5 days and may sprout.
defineItem({
  id: "fruit",
  name: "Fruit",
  icon: "🍎",
  groundName: "Fallen fruit",
  fuel: 0.02,                                       // days of fire it adds when thrown on a fire (juicy: burns badly)
  layer: "low",
  movedByHouse: true,
  harvest: { gives: "fruit", time: 0.5, amount: () => 1, remove: true },
  food: { whole: true, preference: 1 },             // eaten whole
  sprouts: { plant: "fruitTree", ground: "grass", chance: 1 },   // when it rots it may sprout (× the base 20%)
  draw(it) {                      // fruit fallen on the ground (food for deer)
    const p = it.p, scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.11, 0.08); ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fill();
    circle(p[0], p[1] - tall * 0.07, scl * 0.08, fruitColor(it.o.mother ?? it.i));
    circle(p[0] - scl * 0.025, p[1] - tall * 0.07 - scl * 0.03, scl * 0.025, "rgba(255,255,255,.45)");
    ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = Math.max(1, scl * 0.015);
    ctx.beginPath(); ctx.moveTo(p[0], p[1] - tall * 0.07 - scl * 0.07); ctx.lineTo(p[0] + scl * 0.02, p[1] - tall * 0.07 - scl * 0.12); ctx.stroke();
  },
});
