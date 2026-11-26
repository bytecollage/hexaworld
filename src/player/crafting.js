// =====================================================================================
//  CRAFTING (workshop), HAND, FIRE, NIGHT LIGHT AND TOOLS
// =====================================================================================
// wood = gathered branches (or wood from felled trees)
// requires: what must have been made before (learned skills); tools: one of them must be carried (not used up)
const RECIPES = [
  { id: "torch", group: "fire", name: "Torch", cost: { branches: 1, grass: 1 },
    text: "Lasts 1 night. Carried in the hand: gives little light, but it moves with you. Keeps predators away." },
  { id: "campfire", group: "fire", name: "Campfire", cost: { branches: 3 },
    text: "Choose its cell: the character lights it there. Burns all night (it does not move). Lights up a bit more around it. Keeps predators away." },
  { id: "bonfire", group: "fire", name: "Bonfire", requires: ["campfire"], cost: { stones: 5, branches: 3 },
    text: "Choose its cell: the character builds it there. Burns all night and gives more light. It does not move. When it goes out the stones remain: relight it by adding wood or grass (it lasts according to what you add). Keeps predators away." },
  { id: "rope", group: "crafts", name: "Rope", cost: { grass: 3 },
    text: "Grass twisted into rope. Needed for the axe, the bow, traps, cages, gates and the house." },
  { id: "sharpStone", group: "crafts", name: "Sharp stone", cost: { stones: 3 },
    text: "A stone knapped into an edge with two others. The blade of the knife and the axe." },
  { id: "sharpBone", group: "crafts", name: "Sharpened bone", requires: ["knife"], cost: { bones: 1, stones: 1 },
    text: "A bone ground to a point with a stone. Arrow points for the bow. Bones come with the meat of dead animals." },
  { id: "tannedHide", group: "crafts", name: "Tanned hide", requires: ["knife", "campfire"], cost: { hide: 1, grass: 2 }, needsFire: true,
    text: "A hide smoked over grass: only next to a lit campfire or bonfire. For the bow and the house. Hides come with the meat of big animals." },
  { id: "resin", group: "crafts", name: "Resin", requires: ["campfire"], cost: { pineCone: 2 }, needsFire: true,
    text: "Pine cones melted into resin: only next to a lit campfire or bonfire. Glue for the arrows of the bow; it also burns well." },
  { id: "basket", group: "crafts", name: "Basket", requires: ["rope"], cost: { grass: 6, rope: 2 }, container: 5,
    text: "A woven basket you carry with you: 5 more slots, opened with Shift (or its button at the right of the inventory) above the inventory. Lasts half a year (10 days): then it breaks and what it held falls beside you. Lost if you die." },
  { id: "knife", group: "tools", name: "Knife", requires: ["sharpStone"], cost: { sharpStone: 1, grass: 1 },
    text: "With it in your hand, click a dead animal to cut its meat. Takes one inventory slot." },
  { id: "axe", group: "tools", name: "Axe", requires: ["knife", "rope"], cost: { sharpStone: 1, branches: 2, rope: 1 },
    text: "With it in your hand: click a tree to chop it down (gives wood); click a nearby animal to throw it and hunt it. Takes one inventory slot." },
  { id: "hammer", group: "tools", name: "Hammer", requires: ["knife"], cost: { stones: 2, branches: 2 },
    text: "With it in your hand: click something built (fence section, gate, house, cage, trap, bonfire, campfire) to dismantle it and recover its materials." },
  { id: "pickaxe", group: "tools", name: "Pickaxe", requires: ["hammer"], cost: { stones: 4, branches: 2 },
    text: "With it in your hand: click an outcrop to break off rock; the stones fall around it and must be picked up. The outcrop never runs out." },
  { id: "shovel", group: "tools", name: "Shovel", requires: ["axe"], cost: { branches: 3, stones: 2 },
    text: "With it in your hand: click a fruit bush, tall grass or flowers to dig it up and carry it; then, with the sapling in your hand, click where you want to replant it." },
  { id: "bow", group: "tools", name: "Bow and arrows", requires: ["axe", "tannedHide", "sharpBone", "resin"], cost: { branches: 3, rope: 2, tannedHide: 1, sharpBone: 1, resin: 1 },
    text: "Bow with its arrows (a single object). With it in your hand: click a land animal less than 9 cells away to shoot it (the axe only reaches 4.5). It also works against the jaguar." },
  { id: "jar", group: "tools", name: "Jar", requires: ["knife"], cost: { coconut: 2 },
    text: "Stores and carries water: with it in your hand, click a lake to fill it (5 water). Used for the cage's trough." },
  { id: "trap", group: "capture", name: "Trap", requires: ["knife", "rope"], cost: { branches: 4, rope: 1 },
    text: "With it in your hand, click the ground to place it. It needs fruit or berries as bait: a small mammal goes in to eat and is trapped alive. Click it to pick it up (with whatever is inside)." },
  { id: "cage", group: "capture", name: "Cage", requires: ["trap", "axe"], cost: { branches: 8, rope: 2 },
    text: "With it in your hand, click the ground to place it. It holds 4 animals: click it to put in the ones from your inventory, give them food and water, take them out or pick it up." },
];
const FIRE = {                                       // light and protection radius (cells)
  torch: { light: 2.2, protects: 2 },
  campfire:   { light: 3.5, protects: 3 },
  bonfire:  { light: 5.5, protects: 4 },
};
const TORCH_DURATION = 0.55;                           // days of flame of a torch (a night and a bit)
const hand = { item: null, torchLeft: 0 };        // the hand slot: { type, amount } or null (outside the inventory)
const inHand = () => hand.item?.type ?? null;
const amountOf = t => (inventory.find(r => r && r.type === t)?.amount || 0) + (inHand() === t ? hand.item.amount : 0);
const hasMaterials = r => Object.entries(r.cost).every(([t, n]) => amountOf(t) >= n);
const FIRE_REACH = 2;                                // reference cells: "next to a fire" for recipes with needsFire
const nearFire = () => player.i >= 0 && world.fires.some(o => burning(o) && wrapDistance(o.i, player.i) <= cellsFor(FIRE_REACH));
const upgrades = new Set();                          // recipes with `container` already made (basket): made only once
let basket = null, basketMadeAt = 0;                 // the basket's slots (null until it is made) and when it was made
const known = new Set();                             // recipes and builds made at least once: they stay in the workshop
const learn = id => { if (!known.has(id)) { known.add(id); renderWorkshop(); } };
const nameOf = id => (RECIPES.find(r => r.id === id) || BUILDS[id])?.name.toLowerCase() || id;
const toLearn = r => (r.requires || []).filter(id => !known.has(id));   // skills still missing for it
const learned = r => toLearn(r).length === 0;
const hasTool = r => !r.tools || r.tools.some(t => amountOf(t) > 0);
const orList = l => l.map(t => an(nameOf(t))).join(" or ");
const andList = l => l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " and " + l[l.length - 1];
const canMake = r => learned(r) && hasTool(r) && hasMaterials(r) && (!r.needsFire || nearFire()) && !(r.container && upgrades.has(r.id));
function resetUpgrades() { upgrades.clear(); known.clear(); basket = null; basketOpen = false; inventory.fill(null); dropLadder(); }   // new game
const cannotMake = r => !learned(r) ? `I do not know how yet: first I have to make ${andList(toLearn(r).map(id => an(nameOf(id))))}`
  : !hasTool(r) ? `I need ${orList(r.tools)} with me for that`
  : !hasMaterials(r) ? `For ${an(r.name.toLowerCase())} I need ${recipeText(r)}`
  : `I need a lit fire next to me for that`;
