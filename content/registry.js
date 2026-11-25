// =====================================================================================
//  CONTENT LIST — the one place to add or remove content.
//  Each file registers one species, plant, item, world feature or structure (see ARCHITECTURE.md).
//  To remove something, delete (or comment out) its line; to add something, create its file and add a line.
//  Order matters: the simulation visits species in this order, and files starting with "_" are shared bases
//  that must come before the files that use them.
// =====================================================================================
const CONTENT = [
  // ---- fauna
  "fauna/_smallMammal.js",
  "fauna/deer.js", "fauna/coati.js", "fauna/raccoon.js", "fauna/opossum.js", "fauna/armadillo.js",
  "fauna/turtle.js", "fauna/frog.js", "fauna/fish.js", "fauna/school.js", /* "fauna/bigFish.js", (removed: only small fish and schools) */ "fauna/whale.js",
  "fauna/rabbit.js", "fauna/peccary.js", "fauna/crab.js", "fauna/parrot.js", "fauna/beehive.js",
  "fauna/jaguar.js", "fauna/fox.js", "fauna/eagle.js", "fauna/caiman.js", "fauna/shark.js", "fauna/heron.js", "fauna/gull.js", "fauna/vulture.js",
  // ---- flora
  "flora/pine.js", "flora/fruitTree.js", "flora/palm.js", "flora/bush.js", "flora/tallGrass.js", "flora/flowers.js",
  "flora/waterLily.js", "flora/lotus.js", "flora/reeds.js",
  // ---- items (on the ground and in the inventory)
  "items/branches.js", "items/stones.js", "items/fruit.js", "items/coconut.js", "items/pineCone.js", "items/groundAxe.js", "items/pile.js",
  "items/inventory.js",
  // ---- world features
  "world/nest.js", "world/burrow.js", "world/rockMound.js", "world/monolith.js",
  // ---- structures
  "structures/campfire.js", "structures/bonfire.js", "structures/trap.js", "structures/cage.js", "structures/fence.js", "structures/gate.js", "structures/chest.js", "structures/house.js",
];
// Classic scripts written during parsing run in order, before main.js (this works when opening index.html from disk).
for (const f of CONTENT) document.write(`<script src="content/${f}"><\/script>`);
