// ---- reproducible randomness from the seed
function hash(i, layer) {
  let h = (i * 374761393 + layer * 668265263 + world.seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
let animSeed = 12345;
const rnd = () => { animSeed = (Math.imul(animSeed, 1664525) + 1013904223) >>> 0; return animSeed / 4294967296; };
