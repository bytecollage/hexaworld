// ---- Test: advances the world quickly without drawing (console only: await simulate(days))
async function simulate(days, step = 1, everything = false) {   // everything: also fires, fellings and captives (the "Next day" button)
  const end = gameDay() + days, speed = clock.speed; let n = 0;
  clock.speed = 1; simulating = true;
  while (gameDay() < end) {
    advanceClock(step); updateAnimals(step); updateRegrowth();
    if (++n % 20 === 0) { updateTrees(); lifeCycle(); samplePopulation(); if (everything) { updateFires(); updateFellings(); updateCaptives(); updateWear(); } }
    if (n % 1500 === 0) await new Promise(r => setTimeout(r, 0));
  }
  clock.speed = speed; simulating = false;
}
let simulating = false;
// "Next day" (options popup, Time row): the world runs without drawing until the next dawn
async function skipToNextDay() {
  if (simulating) return;
  const b = $("nextDay"); b.disabled = true;
  await simulate(nextDawn() + 0.002 - gameDay(), 1, true);
  b.disabled = false;
  notify(`A new day, day ${clock.day}`);
}
