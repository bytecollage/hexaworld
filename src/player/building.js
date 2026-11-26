// =====================================================================================
//  MAJOR BUILDINGS: HOUSE (SLEEP) AND FENCE BY POSTS (WITH GATE). Choosing where things go (also fires).
// =====================================================================================
const BUILDS = {
  house:   { name: "House", requires: ["axe", "tannedHide"], cost: { branches: 30, stones: 15, rope: 6, tannedHide: 2 }, dur: 18,
            text: "Marked green under the mouse if it fits. Choose where: the character builds it (18 s). Click it to enter: inside you are safe, you have a 20-slot storage and, at dusk or at night, you can sleep until dawn." },
  fence:  { name: "Fence (by posts)", requires: ["rope"], tools: ["axe", "knife"], cost: { branches: 1, rope: 1 }, dur: 1,
            text: "Click a cell to plant a post (1 wood + 1 rope; you need an axe or a knife with you). Each new post joins the nearest one with rails, filling the cells in between. No animal crosses it: yours do not get out and land predators do not get in. Keep marking cells until you press Esc or the icon again. With the hammer in your hand, click a post to take it out." },
  chest: { name: "Chest", group: "capture", requires: ["axe", "rope"], cost: { branches: 6, rope: 2 }, dur: 5,   // shown in the Capture menu, next to the cage
            text: "A wooden box in the cell you choose: it stays there (it cannot be moved). Click it to open its 10 slots above your inventory and drag things in and out. With the hammer, take it apart when it is empty." },
  gate: { name: "Gate (post)", requires: ["fence"], tools: ["axe", "knife"], cost: { branches: 2, rope: 1 }, dur: 2,
            text: "A fence post only the character can pass through. Costs 2 wood + 1 rope; you need an axe or a knife with you." },
};
const PLACED_FIRES = ["campfire", "bonfire"];         // fires are also placed by choosing a cell
let buildMode = null;                                  // "house" | "fence" | "gate" | "campfire" | "bonfire" | null: the next click chooses where
let mouseWorld = null;                                // ground point under the mouse (to preview where things go)
const FENCE_JOIN = 8;                                 // grid steps: a new post joins the nearest post this close
const isPost = o => o.type === "fence" || o.type === "gate";
const postAt = i => world.fenceAt?.get(i) ?? null;
function chooseBuild(id) {
  const def = BUILDS[id] || RECIPES.find(r => r.id === id);
  if (buildMode !== id && (!learned(def) || !hasTool(def))) { notify(cannotMake(def)); return; }   // skills and tools first
  buildMode = buildMode === id ? null : id;
  const what = PLACED_FIRES.includes(id) ? RECIPES.find(r => r.id === id).name.toLowerCase() : id;
  notify(!buildMode ? "Better not build that now"
    : id === "house" ? "Where should I build my house? (Esc: never mind)"
    : id === "fence" || id === "gate" ? `Where do the posts go? (${recipeText({ cost: BUILDS[id].cost })} each; they join the nearest one. Esc: done)`
    : `Where should the ${what} go? (Esc: never mind)`);
  renderWorkshop();
}
// can a small thing (fire, trap, cage, post, sapling) go in cell i?
const canPlaceAt = i => i !== undefined && i >= 0 && freeCell(i) && !blocked(i) && i !== player.i;
// cell from which the character works on `cells` (it stays outside them)
function approachOf(cells) {
  if (cells.some(c => world.neighbors[player.i]?.includes(c)) && !cells.includes(player.i)) return player.i;
  return aroundOf(cells)[0];
}
// the posts a click on cell i would plant: i plus the cells on the straight line to the nearest post (if close enough)
function fencePlan(i) {
  if (!canPlaceAt(i)) return { cells: i >= 0 && i !== undefined ? [i] : [], ok: false };
  let near = null, nd = Infinity;
  for (const j of world.fenceAt.keys()) { const d = wrapDistance(i, j); if (d < nd) { nd = d; near = j; } }
  if (near === null || nd > FENCE_JOIN || nd <= 1) return { cells: [i], ok: true };
  const [ax, ay] = toPixel(...world.cells[near]), [bx, by] = toPixel(...world.cells[i]), [dx, dy] = wrapDelta(bx - ax, by - ay);
  const cells = [];
  for (let k = 1; k <= nd; k++) { const c = idxAt(ax + dx * k / nd, ay + dy * k / nd); if (!cells.includes(c)) cells.push(c); }
  if (!cells.every(canPlaceAt)) return { cells: [i], ok: true };       // something in between: a loose post
  return { cells, ok: true };
}
function plantPosts(cells, type) {
  learn(type);
  let n = 0;
  for (const c of cells) {
    if (!canPlaceAt(c)) continue;
    if (!canBuild(type)) { notify(hasMaterials(BUILDS[type]) ? cannotMake(BUILDS[type]) : `I need ${recipeText({ cost: BUILDS[type].cost })} for each post`); buildMode = null; renderWorkshop(); break; }
    payBuild(type);
    const o = addObject(c, type, { builtAt: gameDay(), wear: 0 });
    world.fenceAt.set(c, o); n++;
    pushOut(c);
  }
  if (n && buildMode && !canBuild(buildMode)) { notify("Fence up. I have nothing left for another post"); buildMode = null; renderWorkshop(); }
}
function pushOut(c) {                                 // animals standing on a cell that becomes blocked step to a free neighbor
  const out = world.neighbors[c].find(j => j !== undefined && !blocked(j));
  if (out === undefined) return;
  const [x, y] = toPixel(...world.cells[out]);
  for (const a of world.animals) if (!SPECIES[a.type].flies && idxAt(a.x, a.y) === c) { const [dx, dy] = wrapDelta(x - a.x, y - a.y); a.x += dx; a.y += dy; a.moving = false; a.goal = null; }
}
const canBuild = id => learned(BUILDS[id]) && hasTool(BUILDS[id]) && hasMaterials(BUILDS[id]);
function payBuild(id) { for (const [t, n] of Object.entries(BUILDS[id].cost)) spend(t, n); renderInventory(); }
// the house is a rectangle of HOUSE_HALF world units around the anchor cell, along one of 6 directions (30° + 60°·k).
// It takes every cell whose center falls under it. Small things on the ground are moved aside; trees, bushes or builds prevent it
const STORAGE_SLOTS = 20, HOUSE_HALF = [1.45, 0.9];
function houseCells(a, k) {
  const ang = Math.PI / 6 + k * Math.PI / 3, ux = Math.cos(ang), uy = Math.sin(ang), [ax, ay] = toPixel(...world.cells[a]);
  const cells = cellsAround(a, 5).filter(c => {
    const [x, y] = toPixel(...world.cells[c]), [dx, dy] = wrapDelta(x - ax, y - ay);
    return Math.abs(dx * ux + dy * uy) <= HOUSE_HALF[0] && Math.abs(-dx * uy + dy * ux) <= HOUSE_HALF[1];
  });
  return { cells, k, axis: [ux, uy] };
}
function houseFootprint(a) {
  if (a === undefined) return null;
  const free = i => i !== undefined && !isWater(terrain(i)) && world.outcropAt[i] < 0 && !world.houseAt.has(i) && !world.fenceAt?.has(i) &&
                    objs(i).every(o => HOUSE_REMOVABLE.has(o.type));
  for (let k = 0; k < 6; k++) {
    const h = houseCells(a, (k + (houseTurn || 0)) % 6);
    if (h.cells.every(free)) return h;
  }
  return null;
}
let houseTurn = 0;                                    // preferred direction while choosing (the wheel… keeps the first that fits)
const aroundOf = cells => [...new Set(cells.flatMap(c => world.neighbors[c]))].filter(j => j !== undefined && !cells.includes(j) && !blockedForPlayer(j))
  .sort((a, b) => wrapDistance(a, player.i) - wrapDistance(b, player.i));
