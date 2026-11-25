// =====================================================================================
//  INTERACTION
// =====================================================================================
let currentTool = "move", spaceHeld = false, gesture = null, paintedFlag = false;

function cellAt(sx, sy) { const p = unproject(sx, sy); return p ? idxAt(p[0], p[1]) : -1; }   // the ground (terrain brushes)
const pickedCell = (sx, sy) => pickAt(sx, sy)?.cell ?? -1;                                     // what the pointer means (trees, animals…)
function paintAt(sx, sy) {
  const i = cellAt(sx, sy);
  if (i < 0 || i === undefined || terrain(i) === currentTool) return;
  world.painted.set(i, currentTool);
  clearCell(i);                                  // whatever was on top disappears
  if (world.outcropAt[i] >= 0) removeOutcrop(world.outcropAt[i]);
  world.colors[i] = colorOf(i);
  miniHex(i); paintedFlag = true;
}
function finishPainting() {                       // on release: recompute shores, colors and minimap
  if (!paintedFlag) return;
  paintedFlag = false;
  recomputeDistances(); renderMinimapBase(); world.forestComp = components(isGrove);
}
const pos = e => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };

canvas.addEventListener("pointerdown", e => {
  const [x, y] = pos(e);
  canvas.setPointerCapture(e.pointerId);
  if (e.button === 2) gesture = { type: "orbit", x, y, x0: x, y0: y, drag: false };   // drag: turn the camera; a plain click: drop
  else if (currentTool === "move" || spaceHeld || e.button === 1) gesture = { type: "move", x, y, x0: x, y0: y, drag: false };
  else { gesture = { type: "paint" }; paintAt(x, y); }
  if (gesture.type !== "paint") canvas.classList.add("dragging");
});
canvas.addEventListener("pointermove", e => {
  const [x, y] = pos(e);
  mouseWorld = unproject(x, y);
  if (currentTool === "move") { const pk = pickAt(x, y); if (pk?.what?.o) mouseWorld = toPixel(...world.cells[pk.cell]); }
  if (gesture?.type === "move") {
    if (!gesture.drag && Math.hypot(x - gesture.x0, y - gesture.y0) > 5) { gesture.drag = true; $("follow").checked = false; }
    if (gesture.drag) {
      const a = unproject(gesture.x, gesture.y), b = unproject(x, y);
      if (a && b) { cam.tx += a[0] - b[0]; cam.ty += a[1] - b[1]; normalizeCamera(); }
      gesture.x = x; gesture.y = y;
    }
  } else if (gesture?.type === "orbit") {
    if (!gesture.drag && Math.hypot(x - gesture.x0, y - gesture.y0) > 5) gesture.drag = true;
    cam.rot = ((cam.rot - (x - gesture.x) * 0.3 + 540) % 360) - 180;
    cam.tilt = Math.min(72, Math.max(0, cam.tilt + (y - gesture.y) * 0.25));
    gesture.x = x; gesture.y = y;
  } else if (gesture?.type === "paint") paintAt(x, y);

  hover = (currentTool === "move" ? pickedCell(x, y) : cellAt(x, y)) ?? -1;
});
const DOUBLE_CLICK_MS = 400, lastClick = { t: 0, cell: -1 };
const release = () => { gesture = null; canvas.classList.remove("dragging"); finishPainting(); };
canvas.addEventListener("pointerup", e => {
  if (gesture?.type === "move" && !gesture.drag && e.button === 0 && !spaceHeld) {
    const pk = pickAt(...pos(e)), p = pk && [pk.x, pk.y];
    if (p) {
      const [q, r] = toHex(p[0], p[1]), [cx, cy] = toPixel(q, r), cell = pk.cell ?? idx(q, r);
      const now = performance.now(), double = now - lastClick.t < DOUBLE_CLICK_MS && lastClick.cell === cell;
      lastClick.t = double ? 0 : now; lastClick.cell = cell;
      player.task = null; player.repeat = null;
      cancelWork(player.job ? "I stopped what I was doing" : null);
      if (player.inside && !player.sleeping && world.houseAt.get(cell) !== player.inside) leaveHouse();   // a click outside the house: go out
      if (openChestRef && cell !== openChestRef.i) closeChest();                                         // a click elsewhere closes the chest
      if (!player.dead && !player.sleeping && !player.inside && !clickAction(p[0], p[1], cell)) walkTo(cell, { dx: p[0] - cx, dy: p[1] - cy });   // with a tool: chop, hunt, cut…
      else if (double) startRepeat(cell);                // double click with the axe or the shovel: keep going on the nearby ones
    }
  }
  if (gesture?.type === "orbit" && !gesture.drag && e.button === 2) {   // right click without dragging: drop what is in the hand there
    const pk = pickAt(...pos(e));
    if (pk && hand.item && !player.dead && !player.sleeping && !player.inside) {
      const cell = pk.cell ?? idx(...toHex(pk.x, pk.y));
      player.task = null; player.repeat = null; cancelWork(player.job ? "I stopped what I was doing" : null);
      dropAction(cell);
    }
  }
  release();
});
canvas.addEventListener("pointercancel", release);
canvas.addEventListener("pointerleave", () => { hover = -1; });
canvas.addEventListener("contextmenu", e => e.preventDefault());
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const [x, y] = pos(e), before = unproject(x, y);
  cam.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_CLOUDS, cam.zoom * Math.exp(-e.deltaY * 0.0015))); zoomInput();
  const after = unproject(x, y);
  if (before && after) { cam.tx += before[0] - after[0]; cam.ty += before[1] - after[1]; normalizeCamera(); }
}, { passive: false });

