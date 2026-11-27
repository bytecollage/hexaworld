// =====================================================================================
//  LIVE ANIMALS' ICONS: each catchable species is drawn once with its own map drawing (DRAW), so inventory slots, cages
//  and traps show the same animal as the map. Made at boot (under the loading screen) on the map canvas, cropped to the
//  animal and copied to a small canvas; slots use it as an image, cages and traps draw it.
// =====================================================================================
const ANIMAL_ICON = {};                                 // type -> { canvas, url }
function makeAnimalIcons() {
  const keep = { tx: cam.tx, ty: cam.ty, rot: cam.rot, tilt: cam.tilt, zoom: cam.zoom }, dpr = window.devicePixelRatio || 1, SIZE = 96;
  Object.assign(cam, { tx: 0, ty: 0, rot: 0, tilt: 40, zoom: 320 });
  for (const type of LIVE) {
    if (!DRAW[type]) continue;
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1;
    const p = project(0, 0), a = { type, x: 0, y: 0, dir: Math.PI * 0.12, phase: 0, moving: false, alt: 0, born: -1e4, sem: 3, life: 1e9 };
    try { DRAW[type]({ type, x: 0, y: 0, a, p, fog: 0, i: 0 }); } catch (e) { ctx.restore(); continue; }
    ctx.restore();
    // the animal's box: the solid pixels around it (the soft shadow is left out), made square with a margin
    const scl = cam.zoom * p[2], R = scl * 0.9, x0 = Math.max(0, Math.floor((p[0] - R) * dpr)), y0 = Math.max(0, Math.floor((p[1] - R * 1.3) * dpr));
    const w = Math.min(canvas.width - x0, Math.ceil(2 * R * dpr)), h = Math.min(canvas.height - y0, Math.ceil(1.8 * R * dpr));
    const px = ctx.getImageData(x0, y0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 140) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (maxX < 0) continue;
    const side = Math.max(maxX - minX, maxY - minY) * 1.12, cx = x0 + (minX + maxX) / 2, cy = y0 + (minY + maxY) / 2;
    const c = document.createElement("canvas"); c.width = c.height = SIZE;
    c.getContext("2d").drawImage(canvas, cx - side / 2, cy - side / 2, side, side, 0, 0, SIZE, SIZE);
    ANIMAL_ICON[type] = { canvas: c, url: c.toDataURL() };
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore();
  Object.assign(cam, keep);
}
const animalIconHTML = t => ANIMAL_ICON[t] ? `<img class="animalIcon" src="${ANIMAL_ICON[t].url}" alt="">` : null;
function drawAnimalIcon(t, x, y, size) {                // in the world (cages, traps): centered on (x, y)
  const ic = ANIMAL_ICON[t];
  if (ic) ctx.drawImage(ic.canvas, x - size / 2, y - size / 2, size, size);
  else { ctx.font = `${Math.max(9, size * 0.7)}px "Apple Color Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000"; ctx.fillText(ICONS[t], x, y); }
}

// ---- any item's inventory icon drawn in the world (piles on the ground): emoji as text, SVG icons as images made once
const ITEM_IMAGE = {};
function itemImage(t) {
  if (ITEM_IMAGE[t] !== undefined) return ITEM_IMAGE[t];
  const svg = RECIPE_ICON[t];
  if (typeof svg !== "string" || !svg.startsWith("<svg")) return (ITEM_IMAGE[t] = null);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.includes("xmlns") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
  return (ITEM_IMAGE[t] = img);
}
function drawItemIcon(t, x, y, size) {
  if (!t) return;
  if (ANIMAL_ICON[t]) { drawAnimalIcon(t, x, y, size); return; }
  const emoji = ICONS[t];
  if (emoji && !emoji.startsWith("<")) {
    ctx.font = `${Math.max(10, size * 0.8)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#000"; ctx.fillText(emoji, x, y); return;   // an opaque fill: color emoji take the alpha of the fill style
  }
  const img = itemImage(t);
  if (img?.complete && img.naturalWidth) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}
