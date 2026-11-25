// Coconut palm: beach only; drops coconuts in summer.
defineFlora({
  id: "palm",
  name: "Coconut palm",
  chart: "Palms",
  tree: {
    sway: 0.07,                          // how much it bends with the wind (the grass bends far more)
    life: [200, 360],                               // days (10-18 years)
    fruit: "coconut",                               // dropped in summer
    fallFruit: "coconut",                           // left when it dies (adults: 1-2)
    chopFruit: (o, adult) => ["coconut", adult ? 10 : 0],
  },
  sapling: { icon: "🌴", name: "Palm sapling", ground: "sand", fuel: 0.05 },
  draw(it) {                    // curved trunk, leaves and coconuts
    const [scl0, tall0] = sizes(it), { p } = it, side = hash(it.i, 64) > 0.5 ? 1 : -1;
    const g = growth(it.o), b = Math.max(0.08, birth(it.o));
    const scl = scl0 * lerp(0.9, 1.4, g) * b, tall = tall0 * lerp(0.95, 1.95, g) * b;
    shadow(it.x, it.y, 0.35 * lerp(1, 1.4, g) * b);
    const tx = p[0] + side * scl * 0.35, ty = p[1] - tall * 1.7;
    ctx.strokeStyle = "#8a6a43"; ctx.lineWidth = Math.max(2, scl * 0.11); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[0] + side * scl * 0.02, p[1] - tall, tx, ty); ctx.stroke();
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.48, L = scl * (0.55 + (k % 2) * 0.15);
      const fx = tx + Math.cos(a) * L, fy = ty + Math.sin(a) * L * 0.55 + L * 0.35;
      ctx.strokeStyle = k % 2 ? "#3e8a35" : "#4fa043"; ctx.lineWidth = Math.max(2, scl * 0.1);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + fx) / 2, ty - L * 0.25, fx, fy); ctx.stroke();
    }
    if (isAdult(it.o)) {                           // young coconut palms have no coconuts
      circle(tx - scl * 0.06, ty + scl * 0.06, scl * 0.06, "#5b3a1e");
      circle(tx + scl * 0.05, ty + scl * 0.08, scl * 0.06, "#6b4423");
    }
  },
});
