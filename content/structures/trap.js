// Trap: baited with fruit or berries, catches a small mammal alive.
const TRAP_LID_SECONDS = 0.35;                      // how long the lid takes to fall when an animal goes in
defineStructure({
  id: "trap",
  name: "Trap",
  hoverable: true,                                  // lit up under the mouse, like the house, the chest and the cage
  draw(it) {                     // box of sticks (turned its own way in the world) with its lid propped open; the bait on the floor;
                                 // when an animal goes in, the lid falls shut over the opening
    const [scl] = sizes(it), o = it.o, d = hash(o.sem, 77) * Math.PI, HU = 0.21, HW = 0.15, H = 0.32;
    shadow(it.x, it.y, 0.3);
    ctx.lineWidth = Math.max(1, scl * 0.026);
    const shut = o.prey ? Math.min(1, (gameDay() - (o.caughtAt ?? -1)) * DAY_DURATION / TRAP_LID_SECONDS) : 0;   // 0 propped … 1 shut
    const Q = stickBox(it.x, it.y, d, HU, HW, H, 4, "#6b4423", Q => {
      const fl = [Q(HU, HW, 0.02), Q(-HU, HW, 0.02), Q(-HU, -HW, 0.02), Q(HU, -HW, 0.02)];
      if (fl.every(Boolean)) { ctx.beginPath(); fl.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = "#7a5230"; ctx.fill(); }
      if (o.prey) {
        const C = Q(0, 0, 0.13); if (!C) return;
        drawAnimalIcon(o.prey.type, C[0], C[1] + Math.sin(performance.now() / 200) * shut, Math.max(12, scl * 0.26));   // it struggles inside
      }
    });
    if (!o.prey && o.baitItem) {                  // the bait, big and bright at the opening (drawn over the sticks, so it is seen)
      const B = Q(HU * 0.8, 0, 0.05);
      if (B && o.baitItem === "openCoconut") { circle(B[0], B[1], scl * 0.06, "#6b4423"); circle(B[0], B[1] - scl * 0.012, scl * 0.045, "#f4efe4"); }   // half a coconut, white inside
      else if (B && o.baitItem === "fruit") { circle(B[0], B[1], scl * 0.06, "#e5534b"); circle(B[0] - scl * 0.02, B[1] - scl * 0.022, scl * 0.018, "#ffb3ad"); circle(B[0] + scl * 0.01, B[1] - scl * 0.064, scl * 0.014, "#3f7a3a"); }
      else if (B) for (const [dx, dy] of [[-0.034, 0], [0.034, 0], [0, -0.04]]) { circle(B[0] + scl * dx, B[1] + scl * dy, scl * 0.034, "#6a1b9a"); circle(B[0] + scl * (dx - 0.01), B[1] + scl * (dy - 0.012), scl * 0.009, "#c9a0e8"); }
    }
    // the lid: hinged on the top front edge; propped open (up and out) on a stick, or falling to cover the opening
    const ang = (1 - shut) * 2.0, lu = HU + Math.sin(ang) * H, lz = H - Math.cos(ang) * H + 0.02 * (1 - shut);
    const lid = [Q(HU, -HW, H), Q(HU, HW, H), Q(lu, HW, Math.max(0.02, lz)), Q(lu, -HW, Math.max(0.02, lz))];
    if (lid.every(Boolean)) { ctx.beginPath(); lid.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = shut >= 1 ? "rgba(122,82,48,.85)" : "rgba(107,68,35,.6)"; ctx.fill(); ctx.strokeStyle = "#6b4423"; ctx.stroke(); }
    if (!o.prey) {                                // the prop stick that holds the lid up
      const a = Q(HU + 0.02, 0, 0.02), b = Q(lu * 0.98, 0, Math.max(0.02, lz));
      if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = "#8a5a2b"; ctx.stroke(); }
    } else { const h = captiveHealth(o.prey), top = Q(0, 0, H + 0.18); if (top) worldBar(top[0], top[1], Math.max(16, scl * 0.3), h.v, healthColor(h)); }   // its food/water
  },
});
