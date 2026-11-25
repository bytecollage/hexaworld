function drawClock() {
  const cv = $("clock"), c = cv.getContext("2d"), S = cv.width, R = S / 2;
  const keyOf = clock.day * 10000 + Math.floor(clock.t * 4000);   // redraw ~4000 times per day
  if (keyOf === clock.drawnAt) return;
  clock.drawnAt = keyOf;
  c.clearRect(0, 0, S, S);
  c.save(); c.translate(R, R);
  const ang = f => -Math.PI / 2 + f * Math.PI * 2;                  // 0 = top, clockwise
  const rIn = R * 0.80;
  // wooden ring
  c.beginPath(); c.arc(0, 0, R * 0.97, 0, Math.PI * 2);
  const hoop = c.createRadialGradient(0, 0, R * 0.78, 0, 0, R * 0.97);
  hoop.addColorStop(0, "#5a3b1e"); hoop.addColorStop(0.5, "#8a5e33"); hoop.addColorStop(1, "#4a2f17");
  c.fillStyle = hoop; c.fill();
  c.lineWidth = 3; c.strokeStyle = "#2b1a0c"; c.stroke();
  // dial: segments alternating shade within each phase
  const SEGMENTS = 24, seasonInfo = season(), PHASES = phasesOf(seasonInfo);
  const cuts = [...new Set([...Array.from({ length: SEGMENTS + 1 }, (_, g) => g / SEGMENTS), ...PHASES.map(f => f.until)])].sort((a, b) => a - b);
  for (let k = 0; k + 1 < cuts.length; k++) {     // segments alternating shade, split where the phase changes
    const f0 = cuts[k], f1 = cuts[k + 1], m = (f0 + f1) / 2, phase = PHASES.find(f => m < f.until) || PHASES[2];
    if (f1 - f0 < 1e-6) continue;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, rIn, ang(f0), ang(f1)); c.closePath();
    c.fillStyle = Math.floor(m * SEGMENTS) % 2 ? phase.dark : phase.color; c.fill();
  }
  // gap between segments and between phases
  c.strokeStyle = "rgba(40,25,10,.35)"; c.lineWidth = 1;
  for (let g = 0; g < SEGMENTS; g++) {
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang(g / SEGMENTS)) * rIn, Math.sin(ang(g / SEGMENTS)) * rIn); c.stroke();
  }
  c.strokeStyle = "#2b1a0c"; c.lineWidth = 3;
  for (const f of [0, ...PHASES.slice(0, 2).map(f => f.until)]) {
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang(f)) * rIn, Math.sin(ang(f)) * rIn); c.stroke();
  }
  // shading: the part of the day already elapsed looks somewhat duller
  c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, rIn, ang(0), ang(clock.t)); c.closePath();
  c.fillStyle = "rgba(0,0,0,.22)"; c.fill();
  c.beginPath(); c.arc(0, 0, rIn, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = "#2b1a0c"; c.stroke();
  // soft glow over the dial
  const glow = c.createRadialGradient(-R * 0.3, -R * 0.35, 0, 0, 0, rIn);
  glow.addColorStop(0, "rgba(255,255,255,.22)"); glow.addColorStop(1, "rgba(255,255,255,0)");
  c.beginPath(); c.arc(0, 0, rIn, 0, Math.PI * 2); c.fillStyle = glow; c.fill();
  // hand
  c.save(); c.rotate(clock.t * Math.PI * 2);
  c.beginPath(); c.moveTo(0, -R * 0.93); c.lineTo(R * 0.07, -R * 0.2); c.lineTo(0, R * 0.12); c.lineTo(-R * 0.07, -R * 0.2); c.closePath();
  c.fillStyle = "#1c1612"; c.fill(); c.lineWidth = 2; c.strokeStyle = "#e9dcc0"; c.stroke();
  c.restore();
  c.beginPath(); c.arc(0, 0, R * 0.07, 0, Math.PI * 2); c.fillStyle = "#b08a4a"; c.fill();
  c.lineWidth = 2; c.strokeStyle = "#2b1a0c"; c.stroke();
  // text: current day and phase
  c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `bold ${Math.round(R * 0.36)}px Georgia, 'Times New Roman', serif`;
  c.lineWidth = R * 0.07; c.strokeStyle = "#1a120b"; c.lineJoin = "round";
  c.strokeText(`Day ${clock.day}`, 0, R * 0.30); c.fillStyle = "#fbf6ea"; c.fillText(`Day ${clock.day}`, 0, R * 0.30);
  c.font = `600 ${Math.round(R * 0.15)}px system-ui, sans-serif`;
  c.lineWidth = R * 0.045;
  c.strokeText(currentPhase().name, 0, R * 0.56); c.fillStyle = "#f1e6c8"; c.fillText(currentPhase().name, 0, R * 0.56);
  // season: medallion at the top left
  const mx = -R * 0.70, my = -R * 0.70, mr = R * 0.27;
  c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fillStyle = seasonInfo.bg; c.fill();
  c.lineWidth = R * 0.05; c.strokeStyle = "#2b1a0c"; c.stroke();
  c.beginPath(); c.arc(mx, my, mr - R * 0.05, 0, Math.PI * 2); c.lineWidth = R * 0.025; c.strokeStyle = "rgba(255,255,255,.45)"; c.stroke();
  c.font = `${Math.round(mr * 1.15)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  c.fillText(seasonInfo.icon, mx, my + mr * 0.06);
  c.restore();
  const seasonDay = ((clock.day - 1) % SEASON_DAYS) + 1;
  $("clockBox").title = `${seasonInfo.name} · day ${seasonDay} of ${SEASON_DAYS} · year ${gameYear() + 1}\n` +
    `Day ${Math.round(seasonInfo.day * 100)}% · dusk ${Math.round(seasonInfo.dusk * 100)}% · night ${Math.round((1 - seasonInfo.day - seasonInfo.dusk) * 100)}%`;
}
