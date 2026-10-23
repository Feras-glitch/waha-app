# -*- coding: utf-8 -*-
"""Enrichment features: home voice, letters lab, family session, presentation, diagnostic, monthly report."""
import asyncio, os, sys, json, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots3'
os.makedirs(SHOTS, exist_ok=True); DL = os.path.join(SHOTS, 'dl'); os.makedirs(DL, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8770), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:8770/kunuz/index.html#kunuz'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def text(p): return await p.evaluate("document.getElementById('view').innerText")
async def shot(p, n, full=True): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
async def no_markers(p, where):
    t = await p.evaluate("document.body.innerText")
    ok('⟨' not in t and '⟩' not in t, 'no raw markers: ' + where)
async def enter_parent(p):
    await p.click('#footParent'); await p.wait_for_selector('#pinIn, .ph-top')
    if await p.locator('#pinIn').count():
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
async def record(p, start, stop, ms=1600):
    await p.click(start); await p.wait_for_timeout(ms); await p.click(stop)

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True, permissions=['microphone'])
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        await p.goto(URL); await p.wait_for_selector('h1')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]'); await p.check('#rcSaved'); await p.click('#recDone')
        await p.wait_for_selector('#kidForm'); await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('.hello')

        # ---- home voice: parent records the explanation of «الغيث والمطر» (gendered text → girls' version)
        await enter_parent(p)
        await p.click('[data-act="pVoice"]'); await p.wait_for_selector('#narBy')
        await p.fill('#narBy', 'ماما')
        await shot(p, 'v01-voice-list')
        await p.locator('[data-act="pVoiceOne"][data-id="ghayth"]').click()
        await p.wait_for_selector('#narBox')
        t = await text(p)
        ok('بصيغة المؤنّث' in t or 'للبنات' in t or 'الغيث' in t, 'narration page shows the text to read')
        await record(p, '[data-act="narRec"]', '[data-act="narStopRec"]', 2000)
        await p.wait_for_selector('#narBox audio', timeout=8000)
        ok('ماما' in (await p.inner_text('#narBox')), 'narration saved with reader name')
        await shot(p, 'v02-voice-one')
        await p.click('[data-act="pVoice"]'); await p.click('[data-act="parent"]'); await p.click('[data-act="backKid"]')
        await p.wait_for_selector('.hello')
        await p.click('[data-open="ghayth"]'); await p.click('[data-step="1"]')
        t = await text(p)
        ok('اسمعي الشرح بصوت ماما' in t, 'lesson offers the family voice (f)')
        await p.click('[data-act="narPlay"]'); await p.wait_for_timeout(600)
        ok(await p.locator('.speak.on').count() == 1, 'family narration plays')
        await p.click('#homeBtn')

        # ---- letters lab
        await p.click('[data-act="studio"]'); await p.click('[data-act="lab"]')
        await p.wait_for_selector('.pairs')
        ok(await p.locator('.pairc').count() == 9, 'nine letter pairs')
        await no_markers(p, 'lab')
        await shot(p, 'v03-lab')
        await p.click('[data-act="labPair"][data-id="p-ths"]')
        t = await text(p)
        ok('ثَمَر' in t and 'سَمَر' in t and 'أخرجي' in t, 'pair page with words and feminine articulation note')
        await shot(p, 'v04-pair')
        for k in range(2):
            await p.click('[data-act="labRec"][data-id="p-ths"]'); await p.wait_for_selector('#recBox')
            await record(p, '[data-act="recStart"]', '[data-act="recStop"]')
            await p.wait_for_selector('.rec-done audio'); await p.click('[data-act="submitWork"]'); await p.wait_for_selector('.wlist')
            await p.click('#homeBtn'); await p.click('[data-act="studio"]'); await p.click('[data-act="lab"]'); await p.click('[data-act="labPair"][data-id="p-ths"]')
        await enter_parent(p)
        for k in range(2):
            await p.locator('.wrow', has_text='مختبر الحروف').first.click()
            await p.click('[data-act="rub"][data-k="m"][data-v="%d"]' % (1 + k)); await p.click('[data-act="approve"]'); await p.wait_for_selector('.pub')
            await p.click('[data-act="parent"]')
        # family session
        await p.click('[data-act="pFamily"]'); await p.wait_for_selector('.fcard')
        t = await text(p)
        ok('سؤال المائدة' in t and 'لعبة' in t, 'family card rendered')
        await no_markers(p, 'family card')
        await shot(p, 'v05-family')
        await p.click('[data-act="fsDone"]'); await p.wait_for_selector('.state.st-ok')
        await p.click('[data-act="parent"]'); await p.click('[data-act="backKid"]'); await p.wait_for_selector('.hello')
        t = await text(p)
        ok('سؤال المائدة هذا الأسبوع' in t, 'kids see the table question')
        await p.click('[data-act="works"]')
        t = await text(p)
        ok('قبل وبعد' in t and 'مختبر الحروف: ث / س' in t, 'before/after for the letter pair')

        # ---- presentation of the radio
        await p.click('#homeBtn'); await p.click('[data-act="radio"]'); await p.click('[data-act="presentRadio"]')
        await p.wait_for_selector('.present')
        ok('١ / ' in (await p.inner_text('#prN')), 'presentation opened')
        await p.click('[data-pr="next"]'); ok('٢ / ' in (await p.inner_text('#prN')), 'presentation advances')
        await shot(p, 'v06-present', full=False)
        await p.click('[data-pr="x"]'); ok(await p.locator('.present').count() == 0, 'presentation closes')

        # ---- diagnostic test (answered blindly) and the monthly report
        await p.click('#homeBtn')
        # earn 5 gems quickly through injected progress, then the banner appears
        await p.evaluate("""()=>{var f=JSON.parse(localStorage.getItem('kb-family-v1')),k='kb-kid-'+f.cur,d=JSON.parse(localStorage.getItem(k));
          ['sadd','rizq','shayb','duha','rih'].forEach(function(x){d.prog[x]={p:true,d:Date.now()};}); localStorage.setItem(k,JSON.stringify(d));}""")
        await p.reload(); await p.wait_for_selector('.hello')
        t = await text(p)
        ok('الاختبار الدوري' in t, 'diagnostic banner shows')
        await p.click('.banner[data-act="diag"]')
        fbk = 0
        for k in range(200):
            await p.wait_for_timeout(80)
            if await p.locator('.score-big').count(): break
            if await p.locator('#asItem .why, #asItem .fb-ok, #asItem .fb-no, #asItem [data-anext]').count(): fbk += 1
            if await p.locator('[data-anext]').count(): await p.click('[data-anext]'); continue
            if await p.locator('[data-a2]:not([disabled])').count(): await p.locator('[data-a2]:not([disabled])').first.click(); continue
            if await p.locator('[data-a]:not([disabled])').count(): await p.locator('[data-a]:not([disabled])').first.click(); continue
            if await p.locator('#typeAns:not([disabled])').count(): await p.fill('#typeAns', 'كتب'); await p.click('[data-check]'); continue
        t = await text(p)
        ok('نتيجة الاختبار الدوري' in t, 'diagnostic result page')
        ok(fbk == 0, 'the diagnostic shows no right or wrong while it runs (it measures, it does not teach)')
        await enter_parent(p)
        await p.click('[data-act="pKids"]'); await p.click('[data-act="pProg"]'); await p.click('[data-act="pReport"]')
        await p.wait_for_selector('.report')
        t = await text(p)
        ok('تقرير شهري' in t and 'الاختبار الدوري' in t and 'مقترحاتٌ للشهر القادم' in t, 'monthly report rendered')
        ok(await p.locator('.report .rchart').count() == 1, 'reading chart drawn')
        ok(await p.locator('.report .rc-tab').count() >= 1, 'diagnostic table present')
        await no_markers(p, 'report')
        await shot(p, 'v07-report')
        await p.click('[data-act="exReport"]'); await p.check('#cOk'); await p.fill('#fpIn', '1234')
        async with p.expect_download() as dli:
            await p.click('.modal [data-m="1"]')
        dl = await dli.value; rp = os.path.join(DL, 'report.html'); await dl.save_as(rp)
        rh = open(rp, encoding='utf-8').read()
        ok('rchart' in rh and '⟨' not in rh and 'هند' in rh, 'exported report ok')
        rpg = await ctx.new_page(); await rpg.goto('file://' + rp); await rpg.wait_for_timeout(400); await shot(rpg, 'v08-report-export'); await rpg.close()
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
