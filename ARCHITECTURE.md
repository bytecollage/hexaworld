# Architecture — hexaworld

How the code is organized and how to change it. For the game rules, see [BEHAVIOR.md](BEHAVIOR.md).

## Constraints

- **Static page, opened by double-click** (`file://`), no server, no build step, no backend.
- Browsers block ES modules on `file://`, so the code is made of **classic `<script src>` files** that share one global scope. A `const`, `let` or `function` declared at the top of one file is visible in every file loaded after it.
- **Everything is in English**: identifiers, comments, data ids, DOM ids, CSS classes and UI text.

## Folders

```
index.html            page markup + the ordered list of engine scripts
css/game.css          all the styles
src/
  core/               hex math (hex.js), $() (dom.js), seeded randomness (random.js), graph search (graph.js)
  registry/           the content registry: define*(), lookup tables, validation
  world/              world state and wrapping topology (world.js), terrain, generator, vegetation placement,
                      outcrops, objects per cell (cells.js), time and seasons (time.js)
  sim/                simulation: plants (flora.js), food, animal helpers (species.js), spawning, herbivore
                      trips (herbivores.js), needs, generic movement (fauna.js), predators, births and deaths
                      (population.js), simulate(days)
  player/             inventory, gathering, crafting and fire, tools, click actions, jobs, capture, building,
                      character movement
  render/             camera, scene (ground + depth-sorted elements), drawing primitives, night, clouds (zoom < 30), character drawing
  ui/                 inventory UI, containers (house/chest/basket rows above the inventory), workshop, minimap, clock, population chart, notices, input
  loop.js             the frame loop
  main.js             boot
content/
  registry.js         THE list of content files (add or remove a line here)
  fauna/              one file per species (+ _smallMammal.js, a shared base)
  flora/              one file per plant
  items/              things on the ground and inventory resources/tools
  world/              world features: nest, burrow, outcrops
  structures/         campfire, bonfire, trap, cage, fence, house
tools/                verification scripts (see "Verifying a refactor")
world.old.html        the original single-file game in Spanish (reference and source of the baseline)
index.old.html        the earlier hex-map prototype (reference)
```

## Load order and boot

1. `index.html` loads the engine scripts in the order of the original single file. Keep that order unless you check
   load-time dependencies: a few files run code while loading (for example `const canvas = $("view")`, or adding
   event listeners whose order matters).
2. `content/registry.js` runs next. It writes one `<script>` tag per content file with `document.write`, so the
   content files run in list order **before** `main.js`. This works on `file://`.
3. `main.js` calls `finalizeRegistry()`, which fills the engine's lookup tables from the definitions, and then
   generates the first world and starts `loop()`.

Content files only *declare* things. Engine code reads definitions at run time, never while loading, so content
can use any engine helper (`landZone`, `sizeOf`, `ctx`, `project`, …) inside its functions.

## Main loop

`loop()` (src/loop.js) runs every frame:

- **Every frame:** advance the clock, regrow plants, move animals, move the character, draw.
  - Animals run in game time and are split into sub-steps of at most 1.5 game seconds.
  - The character always runs in real time.
  - **Level of detail:** in live play (`updateAnimals(dt, true)` from `loop()`), animals farther than about two screen widths from the camera and more than 25 reference cells from the character are updated every `FAR_EVERY` (4) frames, each on its own frame, with the game time they missed (`a.lag`). `simulate()` does not use it, so fingerprints are not affected by it.
- **Every 0.5 s:** the slower systems: trees and bushes (`updateTrees`), the life cycle (`lifeCycle`), fires, fellings, captives and wear (`updateWear`).
- **`simulate(days)`** (src/sim/simulate.js) does the same without drawing. It is used from the console and by the verification tools. `skipToNextDay()` (the **Next day** button) uses it with fires, fellings, captives and wear included.

State lives in a few global objects:

| Object | What it holds |
|---|---|
| `world` | Cells, terrain, objects per cell, animals, statistics. |
| `clock` | Time of day, day number, speed. |
| `player` | The character's position, route, task and job. |
| `cam` | Camera target, turn, tilt and zoom. |
| `inventory`, `hand` | The inventory slots and the hand slot. |

Cells are indexed by an integer `i`. Every coordinate is valid, because `canon()` folds it into the original hexagon (the world wraps around).

### Grid scale: world units and reference cells

- **World units are fixed.** Positions (`a.x`, `a.y`), drawings, species speeds (`speed * SQ3`), sight and flee distances, fire light… are in world units, where `SQ3` is the spacing of a **reference cell** (the cell size the game was designed with).
- **The grid is `CELL_SCALE` (2.5) times finer** (`src/core/hex.js`): a cell has radius `CELL_R` world units and holds **one element** (`MAX_PER_CELL = 1`). `toPixel`/`toHex`/`CORNERS` already include the scale.
- Anything **counted in cells** must be converted:

| Helper | Use |
|---|---|
| `cellsFor(n)` | n reference cells → grid steps (e.g. comparing with `wrapDistance`, which returns grid steps). |
| `distances(cond)` | BFS distance in **reference cells** (rounded up), so thresholds like `toWater === 1` keep meaning "right next to it". `stepDistances(cond)` gives raw grid steps. |
| `findRoute(from, target, zone, maxSteps)`, `flowersNear(i, r)` | Their limits are in reference cells; they scale internally. |
| `smoothNoise(layer, passes)` | Passes are in reference cells: it runs `CELL_AREA` times more, so blobs keep their size. |
| `CELL_AREA` | Divide per-cell probabilities and "one per N cells" spawn counts by it, so densities per area stay the same. |
| `addAround(i, type)` | Puts an element in cell i or in a free cell around it (fruit falling beside a tree, plants around a carcass). |
| `cellsAround(i, r)` | The cells within r grid steps (outcrops take an irregular, roundish part of `cellsAround(anchor, 3)`). |

- `isGrove(i)`: at least 2 standing shelter trees in the cell and its 6 neighbors. `world.lakeShore` is the land strip 1-2 steps from a lake; `world.lakeEdge` the cells touching it (where animals drink).

## Drawing

`draw()` (src/render/scene.js) paints the ground hexagons, then three layers:
- **flat** (things on or under the water);
- **low** (things lying on the ground);
- **standing** (trees, animals, character, buildings), sorted back to front by screen height.

Each element calls `DRAW[type](it)`. `it` carries `x, y` (ground), `p` (projected point), `o` (the cell object) or `a` (the animal), and `fog`.

**Ground:** the cell loop only collects the visible cells; `drawGround()` fills them from the lowest terrain to the highest (`groundLevel`: deep, medium, shallow, sand, grass, rocky). Each cell rounds its corners where terrains meet: the only highest cell at a corner cuts it with a curve, and the middle one draws a lobe into the corner of the only highest or only lowest neighbor, so borders run through the edge midpoints in soft arcs without seams.

Standing trees are drawn with a skew toward the wind (`windBend(it)` × their `tree.sway`); `frameWind` is updated once per frame.

**Picking:** `draw()` remembers the screen box of every standing element (`rememberPickables`). `pickAt(sx, sy)` returns the frontmost element under the pointer (a tree, an animal, a build) or, if none, the ground point. Clicks and the hover highlight use it; terrain brushes use the plain ground (`cellAt`).

**Placement preview:** `placementPreview()` returns the cells the next click would build on (house, fence posts, fires, a trap/cage/sapling in the hand) and whether they fit; `drawPlacementPreview()` marks them green or red.

**Drawings must turn with the camera.** Build them from points in the world rather than from screen offsets, using the helpers in `src/render/primitives.js`:

