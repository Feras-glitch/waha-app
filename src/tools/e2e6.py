# -*- coding: utf-8 -*-
"""The Hasaniya inside the product: family children (name, gender, small mode from the birth year), the family PIN,
parent consent before any file leaves, storage apart from the standalone Hasaniya, backup, deletion, one service worker, offline."""
import asyncio, os, sys, json, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots6'
os.makedirs(SHOTS, exist_ok=True); DL = os.path.join(SHOTS, 'dl'); os.makedirs(DL, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8782), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8782/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def until(p, js, timeout=10000):
    """wait_for_function evaluates its text with eval, which the pages' content policy refuses; this asks the page instead"""
    for _ in range(int(timeout / 100)):
        if await p.evaluate(js): return
        await asyncio.sleep(0.1)
    raise TimeoutError('still false: ' + js)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
async def add_kid(p, name, g, by):
    await p.wait_for_selector('#kidForm'); await p.fill('#kfName', name); await p.click('[data-act="kfG"][data-v="%s"]' % g)
    await p.select_option('#kfBy', str(by)); await p.click('#kidForm button[type=submit]')
async def oasis_ready(p): await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(700)
async def hs_ready(p): await p.wait_for_selector('#kzHome'); await until(p, "typeof users!=='undefined'&&users.length>0&&!!state"); await p.wait_for_timeout(500)
async def corner(p):
    await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn, .ph-top')
    if await p.locator('#pinIn').count():
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
RAW = "Object.keys(localStorage).sort()"
async def pin_if_asked(p, wait=600):
    """the gate asks for the PIN again unless it was typed for this very action"""
    await p.wait_for_timeout(wait)
    if await p.locator('#pinPopup.active').count():
        await p.fill('#pinInput', '1234'); await p.evaluate("submitPin()"); await p.wait_for_timeout(400)
        return True
    return False
