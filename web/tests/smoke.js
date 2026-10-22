/* اختبار الدخان: يفتح الواحة كطفل جديد (أول لقاء ← رحلة اليوم كاملة ← واحتي)، ثم المكتبة والحسنية، بلا أخطاء JavaScript ولا تمرير أفقي في عرض 390px.
   الاستعمال: node web/tests/smoke.js  (يحتاج playwright وchromium؛ CHROMIUM_PATH اختياري) */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--allow-file-access-from-files'] });
  const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/play\(\) request|net::ERR/.test(m.text())) errs.push(m.text()); });
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await p.goto(url); await p.waitForTimeout(800);
  // أول تشغيل: تظهر نافذة الرقم السري لولي الأمر؛ نضبطه كما يفعل الأب
  if (!(await p.evaluate(() => $('sheet').hidden))) { await p.fill('#pinIn', '1234'); await p.fill('#pinIn2', '1234'); await p.click('#pinOk'); await p.waitForTimeout(300); await p.evaluate(() => closeSheet()); }
  const fail = m => { console.log('::error::' + m); process.exitCode = 1; };
  const sec = await p.evaluate(() => cur.t); if (sec !== 'kidHello') fail('لم يبدأ بأول لقاء: ' + sec);
  await p.locator('#kidHello .pickc button').first().click(); await p.locator('#kidHello .chip2').first().click(); await p.locator('#kidHello .bigplay').click();
  await p.locator('#kidHello .bigplay', { hasText: 'اغرس' }).click(); await p.waitForTimeout(300); await p.locator('#kidHello .bigplay').click(); await p.waitForTimeout(300);
  const n = await p.evaluate(() => TRIP.cards.length); if (n < 4) fail('رحلة قصيرة: ' + n);
  const blind = await p.evaluate(() => TRIP.cards.filter((c, i) => c.kind !== 'learn' && c.g !== 'rec' && c.kind !== 'review' && !SELF_G.has(c.g) && !TRIP.cards.slice(0, i).some(l => l.kind === 'learn' && (l.id === c.g + '|' + c.id || l.id === c.g + '|' + String(c.id).split('|')[0]))).map(c => c.g));
  if (blind.length) fail('سؤال بلا درس قبله: ' + blind.join('، '));
  for (let i = 0; i < 20; i++) {
    const g = await p.evaluate(() => TRIP && TRIP.cards[TRIP.i] ? TRIP.cards[TRIP.i].g : null); if (!g) break;
    if (g === 'learn') { await p.locator('#kidTrip .bigplay').click(); await p.waitForTimeout(150); continue; }
    if (g === 'rec') { await p.locator('#kidTrip .tiny', { hasText: 'تخطَّ' }).click(); await p.waitForTimeout(200); continue; }
    if (await p.locator('#ktIn').count()) { const a = await p.evaluate(() => TRIP.cards[TRIP.i].a); await p.fill('#ktIn', a); await p.locator('#kidTrip .btn', { hasText: 'تحقّق' }).click(); }
    else await p.locator('#kidTrip .opt').first().click();
    await p.waitForTimeout(150); await p.locator('#kidTrip .bigplay').click(); await p.waitForTimeout(150);
  }
  const done = await p.evaluate(() => store.get(`tripsDone:${kid}`, 0)); if (done !== 1) fail('لم تُحتسب الرحلة');
  await p.locator('#kidTrip .bigplay').click(); await p.waitForTimeout(300);
  if (await p.evaluate(() => cur.t) !== 'kidHome') fail('لم يعد إلى واحتي');
  const back = await p.evaluate(() => appBack()); if (back !== false) fail('زر الرجوع في واحتي يجب أن يخرج');
  await p.evaluate(() => { LIB = true; go('home'); }); await p.waitForTimeout(300);
  if (await p.evaluate(() => document.querySelectorAll('#otiles .otile').length) < 10) fail('المكتبة ناقصة');
  const hs = await p.evaluate(() => fetch('hasaniya/index.html').then(r => r.ok).catch(() => 'nofetch'));
  const w = await p.evaluate(() => document.documentElement.scrollWidth); if (w > 390) fail('تمرير أفقي: ' + w);
  if (errs.length) fail('أخطاء: ' + errs.join(' | '));
  console.log(JSON.stringify({ cards: n, tripsDone: done, width: w, hasaniya: hs, errors: errs.length }));
  await b.close();
})();
