// =====================================================================================
//  HEX GEOMETRY (axial coordinates q,r · "pointy-top" hexagons of radius CELL_R world units)
//  World units are fixed: SQ3 world units is the "reference cell" spacing used by every species speed,
//  distance and drawing. The grid is CELL_SCALE times finer, so a cell holds a single element.
// =====================================================================================
const SQ3 = Math.sqrt(3), TAU = Math.PI * 2;
const CELL_SCALE = 2.5, CELL_R = 1 / CELL_SCALE, CELL_AREA = CELL_SCALE * CELL_SCALE;   // cells per reference cell (side, area)
const cellsFor = n => Math.round(n * CELL_SCALE);     // a distance in reference cells → grid steps
const DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];   // neighbor i shares edge i
const CORNERS = [...Array(6)].map((_, i) => {
  const a = Math.PI / 180 * (60 * i - 30);
  return [Math.cos(a) * CELL_R, Math.sin(a) * CELL_R];
});
const dist = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
const toPixel = (q, r) => [SQ3 * (q + r / 2) * CELL_R, 1.5 * r * CELL_R];
function toHex(x, y) {
  x *= CELL_SCALE; y *= CELL_SCALE;
  let qf = SQ3 / 3 * x - y / 3, rf = 2 / 3 * y, sf = -qf - rf;
  let q = Math.round(qf), r = Math.round(rf), s = Math.round(sf);
  const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
  return [q, r];
}
