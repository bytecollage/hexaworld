// Jaguars: Forest predator: stalks and charges; dangerous to the character in the dark.
defineFauna({
  id: "jaguar",
  name: { one: "Jaguar", many: "Jaguars" },
  tags: ["huntable"],
  meat: 3,
  hide: 1, bones: 2,                              // also given when its meat is cut
  zone: i => !blocked(i), step: 3, speed: 1.6, walk: 0.7, wait: [5, 14],
  grows: { min: 0.5, days: 20 },
  life: { min: 200, max: 280 },
  hunt: {
    preys: new Set(["deer", "peccary", "coati", "armadillo", "rabbit"]), cycle: 8, dies: 18, active: "always", mode: "chase",
    view: 9, attack: 2.5, huntSpeed: 4, success: 0.3, restTime: 2, chaseTime: 10, radius: 5, sates: 0.6,
    hungryBig: true,                                // it only attacks healthy deer and peccaries when very hungry
    threatensPlayer: "stalk",                       // in the dark it stalks, charges and attacks the character
    struggle: { bite: 30, preyBite: 35, every: 2.5, reach: 0.4, kills: "A jaguar caught you and would not let go." },   // it grabs and bites again and again
  },
  nearPlayer: {                                     // in daylight: it watches the character (who can walk away); coming closer than 2.5 cells makes it attack
    retreat: 2.5, watch: 6, pace: 0.6, attacksClose: true,
    says: ["A jaguar is watching me…", "Those yellow eyes are following me", "A jaguar stares at me from the trees"],
  },
  chasesOff: { ids: new Set(["fox"]), radius: 3 },  // it charges foxes that come near, and they run
  provoke: {                                        // walking up to it 3 times in a day: it attacks, by day too
    radius: 4, times: 3, charge: 4,
    warn: ["The jaguar growls at me. I had better leave it alone", "It bares its teeth… one more time and it will come for me"],
    attacks: ["The jaguar is charging at me!", "I bothered the jaguar too much: it is coming!"],
    kills: "You bothered the jaguar too often: it attacked you.",
  },
  breed: { seasons: [0], pct: 0.5, litter: [1, 2], food: true, cap: 1 },   // territorial: no more than at the start
  spawn: {                                          // adults in forests: 1 per 20 deer (min. 2)
    phase: 150, normalOnly: true,
    run(ctx) {
      const inForest = ctx.inForest();
      for (let k = 0; k < Math.max(2, Math.round(ctx.count("deer") / 20)) && inForest.length; k++) ctx.adult(ctx.add("jaguar", ctx.pick(inForest), 0.3));
    },
  },
  bigCarcass: true,
  leavesCarcass: true,                              // predators without it vanish when they die
  draw(it) {                     // spotted feline built along its heading; lying down when resting, eating or dying
    const a = it.a, f = sizeOf(a), [scl0, tall0] = sizes(it), scl = scl0 * f, d = a.dir;
    const P = (u, v, z) => bodyPoint(it.x, it.y, d, u * f, v * f, z * f);
    const seg = (A, B) => { if (A && B) { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); } };
    shadow(it.x, it.y, 0.34 * f);
    const lyingDown = a.dead || a.dyingSince || (!a.moving && (a.eating > 0 || gameDay() < a.restsUntil));
    const L = 0.32, zb = lyingDown ? 0.15 : 0.4, walkCycle = a.moving ? Math.sin(a.phase * (a.sprintSince ? 20 : 10)) : 0;
    const front = P(L, 0, zb), back = P(-L, 0, zb); if (!front || !back) return;
    const s = (front[0] - back[0]) / (2 * L * scl), headBehind = front[1] < back[1];
    const nearSide = (P(0, 0.1, zb)[1] > P(0, -0.1, zb)[1]) ? 1 : -1;     // the flank facing the camera
    const fur = a.dead ? "#a8865a" : "#d99a35";
    if (a.dead) ctx.globalAlpha *= 0.75;
    ctx.lineCap = "round";
    if (!lyingDown) {
      ctx.strokeStyle = "#b07a2a"; ctx.lineWidth = Math.max(1.5, scl * 0.065);
      for (const [uf, v, ph] of [[-0.62, 0.07, 1], [-0.42, -0.07, -1], [0.5, 0.07, -1], [0.7, -0.07, 1]]) seg(P(uf * L, v, zb), P(uf * L + walkCycle * ph * 0.08, v, 0));
    }
    const tail = () => {
      const A = P(-0.9 * L, 0, zb), B = P(-1.6 * L, 0, zb), C = P(-1.8 * L, 0, zb + 0.22); if (!A || !B || !C) return;
      ctx.strokeStyle = "#c98a2e"; ctx.lineWidth = Math.max(1.2, scl * 0.045);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(B[0], B[1], C[0], C[1]); ctx.stroke();
    };
    const head = () => {
      const hz = zb + (lyingDown ? 0.05 : 0.1), H = P(1.05 * L, 0, hz); if (!H) return;
      circle(H[0], H[1], scl * 0.085, fur);
      for (const v of [-0.04, 0.04]) { const E = P(1.05 * L - 0.02, v, hz + 0.08); if (E) circle(E[0], E[1], scl * 0.026, "#9a6a22"); }   // ears
      const M = P(1.05 * L + 0.07, 0, hz - 0.025); if (M) circle(M[0], M[1], scl * 0.035, "#ecd09a");                                  // muzzle
    };
    if (headBehind) head(); else tail();
    ctx.beginPath(); if (bodyEllipsoid(it.x, it.y, d, 0, 0, zb * f, L * f, 0.12 * f, 0.12 * f)) { ctx.fillStyle = fur; ctx.fill(); }
    for (let k = 0; k < 8; k++) {                                         // spots on the flank facing the camera and on the back
      const S = P((hash(a.sem, k) - 0.5) * L * 1.6, nearSide * 0.08 * (k % 2 ? 1 : 0.4), zb + (hash(a.sem, 10 + k) - 0.3) * 0.12);
      if (S) circle(S[0], S[1], scl * 0.024, "#4a2f10");
    }
    if (headBehind) tail(); else head();
  },
});
