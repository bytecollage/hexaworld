// =====================================================================================
//  WEAR: everything built has a useful life. Tools and capture items wear with each use (the unit in use: a bar on
//  its inventory slot); structures in the world wear with time and use; the house lasts 5 years and then falls down.
// =====================================================================================
const WEAR_PER_USE = { axe: 0.04, knife: 0.03, hammer: 0.05, pickaxe: 0.05, shovel: 0.06, bow: 0.025, jar: 0.03, trap: 0.2 };   // the trap: 5 catches
const LIFE_DAYS = { fence: 60, gate: 60, cage: 2 * YEAR_DAYS, chest: 2 * YEAR_DAYS, bonfire: 80 };   // days a structure lasts standing in the world (cage and chest: 2 years)
const HOUSE_LIFE = 5 * YEAR_DAYS, HOUSE_DECAY_FROM = 4 * YEAR_DAYS;          // the house: 5 years; signs of decay from the 4th
const BASKET_LIFE = YEAR_DAYS / 2;                                           // the basket: half a year, then it breaks
const basketWear = () => basket ? Math.min(1, (gameDay() - basketMadeAt) / BASKET_LIFE) : 0;
const showsWear = t => t in WEAR_PER_USE || t in LIFE_DAYS;
const wearBar = r => r && showsWear(r.type) ? `<span class="life" style="width:${Math.round(44 * (1 - Math.min(1, r.wear || 0)))}px"></span>` : "";

function stackOf(type) { return inHand() === type ? hand.item : inventory.find(r => r && r.type === type) || null; }
function wearTool(type, uses = 1) {                   // the unit in use wears; when it breaks, one is lost
  const r = stackOf(type); if (!r) return;
  r.wear = (r.wear || 0) + WEAR_PER_USE[type] * uses;
  if (r.wear >= 1) {
    r.amount--; r.wear = 0;
    notify(`My ${(RESOURCE_NAME[type] || type).toLowerCase()} broke!`);
    if (r.amount <= 0) { if (r === hand.item) hand.item = null; else inventory[inventory.indexOf(r)] = null; }
  }
  renderInventory();
}
function takeWear(type) {                             // a unit leaves the inventory to the world: it takes the wear of the one in use
  const r = stackOf(type), w = r?.wear || 0;
  if (r) r.wear = 0;                                  // the next unit is new
  return w;
}
function keepWear(type, w) {                          // a unit comes back from the world: the stack keeps the most worn one
  const r = stackOf(type); if (r && w) r.wear = Math.max(r.wear || 0, w);
}

// ---- structures in the world (every 0.5 s and while skipping time)
function updateWear() {
  const nowDay = gameDay(), dt = Math.max(0, nowDay - (world.lastWear ?? nowDay)); world.lastWear = nowDay;
  if (!dt) return;
  world.chests = (world.chests || []).filter(o => !o.removed);
  const built = [...(world.cages || []), ...world.chests, ...(world.fenceAt?.values() || []), ...world.fires.filter(o => o.type === "bonfire")];
  for (const o of built) {
    if (o.removed) continue;
    o.wear = (o.wear || 0) + dt / LIFE_DAYS[o.type];
    if (o.wear >= 1) breakDown(o);
  }
  if (basket && basketWear() >= 1) basketBreaks();
  for (const h of [...(world.houses || [])]) {
    if (h.removed) continue;
    const age = nowDay - (h.builtAt ?? nowDay), sh = DEF[h.type].shelter, name = DEF[h.type].name.toLowerCase();   // house: 5 years; hut: 1
    h.wear = age / sh.life;
    if (age >= sh.decayFrom && !h.decayNoticed) { h.decayNoticed = true; notify(`My ${name} is getting old: it is wearing out`); }
    if (age >= sh.life) collapseHouse(h);
  }
}
function basketBreaks() {                             // worn out: what was in its slots falls beside you (piles to gather); make another one
  const at = player.inside ? doorOf(player.inside) ?? null : player.i >= 0 ? player.i : null;   // inside the house: at its door
  const held = inventory.splice(SLOTS).filter(Boolean);
  let lost = 0;
  for (const r of held) {
    if (r.living) { if (at !== null) for (const v of r.living) freeIndividual(v, at); continue; }
    if (at === null || !dropStack(at, r)) lost++;
  }
  basket = null; upgrades.delete("basket");
  renderInventory(); renderWorkshop();
  notify(held.length ? `My basket broke! Everything fell out${lost ? ` (${lost} stack(s) lost: no room)` : ""}` : "My basket broke!");
}
function breakDown(o) {                               // a worn-out structure falls apart: its materials are lost
  const near = Math.hypot(...wrapDelta(toPixel(...world.cells[o.i])[0] - player.x, toPixel(...world.cells[o.i])[1] - player.y)) < 12 * SQ3;
  if (o.type === "trap" && o.prey) freeIndividual(o.prey, o.i);
  if (o.type === "cage") for (const r of (o.storage || []).filter(Boolean)) {   // broken: its animals escape; their food and water stay on the ground
    if (r.living) for (const v of r.living) freeIndividual(v, o.i); else dropStack(o.i, r);
  }
  if (o.type === "chest") {                           // broken: what it held is left on the ground, in its cell and around it
    removeObject(o);
    for (const r of (o.storage || []).filter(Boolean)) { if (r.living) for (const v of r.living) freeIndividual(v, o.i); else dropStack(o.i, r); }
  }
  if (o === openCageRef) closeCage();
  if (o === openChestRef) closeChest();
  removeObject(o);
  if (isPost(o)) world.fenceAt.delete(o.i);
  if (near) notify(o.type === "cage" && o.storage?.some(r => r?.living) ? "The cage fell apart: my animals escaped"
    : o.type === "chest" && o.storage?.some(Boolean) ? "My chest fell apart! My things are lying on the ground" : `The ${DEF[o.type].name.toLowerCase()} fell apart`);
}
function freeIndividual(ind, i) {                     // a captive animal escapes into the wild
  const [x, y] = toPixel(...world.cells[i]);
  const a = createAnimal(ind.type, x + (rnd() - 0.5) * 0.3, y + (rnd() - 0.5) * 0.3, { born: gameDay() - 15, lastMeal: ind.lastMeal });
  if (a) a.released = true;
}
function collapseHouse(h) {                           // after 5 years the house falls down: its materials are lost and its storage is left on the ground
  if (player.inside === h || player.house === h) {
    if (player.sleeping) wakeUp();
    leaveHouse();
    const v = doorOf(h); if (v !== undefined) { [player.x, player.y] = toPixel(...world.cells[v]); player.i = v; }
  }
  removeObject(h);
  world.houses = world.houses.filter(c => c !== h);
  for (const c of h.cells) world.houseAt.delete(c);
  const cells = [...h.cells].sort((a, b) => hash(a, 77) - hash(b, 77));
  let k = 0;
  for (const r of h.storage) {
    if (!r) continue;
    if (r.living) { for (const v of r.living) freeIndividual(v, h.i); continue; }   // the animals inside run away
    while (k < cells.length && !freeCell(cells[k])) k++;
    const c = cells[k++] ?? h.i;
    dropStack(c, r);
  }
  notify(h.storage.some(Boolean) ? `My ${DEF[h.type].name.toLowerCase()} fell down! My things are lying on the ground` : `My ${DEF[h.type].name.toLowerCase()} fell down`);
}
