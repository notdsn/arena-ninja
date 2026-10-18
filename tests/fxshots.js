const { chromium, devices } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:8765/';
const VIDEO = process.env.VIDEO;
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const opts = { ...devices['iPhone 11'] };
  if (VIDEO) opts.recordVideo = { dir: '/tmp/fxvid', size: { width: 620, height: 1070 } };
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript((s) => { window.__SPD = s; }, process.env.SPD || '1'); await page.goto(url);
  await page.fill('#pw', 'arena'); await page.click('#gateForm button');
  await page.waitForSelector('.hero');
  await page.evaluate(() => { const A = ArenaApp; A.save.settings.sound = false; NA.sfxEnabled = false; A.save.settings.speed = +(window.__SPD || 1); A.save.settings.fx = 'alto'; NA.VFX.setQuality('alto');
    A.team = ['naruto', 'sasuke', 'gaara']; A.forceEnemy = ['itachi', 'kisame', 'kakashi']; A.startBattle(); A.b.busy = true; });
  await page.waitForTimeout(1800);
  const list = VIDEO ? [['rasengan', 0, 1, [11], 35], ['chidori', 1, 1, [12], 40], ['fire', 10, 2, [0, 1, 2], 20], ['sand', 2, 1, [10], 45], ['kaiten-ish', 12, 0, [1], 40], ['shark', 11, 2, [0, 1, 2], 20]]
    : [['rasengan', 0, 1, [11], 35], ['chidori', 1, 1, [12], 40], ['sand', 2, 1, [10], 45], ['fire', 10, 2, [0, 1, 2], 20]];
  for (const [name, uid, si, tg, amt] of list) {
    const p = page.evaluate(([u, s, t, a]) => ArenaApp.demoSkill(u, s, t, a), [uid, si, tg, amt]);
    if (!VIDEO) for (let i = 0; i < 26; i++) { await page.waitForTimeout(110); await page.screenshot({ path: `/tmp/fx/${name}-${String(i).padStart(2, '0')}.png` }); }
    await p; await page.waitForTimeout(700);
  }
  console.log('errors', errors.length ? errors : 'none');
  await ctx.close(); await browser.close();
})();
