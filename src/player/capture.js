// =====================================================================================
//  CAPTURE: TRAPS, CAGES, CAPTIVE ANIMALS AND WATER (JAR)
// =====================================================================================
const CAGE_CAPACITY = 4, JAR_WATER = 5, TROUGH_MAX = 10, FEEDER_MAX = 12;
const THIRST_DEATH_DAYS = 3;                            // days without drinking until death (in the inventory, in a trap or in a cage)
const captiveDiet = t => CAPTIVE_DIET[t] || ["fruit", "berries", "flowers"];
const BAITS = ["fruit", "berries"];

// ---- inventory room (so nothing is destroyed if it does not fit)
function hasRoom(type) {
  return inHand() === type || inventory.some(r => r && r.type === type) || inventory.includes(null) || !hand.item;
}
// ---- live animals: each slot keeps its individuals with their hunger and thirst
function individualOf(a) {
  const needs = SPECIES[a.type].needs, nowDay = gameDay();
  return { type: a.type, lastMeal: a.lastMeal ?? nowDay, lastDrink: nowDay - Math.min(1, a.thirst ?? 0) * needs.thirst };
}
function storeIndividual(ind) {                      // into the inventory (or the hand if it already holds the same ones)
  const destination = inHand() === ind.type ? hand.item : inventory.find(r => r && r.type === ind.type);
  if (destination) { (destination.living ||= []).push(ind); destination.amount = destination.living.length; renderInventory(); return true; }
  const k = inventory.indexOf(null);
  if (k >= 0) inventory[k] = { type: ind.type, amount: 1, living: [ind] };
  else if (!hand.item) hand.item = { type: ind.type, amount: 1, living: [ind] };
  else { notify(SAY.full); return false; }
  renderInventory();
  return true;
}
function takeIndividual(type) {                       // one from the hand (first) or from the inventory
  const r = inHand() === type ? hand.item : inventory.find(x => x && x.type === type);
  if (!r?.living?.length) return null;
  const ind = r.living.pop(); r.amount = r.living.length;
  if (!r.amount) { if (r === hand.item) hand.item = null; else inventory[inventory.indexOf(r)] = null; }
  renderInventory();
  return ind;
}
const firstAvailableLive = () => (LIVE.has(inHand()) ? inHand() : inventory.find(r => r && LIVE.has(r.type))?.type) ?? null;

// ---- traps
function capture(a, t) {                             // the animal goes in for the bait and gets trapped (alive)
  t.prey = individualOf(a); t.prey.lastMeal = gameDay(); t.baitItem = null;
  t.wear = (t.wear || 0) + WEAR_PER_USE.trap;          // each catch wears the trap
  a.toRemove = true;
  if (Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y)) < 25 * SQ3) notify(`${an(SINGULAR[a.type].toLowerCase(), "A")} fell into my trap!`);
}
function bait(t) {
  const c = BAITS.find(c => amountOf(c) > 0);
  if (!c) return false;
  spend(c, 1); t.baitItem = c; renderInventory();
  return true;
}
function place(type, i) {                           // trap or cage on the ground, in that cell
  if (amountOf(type) === 0) return;
  if (blocked(i) || objs(i).length >= MAX_PER_CELL) { notify("It will not fit there"); return; }
  const o = addObject(i, type, type === "trap" ? { baitItem: null, prey: null } : { animals: [], food: {}, water: 0 });
  if (!o) return;
  o.wear = takeWear(type); o.builtAt = gameDay();
  spend(type, 1);
  (type === "trap" ? world.traps : world.cages).push(o);
  if (type === "trap") notify(bait(o) ? `Trap set, with ${o.baitItem === "fruit" ? "fruit" : "berries"} as bait` : "Trap set, but it needs bait: fruit or berries");
  else notify("The cage is ready for my animals");
  renderInventory();
}
function pickUpTrap(t) {
  const carries = [t.prey ? individualOf({ type: t.prey.type }) : null, "trap", t.baitItem].filter(Boolean);
  if (!hasRoom("trap") || (t.prey && !hasRoom(t.prey.type))) { notify(SAY.full); return; }
  if (t.prey) { storeIndividual(t.prey); notify(`I caught ${an(SINGULAR[t.prey.type].toLowerCase())}`); }
  if (t.baitItem) store(t.baitItem, 1);
  store("trap", 1); keepWear("trap", t.wear);
  removeObject(t);
  if (!t.prey) notify("I picked up the trap");
}

