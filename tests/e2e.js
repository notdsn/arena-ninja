const { chromium, devices } = require('playwright-core');
const SH = process.env.SH || '/workspace/naruto-arena/shots/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ ...devices['iPhone 11'], defaultBrowserType: 'chromium' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const imgFails = []; const imgOk = new Set();
  ctx.on('requestfailed', (r) => { if (/\/img\//.test(r.url())) imgFails.push(r.url()); });
  ctx.on('response', (r) => { if (/\/img\//.test(r.url())) { if (r.status() >= 400) imgFails.push(r.status() + ' ' + r.url()); else imgOk.add(r.url().split('?')[0].split('/img/')[1]); } });
  const url = process.argv[2] || 'http://127.0.0.1:8765/';
  await page.goto(url);
  await page.fill('#pw', 'errada'); await page.click('#gateForm button');
  const err = await page.textContent('#pwErr'); console.log('wrong pw msg:', err);
  await page.fill('#pw', 'arena'); await page.click('#gateForm button');
  await page.waitForSelector('.hero');
  await page.screenshot({ path: SH + 'menu-real.png' });
  await page.evaluate(() => { const A = window.ArenaApp; A.save.settings.speed = 2; A.save.settings.sound = false; NA.sfxEnabled = false; NA.writeSave(A.save); });
  await page.click('[data-a="go:select"]');
  // monta time via UI
  await page.evaluate(() => { window.ArenaApp.team = []; });
  await page.click('[data-a="go:menu"]'); await page.click('[data-a="go:select"]');
  for (const id of ['naruto', 'sasuke', 'sakura']) { await page.click(`.tile[data-a="char:${id}"]`); await page.waitForSelector('.sheet'); if (id === 'sakura') await page.screenshot({ path: SH + 'char-detail-real.png' }); await page.click(`[data-a="add:${id}"]`); }
  await page.waitForTimeout(500); await page.screenshot({ path: SH + 'team-select-real.png' });
  await page.screenshot({ path: SH + 'team-select-real-full.png', fullPage: true });
  await page.click('[data-a="start"]');
  await page.waitForSelector('.battle');
  await page.waitForTimeout(1200);
  let shotTaken = false, turns = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 240000) {
    if (await page.$('.end')) break;
    const ready = await page.$('.pronto:not([disabled])');
    if (!ready) { await page.waitForTimeout(250); continue; }
    turns++;
    for (let ci = 0; ci < 3; ci++) {
      for (const si of [1, 0, 2, 3]) {
        const btn = await page.$(`.skill[data-a="skill:${ci}:${si}"]:not(.off)`);
        if (!btn) continue;
        await btn.click();
        const tgt = (await page.$('.unit.foe.target .ubar')) || (await page.$('.mini.target')) || (await page.$('.unit.target .ubar'));
        if (tgt) await tgt.click();
        break;
      }
    }
    if (!shotTaken && turns >= 3) { await page.waitForTimeout(1300); console.log('stage imgs', await page.$$eval('.unit .rend', (a) => a.map((i) => i.complete && i.naturalWidth > 0).join(',')), 'fallbacks', await page.$$eval('.noimg', (a) => a.length)); await page.screenshot({ path: SH + 'battle-real.png' }); shotTaken = true; }
    if (turns === 2) { await page.click('[data-a="log"]'); await page.waitForSelector('.logbox'); await page.click('.sheet [data-a="closeModal"]'); }
    await page.click('.pronto');
    const pay = await page.waitForSelector('[data-a="payok"]', { timeout: 800 }).catch(() => null);
    if (pay) { await page.click('[data-a="payok"]'); }
    await page.waitForTimeout(400);
  }
  const endTxt = await page.$eval('.end .big', (e) => e.textContent).catch(() => 'NO END');
  await page.screenshot({ path: SH + 'battle-end-real.png' });
  const save = await page.evaluate(() => localStorage.getItem('arenaNinja.save'));
  console.log('player turns', turns, 'result', endTxt);
  console.log('save', save.slice(0, 300));
  // reload keeps unlock & save
  await page.reload(); await page.waitForTimeout(500);
  console.log('after reload screen has hero:', !!(await page.$('.hero')));
  // desktop shot
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  p2.on('pageerror', (e) => errors.push('pageerror(desktop): ' + e.message));
  await p2.goto(url); await p2.fill('#pw', 'arena'); await p2.click('#gateForm button');
  await p2.click('[data-a="go:select"]'); await p2.click('[data-a="randomTeam"]'); await p2.click('[data-a="start"]');
  await p2.waitForTimeout(1500);
  await p2.click('.skill[data-a="skill:0:0"]').catch(()=>{}); const tg = await p2.$('.unit.target .ubar'); if (tg) await tg.click();
  await p2.screenshot({ path: SH + 'battle-real-desktop.png' });
  console.log('IMG ok:', imgOk.size, [...imgOk].sort().join(' '));
  console.log('IMG failures:', imgFails.length ? imgFails : 'none');
  const broken = await page.evaluate(() => 0);
  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})();