function selectTool(h) {
  currentTool = h;
  for (const b of document.querySelectorAll("#tools .tool")) b.classList.toggle("active", b.dataset.tool === h);
  canvas.classList.toggle("painting", h !== "move");
}
$("tools").addEventListener("click", e => { const b = e.target.closest(".tool"); if (b) selectTool(b.dataset.tool); });
document.querySelector(".stepper").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  world.testMap = false;
  world.N = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, world.N + +b.dataset.delta));
  generate();
});
$("tilt").addEventListener("input", e => { cam.tilt = +e.target.value; });
$("rot").addEventListener("input", e => { cam.rot = +e.target.value; });
$("compass").onclick = () => { cam.rot = 0; };
$("mapButton").onclick = toggleMap;
$("restartGame").onclick = () => {                     // new game: new world, empty inventory and hand
  resetUpgrades(); hand.item = null; hand.torchLeft = 0; player.dead = false; closeCage();
  if (player.sleeping) wakeUp(); buildMode = null; player.inside = null; openChestRef = null; renderContainers();
  $("death").classList.remove("visible");
  world.seed = 1 + Math.floor(Math.random() * 1e9); generate(); renderInventory();
};
document.addEventListener("pointerdown", e => {          // a click anywhere outside the workshop folds its open menu
  if (workshopOpen && !e.target.closest?.("#workshop")) { workshopOpen = null; renderWorkshop(); }
}, true);
$("inventory").addEventListener("click", e => {          // slot → to the hand (swap); hand → to the inventory
  const r = e.target.closest(".slot"); if (!r) return;
  if (r.id === "basketButton") toggleBasket();
  else if (r.dataset.hand) storeHand(); else if (r.dataset.k !== undefined) swapSlot(+r.dataset.k);
});
$("cagePanel").addEventListener("click", e => {
  const j = openCageRef; if (!j) return;
  if (e.target.closest("[data-close]")) return closeCage();
  const s = e.target.closest("[data-take]"); if (s) return takeFromCage(j, +s.dataset.take);
  const b = e.target.closest("[data-action]"); if (!b || b.disabled) return;
  ({ putIn: putInCage, food: giveFood, water: giveWater, gather: pickUpCage })[b.dataset.action](j);
});
$("workshop").addEventListener("click", e => {
  const g = e.target.closest("[data-group]");
  if (g) { workshopOpen = workshopOpen === g.dataset.group ? null : g.dataset.group; renderWorkshop(); return; }
  const o = e.target.closest("[data-build]"); if (o) { chooseBuild(o.dataset.build); return; }
  const b = e.target.closest("[data-recipe]"); if (b) craft(b.dataset.recipe);
});
$("newWorld").onclick = () => {
  if (world.testMap) { world.testMap = false; world.N = RADIUS_MIN; }
  world.seed = 1 + Math.floor(Math.random() * 1e9); generate();
};
$("testMap").onclick = () => {
  world.testMap = true; world.N = TEST_RADIUS;
  world.seed = 1 + Math.floor(Math.random() * 1e9); generate();
  for (const t of TEST_RESOURCES) { const missing = 500 - amountOf(t); if (missing > 0) store(t, missing); }   // to test without gathering
  notify("Test map: I have 500 of each natural resource");
};
const TEST_RESOURCES = ["branches", "stones", "grass", "berries", "flowers", "fruit", "coconut", "pineCone", "hide", "bones"];
$("nextDay").onclick = skipToNextDay;
$("speedControl").addEventListener("click", e => {
  const b = e.target.closest("[data-speed]"); if (!b) return;
  clock.speed = +b.dataset.speed;
  for (const x of $("speedControl").querySelectorAll("[data-speed]")) x.classList.toggle("active", x === b);
});

