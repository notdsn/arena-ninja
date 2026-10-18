/* Arena Ninja — progresso salvo (localStorage, versionado e migrável).
   REGRA: nunca apagar saves. Para mudar o formato, incremente SAVE_VERSION
   e adicione uma função em MIGRATIONS que converta da versão anterior. */
(function () {
  const NA = (globalThis.NA = globalThis.NA || {});
  const KEY = 'arenaNinja.save';
  const SAVE_VERSION = 1;

  function defaults() {
    return {
      v: SAVE_VERSION,
      createdAt: Date.now(),
      profile: { name: 'Edson', xp: 0, lp: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, hardWins: 0, flawless: 0 },
      charStats: {}, // id -> {used, wins}
      history: [], // ultimas partidas
      missionsDone: [],
      settings: { difficulty: 'normal', sound: true, speed: 1, freeMode: false },
      lastTeam: ['naruto', 'sasuke', 'sakura'],
    };
  }

  // MIGRATIONS[n] converte um save da versão n para n+1.
  const MIGRATIONS = {
    // 1: (s) => { s.novoCampo = ...; s.v = 2; return s; },
  };

  function deepMerge(base, extra) {
    // mantém tudo que existe no save; só acrescenta campos novos dos defaults
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return extra === undefined ? base : extra;
    const out = Object.assign({}, extra);
    for (const k of Object.keys(base)) {
      if (!(k in out)) out[k] = base[k];
      else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = deepMerge(base[k], out[k]);
    }
    return out;
  }

  function migrate(s) {
    if (!s || typeof s !== 'object') return defaults();
    let v = typeof s.v === 'number' ? s.v : 0;
    if (v === 0) { s.v = 1; v = 1; }
    while (v < SAVE_VERSION && MIGRATIONS[v]) { s = MIGRATIONS[v](s); v = s.v; }
    return deepMerge(defaults(), s);
  }

  let storage = null;
  try { storage = globalThis.localStorage || null; } catch (e) { storage = null; }
  const mem = {};
  const get = (k) => (storage ? storage.getItem(k) : mem[k] || null);
  const set = (k, v) => { try { if (storage) storage.setItem(k, v); else mem[k] = v; } catch (e) { console.warn('save falhou', e); } };

  NA.loadSave = function () {
    const raw = get(KEY);
    if (!raw) return defaults();
    try {
      return migrate(JSON.parse(raw));
    } catch (e) {
      // save corrompido: guarda cópia de segurança, nunca descarta
      set(KEY + '.backup.' + Date.now(), raw);
      return defaults();
    }
  };
  NA.writeSave = function (s) { s.v = Math.max(s.v || 0, SAVE_VERSION); s.updatedAt = Date.now(); set(KEY, JSON.stringify(s)); };
  NA.exportSave = function () { return get(KEY) || JSON.stringify(defaults()); };
  NA.importSave = function (txt) { const s = migrate(JSON.parse(txt)); set(KEY + '.backup.' + Date.now(), get(KEY) || ''); NA.writeSave(s); return s; };
  NA.SAVE_VERSION = SAVE_VERSION;
  NA._migrate = migrate;

  // ---- níveis, ranks e missões ----
  NA.xpForLevel = (L) => 50 * L * (L - 1);
  NA.levelOf = (xp) => { let L = 1; while (NA.xpForLevel(L + 1) <= xp) L++; return L; };
  const RANKS = [[1, 'Estudante da Academia'], [3, 'Genin'], [6, 'Chunin'], [10, 'Jounin'], [14, 'ANBU'], [18, 'Sannin'], [23, 'Kage'], [30, 'Hokage']];
  NA.rankOf = (L) => { let r = RANKS[0][1]; for (const [l, n] of RANKS) if (L >= l) r = n; return r; };

  NA.MISSIONS = [
    { id: 'm_first', name: 'Primeira Vitória', desc: 'Vença 1 batalha.', check: (s) => s.profile.wins >= 1, goal: (s) => [s.profile.wins, 1], reward: 'Título: Ninja Promissor' },
    { id: 'm_tenten', name: 'Treino com Armas', desc: 'Vença 3 batalhas.', check: (s) => s.profile.wins >= 3, goal: (s) => [s.profile.wins, 3], reward: 'Desbloqueia Tenten', unlock: 'tenten' },
    { id: 'm_kiba', name: 'Laços de Konoha', desc: 'Vença 2 batalhas com Hinata no time.', check: (s) => ((s.charStats.hinata || {}).wins || 0) >= 2, goal: (s) => [(s.charStats.hinata || {}).wins || 0, 2], reward: 'Desbloqueia Kiba', unlock: 'kiba' },
    { id: 'm_shino', name: 'Ascensão Chunin', desc: 'Alcance o nível 4.', check: (s) => NA.levelOf(s.profile.xp) >= 4, goal: (s) => [NA.levelOf(s.profile.xp), 4], reward: 'Desbloqueia Shino', unlock: 'shino' },
    { id: 'm_flawless', name: 'Sem Baixas', desc: 'Vença sem perder nenhum personagem.', check: (s) => s.profile.flawless >= 1, goal: (s) => [s.profile.flawless, 1], reward: 'Título: Estrategista' },
    { id: 'm_hard', name: 'Desafio Akatsuki', desc: 'Vença 3 batalhas no Difícil.', check: (s) => s.profile.hardWins >= 3, goal: (s) => [s.profile.hardWins, 3], reward: 'Título: Caçador de Akatsuki' },
    { id: 'm_streak', name: 'Imparável', desc: 'Vença 5 batalhas seguidas.', check: (s) => s.profile.bestStreak >= 5, goal: (s) => [s.profile.bestStreak, 5], reward: 'Título: Imparável' },
    { id: 'm_veteran', name: 'Veterano da Arena', desc: 'Vença 25 batalhas.', check: (s) => s.profile.wins >= 25, goal: (s) => [s.profile.wins, 25], reward: 'Título: Veterano' },
  ];
  NA.isUnlocked = function (save, id) {
    const ch = NA.CHARS_BY_ID[id];
    if (!ch.unlock || save.settings.freeMode) return true;
    const m = NA.MISSIONS.find((x) => x.id === ch.unlock);
    return m ? m.check(save) : true;
  };

  /** registra o resultado; retorna {xp, lp, levelUp, newMissions} */
  NA.recordResult = function (save, info) {
    const p = save.profile;
    const before = NA.levelOf(p.xp);
    const doneBefore = new Set(NA.MISSIONS.filter((m) => m.check(save)).map((m) => m.id));
    const mult = { facil: 0.6, normal: 1, dificil: 1.5 }[info.difficulty] || 1;
    let xp = 0, lp = 0;
    if (info.result === 'win') {
      xp = Math.round(100 * mult) + (info.flawless ? 25 : 0); lp = Math.round(25 * mult);
      p.wins++; p.streak++; p.bestStreak = Math.max(p.bestStreak, p.streak);
      if (info.difficulty === 'dificil') p.hardWins++;
      if (info.flawless) p.flawless++;
    } else if (info.result === 'loss') {
      xp = 20; lp = -10; p.losses++; p.streak = 0;
    } else { xp = 40; p.draws = (p.draws || 0) + 1; }
    p.xp += xp; p.lp = Math.max(0, (p.lp || 0) + lp);
    for (const id of info.team) {
      const cs = (save.charStats[id] = save.charStats[id] || { used: 0, wins: 0 });
      cs.used++; if (info.result === 'win') cs.wins++;
    }
    save.history.unshift({ t: Date.now(), result: info.result, team: info.team, enemy: info.enemy, difficulty: info.difficulty, turns: info.turns });
    save.history = save.history.slice(0, 30);
    const newMissions = NA.MISSIONS.filter((m) => m.check(save) && !doneBefore.has(m.id));
    for (const m of newMissions) if (!save.missionsDone.includes(m.id)) save.missionsDone.push(m.id);
    NA.writeSave(save);
    return { xp, lp, levelUp: NA.levelOf(p.xp) > before ? NA.levelOf(p.xp) : 0, newMissions };
  };

  if (typeof module !== 'undefined') module.exports = NA;
})();
