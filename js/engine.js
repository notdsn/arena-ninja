/* Arena Ninja — motor de batalha (puro, roda no navegador e no Node) */
(function () {
  const NA = (globalThis.NA = globalThis.NA || {});
  const TYPES = ['tai', 'blood', 'nin', 'gen'];
  NA.TYPES = TYPES;
  NA.TYPE_INFO = {
    tai: { name: 'Taijutsu', short: 'Tai', color: '#35c24a' },
    blood: { name: 'Kekkei Genkai', short: 'Linhagem', color: '#e33b3b' },
    nin: { name: 'Ninjutsu', short: 'Nin', color: '#2f80ed' },
    gen: { name: 'Genjutsu', short: 'Gen', color: '#f4f4f4' },
    rand: { name: 'Aleatório', short: 'Aleat.', color: '#1b1b1b' },
  };
  let rng = Math.random;
  NA.setRng = (f) => (rng = f);
  NA.rand = () => rng();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  NA.clone = clone;

  const def = (id) => NA.CHARS_BY_ID[id];
  const skillOf = (c, i) => def(c.id).skills[i];
  NA.skillOf = skillOf;

  function allChars(st) { return st.teams[0].chars.concat(st.teams[1].chars); }
  function byUid(st, uid) { return st.teams[Math.floor(uid / 10)].chars[uid % 10]; }
  NA.byUid = byUid;
  NA.allChars = allChars;
  function living(st, side) { return st.teams[side].chars.filter((c) => c.alive); }
  NA.living = living;
  function sumF(c, f) { let s = 0; for (const x of c.st) if (x[f]) s += x[f]; return s; }
  function hasS(c, key) { return c.st.find((x) => x.key === key) || null; }
  NA.hasS = hasS;
  function cname(c) { return def(c.id).short; }
  function log(st, txt) { st.log.push(txt); }

  NA.isStunned = function (c, skill) {
    for (const s of c.st) {
      if (!s.stun) continue;
      if (s.stun === true) return true;
      if (Array.isArray(s.stun) && skill && skill.cls.some((k) => s.stun.includes(k))) return true;
    }
    return false;
  };
  NA.isInvuln = function (c, skill) {
    for (const s of c.st) {
      if (!s.invuln) continue;
      if (s.invuln === true) return true;
      if (Array.isArray(s.invuln) && skill && skill.cls.some((k) => s.invuln.includes(k))) return true;
    }
    return false;
  };

  NA.createBattle = function (ids0, ids1, opts) {
    opts = opts || {};
    const st = { v: 1, half: 0, side: 0, teams: [], log: [], events: [], winner: null, turnNo: 1 };
    [ids0, ids1].forEach((ids, side) => {
      st.teams.push({
        chakra: { tai: 0, blood: 0, nin: 0, gen: 0 },
        chars: ids.map((id, i) => ({ uid: side * 10 + i, id, side, idx: i, hp: 100, alive: true, st: [], cd: [0, 0, 0, 0], last: null })),
      });
    });
    startTurn(st);
    return st;
  };

  function kill(st, c) {
    c.alive = false; c.hp = 0; c.st = [];
    st.events.push({ t: 'death', uid: c.uid });
    log(st, `☠️ ${cname(c)} foi derrotado!`);
    cleanupChannels(st);
  }

  function cleanupChannels(st) {
    for (const c of allChars(st)) {
      c.st = c.st.filter((s) => {
        if (!s.channel) return true;
        const src = byUid(st, s.src);
        return src && src.alive && !NA.isStunned(src, null) && !hasS(src, '__stunall');
      });
    }
  }

  function applyDamage(st, src, t, amount, kind, opt) {
    kind = kind || 'normal';
    if (!t.alive) return 0;
    let d = amount;
    if (src && !(opt && opt.noBoost)) d += sumF(src, 'dmgUp') - sumF(src, 'dmgDown');
    if (d > 0) d += sumF(t, 'vuln');
    if (kind === 'normal') d -= sumF(t, 'dr');
    d = Math.max(0, Math.round(d));
    let absorbed = 0;
    if (kind !== 'affliction' && d > 0) {
      for (const s of t.st) {
        if (s.dd > 0 && d > 0) { const a = Math.min(s.dd, d); s.dd -= a; d -= a; absorbed += a; }
      }
      t.st = t.st.filter((s) => !(s.ddInit && s.dd <= 0));
    }
    t.hp = Math.max(0, t.hp - d);
    st.events.push({ t: 'dmg', uid: t.uid, amt: d, kind, absorbed, hp: t.hp });
    if (t.hp <= 0) kill(st, t);
    return d;
  }
  NA._applyDamage = applyDamage;

  function heal(st, t, amt) {
    if (!t.alive) return 0;
    const before = t.hp;
    t.hp = Math.min(100, t.hp + amt);
    const h = t.hp - before;
    st.events.push({ t: 'heal', uid: t.uid, amt: h, hp: t.hp });
    return h;
  }

  function addStatus(st, src, t, d) {
    if (!t.alive) return null;
    if (d.stun && hasS(t, 'stunImmuneMark')) {}
    if (d.stun && t.st.some((x) => x.stunImmune)) {
      log(st, `🛡️ ${cname(t)} ignorou o atordoamento.`);
      st.events.push({ t: 'resist', uid: t.uid });
      return null;
    }
    const s = Object.assign({}, d);
    s.src = src ? src.uid : -1;
    s.srcSide = src ? src.side : -1;
    const turns = d.turns == null ? 1 : d.turns;
    s.exp = st.half + 2 * turns + (t.side === st.side ? 1 : 0);
    s.tick = st.side;
    if (s.dd) s.ddInit = s.dd;
    const ex = t.st.findIndex((x) => x.key === s.key && x.src === s.src);
    if (ex >= 0) {
      if (d.stack) s.stacks = Math.min(d.maxStacks || 99, (t.st[ex].stacks || 1) + 1);
      t.st[ex] = s;
    } else {
      if (d.stack) s.stacks = 1;
      t.st.push(s);
    }
    st.events.push({ t: 'status', uid: t.uid, icon: s.icon, name: s.name, harmful: s.srcSide !== t.side });
    if (s.stun) cleanupChannels(st);
    return s;
  }

  function drain(st, side, n) {
    const got = [];
    for (let i = 0; i < n; i++) {
      const pool = st.teams[side].chakra;
      const avail = TYPES.filter((k) => pool[k] > 0);
      if (!avail.length) break;
      const k = avail[Math.floor(rng() * avail.length)];
      pool[k]--; got.push(k);
    }
    if (got.length) st.events.push({ t: 'drain', side, types: got });
    return got;
  }

  function makeCtx(st, c, skill) {
    const x = {
      st, self: c, side: c.side, skill,
      dmg: (t, amt, kind) => applyDamage(st, c, t, amt, kind),
      selfDmg: (amt) => applyDamage(st, null, c, amt, 'affliction'),
      heal: (t, amt) => heal(st, t, amt),
      add: (t, d) => addStatus(st, c, t, d),
      has: (t, key) => hasS(t, key),
      remove: (t, key) => { t.st = t.st.filter((s) => s.key !== key); },
      removeStuns: (t) => { t.st = t.st.filter((s) => !s.stun); },
      drain: (t, n) => { const g = drain(st, t.side, n); if (g.length) log(st, `💧 ${cname(c)} removeu ${g.length} chakra do time inimigo.`); return g; },
      steal: (t, n) => { const g = drain(st, t.side, n); g.forEach((k) => st.teams[c.side].chakra[k]++); if (g.length) log(st, `💧 ${cname(c)} roubou ${g.length} chakra (${g.map((k) => NA.TYPE_INFO[k].name).join(', ')}).`); return g; },
      gain: (type, n) => { for (let i = 0; i < n; i++) st.teams[c.side].chakra[type === 'rand' ? TYPES[Math.floor(rng() * 4)] : type]++; },
      allies: () => living(st, c.side),
      enemies: () => living(st, 1 - c.side),
      log: (t) => log(st, t),
    };
    return x;
  }
  NA.makeCtx = makeCtx;

  function targetType(st, c, skill) {
    return typeof skill.target === 'function' ? skill.target(makeCtx(st, c, skill)) : skill.target;
  }
  NA.targetType = targetType;
  const isHarmfulType = (tt) => tt === 'enemy' || tt === 'allEnemies';
  NA.isHarmfulType = isHarmfulType;

  NA.validTargets = function (st, c, si) {
    const skill = skillOf(c, si);
    const tt = targetType(st, c, skill);
    const x = makeCtx(st, c, skill);
    let list;
    if (tt === 'self') list = [c];
    else if (tt === 'ally') list = living(st, c.side).filter((a) => a !== c);
    else if (tt === 'anyAlly' || tt === 'allAllies') list = living(st, c.side);
    else list = living(st, 1 - c.side).filter((e) => !NA.isInvuln(e, skill));
    if (skill.treq) list = list.filter((t) => skill.treq(x, t));
    return list;
  };

  NA.costTotal = (cost) => TYPES.reduce((a, k) => a + (cost[k] || 0), 0) + (cost.rand || 0);

  function affordable(pool, costs) {
    const need = { tai: 0, blood: 0, nin: 0, gen: 0 }; let r = 0;
    for (const co of costs) { for (const k of TYPES) need[k] += co[k] || 0; r += co.rand || 0; }
    let spare = 0;
    for (const k of TYPES) { if (pool[k] < need[k]) return false; spare += pool[k] - need[k]; }
    return spare >= r;
  }
  NA.affordable = affordable;

  /** queued: [{ci, si, tgt}] */
  NA.canUse = function (st, side, ci, si, queued) {
    queued = queued || [];
    if (st.winner != null) return { ok: false, why: 'Batalha encerrada' };
    if (st.side !== side) return { ok: false, why: 'Não é seu turno' };
    const c = st.teams[side].chars[ci];
    if (!c.alive) return { ok: false, why: 'Derrotado' };
    const skill = skillOf(c, si);
    if (c.cd[si] > st.half) return { ok: false, why: `Recarga: ${Math.ceil((c.cd[si] - st.half) / 2)}`, cd: Math.ceil((c.cd[si] - st.half) / 2) };
    if (NA.isStunned(c, skill)) return { ok: false, why: 'Atordoado' };
    if (skill.req && !skill.req(makeCtx(st, c, skill))) return { ok: false, why: skill.reqText || 'Requisito não cumprido' };
    if (!NA.validTargets(st, c, si).length) return { ok: false, why: 'Sem alvos válidos' };
    const others = queued.filter((q) => q.ci !== ci);
    const costs = others.map((q) => skillOf(st.teams[side].chars[q.ci], q.si).cost).concat([skill.cost]);
    if (!affordable(st.teams[side].chakra, costs)) return { ok: false, why: 'Chakra insuficiente' };
    return { ok: true };
  };

  NA.randomNeeded = function (st, side, queued) {
    return queued.reduce((a, q) => a + (skillOf(st.teams[side].chars[q.ci], q.si).cost.rand || 0), 0);
  };
  NA.poolAfterSpecific = function (st, side, queued) {
    const p = Object.assign({}, st.teams[side].chakra);
    for (const q of queued) { const co = skillOf(st.teams[side].chars[q.ci], q.si).cost; for (const k of TYPES) p[k] -= co[k] || 0; }
    return p;
  };
  NA.autoPay = function (pool, n) {
    const p = Object.assign({}, pool); const pay = { tai: 0, blood: 0, nin: 0, gen: 0 };
    for (let i = 0; i < n; i++) {
      let best = null;
      for (const k of TYPES) if (p[k] > 0 && (best == null || p[k] > p[best])) best = k;
      if (!best) break;
      p[best]--; pay[best]++;
    }
    return pay;
  };

  NA.exchange = function (st, side, give, getType) {
    const pool = st.teams[side].chakra;
    const tot = TYPES.reduce((a, k) => a + (give[k] || 0), 0);
    if (tot !== 5) return false;
    for (const k of TYPES) if ((give[k] || 0) > pool[k]) return false;
    for (const k of TYPES) pool[k] -= give[k] || 0;
    pool[getType]++;
    log(st, `🔄 Troca de chakra: 5 por 1 ${NA.TYPE_INFO[getType].name}.`);
    return true;
  };

  function resolveSkill(st, side, a) {
    const c = st.teams[side].chars[a.ci];
    if (!c.alive) return;
    const skill = skillOf(c, a.si);
    if (NA.isStunned(c, skill)) { log(st, `💫 ${cname(c)} está atordoado e não pôde usar ${skill.name}.`); return; }
    const tt = targetType(st, c, skill);
    const harmful = isHarmfulType(tt);
    const x = makeCtx(st, c, skill);
    let targets;
    const valid = NA.validTargets(st, c, a.si);
    if (tt === 'allEnemies' || tt === 'allAllies') targets = valid;
    else {
      const t = a.tgt != null ? byUid(st, a.tgt) : valid[0];
      targets = t && valid.includes(t) ? [t] : [];
    }
    c.cd[a.si] = st.half + 2 * ((skill.cd || 0) + 1);
    c.last = a.si;
    st.events.push({ t: 'skill', uid: c.uid, si: a.si, name: skill.name, icon: skill.icon, targets: targets.map((t) => t.uid), harmful });
    if (!targets.length) { log(st, `❌ ${cname(c)} usou ${skill.name}, mas falhou (alvo inválido).`); return; }
    log(st, `${skill.icon} ${cname(c)} usou ${skill.name}` + (tt === 'self' ? '.' : ` em ${targets.map(cname).join(', ')}.`));
    if (skill.cast) skill.cast(x);
    for (const t of targets) {
      if (!t.alive) continue;
      if (harmful) {
        const ctr = t.st.find((s) => s.counter && s.srcSide === t.side);
        if (ctr) {
          t.st = t.st.filter((s) => s !== ctr);
          st.events.push({ t: 'counter', uid: t.uid, by: c.uid });
          log(st, `🪞 ${cname(t)} anulou ${skill.name} com ${ctr.name}!`);
          if (ctr.counter.stun) addStatus(st, t, c, { key: 'ctrstun', name: ctr.name, icon: '💫', turns: ctr.counter.stun, stun: true, desc: 'Atordoado pelo contra-ataque.' });
          if (ctr.counter.dmg) applyDamage(st, t, c, ctr.counter.dmg, 'piercing');
          continue;
        }
      }
      skill.use(x, t);
    }
  }

  function checkWinner(st) {
    const a0 = living(st, 0).length, a1 = living(st, 1).length;
    if (!a0 && !a1) st.winner = 'draw';
    else if (!a1) st.winner = 0;
    else if (!a0) st.winner = 1;
    return st.winner;
  }
  NA.checkWinner = checkWinner;

  function startTurn(st) {
    const side = st.side;
    for (const c of allChars(st)) c.st = c.st.filter((s) => s.exp > st.half);
    cleanupChannels(st);
    for (const c of allChars(st)) {
      if (!c.alive) continue;
      for (const s of c.st.slice()) {
        if (s.tick !== side) continue;
        if (s.dot && c.alive) {
          const src = s.src >= 0 ? byUid(st, s.src) : null;
          const d = applyDamage(st, null, c, s.dot, s.dotKind || 'affliction');
          log(st, `🔥 ${cname(c)} sofreu ${d} de dano de ${s.name}.`);
          void src;
        }
        if (s.hot && c.alive) heal(st, c, s.hot);
      }
    }
    checkWinner(st);
    if (st.winner == null) {
      const n = st.half === 0 ? 1 : living(st, side).length;
      const pool = st.teams[side].chakra;
      const got = [];
      for (let i = 0; i < n; i++) { const k = TYPES[Math.floor(rng() * 4)]; pool[k]++; got.push(k); }
      st.events.push({ t: 'gain', side, types: got });
      log(st, `— Turno ${st.turnNo}: ${side === 0 ? 'Você' : 'Oponente'} —`);
    }
  }
  NA._startTurn = startTurn;

  function pay(st, side, actions, randomPay) {
    const pool = st.teams[side].chakra;
    for (const a of actions) { const co = skillOf(st.teams[side].chars[a.ci], a.si).cost; for (const k of TYPES) pool[k] -= co[k] || 0; }
    const need = actions.reduce((s, a) => s + (skillOf(st.teams[side].chars[a.ci], a.si).cost.rand || 0), 0);
    let rp = randomPay;
    const ok = rp && TYPES.every((k) => (rp[k] || 0) <= pool[k] && (rp[k] || 0) >= 0) && TYPES.reduce((s, k) => s + (rp[k] || 0), 0) === need;
    if (!ok) rp = NA.autoPay(pool, need);
    for (const k of TYPES) pool[k] -= rp[k] || 0;
  }

  /** Validates, pays, resolves skills (no turn advance). Returns accepted actions. */
  NA.resolveActions = function (st, side, actions, randomPay) {
    const acc = [];
    for (const a of actions) {
      const r = NA.canUse(st, side, a.ci, a.si, acc);
      if (r.ok) acc.push(a);
    }
    pay(st, side, acc, randomPay);
    for (const a of acc) { resolveSkill(st, side, a); if (checkWinner(st) != null) break; }
    return acc;
  };

  NA.executeTurn = function (st, side, actions, randomPay) {
    st.events = [];
    if (st.winner != null || st.side !== side) return [];
    NA.resolveActions(st, side, actions, randomPay);
    const resolveEvents = st.events;
    checkWinner(st);
    st.half++; st.side = 1 - st.side;
    if (st.side === 0) st.turnNo++;
    st.events = [];
    if (st.winner == null) startTurn(st);
    const ev = resolveEvents.concat([{ t: 'turn', side: st.side }], st.events);
    st.events = ev;
    return ev;
  };

  NA.surrender = function (st, side) { st.winner = 1 - side; log(st, side === 0 ? '🏳️ Você desistiu.' : '🏳️ O oponente desistiu.'); };

  NA.turnsLeft = function (st, s) { return Math.max(0, Math.ceil((s.exp - st.half) / 2)); };

  NA.statusText = function (st, s) {
    const p = [];
    if (s.desc) p.push(s.desc);
    if (s.stun) p.push(s.stun === true ? 'Atordoado.' : `Não pode usar habilidades ${s.stun.join('/')}.`);
    if (s.invuln) p.push(s.invuln === true ? 'Invulnerável.' : `Invulnerável a ${s.invuln.join('/')}.`);
    if (s.dr) p.push(`Redução de dano: ${s.dr}.`);
    if (s.dd) p.push(`Defesa destrutível: ${s.dd}.`);
    if (s.dot) p.push(`Recebe ${s.dot} de dano ${s.dotKind === 'piercing' ? 'perfurante' : 'de aflição'} por turno.`);
    if (s.hot) p.push(`Recupera ${s.hot} de vida por turno.`);
    if (s.dmgUp) p.push(`+${s.dmgUp} de dano causado.`);
    if (s.dmgDown) p.push(`-${s.dmgDown} de dano causado.`);
    if (s.vuln) p.push(`Recebe +${s.vuln} de dano.`);
    if (s.counter) p.push('Anula a primeira habilidade nociva recebida.');
    if (s.stunImmune) p.push('Imune a atordoamento.');
    if (s.stacks) p.push(`Acúmulos: ${s.stacks}.`);
    if (s.channel) p.push('Termina se o usuário for atordoado ou derrotado.');
    return [...new Set(p)].join(' ');
  };

  if (typeof module !== 'undefined') module.exports = NA;
})();
