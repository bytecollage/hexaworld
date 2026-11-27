// Dev script injected by capture.sh into a copy of index.html: draws each animal, plant and world feature alone with the
// game's own DRAW (everything else hidden), crops it with a little of its ground and writes, into <pre id="out">:
//   draw: { id: webp data URL }   map drawings
//   icon / emoji: { id: svg | emoji } the inventory and workshop icons (RECIPE_ICON, ICONS)
//   miss: [ids] drawings that came out empty
// Worlds use fixed seeds, so the pictures only change when a drawing changes.
addEventListener("load", () => setTimeout(async () => {
  await booted;
  updateAnimals = () => {}; lifeCycle = () => {}; updateTrees = () => {}; updateCharacter = () => {};
  const ORIG = { ...DRAW }, out = { draw: {}, icon: {}, emoji: {} };
  for (const seed of [1, 2, 3, 4, 5, 6]) {           // fixed worlds, so the pictures are always the same; later seeds fill what earlier ones lack
    world.testMap = false; world.N = 100; world.seed = seed; generate();
  clock.t = 0.2; player.i = -1;
  performance.now = () => 1000;                         // a fixed instant: the same gusts and sways on every run

  const snap = () => { draw(); return ctx.getImageData(0, 0, canvas.width, canvas.height).data; };
  function shoot(id, x, y, zoom, only, target) {
    const mine = it => !target || it.o === target || it.a === target || it.outcropAt === target;
    Object.assign(cam, { tx: x, ty: y - 0.2, rot: 0, tilt: 55, zoom });
    frameWind = { dir: 0, strength: 0 };                 // no wind: trees and grass stand straight
    for (const k in DRAW) DRAW[k] = k === only ? (it => mine(it) && ORIG[k](it)) : () => {};
    const A = snap(); for (const k in DRAW) DRAW[k] = () => {}; const B = snap();
    Object.assign(DRAW, ORIG);
    const w = canvas.width, h = canvas.height; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let yy = 0; yy < h; yy += 1) for (let xx = 0; xx < w; xx += 1) { const p = (yy * w + xx) * 4;
      if (Math.abs(A[p] - B[p]) + Math.abs(A[p + 1] - B[p + 1]) + Math.abs(A[p + 2] - B[p + 2]) > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } }
    if (x1 < 0) { out.miss = (out.miss || []).concat(id); return; }
    const side = Math.max(x1 - x0, y1 - y0) * 1.15 + 6, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    draw();   // the element with everything else hidden, then crop it with a little of its ground
    for (const k in DRAW) DRAW[k] = k === only ? (it => mine(it) && ORIG[k](it)) : () => {}; draw(); Object.assign(DRAW, ORIG);
    const c = document.createElement("canvas"); c.width = c.height = 112;
    c.getContext("2d").drawImage(canvas, cx - side / 2, cy - side / 2, side, side, 0, 0, 112, 112);
    out.draw[id] = c.toDataURL("image/webp", 0.88);
  }
  const ZOOM = { pine: 150, fruitTree: 150, palm: 105, monolith: 110, rockMound: 140, whale: 90, school: 160, beehive: 260, parrot: 260, eagle: 200, gull: 220, vulture: 200 };
  for (const t of Object.keys(SPECIES)) {
    const a = world.animals.find(a => a.type === t && !a.dead) || world.animals.find(a => a.type === t); if (!a) continue;
    a.inShelter = false; a.dead = false; if (SPECIES[t].flies) { a.alt = 0.25; a.moving = true; a.phase = 0.6; } if (t === "beehive") clock.day = 16; if (!out.draw[t]) shoot(t, a.x, a.y, ZOOM[t] || 220, t, a); clock.day = 1;   // the beehive in winter: no bees around it
  }
  const dead = world.animals.find(a => a.type === "deer"); if (dead && !out.draw.carcass) { dead.dead = true; dead.deadAt = gameDay(); shoot("carcass", dead.x, dead.y, 200, "deer", dead); dead.dead = false; }
  const types = [...Object.keys(DEF)].filter(t => !SPECIES[t]);
  for (const t of types) {
    if (out.draw[t]) continue;
    let found = null;
    for (let i = 0; i < world.cells.length && !found; i++) { const o = objs(i).find(o => o.type === t && !o.fellAt && (!o.adultSince || o.adultSince <= gameDay())); if (o) found = [i, o]; }
    if (!found && t === "nest") { const tu = world.animals.find(a => a.type === "turtle"); for (const j of [idxAt(tu.x, tu.y), ...world.neighbors[idxAt(tu.x, tu.y)]]) { const o = addObject(j, "nest"); if (o) { found = [j, o]; break; } } }
    if (!found) { const y = world.outcrops?.find(y => y.type === t); if (y) { const [x, yy] = toPixel(...world.cells[y.anchor]); shoot(t, x + y.ox, yy + y.oy, ZOOM[t] || 200, t, y); } continue; }
    if (!found) continue;
    const [i, o] = found, [x, y] = toPixel(...world.cells[i]);
    shoot(t, x + (o.ox || 0), y + (o.oy || 0), ZOOM[t] || 200, t, o);
  }
  }
  for (const [k, v] of Object.entries(RECIPE_ICON)) if (typeof v === "string") (v.startsWith("<svg") ? out.icon : out.emoji)[k] = v;
  for (const [k, v] of Object.entries(ICONS)) if (typeof v === "string" && !out.icon[k]) (v.startsWith("<svg") ? out.icon : out.emoji)[k] = v;
  const pre = document.createElement("pre"); pre.id = "out"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  document.title = "CAPTURE_READY";
}, 50));
