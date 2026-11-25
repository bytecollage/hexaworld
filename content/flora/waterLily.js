// Water lily: floating leaf, lakes only.
defineFlora({
  id: "waterLily",
  name: "Water lily",
  layer: "flat",                                    // drawn flat on the water, under everything else
  draw(it) {                    // round leaf with a notch, flat on the water
    const turn = hash(it.i, 63) * TAU;
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.32, 0.32, turn, 0.35, TAU - 0.05, 16);
    const p = project(it.x, it.y); if (p) ctx.lineTo(p[0], p[1]);
    ctx.closePath(); ctx.fillStyle = "#3f8f3a"; ctx.fill();
    ctx.strokeStyle = "rgba(20,60,20,.6)"; ctx.lineWidth = 1; ctx.stroke();
  },
});
