# -*- coding: utf-8 -*-
"""Seventh chamber «أسماءٌ وأوزان» and the Ramadan series (boy profile, masculine address)."""
import asyncio, os, sys, functools, http.server, threading, datetime
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots4'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8772), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:8772/kunuz/index.html#kunuz'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def text(p): return await p.evaluate("document.getElementById('view').innerText")
async def shot(p, n, full=True): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
async def no_markers(p, where):
    t = await p.evaluate("document.body.innerText")
    ok('⟨' not in t and '⟩' not in t, 'no raw markers: ' + where)
async def answer_until_right(p, opt_sel, done_sel):
    for _ in range(6):
        if await p.locator(done_sel).count(): return True
        b = p.locator(opt_sel + ':not([disabled])')
        if not await b.count(): return False
        await b.first.click(); await p.wait_for_timeout(80)
    return await p.locator(done_sel).count() > 0
INJECT_RM = """(n)=>{var f=JSON.parse(localStorage.getItem('kb-family-v1')),k='kb-kid-'+f.cur,d=JSON.parse(localStorage.getItem(k));d.rm=d.rm||{};
  for(var i=1;i<=n;i++){d.rm['rm'+i]={d:Date.now()-i*1000,p:true};} localStorage.setItem(k,JSON.stringify(d));}"""

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        # 13 Ramadan 1448 ≈ 20 Feb 2027 (Umm al-Qura)
        await p.clock.set_fixed_time(datetime.datetime(2027, 2, 20, 10, 0, 0))
        await p.goto(URL); await p.wait_for_selector('h1')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]'); await p.check('#rcSaved'); await p.click('#recDone')
        await p.wait_for_selector('#kidForm'); await p.fill('#kfName', 'يوسف'); await p.click('[data-act="kfG"][data-v="m"]'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('.hello')
        t = await text(p)
        ok('الخزائن السبع' in t, 'home names seven chambers')
        ok(await p.locator('.chambers .chamber').count() == 7, 'seven chamber cards')
        ok('لمسة اليوم: الجزء' in t, 'Ramadan banner: touch of the day')
        ok('لمسات رمضان' in t, 'Ramadan door on home')
        await no_markers(p, 'home (boy, Ramadan)')
        await shot(p, 'r01-home')

        # ---- seventh chamber
        await p.click('.chamber[data-ax="asma"]'); await p.wait_for_selector('.lesson-card')
        n_l = await p.locator('.lesson-card').count()
        ok(n_l >= 4, 'chamber 7 has lessons (%d)' % n_l)
        await no_markers(p, 'chamber 7')
        await shot(p, 'r02-chamber7')
        await p.locator('.lesson-card').first.click(); await p.wait_for_selector('[data-step="1"]')
        await shot(p, 'r03-lesson-hook')
        await p.click('[data-step="1"]'); await p.wait_for_selector('.secret')
        await no_markers(p, 'chamber 7 secret')
        await shot(p, 'r04-lesson-secret')
        await p.click('[data-step="2"]')
        for _ in range(4):
            if await p.locator('.reward').count(): break
            if await answer_until_right(p, '.opt', '[data-next]'): await p.click('[data-next]')
        ok(await p.locator('.reward').count() == 1, 'chamber 7 lesson rewards a gem')
        t = await text(p)
        ok('من ٣٢ جوهرة' in t or 'من ٣١ جوهرة' in t or 'من ٣٣ جوهرة' in t, 'gem total follows the content')
        # chamber test
        await p.click('#homeBtn'); await p.click('.chamber[data-ax="asma"]')
        if await p.locator('[data-go="axis"], [data-act="testAxis"], [data-test]').count():
            pass
        # garden with the seventh bed (inject all lessons of the chamber)
        await p.evaluate("""()=>{var f=JSON.parse(localStorage.getItem('kb-family-v1')),k='kb-kid-'+f.cur,d=JSON.parse(localStorage.getItem(k));
          document.querySelectorAll('.lesson-card').forEach(function(){}); localStorage.setItem(k,JSON.stringify(d));}""")
        ids = await p.eval_on_selector_all('.lesson-card', "els=>els.map(e=>e.dataset.open)")
        await p.evaluate("""(ids)=>{var f=JSON.parse(localStorage.getItem('kb-family-v1')),k='kb-kid-'+f.cur,d=JSON.parse(localStorage.getItem(k));
          ids.forEach(function(x){d.prog[x]={p:true,d:Date.now()};}); localStorage.setItem(k,JSON.stringify(d));}""", ids)
        await p.reload(); await p.wait_for_selector('.hello'); await p.click('[data-act="garden"]'); await p.wait_for_selector('.gsvg')
        ok(await p.locator('.gsvg [data-gi="t:asma"]').count() >= 1, 'seventh tree grows in the garden')
        await shot(p, 'r05-garden7')

        # ---- Ramadan series
        await p.click('#homeBtn'); await p.click('.rm-door')
        await p.wait_for_selector('.rm-grid')
        ok(await p.locator('.rm-c').count() == 30, 'thirty touches')
        ok(await p.locator('.rm-c.today').count() == 1, 'today highlighted during Ramadan')
        await no_markers(p, 'Ramadan list')
        await shot(p, 'r06-rm-list')
        await p.click('.rm-c[data-id="rm1"]'); await p.wait_for_selector('.rm-q')
        t = await text(p)
        ok('الجزء ١' in t, 'touch page shows its juz')
        await no_markers(p, 'touch page')
        await shot(p, 'r07-rm-one')
        ok(await answer_until_right(p, '.rm-q .opt', '.fb-ok'), 'touch question answered')
        t = await text(p)
        ok('صار عندك ١ من ٣٠ لمسة' in t, 'touch counted')
        await shot(p, 'r08-rm-answered')
        # nine more → first light string
        await p.evaluate(INJECT_RM, 10)
        await p.reload(); await p.wait_for_selector('.hello'); await p.click('[data-act="garden"]'); await p.wait_for_selector('.gsvg')
        ok(await p.locator('.gsvg [data-gi="r1"]').count() == 1, 'Ramadan light string after ten touches')
        await shot(p, 'r09-garden-lights')
        # all but the last → answer the last → certificate
        await p.evaluate(INJECT_RM, 29)
        await p.reload(); await p.wait_for_selector('.hello'); await p.click('.rm-door'); await p.click('.rm-c[data-id="rm30"]'); await p.wait_for_selector('.rm-q')
        await answer_until_right(p, '.rm-q .opt', '.fb-ok')
        t = await text(p)
        ok('أتممتَ اللمسات الثلاثين' in t, 'completion message (masculine)')
        ok('شهادة ختام لمسات رمضان' in t, 'Ramadan certificate earned')
        await shot(p, 'r10-rm-cert')
        await p.click('.banner[data-act="cert"]'); await p.wait_for_selector('.cert, .certpage, svg')
        await no_markers(p, 'Ramadan certificate')
        await shot(p, 'r11-cert')

        # ---- parent: voice groups include Ramadan; full test text
        await p.click('#footParent'); await p.wait_for_selector('#pinIn, .ph-top')
        if await p.locator('#pinIn').count():
            await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
        await p.click('[data-act="pVoice"]'); await p.wait_for_selector('#narBy')
        t = await text(p)
        ok('لمسات رمضان' in t and 'أسماءٌ وأوزان' in t, 'home voice lists Ramadan and chamber 7')
        await p.click('[data-act="parent"]'); await p.click('[data-act="backKid"]'); await p.wait_for_selector('.hello')
        t = await text(p)
        ok('واحدٌ وعشرون سؤالًا من الخزائن السبع' in t, 'full test text follows the chambers')
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
