// Cage: holds 4 live animals with a feeder and a trough.
defineStructure({
  id: "cage",
  name: "Cage",
  draw(it) {                      // wooden cage with a small roof (turned its own way in the world); inside, its animals and the trough
    const [scl] = sizes(it), o = it.o, d = hash(o.sem, 77) * Math.PI, HU = 0.31, HW = 0.22, H = 0.5;
    shadow(it.x, it.y, 0.42);
    ctx.lineWidth = Math.max(1, scl * 0.022);
    stickBox(it.x, it.y, d, HU, HW, H, 6, "#7a5230", Q => {
      const fl = [Q(HU, HW, 0.03), Q(-HU, HW, 0.03), Q(-HU, -HW, 0.03), Q(HU, -HW, 0.03)];
      if (fl.every(Boolean)) { ctx.beginPath(); fl.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = "#6b4423"; ctx.fill(); }
      if (o.water > 0) { const c = Math.cos(d), s = Math.sin(d); ctx.beginPath(); groundEllipse(it.x + c * 0.2 + s * 0.1, it.y + s * 0.2 - c * 0.1, 0.06, 0.03, d); ctx.fillStyle = "#4a93cf"; ctx.fill(); }
      ctx.font = `${Math.max(9, scl * 0.15)}px "Apple Color Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      o.animals.forEach((a, k) => { const A = Q(-0.2 + 0.13 * k, 0, 0.16); if (A) ctx.fillText(ICONS[a.type], A[0], A[1] + Math.sin(performance.now() / 300 + k)); });
    });
    const Q = (u, w, z) => bodyPoint(it.x, it.y, d, u, w, z);           // roof: two slopes, the far one first
    const near = sideSeen(d, 0, 1) ? 1 : -1;
    for (const side of [-near, near]) {
      const pts = [Q(-HU - 0.04, 0, H + 0.16), Q(HU + 0.04, 0, H + 0.16), Q(HU + 0.04, side * (HW + 0.04), H), Q(-HU - 0.04, side * (HW + 0.04), H)];
      if (!pts.every(Boolean)) continue;
      ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = side === near ? "#8a5a2b" : "#734a22"; ctx.fill();
    }
  },
});
