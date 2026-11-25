let tPrev = performance.now();
const fpsMeter = { frames: 0, since: performance.now(), work: 0 };   // Options → FPS
function updateFps(t, workMs) {
  const m = fpsMeter, el = $("fps"), on = $("showFps").checked;
  el.hidden = !on; if (!on) return;
  m.frames++; m.work += workMs;
  if (t - m.since < 500) return;
  const fps = m.frames * 1000 / (t - m.since), ms = m.work / m.frames;
  el.textContent = `${fps.toFixed(0)} fps · ${ms.toFixed(1)} ms/frame · zoom ${cam.zoom.toFixed(0)}`;
  el.className = "fps" + (fps < 30 ? " bad" : fps < 50 ? " slow" : "");
  m.frames = 0; m.work = 0; m.since = t;
}
function loop(t) {
  const t0 = performance.now();
  const dt = Math.min(0.05, (t - tPrev) / 1000); tPrev = t;
  advanceClock(dt);
  drawClock();
  updateRegrowth();
  watchSleep();
  if (!simulating) {
    if ((loop.panel = (loop.panel || 0) + dt) > 0.5) {
      loop.panel = 0; updateTrees(); lifeCycle(); updateFires(); updateFellings(); updateCaptives(); updateWear(); watchFireForWorkshop();
      if (inHand() === "torch") renderInventory();      // flame bar
      if (player.inside && !player.sleeping) renderContainers();     // the sleep button becomes enabled at dusk
      watchChest();                                                   // an open chest closes when you walk away
      if (basket) renderBasketButton();                               // the basket's wear bar
    }
    updateAnimals(dt, true);                          // with level of detail: far animals less often
    samplePopulation();
  }
  updateCharacter(dt);
  updateZoomReturn();                               // below zoom 30 (clouds) the camera comes back by itself
  if ($("follow").checked && player.i >= 0) {
    const [gx, gy] = nearCamera(player.x, player.y), f = 1 - Math.exp(-dt * 4);
    cam.tx += (gx - cam.tx) * f; cam.ty += (gy - cam.ty) * f; normalizeCamera();
  }
  draw();
  updateFps(t, performance.now() - t0);
  requestAnimationFrame(loop);
}
