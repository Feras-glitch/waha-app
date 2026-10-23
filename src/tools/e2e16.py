# -*- coding: utf-8 -*-
"""The children (2.9): a girl hears her own form from the speech engine (and in the Hasaniya), the closing question and the end of
the day are said aloud, a gift is chosen and not typed at six, celebrations wait for the end of the trip and never cover the
parents' board, the trip pauses for a break (20 minutes up to eight, 30 up to twelve, a choice above), the child may go on by
choice after the trip, the week's reader can be a recording from the oasis, the measure asks only words once known, a right answer
on the day of a lapse does not step, the Hasaniya has no five-minute race and no daily streak, one name for the PIN, and a dot
beside a number is never read as a zero."""
import asyncio, os, sys, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8795), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8795/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
FAM = "JSON.parse(localStorage.getItem('kb-family-v1'))"
SPY = """() => { window.__said = []; const real = window.ttsSay; ttsSay = (t, tok) => { window.__said.push(String(t)); return Promise.resolve(); }; }"""

async def as_kid(p, name):
    await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
    ix = await p.evaluate("(n) => kids.findIndex(k => k.name === n)", name)
    await p.evaluate("(i) => { kid = i; store.set('kid', i); store.set('cmp:' + i, {kind: 'camel', name: 'ناجي'}); store.set('planted:' + i, Date.now()); onKid(); }", ix); await p.wait_for_timeout(300)
    return ix

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        p.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone'); await p.wait_for_selector('#kidForm')
        for i, (n, g, y) in enumerate((('مريم', 'f', '2020'), ('يوسف', 'm', '2017'), ('سارة', 'f', '2012'))):
            if i == 2:
                await p.wait_for_timeout(500)
                v = await p.inner_text('#view')
                ok('تمّ الإعداد: من يبدأ؟' in v and await p.locator('[data-act="setupStart"]').count() == 2 and await p.locator('[data-act="voiceTest"]').count() == 1,
                   'the first setup ends with «من يبدأ؟», the children, and a test of the Arabic voice')
                ok(await p.inner_text('#homeBtn .b-name') == 'واحة اللسان العربي', 'and the header stays «واحة اللسان العربي» during the setup')
                await p.click('[data-act="kidAdd"]')
            await p.wait_for_selector('#kidForm'); await p.wait_for_timeout(150)
            await p.fill('#kfName', n); await p.click('[data-act="kfG"][data-v="%s"]' % g); await p.select_option('#kfBy', y)
            if i == 0: await p.check('#kfMore')
            await p.click('#kidForm button[type=submit]')
        await p.wait_for_timeout(700)
        await p.click('[data-act="setupStart"]'); await p.wait_for_selector('#whoBtn', timeout=8000)
        ok(True, '«من يبدأ؟» opens that child\'s oasis')
        ok(len(await p.evaluate(FAM + ".kids")) == 3, 'three children: مريم (6), يوسف (9), سارة (14)')

        # ---- speech keeps the vowel of «you»: every companion line that differs for a girl reaches the engine different
        await as_kid(p, 'مريم')
        r = await p.evaluate("""() => { const pairs = []; const each = () => Object.keys(CL).map(k => { try { const v = CL[k]('كلمة'); return Array.isArray(v) ? v.join(' ') : String(v); } catch (e) { return ''; } });
            const g0 = K().gender; K().gender = 'm'; const m = each(); K().gender = 'f'; const f = each(); K().gender = g0;
            const bad = []; m.forEach((x, i) => { if (x && x !== f[i] && ttsText(x) === ttsText(f[i])) bad.push(f[i]); });
            return {n: m.filter((x, i) => x && x !== f[i]).length, bad, ahsanti: ttsText('أحسنتِ!'), fiki: ttsText('بارك الله فيكِ')}; }""")
        ok(r['n'] > 10 and not r['bad'], 'the %d companion lines written for a girl reach the speech engine in her form (%s)' % (r['n'], r['bad'][:3]))
        ok('أحسنتِ' in r['ahsanti'] and r['fiki'].endswith('فيكِ'), '«أحسنتِ» and «فيكِ» keep their kasra at the pause (%s · %s)' % (r['ahsanti'], r['fiki']))

        # ---- the closing question is said, not only written; the end of the day too
        await p.evaluate(SPY)
        await p.evaluate("""() => { TRIP = {v: TRIP_V, cards: [{g: 'tell', id: 'tell', q: 'ماذا تحبّين أن تأكلي غدًا؟'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); }""")
        await p.wait_for_timeout(900)
        said = await p.evaluate("window.__said.join(' | ')")
        ok('ماذا تحبّين أن تأكلي غدًا' in said, 'the «أخبريني» question itself is said aloud: ' + said[:80])
        ok(await p.locator('#kidTrip .kcard .kq .hear').count() == 1, '…and has its own 🔊')
        await p.evaluate("""() => { window.__said = []; store.set('bag:' + kid, [{w: 'بَنَى', m: 'صنع', day: dayN()}]); TRIP = {v: TRIP_V, cards: [], i: 0, res: [], done: false, key: 'trip:' + kid + ':' + today(), d0: dates()}; tripEnd(); }""")
        await p.wait_for_timeout(900)
        said = await p.evaluate("window.__said.join(' | ')")
        ok('بَنَى' in said, 'the word to say at home is said at the end of the day')
        t = await p.inner_text('#kidTrip')
        await p.evaluate("() => { store.set('dates:' + kid, 10); TRIP = {v: TRIP_V, cards: [], i: 0, res: [true, true, true, true, true], done: false, key: null, d0: 8}; tripEnd(); }")
        await p.wait_for_timeout(300)
        ok('(+٢ اليوم)' in await p.inner_text('#kidTrip .cnt'), 'the trip end shows the dates really gained (+٢), not the right answers (٥)')
        ok('كلمات جديدة' in t and '(' not in t.split('مراجعة إضافية')[-1][:6], 'after the trip she may go on by choice: «✨ كلمات جديدة» (and no count on «مراجعة إضافية»)')

        # ---- celebrations wait for the end of the trip and never open over the parents' board
        await p.evaluate("""() => { TRIP = {v: TRIP_V, cards: [{g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); celeQueue.push(STAGES[0]); showCele(); }""")
        await p.wait_for_timeout(300)
        ok(await p.evaluate("document.getElementById('cele').hidden"), 'a new element of the oasis does not interrupt the trip')
        await p.evaluate("() => { TRIP = null; go('kid'); }"); await p.wait_for_timeout(900)
        ok(not await p.evaluate("document.getElementById('cele').hidden"), '…it is celebrated back home (%s)' % await p.evaluate("JSON.stringify([celeQueue.length, cur, typeof TRIP === 'undefined' ? 'u' : TRIP, celeHere()])"))
        h2 = await p.evaluate("(document.querySelector('#cele h2') || {}).textContent || ''")
        ok('جديدة' not in h2 and 'مريم' in h2, 'its title needs no adjective that could disagree («فانوس جديدة»): ' + h2)
        await p.evaluate("document.querySelector('#cele button') && document.querySelector('#cele button').click()"); await p.wait_for_timeout(200)

        # ---- a gift at six is chosen among heard words, not typed
        await p.evaluate("""async () => { const sis = kids.findIndex(k => k.name === 'سارة'); await dbPut('gift', {id: 'g1', from: sis, fromName: 'سارة', to: kid, toName: 'مريم', recId: 'r1', kind: 'تحفة', ref: 'x', text: 'يقول راجي رحمة الغفور دوما سليمان هو الجمزوري', type: 'audio/webm', blob: new Blob([new Uint8Array(900)], {type: 'audio/webm'}), date: today(), status: 'sent', source: 'local'}); }""")
        await p.evaluate("go('rec', 'gifts')"); await p.wait_for_timeout(300)
        await p.evaluate("typeof setGfMode === 'function' && setGfMode('in'); renderGifts()"); await p.wait_for_timeout(700)
        ok(await p.locator('#gfList .opt').count() == 3 and await p.locator('#gfList input.t').count() == 0, 'مريم (6) completes her sister\'s gift by choosing among three words, not by typing')

        # ---- sittings: a break after 20 minutes at six; the third sitting lets her stop for the day
        await p.evaluate("""() => { store.set('tripPart:' + kid + ':' + today(), {n: 1, used: 21 * 60000, until: 0, t: 0});
            TRIP = {v: TRIP_V, cards: [{g: 'rl', id: 'x', q: 'q', a: 'a', alts: ['b']}, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); }""")
        await p.wait_for_timeout(400)
        t = await p.inner_text('#kidTrip')
        ok('استراحة' in t and 'نكمل بعد' in t and await p.locator('#kidTrip .bigplay[disabled]').count() == 1, 'after 20 minutes of play a ten-minute break, the trip kept in its place')
        await p.evaluate("""() => { const k = 'tripPart:' + kid + ':' + today(); const q = store.get(k); q.until = Date.now() - 1; store.set(k, q); renderTrip(); }""")
        await p.wait_for_timeout(1300)
        ok(await p.locator('#kidTrip .bigplay:not([disabled])').count() == 1, '…and «نكمل الرحلة» opens when the break is over')
        await p.evaluate("""() => { store.set('tripPart:' + kid + ':' + today(), {n: 3, used: 25 * 60000, until: 0, t: 0}); renderTrip(); }""")
        await p.wait_for_timeout(300)
        ok('أنهيتُ اليوم' in await p.inner_text('#kidTrip'), 'after the third sitting she may stop for the day (the rest comes tomorrow) or go on after the break')
        await as_kid(p, 'سارة')
        await p.evaluate("""() => { store.set('tripPart:' + kid + ':' + today(), {n: 1, used: 31 * 60000, until: 0, t: 0});
            TRIP = {v: TRIP_V, cards: [{g: 'rl', id: 'x', q: 'q', a: 'a', alts: ['b']}, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); }""")
        await p.wait_for_timeout(300)
        t = await p.inner_text('#kidTrip')
        ok('تستريحين قليلًا أم تكملين' in t, 'above twelve the break is a choice: ' + t[:60])
        await p.evaluate("() => { TRIP = null; go('kid'); }")

        # ---- a right answer on the day of a lapse does not step
        r = await p.evaluate("""() => { const g = 'rl', id = POOL.rl()[0]; const m = mget(g, id); m.streak = 3; m.lc = dayN() - 5; store.set(MK(g, id), m);
            award(g, id, false); const s1 = award(g, id, true); const m2 = mget(g, id); return [s1, m2.streak, m2.due - dayN()]; }""")
        ok(r == [False, 2, 1], 'wrong then right on the same day: no step, and it comes back tomorrow (%s)' % r)
        # ---- the measure asks only words once answered right, two weeks ago or more
        r = await p.evaluate("""() => { const ids = POOL.rl().slice(0, 12); ids.forEach((id, i) => { const m = mget('rl', id); m.f = dayN() - 20; m.ok = i < 4 ? 0 : 1; m.n = 1; store.set(MK('rl', id), m); const s = seen('rl'); if (!s.includes(id)){ s.push(id); store.set('seen:' + kid + ':rl', s); } });
            const P = msPool(); return [P.every(x => mget(x.g, x.id).ok > 0), P.every(x => MS_G.includes(x.g))]; }""")
        ok(r == [True, True], 'the monthly measure draws only words the child once knew (%s)' % r)

        # ---- the weekly reader: an approved oasis recording is a candidate, and every oasis shows the reader
        await as_kid(p, 'مريم')
        await p.evaluate("""async () => { await dbPut('rec', {id: 'w1', kid: '@' + KZ_IDS[kid], kidName: 'مريم', kind: 'مثل', ref: 'الحكم والأمثال', text: 'العلم نور', date: today(), type: 'audio/webm', blob: new Blob([new Uint8Array(2400)], {type: 'audio/webm'}), status: 'approved', approvedBy: 'وليّ الأمر', notes: [], source: 'local'}); }""")
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn'); await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]')
        await p.wait_for_selector('.ph-top'); await p.click('[data-act="pWeekly"]'); await p.wait_for_selector('.who-turn')
        await p.wait_for_selector('[data-act="setWeeklyFrom"]', timeout=5000)
        ok('العلم نور' in await p.inner_text('#wkFrom'), 'مريم\'s approved oasis recording is a candidate for «قارئ الأسبوع»')
        await p.click('[data-act="setWeeklyFrom"]'); await p.wait_for_timeout(600)
        f = await p.evaluate(FAM)
        ok(any(w['kid'] == f['kids'][0]['id'] for w in f['weekly'].values()), '…and choosing it makes her the week\'s reader')
        await as_kid(p, 'يوسف'); await p.wait_for_timeout(300)
        ok('قارئة هذا الأسبوع: مريم' in await p.inner_text('#kidHome'), 'her brother\'s oasis shows the week\'s reader')

        # ---- the home languages under a new word, once the parents turn them on for the child
        await as_kid(p, 'مريم')
        r = await p.evaluate("""() => { store.set('tripPart:' + kid + ':' + today(), {n: 1, used: 0, until: 0, t: 0}); const k = Object.keys(ALL)[0], l = ALL[k].family[0].lemma; const c = learnCard('drv', k + '|' + l);
            const show = () => { TRIP = {v: TRIP_V, cards: [c, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], done: false, key: null}; go('trip', 'kidTrip'); return document.querySelector('#kidTrip .hgloss'); };
            const off = !!show(); store.set('gloss:' + kid, true); const g = show(); const out = [off, g ? g.textContent : '', (DATA.glosses[k + '|' + l] || {}).zh]; TRIP = null; go('kid'); return out; }""")
        ok(r[0] is False and r[2] and r[2] in r[1], 'the meaning in Chinese (with pinyin) and English shows under a new word only once turned on: ' + r[1])

        # ---- the Hasaniya: no five-minute race, no daily streak, the girls' labels, one name for the PIN
        await p.goto('about:blank'); await p.goto(HS + '?kid=' + f['kids'][0]['id']); await p.wait_for_timeout(1800)
        r = await p.evaluate("""() => { guidePanel('x', [{label: '⏱ تحدي 5 دقائق', run(){}}, {label: '▶ تابع الرحلة', run(){}}]);
            const t = document.body.innerText; return [t.includes('تحدي'), ACHIEVEMENTS.find(a => a.id === 'streak7').desc]; }""")
        ok(r[0] is False, 'the Hasaniya offers no five-minute challenge')
        ok(r[1] == 'أربعة أيام في أسبوع', '«نجم الأسبوع» is four days in a week (%s)' % r[1])
        await p.evaluate("state.streak = 5; updatePointsDisplay()")
        ok(await p.evaluate("getComputedStyle(document.getElementById('streakBadge')).display") == 'none', 'no 🔥 streak that a missed day breaks')
        await p.evaluate("""() => { const b = document.createElement('button'); b.id = 'tL'; b.textContent = '🔊 استمع'; document.body.appendChild(b); const c = document.createElement('span'); c.id = 'tT'; c.textContent = 'تذكّر'; document.body.appendChild(c); }""")
        await p.wait_for_timeout(300)
        ok(await p.inner_text('#tL') == '🔊 استمعي' and await p.inner_text('#tT') == 'تذكّري', 'a girl reads «🔊 استمعي» and «تذكّري» in the Hasaniya')
        await p.evaluate("showPinModal('🔐 الرقم السري', 'x')"); await p.wait_for_timeout(300)
        ok('رمز وليّ الأمر' in await p.inner_text('#pinTitle'), 'its PIN is called «رمز وليّ الأمر» as elsewhere: ' + await p.inner_text('#pinTitle'))
        r = await p.evaluate("ttsText('أحسنتِ يا مريم، بارك الله فيكِ')")
        ok(r.endswith('فيكِ'), 'the Hasaniya\'s speech keeps the kasra of «فيكِ» too: ' + r)

        # ---- a dot beside a number is not read as a zero
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(300)
        await p.evaluate("""() => { const d = document.createElement('p'); d.id = 'tDot'; d.textContent = 'الكلّ · 1'; document.body.appendChild(d); }"""); await p.wait_for_timeout(200)
        ok(await p.inner_text('#tDot') == 'الكلّ | ١', 'the oasis writes «الكلّ | ١», not «الكلّ · ١»: ' + await p.inner_text('#tDot'))
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
