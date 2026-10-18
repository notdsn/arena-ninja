/* Arena Ninja — IA do oponente */
(function () {
  const NA = (globalThis.NA = globalThis.NA || {});
  const TYPES = NA.TYPES;

  function futureTicks(st, s) {
    let n = 0;
    for (let k = st.half + 1; k < s.exp; k++) if (k % 2 === s.tick) n++;
    return n;
  }

  function statusVal(st, c, s) {
    const r = NA.turnsLeft(st, s);
    let v = 0;
    if (s.stun) v -= (s.stun === true ? 20 : 11) * Math.min(r, 2);
    if (s.dr) v += s.dr * 0.9 * Math.min(r, 3);
    if (s.dd) v += s.dd * 0.85;
    if (s.invuln) v += c.hp < 55 ? 22 : 7;
    if (s.dot) v -= s.dot * futureTicks(st, s) * 0.95;
    if (s.hot) v += s.hot * futureTicks(st, s);
    if (s.dmgUp) v += s.dmgUp * 1.6 * Math.min(r, 3);
    if (s.dmgDown) v -= s.dmgDown * 1.4 * Math.min(r, 2);
    if (s.vuln) v -= s.vuln * 1.5 * Math.min(r, 2);
    if (s.counter) v += 14;
    if (s.stunImmune) v += 4;
    if (s.val) v += s.val * (s.stacks || 1) * (r > 0 ? 1 : 0);
    return v;
  }

  function evaluate(st, side) {
    if (st.winner === side) return 100000;
    if (st.winner === 1 - side) return -100000;
    let score = 0;
    for (const team of st.teams) {
      for (const c of team.chars) {
        const sign = c.side === side ? 1 : -1;
        if (!c.alive) { score -= sign * 140; continue; }
        // low HP enemies are worth focusing: nonlinear value
        let v = c.hp + (c.hp < 35 ? (c.hp - 35) * 0.4 : 0);
        for (const s of c.st) v += statusVal(st, c, s);
        score += sign * v;
      }
    }
    const pool = (s) => TYPES.reduce((a, k) => a + st.teams[s].chakra[k], 0);
    score += pool(side) * 2.2 - pool(1 - side) * 3;
    return score;
  }
  NA.evaluate = evaluate;

  function simulate(st, side, actions) {
    const s = NA.clone(st);
    s.events = [];
    const saved = NA.rand;
    NA.resolveActions(s, side, actions, null);
    return s;
  }

  function candidates(st, side, ci, queued) {
    const out = [];
    const c = st.teams[side].chars[ci];
    for (let si = 0; si < 4; si++) {
      if (!NA.canUse(st, side, ci, si, queued).ok) continue;
      const sk = NA.skillOf(c, si);
      const tt = NA.targetType(st, c, sk);
      const tg = NA.validTargets(st, c, si);
      if (tt === 'allEnemies' || tt === 'allAllies' || tt === 'self') out.push({ ci, si, tgt: tg[0].uid });
      else for (const t of tg) out.push({ ci, si, tgt: t.uid });
    }
    return out;
  }

  function permutations(a) {
    if (a.length <= 1) return [a];
    const r = [];
    a.forEach((x, i) => permutations(a.slice(0, i).concat(a.slice(i + 1))).forEach((p) => r.push([x].concat(p))));
    return r;
  }

  /** level: 'facil' | 'normal' | 'dificil' */
  NA.aiPlan = function (st, side, level) {
    level = level || 'normal';
    const noise = level === 'facil' ? 30 : level === 'normal' ? 7 : 0;
    const living = st.teams[side].chars.filter((c) => c.alive).map((c) => c.idx);
    let orders = permutations(living);
    if (level === 'facil') orders = [orders[Math.floor(NA.rand() * orders.length)]];
    else if (level === 'normal' && orders.length > 3) orders = orders.sort(() => NA.rand() - 0.5).slice(0, 3);
    let best = null;
    const base = evaluate(st, side);
    for (const order of orders) {
      const plan = [];
      for (const ci of order) {
        if (level === 'facil' && NA.rand() < 0.2) continue;
        const cands = candidates(st, side, ci, plan);
        let pick = null, pickScore = evaluate(simulate(st, side, plan), side) + (NA.rand() - 0.5) * noise * 0.3;
        for (const cand of cands) {
          // average two sims to smooth randomness (chakra drain etc.)
          const sc = evaluate(simulate(st, side, plan.concat([cand])), side) + (NA.rand() - 0.5) * noise;
          if (sc > pickScore + 0.5) { pickScore = sc; pick = cand; }
        }
        if (pick) plan.push(pick);
      }
      const total = evaluate(simulate(st, side, plan), side);
      if (!best || total > best.score) best = { plan, score: total };
    }
    void base;
    const plan = best ? best.plan : [];
    // random payment: keep chakra types the team still needs most
    const pool = NA.poolAfterSpecific(st, side, plan);
    const need = NA.randomNeeded(st, side, plan);
    const want = { tai: 0, blood: 0, nin: 0, gen: 0 };
    for (const c of st.teams[side].chars) if (c.alive) for (const sk of NA.CHARS_BY_ID[c.id].skills) for (const k of TYPES) want[k] += sk.cost[k] || 0;
    const p = Object.assign({}, pool), pay = { tai: 0, blood: 0, nin: 0, gen: 0 };
    for (let i = 0; i < need; i++) {
      let bk = null, bs = -1e9;
      for (const k of TYPES) if (p[k] > 0) { const s = p[k] - want[k] * 0.5; if (s > bs) { bs = s; bk = k; } }
      if (!bk) break;
      p[bk]--; pay[bk]++;
    }
    return { actions: plan, pay };
  };

  /** AI may trade 5 chakra for 1 when hoarding a lot */
  NA.aiMaybeExchange = function (st, side) {
    const pool = st.teams[side].chakra;
    const total = TYPES.reduce((a, k) => a + pool[k], 0);
    if (total < 7) return false;
    const want = { tai: 0, blood: 0, nin: 0, gen: 0 };
    for (const c of st.teams[side].chars) if (c.alive) for (const sk of NA.CHARS_BY_ID[c.id].skills) for (const k of TYPES) want[k] += sk.cost[k] || 0;
    const target = TYPES.filter((k) => want[k] > 0).sort((a, b) => pool[a] - want[a] - (pool[b] - want[b]))[0];
    if (!target || pool[target] > 0) return false;
    const give = { tai: 0, blood: 0, nin: 0, gen: 0 }; const p = Object.assign({}, pool);
    for (let i = 0; i < 5; i++) { const k = TYPES.filter((t) => t !== target && p[t] > 0).sort((a, b) => p[b] - p[a])[0]; if (!k) return false; p[k]--; give[k]++; }
    return NA.exchange(st, side, give, target);
  };

  if (typeof module !== 'undefined') module.exports = NA;
})();