| Helper | What it does |
|---|---|
| `projectUp(x, y, z)` | Projects a ground point raised `z` height units (the same scale as `sizes(it)[1]`). |
| `bodyPoint(x, y, d, u, v, z)` | A point of something facing direction `d`: `u` forward, `v` to its left, `z` up. |
| `bodyEllipsoid(x, y, d, u, v, z, L, W, H)` + `ctx.fill()` | A body part as an ellipsoid; its outline foreshortens correctly. |
| `ellipsoidPath(C, axes)` | The same, from any three screen axis vectors (tilted parts). |
| `groundEllipse(x, y, rx, ry, ang)` | An ellipse lying on the ground (shadows, leaves, fish). |
| `sideSeen(d, nu, nw)` | Whether a side with that outward normal faces the camera (to skip hidden walls). |
| `stickBox(...)` | A box of sticks (trap, cage): its back sides, then what is inside, then the sides facing the camera. |
| `small(it, …)`, `bird(it, …)` | Templates for small four-legged animals and birds, built along `a.dir`. |

Draw order for a body that faces away from the camera: head first, then body, then tail. Fallen trees are drawn with an affine transform (`scene.js`), so they lie toward a fixed direction in the world.

`tools/gallery.sh <out-prefix> [rot …]` renders a frozen test scene at several camera turns:

| Option | Scene |
|---|---|
| (default) | Coatis and foxes facing 8 directions, fallen pines and a house. |
| `GALLERY_SET=2` | Deer, jaguars, herons, eagles, a parrot, a cage and a trap. |
| `GALLERY_FOCUS=cage` | A close-up of the named object. |

Use it to check a drawing from every side.

## The content registry

Every species, plant, item, world feature and structure is **one file** that calls one of:

`defineFauna(def)` · `defineFlora(def)` · `defineItem(def)` · `defineFeature(def)` · `defineStructure(def)` · `defineSpawner(step)`

`finalizeRegistry()` (src/registry/registry.js) builds the engine's tables from the definitions:

| Table | Built from |
|---|---|
| `SPECIES` | Every fauna definition, in registration order. The simulation iterates it, so order matters. |
| `DRAW` | Each definition's `draw(it)`. |
| `ICONS`, `RESOURCE_NAME` | `icon` and `name`, `live`, `sapling`. |
| `SINGULAR`, `MEAT`, `CAPTIVE_DIET` | `name.one`, `meat`, `live.diet`. |
| Tag sets: `HUNTABLE`, `STUNNABLE`, `LIVE`, `BIG`, `FLAT`, `FISH`, `AQUATIC` | `tags`. |
| `LOW`, `HOUSE_REMOVABLE`, `GATHER_DURATION` | `layer: "low"`, `movedByHouse`, `harvest.time`. |
| `TREES`, `TREE_LIFE`, `FRUIT_OF`, `FRUIT_ON_FALL` | `tree`. |
| `PLANTABLE` | `plantable`. |
| `FUEL` | `fuel` and `sapling.fuel` (days of fire one unit adds). |
| `POPULATION_SERIES` | Every fauna definition, plus objects with `chart`. |

`validateRegistry()` warns in the console about references to content that is not registered (a prey, a food, a fruit, a leaf), for example after removing a species.

### Fauna fields

