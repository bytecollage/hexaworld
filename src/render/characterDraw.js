// How the character is drawn; everything else is drawn by its content definition (draw(it)), collected here by finalizeRegistry().
const DRAW = {
  character(it) {                  // standing figure; when working it crouches or swings the axe, with a progress bar
    shadow(it.x, it.y, 0.4);
    const [scl, tall0] = sizes(it), tall = tall0 * 1.5, { p } = it, w = player.job, t = performance.now() / 1000;
    const walkCycle = player.route.length ? Math.sin(player.step * 14) : 0;
    const onGround = w && w.type !== "chop", crouch = onGround ? tall * 0.16 : 0;   // gather, build, cut: crouching
    const bx = p[0], by = p[1] - Math.abs(walkCycle) * scl * 0.06 + crouch, wide = 0.42 * scl, ground = p[1];
    ctx.lineCap = "round"; ctx.strokeStyle = "#2b2118"; ctx.lineWidth = Math.max(2, 0.14 * scl);
    ctx.beginPath();
    const opens = onGround ? wide * 0.12 : 0;           // crouching: knees apart
    ctx.moveTo(bx - wide * 0.18, by - tall * 0.38); ctx.lineTo(bx - wide * 0.18 - opens + walkCycle * wide * 0.25, ground);
    ctx.moveTo(bx + wide * 0.18, by - tall * 0.38); ctx.lineTo(bx + wide * 0.18 + opens - walkCycle * wide * 0.25, ground);
    ctx.stroke();
    ctx.fillStyle = "#c8453c"; ctx.strokeStyle = "#5a1d18"; ctx.lineWidth = Math.max(1, 0.05 * scl);
    ctx.beginPath(); ctx.ellipse(bx, by - tall * 0.58, wide * 0.5, tall * 0.24, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f1c9a0"; ctx.strokeStyle = "#7a5332";
    ctx.beginPath(); ctx.arc(bx, by - tall * 0.92, wide * 0.36, 0, TAU); ctx.fill(); ctx.stroke();
    const type = inHand();
    const hit = w ? Math.sin(t * (w.type === "chop" ? 9 : 11)) : 0;    // work rhythm
    const shoulder = [bx + wide * 0.38, by - tall * 0.66];
    let hx = bx + wide * 0.48, hy = by - tall * 0.55;
    if (onGround) { hx = bx + wide * 0.6; hy = by - tall * 0.3 + hit * tall * 0.1; }   // the hand works on the ground
    if (w) {                                          // moving arm
      ctx.strokeStyle = "#c8453c"; ctx.lineWidth = Math.max(2, 0.1 * scl);
      ctx.beginPath(); ctx.moveTo(...shoulder); ctx.lineTo(hx, hy); ctx.stroke();
    }
    if (type || w) circle(hx, hy, Math.max(1.5, scl * 0.035), "#f1c9a0");
    if (w?.type === "chop") {                        // axe blows: the axe swings back and strikes
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.4 + hit * 1.1);
      ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = Math.max(2, scl * 0.045);
      ctx.beginPath(); ctx.moveTo(0, tall * 0.05); ctx.lineTo(scl * 0.02, -tall * 0.32); ctx.stroke();
      ctx.fillStyle = "#a7b0b8"; ctx.beginPath();
      if (type === "hammer") ctx.rect(-scl * 0.05, -tall * 0.38, scl * 0.14, tall * 0.09);   // hammer head
      else { ctx.moveTo(scl * 0.01, -tall * 0.32); ctx.lineTo(scl * 0.13, -tall * 0.35); ctx.lineTo(scl * 0.12, -tall * 0.22); ctx.lineTo(scl * 0.015, -tall * 0.24); ctx.closePath(); }
      ctx.fill();
      ctx.restore();
      if (hit > 0.85) for (let k = 0; k < 3; k++)   // splinters when striking
        circle(hx + scl * (0.15 + 0.08 * k), hy - tall * (0.1 + 0.05 * Math.sin(t * 40 + k)), Math.max(1, scl * 0.018), "#c8a06a");
    } else if (type === "torch") {                 // lit torch held high
      ctx.strokeStyle = "#7a4e26"; ctx.lineWidth = Math.max(2, scl * 0.05);
      ctx.beginPath(); ctx.moveTo(hx - scl * 0.02, hy + tall * 0.08); ctx.lineTo(hx + scl * 0.05, hy - tall * 0.35); ctx.stroke();
      flames(hx + scl * 0.055, hy - tall * 0.33, scl * 0.5, tall * 0.32, t, 7);
    } else if (type === "axe") {
      ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = Math.max(2, scl * 0.045);
      ctx.beginPath(); ctx.moveTo(hx, hy + tall * 0.05); ctx.lineTo(hx + scl * 0.06, hy - tall * 0.3); ctx.stroke();
      ctx.fillStyle = "#a7b0b8"; ctx.beginPath();
      ctx.moveTo(hx + scl * 0.05, hy - tall * 0.3); ctx.lineTo(hx + scl * 0.17, hy - tall * 0.33); ctx.lineTo(hx + scl * 0.16, hy - tall * 0.2); ctx.lineTo(hx + scl * 0.055, hy - tall * 0.22); ctx.closePath(); ctx.fill();
    } else if (type === "knife") {
      ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = Math.max(2, scl * 0.04);
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + scl * 0.03, hy - tall * 0.08); ctx.stroke();
      ctx.strokeStyle = "#cfd6dc"; ctx.lineWidth = Math.max(1.5, scl * 0.03);
      ctx.beginPath(); ctx.moveTo(hx + scl * 0.03, hy - tall * 0.08); ctx.lineTo(hx + scl * 0.07, hy - tall * 0.22); ctx.stroke();
    } else if (type) {                               // any other object: its small icon in the hand
      ctx.font = `${Math.max(10, scl * 0.22)}px "Apple Color Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(ICONS[type] || "", hx + scl * 0.04, hy - tall * 0.04);
    }
    if (w?.type === "build") {                    // what is being made appears little by little on the ground, in front
      ctx.save(); ctx.globalAlpha *= 0.25 + 0.75 * (w.t / w.dur);
      ctx.font = `${Math.max(12, scl * 0.3)}px "Apple Color Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText({ torch: "🔥", campfire: "🔥", bonfire: "🔥", knife: "🔪", axe: "🪓" }[w.recipe] || "🔨", bx + wide * 1.1, ground - tall * 0.08);
      ctx.restore();
    }
    if (w) {                                          // progress bar above the head
      const bw = Math.max(26, scl * 0.75), bh = Math.max(4, scl * 0.07), x0 = bx - bw / 2, y0 = by - tall * 1.2 - bh;
      ctx.fillStyle = "rgba(10,12,16,.75)"; ctx.fillRect(x0 - 1, y0 - 1, bw + 2, bh + 2);
      ctx.fillStyle = "#e3b341"; ctx.fillRect(x0, y0, bw * Math.min(1, w.t / w.dur), bh);
    }
  },
};
