// Burrow: home of rabbits and foxes.
defineFeature({
  id: "burrow",
  name: "Burrow",
  layer: "low",
  draw(it) {                 // hole with dug-up earth
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.17, 0.12); ctx.fillStyle = "#8a7150"; ctx.fill();
    ctx.beginPath(); groundEllipse(it.x, it.y + 0.02, 0.09, 0.06); ctx.fillStyle = "#2a2015"; ctx.fill();
  },
});
