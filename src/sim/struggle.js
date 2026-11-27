// =====================================================================================
//  STRUGGLES: predators with a `hunt.struggle` trait (jaguar, caiman) do not kill at once. They grab the prey and bite
//  it again and again; the prey resists and may tear free (then the chase goes on). The character too: it has health
//  (100, not shown yet), each bite takes some of it, and once an attack has started the predator keeps after it, fire or
//  not: it rushes in, bites, backs off a few cells and rushes in again, until the character dies, gets into a shelter
//  (hut or house) or fights it off with a weapon (knife or axe in the hand).
//  struggle: { bite, preyBite, every, reach, kills }: damage to the character and to a prey per bite, game seconds
//  between bites on a held prey, reach to bite the character (reference cells) and the death notice.
// =====================================================================================
const MAX_HEALTH = 100;
const HEAL_PER_DAY = { player: 40, animal: 60 };        // wounds heal by themselves, slowly
const healthOf = (o, rate) => Math.min(MAX_HEALTH, (o.health ?? MAX_HEALTH) + (gameDay() - (o.hurtAt ?? 0)) * rate);
const hpOf = a => healthOf(a, HEAL_PER_DAY.animal);     // an animal's health now (a prey or a predator)
const playerHealth = () => healthOf(player, HEAL_PER_DAY.player);
function hurt(o, damage, rate) { o.health = healthOf(o, rate) - damage; o.hurtAt = gameDay(); return o.health; }
const seconds = s => s / DAY_DURATION;                  // game seconds → days

// ---- a predator and its prey
function grip(a, p) {                                   // it reached it and got hold of it: the first bite now
  a.grip = p; p.heldBy = a; a.chaseTarget = null; a.sprintSince = 0;
  Object.assign(p, { moving: false, goal: null, action: null, fleeing: false });
  biteprey(a, p);
}
function holdPrey(a, e, dt) {                           // updatePredator, while it holds a prey: still, biting every few seconds
  const p = a.grip;
  if (!p || p.dead || p.toRemove || p.heldBy !== a) { a.grip = null; return; }
  a.moving = false; a.dir = Math.atan2(...wrapDelta(p.x - a.x, p.y - a.y).reverse());
  if (gameDay() >= a.nextBite) biteprey(a, p);
}
function biteprey(a, p) {
  const s = SPECIES[a.type].hunt.struggle;
  a.nextBite = gameDay() + seconds(s.every);
  if (hurt(p, s.preyBite * (weak(p) ? 1.5 : 1), HEAL_PER_DAY.animal) <= 0) { a.grip = null; p.heldBy = null; eatPrey(a, p); return; }
  // it resists: stronger, healthier preys tear free more often (big ones, a high `defense`… a low one is easier to hold)
  const tears = 0.3 * (BIG.has(p.type) ? 1.4 : 0.7) / (SPECIES[p.type].defense ?? 1) * (weak(p) ? 0.4 : 1) * (0.3 + hpOf(p) / MAX_HEALTH);
  if (rnd() < Math.min(0.8, tears)) tearFree(a, p);
}
function tearFree(a, p) {                               // the prey got away, wounded: it runs and the predator goes after it
  a.grip = null; p.heldBy = null; p.lastAttack = gameDay();
  fleeFrom(p, SPECIES[p.type], wrapDelta(p.x - a.x, p.y - a.y), a);
  if (SPECIES[a.type].hunt.mode === "chase") { a.chaseTarget = p; a.sprintSince = gameDay(); }   // a fresh sprint (the caiman cannot follow)
  else a.restsUntil = gameDay() + 0.01;
  world.escapes = (world.escapes || 0) + 1;
}
const heldNow = p => { if (p.heldBy && (p.heldBy.dead || p.heldBy.toRemove || p.heldBy.grip !== p)) p.heldBy = null; return !!p.heldBy; };

