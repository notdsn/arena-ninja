/* SHA-256 compacto (funciona fora de HTTPS, sem crypto.subtle) */
(function () {
  function sha256(ascii) {
    const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const maxWord = Math.pow(2, 32); let result = '';
    const words = []; const asciiBitLength = ascii.length * 8;
    let hash = [], k = []; let primeCounter = 0; const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    ascii += '\x80';
    while ((ascii.length % 64) - 56) ascii += '\x00';
    for (let i = 0; i < ascii.length; i++) { const j = ascii.charCodeAt(i); words[i >> 2] |= j << (((3 - i) % 4) * 8); }
    words[words.length] = (asciiBitLength / maxWord) | 0; words[words.length] = asciiBitLength;
    for (let j = 0; j < words.length;) {
      const w = words.slice(j, (j += 16)); const oldHash = hash; hash = hash.slice(0, 8);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2]; const a = hash[0], e = hash[4];
        const temp1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash); hash[4] = (hash[4] + temp1) | 0;
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? '0' : '') + b.toString(16); }
    return result;
  }
  globalThis.sha256 = (s) => sha256(unescape(encodeURIComponent(s)));
})();
