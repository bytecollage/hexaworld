// =====================================================================================
//  CAMERA: looks at a point on the ground, with turn, tilt, zoom and perspective
// =====================================================================================
const cam = { tx: 0, ty: 0, rot: 0, tilt: 55, zoom: 44, D: 1100 };
const ZOOM_MIN = 30, ZOOM_MAX = 120;               // resting limits; farther out than 30 the view costs too much to draw, so clouds cover it (clouds.js)
const canvas = $("view"), ctx = canvas.getContext("2d");
let W = 0, H = 0;

function project(x, y) {
  const c = Math.cos(cam.rot * Math.PI / 180), s = Math.sin(cam.rot * Math.PI / 180);
  const dx = x - cam.tx, dy = y - cam.ty;
  const X = (dx * c + dy * s) * cam.zoom, Y = (-dx * s + dy * c) * cam.zoom;
  const ci = Math.cos(cam.tilt * Math.PI / 180), si = Math.sin(cam.tilt * Math.PI / 180);
  const den = cam.D - Y * si;
  if (den < cam.D * 0.08) return null;
  const k = cam.D / den;
  return [W / 2 + X * k, H * 0.55 + Y * ci * k, k];
}
function unproject(sx, sy) {
  const ci = Math.cos(cam.tilt * Math.PI / 180), si = Math.sin(cam.tilt * Math.PI / 180);
  const u = sx - W / 2, v = sy - H * 0.55;
  const den = cam.D * ci + v * si;
  if (den <= cam.D * 0.02) return null;                 // above the horizon
  const Y = v * cam.D / den, k = cam.D / (cam.D - Y * si), X = u / k;
  const c = Math.cos(cam.rot * Math.PI / 180), s = Math.sin(cam.rot * Math.PI / 180);
  return [cam.tx + (X * c - Y * s) / cam.zoom, cam.ty + (X * s + Y * c) / cam.zoom];
}
function normalizeCamera() {        // keeps the target inside the original world (it is invisible: everything repeats)
  const [q, r] = toHex(cam.tx, cam.ty), [cq, cr] = canon(q, r);
  if (cq !== q || cr !== r) { const [ox, oy] = toPixel(q - cq, r - cr); cam.tx -= ox; cam.ty -= oy; }
}
// position of the copy of (x,y) closest to the camera
function nearCamera(x, y) { const [dx, dy] = wrapDelta(x - cam.tx, y - cam.ty); return [cam.tx + dx, cam.ty + dy]; }
