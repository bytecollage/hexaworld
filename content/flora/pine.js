// Pine: forms groves of 2-3 per cell; shelter for deer and small mammals; drops cones only when it dies or is chopped.
defineFlora({
  id: "pine",
  name: "Pine",
  chart: "Pines",
  strip: { gives: "branches", amount: 2, adultAmount: 3, time: 2, rest: 1 },   // knife: branches cut without felling it (again after a day)
  tree: {
    sway: 0.035,                          // how much it bends with the wind (the grass bends far more)
    life: [300, 500],                               // days (15-25 years)
    fallFruit: "pineCone",                          // what it leaves when it dies (adults: 1-2)
    chopFruit: (o, adult) => ["pineCone", adult ? 1 + (hash(o.sem, 260) < 0.5 ? 1 : 0) : 0],   // what chopping it gives besides wood
    shelter: true,                                  // 2 standing pines make a grove (shelter for deer and small mammals)
    sows: 0.03,                                     // each autumn this share of adult pines sprouts a young pine next to it
    beehives: true, nests: true,                    // hosts beehives and eagle nests
  },
  sapling: { icon: "🌲", name: "Pine sapling", fuel: 0.06 },
  draw(it) {                       // trunk and crown tiers; the adult is twice as tall as the character
    const [scl, tall] = sizes(it), { p } = it, g = growth(it.o), b = Math.max(0.08, birth(it.o));
    const s = lerp(0.9, 1, g) * (0.92 + hash(it.i, 65) * 0.16) * b, sv = s * lerp(1, 2.15, g), sh = s * lerp(1, 1.45, g);
    shadow(it.x, it.y, 0.4 * sh);
    ctx.fillStyle = "#6b4a2b"; ctx.fillRect(p[0] - scl * 0.06 * sh, p[1] - tall * 0.35 * sv, scl * 0.12 * sh, tall * 0.35 * sv);
    for (let k = 0; k < 3; k++) {
      const base = p[1] - tall * (0.25 + k * 0.38) * sv, w = scl * (0.5 - k * 0.12) * sh, h = tall * 0.62 * sv;
      ctx.beginPath(); ctx.moveTo(p[0] - w, base); ctx.lineTo(p[0], base - h); ctx.lineTo(p[0] + w, base); ctx.closePath();
      ctx.fillStyle = ["#24603a", "#2b6e41", "#33804b"][k]; ctx.fill();
    }
  },
});