| Field | Meaning |
|---|---|
| `id`, `name: { one, many }` | Id used everywhere; display names. |
| `tags` | `huntable` (axe/bow), `stunnable` (stones), `catchable` (taken alive), `smallMammal` (spawned together, see `_smallMammal.js`), `smallPrey` (counted to size fox/eagle populations), `bigPrey` (leaves a carcass when hunted), `fish`, `underwater`, `drawnInWater`, `pollinator`. |
| `zone(i)`, `animalZone(i, a)` | Cells it can be in; `animalZone` overrides per individual (turtles go deeper as they grow). |
| `step`, `speed`, `walk`, `wait: [min, max]`, `flies` | Movement: reference cells per hop, reference cells per second (fleeing and hunting are relative to `speed`), calm walking pace (wandering, trips to eat and drink, strolls; defaults to `speed`), seconds between hops, flying. |
| `life: { min, max }`, `grows: { min, days }` | Lifespan in days; size at birth and age when fully grown. |
| `breed: { seasons, pct, litter, food, cap, nest, spawning, maturity }` | Breeding: seasons (0-3), share of pairs, litter size, only when well fed, carrying capacity × initial population, lays a nest (turtle), spawns in shallow water (fish). |
| `alert`, `fleeing`, `defense` | Distance at which it notices a hunting predator; distance at which it flees from the character; catch-probability factor (armadillo 0.5). |
| `needs: { thirst, hunger, dies, diet, hungryDiet, hidden, house, fleeing }` | Animals that eat and drink in the game: days until thirsty/hungry, days to starve, what they eat (ids of plants and items with `food`), what they eat when very hungry, hides in forests, lives in a burrow. A diet `Set` with `takesBait: true` is attracted by trap bait. |
| `hunt: { preys, cycle, dies, active, mode, view, attack, huntSpeed, success, restTime, chaseTime, radius, sates, stealth, reach, onlyWeak, onlyShore, attackRadius, hungryBig, threatensPlayer, findsHidden, fishInShallowOnly, fallbackFood }` | Predators. `mode`: `chase` \| `ambusher` \| `scavenger`. `active`: `day` \| `night` \| `always`. `threatensPlayer`: `stalk` (jaguar) \| `shore` (caiman). `huntsFrom`: hunger at which it starts hunting (default 1). `soar`: radius of its circles over home (birds). `perch`: altitude when resting at home at night (0: on the ground). `view` is also the vulture's search radius. |
| `hide`, `bones` | Hides and bones given (with the meat) when it is cut with the knife. |
| `meat`, `live: { icon, name, diet }`, `grab: { meat(a) }` | Meat when cut (default 1); live captive (icon, inventory name, diet in a cage); caught by hand as meat (frog, turtle). |
| `bigCarcass`, `leavesCarcass` | Its carcass grows more plants; a predator that leaves a carcass (others vanish). |
| `followsMother`, `restsByDay`, `migrates` | Deer behaviors: young follow an adult, daytime rests, leaving crowded areas. |
| `nightRest: "water" \| "lake" \| "beach"`, `swimSpeed` | Where it stays still at night; speed factor in water. |
| `immigrates: false` | Not brought back by spring immigration. |
| `spawn: { phase, normalOnly, run(ctx) }` (or a list) | How it is placed in a new world (see below). |
| `draw(it)` | How it is drawn. `it.a` is the animal; `it.p` its projected point; use helpers from `src/render/primitives.js` (`small`, `bird`, `fishSilhouette`, `groundEllipse`, `shadow`, …). |

**Hooks:** functions the engine calls if a definition has them.

