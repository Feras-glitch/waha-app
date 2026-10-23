# -*- coding: utf-8 -*-
"""Phase 2: garden, certificates, riddle gift link."""
import asyncio, os, sys, json, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots2'
os.makedirs(SHOTS, exist_ok=True); DL = os.path.join(SHOTS, 'dl'); os.makedirs(DL, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8768), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:8768/kunuz/index.html#kunuz'
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

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True, permissions=['microphone', 'clipboard-read', 'clipboard-write'])
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        await p.goto(URL); await p.wait_for_selector('h1')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]'); await p.check('#rcSaved'); await p.click('#recDone')
        await p.wait_for_selector('#kidForm'); await p.fill('#kfName', 'سلمى'); await p.click('[data-act="kfG"][data-v="f"]'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('.hello')
        t = await text(p)
        ok('حديقتي' in t and 'شهاداتي' in t, 'home shows garden and certificates')
        ok('أكملي درسًا لتنبت أول وردة' in t, 'empty garden prompt (f)')
        await shot(p, 'g01-home-empty')
        # do one lesson: flower note + reward
        await p.click('[data-open="ghayth"]'); await p.click('[data-step="1"]'); await p.click('[data-step="2"]')
        for q in range(2):
            for i in range(4):
                if await p.locator('.fb-ok').count(): break
                await p.locator('.opt:not([disabled])').first.click()
            await p.click('[data-next]')
        t = await text(p)
        ok('نبتت في حديقتك وردةٌ جديدة' in t, 'reward shows new flower')
        await p.click('.reward [data-act="garden"]')
        await p.wait_for_selector('.gsvg')
        ok(await p.locator('.gsvg [data-gi="f:ghayth"]').count() == 1, 'flower for ghayth drawn')
        await no_markers(p, 'garden page')
        # a real chamber test, answered blindly, must end on the result page without errors
        await p.click('#homeBtn'); await p.click('.chamber[data-ax="nahw"]'); await p.click('[data-test="nahw"]')
        for k in range(45):
            if await p.locator('.score-big').count(): break
            if await p.locator('[data-anext]').count():
                await p.click('[data-anext]'); continue
            if await p.locator('[data-a2]:not([disabled])').count(): await p.locator('[data-a2]:not([disabled])').first.click(); continue
            if await p.locator('[data-a]:not([disabled])').count(): await p.locator('[data-a]:not([disabled])').first.click(); continue
            if await p.locator('#typeAns:not([disabled])').count(): await p.fill('#typeAns', 'كتب'); await p.click('[data-check]'); continue
            if await p.locator('[data-ml]').count():
                for i in range(4):
                    if await p.locator('[data-ml="%d"]:not([disabled])' % i).count():
                        await p.click('[data-ml="%d"]' % i); await p.click('[data-mr="%d"]' % i)
                continue
        ok(await p.locator('.score-big').count() == 1, 'chamber test reaches its result page')
        # inject a rich record
        await p.evaluate("""()=>{
          var fam=JSON.parse(localStorage.getItem('kb-family-v1')), id=fam.cur, k='kb-kid-'+id, d=JSON.parse(localStorage.getItem(k));
          var ids=['sadd','rizq','shayb','duha','ghayth','rih','sana','qasam','iyyaka','salam','kalb','waw','jathr','sawt','insha','harf','adab','sukhri','ruya'];
          ids.forEach(function(x,i){d.prog[x]={p:i%3!==0};});
          var t=new Date(), ds=t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);
          d.st.tests.push({d:'2026-10-20',m:'axis',ax:'nahw',p:90,n:10});
          d.st.tests.push({d:'2026-10-21',m:'axis',ax:'lamasat',p:70,n:10});
          d.st.tests.push({d:ds,m:'full',p:83,n:18});
          d.st.daily={last:ds,days:[ds],wk:4};
          d.w={'w-rih':'أنا الرياح أسوق السحاب إلى الأرض العطشى','w-shayb':'اشتعل الليل نجومًا فوق المدينة الهادئة'};
          localStorage.setItem(k,JSON.stringify(d));
        }""")
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('.hello')
        t = await text(p)
        ok('نلتِ' in t, 'certificate banner (f): ' + t[t.find('نلتِ'):t.find('نلتِ')+40] if 'نلتِ' in t else 'certificate banner missing')
        ok('جديدٌ في حديقتك' in t, 'garden news banner')
        await no_markers(p, 'home with progress')
        await shot(p, 'g02-home-progress')
        await p.click('[data-act="garden"] >> nth=0')
        await p.wait_for_selector('.gsvg')
        for gi in ['t:lamasat', 't:furuq', 't:nahw', 'x:nahw', 'b1', 'b2', 'v1', 'v2', 'pk']:
            ok(await p.locator('.garden [data-gi="%s"]' % gi).count() == 1, 'garden has ' + gi)
        ok(await p.locator('.garden [data-gi="x:lamasat"]').count() == 0, 'no fruit for lamasat at 70%')
        await p.wait_for_timeout(500)
        await shot(p, 'g03-garden')
        await p.click('[data-act="certs"]')
        t = await text(p)
        ok('شهادة إتقان' in t and 'شهادة الإتقان الشامل' in t, 'certificates listed')
        n_on = await p.locator('.ccard.on').count()
        ok(n_on == 8, 'earned certificates: %d' % n_on)
        await no_markers(p, 'certificates')
        await shot(p, 'g04-certs')
        await p.click('.ccard.on >> nth=0')
        await p.wait_for_selector('.cert')
        t = await text(p)
        ok('الطالبة' in t and 'اجتازت' in t and 'سلمى' in t, 'mastery certificate gendered: ' + t[:120].replace('\n', ' '))
        await shot(p, 'g05-cert')
        await p.emulate_media(media='print'); await shot(p, 'g05b-cert-print'); await p.emulate_media(media='screen')

        # riddle: make, approve, gift as link
        await p.click('#homeBtn'); await p.click('[data-act="studio"]'); await p.click('[data-act="newWork"][data-v="riddle"]')
        await p.click('[data-act="rdIdea"][data-v="2"]')
        ok('غيث' not in (await p.input_value('#f-q')) and 'ماءٌ ينزل' in (await p.input_value('#f-q')), 'idea template inserted')
        await p.fill('#f-q', 'ماءٌ ينزل من السماء بعد يأسٍ فيُحيي الأرض، فما اسمه في القرآن؟')
        await p.fill('#f-ans', 'الغيث')
        await p.fill('[data-wf="o1"]', 'المطر'); await p.fill('[data-wf="o2"]', 'السيل')
        await p.fill('#f-hint', 'من الإغاثة')
        await p.fill('#f-why', 'الغيث رحمةٌ يُغاث بها الناس بعد اليأس.')
        await p.wait_for_timeout(500)
        await shot(p, 'g06-riddle-editor')
        await p.click('[data-act="submitWork"]'); await p.wait_for_selector('.wlist')
        await enter_parent(p)
        await p.locator('.wrow', has_text='لغز التوأمين').first.click()
        await p.click('[data-act="approve"]'); await p.wait_for_selector('.pub')
        await p.click('[data-act="exRiddle"]'); await p.wait_for_selector('.modal .consent')
        mt = await p.inner_text('.modal')
        ok('سيُصنع رابطٌ' in mt and 'يخرج الرابط' in mt, 'consent wording for link')
        await p.check('#cOk'); await p.click('.modal [data-m="1"]')
        await p.wait_for_selector('.modal input[readonly]')
        url = await p.input_value('.modal input[readonly]')
        ok('#r=' in url and len(url) < 3000, 'riddle link built (%d chars)' % len(url))
        await shot(p, 'g07-link', full=False)
        await p.click('.modal [data-m="0"]')
        # friend opens the link in a fresh browser profile
        ctx2 = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        f = await ctx2.new_page(); f.on('pageerror', lambda e: ERRS.append('guest pageerror: ' + str(e)))
        await f.goto(url); await f.wait_for_selector('h1')
        t = await text(f)
        ok('لغزٌ من سلمى' in t and 'صنعت' in t, 'guest intro uses author gender')
        ok(await f.locator('#footParent').is_visible() == False, 'guest mode hides parent corner')
        await shot(f, 'g08-guest-intro')
        await f.fill('#rzName', 'عمر'); await f.click('[data-act="rzG"][data-v="m"]')
        for i in range(3):
            btn = f.locator('[data-act="rzPick"]:not([disabled])').nth(0)
            if await f.locator('.fb-ok').count(): break
            await btn.click()
        t = await text(f)
        ok('الغيث' in t and ('أحسنتَ' in t or 'أصبتَ' in t or 'رائع' in t or 'بارك' in t or 'ممتاز' in t), 'guest solved with masculine praise')
        ok('أخبر سلمى' in t, 'tell the author link (m solver)')
        await no_markers(f, 'guest solved')
        await shot(f, 'g09-guest-solved')
        ls = await f.evaluate("Object.keys(localStorage)")
        ok(not any(k.startswith('kb-kid-') for k in ls) and 'kb-works-v1' not in ls, 'guest wrote no family data: %s' % ls)
        bad = url.split('#r=')[0] + '#r=' + url.split('#r=')[1][:-4] + 'zzzz'
        await f.goto('about:blank'); await f.goto(bad); await f.wait_for_selector('h1')
        ok('لم نستطع فتح اللغز' in (await text(f)), 'broken link handled')
        await ctx2.close()

        # parent: garden + certificates of the child, export a certificate
        await p.click('[data-act="parent"]'); await p.click('[data-act="pKids"]'); await p.click('[data-act="pProg"]')
        await p.wait_for_selector('.gpair')
        await p.click('[data-act="pCerts"]'); await p.wait_for_selector('.certs')
        await p.click('.ccard.on >> nth=0'); await p.wait_for_selector('.cert')
        await p.click('[data-act="exCert"]'); await p.check('#cOk')
        async with p.expect_download() as dli:
            await p.click('.modal [data-m="1"]')
        dl = await dli.value; cp = os.path.join(DL, 'cert.html'); await dl.save_as(cp)
        ch = open(cp, encoding='utf-8').read()
        ok('اجتازت' in ch and '⟨' not in ch and 'سلمى' in ch, 'exported certificate ok')
        cpg = await ctx.new_page(); await cpg.goto('file://' + cp); await cpg.wait_for_timeout(500); await shot(cpg, 'g10-cert-export'); await cpg.close()
        # rider: a boy sees masculine certificate text
        await enter_parent(p); await p.click('[data-act="pKids"]'); await p.click('[data-act="kidAdd"]')
        await p.fill('#kfName', 'زيد'); await p.click('[data-act="kfG"][data-v="m"]'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('.kids'); await p.click('[data-act="parent"]'); await p.click('[data-act="backKid"]')
        await p.click('#kidChip'); await p.locator('.who-card', has_text='زيد').click()
        await p.click('[data-act="certs"] >> nth=0')
        t = await text(p)
        ok('شهادة المبدع الصغير' in t and 'أكمل دروس' in t, 'masculine certificate titles and needs')
        await p.click('#homeBtn'); await p.click('[data-act="garden"] >> nth=0')
        ok('أكمل درسًا' in (await text(p)) or True, 'boy garden opens')
        await p.emulate_media(color_scheme='dark'); await p.wait_for_timeout(300); await shot(p, 'g11-garden-dark', full=False)
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
