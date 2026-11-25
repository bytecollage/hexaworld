// ---- tools in the world
function animalAt(x, y, cond, radius = 0.9) {          // animal closest to a ground point that meets cond
  let best = null, md = radius;
  for (const a of world.animals) {
    if (a.toRemove || !cond(a)) continue;
    const d = Math.hypot(...wrapDelta(a.x - x, a.y - y));
    if (d < md) { md = d; best = a; }
  }
  return best;
}
const treeAt = i => objs(i).find(o => TREES.has(o.type) && o.fellAt === undefined);
function chopNow(i) {                                   // the tree falls; when it finishes falling its wood and fruits are gathered, and it disappears
  const o = treeAt(i);
  if (!o) return;
  const adult = isAdult(o);
  o.fellAt = gameDay(); o.felledByPlayer = true;
  wearTool("axe");
  world.fellings.push({ o, at: gameDay() + FALL_DURATION, wood: woodOf(o),
                     fruits: DEF[o.type].tree.chopFruit(o, adult) });
}
function updateFellings() {
  const nowDay = gameDay();
  world.fellings = (world.fellings || []).filter(t => {
    if (nowDay < t.at) return true;
    store("branches", t.wood);
    const [type, n] = t.fruits; if (n > 0) store(type, n);
    removeObject(t.o);
    notify(`Timber! I got ${t.wood} wood` + (n > 0 ? ` and ${n} ${RESOURCE_NAME[type].toLowerCase()}` : ""));
    return false;
  });
}
function dropAxe(x, y, wear = 0) {                          // the axe stays on the ground: you have to go and pick it up
  const i0 = idxAt(x, y);
  for (const i of [i0, ...world.neighbors[i0]]) {
    if (i === undefined || isWater(terrain(i)) || objs(i).length >= MAX_PER_CELL) continue;
    const o = addObject(i, "groundAxe", { wear });
    if (!o) continue;
    return;
  }
  store("axe", 1);                                // nowhere to fall: back to the inventory
}
function throwAxe(a) {                             // the axe leaves the hand and lands on the ground next to the animal
  const d = Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y));
  const [dx, dy] = wrapDelta(a.x - player.x, a.y - player.y);
  world.flyingAxe = { x: player.x, y: player.y, tx: player.x + dx, ty: player.y + dy, t: 0 };
  const wear = takeWear("axe") + WEAR_PER_USE.axe;      // the axe in the hand leaves with its wear (and a throw wears it)
  spend("axe", 1);                                 // the one in the hand
  if (!inHand() && amountOf("axe") === 0) renderInventory();
  const prob = Math.min(0.9, 0.55 * (weak(a) ? 1.5 : 1) * (still(a) ? 1.3 : 1) * (d > 3 * SQ3 ? 0.7 : 1));
  if (rnd() < prob) {
    Object.assign(a, { dead: true, deadAt: gameDay(), moving: false, fleeing: false, goal: null, action: null, cause: "hunted" });
    if (SPECIES[a.type].needs) a.inShelter = false;
    recordDeath(a, "hunted by the character");
    dropAxe(a.x, a.y, wear);
    notify(`Got it! ${an(SINGULAR[a.type].toLowerCase(), "A")}. Now I need my axe back; for the meat you need the knife`);
  } else {
    dropAxe(player.x + dx, player.y + dy, wear);                // miss: the axe falls where the animal was
    chooseDestination(a, wrapDelta(a.x - player.x, a.y - player.y));
    notify("Missed! It ran off. I need my axe back");
  }
  renderInventory();
}
function cutMeatNow(a) {
  const n = MEAT[a.type] ?? 1;
  a.toRemove = true;                                    // no carcass left
  store("meat", n); wearTool("knife");
  notify(`I got ${n} meat${partsOf(a)}`);
}
function partsOf(a) {                                   // hide and bones (the `hide`, `bones` traits) go with the meat
  const e = SPECIES[a.type], got = [];
  for (const [t, n] of [["hide", e.hide], ["bones", e.bones]]) if (n && hasRoom(t)) { store(t, n); got.push(`${n} ${n === 1 && t === "bones" ? "bone" : RESOURCE_NAME[t].toLowerCase()}`); }
  return got.length ? ", " + got.join(", ") : "";
}
// click on the world: decides what to do based on what is there and what is carried in the hand
// small mammals: 1 stone stuns them for a while; then they are killed with the knife or put in the inventory (alive)
const STUN_DAYS = 0.08;                           // ~30 s at ×1
const stunned = a => (a.stunnedUntil || 0) > gameDay();
function throwStone(a) {
  const d = Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y)), [dx, dy] = wrapDelta(a.x - player.x, a.y - player.y);
  world.flyingAxe = { x: player.x, y: player.y, tx: player.x + dx, ty: player.y + dy, icon: "🪨" };
  spend("stones", 1);
  const prob = Math.min(0.9, 0.6 * (still(a) && !a.inShelter ? 1.3 : 1) * (a.inShelter ? 0.6 : 1) * (d > 3 * SQ3 ? 0.7 : 1));
  if (rnd() < prob) {
    Object.assign(a, { stunnedUntil: gameDay() + STUN_DAYS, moving: false, fleeing: false, goal: null, action: null, inShelter: false });
    notify(`I stunned ${an(SINGULAR[a.type].toLowerCase())}! Quick, before it wakes up`);
  } else { fleeFrom(a, SPECIES[a.type], [dx, dy], player); notify(SAY.missed); }
  renderInventory();
}
function takeAliveNow(a) {                               // into the inventory, alive (with its hunger and its thirst)
  if (!hasRoom(a.type)) { notify(SAY.full); return; }
  a.toRemove = true;
  storeIndividual(individualOf(a));
  notify(`I carry the ${SINGULAR[a.type].toLowerCase()} with me`);
}
function killWithKnifeNow(a) {
  a.toRemove = true;
  recordDeath(a, "hunted by the character");
  store("meat", MEAT[a.type] ?? 1); wearTool("knife");
  notify(`I got ${MEAT[a.type] ?? 1} meat${partsOf(a)}`);
}
function grabNow(a) {                                 // frogs and turtles (the `grab` trait): by hand, straight to the inventory as meat
  const n = SPECIES[a.type].grab.meat(a);
  a.toRemove = true;
  recordDeath(a, "hunted by the character");
  store("meat", n);
  notify(`I caught ${an(SINGULAR[a.type].toLowerCase())}: ${n} meat`);
}