function spend(type, n) {                            // takes n out of the inventory (and if it is not enough, from the hand); frees what becomes empty
  const k = inventory.findIndex(r => r && r.type === type);
  if (k >= 0) { const m = Math.min(n, inventory[k].amount); inventory[k].amount -= m; n -= m; if (!inventory[k].amount) inventory[k] = null; }
  if (n > 0 && inHand() === type) { hand.item.amount -= n; if (hand.item.amount <= 0) hand.item = null; }
}
function swapSlot(k) {                            // key 1-0 or click: slot k goes to the hand and what was in the hand goes to that slot
  cancelWork(player.job ? "I stopped what I was doing" : null);
  [inventory[k], hand.item] = [hand.item, inventory[k]];
  if (inHand() === "torch" && hand.torchLeft <= 0) hand.torchLeft = TORCH_DURATION;
  renderInventory();
}
function storeHand() {                              // click on the hand: to the first free slot (or next to those of its type)
  if (!hand.item) return;
  cancelWork(player.job ? "I stopped what I was doing" : null);
  const same = inventory.find(r => r && r.type === hand.item.type);
  if (same) {
    if (same.living || hand.item.living) { same.living = [...(same.living || []), ...(hand.item.living || [])]; same.amount = same.living.length; }
    else { same.amount += hand.item.amount; if (hand.item.water) same.water = (same.water || 0) + hand.item.water; }
    hand.item = null;
  }
  else { const k = inventory.indexOf(null); if (k < 0) { notify(SAY.full); return; } inventory[k] = hand.item; hand.item = null; }
  renderInventory();
}
function toHand(type) {                              // puts a freshly made object in the hand; whatever was there goes to the inventory
  if (inHand() === type) { hand.item.amount++; return; }
  if (hand.item) storeHand();
  if (hand.item) { store(type, 1); return; }        // what is in the hand does not fit: the new item goes to the inventory
  hand.item = { type, amount: 1 };
}
const nextDawn = () => Math.floor(gameDay()) + 1;   // the day starts at dawn
function craftNow(id) {                              // tools, capture items and the torch (fires are placed with lightFireAt)
  const r = RECIPES.find(r => r.id === id);
  if (!canMake(r)) { notify(cannotMake(r)); return; }
  if (!r.container && amountOf(id) === 0 && !inventory.includes(null) && hand.item) { notify(SAY.full); return; }
  for (const [t, n] of Object.entries(r.cost)) spend(t, n);
  learn(id);
  if (r.container) {                                 // a carried container instead of an item: its slots open with Shift
    basket = Array(r.container).fill(null); basketOpen = true; basketMadeAt = gameDay();
    upgrades.add(id); notify(SAY.basketDone); renderInventory(); renderContainers(); return;
  }
  if (id === "torch") { toHand("torch"); if (hand.torchLeft <= 0) hand.torchLeft = TORCH_DURATION; }
  else store(id, r.gives || 1);
  id === "torch" ? notify(SAY.torchLit) : notify(SAY.crafted, r.name.toLowerCase());
  renderInventory();
}
function lightFireAt(id, i) {                          // campfire or bonfire in the chosen cell
  const r = RECIPES.find(r => r.id === id);
  if (!canMake(r)) { notify(cannotMake(r)); return; }
  if (!canPlaceAt(i)) { notify("It will not fit there: I need a free spot"); return; }
  for (const [t, n] of Object.entries(r.cost)) spend(t, n);
  const o = addObject(i, id, { burnsUntil: nextDawn(), builtAt: gameDay() });
  world.fires.push(o); learn(id);
  notify(`The ${r.name.toLowerCase()} is lit: it feels warmer`);
  if (buildMode === id) { buildMode = null; renderWorkshop(); }
  renderInventory();
}
const burning = o => !o.removed && gameDay() < o.burnsUntil;
function updateFires() {                         // extinguished campfires → ashes (1 day); extinguished bonfires: the stones remain
  const nowDay = gameDay();
  for (const o of world.fires) if (o.type === "campfire" && !o.removed && nowDay > o.burnsUntil + 1) removeObject(o);
  world.fires = world.fires.filter(o => !o.removed);
  if (inHand() === "torch" && darkness() > 0.05) { // the torch only burns in the dark (it does not wear out by day)
    hand.torchLeft -= (nowDay - (hand.last ?? nowDay));
    if (hand.torchLeft <= 0) {
      hand.item.amount--;
      if (hand.item.amount > 0) hand.torchLeft = TORCH_DURATION; else { hand.item = null; notify(SAY.torchOut); }
      renderInventory();
    }
  }
  hand.last = nowDay;
}
function activeLights() {                             // [x, y, lightRadius, protectionRadius]
  const l = [];
  for (const o of world.fires) if (burning(o)) {
    const [cx, cy] = toPixel(...world.cells[o.i]);
    l.push([cx + o.ox, cy + o.oy, FIRE[o.type].light, FIRE[o.type].protects]);
  }
  if (inHand() === "torch" && player.i >= 0 && !player.dead && !player.inside) l.push([player.x, player.y, FIRE.torch.light, FIRE.torch.protects]);
  const home = player.inside;                          // the occupied house glows through its windows (it does not scare predators)
  if (home && !home.removed) { const [hx, hy] = toPixel(...world.cells[home.i]); l.push([hx, hy, 2.2, 0, true]); }
  return l;
}
function characterLit() {                      // is the character inside the light of some fire (or holding the torch)?
  for (const [lx, ly, light] of world.lightsCache || []) if (Math.hypot(...wrapDelta(player.x - lx, player.y - ly)) < light * SQ3 * 0.8) return true;
  return false;
}
const playerInDanger = () => player.i >= 0 && !player.dead && !player.sleeping && !player.inside && darkness() >= 0.45 && !characterLit();
function killPlayer(text) {
  if (player.dead) return;
  player.dead = true; player.route = []; player.task = null; player.job = null;
  $("deathText").textContent = text;
  $("death").classList.add("visible");
}
function threatenPlayer(a, e, dt) {                       // returns true if the predator is going after the character
  if (!playerInDanger() || sizeOf(a) < 0.8) { a.stalksPlayer = false; return false; }
  const d = Math.hypot(...wrapDelta(player.x - a.x, player.y - a.y));
  if (e.hunt.threatensPlayer === "shore") {            // caiman: on the lake shore or wading in it, next to it
    if (d > 1.3 * SQ3 || !(world.lake[player.i] || world.lakeShore[player.i])) return false;
    if ((a.lastPlayerAttack || 0) > gameDay() - 0.03) return true;
    a.lastPlayerAttack = gameDay();
    if (rnd() < 0.4) killPlayer(`${an(SINGULAR[a.type].toLowerCase(), "A")} attacked you on the lake shore, in the dark.`);
    else notify("Something moved in the water! I should get away from the lake");
    return true;
  }
  if (d > 9 * SQ3 || a.hunger < 0.4) { a.stalksPlayer = false; return false; }
  if (!a.stalksPlayer) { a.stalksPlayer = true; notify("Something is following me in the dark… I need a fire"); }
  const sprint = d < 2.5 * SQ3;
  moveToward(a, player.x, player.y, e.speed * SQ3 * (sprint ? e.hunt.huntSpeed : 0.8), dt);
  if (Math.hypot(...wrapDelta(player.x - a.x, player.y - a.y)) < 0.5) killPlayer(`${an(SINGULAR[a.type].toLowerCase(), "A")} attacked you in the dark.`);
  return true;
}
// provoke: { radius, times, charge, reach, warn, attacks, kills }: each time the character walks within `radius` reference
// cells of it counts as an approach (it has to move away again before the next one counts). The approach before the
// last gets a warning; the last one in the same day makes it charge at `charge` × speed for 10 s, by day too, and kill
// the character if it reaches it (within `reach` reference cells: the caiman bites from the edge of the water). A fire,
// the house or keeping out of its reach (the caiman cannot leave its shore) saves you.
const PROVOKED_SECONDS = 10, APPROACH_GAP = 5;       // game seconds of the charge; and between two approaches that count
function provoked(a, e, dt) {                          // true while it is attacking the character
  const pv = e.provoke;
  if (a.provokedUntil > gameDay()) {
    if (!playerAround()) { a.provokedUntil = 0; return false; }
    if (moveToward(a, player.x, player.y, e.speed * pv.charge * SQ3, dt) === "blocked") a.moving = false;   // at the edge of its terrain: it waits there
    if (Math.hypot(...wrapDelta(player.x - a.x, player.y - a.y)) < Math.max(0.5, (pv.reach || 0) * SQ3)) killPlayer(pv.kills);
    return true;
  }
  if (!playerAround() || sizeOf(a) < 0.8) { a.playerClose = false; return false; }
  const d = Math.hypot(...wrapDelta(player.x - a.x, player.y - a.y));
  if (d > pv.radius * SQ3 * 1.3) { a.playerClose = false; return false; }   // far enough: the next approach counts again
  if (d >= pv.radius * SQ3 || a.playerClose) return false;
  a.playerClose = true;
  const next = player.route[player.route.length - 1];   // where the character is going: it has to be heading for the animal
  if (!next || Math.hypot(...wrapDelta(next.x - a.x, next.y - a.y)) >= d) return false;   // passing by, or it came to the character
  if (gameDay() - (a.annoyedAt || -1) < APPROACH_GAP / DAY_DURATION) return false;          // the same visit, wandering in and out
  a.annoyedAt = gameDay();
  if (a.annoyedDay !== clock.day) { a.annoyedDay = clock.day; a.annoyed = 0; }
  a.annoyed++;
  if (a.annoyed >= pv.times) {
    a.annoyed = 0; a.evade = null; a.charge = null; a.chaseTarget = null; a.eating = 0;
    a.provokedUntil = gameDay() + PROVOKED_SECONDS / DAY_DURATION;
    notify(pv.attacks);
    return true;
  }
  if (a.annoyed === pv.times - 1) notify(pv.warn);
  return false;
}
function fireNear(x, y, margin = 0) {               // fire that protects that point (for predators)
  for (const [lx, ly, , pr] of world.lightsCache || []) {
    const d = Math.hypot(...wrapDelta(x - lx, y - ly));
    if (d < (pr + margin) * SQ3) return [lx, ly, d];
  }
  return null;
}
const FIRE_TYPES = ["campfire", "bonfire"];           // fires on the ground that can be fed
// what goes on the fire: the plant-origin thing in the hand; otherwise wood, then grass, from the inventory
const fuelToThrow = () => FUEL[inHand()] ? inHand() : amountOf("branches") > 0 ? "branches" : amountOf("grass") > 0 ? "grass" : null;
function stokeNow(o) {                                  // throw one unit on a campfire or bonfire: it burns longer
  const t = fuelToThrow();
  if (!t) { notify(`I need something that burns (wood, grass…) for the ${o.type}`); return; }
  const was = burning(o);
  spend(t, 1);
  o.burnsUntil = Math.max(gameDay(), o.burnsUntil) + FUEL[t];
  if (!world.fires.includes(o)) world.fires.push(o);
  notify(`I ${was ? "fed" : "lit"} the ${(RESOURCE_NAME[o.type] || o.type).toLowerCase()} with ${ICONS[t] || ""} ${(RESOURCE_NAME[t] || t).toLowerCase()} (+${Math.round(FUEL[t] * 24 * 10) / 10} h)`);
  renderInventory();
}
