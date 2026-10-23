# -*- coding: utf-8 -*-
"""Using it (2.5): a second child can be added during the first setup, a form says what is missing in Arabic, a child of
eight and under can hear the options, the fill-in card says what to do, the parent is told when the device has no Arabic
voice, a free recording is not marked word by word against its prompt, and messages appear where they cover no button."""
import asyncio, os, sys, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots12'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8791), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8791/'
URL, KZ = BASE + 'index.html', BASE + 'kunuz/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
FAMJS = "JSON.parse(localStorage.getItem('kb-family-v1'))"

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))

        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone')
        await p.wait_for_selector('#kidForm')
        # a form says what is missing, in Arabic
        await p.click('#kidForm button[type=submit]'); await p.wait_for_timeout(200)
        ok('اكتبوا اسم الطفل' in await p.inner_text('#kfErr'), 'an empty name is answered in Arabic, not by the browser')
        ok(await p.evaluate("[...document.querySelectorAll('.sw-pick .sw')].every(b => /[\\u0600-\\u06FF]/.test(b.getAttribute('aria-label')))"), 'the colours are named in Arabic')
        # the first child, then a second one right away
        await p.fill('#kfName', 'يوسف'); await p.click('[data-act="kfG"][data-v="m"]'); await p.select_option('#kfBy', '2020')
        ok(await p.locator('#kfMore').count() == 1, 'the first child\'s form offers to add another')
        await p.check('#kfMore'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('#kidForm'); await p.wait_for_timeout(200)
        ok(await p.evaluate("document.getElementById('kfName').value") == '' and await p.locator('#kfMore').count() == 0, 'a fresh form for the second child')
        await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.select_option('#kfBy', '2016'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_timeout(600)
        ok(len(await p.evaluate(FAMJS + ".kids")) == 2, 'two children, added in one sitting')

        # a six-year-old hears the options; the fill-in card says what to do
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
        ix = await p.evaluate("kids.findIndex(k => k.name === 'يوسف')")
        await p.evaluate("(i) => { kid = i; store.set('kid', i); onKid(); }", ix); await p.wait_for_timeout(300)
        ok(await p.evaluate("tier()") == 'small', 'يوسف (6) plays with choices')
        r = await p.evaluate("""() => { const box = document.createElement('div'); document.body.appendChild(box); mcq(box, ['بدر', 'أحد', 'الخندق'], 'بدر', () => {});
          const sb = box.nextElementSibling; const has = !!(sb && sb.classList.contains('optsay')); if (sb) sb.click(); box.children[0].click();
          const gone = !(box.nextElementSibling && box.nextElementSibling.classList.contains('optsay')); box.remove(); return [has, gone]; }""")
        ok(r == [True, True], 'under nine, «🔊 اسمع الخيارات» reads the options; it goes once he chooses')
        q = await p.evaluate("(() => { const id = POOL.fill()[0]; return GEN.fill(id).q; })()")
        ok('الكلمة الناقصة' in (q or ''), 'the fill-in card says what to type: ' + str(q))

        # the parent board: no Arabic voice on this device; a free recording is not marked word by word
        await p.evaluate("""async () => { await recPut({id: 'free1', kid, kidName: 'يوسف', kind: 'نص حر', ref: 'من اختياري', text: '⟨اقرأ|اقرئي⟩ أي نصٍّ ⟨تحفظه|تحفظينه⟩', date: today(), type: 'audio/webm', blob: new Blob([new Uint8Array(3000)], {type: 'audio/webm'}), status: 'pending', notes: [], source: 'local'}); }""")
        await p.click('#whoBtn'); await p.click('#ksParent'); await p.click('#ksDad'); await p.wait_for_selector('#sheet:not([hidden]) #pinIn'); await p.fill('#pinIn', '1234'); await p.click('#pinOk')
        await p.wait_for_selector('#ddTabs'); await p.wait_for_timeout(600)
        ok('لا يوجد صوتٌ عربي' in await p.inner_text('#ddBody'), 'the parent is told the device has no Arabic voice')
        await p.click('#ddTabs [data-k="rec"]'); await p.wait_for_timeout(600)
        body = await p.inner_text('#ddBody')
        ok('اختاره أو قاله' in body and await p.locator('#ddBody [data-w]').count() == 0, 'a free recording is heard and noted, not marked against its prompt')
        await shot(p, 'u01-free-rec')

        # «كنوز البيان»: a message sits at the top, clear of the buttons
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn')
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
        await p.evaluate("(() => { const t = document.createElement('div'); t.id = 'toast'; t.className = 'toast on'; t.textContent = 'رسالة'; document.body.appendChild(t); })()")
        top = await p.evaluate("document.getElementById('toast').getBoundingClientRect().top")
        ok(top < 120, 'messages appear at the top of the screen (%d px)' % top)
        ok(await p.evaluate("!!document.querySelector('.foot-more') && !document.querySelector('.foot-more').open"), 'the parents\' note under every page is folded')
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
