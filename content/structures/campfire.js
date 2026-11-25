// Campfire: lights the night until dawn; keeps predators away.
defineStructure({
  id: "campfire",
  name: "Campfire",
  draw(it) {                     // crossed logs; lit, dancing flames; extinguished, ashes
    const [scl, tall] = sizes(it), { p } = it, o = it.o, alive = burning(o), t = performance.now() / 1000;
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.3, 0.22); ctx.fillStyle = alive ? "rgba(40,25,10,.45)" : "rgba(70,70,70,.55)"; ctx.fill();
    ctx.lineCap = "round"; ctx.lineWidth = Math.max(2, scl * 0.07);
    for (const [a, b, c] of [[-0.22, 0.05, "#6b4423"], [0.22, 0.05, "#7a5230"], [0, -0.06, "#5d3b1e"]]) {
      ctx.strokeStyle = alive ? c : "#3a3530";
      ctx.beginPath(); ctx.moveTo(p[0] + a * scl, p[1] + b * tall); ctx.lineTo(p[0] - a * scl * 0.4, p[1] - tall * 0.06); ctx.stroke();
    }
    if (!alive) { circle(p[0], p[1] - tall * 0.03, scl * 0.06, "#2a2724"); return; }
    flames(p[0], p[1] - tall * 0.05, scl * 0.85, tall * 0.75, t, it.i);
  },
});
