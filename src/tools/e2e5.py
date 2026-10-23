# -*- coding: utf-8 -*-
"""The oasis as the front door: profiles by id, birth year, gendered address, PIN, consent before export,
treasure chambers inside the oasis, backup, deleting a child keeps the others' progress."""
import asyncio, os, sys, json, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots5'
os.makedirs(SHOTS, exist_ok=True); DL = os.path.join(SHOTS, 'dl'); os.makedirs(DL, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8780), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8780/'
URL = BASE + 'index.html'          # the oasis: front page of the product
KZ = BASE + 'kunuz/index.html'     # كنوز البيان and the parent corner
def is_oasis(u): return u.split('?')[0].split('#')[0] == URL
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
VIS = """(()=>{var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)?2:1}),s='',n;while((n=w.nextNode()))s+=n.data+' ';var a=[].map.call(document.querySelectorAll('[placeholder],[aria-label],[title]'),e=>(e.getAttribute('placeholder')||'')+(e.getAttribute('aria-label')||'')+(e.getAttribute('title')||'')).join(' ');return s+' '+a;})()"""
async def body_text(p): return await p.evaluate(VIS)
async def add_kid(p, name, g, by=None):
    await p.wait_for_selector('#kidForm'); await p.fill('#kfName', name); await p.click('[data-act="kfG"][data-v="%s"]' % g)
    if by: await p.select_option('#kfBy', str(by))
    await p.click('#kidForm button[type=submit]')
async def oasis_ready(p):
    await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(700)
