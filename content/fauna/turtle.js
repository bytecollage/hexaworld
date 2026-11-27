// Turtles: Lives on beaches and at sea (deeper as it grows); lays nests on the beach in summer.
defineFauna({
  id: "turtle",
  tags: ["catchable"],
  name: { one: "Turtle", many: "Turtles" },
  // on land they stay within 3 cells of water; at sea, the bigger they are the deeper they can go
  zone: i => !blocked(i) && world.toWater[i] <= 3, step: 1.5, speed: 0.35, wait: [4, 14],
  grows: { min: 0.35, days: 40 },
  life: { min: 400, max: 600 },
  alert: 1,
  breed: { seasons: [1], pct: 0.4, litter: [3, 5], nest: true, cap: 1.6 },   // they lay nests on the beach
  animalZone: (i, a) => {
    const t = terrain(i);
    if (!isWater(t)) return world.outcropAt[i] < 0 && world.toWater[i] <= 3;
    if (world.lake[i]) return false;                // they are sea creatures
    const f = sizeOf(a);
    return t === "water" || (t === "medium" && f >= 0.7) || (t === "deep" && f >= 1);
  },
  spawn: {                                          // on beaches next to the sea
    phase: 30,
    run(ctx) {
      const beach = ctx.of(i => terrain(i) === "sand" && SPECIES.turtle.zone(i) && world.neighbors[i].some(j => isWater(terrain(j)) && !world.lake[j]));
      for (let k = 0; k < Math.round(beach.length / (45 * CELL_AREA)); k++) ctx.add("turtle", beach[Math.floor(rnd() * beach.length)]);
    },
  },
  nightRest: "beach",                               // at night at the edge of the beach (adults also in the water)
  swimSpeed: 3,                                     // three times faster in the water
  grab: { meat: a => sizeOf(a) >= 1 ? 3 : 1 },     // caught by hand: alive, or as meat with the knife in the hand
  live: { icon: "🐢", name: "Live turtle", diet: ["fruit", "berries", "flowers"], needs: { thirst: 2, hunger: 2, dies: 10 } },
  draw(it) {                    // shell seen in perspective, head toward where it goes; grows with age
    const a = it.a, d = a.dir, f = sizeOf(a) * 1.25, step = a.moving ? Math.sin(a.phase * 6) * 0.05 * f : 0;
    const swims = isWater(terrain(idxAt(it.x, it.y)));
    ctx.save();
    if (swims) ctx.globalAlpha *= 0.7;                // in the water: half submerged, with flippers
    for (const [u, v] of [[0.14, 0.13], [0.14, -0.13], [-0.14, 0.13], [-0.14, -0.13]]) {     // legs / flippers
      const uu = u * f + step * Math.sign(v), vv = v * f * (swims ? 1.3 : 1);
      ctx.beginPath(); groundEllipse(it.x + uu * Math.cos(d) - vv * Math.sin(d), it.y + uu * Math.sin(d) + vv * Math.cos(d), 0.06 * f * (swims ? 1.5 : 1), 0.06 * f, d);
      ctx.fillStyle = "#7d8f52"; ctx.fill();
    }
    ctx.beginPath(); groundEllipse(it.x + Math.cos(d) * 0.24 * f, it.y + Math.sin(d) * 0.24 * f, 0.08 * f, 0.07 * f, d); ctx.fillStyle = "#8aa05c"; ctx.fill();
    const [scl0, tall0] = sizes(it), scl = scl0 * f, tall = tall0 * f * (swims ? 0.4 : 1);
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.22 * f, 0.17 * f, d); ctx.fillStyle = "#5d6b33"; ctx.fill();
    ctx.beginPath(); ctx.ellipse(it.p[0], it.p[1] - tall * 0.07, scl * 0.15, tall * 0.09 + scl * (swims ? 0.03 : 0), 0, 0, TAU); ctx.fillStyle = "#7a8a45"; ctx.fill();
    ctx.strokeStyle = "#3d4720"; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  },
});
