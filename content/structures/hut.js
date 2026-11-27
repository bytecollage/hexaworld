// Hut: a cone of branches and thatch over 3 cells; a safe shelter from predators where you can sleep (from dusk). No storage.
defineStructure({
  id: "hut",
  name: "Hut",
  hoverable: true,
  shelter: { life: YEAR_DAYS, decayFrom: YEAR_DAYS * 0.75, storage: 0 },   // 1 year; entered like the house (safe from predators), sleeping only from dusk
  draw(it) {                      // a thatched cone over the middle of its 3 cells: back faces first, the door on the side facing the camera
    const o = it.o, [scl] = sizes(it), R = 0.78, HT = 1.65, N = 28;
    const occupied = player.inside === o || (player.sleeping && player.house === o);
    const worn = Math.max(0, Math.min(1, ((gameDay() - (o.builtAt ?? gameDay())) - YEAR_DAYS * 0.75) / (YEAR_DAYS * 0.25)));   // its last season: darker
    const tone = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = k * (1 - 0.35 * worn); return `rgb(${[16, 8, 0].map(s => Math.round(((n >> s) & 255) * f)).join(",")})`; };
    ctx.beginPath(); groundEllipse(it.x, it.y, R * 1.15, R * 0.95); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill();
    const apex = projectUp(it.x, it.y, HT); if (!apex) return;
    const base = []; for (let k = 0; k < N; k++) { const a = k / N * TAU; base.push({ a, p: projectUp(it.x + Math.cos(a) * R, it.y + Math.sin(a) * R, 0.04) }); }
    if (base.some(b => !b.p)) return;
    const front = base.reduce((m, b) => b.p[1] > m.p[1] ? b : m, base[0]);         // the base point nearest the camera: the door's side
    const faces = base.map((b, k) => ({ b, c: base[(k + 1) % N], depth: (b.p[1] + base[(k + 1) % N].p[1]) / 2 })).sort((x, y) => x.depth - y.depth);
    ctx.lineWidth = Math.max(1, scl * 0.012);
    for (const f of faces) {                          // the cone, face by face, lit from the left
      const light = 0.72 + 0.28 * Math.cos(f.b.a - Math.PI * 0.9);
      ctx.beginPath(); ctx.moveTo(apex[0], apex[1]); ctx.lineTo(f.b.p[0], f.b.p[1]); ctx.lineTo(f.c.p[0], f.c.p[1]); ctx.closePath();
      ctx.fillStyle = tone("#c9a45a", light); ctx.fill(); ctx.strokeStyle = tone("#a8843f", light); ctx.stroke();
    }
    for (let k = 0; k < N; k += 2) {                  // straws and branch ribs from the top down, on the side seen
      const b = base[k]; if (b.p[1] < apex[1] + (front.p[1] - apex[1]) * 0.55) continue;
      ctx.beginPath(); ctx.moveTo(apex[0], apex[1]); ctx.lineTo(b.p[0], b.p[1]); ctx.strokeStyle = tone(k % 4 ? "#9a7a34" : "#6b4423", 1); ctx.stroke();
    }
    for (const z of [0.45, 0.95]) {                   // two rope bands around the cone: only their front half shows
      const r = R * (1 - z / HT), mid = projectUp(it.x, it.y, z);
      const ring = base.map(b => projectUp(it.x + Math.cos(b.a) * r, it.y + Math.sin(b.a) * r, z));
      ctx.lineWidth = Math.max(1, scl * 0.02); ctx.strokeStyle = tone("#7a5a2a", 1);
      for (let k = 0; k < N; k++) {
        const a = ring[k], b = ring[(k + 1) % N];
        if (a && b && mid && a[1] >= mid[1] && b[1] >= mid[1]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      }
    }
    const D = (u, z) => projectUp(it.x + Math.cos(front.a + u) * R * (1 - z / HT) * 1.01, it.y + Math.sin(front.a + u) * R * (1 - z / HT) * 1.01, z);
    const door = [D(-0.34, 0.04), D(-0.26, 0.5), D(0, 0.68), D(0.26, 0.5), D(0.34, 0.04)];   // a low dark doorway
    if (door.every(Boolean)) { ctx.beginPath(); door.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = occupied ? "#3a2a14" : "#1e1710"; ctx.fill(); ctx.strokeStyle = tone("#6b4423", 1); ctx.lineWidth = Math.max(1, scl * 0.025); ctx.stroke();
      if (occupied) { const g = D(0, 0.2); if (g) circle(g[0], g[1], scl * 0.05, "rgba(255,170,70,.55)"); }   // a glow inside
    }
    const tip = projectUp(it.x, it.y, HT + 0.18);     // the tied top
    if (tip) { ctx.strokeStyle = tone("#8a6a2c", 1); ctx.lineWidth = Math.max(1, scl * 0.025); for (const dx of [-0.05, 0, 0.05]) { ctx.beginPath(); ctx.moveTo(apex[0], apex[1]); ctx.lineTo(tip[0] + scl * dx, tip[1]); ctx.stroke(); } }
    if (occupied) {                                   // smoke from the top
      const t = performance.now() / 1000;
      for (let k = 0; k < 4; k++) { const u = (t * 0.3 + k / 4) % 1; circle(apex[0] + Math.sin(t + k) * scl * 0.05, apex[1] - scl * u * 0.7, scl * (0.05 + u * 0.07), `rgba(210,210,210,${0.4 * (1 - u)})`); }
    }
  },
});
