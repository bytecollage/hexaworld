# Content model plan — hexaworld

A plan to execute later: **every element of the game declares everything about itself in one common shape**, so that

- the engine reads all content the same way (no content ids inside `src/`);
- the documentation ([hexaworld.html](hexaworld.html), the element map) is derived from the definitions with no rule written by hand;
- another developer can add a tree, an animal, a resource or **a whole new ecosystem (desert, arctic…)** with new files only.

Status: **proposal, not started** (written 2026-11-27). Phase 0 (the element map) is done. Read [ARCHITECTURE.md](ARCHITECTURE.md) and [BEHAVIOR.md](BEHAVIOR.md) first.

---

## 1. Where we are

Measured on 2026-11-27 by counting quoted content ids in `src/`:

| Kind | Ids named in the engine | Notes |
|---|---|---|
| Fauna | **0** (only `nest`, 2×) | Already trait-driven: `hunt`, `needs`, `tags`, hooks; each species brings its own `spawn`. This is the model to copy. |
| Flora | 25 | Where plants grow is hand-written in `src/world/placement.js`; carcasses grow `tallGrass` and `flowers` by id (`src/sim/needs.js`). |
| Items | 184 | `knife` 25× in 8 files, `grass` 22×, `axe` 19×, `trap` 20×… Recipes, bait, stoking and throwing name resources by id. |
| Structures | 97 | Trap, cage, chest, fence, house logic lives in `src/player/`; their content files hold only the name and the drawing. |
| Terrains | fixed | 5 terrains in `src/world/terrain.js`; `"grass"` is named in 11 engine files. |

What that means:

- **Relations are half data, half code.** Data: preys, diets, fruit, sprouts, harvest, `strip`, `useWith`, fuel, recipes and builds. Code: what chopping gives, what each tool does, the pickaxe on outcrops, bait, carcass fertilizing, pollination, the parrot's seeds. The element map has to repeat the code part by hand (`tools/elements/build.js`, "ENGINE RULES").
- **A thing is described in several places.** The knife is an item in `content/items/inventory.js`, a recipe in `src/player/crafting.js`, a set of actions in `src/player/tools.js` and `actions.js`, and its wear in `durability.js`.
- **There is no biome.** Terrains, vegetation rules, the guaranteed lake, drinking (`world.lakeEdge`) and seasons are part of the engine.

Adding a **desert** today would touch roughly 15–20 engine files (terrain, generator, ground drawing, walking speed, `landZone`, placement, every `"grass"` check, the lake requirement, recipes that need `grass`…). Adding a desert animal that fits an existing behavior is already content-only.

---

## 2. Principles

1. **Definitions declare, the engine interprets.** A definition is data plus, at most, a drawing and a few documented hooks.
2. **One file per element holds everything about it:** identity, look, where it lives, how it lives, what it gives, what it costs, how it is used, and a short description.
3. **The engine asks for traits, never ids** (already a rule for fauna; extend it to everything). Engine tables are built once in `finalizeRegistry()` so the hot loops stay as fast as today.
4. **Verbs are engine code written once; content says which verbs it enables or accepts.**
5. **Materials are categories.** Recipes ask for `fiber`, `wood`, `stone`…, so new resources plug into the existing tree.
6. **Everything the docs show must come from the registry.** If the element map needs a rule written by hand, a trait is missing.
7. **Refactors keep behavior.** Phases 1–4 must leave the fingerprints identical (`tools/compare-fp.js`); content order and spawn/placement order are kept so seeds generate the same worlds.

---

## 3. The common definition shape

Every `define*()` accepts the same sections. Only the ones that apply are filled; the registry validates them.

```js
defineFlora({
  // identity
  id: "pine", kind: "plant", name: "Pine", groundName: …, icon: …,
  biomes: ["temperate"],                        // where it exists (section 6)
  doc: { summary: "Tall conifer; forms groves that shelter animals.", notes: [] },

  // look
  draw(it) { … }, layer: "standing" | "low" | "flat", sway: 0.035,

  // where and how it lives
  place: { terrain: ["grass"], noise: "forest", above: 0.63, density: 2.45, phase: 10 },   // new world (section 5)
  tree: { life: [300, 500], shelter: true, sows: 0.03 },

  // what it is made of / what it is
  materials: ["fuel"], fuel: 0.06,

  // ecology (section 4.3)
  hosts: ["beehive", "eagleNest"], leaves: { onDeath: { pineCone: [1, 2] } },

  // how the player interacts with it (section 4.1)
  accepts: {
    chop:  { time: [3, 5], gives: { wood: [5, 10], pineCone: [0, 2] }, then: "fall" },
    strip: { time: 2, gives: { wood: [2, 3] }, rest: 1 },
    burn:  { leaves: { charcoal: [2, 5] } },
  },
});
```

