// =====================================================================================
//  CONTENT REGISTRY: every species, plant, item, world feature and structure registers itself here.
//  Content files (listed in content/registry.js) call define*() while the page loads;
//  main.js calls finalizeRegistry() before the first world is generated, which fills the
//  lookup tables the engine reads (SPECIES, DRAW, ICONS, RESOURCE_NAME, LOW, TREES, …).
//  The engine asks for traits (tags, layer, harvest, tree, …) instead of naming content ids.
//  See ARCHITECTURE.md for every field a definition can have.
// =====================================================================================
const Registry = { fauna: [], flora: [], items: [], features: [], structures: [], spawners: [] };
const DEF = {};                                            // id → definition (any kind)

function register(list, kind, d) {
  if (!d.id) throw new Error(`${kind} without id`);
  if (DEF[d.id]) throw new Error(`duplicate content id "${d.id}"`);
  d.kind = kind; DEF[d.id] = d; list.push(d);
  return d;
}
function defineFauna(d) { return register(Registry.fauna, "fauna", d); }
function defineFlora(d) { return register(Registry.flora, "flora", d); }
function defineItem(d) { return register(Registry.items, "item", d); }
function defineFeature(d) { return register(Registry.features, "feature", d); }
function defineStructure(d) { return register(Registry.structures, "structure", d); }
// a spawn step: { id, phase, testMap?, run(ctx) } — steps run sorted by phase when a world is populated (see sim/spawnFauna.js)
function defineSpawner(step) { Registry.spawners.push(step); return step; }

// ---- queries
const hasTag = (id, tag) => !!DEF[id]?.tags?.includes(tag);
const idsWithTag = tag => Registry.fauna.filter(d => d.tags?.includes(tag)).map(d => d.id);

// ---- lookup tables the engine reads (filled by finalizeRegistry; declared here so every file can refer to them)
const SPECIES = {};                 // fauna id → definition, in registration order (the simulation iterates it)
const ICONS = {}, RESOURCE_NAME = {};                    // inventory types
const SINGULAR = {}, MEAT = {}, CAPTIVE_DIET = {};       // fauna, by id
const HUNTABLE = new Set(), STUNNABLE = new Set(), LIVE = new Set(), BIG = new Set(), FLAT = new Set(), FISH = new Set(), AQUATIC = new Set();
const LOW = new Set(), TREES = new Set(), PLANTABLE = new Set(), HOUSE_REMOVABLE = new Set();
const FRUIT_OF = {}, TREE_LIFE = {}, FRUIT_ON_FALL = {}, GATHER_DURATION = {};
const FUEL = {};                    // inventory type → days of fire one unit adds (anything of plant origin: `fuel`, `sapling.fuel`)
const POPULATION_SERIES = [];       // [key, label]: fauna by id, objects on the ground by "_" + id

function finalizeRegistry() {
  const tagSet = { huntable: HUNTABLE, stunnable: STUNNABLE, catchable: LIVE, bigPrey: BIG, drawnInWater: FLAT, fish: FISH, underwater: AQUATIC };
  for (const d of Registry.fauna) {
    SPECIES[d.id] = d;
    SINGULAR[d.id] = d.name.one;
    if (d.meat) MEAT[d.id] = d.meat;
    for (const t of d.tags || []) tagSet[t]?.add(d.id);
    if (d.live) { ICONS[d.id] = d.live.icon; RESOURCE_NAME[d.id] = d.live.name; if (d.live.diet) CAPTIVE_DIET[d.id] = d.live.diet; }
    if (d.draw) DRAW[d.id] = d.draw;
    POPULATION_SERIES.push([d.id, d.chart || d.name.many]);
  }
  for (const d of [...Registry.flora, ...Registry.items, ...Registry.features, ...Registry.structures]) {
    if (d.draw) DRAW[d.id] = d.draw;
    if (d.icon) ICONS[d.id] = d.icon;
    if (d.kind === "item" || d.icon || d.kind === "structure") RESOURCE_NAME[d.id] = d.name;
    if (d.fuel) FUEL[d.id] = d.fuel;
    if (d.layer === "low") LOW.add(d.id);
    if (d.movedByHouse) HOUSE_REMOVABLE.add(d.id);
    if (d.harvest) GATHER_DURATION[d.id] = d.harvest.time;
    if (d.tree) {
      TREES.add(d.id); TREE_LIFE[d.id] = d.tree.life; FRUIT_ON_FALL[d.id] = d.tree.fallFruit;
      if (d.tree.fruit) FRUIT_OF[d.id] = d.tree.fruit;
    }
    if (d.plantable) PLANTABLE.add(d.id);
    if (d.sapling) { ICONS["sapling_" + d.id] = d.sapling.icon; RESOURCE_NAME["sapling_" + d.id] = d.sapling.name; if (d.sapling.fuel) FUEL["sapling_" + d.id] = d.sapling.fuel; }
    if (d.chart) POPULATION_SERIES.push(["_" + d.id, d.chart]);
  }
  Registry.spawners.sort((a, b) => a.phase - b.phase);   // stable: equal phases keep registration order
  validateRegistry();
}

// warns about references to content that is not registered (for example after removing a species)
function validateRegistry() {
  const known = id => id in DEF;
  for (const d of Registry.fauna) {
    for (const p of d.hunt?.preys || []) if (!known(p)) console.warn(`${d.id}: prey "${p}" is not registered`);
    for (const set of [d.needs?.diet, d.needs?.hungryDiet]) for (const f of set || []) if (!known(f)) console.warn(`${d.id}: food "${f}" is not registered`);
  }
  for (const d of Registry.flora) {
    if (d.tree?.fruit && !known(d.tree.fruit)) console.warn(`${d.id}: fruit "${d.tree.fruit}" is not registered`);
    if (d.leaf && !known(d.leaf)) console.warn(`${d.id}: leaf "${d.leaf}" is not registered`);
  }
}
