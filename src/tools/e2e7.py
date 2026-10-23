# -*- coding: utf-8 -*-
"""Forgotten PIN: the recovery code shown once at setup; reset only with it; without it a request that waits 72 hours,
shown as a banner, and cancelled by any correct PIN (in كنوز البيان, the oasis or the Hasaniya)."""
import asyncio, os, sys, json, functools, http.server, threading, re
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots7'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8784), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8784/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
FAM = "JSON.parse(localStorage.getItem('kb-family-v1'))"
async def fresh(p, u): await p.goto('about:blank'); await p.goto(u)
async def forgot(p):
    await fresh(p, KZ + '#parent'); await p.wait_for_selector('#pinIn'); await p.click('[data-act="pinForgot"]')
async def request_reset(p):
    await forgot(p); await p.click('[data-act="resetReq"]'); await p.wait_for_selector('.modal'); await p.click('.modal [data-m="1"]')
    await p.wait_for_selector('[data-act="resetCancel"]')

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))

        # setup: PIN, then the recovery code once, then the first child
        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.wait_for_selector('#recCode')
        code = (await p.inner_text('#recCode')).strip()
        ok(re.fullmatch(r'[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}', code) is not None, 'recovery code shown after the PIN (%s)' % code)
        ok(await p.locator('#recDone[disabled]').count() == 1, '«تابعوا» waits until the parent says it is saved')
        raw = await p.evaluate("localStorage.getItem('kb-family-v1')")
        ok(code.replace('-', '') not in raw and code not in raw and '"rec"' in raw, 'only a hash of the code is kept on the device')
        await shot(p, 'p01-recovery-code')
        await p.check('#rcSaved'); await p.click('#recDone')
        await p.wait_for_selector('#kidForm'); await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(500)

        # forgot the PIN: a wrong code is refused, the right one (any case, spaces) lets the parent set a new PIN, and gives a new code
        await forgot(p); await p.wait_for_selector('#rcIn')
        await shot(p, 'p02-forgot')
        await p.fill('#rcIn', 'AAAA-BBBB-CCCC'); await p.click('#recForm button[type=submit]'); await p.wait_for_timeout(300)
        ok('غير صحيح' in await p.inner_text('#rcErr'), 'wrong recovery code refused')
        await p.fill('#rcIn', ' ' + code.lower().replace('-', ' ') + ' '); await p.click('#recForm button[type=submit]')
        await p.wait_for_selector('#setPinForm'); ok(True, 'right recovery code opens a new PIN')
        await p.fill('#p1', '5678'); await p.fill('#p2', '5678'); await p.click('#setPinForm button[type=submit]')
        await p.wait_for_selector('#recCode'); code2 = (await p.inner_text('#recCode')).strip()
        ok(code2 != code, 'a new recovery code replaces the used one')
        await p.check('#rcSaved'); await p.click('#recDone'); await p.wait_for_selector('.ph-top')
        f = await p.evaluate(FAM)
        ok(not f.get('pinResets') and f['pinLog'][-1]['k'] == 'code', 'a reset proven by the code revokes nothing and is logged')
        await forgot(p); await p.fill('#rcIn', code); await p.click('#recForm button[type=submit]'); await p.wait_for_timeout(300)
        ok('غير صحيح' in await p.inner_text('#rcErr'), 'the old code no longer works')

        # no code: a request that waits 72 hours, shown in the oasis and here
        await request_reset(p)
        f = await p.evaluate(FAM)
        hrs = (f['resetReq']['due'] - f['resetReq']['at']) / 3600000
        ok(abs(hrs - 72) < 0.01, 'request waits 72 hours (%.1f)' % hrs)
        ok(await p.locator('[data-act="resetDo"]').count() == 0, 'no new PIN before the time is up')
        await shot(p, 'p03-request')
        await fresh(p, URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(500)
        ok(await p.locator('#kzReset').count() == 1, 'banner in the oasis')
        await shot(p, 'p04-oasis-banner')
        await fresh(p, KZ + '#kunuz'); await p.wait_for_selector('.hello')
        ok(await p.locator('.reset-banner').count() == 1, 'banner in كنوز البيان')

        # the current PIN cancels it — in the oasis …
        await fresh(p, URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(500)
        await p.click('#whoBtn'); await p.click('#ksParent'); await p.click('#ksDad'); await p.wait_for_selector('#pinIn')
        await p.fill('#pinIn', '5678'); await p.click('#pinOk'); await p.wait_for_timeout(600)
        ok((await p.evaluate(FAM)).get('resetReq') is None, 'the PIN in the oasis cancels the request')
        await fresh(p, URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
        ok(await p.locator('#kzReset').count() == 0, 'banner gone')
        # … in the Hasaniya …
        await request_reset(p)
        await fresh(p, HS); await p.wait_for_selector('#kzHome'); await p.wait_for_timeout(400)
        await p.evaluate("parentEntry()"); await p.wait_for_selector('#pinPopup.active'); await p.fill('#pinInput', '5678'); await p.evaluate("submitPin()")
        await p.wait_for_selector('#parentScreen', state='visible')
        ok((await p.evaluate(FAM)).get('resetReq') is None, 'the PIN in the Hasaniya cancels the request')
        # … and here
        await request_reset(p)
        await fresh(p, KZ + '#parent'); await p.wait_for_selector('#pinIn'); await p.fill('#pinIn', '5678'); await p.click('#pinForm button[type=submit]')
        await p.wait_for_selector('.ph-top')
        ok((await p.evaluate(FAM)).get('resetReq') is None, 'the PIN here cancels the request')
        # anyone can cancel a request from its page
        await request_reset(p); await p.click('[data-act="resetCancel"]'); await p.wait_for_timeout(300)
        ok((await p.evaluate(FAM)).get('resetReq') is None, '«ألغوا الطلب» cancels it')

        # after 72 hours: a new PIN, approvals revoked, a new recovery code, and the date shows in every consent
        await request_reset(p)
        await p.evaluate("(()=>{var f=" + FAM + "; f.resetReq.due=Date.now()-1000; f.resetReq.days=['2000-1-1','2000-1-2','2000-1-3']; localStorage.setItem('kb-family-v1',JSON.stringify(f));})()")
        await forgot(p); await p.wait_for_selector('[data-act="resetDo"]'); await p.click('[data-act="resetDo"]')
        await p.wait_for_selector('#setPinForm'); await p.fill('#p1', '2468'); await p.fill('#p2', '2468'); await p.click('#setPinForm button[type=submit]')
        await p.wait_for_selector('#recCode'); code3 = (await p.inner_text('#recCode')).strip()
        ok(code3 not in (code, code2), 'a new recovery code after the waited reset')
        await p.check('#rcSaved'); await p.click('#recDone'); await p.wait_for_selector('.ph-top')
        f = await p.evaluate(FAM)
        ok(len(f['pinResets']) == 1 and f.get('resetReq') is None, 'waited reset recorded (approvals revoked as before)')
        await fresh(p, HS); await p.wait_for_selector('#kzHome'); await p.wait_for_timeout(400)
        await p.evaluate("exportProgress()"); await p.wait_for_selector('#pinPopup.active'); await p.fill('#pinInput', '2468'); await p.evaluate("submitPin()")
        await p.wait_for_selector('#kzSheet')
        ok('أُعيد ضبط رمز وليّ الأمر' in await p.inner_text('#kzSheet'), 'the consent sheet shows the recent reset')
        await shot(p, 'p05-consent-after-reset')
        await p.locator('#kzSheet button', has_text='إلغاء').click()

        # the parent corner can make a fresh recovery code
        await fresh(p, KZ + '#parent'); await p.wait_for_selector('#pinIn'); await p.fill('#pinIn', '2468'); await p.click('#pinForm button[type=submit]')
        await p.wait_for_selector('.ph-top'); await p.click('[data-act="pBackup"]'); await p.wait_for_selector('[data-act="rcNew"]')
        ok('رمز الاسترداد أُنشئ' in await p.evaluate("document.getElementById('view').innerText"), 'security page shows the recovery code date')
        await p.click('[data-act="rcNew"]'); await p.wait_for_selector('.modal'); await p.click('.modal [data-m="1"]'); await p.wait_for_selector('#recCode')
        ok((await p.inner_text('#recCode')).strip() != code3, 'a fresh recovery code on request')
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
