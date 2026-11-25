// ---- Simple movement (predators, birds): in a straight line, without leaving their terrain
function moveToward(a, tx, ty, v, dt) {
  const [dx, dy] = wrapDelta(tx - a.x, ty - a.y), d = Math.hypot(dx, dy);
  if (d < 1e-3) { a.moving = false; return "arrived"; }
  const step = Math.min(d, v * dt), nx = a.x + dx / d * step, ny = a.y + dy / d * step;
  if (!SPECIES[a.type].flies) { const i = idxAt(nx, ny); if (i === undefined || !zoneOf(a)(i)) { a.moving = false; return "blocked"; } }
  a.x = nx; a.y = ny; a.dir = Math.atan2(dy, dx); a.moving = true; wrapAnimal(a);
  return step >= d - 1e-6 ? "arrived" : "moving";
}
function flyTo(a, tx, ty, v, dt, altitude) { a.alt += (altitude - a.alt) * Math.min(1, dt * 0.8); return moveToward(a, tx, ty, v, dt); }

// ---- Predators
function updatePredator(a, dt) {
  const e = SPECIES[a.type], c = e.hunt, nowDay = gameDay();
  const onLand = !!e.leavesCarcass;                            // they leave a carcass; the rest vanish when they die
  if (a.dead) {
    if (nowDay - a.deadAt >= CARCASS_DAYS) { a.toRemove = true; fertilize(idxAt(a.x, a.y), a); }
    return;
  }
  const die = cause => { a.cause = cause; recordDeath(a, cause); if (onLand) Object.assign(a, { dead: true, deadAt: nowDay, moving: false }); else a.toRemove = true; };
  if (a.life && ageOf(a) >= a.life) {                  // old age: land ones lie down and wait for death
    if (!onLand) return die("oldAge");
    a.dyingSince ??= nowDay; a.moving = false;
    if (nowDay - a.dyingSince >= DYING_DAYS) die("oldAge");
    return;
  }
  a.hunger += dt / DAY_DURATION / c.cycle * (seasonIndex() === 3 ? 1.2 : 1);
  if (a.hunger >= 1.5) a.strongHunger = nowDay;        // predators: going hungry prevents breeding
  if (nowDay - a.lastMeal >= c.dies) return die("hunger");
  if (a.eating > 0) { a.eating -= dt; a.moving = false; if (a.eating <= 0) a.restsUntil = nowDay + c.restTime; return; }
  if (e.grows && sizeOf(a) < 0.8 && a.mother && !a.mother.dead && !a.mother.toRemove) {   // young: with their mother, they eat from her preys
    const m = a.mother, [dx, dy] = wrapDelta(m.x - a.x, m.y - a.y), d = Math.hypot(dx, dy);
    if (m.eating > 0 && d < 3 * SQ3) { a.hunger = 0; a.lastMeal = nowDay; }
    if (d > 0.9) moveToward(a, m.x - dx / d * 0.6, m.y - dy / d * 0.6, e.speed * SQ3 * (d > 4 ? 2 : 1.1), dt); else a.moving = false;
    a.alt = m.alt;
    return;
  }
  const f = fireNear(a.x, a.y, 0.5);                   // fire keeps them away: they move off
  if (f) {
    const [dx, dy] = wrapDelta(a.x - f[0], a.y - f[1]), d = Math.hypot(dx, dy) || 1;
    a.chaseTarget = null; a.sprintSince = 0;
    if (e.flies) flyTo(a, a.x + dx / d * 3, a.y + dy / d * 3, e.speed * SQ3, dt, 1);
    else if (moveToward(a, a.x + dx / d * 3, a.y + dy / d * 3, e.speed * SQ3 * 1.5, dt) === "blocked") a.moving = false;
    return;
  }
  if (c.threatensPlayer && threatenPlayer(a, e, dt)) return;   // with no light at night, the character is prey
  const isActive = c.active === "always" || (c.active === "day") === (currentPhase().name === "Day");
  if (!isActive || nowDay < a.restsUntil || (a.hunger < (c.huntsFrom ?? 1) && !a.chaseTarget)) { a.chaseTarget = null; a.sprintSince = 0; return rest(a, e, dt, isActive); }
  if (c.mode === "scavenger") return scavenge(a, e, dt);
  if (c.mode === "ambusher") return ambush(a, e, dt);
  pursue(a, e, dt);
}
function rest(a, e, dt, isActive) {                    // not hungry or outside its hours: at home or strolling nearby
  const nowDay = gameDay(), house = a.house;
  if (e.flies) {
    const perch = e.hunt?.perch ?? 0.5;
    if (!isActive) { flyTo(a, house.x, house.y, e.speed * SQ3, dt, perch); if (!a.moving) a.alt = perch; return; }   // perched on its tree (gulls: on the beach)
    const R = (e.hunt?.soar ?? 2.5) * SQ3;                                                                     // flies in circles over its home
    a.turn = (a.turn ?? rnd() * TAU) + dt * 0.3 / R * (a.sem % 2 ? 1 : -1);
    flyTo(a, house.x + Math.cos(a.turn) * R, house.y + Math.sin(a.turn) * R, e.speed * SQ3 * 0.6, dt, 1);
    return;
  }
  const radius = (e.hunt?.radius ?? 4) * SQ3;
  if (!isActive || nowDay < a.restsUntil) {             // rests at home
    if (Math.hypot(...wrapDelta(house.x - a.x, house.y - a.y)) > 0.5) {
      if (moveToward(a, house.x, house.y, (e.walk ?? e.speed) * 1.2 * SQ3, dt) === "blocked") a.house = { x: a.x, y: a.y };   // cannot go back: new home
    } else a.moving = false;
    return;
  }
  if (!a.stroll || moveToward(a, a.stroll[0], a.stroll[1], (e.walk ?? e.speed * 0.6) * SQ3, dt) !== "moving") {
    a.wait -= dt;
    a.moving = false;
    if (a.wait > 0) return;
    a.wait = e.wait[0] + rnd() * (e.wait[1] - e.wait[0]) * 2;   // long pauses between strolls
    for (let k = 0; k < 6; k++) {
      const ang = rnd() * TAU, r = rnd() * radius, x = house.x + Math.cos(ang) * r, y = house.y + Math.sin(ang) * r;
      const i = idxAt(x, y);
      if (i !== undefined && zoneOf(a)(i)) { a.stroll = [x, y]; return; }
    }
    a.stroll = null;
  }
}
function choosePrey(a, e) {
  const c = e.hunt, max = c.view * SQ3;
  let best = null, mv = Infinity;
  for (const p of world.animals) {
    if (!c.preys.has(p.type) || !visibleTo(p, a)) continue;
    if (c.onlyWeak?.has(p.type) && !weak(p)) continue;
    if (c.hungryBig && BIG.has(p.type) && !weak(p) && a.hunger < 1.5) continue;
    if (fireNear(p.x, p.y)) continue;                  // next to a fire, preys are safe
    const d = distA(a, p);
    if (d > max) continue;
    if (!e.flies && !zoneOf(a)(idxAt(p.x, p.y))) continue;           // outside its terrain
    const v = d * (weak(p) ? 0.5 : 1);
    if (v < mv) { mv = v; best = p; }
  }
  if (c.preys.has("nest")) for (const n of world.nests) {
    if (n.removed) continue;
    const d = distA(a, n);
    if (d <= max && d * 0.4 < mv) { mv = d * 0.4; best = n; }
  }
  return best;
}
function eatPrey(a, p) {
  if (p.isNest) { removeObject(p); world.eggsEaten = (world.eggsEaten || 0) + p.eggs; }
  else {
    p.huntedBy = a.type; p.cause = "hunted";
    if (!(p.n > 5)) recordDeath(p, "hunted by " + a.type);
    if (BIG.has(p.type)) Object.assign(p, { dead: true, deadAt: gameDay(), moving: false, fleeing: false, goal: null, action: null });
    else if (p.n > 5) p.n -= 3;                                         // from a school (a group of n fish) it only catches a few
    else p.toRemove = true;                                               // small preys are eaten whole
  }
  const c = SPECIES[a.type].hunt;                      // big predators are barely sated by a small prey
  a.hunger = c.sates && !BIG.has(p.type) && !p.isNest ? Math.max(0, a.hunger - c.sates) : 0;
  a.lastMeal = gameDay();
  a.eating = BIG.has(p.type) ? 40 : 8;            // game seconds
  world.hunts = (world.hunts || 0) + 1;
}
function pursue(a, e, dt) {
  const c = e.hunt, nowDay = gameDay();
  let p = a.chaseTarget;
  if (p && (!visibleTo(p, a) || distA(a, p) > (c.view + 3) * SQ3)) { p = a.chaseTarget = null; a.sprintSince = 0; }
  if (!p) {
    if ((a.searchFrom || 0) > nowDay) return rest(a, e, dt, true);   // does not search at every instant
    a.searchFrom = nowDay + 0.01;
    p = a.chaseTarget = choosePrey(a, e);
    if (!p) {
      if (c.fallbackFood && a.hunger >= 1.5) {     // no preys: food on the ground (the fox eats fallen fruit)
        const route = findRoute(idxAt(a.x, a.y), i => hasType(i, c.fallbackFood), zoneOf(a), 6);
        if (route) {
          const i = route[route.length - 1], [x, y] = toPixel(...world.cells[i]);
          if (moveToward(a, x, y, e.speed * SQ3, dt) !== "moving" || Math.hypot(...wrapDelta(x - a.x, y - a.y)) < 0.6) {
            const f = objs(i).find(o => o.type === c.fallbackFood);
            if (f) { removeObject(f); a.hunger = 0; a.lastMeal = nowDay; a.eating = 6; }
          }
          return;
        }
      }
      return rest(a, e, dt, true);
    }
  }
  const [px, py] = posOf(p), d = Math.hypot(...wrapDelta(px - a.x, py - a.y));
  const sprint = d < c.attack * SQ3;
  if (sprint && !a.sprintSince) a.sprintSince = nowDay;
  if (a.sprintSince && (nowDay - a.sprintSince) * DAY_DURATION > c.chaseTime) {   // gets tired: the prey escapes
    a.chaseTarget = null; a.sprintSince = 0; a.restsUntil = nowDay + 0.04; return;
  }
  const v = e.speed * SQ3 * (sprint ? c.huntSpeed : 0.75);
  const r = e.flies ? flyTo(a, px, py, v, dt, sprint ? 0.1 : 1) : moveToward(a, px, py, v, dt);
  if (r === "blocked") { a.chaseTarget = null; a.sprintSince = 0; a.restsUntil = nowDay + 0.02; return; }
  if (distA(a, p) < (c.reach ?? 0.45)) {               // distance after moving                        // reaches it (heron: peck; eagle: swoop): does it catch it?
    const covered = p.inShelter && SPECIES[p.type].needs?.hidden ? 0.5 : 1;   // among the pines they are harder to catch
    const prob = Math.min(0.95, c.success * (p.isNest ? 3 : weak(p) ? 1.8 : 1) * (still(p) && covered === 1 ? 1.4 : 1) * covered *
                                (p.isNest ? 1 : SPECIES[p.type].defense ?? 1));
    a.chaseTarget = null; a.sprintSince = 0;
    if (rnd() < prob) eatPrey(a, p);
    else { a.restsUntil = nowDay + 0.03; world.misses = (world.misses || 0) + 1; }
  }
}
function ambush(a, e, dt) {                           // caiman and heron: still, lying in wait; they attack whatever passes within reach
  const c = e.hunt, nowDay = gameDay();
  for (const p of world.animals) {
    if (!c.preys.has(p.type) || !visibleTo(p, a) || distA(a, p) > c.attackRadius * SQ3) continue;
    if (c.onlyWeak?.has(p.type) && !weak(p)) continue;
    if (fireNear(p.x, p.y)) continue;
    const i = idxAt(p.x, p.y);
    if (c.onlyShore && !(p.action?.type === "drink" || world.lakeShore[i] || world.lake[i])) continue;   // caiman: only on the shore
    if ((p.lastAttack || 0) > nowDay - 0.05) continue;
    p.lastAttack = nowDay;
    const [dx, dy] = wrapDelta(p.x - a.x, p.y - a.y); a.dir = Math.atan2(dy, dx);
    if (rnd() < c.success * (weak(p) ? 1.6 : 1) * (SPECIES[p.type].defense ?? 1)) eatPrey(a, p);
    else { world.misses = (world.misses || 0) + 1; if (!p.toRemove) fleeFrom(p, SPECIES[p.type], [dx, dy], a); }
    return;
  }
  rest(a, e, dt, true);
}
function scavenge(a, e, dt) {                          // vulture: soars searching; when it sees a carcass it spirals down, lands and eats
  const c = e.hunt;
  let carcass = a.chaseTarget;
  if (!carcass || carcass.toRemove || !carcass.dead) {
    carcass = null; let md = c.view * SQ3;
    for (const p of world.animals) if (p.dead && !p.toRemove) { const d = distA(a, p); if (d < md) { md = d; carcass = p; } }
    a.chaseTarget = carcass;
  }
  if (!carcass) return rest(a, e, dt, true);            // soaring in wide circles over its home
  const d = distA(a, carcass), side = hash(a.sem, 5) * TAU;
  if (d > 2.2 * SQ3 && a.alt > 0.6) { flyTo(a, carcass.x, carcass.y, e.speed * SQ3, dt, 1); return; }   // still high: glides there
  if (a.alt > 0.06) {                                    // spiral down around it
    a.turn = (a.turn ?? side) + dt * 0.9 * (a.sem % 2 ? 1 : -1);
    const R = 0.3 + a.alt * 1.6;
    flyTo(a, carcass.x + Math.cos(a.turn) * R, carcass.y + Math.sin(a.turn) * R, e.speed * SQ3 * 0.5, dt, Math.max(0, a.alt - 0.3));
    return;
  }
  [a.x, a.y] = [carcass.x + Math.cos(side) * 0.3, carcass.y + Math.sin(side) * 0.3]; wrapAnimal(a);   // on the ground, beside it
  a.alt = 0; a.moving = false; a.dir = side + Math.PI;
  carcass.scavenged = true; carcass.deadAt -= 0.25;     // several vultures finish it sooner
  a.chaseTarget = null; a.hunger = 0; a.lastMeal = gameDay(); a.eating = 50;
}
function fleeFrom(a, e, away, origin_) {                  // reaction of a prey to a predator (or the character)
  if (e.needs?.hidden) fleeToOtherForest(a, away, origin_);
  else chooseDestination(a, away);
}
// a predator in sight closer than the prey's alert distance. Any land predator nearby is a threat, hunting or not
// (birds only when they dive at something); a sleeping prey rarely notices, one drinking or eating notices later,
// a hunting predator gets closer unseen if it is stealthy, and one lying still or eating is noticed later too.
function threatNearby(a, e) {
  const asleep = a.sleeping || a.inShelter || (a.restUntil || 0) > gameDay() || a.dyingSince;
  const alert = e.alert * SQ3 * (asleep ? 0.35 : a.action ? 0.6 : 1);
  for (const d of world.predatorsNow) {
    const de = SPECIES[d.type], c = de.hunt;
    if (!c.preys.has(a.type) || !visibleTo(a, d)) continue;
    if (de.flies && !d.chaseTarget) continue;             // a bird circling high is no threat until it dives
    const seen = d.chaseTarget ? (c.stealth ?? 1) : d.eating > 0 ? 0.5 : d.moving ? 1 : 0.7;
    if (Math.hypot(...wrapDelta(d.x - a.x, d.y - a.y)) < alert * seen) return d;
  }
  return null;
}
// cells right next to a lurking ambusher (caiman) that preys on this animal: it does not go to drink there
function ambusherNear(a, i) {
  const [x, y] = toPixel(...world.cells[i]);
  for (const d of world.predatorsNow || []) {
    const c = SPECIES[d.type].hunt;
    if (c.mode !== "ambusher" || !c.preys.has(a.type)) continue;
    if (Math.hypot(...wrapDelta(d.x - x, d.y - y)) < (c.attackRadius + 1.5) * SQ3) return true;
  }
  return false;
}
