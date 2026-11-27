// ---- Jobs: gathering, building, chopping, cutting meat… take their time (real seconds, the character is not sped up),
//      with animation and a progress bar. A click elsewhere or changing what is in the hand interrupts them.
const BUILD_DURATION = { basket: 6, rope: 2, sharpStone: 3, sharpBone: 3, tannedHide: 5, resin: 3, hammer: 3, torch: 2, knife: 3, campfire: 4, axe: 5, bonfire: 7, pickaxe: 5, shovel: 4, bow: 6, jar: 3, trap: 3, cage: 6 };
function work(type, dur, onDone, extra = {}) {
  if (player.dead) return;
  if ($("fast")?.checked) dur = 0;                // "Fast" option (testing): every job finishes on the next frame
  player.job = { type, dur, t: 0, start: performance.now(), onDone, ...extra };
}
function cancelWork(reason) { if (!player.job) return; player.job = null; if (reason) notify(reason); }
function updateWork(dt) {
  const w = player.job; if (!w) return;
  w.t = (performance.now() - w.start) / 1000;     // real time (does not depend on frames)
  if (w.t >= w.dur) { player.job = null; w.onDone(); if (player.repeat?.job === w.type && !player.job && !player.task) continueRepeat(); }
}
// ---- repeat (Ctrl+click): when one is done the character goes on to the nearest one within REPEAT_RADIUS cells of the
//      first (any standing tree for the axe; the same kind of plant or thing otherwise), until there are none left or
//      you give another order. Kinds: chopping (axe), digging up (shovel), cutting branches (knife), gathering (any hand).
const REPEAT_RADIUS = 5;                          // grid cells
const REPEATS = {
  axe:    { job: "chop",   matches: (r, i) => !!treeAt(i), room: r => hasRoom("branches"), none: "No more trees around here",
            say: "I will chop every tree around here (click elsewhere to stop me)", go: i => { walkTo(i); player.task = { type: "chop", i }; } },
  shovel: { job: "gather", matches: (r, i) => objs(i).some(o => o.type === r.type && diggable(o)), room: r => hasRoom("sapling_" + r.type), none: "No more of those around here",
            say: "I will dig up all of these around here (click elsewhere to stop me)", go: i => { walkTo(i); player.task = { type: "dig", i }; } },
  strip:  { job: "gather", matches: (r, i) => { const o = stripTarget(i); return !!o && o.type === r.type && stripRested(o); }, room: r => hasRoom("branches"), none: "No more branches to cut around here",
            say: "I will cut branches from all of these around here (click elsewhere to stop me)", go: i => goAndDo(approachOf([i]), { type: "strip", i }) },
  gather: { job: "gather", matches: (r, i) => objs(i).some(o => o.type === r.type && HARVESTABLE(o)), room: r => hasRoom(DEF[r.type]?.harvest?.gives ?? r.type), none: "Nothing more of that around here",
            say: "I will gather all of these around here (click elsewhere to stop me)", go: i => walkTo(i) },
};
function startRepeat(cell) {                       // after the click on `cell` gave an order: repeat it on the nearby ones
  const tool = inHand(), t = player.task;
  let kind = null, type = null;
  if (tool === "axe" && t?.type === "chop" && t.i === cell) kind = "axe";
  else if (tool === "shovel" && t?.type === "dig" && t.i === cell) { kind = "shovel"; type = objs(cell).find(diggable)?.type; }
  else if (t?.type === "strip" && t.i === cell) { kind = "strip"; type = stripTarget(cell)?.type; }
  else if (player.gather === cell) { kind = "gather"; type = objs(cell).find(HARVESTABLE)?.type; }
  if (!kind) return;
  player.repeat = { kind, tool, job: REPEATS[kind].job, origin: cell, type };
  notify(REPEATS[kind].say);
}
function continueRepeat() {
  const r = player.repeat, k = REPEATS[r.kind];
  if (inHand() !== r.tool) { player.repeat = null; return; }
  if (!k.room(r)) { player.repeat = null; notify("I cannot carry any more: I stop"); return; }
  const next = cellsAround(r.origin, REPEAT_RADIUS).filter(i => k.matches(r, i)).sort((a, b) => wrapDistance(a, player.i) - wrapDistance(b, player.i))[0];
  if (next === undefined) { player.repeat = null; notify(k.none); return; }
  k.go(next);
}
function craft(id) {                           // checks now; materials are spent when finished
  if (PLACED_FIRES.includes(id)) { chooseBuild(id); return; }   // fires: the next click chooses the cell
  const r = RECIPES.find(r => r.id === id);
  if (!canMake(r)) { notify(cannotMake(r)); return; }
  if (!r.container && amountOf(id) === 0 && !inventory.includes(null) && hand.item) { notify(SAY.full); return; }
  player.route = []; player.task = null;
  work("build", BUILD_DURATION[id], () => craftNow(id), { recipe: id });
}
function harvestAt(i) {
  const faster = o => inHand() === "knife" ? DEF[o.type].harvest.knife?.faster ?? 1 : 1;   // the knife cuts tall grass quicker
  const dur = objs(i).filter(HARVESTABLE).reduce((t, o) => t + (GATHER_DURATION[o.type] || 1) * faster(o), 0);
  if (dur > 0) work("gather", dur, () => harvestAtNow(i));
}
function chop(i) { const o = treeAt(i); if (o && !hasRoom("branches")) { notify("I have no room for the wood"); return; } if (o) work("chop", isAdult(o) ? 5 : 3, () => { if (!o.removed && o.fellAt === undefined) chopNow(i); }, { tree: o }); }
function cutMeat(a) { if (!hasRoom("meat")) { notify(SAY.full); return; } work("meat", MEAT[a.type] >= 3 ? 5 : 3, () => { if (!a.toRemove) cutMeatNow(a); }); }
function killWithKnife(a) { work("meat", 1.5, () => { if (a.toRemove) return; if (!stunned(a)) notify("It woke up and got away!"); else killWithKnifeNow(a); }); }
function takeAlive(a) { work("gather", 1.5, () => { if (a.toRemove) return; if (!stunned(a)) notify("It woke up and got away!"); else takeAliveNow(a); }); }
function grab(a) {
  work("gather", 1, () => {
    if (!a.toRemove && Math.hypot(...wrapDelta(a.x - player.x, a.y - player.y)) < 1.8 * SQ3) grabNow(a); else notify(SAY.gotAway);
  });
}
function stoke(o) {
  if (!fuelToThrow()) { notify(`I need something that burns (wood, grass…) for the ${o.type}`); return; }
  work("build", 2, () => stokeNow(o));
}
