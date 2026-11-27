// Cage: 5 slots for live animals, their food and jars of water (they eat and drink from them by themselves).
defineStructure({
  id: "cage",
  name: "Cage",
  hoverable: true,                                  // lit up under the mouse, like the chest and the house
  draw(it) {                      // wooden cage with a small roof (turned its own way in the world); inside, its animals and the trough
    const n = o0 => o0.storage?.length || 5, [scl] = sizes(it), o = it.o, d = hash(o.sem, 77) * Math.PI, HU = 0.31 + 0.055 * (n(o) - 5), HW = 0.22, H = 0.5;   // longer with each slot added (5 … 10)
    shadow(it.x, it.y, 0.42 + 0.05 * (n(o) - 5));
    ctx.lineWidth = Math.max(1, scl * 0.022);
    stickBox(it.x, it.y, d, HU, HW, H, 6, "#7a5230", Q => {
      const fl = [Q(HU, HW, 0.03), Q(-HU, HW, 0.03), Q(-HU, -HW, 0.03), Q(HU, -HW, 0.03)];
      if (fl.every(Boolean)) { ctx.beginPath(); fl.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = "#6b4423"; ctx.fill(); }
      if (o.storage?.some(r => r?.type === "jar" && r.water > 0)) {   // a jar with water: the trough is full
       const c = Math.cos(d), s = Math.sin(d); ctx.beginPath(); groundEllipse(it.x + c * 0.2 + s * 0.1, it.y + s * 0.2 - c * 0.1, 0.06, 0.03, d); ctx.fillStyle = "#4a93cf"; ctx.fill(); }
      ctx.font = `${Math.max(9, scl * 0.15)}px "Apple Color Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const inside = cageLiving(o);                   // its animals, spread along the cage, drawn as on the map
      inside.forEach((a, k) => { const A = Q(-HU + 0.12 + (2 * HU - 0.24) * (inside.length > 1 ? k / (inside.length - 1) : 0.5), 0, 0.14); if (A) drawAnimalIcon(a.type, A[0], A[1] + Math.sin(performance.now() / 300 + k), Math.max(10, scl * 0.22)); });
    });
    const Q = (u, w, z) => bodyPoint(it.x, it.y, d, u, w, z);           // roof: two slopes, the far one first
    const near = sideSeen(d, 0, 1) ? 1 : -1;
    for (const side of [-near, near]) {
      const pts = [Q(-HU - 0.04, 0, H + 0.16), Q(HU + 0.04, 0, H + 0.16), Q(HU + 0.04, side * (HW + 0.04), H), Q(-HU - 0.04, side * (HW + 0.04), H)];
      if (!pts.every(Boolean)) continue;
      ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = side === near ? "#8a5a2b" : "#734a22"; ctx.fill();
    }
    if (cageLiving(o).length) { const h = worstHealth(cageLiving(o)), top = Q(0, 0, H + 0.3); if (top) worldBar(top[0], top[1], Math.max(18, scl * 0.4), h.v, healthColor(h)); }   // the weakest one's food/water
  },
});
