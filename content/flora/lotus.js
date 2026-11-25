// Lotus flower: sits on a water lily leaf, lakes only.
defineFlora({
  id: "lotus",
  name: "Lotus flower",
  leaf: "waterLily",                                // drawn on top of a water lily leaf
  draw(it) {                       // pink flower on the leaf
    it.p = it.p || project(it.x, it.y); if (!it.p) return;
    const [scl, tall] = sizes(it), x = it.p[0], y = it.p[1] - tall * 0.12;
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.5;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * scl * 0.08, y + Math.sin(a) * scl * 0.06, scl * 0.07, scl * 0.14, a + Math.PI / 2, 0, TAU);
      ctx.fillStyle = k % 2 ? "#f4a6c6" : "#e97fae"; ctx.fill();
    }
    circle(x, y, scl * 0.05, "#f7d046");
  },
});
