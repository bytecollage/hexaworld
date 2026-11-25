// Render test scene (dev tool): a frozen world with animals facing 8 directions, fallen trees and a house,
// seen with the camera turn given in the URL (?rot=45&tilt=55&zoom=70). Used by tools/gallery.sh.
addEventListener("load", () => setTimeout(() => {
  const q = new URLSearchParams(location.search);
  updateAnimals = () => {}; lifeCycle = () => {}; updateTrees = () => {}; updateCharacter = () => {};   // freeze everything
  world.testMap = true; world.N = TEST_RADIUS; world.seed = 7; generate();
  const c = player.i, [cx, cy] = toPixel(...world.cells[c]);
  for (let i = 0; i < world.cells.length; i++) if (wrapDistance(i, c) <= 7) { clearCell(i); world.base[i] = "grass"; world.painted.delete(i); }
  recomputeDistances();
  world.animals = [];
  const ring = (type, r, phase) => { for (let k = 0; k < 8; k++) {
    const ang = k * Math.PI / 4, x = cx + Math.cos(ang) * r * SQ3, y = cy + Math.sin(ang) * r * SQ3;
    const a = createAnimal(type, x, y, { dir: ang + Math.PI / 2, moving: true, born: gameDay() - 100, phase });
    a.tx = x + Math.cos(a.dir) * 5; a.ty = y + Math.sin(a.dir) * 5;   // heading: tangent to the ring (counterclockwise)
  } };
  if (q.get("set") === "2") {                                         // big animals, birds, cage and trap
    ring("deer", 1.6, 0.4); ring("jaguar", 3.0, 1.3);
    for (let k = 0; k < 4; k++) {
      const ang = k * Math.PI / 2;
      createAnimal("heron", cx + 4.6 * SQ3 * Math.cos(ang + 0.4), cy + 4.6 * SQ3 * Math.sin(ang + 0.4), { dir: ang, moving: false });
      createAnimal("eagle", cx + 1.2 * SQ3 * Math.cos(ang), cy + 1.2 * SQ3 * Math.sin(ang), { dir: ang + Math.PI / 2, moving: true, alt: 1 });
    }
    createAnimal("parrot", cx, cy, { dir: 0.7, moving: false, alt: 0 });
  } else { ring("coati", 1.4, 0.3); ring("fox", 2.6, 1.1); }
  if (q.get("set") !== "3") for (const [dq, dr] of [[4, -1], [-4, 2], [1, 3]]) {                // fallen pines (each falls toward its own side)
    const i = idx(world.cells[c][0] + dq, world.cells[c][1] + dr), o = addObject(i, "pine", { adultSince: -100, lastDrop: -1, born: -200, bornAt: -200, life: 999 });
    if (o) { o.fellAt = gameDay() - 1; world.trees.push(o); }
  }
  for (const t of ["branches", "stones", "grass", "rope", "tannedHide"]) store(t, 60); store("cage", 1); store("trap", 1);
  if (q.get("set") !== "3") buildHouse(idx(world.cells[c][0] - 1, world.cells[c][1] - 4));
  if (q.get("set") === "3") {                                         // seedlings: fruit, pine cone and coconut just sown, and older sprouts
    for (const [type, dq, dr, age] of [["fruitTree", 1, 0, 0.05], ["pine", 0, 1, 0.3], ["palm", -1, 1, 0.45], ["fruitTree", 1, -1, 0.7], ["pine", -1, 0, 0.9]]) {
      const i = idx(world.cells[c][0] + dq, world.cells[c][1] + dr), o = addObject(i, type, { adultSince: Infinity, lastDrop: -1, born: gameDay() - age, bornAt: gameDay() - age, life: 999 });
      if (o) { o.ox = o.oy = 0; world.trees.push(o); }
    }
  }
  if (q.get("set") === "2") {                                         // a cage with animals and a trap with prey
    for (const [type, dq, dr] of [["cage", 3, 3], ["trap", -2, 3]]) { player.x = cx; player.y = cy; place(type, idx(world.cells[c][0] + dq, world.cells[c][1] + dr)); }
    const cg = world.cages[0]; if (cg) { cg.animals.push({ type: "coati" }, { type: "rabbit" }); cg.water = 3; }
    const tp = world.traps[0]; if (tp) tp.prey = { type: "raccoon" };
  }
  player.x = cx + 99; player.i = -1;                                    // character out of the way
  $("follow").checked = false;
  cam.tx = cx; cam.ty = cy - 1; cam.rot = +(q.get("rot") || 0); cam.tilt = +(q.get("tilt") || 55); cam.zoom = +(q.get("zoom") || 60);
  const focus = q.get("focus") && objs(world.cells.findIndex((_, i) => objs(i).some(o => o.type === q.get("focus")))).find(o => o.type === q.get("focus"));
  if (focus) { const [fx, fy] = toPixel(...world.cells[focus.i]); cam.tx = fx + focus.ox; cam.ty = fy + focus.oy; cam.zoom = 260; }   // close-up (?focus=cage)
  if (q.get("set") === "3") { cam.tx = cx; cam.ty = cy; cam.zoom = +(q.get("zoom") || 220); world.animals = []; }   // close-up of the seedlings
  document.title = "GALLERY_READY";
}, 50));
