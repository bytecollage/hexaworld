// =====================================================================================
//  CAPTURE: TRAPS, CAGES, CAPTIVE ANIMALS AND WATER (JAR)
// =====================================================================================
const JAR_WATER = 5, CAGE_STORAGE = 5, CAGE_STORAGE_MAX = 10;   // water in a full jar; the cage's slots (live animals, food, jars of water): 5, up to 10
const CAGE_SLOT_COST = { branches: 2, rope: 1 };       // each slot added with the + button
const TRAP_ESCAPE_DAYS = 1;                            // a trapped animal escapes after a whole day without being picked up
const THIRST_DEATH_DAYS = 3;                            // days without drinking until death (in the inventory, in a trap or in a cage)
const captiveDiet = t => { const d = CAPTIVE_DIET[t] || ["fruit", "berries", "flowers"]; return d.includes("fruit") ? [...d, "openCoconut"] : d; };   // fruit eaters eat open coconut too
const BAITS = ["fruit", "berries", "openCoconut"];

// ---- inventory room (so nothing is destroyed if it does not fit)
function hasRoom(type) {                              // does at least one more of it fit (hand or inventory)?
  return (inHand() === type && !single(hand.item) && hand.item.amount < STACK_LIMIT.inventory) || roomFor(inventory, type) > 0 || !hand.item;
}
// ---- live animals: each slot keeps its individuals with their hunger and thirst
// their needs as captives: the species' own, or `live.needs` for those that do not eat or drink in the simulation (frog, turtle)
const captiveNeeds = type => SPECIES[type].needs ?? SPECIES[type].live.needs;
// health of a captive: what is left of its food and water (0 = it dies); `need` says which one runs out first
function captiveHealth(ind) {
  const nowDay = gameDay(), food = 1 - (nowDay - ind.lastMeal) / captiveNeeds(ind.type).dies, water = 1 - (nowDay - ind.lastDrink) / THIRST_DEATH_DAYS;
  return { v: Math.max(0, Math.min(1, food, water)), need: food <= water ? "food" : "water" };
}
const worstHealth = list => list.map(captiveHealth).reduce((w, h) => h.v < w.v ? h : w, { v: 1, need: "food" });
const healthColor = h => h.v < 0.25 ? "#e5534b" : h.need === "food" ? "#e3b341" : "#4a93cf";   // red: about to die; amber: hungry first; blue: thirsty first
function healthBar(r) {                                 // for an inventory slot with live animals: the weakest one
  if (!r?.living?.length) return "";
  const h = worstHealth(r.living);
  return `<span class="health" title="${h.need === "food" ? "needs food" : "needs water"}"><span style="width:${Math.round(100 * h.v)}%;background:${healthColor(h)}"></span></span>`;
}
function individualOf(a) {
  const needs = captiveNeeds(a.type), nowDay = gameDay();
  return { type: a.type, born: a.born, lastMeal: a.lastMeal ?? nowDay, lastDrink: nowDay - Math.min(1, a.thirst ?? 0) * needs.thirst };
}
function storeIndividual(ind) {                      // a live animal: a slot of its own in the inventory (or the empty hand)
  const k = inventory.indexOf(null), r = { type: ind.type, amount: 1, living: [ind] };
  if (k >= 0) inventory[k] = r;
  else if (!hand.item) hand.item = r;
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
  t.prey = individualOf(a); t.prey.lastMeal = gameDay(); t.baitItem = null; t.caughtAt = gameDay();   // the lid falls (trap.js)
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
  const o = addObject(i, type, type === "trap" ? { baitItem: null, prey: null } : { animals: [], storage: Array(CAGE_STORAGE).fill(null) });
  if (!o) return;
  o.wear = takeWear(type); o.builtAt = gameDay();
  spend(type, 1);
  (type === "trap" ? world.traps : world.cages).push(o);
  if (type === "trap") notify(bait(o) ? `Trap set, with ${(RESOURCE_NAME[o.baitItem] || o.baitItem).toLowerCase()} as bait` : "Trap set, but it needs bait: fruit or berries");
  else notify("The cage is ready for my animals");
  renderInventory();
}
function pickUpTrap(t) {
  const carries = [t.prey ? individualOf({ type: t.prey.type }) : null, "trap", t.baitItem].filter(Boolean);
  if (!hasRoom("trap") || (t.prey && !hasRoom(t.prey.type))) { notify(SAY.full); return; }
  if (t.prey) { storeIndividual(t.prey); notify(`I caught ${an(SINGULAR[t.prey.type].toLowerCase())}`); }
  if (t.baitItem) store(t.baitItem, 1);
  const worn = (t.wear || 0) >= 1 - 1e-6;             // its 5th catch: it falls apart when picked up
  if (!worn) { store("trap", 1); keepWear("trap", t.wear); }
  removeObject(t);
  if (worn) notify("The trap fell apart: it had caught 5 animals");
  else if (!t.prey) notify("I picked up the trap");
}

