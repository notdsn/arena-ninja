/* Arena Ninja — efeitos visuais dos jutsus (canvas 2D + sprites pré-renderizados, aditivo) */
(function () {
  const NA = (globalThis.NA = globalThis.NA || {});
  const V = (NA.VFX = {});
  const R = Math.random, TAU = Math.PI * 2;
  let cv = null, g = null, W = 0, H = 0, dpr = 1, running = false, last = 0;
  let parts = [], fxs = [];
  V.timeScale = 1;
  V.q = 'alto';
  V.k = 1; // fator de duração (velocidade da batalha)
  V.qf = () => (V.q === 'alto' ? 1 : V.q === 'medio' ? 0.55 : 0.22);
  const ease = (p) => 1 - (1 - p) * (1 - p);
  const easeIn = (p) => p * p;
  const lerp = (a, b, p) => a + (b - a) * p;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms * V.k));

  function resize() {
    if (!cv) return;
    dpr = Math.min(window.devicePixelRatio || 1, V.q === 'alto' ? 2 : V.q === 'medio' ? 1.5 : 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  V.setQuality = (q) => { V.q = q || 'alto'; resize(); };
  V.init = function () {
    if (cv) return;
    cv = document.createElement('canvas'); cv.id = 'vfx'; document.body.appendChild(cv);
    g = cv.getContext('2d'); resize(); addEventListener('resize', resize);
  };

  const C = { blue: [70, 150, 255], cyan: [150, 225, 255], white: [255, 255, 255], orange: [255, 140, 40], red: [255, 40, 40], fire: [255, 105, 20], yellow: [255, 220, 90], green: [70, 235, 120], purple: [175, 85, 255], sand: [222, 180, 110], dark: [18, 8, 22], grey: [175, 175, 185], pink: [255, 120, 190], water: [50, 140, 255], gold: [255, 200, 60], brown: [120, 80, 45], black: [5, 5, 8] };
  V.C = C;
  const cache = {};
  function sprite(col, soft) {
    const key = col.join(',') + (soft ? 's' : 'g');
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    const [r, gg, b] = col;
    if (soft) { gr.addColorStop(0, `rgba(${r},${gg},${b},.95)`); gr.addColorStop(0.55, `rgba(${r},${gg},${b},.45)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); }
    else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, `rgba(${r},${gg},${b},.95)`); gr.addColorStop(0.55, `rgba(${r},${gg},${b},.28)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); }
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (cache[key] = c);
  }
  V.sprite = sprite;
  const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function frame(now) {
    const dt = Math.min(48, now - last) * V.timeScale; last = now;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    for (const e of fxs) {
      e.t += dt; const p = Math.min(1, e.t / e.dur);
      g.save();
      try { e.draw(g, p, e.t, dt); } catch (err) { e.t = e.dur; }
      g.restore();
      if (p >= 1 && e.done) { const d = e.done; e.done = null; d(); }
    }
    fxs = fxs.filter((e) => e.t < e.dur);
    const k = dt / 16.67;
    for (const p of parts) {
      p.life += dt;
      const dr = Math.pow(p.drag, k);
      p.vx *= dr; p.vy = p.vy * dr + p.grav * k;
      if (p.update) p.update(p, k);
      p.x += p.vx * k; p.y += p.vy * k; p.size += p.grow * k; p.rot += p.spin * k;
      const a = Math.max(0, 1 - p.life / p.max) * p.alpha;
      if (a <= 0.01 || p.size <= 0.3) continue;
      g.globalAlpha = Math.min(1, a);
      g.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      if (p.shape === 'line') { g.strokeStyle = p.color; g.lineWidth = p.lw; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * p.len, p.y - p.vy * p.len); g.stroke(); }
      else if (p.shape === 'rect') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.color; g.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.5); g.restore(); }
      else if (p.shape === 'blade') { g.save(); g.translate(p.x, p.y); g.rotate(Math.atan2(p.vy, p.vx)); g.fillStyle = p.color; g.beginPath(); g.moveTo(p.size, 0); g.lineTo(-p.size, -2); g.lineTo(-p.size, 2); g.closePath(); g.fill(); g.restore(); }
      else if (p.shape === 'text') { g.font = `bold ${p.size}px sans-serif`; g.textAlign = 'center'; g.fillStyle = p.color || '#fff'; g.fillText(p.text, p.x, p.y); }
      else g.drawImage(p.img, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    parts = parts.filter((p) => p.life < p.max);
    if (fxs.length || parts.length) requestAnimationFrame(frame);
    else { running = false; g.clearRect(0, 0, W, H); }
  }
  function kick() { if (!running && cv) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  V.active = () => fxs.length + parts.length;

  /** efeito desenhado por função; resolve quando termina */
  V.fx = function (dur, draw) {
    return new Promise((res) => {
      if (!cv) return res();
      dur = dur * V.k;
      fxs.push({ t: 0, dur, draw: (gg, p, t, dt) => draw(gg, p, t, dt), done: res });
      kick();
      setTimeout(res, dur * 4 + 400);
    });
  };
  V.part = function (o) {
    if (!cv) return;
    if (parts.length > 1600 * V.qf() + 120) return;
    parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 600, size: 10, grow: 0, drag: 0.96, grav: 0, alpha: 1, add: true, rot: 0, spin: 0, img: sprite(C.white) }, o, { max: (o.max || 600) * V.k }));
    kick();
  };
  V.emit = function (n, fn) { const m = Math.max(1, Math.round(n * V.qf())); for (let i = 0; i < m; i++) V.part(fn(i, m)); };

  // ---------- primitivas ----------
  V.burst = (x, y, col, n, spd, size, life, extra) => V.emit(n || 20, () => {
    const a = R() * TAU, s = (spd || 6) * (0.3 + R());
    return Object.assign({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: (size || 14) * (0.5 + R()), max: (life || 500) * (0.6 + R() * 0.6), img: sprite(col), drag: 0.9 }, extra || {});
  });
  V.ring = (x, y, col, maxR, dur, lw, squash) => V.fx(dur || 450, (g, p) => {
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = rgb(col, 1 - p); g.lineWidth = (lw || 6) * (1 - p) + 1;
    g.beginPath(); g.ellipse(x, y, (maxR || 80) * ease(p), (maxR || 80) * ease(p) * (squash || 0.8), 0, 0, TAU); g.stroke();
  });
  V.glow = (x, y, col, size, dur, pulse) => V.fx(dur || 400, (g, p, t) => {
    g.globalCompositeOperation = 'lighter';
    const s = size * (pulse ? 1 + 0.15 * Math.sin(t / 40) : 1) * (p < 0.2 ? p / 0.2 : 1);
    g.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
    g.drawImage(sprite(col), x - s / 2, y - s / 2, s, s);
  });
  V.flash = (col, a, dur) => { if (V.q === 'baixo') a *= 0.5; return V.fx(dur || 220, (g, p) => { g.fillStyle = rgb(col, (a || 0.5) * (1 - p)); g.fillRect(0, 0, W, H); }); };
  V.tint = (col, a, dur) => V.fx(dur || 800, (g, p) => {
    const al = a * Math.sin(Math.PI * Math.min(1, p * 1.15));
    const gr = g.createRadialGradient(W / 2, H * 0.35, 30, W / 2, H * 0.35, Math.max(W, H) * 0.8);
    gr.addColorStop(0, rgb(col, al * 0.55)); gr.addColorStop(1, rgb(col, al));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });
  V.smoke = (x, y, n, col, r) => V.emit(n || 12, () => ({ x: x + (R() - 0.5) * (r || 30), y: y + (R() - 0.5) * (r || 30) * 0.6, vx: (R() - 0.5) * 2.2, vy: -R() * 1.3, size: 18 + R() * 26, grow: 0.9, max: 650 + R() * 450, img: sprite(col || C.grey, true), add: false, alpha: 0.8, drag: 0.95 }));
  function jag(x1, y1, x2, y2, segs, amp) {
    const pts = [[x1, y1]]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 1; i < segs; i++) { const t = i / segs, o = (R() - 0.5) * amp * Math.sin(Math.PI * t) * 2; pts.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]); }
    pts.push([x2, y2]); return pts;
  }
  function strokePts(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts) g.lineTo(q[0], q[1]); g.stroke(); }
  V.bolt = (x1, y1, x2, y2, dur, col, w, amp) => V.fx(dur || 300, (g, p) => {
    if (R() < 0.12) return;
    const pts = jag(x1, y1, x2, y2, 12, amp || 26);
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = rgb(col || C.blue, 0.35 * (1 - p * 0.6)); g.lineWidth = (w || 3) * 5; strokePts(g, pts);
    g.strokeStyle = rgb(C.cyan, 0.8); g.lineWidth = (w || 3) * 1.8; strokePts(g, pts);
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = w || 3; strokePts(g, pts);
  });
  V.crackle = (x, y, r, dur, col) => V.fx(dur || 500, (g, p) => {
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const n = V.q === 'baixo' ? 1 : 3;
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, L = r * (0.5 + R() * 0.7);
      const pts = jag(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, 6, 12);
      g.strokeStyle = rgb(col || C.cyan, 0.5); g.lineWidth = 6; strokePts(g, pts);
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.8; strokePts(g, pts);
    }
    const s = r * 1.6 * (0.85 + R() * 0.3);
    g.globalAlpha = 0.9; g.drawImage(sprite(col || C.blue), x - s / 2, y - s / 2, s, s);
  });
  V.travel = (a, b, dur, draw, arc) => V.fx(dur, (g, p) => {
    const e = easeIn(p) * 0.4 + p * 0.6;
    const x = lerp(a.x, b.x, e), y = lerp(a.y, b.y, e) - Math.sin(Math.PI * e) * (arc || 0);
    draw(g, x, y, p);
  });
  V.crack = (x, y, size, dur) => {
    const lines = [];
    for (let i = 0; i < 8; i++) { const a = Math.PI + (i / 7) * Math.PI + (R() - 0.5) * 0.3; const L = size * (0.5 + R() * 0.6); lines.push(jag(x, y, x + Math.cos(a) * L * 1.4, y + Math.sin(a) * L * 0.35 + L * 0.12, 5, 10)); }
    lines.push(...lines.slice(0, 4).map((l) => l.map(([px, py]) => [x - (px - x), py])));
    return V.fx(dur || 900, (g, p) => {
      g.globalAlpha = p > 0.6 ? (1 - p) / 0.4 : 1; g.lineCap = 'round';
      g.strokeStyle = 'rgba(30,18,10,.9)'; g.lineWidth = 3.2; for (const l of lines) strokePts(g, l);
      g.strokeStyle = 'rgba(255,200,140,.45)'; g.lineWidth = 1; for (const l of lines) strokePts(g, l.map(([a, b]) => [a + 1, b - 1]));
    });
  };
  V.debris = (x, y, n, col) => V.emit(n || 16, () => ({ x, y, vx: (R() - 0.5) * 9, vy: -3 - R() * 7, grav: 0.45, drag: 0.98, size: 4 + R() * 6, spin: (R() - 0.5) * 0.4, shape: 'rect', color: col || '#7a5a3a', add: false, max: 800 + R() * 300 }));
  V.speedLines = (dur, dir) => V.fx(dur || 450, (g, p) => {
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,255,255,.28)';
    const n = V.q === 'baixo' ? 6 : 18;
    for (let i = 0; i < n; i++) { const y = R() * H, x = R() * W, L = 60 + R() * 160; g.lineWidth = 1 + R() * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * (dir || 1), y); g.stroke(); }
  });
  V.slash = (x, y, col, r, dir, dur) => V.fx(dur || 300, (g, p) => {
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const a0 = -2.2 * (dir || 1), sweep = 2.6 * ease(p) * (dir || 1);
    g.strokeStyle = rgb(col || C.white, 1 - p); g.lineWidth = 9 * (1 - p) + 2;
    g.beginPath(); g.arc(x, y, r || 40, a0, a0 + sweep, (dir || 1) < 0); g.stroke();
    g.strokeStyle = `rgba(255,255,255,${1 - p})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, (r || 40) - 2, a0, a0 + sweep, (dir || 1) < 0); g.stroke();
  });
  V.shake = (px, dur) => {
    const s = document.getElementById('stage'); if (!s || !s.animate || V.q === 'baixo' && px < 8) return;
    const k = []; for (let i = 0; i < 8; i++) { const f = 1 - i / 8; k.push({ transform: `translate(${(R() - 0.5) * 2 * px * f}px,${(R() - 0.5) * 2 * px * f}px)` }); }
    k.push({ transform: 'none' });
    s.animate(k, { duration: (dur || 320) * V.k, easing: 'linear' });
  };
  V.hitStop = async (ms) => { if (V.q === 'baixo') return; const t = V.timeScale; V.timeScale = 0.06; await new Promise((r) => setTimeout(r, ms)); V.timeScale = t; };
  V.slowmo = async (ms, s) => { if (V.q === 'baixo') return; V.timeScale = s || 0.4; await new Promise((r) => setTimeout(r, ms)); V.timeScale = 1; };

  function tomoe(g, x, y, r, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = col || '#d0141b'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.strokeStyle = '#000'; g.lineWidth = r * 0.07; g.beginPath(); g.arc(0, 0, r * 0.62, 0, TAU); g.stroke();
    g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, r * 0.2, 0, TAU); g.fill();
    for (let i = 0; i < 3; i++) {
      const a = (i * TAU) / 3, cx = Math.cos(a) * r * 0.62, cy = Math.sin(a) * r * 0.62;
      g.beginPath(); g.arc(cx, cy, r * 0.13, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(cx + Math.cos(a + 1.6) * r * 0.13, cy + Math.sin(a + 1.6) * r * 0.13);
      g.quadraticCurveTo(cx + Math.cos(a + 0.9) * r * 0.35, cy + Math.sin(a + 0.9) * r * 0.35, cx + Math.cos(a + 0.6) * r * 0.42, cy + Math.sin(a + 0.6) * r * 0.42);
      g.lineTo(cx + Math.cos(a - 1.6) * r * 0.13, cy + Math.sin(a - 1.6) * r * 0.13); g.fill();
    }
    g.restore();
  }
  function mangekyo(g, x, y, r, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = '#c00010'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.fillStyle = '#000';
    for (let i = 0; i < 3; i++) { g.rotate(TAU / 3); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(r * 0.9, -r * 0.2, r * 0.95, r * 0.35); g.quadraticCurveTo(r * 0.4, r * 0.15, 0, 0); g.fill(); }
    g.beginPath(); g.arc(0, 0, r * 0.25, 0, TAU); g.fill();
    g.restore();
  }
  function shark(g, x, y, s, dir, alpha) {
    g.save(); g.translate(x, y); g.scale(dir * s, s); g.globalAlpha = alpha;
    g.fillStyle = '#2f6fd8'; g.beginPath(); g.moveTo(40, 0); g.quadraticCurveTo(20, -18, -25, -8); g.lineTo(-45, -22); g.lineTo(-38, 0); g.lineTo(-45, 20); g.lineTo(-25, 8); g.quadraticCurveTo(15, 18, 40, 0); g.fill();
    g.fillStyle = '#cfe6ff'; g.beginPath(); g.moveTo(38, 2); g.quadraticCurveTo(10, 14, -22, 6); g.quadraticCurveTo(10, 6, 38, 2); g.fill();
    g.fillStyle = '#245bb5'; g.beginPath(); g.moveTo(0, -12); g.lineTo(-8, -32); g.lineTo(-14, -9); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(26, -4, 2.4, 0, TAU); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(36, 3); g.lineTo(24, 6); g.stroke();
    g.restore();
  }
  function blobPath(g, x, y, rx, ry, t) { g.beginPath(); for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; const w = 1 + 0.06 * Math.sin(a * 5 + t / 90); const px = x + Math.cos(a) * rx * w, py = y + Math.sin(a) * ry * w; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); }

  // ---------- cinematográfico ----------
  V.cine = async function (name, kanji, side, casterPos) {
    if (V.q === 'baixo') return;
    const stage = document.getElementById('stage');
    const ov = document.createElement('div'); ov.className = 'cine ' + (side ? 'foe' : 'me');
    ov.innerHTML = `<div class="cine-k">${kanji || ''}</div><div class="cine-n">${name}</div>`;
    const kl = [...(kanji || '')].length; ov.firstChild.style.fontSize = Math.min(170, (innerWidth * 0.88) / Math.max(2.4, kl)) + 'px';
    document.getElementById('fx-layer').appendChild(ov);
    if (stage && stage.animate && casterPos) {
      const r = stage.getBoundingClientRect();
      const ox = ((casterPos.x - r.left) / r.width) * 100, oy = ((casterPos.y - r.top) / r.height) * 100;
      stage.style.transformOrigin = `${ox}% ${oy}%`;
      stage.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)', offset: 0.4 }, { transform: 'scale(1.07)', offset: 0.75 }, { transform: 'scale(1)' }], { duration: 1050 * V.k, easing: 'ease-in-out' });
    }
    await wait(720);
    setTimeout(() => ov.remove(), 500 * V.k);
    ov.classList.add('out');
  };

  // ---------- DOM helpers ----------
  function domSprite(html, x, y, cls) {
    const d = document.createElement('div'); d.className = 'fxdom ' + (cls || ''); d.innerHTML = html;
    d.style.left = x + 'px'; d.style.top = y + 'px'; document.getElementById('fx-layer').appendChild(d); return d;
  }
  function anim(el, kf, dur, ease2) { if (!el.animate) { el.remove(); return; } const a = el.animate(kf, { duration: dur * V.k, easing: ease2 || 'ease-out', fill: 'forwards' }); a.onfinish = () => el.remove(); setTimeout(() => el.remove(), dur * V.k + 500); }
  function cloneOf(c, dx, dy, op) {
    const img = c.img; if (!img) return null;
    const r = img.getBoundingClientRect();
    const d = document.createElement('img'); d.src = img.src; d.className = 'fxclone' + (c.side ? ' flip' : '');
    d.style.left = r.left + dx + 'px'; d.style.top = r.top + dy + 'px'; d.style.width = r.width + 'px'; d.style.height = r.height + 'px'; d.style.opacity = op;
    document.getElementById('fx-layer').appendChild(d); return d;
  }

  // ---------- efeitos por jutsu ----------
  // c = { a: pos do usuário, ts: [pos alvos], dir, lunge(i)->ms, melee, harmful, side, img }
  const center = (ts) => ({ x: ts.reduce((s, t) => s + t.x, 0) / ts.length, y: ts.reduce((s, t) => s + t.y, 0) / ts.length });
  const hand = (c) => ({ x: c.a.x + c.dir * c.a.w * 0.28, y: c.a.y + c.a.h * 0.02 });
  const SK = (V.SK = {});
  const T0 = (c) => c.ts[0] || c.a;

  async function invulnPoof(c, col, emoji) {
    V.smoke(c.a.x, c.a.y, 18, col || C.grey, 40); V.burst(c.a.x, c.a.y, C.white, 10, 4, 12, 350);
    if (emoji) { const d = domSprite(emoji, c.a.x, c.a.y, 'big'); anim(d, [{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.2)', opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,40%) scale(1) rotate(25deg)', opacity: 0 }], 900); }
    await wait(380);
  }
  async function healFx(c, t, col) {
    V.glow(t.x, t.y, col || C.green, 120, 650);
    V.emit(26, () => ({ x: t.x + (R() - 0.5) * t.w * 0.8, y: t.y + t.h * 0.3 * R(), vy: -1 - R() * 2, vx: (R() - 0.5) * 0.6, size: 6 + R() * 8, max: 800, img: sprite(col || C.green), drag: 0.98 }));
    V.ring(t.x, t.bottom - 4, col || C.green, 46, 600, 4, 0.3);
    await wait(300);
  }
  async function auraFx(c, col, rise) {
    const a = c.a;
    V.ring(a.x, a.bottom - 4, col, 60, 600, 5, 0.3);
    V.emit(rise || 34, () => ({ x: a.x + (R() - 0.5) * a.w * 0.7, y: a.bottom - R() * a.h * 0.8, vy: -1.5 - R() * 2.5, vx: (R() - 0.5) * 0.6, size: 10 + R() * 14, grow: -0.12, max: 700 + R() * 300, img: sprite(col), drag: 0.97 }));
    V.glow(a.x, a.y, col, a.h * 1.1, 600);
    await wait(380);
  }
  function hitBurst(t, col, big) { V.burst(t.x, t.y, col, big ? 36 : 20, big ? 9 : 6, big ? 18 : 13, 500); V.ring(t.x, t.y, col, big ? 90 : 55, 420, big ? 8 : 5); if (big) V.flash(C.white, 0.25, 160); }

  // Naruto
  SK.naruto0 = async (c) => {
    const t = T0(c);
    V.smoke(c.a.x, c.a.y, 10, C.grey, 50);
    for (let i = 0; i < 2; i++) {
      const cl = cloneOf(c, (i ? -1 : 1) * 26, i ? -8 : 6, 0.85);
      if (cl) anim(cl, [{ transform: 'translateX(0)', opacity: 0.85 }, { transform: `translateX(${(t.x - c.a.x) * 0.75}px) translateY(${(t.y - c.a.y) * 0.5}px)`, opacity: 0.9, offset: 0.6 }, { transform: `translateX(${(t.x - c.a.x) * 0.75}px) translateY(${(t.y - c.a.y) * 0.5}px)`, opacity: 0 }], 650 + i * 120, 'ease-in');
    }
    const ms = c.lunge(0);
    await wait(ms);
    for (let i = 0; i < 3; i++) setTimeout(() => { hitBurst({ x: t.x + (R() - 0.5) * 30, y: t.y + (R() - 0.5) * 40 }, C.orange); V.smoke(t.x + (R() - 0.5) * 40, t.y, 4, C.grey, 30); }, i * 90 * V.k);
    await wait(200);
  };
  SK.naruto1 = async (c) => {
    const h = hand(c); let pos = { x: h.x, y: h.y };
    const sphere = (g, x, y, p, t, s) => {
      g.globalCompositeOperation = 'lighter';
      const r = 16 * s;
      g.drawImage(sprite(C.blue), x - r * 3, y - r * 3, r * 6, r * 6);
      for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(200,235,255,${0.8 - i * 0.12})`; g.lineWidth = 2.2; g.beginPath(); g.ellipse(x, y, r * (1 - i * 0.12), r * (0.45 + i * 0.12), t / 70 + i * 0.8, 0, TAU * 0.75); g.stroke(); }
      g.drawImage(sprite(C.white), x - r, y - r, r * 2, r * 2);
    };
    let live = true;
    V.fx(2600, (g, p, t) => { if (!live) return; sphere(g, pos.x, pos.y, p, t, Math.min(1, t / 380 + 0.2)); if (R() < 0.6) V.part({ x: pos.x + (R() - 0.5) * 50, y: pos.y + (R() - 0.5) * 50, vx: 0, vy: 0, update: (q) => { q.vx += (pos.x - q.x) * 0.02; q.vy += (pos.y - q.y) * 0.02; }, size: 5 + R() * 5, max: 400, img: sprite(C.cyan) }); });
    await wait(520);
    const t = T0(c); const start = { ...pos };
    const ms = c.lunge(0) * V.k;
    const t0 = performance.now();
    await new Promise((r) => { const step = () => { const p = Math.min(1, (performance.now() - t0) / ms); pos.x = lerp(start.x, t.x - c.dir * 14, p); pos.y = lerp(start.y, t.y, p); if (p < 1) requestAnimationFrame(step); else r(); }; requestAnimationFrame(step); });
    live = false;
    V.ring(t.x, t.y, C.cyan, 120, 520, 10); setTimeout(() => V.ring(t.x, t.y, C.blue, 170, 620, 6), 90);
    V.burst(t.x, t.y, C.cyan, 50, 11, 16, 600); V.flash(C.cyan, 0.35, 220);
    V.fx(500, (g, p) => { g.globalCompositeOperation = 'lighter'; const r = 40 + 90 * ease(p); g.globalAlpha = 1 - p; g.drawImage(sprite(C.blue), t.x - r, t.y - r, r * 2, r * 2); });
    V.shake(12, 380);
  };
  SK.naruto2 = async (c) => {
    const spots = [[-34, -6], [34, -10], [-16, 12], [18, 14]];
    V.smoke(c.a.x, c.a.y, 16, C.grey, 40);
    const clones = [];
    await wait(160);
    spots.forEach(([dx, dy], i) => { setTimeout(() => { V.smoke(c.a.x + dx, c.a.y + dy, 8, C.grey, 30); const cl = cloneOf(c, dx, dy, 0.9); if (cl) clones.push(cl); }, i * 90 * V.k); });
    await wait(820);
    clones.forEach((cl) => { const r = cl.getBoundingClientRect(); V.smoke(r.left + r.width / 2, r.top + r.height / 2, 6, C.grey, 30); cl.remove(); });
  };
  SK.naruto3 = (c) => invulnPoof(c, C.pink, '💋');
  // Sasuke
  SK.sasuke0 = async (c) => {
    const t = T0(c); V.speedLines(400, c.dir); const ms = c.lunge(0); await wait(ms);
    for (let i = 0; i < 4; i++) setTimeout(() => { V.slash(t.x + (R() - 0.5) * 20, t.y + (R() - 0.5) * 30, C.cyan, 30 + R() * 14, i % 2 ? 1 : -1, 260); V.burst(t.x, t.y, C.blue, 10, 5, 12, 350); }, i * 80 * V.k);
    await wait(260);
  };
  async function lightning(c, white) {
    const h = hand(c); let pos = { ...h }; let live = true;
    V.tint(C.black, 0.35, 1200);
    V.fx(2400, (g, p, t) => {
      if (!live) return;
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      const n = V.q === 'baixo' ? 1 : 4;
      for (let i = 0; i < n; i++) { const a = R() * TAU, L = 22 + R() * 34; const pts = jag(pos.x, pos.y, pos.x + Math.cos(a) * L, pos.y + Math.sin(a) * L, 6, 12); g.strokeStyle = rgb(white ? C.white : C.blue, 0.55); g.lineWidth = 6; strokePts(g, pts); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.6; strokePts(g, pts); }
      const s = 70 * (0.85 + R() * 0.3); g.globalAlpha = 0.95; g.drawImage(sprite(white ? C.cyan : C.blue), pos.x - s / 2, pos.y - s / 2, s, s);
    });
    await wait(560);
    const t = T0(c); const start = { ...pos }; const ms = c.lunge(0) * V.k; const t0 = performance.now();
    V.speedLines(ms / V.k + 100, c.dir);
    await new Promise((r) => { const step = () => { const p = Math.min(1, (performance.now() - t0) / ms); pos.x = lerp(start.x, t.x, p); pos.y = lerp(start.y, t.y, p); if (p < 1) requestAnimationFrame(step); else r(); }; requestAnimationFrame(step); });
    live = false;
    V.bolt(start.x, start.y, t.x, t.y, 260, C.blue, 3, 20);
    V.flash(C.white, 0.55, 200); V.crackle(t.x, t.y, 70, 520, white ? C.cyan : C.blue);
    V.burst(t.x, t.y, C.cyan, 40, 10, 14, 500); V.ring(t.x, t.y, C.cyan, 110, 420, 8); V.shake(12, 360);
  }
  SK.sasuke1 = (c) => lightning(c, false);
  SK.sasuke2 = async (c) => {
    const e = { x: c.a.x, y: c.a.top + c.a.h * 0.17 };
    V.tint(C.red, 0.35, 700);
    V.fx(800, (g, p) => { g.globalAlpha = Math.sin(Math.PI * p); tomoe(g, e.x, e.y, 26 + 30 * ease(p), p * 9, '#d0141b'); });
    V.glow(e.x, e.y, C.red, 120, 700);
    await wait(560);
  };
  SK.sasuke3 = (c) => invulnPoof(c, C.grey, '🪵');
  // Sakura
  SK.sakura0 = async (c) => {
    const t = T0(c); const ms = c.lunge(0); await wait(ms);
    V.crack(t.x, t.bottom - 2, 70, 1000); V.debris(t.x, t.bottom - 6, 22); V.burst(t.x, t.y, C.pink, 24, 8, 16, 420); V.ring(t.x, t.bottom - 4, C.pink, 90, 450, 6, 0.3);
    V.shake(10, 340); V.flash(C.white, 0.2, 140);
    await wait(140);
  };
  SK.sakura1 = (c) => healFx(c, T0(c), C.green);
  SK.sakura2 = async (c) => {
    await auraFx(c, C.pink, 30);
    V.part({ shape: 'text', text: 'SHANNARO!', x: c.a.x, y: c.a.top + 10, vy: -0.6, size: 18, color: '#ff8fc2', add: false, max: 900, drag: 1 });
  };
  SK.sakura3 = (c) => invulnPoof(c, C.grey, '🪵');
  // Kakashi
  SK.kakashi0 = (c) => lightning(c, true);
  SK.kakashi1 = async (c) => {
    const t = T0(c);
    for (let i = 0; i < 4; i++) setTimeout(() => {
      const x = t.x + (i - 1.5) * 18; V.debris(x, t.bottom - 2, 6, '#6b4a2a'); V.smoke(x, t.bottom - 6, 3, C.brown, 20);
      const d = domSprite(['🐕', '🐶', '🐕‍🦺', '🐩'][i], x, t.bottom, 'dog');
      anim(d, [{ transform: 'translate(-50%,0) scale(.4)', opacity: 0 }, { transform: `translate(-50%,-${30 + i * 12}px) scale(1.25) rotate(${(i - 1.5) * 12}deg)`, opacity: 1, offset: 0.45 }, { transform: `translate(-50%,-${20 + i * 10}px) scale(1.1)`, opacity: 1, offset: 0.8 }, { transform: 'translate(-50%,-10px) scale(.9)', opacity: 0 }], 900);
    }, i * 70 * V.k);
    await wait(420); hitBurst(t, C.orange);
  };
  SK.kakashi2 = async (c) => {
    const e = { x: c.a.x + c.dir * 4, y: c.a.top + c.a.h * 0.17 };
    V.fx(800, (g, p) => { g.globalAlpha = Math.sin(Math.PI * p); tomoe(g, e.x, e.y, 20 + 24 * ease(p), -p * 8); });
    V.fx(700, (g, p) => { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - p)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(c.a.x, c.a.y, c.a.w * 0.55, c.a.h * 0.6, 0, 0, TAU); g.stroke(); });
    await wait(500);
  };
  SK.kakashi3 = (c) => invulnPoof(c, C.grey, '🪵');
  // Rock Lee
  SK.lee0 = async (c) => {
    const t = T0(c); const ms = c.lunge(0); await wait(ms);
    V.fx(420, (g, p) => { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.8})`; g.lineWidth = 3; g.beginPath(); g.ellipse(t.x, t.y + 10, 30 + i * 12, 10 + i * 4, 0, p * 8 + i, p * 8 + i + 3.2); g.stroke(); } });
    V.emit(14, () => ({ x: t.x, y: t.y, vx: (R() - 0.5) * 10, vy: -R() * 6, grav: 0.15, size: 5, shape: 'rect', color: '#4ade80', add: false, spin: 0.3, max: 700 }));
    hitBurst(t, C.green); V.shake(6, 240);
  };
  SK.lee1 = async (c) => {
    const t = T0(c);
    V.speedLines(700, c.dir); V.tint(C.black, 0.3, 900);
    const ms = c.lunge(0); await wait(ms);
    V.fx(420, (g, p) => { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,255,255,${1 - p})`; g.lineWidth = 4; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(t.x, t.y, 20 + i * 9, p * 12 + i, p * 12 + i + 2); g.stroke(); } });
    await wait(180);
    V.crack(t.x, t.bottom - 2, 90, 1100); V.debris(t.x, t.bottom - 6, 30); V.smoke(t.x, t.bottom - 10, 14, C.brown, 70);
    V.ring(t.x, t.bottom - 4, C.white, 130, 520, 10, 0.3); V.flash(C.white, 0.45, 220); V.shake(16, 460);
  };
  SK.lee2 = async (c) => {
    V.flash(C.green, 0.25, 260);
    V.fx(1100, (g, p) => { if (R() < 0.8) V.part({ x: c.a.x + (R() - 0.5) * c.a.w * 0.8, y: c.a.bottom - R() * c.a.h * 0.5, vy: -2.5 - R() * 3, vx: (R() - 0.5), size: 14 + R() * 18, grow: -0.25, img: sprite(R() < 0.5 ? C.green : C.cyan), max: 600 }); });
    V.ring(c.a.x, c.a.bottom - 4, C.green, 70, 700, 6, 0.3);
    await wait(700);
  };
  SK.lee3 = async (c) => { const cl = cloneOf(c, 0, 0, 0.6); if (cl) anim(cl, [{ transform: 'translateX(0)', opacity: 0.6 }, { transform: `translateX(${-c.dir * 40}px)`, opacity: 0 }], 420); V.speedLines(300, -c.dir); await wait(300); };
  // Neji / Hinata
  async function gentleFist(c) {
    const t = T0(c); const ms = c.lunge(0); await wait(ms);
    V.glow(t.x, t.y, C.cyan, 90, 360);
    V.emit(10, () => ({ x: t.x + (R() - 0.5) * t.w * 0.5, y: t.y + (R() - 0.5) * t.h * 0.5, size: 10, img: sprite(C.cyan), max: 500, grow: -0.1 }));
    V.ring(t.x, t.y, C.cyan, 50, 360, 4);
  }
  SK.neji0 = gentleFist; SK.hinata0 = gentleFist;
  function trigram(x, y, r, dur, col) {
    return V.fx(dur, (g, p, t) => {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, Math.sin(Math.PI * p) * 1.6);
      g.save(); g.translate(x, y); g.scale(1, 0.32); g.rotate(t / 900);
      g.strokeStyle = rgb(col || C.cyan, 0.9); g.lineWidth = 3;
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.35, 0, TAU); g.stroke();
      for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); for (let j = 0; j < 3; j++) { g.beginPath(); g.moveTo(r * 0.5, -6 + j * 6); g.lineTo(r * 0.85, -6 + j * 6); g.stroke(); } }
      g.restore();
    });
  }
  SK.neji1 = async (c) => {
    const t = T0(c);
    trigram(c.a.x, c.a.bottom - 4, 70, 1700); trigram(t.x, t.bottom - 4, 60, 1700);
    const ms = c.lunge(0); await wait(ms);
    const steps = ['2', '4', '8', '16', '32', '64 Palmas!'];
    for (let i = 0; i < steps.length; i++) {
      const last = i === steps.length - 1;
      V.part({ shape: 'text', text: last ? steps[i] : steps[i] + ' Palmas', x: t.x + (R() - 0.5) * 30, y: t.top + 6 - i * 3, vy: -0.7, size: last ? 20 : 14, color: last ? '#bfe9ff' : '#fff', add: false, max: last ? 1100 : 500, drag: 1 });
      for (let j = 0; j < 3; j++) V.glow(t.x + (R() - 0.5) * t.w * 0.6, t.y + (R() - 0.5) * t.h * 0.6, C.cyan, 34, 240);
      await wait(last ? 160 : 110);
    }
    hitBurst(t, C.cyan, true); V.shake(10, 340);
  };
  SK.neji2 = async (c) => {
    const a = c.a;
    V.fx(1100, (g, p, t) => {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, Math.sin(Math.PI * p) * 1.4);
      const rx = a.w * 0.75, ry = a.h * 0.62;
      const gr = g.createRadialGradient(a.x, a.y, 10, a.x, a.y, rx * 1.2); gr.addColorStop(0, 'rgba(120,200,255,.05)'); gr.addColorStop(0.8, 'rgba(120,200,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(a.x, a.y + a.h * 0.1, rx, ry, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(220,245,255,.85)'; g.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(a.x, a.y + a.h * 0.1, rx * (0.6 + i * 0.07), ry * (0.95 - i * 0.04), 0, t / 60 + i, t / 60 + i + 2.1); g.stroke(); }
    });
    await wait(520);
    for (const t of c.ts) { V.ring(t.x, t.y, C.cyan, 70, 420, 5); V.burst(t.x, t.y, C.cyan, 14, 6, 12, 400); }
    V.ring(a.x, a.y, C.white, 200, 520, 6, 0.6); V.shake(8, 300);
  };
  async function byakugan(c) {
    const e = { x: c.a.x, y: c.a.top + c.a.h * 0.17 };
    V.tint([200, 200, 255], 0.22, 700);
    V.fx(800, (g, p) => { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.sin(Math.PI * p); g.strokeStyle = 'rgba(230,230,255,.9)'; g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.beginPath(); g.moveTo(e.x + Math.cos(a) * 10, e.y + Math.sin(a) * 6); g.lineTo(e.x + Math.cos(a) * (18 + 20 * p), e.y + Math.sin(a) * (10 + 12 * p)); g.stroke(); } g.drawImage(sprite([210, 210, 255]), e.x - 40, e.y - 40, 80, 80); });
    V.ring(e.x, e.y, [220, 220, 255], 80, 600, 3);
    await wait(500);
  }
  SK.neji3 = byakugan; SK.hinata2 = byakugan;
  SK.hinata1 = async (c) => {
    const a = c.a; trigram(a.x, a.bottom - 4, 70, 1100);
    V.fx(700, (g, p) => { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(150,220,255,${(1 - p) * 0.9})`; g.lineWidth = 3; g.beginPath(); g.arc(a.x, a.y, 30 + i * 10, p * 10 + i * 1.5, p * 10 + i * 1.5 + 1.4); g.stroke(); } });
    await wait(420);
    for (const t of c.ts) { V.travel(a, t, 260, (g, x, y) => { g.globalCompositeOperation = 'lighter'; g.drawImage(sprite(C.cyan), x - 22, y - 22, 44, 44); }); }
    await wait(260);
    for (const t of c.ts) { V.ring(t.x, t.y, C.cyan, 55, 380, 4); V.burst(t.x, t.y, C.cyan, 12, 5, 11, 380); }
  };
  SK.hinata3 = (c) => invulnPoof(c, [200, 200, 255]);
  // Gaara
  function sandStream(from, to, dur, n) {
    return V.fx(dur, (g, p) => {
      if (R() < 0.9) for (let i = 0; i < 3; i++) {
        const s = Math.min(1, p * 1.4) * (0.6 + R() * 0.4);
        const x = lerp(from.x, to.x, s) + (R() - 0.5) * 16, y = lerp(from.y, to.y, s) - Math.sin(Math.PI * s) * 40 + (R() - 0.5) * 16;
        V.part({ x, y, vx: (to.x - from.x) * 0.004, vy: 0.2, size: 5 + R() * 7, img: sprite(C.sand, true), add: false, alpha: 0.9, max: 380 });
      }
    });
  }
  SK.gaara0 = async (c) => {
    const t = T0(c), src = { x: c.a.x - c.dir * c.a.w * 0.2, y: c.a.y };
    sandStream(src, t, 520);
    await wait(420);
    V.fx(700, (g, p, tt) => {
      const sq = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3 * 0.5;
      for (let i = 0; i < 10; i++) { const a = tt / 70 + i * 0.63; const yy = t.bottom - (i / 10) * t.h * 0.95; V.part({ x: t.x + Math.cos(a) * t.w * 0.38 * sq, y: yy, size: 8 + R() * 6, img: sprite(C.sand, true), add: false, alpha: 0.9, max: 160 }); }
      g.globalAlpha = 0.55 * Math.min(1, p * 2); g.fillStyle = '#c8a26a'; blobPath(g, t.x, t.y + t.h * 0.05, t.w * 0.36 * sq, t.h * 0.52 * sq, tt); g.fill();
    });
    await wait(620);
    V.burst(t.x, t.y, C.sand, 30, 7, 14, 500, { add: false, img: sprite(C.sand, true) }); V.shake(8, 300);
  };
  SK.gaara1 = async (c) => {
    const t = T0(c), src = { x: c.a.x - c.dir * c.a.w * 0.2, y: c.a.y };
    sandStream(src, t, 520); V.tint(C.sand, 0.18, 1500);
    await wait(380);
    V.fx(1050, (g, p, tt) => {
      const rise = ease(Math.min(1, p * 1.7)), top = t.bottom - t.h * 1.05 * rise;
      const sq = p > 0.68 ? 1 - ((p - 0.68) / 0.32) * 0.5 : 1, hh = (t.bottom - top) / 2 + 4;
      g.save(); g.globalAlpha = 0.93 * (p > 0.93 ? (1 - p) / 0.07 : 1);
      const gr = g.createLinearGradient(0, top, 0, t.bottom); gr.addColorStop(0, '#f0d49c'); gr.addColorStop(1, '#8a6436'); g.fillStyle = gr;
      g.beginPath(); g.ellipse(t.x, t.bottom - hh, t.w * 0.44 * sq, hh, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,240,200,.55)'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const yy = top + (t.bottom - top) * (i + 0.5) / 6; g.beginPath(); g.ellipse(t.x, yy, t.w * 0.42 * sq, 6, 0, tt / 160 + i, tt / 160 + i + 2.4); g.stroke(); }
      g.restore();
      if (R() < 0.7) V.part({ x: t.x + (R() - 0.5) * t.w * 0.9, y: t.bottom, vx: (R() - 0.5) * 2, vy: -3 - R() * 3, grav: 0.05, size: 6 + R() * 8, img: sprite(C.sand, true), add: false, alpha: 0.9, max: 500 });
    });
    await wait(960);
    V.flash(C.sand, 0.45, 260);
    V.emit(80, () => ({ x: t.x + (R() - 0.5) * 30, y: t.y, vx: (R() - 0.5) * 13, vy: -4 - R() * 9, grav: 0.3, size: 8 + R() * 12, img: sprite(C.sand, true), add: false, max: 950, drag: 0.97 }));
    V.ring(t.x, t.bottom - 4, C.sand, 150, 600, 8, 0.3); V.debris(t.x, t.bottom - 6, 22, '#b48a52'); V.shake(18, 520);
    await wait(250);
  };
  SK.gaara2 = async (c) => {
    const t = T0(c);
    sandStream({ x: c.a.x, y: c.a.y }, t, 400);
    V.fx(800, (g, p, tt) => { for (let i = 0; i < 4; i++) { const a = tt / 90 + i * 1.57; V.part({ x: t.x + Math.cos(a) * t.w * 0.45, y: t.y + Math.sin(a) * t.h * 0.4, size: 7, img: sprite(C.sand, true), add: false, max: 200 }); } });
    await wait(700);
  };
  SK.gaara3 = async (c) => {
    const a = c.a;
    V.fx(1100, (g, p, tt) => { const h = a.h * 0.75 * ease(Math.min(1, p * 1.6)); g.globalAlpha = 0.8 * (p > 0.8 ? (1 - p) / 0.2 : 1); const gr = g.createLinearGradient(0, a.bottom - h, 0, a.bottom); gr.addColorStop(0, '#e6c48a'); gr.addColorStop(1, '#8a6436'); g.fillStyle = gr; g.beginPath(); g.ellipse(a.x, a.bottom, a.w * 0.62, h, 0, Math.PI, TAU); g.fill(); });
    V.emit(30, () => ({ x: a.x + (R() - 0.5) * a.w, y: a.bottom, vy: -2 - R() * 4, vx: (R() - 0.5) * 3, grav: 0.12, size: 6 + R() * 8, img: sprite(C.sand, true), add: false, max: 700 }));
    await wait(650);
  };
  // Shikamaru
  function shadowLine(from, to, dur) {
    return V.fx(dur, (g, p) => {
      const e = ease(Math.min(1, p * 1.3)), x = lerp(from.x, to.x, e);
      g.globalAlpha = p > 0.85 ? (1 - p) / 0.15 : 0.85;
      g.fillStyle = '#05030a'; g.beginPath();
      g.moveTo(from.x, from.y - 4); g.quadraticCurveTo((from.x + x) / 2, lerp(from.y, to.y, e * 0.5) - 6, x, lerp(from.y, to.y, e) - 3);
      g.lineTo(x, lerp(from.y, to.y, e) + 3); g.quadraticCurveTo((from.x + x) / 2, lerp(from.y, to.y, e * 0.5) + 6, from.x, from.y + 4); g.fill();
      g.beginPath(); g.ellipse(x, lerp(from.y, to.y, e), 12 + 18 * e, 5 + 4 * e, 0, 0, TAU); g.fill();
    });
  }
  SK.shikamaru0 = async (c) => {
    const t = T0(c);
    V.tint(C.black, 0.3, 1300);
    shadowLine({ x: c.a.x, y: c.a.bottom - 3 }, { x: t.x, y: t.bottom - 3 }, 1500);
    await wait(780);
    V.fx(700, (g, p) => { g.globalAlpha = 0.6 * Math.sin(Math.PI * p); g.fillStyle = '#000'; g.beginPath(); g.ellipse(t.x, t.y, t.w * 0.4, t.h * 0.55, 0, 0, TAU); g.fill(); });
  };
  SK.shikamaru1 = async (c) => {
    const t = T0(c);
    shadowLine({ x: c.a.x, y: c.a.bottom - 3 }, { x: t.x, y: t.bottom - 3 }, 1300);
    await wait(650);
    V.fx(700, (g, p) => { g.strokeStyle = 'rgba(5,3,10,.9)'; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const x0 = t.x + (i - 2) * 9, h = t.h * 0.7 * ease(Math.min(1, p * 1.5)); g.beginPath(); g.moveTo(x0, t.bottom); g.quadraticCurveTo(x0 + (i - 2) * 6, t.bottom - h * 0.6, t.x + (i - 2) * 3, t.bottom - h); g.stroke(); } });
    await wait(420);
  };
  SK.shikamaru2 = async (c) => { const a = c.a; V.ring(a.x, a.top + 10, C.white, 40, 800, 3); V.part({ shape: 'text', text: '💭', x: a.x + c.dir * 18, y: a.top, vy: -0.5, size: 26, add: false, max: 900, drag: 1 }); V.burst(a.x, a.top + 10, C.white, 8, 2, 8, 600); await wait(500); };
  SK.shikamaru3 = (c) => invulnPoof(c);
  // Itachi
  SK.itachi0 = async (c) => {
    const t = T0(c);
    V.fx(1300, (g, p) => { g.fillStyle = `rgba(120,0,0,${0.55 * Math.sin(Math.PI * p)})`; g.fillRect(0, 0, W, H); g.globalAlpha = Math.sin(Math.PI * p); mangekyo(g, W / 2, H * 0.3, 60 + 40 * p, p * 6); g.globalAlpha = 0.9 * Math.sin(Math.PI * p); g.fillStyle = '#000'; g.beginPath(); g.arc(W / 2, H * 0.3, 18 + 12 * p, 0, TAU); g.fill(); });
    await wait(900);
    V.fx(500, (g, p) => { g.globalAlpha = 1 - p; mangekyo(g, t.x, t.top + t.h * 0.2, 14 + 10 * p, -p * 5); });
    V.ring(t.x, t.y, C.red, 70, 420, 5);
  };
  SK.itachi1 = async (c) => {
    const t = T0(c);
    V.fx(500, (g, p) => { g.globalAlpha = Math.sin(Math.PI * p); mangekyo(g, c.a.x, c.a.top + c.a.h * 0.17, 16, p * 4); });
    await wait(380);
    V.fx(1100, () => { for (let i = 0; i < 3; i++) V.part({ x: t.x + (R() - 0.5) * t.w * 0.6, y: t.bottom - R() * t.h * 0.8, vy: -1.2 - R() * 2, vx: (R() - 0.5) * 0.6, size: 18 + R() * 16, grow: -0.15, img: sprite(C.black, true), add: false, alpha: 0.95, max: 700 }); if (R() < 0.5) V.part({ x: t.x + (R() - 0.5) * t.w * 0.6, y: t.bottom - R() * t.h * 0.7, vy: -1.5, size: 10, img: sprite([150, 20, 60]), max: 500 }); });
    await wait(500);
  };
  SK.itachi2 = async (c) => {
    const m = { x: c.a.x + c.dir * c.a.w * 0.22, y: c.a.top + c.a.h * 0.3 };
    let s = 0, live = true, pos = { ...m };
    V.fx(2600, (g, p, t) => {
      if (!live) return;
      g.globalCompositeOperation = 'lighter';
      const r = 18 + 50 * s;
      g.drawImage(sprite(C.fire), pos.x - r * 2, pos.y - r * 2, r * 4, r * 4);
      g.drawImage(sprite(C.yellow), pos.x - r, pos.y - r, r * 2, r * 2);
      for (let i = 0; i < 3; i++) V.part({ x: pos.x + (R() - 0.5) * r, y: pos.y + (R() - 0.5) * r, vx: -c.dir * (1 + R() * 2), vy: -R() * 1.5, size: r * (0.5 + R() * 0.5), grow: -0.6, img: sprite(R() < 0.5 ? C.fire : C.orange), max: 380 });
    });
    const t0 = performance.now();
    await new Promise((r) => { const step = () => { s = Math.min(1, (performance.now() - t0) / (500 * V.k)); if (s < 1) requestAnimationFrame(step); else r(); }; requestAnimationFrame(step); });
    const tgt = center(c.ts); const start = { ...pos }; const dur = 520 * V.k; const t1 = performance.now();
    await new Promise((r) => { const step = () => { const p = Math.min(1, (performance.now() - t1) / dur); pos.x = lerp(start.x, tgt.x, p); pos.y = lerp(start.y, tgt.y, p) - Math.sin(Math.PI * p) * 20; if (p < 1) requestAnimationFrame(step); else r(); }; requestAnimationFrame(step); });
    live = false;
    V.flash(C.orange, 0.5, 300); V.shake(16, 480);
    V.glow(tgt.x, tgt.y, C.fire, 360, 600);
    for (const t of c.ts) { V.burst(t.x, t.y, C.fire, 40, 10, 22, 650); V.emit(20, () => ({ x: t.x + (R() - 0.5) * 40, y: t.y, vx: (R() - 0.5) * 4, vy: -2 - R() * 4, grav: -0.02, size: 4 + R() * 4, img: sprite(C.yellow), max: 1100 + R() * 500 })); }
  };
  SK.itachi3 = async (c) => {
    V.smoke(c.a.x, c.a.y, 10, C.black, 40);
    for (let i = 0; i < 6; i++) { const d = domSprite('🐦‍⬛', c.a.x, c.a.y, 'crow'); const ang = -Math.PI / 2 + (i - 2.5) * 0.45; anim(d, [{ transform: 'translate(-50%,-50%) scale(.5)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * 140}px), calc(-50% + ${Math.sin(ang) * 120}px)) scale(1.2)`, opacity: 0 }], 900 + i * 40); }
    V.emit(16, () => ({ x: c.a.x, y: c.a.y, vx: (R() - 0.5) * 6, vy: -R() * 4, grav: 0.05, size: 6, shape: 'rect', color: '#111', add: false, spin: 0.2, max: 900 }));
    await wait(420);
  };
  // Kisame
  SK.kisame0 = async (c) => {
    const t = T0(c); const ms = c.lunge(0); await wait(ms);
    V.slash(t.x, t.y, C.water, 46, c.dir, 320); hitBurst(t, C.water);
    V.emit(14, () => ({ x: t.x + (R() - 0.5) * 30, y: t.y + (R() - 0.5) * 40, vx: 0, vy: 0, update: (q, k) => { q.vx += (c.a.x - q.x) * 0.006 * k; q.vy += (c.a.y - q.y) * 0.006 * k; }, drag: 0.9, size: 9, img: sprite(C.cyan), max: 800 }));
  };
  SK.kisame1 = async (c) => {
    const t = T0(c), s = { x: c.a.x + c.dir * 20, y: c.a.y };
    V.burst(s.x, s.y, C.water, 16, 5, 14, 400);
    await V.travel(s, t, 620, (g, x, y, p) => { shark(g, x, y, 1.1, c.dir, 1); V.part({ x: x - c.dir * 30, y: y + (R() - 0.5) * 14, vx: -c.dir * 1.5, vy: (R() - 0.5), size: 10 + R() * 8, img: sprite(C.water), max: 400 }); }, 30);
    V.burst(t.x, t.y, C.water, 40, 9, 16, 600); V.emit(24, () => ({ x: t.x, y: t.y, vx: (R() - 0.5) * 9, vy: -3 - R() * 6, grav: 0.35, size: 6 + R() * 6, img: sprite(C.cyan), max: 800 }));
    V.ring(t.x, t.y, C.water, 90, 450, 6); V.shake(9, 320);
  };
  SK.kisame2 = async (c) => {
    const st = document.getElementById('stage').getBoundingClientRect();
    const x0 = c.dir > 0 ? st.left : st.right, x1 = c.dir > 0 ? st.right : st.left;
    await V.fx(1100, (g, p, tt) => {
      const front = lerp(x0, x1, ease(p)); const top = st.top + st.height * 0.25;
      const gr = g.createLinearGradient(0, top, 0, st.bottom); gr.addColorStop(0, 'rgba(120,200,255,.85)'); gr.addColorStop(1, 'rgba(20,70,170,.9)');
      g.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1; g.fillStyle = gr; g.beginPath(); g.moveTo(x0, st.bottom);
      for (let i = 0; i <= 20; i++) { const x = lerp(x0, front, i / 20); g.lineTo(x, top + 20 + Math.sin(i * 0.9 + tt / 80) * 12 + (1 - i / 20) * 30); }
      g.lineTo(front, st.bottom); g.closePath(); g.fill();
      if (R() < 0.8) V.part({ x: front, y: top + 20 + R() * st.height * 0.5, vx: c.dir * (2 + R() * 3), vy: -R() * 3, grav: 0.15, size: 8 + R() * 8, img: sprite(C.white), max: 500 });
    });
    for (const t of c.ts) V.burst(t.x, t.y, C.water, 16, 6, 14, 450);
    V.shake(12, 420);
  };
  SK.kisame3 = async (c) => { V.emit(30, () => ({ x: c.a.x, y: c.a.y, vx: (R() - 0.5) * 7, vy: -2 - R() * 5, grav: 0.3, size: 7 + R() * 6, img: sprite(C.water), max: 700 })); V.smoke(c.a.x, c.a.y, 8, C.cyan, 40); await wait(380); };
  // Orochimaru
  SK.orochimaru0 = async (c) => {
    const t = T0(c), h = hand(c);
    V.fx(320, (g, p) => { g.globalCompositeOperation = 'lighter'; const e = ease(p); g.strokeStyle = 'rgba(230,240,255,.95)'; g.lineWidth = 3; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(lerp(h.x, t.x, e), lerp(h.y, t.y, e)); g.stroke(); g.drawImage(sprite(C.white), lerp(h.x, t.x, e) - 14, lerp(h.y, t.y, e) - 14, 28, 28); });
    await wait(300); V.slash(t.x, t.y, C.white, 44, c.dir, 300); hitBurst(t, C.purple);
  };
  function snake(g, a, b, p, off, col) {
    const e = ease(Math.min(1, p * 1.3)); const N = 24; const pts = [];
    for (let i = 0; i <= N; i++) { const s = (i / N) * e; const x = lerp(a.x, b.x, s), y = lerp(a.y, b.y, s) + Math.sin(s * 14 + off) * 12 * (1 - s * 0.5) + off * 4; pts.push([x, y]); }
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#2a1a33'; g.lineWidth = 9; strokePts(g, pts); g.strokeStyle = col; g.lineWidth = 6; strokePts(g, pts);
    const hd = pts[pts.length - 1]; g.fillStyle = col; g.beginPath(); g.ellipse(hd[0], hd[1], 7, 5, Math.atan2(b.y - a.y, b.x - a.x), 0, TAU); g.fill();
    g.fillStyle = '#ffe14a'; g.beginPath(); g.arc(hd[0] + 2, hd[1] - 2, 1.5, 0, TAU); g.fill();
  }
  SK.orochimaru1 = async (c) => {
    const t = T0(c), h = hand(c);
    V.fx(900, (g, p) => { g.globalAlpha = p > 0.8 ? (1 - p) / 0.2 : 1; snake(g, h, t, p, 0, '#7a9a4a'); snake(g, h, { x: t.x, y: t.y - 14 }, p, 2, '#6a4a8a'); snake(g, h, { x: t.x, y: t.y + 14 }, p, 4, '#8aa060'); });
    await wait(620); hitBurst(t, C.purple);
  };
  SK.orochimaru2 = async (c) => {
    const t = T0(c);
    const ms = c.lunge(0); await wait(ms);
    V.fx(1000, (g, p) => { g.globalAlpha = Math.sin(Math.PI * p); const x = t.x - c.dir * 6, y = t.top + t.h * 0.3; g.fillStyle = '#111'; for (let i = 0; i < 3; i++) { const a = (i * TAU) / 3 + p * 2; g.beginPath(); g.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 3.5, 0, TAU); g.fill(); } g.strokeStyle = '#111'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 13, 0, TAU); g.stroke(); });
    V.fx(900, () => { if (R() < 0.7) V.part({ x: t.x + (R() - 0.5) * t.w * 0.5, y: t.y + (R() - 0.5) * t.h * 0.5, vy: -1.2, size: 12, img: sprite(C.purple), max: 500 }); });
    await wait(300);
  };
  SK.orochimaru3 = (c) => invulnPoof(c, C.purple);
  // Tenten
  function bladeRain(ts, n) {
    for (const t of ts) V.emit(n || 22, (i) => ({ x: t.x + (R() - 0.5) * t.w * 0.9, y: t.top - 120 - R() * 120, vx: (R() - 0.5) * 1.5, vy: 12 + R() * 6, shape: 'blade', size: 8, color: '#dfe6ee', add: false, max: 380 + R() * 220, drag: 1 }));
  }
  SK.tenten0 = async (c) => {
    const a = c.a;
    V.fx(700, (g, p, tt) => { g.globalCompositeOperation = 'lighter'; for (let s = 0; s < 2; s++) { g.strokeStyle = s ? 'rgba(255,200,90,.8)' : 'rgba(120,220,255,.8)'; g.lineWidth = 4; g.beginPath(); for (let i = 0; i <= 30; i++) { const k = i / 30 * p; const x = a.x + Math.sin(k * 16 + s * Math.PI) * 24, y = a.bottom - k * (a.h + 120); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } });
    await wait(560); bladeRain(c.ts, 26); await wait(380);
    for (const t of c.ts) V.burst(t.x, t.y, C.white, 12, 5, 10, 350);
  };
  SK.tenten1 = async (c) => {
    const t = T0(c), h = hand(c);
    V.part({ shape: 'text', text: '📜', x: h.x, y: h.y, vy: -0.4, size: 26, add: false, max: 600, drag: 1 }); V.smoke(h.x, h.y, 6, C.grey, 20);
    for (let i = 0; i < 6; i++) setTimeout(() => V.part({ x: h.x, y: h.y + (R() - 0.5) * 20, vx: (t.x - h.x) / 18, vy: (t.y - h.y) / 18 + (R() - 0.5) * 2, shape: 'blade', size: 9, color: '#e8eef5', add: false, max: 300 * V.k / V.k, drag: 1 }), i * 50 * V.k);
    await wait(380); V.burst(t.x, t.y, C.white, 14, 6, 12, 380);
  };
  SK.tenten2 = async (c) => { const a = c.a; V.fx(700, (g, p) => { g.strokeStyle = `rgba(255,120,40,${1 - p})`; g.lineWidth = 2.5; const r = 40 - 18 * p; g.beginPath(); g.arc(a.x, a.y, r, 0, TAU); g.moveTo(a.x - r - 8, a.y); g.lineTo(a.x + r + 8, a.y); g.moveTo(a.x, a.y - r - 8); g.lineTo(a.x, a.y + r + 8); g.stroke(); }); await auraFx(c, C.orange, 16); };
  SK.tenten3 = (c) => invulnPoof(c, C.grey, '⛓️');
  // Kiba
  function drill(g, x, y, s, t, dir) {
    g.save(); g.translate(x, y); g.scale(dir, 1);
    for (let i = 0; i < 7; i++) { const r = (26 - i * 3) * s; g.strokeStyle = i % 2 ? 'rgba(210,210,220,.85)' : 'rgba(120,110,100,.85)'; g.lineWidth = 4; g.beginPath(); g.ellipse(-i * 7 * s, 0, 6 * s, r, 0, t / 30 + i, t / 30 + i + 4.4); g.stroke(); }
    g.restore();
  }
  SK.kiba0 = async (c) => {
    for (const t of c.ts) {
      V.travel(c.a, t, 560, (g, x, y) => { drill(g, x, y, 1, performance.now(), c.dir); if (R() < 0.6) V.part({ x, y: y + 20, vx: -c.dir * 2, vy: -R() * 2, size: 14, img: sprite(C.brown, true), add: false, alpha: 0.6, max: 400 }); }, 16);
    }
    await wait(560);
    for (const t of c.ts) { hitBurst(t, C.white); V.debris(t.x, t.bottom - 6, 10); }
    V.shake(10, 340);
  };
  SK.kiba1 = async (c) => { V.smoke(c.a.x, c.a.y, 18, C.grey, 50); const cl = cloneOf(c, c.dir * -28, 4, 0); if (cl) anim(cl, [{ opacity: 0 }, { opacity: 0.9, offset: 0.4 }, { opacity: 0 }], 900); await wait(500); };
  SK.kiba2 = async (c) => { const t = T0(c); V.emit(16, () => ({ x: c.a.x, y: c.a.y, vx: (t.x - c.a.x) / 22 + (R() - 0.5) * 2, vy: (t.y - c.a.y) / 22 + (R() - 0.5) * 2, size: 8, img: sprite(C.yellow), max: 500, drag: 1 })); await wait(420); V.ring(t.x, t.y, C.yellow, 50, 500, 4); };
  SK.kiba3 = (c) => invulnPoof(c);
  // Shino
  function swarm(from, to, n, dur) {
    V.emit(n, () => ({ x: from.x + (R() - 0.5) * 30, y: from.y + (R() - 0.5) * 30, vx: (R() - 0.5) * 4, vy: (R() - 0.5) * 4, drag: 0.9, size: 3 + R() * 2.5, img: sprite([25, 25, 20], true), add: false, alpha: 1, max: dur + R() * 300, update: (q, k) => { q.vx += ((to.x - q.x) * 0.01 + (R() - 0.5) * 1.6) * k; q.vy += ((to.y - q.y) * 0.01 + (R() - 0.5) * 1.6) * k; } }));
  }
  SK.shino0 = async (c) => { const t = T0(c); swarm(c.a, t, 90, 1300); await wait(700); V.ring(t.x, t.y, C.purple, 40, 400, 3); };
  SK.shino1 = async (c) => {
    const t = T0(c); swarm(c.a, t, 80, 1200); await wait(650);
    V.emit(14, () => ({ x: t.x + (R() - 0.5) * 30, y: t.y, update: (q, k) => { q.vx += (c.a.x - q.x) * 0.006 * k; q.vy += (c.a.y - q.y) * 0.006 * k; }, drag: 0.9, size: 9, img: sprite(C.blue), max: 800 }));
  };
  SK.shino2 = async (c) => { for (const t of c.ts) swarm(c.a, t, 50, 1200); await wait(600); for (const t of c.ts) V.ring(t.x, t.y, [90, 110, 80], 50, 600, 4); };
  SK.shino3 = async (c) => { swarm(c.a, { x: c.a.x, y: c.a.y - 40 }, 70, 900); await wait(380); };

  // ---------- genéricos por tipo de chakra ----------
  const TYPE_COL = { tai: C.green, blood: C.red, nin: C.blue, gen: C.purple, rand: C.white };
  V.generic = async (c, sk) => {
    const types = ['tai', 'blood', 'nin', 'gen'];
    let main = 'rand', mx = 0; for (const k of types) if ((sk.cost[k] || 0) > mx) { mx = sk.cost[k]; main = k; }
    const col = TYPE_COL[main];
    if (!c.harmful) {
      if (sk.desc.includes('invulnerável')) return invulnPoof(c);
      if (sk.desc.match(/cura/i)) return healFx(c, T0(c), C.green);
      for (const t of c.ts) V.ring(t.x, t.bottom - 4, col, 50, 600, 4, 0.3);
      return auraFx(c, col, 22);
    }
    if (c.melee) { const ms = c.lunge(0); await wait(ms); for (const t of c.ts) { V.slash(t.x, t.y, col, 36, c.dir, 260); hitBurst(t, col); } return; }
    if (main === 'gen') { for (const t of c.ts) V.fx(600, (g, p) => { g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgb(col, 1 - p); g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.4 + p * 6, r = i * 1.3 * (1 - p * 0.5); i ? g.lineTo(t.x + Math.cos(a) * r, t.y + Math.sin(a) * r) : g.moveTo(t.x, t.y); } g.stroke(); }); await wait(420); return; }
    const h = hand(c);
    await Promise.all(c.ts.map((t) => V.travel(h, t, 380, (g, x, y) => { g.globalCompositeOperation = 'lighter'; g.drawImage(sprite(col), x - 24, y - 24, 48, 48); V.part({ x, y, size: 14, grow: -0.4, img: sprite(col), max: 260 }); }, 26)));
    for (const t of c.ts) hitBurst(t, col);
  };

  // ---------- especiais (cinematográfico) ----------
  V.ULT = {
    naruto1: ['Rasengan', '螺旋丸'], sasuke1: ['Chidori', '千鳥'], kakashi0: ['Raikiri', '雷切'], itachi2: ['Katon: Goukakyuu no Jutsu', '豪火球'],
    itachi0: ['Tsukuyomi', '月読'], itachi1: ['Amaterasu', '天照'], gaara1: ['Sabaku Sousou', '砂瀑送葬'], gaara0: ['Sabaku Kyuu', '砂縛柩'],
    neji1: ['Hakke Rokujuuyon Shou', '八卦六十四掌'], lee1: ['Omote Renge', '表蓮華'], kisame2: ['Bakusui Shouha', '爆水衝波'],
    tenten0: ['Soushouryuu', '双昇龍'], kiba0: ['Gatsuuga', '牙通牙'], shikamaru0: ['Kagemane no Jutsu', '影真似'], naruto2: ['Kage Bunshin no Jutsu', '影分身'], neji2: ['Hakkeshou Kaiten', '回天'],
  };

  // ---------- vitória / derrota ----------
  V.victory = (win) => {
    if (win) {
      V.fx(2600, (g, p, t) => { g.globalCompositeOperation = 'lighter'; g.save(); g.translate(W / 2, H * 0.3); g.rotate(t / 1500); for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.fillStyle = `rgba(255,190,80,${0.12 * Math.sin(Math.PI * p)})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.max(W, H), -60); g.lineTo(Math.max(W, H), 60); g.fill(); } g.restore(); });
      const cols = ['#ff7a1a', '#ffd27a', '#35c24a', '#2f80ed', '#f4f4f4', '#e33b3b'];
      V.emit(140, () => ({ x: R() * W, y: -20 - R() * H * 0.4, vx: (R() - 0.5) * 2, vy: 2 + R() * 3, grav: 0.03, drag: 0.995, size: 6 + R() * 5, shape: 'rect', color: cols[Math.floor(R() * cols.length)], spin: (R() - 0.5) * 0.3, add: false, max: 2600 }));
    } else {
      V.tint(C.black, 0.5, 2400);
      V.emit(80, () => ({ x: R() * W, y: -10 - R() * H * 0.5, vx: (R() - 0.5), vy: 0.8 + R() * 1.4, size: 3 + R() * 4, img: sprite(C.grey, true), add: false, alpha: 0.7, max: 2600, drag: 1 }));
    }
  };
})();
