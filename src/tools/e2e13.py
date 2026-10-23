# -*- coding: utf-8 -*-
"""Teaching (2.6): steadiness is counted in weeks of four days and a missed day costs nothing, in «كنوز البيان» and in the
oasis; «قارئ الأسبوع» goes round the children in turn; and the recitation: al-Husary (المصحف المعلّم) verse by verse to learn,
Abdulrahman al-Ossi the whole surah to listen to, the child switching between them, from a pack the app carries (no website).
The pack here is a stand-in written for the test (short silent files); the real one is built by src/tools/audio_pack.py."""
import asyncio, os, sys, json, shutil, subprocess, functools, http.server, threading
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_pack
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
AUDIO = os.path.join(DIST, 'audio')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots13'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8792), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8792/'
URL, KZ = BASE + 'index.html', BASE + 'kunuz/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
async def until(p, js, timeout=10000):
    for _ in range(int(timeout / 100)):
        if await p.evaluate(js): return True
        await asyncio.sleep(0.1)
    return False
FAMJS = "JSON.parse(localStorage.getItem('kb-family-v1'))"
SILENT = (bytes([0xFF, 0xFB, 0x90, 0xC4]) + bytes(413)) * 10       # a quarter of a second of silence, MPEG-1 layer III


def fake_pack():
    """the stand-in pack: every verse and surah the real one would hold, each a short silent file"""
    ayat, surahs, _, _ = audio_pack.needed()
    shutil.rmtree(AUDIO, ignore_errors=True)
    os.makedirs(os.path.join(AUDIO, 'h')); os.makedirs(os.path.join(AUDIO, 'o'))
    for s, a in ayat:
        open(os.path.join(AUDIO, 'h', '%03d%03d.mp3' % (s, a)), 'wb').write(SILENT)
    for s in surahs:
        open(os.path.join(AUDIO, 'o', '%03d.mp3' % s), 'wb').write(SILENT * 4)
    by = {}
    for s, a in ayat: by.setdefault(s, []).append(a)
    man = {'v': 1, 'kbps': 32, 'h': {str(s): audio_pack.ranges(v) for s, v in by.items()}, 'o': surahs}
    open(os.path.join(AUDIO, 'manifest.js'), 'w', encoding='utf-8').write('window.WAHA_AUDIO=%s;' % json.dumps(man))


def week_unit():
    """the week of «جوهرة اليوم», run in node on engine.js's own functions with a fixed today"""
    src = open(os.path.join(ROOT, 'parts', 'engine.js'), encoding='utf-8').read().split('\n')
    want = ('function pad(', 'function dstr(', 'function addDays(', 'var WEEK_GOAL', 'function weekOf(', 'function weekDaysN(', 'function markDaily(', 'function weekNow(')
    code, take = [], False
    for ln in src:
        if ln.startswith(want): take = True
        elif take and (ln.startswith('function ') or ln.startswith('var ') or ln.startswith('/*')): take = False
        if take: code.append(ln)
    js = '\n'.join(code) + r"""
var T='2026-10-22', ST={daily:{last:'',days:[],wk:0}}, saved=0; function today(){return T;} function saveST(){saved++;}
var out={};
out.weeks=[weekOf('2026-10-22'),weekOf('2026-10-17'),weekOf('2026-10-23'),weekOf('2026-10-24'),weekOf('2026-01-01')];
['2026-10-17','2026-10-19','2026-10-20'].forEach(function(d){T=d;markDaily();});
out.three=[weekNow(), ST.daily.wk];
T='2026-10-22'; markDaily(); markDaily(); out.four=[weekNow(), ST.daily.wk, ST.daily.days.length];
T='2026-10-23'; markDaily(); out.five=[weekNow(), ST.daily.wk];
T='2026-10-24'; markDaily(); out.next=[weekNow(), ST.daily.wk];
T='2026-11-30'; markDaily(); out.gap=[weekNow(), ST.daily.wk];
console.log(JSON.stringify(out));"""
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr); return None
    return json.loads(r.stdout)


async def parent_kz(p, hash_='#parent'):
    await p.goto('about:blank'); await p.goto(KZ + hash_); await p.wait_for_selector('#pinIn, .ph-top')
    if await p.locator('#pinIn').count():
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')


