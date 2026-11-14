# -*- coding: utf-8 -*-
"""2.13: «كنوز البيان» in the Mushaf's own script (the family's choice): a lesson's verse is drawn whole in its page's font, the
words the lesson colours coloured whole, and under it the lesson's own line in the written text with its coloured letter; a
question's hidden word stays hidden in the glyphs until it is answered, then coloured; a Ramadan touch the same; and a page font
that cannot load says so instead of showing its codes in another font."""
import asyncio, os, sys, functools, http.server, threading, json, re
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8799), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8799/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
os.makedirs(SHOTS, exist_ok=True)
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def until(p, js, timeout=8000):
    for _ in range(int(timeout / 100)):
        if await p.evaluate(js): return True
        await asyncio.sleep(0.1)
    return False

# what reaches the device's speech engine, recorded under the family guard (guard.js wraps this recorder)
SPY = r"""
window.__said = [];
try { const S = window.speechSynthesis; if (S) S.speak = function (u) { window.__said.push(String(u.text)); setTimeout(() => { try { u.dispatchEvent(new Event('end')); } catch (e) {} }, 0); }; } catch (e) {}
try { const MR = window.MediaRecorder; if (MR) { const W = function (s, o) { window.__mrOpts = o || null; return new MR(s, o); }; W.isTypeSupported = MR.isTypeSupported.bind(MR); W.prototype = MR.prototype; window.MediaRecorder = W; } } catch (e) {}
"""
SAID = "window.__said.join(' | ')"

async def as_kid(p, name):
    await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
    ix = await p.evaluate("(n) => kids.findIndex(k => k.name === n)", name)
    await p.evaluate("(i) => { kid = i; store.set('kid', i); store.set('cmp:' + i, {kind: 'camel', name: 'ناجي'}); store.set('planted:' + i, Date.now()); onKid(); }", ix); await p.wait_for_timeout(300)
    return ix

async def board(p):
    await p.evaluate("go('dad')"); await p.wait_for_timeout(200)
    if await p.locator('#sheet:not([hidden]) #pinIn').count():
        await p.fill('#pinIn', '1234'); await p.click('#pinOk')
    await p.wait_for_selector('#ddTabs')