async def oasis_kid(p): return await p.evaluate("JSON.parse(localStorage.getItem('oasis:kids'))[JSON.parse(localStorage.getItem('oasis:kid'))]")
async def corner(p):
    """the parent corner of the app, from inside the oasis"""
    await p.click('#whoBtn'); await p.click('#ksParent'); await p.click('#ksCorner'); await p.wait_for_selector('#pinIn, .ph-top')
    if await p.locator('#pinIn').count():
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True, permissions=['microphone'])
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        man = await (await p.request.get(BASE + 'manifest.json')).json()
        ok(man['name'] == 'واحة اللسان العربي', 'installed app is named after the oasis')
        await p.goto(URL); await p.wait_for_selector('h1')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]'); await p.check('#rcSaved'); await p.click('#recDone')
        await add_kid(p, 'هند', 'f', 2016)
        await oasis_ready(p)
        ok(is_oasis(p.url), 'after the first profile the child lands in the oasis')
        k = await oasis_kid(p)
        ok(k and k['name'] == 'هند' and k['gender'] == 'f', 'oasis uses the family profile (girl)')
        ok(k and k['age'] == 2026 - 2016, 'age from the birth year (%s)' % (k and k['age']))
        tx = await body_text(p)
        ok('⟨' not in tx and '⟩' not in tx, 'no raw markers (girl)')
        ok('اختاري نخلة' in tx and 'اختر نخلة' not in tx, 'static text addressed to a girl')
        ok(not await p.locator('#sheet:not([hidden]) #pinIn2').count(), 'no second PIN setup')
        await shot(p, 'w01-girl')

        # first meeting done (companion chosen, seed planted), then the oasis home
        await p.evaluate("store.set('cmp:'+kid,{kind:'camel',name:'ناجي'}); store.set('planted:'+kid, Date.now()); go('home')"); await p.wait_for_timeout(500)
        await shot(p, 'w01b-home')
        # the treasure chambers are inside the oasis
        ok(await p.locator('.ktile', has_text='كنوز البيان').count() == 1, 'treasure chambers tile on the oasis home')
        await p.locator('.ktile', has_text='كنوز البيان').click(); await p.wait_for_selector('.hello')
        ok('#kunuz' in p.url, 'tile opens the treasure chambers')
        ok(await p.locator('#oasisLink:not([hidden])').count() == 1, 'header link back to the oasis')
        await p.click('#oasisLink'); await oasis_ready(p)
        ok(is_oasis(p.url), 'back in the oasis')
        await p.goto(URL); await oasis_ready(p)
        ok(is_oasis(p.url), 'opening the app goes straight to the oasis')

        # a second child from the parent corner
        await corner(p)
        await p.click('[data-act="pKids"]'); await p.click('[data-act="kidAdd"]'); await add_kid(p, 'يوسف', 'm', 2018)
        await p.goto(URL); await oasis_ready(p)
        kids = await p.evaluate("JSON.parse(localStorage.getItem('oasis:kids')).map(k=>k.name)")
        ok(kids == ['هند', 'يوسف'], 'oasis children = app children (%s)' % kids)
        await p.click('#whoBtn'); await p.wait_for_selector('#sheet:not([hidden])')
        ok('أضف طفلًا' not in await p.inner_text('#sheet'), 'children are added in the parent corner only')
        await p.locator('#sheet .chip2', has_text='يوسف').click(); await p.wait_for_timeout(500)
        tx = await body_text(p)
        ok('اختر نخلة' in tx and 'اختاري نخلة' not in tx, 'same text addressed to a boy')
        fam_cur = await p.evaluate("(()=>{var f=JSON.parse(localStorage.getItem('kb-family-v1'));return f.kids.find(k=>k.id===f.cur).name})()")
        ok(fam_cur == 'يوسف', 'switching in the oasis selects the child in the app too')
        await shot(p, 'w02-boy')

        # storage by id: keys carry the child id, not the position
        await p.evaluate("store.set('m:0:test:1',{n:1,ok:1,streak:2,wrong:0,who:'hind'}); store.set('m:1:test:1',{n:5,ok:5,streak:3,wrong:0,who:'yusuf'}); store.set('tri',[{id:'t1',kid:1,w:'x'}])")
        raw = await p.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('oasis:m:'))")
        ids = await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).kids.map(k=>k.id)")
        ok(all(':@' in k for k in raw) and any(ids[0] in k for k in raw) and any(ids[1] in k for k in raw), 'progress stored by child id (%s)' % raw)
        ok(await p.evaluate("JSON.parse(localStorage.getItem('oasis:tri'))[0].kid") == '@' + ids[1], 'lists store the child id')
        ok(await p.evaluate("store.get('tri')[0].kid") == 1, 'the oasis still sees positions')
        await p.click('#whoBtn'); await p.locator('#sheet .chip2', has_text='هند').click(); await p.wait_for_timeout(400)

        # parent: wrong PIN, then the family PIN
        await p.click('#whoBtn'); await p.click('#ksParent'); await p.click('#ksDad'); await p.wait_for_selector('#pinIn')
        ok(not await p.locator('#pinIn2').count(), 'parent PIN asked once (no setup)')
        await p.fill('#pinIn', '0000'); await p.click('#pinOk'); await p.wait_for_timeout(300)
        ok('غير صحيح' in await p.inner_text('#pinFb'), 'wrong PIN refused')
        await p.fill('#pinIn', '1234'); await p.click('#pinOk'); await p.wait_for_timeout(600)
        await p.locator('#ddTabs button', has_text='واجهة الطفل').click(); await p.wait_for_timeout(400)
        tx = await p.evaluate("document.body.innerText")
        ok('النسخة الاحتياطية المشفّرة' in tx, 'oasis backup points to the app backup')
        ok(not await p.locator('#ksBackup:visible').count(), 'oasis unencrypted backup hidden')
        await shot(p, 'w03-dad', True)

        # export: consent sheet, resolved text, log
        await p.evaluate("void saveFile('test-hind.txt','⟨اكتب|اكتبي⟩ اسمك', null)")
        await p.wait_for_selector('#kzOk')
        ok(await p.locator('#kzGo[disabled]').count() == 1, 'export waits for consent')
        await p.check('#kzOk'); await p.fill('#kzPin', '1234')
        async with p.expect_download() as dli:
            await p.click('#kzGo')
        dl = await dli.value; fp = os.path.join(DL, 'test.txt'); await dl.save_as(fp)
        ok(open(fp, encoding='utf-8').read() == 'اكتبي اسمك', 'exported text resolved for a girl')
        log = await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).waLog")
        ok(log and log[-1]['name'] == 'test-hind.txt' and log[-1]['kid'] == ids[0], 'export logged for the parent')
        await p.evaluate("void saveFile('no.txt','x', null)"); await p.wait_for_selector('#kzNo'); await p.click('#kzNo')
        ok(await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).waLog.length") == 1, 'cancelled export not logged')

        # backup includes the oasis, restore brings it back
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn, .ph-top')
        if await p.locator('#pinIn').count():
            await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
        await p.click('[data-act="pBackup"]'); await p.wait_for_selector('[data-act="backupMake"]')
        t = await p.evaluate("document.getElementById('view').innerText")
        ok('ما خرج من الجهاز' in t and 'test-hind.txt' in t, 'oasis exports listed in the parent corner')
        await p.click('[data-act="backupMake"]'); await p.fill('#bk1', 'kunuz-2026'); await p.fill('#bk2', 'kunuz-2026'); await p.fill('#fpIn', '1234')
        async with p.expect_download() as dli:
            await p.click('.modal [data-m="1"]')
        dl = await dli.value; bp = os.path.join(DL, 'backup.json'); await dl.save_as(bp)
        await p.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('oasis:m:')).forEach(k=>localStorage.removeItem(k))")
        await p.set_input_files('input[data-file="restore"]', bp)
        await p.wait_for_selector('#bkp'); await p.fill('#bkp', 'kunuz-2026'); await p.click('.modal [data-m="1"]')
        await p.wait_for_selector('.modal [data-m="1"]'); await p.click('.modal [data-m="1"]')
        await p.wait_for_timeout(1200)
        n = await p.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('oasis:m:')).length")
        ok(n == 2, 'oasis progress restored from the encrypted backup')

        # deleting the FIRST child keeps the second child's progress
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn, .ph-top')
        if await p.locator('#pinIn').count():
            await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
        await p.click('[data-act="pKids"]'); await p.locator('[data-act="pProg"]').nth(0).click(); await p.wait_for_selector('[data-act="kidDel"]')
        await p.click('[data-act="kidDel"]'); await p.wait_for_selector('.modal'); await p.click('.modal [data-m="1"]'); await p.wait_for_timeout(600)
        left = await p.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('oasis:') && k.indexOf('%s')>=0)" % ids[0])
        ok(left == [], 'the deleted child leaves nothing in the oasis')
        await p.goto(URL); await oasis_ready(p)
        kids = await p.evaluate("JSON.parse(localStorage.getItem('oasis:kids')).map(k=>k.name)")
        ok(kids == ['يوسف'], 'oasis children after deletion (%s)' % kids)
        v = await p.evaluate("store.get('m:0:test:1')")
        ok(v and v.get('who') == 'yusuf', 'the remaining child keeps their own progress')
        ok(await p.evaluate("store.get('tri').length") == 1, 'the remaining child keeps their words')

        # the parent corner tool opens the oasis dashboard without asking the PIN again
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn, .ph-top')
        if await p.locator('#pinIn').count():
            await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
        await p.click('[data-act="pWaha"]'); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(900)
        ok(not await p.locator('#sheet:not([hidden]) #pinIn').count(), 'oasis dashboard opens with the PIN already given')
        await shot(p, 'w05-dad-from-app', True)
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