Ranges like `[5, 10]` mean young / adult unless a field says otherwise (`[min, max]` for random amounts uses `{ min, max }`).

Kinds and the sections they usually use:

| Kind | Typical sections |
|---|---|
| `animal` (`defineFauna`) | identity, look, `zone`/`habitat`, movement, `life`, `breed`, `needs`, `hunt`, ecology, `accepts` (hunt, cut, grab, stun, catch), `spawn` |
| `plant` (`defineFlora`) | identity, look, `place`, `tree`/growth, `food`, ecology, `accepts` (gather, chop, strip, dig, burn) |
| `resource`, `tool`, `craft` (`defineItem`) | identity, icon, `materials`, `fuel`, `food`, `tool` (verbs, wear), `recipe`, `accepts` (useWith becomes `accepts.combine`) |
| `structure` (`defineStructure`) | identity, look, `build` (cost, footprint, time), `life`, `container`, `shelter`, `accepts` (dismantle, open, enter, feed) |
| `feature` (`defineFeature`) | identity, look, `place`, `accepts` (mine…) |
| `terrain` (`defineTerrain`, new) | section 6 |
| `biome` (`defineBiome`, new) | section 6 |

---

## 4. The pieces

### 4.1 Verbs: player actions as data

Today each action is hand-coded per target. Instead, a small table of **verbs** lives in the engine (`src/player/verbs.js`), each implemented once: how the character approaches, the job animation and duration, what happens on success.

| Verb | Today | Enabled by | Accepted by (examples) |
|---|---|---|---|
| `gather` | `harvest` | empty hand | branches, stones, fruit, bush, tall grass, flowers, piles |
| `chop` | `chopNow` (tools.js) | axe | trees |
| `strip` | `strip` trait | knife | pine, fruit tree, bush |
| `cut` | `cutMeatNow` | knife | carcasses (meat, hide, bones) |
| `mine` | `mine` (capture.js) | pickaxe | outcrops |
| `dig` | `dig` | shovel | plantable plants |
| `burn` | `ignite` (wildfire.js) | torch | anything with the `fuel` material |
| `throw` / `shoot` / `stun` | `throwAxe`, `shoot`, `throwStone` | axe / bow / stones | animals tagged huntable / stunnable |
| `grab` | `grabNow` | empty hand (knife: meat) | frog, turtle |
| `catch` | trap logic | trap with bait | animals whose diet `takesBait` |
| `sow` / `plant` | `sow`, `plantSapling` | seed / sapling in hand | free cell of the right terrain |
| `fill` | `fillJar` | jar | lake water (a water source, section 6) |
| `combine` | `useWith` (combine.js) | item in hand + Ctrl+click | coconut, pine cone |
| `dismantle` | building.js | hammer | structures |
| `feed` / `open` / `enter` | crafting.js, containers.js | empty hand | fires, chest/cage, hut/house |

Tools declare `tool: { verbs: ["chop", "throw"], wear: 25, reach: 4.5 }`; targets declare `accepts: { chop: {…} }`. The click dispatcher (`clickAction`) becomes: find the target, intersect the verbs of what is in the hand with what the target accepts, run the verb. New tools and new targets need no engine change; a new *kind* of action is one new verb.

### 4.2 Materials and recipes in their own file

- **Material categories:** `wood` (branches, chopped wood), `fiber` (grass; later agave, lichen…), `stone`, `hide`, `bone`, `food`, `fuel`, `seed`, `sapling`. An item lists `materials: ["fiber", "fuel"]`.
- **Recipe costs accept a category or an id:** `{ fiber: 3 }` takes any fiber; `{ tannedHide: 1 }` a specific craft. The workshop shows which materials can pay.
- **The recipe lives in the item or structure file:**