function panScreen(dx, dy) {
  $("follow").checked = false;
  const a = unproject(W / 2, H * 0.55), b = unproject(W / 2 - dx, H * 0.55 - dy);
  if (a && b) { cam.tx += b[0] - a[0]; cam.ty += b[1] - a[1]; normalizeCamera(); }
}
// camera back on the character, and keep following it (C key and the target icon on the clock)
function locatePlayer() {
  if (player.i < 0) return;
  const [x, y] = nearCamera(player.x, player.y);
  cam.tx = x; cam.ty = y; normalizeCamera();
  $("follow").checked = true;
}
$("locateButton").onclick = locatePlayer;
// the population (P) and options (O) popups: one at a time; returns whether it is now open
function togglePopup(id) {
  const open = !$(id).classList.contains("visible");
  for (const p of ["population", "options"]) $(p).classList.toggle("visible", open && p === id);
  return open;
}
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" && e.target.type !== "checkbox") return;
  if (/^Digit\d$/.test(e.code)) {                         // 1-9 and 0: inventory slots; with Shift, terrain brushes
    const n = +e.code.slice(5);
    e.preventDefault();
    if (e.shiftKey) { const h = ["move", "deep", "medium", "water", "sand", "grass"][n]; if (h) selectTool(h); }
    else if (!player.dead) swapSlot((n + 9) % 10);
    return;
  }
  if (e.key === "Escape") { if (buildMode) chooseBuild(buildMode); closeCage(); closeContainers(); $("options").classList.remove("visible"); return; }
  const k = e.key.toLowerCase(), step = 60, toggleCheck = id => { $(id).checked = !$(id).checked; };
  const keyActions = {
    w: () => panScreen(0, -step), arrowup: () => panScreen(0, -step),
    s: () => panScreen(0, step), arrowdown: () => panScreen(0, step),
    a: () => panScreen(-step, 0), arrowleft: () => panScreen(-step, 0),
    d: () => panScreen(step, 0), arrowright: () => panScreen(step, 0),
    q: () => { cam.rot = ((cam.rot + 5 + 540) % 360) - 180; }, e: () => { cam.rot = ((cam.rot - 5 + 540) % 360) - 180; },
    r: () => { cam.tilt = Math.min(72, cam.tilt + 4); }, f: () => { cam.tilt = Math.max(0, cam.tilt - 4); },
    "+": () => { cam.zoom = Math.min(ZOOM_MAX, cam.zoom * 1.15); zoomInput(); }, "=": () => { cam.zoom = Math.min(ZOOM_MAX, cam.zoom * 1.15); zoomInput(); },
    "-": () => { cam.zoom = Math.max(ZOOM_CLOUDS, cam.zoom / 1.15); zoomInput(); },
    b: () => toggleCheck("edge"), c: () => locatePlayer(), v: () => toggleCheck("elements"),
    m: () => toggleMap(), o: () => togglePopup("options"),
    p: () => { if (togglePopup("population")) { populationCursor = null; drawPopulation(); } },
    " ": () => { spaceHeld = true; },
  };
  if (keyActions[k]) { e.preventDefault(); keyActions[k](); }
});
document.addEventListener("keyup", e => { if (e.key === " ") spaceHeld = false; });
window.addEventListener("resize", resizeCanvas);
$("populationChart").addEventListener("pointermove", e => {     // shared cursor: same day in every series
  const cv = e.currentTarget, b = cv.getBoundingClientRect(), cw = b.width / 5, n = world.history.t.length;
  const x = (e.clientX - b.left) % cw - 10, w = cw - 20;
  populationCursor = n > 1 ? Math.max(0, Math.min(n - 1, Math.round(x / w * (n - 1)))) : null;
  drawPopulation();
});
$("populationChart").addEventListener("pointerleave", () => { populationCursor = null; drawPopulation(); });
