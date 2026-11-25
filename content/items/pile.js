// Pile: something left on the ground (what the house stored when it fell down); gathering it gives the whole stack back.
defineItem({
  id: "pile",
  name: "Pile",
  groundName: "Things on the ground",
  layer: "low",
  harvest: { time: 0.5, stack: o => o.stack },
  draw(it) {                 // a small heap of sacks with the icon of what it holds
    const p = it.p, scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.22, 0.16); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill();
    circle(p[0] - scl * 0.07, p[1] - tall * 0.06, scl * 0.09, "#a88a5a");
    circle(p[0] + scl * 0.07, p[1] - tall * 0.05, scl * 0.08, "#94784c");
    const t = it.o.stack?.type, icon = t && (ICONS[t] || RECIPE_ICON[t]);
    if (icon && !icon.startsWith("<")) {
      ctx.font = `${Math.max(10, scl * 0.22)}px "Apple Color Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(icon, p[0], p[1] - tall * 0.2);
    }
  },
});
