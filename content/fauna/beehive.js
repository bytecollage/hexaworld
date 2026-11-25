// Beehives: Hangs from an adult tree; its bees pollinate fruit trees and bushes.
defineFauna({
  id: "beehive",
  name: { one: "Beehive", many: "Beehives" },
  zone: () => true, step: 0, speed: 0, wait: [1e9, 1e9],
  life: { min: 100, max: 160 },
  spawn: {                                          // in adult trees with flowers nearby
    phase: 140, normalOnly: true,
    run(ctx) {
      const spots = world.trees.filter(o => isAdult(o) && DEF[o.type].tree.beehives && flowersNear(o.i, 3) >= 3)
        .sort(() => rnd() - 0.5).slice(0, Math.min(12, Math.max(3, Math.round(world.trees.length / 300))));
      for (const o of spots) { const h = createBeehive(o, gameDay()); h.born = gameDay() - rnd() * h.life * 0.6; }
    },
  },
  tags: ["pollinator"],                             // fruit trees and bushes near it (and near flowers) give all their fruit
  immigrates: false,
  update: () => {},                                 // it does not move
  homeLost: h => h.tree.removed || h.tree.fellAt !== undefined,
  onSeasonStart(seasonIdx, nowDay) {
    if (seasonIdx === 0) {                          // spring: beehives with many flowers nearby split (up to a cap)
      const beehives = world.animals.filter(a => a.type === "beehive" && !a.toRemove);
      let gap = Math.round(1.6 * Math.max(3, world.initialPopulation.beehive || 0)) - beehives.length;
      for (const h of beehives) {
        if (gap <= 0 || ageOf(h) < YEAR_DAYS || flowersNear(h.tree.i, 5) < 8 || rnd() > 0.5) continue;
        gap--;
        const spots = world.trees.filter(o => isAdult(o) && o.fellAt === undefined && DEF[o.type].tree.beehives &&
          wrapDistance(o.i, h.tree.i) <= cellsFor(8) && wrapDistance(o.i, h.tree.i) >= cellsFor(2) &&
          !world.animals.some(b => b.type === "beehive" && b.tree === o));
        if (spots.length) { createBeehive(spots[Math.floor(rnd() * spots.length)], nowDay); world.births = (world.births || 0) + 1; }
      }
    }
    if (seasonIdx === 3) for (const h of world.animals.filter(a => a.type === "beehive" && !a.toRemove))   // winter: without flowers, they die
      if (flowersNear(h.tree.i, 5) < 4) { h.toRemove = true; recordDeath(h, "no flowers"); }
  },
  draw(it) {                    // honeycomb hanging from the tree; in spring and summer, bees going to the flowers
    const [scl, tall] = sizes(it), { p } = it, a = it.a, y = p[1] - tall * 1.25;
    ctx.strokeStyle = "#4a3418"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], y - scl * 0.09); ctx.lineTo(p[0], y - scl * 0.04); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(p[0], y + scl * 0.02, scl * 0.06, scl * 0.08, 0, 0, TAU); ctx.fillStyle = "#c8902e"; ctx.fill();
    ctx.strokeStyle = "rgba(90,60,20,.6)";
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(p[0], y + scl * 0.02 + k * scl * 0.04, scl * 0.055, scl * 0.012, 0, 0, Math.PI); ctx.stroke(); }
    circle(p[0], y + scl * 0.07, scl * 0.012, "#3a2a10");
    if (currentPhase().name !== "Day" || seasonIndex() > 1) return;
    let fx = p[0], fy = p[1];
    if (a.flower !== null && a.flower !== undefined) {
      const [cx, cy] = toPixel(...world.cells[a.flower]), [dx, dy] = wrapDelta(cx - it.x, cy - it.y), q = project(it.x + dx, it.y + dy);
      if (q) { fx = q[0]; fy = q[1] - tall * 0.15; }
    }
    const t = performance.now() / 1000;
    for (let k = 0; k < 3; k++) {                  // a few bees, unhurried: they fly out, stay a while on the flower and come back
      const u = ((t * 0.07 + k / 3 + hash(a.sem, k) * 0.2) % 1), outbound = u < 0.3 ? u / 0.3 : u < 0.6 ? 1 : u < 0.9 ? (0.9 - u) / 0.3 : 0;
      const buzz = outbound > 0 && outbound < 1 ? 1 : 0.3;
      const bx = p[0] + (fx - p[0]) * outbound + Math.sin(t * 5 + k) * scl * 0.03 * buzz, by = y + (fy - y) * outbound + Math.cos(t * 6 + k) * scl * 0.02 * buzz;
      circle(bx, by, Math.max(1, scl * 0.012), "#f2c230");
    }
  },
});

// a beehive hanging from tree o, with the flower its bees fly toward
function createBeehive(o, nowDay) {
  const [x, y] = toPixel(...world.cells[o.i]);
  const h = createAnimal("beehive", x + o.ox + 0.12, y + o.oy, { tree: o, born: nowDay });
  const route = findRoute(o.i, i => hasType(i, "flowers"), () => true, 5);
  h.flower = route ? route[route.length - 1] : null;
  return h;
}
