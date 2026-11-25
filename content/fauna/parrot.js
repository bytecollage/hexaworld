// Parrots: Flies between fruit trees by day and drops seeds far away.
defineFauna({
  id: "parrot",
  name: { one: "Parrot", many: "Parrots" },
  flies: true, zone: () => true, step: 6, speed: 3, wait: [1, 2],
  life: { min: 200, max: 300 },
  breed: { seasons: [0], pct: 0.4, litter: [1, 2], cap: 1.6 },
  spawn: {                                          // groups of 2-3 in adult fruit trees and palms
    phase: 130, normalOnly: true,
    run(ctx) {
      const fruitEaters = world.trees.filter(o => FRUIT_OF[o.type] && isAdult(o));
      for (let k = 0; k < Math.max(2, Math.round(fruitEaters.length / 15)) && fruitEaters.length; k++) {
        const t = ctx.pick(fruitEaters);
        for (let n = 2 + Math.floor(rnd() * 2); n > 0; n--) Object.assign(ctx.add("parrot", t.i, 0.3), { house: t, alt: 0.75 });
      }
    },
  },
  update: (a, dt) => updateParrot(a, dt),
  onBorn: (c, m) => { if (m) c.house = m.house; },  // the young share the mother's tree
  draw(it) { bird(it, { wings: "#2fd35f", torso: "#7cf08f", head: "#ffd23a", wingspan: 0.32, altitude: 2.6, flap: 12 }); },   // bright, yellow-headed: visible over the canopy
});


// ---- Parrots: they fly from fruit tree to fruit tree; when leaving, they sometimes drop a seed far away (dispersal)
function updateParrot(a, dt) {
  const e = SPECIES[a.type], nowDay = gameDay();
  const house = a.house;
  if (!house || house.removed || house.fellAt !== undefined) {           // its tree is gone: looks for another
    a.house = world.trees.find(o => FRUIT_OF[o.type] && isAdult(o) && o.fellAt === undefined && wrapDistance(o.i, idxAt(a.x, a.y)) < cellsFor(15));
    if (!a.house) { a.noFood ??= nowDay; if (nowDay - a.noFood > 4) { a.toRemove = true; recordDeath(a, "hunger"); } return; }
    a.noFood = undefined;
  }
  const pos = o => { const [x, y] = toPixel(...world.cells[o.i]); const [dx, dy] = wrapDelta(x + o.ox - a.x, y + o.oy - a.y); return [a.x + dx, a.y + dy]; };
  if (currentPhase().name !== "Day") { const [x, y] = pos(a.house); flyTo(a, x, y, e.speed * SQ3, dt, 0.75); if (!a.moving) a.alt = 0.75; return; }
  if (!a.destination || a.destination.removed || (a.perchedUntil && nowDay > a.perchedUntil)) {
    if (a.perchedUntil && rnd() < 0.05) disperseSeed(a);
    const fence = world.trees.filter(o => FRUIT_OF[o.type] && isAdult(o) && o.fellAt === undefined && wrapDistance(o.i, a.house.i) <= cellsFor(12));
    a.destination = fence.length ? fence[Math.floor(rnd() * fence.length)] : a.house;
    a.perchedUntil = 0;
  }
  const [x, y] = pos(a.destination);
  if (flyTo(a, x, y, e.speed * SQ3, dt, a.perchedUntil ? 0.75 : 1.3) === "arrived" && !a.perchedUntil) a.perchedUntil = nowDay + 0.04 + rnd() * 0.1;
}
function disperseSeed(a) {                          // a fruit that falls 5-15 cells away: it will rot and maybe sprout
  for (let k = 0; k < 8; k++) {
    const ang = rnd() * TAU, r = (5 + rnd() * 10) * SQ3, i = idxAt(a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r);
    if (i === undefined || terrain(i) !== "grass" || world.outcropAt[i] >= 0 || objs(i).length >= MAX_PER_CELL) continue;
    const f = addObject(i, "fruit", { mother: a.destination?.sem, falls: gameDay() });
    if (f) { world.groundFruits.push(f); world.seeds = (world.seeds || 0) + 1; }
    return;
  }
}
