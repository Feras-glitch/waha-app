# -*- coding: utf-8 -*-
"""Security, second review (2.9): the PIN typed for one export is spent on it and opens nothing else; the parents' session opens only
from a parents' entry, ends fifteen minutes after its PIN and is never extended; changing the PIN needs the current one and warns
afterwards; a reset made by waiting holds every export; Back never cycles between the sections; a restore reloads the other tabs."""
import asyncio, hashlib, json, os, sys, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8794), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8794/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def until(p, js, timeout=8000):
    for _ in range(int(timeout / 100)):
        try:
            if await p.evaluate(js): return True
        except Exception: pass
        await asyncio.sleep(0.1)
    return False
FAM = "JSON.parse(localStorage.getItem('kb-family-v1'))"

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        p.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone'); await p.wait_for_selector('#kidForm')
        await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.select_option('#kfBy', '2016'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_timeout(600)

        # ---- the oasis: an export asks for its own PIN, in the consent sheet; a refusal leaves nothing behind
        await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
        await p.evaluate("store.set('cmp:'+kid,{kind:'camel',name:'ناجي'}); store.set('planted:'+kid, Date.now()); go('rec','mushaf')")
        await p.evaluate("(async () => { const u = QN.units.find(x => x.id === muUnit) || QN.units[0]; await dbPut('rec', {id:'r'+Date.now(), kid: kid, kind:'صفحة', page: u.pages[0], status:'approved', approvedBy:'المعلم', blob: new Blob([new Uint8Array(2000)], {type:'audio/webm'}), type:'audio/webm', date: today(), ref:'صفحة', text:''}); renderMushaf(); })()")
        await p.wait_for_timeout(500)
        n0 = len(await p.evaluate(FAM + ".waLog || []"))
        await p.click('#muExport'); await p.wait_for_selector('#sheet:not([hidden]) #kzPin')
        ok(await p.locator('#sheet:not([hidden]) #pinIn').count() == 0, 'the oasis: the PIN for an export is typed in the consent sheet itself, not in a separate gate')
        await p.fill('#kzPin', '1234'); await p.click('#kzNo'); await p.wait_for_timeout(400)
        await p.click('#muHtml'); await p.wait_for_selector('#sheet:not([hidden]) #kzPin')
        await p.check('#kzOk'); await p.click('#kzGo'); await p.wait_for_timeout(400)
        ok(await p.locator('#sheet:not([hidden]) #kzFb').inner_text() != '' and await p.locator('#sheet:not([hidden])').count() == 1,
           'right after a refused export, the next one still needs its own PIN: no PIN, nothing leaves')
        await p.fill('#kzPin', '9999'); await p.click('#kzGo'); await p.wait_for_timeout(400)
        ok('غير صحيح' in await p.locator('#kzFb').inner_text(), 'a wrong PIN is refused in the sheet')
        await p.fill('#kzPin', '1234')
        async with p.expect_download() as dl: await p.click('#kzGo')
        ok((await dl.value).suggested_filename.startswith('mushaf-'), 'with the PIN for this file, the file leaves')
        ok(len(await p.evaluate(FAM + ".waLog || []")) == n0 + 1, 'and the export is logged once')
        # the PIN typed for that export opened nothing
        await p.click('#whoBtn'); await p.click('#ksParent'); await p.click('#ksDad'); await p.wait_for_timeout(300)
        ok(await p.locator('#sheet:not([hidden]) #pinIn').count() == 1 and await p.evaluate("cur.o") != 'dad', 'the PIN typed for an export does not open «لوحة الواحة»')
        await p.fill('#pinIn', '1234'); await p.click('#pinOk'); await p.wait_for_selector('#ddTabs')
        ok(await p.evaluate("cur.o") == 'dad', '…the PIN typed at the parents\' entry does')
        # the session is fifteen minutes from its PIN, never extended by using the board
        r = await p.evaluate("""(() => { const t0 = Date.now(), real = Date.now; window.__ok = 0;
            Date.now = () => t0 + 10 * 60000; pinGate(() => { window.__ok = 1; });
            const in10 = window.__ok === 1 && !document.querySelector('#sheet:not([hidden]) #pinIn');
            Date.now = () => t0 + 16 * 60000; window.__ok = 0; pinGate(() => { window.__ok = 1; });
            const in16 = window.__ok === 0 && !!document.querySelector('#sheet:not([hidden]) #pinIn');
            Date.now = real; closeSheet(); return [in10, in16]; })()""")
        ok(r == [True, True], 'the board\'s session holds at 10 minutes and ends at 16, though it was used at 10 (%s)' % r)
        # leaving the board ends it
        await p.evaluate("go('home')"); await p.evaluate("pinGate(() => { window.__ok2 = 1; })"); await p.wait_for_timeout(200)
        ok(await p.locator('#sheet:not([hidden]) #pinIn').count() == 1, 'leaving the board for the child\'s home ends the session')
        await p.evaluate("closeSheet()")

        # ---- «كنوز البيان»: a PIN typed for a print is spent on it; the corner still asks
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
        await p.evaluate("() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; }")
        await p.evaluate("document.getElementById('view').insertAdjacentHTML('beforeend', '<button type=\"button\" data-act=\"print\" id=\"tPrint\">p</button>')")
        await p.click('#tPrint'); await p.wait_for_selector('.modal #fpIn'); await p.fill('#fpIn', '1234'); await p.click('.modal [data-m="1"]')
        await until(p, "window.__printed === 1")
        ok(await p.evaluate("window.__printed") == 1, '«كنوز البيان»: the print asks for the PIN and prints')
        await p.click('#footParent') if await p.locator('#footParent').count() else await p.evaluate("location.hash='parent'")
        await p.wait_for_timeout(500)
        ok(await p.locator('#pinIn').count() == 1, '…and that PIN does not open «ركن وليّ الأمر»')
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
        # changing the PIN needs the current one
        await p.click('[data-act="pBackup"]'); await p.click('[data-act="setupPin"]'); await p.wait_for_selector('#p0')
        await p.fill('#p0', '0000'); await p.fill('#p1', '5555'); await p.fill('#p2', '5555'); await p.click('#setPinForm button[type=submit]'); await p.wait_for_timeout(400)
        ok('غير صحيح' in await p.inner_text('#setPinErr'), 'changing the PIN with a wrong current PIN is refused')
        await p.fill('#p0', '1234'); await p.fill('#p1', '5555'); await p.fill('#p2', '5555'); await p.click('#setPinForm button[type=submit]'); await p.wait_for_timeout(600)
        f = await p.evaluate(FAM)
        ok(any(x.get('k') == 'change' for x in f.get('pinLog') or []) and len(f.get('pinResets') or []) >= 1, 'with the current PIN it changes, and the change is logged')
        # the change is shown in the next consent sheet (the oasis)
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(300)
        await p.evaluate("go('rec','mushaf')"); await p.wait_for_timeout(400)
        await p.click('#muExport'); await p.wait_for_selector('#sheet:not([hidden]) #kzPin')
        ok('تغيّر رمز وليّ الأمر' in await p.inner_text('#sheet'), 'the oasis consent sheet warns that the PIN changed')
        await p.click('#kzNo')

        # ---- a reset made by waiting holds every export; the old recovery code lifts the hold
        h = 's' + hashlib.sha256('salt9:ABCD2345EFGH'.encode()).hexdigest()
        await p.evaluate("""(h) => { const f = JSON.parse(localStorage.getItem('kb-family-v1')); f.exportHold = Date.now() + 30 * 864e5; f.recPrev = {salt: 'salt9', h: h}; localStorage.setItem('kb-family-v1', JSON.stringify(f)); }""", h)
        await p.click('#muExport'); await p.wait_for_selector('#sheet:not([hidden]) #kzRc')
        ok(await p.locator('#sheet:not([hidden]) #kzPin').count() == 0 and 'موقوف' in await p.inner_text('#sheet'), 'after a reset by waiting, the consent sheet holds the export and asks for the old recovery code')
        await p.fill('#kzRc', 'WRONG-CODE-XX'); await p.check('#kzOk'); await p.click('#kzGo'); await p.wait_for_timeout(400)
        ok(await p.locator('#sheet:not([hidden])').count() == 1, 'a wrong recovery code lets nothing out')
        await p.fill('#kzRc', 'abcd-2345-efgh')
        async with p.expect_download() as dl: await p.click('#kzGo')
        ok(not (await p.evaluate(FAM)).get('exportHold'), 'the old recovery code lifts the hold, and the file leaves')
        await dl.value

        # ---- the Hasaniya: an export asks for its PIN in the sheet; a PIN typed for something else opens no session
        await p.goto('about:blank'); await p.goto(HS); await p.wait_for_timeout(1500)
        await p.evaluate("(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['x'])); a.download = 'hasaniya_week_test.txt'; window.__a = a; a.click(); })()")
        await p.wait_for_selector('#kzSheet #kzPin')
        ok(await p.evaluate("!document.getElementById('pinPopup').classList.contains('active')"), 'the Hasaniya: an export asks for the PIN in its consent sheet, not in a separate popup')
        await p.click('#kzSheet button:has-text("إلغاء")'); await p.wait_for_timeout(3300)   # a refusal covers the other parts of the same export for 3 s
        await p.evaluate("(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['y'])); a.download = 'hasaniya_week_test2.txt'; a.click(); })()")
        await p.wait_for_selector('#kzSheet #kzPin')
        await p.check('#kzOk'); await p.click('#kzGo'); await p.wait_for_timeout(300)
        ok(await p.locator('#kzSheet').count() == 1 and await p.inner_text('#kzFb') != '', '…a refusal a moment ago does not let the next file out without its PIN')
        await p.fill('#kzPin', '5555')
        async with p.expect_download() as dl: await p.click('#kzGo')
        ok((await dl.value).suggested_filename == 'hasaniya_week_test2.txt', '…and with its PIN the file leaves')
        await p.evaluate("requirePin(() => { window.__cb = 1; }, 'test')"); await p.wait_for_timeout(200)
        await p.fill('#pinInput', '5555'); await p.evaluate("submitPin()"); await until(p, "window.__cb === 1")
        await p.evaluate("parentEntry()"); await p.wait_for_timeout(400)
        ok(await p.evaluate("document.getElementById('pinPopup').classList.contains('active')"), 'a PIN typed for something else does not open the Hasaniya parents\' screen')
        await p.fill('#pinInput', '5555'); await p.evaluate("submitPin()"); await p.wait_for_timeout(500)
        ok(await p.evaluate("getComputedStyle(document.getElementById('parentScreen')).display !== 'none'"), '…the PIN typed at its entry does')

        # ---- Back never cycles between the sections, and leaves the app in the end
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(500)
        await p.evaluate("go('kid')"); await p.wait_for_timeout(300)
        await p.evaluate("kunuzGo('kunuz')"); await p.wait_for_selector('.hello', timeout=8000)
        seen = []
        for i in range(8):
            await p.go_back(); await p.wait_for_timeout(700)
            seen.append(p.url.replace(BASE, '/')[:30])
            if p.url == 'about:blank': break
        ok('about:blank' in seen[-1] or p.url == 'about:blank', 'from «كنوز البيان», Back returns to the oasis and then leaves the app (%s)' % ' → '.join(seen))

        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(500)
        await p.evaluate("go('kid')"); await p.wait_for_timeout(300)
        await p.evaluate("kzLeave('hasaniya/index.html?kid=' + encodeURIComponent((window.KZ_IDS || [])[kid] || ''))"); await p.wait_for_timeout(2000)
        seen = [p.url.replace(BASE, '/')[:30]]
        for i in range(8):
            await p.go_back(); await p.wait_for_timeout(900)
            seen.append(p.url.replace(BASE, '/')[:30])
            if p.url == 'about:blank': break
        ok(p.url == 'about:blank' and sum('hasaniya' in x for x in seen) == 1, 'from the Hasaniya, Back returns to the oasis and then leaves the app (%s)' % ' → '.join(seen))

        # ---- a restore made in one tab reloads the others
        q = await ctx.new_page(); await q.goto(HS); await q.wait_for_timeout(1200); await q.evaluate("window.__mark = 1")
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn')
        await p.evaluate("localStorage.setItem('kb-epoch', String(Date.now()))"); await q.wait_for_timeout(1500)
        ok(await q.evaluate("window.__mark") is None, 'a restore (kb-epoch) made elsewhere reloads an open Hasaniya tab')
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
