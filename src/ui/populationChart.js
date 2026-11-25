// ---- Population chart (P key)
const SAMPLE_INTERVAL = 0.25;                         // game days between samples
function samplePopulation(force = false) {
  const h = world.history;
  if (!force && gameDay() < h.next) return;
  h.next = gameDay() + SAMPLE_INTERVAL;
  const c = {};
  for (const a of world.animals) if (!a.dead && !a.toRemove) c[a.type] = (c[a.type] || 0) + 1;
  for (const l of world.objects) if (l) for (const o of l) if (o.fellAt === undefined) c["_" + o.type] = (c["_" + o.type] || 0) + 1;
  h.t.push(gameDay());
  for (const [k] of POPULATION_SERIES) (h.s[k] ||= []).push(c[k] || 0);
  if (h.t.length > 3000) {                              // long history: keeps one of every two samples
    h.t = h.t.filter((_, i) => i % 2 === 0);
    for (const k in h.s) h.s[k] = h.s[k].filter((_, i) => i % 2 === 0);
  }
  if ($("population").classList.contains("visible")) drawPopulation();
}
function resetHistory() { world.history = { t: [], s: {}, next: 0 }; }
let populationCursor = null;                             // sample index under the mouse
function drawPopulation() {
  const cv = $("populationChart"), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const h = world.history, n = h.t.length, COLS = 5, ROWS = 6, cw = W / COLS, ch = H / ROWS;
  const idx = populationCursor ?? n - 1;
  $("populationDay").textContent = n ? `Day ${Math.floor(h.t[Math.max(0, idx)]) + 1}${populationCursor !== null ? "" : " (now)"} · ${n} samples` : "";
  POPULATION_SERIES.forEach(([k, name], s) => {
    const x0 = (s % COLS) * cw + 10, y0 = Math.floor(s / COLS) * ch + 6, w = cw - 20, tall = ch - 34;
    const info = h.s[k] || [], max = Math.max(1, ...info), v = info[Math.max(0, idx)] ?? 0;
    g.fillStyle = "#8b949e"; g.font = "11px system-ui, sans-serif"; g.textAlign = "left"; g.fillText(name, x0, y0 + 11);
    g.fillStyle = "#e6e8eb"; g.font = "600 12px system-ui, sans-serif"; g.textAlign = "right"; g.fillText(String(v), x0 + w, y0 + 11);
    const py = y0 + 18;
    g.strokeStyle = "#2d343d"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, py + tall + 0.5); g.lineTo(x0 + w, py + tall + 0.5); g.stroke();   // base
    g.fillStyle = "#5c6672"; g.font = "9px system-ui, sans-serif"; g.textAlign = "left"; g.fillText(String(max), x0, py + 7);
    if (n > 1) {
      g.strokeStyle = "#7fb3e6"; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath();
      info.forEach((d, i) => { const x = x0 + i / (n - 1) * w, y = py + tall - d / max * (tall - 8); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
      if (populationCursor !== null) {
        const x = x0 + idx / (n - 1) * w;
        g.strokeStyle = "rgba(227,179,65,.7)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, py); g.lineTo(x, py + tall); g.stroke();
        g.fillStyle = "#e3b341"; g.beginPath(); g.arc(x, py + tall - v / max * (tall - 8), 3, 0, TAU); g.fill();
      }
    }
  });
}
