// Armadillos: Small mammal hidden in forests; its armor makes it twice as hard to catch.
defineFauna({
  id: "armadillo",
  name: { one: "Armadillo", many: "Armadillos" },
  tags: ["huntable", "stunnable", "catchable", "smallMammal", "smallPrey"],
  live: { icon: "🦔", name: "Live armadillo" },
  ...SMALL_MAMMAL, speed: 1.1, walk: 0.75,
  defense: 0.5,                                     // the armor: twice as hard to catch
  draw(it) { small(it, { torso: "#9b8a70", dark: "#5c5040", head: "#8a7a62", len: 0.15, tall: 0.12, legs: 0.045,
    tail: (x, y, s, scl, tall) => {                // pointed tail
      ctx.fillStyle = "#7d6e57"; ctx.beginPath();
      ctx.moveTo(x, y - tall * 0.03); ctx.lineTo(x - s * scl * 0.14, y + tall * 0.04); ctx.lineTo(x, y + tall * 0.04); ctx.closePath(); ctx.fill();
    },
    shell: (ring, scl) => {                       // armor bands across the back
      ctx.strokeStyle = "rgba(60,48,32,.6)"; ctx.lineWidth = Math.max(1, scl * 0.012);
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ring(k * 0.3, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke(); }
    },
    face: (hx, hy, s, scl) => { ctx.fillStyle = "#8a7a62"; ctx.beginPath();
      ctx.moveTo(hx, hy - scl * 0.025); ctx.lineTo(hx + s * scl * 0.09, hy + scl * 0.02); ctx.lineTo(hx, hy + scl * 0.03); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx - s * scl * 0.01, hy - scl * 0.045, scl * 0.012, scl * 0.025, 0, 0, TAU); ctx.fill(); } }); },
});
