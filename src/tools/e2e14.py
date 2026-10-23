# -*- coding: utf-8 -*-
"""Using it, second part (2.7): the back of a browser or of the web app installed on Android steps back inside each section
instead of leaving it; the Hasaniya shows one window at a time (an achievement waits for the quiz in front of it); the three
sections share the product's fonts; one name for the parents' code, and the parents addressed in the plural."""
import asyncio, os, sys, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots14'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8793), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8793/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
async def until(p, js, timeout=8000):
    for _ in range(int(timeout / 100)):
        try:
            if await p.evaluate(js): return True
        except Exception: pass
        await asyncio.sleep(0.1)
    return False

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        p.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        ok(await p.inner_text('#homeBtn .b-name') == 'واحة اللسان العربي', 'the first screen is headed «واحة اللسان العربي», the whole app, not one section')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone'); await p.wait_for_selector('#kidForm')
        await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.select_option('#kfBy', '2016'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_timeout(600)

        # ---- the oasis: back steps toward the child's home, inside the page
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
        await p.evaluate("store.set('cmp:'+kid,{kind:'camel',name:'ناجي'}); store.set('planted:'+kid, Date.now()); go('kid')"); await p.wait_for_timeout(300)
        await p.evaluate("go('rec', 'recShelf')"); await p.wait_for_timeout(300)
        await p.go_back(); await p.wait_for_timeout(400)
        ok(p.url.endswith('index.html') and await p.evaluate("cur.o") == 'kid', 'the oasis: back from «صوتي» returns to her home, in the app (%s)' % await p.evaluate("cur.o"))
        await p.evaluate("go('bag', 'kidBag')"); await p.wait_for_timeout(300)
        await p.go_back(); await p.wait_for_timeout(400)
        ok(await p.evaluate("cur.o") == 'kid', 'and again: every back is caught, not only the first')
        ok('رمز وليّ الأمر' in await p.evaluate("(() => { pinGate(() => {}); const t = $('sheet').textContent; closeSheet(); return t; })()"), 'the oasis calls the code «رمز وليّ الأمر», as the other sections do')

        # ---- «كنوز البيان»: back from an editor returns to the studio, not out of the section
        await p.goto('about:blank'); await p.goto(KZ + '#studio'); await p.wait_for_selector('[data-act="newWork"]')
        await p.click('[data-act="newWork"][data-v="kalima"]'); await p.wait_for_selector('[data-act="delWork"]')
        await p.go_back(); await p.wait_for_timeout(500)
        h1 = await p.inner_text('#view h1') if await p.locator('#view h1').count() else ''
        ok('kunuz/index.html' in p.url and await p.locator('[data-act="delWork"]').count() == 0 and h1, '«كنوز البيان»: back from the editor goes where its own «رجوع» goes, inside the section («%s»)' % h1)

        ok(await p.inner_text('#homeBtn .b-name') == 'كنوز البيان', 'once the family is set up, the section is «كنوز البيان» again')
        # ---- the garden keeps what was earned
        kid0 = await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).kids[0].id")
        await p.evaluate("""(id) => { const w = JSON.parse(localStorage.getItem('kb-works-v1') || '[]'); w.push({id: 'gw1', kid: id, type: 'kalima', status: 'approved', text: 'كلمة', title: 'كلمة', created: Date.now(), approvedAt: Date.now(), updated: Date.now(), notes: [], log: []}); localStorage.setItem('kb-works-v1', JSON.stringify(w)); }""", kid0)
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello'); await p.click('[data-act="garden"] >> nth=0'); await p.wait_for_selector('.gsvg')
        b1 = await p.locator('.garden [data-gi="u1"]').count()
        await p.evaluate("(() => { const w = JSON.parse(localStorage.getItem('kb-works-v1')); w.find(x => x.id === 'gw1').status = 'returned'; localStorage.setItem('kb-works-v1', JSON.stringify(w)); })()")
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello'); await p.click('[data-act="garden"] >> nth=0'); await p.wait_for_selector('.gsvg')
        ok(b1 == 1 and await p.locator('.garden [data-gi="u1"]').count() == 1, 'a butterfly stays when its work is returned later: the garden takes nothing back')

        # ---- the Hasaniya: one window at a time, the product's fonts, and back to the oasis
        await p.goto('about:blank'); await p.goto(HS); await p.wait_for_timeout(1800)
        hn = await p.evaluate("(() => { const ws = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n, bad = []; while ((n = ws.nextNode())){ const e = n.parentElement; if (e && !e.closest('textarea,input,script,style,pre,code,[lang]:not([lang^=ar])') && /[0-9]/.test(n.data) && e.offsetParent) bad.push(n.data.trim().slice(0, 30)); } return bad; })()")
        ok(not hn, 'and in the Hasaniya (%s)' % hn[:3])
        f = await p.evaluate("getComputedStyle(document.body).fontFamily")
        ok('Tajawal' in f, 'the Hasaniya uses the product\'s fonts (%s)' % f[:40])
        r = await p.evaluate("""(async () => { document.getElementById('quizPopup').classList.add('active'); showNewAchievement({icon: '⭐', name: 'تجربة', desc: 'تجربة'});
            await new Promise(r => setTimeout(r, 600)); const before = document.getElementById('newAchievementPopup').classList.contains('active');
            document.getElementById('quizPopup').classList.remove('active'); await new Promise(r => setTimeout(r, 900));
            const after = document.getElementById('newAchievementPopup').classList.contains('active'); document.getElementById('newAchievementPopup').classList.remove('active'); return [before, after]; })()""")
        ok(r == [False, True], 'an achievement waits until the quiz in front of it is closed (%s)' % r)
        em = await p.evaluate("(() => { try { showParentScreen(); } catch (e) { return 'err ' + e.message; } const t = (document.getElementById('parentMistakesList') || {}).textContent || ''; try { appBack(); } catch (e) {} return t; })()")
        ok('متقن' not in em and 'لم تبدأ الحفظ بعد' in em, 'the parent is not told «متقن للحفظ» before anything was learned (%s)' % em.strip()[:40])
        await p.goto('about:blank'); await p.goto(HS); await p.wait_for_timeout(1500)
        await p.go_back(); await p.wait_for_timeout(1200)
        ok(p.url.endswith('/index.html') and '/hasaniya/' not in p.url, 'the Hasaniya: back on its map goes to the oasis (%s)' % p.url[-30:])

        # ---- the parents are addressed in the plural on the oasis board
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
        await p.click('#whoBtn'); await p.click('#ksDad'); await p.wait_for_selector('#sheet:not([hidden]) #pinIn'); await p.fill('#pinIn', '1234'); await p.click('#pinOk')
        await p.wait_for_selector('#ddTabs'); await p.wait_for_timeout(600)
        t = await p.inner_text('#ddBody')
        ok('اسمعوا ما قالوه اليوم، وأرسلوا' in t, 'the board speaks to «you» in the plural: a mother or a father')
        await shot(p, 'b01-board')
        nums = await p.evaluate("(() => { const ws = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n, bad = []; while ((n = ws.nextNode())){ const e = n.parentElement; if (e && !e.closest('textarea,input,script,style,pre,code,[lang]:not([lang^=ar])') && /[0-9]/.test(n.data) && e.offsetParent) bad.push(n.data.trim().slice(0, 30)); } return bad; })()")
        ok(not nums, 'numbers on the oasis screens are written ١٢٣ (%s)' % nums[:3])
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
