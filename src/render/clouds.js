// =====================================================================================
//  CLOUDS: zooming out past ZOOM_MIN the view fills with clouds (fully at ZOOM_CLOUDS); when the zoom control is
//  released the camera comes back to ZOOM_MIN by itself in one second. Far views cost too much to draw.
// =====================================================================================
const ZOOM_CLOUDS = 20;                              // hard limit: only clouds are seen here
const ZOOM_BACK_DELAY = 250, ZOOM_BACK_TIME = 1000;   // ms without zoom input before coming back; ms it takes
const CLOUD_GRID = 14, CLOUD_HEIGHT = 14;            // world units between clouds; height above the ground
let lastZoomInput = 0, zoomBack = null, cloudSprite = null;
const cloudCover = () => Math.min(1, Math.max(0, (ZOOM_MIN - cam.zoom) / (ZOOM_MIN - ZOOM_CLOUDS)));   // 0 clear … 1 only clouds
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function zoomInput() { lastZoomInput = performance.now(); zoomBack = null; }   // wheel or +/- keys
function updateZoomReturn() {                       // every frame: below ZOOM_MIN and released → ease back to ZOOM_MIN
  if (cam.zoom >= ZOOM_MIN) { zoomBack = null; return; }
  const now = performance.now();
  if (now - lastZoomInput < ZOOM_BACK_DELAY) return;
  zoomBack ||= { from: cam.zoom, t0: now };
  const k = Math.min(1, (now - zoomBack.t0) / ZOOM_BACK_TIME);
  cam.zoom = k >= 1 ? ZOOM_MIN : zoomBack.from + (ZOOM_MIN - zoomBack.from) * smooth(0, 1, k);
  if (k >= 1) zoomBack = null;
}
function makeCloudSprite() {                         // one puffy cloud, drawn once
  const c = document.createElement("canvas"); c.width = 256; c.height = 140;
  const g = c.getContext("2d");
  for (const [x, y, r] of [[45, 100, 30], [70, 85, 45], [105, 95, 40], [120, 65, 55], [150, 98, 42], [175, 80, 48], [205, 95, 32]]) {
    const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.72, "rgba(244,247,250,.97)"); gr.addColorStop(0.9, "rgba(226,232,238,.6)"); gr.addColorStop(1, "rgba(220,226,232,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  return c;
}
function drawClouds() {                              // clouds anchored in the world, high up, drifting slowly
  const cover = cloudCover(); if (cover <= 0) return;
  cloudSprite ||= makeCloudSprite();
  const G = CLOUD_GRID, R = Math.min(3 * Math.max(W, H) / cam.zoom, 120) + CLOUD_HEIGHT * 2, drift = performance.now() / 1000 * 0.4;
  const list = [];
  for (let gx = Math.floor((cam.tx - R - drift) / G); gx <= Math.ceil((cam.tx + R - drift) / G); gx++)
    for (let gy = Math.floor((cam.ty - R) / G); gy <= Math.ceil((cam.ty + R) / G); gy++) {
      const id = (gx * 7919 + gy * 104729) | 0, h = hash(id, 901);
      const a = Math.min(1, (cover * 1.6 - h) * 4);    // each cloud appears at its own zoom: few at first, all near ZOOM_CLOUDS
      if (a <= 0) continue;
      const p = projectUp(gx * G + (hash(id, 902) - 0.5) * G * 0.8 + drift, gy * G + (hash(id, 903) - 0.5) * G * 0.8, CLOUD_HEIGHT);
      if (p) list.push([p, cam.zoom * p[2] * G * (0.9 + 0.7 * hash(id, 904)), a]);
    }
  list.sort((a, b) => a[0][1] - b[0][1]);
  const veil = smooth(0.7, 1, cover);                // toward ZOOM_CLOUDS nothing else is seen (a pale sky under the clouds)
  if (veil > 0) { ctx.fillStyle = `rgba(214,224,234,${veil})`; ctx.fillRect(0, 0, W, H); }
  ctx.save();
  for (const [p, w, a] of list) if (p[0] > -w && p[0] < W + w && p[1] > -w && p[1] < H + w) { ctx.globalAlpha = a; ctx.drawImage(cloudSprite, p[0] - w / 2, p[1] - w * 0.27, w, w * 0.55); }
  ctx.restore();
}
