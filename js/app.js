/* Arena Ninja — interface */
(function () {
  const NA = globalThis.NA;
  const PASS_HASH = '572e31f55b6ac1b13fd5f5665d44bef1e3474ccf39b983428d4d8c4493d041c5';
  const UNLOCK_KEY = 'arenaNinja.unlock';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const app = $('#app');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const T = NA.TYPES;

  const A = { save: NA.loadSave(), screen: 'gate', team: [], b: null };
  A.team = (A.save.lastTeam || []).filter((id) => NA.CHARS_BY_ID[id] && NA.isUnlocked(A.save, id)).slice(0, 3);
  NA.sfxEnabled = A.save.settings.sound;
  globalThis.ArenaApp = A; // para testes
  NA.VFX.init(); NA.VFX.setQuality(A.save.settings.fx || 'alto'); NA.VFX.k = 1 / (A.save.settings.speed || 1);
  const spd = () => 1 / (A.save.settings.speed || 1);
  const V = NA.VFX;

  const RIVALS = ['Kabuto (Rival)', 'Zabuza Treinado', 'Esquadrão do Som', 'Akatsuki Sombria', 'Raiz da ANBU', 'Ninjas da Névoa', 'Irmãos da Areia', 'Clã Fantasma', 'Renegados de Ame', 'Bandidos de Taki'];

  // ---------- helpers de UI ----------
  function costHTML(cost) {
    let h = '';
    for (const k of T.concat(['rand'])) for (let i = 0; i < (cost[k] || 0); i++) h += `<i class="cd ${k}"></i>`;
    return h || '<span class="mut">Sem custo</span>';
  }
  function skillDetail(sk, id, si) {
    const cls = sk.cls.map((c) => `<span class="tag">${c}</span>`).join('');
    return `<div class="skitem"><div class="ico">${id ? skillIconHTML(id, si) : sk.icon}</div><div class="grow"><h4>${esc(sk.name)}</h4>
      <div class="meta"><span class="cost">${costHTML(sk.cost)}</span><span>· Recarga: ${sk.cd || 0}</span></div>
      <div class="meta" style="margin-top:4px">${cls}</div><p>${esc(sk.desc)}</p></div></div>`;
  }
  function toast(msg) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; $('#toast-root').appendChild(d); setTimeout(() => d.remove(), 2700); }
  function modal(html, opts) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="backdrop" data-a="${opts && opts.locked ? '' : 'closeModal'}"><div class="sheet" data-stop="1">${html}</div></div>`;
  }
  function closeModal() { $('#modal-root').innerHTML = ''; }
  function shuriken() {
    return `<svg class="shuriken" viewBox="0 0 100 100"><g fill="#cfd5e1" stroke="#6b7280" stroke-width="2"><path d="M50 2 L60 40 L98 50 L60 60 L50 98 L40 60 L2 50 L40 40 Z"/></g><circle cx="50" cy="50" r="8" fill="#0b0d12" stroke="#ff7a1a" stroke-width="3"/></svg>`;
  }
  function levelInfo() {
    const p = A.save.profile, L = NA.levelOf(p.xp);
    const a = NA.xpForLevel(L), b = NA.xpForLevel(L + 1);
    return { L, rank: NA.rankOf(L), pct: Math.round((100 * (p.xp - a)) / (b - a)), cur: p.xp - a, need: b - a };
  }

  // ---------- telas ----------
  const screens = {};
  function go(name, arg) { A.screen = name; closeModal(); screens[name](arg); window.scrollTo(0, 0); }

  screens.gate = function () {
    app.innerHTML = `<section class="screen gate">${shuriken()}<h1 class="title" style="font-size:44px">Arena Ninja</h1>
      <p class="mut" style="margin:0">Acesso privado</p>
      <form id="gateForm" class="col" style="align-items:center" autocomplete="off">
        <input id="pw" type="password" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Senha" aria-label="Senha">
        <div class="err" id="pwErr"></div>
        <button class="btn primary" style="min-width:200px" type="submit">Entrar</button>
      </form></section>`;
    $('#gateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#pw').value.trim().toLowerCase();
      if (sha256(v) === PASS_HASH) { localStorage.setItem(UNLOCK_KEY, PASS_HASH); NA.unlockAudio(); go('menu'); }
      else { $('#pwErr').textContent = 'Senha incorreta.'; $('#pw').value = ''; }
    });
  };

  screens.menu = function () {
    const p = A.save.profile, li = levelInfo();
    const wr = p.wins + p.losses ? Math.round((100 * p.wins) / (p.wins + p.losses)) : 0;
    app.innerHTML = `<section class="screen">
      <div class="hero">${shuriken()}<h1 class="title">Arena Ninja</h1><p>Batalhas táticas por turnos · 3 contra 3</p></div>
      <div class="card"><div class="profile"><div class="avatar-rank">🍥</div><div class="grow">
        <div style="font-weight:800;font-size:17px">${esc(p.name)}</div>
        <div class="mut" style="font-size:13px">Nível ${li.L} · ${li.rank}</div>
        <div class="xpbar"><i style="width:${li.pct}%"></i></div>
        <div class="mut" style="font-size:11px;margin-top:3px">${li.cur}/${li.need} XP para o nível ${li.L + 1}</div></div></div>
        <div class="stats3"><div><b>${p.wins}</b><span>Vitórias</span></div><div><b>${p.losses}</b><span>Derrotas</span></div><div><b>${wr}%</b><span>Aproveit.</span></div></div>
      </div>
      <div class="menu-grid">
        <button class="btn primary wide" data-a="go:select"><span class="ic">⚔️</span> Batalhar</button>
        <button class="btn" data-a="go:ladder"><span class="ic">🏆</span>Ladder &amp; Perfil</button>
        <button class="btn" data-a="go:missions"><span class="ic">📜</span>Missões</button>
        <button class="btn" data-a="go:help"><span class="ic">❓</span>Como Jogar</button>
        <button class="btn" data-a="go:options"><span class="ic">⚙️</span>Opções</button>
      </div>
      <p class="mut" style="text-align:center;font-size:11px;margin-top:18px">Projeto pessoal e privado, sem fins comerciais. Personagens © Masashi Kishimoto.</p>
    </section>`;
  };

  screens.select = function () {
    const s = A.save;
    const tiles = NA.CHARS.map((c) => {
      const un = NA.isUnlocked(s, c.id), inT = A.team.includes(c.id);
      return `<button class="tile ${inT ? 'in' : ''} ${un ? '' : 'locked'}" data-a="char:${c.id}"><div class="pic">${NA.portraitHTML(c.id, 't')}</div>${un ? '' : '<div class="lock">🔒</div>'}<div class="nm">${esc(c.short)}</div></button>`;
    }).join('');
    const slots = [0, 1, 2].map((i) => {
      const id = A.team[i];
      if (!id) return `<div class="slot">Vazio</div>`;
      return `<div class="slot filled" data-a="char:${id}">${NA.portraitHTML(id, 's' + i)}<button class="x" data-a="rm:${id}" aria-label="Remover">✕</button><div class="nm">${esc(NA.CHARS_BY_ID[id].short)}</div></div>`;
    }).join('');
    const d = s.settings.difficulty;
    app.innerHTML = `<section class="screen">
      <div class="topbar"><button class="btn small back" data-a="go:menu">←</button><h2 class="grow">Escolha seu time</h2><button class="btn small" data-a="randomTeam">🎲 Aleatório</button></div>
      <div class="slots">${slots}</div>
      <div style="margin-top:10px" class="seg" role="tablist">
        <button class="${d === 'facil' ? 'on' : ''}" data-a="diff:facil">Fácil</button>
        <button class="${d === 'normal' ? 'on' : ''}" data-a="diff:normal">Normal</button>
        <button class="${d === 'dificil' ? 'on' : ''}" data-a="diff:dificil">Difícil</button>
      </div>
      <div class="roster">${tiles}</div>
      <div class="sticky-bottom"><div class="in"><button class="btn primary grow" style="min-height:54px;font-size:18px" data-a="start" ${A.team.length === 3 ? '' : 'disabled'}>⚔️ Iniciar Batalha (${A.team.length}/3)</button></div></div>
    </section>`;
  };

  function charSheet(id) {
    const c = NA.CHARS_BY_ID[id], s = A.save;
    const un = NA.isUnlocked(s, id), inT = A.team.includes(id);
    const m = c.unlock ? NA.MISSIONS.find((x) => x.id === c.unlock) : null;
    const st = s.charStats[id] || { used: 0, wins: 0 };
    let btn;
    if (!un) btn = `<div class="card mut" style="text-align:center">🔒 Bloqueado — Missão “${esc(m.name)}”: ${esc(m.desc)}</div>`;
    else if (inT) btn = `<button class="btn danger" style="width:100%" data-a="rm:${id}">Remover do time</button>`;
    else btn = `<button class="btn primary" style="width:100%" data-a="add:${id}" ${A.team.length >= 3 ? 'disabled' : ''}>${A.team.length >= 3 ? 'Time completo' : 'Adicionar ao time'}</button>`;
    modal(`<div class="det-head"><div class="portrait">${NA.portraitHTML(id, 'd')}</div><div><h3>${esc(c.name)}</h3><div class="mut" style="font-size:13px">${esc(c.title)} · ${esc(c.rank)}</div>
      <div class="mut" style="font-size:12px;margin-top:4px">Partidas: ${st.used} · Vitórias: ${st.wins}</div></div></div>
      <p style="margin:0 0 10px;font-size:14px;color:#d3d9e4">${esc(c.bio)}</p>
      <div class="sklist">${c.skills.map((sk, i) => skillDetail(sk, id, i)).join('')}</div>
      <div style="margin-top:12px" class="col">${btn}<button class="btn ghost" data-a="closeModal">Fechar</button></div>`);
  }

  screens.ladder = function () {
    const s = A.save, p = s.profile, li = levelInfo();
    // ladder fictícia de rivais
    const rivals = [['Uchiha Madara?', 4200], ['Pain de Ame', 3300], ['Jiraiya Sensei', 2600], ['Tsunade', 2100], ['Kabuto', 1500], ['Zabuza', 1100], ['Haku', 800], ['Temari', 560], ['Kankuro', 380], ['Ino Yamanaka', 220], ['Chouji', 140], ['Konohamaru', 60], ['Iruka', 20]];
    const rows = rivals.map(([n, lp]) => ({ n, lp })).concat([{ n: p.name, lp: p.lp || 0, me: true }]).sort((a, b) => b.lp - a.lp);
    const pos = rows.findIndex((r) => r.me) + 1;
    const used = Object.entries(s.charStats).sort((a, b) => b[1].used - a[1].used);
    const hist = s.history.slice(0, 10).map((h) => `<tr><td>${h.result === 'win' ? '🏆' : h.result === 'loss' ? '💀' : '🤝'}</td><td>${h.team.map((id) => NA.CHARS_BY_ID[id] ? NA.CHARS_BY_ID[id].short : id).join(', ')}</td><td class="mut">vs ${h.enemy.map((id) => NA.CHARS_BY_ID[id] ? NA.CHARS_BY_ID[id].short : id).join(', ')}</td><td class="mut">${({ facil: 'F', normal: 'N', dificil: 'D' })[h.difficulty] || ''}</td></tr>`).join('');
    app.innerHTML = `<section class="screen">
      <div class="topbar"><button class="btn small back" data-a="go:menu">←</button><h2 class="grow">Ladder &amp; Perfil</h2></div>
      <div class="card"><div class="profile"><div class="avatar-rank">🏅</div><div class="grow"><div style="font-weight:800;font-size:17px">${esc(p.name)}</div>
        <div class="mut" style="font-size:13px">Nível ${li.L} · ${li.rank} · ${p.lp || 0} PL · #${pos} na ladder</div><div class="xpbar"><i style="width:${li.pct}%"></i></div></div></div>
        <div class="stats3"><div><b>${p.wins}</b><span>Vitórias</span></div><div><b>${p.losses}</b><span>Derrotas</span></div><div><b>${p.xp}</b><span>XP total</span></div>
        <div><b>${p.streak}</b><span>Sequência</span></div><div><b>${p.bestStreak}</b><span>Melhor seq.</span></div><div><b>${p.hardWins}</b><span>Vitórias Difícil</span></div></div></div>
      <h3 style="margin:16px 0 8px">🏆 Ladder</h3>
      <div class="card" style="padding:4px 8px"><table class="lad">${rows.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>#${i + 1}</td><td>${esc(r.n)}</td><td style="text-align:right">${r.lp} PL</td></tr>`).join('')}</table></div>
      <h3 style="margin:16px 0 8px">👥 Personagens mais usados</h3>
      <div class="card" style="padding:4px 8px">${used.length ? `<table class="lad">${used.map(([id, v]) => `<tr><td>${esc(NA.CHARS_BY_ID[id] ? NA.CHARS_BY_ID[id].short : id)}</td><td class="mut">${v.used} partidas</td><td style="text-align:right">${v.wins} vitórias</td></tr>`).join('')}</table>` : '<p class="mut">Jogue para ver estatísticas.</p>'}</div>
      <h3 style="margin:16px 0 8px">📜 Últimas partidas</h3>
      <div class="card" style="padding:4px 8px">${hist ? `<table class="lad">${hist}</table>` : '<p class="mut">Nenhuma partida ainda.</p>'}</div>
    </section>`;
  };

  screens.missions = function () {
    const s = A.save;
    app.innerHTML = `<section class="screen"><div class="topbar"><button class="btn small back" data-a="go:menu">←</button><h2 class="grow">Missões</h2></div>
      <div class="col">${NA.MISSIONS.map((m) => {
        const done = m.check(s), [a, b] = m.goal(s);
        return `<div class="card mission ${done ? 'done' : ''}"><div class="mi">${done ? '✅' : m.unlock ? '🔒' : '📜'}</div><div class="grow"><b>${esc(m.name)}</b><div class="mut" style="font-size:13px">${esc(m.desc)}</div>
          <div style="font-size:12px;color:var(--or2);margin-top:2px">🎁 ${esc(m.reward)}</div><div class="pbar"><i style="width:${Math.min(100, (100 * a) / b)}%"></i></div></div><div class="mut" style="font-size:12px">${Math.min(a, b)}/${b}</div></div>`;
      }).join('')}</div></section>`;
  };

  screens.options = function () {
    const st = A.save.settings;
    app.innerHTML = `<section class="screen"><div class="topbar"><button class="btn small back" data-a="go:menu">←</button><h2 class="grow">Opções</h2></div>
      <div class="card col">
        <label class="col" style="gap:6px"><span class="mut" style="font-size:13px">Nome do ninja</span>
        <input id="nameIn" maxlength="20" value="${esc(A.save.profile.name)}" style="padding:12px;border-radius:10px;border:1px solid var(--line);background:#0f131b;color:var(--txt)"></label>
        <div class="toggle"><div><b>Sons</b><div class="mut" style="font-size:12px">Efeitos sonoros sintetizados</div></div><button class="sw ${st.sound ? 'on' : ''}" data-a="opt:sound" aria-label="Sons"></button></div>
        <div class="toggle col"><div><b>Efeitos visuais</b><div class="mut" style="font-size:12px">Baixo economiza bateria em celulares</div></div><div class="seg">${[['alto', 'Alto'], ['medio', 'Médio'], ['baixo', 'Baixo']].map(([v, l]) => `<button class="${(st.fx || 'alto') === v ? 'on' : ''}" data-a="opt:fx:${v}">${l}</button>`).join('')}</div></div>
        <div class="toggle col"><div><b>Velocidade da batalha</b><div class="mut" style="font-size:12px">Ritmo das animações e do turno inimigo</div></div><div class="seg">${[[0.7, 'Lenta'], [1, 'Normal'], [2, 'Rápida'], [3, 'Turbo']].map(([v, l]) => `<button class="${(st.speed || 1) === v ? 'on' : ''}" data-a="opt:speed:${v}">${l}</button>`).join('')}</div></div>
        <div class="toggle"><div><b>Modo livre</b><div class="mut" style="font-size:12px">Libera todos os personagens sem missões</div></div><button class="sw ${st.freeMode ? 'on' : ''}" data-a="opt:freeMode" aria-label="Modo livre"></button></div>
      </div>
      <h3 style="margin:16px 0 8px">💾 Progresso</h3>
      <div class="card col"><p class="mut" style="margin:0;font-size:13px">Seu progresso fica salvo neste aparelho (versão do save: ${A.save.v}). Use exportar/importar para copiar entre aparelhos.</p>
        <div class="row"><button class="btn grow" data-a="export">Exportar</button><button class="btn grow" data-a="import">Importar</button></div>
        <button class="btn ghost" data-a="lock">🔒 Bloquear novamente (pede a senha)</button></div>
    </section>`;
    $('#nameIn').addEventListener('change', (e) => { A.save.profile.name = e.target.value.trim().slice(0, 20) || 'Ninja'; NA.writeSave(A.save); toast('Nome salvo'); });
  };

  screens.help = function () {
    app.innerHTML = `<section class="screen help"><div class="topbar"><button class="btn small back" data-a="go:menu">←</button><h2 class="grow">Como Jogar</h2></div>
      <div class="card"><ul style="padding-left:18px;margin:0">
        <li>Monte um time de <b>3 ninjas</b> e enfrente um time controlado pela IA. Cada ninja tem <b>100 de vida</b>.</li>
        <li>No início de cada turno você recebe <b>1 chakra aleatório por ninja vivo</b> (quem começa recebe só 1 no primeiro turno).</li>
        <li>Tipos de chakra: <i class="cd tai"></i> Taijutsu (verde), <i class="cd blood"></i> Kekkei Genkai (vermelho), <i class="cd nin"></i> Ninjutsu (azul), <i class="cd gen"></i> Genjutsu (branco). <i class="cd rand"></i> Aleatório = qualquer tipo.</li>
        <li>Toque numa habilidade e depois no alvo destacado. Habilidades em si mesmo ou em área entram na fila direto. Cada ninja usa <b>uma habilidade por turno</b>.</li>
        <li>Toque no ícone laranja do ninja (ou na fila) para cancelar. Aperte <b>PRONTO</b> para executar — se houver custo aleatório, você escolhe quais chakras gastar.</li>
        <li><b>Trocar</b> (🔄): troque 5 chakras por 1 do tipo que quiser.</li>
        <li><b>Dano normal</b> é reduzido por redução de dano; <b>perfurante</b> ignora redução; <b>aflição</b> ignora redução e defesa destrutível.</li>
        <li><b>Invulnerável</b>: não pode ser alvo de habilidades inimigas. <b>Atordoado</b>: não pode usar habilidades. <b>Ação</b>: efeito contínuo que termina se o usuário for atordoado.</li>
        <li>Recarga (número sobre a habilidade) indica quantos turnos faltam para usá-la de novo.</li>
        <li>Vença para ganhar XP, subir de nível/rank, ganhar pontos de ladder e completar missões que desbloqueiam personagens.</li>
      </ul></div></section>`;
  };

  // ---------- batalha ----------
  function startBattle() {
    if (A.team.length !== 3) return;
    A.save.lastTeam = A.team.slice(); NA.writeSave(A.save);
    const pool = NA.CHARS.map((c) => c.id).sort(() => Math.random() - 0.5);
    const enemy = A.forceEnemy || pool.slice(0, 3);
    const st = NA.createBattle(A.team.slice(), enemy);
    A.b = { st, q: [], sel: null, busy: false, info: null, diff: A.save.settings.difficulty, rival: RIVALS[Math.floor(Math.random() * RIVALS.length)], enemy, team: A.team.slice() };
    A.screen = 'battle';
    closeModal();
    app.innerHTML = '';
    renderBattle();
    ribbon(`Turno 1 · Sua vez`);
    NA.sfx('turn');
  }

  function stIcon(st, c, s) {
    const good = s.srcSide === c.side;
    const n = NA.turnsLeft(st, s);
    return `<span class="s ${good ? 'good' : 'bad'}">${s.icon || '•'}${s.stacks > 1 ? `<i>${s.stacks}</i>` : n < 50 ? `<i>${n}</i>` : ''}</span>`;
  }

  const LANES = [{ x: 13, b: 35, s: 0.84, z: 1 }, { x: 25, b: 17, s: 0.92, z: 2 }, { x: 39, b: 1, s: 1, z: 3 }];
  function hpBar(c) {
    const hpc = c.hp > 60 ? '#35c24a' : c.hp > 30 ? '#f2b705' : '#e33b3b';
    const pv = A.b && A.b.preview && A.b.preview[c.uid];
    const pvh = pv > 0 ? `<i class="pvbar" style="left:${Math.max(0, c.hp - pv)}%;width:${Math.min(pv, c.hp)}%"></i>` : pv < 0 ? `<i class="pvbar heal" style="left:${c.hp}%;width:${Math.min(-pv, 100 - c.hp)}%"></i>` : '';
    return `<div class="hp" data-hp="${c.uid}"><i class="ghost" style="width:${c.hp}%"></i><i class="bar" style="width:${c.hp}%;background:${hpc}"></i>${pvh}<span>${c.hp}</span></div>`;
  }
  function unitHTML(c) {
    const L = LANES[c.idx], foe = c.side === 1, x = foe ? 100 - L.x : L.x, def = NA.CHARS_BY_ID[c.id];
    return `<div class="unit ${foe ? 'foe' : 'me'}" data-uid="${c.uid}" style="left:${x}%;bottom:${L.b}%;z-index:${L.z};--s:${L.s}">
      <div class="shadow"></div><div class="aura-back"></div>
      <div class="body"><div class="flip"><img class="rend" alt="${esc(def.short)}" src="img/full/${c.id}.webp?v=${NA.IMG_V}" style="animation-delay:-${((c.uid * 0.37) % 2.4).toFixed(2)}s" onerror="this.parentNode.classList.add('noimg');this.remove()"><span class="fb">${NA.portraitHTML(c.id, 'f' + c.uid)}</span></div></div>
      <div class="aura-front"></div><div class="ubar" data-a="fighter:${c.uid}"></div><div class="ovl"></div></div>`;
  }
  function updateStage() {
    const b = A.b, st = b.st;
    for (const c of NA.allChars(st)) {
      const u = $(`.unit[data-uid="${c.uid}"]`); if (!u) continue;
      const def = NA.CHARS_BY_ID[c.id];
      const stunned = c.alive && c.st.some((s) => s.stun === true);
      const tg = !!(b.sel && b.targets && b.targets.includes(c.uid));
      u.classList.toggle('dead', !c.alive); u.classList.toggle('stunned', stunned); u.classList.toggle('target', tg);
      const al = c.alive;
      u.classList.toggle('a-shield', al && c.st.some((s) => s.dd > 0));
      u.classList.toggle('a-inv', al && c.st.some((s) => s.invuln));
      u.classList.toggle('a-dr', al && c.st.some((s) => s.dr > 0));
      u.classList.toggle('a-burn', al && c.st.some((s) => s.key === 'amaterasu'));
      u.classList.toggle('a-poison', al && c.st.some((s) => s.dot && s.key !== 'amaterasu'));
      u.classList.toggle('a-gates', al && c.st.some((s) => s.key === 'gates' || s.key === 'inner'));
      u.classList.toggle('a-buff', al && c.st.some((s) => s.dmgUp > 0 || s.hot));
      u.classList.toggle('a-weak', al && c.st.some((s) => s.dmgDown || s.vuln));
      const pv = b.preview && b.preview[c.uid];
      $('.ubar', u).innerHTML = `${pv ? `<span class="pv ${pv > 0 ? 'd' : 'h'}">${pv > 0 ? '-' + pv : '+' + -pv}</span>` : ''}<span class="un">${stunned ? '<b class="stun-ic">💫</b>' : ''}${esc(def.short)}</span>${hpBar(c)}<div class="sts">${c.alive ? c.st.map((s) => stIcon(st, c, s)).join('') : ''}</div>`;
      const q = c.side === 0 ? b.q.find((x) => x.ci === c.idx) : null;
      const inc = b.q.filter((x) => x.tgt === c.uid || (x.aoe && x.aoeSide === c.side)).map((x) => NA.skillOf(st.teams[0].chars[x.ci], x.si).icon);
      void q;
      $('.ovl', u).innerHTML = (inc.length ? `<div class="inc">${inc.map((i) => `<span>${i}</span>`).join('')}</div>` : '');
    }
  }
  function prowHTML(c) {
    const b = A.b;
    const q = b.q.find((x) => x.ci === c.idx);
    const tg = b.sel && b.targets && b.targets.includes(c.uid);
    return `<div class="prow ${c.alive ? '' : 'dead'}"><div class="mini ${tg ? 'target' : ''}" data-a="fighter:${c.uid}"><div class="mp">${NA.portraitHTML(c.id, 'm' + c.uid)}${c.alive ? '' : '<b class="skull">☠</b>'}</div>${q ? `<button class="qbadge" data-a="deq:${c.idx}" aria-label="Cancelar">${NA.skillOf(c, q.si).icon}</button>` : ''}${hpBar(c)}</div>
      <div class="skills">${[0, 1, 2, 3].map((si) => skillBtn(c, si)).join('')}</div></div>`;
  }

  function mainType(sk) { let m = 'rand', mx = 0; for (const k of T) if ((sk.cost[k] || 0) > mx) { mx = sk.cost[k]; m = k; } return m; }
  function skillIconHTML(id, si, cls) {
    const key = id + si, sk = NA.CHARS_BY_ID[id].skills[si];
    const img = NA.SKILL_IMGS && NA.SKILL_IMGS.has(key) ? `<i style="background-image:url('img/sk/${key}.webp?v=3')"></i>` : '';
    return `<span class="ski ${cls || ''} t-${mainType(sk)}"><b>${sk.icon}</b>${img}</span>`;
  }
  function skillBtn(c, si) {
    const b = A.b, st = b.st, sk = NA.skillOf(c, si);
    const myTurn = st.side === 0 && !b.busy && st.winner == null;
    const r = NA.canUse(st, 0, c.idx, si, b.q);
    const queued = b.q.find((x) => x.ci === c.idx && x.si === si);
    const sel = b.sel && b.sel.ci === c.idx && b.sel.si === si;
    const cdLeft = c.cd[si] > st.half ? Math.ceil((c.cd[si] - st.half) / 2) : 0;
    const off = !queued && (!myTurn || !r.ok);
    let costs = '';
    for (const k of T.concat(['rand'])) for (let i = 0; i < (sk.cost[k] || 0); i++) costs += `<i class="cd ${k}"></i>`;
    return `<button class="skill ${off ? 'off' : ''} ${sel ? 'sel' : ''} ${queued ? 'queued' : ''}" data-a="skill:${c.idx}:${si}" aria-label="${esc(sk.name)}">${skillIconHTML(c.id, si)}<span class="costs">${costs}</span>${cdLeft && !queued ? `<span class="cdn">${cdLeft}</span>` : ''}</button>`;
  }

  function infoHTML() {
    const b = A.b, st = b.st;
    if (st.winner != null) return `<div class="hint">Batalha encerrada.</div>`;
    if (b.busy) return `<h4>⏳ ${st.side === 1 ? 'Turno do oponente…' : 'Executando…'}</h4><div class="hint">Observe as técnicas sendo usadas.</div>`;
    if (b.info && b.info.type === 'skill') {
      const c = st.teams[b.info.side].chars[b.info.ci], sk = NA.skillOf(c, b.info.si);
      const r = b.info.side === 0 ? NA.canUse(st, 0, b.info.ci, b.info.si, b.q) : { ok: true };
      const queued = b.q.find((x) => x.ci === b.info.ci && x.si === b.info.si);
      return `<h4>${skillIconHTML(c.id, b.info.si, 'mini')} ${esc(sk.name)} <span class="cost" style="margin-left:auto">${costHTML(sk.cost)}</span></h4>
        <div class="meta" style="margin:3px 0">${sk.cls.map((x) => `<span class="tag">${x}</span>`).join('')}<span>Recarga ${sk.cd || 0}</span></div>
        <div>${esc(sk.desc)}</div>
        ${queued ? '<div class="hint" style="margin-top:4px">✅ Na fila. Toque no ícone laranja para cancelar.</div>' : b.sel ? '<div style="margin-top:4px;color:var(--or2);font-weight:700">👉 Toque em um alvo destacado.</div>' : !r.ok ? `<div class="why" style="margin-top:4px">⛔ ${esc(r.why)}</div>` : ''}`;
    }
    if (b.info && b.info.type === 'char') {
      const c = NA.byUid(st, b.info.uid), def = NA.CHARS_BY_ID[c.id];
      const sts = c.st.map((s) => `<li>${s.icon} <b>${esc(s.name)}</b>${NA.turnsLeft(st, s) < 50 ? ` <span class="mut">(${NA.turnsLeft(st, s)} t)</span>` : ''} — ${esc(NA.statusText(st, s))}</li>`).join('');
      const skills = c.side === 1 ? `<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${def.skills.map((sk, i) => `<button class="btn small" data-a="eskill:${c.idx}:${i}">${sk.icon} ${esc(sk.name)}</button>`).join('')}</div>` : '';
      return `<h4>${esc(def.name)} <span class="mut" style="font-size:12px;margin-left:auto">${c.hp}/100</span></h4>
        ${sts ? `<ul class="stl">${sts}</ul>` : '<div class="hint">Nenhum efeito ativo.</div>'}${skills}`;
    }
    const used = b.q.length;
    return `<h4>🍥 Sua vez</h4><div class="hint">Toque em uma habilidade e depois no alvo (no palco ou no retrato). Toque nos ninjas para ver efeitos. ${used ? `<br><b style="color:var(--or2)">${used} técnica(s) na fila.</b>` : ''}</div>`;
  }

  function buildBattle() {
    const st = A.b.st;
    app.innerHTML = `<section class="battle"><div class="bt-top" id="bt-top"></div>
      <div class="stage" id="stage" data-a="stagetap"><div class="stage-fx"></div>${NA.allChars(st).map(unitHTML).join('')}</div>
      <div class="panel" id="panel"></div><div class="info" id="info"></div><div class="bt-bottom" id="bt-bottom"></div></section>`;
  }
  function renderBattle() {
    const b = A.b, st = b.st;
    if (!$('#stage')) buildBattle();
    const pool = st.teams[0].chakra;
    const avail = NA.poolAfterSpecific(st, 0, b.q);
    const tot = T.reduce((a, k) => a + pool[k], 0);
    const myTurn = st.side === 0 && !b.busy && st.winner == null;
    $('#bt-top').innerHTML = `<div class="turninfo ${st.side === 1 ? 'foe' : ''}">Turno ${st.turnNo}<b>${st.winner != null ? 'Fim' : st.side === 0 ? 'Sua vez' : 'Oponente'}</b></div>
        <div class="chakra">${T.map((k) => `<div class="ck" data-ck="${k}" title="${NA.TYPE_INFO[k].name}"><i class="cd ${k}"></i>${avail[k]}</div>`).join('')}<div class="ck tot">Σ${tot}</div></div>
        <button class="iconbtn" data-a="exchange" ${myTurn ? '' : 'disabled'} aria-label="Trocar chakra">🔄</button>
        <button class="iconbtn" data-a="log" aria-label="Registro">📜</button>
        <button class="iconbtn" data-a="bmenu" aria-label="Menu">⋯</button>`;
    $('#panel').innerHTML = st.teams[0].chars.map(prowHTML).join('');
    $('#info').innerHTML = infoHTML();
    const qh = b.q.map((x) => `<button class="q" data-a="deq:${x.ci}">${skillIconHTML(st.teams[0].chars[x.ci].id, x.si)}</button>`).join('');
    $('#bt-bottom').innerHTML = `<div class="queue">${qh || `<span>vs <b>${esc(b.rival)}</b> · ${({ facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' })[b.diff]}</span>`}</div>
        <button class="btn primary pronto ${myTurn ? '' : 'wait'}" data-a="ready" ${myTurn ? '' : 'disabled'}>${myTurn ? 'PRONTO' : '…'}</button>`;
    updateStage();
  }

  function computePreview(ci, si, targets) {
    const b = A.b, st = b.st, out = {};
    try {
      const base = b.q.filter((x) => x.ci !== ci).map((x) => ({ ci: x.ci, si: x.si, tgt: x.tgt }));
      const s0 = NA.clone(st); NA.resolveActions(s0, 0, base, null);
      for (const uid of targets) {
        const s1 = NA.clone(st); NA.resolveActions(s1, 0, base.concat([{ ci, si, tgt: uid }]), null);
        const d = NA.byUid(s0, uid).hp - NA.byUid(s1, uid).hp; if (d) out[uid] = d;
      }
    } catch (e) { return null; }
    return out;
  }
  function onSkill(ci, si) {
    const b = A.b, st = b.st;
    b.preview = null;
    const c = st.teams[0].chars[ci];
    b.info = { type: 'skill', side: 0, ci, si };
    if (st.side !== 0 || b.busy || st.winner != null) { renderBattle(); return; }
    const already = b.q.findIndex((x) => x.ci === ci);
    if (already >= 0 && b.q[already].si === si) { renderBattle(); return; }
    if (b.sel && b.sel.ci === ci && b.sel.si === si) { b.sel = null; b.targets = null; renderBattle(); return; }
    const qWithout = b.q.filter((x) => x.ci !== ci);
    const r = NA.canUse(st, 0, ci, si, qWithout);
    if (!r.ok) { b.sel = null; b.targets = null; NA.sfx('tap'); renderBattle(); return; }
    const sk = NA.skillOf(c, si);
    const tt = NA.targetType(st, c, sk);
    const valid = NA.validTargets(st, c, si);
    NA.sfx('tap');
    if (tt === 'self' || tt === 'allEnemies' || tt === 'allAllies') {
      b.q = qWithout.concat([{ ci, si, tgt: tt === 'self' ? c.uid : null, aoe: tt !== 'self', aoeSide: tt === 'allEnemies' ? 1 : 0 }]);
      b.sel = null; b.targets = null;
    } else {
      b.sel = { ci, si }; b.targets = valid.map((t) => t.uid);
      b.preview = computePreview(ci, si, b.targets);
    }
    renderBattle();
  }

  const alphaCache = {};
  function alphaAt(img, px, py) {
    let a = alphaCache[img.src];
    if (!a) {
      try {
        const c = document.createElement('canvas'), s = 0.25;
        c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
        const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
        a = alphaCache[img.src] = { d: x.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height, s };
      } catch (e) { return 255; }
    }
    const ix = Math.floor(px * a.s), iy = Math.floor(py * a.s);
    if (ix < 0 || iy < 0 || ix >= a.w || iy >= a.h) return 0;
    return a.d[(iy * a.w + ix) * 4 + 3];
  }
  /** escolhe o ninja tocado no palco: pixel visível > alvo válido mais próximo > mais próximo */
  function pickUnit(x, y) {
    const b = A.b; const cands = [];
    for (const u of $$('.unit')) {
      const uid = +u.dataset.uid, p = posOf(uid); if (!p) continue;
      const inBox = x >= p.left - 8 && x <= p.left + p.w + 8 && y >= p.top - 8 && y <= p.bottom + 8;
      let hit = false;
      if (inBox && p.img && p.img.naturalWidth && !u.classList.contains('dead')) {
        let nx = ((x - p.left) / p.w) * p.img.naturalWidth; if (uid >= 10) nx = p.img.naturalWidth - nx;
        const ny = ((y - p.top) / p.h) * p.img.naturalHeight;
        hit = alphaAt(p.img, nx, ny) > 40;
      }
      cands.push({ uid, hit, inBox, dist: Math.hypot(x - p.x, y - (p.top + p.h * 0.5)), valid: !!(b.targets && b.targets.includes(uid)), z: +u.style.zIndex || 0 });
    }
    const by = (f) => cands.filter(f).sort((a, c) => a.dist - c.dist);
    const pick = by((c) => c.hit && c.valid)[0] || (b.sel ? by((c) => c.inBox && c.valid)[0] : null) || by((c) => c.hit).sort((a, c) => c.z - a.z)[0] || by((c) => c.inBox)[0] || by((c) => c.dist < 70)[0];
    return pick ? pick.uid : null;
  }
  A.pickUnit = pickUnit;
  A.startBattle = startBattle;
  // gancho de demonstração (capturas de tela / vídeo): toca um jutsu sem alterar a batalha
  A.demoSkill = async (uid, si, targets, amt) => {
    const st = A.b.st, c = NA.byUid(st, uid), sk = NA.skillOf(c, si);
    const harmful = targets.some((t) => (t >= 10) !== (uid >= 10));
    const ev = [{ t: 'skill', uid, si, name: sk.name, icon: sk.icon, targets, harmful }];
    if (harmful && amt) targets.forEach((t) => ev.push({ t: 'dmg', uid: t, amt, kind: 'normal', hp: NA.byUid(st, t).hp }));
    await playEvents(ev);
  };
  function onFighter(uid) {
    const b = A.b, st = b.st;
    if (b.sel && b.targets && b.targets.includes(uid)) {
      b.q = b.q.filter((x) => x.ci !== b.sel.ci).concat([{ ci: b.sel.ci, si: b.sel.si, tgt: uid }]);
      b.info = { type: 'skill', side: 0, ci: b.sel.ci, si: b.sel.si };
      b.sel = null; b.targets = null; b.preview = null; NA.sfx('tap');
    } else {
      b.sel = null; b.targets = null; b.preview = null;
      b.info = { type: 'char', uid };
    }
    renderBattle();
  }

  function ready() {
    const b = A.b, st = b.st;
    if (st.side !== 0 || b.busy) return;
    const need = NA.randomNeeded(st, 0, b.q);
    if (need > 0) {
      const avail = NA.poolAfterSpecific(st, 0, b.q);
      b.pay = NA.autoPay(avail, need); b.payNeed = need; b.payAvail = avail;
      payModal();
    } else doPlayerTurn(null);
  }

  function payModal() {
    const b = A.b, sum = T.reduce((a, k) => a + b.pay[k], 0);
    modal(`<h3>Chakra aleatório</h3><p class="mut" style="font-size:13px;margin:6px 0 12px">Escolha ${b.payNeed} chakra(s) para pagar os custos aleatórios.</p>
      <div class="col">${T.map((k) => `<div class="stepper"><span class="row" style="gap:8px"><i class="cd ${k}" style="width:16px;height:16px"></i>${NA.TYPE_INFO[k].name} <span class="mut">(${b.payAvail[k]})</span></span>
        <span class="row"><button class="btn small" data-a="pay:${k}:-1">−</button><b>${b.pay[k]}</b><button class="btn small" data-a="pay:${k}:1">+</button></span></div>`).join('')}</div>
      <div class="row" style="margin-top:14px"><button class="btn grow" data-a="closeModal">Voltar</button><button class="btn primary grow" data-a="payok" ${sum === b.payNeed ? '' : 'disabled'}>Confirmar (${sum}/${b.payNeed})</button></div>`);
  }

  function exchangeModal() {
    const b = A.b, st = b.st;
    const avail = NA.poolAfterSpecific(st, 0, b.q);
    b.ex = b.ex || { give: { tai: 0, blood: 0, nin: 0, gen: 0 }, get: 'tai' };
    const sum = T.reduce((a, k) => a + b.ex.give[k], 0);
    const total = T.reduce((a, k) => a + Math.max(0, avail[k]), 0);
    modal(`<h3>🔄 Trocar chakra</h3><p class="mut" style="font-size:13px;margin:6px 0 12px">Troque 5 chakras (não reservados pela fila) por 1 do tipo escolhido.</p>
      ${total < 5 ? '<div class="why" style="color:#ff8b6b">Você precisa de pelo menos 5 chakras livres.</div>' : ''}
      <div class="col">${T.map((k) => `<div class="stepper"><span class="row" style="gap:8px"><i class="cd ${k}" style="width:16px;height:16px"></i>${NA.TYPE_INFO[k].name} <span class="mut">(${avail[k]})</span></span>
        <span class="row"><button class="btn small" data-a="exg:${k}:-1">−</button><b>${b.ex.give[k]}</b><button class="btn small" data-a="exg:${k}:1">+</button></span></div>`).join('')}</div>
      <p style="margin:12px 0 6px;font-weight:700">Receber:</p>
      <div class="seg">${T.map((k) => `<button class="${b.ex.get === k ? 'on' : ''}" data-a="exget:${k}"><i class="cd ${k}"></i> ${NA.TYPE_INFO[k].short}</button>`).join('')}</div>
      <div class="row" style="margin-top:14px"><button class="btn grow" data-a="closeModal">Cancelar</button><button class="btn primary grow" data-a="exok" ${sum === 5 ? '' : 'disabled'}>Trocar (${sum}/5)</button></div>`);
  }

  // ---------- efeitos visuais ----------
  const fx = () => $('#fx-layer');
  function posOf(uid) {
    const u = $(`.unit[data-uid="${uid}"]`);
    if (!u) return null;
    const t = $('.rend', u) || $('.fb', u) || $('.body', u);
    const r = t.getBoundingClientRect();
    let L = r.left, Wd = r.width, Tp = r.top, Hh = r.height;
    if (t.naturalWidth && !u.classList.contains('dead')) { const sc = Math.min(r.width / t.naturalWidth, r.height / t.naturalHeight); Wd = t.naturalWidth * sc; Hh = t.naturalHeight * sc; L = r.left + (r.width - Wd) / 2; Tp = r.bottom - Hh; }
    return { x: L + Wd / 2, y: Tp + Hh * 0.42, top: Tp, bottom: Tp + Hh, w: Wd, h: Hh, left: L, el: u, body: $('.body', u), img: $('.rend', u) };
  }
  const centerOf = posOf;
  function floatText(uid, text, cls, size, sub) {
    const p = centerOf(uid); if (!p) return;
    const d = document.createElement('div'); d.className = 'float ' + cls; d.textContent = text;
    if (size) d.style.fontSize = size + 'px';
    if (sub) { const s2 = document.createElement('small'); s2.textContent = sub; d.appendChild(s2); }
    const w = cls === 'info' ? 70 : 30; d.style.left = Math.max(w, Math.min(window.innerWidth - w, p.x + (Math.random() * 16 - 8))) + 'px'; d.style.top = p.y - 10 + 'px';
    fx().appendChild(d); setTimeout(() => d.remove(), 1200);
  }
  function sparks(uid, color) {
    const p = centerOf(uid); if (!p || !Element.prototype.animate) return;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div'); s.className = 'spark'; s.style.left = p.x + 'px'; s.style.top = p.y + 'px'; s.style.background = color;
      fx().appendChild(s);
      const a = Math.random() * Math.PI * 2, r = 25 + Math.random() * 35;
      s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px)) scale(.2)`, opacity: 0 }], { duration: 520, easing: 'ease-out' });
      setTimeout(() => s.remove(), 540);
    }
  }
  function impact(uid, icon, kind) {
    const p = centerOf(uid); if (!p || !Element.prototype.animate) return;
    const ring = document.createElement('div'); ring.className = 'ring ' + (kind || ''); ring.style.left = p.x + 'px'; ring.style.top = p.y + 'px';
    const ic = document.createElement('div'); ic.className = 'impact'; ic.textContent = icon; ic.style.left = p.x + 'px'; ic.style.top = p.y + 'px';
    fx().appendChild(ring); fx().appendChild(ic);
    ring.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.8)', opacity: 0 }], { duration: 520, easing: 'ease-out' });
    ic.animate([{ transform: 'translate(-50%,-50%) scale(.3) rotate(-20deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.7) rotate(8deg)', opacity: 1, offset: 0.35 }, { transform: 'translate(-50%,-60%) scale(1.3)', opacity: 0 }], { duration: 650, easing: 'ease-out' });
    setTimeout(() => { ring.remove(); ic.remove(); }, 680);
  }
  function lunge(uid, toUid, melee) {
    const a = centerOf(uid), b = centerOf(toUid); if (!a || !b || !a.body.animate) return 0;
    const dx = (b.x - a.x) * (melee ? 0.6 : 0.1), dy = (b.y - a.y) * (melee ? 0.45 : 0.05);
    const dur = (melee ? 640 : 420) * spd();
    a.body.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-dx * 0.08}px,-8px) scale(1.03)`, offset: 0.2 }, { transform: `translate(${dx}px,${dy}px) scale(1.08)`, offset: 0.55 }, { transform: `translate(${dx * 0.9}px,${dy * 0.9}px) scale(1.06)`, offset: 0.7 }, { transform: 'translate(0,0)' }], { duration: dur, easing: 'ease-in-out' });
    return (melee ? 640 : 420) * 0.55;
  }
  function hop(uid) {
    const a = centerOf(uid); if (!a || !a.body.animate) return;
    a.body.animate([{ transform: 'none' }, { transform: 'translateY(-16px) scale(1.06)', offset: 0.4 }, { transform: 'none' }], { duration: 480 * spd(), easing: 'ease-out' });
  }
  function knock(uid) {
    const a = centerOf(uid); if (!a || !a.body.animate) return;
    const dir = uid >= 10 ? 1 : -1;
    a.body.animate([{ transform: 'none', filter: 'none' }, { transform: `translateX(${dir * 14}px) rotate(${dir * 4}deg)`, filter: 'brightness(2.4) saturate(.3)', offset: 0.25 }, { transform: `translateX(${dir * 6}px)`, filter: 'brightness(1.3)', offset: 0.55 }, { transform: 'none', filter: 'none' }], { duration: 380 * spd(), easing: 'ease-out' });
  }
  function projectile(fromUid, toUid, icon) {
    const a = centerOf(fromUid), b = centerOf(toUid);
    if (!a || !b || !Element.prototype.animate) return;
    const d = document.createElement('div'); d.className = 'proj'; d.textContent = icon; d.style.left = '0px'; d.style.top = '0px';
    fx().appendChild(d);
    d.animate([{ transform: `translate(${a.x}px,${a.y}px) translate(-50%,-50%) scale(.6) rotate(0deg)`, opacity: 0.2 }, { transform: `translate(${(a.x + b.x) / 2}px,${Math.min(a.y, b.y) - 40}px) translate(-50%,-50%) scale(1.4) rotate(180deg)`, opacity: 1 }, { transform: `translate(${b.x}px,${b.y}px) translate(-50%,-50%) scale(1) rotate(360deg)`, opacity: 1 }], { duration: 400 * spd(), easing: 'ease-in' });
    setTimeout(() => d.remove(), 400 * spd());
  }
  function banner(text, foe) {
    const d = document.createElement('div'); d.className = 'banner' + (foe ? ' foe' : ''); d.textContent = text;
    const s = $('#stage'); if (s) { const r = s.getBoundingClientRect(); d.style.top = r.top + 26 + 'px'; }
    fx().appendChild(d); setTimeout(() => d.remove(), 950);
  }
  function splash(text) {
    const d = document.createElement('div'); d.className = 'turn-splash title'; d.textContent = text;
    const s = $('#stage'); if (s) { const r = s.getBoundingClientRect(); d.style.top = r.top + r.height * 0.4 + 'px'; }
    fx().appendChild(d); setTimeout(() => d.remove(), 1050);
  }
  function setHP(uid, hp) {
    for (const h of $$(`.hp[data-hp="${uid}"]`)) {
      const bar = $('.bar', h), gh = $('.ghost', h), sp = $('span', h);
      if (bar) { bar.style.width = hp + '%'; bar.style.background = hp > 60 ? '#35c24a' : hp > 30 ? '#f2b705' : '#e33b3b'; }
      if (gh) gh.style.width = hp + '%';
      if (sp) sp.textContent = hp;
    }
  }

  function setInfoLine(html) { const i = $('#info'); if (i) i.innerHTML = `<div class="actline">${html}</div>`; }
  function ribbon(text, foe) {
    const d = document.createElement('div'); d.className = 'ribbon ' + (foe ? 'foe' : 'me');
    d.innerHTML = `<span>${text}</span>`;
    const s = $('#stage'); if (s) { const r = s.getBoundingClientRect(); d.style.top = r.top + r.height * 0.42 + 'px'; }
    fx().appendChild(d); setTimeout(() => d.remove(), 1400 * spd());
    d.style.animationDuration = 1.3 * spd() + 's';
  }
  function fxOn() { return A.save.settings.fx !== 'baixo'; }

  async function playEvents(events) {
    const k = spd(); V.k = k;
    for (const e of events) {
      if (A.screen !== 'battle') return;
      if (e.t === 'skill') {
        const st = A.b.st, c = NA.byUid(st, e.uid), sk = NA.skillOf(c, e.si), key = c.id + e.si;
        const p = posOf(e.uid); if (!p) continue;
        const foe = e.uid >= 10;
        const others = e.targets.filter((t) => t !== e.uid);
        const tn = others.map((t) => NA.CHARS_BY_ID[NA.byUid(st, t).id].short);
        p.el.classList.add('acting');
        const aimed = others.map((t) => $(`.unit[data-uid="${t}"]`)).filter(Boolean);
        aimed.forEach((u) => u.classList.add(e.harmful ? 'aimed' : 'aimed-ally'));
        setInfoLine(`${foe ? '<span class="tagfoe">Oponente</span>' : '<span class="tagme">Você</span>'} <b>${esc(NA.CHARS_BY_ID[c.id].short)}</b> usa ${skillIconHTML(c.id, e.si, 'mini')} <b>${esc(sk.name)}</b>${tn.length ? ` em <b>${esc(tn.join(', '))}</b>` : ''}`);
        banner(`${e.icon} ${e.name}`, foe);
        NA.sfx('skill');
        await sleep((foe ? 560 : 240) * k);
        const ult = V.ULT[key];
        const seen = (A.b.cineSeen = A.b.cineSeen || {});
        if (ult && fxOn() && !(A.save.settings.fx === 'medio' && seen[key])) { seen[key] = 1; await V.cine(ult[0], ult[1], c.side, p); }
        const ts = e.targets.map(posOf).filter(Boolean);
        const ctx = { a: p, ts: ts.length ? ts : [p], dir: foe ? -1 : 1, side: c.side, harmful: e.harmful, melee: sk.cls.includes('Corpo a corpo'), img: p.img,
          lunge: (i) => lunge(e.uid, others[i] != null ? others[i] : e.targets[0], true) };
        try { await (V.SK[key] || V.generic)(ctx, sk); } catch (err) { console.warn('vfx', err); }
        p.el.classList.remove('acting');
        aimed.forEach((u) => u.classList.remove('aimed', 'aimed-ally'));
      } else if (e.t === 'dmg') {
        const cls = e.kind === 'piercing' ? 'pierce' : e.kind === 'affliction' ? 'aff' : 'dmg';
        if (e.amt > 0) {
          knock(e.uid);
          const big = e.amt >= 40;
          floatText(e.uid, '-' + e.amt, cls + (big ? ' crit' : ''), 18 + Math.min(26, e.amt * 0.42), big ? 'DEVASTADOR!' : e.kind === 'piercing' ? 'perfurante' : e.kind === 'affliction' ? 'aflição' : '');
          sparks(e.uid, cls === 'aff' ? '#c56bff' : cls === 'pierce' ? '#ffb000' : '#ff4d4d'); NA.sfx('hit');
          const u = $(`.unit[data-uid="${e.uid}"]`); if (u) { u.classList.remove('hitflash'); void u.offsetWidth; u.classList.add('hitflash'); }
          setHP(e.uid, e.hp);
          if (e.amt >= 20) { V.shake(Math.min(16, e.amt / 3), 300); await V.hitStop(Math.min(150, 30 + e.amt * 2)); }
        } else { floatText(e.uid, e.absorbed ? `🛡 -${e.absorbed}` : 'Bloqueado', 'blocked', 0, e.absorbed ? 'defesa' : ''); setHP(e.uid, e.hp); }
        await sleep(240 * k);
      } else if (e.t === 'heal') {
        floatText(e.uid, '+' + e.amt, 'heal', 22, 'cura'); NA.sfx('heal'); setHP(e.uid, e.hp);
        const pp = posOf(e.uid); if (pp) { V.glow(pp.x, pp.y, V.C.green, 100, 500); }
        await sleep(240 * k);
      } else if (e.t === 'status') {
        const c = NA.byUid(A.b.st, e.uid); const s0 = c && c.st.find((s) => s.name === e.name);
        floatText(e.uid, `${e.icon} ${s0 && s0.stun ? 'Atordoado!' : e.name}`, 'info'); NA.sfx('status');
        if (A.b) updateStage();
        await sleep(170 * k);
      } else if (e.t === 'counter') {
        const pp = posOf(e.uid); if (pp) { V.ring(pp.x, pp.y, V.C.white, 80, 450, 5); V.flash(V.C.white, 0.3, 200); }
        floatText(e.uid, '🪞 Anulado!', 'info'); await sleep(360 * k);
      } else if (e.t === 'resist') {
        floatText(e.uid, '🛡️ Imune!', 'info'); await sleep(200 * k);
      } else if (e.t === 'death') {
        const p = posOf(e.uid);
        if (p) { V.smoke(p.x, p.bottom - 10, 14, V.C.grey, 40); p.el.classList.add('dead'); floatText(e.uid, 'Derrotado!', 'info'); }
        NA.sfx('death');
        await sleep(700 * k);
      } else if (e.t === 'drain') {
        toast(e.side === 0 ? `💧 Você perdeu ${e.types.length} chakra` : `💧 Oponente perdeu ${e.types.length} chakra`);
      } else if (e.t === 'turn') {
        if (A.b) updateStage();
        await sleep(150 * k);
      }
    }
    if (A.b && A.screen === 'battle') updateStage();
  }
  async function doPlayerTurn(pay) {
    const b = A.b, st = b.st;
    closeModal();
    b.busy = true; b.sel = null; b.targets = null; b.info = null;
    const q = b.q.map((x) => ({ ci: x.ci, si: x.si, tgt: x.tgt }));
    b.q = [];
    renderBattleBusy();
    const ev = NA.executeTurn(st, 0, q, pay);
    await playEvents(ev);
    renderBattle();
    if (st.winner != null) return endBattle();
    await aiTurn();
  }

  function renderBattleBusy() {
    if (A.b) A.b.preview = null;
    $$('.pv,.pvbar').forEach((e) => e.remove());
    $$('.qbadge,.inc').forEach((e) => e.remove());
    $$('.unit.target,.mini.target').forEach((e) => e.classList.remove('target'));
    $$('.skill').forEach((e) => { e.classList.add('off'); e.classList.remove('sel', 'queued'); });
    const pr = $('.pronto'); if (pr) { pr.disabled = true; pr.classList.add('wait'); pr.textContent = '…'; }
    const info = $('#info'); if (info) info.innerHTML = '<h4>⚔️ Executando…</h4><div class="hint">Observe as técnicas!</div>';
    const qu = $('.queue'); if (qu) qu.innerHTML = '<span>Executando</span>';
  }

  async function aiTurn() {
    const b = A.b, st = b.st;
    b.busy = true; renderBattle();
    ribbon('Vez do oponente', true);
    await sleep(1100 * spd());
    if (A.screen !== 'battle' || A.b !== b) return;
    NA.aiMaybeExchange(st, 1);
    const plan = NA.aiPlan(st, 1, b.diff);
    const ev = NA.executeTurn(st, 1, plan.actions, plan.pay);
    await playEvents(ev);
    if (A.screen !== 'battle' || A.b !== b) return;
    b.busy = false;
    renderBattle();
    if (st.winner != null) return endBattle();
    const gain = ev.filter((e) => e.t === 'gain' && e.side === 0).flatMap((e) => e.types);
    gain.forEach((k) => { const el = $(`.ck[data-ck="${k}"]`); if (el) el.classList.add('pulse'); });
    ribbon(`Turno ${st.turnNo} · Sua vez`); NA.sfx('turn');
  }

  function endBattle() {
    const b = A.b, st = b.st;
    if (b.ended) return; b.ended = true;
    const result = st.winner === 0 ? 'win' : st.winner === 1 ? 'loss' : 'draw';
    const flawless = result === 'win' && st.teams[0].chars.every((c) => c.alive);
    const r = NA.recordResult(A.save, { result, team: b.team, enemy: b.enemy, difficulty: b.diff, flawless, turns: st.turnNo });
    NA.sfx(result === 'win' ? 'win' : 'lose');
    const li = levelInfo();
    const unlocks = r.newMissions.filter((m) => m.unlock).map((m) => NA.CHARS_BY_ID[m.unlock].name);
    // cinemática final: vencedores comemoram, perdedores caem
    b.busy = true;
    const winSide = result === 'win' ? 0 : result === 'loss' ? 1 : -1;
    $$('.unit').forEach((u) => {
      const uid = +u.dataset.uid, side = uid >= 10 ? 1 : 0;
      if (u.classList.contains('dead')) return;
      u.classList.add(side === winSide ? 'pose' : 'defeated');
    });
    if (A.screen === 'battle') {
      V.victory(result === 'win');
      const d = document.createElement('div'); d.className = 'endsplash ' + result;
      d.innerHTML = `<b>${result === 'win' ? 'VITÓRIA!' : result === 'loss' ? 'DERROTA' : 'EMPATE'}</b><small>${result === 'win' ? '勝利' : result === 'loss' ? '敗北' : '引分'}</small>`;
      fx().appendChild(d); setTimeout(() => d.remove(), 2300 * spd());
    }
    setTimeout(() => { if (A.b !== b || A.screen !== 'battle') return; showEnd(); }, (A.screen === 'battle' ? 2300 : 0) * spd());
    const showEnd = () => modal(`<div class="end"><div class="big ${result}">${result === 'win' ? 'VITÓRIA!' : result === 'loss' ? 'DERROTA' : 'EMPATE'}</div>
      <p class="mut" style="margin:4px 0">${result === 'win' ? (flawless ? 'Vitória perfeita — sem baixas!' : 'Seu time prevaleceu na arena.') : result === 'loss' ? 'Treine mais e volte mais forte.' : 'Ninguém ficou de pé.'}</p>
      <div class="endteams"><div>${b.team.map((id) => `<span class="ep">${NA.portraitHTML(id, 'e' + id)}</span>`).join('')}</div><b>VS</b><div>${b.enemy.map((id) => `<span class="ep foe">${NA.portraitHTML(id, 'x' + id)}</span>`).join('')}</div></div>
      <div class="gains"><div>✨ +${r.xp} XP</div><div>🏆 ${r.lp >= 0 ? '+' : ''}${r.lp} PL</div></div>
      ${r.levelUp ? `<div class="card" style="margin-bottom:8px">⬆️ <b>Subiu para o nível ${r.levelUp}!</b> Rank: ${li.rank}</div>` : ''}
      ${r.newMissions.map((m) => `<div class="card" style="margin-bottom:8px">📜 Missão concluída: <b>${esc(m.name)}</b><br><span style="color:var(--or2)">🎁 ${esc(m.reward)}</span></div>`).join('')}
      ${unlocks.length ? `<div class="card" style="margin-bottom:8px;border-color:var(--or)">🔓 Novo personagem: <b>${unlocks.join(', ')}</b></div>` : ''}
      <div class="xpbar" style="margin:10px 0"><i style="width:${li.pct}%"></i></div><div class="mut" style="font-size:12px">Nível ${li.L} · ${li.cur}/${li.need} XP</div>
      <div class="row" style="margin-top:14px"><button class="btn grow" data-a="go:menu">Menu</button><button class="btn grow" data-a="go:select">Trocar time</button><button class="btn primary grow" data-a="again">Revanche</button></div></div>`, { locked: true });
  }

  // ---------- eventos ----------
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el) return;
    const a = el.getAttribute('data-a');
    if (!a) return;
    if (a === 'closeModal' && ev.target.closest('[data-stop]') && el.classList.contains('backdrop')) return;
    NA.unlockAudio();
    const [cmd, x, y] = a.split(':');
    const b = A.b;
    switch (cmd) {
      case 'go': go(x); break;
      case 'closeModal': closeModal(); break;
      case 'char': NA.sfx('tap'); charSheet(x); break;
      case 'add': if (A.team.length < 3 && !A.team.includes(x) && NA.isUnlocked(A.save, x)) A.team.push(x); A.save.lastTeam = A.team.slice(); NA.writeSave(A.save); closeModal(); screens.select(); break;
      case 'rm': ev.stopPropagation(); A.team = A.team.filter((i) => i !== x); A.save.lastTeam = A.team.slice(); NA.writeSave(A.save); closeModal(); screens.select(); break;
      case 'randomTeam': { const un = NA.CHARS.filter((c) => NA.isUnlocked(A.save, c.id)).map((c) => c.id).sort(() => Math.random() - 0.5); A.team = un.slice(0, 3); screens.select(); break; }
      case 'diff': A.save.settings.difficulty = x; NA.writeSave(A.save); screens.select(); break;
      case 'start': startBattle(); break;
      case 'again': A.team = b ? b.team.slice() : A.team; startBattle(); break;
      case 'skill': if (b) onSkill(+x, +y); break;
      case 'eskill': if (b) { b.info = { type: 'skill', side: 1, ci: +x, si: +y }; renderBattle(); } break;
      case 'fighter': if (b) onFighter(+x); break;
      case 'stagetap': if (b) { const u = pickUnit(ev.clientX, ev.clientY); if (u != null) onFighter(u); } break;
      case 'deq': ev.stopPropagation(); if (b && !b.busy) { b.q = b.q.filter((q) => q.ci !== +x); b.sel = null; b.targets = null; renderBattle(); } break;
      case 'ready': ready(); break;
      case 'pay': { const k = x, d = +y; const n = b.pay[k] + d; const sum = T.reduce((s, t) => s + b.pay[t], 0) + d; if (n >= 0 && n <= b.payAvail[k] && sum <= b.payNeed) b.pay[k] = n; payModal(); break; }
      case 'payok': doPlayerTurn(Object.assign({}, b.pay)); break;
      case 'exchange': if (b && b.st.side === 0 && !b.busy) { b.ex = null; exchangeModal(); } break;
      case 'exg': { const avail = NA.poolAfterSpecific(b.st, 0, b.q); const n = b.ex.give[x] + +y; const sum = T.reduce((s, t) => s + b.ex.give[t], 0) + +y; if (n >= 0 && n <= avail[x] && sum <= 5) b.ex.give[x] = n; exchangeModal(); break; }
      case 'exget': b.ex.get = x; exchangeModal(); break;
      case 'exok': if (NA.exchange(b.st, 0, b.ex.give, b.ex.get)) { toast('Troca realizada!'); b.ex = null; closeModal(); renderBattle(); } break;
      case 'log': {
        const lines = b ? b.st.log.slice(-200) : [];
        modal(`<h3>📜 Registro da batalha</h3><div class="logbox" id="logbox">${lines.map((l) => `<div class="${l.startsWith('—') ? 'h' : ''}">${esc(l)}</div>`).join('')}</div><button class="btn" style="width:100%;margin-top:10px" data-a="closeModal">Fechar</button>`);
        const lb = $('#logbox'); if (lb) lb.scrollTop = lb.scrollHeight; break;
      }
      case 'bmenu': modal(`<h3>Menu da batalha</h3><div class="col" style="margin-top:12px"><button class="btn danger" data-a="surrender">🏳️ Desistir (conta como derrota)</button><button class="btn ghost" data-a="closeModal">Continuar</button></div>`); break;
      case 'surrender': if (b && b.st.winner == null) { NA.surrender(b.st, 0); closeModal(); renderBattle(); endBattle(); } break;
      case 'opt': {
        const s = A.save.settings;
        if (x === 'sound') { s.sound = !s.sound; NA.sfxEnabled = s.sound; }
        if (x === 'speed') { const v = +y; s.speed = [0.7, 1, 2, 3].includes(v) ? v : 1; V.k = spd(); }
        if (x === 'fx') { s.fx = ['alto', 'medio', 'baixo'].includes(y) ? y : 'alto'; V.setQuality(s.fx); }
        if (x === 'freeMode') s.freeMode = !s.freeMode;
        NA.writeSave(A.save); screens.options(); break;
      }
      case 'export': modal(`<h3>Exportar progresso</h3><p class="mut" style="font-size:13px">Copie o texto abaixo e guarde.</p><textarea style="width:100%;height:160px;background:#0f131b;color:var(--txt);border:1px solid var(--line);border-radius:10px;padding:8px;font-size:12px" readonly>${esc(NA.exportSave())}</textarea><button class="btn" style="width:100%;margin-top:10px" data-a="closeModal">Fechar</button>`); break;
      case 'import': modal(`<h3>Importar progresso</h3><p class="mut" style="font-size:13px">Cole um save exportado. O save atual vira backup automático.</p><textarea id="impTxt" style="width:100%;height:160px;background:#0f131b;color:var(--txt);border:1px solid var(--line);border-radius:10px;padding:8px;font-size:12px"></textarea><div class="row" style="margin-top:10px"><button class="btn grow" data-a="closeModal">Cancelar</button><button class="btn primary grow" data-a="importOk">Importar</button></div>`); break;
      case 'importOk': try { A.save = NA.importSave($('#impTxt').value); toast('Progresso importado!'); go('menu'); } catch (e) { toast('Texto inválido'); } break;
      case 'lock': localStorage.removeItem(UNLOCK_KEY); go('gate'); break;
    }
  });
  // impede zoom por gesto no iOS
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  // ---------- início ----------
  if (localStorage.getItem(UNLOCK_KEY) === PASS_HASH) go('menu'); else go('gate');
})();
