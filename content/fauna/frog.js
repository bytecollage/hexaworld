// Frogs: Lives in lakes and on their shore; still at night.
defineFauna({
  id: "frog",
  name: { one: "Frog", many: "Frogs" },
  zone: i => world.lake[i] === 1 || (world.lakeShore[i] === 1 && !blocked(i)),   // lake and 1 cell of shore
  step: 0.8, speed: 3, wait: [8, 30],
  life: { min: 30, max: 50 },
  alert: 1.2,
  breed: { seasons: [0], pct: 0.8, litter: [3, 6], cap: 1.6 },
  spawn: {                                          // only in lakes, near their shore
    phase: 40,
    run(ctx) {
      const shore = ctx.of(i => world.lake[i] && world.toLand[i] <= 2);
      for (let k = 0; k < Math.round(shore.length / (5 * CELL_AREA)); k++) ctx.add("frog", shore[Math.floor(rnd() * shore.length)]);
    },
  },
  nightRest: "lake",                                // goes back into the lake and stays still at night
  grab: { meat: () => 1 },                          // the character catches it by hand, as meat
  draw(it) {                       // green body with eyes; hops when moving
    const [scl, tall] = sizes(it), a = it.a;
    const jump = a.moving ? Math.abs(Math.sin(a.phase * 10)) * tall * 0.25 : 0;
    const x = it.p[0], y = it.p[1] - jump;
    if (jump) { ctx.beginPath(); groundEllipse(it.x, it.y, 0.12, 0.1); ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(x, y - scl * 0.06, scl * 0.13, scl * 0.09, 0, 0, TAU); ctx.fillStyle = "#4caf50"; ctx.fill();
    ctx.strokeStyle = "#1e5e22"; ctx.lineWidth = 1; ctx.stroke();
    for (const s of [-1, 1]) { circle(x + s * scl * 0.07, y - scl * 0.14, scl * 0.04, "#7ed47f"); circle(x + s * scl * 0.07, y - scl * 0.14, scl * 0.018, "#111"); }
  },
});
