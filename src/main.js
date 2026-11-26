finalizeRegistry();
resizeCanvas();
renderInventory();
generate();
requestAnimationFrame(loop);
requestAnimationFrame(() => requestAnimationFrame(() => { hideLoading(); dropLadder(); }));   // after the first frame: everything appears at once, then the ladder falls