// ---- cages
let openCageRef = null;
function openCage(j) { openCageRef = j; renderCage(); }
function closeCage() { openCageRef = null; $("cagePanel").classList.remove("visible"); }
function putInCage(j) {
  if (j.animals.length >= CAGE_CAPACITY) { notify(`The cage is full (${CAGE_CAPACITY})`); return; }
  const t = firstAvailableLive();
  if (!t) { notify("I am not carrying any animal"); return; }
  j.animals.push(takeIndividual(t));
  renderCage();
}
function takeFromCage(j, k) {
  const ind = j.animals[k];
  if (!ind || !hasRoom(ind.type)) { notify(SAY.full); return; }
  j.animals.splice(k, 1); storeIndividual(ind); renderCage();
}
function giveFood(j) {                               // fills the feeder with what the ones inside eat
  const types = j.animals.length ? [...new Set(j.animals.flatMap(a => captiveDiet(a.type)))] : ["fruit", "berries", "flowers", "grass"];
  let placed = 0;
  for (const t of types) while (amountOf(t) > 0 && Object.values(j.food).reduce((s, n) => s + n, 0) < FEEDER_MAX) {
    spend(t, 1); j.food[t] = (j.food[t] || 0) + 1; placed++;
  }
  notify(placed ? `I put ${placed} food in the feeder` : "I have no food for them (or the feeder is full)");
  renderInventory(); renderCage();
}
function giveWater(j) {
  const v = inHand() === "jar" ? hand.item : inventory.find(r => r && r.type === "jar");
  if (!v || !v.water) { notify("I need a jar of water (from a lake)"); return; }
  const n = Math.min(v.water, TROUGH_MAX - j.water);
  v.water -= n; j.water += n;
  notify(n ? `I poured ${n} water in the trough` : "The trough is already full");
  renderInventory(); renderCage();
}
function pickUpCage(j) {
  if (j.animals.length) { notify("I should take the animals out first"); return; }
  if (!hasRoom("cage")) { notify(SAY.full); return; }
  for (const [t, n] of Object.entries(j.food)) store(t, n);   // whatever is left in the feeder goes back to the inventory
  store("cage", 1); keepWear("cage", j.wear); removeObject(j); closeCage(); notify("I picked up the cage");
}
function renderCage() {
  const j = openCageRef; if (!j) return;
  const nowDay = gameDay(), bar = (v, color) => `<span class="bar"><span style="width:${Math.round(100 * Math.max(0, Math.min(1, v)))}%;background:${color}"></span></span>`;
  const animals = j.animals.map((a, k) => {
    const needs = SPECIES[a.type].needs;
    return `<button class="slot animal" data-take="${k}" title="${SINGULAR[a.type]} · click: take it to the inventory">${ICONS[a.type]}
      ${bar(1 - (nowDay - a.lastMeal) / needs.dies, "#e3b341")}${bar(1 - (nowDay - a.lastDrink) / THIRST_DEATH_DAYS, "#4a93cf")}</button>`;
  }).join("") + `<div class="slot empty"></div>`.repeat(CAGE_CAPACITY - j.animals.length);
  const feeder = Object.entries(j.food).filter(([, n]) => n > 0).map(([t, n]) => `${ICONS[t]}${n}`).join(" ") || "empty";
  $("cagePanel").innerHTML = `<div class="hdr"><b>Cage</b> <span>${j.animals.length}/${CAGE_CAPACITY}</span><button data-close title="Close">×</button></div>
    <div class="animals">${animals}</div>
    <div class="stores">Feeder: ${feeder} · Trough: 💧${j.water}</div>
    <div class="legend-bars"><span class="c1"></span>hunger <span class="c2"></span>thirst</div>
    <div class="actions">
      <button class="btn" data-action="putIn" ${firstAvailableLive() && j.animals.length < CAGE_CAPACITY ? "" : "disabled"}>Put animal in</button>
      <button class="btn" data-action="food">Give food</button>
      <button class="btn" data-action="water">Give water</button>
      <button class="btn" data-action="gather" ${j.animals.length ? "disabled" : ""}>Pick up cage</button>
    </div>`;
  $("cagePanel").classList.add("visible");
}

