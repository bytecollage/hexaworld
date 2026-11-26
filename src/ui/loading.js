// ---- the loading screen: it covers the page until the first frame is drawn (the clock, the map and the world appear
//      together), and again while a new world is generated.
function hideLoading() { $("loading").classList.add("done"); }
function withLoading(text, fn) {                        // shows the screen, lets the browser paint it, then runs fn (which may take a while)
  $("loadingText").textContent = text; $("loading").classList.remove("done");
  requestAnimationFrame(() => requestAnimationFrame(() => {   // two frames: the first one paints the screen
    fn();
    requestAnimationFrame(() => requestAnimationFrame(hideLoading));   // hidden once the new world has been drawn
  }));
}
