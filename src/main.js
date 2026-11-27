finalizeRegistry();
resizeCanvas();
renderInventory();
// the first world is generated once the loading screen is painted (its hexagon is already turning); when the first frame
// has been drawn everything appears at once, and then the ladder falls
// `booted` resolves then: dev tools (fingerprints, gallery) wait for it before making their own worlds
const booted = new Promise(done => withLoading("Loading…", () => { generate(); makeAnimalIcons(); requestAnimationFrame(loop); }, () => { dropLadder(); done(); }));
