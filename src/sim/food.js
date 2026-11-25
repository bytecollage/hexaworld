// ---- Food: each species has its diet (deer: tall grass; small ones: fruit, berries and flowers)
// what is left to eat, from the `food` trait of its definition: whole (fruit), fruit count (bush) or food units (grass, flowers)
const foodLeft = o => { const f = DEF[o.type]?.food; return !f ? false : f.whole ? true : f.from === "fruit" ? o.fruit > 0 : o.food > 0; };
const edible = (o, diet) => o.type === "trap" ? (!!o.baitItem && !o.prey && diet.takesBait === true)   // bait: only small ones
  : diet.has(o.type) && foodLeft(o);
const preferenceOf = o => o.type === "trap" ? 0 : DEF[o.type].food.preference;   // lower is eaten first
const hasFood = (i, diet) => objs(i).some(o => edible(o, diet));
const foodAt = (i, diet) => objs(i).filter(o => edible(o, diet))
  .sort((a, b) => preferenceOf(a) - preferenceOf(b))[0];
function eatAt(i, diet) {                        // eats 1 unit of whatever is in the cell; returns whether there was any
  const o = foodAt(i, diet);
  if (!o) return false;
  const f = DEF[o.type].food;
  if (f.whole) removeObject(o);
  else if (f.from === "fruit") o.fruit--;
  else if (--o.food === 0) {                      // grass and flowers regrow (on the last day you see them growing back)
    const year = gameYear();
    o.depleted = o.depletedYear === year ? o.depleted + 1 : 1; o.depletedYear = year;
    if (f.overgrazing && o.depleted >= DEPLETIONS_TO_DIE) { removeObject(o); return true; }   // overgrazing: the tuft dies
    o.regrowAt = gameDay() + REGROW_DAYS;
    world.regrowths.push({ o, at: o.regrowAt });
  }
  return true;
}
function updateRegrowth() {
  const nowDay = gameDay();
  world.regrowths = world.regrowths.filter(r => {
    if (nowDay < r.at) return true;
    if (!r.o.removed) r.o.food = DEF[r.o.type]?.food?.units ?? 1;
    return false;
  });
}
function removeOutcrop(id) {
  const y = world.outcrops[id];
  if (!y || y.removed) return;
  y.removed = true;
  for (const i of y.cells) { world.outcropAt[i] = -1; world.colors[i] = colorOf(i); miniHex(i); }
}
const blocked = i => i === undefined || isWater(terrain(i)) || world.outcropAt[i] >= 0 || !!world.houseAt?.has(i) || !!world.fenceAt?.has(i);   // cannot be walked on
