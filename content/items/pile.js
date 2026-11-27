// Pile: something left on the ground (dropped, fallen out of a broken container, left by a fire…), drawn with its inventory
// icon; gathering it gives the whole stack back.
defineItem({
  id: "pile",
  name: "Pile",
  groundName: "Things on the ground",
  layer: "low",
  harvest: { time: 0.5, stack: o => o.stack },
  draw(it) {                 // the same icon as in the inventory, lying on the ground (no shadow)
    const p = it.p, scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
    drawItemIcon(it.o.stack?.type, p[0], p[1] - tall * 0.12, Math.max(12, scl * 0.36));
  },

});