```js
defineItem({ id: "rope", kind: "craft", materials: ["fuel"], fuel: 0.03,
  recipe: { group: "crafts", cost: { fiber: 3 }, time: 2, requires: [], tools: [], station: null } });
```

  `station` replaces `needsFire` and opens the planned tiers (see the crafting roadmap): `station: "fire"` (tanned hide, resin), later `station: "oven"` (cooking, **smelting rock into metal**), which in turn unlocks the **saw** and brings the **house** back. `crafting.js` and `building.js` keep only the generic workshop and building logic, reading `RECIPES` and `BUILDS` built by `finalizeRegistry()` from the definitions.

### 4.3 Ecology as traits

Replace the remaining hard-coded links with traits the engine reads generically:

| Today (engine code) | Trait |
|---|---|
| carcasses grow tall grass and flowers (needs.js) | `carcass: { grows: { tallGrass: 2, flowers: 1 } }` on the animal, or a default on the biome |
| beehives pollinate fruit trees and bushes (flora.js, animals.js) | `pollinates: { radius: 6, needs: { flowers: { within: 3 } } }` on the beehive; `pollinated: { fruit: [0, 1] → [1, 2] }` on the plant |
| the parrot drops seeds (parrot hook) | `disperses: { from: "fruitTree", every, distance: [5, 15] }` |
| homes: beehive/eagle nests in trees, burrows | `hosts: [...]` on the plant, `home: { in: "tree" \| "burrow" \| … }` on the animal |
| groves shelter deer, peccaries, small mammals | `shelter: true` on the plant (exists) + `seeksShelter: true` on the animal |
| the turtle nest, eggs eaten by the fox | `breed.nest: "nest"` (exists) + the nest as prey (exists): document only |

Hooks (`update`, `onBorn`, `onSeasonStart`, `homeLost`) stay for truly special behavior, but each hook declares in `doc` what it does so the map can show it.

### 4.4 Placement declared by each element

`placeElements()` today decides, per terrain, which plant goes in each cell. Instead each plant, loose item and feature carries a `place` rule; `placement.js` evaluates them in `phase` order:

```js
place: { terrain: ["grass"], noise: "forest", above: 0.63, density: 2.45, phase: 10 }
place: { terrain: ["sand"], toWater: 1, density: 0.2, phase: 40 }                  // palm
place: { terrain: ["water"], lake: true, toLand: 1, density: 0.6, phase: 60 }      // reeds
place: { near: "grove", byDistance: [0.12, 0.1, 0.05], else: 0.006, phase: 80 }   // branches
```

Noise layers (`forest`, `meadow`, `floral`) are declared by the biome. **Keep the exact order and hash seeds of today's rules** so phase 3 leaves the worlds identical.

### 4.5 Archetypes

Shared bases like today's `_smallMammal.js`, one per common shape, in `content/archetypes/`:

`GRAZER` (deer), `SMALL_FOREST_MAMMAL`, `BURROWER` (rabbit), `CHASE_PREDATOR` (fox, jaguar), `AMBUSHER` (caiman), `SOARING_BIRD` (eagle, vulture), `SHORE_BIRD` (heron, gull), `FISH`, `TREE`, `FRUIT_BUSH`, `GRASS_TUFT`, `AQUATIC_PLANT`, `LOOSE_ITEM`, `OUTCROP`.

A new species is then `defineFauna({ ...GRAZER, id: "camel", … })` plus its numbers and its drawing. Drawing templates already exist (`small`, `bird`, `fishSilhouette`).

### 4.6 Validation

`validateRegistry()` grows into a schema check, run at boot (console) and in CI:

- unknown fields (a typo such as `hunts:` instead of `hunt:` is silent today), wrong types, missing required fields per kind;
- broken references (preys, diets, `gives`, `hosts`, recipe costs, biome membership);
- a verb accepted by something but enabled by no tool, and the reverse;
- recipes that cannot be reached (a cost no biome can produce), cycles in `requires`;
- elements with no relation at all (today: whale, water lily, lotus, reeds) — a warning, so it is a decision, not an accident.

A Node runner (`node tools/validate.js`, reusing `tools/elements/extract.js`) makes the same check without a browser.

---

## 5. Documentation generated from the registry

Today: `tools/elements/extract.js` reads the definitions, `build.js` adds the hand-written ENGINE RULES and writes `hexaworld.html`; `capture.sh` draws the pictures with the game.

After phases 1–3 the ENGINE RULES disappear: every relation is a trait. Then:

1. **Split data and page.** `tools/elements/build.js` writes `docs/elements/elements.js` (`const ELEMENTS = {…}`, a classic script so the page still opens from `file://`) and `docs/elements/pictures.js`; the page becomes a fixed file that loads them. Alternatively the page can load `content/registry.js` and the content files directly and compute the relations itself (always current, no generated data), keeping only the pictures pre-rendered.
2. **GitHub Actions** (next to `fingerprints.yml`):
   - on push to `main` touching `content/` or `src/`: regenerate and commit `hexaworld.html` (or deploy it with Pages), so the published map is always current;
   - on pull requests: regenerate, run the validation, and write **the relations that changed** to the run summary (`+ fox hunts crab`, `− bow requires resin`), failing on validation errors;
   - by hand: also re-run `capture.sh` (Chrome is already set up for the fingerprints: `CHROME`, `CHROME_FLAGS`).
3. **A biome filter** in the map (section 6), and a page per biome listing its elements, terrains and food web.
4. **`doc.summary`** shown in every card; a missing summary is a validation warning.

---

## 6. Terrains and biomes

### 6.1 `defineTerrain`

```js
defineTerrain({ id: "grass", name: "Grass", color: [92, 158, 74], level: 4,
  land: true, water: false, walk: 1, fertile: true, buildable: true, beach: false });
defineTerrain({ id: "dune", name: "Dune", color: [222, 186, 120], level: 3, land: true, walk: 0.7, fertile: false, buildable: true });
defineTerrain({ id: "ice", name: "Sea ice", color: [214, 232, 240], level: 3, land: true, walk: 0.8, slippery: true, freezesFrom: "water" });
```

Engine checks such as `t === "grass"`, `isWater(t)`, `TERRAIN_LEVEL`, walking speed and `landZone` read these traits. This is the widest change (11 files name `"grass"`), so it is its own phase.

### 6.2 `defineBiome`

```js
defineBiome({
  id: "desert", name: "Desert",
  terrains: { land: ["dune", "rockyGround"], shore: "sand", water: ["water", "medium", "deep"] },
  generator: { land: 0.75, noise: { dunes: { scale: 6 }, oasis: { count: [2, 4] } } },
  water: "oasis",                                   // where land animals drink: "lake" | "oasis" | "iceHole"
  seasons: { day: [0.55, 0.65, 0.5, 0.45], rain: [0.1, 0, 0.05, 0.2] },
  climate: { heat: { day: 1, night: -0.3 } },        // optional; needs a climate mechanic (phase 7)
  defaults: { carcass: { grows: { dryGrass: 1 } } },
});
```

- **Membership:** each element lists `biomes: [...]`; shared things (stones, branches, the workshop crafts) are in every biome.
- **First step: one biome per world**, chosen in Options → New world (and on the test map). Later, several biomes in one map by region or latitude, with transition rules.
- **Folders:** `content/biomes/<id>/biome.js`, `terrains.js`, `fauna/`, `flora/`, `items/`, listed in `content/registry.js` (one section per biome) so the load order stays explicit.

### 6.3 Example: a desert

| File | What it declares |
|---|---|
| `biomes/desert/biome.js` | the biome above |
| `biomes/desert/terrains.js` | `dune`, `rockyGround` (sand and water are shared) |
| `flora/cactus.js` | `TREE`-like, `place` on dunes, `accepts.chop` gives `wood` + `water` (with the knife: `strip` gives `fiber`), `food` for camels |
| `flora/agave.js` | `GRASS_TUFT`-like, `materials: ["fiber"]` → rope, baskets and traps work unchanged |
| `flora/datePalm.js` | grows only at the oasis (`place.near: "oasis"`), fruit `dates` (`materials: ["food", "seed"]`) |
| `fauna/camel.js` | `{ ...GRAZER, needs: { thirst: 6, diet: ["cactus", "agave"] } }` |
| `fauna/fennec.js` | `{ ...CHASE_PREDATOR, active: "night", hunt: { preys: ["jerboa", "lizard"] } }` |
| `fauna/jerboa.js`, `lizard.js` | `BURROWER` / small prey, `catch` with bait |
| `fauna/scorpion.js` | `threatensPlayer` (exists for jaguar and caiman) with a sting instead of a bite |
| `fauna/vulture.js` | shared: add `"desert"` to its `biomes` |

Engine changes: **none** if phases 1–6 are done, except a climate mechanic (heat) if wanted.

### 6.4 Example: an arctic biome

