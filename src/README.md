# مصدر «واحة اللسان العربي»

كل ما في `web/` (إلا `web/tests/`) يُبنى من هنا، فلا يُعدَّل `web/` يدويًّا.

| المجلد | ما فيه |
|---|---|
| `parts/waha/` | الواحة: `page.html` (الصفحة)، `data.json` (المحتوى)، `app.js` (البرنامج) |
| `parts/waha_bridge.js` · `parts/waha_post.js` | ربط الواحة بملفات الأطفال ورمز وليّ الأمر، وخطاب البنات، والموافقة قبل إخراج أي ملف |
| `parts/*.js` · `parts/*.css` · `parts/shell.html` | «كنوز البيان» وركن وليّ الأمر (تُجمع في `kunuz/index.html`) |
| `parts/hasaniya/` | الحسنية كما هي في مستودعها، مثبّتة على إصدار في `tools/hasaniya_upstream.json`؛ لا تُعدَّل يدويًّا |
| `parts/hasaniya_early.js` · `parts/hasaniya_late.js` | طبقة تكامل الحسنية (المخزن المنفصل، أطفال العائلة، الرمز، الموافقة، 🌴) |
| `parts/static/` | ملفات مشتركة: `manifest.json`، والخطوط، وجسر أندرويد |
| `parts/sw.js` | قالب عامل الخدمة الواحد |
| `parts/README.md` | دليل العائلة (هو نفسه دليل مشروع Claude) |
| `tools/` | البناء والنشر والاختبارات |
| `tools/archive/` | الأصل كما استُلم، وسجلّ التعديلات التي طُبّقت عليه |

## العمل
```bash
python3 src/tools/build.py          # يبني src/dist/ (ويتوقف عند خطأ نحوي، أو اسم مكرر، أو تغيّر في الحسنية يمسّ الربط)
python3 src/tools/test_all.py       # سبع مجموعات اختبار (Playwright بايثون + Chromium)
python3 src/tools/publish.py        # ينسخ src/dist/ إلى web/
node web/tests/smoke.js             # اختبار الدخان (Playwright نود)
```
تحديث الحسنية من مستودعها: `python3 src/tools/hasaniya_sync.py /path/to/hasaniya-app` ثم البناء والاختبار والنشر.

في كل طلب دمج يتحقق `checks.yml` أن `web/` هو ناتج `src/`، ويشغّل الاختبارات كلها. وعند الدمج في main يبني `build-all.yml` أندرويد وسطح المكتب والويب ويصدرها.
