/* اختبار الدخان: أول تشغيل كما يفعله الأب (رمز وليّ الأمر وملف الطفل في «كنوز البيان») ← واحة الطفل (أول لقاء ← رحلة اليوم كاملة ← واحتي)
   ← المكتبة ← «كنوز البيان» ← الحسنية بملف الطفل نفسه ← العودة إلى الواحة؛ بلا أخطاء JavaScript ولا تمرير أفقي في عرض 390px.
   الاستعمال: node web/tests/smoke.js  (يحتاج playwright وchromium؛ CHROMIUM_PATH اختياري) */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
 try {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--allow-file-access-from-files'] });
  const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/play\(\) request|net::ERR/.test(m.text())) errs.push(m.text()); });
  p.on('dialog', d => d.dismiss().catch(() => {}));
  const root = path.resolve(__dirname, '..');
  const url = 'file://' + path.join(root, 'index.html');
  const fail = m => { console.log('::error::' + m); process.exitCode = 1; };
  const width = async where => { const w = await p.evaluate(() => document.documentElement.scrollWidth); if (w > 390) fail('تمرير أفقي في ' + where + ': ' + w); return w; };

  // أول تشغيل: لا عائلة بعد، فتفتح «كنوز البيان» لضبط رمز وليّ الأمر وإضافة الطفل الأول
  await p.goto(url); await p.waitForSelector('[data-act="setupPin"]', { timeout: 15000 });
  if (!/\/kunuz\/index\.html/.test(p.url())) fail('أول تشغيل لم يفتح الإعداد: ' + p.url());
  await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]'); await p.check('#rcSaved'); await p.click('#recDone');
  await p.waitForSelector('#kidForm'); await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]');
  await p.selectOption('#kfBy', String(new Date().getFullYear() - 10)); await p.click('#kidForm button[type=submit]');
  await p.waitForSelector('#whoBtn', { timeout: 15000 }); await p.waitForTimeout(800);
  if (p.url().split('?')[0] !== url) fail('بعد ملف الطفل لم تُفتح الواحة: ' + p.url());
  const prof = await p.evaluate(() => JSON.parse(localStorage.getItem('oasis:kids'))[0]);
  if (!prof || prof.name !== 'هند' || prof.gender !== 'f' || prof.age !== 10) fail('الواحة لم تأخذ ملف الطفل: ' + JSON.stringify(prof));

  // واحة الطفل: أول لقاء ثم رحلة اليوم
  const sec = await p.evaluate(() => cur.t); if (sec !== 'kidHello') fail('لم يبدأ بأول لقاء: ' + sec);
  await p.locator('#kidHello .pickc button').first().click(); await p.locator('#kidHello .chip2').first().click(); await p.locator('#kidHello .bigplay').click();
  await p.locator('#kidHello .bigplay', { hasText: 'اغرس' }).click(); await p.waitForTimeout(300); await p.locator('#kidHello .bigplay').click(); await p.waitForTimeout(300);
  const n = await p.evaluate(() => TRIP.cards.length); if (n < 4) fail('رحلة قصيرة: ' + n);
  const blind = await p.evaluate(() => TRIP.cards.filter((c, i) => c.kind !== 'learn' && c.g !== 'rec' && c.g !== 'tell' && c.g !== 'seen' && c.kind !== 'review' && !SELF_G.has(c.g) && !TRIP.cards.slice(0, i).some(l => l.kind === 'learn' && (l.id === c.g + '|' + c.id || l.id === c.g + '|' + String(c.id).split('|')[0]))).map(c => c.g));
  if (blind.length) fail('سؤال بلا درس قبله: ' + blind.join('، '));
  for (let i = 0; i < 24; i++) {
    const g = await p.evaluate(() => TRIP && TRIP.cards[TRIP.i] ? TRIP.cards[TRIP.i].g : null); if (!g) break;
    if (g === 'learn') { await p.locator('#kidTrip .bigplay').click(); await p.waitForTimeout(150); continue; }
    if (g === 'tell' || g === 'seen') { await p.locator('#kidTrip .tiny', { hasText: 'ليس الآن' }).click(); await p.waitForTimeout(150); continue; }
    if (g === 'rec') { await p.locator('#kidTrip .tiny', { hasText: 'تخطَّ' }).click(); await p.waitForTimeout(200); continue; }
    if (await p.locator('#ktIn').count()) { const a = await p.evaluate(() => TRIP.cards[TRIP.i].a); await p.fill('#ktIn', a); await p.locator('#kidTrip .btn', { hasText: 'تحقّق' }).click(); }
    else await p.locator('#kidTrip .opt').first().click();
    await p.waitForTimeout(150); await p.locator('#kidTrip .bigplay').click(); await p.waitForTimeout(150);
  }
  const done = await p.evaluate(() => store.get(`tripsDone:${kid}`, 0)); if (done !== 1) fail('لم تُحتسب الرحلة');
  await p.locator('#kidTrip .bigplay').click(); await p.waitForTimeout(300);
  if (await p.evaluate(() => cur.t) !== 'kidHome') fail('لم يعد إلى واحتي');
  const tx = await p.evaluate(() => document.body.innerText); if (/[⟨⟩]/.test(tx)) fail('علامات تذكير وتأنيث ظاهرة في الواحة');
  const back = await p.evaluate(() => appBack()); if (back !== false) fail('زر الرجوع في واحتي يجب أن يخرج');
  const w = await width('واحتي');

  // المكتبة
  await p.evaluate(() => { LIB = true; go('home'); }); await p.waitForTimeout(300);
  if (await p.evaluate(() => document.querySelectorAll('#otiles .otile').length) < 10) fail('المكتبة ناقصة');
  await p.evaluate(() => { LIB = false; go('home'); }); await p.waitForTimeout(300);

  // «كنوز البيان» من مربّعها في الواحة، ثم العودة
  await p.locator('.ktile', { hasText: 'كنوز البيان' }).click(); await p.waitForSelector('.hello', { timeout: 15000 });
  if (!/\/kunuz\/index\.html#kunuz$/.test(p.url())) fail('مربّع «كنوز البيان» لم يفتحها: ' + p.url());
  if (!(await p.locator('.chamber').count())) fail('الخزائن لا تظهر');
  await width('كنوز البيان');
  await p.click('#oasisLink'); await p.waitForSelector('#whoBtn'); await p.waitForTimeout(600);

  // الحسنية بملف الطفل نفسه، ثم 🌴 للعودة
  await p.locator('.ktile', { hasText: 'الحسنية' }).click();
  await p.waitForSelector('#kzHome', { timeout: 15000 }); await p.waitForFunction(() => typeof users !== 'undefined' && users.length > 0);
  const hs = await p.evaluate(() => ({ users: users.map(u => [u.name, u.gender]), active: getUserName(), girl: gForm('ولد', 'بنت') }));
  if (JSON.stringify(hs.users) !== JSON.stringify([['هند', 'girl']]) || hs.active !== 'هند' || hs.girl !== 'بنت') fail('الحسنية لم تأخذ ملف الطفل: ' + JSON.stringify(hs));
  if (await p.locator('.modal-overlay.active').count()) fail('الحسنية فتحت نافذة إعداد رغم وجود ملف الطفل');
  await width('الحسنية');
  await p.click('#kzHome'); await p.waitForSelector('#whoBtn'); await p.waitForTimeout(400);
  if (p.url().split('?')[0] !== url) fail('🌴 لم يعد إلى الواحة: ' + p.url());

  if (errs.length) fail('أخطاء: ' + errs.join(' | '));
  console.log(JSON.stringify({ cards: n, tripsDone: done, width: w, hasaniya: hs, errors: errs.length }));
  await b.close();
 } catch (e) { console.log('::error::استثناء: ' + String(e).split('\n').slice(0, 3).join(' | ')); process.exitCode = 1; }
})();