Terrains `snow`, `ice` (sea water that freezes in winter: `freezesFrom: "water"`, a seasonal terrain swap), `tundra`. Plants: lichen (`fiber`), dwarf willow (`wood`), berries. Animals: caribou (`GRAZER`, migrates), arctic fox (`CHASE_PREDATOR`), snowy owl (`SOARING_BIRD`), seal (water + ice, prey), polar bear (`CHASE_PREDATOR` + `threatensPlayer`), fish under the ice. Water source `iceHole` (a `fill` target made with the pickaxe). Needs two engine features beyond the plan: **seasonal terrain** and **cold** (a climate mechanic, as for heat).

---

## 7. Phases

Each phase is one pull request, verified with the fingerprints (quick on the PR, full by hand) and the smoke test, with BEHAVIOR.md and ARCHITECTURE.md updated.

| # | Phase | Main files | Behavior | Done when |
|---|---|---|---|---|
| 0 | Element map (done) | `tools/elements/`, `hexaworld.html` | — | The map exists and can be regenerated. |
| 1 | Recipes and builds in their files; material categories | `content/items/*`, `content/structures/*`, `crafting.js`, `building.js`, `registry.js`, `workshop.js` | identical | `RECIPES`/`BUILDS` built by `finalizeRegistry()`; no recipe data in `src/`; costs accept categories. |
| 2 | Verbs and `accepts` | new `src/player/verbs.js`, `actions.js`, `tools.js`, `capture.js`, `combine.js`, content files | identical | `clickAction` dispatches through verbs; tool and target ids gone from the click code; ENGINE RULES section 4 of `build.js` deleted. |
| 3 | Ecology traits and `place` rules | `placement.js`, `needs.js`, `flora.js`, `animals.js`, beehive/parrot files | identical (same order and hashes) | `placement.js` has no plant ids; ENGINE RULES sections 2–3 deleted. |
| 4 | `defineTerrain` | `terrain.js`, `generator.js`, `scene.js`, `character.js`, `species.js`, others naming terrains | identical | no terrain id compared in `src/` outside the terrain registry. |
| 5 | `defineBiome`, one biome per world | `generator.js`, `world.js`, Options UI, `registry.js` | identical for the temperate biome | the current island is `content/biomes/temperate/`; a second, tiny test biome loads. |
| 6 | Archetypes, scaffold, strict validation | `content/archetypes/`, `tools/new-element.js`, `tools/validate.js`, registry | identical | `node tools/new-element.js fauna camel --like deer --biome desert` makes a working file; CI fails on schema errors. |
| 7 | First new biome | `content/biomes/desert/…` (+ climate if wanted) | new content, new baselines | playable desert; its own fingerprint cases. |
| 8 | Docs pipeline in CI | `.github/workflows/elements.yml`, `docs/elements/` | — | the map regenerates on `main`; PRs show changed relations. |

Phases 1–3 can each be done independently; 4 must come before 5; 6 can start any time after 2.

---

## 8. Risks and how to handle them

- **Determinism.** Spawning and placement order decide the world for a seed. Keep `phase` values equal to today's order and the same `hash(i, k)` keys; compare fingerprints after every step. Run them one at a time, never while editing (see CLAUDE.md).
- **Speed.** Trait lookups must not run in hot loops: `finalizeRegistry()` precomputes tables (verbs per tool, accepts per type, placement rules per terrain), as it already does for `HUNTABLE`, `LOW`, etc.
- **Over-generalizing.** Generalize what has at least two users today or a planned second biome; leave one-off behaviors in documented hooks.
- **Content order.** `SPECIES` order is the simulation order; biome sections in `content/registry.js` must keep the temperate list in its current order.
- **Docs drift during the transition.** Until phase 3 ends, keep `tools/elements/build.js` ENGINE RULES in sync with BEHAVIOR.md and regenerate `hexaworld.html` with every behavior change.

## 9. Open questions

- One biome per world, or regions in one world from the start?
- Do players carry items between biomes (new world keeps the inventory), or does each world start fresh?
- Should the docs page compute relations live from the content files (no generated data) or keep a generated `elements.js`?
- Climate (heat, cold) as a general mechanic, or per-biome hooks?
- The ARCHITECTURE.md section "What still names content in the engine" calls the core resources by id deliberate; this plan replaces that rule. Agree before phase 1, and rewrite that section then.
