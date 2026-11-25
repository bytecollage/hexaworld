// Small fish: Shallow and medium sea water; flees from the character; spawns in shallow water.
defineFauna({
  id: "fish",
  name: { one: "Small fish", many: "Small fish" },
  tags: ["fish", "underwater", "drawnInWater"],
  zone: i => (terrain(i) === "water" && !world.lake[i]) || terrain(i) === "medium",   // no fish in lakes
  step: 1.5, speed: 1.3, walk: 0.7, wait: [1.5, 6], fleeing: 1,
  life: { min: 30, max: 50 },
  alert: 1.5,
  breed: { seasons: [0], pct: 0.9, litter: [3, 5], cap: 1.5, spawning: true },
  spawn: { phase: 50, run: ctx => ctx.sow("fish", 45) },
  nightRest: "water",                               // still at night wherever it is
  draw(it) {                        // small fish: light silhouette under the water
    const a = it.a, still = a.sleeping ? 0.2 : 1;
    fishSilhouette(it.x, it.y, a.dir, Math.sin(a.phase * (a.fleeing ? 16 : 8)) * 0.25 * still, 0.75, "#e8eef4", 0.55);
  },
});
