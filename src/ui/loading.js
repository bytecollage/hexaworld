// ---- the loading screen: it covers the page until the first frame is drawn (the clock, the map and the world appear
//      together), and again while a new world is generated.
// the curtain (sleeping, Next day): black over everything but the clock; the map is not drawn while it is fully down
let curtainDownAt = 0;
function curtain(down) {
  $("curtain").classList.toggle("down", down); document.body.classList.toggle("curtained", down);
  curtainDownAt = down ? performance.now() : 0;
}
const curtainHidesMap = () => curtainDownAt && performance.now() - curtainDownAt > 900;   // once it has finished falling
function hideLoading() {                                // fades out, then leaves the page (its animation stops)
  const el = $("loading"); el.classList.add("done");
  setTimeout(() => { if (el.classList.contains("done")) el.hidden = true; }, 500);
}
function afterPaint(fn) {                              // after the next frame is painted (two frames), or 120 ms at most:
  let done = false; const go = () => { if (!done) { done = true; fn(); } };   // pages with no frames (headless tools) go on anyway
  requestAnimationFrame(() => requestAnimationFrame(go)); setTimeout(go, 120);
}
function withLoading(text, fn, then = null) {          // shows the screen, lets the browser paint it, then runs fn (which may take a while)
  const el = $("loading"); $("loadingText").textContent = text; el.hidden = false; el.classList.remove("done");
  afterPaint(() => {
    fn();
    afterPaint(() => { hideLoading(); then?.(); });   // hidden once the new world has been drawn
  });
}
