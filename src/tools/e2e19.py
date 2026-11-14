# -*- coding: utf-8 -*-
"""2.12: the Quran in the Mushaf's own script (KFGQPC QPC V2), ayah after ayah: every ayah the oasis shows is drawn with its page's
font, the word a card points at coloured, a riddle's hidden words a blank, the basmala from al-Fatiha's first words; the fonts are the
King Fahd Complex's own, every glyph of the data is in its page's font, and nothing of the glyph codes is ever spoken."""
import asyncio, os, sys, functools, http.server, threading, json, re
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8798), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8798/'
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

        # ---- the data and the fonts, as stored in the repository
        Q = os.path.join(ROOT, 'quran', 'qpc-v2')
        G = json.load(open(os.path.join(Q, 'qpc-v2-ayah-by-ayah-glyphs.json'), encoding='utf-8'))
        ok(len(G) == 6236 and len([f for f in os.listdir(os.path.join(Q, 'fonts')) if f.endswith('.woff2')]) == 605, 'the 6236 ayat and the 604 page fonts (and the basmala font) are kept in the repository')
        man = [l.split('\t') for l in open(os.path.join(Q, 'fonts.tsv'), encoding='utf-8').read().strip().split('\n')[1:]]
        ok(len(man) == 605 and all(r[5] == 'True' for r in man), 'every font was converted without changing a glyph (fonts.tsv)')

        await as_kid(p, 'مريم')
        r = await p.evaluate("""async () => { const n = Object.keys(QPC).length; const f = await document.fonts.load('28px qpc582', '\uFC41'); return [n, f.length, document.fonts.check('28px qpc582', '\uFC41'), !!document.querySelector('link[href="fonts/qpc/qpc.css"]')]; }""")
        ok(r[0] > 1000 and r[1] >= 1 and r[2] and r[3], 'the oasis carries the glyphs of the ayat it shows and loads their page fonts (%s ayat)' % r[0])

        # ---- a verse a card points into: the whole ayah, its word coloured
        r = await p.evaluate("""() => { const v = DATA.palms['علم'].family[0].verses[0]; const box = document.createElement('div'); box.innerHTML = verseHtml(v); const q = box.querySelector('.qpc');
            const toks = QPC[v.s + ':' + v.a][1].split(' '); const m = box.querySelector('.qpc mark');
            return [v.s + ':' + v.a, q && q.style.fontFamily, m && m.textContent, toks[v.qw[0]], q && q.getAttribute('aria-label'), box.textContent.includes('﴿'), toks.length]; }""")
        ok(r[1] == 'qpc582' and r[2] == r[3] and r[4] == 'النبأ: 4' and not r[5], 'كَلَّا سَيَعْلَمُونَ (78:4) is drawn whole in page 582\'s font, «سَيَعْلَمُونَ» coloured, its name given to a screen reader (%s)' % r[:2])
        r = await p.evaluate("""() => { let n = 0, bad = []; for (const P of Object.values(DATA.palms)) for (const f of P.family || []) for (const v of f.verses || []) { const q = QPC[v.s + ':' + v.a]; if (!q) { bad.push(v.s + ':' + v.a); continue; } if (v.word && !(v.qw && v.qw.length) && !(v.s === 13 && v.a === 37)) bad.push('no word ' + v.s + ':' + v.a); n++; } return [n, bad.slice(0, 5)]; }""")
        ok(r[0] > 300 and not r[1], 'every example verse of the palms has its glyphs and its word (%d)' % r[0])
        # a word after pause marks keeps its place: 2:2 «لِّلْمُتَّقِينَ» comes after two marks (ۛ ۛ)
        r = len(G['2:2']['text'].split(' '))
        ok(r == 10, 'the pause marks are glyphs of their own (2:2: 7 words, 2 marks and the end mark = %s)' % r)

        # ---- a riddle: the hidden words become one blank, the rest of the ayah stays
        r = await p.evaluate("""() => { const b = GZ.quran.map(x => x.blank).find(v => v && v.qb && v.qb.length); if (!b) return null; const box = document.createElement('div'); box.innerHTML = blankHtml(b);
            const toks = QPC[b.s + ':' + b.a][1].split(' '); return [box.querySelectorAll('.qbl').length, box.querySelector('.qpc').textContent.split(' ').filter(Boolean).length, toks.length - b.qb.length + 1]; }""")
        ok(r and r[0] == 1 and r[1] == r[2], 'a riddle shows the ayah with one blank where its words are hidden (%s)' % r)

        # ---- the Mushaf pages and the recitation: ayah after ayah, the basmala before a surah
        r = await p.evaluate("""() => { const pg = QN.pages.find(x => x.ayat.some(y => y[1] === 1 && y[0] > 1 && y[0] !== 9)); const box = document.createElement('div'); box.innerHTML = pageHtml(pg);
            return [pg.ayat.length, box.querySelectorAll('.qpage > span.qp > .qpc').length, box.querySelectorAll('.qpc[aria-label="بسم الله الرحمن الرحيم"]').length, /﴿[٠-٩0-9]+﴾/.test(box.textContent)]; }""")
        ok(r[0] == r[1] and r[2] >= 1 and not r[3], 'a page of «مصحفي»: every ayah in its page\'s font with its own end mark, the basmala before the surah (%s)' % r)

        # ---- the recording sheet: the ayah a child records, in the Mushaf script; the recording keeps its place
        e = await p.evaluate("() => { try { recordFrom('آية', 'النبأ: 4', 'كَلَّا سَيَعْلَمُونَ', null, {qa: {s: 78, a: 4}}); return ''; } catch (e) { return String(e); } }"); await p.wait_for_timeout(300)
        ok(not e and await p.locator('#sheet .qp > .qpc[style*="qpc582"][aria-label^="النبأ"]').count() == 1, 'the recording sheet shows the ayah to recite in the Mushaf script %s' % e)
        await p.evaluate("closeSheet()")

        # ---- nothing of the glyphs is spoken
        await p.evaluate("""() => { window.__said = []; speechSynthesis.speak(new SpeechSynthesisUtterance('ﱁ ﱂ ﱃ قال ﷺ نعم')); }"""); await p.wait_for_timeout(200)
        s = await p.evaluate(SAID)
        ok('نعم' in s and 'ﷺ' in s and not re.search('[\uFB51-\uFD3D]', s), 'the speech engine never receives a glyph code, and ﷺ stays (%s)' % s)

        # ---- the learn card of a word from a known root: its ayah in the Mushaf script
        r = await p.evaluate("""() => { const k = Object.keys(ALL).find(k => (ALL[k].unknown || []).some(u => u.verse)); const u = ALL[k].unknown.find(u => u.verse); const L = learnCard('uk', k + '|' + u.lemma);
            TRIP = {v: TRIP_V, cards: [L, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); return !!L; }"""); await p.wait_for_timeout(500)
        ok(await p.locator('#kidTrip .kcard .qpc mark').count() == 1, 'a learn card quotes its ayah in the Mushaf script, the word coloured')
        await p.evaluate("TRIP = null; go('kid')")
        # ---- the chambers' learn card and the missing word's: the ayah whole in the Mushaf script, never bolded by the browser
        r = await p.evaluate("""() => { const L = KZD.lessons.find(l => (l.verses || []).some(v => v.s) && (l.quiz || []).length); const k = learnCard('kz', L.id + '|0');
            const fk = Object.keys(ALL).find(k => ALL[k].family.some(f => f.verses.some(v => v.qw))); let fv = null; ALL[fk].family.forEach(f => f.verses.forEach(v => { if (!fv && v.qw) fv = v; }));
            const f = learnCard('fill', fk + '|' + fv.s + ':' + fv.a + '|' + strip(fv.word));
            TRIP = {v: TRIP_V, cards: [k, f, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); return [!!k, !!f]; }"""); await p.wait_for_timeout(600)
        a = await p.evaluate("""() => { const q = document.querySelector('#kidTrip .kcard.learn .kq.big .qpc'); return q ? [getComputedStyle(q).fontWeight, getComputedStyle(q).fontSynthesis || getComputedStyle(q).fontSynthesisWeight] : null; }""")
        await p.evaluate("TRIP.i = 1; renderTrip()"); await p.wait_for_timeout(500)
        f = await p.locator('#kidTrip .kcard.learn .kq.big .qpc mark').count()
        ok(r == [True, True] and a and a[0] == '400' and f == 1, 'the chambers\' learn card and the missing word\'s draw their ayah whole in the Mushaf script, the word coloured, never in a faked bold (%s %s %s)' % (r, a, f))
        await p.evaluate("TRIP = null; go('kid')")
        # ---- the family relay: the surah ayah after ayah, each in the Mushaf script, the basmala before it
        r = await p.evaluate("""async () => { const s = RY_SURAHS.find(x => x !== 1 && x !== 9); rySurah = s; try { await renderRelay(); } catch (e) { return ['err', String(e)]; }
            const B = document.getElementById('ryBody'); return [QN.surahs[s].n, B.querySelectorAll('#ryList .qpc').length, B.querySelectorAll('.qpc[aria-label="بسم الله الرحمن الرحيم"]').length, /﴿[٠-٩0-9]+﴾/.test(B.textContent)]; }""")
        ok(r[0] == r[1] and r[2] == 1 and not r[3], 'the family relay shows its surah ayah after ayah in the Mushaf script, the basmala first (%s)' % r)
        await p.screenshot(path=os.path.join(SHOTS, 'qpc-kid.png'))

        # ---- a page's font that cannot load: its ayat say so, and its codes are never shown in another font
        c2 = await b.new_context(viewport={'width': 390, 'height': 844}, service_workers='block', storage_state=await ctx.storage_state())
        async def cut(rt): await rt.abort()
        await c2.route('**/fonts/qpc/p582.woff2', cut)
        p2 = await c2.new_page(); p2.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)))
        await p2.goto(URL); await p2.wait_for_selector('#whoBtn'); await p2.wait_for_timeout(400)
        await p2.evaluate("() => { const d = document.createElement('div'); d.id = 'qbad'; d.innerHTML = verseHtml(DATA.palms['علم'].family[0].verses[0]); document.body.prepend(d); }")
        await until(p2, "QPC_BAD.has('582')", 6000); await p2.wait_for_timeout(200)
        r = await p2.evaluate("""() => { const q = document.querySelector('#qbad .qpc'); return [QPC_BAD.has('582'), getComputedStyle(q).fontSize, getComputedStyle(q, '::before').content]; }""")
        ok(r[0] and r[1] == '0px' and 'تعذّر تحميل خطّ المصحف' in r[2], 'a page font that cannot load: its ayah says so, never its codes in another font (%s)' % r[:2])
        await c2.close()
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
