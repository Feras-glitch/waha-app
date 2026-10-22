/* يتحقق أن نسخة سطح المكتب تفتح الواحة فعلًا (عبر منفذ أدوات المطوّر): أول تشغيل يضبط فيه الأب رمزه وملف طفل في «كنوز البيان»،
   ثم الواحة ببياناتها ومراحلها، وسياق آمن للميكروفون، و«كنوز البيان» والحسنية تفتحان من ملفاتهما */
const { chromium } = require('playwright');
(async () => {
  let b;
  for (let i = 0; i < 20 && !b; i++) { try { b = await chromium.connectOverCDP('http://127.0.0.1:9333'); } catch (e) { await new Promise(r => setTimeout(r, 1000)); } }
  if (!b) { console.log('::error::نسخة سطح المكتب لم تفتح'); process.exit(1); }
  const p = b.contexts().flatMap(c => c.pages())[0];
  try {
    await p.waitForSelector('[data-act="setupPin"], #whoBtn', { timeout: 20000 });
    if (await p.locator('[data-act="setupPin"]').count()) {
      await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]');
      await p.waitForSelector('#kidForm'); await p.fill('#kfName', 'تجربة'); await p.click('[data-act="kfG"][data-v="m"]'); await p.click('#kidForm button[type=submit]');
    }
  } catch (e) { console.log('::warning::الإعداد الأول: ' + String(e).split('\n')[0]); }
  await p.waitForFunction(() => typeof STAGES !== 'undefined' && STAGES.length > 0, null, { timeout: 20000 }).catch(() => {});
  const r = await p.evaluate(() => ({ url: location.protocol, stages: typeof STAGES !== 'undefined' ? STAGES.length : 0, palms: typeof ALL !== 'undefined' ? Object.keys(ALL).length : 0, secure: isSecureContext, mic: !!(navigator.mediaDevices && window.MediaRecorder) })).catch(e => ({ err: e.message }));
  /* the two sections open from their own files */
  const home = p.url().split('?')[0].split('#')[0];
  try { await p.goto(new URL('kunuz/index.html#kunuz', home).href); await p.waitForSelector('.chamber', { timeout: 15000 }); r.kunuz = true; } catch (e) { r.kunuz = false; }
  try { await p.goto(new URL('hasaniya/index.html', home).href); await p.waitForSelector('#kzHome', { timeout: 15000 }); r.hasaniya = await p.evaluate(() => users.length > 0); } catch (e) { r.hasaniya = false; }
  console.log(JSON.stringify(r));
  const ok = r.stages > 30 && r.palms >= 40 && r.secure && r.mic && r.kunuz && r.hasaniya;
  console.log(ok ? `::notice::نسخة لينكس تعمل: ${r.stages} مرحلة، ${r.palms} نخلة، و«كنوز البيان» والحسنية` : '::error::نسخة لينكس لا تعمل: ' + JSON.stringify(r));
  process.exit(ok ? 0 : 1);
})();
