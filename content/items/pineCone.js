// Pine cone: left by dead or chopped pines; rots after 5 days and may sprout. Drawn lying on the ground.
defineItem({
  id: "pineCone",
  name: "Pine cones",
  groundName: "Pine cones",
  fuel: 0.06,                                       // days of fire it adds when thrown on a fire (resinous)
  layer: "low",
  movedByHouse: true,
  harvest: { gives: "pineCone", time: 0.5, amount: () => 1, remove: true },
  useWith: { torch: { take: 2, gives: "resin", amount: 1, time: 2 } },   // Ctrl+click with the torch in the hand: melted into resin
  sprouts: { plant: "pine", ground: "grass", chance: 1 },
  draw(it) {                       // a pine cone lying on the ground: a tapering body covered in a diagonal lattice of woody scales
    const p = it.p, scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
    const d = hash(it.i, 230) * TAU - cam.rot * Math.PI / 180, L = scl * 0.34, Wm = scl * 0.12;   // it lies toward its own direction
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.17, 0.08, hash(it.i, 230) * TAU); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill();
    ctx.save(); ctx.translate(p[0], p[1] - tall * 0.05); ctx.rotate(d); ctx.scale(1, Math.max(0.7, tall / scl));
    const w = t => Wm * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * t)), 0.75) + Wm * 0.12;   // t: 0 stem … 1 tip; widest near the stem third
    const body = () => {
      ctx.beginPath();
      for (let k = 0; k <= 16; k++) { const t = k / 16, x = -L / 2 + t * L; k ? ctx.lineTo(x, -w(t)) : ctx.moveTo(x, -w(t)); }
      for (let k = 16; k >= 0; k--) { const t = k / 16; ctx.lineTo(-L / 2 + t * L, w(t)); }
      ctx.closePath();
    };
    ctx.fillStyle = "#4a2a14"; ctx.fillRect(-L / 2 - scl * 0.05, -scl * 0.012, scl * 0.06, scl * 0.024);   // the stem
    body(); ctx.fillStyle = "#5a3418"; ctx.fill();
    ctx.save(); body(); ctx.clip();
    const COLS = 6, ROWS = 4, sw = L / COLS, lw = Math.max(0.5, scl * 0.005);
    for (let c = COLS; c >= -1; c--) for (let r = -1; r <= ROWS; r++) {   // from the tip back: scales nearer the stem overlap
      const x = -L / 2 + (c + 0.5) * sw, t = (c + 0.5) / COLS, half = w(Math.min(1, Math.max(0, t)));
      const y = -half + (r + (c % 2 ? 0.5 : 0)) * (2 * half / ROWS), sh = half / ROWS * 1.15;
      ctx.beginPath(); ctx.moveTo(x + sw * 0.55, y - sh); ctx.quadraticCurveTo(x - sw * 0.9, y, x + sw * 0.55, y + sh);   // a scale whose rounded lip faces the stem
      ctx.quadraticCurveTo(x + sw * 0.2, y, x + sw * 0.55, y - sh);
      ctx.fillStyle = (c + r) % 3 ? "#b0703c" : "#9c6032"; ctx.fill(); ctx.strokeStyle = "#5a3418"; ctx.lineWidth = lw; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - sw * 0.05, y - sh * 0.45); ctx.quadraticCurveTo(x - sw * 0.35, y, x - sw * 0.05, y + sh * 0.45);
      ctx.strokeStyle = "#f0c890"; ctx.lineWidth = lw * 2.2; ctx.stroke();                                       // the pale tip
    }
    ctx.restore();
    body(); ctx.strokeStyle = "#4a2a14"; ctx.lineWidth = Math.max(0.6, scl * 0.006); ctx.stroke();
    ctx.restore();
  },


});
