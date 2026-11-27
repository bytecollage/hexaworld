// Inventory items that only exist in the inventory or the hand (resources and tools).
defineItem({ id: "berries", name: "Berries", icon: "🫐", fuel: 0.01, sprouts: { plant: "bush", ground: "grass", chance: 1 } });   // Berries: gathered from fruit bushes; bait for traps and food for captives.
defineItem({ id: "grass", name: "Grass", icon: "🌾", fuel: 0.05 });   // Grass: cut from tall grass; used in recipes and to stoke the bonfire.
defineItem({ id: "meat", name: "Meat", icon: "🥩" });   // Meat: cut from dead animals with the knife.
defineItem({ id: "hide", name: "Hide" });   // Hide: cut from big animals with the knife (with the meat); tanned next to a fire.
defineItem({ id: "bones", name: "Bones", icon: "🦴" });   // Bones: cut from dead animals with the knife; sharpened with a stone.
// ---- crafts: made from raw materials in the Crafts menu; they are the materials of more advanced recipes
defineItem({ id: "rope", name: "Rope", fuel: 0.03 });   // Rope: twisted grass; for the axe, bow, trap, cage, gate and house.
defineItem({ id: "sharpStone", name: "Sharp stone" });   // Sharp stone: knapped from 3 stones; the edge of the knife and the axe.
defineItem({ id: "sharpBone", name: "Sharpened bone" });   // Sharpened bone: a bone ground with a stone; arrow points.
defineItem({ id: "tannedHide", name: "Tanned hide" });   // Tanned hide: a hide smoked next to a fire; for the bow and the house.
defineItem({ id: "resin", name: "Resin", fuel: 0.1 });
defineItem({ id: "openCoconut", name: "Open coconut", icon: "🥥", fuel: 0.04 });   // Open coconut: a coconut broken with a tool; food (bait, captives) and the jar's material.
defineItem({ id: "charcoal", name: "Charcoal", fuel: 0.15 });   // Charcoal: what a burnt tree leaves; burns well.   // Resin: melted from pine cones next to a fire; glue for the arrows.
defineItem({ id: "torch", name: "Torch" });   // Torch: carried lit in the hand for one night.
defineItem({ id: "knife", name: "Knife" });   // Knife: cuts meat from dead animals and finishes off stunned ones.
defineItem({ id: "axe", name: "Axe" });   // Axe: chops trees and can be thrown at animals.
defineItem({ id: "hammer", name: "Hammer" });   // Hammer: dismantles what was built and recovers its materials.
defineItem({ id: "pickaxe", name: "Pickaxe" });   // Pickaxe: breaks stones off outcrops.
defineItem({ id: "shovel", name: "Shovel" });   // Shovel: digs up small plants as saplings.
defineItem({ id: "bow", name: "Bow and arrows" });   // Bow and arrows: shoots land animals up to 9 cells away.
defineItem({ id: "jar", name: "Jar" });   // Jar: carries fresh water from lakes.
