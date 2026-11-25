// Chest: a rough wooden box with 10 storage slots, built in a cell; it cannot be moved (the hammer takes it apart when empty).
defineStructure({
  id: "chest",
  name: "Chest",
  draw(it) {                     // rough planks between round branch posts, a plank lid tied down with two ropes around the box
    const d = hash(it.i, 330) * TAU, x = it.x, y = it.y, L = 0.32, Wd = 0.22, Hh = 0.27, sem = it.o.sem ?? it.i;
    const [scl] = sizes(it), lw = Math.max(0.8, scl * 0.008);
    shadow(x, y, 0.34);
    const P = (u, v, z) => bodyPoint(x, y, d, u, v, z);
    const quad = (q, fill, stroke) => {
      if (q.some(p => !p)) return false;
      ctx.beginPath(); q.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
      return true;
    };
    const line = (a, b, color, width) => { if (!a || !b) return; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); };
    const PLANK = ["#7a5230", "#8a5e36", "#6e4828", "#83592f"];
    const sides = [[[L, -Wd], [L, Wd], 1, 0], [[-L, Wd], [-L, -Wd], -1, 0], [[-L, Wd], [L, Wd], 0, 1], [[L, -Wd], [-L, -Wd], 0, -1]];
    for (const [a, b, nu, nw] of sides) {          // the walls that face the camera: 3 rough horizontal planks each, with dark gaps
      if (!sideSeen(d, nu, nw)) continue;
      quad([P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], Hh), P(a[0], a[1], Hh)], "#2e1c0c");
      for (let k = 0; k < 3; k++) {
        const z0 = Hh * k / 3 + 0.008, z1 = Hh * (k + 1) / 3 - 0.008, sag = (hash(sem, 340 + k + nu * 7 + nw * 3) - 0.5) * 0.012;
        quad([P(a[0], a[1], z0), P(b[0], b[1], z0 + sag), P(b[0], b[1], z1 + sag), P(a[0], a[1], z1)], PLANK[(k + (nu ? 1 : 0) + (sem % 2)) % 4], "rgba(40,24,10,.7)");
        line(P(a[0], a[1], z1 - 0.012), P(b[0], b[1], z1 - 0.012 + sag), "rgba(190,140,90,.45)", lw);   // a lighter edge on each plank
      }
      for (const u of [-L * 0.55, L * 0.55]) if (nw) line(P(u, a[1], 0), P(u, a[1], Hh + 0.012), "#c9a66b", Math.max(1.4, scl * 0.02));   // the ropes going down the long sides
    }
    for (const [cu, cv] of [[L, Wd], [L, -Wd], [-L, Wd], [-L, -Wd]]) {   // round branch posts at the corners (the hidden back one is covered)
      const b0 = P(cu, cv, 0), b1 = P(cu, cv, Hh + 0.03);
      line(b0, b1, "#5a3a1c", Math.max(2, scl * 0.045)); line(b0, b1, "rgba(170,120,70,.5)", Math.max(0.7, scl * 0.012));
    }
    const LO = 1.08;                                // the lid sticks out a little: planks along its length
    const lid = [P(L * LO, -Wd * LO, Hh), P(L * LO, Wd * LO, Hh), P(-L * LO, Wd * LO, Hh), P(-L * LO, -Wd * LO, Hh)];
    if (!quad(lid, "#2e1c0c")) return;
    for (let k = 0; k < 3; k++) {
      const v0 = -Wd * LO + (2 * Wd * LO) * k / 3 + 0.008, v1 = -Wd * LO + (2 * Wd * LO) * (k + 1) / 3 - 0.008;
      quad([P(L * LO, v0, Hh + 0.01), P(L * LO, v1, Hh + 0.01), P(-L * LO, v1, Hh + 0.01), P(-L * LO, v0, Hh + 0.01)], ["#a0703f", "#946636", "#a8794a"][(k + sem) % 3], "rgba(60,36,16,.7)");
    }
    for (const u of [-L * 0.55, L * 0.55]) {        // two ropes tied around the lid, with a knot
      line(P(u, -Wd * LO, Hh + 0.012), P(u, Wd * LO, Hh + 0.012), "#c9a66b", Math.max(1.4, scl * 0.022));
      const kn = P(u, 0, Hh + 0.02); if (kn) circle(kn[0], kn[1], Math.max(1.2, scl * 0.018), "#a8854c");
    }
    wearCracks(it, it.o);
  },
});