// ---- a predator and the character
const BACK_OFF = [2, 3];                               // grid cells it backs off after each bite, before rushing in again
const BACK_OFF_MAX_SECONDS = 2.5;                        // game seconds at most backing off (and a short pause there)
function startAttack(a, cause) {                        // it reached the character: from now on it does not give up
  a.attacksPlayer = cause; a.provokedUntil = 0; a.stalksPlayer = false; a.chaseTarget = null; a.evade = null; a.lostFor = 0;
  a.watchesPlayer = false;
  if (a.grip) { a.grip.heldBy = null; a.grip = null; }
  cancelWork(null); player.repeat = null;
  bitePlayer(a); if (a.attacksPlayer) backOff(a);         // the first bite, then a few cells back before the next one
}
function attackPlayer(a, e, dt) {                       // updatePredator, while attacking the character
  const s = e.hunt.struggle, nowDay = gameDay();
  if (player.dead || player.i < 0 || player.inside || player.sleeping) {   // in a shelter it is safe: the predator leaves
    if (player.inside && !player.dead) notify(`I am safe in here. The ${SINGULAR[a.type].toLowerCase()} is prowling outside…`);
    a.attacksPlayer = null; a.backOff = null; a.restsUntil = nowDay + 0.05; a.moving = false; return;
  }
  const speed = e.speed * SQ3 * (e.provoke?.charge ?? e.hunt.huntSpeed ?? 2);
  if (a.backOff) {                                      // after a bite: a few cells back, a short pause, then it rushes in again
    const b = a.backOff, there = Math.hypot(...wrapDelta(b.x - a.x, b.y - a.y)) < 0.15;
    const r = there ? (a.moving = false, "there") : moveToward(a, b.x, b.y, speed * 0.5, dt);
    if (!there && r !== "moving") a.moving = false;
    a.dir = there || r !== "moving" ? Math.atan2(...wrapDelta(player.x - a.x, player.y - a.y).reverse()) : a.dir;   // facing the character
    if (nowDay >= b.until) a.backOff = null;
    return;
  }
  const d = Math.hypot(...wrapDelta(player.x - a.x, player.y - a.y)), reach = Math.max(0.5, s.reach * SQ3);
  if (d <= reach) { a.lostFor = 0; bitePlayer(a); if (a.attacksPlayer) backOff(a); return; }
  if (moveToward(a, player.x, player.y, speed, dt) === "blocked") { a.moving = false; a.lostFor = (a.lostFor || 0) + dt; }   // the character is where it cannot go (water, the caiman's shore)
  if (a.lostFor > 10) { a.attacksPlayer = null; a.lostFor = 0; a.restsUntil = nowDay + 0.03; notify(`The ${SINGULAR[a.type].toLowerCase()} gave up… for now`); }
}
function backOff(a) {                                   // a point 2-3 cells away from the character, on its own side (slanting if it must)
  const [dx, dy] = wrapDelta(a.x - player.x, a.y - player.y), base = Math.atan2(dy, dx), cell = SQ3 * CELL_R;
  const dist = (BACK_OFF[0] + rnd() * (BACK_OFF[1] - BACK_OFF[0])) * cell, until = gameDay() + seconds(BACK_OFF_MAX_SECONDS);
  for (const off of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) {
    const x = player.x + Math.cos(base + off) * dist, y = player.y + Math.sin(base + off) * dist, i = idxAt(x, y);
    if (i !== undefined && zoneOf(a)(i)) { a.backOff = { x, y, until }; return; }
  }
  a.backOff = { x: a.x, y: a.y, until };                 // nowhere to go: it just waits a moment where it is
}
function bitePlayer(a) {
  const e = SPECIES[a.type], s = e.hunt.struggle, name = SINGULAR[a.type].toLowerCase();
  a.dir = Math.atan2(...wrapDelta(player.x - a.x, player.y - a.y).reverse());
  const left = hurt(player, s.bite, HEAL_PER_DAY.player);
  if (simulating) { if (left <= 0) { a.attacksPlayer = null; killPlayer(s.kills); } return; }
  hurtFlash();
  if (left <= 0) { const why = a.attacksPlayer === "provoked" && e.provoke ? e.provoke.kills : s.kills; a.attacksPlayer = null; killPlayer(why); return; }
  notify(left > 60 ? `The ${name} bit me! I have to get to a shelter or fight it off`
       : left > 30 ? `It bit me again… I am bleeding. A shelter, or my weapon!`
       : `I can barely stand… one more bite and I am done`);
}
function hurtFlash() {                                  // a red flash over the screen on each bite
  const el = $("hurt"); if (!el) return;
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
}
// fighting back: with the knife or the axe in the hand, a click on the predator attacking you strikes it (no throwing)
const STRIKE = { knife: 35, axe: 50 };                  // damage per hit (its health: 100)
const STRIKE_GAP = 0.8;                                 // game seconds between two strikes
function attackerAt(px, py) { return animalAt(px, py, a => a.attacksPlayer && !a.dead, 1.5); }
function strike(a, tool) {
  const name = SINGULAR[a.type].toLowerCase();
  if (Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y)) > 1.6 * SQ3) { notify(`The ${name} is too far to hit`); return; }
  if (gameDay() < (player.struckAt || 0) + seconds(STRIKE_GAP)) return;
  player.struckAt = gameDay(); player.route = [];
  wearTool(tool);
  if (rnd() > 0.75) { notify("I missed!"); return; }
  const left = hurt(a, STRIKE[tool], HEAL_PER_DAY.animal);
  if (left <= 0) {
    Object.assign(a, { dead: true, deadAt: gameDay(), moving: false, attacksPlayer: null, backOff: null, chaseTarget: null, cause: "hunted" });
    recordDeath(a, "killed by the character");
    notify(`I killed the ${name}! My knife will get its meat`);
  } else if (left < 50 && rnd() < 0.6) {                // badly hurt: it lets go and runs off
    a.attacksPlayer = null; a.backOff = null; a.restsUntil = gameDay() + 0.1;
    evadeFrom(a, player.x, player.y, 10 * SQ3, 1.5, 20);
    notify(`The ${name} ran off, wounded!`);
  } else notify(left < 50 ? `I hurt it badly! Again!` : `I hit it! It is still on me`);
}
