// Reeds: thin stems at lake edges.
defineFlora({
  id: "reeds",
  name: "Reeds",
  draw(it) {                     // thin stems with brown spikes
    const [scl, tall] = sizes(it), { p } = it;
    ctx.lineCap = "round";
    for (let k = 0; k < 4; k++) {
      const dx = (k - 1.5) * scl * 0.09, h = tall * (0.55 + 0.12 * ((k * 7 + it.i) % 3)), inc = (k - 1.5) * scl * 0.04;
      ctx.strokeStyle = "#5f8a3a"; ctx.lineWidth = Math.max(1, scl * 0.03);
      ctx.beginPath(); ctx.moveTo(p[0] + dx, p[1]); ctx.lineTo(p[0] + dx + inc, p[1] - h); ctx.stroke();
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = Math.max(2, scl * 0.07);
      ctx.beginPath(); ctx.moveTo(p[0] + dx + inc * 0.8, p[1] - h * 0.8); ctx.lineTo(p[0] + dx + inc * 0.95, p[1] - h * 0.97); ctx.stroke();
    }
  },
});
