// =====================================================================================
//  TERRAIN: continent + sea + two small islands
// =====================================================================================
// shallow water (wadeable) → medium depth → ocean
const TERRAINS = ["deep", "medium", "water", "sand", "grass"];
const TERRAIN_COLOR = { deep: [23, 58, 112], medium: [42, 104, 171], water: [74, 147, 207], sand: [220, 194, 126], grass: [92, 158, 74] };
const TERRAIN_NAME = { deep: "Ocean", medium: "Medium depth", water: "Shallow water", sand: "Sand", grass: "Grass" };
const isWater = t => t === "water" || t === "medium" || t === "deep";
const terrain = i => world.painted.get(i) ?? world.base[i];