// ---- cages
let openCageRef = null;
const cageLiving = j => (j.storage || []).flatMap(r => r?.living || []);   // the animals in a cage's slots
function openCage(j) { openCageRef = j; renderContainers(); }   // its 5 slots show as a row above the inventory: drag animals, food and jars there
function growCage(j) {                                 // the + button: one more slot, up to CAGE_STORAGE_MAX, paying its materials
  if (!j || j.storage.length >= CAGE_STORAGE_MAX) return;
  if (!hasMaterials({ cost: CAGE_SLOT_COST })) { notify(`For another slot I need ${recipeText({ cost: CAGE_SLOT_COST })}`); return; }
  for (const [t, n] of Object.entries(CAGE_SLOT_COST)) spendMaterial(t, n);
  j.storage.push(null); notify(`The cage has ${j.storage.length} slots now`);
  renderInventory(); renderContainers();
}
function closeCage() { if (!openCageRef) return; openCageRef = null; renderContainers(); }
function pickUpCage(j) {                             // (no way to do it from the game for now: its button was removed until further notice)
  if (!hasRoom("cage")) { notify(SAY.full); return; }
  const kept = j.storage.filter(Boolean);              // the food and jars in its slots go back to the inventory
  if (kept.length > inventory.filter(r => !r).length + kept.filter(r => inventory.some(x => x && x.type === r.type && r.type !== "jar")).length) { notify("I have no room for what is in the cage"); return; }
  for (const r of kept) storeStack(r);
  j.storage.fill(null);
  store("cage", 1); keepWear("cage", j.wear); removeObject(j); closeCage(); notify("I picked up the cage");
}
// ---- hunger and thirst of captives (inventory, hand, traps and cages)
function updateCaptives() {
  const nowDay = gameDay(), deadOnes = [];
  const dies = ind => {
    const needs = captiveNeeds(ind.type);
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
  for (const t of world.traps) if (t.prey && !t.removed) {
    if (nowDay - (t.caughtAt ?? nowDay) >= TRAP_ESCAPE_DAYS) {   // a whole day without anyone coming: it gnaws its way out
      freeIndividual(t.prey, t.i); const name = SINGULAR[t.prey.type].toLowerCase(); t.prey = null;
      notify(`The ${name} in my trap got away: I took too long`); renderInventory(); continue;
    }
    const c = dies(t.prey); if (c) { deadOnes.push([t.prey, c, "in a trap"]); t.prey = null; }
  }
  for (const j of world.cages) {
    if (j.removed) continue;
    const st = j.storage || [];
    for (const ind of cageLiving(j)) {               // they eat and drink by themselves from the food and jars in the cage's slots
      const needs = captiveNeeds(ind.type), diet = captiveDiet(ind.type);
      if (nowDay - ind.lastMeal >= needs.hunger) {
        const k = st.findIndex(r => r && diet.includes(r.type) && r.amount > 0);
        if (k >= 0) { if (--st[k].amount <= 0) st[k] = null; ind.lastMeal = nowDay; }
      }
      if (nowDay - ind.lastDrink >= needs.thirst) { const jar = st.find(r => r?.type === "jar" && r.water > 0); if (jar) { jar.water--; ind.lastDrink = nowDay; } }
    }
    st.forEach((r, k) => {
      if (!r?.living) return;
      r.living = r.living.filter(ind => { const c = dies(ind); if (c) deadOnes.push([ind, c, "in the cage"]); return !c; });
      r.amount = r.living.length; if (!r.amount) st[k] = null;
    });
  }
  world.traps = world.traps.filter(t => !t.removed);
  world.cages = world.cages.filter(j => !j.removed);
  if (deadOnes.length) {
    const [ind, c, whereAt] = deadOnes[0];
    notify(`Oh no… ${an(SINGULAR[ind.type].toLowerCase())} died of ${c} ${whereAt}` + (deadOnes.length > 1 ? ` (and ${deadOnes.length - 1} more)` : ""));
    for (const [ind] of deadOnes) recordDeath(ind, "captive");
    renderInventory();
  }
  if (openCageRef) {                                 // the cage's row closes if you walk away
    const [cx, cy] = toPixel(...world.cells[openCageRef.i]);
    if (openCageRef.removed || Math.hypot(...wrapDelta(cx + openCageRef.ox - player.x, cy + openCageRef.oy - player.y)) > 2 * SQ3) closeCage();
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
  const prob = Math.min(0.9, 0.75 * (1 - d / (BOW_RANGE * SQ3) * 0.5) * (still(a) ? 1.2 : 1) * (a.inShelter ? 0.5 : 1) * (SPECIES[a.type].asTarget?.hit ?? 1));
  if (rnd() < prob) {
    Object.assign(a, { dead: true, deadAt: gameDay(), moving: false, fleeing: false, goal: null, action: null, cause: "hunted", stunnedUntil: 0 });
    if (SPECIES[a.type].needs) a.inShelter = false;
    if (SPECIES[a.type].hunt) { a.chaseTarget = null; a.stalksPlayer = false; }
    recordDeath(a, "hunted by the character");
    notify(`Bullseye! ${an(SINGULAR[a.type].toLowerCase(), "A")}. My knife will get the meat`);
  } else {
    if (SPECIES[a.type].needs) fleeFrom(a, SPECIES[a.type], [dx, dy], player);
    notify("My arrow missed");
    if (SPECIES[a.type].provoke) annoy(a, SPECIES[a.type]);   // a missed shot bothers it (caiman, jaguar)
  }
  renderInventory();
}