async def main():
    D = json.load(open(os.path.join(ROOT, 'parts', 'waha', 'data.json'), encoding='utf-8'))
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, permissions=['microphone'])
        await ctx.add_init_script(SPY)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        p.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone'); await p.wait_for_selector('#kidForm')
        for i, (n, g, y) in enumerate([('مريم', 'f', '2020'), ('عمر', 'm', '2018'), ('هند', 'f', '2016')]):
            if i == 2:
                await p.click('[data-act="kidAdd"]'); await p.wait_for_selector('#kidForm')
            await p.fill('#kfName', n); await p.click('[data-act="kfG"][data-v="%s"]' % g); await p.select_option('#kfBy', y)
            if i == 0: await p.check('#kfMore')
            await p.click('#kidForm button[type=submit]'); await p.wait_for_timeout(400)
            if i == 0: await p.wait_for_selector('#kidForm')
        await p.wait_for_timeout(500)
        ok(await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).kids.length") == 3, 'three children set up')

        # ---- the page carries the glyphs of the ayat it names, and the fonts of their pages
        html = open(os.path.join(DIST, 'kunuz', 'index.html'), encoding='utf-8').read()
        m = re.search(r'var KZQ=(\{.*?\});\n', html); K = json.loads(m.group(1)) if m else {}
        pages = sorted({v[0] for v in K.values()})
        ok(len(K) >= 90 and '../fonts/qpc/qpc.css' in html and all(os.path.exists(os.path.join(DIST, 'fonts', 'qpc', 'p%03d.woff2' % x)) for x in pages),
           'the chambers carry the glyphs of %d ayat and the fonts of their %d pages' % (len(K), len(pages)))

        # ---- a lesson: «فَمَا اسْطَاعُوا … وَمَا اسْتَطَاعُوا» (18:97)
        await as_kid(p, 'مريم')
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
        await p.click('.chamber[data-ax="lamasat"]'); await p.wait_for_selector('.lesson-card'); await p.locator('.lesson-card').first.click()
        await p.wait_for_selector('.verse'); await p.wait_for_timeout(300)
        r = await p.evaluate("""async () => { const f = document.querySelector('.verse'), q = f.querySelector('.qpc'), ln = f.querySelector('.vline');
            const loaded = q ? (await document.fonts.load('28px ' + q.style.fontFamily, q.textContent.trim().charAt(0))).length : 0;
            return [f.classList.contains('qv'), q && q.style.fontFamily, f.querySelectorAll('.qpc mark').length, ln ? ln.textContent : '', ln ? (ln.querySelector('b.key') || {}).textContent : '',
                    f.querySelector('figcaption').textContent, q && q.getAttribute('aria-label'), loaded, f.querySelector('blockquote').textContent.includes('﴿')]; }""")
        ok(r[0] and r[1] == 'qpc303' and r[2] == 2 and r[7] >= 1 and not r[8], 'the lesson\'s ayah is drawn whole in page 303\'s font, its two words coloured (%s)' % r[:3])
        ok('اسْطَاعُوا' in r[3] and '…' in r[3] and r[4] == 'تَ', 'under it the lesson\'s line, «فَمَا اسْطَاعُوا … وَمَا اسْتَطَاعُوا», its letter «تَ» coloured (%s)' % r[3])
        ok('الكهف' in r[5] and r[6] == 'سورة الكهف: ٩٧', 'the surah and the ayah are named under it and to a screen reader (%s)' % r[6])
        await p.screenshot(path=os.path.join(SHOTS, 'kz-lesson.png'))

        # ---- every lesson of every chamber: its verses in the Mushaf script, each with the lesson's line
        seen, bad, nl = 0, [], 0
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
        axes = await p.evaluate("[...document.querySelectorAll('.chamber')].map(c => c.dataset.ax)")
        for ax in axes:
            await p.click('.chamber[data-ax="%s"]' % ax); await p.wait_for_selector('.lesson-card')
            n = await p.locator('.lesson-card').count(); nl += n
            for i in range(n):
                await p.locator('.lesson-card').nth(i).click(); await p.wait_for_selector('.verse')
                for x in await p.evaluate("[...document.querySelectorAll('.verse')].map(f => [f.classList.contains('qv'), f.querySelectorAll('.qpc mark').length, !!f.querySelector('.vline'), f.querySelector('figcaption').textContent])"):
                    seen += 1
                    if not (x[0] and x[1] >= 1 and x[2]): bad.append(x[3])
                await p.click('.back[data-ax]'); await p.wait_for_selector('.lesson-card')
            await p.click('.back[data-home]'); await p.wait_for_selector('.chamber')
        ok(nl >= 30 and seen >= 40 and not bad, 'every lesson of the seven chambers shows its verses in the Mushaf script with the lesson\'s line (%d lessons, %d verses) %s' % (nl, seen, bad[:3]))

        # ---- the detective: a question's hidden word stays hidden in the glyphs, then is coloured once answered
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
        await p.click('[data-go="det"]'); await p.wait_for_selector('#asItem .verse')
        qv = blanks = hidden = shown = 0
        for k in range(10):
            if not await p.locator('#asItem .verse').count(): break
            r = await p.evaluate("() => { const f = document.querySelector('#asItem .verse'); return [f.classList.contains('qv'), f.querySelectorAll('.qpc .blank').length, f.querySelectorAll('.qpc mark').length, document.querySelector('#asItem .qpc').getAttribute('aria-label')]; }")
            qv += r[0]
            if r[1]:
                blanks += 1; hidden += (r[2] == 0 and 'كلمةٌ ناقصة' in r[3])
            await p.locator('#asItem [data-a]').first.click(); await p.wait_for_selector('[data-anext]')
            r2 = await p.evaluate("() => { const f = document.querySelector('#asItem .verse'); return [f.querySelectorAll('.qpc .blank').length, f.querySelectorAll('.qpc mark').length]; }")
            if r[1]: shown += (r2[0] == 0 and r2[1] >= 1)
            await p.click('[data-anext]'); await p.wait_for_timeout(150)
        ok(qv >= 8 and blanks >= 5 and hidden == blanks and shown == blanks, 'the detective\'s verses are in the Mushaf script; a hidden word stays hidden until answered, then is coloured (%d verses, %d blanks)' % (qv, blanks))

        # ---- a Ramadan touch
        await p.goto('about:blank'); await p.goto(KZ + '#rm'); await p.wait_for_selector('.rm-c'); await p.click('.rm-c[data-id="rm1"]'); await p.wait_for_selector('.verse')
        r = await p.evaluate("() => { const f = document.querySelector('.verse'); return [f.classList.contains('qv'), f.querySelectorAll('.qpc mark').length, (f.querySelector('.vline') || {}).textContent || '']; }")
        ok(r[0] and r[1] == 1 and 'ذَلِكَ' in r[2], 'a Ramadan touch: «ذَلِكَ الْكِتَابُ» in the Mushaf script, «ذَلِكَ» coloured and in the line under it (%s)' % r)

        # ---- a page font that cannot load: the ayah says so, its codes never shown in another font
        c2 = await b.new_context(viewport={'width': 390, 'height': 844}, service_workers='block', storage_state=await ctx.storage_state())
        async def cut(rt): await rt.abort()
        await c2.route('**/fonts/qpc/p303.woff2', cut)
        p2 = await c2.new_page(); p2.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)))
        await as_kid(p2, 'مريم'); await p2.goto('about:blank'); await p2.goto(KZ + '#kunuz'); await p2.wait_for_selector('.hello')
        await p2.click('.chamber[data-ax="lamasat"]'); await p2.wait_for_selector('.lesson-card'); await p2.locator('.lesson-card').first.click(); await p2.wait_for_selector('.verse .qpc', state='attached')
        await until(p2, "getComputedStyle(document.querySelector('.verse .qpc')).fontSize === '0px'", 6000)
        r = await p2.evaluate("() => { const q = document.querySelector('.verse .qpc'); return [getComputedStyle(q).fontSize, getComputedStyle(q, '::before').content]; }")
        ok(r[0] == '0px' and 'تعذّر تحميل خطّ المصحف' in r[1], 'a page font that cannot load: the lesson\'s ayah says so, never its codes in another font (%s)' % r[0])
        await p2.locator('.verse').screenshot(path=os.path.join(SHOTS, 'kz-font-missing.png'))
        await c2.close()
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
