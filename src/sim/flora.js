const REGROW_DAYS = 2;                             // eaten or cut plants regrow after 2 days
const DEPLETIONS_TO_DIE = 8;                      // a tall grass tuft depleted 8 times in the same year dies (overgrazing)
// prob. per year: an adult pine sows next to it (autumn); a grass tuft spreads (spring); it dries (winter)
const ROT_DAYS = 5, SPROUT_PROB = 0.2;          // fruit on the ground rots after 5 days; 20% sprouts into a new plant
// ---- Tree life cycle: they die in the winter in which they reach their age; they fall and stay down for 5 days,
//      with their fruits (fruit, coconuts or pine cones) beside them
const FALLEN_DAYS = 5, FALL_DURATION = 0.003;       // days lying down; how long it takes to fall (a bit over 1 s at ×1)
const MATURE_DAYS = 7;                              // drops fruit from 7 days after becoming adult
const GROW_PER_SPRING = 0.3;                   // from the 2nd spring on, 30% of the young trees grow each spring
// being born and growing are not instant: each process lasts a full game day and is drawn little by little
const GROW_DURATION = 1;                          // days
const progress = fromCell => Math.min(1, Math.max(0, (gameDay() - fromCell) / GROW_DURATION));
const lerp = (a, b, t) => a + (b - a) * t;
const growth = o => o.adultSince === Infinity ? 0 : progress(o.adultSince);   // 0 young … 1 adult
const birth = o => o.bornAt === undefined ? 1 : progress(o.bornAt);              // 0 just sprouted … 1 young
const SEEDLING_PART = 0.5;                        // the first half of that day it is drawn as a seedling (two leaves)
const regrow = o => o.regrowAt === undefined ? 1 : progress(o.regrowAt - GROW_DURATION);   // grass/flowers: the last day
const isAdult = o => growth(o) >= 1;
const fall = o => o.fellAt === undefined ? 0 : Math.min(1, (gameDay() - o.fellAt) / FALL_DURATION);
function fell(o) {                              // the tree dies: it falls and leaves its fruits beside it
  const nowDay = gameDay();
  o.fellAt = nowDay;
  const adult = isAdult(o);
  const c = DEF[o.type].tree.fallCount || { young: 0, adult: 1 };      // young palms and pines leave none
  const n = adult ? c.adult + (hash(o.sem, 320) < 0.5) : c.young;
  for (let k = 0; k < n; k++) {
    const f = addAround(o.i, FRUIT_ON_FALL[o.type], { mother: o.sem });   // beside the trunk
    if (f) { f.falls = nowDay; world.groundFruits.push(f); }
  }
}           // it is adult (wood 10, fruit…) when it finishes growing
function assignGrowth() {                    // when spring starts (except the first one): choose which young trees grow and when
  const year = gameYear();
  if (seasonIndex() !== 0 || year < 1 || world.springAssigned >= year) return;
  world.springAssigned = year;
  const start = year * YEAR_DAYS;
  const saplings = world.trees.filter(o => !o.removed && o.fellAt === undefined && o.adultSince === Infinity)
    .sort((a, b) => hash(a.sem, 240 + year) - hash(b.sem, 240 + year));
  for (const o of saplings.slice(0, Math.round(saplings.length * GROW_PER_SPRING)))
    o.adultSince = start + hash(o.sem, 250 + year) * (SEASON_DAYS - GROW_DURATION);   // starts growing at its moment and finishes within the spring
}
// what each tree would give when cut down (it cannot be cut yet)
const woodOf = o => isAdult(o) ? 10 : 5;
function updateTrees() {                      // growth, bushes, rotten fruit and fruit drop in summer
  assignGrowth();
  const nowDay = gameDay(), year = gameYear(), summerStart = year * YEAR_DAYS + SEASON_DAYS;
  // bushes: they fill with fruit at the start of spring and summer; in autumn and winter they have none
  const seasonKey = year * 4 + seasonIndex();
  if (world.seasonKey !== seasonKey) {
    world.seasonKey = seasonKey;
    const seasonIdx = seasonIndex();
    if (seasonIdx <= 1) { updatePollination(); for (const o of world.bushes) { const b = DEF[o.type].berries; o.fruit = pollinated(o.i) ? b.perSeason : b.withoutBees; } }   // without bees, half
    else if (seasonIdx === 3) for (const o of world.bushes) o.fruit = 0;           // winter: none has any
    if (seasonIdx === 2) for (const o of world.trees)                                // autumn: some adult pines sow next to them
      if (DEF[o.type].tree.sows && o.fellAt === undefined && isAdult(o) && hash(o.sem, 600 + year) < DEF[o.type].tree.sows)
        world.sowings.push({ o, at: year * YEAR_DAYS + 2 * SEASON_DAYS + hash(o.sem, 601 + year) * (SEASON_DAYS - 0.5) });
    if (seasonIdx === 3) for (const l of world.objects) if (l) for (const o of [...l])   // winter: some grass tufts dry up
      if (hash(o.sem, 620 + year) < (DEF[o.type]?.driesInWinter || 0)) removeObject(o);   // and some flowers
    const seeder = Registry.flora.find(d => d.springSeeds);
    if (seasonIdx === 0 && seeder) for (let i = 0; i < world.objects.length; i++)        // spring: tall grass sprouts in empty meadows
      if (!objs(i).length && world.base[i] === "grass" && terrain(i) === "grass" && world.outcropAt[i] < 0 && hash(i, 630 + year) < seeder.springSeeds / CELL_AREA)
        world.sowings.push({ o: { type: seeder.id, i, sem: i }, at: year * YEAR_DAYS + hash(i, 631 + year) * (SEASON_DAYS - 0.5), here: true });
    if (seasonIdx === 0) for (const l of world.objects) if (l) for (const o of l)       // spring: some grass tufts spread
      if (DEF[o.type]?.spreads && hash(o.sem, 610 + year) < DEF[o.type].spreads)
        world.sowings.push({ o, at: year * YEAR_DAYS + hash(o.sem, 611 + year) * (SEASON_DAYS - 0.5) });
    if (seasonIdx === 2) {                                                            // autumn: 20% of the bushes empty each day
      const start = year * YEAR_DAYS + 2 * SEASON_DAYS;
      const order = world.bushes.filter(o => !o.removed).sort((a, b) => hash(a.sem, 280 + year) - hash(b.sem, 280 + year));
      order.forEach((o, k) => { o.losesAt = start + Math.floor(k * SEASON_DAYS / order.length) + hash(o.sem, 290 + year) * 0.99; });
    }
  }
  if (seasonIndex() === 2) for (const o of world.bushes) if (o.fruit > 0 && nowDay >= o.losesAt) o.fruit = 0;
  world.sowings = world.sowings.filter(sb => {      // the sown pines and the new grass tufts are born
    if (nowDay < sb.at) return true;
    const o = sb.o;
    if (o.removed) return false;
    const tree = !!DEF[o.type]?.tree;                     // a sowing tree (pine) or a spreading plant (tall grass)
    const j = sb.here ? o.i : [...world.neighbors[o.i]].sort(() => rnd() - 0.5).find(j => j !== undefined && terrain(j) === "grass" && world.outcropAt[j] < 0 &&
      objs(j).length < MAX_PER_CELL && (tree || !isGrove(j)));
    if (j === undefined) return false;
    if (tree) {
      const v = TREE_LIFE[o.type], n = addObject(j, o.type, { adultSince: Infinity, lastDrop: -1, bornAt: nowDay, born: nowDay, life: v[0] + rnd() * (v[1] - v[0]) });
      if (n) world.trees.push(n);
    } else {
      const n = addObject(j, o.type, { food: 0, regrowAt: nowDay + GROW_DURATION });
      if (n) world.regrowths.push({ o: n, at: n.regrowAt });
    }
    return false;
  });
  // old trees: when winter starts, those reaching their age before it ends die (each at its moment)
  if (seasonIndex() === 3 && (world.winterDeaths ?? -1) < year) {
    world.winterDeaths = year;
    const start = year * YEAR_DAYS + 3 * SEASON_DAYS, end = start + SEASON_DAYS;
    for (const o of world.trees) if (!o.removed && o.fellAt === undefined && o.life && end - o.born >= o.life)
      o.diesAt = Math.max(nowDay, start + hash(o.sem, 330 + year) * (SEASON_DAYS - 0.2));
  }
  for (const o of world.trees) {
    if (o.removed) continue;
    if (o.fellAt === undefined && o.diesAt !== undefined && nowDay >= o.diesAt) fell(o);
    else if (o.fellAt !== undefined && nowDay - o.fellAt >= FALLEN_DAYS) removeObject(o);   // the trunk disappears
  }
  if (world.trees.some(o => o.removed)) world.trees = world.trees.filter(o => !o.removed);
  // fruit and coconuts on the ground: they rot after 5 days; 20% sprout into a young plant if it fits in the cell
  world.groundFruits = world.groundFruits.filter(f => {
    if (f.removed) return false;
    if (nowDay - f.falls < ROT_DAYS) return true;
    removeObject(f);
    const sp = DEF[f.type].sprouts, plant = sp?.plant;     // fruit → fruit tree, pine cone → pine, coconut → palm (on sand)
    const ground = sp && terrain(f.i) === sp.ground;
    if (plant && DEF[plant] && hash(f.sem, 400) < SPROUT_PROB * sp.chance && ground && objs(f.i).length < MAX_PER_CELL) {   // coconuts: 16%
      const v = TREE_LIFE[plant];
      const n = addObject(f.i, plant, { adultSince: Infinity, lastDrop: -1, bornAt: nowDay, born: nowDay,
                                            life: v[0] + hash(f.sem, 66) * (v[1] - v[0]) });
      if (n) { n.ox = f.ox; n.oy = f.oy; world.trees.push(n); world.sprouts++; }
    }
    return false;
  });
  if (seasonIndex() !== 1) return;
  for (const o of world.trees) {
    if (o.removed || o.fellAt !== undefined || !FRUIT_OF[o.type] || o.lastDrop >= year) continue;
    if (nowDay - o.adultSince - GROW_DURATION < MATURE_DAYS) continue;               // young, or adult only recently
    if (nowDay < summerStart + hash(o.sem, 200 + year) * (SEASON_DAYS - 0.5)) continue; // each tree has its moment
    o.lastDrop = year;
    const howManyF = pollinated(o.i) ? (hash(o.sem, 220 + year) < 0.5 ? 1 : 2) : (hash(o.sem, 220 + year) < 0.4 ? 1 : 0);   // without bees, less
    for (let k = 0; k < howManyF; k++) {
      const f = addAround(o.i, FRUIT_OF[o.type], { mother: o.sem });                   // at the foot of the tree, in a cell beside it
      if (f) { f.falls = nowDay; world.groundFruits.push(f); }
    }
  }
}
