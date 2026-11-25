// Big fish: Medium depth and ocean.
defineFauna({
  id: "bigFish",
  name: { one: "Big fish", many: "Big fish" },
  tags: ["fish", "underwater", "drawnInWater"],
  zone: i => terrain(i) === "medium" || terrain(i) === "deep",
  step: 2.5, speed: 1.0, walk: 0.6, wait: [2, 7],
  life: { min: 100, max: 160 },
  alert: 1.5,
  breed: { seasons: [0], pct: 0.5, litter: [1, 3], cap: 1.5 },
  spawn: { phase: 70, run: ctx => ctx.sow("bigFish", 130) },
  nightRest: "water",                               // still at night wherever it is
  draw(it) {                  // big fish: dark, elongated silhouette
    const a = it.a, still = a.sleeping ? 0.2 : 1;
    fishSilhouette(it.x, it.y, a.dir, Math.sin(a.phase * 5) * 0.18 * still, 2.1, "#b9c7d3", 0.45);
  },
});
