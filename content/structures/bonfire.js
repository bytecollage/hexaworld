// Bonfire: ring of stones; brightest fire, can be stoked with wood or grass.
defineStructure({
  id: "bonfire",
  name: "Bonfire",
  draw(it) {                    // ring of stones with a big fire; extinguished, only stones and embers
    const [scl, tall] = sizes(it), { p } = it, o = it.o, alive = burning(o), t = performance.now() / 1000;
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.4, 0.3); ctx.fillStyle = "rgba(30,22,15,.55)"; ctx.fill();
    const stones = [];
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, q = project(it.x + Math.cos(a) * 0.32, it.y + Math.sin(a) * 0.26); if (q) stones.push([q, a]); }
    const behind = stones.filter(([, a]) => Math.sin(a) < 0), front = stones.filter(([, a]) => Math.sin(a) >= 0);
    const stone = ([q]) => { const e = cam.zoom * q[2]; ctx.beginPath(); ctx.ellipse(q[0], q[1] - e * 0.04, e * 0.08, e * 0.06, 0, 0, TAU); ctx.fillStyle = "#8d8a84"; ctx.fill(); ctx.strokeStyle = "#55524d"; ctx.lineWidth = 1; ctx.stroke(); };
    behind.forEach(stone);
    ctx.lineCap = "round"; ctx.lineWidth = Math.max(2, scl * 0.07); ctx.strokeStyle = alive ? "#6b4423" : "#2f2a26";
    ctx.beginPath(); ctx.moveTo(p[0] - scl * 0.18, p[1]); ctx.lineTo(p[0] + scl * 0.12, p[1] - tall * 0.08); ctx.moveTo(p[0] + scl * 0.18, p[1]); ctx.lineTo(p[0] - scl * 0.12, p[1] - tall * 0.08); ctx.stroke();
    if (alive) flames(p[0], p[1] - tall * 0.06, scl * 1.2, tall * 1.1, t, it.i);
    else { circle(p[0], p[1] - tall * 0.03, scl * 0.07, "#3b2a20"); circle(p[0] + scl * 0.03, p[1] - tall * 0.04, scl * 0.025, "#c0392b"); }
    front.forEach(stone);
  },
});
