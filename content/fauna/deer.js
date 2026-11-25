// Deer: Grazes tall grass in herds; drinks at lakes, shelters in groves at night; fawns follow an adult.
defineFauna({
  id: "deer",
  name: { one: "Deer", many: "Deer" },
  tags: ["huntable", "bigPrey"],
  meat: 4,
  hide: 1, bones: 2,                              // also given when its meat is cut
  zone: landZone, step: 3, speed: 2.2, walk: 0.7, wait: [5, 16],
  grows: { min: 0.55, days: 20 },
  life: { min: 140, max: 200 },                     // life expectancy: 7-10 years
  alert: 3,
  breed: { seasons: [0], pct: 0.3, litter: [1, 2], food: true, cap: 1.5 },   // sometimes twins
  needs: {
    thirst: 0.4, hunger: 0.6, dies: 3, diet: new Set(["tallGrass"]), hidden: false, fleeing: 3,
    hungryDiet: new Set(["fruit", "bush", "flowers"]),   // only when very hungry and with no grass in sight
  },
  spawn: {                                          // herds of 3 to 5 on grassland that reaches a lake (test map: exactly 10 deer)
    phase: 10,
    run(ctx) {
      const { grass } = ctx, me = SPECIES.deer;
      if (ctx.testMap) {
        const spots = grass.filter(i => objs(i).every(o => LOW.has(o.type)));
        for (let k = 0; k < 10 && spots.length; k++) ctx.add("deer", spots.splice(Math.floor(rnd() * spots.length), 1)[0]);
        return;
      }
      for (let m = 0; m < Math.round(grass.length / (500 * CELL_AREA)); m++) {
        const c = grass[Math.floor(rnd() * grass.length)];
        const sz = 3 + Math.floor(rnd() * 3), near = [c, ...world.neighbors[c], ...world.neighbors[c].flatMap(j => world.neighbors[j])];
        const herd = [];
        for (let k = 0; k < sz; k++) { const i = near[Math.floor(rnd() * near.length)]; if (me.zone(i)) herd.push(ctx.add("deer", i)); }
        if (!herd.length) continue;
        herd[0].born = gameDay() - me.grows.days * (1 + rnd());   // each herd has at least one adult
        const adults = herd.filter(v => sizeOf(v) >= 1);
        for (const v of herd) if (sizeOf(v) < 1) v.mother = adults[Math.floor(rnd() * adults.length)];
      }
    },
  },
  bigCarcass: true,                                 // its carcass fertilizes 2 tall grass tufts and 1 flower tuft
  followsMother: true,                              // fawns follow an adult (src/sim/herbivores.js: followMother)
  restsByDay: true,                                 // lies down for a while next to a lake or in a grove
  migrates: true,                                   // leaves crowded areas for places with food and none of its kind
  draw(it) {                     // built along its heading (turns with the camera); grows with age; lies down at night
    const a = it.a, f = sizeOf(a), [scl0] = sizes(it), scl = scl0 * f, d = a.dir;
    const P = (u, v, z) => bodyPoint(it.x, it.y, d, u * f, v * f, z * f);   // body coordinates, scaled with its size
    const blob = (u, v, z, L, Wd, Hh, color) => { ctx.beginPath(); if (bodyEllipsoid(it.x, it.y, d, u * f, v * f, z * f, L * f, Wd * f, Hh * f)) { ctx.fillStyle = color; ctx.fill(); } };
    const seg = (A, B) => { if (A && B) { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); } };
    shadow(it.x, it.y, 0.32 * f);
    const front = P(0.3, 0, 0.5), back = P(-0.3, 0, 0.5); if (!front || !back) return;
    const s = (front[0] - back[0]) / (0.6 * scl), headBehind = front[1] < back[1];
    ctx.lineCap = "round";
    if (a.dead) {                                 // lying on its side, stiff legs sticking out, no bright color
      ctx.strokeStyle = "#5e4a3a"; ctx.lineWidth = Math.max(1.5, scl * 0.05);
      for (const u of [-0.18, -0.12, 0.13, 0.2]) seg(P(u, 0.05, 0.12), P(u + 0.05, 0.3, 0.14));
      blob(0, 0, 0.12, 0.3, 0.12, 0.1, "#86705c");
      blob(0.345, 0.03, 0.06, 0.09, 0.05, 0.045, "#77614e");
      return;
    }
    const walkCycle = a.moving ? Math.sin(a.phase * (a.fleeing ? 18 : 11)) : 0;
    const lyingDown = !a.moving && !a.action &&       // at night in the grove, resting by day or waiting for death
      ((a.inShelter && shelterTime()) || (a.restUntil || 0) > gameDay() || a.dyingSince);
    const zb = lyingDown ? 0.17 : 0.55;
    ctx.strokeStyle = "#6d4527"; ctx.lineWidth = Math.max(1.5, scl * 0.05);
    if (lyingDown) {                                  // legs tucked under the body
      for (const u of [-0.165, 0.15]) for (const v of [-0.08, 0.08]) blob(u, v, 0.04, 0.1, 0.05, 0.04, "#6d4527");
    } else for (const [u, v, ph] of [[-0.225, 0.07, 1], [-0.165, -0.07, -1], [0.165, 0.07, -1], [0.225, -0.07, 1]]) {
      seg(P(u, v, zb), P(u + walkCycle * ph * 0.06, v, 0));
    }
    const crouch = !!a.action, bite = crouch ? Math.abs(Math.sin(a.phase * (a.action.type === "drink" ? 5 : 3))) * 0.04 : 0;
    const neck0 = [0.255, 0, zb + 0.1];
    const neck1 = crouch ? [0.415, 0, 0.12 + bite] : [0.355, 0, zb + 0.38];
    const headC = crouch ? [neck1[0] + 0.03, 0, neck1[2] - 0.03] : [0.395, 0, zb + 0.42];
    const tail = () => { const T = P(-0.285, 0, zb + 0.05); if (T) circle(T[0], T[1], scl * 0.035, "#f3efe6"); };   // white tail
    const head = () => {
      ctx.strokeStyle = "#a0683a"; ctx.lineWidth = Math.max(2, scl * 0.08); seg(P(...neck0), P(...neck1));          // neck
      blob(headC[0] + 0.04, 0, headC[2], 0.09, 0.045, 0.05, "#8f5a30");
      ctx.strokeStyle = "#d8c7a3"; ctx.lineWidth = Math.max(1, scl * 0.025);                                          // antlers
      for (const v of [-0.03, 0.03]) {
        const [hu, , hz] = headC;
        seg(P(hu, v, hz + 0.03), P(hu - 0.05, v * 2, hz + 0.22)); seg(P(hu - 0.05, v * 2, hz + 0.22), P(hu - 0.11, v * 2.5, hz + 0.28));
        seg(P(hu - 0.03, v * 1.5, hz + 0.14), P(hu + 0.04, v * 2, hz + 0.24));
      }
    };
    if (headBehind) head(); else tail();
    blob(0, 0, zb, 0.3, 0.12, 0.13, "#a0683a");
    if (headBehind) tail(); else head();
  },
});
