// =====================================================================================
//  MINIMAP: the whole world seen from above, with the area you are looking at
// =====================================================================================
const mini = $("mini"), mctx = mini.getContext("2d");
const base = document.createElement("canvas"), bctx = base.getContext("2d");
let MINI = 500;                                      // width of the unfolded map (px): adapts to the available space
function mapSize() { return Math.round(Math.max(220, Math.min(560, (canvas.clientHeight * 0.9 - 90) / 0.92, canvas.clientWidth * 0.8 - 90))); }
(function burntEdges() {                         // irregular outline of the parchment (like burnt paper)
  const pts = [], n = 36, r = (a, b) => a + Math.random() * (b - a);
  for (let k = 0; k < n; k++) pts.push(`${(k / n * 100).toFixed(2)}% ${r(0, 2.6).toFixed(2)}%`);
  for (let k = 0; k < n; k++) pts.push(`${(100 - r(0, 2.2)).toFixed(2)}% ${(k / n * 100).toFixed(2)}%`);
  for (let k = 0; k < n; k++) pts.push(`${(100 - k / n * 100).toFixed(2)}% ${(100 - r(0, 2.6)).toFixed(2)}%`);
  for (let k = 0; k < n; k++) pts.push(`${r(0, 2.2).toFixed(2)}% ${(100 - k / n * 100).toFixed(2)}%`);
  document.getElementById("minimap").style.clipPath = `polygon(${pts.join(",")})`;
})();
function toggleMap() {
  const expanded = $("minimap").classList.toggle("visible");
  if (expanded && mapSize() !== MINI) { MINI = mapSize(); renderMinimapBase(); }   // repaints to the size of the screen
}
let mScale = 1;

function miniHex(i) {
  const [q, r] = world.cells[i], [cx, cy] = toPixel(q, r), [a, b, c] = world.colors[i];
  bctx.fillStyle = `rgb(${a},${b},${c})`;
  bctx.beginPath();
  CORNERS.forEach(([ex, ey], k) => k ? bctx.lineTo(cx + ex * 1.04, cy + ey * 1.04) : bctx.moveTo(cx + ex * 1.04, cy + ey * 1.04));
  bctx.fill();
}
function renderMinimapBase() {
  const dpr = window.devicePixelRatio || 1, N = world.N;
  mini.width = base.width = MINI * dpr; mini.height = base.height = MINI * 0.92 * dpr;
  mini.style.width = MINI + "px"; mini.style.height = MINI * 0.92 + "px";
  mScale = MINI * dpr / (SQ3 * CELL_R * (2 * N + 1) + 2);
  bctx.setTransform(mScale, 0, 0, mScale, base.width / 2, base.height / 2);
  bctx.clearRect(-1e4, -1e4, 2e4, 2e4);
  for (let i = 0; i < world.cells.length; i++) miniHex(i);
}
function drawMinimap() {
  const dpr = window.devicePixelRatio || 1;
  mctx.setTransform(1, 0, 0, 1, 0, 0);
  mctx.clearRect(0, 0, mini.width, mini.height);
  mctx.drawImage(base, 0, 0);
  const corners = [[0, Math.max(0, H * 0.12)], [W, Math.max(0, H * 0.12)], [W, H], [0, H]].map(p => unproject(...p)).filter(Boolean);
  mctx.save();
  mctx.setTransform(mScale, 0, 0, mScale, mini.width / 2, mini.height / 2);
  for (const [oq, or] of [[0, 0], ...world.mirrors]) {
    const [ox, oy] = toPixel(oq, or);
    mctx.beginPath();
    corners.forEach(([x, y], k) => k ? mctx.lineTo(x + ox, y + oy) : mctx.moveTo(x + ox, y + oy));
    mctx.closePath();
    mctx.fillStyle = "rgba(255,255,255,.18)"; mctx.fill();
    mctx.strokeStyle = "#fff"; mctx.lineWidth = 1.5 / mScale * dpr; mctx.stroke();
  }
  mctx.restore();
  mctx.save(); mctx.globalCompositeOperation = "destination-in"; mctx.drawImage(base, 0, 0); mctx.restore();
  if (player.i >= 0) {
    const [x, y] = toPixel(...world.cells[player.i]);
    mctx.setTransform(mScale, 0, 0, mScale, mini.width / 2, mini.height / 2);
    mctx.beginPath(); mctx.arc(x, y, 4 * dpr / mScale, 0, TAU);
    mctx.fillStyle = "#e5534b"; mctx.fill(); mctx.lineWidth = 1.5 * dpr / mScale; mctx.strokeStyle = "#fff"; mctx.stroke();
  }
}
mini.addEventListener("click", e => {
  const b = mini.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cam.tx = ((e.clientX - b.left) * dpr - mini.width / 2) / mScale;
  cam.ty = ((e.clientY - b.top) * dpr - mini.height / 2) / mScale;
  $("follow").checked = false; normalizeCamera();
});
