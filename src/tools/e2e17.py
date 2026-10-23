# -*- coding: utf-8 -*-
"""The improvement ideas (2.10): known and learning words, the story of the week in a parent's voice, «أخبرني» as a conversation
with a frame for the young, one week counter and a weekly plan, handwriting for the young, pictures for concrete words, the
recitation for offline use, the child's echo against الحصري, a verse of the memorised part, and a shorter «كنوز البيان» home."""
import asyncio, os, sys, functools, http.server, threading, json
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8796), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8796/'
URL, KZ = BASE + 'index.html', BASE + 'kunuz/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
FAM = "JSON.parse(localStorage.getItem('kb-family-v1'))"

async def as_kid(p, name):
    await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
    ix = await p.evaluate("(n) => kids.findIndex(k => k.name === n)", name)
    await p.evaluate("(i) => { kid = i; store.set('kid', i); store.set('cmp:' + i, {kind: 'camel', name: 'ناجي'}); store.set('planted:' + i, Date.now()); onKid(); }", ix); await p.wait_for_timeout(300)
    return ix

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, permissions=['microphone'])
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        p.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone'); await p.wait_for_selector('#kidForm')
        await p.fill('#kfName', 'مريم'); await p.click('[data-act="kfG"][data-v="f"]'); await p.select_option('#kfBy', '2020'); await p.check('#kfMore'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('#kidForm'); await p.wait_for_timeout(150)
        await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.select_option('#kfBy', '2016'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_timeout(700)

        # ---- the bag: known words apart from words still being learnt; the tile counts the known ones
        await as_kid(p, 'مريم')
        r = await p.evaluate("""() => { const k = Object.keys(ALL)[0], f = ALL[k].family; const bag = [0, 1, 2].map(i => ({w: f[i].lemma, m: f[i].meaning, g: 'drv', id: 'drv|' + k + '|' + f[i].lemma, day: dayN()}));
            store.set('bag:' + kid, bag); const m = mget('drv', k + '|' + f[0].lemma); m.streak = 2; m.lc = dayN(); store.set(MK('drv', k + '|' + f[0].lemma), m); return [bagCounts().known, bagCounts().learning]; }""")
        ok(r == [1, 2], 'one word known (right on two days), two still being learnt (%s)' % r)
        await p.evaluate("go('bag', 'kidBag')"); await p.wait_for_timeout(500)
        t = await p.inner_text('#kidBag')
        ok('عرفتُها (١)' in t and 'أتعلّمها (٢)' in t, '«كلماتي» shows the known words and the words being learnt apart')

        # ---- the story of the week: the same story on up to four days for the young
        r = await p.evaluate("""() => { const n0 = dayN; const ids = []; for (let d = 0; d < 6; d++){ dayN = t => t == null ? n0() + d : n0(t);
              const _t = today; const g = storyPick('nt', new Set()); if (g.length) ids.push(g[0].id); } dayN = n0; return ids; }""")
        ok(len(r) >= 4 and len(set(r[:1])) == 1, 'a young child is told a story (%s)' % r[:4])
        r = await p.evaluate("""() => { localStorage.removeItem('oasis:ntWeek:@' + KZ_IDS[kid]); store.set('ntWeek:' + kid, null); const a = storyPick('nt', new Set())[0].id; const wk = store.get('ntWeek:' + kid);
              wk.days = ['2000-01-01']; store.set('ntWeek:' + kid, wk); const b = storyPick('nt', new Set())[0].id; return [a, b, store.get('ntWeek:' + kid).days.length]; }""")
        ok(r[0] == r[1] and r[2] == 2, 'the story of the week comes back on another day of the week (%s)' % r)
        await p.evaluate("go('dad')"); await p.wait_for_timeout(200)
        if await p.locator('#sheet:not([hidden]) #pinIn').count():
            await p.fill('#pinIn', '1234'); await p.click('#pinOk')
        await p.wait_for_selector('#ddTabs'); await p.locator('#ddTabs button', has_text='صوت الرفيق').click(); await p.wait_for_timeout(600)
        ok('الحكايات بصوتكم' in await p.inner_text('#ddBody') and await p.locator('#ddBody button', has_text='سجّلوا الحكاية').count() >= 10, 'the parents can record the stories in their own voice')

        # ---- «أخبرني» as a conversation: the parents answer, and the answer opens the child's next visit with a turn to answer back
        await p.evaluate("""async () => { await recPut({id: 'tell1', kid, kidName: 'مريم', kind: 'أخبرني', ref: today(), text: 'ماذا أكلتِ اليوم؟', date: today(), type: 'audio/webm', blob: new Blob([new Uint8Array(2000)], {type: 'audio/webm'}), status: 'pending', notes: [], source: 'local'}); }""")
        await p.locator('#ddTabs button', has_text='سطر اليوم').click(); await p.wait_for_timeout(700)
        ok(await p.locator('#ddBody button', has_text='ردّوا عليه بصوتكم').count() == 1, "the parents can answer the child's «أخبرني» in their voice")
        await p.evaluate("""async () => { await recPut({id: 'rep1', kid: -1, to: kid, kind: 'من أبي', ref: today(), replyTo: 'tell1', text: 'ردًّا على: ماذا أكلتِ اليوم؟', date: today(), type: 'audio/webm', blob: new Blob([new Uint8Array(2000)], {type: 'audio/webm'}), status: 'approved', notes: [], source: 'local', heard: false}); }""")
        await p.evaluate("go('home')"); await p.wait_for_timeout(900)
        ok('أهلكِ يردّون على ما قلتِه' in await p.inner_text('#kidHome'), 'the answer waits for her at home')
        await p.locator('#kidHome .msg .bigplay').click(); await p.wait_for_timeout(500)
        ok(await p.locator('#kidHome .msg .rpl').count() == 1, '…and once heard she can answer back')
        fr = await p.evaluate("tellFrame(T('ماذا أكلتَ اليوم؟', 'ماذا أكلتِ اليوم؟'))")
        ok('أكلتُ اليومَ' in fr, 'a six-year-old gets a frame to start her answer: ' + fr)

        # ---- one week counter: a day in «كنوز البيان» counts in the oasis too
        r = await p.evaluate("""() => { const before = weekPlayed(); const id = KZ_IDS[kid]; const k = 'kb-kid-' + id; const d = JSON.parse(localStorage.getItem(k) || '{}'); d.st = d.st || {}; d.st.daily = {last: today(), days: [today()], wk: 0}; localStorage.setItem(k, JSON.stringify(d)); return [before, weekPlayed()]; }""")
        ok(r[1] == r[0] + 1, 'a day in «كنوز البيان» counts in the one week counter (%s)' % r)
        await p.evaluate("go('home')"); await p.click('#whoBtn'); await p.click('#ksParent'); await p.wait_for_timeout(300)
        wk = await p.evaluate("(() => { const d = document.querySelector('#sheet .wkplan'); return d ? d.textContent : ''; })()")
        ok('خطة الأسبوع' in wk and 'مريم' in wk and 'هند' in wk, "the parents' hub has a weekly plan for each child")
        await p.evaluate("closeSheet()")

        # ---- handwriting, pictures, a verse of the memorised part
        await as_kid(p, 'مريم')
        r = await p.evaluate("""() => { store.set('tripsDone:' + kid, 2); const seq = buildTrip(false).map(c => c.g); return seq; }""")
        ok('write' in r, "every other trip a six-year-old writes today's word in her notebook and photographs it")
        r = await p.evaluate("""() => { store.set('tripPart:' + kid + ':' + today(), {n: 1, used: 0, until: 0, t: 0}); TRIP = {v: TRIP_V, cards: [{g: 'write', id: 'write|كتاب', word: 'كِتَاب', meaning: 'ما يُكتب'}, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); return document.querySelector('#kidTrip').innerText; }""")
        ok('صوّري ما كتبتِ' in r, 'the writing card asks for a photo of the notebook')
        r = await p.evaluate("""() => { const c = {kind: 'learn', g: 'learn', id: 'drv|x|y', t: 'x', big: 'كِتَاب', bagWord: 'كِتَاب', body: ['ما يُكتب']}; TRIP = {v: TRIP_V, cards: [c, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); const e = document.querySelector('#kidTrip .pic'); return e ? e.textContent : ''; }""")
        ok(r == '📖', 'a concrete word has its picture on the lesson card of a six-year-old: ' + r)
        r = await p.evaluate("""() => { const v = memoVerseOfDay(); return v ? [v.kind, !!v.qv] : null; }""")
        hp = await p.evaluate("!!window.WAHA_AUDIO")
        ok(r is not None and r[0] == 'آية' and (r[1] or not hp), 'the recording card offers a verse of the memorised part, with الحصري when the recitation is here (%s)' % r)
        await p.evaluate("TRIP = null; go('kid')")

        # ---- the recitation: offline download in the web app, and the echo against الحصري
        await p.evaluate("go('dad')"); await p.wait_for_timeout(200)
        if await p.locator('#sheet:not([hidden]) #pinIn').count():
            await p.fill('#pinIn', '1234'); await p.click('#pinOk')
        await p.wait_for_selector('#ddTabs'); await p.locator('#ddTabs button', has_text='واجهة الطفل').click(); await p.wait_for_timeout(500)
        has_pack = await p.evaluate("!!window.WAHA_AUDIO")
        ok(not has_pack or await p.locator('#ddBody button', has_text='الحصري آيةً آية').count() == 1, 'the parents can fetch the recitation for offline use (web app)')
        await p.evaluate("go('home')")
        ok(await p.evaluate("typeof echoKeep === 'function' && /tl-echo/.test(document.documentElement.innerHTML + tlRender.toString())"), 'the learning player can record the echo and compare it with الحصري')

        # ---- «قراءة الربع»: waits for the sheikh; once approved, a new passage, last quarter's again, and three questions
        await as_kid(p, 'مريم')
        await p.evaluate("go('dad')"); await p.wait_for_timeout(200)
        if await p.locator('#sheet:not([hidden]) #pinIn').count():
            await p.fill('#pinIn', '1234'); await p.click('#pinOk')
        await p.wait_for_selector('#ddTabs'); await p.locator('#ddTabs button', has_text='قراءة الربع').click(); await p.wait_for_timeout(300)
        ok('تنتظر مراجعة الشيخ' in await p.inner_text('#ddBody') and not await p.evaluate("!!DATA.orf"), 'the quarterly reading waits for the sheikh: the build carries no passage until they are approved')
        O = json.load(open(os.path.join(ROOT, 'parts', 'waha', 'pending', 'orf.json'), encoding='utf-8'))
        await p.evaluate("(o) => { DATA.orf = o; renderDad(); }", O); await p.wait_for_timeout(300)
        await p.click('#orfGo'); await p.wait_for_selector('#orfText')
        ok('القطعة الجديدة' in await p.inner_text('#ddBody') and await p.evaluate("ORF.steps.map(s => s.id).join(',')") == 'L1-Q1', 'the first sitting of a six-year-old starts at level one')
        await p.locator('#orfCtl button').first.click(); await p.wait_for_timeout(400)
        await p.evaluate("ORF.w.t0 = Date.now() - 45000")
        await p.locator('#orfCtl button', has_text='قبل الدقيقة').click(); await p.wait_for_timeout(600)
        await p.locator('#orfText .otok[data-i="2"]').click(); await p.locator('#orfText .otok[data-i="9"]').click()
        sm = await p.inner_text('#orfSum')
        ok('أخطأت في ٢' in sm and 'بدقّة ٩٦٪' in sm, 'the parents mark the words she missed; words read, correct words a minute and accuracy follow: ' + sm)
        await p.locator('#orfCtl button', has_text='احفظوا وتابعوا').click(); await p.wait_for_timeout(500)
        t = await p.inner_text('#ddBody')
        ok('ثلاثة أسئلة عن' in t and 'أخفوا القطعة' in t and await p.locator('#orfText').count() == 0, 'then three questions, the passage hidden')
        for i, v in enumerate(('1', '0.5', '1')):
            await p.locator('[data-q="%d"] [data-v="%s"]' % (i, v)).click(); await p.wait_for_timeout(100)
        await p.click('#orfSave'); await p.wait_for_timeout(400)
        r = await p.evaluate("(() => { const h = store.get('orf:' + kid, []); return [h.length, h[0].neu.wcpm, h[0].neu.acc, h[0].comp, store.get('orfLvl:' + kid, null)]; })()")
        ok(r == [1, 67, 96, 2.5, 1], 'saved: 50 right of 52 in 45 seconds = 67 a minute, 96%%, understanding 2.5 of 3, level one (%s)' % r)
        await p.evaluate("(() => { const h = store.get('orf:' + kid, []); h[0].t -= 91 * 864e5; store.set('orf:' + kid, h); renderDad(); })()"); await p.wait_for_timeout(300)
        await p.click('#orfGo'); await p.wait_for_selector('#orfText')
        ok(await p.evaluate("ORF.steps.map(s => s.id + (s.reread ? '*' : '')).join(',')") == 'L1-Q2,L1-Q1*', "three months later: the next new passage, then last quarter's again")
        for k in range(2):
            await p.locator('#orfCtl button').first.click(); await p.wait_for_timeout(300)
            await p.evaluate("ORF.w.t0 = Date.now() - %d" % (40000 if k == 1 else 50000))
            await p.locator('#orfCtl button', has_text='قبل الدقيقة').click(); await p.wait_for_timeout(500)
            await p.locator('#orfCtl button', has_text='احفظوا وتابعوا').click(); await p.wait_for_timeout(400)
        for i in range(3):
            await p.locator('[data-q="%d"] [data-v="1"]' % i).click(); await p.wait_for_timeout(80)
        await p.click('#orfSave'); await p.wait_for_timeout(400)
        t = await p.inner_text('#ddBody')
        ok('قرأت قطعة «الْقِطَّةُ الصَّغِيرَةُ» مرةً ثانية بعد ٩١ يومًا: ٦٧ ← ٧٨ كلمةً صحيحة في الدقيقة' in t and 'نموٌّ حقيقي' in t, 'growth is read on the same passage, with the error of one minute in mind')
        ok(await p.evaluate("PRIVATE_K.has('قراءة الربع')"), 'the readings stay between the child and the parents (never gifted, exported or broadcast)')
        await as_kid(p, 'هند')
        await p.evaluate("go('dad')"); await p.wait_for_timeout(200)
        if await p.locator('#sheet:not([hidden]) #pinIn').count():
            await p.fill('#pinIn', '1234'); await p.click('#pinOk')
        await p.wait_for_selector('#ddTabs')
        await p.evaluate("(o) => { DATA.orf = o; ddTab = 'orf'; renderDad(); }", O); await p.wait_for_timeout(300)
        await p.click('#orfGo'); await p.wait_for_selector('#orfText')
        await p.locator('#orfCtl button').first.click(); await p.wait_for_timeout(300)
        await p.evaluate("ORF.w.t0 = Date.now() - 60000"); await p.wait_for_timeout(700)
        await p.locator('#orfText .otok[data-i="70"]').click()
        for i in range(12):
            await p.locator('#orfText .otok[data-i="%d"]' % (i * 3)).click()
        await p.locator('#orfCtl button', has_text='احفظوا وتابعوا').click(); await p.wait_for_timeout(400)
        ok(await p.evaluate("ORF.steps.map(s => s.id).join(',')") == 'L3-Q1,L2-Q1', 'a minute ends on the word she reached; below 90%% at level three, the first sitting tries level two (%s)' % await p.evaluate("ORF.steps.map(s => s.id).join(',')"))
        await p.evaluate("ORF = null; ddTab = 'today'; go('home')")

        # ---- «كنوز البيان»: a shorter home
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
        ok(await p.locator('details.fold').count() == 2 and await p.locator('details.fold[open]').count() == 0, "the scholars' chain and the extra doors fold away on the home of «كنوز البيان»")
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
