// Opossums: Small mammal hidden in forests; eats fruit, berries and flowers.
defineFauna({
  id: "opossum",
  name: { one: "Opossum", many: "Opossums" },
  tags: ["huntable", "stunnable", "catchable", "smallMammal", "smallPrey"],
  live: { icon: "🐀", name: "Live opossum" },
  ...SMALL_MAMMAL, speed: 1.3, walk: 0.85,
  draw(it) { small(it, { torso: "#c9c4bb", dark: "#6e6a64", head: "#f1ede6", len: 0.14, tall: 0.11, legs: 0.08,
    tail: (x, y, s, scl, tall) => {                // bare, pink, curved tail
      ctx.strokeStyle = "#e8a8a8"; ctx.lineWidth = Math.max(1, scl * 0.022);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - s * scl * 0.2, y + tall * 0.02, x - s * scl * 0.17, y - tall * 0.12); ctx.stroke();
    },
    face: (hx, hy, s, scl) => { ctx.strokeStyle = "#f1ede6"; ctx.lineWidth = Math.max(1.5, scl * 0.04);
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + s * scl * 0.08, hy + scl * 0.02); ctx.stroke();
      circle(hx + s * scl * 0.085, hy + scl * 0.02, scl * 0.016, "#e88a9a"); } }); },
});