// ---- hunger and thirst of captives (inventory, hand, traps and cages)
function updateCaptives() {
  const nowDay = gameDay(), deadOnes = [];
  const dies = ind => {
    const needs = SPECIES[ind.type].needs;
    if (nowDay - ind.lastMeal >= needs.dies) return "hunger";
    if (nowDay - ind.lastDrink >= THIRST_DEATH_DAYS) return "thirst";
    return null;
  };
  for (const house of world.houses) house.storage.forEach((r, k) => {   // those stored in the house also get hungry and thirsty
    if (!r?.living) return;
    r.living = r.living.filter(ind => { const c = dies(ind); if (c) deadOnes.push([ind, c, "in the house"]); return !c; });
    r.amount = r.living.length; if (!r.amount) house.storage[k] = null;
  });
  for (const r of [...inventory, hand.item]) {
    if (!r?.living) continue;
    r.living = r.living.filter(ind => { const c = dies(ind); if (c) deadOnes.push([ind, c, "in the inventory"]); return !c; });
    r.amount = r.living.length;
  }
  inventory.forEach((r, k) => { if (r?.living && !r.amount) inventory[k] = null; });
  if (hand.item?.living && !hand.item.amount) hand.item = null;
  for (const t of world.traps) if (t.prey && !t.removed) { const c = dies(t.prey); if (c) { deadOnes.push([t.prey, c, "in a trap"]); t.prey = null; } }
  for (const j of world.cages) {
    if (j.removed) continue;
    for (const ind of j.animals) {                    // they eat and drink by themselves from the feeder and the trough
      const needs = SPECIES[ind.type].needs;
      if (nowDay - ind.lastMeal >= needs.hunger) { const t = captiveDiet(ind.type).find(t => j.food[t] > 0); if (t) { j.food[t]--; ind.lastMeal = nowDay; } }
      if (nowDay - ind.lastDrink >= needs.thirst && j.water > 0) { j.water--; ind.lastDrink = nowDay; }
    }
    j.animals = j.animals.filter(ind => { const c = dies(ind); if (c) deadOnes.push([ind, c, "in the cage"]); return !c; });
  }
  world.traps = world.traps.filter(t => !t.removed);
  world.cages = world.cages.filter(j => !j.removed);
  if (deadOnes.length) {
    const [ind, c, whereAt] = deadOnes[0];
    notify(`Oh no… ${an(SINGULAR[ind.type].toLowerCase())} died of ${c} ${whereAt}` + (deadOnes.length > 1 ? ` (and ${deadOnes.length - 1} more)` : ""));
    for (const [ind] of deadOnes) recordDeath(ind, "captive");
    renderInventory();
  }
  if (openCageRef) {                                 // the panel closes if you walk away
    const [cx, cy] = toPixel(...world.cells[openCageRef.i]);
    if (openCageRef.removed || Math.hypot(...wrapDelta(cx + openCageRef.ox - player.x, cy + openCageRef.oy - player.y)) > 2 * SQ3) closeCage();
    else renderCage();
  }
}

// ---- water: fill the jar at a lake
function fillJar() {
  const v = inHand() === "jar" ? hand.item : null;
  if (!v) return;
  v.water = JAR_WATER * v.amount;
  wearTool("jar");
  notify(`I filled the jar: ${v.water} water`);
  renderInventory();
}

// ---- pickaxe: breaks rock off the outcrop; the stones fall around (they must be picked up) and the outcrop never runs out
function mine(y) {
  if (y.removed) return;
  const around = [...new Set(y.cells.flatMap(c => world.neighbors[c]))]
    .filter(i => i !== undefined && world.outcropAt[i] < 0 && !isWater(terrain(i)) && objs(i).length < MAX_PER_CELL)
    .sort(() => Math.random() - 0.5);
  const n = Math.min(2, around.length);
  for (const i of around.slice(0, n)) addObject(i, "stones");
  wearTool("pickaxe");
  notify(n ? "The rock breaks: stones to pick up around it" : "There is no room around for more stones");
}
function walkableNeighbor(i) {                           // free cell next to one that cannot be walked on (outcrop, deep water)
  const cand = world.neighbors[i].filter(j => j !== undefined && !blockedForPlayer(j));
  return cand.sort((a, b) => wrapDistance(a, player.i) - wrapDistance(b, player.i))[0];
}

