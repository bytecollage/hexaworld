// Turtle nest: sand mound with eggs; hatches after 5 days; foxes eat it.
defineFeature({
  id: "nest",
  name: "Turtle nest",
  chart: "Turtle nests",
  layer: "low",
  draw(it) {                       // sand mound with turtle eggs
    const p = it.p, scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.2, 0.15); ctx.fillStyle = "#c9ad6a"; ctx.fill();
    for (let k = 0; k < Math.min(5, it.o.eggs); k++) circle(p[0] + (k - 2) * scl * 0.04, p[1] - tall * 0.04 - (k % 2) * tall * 0.03, scl * 0.025, "#f6f1e4");
  },
});
