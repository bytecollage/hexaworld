let tPrev = performance.now();
// the performance panel (Options → FPS) and updateFps(): src/ui/perf.js
function loop(t) {
  const t0 = performance.now();
  const dt = Math.min(0.05, (t - tPrev) / 1000); tPrev = t;
  advanceClock(dt);
  drawClock();
  updateRegrowth();
  watchSleep();
  if (!simulating) {
    if ((loop.panel = (loop.panel || 0) + dt) > 0.5) {
      loop.panel = 0; perf.slowRuns++;
      timed("slow", () => { updateTrees(); lifeCycle(); updateFires(); updateFellings(); updateCaptives(); updateWear(); updateWildfire(); watchFireForWorkshop(); });
      if (inHand() === "torch" || hand.item?.living || inventory.some(r => r?.living)) renderInventory();   // flame bar; live animals' health
      if (player.inside && !player.sleeping) renderContainers();     // the sleep button becomes enabled at dusk
      if (openCageRef) renderContainers();                         // the animals' bars and what they eat from the cage's slots
      watchChest();                                                   // an open chest closes when you walk away
      if (basket) renderBasketButton();                               // the basket's wear bar
    }
    timed("sim", () => { updateAnimals(dt, true); samplePopulation(); });   // with level of detail: far animals less often
  }
  updateCharacter(dt);
  updateZoomReturn();                               // below zoom 30 (clouds) the camera comes back by itself
  if ($("follow").checked && player.i >= 0) {
    const [gx, gy] = nearCamera(player.x, player.y), f = 1 - Math.exp(-dt * 4);
    cam.tx += (gx - cam.tx) * f; cam.ty += (gy - cam.ty) * f; normalizeCamera();
  }
  if (!curtainHidesMap()) timed("draw", draw);                       // under the curtain (sleeping, Next day) only the clock moves
  updateFps(t, performance.now() - t0);
  requestAnimationFrame(loop);
}
