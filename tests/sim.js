// Headless logic test: many AI vs AI battles, invariants check
require('../js/engine.js'); require('../js/data.js'); require('../js/ai.js');
const NA = globalThis.NA;
const ids = NA.CHARS.map(c => c.id);
let results = { 0: 0, 1: 0, draw: 0, timeout: 0 }; let turnsTot = 0; const wins = {}; const games = {};
const levels = ['facil','normal','dificil'];
const N = +process.argv[2] || 200;
for (let g = 0; g < N; g++) {
  const pick = () => { const a = ids.slice().sort(() => Math.random() - .5); return a.slice(0, 3); };
  const t0 = pick(), t1 = pick();
  const st = NA.createBattle(t0, t1);
  let n = 0;
  while (st.winner == null && n < 200) {
    NA.aiMaybeExchange(st, st.side);
    const lv = levels[g % 3];
    const { actions, pay } = NA.aiPlan(st, st.side, st.side === 0 ? 'normal' : lv);
    NA.executeTurn(st, st.side, actions, pay);
    for (const c of NA.allChars(st)) {
      if (c.hp < 0 || c.hp > 100 || Number.isNaN(c.hp)) throw new Error('bad hp ' + c.hp);
      if (!c.alive && c.st.length) throw new Error('dead with status');
    }
    for (const t of st.teams) for (const k of NA.TYPES) if (t.chakra[k] < 0) throw new Error('negative chakra ' + k);
    n++;
  }
  if (st.winner == null) results.timeout++; else results[st.winner]++;
  turnsTot += n;
  [...t0, ...t1].forEach(id => games[id] = (games[id] || 0) + 1);
  if (st.winner === 0) t0.forEach(id => wins[id] = (wins[id] || 0) + 1);
  if (st.winner === 1) t1.forEach(id => wins[id] = (wins[id] || 0) + 1);
}
console.log('results', results, 'avg half-turns', (turnsTot / N).toFixed(1));
console.log(ids.map(id => `${id}:${Math.round(100 * (wins[id] || 0) / (games[id] || 1))}%`).join(' '));
