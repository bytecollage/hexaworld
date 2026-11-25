// Axe lying on the ground after being thrown; must be picked up.
defineItem({
  id: "groundAxe",
  name: "Axe",
  groundName: "Axe",
  layer: "low",
  harvest: { gives: "axe", time: 0.5, amount: () => 1, remove: true },
  draw(it) {                 // the axe lying on the ground (it must be picked up)
    const p = it.p, scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.16, 0.06); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill();
    ctx.lineCap = "round"; ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = Math.max(1.5, scl * 0.035);
    ctx.beginPath(); ctx.moveTo(p[0] - scl * 0.14, p[1] - tall * 0.02); ctx.lineTo(p[0] + scl * 0.12, p[1] - tall * 0.06); ctx.stroke();
    ctx.fillStyle = "#9aa4ad"; ctx.beginPath();
    ctx.moveTo(p[0] + scl * 0.08, p[1] - tall * 0.12); ctx.lineTo(p[0] + scl * 0.18, p[1] - tall * 0.1); ctx.lineTo(p[0] + scl * 0.16, p[1] - tall * 0.0); ctx.lineTo(p[0] + scl * 0.08, p[1] - tall * 0.03); ctx.closePath(); ctx.fill();
  },
});
