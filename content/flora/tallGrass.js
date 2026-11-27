// Tall grass: 5 units of plant food per tuft; regrows, spreads in spring and dies if overgrazed.
defineFlora({
  id: "tallGrass",
  name: "Tall grass",
  chart: "Tall grass tufts",
  plantable: true,
  movedByHouse: true,
  sapling: { icon: "🌱", name: "Tall grass sapling", fuel: 0.03 },
  harvest: { gives: "grass", time: 1.5, knife: { more: 2, faster: 0.5 },   // with the knife in the hand: double the grass, in half the time
              ready: o => o.food > 0, amount: o => o.food, take: o => { o.food = 0; o.regrowAt = gameDay() + REGROW_DAYS; world.regrowths.push({ o, at: o.regrowAt }); } },   // cut; it regrows
  food: { units: 5, preference: 4, overgrazing: true },   // dies if eaten down to 0 eight times in a year
  driesInWinter: 0.05,                              // share of tufts that dry up each winter
  spreads: 0.06,                                    // share of tufts that sprout in a neighboring meadow cell each spring
  springSeeds: 0.01,                                // share of empty meadow cells where it sprouts each spring
  draw(it) {                      // tuft of tall grass swaying in the wind
    const [scl, tall] = sizes(it), { p } = it, t = performance.now() / 1000;
    const grows = it.o.food === 0 ? regrow(it.o) : 1;   // on the last day before regrowing, the leaves grow back
    if (grows < 1) {                         // trimmed: straw-colored patch with short stems
      ctx.save(); ctx.globalAlpha *= 1 - grows * 0.8;
      ctx.beginPath(); groundEllipse(it.x, it.y, 0.3, 0.24); ctx.fillStyle = "rgba(196,178,96,.55)"; ctx.fill();
      ctx.lineCap = "round"; ctx.lineWidth = Math.max(1, scl * 0.03);
      for (let k = 0; k < 16; k++) {
        const a = hash(it.i, 100 + k) * TAU, d = Math.sqrt(hash(it.i, 120 + k)) * 0.25;
        const q = project(it.x + Math.cos(a) * d, it.y + Math.sin(a) * d * 0.8);
        if (!q) continue;
        const h = tall * (0.06 + 0.06 * hash(it.i, 140 + k));
        ctx.strokeStyle = ["#a49a52", "#bdb06a", "#8f8a48", "#7fa046"][k % 4];
        ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] + (hash(it.i, 160 + k) - 0.5) * scl * 0.03, q[1] - h); ctx.stroke();
      }
      ctx.restore();
      if (grows <= 0) return;
    }
    const wind = windBend(it) * scl * 0.13 + Math.sin(t * 2.2 + it.x * 0.7) * scl * 0.012;   // bent by the wind, with a slight flutter
    ctx.lineCap = "round";
    for (let k = 0; k < 9; k++) {
      const bx = p[0] + (k - 4) * scl * 0.06, h = tall * (0.42 + 0.2 * hash(it.i, 90 + k)) * grows, inc = ((k - 4) * scl * 0.025 + wind) * grows;
      ctx.strokeStyle = ["#7fae45", "#93bd52", "#6c9c3b", "#a8c75e"][k % 4]; ctx.lineWidth = Math.max(1, scl * 0.035);
      ctx.beginPath(); ctx.moveTo(bx, p[1]); ctx.quadraticCurveTo(bx + inc * 0.3, p[1] - h * 0.6, bx + inc, p[1] - h); ctx.stroke();
    }
  },
});
