// =====================================================================================
//  ANIMALS: helpers shared by every species (definitions live in content/fauna/)
// =====================================================================================
// grows: animals that grow with age (min = size at birth; days = age at which they reach adult size).
// Small ones (fish, frogs, small mammals) do not grow.
const sizeOf = a => {
  const c = SPECIES[a.type].grows;
  return c ? lerp(c.min, 1, Math.min(1, Math.max(0, (gameDay() - a.born) / c.days))) : 1;
};
const zoneOf = a => { const e = SPECIES[a.type]; return e.animalZone ? (i => e.animalZone(i, a)) : e.zone; };
const landZone = i => world.outcropAt[i] < 0 && !world.houseAt?.has(i) && !world.fenceAt?.has(i) && (terrain(i) === "grass" || world.lakeShore[i] === 1);
