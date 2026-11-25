// Fish schools: Group of small fish in shallow and medium sea water.
defineFauna({
  id: "school",
  name: { one: "Fish school", many: "Fish schools" },
  tags: ["fish", "underwater", "drawnInWater"],
  zone: i => (terrain(i) === "water" && !world.lake[i]) || terrain(i) === "medium",
  step: 2, speed: 1.1, walk: 0.6, wait: [1.5, 6], fleeing: 1,
  life: { min: 60, max: 100 },
  alert: 1.5,
  breed: { seasons: [0], pct: 0.8, litter: [1, 2], cap: 1.5, spawning: true },
  spawn: [
    { phase: 60, run: ctx => ctx.sow("school", 200, i => terrain(i) === "medium") },   // born in medium depth; they can come close to the shore
    { phase: 85, run: () => { for (const a of world.animals) if (a.type === "school") a.n = 7 + Math.floor(rnd() * 6); } },   // fish of the school
  ],
  nightRest: "water",                               // still at night wherever it is
  onBorn: c => { c.n = 6 + Math.floor(rnd() * 5); },   // number of fish in the school
  draw(it) {                   // group of small fish swimming together
    const a = it.a, still = a.sleeping ? 0.15 : 1;
    for (let k = 0; k < a.n; k++) {
      const ang = hash(a.sem, k) * TAU, r = 0.15 + hash(a.sem, 20 + k) * 0.45;
      const w = Math.sin(a.phase * 1.3 + k) * 0.06 * still;
      const x = it.x + Math.cos(ang) * r + w, y = it.y + Math.sin(ang) * r * 0.8 + w;
      fishSilhouette(x, y, a.dir + (hash(a.sem, 40 + k) - 0.5) * 0.4, Math.sin(a.phase * 9 + k) * 0.3 * still, 0.42, "#f1f6fa", 0.6);
    }
  },
});
