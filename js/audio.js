/* Arena Ninja — efeitos sonoros sintetizados (WebAudio, sem arquivos) */
(function () {
  const NA = (globalThis.NA = globalThis.NA || {});
  let ctx = null;
  NA.sfxEnabled = true;
  function ac() {
    if (!ctx) { const C = globalThis.AudioContext || globalThis.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  NA.unlockAudio = () => { try { ac(); } catch (e) {} };
  function tone(freq, dur, type, vol, slide) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.12, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
  }
  function noise(dur, vol) {
    const a = ac(); if (!a) return;
    const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1200; s.buffer = b; g.gain.value = vol || 0.15;
    s.connect(f).connect(g).connect(a.destination); s.start();
  }
  const S = {
    tap: () => tone(660, 0.06, 'triangle', 0.05),
    skill: () => tone(420, 0.18, 'sawtooth', 0.05, 900),
    hit: () => { noise(0.16, 0.18); tone(140, 0.15, 'square', 0.05, 60); },
    heal: () => { tone(520, 0.15, 'sine', 0.08, 780); setTimeout(() => tone(780, 0.2, 'sine', 0.06, 1040), 90); },
    status: () => tone(300, 0.2, 'triangle', 0.06, 450),
    death: () => tone(220, 0.6, 'sawtooth', 0.08, 50),
    win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.09), i * 120)),
    lose: () => [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'sine', 0.08), i * 180)),
    turn: () => tone(880, 0.08, 'sine', 0.05),
  };
  NA.sfx = (name) => { if (!NA.sfxEnabled) return; try { S[name] && S[name](); } catch (e) {} };
})();
