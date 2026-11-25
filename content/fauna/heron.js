// Herons: Stalks fish, frogs and crabs in shallow water.
defineFauna({
  id: "heron",
  name: { one: "Heron", many: "Herons" },
  zone: i => terrain(i) === "water" || (!blocked(i) && world.toWater[i] <= 1), step: 1, speed: 0.7, wait: [4, 12],
  life: { min: 150, max: 220 },
  hunt: {
    preys: new Set(["fish", "frog", "crab", "school"]), cycle: 2.5, dies: 7, active: "day", mode: "chase",
    view: 6, attack: 1, huntSpeed: 2, success: 0.5, restTime: 0.3, chaseTime: 15, radius: 4, stealth: 0.1, reach: 1.4,   // stalks slowly and pecks
    fishInShallowOnly: true,                        // it only catches fish in shallow water
  },
  breed: { seasons: [0], pct: 0.4, litter: [1, 2], food: true, cap: 2 },
  spawn: {                                          // adults in shallow water near the shore (min. 2)
    phase: 200, normalOnly: true,
    run(ctx) {
      const fords = ctx.of(i => terrain(i) === "water" && world.toLand[i] <= 1);
      for (let k = 0; k < Math.max(2, Math.round(fords.length / (200 * CELL_AREA))); k++) ctx.adult(ctx.add("heron", ctx.pick(fords), 0.3));
    },
  },
  draw(it) {                      // white long-legged bird built along its heading; when lying in wait it stretches its neck
    const [scl] = sizes(it), a = it.a, d = a.dir, P = (u, v, z) => bodyPoint(it.x, it.y, d, u, v, z);
    const seg = (A, B) => { if (A && B) { ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); } };
    shadow(it.x, it.y, 0.16);
    const zb = 0.55, asleep = currentPhase().name === "Night";
    ctx.strokeStyle = "#c9a227"; ctx.lineWidth = Math.max(1, scl * 0.018); ctx.lineCap = "round";
    ctx.beginPath(); seg(P(-0.01, 0.025, zb), P(-0.01, 0.025, 0));
    if (!asleep) seg(P(0.01, -0.025, zb), P(0.02 + (a.moving ? Math.sin(a.phase * 6) * 0.03 : 0), -0.025, 0));
    ctx.stroke();
    const front = P(0.1, 0, zb), back = P(-0.1, 0, zb), headBehind = front && back && front[1] < back[1];
    const stretch = a.chaseTarget ? 0.12 : 0, hz = zb + (asleep ? 0.12 : 0.34 - stretch), H = P(0.1 + stretch, 0, hz);
    const body = () => {                                                  // tilted torso: tail lower than the chest
      const C = P(0, 0, zb), F = P(0.13, 0, zb + 0.03), Sd = P(0, 0.05, zb), U = P(0, 0, zb + 0.075);
      if (!C || !F || !Sd || !U) return;
      ctx.beginPath(); ellipsoidPath(C, [[F[0] - C[0], F[1] - C[1]], [Sd[0] - C[0], Sd[1] - C[1]], [U[0] - C[0], U[1] - C[1]]]);
      ctx.fillStyle = "#f4f4f0"; ctx.fill();
    };
    const neckHead = () => {
      const N0 = P(0.09, 0, zb + 0.03), N1 = P(0.2, 0, zb + 0.18), B = P(0.2 + stretch, 0, hz - 0.02);
      if (!N0 || !N1 || !H) return;
      ctx.strokeStyle = "#f4f4f0"; ctx.lineWidth = Math.max(1.5, scl * 0.035);
      ctx.beginPath(); ctx.moveTo(N0[0], N0[1]); ctx.quadraticCurveTo(N1[0], N1[1], H[0], H[1]); ctx.stroke();
      circle(H[0], H[1], scl * 0.032, "#f4f4f0");
      ctx.strokeStyle = "#e0b02a"; ctx.lineWidth = Math.max(1, scl * 0.016);     // beak
      if (B) { ctx.beginPath(); ctx.moveTo(H[0], H[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
    };
    if (headBehind) { neckHead(); body(); } else { body(); neckHead(); }
  },
});
