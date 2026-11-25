// Sharks: Hunts small fish, schools and turtles in medium and deep water.
defineFauna({
  id: "shark",
  name: { one: "Shark", many: "Sharks" },
  tags: ["drawnInWater"],
  zone: i => terrain(i) === "medium" || terrain(i) === "deep", step: 4, speed: 1.2, walk: 0.8, wait: [2, 6],
  life: { min: 400, max: 600 },
  hunt: {
    preys: new Set(["turtle", "school", "fish"]), cycle: 5, dies: 15, active: "always", mode: "chase",
    view: 8, attack: 2, huntSpeed: 3, success: 0.6, restTime: 0.5, chaseTime: 10, radius: 10, stealth: 0.5,
  },
  breed: { seasons: [0], pct: 0.2, litter: [1, 1], food: true, cap: 1.5 },
  spawn: {                                          // adults in the ocean, according to its size (min. 2)
    phase: 190, normalOnly: true,
    run(ctx) {
      const ocean = ctx.of(i => terrain(i) === "deep");
      for (let k = 0; k < Math.max(2, Math.round(ocean.length / (3500 * CELL_AREA))); k++) ctx.adult(ctx.add("shark", ctx.pick(ocean), 0.5));
    },
  },
  draw(it) {                    // big silhouette under the water and the dorsal fin sticking out
    const a = it.a;
    fishSilhouette(it.x, it.y, a.dir, Math.sin(a.phase * 4) * 0.15, 2.8, "#9aa9b6", 0.5);
    const q = project(it.x, it.y);
    if (!q) return;
    const scl = cam.zoom * q[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
    ctx.fillStyle = "#5d6b77"; ctx.beginPath();
    ctx.moveTo(q[0] - scl * 0.09, q[1]); ctx.lineTo(q[0] + scl * 0.02, q[1] - tall * 0.28); ctx.lineTo(q[0] + scl * 0.07, q[1]); ctx.closePath(); ctx.fill();
  },
});
