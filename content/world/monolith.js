// Outcrop: a single tall rock over 4 cells (stone source with the pickaxe).
defineFeature({
  id: "monolith",
  name: "Outcrop · stone monoliths",
  outcrop: true,
  draw(it) {                   // a single tall rock in the center of the outcrop
    const [scl, tall] = sizes(it), { p } = it, y = it.outcropAt;
    const h = tall * (2.7 + hash(y.id, 96) * 0.8), w = scl * 0.62, side = hash(y.id, 97) > 0.5 ? 1 : -1;
    ctx.beginPath(); groundEllipse(it.x, it.y, 1.1, 0.85, y.turn); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill();
    // irregular silhouette, narrower at the top and somewhat tilted
    const sil = [[-1, 0], [-0.95, -0.35], [-0.78, -0.72], [-0.55, -0.95], [-0.1, -1.03], [0.35, -0.97], [0.62, -0.78],
                 [0.8, -0.45], [0.92, -0.12], [1, 0]].map(([u, v]) => [p[0] + (u * w + side * -v * w * 0.18), p[1] + v * h]);
    ctx.beginPath(); sil.forEach(([x, yy], k) => k ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)); ctx.closePath();
    const g = ctx.createLinearGradient(p[0] - w, 0, p[0] + w, 0);
    g.addColorStop(0, "#a29d92"); g.addColorStop(0.45, "#8d887e"); g.addColorStop(1, "#6f6b63");
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "rgba(40,38,34,.65)"; ctx.lineWidth = 1.2; ctx.stroke();
    // cracks and moss
    ctx.strokeStyle = "rgba(55,52,46,.55)"; ctx.lineWidth = Math.max(1, scl * 0.02);
    ctx.beginPath();
    ctx.moveTo(p[0] + w * 0.15, p[1] - h * 0.92); ctx.lineTo(p[0] + w * 0.05, p[1] - h * 0.7); ctx.lineTo(p[0] + w * 0.22, p[1] - h * 0.52);
    ctx.moveTo(p[0] - w * 0.45, p[1] - h * 0.4); ctx.lineTo(p[0] - w * 0.25, p[1] - h * 0.28);
    ctx.stroke();
    ctx.fillStyle = "rgba(78,110,52,.55)";
    ctx.beginPath(); ctx.ellipse(p[0] - w * 0.2, p[1] - h * 0.08, w * 0.75, h * 0.06, 0, 0, TAU); ctx.fill();
    // rubble at the foot
    for (const [u, r] of [[-1.05, 0.13], [0.95, 0.1], [0.4, 0.08]]) {
      const x = p[0] + u * w, yy = p[1] + scl * 0.04;
      ctx.beginPath(); ctx.ellipse(x, yy - tall * r * 0.5, scl * r, tall * r * 0.7, 0, 0, TAU); ctx.fillStyle = "#86827a"; ctx.fill();
    }
  },
});
