// Trap: baited with fruit or berries, catches a small mammal alive.
defineStructure({
  id: "trap",
  name: "Trap",
  draw(it) {                     // box of sticks (turned its own way in the world) with its door raised; with bait, the fruit inside; with prey, closed
    const [scl] = sizes(it), o = it.o, d = hash(o.sem, 77) * Math.PI, HU = 0.15, HW = 0.11, H = 0.24;
    shadow(it.x, it.y, 0.22);
    ctx.lineWidth = Math.max(1, scl * 0.022);
    const Q = stickBox(it.x, it.y, d, HU, HW, H, 4, "#6b4423", Q => {
      const fl = [Q(HU, HW, 0.02), Q(-HU, HW, 0.02), Q(-HU, -HW, 0.02), Q(HU, -HW, 0.02)];
      if (fl.every(Boolean)) { ctx.beginPath(); fl.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = "#7a5230"; ctx.fill(); }
      const C = Q(0, 0, o.prey ? 0.12 : 0.07); if (!C) return;
      if (o.prey) { ctx.font = `${Math.max(10, scl * 0.16)}px "Apple Color Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ICONS[o.prey.type], C[0], C[1]); }
      else if (o.baitItem) circle(C[0], C[1], scl * 0.035, o.baitItem === "fruit" ? "#e5534b" : "#6a1b9a");
    });
    const door = o.prey ? [Q(HU, -HW, H), Q(HU, HW, H), Q(HU, HW, 0.02), Q(HU, -HW, 0.02)]           // door closed
                        : [Q(HU, -HW, H), Q(HU, HW, H), Q(HU + 0.1, HW, H + 0.12), Q(HU + 0.1, -HW, H + 0.12)];   // door raised
    if (door.every(Boolean)) { ctx.beginPath(); door.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = "rgba(107,68,35,.55)"; ctx.fill(); ctx.strokeStyle = "#6b4423"; ctx.stroke(); }
  },
});
