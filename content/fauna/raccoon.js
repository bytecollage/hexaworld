// Raccoons: Small mammal hidden in forests; eats fruit, berries and flowers.
defineFauna({
  id: "raccoon",
  name: { one: "Raccoon", many: "Raccoons" },
  tags: ["huntable", "stunnable", "catchable", "smallMammal", "smallPrey"],
  live: { icon: "🦝", name: "Live raccoon" },
  ...SMALL_MAMMAL, speed: 1.5, walk: 0.9,
  draw(it) { small(it, { torso: "#8b8a85", dark: "#4a4946", head: "#a5a49f", len: 0.14, tall: 0.13, legs: 0.09,
    tail: (x, y, s, scl, tall) => {                // bushy tail with black rings
      for (let k = 0; k < 4; k++) circle(x - s * scl * 0.05 * k, y + tall * 0.02 * k, scl * 0.045, k % 2 ? "#2d2c2a" : "#a5a49f");
    },
    face: (hx, hy, s, scl) => { ctx.fillStyle = "#1f1e1c";                 // black mask
      ctx.beginPath(); ctx.ellipse(hx + s * scl * 0.01, hy - scl * 0.005, scl * 0.055, scl * 0.022, 0, 0, TAU); ctx.fill();
      circle(hx + s * scl * 0.065, hy + scl * 0.015, scl * 0.015, "#1f1e1c"); } }); },
});