function buildHouse(i) {
  if (!canBuild("house")) { notify(cannotMake(BUILDS.house)); return; }
  const h = houseFootprint(i);
  if (!h) { notify("My house will not fit there (no trees, bushes, water or builds under it)"); return; }
  payBuild("house");
  for (const c of h.cells) for (const o of [...objs(c)]) removeObject(o);   // small things are moved aside
  const o = addObject(i, "house", { cells: h.cells, axis: h.axis, storage: Array(STORAGE_SLOTS).fill(null), builtAt: gameDay() });
  o.ox = 0; o.oy = 0;                                    // centered on the anchor cell
  for (const c of h.cells) world.houseAt.set(c, o);
  world.houses.push(o);
  const outside = aroundOf(h.cells);                   // whoever was underneath moves to one side
  const moveAside = (obj, isPlayer) => { const c = idxAt(obj.x, obj.y); if (!h.cells.includes(c) || !outside.length) return;
    const v = outside[0], [vx, vy] = toPixel(...world.cells[v]); obj.x = vx; obj.y = vy; if (isPlayer) obj.i = v; else { obj.moving = false; obj.goal = null; } };
  moveAside(player, true);
  for (const a of world.animals) if (!SPECIES[a.type].flies) moveAside(a, false);
  learn("house");
  notify(SAY.houseDone);
  buildMode = null; renderWorkshop();
}
const adjacent = house => house.cells.some(c => c === player.i || world.neighbors[player.i]?.includes(c));
const doorOf = house => aroundOf(house.cells)[0];
// ---- inside the house: safe, with the storage
function enterHouse(house) {                           // its storage shows as two rows above the inventory (containers.js)
  player.inside = house; player.route = []; player.task = null; closeChest();
  renderContainers();
  notify(SAY.enterHouse);
}
function leaveHouse() {
  if (!player.inside) return;
  player.inside = null;
  renderContainers();
}
// ---- chest: built in a cell like a fire; its storage shows as a row above the inventory while it is open
function placeChest(i) {
  if (!canBuild("chest")) { notify(cannotMake(BUILDS.chest)); return; }
  if (!canPlaceAt(i)) { notify("It will not fit there: I need a free spot"); return; }
  for (const [t, n] of Object.entries(BUILDS.chest.cost)) spend(t, n);
  const o = addObject(i, "chest", { storage: Array(CHEST_SLOTS).fill(null), builtAt: gameDay() });
  if (buildMode === "chest") buildMode = null;
  renderInventory();
  if (o) { learn("chest"); notify(SAY.chestDone); openChest(o); }
}
// ---- hammer: dismantle what was built and recover its materials
const RECOVERS = {                                    // what each thing gives back when dismantled
  fence: BUILDS.fence.cost, gate: BUILDS.gate.cost, house: BUILDS.house.cost, chest: BUILDS.chest.cost,
  cage: { branches: 8, rope: 2 }, trap: { branches: 4, rope: 1 },
  bonfire: { stones: 5 },                            // the wood already burned
  campfire: {},                                         // only ashes remain
};
const DISMANTLE_DURATION = { chest: 2, fence: 1, gate: 1.5, house: 8, cage: 3, trap: 1, bonfire: 2, campfire: 1 };
function allFit(types) {                          // is there room for all these types at once?
  const newOnes = types.filter(t => inHand() !== t && !inventory.some(r => r && r.type === t));
  return newOnes.length <= inventory.filter(r => !r).length + (hand.item ? 0 : 1);
}
function recover(materials) {
  const done = Object.entries(materials).filter(([, n]) => n > 0);
  for (const [t, n] of done) store(t, n);
  return done.map(([t, n]) => `${n} ${(RESOURCE_NAME[t] || t).toLowerCase()}`).join(", ");
}
function dismantle(o) {
  if (o.removed) return;
  if (o.type === "house" && o.storage.some(Boolean)) { notify("I should empty the house first"); return; }
  if (o.type === "chest" && o.storage.some(Boolean)) { notify("I should empty the chest first"); return; }
  const mat = { ...RECOVERS[o.type] };
  if (o.type === "trap" && o.baitItem) mat[o.baitItem] = (mat[o.baitItem] || 0) + 1;
  if (o.type === "cage") for (const [t, n] of Object.entries(o.food)) mat[t] = (mat[t] || 0) + n;
  const living = o.type === "cage" ? o.animals : o.type === "trap" && o.prey ? [o.prey] : [];
  if (!allFit([...Object.keys(mat), ...living.map(v => v.type)])) { notify("I cannot carry what is inside"); return; }
  for (const v of living) storeIndividual(v);          // animals that were inside go to the inventory (alive)
  wearTool("hammer");
  if (o === openCageRef) closeCage();
  if (o === openChestRef) closeChest();
  removeObject(o);
  if (o.type === "house") { world.houses = world.houses.filter(c => c !== o); for (const c of o.cells) world.houseAt.delete(c); }
  if (isPost(o)) world.fenceAt.delete(o.i);
  const text = recover(mat);
  notify(`I took the ${ELEMENT_NAME(o.type).toLowerCase()} apart${text ? ": " + text : " (nothing usable left)"}` + (living.length ? ` · I carry ${living.length} animal(s)` : ""));
}
const ELEMENT_NAME = t => DEF[t]?.name;
// ---- sleeping in the house
let speedBeforeSleep = 1;
function sleep(house) {
  if (currentPhase().name === "Day") { notify(SAY.notSleepy); return; }
  player.sleeping = true; player.house = house; player.inside = house; player.route = []; player.task = null;
  speedBeforeSleep = clock.speed; clock.speed = 60;       // the night goes by quickly while you sleep
  $("sleeping").classList.add("visible");
  notify(SAY.sleep);
}
function wakeUp() {
  if (!player.sleeping) return;
  player.sleeping = false; clock.speed = speedBeforeSleep;
  $("sleeping").classList.remove("visible");
  player.inside = null; renderContainers();
  if (!adjacent(player.house)) { const v = doorOf(player.house); if (v !== undefined) { const [x, y] = toPixel(...world.cells[v]); player.x = x; player.y = y; player.i = v; } }
  notify(SAY.wakeUp);
}
function watchSleep() { if (player.sleeping && currentPhase().name === "Day" && clock.t < 0.3) wakeUp(); }
// ---- release a live animal from the inventory (for example, inside a fence)
function releaseAnimal(type, i) {
  const ind = takeIndividual(type); if (!ind) return;
  const [cx, cy] = toPixel(...world.cells[i]);
  const a = createAnimal(type, cx + (Math.random() - 0.5) * 0.5, cy + (Math.random() - 0.5) * 0.5,
                        { born: gameDay() - 15, lastMeal: ind.lastMeal, thirst: Math.min(1.5, (gameDay() - ind.lastDrink) / SPECIES[type].needs.thirst) });
  a.hunger = Math.min(1.5, (gameDay() - ind.lastMeal) / SPECIES[type].needs.hunger);
  a.released = true;
  notify(`Off you go, little ${SINGULAR[type].toLowerCase()}`);
}
