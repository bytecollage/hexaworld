// Fence post: one per cell; posts in neighboring cells are joined by rails. No animal crosses it.
defineStructure({
  id: "fence",
  name: "Fence post",
  draw(it) { drawPost(it, false); },
});
// a vertical post with rails toward the posts in the neighboring cells (each rail is drawn by one of its two posts)
function drawPost(it, gate) {
  const o = it.o, scl = cam.zoom * it.p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45), h = 0.62;
  const top = projectUp(it.x, it.y, h);
  ctx.lineCap = "round";
  for (let k = 0; k < 6; k++) {
    const j = world.neighbors[o.i][k], other = j !== undefined && postAt(j);
    if (!other || j < o.i) continue;                                    // the lower index draws the rail
    const [dx, dy] = toPixel(...DIRS[k]), ex = it.x + dx, ey = it.y + dy, gateRail = gate || other.type === "gate";
    const pb = project(ex, ey); if (!pb) continue;
    ctx.strokeStyle = "rgba(0,0,0,.2)"; ctx.lineWidth = Math.max(2, scl * 0.05);
    ctx.beginPath(); ctx.moveTo(it.p[0], it.p[1] + 1); ctx.lineTo(pb[0], pb[1] + 1); ctx.stroke();
    ctx.strokeStyle = gateRail ? "#c49a62" : "#a8784a"; ctx.lineWidth = Math.max(1.5, scl * 0.04);
    ctx.beginPath();
    for (const f of [0.75, 0.4]) { const a = projectUp(it.x, it.y, h * f), b = projectUp(ex, ey, h * f); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
    if (gateRail) { const a = projectUp(it.x, it.y, h * 0.4), b = projectUp(ex, ey, h * 0.75); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
    ctx.stroke();
  }
  wearCracks(it, o);
  if (!top) return;
  ctx.strokeStyle = gate ? "#8a5a2b" : "#7a4e26"; ctx.lineWidth = Math.max(2, scl * 0.07);
  ctx.beginPath(); ctx.moveTo(it.p[0], it.p[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
  if (gate) { ctx.fillStyle = "#3a2614"; ctx.beginPath(); ctx.arc(top[0], top[1], Math.max(1.5, scl * 0.03), 0, TAU); ctx.fill(); }
}
