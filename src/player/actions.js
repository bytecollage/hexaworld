function goAndDo(i, task) { if (i === undefined) return; walkTo(i); player.task = task; }
// right click: the character goes there and drops what is in the hand (a pile on the ground; live animals are set free)
function dropAction(cell) {
  if (cell === undefined || cell < 0 || isWater(terrain(cell)) || world.outcropAt[cell] >= 0) { notify("I cannot leave things there"); return; }
  goAndDo(blockedForPlayer(cell) ? walkableNeighbor(cell) : approachOf([cell]) ?? cell, { type: "drop", i: cell, what: inHand() });
}
function clickAction(px, py, cell) {
  const t = inHand();
  if (t === "hammer") {                                                 // dismantle what was built
    const o = world.houseAt.get(cell) || objs(cell).find(o => RECOVERS[o.type]);
    if (o) { goAndDo(o.type === "house" ? (adjacent(o) ? player.i : doorOf(o)) : approachOf([cell]), { type: "dismantle", o }); return true; }
  }
  if (buildMode === "house") {
    const h = houseFootprint(cell);
    if (!h) { notify("My house will not fit there: it needs free ground"); return true; }
    const fromCell = approachOf(h.cells);
    if (fromCell === undefined) { notify(SAY.noWay); return true; }
    goAndDo(fromCell, { type: "buildHouseTask", i: cell, h }); return true;
  }
  if (buildMode === "fence" || buildMode === "gate") {                  // posts: each click plants one (and joins the nearest)
    const plan = buildMode === "gate" ? { cells: [cell], ok: canPlaceAt(cell) } : fencePlan(cell);
    if (!plan.ok) { notify("A post will not fit there"); return true; }
    const fromCell = approachOf(plan.cells);
    if (fromCell === undefined) { notify(SAY.noWay); return true; }
    goAndDo(fromCell, { type: "posts", cells: plan.cells, what: buildMode }); return true;
  }
  if (buildMode === "chest") {                                              // chest: in the chosen cell
    if (!canPlaceAt(cell)) { notify("It will not fit there: I need a free spot"); return true; }
    const fromCell = approachOf([cell]);
    if (fromCell === undefined) { notify(SAY.noWay); return true; }
    goAndDo(fromCell, { type: "placeChest", i: cell }); return true;
  }
  if (PLACED_FIRES.includes(buildMode)) {                               // campfire or bonfire: in the chosen cell
    if (!canPlaceAt(cell)) { notify("It will not fit there: I need a free spot"); return true; }
    const fromCell = approachOf([cell]);
    if (fromCell === undefined) { notify(SAY.noWay); return true; }
    goAndDo(fromCell, { type: "placeFire", i: cell, what: buildMode }); return true;
  }
  const house = world.houseAt.get(cell);                                   // house: enter (from any of its 4 cells)
  if (house) { goAndDo(adjacent(house) ? player.i : doorOf(house), { type: "enter", o: house }); return true; }
  if (LIVE.has(t) && !blockedForPlayer(cell) && !animalAt(px, py, () => true, 0.6)) {   // release a live animal
    goAndDo(cell, { type: "release", i: cell, what: t }); return true;
  }
  const chest = objs(cell).find(o => o.type === "chest");               // chest: open it (its slots above the inventory)
  if (chest && t !== "hammer") {
    if (player.i === cell || world.neighbors[player.i]?.includes(cell)) { player.route = []; openChest(chest); return true; }   // already next to it
    goAndDo(approachOf([cell]) ?? cell, { type: "openChest", o: chest }); return true;
  }
  const cage = objs(cell).find(o => o.type === "cage");                 // cage: open its panel
  if (cage) { goAndDo(cell, { type: "openCage", o: cage }); return true; }
  const trap = objs(cell).find(o => o.type === "trap");               // trap: bait it or pick it up
  if (trap) { goAndDo(cell, { type: BAITS.includes(t) && !trap.baitItem && !trap.prey ? "bait" : "pickUpTrap", o: trap }); return true; }
  if ((t === "trap" || t === "cage" || t?.startsWith("sapling_")) && !blockedForPlayer(cell)) {   // put on the ground / plant, in that cell
    if (!canPlaceAt(cell)) { notify("It will not fit there: I need a free spot"); return true; }
    goAndDo(approachOf([cell]), { type: t.startsWith("sapling_") ? "plantSapling" : "place", i: cell, what: t }); return true;
  }
  if (seedOf(t) && canPlaceAt(cell) && !blockedForPlayer(cell) && terrain(cell) === seedOf(t).ground) {   // fruit, pine cone, coconut: sow it there
    goAndDo(approachOf([cell]), { type: "sow", i: cell, what: t }); return true;
  }
  if (world.outcropAt[cell] >= 0) {                                             // outcrop: with a pickaxe you get stone
    if (t !== "pickaxe") { notify("I need a pickaxe to break this rock"); return true; }
    goAndDo(walkableNeighbor(cell), { type: "mine", y: world.outcrops[world.outcropAt[cell]] }); return true;
  }
  if (t === "shovel") {                                                      // shovel: dig up small plants
    if (objs(cell).some(diggable)) { goAndDo(cell, { type: "dig", i: cell }); return true; }
    if (objs(cell).some(o => TREES.has(o.type) && o.fellAt === undefined)) { notify("My shovel is only good for small plants"); return true; }
  }
  if (t === "jar" && isWater(terrain(cell))) {                          // jar: fresh water from lakes
    if (!world.lake[cell]) { notify("Sea water is salty: I need a lake"); return true; }
    goAndDo(blockedForPlayer(cell) ? walkableNeighbor(cell) : cell, { type: "fill" }); return true;
  }
  if (t === "bow") {                                                      // bow: shoot a land animal
    const a = animalAt(px, py, a => HUNTABLE.has(a.type) && !a.dead && !(SPECIES[a.type].needs?.house && a.inShelter), 1.2);
    if (a) {
      if (Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y)) <= BOW_RANGE * SQ3) shoot(a); else notify("Too far for my bow");
      return true;
    }
  }
  if (inHand() === "stones") {                      // throw a stone at a small mammal
    const a = animalAt(px, py, a => STUNNABLE.has(a.type) && !a.dead && !stunned(a) && !(SPECIES[a.type].needs?.house && a.inShelter), 1.1);
    if (a) {
      if (Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y)) <= 4.5 * SQ3) { throwStone(a); return true; }
      notify("Too far to throw a stone"); return true;
    }
  }
  const at = animalAt(px, py, a => stunned(a) && !a.dead, 1.2);   // a stunned one: knife → meat; otherwise, pick it up
  if (at) { walkTo(idxAt(at.x, at.y)); player.task = { type: inHand() === "knife" ? "finishOff" : "takeAlive", a: at }; return true; }
  if (inHand() !== "axe") {                        // frogs and turtles: grabbed by hand
    const r = animalAt(px, py, a => SPECIES[a.type].grab && !a.dead, 1.1);
    if (r) {
      if (blockedForPlayer(idxAt(r.x, r.y)) && !world.neighbors[idxAt(r.x, r.y)].some(j => j !== undefined && !blockedForPlayer(j))) { notify(SAY.noWay); return true; }
      walkTo(blockedForPlayer(idxAt(r.x, r.y)) ? world.neighbors[idxAt(r.x, r.y)].find(j => j !== undefined && !blockedForPlayer(j)) : idxAt(r.x, r.y));
      player.task = { type: "grab", a: r }; return true;
    }
  }
  if (inHand() === "axe") {                        // throw the axe at a nearby animal
    const a = animalAt(px, py, a => HUNTABLE.has(a.type) && !a.dead && !(SPECIES[a.type].needs?.house && a.inShelter), 1.1);
    if (a) {
      if (Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y)) <= 4.5 * SQ3) { throwAxe(a); return true; }
      notify("Too far to throw my axe"); return true;
    }
  }
  if (inHand() === "knife") {                     // go cut the meat of a dead animal
    const a = animalAt(px, py, a => a.dead && !a.toRemove, 1.2);
    if (a) { player.task = { type: "meat", a }; walkTo(idxAt(a.x, a.y)); player.task = { type: "meat", a }; return true; }
  }
  if (inHand() === "axe" && treeAt(cell)) { walkTo(cell); player.task = { type: "chop", i: cell }; return true; }
  const h = objs(cell).find(o => FIRE_TYPES.includes(o.type));         // campfire or bonfire: feed it
  if (h) { walkTo(cell); player.task = { type: "stoke", o: h }; return true; }
  return false;
}
function finishTask() {                            // on arrival: chop, cut meat or stoke the bonfire
  const t = player.task; player.task = null;
  if (!t) return;
  if (t.type === "chop" && (player.i === t.i || world.neighbors[player.i]?.includes(t.i))) chop(t.i);
  if (t.type === "meat" && !t.a.toRemove && Math.hypot(...wrapDelta(t.a.x - player.x, t.a.y - player.y)) < 1.6 * SQ3) cutMeat(t.a);
  if (t.type === "stoke" && (player.i === t.o.i || world.neighbors[player.i]?.includes(t.o.i))) stoke(t.o);
  const close = t.a && !t.a.toRemove && Math.hypot(...wrapDelta(t.a.x - player.x, t.a.y - player.y)) < 1.6 * SQ3;
  if (t.type === "finishOff" || t.type === "takeAlive") {
    if (!close || !stunned(t.a)) notify("It woke up and got away!");
    else if (t.type === "finishOff") killWithKnife(t.a); else takeAlive(t.a);
  }
  if (t.type === "grab") { if (close) grab(t.a); else notify(SAY.gotAway); }
  const atPlace = i => player.i === i || world.neighbors[player.i]?.includes(i);
  if (t.type === "openChest" && atPlace(t.o.i)) openChest(t.o);
  if (t.type === "placeChest" && atPlace(t.i)) work("build", BUILDS.chest.dur, () => placeChest(t.i), { recipe: "chest", at: t.i });
  if (t.type === "openCage" && atPlace(t.o.i)) work("gather", 0.4, () => openCage(t.o));
  if (t.type === "bait" && atPlace(t.o.i)) work("gather", 0.5, () => { if (bait(t.o)) notify("The trap is baited"); });
  if (t.type === "pickUpTrap" && atPlace(t.o.i)) work("gather", 1, () => pickUpTrap(t.o));
  if (t.type === "place" && atPlace(t.i)) work("build", t.what === "cage" ? 2.5 : 1.5, () => place(t.what, t.i), { recipe: t.what, at: t.i });
  if (t.type === "plantSapling" && atPlace(t.i)) work("gather", 1.5, () => plantSapling(t.what, t.i));
  if (t.type === "drop" && (atPlace(t.i) || player.i === t.i)) work("gather", 0.5, () => dropHand(t.what, t.i));
  if (t.type === "sow" && atPlace(t.i)) work("gather", 1, () => sow(t.what, t.i));
  if (t.type === "dig" && atPlace(t.i)) work("gather", 2, () => dig(t.i));
  if (t.type === "mine" && t.y.cells.some(atPlace)) work("chop", 3, () => mine(t.y), { currentTool: "pickaxe" });
  if (t.type === "fill") work("gather", 1, fillJar);
  if (t.type === "buildHouseTask" && t.h.cells.some(c => world.neighbors[player.i]?.includes(c))) work("build", BUILDS.house.dur, () => buildHouse(t.i), { recipe: "house" });
  if (t.type === "posts" && t.cells.some(atPlace)) work("build", BUILDS[t.what].dur * t.cells.length, () => plantPosts(t.cells, t.what), { recipe: t.what, at: t.cells[t.cells.length - 1] });
  if (t.type === "placeFire" && atPlace(t.i)) work("build", BUILD_DURATION[t.what], () => lightFireAt(t.what, t.i), { recipe: t.what, at: t.i });
  if (t.type === "enter" && adjacent(t.o)) work("gather", 0.4, () => enterHouse(t.o));
  if (t.type === "dismantle" && (t.o.type === "house" ? adjacent(t.o) : (atPlace(t.o.i) || player.i === t.o.i))) work("chop", DISMANTLE_DURATION[t.o.type], () => dismantle(t.o));
  if (t.type === "release" && (atPlace(t.i) || player.i === t.i)) work("gather", 0.5, () => releaseAnimal(t.what, t.i));
}
