// Coatis: Small mammal hidden in forests; eats fruit, berries and flowers.
defineFauna({
  id: "coati",
  name: { one: "Coati", many: "Coatis" },
  tags: ["huntable", "stunnable", "catchable", "smallMammal", "smallPrey"],
  live: { icon: "🦡", name: "Live coati" },
  ...SMALL_MAMMAL, speed: 1.7, walk: 1.0,
  draw(it) { small(it, { torso: "#9a6a3e", dark: "#5e3d20", head: "#8a5c34", len: 0.15, tall: 0.12, legs: 0.11,
    tail: (x, y, s, scl, tall) => {                // long tail, upright and ringed
      for (let k = 0; k < 6; k++) {
        ctx.strokeStyle = k % 2 ? "#3d2814" : "#b98a5a"; ctx.lineWidth = Math.max(1.5, scl * 0.045);
        ctx.beginPath(); ctx.moveTo(x - s * scl * 0.02 * k, y - tall * 0.07 * k); ctx.lineTo(x - s * scl * 0.02 * (k + 1), y - tall * 0.07 * (k + 1)); ctx.stroke();
      }
    },
    face: (hx, hy, s, scl) => { ctx.strokeStyle = "#6b4a2b"; ctx.lineWidth = Math.max(1.5, scl * 0.035);
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + s * scl * 0.1, hy + scl * 0.02); ctx.stroke(); } }); },
});
