// Fruit tree: scattered on grassland; drops fruit in summer (more with bees nearby).
defineFlora({
  id: "fruitTree",
  name: "Fruit tree",
  chart: "Fruit trees",
  strip: { gives: "branches", amount: 2, adultAmount: 3, time: 2, rest: 1 },   // knife: branches cut without felling it (again after a day)
  tree: {
    sway: 0.03,                          // how much it bends with the wind (the grass bends far more)
    life: [160, 280],                               // days (8-14 years)
    fruit: "fruit",                                 // dropped in summer
    fallFruit: "fruit", fallCount: { young: 1, adult: 2 },   // left when it dies (adults: 2-3)
    chopFruit: (o, adult) => ["fruit", adult ? 10 : 5],
    beehives: true,                                 // hosts beehives
  },
  sapling: { icon: "🌳", name: "Fruit tree sapling", fuel: 0.06 },
  draw(it) {                     // round crown with fruits; the adult is twice as tall as the character
    const [scl0, tall0] = sizes(it), { p } = it, g = growth(it.o), b = Math.max(0.08, birth(it.o));
    const scl = scl0 * lerp(0.95, 1.5, g) * b, tall = tall0 * lerp(0.95, 2, g) * b;
    shadow(it.x, it.y, 0.45 * lerp(1, 1.5, g) * b);
    ctx.fillStyle = "#74512f"; ctx.fillRect(p[0] - scl * 0.07, p[1] - tall * 0.6, scl * 0.14, tall * 0.6);
    const cy = p[1] - tall * 0.78;
    circle(p[0] - scl * 0.2, cy + scl * 0.05, scl * 0.32, "#3f8a3a");
    circle(p[0] + scl * 0.2, cy + scl * 0.05, scl * 0.32, "#3f8a3a");
    circle(p[0], cy - scl * 0.15, scl * 0.36, "#4a9a42");
    const fruit = fruitColor(it.i);
    const nf = b < 1 ? 0 : Math.round(lerp(3, 8, g));   // young ones have little fruit (and do not drop it); sprouts, none
    for (let k = 0; k < nf; k++) circle(p[0] + Math.cos(k * 2.4 + it.i) * scl * 0.3, cy + Math.sin(k * 2.4 + it.i) * scl * 0.22 - scl * 0.05, scl * 0.055, fruit);
  },
});