async def main():
    # ---- the week, in «كنوز البيان»'s own code
    u = week_unit()
    ok(u is not None, 'the week functions run')
    if u:
        ok(u['weeks'] == ['2026-10-17', '2026-10-17', '2026-10-17', '2026-10-24', '2025-12-27'], 'the week runs from Saturday to Friday (%s)' % u['weeks'])
        ok(u['three'] == [3, 0] and u['four'] == [4, 1, 4], 'the fourth day of a week completes it, once (%s %s)' % (u['three'], u['four']))
        ok(u['five'] == [5, 1], 'a fifth day adds nothing to count against (%s)' % u['five'])
        ok(u['next'] == [1, 1] and u['gap'] == [1, 1], 'a new week starts afresh and weeks missed take nothing away (%s %s)' % (u['next'], u['gap']))

    fake_pack()
    try:
        async with async_playwright() as pw:
            b = await pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
            p = await ctx.new_page()
            p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
            p.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))

            await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
            await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
            await p.check('#rcSaved'); await p.click('#recDone'); await p.wait_for_selector('#kidForm')
            await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.select_option('#kfBy', '2016')
            await p.check('#kfMore'); await p.click('#kidForm button[type=submit]'); await p.wait_for_selector('#kidForm'); await p.wait_for_timeout(200)
            await p.fill('#kfName', 'يوسف'); await p.click('[data-act="kfG"][data-v="m"]'); await p.select_option('#kfBy', '2020'); await p.click('#kidForm button[type=submit]')
            await p.wait_for_timeout(600)
            ids = await p.evaluate(FAMJS + ".kids.map(k => k.id)")

            # ---- «كنوز البيان»: the days of this week, the weeks completed; no chain to break
            await p.evaluate("""(id) => { const k = 'kb-kid-' + id, d = JSON.parse(localStorage.getItem(k) || '{}'); const t = new Date(), ds = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
                d.st = d.st || {items: {}, tests: []}; d.st.daily = {last: ds, days: [ds], wk: 2}; localStorage.setItem(k, JSON.stringify(d));
                const f = JSON.parse(localStorage.getItem('kb-family-v1')); f.cur = id; localStorage.setItem('kb-family-v1', JSON.stringify(f)); }""", ids[0])
            await p.goto('about:blank'); await p.goto(KZ + '#daily'); await p.wait_for_selector('.tiles')
            t = await p.inner_text('#app')
            ok('أيام هذا الأسبوع' in t and '١ من ٤' in t and 'أسابيع أتممتِها' in t, 'the daily gem shows this week\'s days and the weeks she completed')
            ok('سلسل' not in t and 'تقطع' not in t, 'no chain, nothing to break: «%s»' % t[:120].replace('\n', ' '))
            await shot(p, 'w01-daily-week')
            await p.click('[data-home]'); await p.wait_for_selector('.hello')
            ok('هذا الأسبوع: ١ من ٤ أيام' in await p.inner_text('.tools'), 'her home: «هذا الأسبوع: ١ من ٤ أيام»')
            await p.click('[data-act="garden"] >> nth=0'); await p.wait_for_selector('.gsvg')
            g = await p.inner_text('#app')
            ok('أسبوع' in g and 'سلسلة «جوهرة اليوم»' not in g, 'the garden speaks of weeks, not of a chain')
            ok(await p.locator('.garden [data-gi="b1"]').count() == 1 and await p.locator('.garden [data-gi="b2"]').count() == 0, 'two weeks: the first bird (the second comes at four)')
            await p.click('[data-act="certs"]'); await p.wait_for_timeout(300)
            ok(await p.locator('.ccard.on', has_text='المواظبة').count() == 1, 'two weeks of four days earn «شهادة المواظبة»')

            # ---- the oasis: this week's days; the Friday report
            await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
            await p.evaluate("""() => { kid = 0; store.set('kid', 0); const ymd2 = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const d = new Date(); store.set(`dailyDone:0:${ymd2(d)}`, true);
                for (let i = 0; i < 4; i++) store.set(`dailyDone:0:${ymd2(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 14 - ((d.getDay() + 1) % 7) + i))}`, true); onKid(); }""")
            await p.wait_for_timeout(400)
            ok(await p.evaluate("[weekPlayed(), weeksMet()]") == [1, 1], 'the oasis counts this week\'s days and the weeks completed')
            await p.evaluate("renderDaily()"); await p.wait_for_timeout(200)
            dl = await p.inner_text('#daily')
            ok('هذا الأسبوع: ١ من ٤' in dl and 'سلسلة' not in dl and 'متتالية' not in dl, 'her daily mission: «هذا الأسبوع: ١ من ٤» (%s)' % dl[:60].replace('\n', ' '))
            rep = await p.evaluate("weekText([kidWeek(0, [])])")
            ok('أسابيع مكتملة: 1' in rep and 'سلسلة' not in rep, 'the Friday report counts weeks, not a chain')

            # ---- «قارئ الأسبوع» goes round
            await parent_kz(p); await p.click('[data-act="pWeekly"]'); await p.wait_for_selector('.who-turn')
            ok('هند' in await p.inner_text('.who-turn') and 'بعده في الدور: يوسف' in await p.inner_text('.who-turn'), 'first turn: هند, then يوسف')
            ok('تكريمٌ يدور' in await p.inner_text('#app'), 'the parent is told it is an honour in turn, not a contest')
            await p.evaluate("""(id) => { const w = JSON.parse(localStorage.getItem('kb-works-v1') || '[]'); w.push({id: 'rw1', kid: id, type: 'read', status: 'approved', audio: 'none', title: 'قراءة', created: Date.now(), approvedAt: Date.now(), updated: Date.now(), notes: [], log: []});
                w.push({id: 'rw2', kid: id, type: 'read', status: 'approved', audio: 'none', title: 'قراءة قديمة', created: Date.now() - 40 * 864e5, approvedAt: Date.now() - 40 * 864e5, updated: Date.now(), notes: [], log: []});
                localStorage.setItem('kb-works-v1', JSON.stringify(w)); }""", ids[0])
            await parent_kz(p); await p.click('[data-act="pWeekly"]'); await p.wait_for_selector('.cands')
            ok(await p.locator('.cand').count() == 2, 'all her approved readings can be chosen, this week\'s first')
            await p.click('.cand >> nth=0 >> [data-act="setWeekly"]'); await p.wait_for_timeout(300)
            wk = await p.evaluate(FAMJS + ".weekly")
            ok(len(wk) == 1 and list(wk.values())[0]['kid'] == ids[0], 'هند is the reader of this week')
            # a week later
            await p.evaluate("""() => { const f = JSON.parse(localStorage.getItem('kb-family-v1')); const k = Object.keys(f.weekly)[0]; const p = k.split('-');
                const d = new Date(+p[0], +p[1] - 1, +p[2] - 7); const nk = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
                f.weekly[nk] = f.weekly[k]; f.weekly[nk].d = Date.now() - 7 * 864e5; delete f.weekly[k]; localStorage.setItem('kb-family-v1', JSON.stringify(f)); }""")
            await parent_kz(p); await p.click('[data-act="pWeekly"]'); await p.wait_for_selector('.who-turn')
            ok('يوسف' in await p.inner_text('.who-turn'), 'the next week it is يوسف\'s turn')
            t = await p.inner_text('#app')
            ok('يوسف ليس له قراءةٌ معتمدة' in t and await p.locator('[data-act="passWeekly"]').count() == 1, 'he has no reading yet: the parents may pass his turn to هند')
            await shot(p, 'w02-weekly-turn')
            await p.click('[data-act="passWeekly"]'); await p.wait_for_timeout(300)
            ok('هند' in await p.inner_text('.who-turn'), 'passed: هند this week, and يوسف keeps the first place for the next')
            await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
            ok(await p.locator('.banner', has_text='دورك في «قارئ الأسبوع»').count() == 1, 'هند\'s home: «هذا الأسبوع دورك في قارئ الأسبوع»')

            # ---- honest learning in the oasis
            await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
            await p.evaluate("kid = 0; store.set('kid', 0); store.set('cmp:0', {kind:'camel', name:'ناجي'}); store.set('planted:0', Date.now()); onKid()"); await p.wait_for_timeout(300)
            m = await p.evaluate("""(() => { const id = POOL.hk()[0]; const r = []; award('hk', id, true); r.push(mget('hk', id).streak); award('hk', id, true); r.push(mget('hk', id).streak);
                const m = mget('hk', id); m.lc = dayN() - 1; store.set(MK('hk', id), m); award('hk', id, true); r.push(mget('hk', id).streak, mget('hk', id).due - dayN());
                award('hk', id, false); const w = mget('hk', id); r.push(w.streak, w.due - dayN()); return r; })()""")
            ok(m == [1, 1, 2, 3, 1, 1], 'one step a day; right on two days = mastered (due in 3 days); a mistake drops one step and comes back tomorrow (%s)' % m)
            ok(await p.evaluate("(() => { const id = POOL.hk()[1]; awardAfter('hk', id, true); return mget('hk', id).due - dayN(); })()") == 1, 'right after its lesson: not a step, but asked again tomorrow')
            r = await p.evaluate("""(() => { TRIP = {cards: [{g: 'hk', id: POOL.hk()[2], ...GEN.hk(POOL.hk()[2])}, {g: 'tell', id: 'tell', q: 'x'}], i: 0, res: [], key: 'trip:0:x'}; go('trip', 'kidTrip');
                const c = TRIP.cards[0]; const b = [...document.querySelectorAll('#kidTrip .opt')].find(x => x.__o !== c.a); b.click(); return TRIP.cards.map(x => x.g + (x.retry ? ':retry' : '')); })()""")
            ok(r == ['hk', 'hk:retry', 'tell'], 'a wrong answer is asked again before the trip ends (%s)' % r)
            d0 = await p.evaluate("dates()")
            await p.evaluate("""(() => { TRIP = {cards: [{g: 'hk', id: POOL.hk()[3], ...GEN.hk(POOL.hk()[3])}], i: 0, res: [], key: null}; go('trip', 'kidTrip'); const c = TRIP.cards[0]; [...document.querySelectorAll('#kidTrip .opt')].find(x => x.__o === c.a).click(); })()""")
            ok(await p.evaluate("dates()") == d0, 'an extra trip earns no dates')
            ex = await p.evaluate("(() => { store.set(MK('hk', POOL.hk()[4]), {n: 2, ok: 2, streak: 2, wrong: 0, due: dayN() - 1, lc: dayN() - 4, f: dayN() - 9}); const s = seen('hk'); s.push(POOL.hk()[4]); store.set('seen:0:hk', s); return buildTrip(true).map(c => c.kind || c.g); })()")
            ok(ex and all(k in ('review', 'learn') for k in ex), 'an extra trip is review only (%s)' % ex)
            pal = await p.evaluate("(() => { const a = learnedN(); ['hys', 'wh'].forEach(g => POOL[g]().slice(0, 10).forEach(id => { store.set(MK(g, id), {n: 3, ok: 3, streak: 3, wrong: 0, lc: dayN() - 5}); const s = seen(g); s.push(id); store.set(`seen:0:${g}`, s); })); return [a, learnedN()]; })()")
            ok(pal[1] >= pal[0] + 40, 'the palm grows with what is known (%s)' % pal)
            mem = await p.evaluate("(() => { const all = POOL.fill().length; store.set('memo:0', ['j30']); const j30 = POOL.fill().length; const ok = POOL.fill().every(id => { const sa = id.split('|')[1].split(':').map(Number); return sa[0] >= 78; }); store.set('memo:0', null); return [all, j30, ok]; })()")
            ok(mem[1] < mem[0] and mem[2], 'ticking «جزء عمّ» alone keeps the verses of the trip inside it (%s)' % mem[:2])
            gap = await p.evaluate("(() => { store.keys().filter(k => k.startsWith('dailyDone:0:')).forEach(k => store.del(k)); const d = new Date(); d.setDate(d.getDate() - 5); store.set(`dailyDone:0:${ymd(d)}`, true); return companionMemory(true).join(' '); })()")
            ok('غبت' not in gap and 'أهلًا بعودتكِ' in gap, 'after days away: a welcome back, no count of days missed (%s)' % gap[:40])
            await p.evaluate("store.set(`trip:0:${today()}`, {v: TRIP_V, cards: [], i: 0, res: [], done: true}); store.keys().filter(k => k.startsWith('m:0:')).forEach(k => { const m = store.get(k); m.due = null; store.set(k, m); }); go('kid')"); await p.wait_for_timeout(600)
            ok(await p.locator('#kidHome .bigplay').count() == 0 and 'نلتقي غدًا' in await p.inner_text('#kidHome'), 'the day is closed: nothing due, no «رحلة إضافية»')
            wt = await p.evaluate("weekOne(kidWeek(0, []), weekDays())")
            ok('ما أحسنت فيه' in wt and 'يتعثّر' not in wt and 'تتعثّر' not in wt and 'يوسف' not in wt, 'the Friday text is hers alone, strengths first, nothing of what she stumbles on')

            # ---- the recitation in the oasis
            await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
            ok(await p.evaluate("!!window.WAHA_AUDIO && OASES.find(o => o.id === 'rec').tabs.some(t => t[0] === 'tilawa')"), 'with the pack, «رفّ التسجيلات» has «التلاوة»')
            await p.evaluate("store.set('cmp:'+kid,{kind:'camel',name:'ناجي'}); store.set('planted:'+kid, Date.now()); go('kid')"); await until(p, "document.querySelectorAll('.ktile').length > 3", 4000)
            ok(await p.locator('.ktile', has_text='التلاوة').count() == 1, 'her home has a «التلاوة» tile (%s)' % await p.evaluate("[...document.querySelectorAll('.ktile')].map(x => x.textContent).join(' | ')"))
            await p.evaluate("store.set(`tlS:${kid}`, 1); go('rec', 'tilawa')"); await p.wait_for_selector('#tlTab .tl-seg')
            ok(await p.get_attribute('#tlTab .tl-seg [data-m="learn"]', 'aria-pressed') == 'true', 'learning (al-Husary, verse by verse) is the first choice')
            ok(await p.locator('#tlTab .tl-ay').count() == 7, 'al-Fatiha: its seven verses, each one to tap')
            await p.select_option('#tlSel', '112'); await p.wait_for_selector('#tlTab .tl-b')
            ok(await p.locator('#tlTab .tl-ay').count() == 5 and await p.evaluate("TL.box.__q[0].basm === true"), 'al-Ikhlas from the list: the basmala, then its four verses')
            await p.click('#tlSurahs [data-d="1"]'); await p.wait_for_timeout(200)
            ok(await p.evaluate("store.get(`tlS:${kid}`)") == 113, '← moves to the next surah')
            await p.select_option('#tlSel', '1'); await p.wait_for_selector('#tlTab .tl-ay')
            await p.click('#tlTab [data-rep="3"]'); ok(await p.evaluate("store.get('tlRep', 1)") == 3, 'each verse ×3 is remembered')
            await p.click('#tlTab [data-rep="1"]')
            await p.click('#tlTab .tl-go')
            lit = await until(p, "!!document.querySelector('#tlTab .tl-ay.tl-on')", 4000)
            ok(lit and 'أوقفي' in await p.inner_text('#tlTab .tl-go'), 'playing: the verse being recited is lit, and the button stops it')
            src = await p.evaluate("TL.a && TL.a.src")
            ok(bool(src) and src.endswith('/audio/h/001001.mp3'), 'the first verse comes from the pack in the app (%s)' % src)
            done = await until(p, "document.querySelector('#tlTab .tl-st').textContent.includes('انتهت')", 15000)
            ok(done, 'the surah plays to its end, verse after verse')
            await p.locator('#tlTab .tl-ay').nth(3).click(); await p.wait_for_timeout(300)
            ok(await p.evaluate("TL.i") == 3 and await p.evaluate("TL.a && TL.a.src.endsWith('001004.mp3')"), 'a tap on a verse starts from it')
            await shot(p, 'r01-learn')
            await p.click('#tlTab .tl-seg [data-m="listen"]'); await p.wait_for_selector('#tlTab .tl-o')
            ok(await p.evaluate("TL.a === null") and await p.evaluate("store.get(`tlMode:${kid}`)") == 'listen', 'switching to listening stops the verse and is remembered')
            ok((await p.get_attribute('#tlTab .tl-o', 'src')).endswith('audio/o/001.mp3') and 'العوسي' in await p.inner_text('#tlTab'), 'listening: the whole surah, by al-Ossi')
            await p.evaluate("document.querySelector('#tlTab .tl-o').play()"); await p.wait_for_timeout(300)
            ok(await p.evaluate("!document.querySelector('#tlTab .tl-o').paused"), 'the surah plays')
            await p.evaluate("say('اختبار')"); await p.wait_for_timeout(200)
            ok(await p.evaluate("document.querySelector('#tlTab .tl-o').paused"), 'another voice stops it')
            await shot(p, 'r02-listen')
            await p.click('#tlTab .tl-seg [data-m="learn"]')
            # a page of «مصحفي» is heard before it is recorded
            await p.evaluate("go('rec', 'mushaf')"); await p.wait_for_selector('#muPages button')
            hb = p.locator('#muPages button', has_text='استمعي')
            ok(await hb.count() > 3, 'every page of «مصحفي» has «🔊 استمعي»')
            await hb.first.click(); await p.wait_for_selector('#sheet:not([hidden]) .tl .tl-ay')
            await p.click('#sheet .tl-go'); await until(p, "!!(TL.a && TL.a.src)", 3000)
            await p.click('#sheet .x'); await p.wait_for_timeout(200)
            ok(await p.evaluate("TL.a === null"), 'closing the page stops its recitation')

            lc = await p.evaluate("(() => { const id = POOL.kz()[0] || KZD.lessons[0].id + '|0'; const L = LEARN.kz(id); return [L.quiet.includes(L.big), !!L.qv]; })()")
            ok(lc == [True, True], 'a chamber verse in the trip is never read by the device voice (%s)' % lc)
            await p.evaluate("(() => { const id = KZD.lessons[0].id + '|0'; const L = learnCard('kz', id); TRIP = {cards: [L], i: 0, res: [], key: null}; go('trip', 'kidTrip'); })()"); await p.wait_for_timeout(300)
            rb = p.locator('#kidTrip .tiny', has_text='الحصري')
            ok(await rb.count() == 1, 'its card offers «استمعي إلى الآية بصوت الحصري»')
            if await rb.count():
                await rb.click(); await p.wait_for_timeout(200)
                ok(await p.evaluate("!!(TL.a && /audio\\/h\\/\\d{6}\\.mp3$/.test(TL.a.src))"), 'and plays it from the pack')
            await p.evaluate("voiceStop(); TRIP = null")

            # ---- «كنوز البيان»: a verse is heard in the app
            await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
            await p.click('.chamber[data-ax="furuq"]'); await p.wait_for_selector('.lesson-card'); await p.locator('.lesson-card').first.click()
            await p.wait_for_selector('.verse')
            vb = p.locator('.vplay').first
            ok(await vb.count() == 1 and await p.locator('.verse a[href*="quran.com"]').count() == 0, 'the lesson\'s verse: «▶ استمعي للتلاوة» in the app, no link out')
            await vb.click(); await p.wait_for_timeout(150)
            ok('أوقفي' in await vb.inner_text(), 'it plays, and the same button stops it')
            back = await until(p, "!document.querySelector('.vplay.on')", 8000)
            ok(back, 'when the verse ends the button is ready again')
            await shot(p, 'r03-kunuz-verse')

            # ---- without the pack nothing of it shows (a copy of the app that never had one: its own browser profile)
            shutil.rmtree(AUDIO, ignore_errors=True)
            st = await ctx.storage_state(); await ctx.close()
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, storage_state=st)
            p = await ctx.new_page(); p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
            await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
            ok(await p.evaluate("!window.WAHA_AUDIO && !OASES.find(o => o.id === 'rec').tabs.some(t => t[0] === 'tilawa')"), 'without the pack: no «التلاوة» tab')
            await p.evaluate("go('rec', 'mushaf')"); await p.wait_for_selector('#muPages button')
            ok(await p.locator('#muPages button', has_text='استمعي').count() == 0, '…and no listening button on the pages')
            await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
            await p.click('.chamber[data-ax="furuq"]'); await p.wait_for_selector('.lesson-card'); await p.locator('.lesson-card').first.click()
            await p.wait_for_selector('.verse')
            ok(await p.locator('.vplay').count() == 0 and await p.locator('.verse a[href*="quran.com"]').count() >= 1, 'a browser copy without the pack keeps the quran.com link')
            await b.close()
    finally:
        shutil.rmtree(AUDIO, ignore_errors=True)
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
