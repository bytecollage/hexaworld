// House: a rectangle of cells; safe shelter with a 20-slot storage; sleep until dawn.
defineStructure({
  id: "house",
  name: "House",
  draw(it) {                       // log house over its 4 cells, taller than the character: walls, thatched gable roof, door, windows, chimney
    const o = it.o, [scl, tall] = sizes(it), occupied = player.inside === o || (player.sleeping && player.house === o);
    // the house lies along the long diagonal of its rhombus of cells: u along it, w across it (world units)
    const [ux, uy] = o.axis, wx = -uy, wy = ux;   // the house lies along its axis
    const age = gameDay() - (o.builtAt ?? gameDay()), decay = Math.max(0, Math.min(1, (age - HOUSE_DECAY_FROM) / (HOUSE_LIFE - HOUSE_DECAY_FROM)));
    const lean = decay * decay * 0.12;            // in its last year it leans more and more
    const HU = 1.35, HW = 0.8, H = 2.1, RIDGE = 1.35, OVER = 0.18;    // half-length, half-width, wall height, roof height, eaves
    const Q = (u, w, z) => projectUp(it.x + ux * u + wx * (w + lean * z), it.y + uy * u + wy * (w + lean * z), z);
    const rot = cam.rot * Math.PI / 180, vx = -Math.sin(rot), vy = Math.cos(rot);   // toward the viewer, on the ground
    const faces = (nu, nw) => (ux * nu + wx * nw) * vx + (uy * nu + wy * nw) * vy > 0.01;   // is a wall with this outward normal seen?
    const light = (nu, nw) => (0.82 + 0.18 * ((ux * nu + wx * nw) * -0.6 + (uy * nu + wy * nw) * -0.8)) * (1 - 0.3 * decay);   // fixed sun; old wood darkens
    const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16), c = k => Math.round(((n >> k) & 255) * f); return `rgb(${c(16)},${c(8)},${c(0)})`; };
    const poly = (pts, fill, stroke) => {
      if (pts.some(p => !p)) return;
      ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    };
    const line = (a, b) => { if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } };
    ctx.beginPath(); groundEllipse(it.x, it.y, 1.75, 1.15, Math.atan2(uy, ux)); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fill();
    ctx.lineWidth = Math.max(1, scl * 0.015);
    // ---- walls (only the ones facing the camera); each is [u0, w0, u1, w1, normal u, normal w]
    const walls = [[HU, HW, -HU, HW, 0, 1], [-HU, HW, -HU, -HW, -1, 0], [-HU, -HW, HU, -HW, 0, -1], [HU, -HW, HU, HW, 1, 0]];
    for (const [u0, w0, u1, w1, nu, nw] of walls) {
      if (!faces(nu, nw)) continue;
      const gable = nu !== 0;                                       // the short walls end in a gable under the ridge
      const pts = [Q(u0, w0, 0), Q(u1, w1, 0), Q(u1, w1, H), ...(gable ? [Q(u0, 0, H + RIDGE)] : []), Q(u0, w0, H)];
      const L = light(nu, nw), LOGS = 7, gap = H / LOGS * 0.12, side = (nu + 2) * 3 + nw;
      poly(pts, shade("#3e2612", L));                               // the dark chinking between the logs
      const band = (z0, z1, f0, f1, k) => {                        // one log: a rounded band (lighter top edge, darker bottom)
        const a = [Q(u0 * (gable ? 1 : f0), w0 * (gable ? f0 : 1), z0), Q(u1 * (gable ? 1 : f0), w1 * (gable ? f0 : 1), z0),
                   Q(u1 * (gable ? 1 : f1), w1 * (gable ? f1 : 1), z1), Q(u0 * (gable ? 1 : f1), w0 * (gable ? f1 : 1), z1)];
        poly(a, shade("#8a5a2e", L * (0.9 + 0.2 * hash(o.sem, 900 + side * 20 + k))));
        ctx.strokeStyle = shade("#b8854e", L); line(Q(u0 * (gable ? 1 : f1), w0 * (gable ? f1 : 1), z1 - gap * 0.6), Q(u1 * (gable ? 1 : f1), w1 * (gable ? f1 : 1), z1 - gap * 0.6));
      };
      for (let k = 0; k < LOGS; k++) band(H * k / LOGS + gap, H * (k + 1) / LOGS - gap, 1, 1, k);
      if (gable) for (let k = 0; k < 4; k++) {                      // the gable: shorter and shorter logs up to the ridge
        const z0 = H + RIDGE * k / 4 + gap, z1 = H + RIDGE * (k + 1) / 4 - gap;
        band(z0, z1, 1 - k / 4 - 0.04, 1 - (k + 1) / 4 + 0.04, LOGS + k);
      }
      const du = (u0 - u1) / Math.hypot(u0 - u1, w0 - w1), dw = (w0 - w1) / Math.hypot(u0 - u1, w0 - w1);
      for (let k = 0; k < LOGS; k++) for (const [cu, cw, sg] of [[u0, w0, 1], [u1, w1, -1]]) {   // log ends crossing at the corners
        const e = Q(cu + du * sg * 0.14, cw + dw * sg * 0.14, H * (k + 0.5) / LOGS);
        if (!e) continue;
        const r = Math.max(1.2, scl * 0.075);
        circle(e[0], e[1], r, shade("#b48650", L)); ctx.strokeStyle = shade("#5a3519", L);
        ctx.beginPath(); ctx.arc(e[0], e[1], r, 0, TAU); ctx.stroke(); circle(e[0], e[1], r * 0.35, shade("#8a5e30", L));
      }
      if (nw !== 0) {                                               // long walls: windows (and the door on the +w side)
        const ww = nw * HW, zt = H * 0.72, zb = zt - 0.3 * scl / tall;
        for (const cu of [-0.72, 0.72]) {
          poly([Q(cu - 0.19, ww, zb), Q(cu + 0.19, ww, zb), Q(cu + 0.19, ww, zt), Q(cu - 0.19, ww, zt)], occupied ? "#ffd36b" : "#4a3a28", "#3a2614");
        }
        if (nw > 0) {
          poly([Q(-0.26, ww, 0), Q(0.26, ww, 0), Q(0.26, ww, H * 0.56), Q(-0.26, ww, H * 0.56)], "#5a3a1c", "#2e1c0c");
          ctx.strokeStyle = "#2e1c0c"; for (const cu of [-0.09, 0.09]) line(Q(cu, ww, 0), Q(cu, ww, H * 0.56));   // planks
          ctx.strokeStyle = "#c9a66b"; for (const z of [H * 0.14, H * 0.42]) line(Q(-0.26, ww, z), Q(0.26, ww, z));   // rope bindings
          const k = Q(0.12, ww, H * 0.27); if (k) circle(k[0], k[1], Math.max(1, scl * 0.035), "#c8a06a");
        }
      }
    }
    // ---- roof: the slope facing away first, then the chimney (on the -w slope), then the slope facing the camera
    const ridge = [Q(-HU - OVER, 0, H + RIDGE), Q(HU + OVER, 0, H + RIDGE)];
    const slope = side => {
      const EW = side * (HW + OVER), EZ = H - 0.15, Lr = light(0, side) + 0.04;
      const eave = [Q(HU + OVER, EW, EZ), Q(-HU - OVER, EW, EZ)];
      ctx.lineWidth = Math.max(1, scl * 0.025);
      poly([ridge[0], ridge[1], ...eave], shade("#d6b35e", Lr), "#8a6a2c");
      ctx.lineWidth = Math.max(0.6, scl * 0.012);
      for (let j = 0; j <= 30; j++) {                                // straws, from the ridge down to the eave
        const u = -HU - OVER + (2 * (HU + OVER)) * (j + 0.5 * hash(o.sem, 700 + j)) / 30, d = (hash(o.sem, 740 + j) - 0.5) * 0.12;
        ctx.strokeStyle = j % 3 ? shade("#a88438", Lr) : shade("#ead08a", Lr);
        line(Q(Math.min(HU + OVER, u), 0, H + RIDGE), Q(Math.max(-HU - OVER, Math.min(HU + OVER, u + d)), EW, EZ));
      }
      ctx.lineWidth = Math.max(1, scl * 0.03); ctx.strokeStyle = shade("#9a7a34", Lr);   // two rows tied down
      for (const f of [0.38, 0.72]) line(Q(-HU - OVER, EW * f, H + RIDGE - (RIDGE + 0.15) * f), Q(HU + OVER, EW * f, H + RIDGE - (RIDGE + 0.15) * f));
      const fringe = [];                                             // ragged straw ends hanging past the eave
      for (let j = 0; j <= 24; j++) {
        const u = HU + OVER - (2 * (HU + OVER)) * j / 24, drop = j % 2 ? 0.05 : 0.13 + 0.08 * hash(o.sem, 760 + j);
        fringe.push(Q(u, EW * (1 + 0.06), EZ - drop));
      }
      poly([eave[0], ...fringe, eave[1]], shade("#c49e4c", Lr));
    };
    const chimney = () => {
      const base = Q(HU * 0.55, -HW * 0.45, H + RIDGE * 0.5), top = Q(HU * 0.55, -HW * 0.45, H + RIDGE + 0.75);
      if (!base || !top) return;
      ctx.fillStyle = "#5a5752"; ctx.fillRect(top[0] - scl * 0.12, top[1], scl * 0.24, base[1] - top[1]);
      for (let k = 0; k < 6; k++) for (let m = 0; m < 2; m++) {     // a chimney of piled stones
        const y = base[1] - (base[1] - top[1]) * (k + 0.5) / 6, x = top[0] + (m - 0.5 + (k % 2 ? 0.25 : -0.25)) * scl * 0.12;
        circle(x, y, scl * 0.065, k % 2 === m ? "#8f8b84" : "#7a766f");
      }
      ctx.lineWidth = Math.max(1, scl * 0.03); ctx.strokeStyle = "rgba(40,38,34,.6)"; ctx.strokeRect(top[0] - scl * 0.12, top[1], scl * 0.24, base[1] - top[1]);
      if (occupied) {
        const t = performance.now() / 1000;
        for (let k = 0; k < 4; k++) { const u = (t * 0.3 + k / 4) % 1; circle(top[0] + Math.sin(t + k) * scl * 0.06, top[1] - tall * u * 0.9, scl * (0.06 + u * 0.08), `rgba(210,210,210,${0.45 * (1 - u)})`); }
      }
    };
    const nearSide = faces(0, 1) ? 1 : -1;
    slope(-nearSide);
    if (nearSide === 1) chimney();                                  // the chimney's slope faces away: draw it before the near slope
    slope(nearSide);
    if (nearSide === -1) chimney();
    for (let k = 0; k < Math.round(decay * 7); k++) {            // holes in the thatch of the near slope
      const u = (hash(o.sem, 800 + k) - 0.5) * 2 * HU, f = 0.2 + hash(o.sem, 820 + k) * 0.6, s = 0.12 + hash(o.sem, 840 + k) * 0.1;
      const W = nearSide * (HW + OVER) * f, z = H + RIDGE - (RIDGE + 0.15) * f, dz = (RIDGE + 0.15) * s / (HW + OVER);
      poly([Q(u - s, W, z), Q(u + s, W, z), Q(u + s * 0.8, W + nearSide * s, z - dz), Q(u - s * 0.7, W + nearSide * s, z - dz)], "rgba(45,30,15,.85)");
    }
    ctx.lineCap = "round"; ctx.lineWidth = Math.max(2, scl * 0.11); ctx.strokeStyle = shade("#9a7a34", 1 - 0.3 * decay);   // the ridge: a bound bundle of straw
    line(ridge[0], ridge[1]);
    ctx.lineWidth = Math.max(1, scl * 0.03); ctx.strokeStyle = "#c9a66b";
    for (let k = 1; k < 6; k++) { const a = Q(-HU - OVER + (2 * (HU + OVER)) * k / 6 - 0.05, 0, H + RIDGE + 0.05), b = Q(-HU - OVER + (2 * (HU + OVER)) * k / 6 + 0.05, 0, H + RIDGE - 0.05); line(a, b); }
    ctx.lineCap = "butt";
  },
});