| Hook | When it is called |
|---|---|
| `update(a, dt)` | Replaces the generic movement for that species (parrot, beehive). |
| `onBorn(child, mother)` | After a birth, and with `mother = null` for an immigrant. |
| `onSeasonStart(seasonIdx, nowDay)` | At the start of each season (beehives split or die). |
| `homeLost(a)` | Checked by the life cycle; returning true means the animal dies because its home is gone (the beehive's tree fell). |

### Plants, items, features and structures

| Field | Meaning |
|---|---|
| `name`, `groundName`, `icon` | Display name (for items, the inventory name), name when lying on the ground, inventory icon. |
| `layer: "low" \| "flat"` | Drawn flat on the ground without depth sorting / flat on the water under everything. |
| `chart` | Label in the population chart. |
| `tree: { life, fruit, fallFruit, fallCount, chopFruit(o, adult), shelter, sows, beehives, nests, sway }` | Trees: lifespan, fruit dropped in summer, fruit left when it dies (and how many), what chopping gives besides wood, counts for groves, autumn sowing chance, hosts beehives / eagle nests, how much it bends with the wind. |
| `harvest: { gives, time, amount(o), ready(o), remove, take(o), stack(o) }` | What gathering it gives: item id, seconds, how many, whether it is ready, and whether the object is removed or changed (`take`). `stack(o)` instead gives back a whole inventory stack (the `pile` left by a fallen house). |
| `food: { whole \| from: "fruit" \| units, preference, overgrazing }` | How animals eat it: whole (fruit), fruit by fruit (bush) or by units (grass 5, flowers 1); lower `preference` is eaten first; overgrazing kills it. |
| `berries: { perSeason, withoutBees }` | Fruit at the start of spring and summer (bush). |
| `driesInWinter`, `spreads`, `springSeeds` | Winter death chance; spring spreading chance; spring sprouting chance in empty meadows. |
| `plantable`, `sapling: { icon, name, ground }`, `movedByHouse`, `leaf`, `sprouts: { plant, ground, chance }`, `outcrop` | Dug up with the shovel; sapling item; pushed aside by a house; drawn on top of another plant's leaf; what a rotting fruit may sprout into (and what it is sown as from the hand); an outcrop kind. |
| `fuel` | Days of fire one unit adds when thrown on a campfire or bonfire (anything of plant origin; saplings use `sapling.fuel`). |

### Spawning

`placeAnimals()` (src/sim/spawnFauna.js) runs every spawn step sorted by `phase`. The phases keep the original order, so a seed always generates the same world.

A step's `run(ctx)` gets these helpers and land facts:

| Helper | What it does |
|---|---|
| `ctx.of(cond)` | Cells that meet `cond`. |
| `ctx.add(type, i, jitter)` | Animal with a random age. |
| `ctx.adult(a)` | Makes the animal an adult. |
| `ctx.pick(list)` | A random element. |
| `ctx.count(type)`, `ctx.countTag(tag)` | How many animals of that species or tag exist. |
| `ctx.sow(type, every, cond)` | Spreads `cells / every` animals over the cells that meet `cond`. |
| `ctx.grass`, `ctx.inForest()` | Grassland and groves that reach a lake. |
| `ctx.withLake`, `ctx.compD` | The connected land areas, and which of them reach a lake. |
| `ctx.testMap` | Whether this is the test map. |

`normalOnly: true` skips the step on the test map.

## How to add a species

1. Create `content/fauna/<id>.js` with `defineFauna({ id, name, zone, step, speed, wait, life, breed, …, spawn, draw })`.
   - Copy the closest existing species as a starting point:

     | Kind of species | Start from |
     |---|---|
     | Grazer | `deer.js` |
     | Hidden forest mammal | `coati.js` |
     | Predator | `fox.js` |
     | Sea animal | `fish.js` |
     | Bird | `parrot.js` or `eagle.js` |
   - Pick a spawn `phase` that does not clash with others. The order only matters for reproducing old worlds.
2. Add `"fauna/<id>.js"` to `CONTENT` in `content/registry.js`. Its position is the order in which the simulation visits it.
3. If predators should hunt it, add its id to their `hunt.preys`.
   - If it should eat plants, give it `needs.diet`.
   - Only plants and items with a `food` trait can be eaten.
4. Add it to BEHAVIOR.md.

Plants follow the same pattern with `defineFlora` in `content/flora/`. Where plants appear in a new world is decided by
the vegetation rules in `src/world/placement.js`: add a rule there for a new plant to appear on its own.

## How to remove something

Delete (or comment out) its line in `content/registry.js`. The engine skips unregistered types: `addObject()` and `createAnimal()` return `null`, and missing drawings are not drawn. `validateRegistry()` lists in the console the references to it that are now dangling, such as preys and diets. Clean those up if you want silence.

## What still names content in the engine

These are deliberate. They are core game mechanics, not species.

- **Core resources of the player's crafting and tools.** Recipes and actions use `branches`, `stones`, `grass`, `berries`, `fruit`, `coconut`, `pineCone`, `hide`, `bones` and the crafts (`rope`, `sharpStone`, `sharpBone`, `tannedHide`, `resin`) by id (recipes, bait, stoking the bonfire, throwing stones). A recipe with `needsFire: true` is made only next to a burning campfire or bonfire.
- **Player structures.** Fire, trap, cage, fence and house logic lives in `src/player/` (crafting.js, capture.js, building.js). Their content files only hold the name and the drawing. Fence posts and gates are cell objects listed in `world.fenceAt`; a post cell is blocked for animals (`blocked`, `landZone`) and, unless it is a gate, for the character.
- **Wear** (`src/player/durability.js`): uses per tool (`WEAR_PER_USE`), lifespans of structures (`LIFE_DAYS`), the house's 5 years (`HOUSE_LIFE`); `updateWear()` runs with the slow systems. Inventory stacks and built objects carry `wear` (0 new … 1 broken).
- **The vegetation placement rules** (`src/world/placement.js`) and the test map setup.
- **Carcasses fertilizing tall grass and flowers** (`src/sim/needs.js`).
- **Beehive and parrot hooks.** They refer to their own id inside their own files.

## Verifying a refactor

The simulation is deterministic for a given seed, so a "fingerprint" of a run can prove that a change did not alter behavior. It records:

- terrain;
- objects per type, with a position hash;
- animals per species (alive/dead), with a position hash;
- deaths per cause, births and hunts.

| Command | What it does |
|---|---|
| `FP_QUICK=1 tools/fp-all.sh index.html tools/fp-adapter-new.js /tmp/fp.json` | Quick check (about 2 min): seed 1 normal map for 15 days, test map for 60 days. |
| `tools/fp-all.sh index.html tools/fp-adapter-new.js /tmp/fp.json` | Full check (about 19 min): 2 normal maps up to 120 days, 2 test maps up to 200 days. |
| `node tools/compare-fp.js /tmp/fp.json tools/baseline-quick.json` | Compares a quick run with its baseline. |
| `node tools/compare-fp.js /tmp/fp.json tools/baseline.json` | Compares a full run with its baseline. |
| `tools/smoke.sh index.html /tmp/shot.png` | Loads the real page, saves a screenshot and prints script errors and registry warnings. |

The current baselines were recorded on 2026-11-25 from `index.html` after removing the big fish (quick run about 2 min, full run about 19 min). The first ones came from `world.old.html`; `compare-fp.js` still translates Spanish ids with `tools/words.json`.

Notes on the tools:

- They are **local dev tools** (Node + headless Chrome), not part of the game.
- They run Chrome with **`--js-flags=--jitless`**. With V8's JIT, long runs drift after a few dozen game days, and the drift depends on the code's bytes (even a renamed string changes it). This points to some floating-point operation whose result depends on the compiler tier. With the interpreter only, results are exact and comparable.
- Cases run **one at a time** in fresh pages: parallel or shared runs are not reproducible either.
- **Behavior changes need new baselines.** After an intended change, record new ones by running the full and quick commands on the new code and copying the output over the baseline files.

Other dev-only files in `tools/`:

| File | What it is |
|---|---|
| `rename.js`, `words.json` | The token-aware renamer and the Spanish→English word map used for the translation. |
| `fingerprint.js`, `fp-adapter-*.js`, `run-fp.sh` | The pieces the commands above use. |

## Conventions

- One content file per species, plant, item, feature or structure. Start it with a one-line comment saying what it is.
- Engine code asks for traits, not ids: add a field to the definition and read it.
- Update BEHAVIOR.md with every behavior change.
- Messages to the player go through `notify()` (src/ui/notice.js) and are written in the character's voice (first person). For a moment with several lines, add a list to `SAY` and call `notify(SAY.key)` (an entry may be a function of extra arguments: `notify(SAY.crafted, name)`).
