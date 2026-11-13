# -*- coding: utf-8 -*-
"""The fixes of 2.11, as the family sees them: the device's voice never reads the Quran nor a raw ⟨m|f⟩ marker, the browser's
own menus do not save a child's voice or picture, nothing comes into the oasis without the PIN, the parents' board closes after
fifteen minutes, the consent sheet names the child the file is about; the placement test seeds nothing and asks only the child's
own games, the pattern games keep their vowel contrasts, a long trip shows a bar, the break explains itself, a small child hears
how to choose and why an answer was wrong, dates for saying a word aloud once a day, no score told to the child, the Friday report
counts its own days; the Mushaf's text (no basmala inside an ayah, the saktat of Hafs), speech recorded at 32 kbps, and nothing
of the Claude artifact runtime."""
import asyncio, os, sys, functools, http.server, threading, json, re
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8797), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8797/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
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

        # ---- the content: the Mushaf's own text
        P = D['palms']
        ok(all(not v['text'].startswith(('بِسْمِ', 'بِّسْمِ')) for r in P.values() for f in r.get('family', []) for v in f.get('verses', []) if v.get('s') != 1),
           'no example verse carries the basmala as if it were part of its ayah (78:1, 75:1, 76:1, 97:1)')
        A = {(x[0], x[1]): x[2] for pg in D['quran']['pages'] for x in pg['ayat']}
        ok('مَنْ ۜ رَاقٍ' in A[(75, 27)] and 'بَلْ ۜ رَانَ' in A[(83, 14)] and A[(69, 28)].endswith('ۜ'), 'the saktat of Hafs are marked on the pages (75:27, 83:14, 69:28)')
        w9 = [x for x in D['hadith']['items'] if x['id'] == 'W09'][0]
        ok(w9['focus'].endswith('…') and 'إلا' not in w9['meaning'] and 'امرأةً' in w9['meaning'], 'W09 says it is an excerpt, and its meaning keeps to what the excerpt says')
        q = D['shir']['qasaid']
        ok('لَا تَمِلْ عَنِّي' in q[2]['lines'][0]['text'] and 'لِهَـ ۞ ـذَا' in q[1]['lines'][8]['text'], "Shawqi's two lines as in the Shawqiyyat")

        # ---- 1. the device's voice: the family guard under every section
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
        await as_kid(p, 'مريم')
        await p.evaluate("""() => { window.__said = []; speechSynthesis.speak(new SpeechSynthesisUtterance('⟨أحسنت|أحسنتِ⟩ يا بطلة ﴿وَقِيلَ مَنْ رَاقٍ﴾ ثم ٱلرَّحْمَٰنُ عَلَّمَ')); }"""); await p.wait_for_timeout(200)
        s = await p.evaluate(SAID)
        ok('أحسنتِ' in s and '⟨' not in s and 'رَاقٍ' not in s and 'ٱلرَّحْمَٰنُ' not in s, 'the guard: the marker said in her own form, the verse and the Mushaf-spelt word left out (%s)' % s)
        await p.evaluate("""() => { window.__said = []; say(['هذه آية: ﴿وَقِيلَ مَنْ ۜ رَاقٍ﴾ فاسمعيها من الحصري']); }"""); await p.wait_for_timeout(500)
        s = await p.evaluate(SAID)
        ok('الحصري' in s and 'وَقِيلَ' not in s and 'راق' not in s, 'the oasis never reads a quoted verse aloud, even a verse with no Mushaf spelling (%s)' % s)
        await p.evaluate("""() => { window.__said = []; speechSynthesis.speak(new SpeechSynthesisUtterance('﴿قُلْ هُوَ ٱللَّهُ أَحَدٌ﴾')); }"""); await p.wait_for_timeout(200)
        ok(await p.evaluate(SAID) == '', 'a text that is all verse is not spoken at all')

        # ---- 2. the browser's own save controls
        r = await p.evaluate("""async () => { const a = document.createElement('audio'); a.controls = true; document.body.appendChild(a); const i = document.createElement('img'); document.body.appendChild(i);
            await new Promise(r => setTimeout(r, 50)); const ev = new MouseEvent('contextmenu', {bubbles: true, cancelable: true}); i.dispatchEvent(ev);
            const out = [a.getAttribute('controlslist'), ev.defaultPrevented, i.draggable]; a.remove(); i.remove(); return out; }""")
        ok(r == ['nodownload noplaybackrate', True, False], 'no «Download» on a child\'s recording, no «Save image» on a picture (%s)' % r)

        # ---- 3. nothing comes in without the PIN
        await p.evaluate(r"""() => { window.__imp = (async () => {
            const items = [{id: 'g18', fromName: 'سلمى', kind: 'حديث', ref: 'ر', text: 'ن', type: 'audio/webm', b64: 'AAAA', date: '2026-10-20'}];
            await importGiftFile(new File([JSON.stringify({type: 'gift', items})], 'g.json', {type: 'application/json'}), document.createElement('p'));
            return (await dbAll('gift')).length; })(); }""")
        await p.wait_for_selector('#sheet:not([hidden]) #imPin')
        await p.fill('#imPin', '0000'); await p.click('#imGo'); await p.wait_for_timeout(400)
        ok((await p.inner_text('#imFb')).strip() != '' and await p.locator('#sheet:not([hidden]) #imPin').count() == 1, 'a wrong PIN lets nothing in')
        await p.click('#imNo')
        ok(await p.evaluate("window.__imp") == 0, 'a gift refused leaves nothing on the device')

        # ---- 4. the parents' board closes on its own after fifteen minutes
        await board(p)
        await p.evaluate("(() => { const n0 = Date.now; window.__n0 = n0; Date.now = () => n0() + 16 * 60000; })()")
        closed = await until(p, "!(cur && cur.o === 'dad')", 8000)
        await p.evaluate("Date.now = window.__n0")
        ok(closed, 'the board closes after fifteen minutes, open or not')

        # ---- 5. the Friday report: its own seven days, the child's name in the consent, ١٢٣
        await board(p)
        await p.evaluate("""() => { const h = kids.findIndex(k => k.name === 'هند'); const d = new Date(); for (let i = 0; i < 5; i++){ const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i); store.set(`dailyDone:${h}:${ymd(x)}`, true); } }""")
        await p.evaluate("ddTab = 'week'; renderDad()"); await p.wait_for_timeout(700)
        await p.locator('#wkWho button', has_text='هند').click(); await p.wait_for_timeout(200)
        t = await p.evaluate("$('wkText').value")
        ok('تمّ الأسبوع' in t and ' من ٤' not in t and not re.search(r'[0-9]', t), 'the report counts its own seven days, never «٥ من ٤», written ١٢٣: ' + ([l for l in t.split('\n') if 'أيام اللعب' in l] + [''])[0][:90])
        await p.click('#wkSave'); await p.wait_for_timeout(500)
        st = await p.inner_text('#sheet')
        ok('هند' in st, 'the consent sheet names the child the report is about, not the one chosen on the board')
        await p.keyboard.press('Escape'); await p.wait_for_timeout(200)
        ok(await p.evaluate("SAVE_GATE === false && /consentSheet/.test(saveFile.toString())"), 'a file leaves only through the consent sheet (the gate is shut)')

        # ---- 6. the placement test: the child's own games, and nothing seeded into the review
        await as_kid(p, 'مريم')
        r = await p.evaluate("""() => { const qs = plQuestions(); const mine = gamesFor(K().age); go('place', 'plCard'); PL = {qs, i: qs.length, log: qs.map(q => ({g: q.g, id: q.id, lvl: q.lvl, ok: q.lvl === 2}))}; renderPlaceEnd();
            const pl = store.get('placement:' + kid); return [qs.length, qs.every(q => mine.includes(q.g)), Object.keys(GNAME).filter(g => seen(g).length).length, pl.level]; }""")
        ok(r[0] >= 10 and r[1], 'a six-year-old\'s placement asks only her own games (%d questions)' % r[0])
        ok(r[2] == 0, 'the placement seeds nothing into the review: its answers were guesses on things never taught')
        ok(r[3] <= 2, 'and does not send a six-year-old to the workshop (level %s)' % r[3])
        r = await p.evaluate("""() => { const due = (g, id) => { const m = mget(g, id); m.n = 1; m.ok = 1; m.streak = 2; m.due = dayN() - 1; store.set(MK(g, id), m); store.set('seen:' + kid + ':' + g, [id]); };
            const a = POOL.sha()[0], w = POOL.drv()[0]; due('sha', a); due('drv', w);
            const t = buildTrip(false); store.set('seen:' + kid + ':sha', []); store.set('seen:' + kid + ':drv', []); return [t.some(c => c.g === 'sha'), t.some(c => c.g === 'drv' && c.kind === 'review')]; }""")
        ok(r == [False, True], 'her trip reviews her own games, and every word she learnt (a poetry item of the older children waits outside it) (%s)' % r)

        # ---- 7. the pattern games keep the vowels they test
        r = await p.evaluate("[optsOf('عَلِمَ', ['عَلَّمَ', 'عَلَّمَ', 'عِلْم'], 3, 'rl').length, optsOf('عَلِمَ', ['عَلَّمَ'], 3, 'uk').length]")
        ok(r == [3, 1], 'عَلِمَ and عَلَّمَ are two answers in the pattern games, one elsewhere (%s)' % r)
        await p.evaluate("""() => { TRIP = {v: TRIP_V, cards: [{g: 'rl', id: 'x', q: 'q', a: 'عَلِمَ', alts: ['عَلِمَ']}, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); }"""); await p.wait_for_timeout(400)
        ok(await p.evaluate("TRIP.cards.length === 1 && TRIP.cards[0].g === 'tell'"), 'a card with nothing to choose between is passed over')
        r = await p.evaluate("() => { const id = POOL.rl()[0]; const m = mget('rl', id); m.due = dayN(); store.set(MK('rl', id), m); awardAfter('rl', id, true); return mget('rl', id).due - dayN(); }")
        ok(r == 1, 'a word re-taught and answered right is due tomorrow, not today (%s)' % r)

        # ---- 8. a long trip: one bar, and the page no wider than the phone
        await p.evaluate("""() => { const cs = POOL.rl().slice(0, 22).map(id => ({g: 'rl', id, ...GEN.rl(id)})).filter(c => optsOf(c.a, c.alts, 3, 'rl').length >= 2);
            TRIP = {v: TRIP_V, cards: [...cs, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; window.__said = []; store.set('tapTip:' + kid, ''); go('trip', 'kidTrip'); }"""); await p.wait_for_timeout(700)
        r = await p.evaluate("[document.querySelectorAll('#kidTrip .tbar').length, document.querySelectorAll('#kidTrip .dots').length, document.documentElement.scrollWidth <= innerWidth, TRIP.cards.length]")
        ok(r[0] == 1 and r[1] == 0 and r[2], 'a %d-card trip shows «١ من %d» on one bar, and nothing scrolls sideways (%s)' % (r[3], r[3], r))
        # ---- 9. a small child hears how to choose, once a day; «اسمعي الخيارات» is a real button above the options
        s = await p.evaluate(SAID)
        ok('المسي الجواب مرتين' in s, 'on her first question of the day the companion says how to choose (%s)' % s[-60:])
        r = await p.evaluate("(() => { const o = document.querySelector('#kidTrip .kopts'); const sb = o.previousElementSibling; return [!!sb && sb.classList.contains('optsay') && sb.classList.contains('btn'), Math.round(sb.getBoundingClientRect().height)]; })()")
        ok(r[0] and r[1] >= 56, '«اسمعي الخيارات» is a real button above the options (%spx)' % r[1])
        await p.evaluate("window.__said = []; renderTrip()"); await p.wait_for_timeout(500)
        ok('مرتين' not in await p.evaluate(SAID), '…and only once a day')
        # ---- 10. a wrong answer: its reason said, «اسمعي» rather than «انظري»
        why = await p.evaluate("""() => { const c = TRIP.cards[TRIP.i]; const L = learnCard(c.g, c.id); window.__said = []; const w = [...document.querySelectorAll('#kidTrip .kopts .opt')].find(b => b.__o !== c.a); w.click(); w.click(); return L && L.reason; }""")
        await p.wait_for_timeout(1000)
        s = await p.evaluate(SAID)
        ok('انظري' not in s and len(s.split(' | ')) >= 3 and ('معناها' in s or 'معناها' not in (why or '')), 'after a wrong answer she hears the answer and its reason, and is not told to look (%s)' % s[:140])
        lr = await p.evaluate("(document.querySelector('#kidTrip .kcard p.lrn') || {}).textContent || ''")
        ok(lr and '←' not in lr and lr == why, 'the reason for a root question is the word\'s meaning, not the question again: ' + lr[:80])

        # ---- 11. the break: a button that sleeps and says why; a sand bar for a child who cannot read a clock
        await p.evaluate("""() => { store.set('tripPart:' + kid + ':' + today(), {n: 1, used: 21 * 60000, until: 0, t: 0});
            TRIP = {v: TRIP_V, cards: [{g: 'rl', id: POOL.rl()[0], ...GEN.rl(POOL.rl()[0])}, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); }"""); await p.wait_for_timeout(500)
        r = await p.evaluate("[document.querySelectorAll('#kidTrip .bigplay.wait[aria-disabled=true]').length, document.querySelectorAll('#kidTrip .brk').length, document.querySelector('#kidTrip .kq.big').hidden]")
        ok(r == [1, 1, True], 'during the break the button sleeps, and a six-year-old sees sand, not a clock (%s)' % r)
        await p.evaluate("window.__said = []"); await p.locator('#kidTrip .bigplay').click(force=True); await p.wait_for_timeout(400)   # aria-disabled: a tap still answers
        ok('ما زالت الاستراح' in await p.evaluate(SAID), 'a tap on it says the break is still on')
        await p.evaluate("""() => { const k = 'tripPart:' + kid + ':' + today(); const q = store.get(k); q.until = Date.now() - 1; store.set(k, q); window.__said = []; renderTrip(); }"""); await p.wait_for_timeout(1300)
        ok(await p.locator('#kidTrip .bigplay:not(.wait)').count() == 1 and 'انتهت الاستراح' in await p.evaluate(SAID), 'when it is over she hears so, and the button wakes')
        await p.evaluate("store.set('tripPart:' + kid + ':' + today(), {n: 1, used: 0, until: 0, t: 0}); TRIP = null; go('kid')")

        # ---- 12. dates for saying a word aloud: once a day each, a few a day
        r = await p.evaluate("() => { const d0 = dates(); dateOnce('w:كتب', 1, 5); dateOnce('w:كتب', 1, 5); const d1 = dates(); ['a','b','c','d','e','f'].forEach(x => dateOnce('w:' + x, 1, 5)); return [d1 - d0, dates() - d0]; }")
        ok(r == [1, 5], 'saying the same word again earns nothing more, and five words a day at most (%s)' % r)

        # ---- 13. the monthly check thanks the child; the score is for the parents
        t = await p.evaluate("""() => { MS = {items: [{g: 'rl', id: POOL.rl()[0]}, {g: 'rl', id: POOL.rl()[1]}], res: [true, false], i: 2}; const C = $('kidMs'); C.innerHTML = ''; measureEnd(C); return C.textContent; }""")
        ok('سيرى أهلكِ' in t and not re.search(r'[0-9٠-٩]', t), 'the child hears no score: «سيرى أهلكِ ما تذكّرتِه» (%s)' % t[:60])

        # ---- 14. speech recorded at 32 kbps; a silent tap is not a recording
        r = await p.evaluate("async () => { await micStart(); const o = window.__mrOpts; await micStop(); return o && o.audioBitsPerSecond; }")
        ok(r == 32000, 'the oasis records speech at 32 kbps (%s)' % r)

        # ---- 15. a recitation that is not on the device says so
        await p.evaluate("() => { const b = document.createElement('button'); b.id = 'rcT'; b.textContent = '▶'; document.body.appendChild(b); recite(b, {s: 114, a: 99, b: 99}); }")
        ok(await until(p, "!!(document.getElementById('rcT').nextElementSibling || {}).classList && document.getElementById('rcT').nextElementSibling.classList.contains('rfail')", 5000),
           'an ayah not stored on the device: «لم تُحفظ هذه التلاوة على الجهاز بعد»')
        await p.evaluate("document.getElementById('rcT').remove()")

        # ---- 16. references read «البقرة: ١٦٠»; nothing of the Claude artifact runtime
        r = await p.evaluate("verseHtml({text: 'س', word: 'س', name: 'البقرة', s: 2, a: 160})")
        ok('البقرة: 160' in r and '2:160' not in r, 'a verse reference is «البقرة: ١٦٠»')
        ok(await p.evaluate("SAMPLE === null && [...document.scripts].every(s => !/claude\\.use\\(/.test(s.textContent))"), 'no page asks a model or saves through the artifact runtime')

        # ---- 17. the girl and the boy: each in their own form
        await as_kid(p, 'عمر')
        ok(await p.evaluate("CL.twoTaps()") == 'اسمع، ثم المس الجواب مرتين', 'the boy is told «اسمع، ثم المس»')
        await as_kid(p, 'هند')
        ok(await p.evaluate("CL.twoTaps()") == 'اسمعي، ثم المسي الجواب مرتين' and '⟨' not in await p.inner_text('body'), 'the girl «اسمعي، ثم المسي», and no raw marker on her page')

        # ---- 18. «كنوز البيان»: the same guard; a reset with the recovery code is shown like a change of PIN
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_timeout(1200)
        await p.evaluate("""() => { const F = JSON.parse(localStorage.getItem('kb-family-v1')); F.cur = F.kids.find(k => k.name === 'هند').id; localStorage.setItem('kb-family-v1', JSON.stringify(F));
            window.__said = []; speechSynthesis.speak(new SpeechSynthesisUtterance('⟨فكّر|فكّري⟩: ﴿وَٱلضُّحَىٰ﴾ وكلمة ٱلضُّحَىٰ')); }"""); await p.wait_for_timeout(200)
        s = await p.evaluate(SAID)
        ok('فكّري' in s and '⟨' not in s and 'ٱلضُّحَىٰ' not in s, '«كنوز البيان» speaks in the girl\'s form and never the verse (%s)' % s)
        ok(await p.evaluate("!!document.querySelector('script[src=\"../js/guard.js\"]')"), '«كنوز البيان» loads the family guard')
        await p.goto('about:blank'); await p.goto(HS); await p.wait_for_timeout(1500)
        ok(await p.evaluate("!!document.querySelector('script[src=\"../js/guard.js\"]') && !!window.WAHA_GUARD"), 'the Hasaniya loads the family guard')

        # ---- 19. in the Android app the bridge puts its own speech in place of the WebView's: the guard still stands in front of it
        st = await ctx.storage_state()
        c2 = await b.new_context(viewport={'width': 390, 'height': 844}, storage_state=st)
        await c2.add_init_script(r"""window.AndroidBridge = {speak: function (id, t) { (window.__ab = window.__ab || []).push(t); setTimeout(function () { if (window.__ttsEvent) window.__ttsEvent('end', id); }, 0); },
            isSpeaking: function () { return false; }, cancel: function () {}, shareFile: function () {}, printHtml: function () {}};""")
        q2 = await c2.new_page(); q2.on('pageerror', lambda e: ERRS.append('pageerror (android): ' + str(e)))
        heard = []
        for name, url in (('the oasis', URL), ('«كنوز البيان»', KZ + '#kunuz'), ('the Hasaniya', HS)):
            await q2.goto('about:blank'); await q2.goto(url); await q2.wait_for_timeout(1500)
            r = await q2.evaluate("""() => { window.__ab = []; speechSynthesis.speak(new SpeechSynthesisUtterance('⟨أحسنت|أحسنتِ⟩ {وَٱلضُّحَىٰ} ﴿وَٱلَّيْلِ إِذَا سَجَىٰ﴾ هيا')); return new Promise(r => setTimeout(() => r((window.__ab || []).join(' | ')), 100)); }""")
            heard.append(r)
            ok('هيا' in r and '⟨' not in r and 'سَجَىٰ' not in r and 'ٱلضُّحَىٰ' not in r, 'Android, %s: the bridge hears no verse and no raw marker (%s)' % (name, r))
        await c2.close()
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