OPEN_DB = "var openHs=()=>new Promise(r=>{var q=indexedDB.open('waha.hasaniya-rec',1);q.onupgradeneeded=()=>q.result.createObjectStore('recs',{keyPath:'key'});q.onsuccess=()=>r(q.result);});"

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True, permissions=['microphone'])
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        p.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))

        # a standalone Hasaniya on the same origin (github.io) keeps its own children
        await p.goto(BASE + 'manifest.json')
        await p.evaluate("localStorage.setItem('hasaniya_v13_users', JSON.stringify([{id:'u_1',name:'سلمى',avatar:'🦋',state:{points:7}}])); localStorage.setItem('hasaniya_v13_activeUserId','u_1')")

        # family: PIN, a girl (10) and a small boy (6)
        await p.goto(URL); await p.wait_for_selector('h1')
        ok('/kunuz/index.html' in p.url, 'no family yet: the oasis sends the parent to the setup')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]'); await p.check('#rcSaved'); await p.click('#recDone')
        await add_kid(p, 'هند', 'f', 2016); await oasis_ready(p)
        await corner(p); await p.click('[data-act="pKids"]'); await p.click('[data-act="kidAdd"]'); await add_kid(p, 'يوسف', 'm', 2020)
        ids = await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).kids.map(k=>k.id)")
        await p.goto(URL); await oasis_ready(p)
        await p.click('#whoBtn'); await p.locator('#sheet .chip2', has_text='هند').click(); await p.wait_for_timeout(300)
        await p.evaluate("store.set('cmp:'+kid,{kind:'camel',name:'ناجي'}); store.set('planted:'+kid, Date.now()); go('home')"); await p.wait_for_timeout(400)

        # the tile opens the Hasaniya with the child
        tile = p.locator('.ktile', has_text='الحسنية')
        ok(await tile.count() == 1, 'Hasaniya tile on the oasis home')
        await tile.click(); await hs_ready(p)
        ok(p.url.split('?')[0] == HS and '?' not in p.url, 'Hasaniya opened, child id removed from the address')
        us = await p.evaluate("users.map(u=>[u.id,u.name,u.gender,!!u.small])")
        ok(us == [['kz_' + ids[0], 'هند', 'girl', False], ['kz_' + ids[1], 'يوسف', 'boy', True]], 'Hasaniya children = family children (%s)' % us)
        ok(await p.evaluate("activeUserId") == 'kz_' + ids[0], 'the child who tapped the tile is the active child')
        ok(await p.evaluate("gForm('أحسنتَ','أحسنتِ')") == 'أحسنتِ', 'Hasaniya addresses her as a girl')
        ok(await p.evaluate("document.getElementById('userName').textContent") == 'هند', 'name in the header')
        raw = await p.evaluate(RAW)
        ok('waha.hasaniya_v13_users' in raw, 'product Hasaniya stores under its own names')
        stand_raw = await p.evaluate("(()=>{for(var i=0;i<localStorage.length;i++){if(localStorage.key(i)==='hasaniya_v13_users')return true}return false})()")
        ok(stand_raw, 'the standalone Hasaniya key is still there')
        ok(not await p.locator('.modal-overlay.active').count(), 'no onboarding popup (name and gender known)')
        w = await p.evaluate("document.documentElement.scrollWidth"); ok(w <= 390, 'no horizontal scroll (%d)' % w)
        await shot(p, 'h01-hasaniya-map')

        # the family PIN
        await p.evaluate("parentEntry()"); await p.wait_for_selector('#pinPopup.active')
        ok('رمز وليّ الأمر' in await p.inner_text('#pinSubtitle'), 'PIN popup says it is the family PIN')
        ok(not await p.locator('#pinConfirmWrap:visible').count(), 'no PIN setup in the Hasaniya')
        await p.fill('#pinInput', '0000'); await p.evaluate("submitPin()"); await p.wait_for_timeout(300)
        ok('غير صحيح' in await p.inner_text('#pinError'), 'wrong PIN refused')
        await p.fill('#pinInput', '1234'); await p.evaluate("submitPin()"); await p.wait_for_selector('#parentScreen', state='visible')
        ok(True, 'family PIN opens the parent screen')
        await shot(p, 'h02-parent', True)

        # files leave only after consent; the link is kept even though the Hasaniya revokes it after a second
        await p.evaluate("exportReport()"); await p.wait_for_selector('#kzSheet')
        ok(await p.locator('#kzGo[disabled]').count() == 1, 'export waits for consent')
        ok('تقرير تقدّم هند' in await p.inner_text('#kzSheet'), 'consent names what leaves: %s' % (await p.inner_text('#kzSheet b')))
        ok('تم التصدير' not in await p.inner_text('#toast'), 'no «done» toast before the parent agrees')
        await p.wait_for_timeout(400); await shot(p, 'h03-consent')
        await p.wait_for_timeout(1500)
        await p.check('#kzOk')
        async with p.expect_download() as dli:
            await p.click('#kzGo')
        dl = await dli.value; fp = os.path.join(DL, 'report.json'); await dl.save_as(fp)
        rep = json.load(open(fp, encoding='utf-8'))
        ok(rep['user']['name'] == 'هند' and dl.suggested_filename.startswith('hasaniya_report_'), 'report downloaded after consent (%s)' % dl.suggested_filename)
        log = await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).waLog")
        ok(log and log[-1]['app'] == 'hasaniya' and log[-1]['kid'] == ids[0] and 'هند' in log[-1]['name'], 'export logged for the parent (%s)' % (log and log[-1]))
        # a different file does not ride on that consent
        await p.evaluate("exportProgress()"); await pin_if_asked(p); await p.wait_for_selector('#kzSheet')
        ok('ملف تقدّم هند' in await p.inner_text('#kzSheet'), 'another file asks again')
        # Esc (or the Android back button) closes the sheet as a refusal, and the app's own messages come back
        await p.keyboard.press('Escape'); await p.wait_for_timeout(300)
        ok(not await p.locator('#kzSheet').count() and 'لم يخرج شيء' in await p.inner_text('#toast'), 'Esc closes the consent as «no»')
        await p.wait_for_timeout(3200); await p.evaluate("showToast('مرحبا','success')")
        ok('مرحبا' in await p.evaluate("document.getElementById('toast').textContent"), 'toasts are not left muted')
        # recordings exported in two parts: one consent lists both, both arrive, both logged
        await p.evaluate("Promise.all(Array.from({length:16},(_, i)=>recPut({key:activeUserId+'|s1v'+(i+1),verseId:'s1v'+(i+1),kind:'verse',uid:activeUserId,mime:'audio/webm',blob:new Blob(['x'.repeat(40)],{type:'audio/webm'}),at:Date.now()+i})))")
        n0 = await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).waLog.length")
        got = []; p.on('download', lambda d: got.append(d.suggested_filename))
        await p.evaluate("exportRecitation()"); await pin_if_asked(p); await p.wait_for_selector('#kzSheet'); await p.wait_for_timeout(1500)
        ok(await p.locator('#kzWhat li').count() == 2, 'one consent lists both parts (%d)' % await p.locator('#kzWhat li').count())
        await p.check('#kzOk'); await p.click('#kzGo'); await p.wait_for_timeout(1500)
        ok(sorted(got) == sorted(x for x in got if x.startswith('recitation-')) and len(got) == 2, 'both parts downloaded (%s)' % got)
        ok(await p.evaluate("JSON.parse(localStorage.getItem('kb-family-v1')).waLog.length") == n0 + 2, 'both parts logged')
        await p.evaluate("(async()=>{var a=await recAllForUser(activeUserId); for (var r of a) await recDelete(r.key);})()")
        # printing the certificate waits for consent as well
        await p.evaluate("printCertificate(content.journeyData[0])"); await pin_if_asked(p); await p.wait_for_selector('#kzSheet')
        ok('شهادة هند (للطباعة)' in await p.inner_text('#kzSheet'), 'certificate printing asks first')
        await p.locator('#kzSheet button', has_text='إلغاء').click()
        # Naji's note to the parents: opens with the PIN, speaks of a girl as a girl, copying it out asks first
        await p.evaluate("showMap()"); await p.wait_for_timeout(300)
        await p.evaluate("guideParentNote()"); await p.wait_for_selector('#pinPopup.active')
        ok(True, 'leaving the parent screen ends the parent session')
        await p.fill('#pinInput', '1234'); await p.evaluate("submitPin()"); await p.wait_for_selector('#parentNoteText')
        note = await p.input_value('#parentNoteText')
        ok('سجّلت هند' in note and 'بصوتها' in note and 'شجّعوها' in note and 'بصوته.' not in note, 'the note speaks of her as a girl (%s)' % note[:120])
        await p.evaluate("selectParentNote()"); await p.wait_for_selector('#kzSheet')
        ok('نسخ إلى الحافظة' in await p.inner_text('#kzSheet'), 'copying the note asks first')
        await p.locator('#kzSheet button', has_text='إلغاء').click()
        await p.evaluate("closePopup('hubPopup')")
        await p.evaluate("parentEntry()"); await pin_if_asked(p, 300); await p.wait_for_selector('#parentScreen', state='visible')

        # children are managed in the parent corner
        await p.evaluate("showUsersModal()"); await p.wait_for_selector('#usersPopup.active')
        ok(await p.locator('#usersPopup .mini-btn.delete').count() == 0, 'no delete in the Hasaniya')
        ok(not await p.locator('#usersPopup button[onclick^="openUserEditor(null"]:visible').count(), 'no add in the Hasaniya')
        ok('ركن وليّ الأمر' in await p.inner_text('#kzKidsNote'), 'points to the parent corner')
        await shot(p, 'h04-users')
        await p.evaluate("openUserEditor('kz_%s')" % ids[1]); await p.wait_for_selector('#kzSheet')
        ok('مفعّل' in await p.inner_text('#kzSheet'), 'small mode on for a six-year-old')
        await p.locator('#kzSheet button', has_text='أوقفوا وضع الطفل الصغير').click(); await pin_if_asked(p, 300)
        ok(await p.evaluate("getUserById('kz_%s').small" % ids[1]) is False, 'parent turns small mode off')
        await p.locator('#kzSheet button', has_text='إغلاق').click()
        await p.evaluate("managePin()"); await p.wait_for_selector('#kzSheet')
        ok('ركن وليّ الأمر' in await p.inner_text('#kzSheet'), 'PIN is changed in the parent corner')
        await p.locator('#kzSheet button', has_text='إغلاق').click()
        await p.evaluate("exportBackup()"); await p.wait_for_selector('#kzSheet')
        ok('مشفّرة' in await p.inner_text('#kzSheet'), 'backups are the family encrypted backup')
        await p.locator('#kzSheet button', has_text='إغلاق').click()

        # a recording of hers in the product's own database
        await p.evaluate("recPut({key:activeUserId+'|s1v1',verseId:'s1v1',kind:'verse',uid:activeUserId,mime:'audio/webm',blob:new Blob(['x'],{type:'audio/webm'}),at:Date.now()})")
        dbs = await p.evaluate("indexedDB.databases ? indexedDB.databases().then(a=>a.map(d=>d.name)) : []")
        ok('waha.hasaniya-rec' in dbs and 'hasaniya-rec' not in dbs, 'recordings in the product database (%s)' % dbs)
        await p.evaluate("state.points=42; saveState()")

        # way home
        await p.click('#kzHome'); await oasis_ready(p)
        ok(p.url.split('?')[0].split('#')[0] == URL, '🌴 goes back to the oasis')

        # family backup carries the Hasaniya; restore brings it back
        await corner(p)
        await p.click('[data-act="pBackup"]'); await p.wait_for_selector('[data-act="backupMake"]')
        t = await p.evaluate("document.getElementById('view').innerText")
        ok('ما خرج من الواحة والحسنية' in t and 'الحسنية · تقرير تقدّم هند' in t, 'Hasaniya exports listed in the parent corner')
        await p.click('[data-act="backupMake"]'); await p.fill('#bk1', 'kunuz-2026'); await p.fill('#bk2', 'kunuz-2026')
        async with p.expect_download() as dli:
            await p.click('.modal [data-m="1"]')
        dl = await dli.value; bp = os.path.join(DL, 'backup.json'); await dl.save_as(bp)
        await p.evaluate(OPEN_DB + "localStorage.removeItem('waha.hasaniya_v13_users'); openHs().then(d=>new Promise(r=>{var t=d.transaction('recs','readwrite');t.objectStore('recs').clear();t.oncomplete=()=>{d.close();r();};}))")
        await p.set_input_files('input[data-file="restore"]', bp)
        await p.wait_for_selector('#bkp'); await p.fill('#bkp', 'kunuz-2026'); await p.click('.modal [data-m="1"]')
        await p.wait_for_selector('.modal [data-m="1"]'); await p.click('.modal [data-m="1"]')
        await p.wait_for_timeout(1500)
        pts = await p.evaluate("JSON.parse(localStorage.getItem('waha.hasaniya_v13_users')).find(u=>u.name==='هند').state.points")
        ok(pts == 42, 'Hasaniya progress restored from the encrypted backup (%s)' % pts)
        recs = await p.evaluate(OPEN_DB + "openHs().then(d=>new Promise(r=>{var q=d.transaction('recs').objectStore('recs').getAll();q.onsuccess=()=>{r(q.result.map(x=>[x.key,x.blob instanceof Blob]));d.close();}}))")
        ok(len(recs) == 1 and recs[0][1], 'her recording restored as audio (%s)' % recs)
        ok(await p.evaluate("localStorage.getItem('hasaniya_v13_users')") is not None, 'restore leaves the standalone Hasaniya alone')

        # Android back button inside «كنوز البيان»: a dialog closes, a page steps back, the home page lets the app go to the oasis
        await corner(p); await p.click('[data-act="pKids"]'); await p.wait_for_selector('[data-act="kidAdd"]')
        ok(await p.evaluate("appBack()") is True, 'back steps out of a parent page')
        await p.wait_for_selector('.ph-top')
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
        ok(await p.evaluate("appBack()") is True, 'back on the chambers home goes to the oasis (not out of the app)')
        await p.wait_for_selector('#whoBtn'); ok('kunuz' not in p.url, 'and the oasis opens')

        # deleting a child removes her Hasaniya data, keeps her brother's
        await p.evaluate(OPEN_DB + "openHs().then(d=>new Promise(r=>{var t=d.transaction('recs','readwrite'),o=t.objectStore('recs');o.put({key:'author|line|x1',kind:'line',uid:'author',text:'يَا هِنْدُ',blob:new Blob(['a'])});o.put({key:'author|line|x2',kind:'line',uid:'author',text:'يا يوسف',blob:new Blob(['a'])});t.oncomplete=()=>{d.close();r();};}))")
        await p.evaluate("localStorage.setItem('waha.hasaniya_users_corrupt_backup','{broken')")
        await corner(p)
        await p.click('[data-act="pKids"]'); await p.locator('[data-act="pProg"]').nth(0).click(); await p.wait_for_selector('[data-act="kidDel"]')
        await p.click('[data-act="kidDel"]'); await p.wait_for_selector('.modal'); await p.click('.modal [data-m="1"]'); await p.wait_for_timeout(800)
        left = await p.evaluate("JSON.parse(localStorage.getItem('waha.hasaniya_v13_users')).map(u=>u.name)")
        ok(left == ['يوسف'], 'Hasaniya children after deletion (%s)' % left)
        recs = await p.evaluate(OPEN_DB + "openHs().then(d=>new Promise(r=>{var q=d.transaction('recs').objectStore('recs').getAll();q.onsuccess=()=>{r(q.result.length);d.close();}}))")
        ok(recs == 1, 'her recordings and the parent\'s «يا هند» deleted, «يا يوسف» kept (%s)' % recs)
        ok(await p.evaluate("localStorage.getItem('waha.hasaniya_users_corrupt_backup')") is None, 'unreadable stash that held her data removed')
        stand = await p.evaluate("JSON.parse(localStorage.getItem('hasaniya_v13_users'))[0].name")
        ok(stand == 'سلمى', 'the standalone Hasaniya child untouched')
        await p.goto(HS); await hs_ready(p)
        ok(await p.evaluate("users.map(u=>u.name)") == ['يوسف'], 'Hasaniya opens with the remaining child')
        ok(await p.evaluate("gForm('أحسنتَ','أحسنتِ')") == 'أحسنتَ', 'and addresses him as a boy')
        ok(await p.evaluate("document.body.classList.contains('small-kid')") is False, 'his small mode stays as the parent set it')
        await shot(p, 'h05-boy')
        # a fresh visit: the parent cancels at the PIN, nothing leaves
        got = []
        p.on('download', lambda d: got.append(d))
        await p.evaluate("exportProgress()"); await p.wait_for_selector('#pinPopup.active')
        await p.evaluate("cancelPin()"); await p.wait_for_timeout(1200)
        ok(not got and 'لم يخرج شيء' in await p.inner_text('#toast'), 'cancelled at the PIN: nothing leaves')
        ok(not await p.locator('#kzSheet').count(), 'no consent sheet left behind')
        await p.evaluate("parentEntry()"); await p.wait_for_selector('#pinPopup.active'); await p.fill('#pinInput', '1234'); await p.evaluate("submitPin()")
        await p.wait_for_selector('#parentScreen', state='visible')
        await p.evaluate("printTeacherReport()"); await p.wait_for_selector('#kzSheet')
        ok('تقرير للمعلم عن يوسف' in await p.inner_text('#kzSheet'), 'the printed teacher report asks for consent too')
        await p.locator('#kzSheet button', has_text='إلغاء').click()

        # one service worker for everything, then offline
        await p.goto(URL); await oasis_ready(p)
        reg = await p.evaluate("navigator.serviceWorker.ready.then(r=>r.scope)")
        ok(reg == BASE, 'one service worker for the product (%s)' % reg)
        await p.wait_for_timeout(2500)
        n = await p.evaluate("caches.keys().then(ks=>Promise.all(ks.map(k=>caches.open(k).then(c=>c.keys()).then(a=>[k,a.length]))))")
        ok(len(n) == 1 and n[0][0].startswith('waha-') and n[0][1] > 80, 'everything precached (%s)' % n)
        await p.goto(HS); await hs_ready(p)
        regs = await p.evaluate("navigator.serviceWorker.getRegistrations().then(a=>a.map(r=>r.scope))")
        ok(regs == [BASE], 'the Hasaniya registers no worker of its own (%s)' % regs)
        await ctx.set_offline(True)
        for u, sel in ((URL, '#whoBtn'), (KZ + '#kunuz', '.hello'), (HS, '#kzHome')):
            await p.goto('about:blank'); await p.goto(u); await p.wait_for_selector(sel, timeout=15000)
            ok(True, 'offline: ' + u.replace(BASE, ''))
        await ctx.set_offline(False)

        # the Hasaniya with no family yet sends to the setup and creates nothing
        c2 = await b.new_context(viewport={'width': 390, 'height': 844}); p2 = await c2.new_page()
        p2.on('pageerror', lambda e: ERRS.append('pageerror(2): ' + str(e)))
        await p2.goto(HS); await p2.wait_for_selector('h1')
        ok('/kunuz/index.html' in p2.url, 'no family: the Hasaniya sends to the setup')
        ok(not await p2.evaluate("Object.keys(localStorage).filter(k=>k.indexOf('hasaniya')>=0)"), 'and creates no child of its own')
        await c2.close()
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
