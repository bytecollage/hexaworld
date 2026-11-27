// Fruit bush: berries in spring and summer; food for small mammals, peccaries and very hungry deer.
defineFlora({
  id: "bush",
  name: "Fruit bush",
  chart: "Bushes",
  plantable: true,
  sapling: { icon: "🌿", name: "Bush sapling", fuel: 0.04 },
  strip: { gives: "branches", amount: 1, time: 1.5, rest: 1 },   // knife: a branch cut from it (again after a day)
  harvest: { gives: "berries", time: 1.5, ready: o => o.fruit > 0, amount: o => o.fruit, take: o => { o.fruit = 0; } },   // the bush stays
  berries: { perSeason: 4, withoutBees: 2 },        // fruit at the start of spring and summer (fewer without bees nearby); lost in autumn
  food: { from: "fruit", preference: 2 },           // animals eat its fruit one by one
  draw(it) {                    // low round shrub; with berries only in spring and summer
    const [scl0, tall0] = sizes(it), { p } = it, b = birth(it.o), scl = scl0 * b, tall = tall0 * b;   // a sown bush grows over its first day
    shadow(it.x, it.y, 0.3 * b);
    const cy = p[1] - tall * 0.22;
    circle(p[0] - scl * 0.16, cy + tall * 0.05, scl * 0.17, "#2f6e33");
    circle(p[0] + scl * 0.16, cy + tall * 0.05, scl * 0.17, "#2f6e33");
    circle(p[0], cy - tall * 0.06, scl * 0.21, "#3a8040");
    circle(p[0] - scl * 0.06, cy - tall * 0.12, scl * 0.09, "rgba(255,255,255,.08)");
    const color = ["#c2185b", "#6a1b9a", "#d84315"][Math.floor(hash(it.i, 270) * 3)];
    for (let k = 0; k < it.o.fruit * 2; k++)         // 2 berries drawn for each fruit it has left
      circle(p[0] + Math.cos(k * 2.3 + it.i) * scl * 0.22, cy + Math.sin(k * 2.3 + it.i) * tall * 0.13, scl * 0.035, color);
  },
});
