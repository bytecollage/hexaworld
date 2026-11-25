// ---- darkness at night and light from fires
const nightLayer = document.createElement("canvas"), cnx = nightLayer.getContext("2d");
function darkness() {                                // 0 by day … 0.8 in the middle of the night
  const e = season(), t = clock.t, dayEnd = e.day, duskEnd = e.day + e.dusk;
  if (t < 0.04) return 0.45 * (1 - t / 0.04);                                // dawn
  if (t < dayEnd) return 0;
  if (t < duskEnd) return 0.6 * (t - dayEnd) / (duskEnd - dayEnd);          // dusk
  if (t > 0.97) return 0.8 - 0.35 * (t - 0.97) / 0.03;                        // it gets lighter
  return Math.min(0.8, 0.6 + 0.2 * (t - duskEnd) / 0.05);
}
function drawFlyingAxe() {                     // the axe spinning to the animal (and back to the hand)
  const h = world.flyingAxe; if (!h) return;
  h.start ??= performance.now();
  const u = (performance.now() - h.start) / 350;
  if (u >= 1) { world.flyingAxe = null; return; }
  const [cx, cy] = nearCamera(h.x + (h.tx - h.x) * u, h.y + (h.ty - h.y) * u), p = project(cx, cy);
  if (!p) return;
  const scl = cam.zoom * p[2];
  if (h.straight) {                                      // arrow: flies straight, pointing at its destination
    const q0 = project(...nearCamera(h.x, h.y)), q1 = project(...nearCamera(h.tx, h.ty));
    if (!q0 || !q1) return;
    const ang = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]), L = scl * 0.35;
    ctx.save(); ctx.translate(p[0], p[1] - scl * 0.4); ctx.rotate(ang);
    ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = Math.max(1.5, scl * 0.025); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.stroke();
    ctx.fillStyle = "#a7b0b8"; ctx.beginPath(); ctx.moveTo(L + scl * 0.07, 0); ctx.lineTo(L, -scl * 0.035); ctx.lineTo(L, scl * 0.035); ctx.closePath(); ctx.fill();
    ctx.restore(); return;
  }
  ctx.save(); ctx.translate(p[0], p[1] - scl * 0.6 * Math.sin(u * Math.PI)); ctx.rotate(u * TAU * 2);
  ctx.font = `${Math.max(12, scl * 0.45)}px "Apple Color Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(h.icon || "🪓", 0, 0); ctx.restore();
}
function drawDarkness() {
  world.lightsCache = activeLights();
  const os = darkness();
  if (os <= 0.01) return;
  const dpr = window.devicePixelRatio || 1;
  if (nightLayer.width !== canvas.width || nightLayer.height !== canvas.height) { nightLayer.width = canvas.width; nightLayer.height = canvas.height; }
  cnx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cnx.globalCompositeOperation = "source-over";
  cnx.clearRect(0, 0, W, H);
  cnx.fillStyle = `rgba(8,12,32,${os})`; cnx.fillRect(0, 0, W, H);
  const ci = Math.cos(cam.tilt * Math.PI / 180), t = performance.now() / 1000;
  const lights = [...world.lightsCache];
  if (player.i >= 0 && !player.inside && !player.dead) lights.push([player.x, player.y, 1.1, 0]);    // without fire, the character barely sees around
  cnx.globalCompositeOperation = "destination-out";
  const glows = [];
  for (const [x, y, radius, prot, warm] of lights) {
    const [cx, cy] = nearCamera(x, y), p = project(cx, cy);
    if (!p) continue;
    const blink = prot ? 1 + Math.sin(t * 9 + x) * 0.03 + Math.sin(t * 23 + y) * 0.02 : 1;
    const r = radius * SQ3 * cam.zoom * p[2] * blink;
    cnx.save(); cnx.translate(p[0], p[1]); cnx.scale(1, Math.max(0.35, ci));
    const g = cnx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.55, "rgba(0,0,0,.85)"); g.addColorStop(1, "rgba(0,0,0,0)");
    cnx.fillStyle = g; cnx.beginPath(); cnx.arc(0, 0, r, 0, TAU); cnx.fill(); cnx.restore();
    if (prot || warm) glows.push([p[0], p[1], r]);
  }
  ctx.drawImage(nightLayer, 0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = "lighter";  // warm glow of the fire
  for (const [x, y, r] of glows) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.8);
    g.addColorStop(0, `rgba(255,150,50,${0.22 * os})`); g.addColorStop(1, "rgba(255,120,30,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
