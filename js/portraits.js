/* Arena Ninja — retratos estilizados em SVG (arte original gerada por código) */
(function () {
  const NA = (globalThis.NA = globalThis.NA || {});

  function spikes(cx, cy, rIn, rOut, a0, a1, n, jitter) {
    const pts = [];
    for (let i = 0; i <= n * 2; i++) {
      const a = ((a0 + ((a1 - a0) * i) / (n * 2)) * Math.PI) / 180;
      const r = i % 2 ? rOut + (jitter ? ((i * 37) % 7) - 3 : 0) : rIn;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return `M${cx},${cy} L${pts.join(' L')} Z`;
  }
  const CAP = 'M28.5 52 C26 31 37 23.5 50 23.5 C63 23.5 74 31 71.5 52 L69 42 C62 35.5 38 35.5 31 42 Z';

  function hairBack(p) {
    const h = p.hair, h2 = p.hair2;
    switch (p.style) {
      case 'spiky': return `<path d="${spikes(50, 47, 22, 35, 150, 390, 9, true)}" fill="${h}" stroke="${h2}" stroke-width="1.2"/>`;
      case 'duck': return `<path d="${spikes(56, 44, 20, 33, 200, 330, 5, true)}" fill="${h}"/><path d="M27 48 Q24 66 31 70 L34 50Z M73 48 Q76 66 69 70 L66 50Z" fill="${h}"/>`;
      case 'long': return `<path d="M26 44 Q22 80 30 92 L70 92 Q78 80 74 44 Z" fill="${h2}"/>`;
      case 'longStraight': return `<path d="M27 44 Q23 85 26 100 L74 100 Q77 85 73 44 Z" fill="${h2}"/>`;
      case 'hime': return `<path d="M27 44 Q25 70 30 78 L70 78 Q75 70 73 44 Z" fill="${h2}"/>`;
      case 'silver': return `<path d="${spikes(50, 44, 20, 38, 185, 345, 6, true)}" fill="${h}" stroke="${h2}" stroke-width="1" transform="rotate(-12 50 44)"/>`;
      case 'messy': case 'shaggy': return `<path d="${spikes(50, 47, 21, 29, 160, 380, 10, true)}" fill="${h}" stroke="${h2}" stroke-width="1"/>`;
      case 'pineapple': return `<path d="${spikes(50, 18, 4, 13, 190, 350, 5, true)}" fill="${h}"/><rect x="46" y="18" width="8" height="8" rx="2" fill="${h2}"/>`;
      case 'itachi': return `<path d="M30 46 Q28 70 33 74 L67 74 Q72 70 70 46Z" fill="${h2}"/><path d="M47 74 Q50 96 53 74Z" fill="${h2}"/>`;
      case 'spikeUp': return `<path d="${spikes(50, 40, 18, 34, 200, 340, 6, true)}" fill="${h}" stroke="${h2}" stroke-width="1"/>`;
      case 'buns': return `<circle cx="33" cy="25" r="8.5" fill="${h}" stroke="${h2}" stroke-width="1.5"/><circle cx="67" cy="25" r="8.5" fill="${h}" stroke="${h2}" stroke-width="1.5"/>`;
      case 'shino': return `<path d="${spikes(50, 44, 20, 28, 180, 360, 9, true)}" fill="${h}"/>`;
      default: return '';
    }
  }

  function hairFront(p) {
    const h = p.hair, h2 = p.hair2;
    const cap = `<path d="${CAP}" fill="${h}"/>`;
    switch (p.style) {
      case 'spiky': return cap + `<path d="M33 40 L36 50 L40 39 L45 49 L50 38 L55 49 L60 39 L64 50 L67 40 Z" fill="${h}"/>`;
      case 'duck': return cap + `<path d="M30 40 L29 62 L36 44 Z M70 40 L71 62 L64 44 Z M38 38 L42 50 L47 38 L53 48 L58 38 Z" fill="${h}"/>`;
      case 'long': return cap + `<path d="M29 42 Q27 66 31 80 L36 50 Z M71 42 Q73 66 69 80 L64 50 Z M36 40 L44 48 L50 39 L56 48 L64 40Z" fill="${h}"/>`;
      case 'longStraight': return cap + `<path d="M29 42 Q27 70 30 84 L35 46 Z M71 42 Q73 70 70 84 L65 46 Z" fill="${h}"/>`;
      case 'hime': return cap + `<path d="M31 38 L31 46 L69 46 L69 38 Z" fill="${h}"/><path d="M29 42 Q27 62 31 72 L35 46 Z M71 42 Q73 62 69 72 L65 46 Z" fill="${h}"/>`;
      case 'silver': return `<path d="M30 46 Q30 28 50 27 Q70 28 70 46 L64 38 L56 44 L50 36 L42 44 L36 38 Z" fill="${h}" stroke="${h2}" stroke-width=".8"/>`;
      case 'bowl': return `<path d="M27 54 C24 26 38 21 50 21 C62 21 76 26 73 54 L70 54 L70 42 L30 42 L30 54 Z" fill="${h}"/><path d="M34 28 Q44 23 52 25" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" fill="none"/>`;
      case 'messy': case 'shaggy': return cap + `<path d="M32 40 L35 49 L40 39 L46 47 L51 38 L56 47 L61 39 L66 49 L68 40Z" fill="${h}"/>`;
      case 'pineapple': return `<path d="M29 48 C27 30 38 24 50 24 C62 24 73 30 71 48 L68 40 C60 34 40 34 32 40 Z" fill="${h}"/>`;
      case 'itachi': return cap + `<path d="M30 40 Q28 60 31 70 L35 44Z M70 40 Q72 60 69 70 L65 44Z" fill="${h}"/>`;
      case 'spikeUp': return `<path d="M30 46 Q30 30 50 30 Q70 30 70 46 L62 38 L50 36 L38 38Z" fill="${h}"/>`;
      case 'buns': return cap + `<path d="M34 40 L40 46 L46 39 L54 39 L60 46 L66 40Z" fill="${h}"/>`;
      case 'shino': return `<path d="M28 50 C26 30 38 25 50 25 C62 25 74 30 72 50 L68 40 C60 35 40 35 32 40Z" fill="${h}"/>`;
      default: return cap;
    }
  }

  function symbol(kind, x, y, s) {
    const c = '#3a3f4a';
    if (kind === 'sound') return `<text x="${x}" y="${y + s * 0.35}" font-size="${s}" text-anchor="middle" fill="${c}" font-weight="900">♪</text>`;
    if (kind === 'sand') return `<path d="M${x - s / 3} ${y - s / 3} L${x + s / 3} ${y - s / 3} L${x - s / 3} ${y + s / 3} L${x + s / 3} ${y + s / 3} Z" fill="none" stroke="${c}" stroke-width="1.2"/>`;
    if (kind.startsWith('mist')) return `<path d="M${x - s / 2.4} ${y - 2} q2 -2 4 0 t4 0 t4 0 M${x - s / 2.4} ${y + 1.5} q2 -2 4 0 t4 0 t4 0" fill="none" stroke="${c}" stroke-width="1"/>`;
    // folha (espiral + ponta)
    return `<path d="M${x} ${y - s / 2.2} L${x + s / 2.6} ${y - s / 7} A${s / 3} ${s / 3} 0 1 1 ${x - s / 6} ${y - s / 3.5}" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M${x + s / 14} ${y} a${s / 9} ${s / 9} 0 1 1 -${s / 6} ${s / 14}" fill="none" stroke="${c}" stroke-width="1.1"/>`;
  }

  function band(p) {
    const b = p.band;
    if (!b || b === 'none') return '';
    const plate = (x, y, w, h, kind) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="1.5" fill="url(#metal)" stroke="#6b7280" stroke-width=".6"/>` + symbol(kind, x, y, h * 1.05) + (/(Slash)/.test(kind) ? `<line x1="${x - w / 2 + 1}" y1="${y + 1}" x2="${x + w / 2 - 1}" y2="${y - 1}" stroke="#b91c1c" stroke-width="1.4"/>` : '');
    if (b === 'leafWaist' || b === 'leafArm' || b === 'leafNeck') {
      const y = b === 'leafNeck' ? 84 : 92, x = b === 'leafArm' ? 26 : 50;
      return `<rect x="${x - 12}" y="${y - 3}" width="24" height="6" fill="#1f2f5c"/>` + plate(x, y, 14, 7, 'leaf');
    }
    const color = p.bandColor || (b === 'leafTilt' ? '#1f2f5c' : '#25356b');
    const y = p.bandTop ? 31 : 38;
    const rot = b === 'leafTilt' ? 'rotate(10 50 38)' : '';
    const kind = b === 'leafTilt' ? 'leaf' : b === 'leaf' ? 'leaf' : b;
    return `<g transform="${rot}"><path d="M28 ${y - 3} Q50 ${y - 7} 72 ${y - 3} L72 ${y + 4} Q50 ${y} 28 ${y + 4} Z" fill="${p.bandTop ? '#c0284a' : color}"/>` + plate(50, y - 0.5, 18, 9, kind) + `</g>`;
  }

  function eye(cx, cy, p, side) {
    const t = p.eyeType || 'normal';
    const iris = p.eyes;
    if (t === 'glasses') return '';
    let s = `<ellipse cx="${cx}" cy="${cy}" rx="5.2" ry="${t === 'bored' ? 2.4 : 3.8}" fill="#fff"/>`;
    if (t === 'small') return s.replace('rx="5.2"', 'rx="3.6"').replace(/ry="[\d.]+"/, 'ry="2.6"') + `<circle cx="${cx}" cy="${cy}" r="1" fill="#111"/>`;
    const kak = t === 'kakashi';
    const sharin = t === 'sharingan' || (kak && side === 1);
    if (sharin) {
      s += `<circle cx="${cx}" cy="${cy}" r="3.1" fill="#d0141b"/><circle cx="${cx}" cy="${cy}" r="1.9" fill="none" stroke="#3a0000" stroke-width=".5"/><circle cx="${cx}" cy="${cy}" r="1" fill="#111"/>`;
      for (let i = 0; i < 3; i++) { const a = (i * 120 - 90) * Math.PI / 180; s += `<circle cx="${(cx + 1.9 * Math.cos(a)).toFixed(2)}" cy="${(cy + 1.9 * Math.sin(a)).toFixed(2)}" r=".6" fill="#111"/>`; }
      if (kak) s += `<line x1="${cx + 1}" y1="${cy - 9}" x2="${cx - 0.5}" y2="${cy + 8}" stroke="#a65" stroke-width="1"/>`;
    } else if (t === 'byakugan') {
      s += `<circle cx="${cx}" cy="${cy}" r="3.1" fill="${iris}" stroke="#b7b0d6" stroke-width=".5"/><path d="M${cx - 7} ${cy - 1} l-2 -2 M${cx + 7} ${cy - 1} l2 -2" stroke="#9b8fc4" stroke-width=".6"/>`;
    } else if (t === 'snake') {
      s += `<circle cx="${cx}" cy="${cy}" r="3.1" fill="${iris}"/><ellipse cx="${cx}" cy="${cy}" rx=".7" ry="2.6" fill="#111"/>`;
    } else if (t === 'slit') {
      s += `<circle cx="${cx}" cy="${cy}" r="3" fill="#6b3b14"/><ellipse cx="${cx}" cy="${cy}" rx=".8" ry="2.4" fill="#111"/>`;
    } else {
      s += `<circle cx="${cx}" cy="${cy + (t === 'bored' || kak ? 0.6 : 0)}" r="${t === 'bored' || kak ? 2.2 : 3}" fill="${iris}"/><circle cx="${cx}" cy="${cy}" r="1.3" fill="#111"/>`;
    }
    s += `<circle cx="${cx + 1.2}" cy="${cy - 1.2}" r=".8" fill="#fff" opacity=".9"/>`;
    if (t === 'bored' || (kak && side === 0)) s += `<path d="M${cx - 5.4} ${cy - 0.6} L${cx + 5.4} ${cy - 0.6}" stroke="${p.skin}" stroke-width="3.2"/><path d="M${cx - 5.4} ${cy + 0.6} L${cx + 5.4} ${cy + 0.6}" stroke="#333" stroke-width=".8"/>`;
    return s;
  }

  function marks(p) {
    switch (p.marks) {
      case 'whiskers': return [0, 1, 2].map((i) => `<path d="M33 ${59 + i * 2.6} l7 ${0.6 - i * 0.6} M67 ${59 + i * 2.6} l-7 ${0.6 - i * 0.6}" stroke="#7a4a2a" stroke-width=".9" stroke-linecap="round"/>`).join('');
      case 'gaara': return ''; case 'gaaraTop': return `<text x="38" y="43" font-size="7" fill="#c9261d" font-weight="700" text-anchor="middle">愛</text>`;
      case 'itachi': return `<path d="M38 57 q1 3 2 4 M62 57 q-1 3 -2 4" stroke="#8a6a5a" stroke-width=".9" fill="none"/>`;
      case 'gills': return `<path d="M34 60 l3 1 M34 63 l3 1 M34 66 l3 1 M66 60 l-3 1 M66 63 l-3 1 M66 66 l-3 1" stroke="#2f4f6e" stroke-width="1"/>`;
      case 'oro': return `<path d="M35 49 q6 -3 11 1 M54 50 q5 -4 11 -1" stroke="#7a3fa0" stroke-width="1.6" fill="none"/><path d="M36 56 q5 3 10 0 M54 56 q5 3 10 0" stroke="#7a3fa0" stroke-width="1.2" fill="none"/>`;
      case 'kiba': return `<path d="M35 58 l4 6 l1 -6 Z M65 58 l-4 6 l-1 -6 Z" fill="#c42020"/>`;
      default: return '';
    }
  }

  function outfit(p) {
    let s = `<path d="M10 100 Q14 80 36 76 L64 76 Q86 80 90 100 Z" fill="${p.outfit}"/>`;
    if (p.cloud) {
      s = `<path d="M8 100 Q12 78 34 72 L66 72 Q88 78 92 100 Z" fill="#111116"/><path d="M34 72 L40 84 L50 76 L60 84 L66 72 Z" fill="#1b1b22"/>`;
      s += [[22, 90], [76, 88], [52, 96]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-7 0 q0 -5 5 -4 q2 -4 6 -1 q5 -1 4 4 q2 3 -2 4 h-11 q-4 -1 -2 -3z" fill="#c4161c" stroke="#fff" stroke-width=".8"/></g>`).join('');
    }
    if (p.collar) s += `<path d="M30 100 L30 64 Q50 70 70 64 L70 100 Z" fill="${p.collar}"/><path d="M30 64 Q50 70 70 64 L72 58 Q50 66 28 58 Z" fill="#3c4739"/>`;
    if (p.gourd) s = `<circle cx="78" cy="78" r="13" fill="#a26a3a" stroke="#6b4422" stroke-width="1.5"/><circle cx="76" cy="62" r="7" fill="#a26a3a" stroke="#6b4422" stroke-width="1.5"/>` + s;
    return s;
  }

  NA.portraitSVG = function (id, opts) {
    const ch = NA.CHARS_BY_ID[id];
    const p = ch.p;
    const gid = 'g' + id + (opts && opts.k ? opts.k : '');
    const brows = p.brows === 'thick'
      ? `<path d="M35 46 L46 47 M54 47 L65 46" stroke="#111" stroke-width="3.2" stroke-linecap="round"/>`
      : `<path d="M36 47 Q41 45 46 47 M54 47 Q59 45 64 47" stroke="${p.hair2 === '#aab1c0' ? '#777' : '#3a2a20'}" stroke-width="1.1" fill="none"/>`;
    const glasses = p.eyeType === 'glasses' ? `<rect x="34" y="49" width="13" height="7" rx="3" fill="#111"/><rect x="53" y="49" width="13" height="7" rx="3" fill="#111"/><line x1="47" y1="52" x2="53" y2="52" stroke="#111" stroke-width="1.5"/><path d="M36 50.5 l4 0" stroke="#7aa" stroke-width=".8"/>` : '';
    const ring = p.eyeRing ? `<ellipse cx="41" cy="53" rx="7" ry="5.6" fill="#2a1a1a" opacity=".55"/><ellipse cx="59" cy="53" rx="7" ry="5.6" fill="#2a1a1a" opacity=".55"/>` : '';
    const mask = p.mask ? `<path d="M29 56 Q30 78 50 79 Q70 78 71 56 L60 57 Q55 58 52 60 L50 58 L48 60 Q45 58 40 57 Z" fill="${p.mask}"/>` : '';
    const mouth = p.mask || p.collar ? '' : (p.marks === 'gills' ? `<path d="M42 67 Q50 71 58 67" stroke="#2f2f2f" stroke-width="1.2" fill="none"/><path d="M44 67.5 l1 1.5 l1 -1.2 l1 1.4 l1 -1.3 l1 1.4 l1 -1.3 l1 1.4 l1 -1.3 l1 1.2 l1 -1.2" stroke="#fff" stroke-width=".6" fill="none"/>` : `<path d="M45.5 67 Q50 69.5 54.5 67" stroke="#8a4b3a" stroke-width="1.1" fill="none" stroke-linecap="round"/>`);
    const watermark = symbol(ch.village.startsWith('leaf') ? 'leaf' : ch.village, 50, 50, 70).replace(/stroke="#3a3f4a"/g, 'stroke="#fff"').replace(/fill="#3a3f4a"/g, 'fill="#fff"').replace(/stroke-width="[\d.]+"/g, 'stroke-width="3"');
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="portrait-svg" aria-label="${ch.name}">
<defs><radialGradient id="${gid}" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></radialGradient>
<linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f5"/><stop offset="1" stop-color="#9aa3b0"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#${gid})"/><g opacity=".12">${watermark}</g>
${hairBack(p)}${outfit(p)}
<rect x="44" y="68" width="12" height="12" fill="${p.skin}"/>
<ellipse cx="28.5" cy="54" rx="3" ry="4.5" fill="${p.skin}"/><ellipse cx="71.5" cy="54" rx="3" ry="4.5" fill="${p.skin}"/>
<path d="M29 48 Q29 74 50 77 Q71 74 71 48 Q71 28 50 28 Q29 28 29 48Z" fill="${p.skin}"/>
${ring}${eye(41, 53, p, 0)}${eye(59, 53, p, 1)}${glasses}${brows}${marks(p)}
<path d="M50 56 l-1.4 5 h2.4" stroke="#00000033" stroke-width="1" fill="none"/>${mouth}${mask}
${p.collar ? outfit({ collar: p.collar, outfit: 'none' }).replace(/<path d="M10[^>]*>/, '') : ''}
${hairFront(p)}${band(p)}${p.marks === 'gaara' ? marks({ marks: 'gaaraTop' }) : ''}
</svg>`;
  };
})();