// ---- shovel: dig up small plants and replant them elsewhere
const diggable = o => PLANTABLE.has(o.type);
function dig(i) {
  const o = objs(i).find(diggable);
  if (!o) return;
  const t = "sapling_" + o.type;
  if (!hasRoom(t)) { notify(SAY.full); return; }
  removeObject(o); store(t, 1); wearTool("shovel");
  notify(`I dug up ${an(RESOURCE_NAME[t].toLowerCase())}: where should I plant it?`);
}
function plantSapling(t, i) {
  const type = t.slice("sapling_".length), nowDay = gameDay();
  if (amountOf(t) === 0) return;
  const ground = DEF[type].sapling?.ground || "grass";         // palms: sand
  if (terrain(i) !== ground || world.outcropAt[i] >= 0 || objs(i).length >= MAX_PER_CELL) { notify(ground !== "grass" ? `${an(DEF[type].name.toLowerCase(), "A")} only grows on ${ground}` : "I cannot plant it here (it needs free grassland)"); return; }
  let o;
  if (TREES.has(type)) o = sproutTree(type, i);
  else if (DEF[type].berries) o = newBush(type, i);
  else { o = addObject(i, type, { food: 0, regrowAt: nowDay + GROW_DURATION }); if (o) world.regrowths.push({ o, at: o.regrowAt }); }
  if (!o) return;
  spend(t, 1); renderInventory();
  notify(`I planted ${an(DEF[type].name.toLowerCase())}`);
}

function sproutTree(type, i) {                                 // a young tree that has just sprouted (planted by the character)
  const v = TREE_LIFE[type], nowDay = gameDay();
  const o = addObject(i, type, { adultSince: Infinity, lastDrop: -1, bornAt: nowDay, born: nowDay, life: v[0] + Math.random() * (v[1] - v[0]) });
  if (o) world.trees.push(o);
  return o;
}
function newBush(type, i, extra = {}) {                        // a bush without fruit until the next season
  const o = addObject(i, type, { fruit: 0, ...extra });
  if (o) world.bushes.push(o);
  return o;
}
// ---- seeds: fruit, pine cones, coconuts and berries in the hand are sown where you click (their `sprouts` trait)
const seedOf = t => (t && DEF[t]?.sprouts && DEF[DEF[t].sprouts.plant]) ? DEF[t].sprouts : null;
function sow(t, i) {
  const sp = seedOf(t);
  if (!sp || amountOf(t) === 0) return;
  if (terrain(i) !== sp.ground || world.outcropAt[i] >= 0 || objs(i).length >= MAX_PER_CELL) { notify(sp.ground !== "grass" ? `${an(DEF[sp.plant].name.toLowerCase(), "A")} only grows on ${sp.ground}` : "I cannot sow it here (it needs free grassland)"); return; }
  const o = TREES.has(sp.plant) ? sproutTree(sp.plant, i) : DEF[sp.plant].berries ? newBush(sp.plant, i, { bornAt: gameDay() }) : null;
  if (!o) return;
  spend(t, 1); renderInventory();
  notify(`I sowed ${an(DEF[sp.plant].name.toLowerCase())}: let it grow`);
}

// ---- bow: shoots an arrow (it is used up) at a distant land animal
const BOW_RANGE = 9;                               // cells (the axe reaches 4.5)
function shoot(a) {
  const d = Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y)), [dx, dy] = wrapDelta(a.x - player.x, a.y - player.y);
  world.flyingAxe = { x: player.x, y: player.y, tx: player.x + dx, ty: player.y + dy, icon: "➶", straight: true };
  wearTool("bow");
  const prob = Math.min(0.9, 0.75 * (1 - d / (BOW_RANGE * SQ3) * 0.5) * (still(a) ? 1.2 : 1) * (a.inShelter ? 0.5 : 1));
  if (rnd() < prob) {
    Object.assign(a, { dead: true, deadAt: gameDay(), moving: false, fleeing: false, goal: null, action: null, cause: "hunted", stunnedUntil: 0 });
    if (SPECIES[a.type].needs) a.inShelter = false;
    if (SPECIES[a.type].hunt) { a.chaseTarget = null; a.stalksPlayer = false; }
    recordDeath(a, "hunted by the character");
    notify(`Bullseye! ${an(SINGULAR[a.type].toLowerCase(), "A")}. My knife will get the meat`);
  } else {
    if (SPECIES[a.type].needs) fleeFrom(a, SPECIES[a.type], [dx, dy], player);
    notify("My arrow missed");
  }
  renderInventory();
}
