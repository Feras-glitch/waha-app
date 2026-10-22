/* يتحقق أن نسخة سطح المكتب تفتح الواحة فعلًا (عبر منفذ أدوات المطوّر): البيانات والمراحل، وسياق آمن للميكروفون */
const { chromium } = require('playwright');
(async () => {
  let b;
  for (let i = 0; i < 20 && !b; i++) { try { b = await chromium.connectOverCDP('http://127.0.0.1:9333'); } catch (e) { await new Promise(r => setTimeout(r, 1000)); } }
  if (!b) { console.log('::error::نسخة سطح المكتب لم تفتح'); process.exit(1); }
  const p = b.contexts().flatMap(c => c.pages())[0];
  await p.waitForFunction(() => typeof STAGES !== 'undefined' && STAGES.length > 0, null, { timeout: 20000 }).catch(() => {});
  const r = await p.evaluate(() => ({ url: location.protocol, stages: typeof STAGES !== 'undefined' ? STAGES.length : 0, palms: typeof ALL !== 'undefined' ? Object.keys(ALL).length : 0, secure: isSecureContext, mic: !!(navigator.mediaDevices && window.MediaRecorder) })).catch(e => ({ err: e.message }));
  console.log(JSON.stringify(r));
  const ok = r.stages > 30 && r.palms >= 40 && r.secure && r.mic;
  console.log(ok ? `::notice::نسخة لينكس تعمل: ${r.stages} مرحلة، ${r.palms} نخلة` : '::error::نسخة لينكس لا تعمل: ' + JSON.stringify(r));
  process.exit(ok ? 0 : 1);
})();
