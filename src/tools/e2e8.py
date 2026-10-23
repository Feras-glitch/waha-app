# -*- coding: utf-8 -*-
"""One app, not three: the daily trip draws from «كنوز البيان» and the Hasaniya; the child's scene counts all three;
misses in the other sections come back in the trip; the parent's daily line, approvals and Friday report cover all three;
the monthly measure (fixed questions, no teaching) and its curve; «كنوز البيان» hidden under eight unless the parent opens it."""
import asyncio, os, sys, json, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots8'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8786), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8786/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
async def add_kid(p, name, g, by):
    await p.wait_for_selector('#kidForm'); await p.fill('#kfName', name); await p.click('[data-act="kfG"][data-v="%s"]' % g)
    await p.select_option('#kfBy', str(by)); await p.click('#kidForm button[type=submit]')
async def oasis(p, who=None):
    await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(600)
    if who:
        await p.click('#whoBtn'); await p.locator('#sheet .chip2', has_text=who).click(); await p.wait_for_timeout(400)
async def corner(p):
    await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn, .ph-top')
    if await p.locator('#pinIn').count():
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
async def ready_kid(p):
    await p.evaluate("store.set('cmp:'+kid,{kind:'camel',name:'ناجي'}); store.set('planted:'+kid, Date.now()); go('home')"); await p.wait_for_timeout(400)
FAMJS = "JSON.parse(localStorage.getItem('kb-family-v1'))"
STUDY = """(ids)=>{ ids.forEach((id, i) => { const k='kb-kid-'+id; const d=JSON.parse(localStorage.getItem(k)||'{}'); d.prog=d.prog||{};
    if (i === 0){ d.prog.sadd={p:true,d:Date.now()}; d.prog.rih={p:false,d:Date.now()}; } localStorage.setItem(k,JSON.stringify(d));
    const us=JSON.parse(localStorage.getItem('waha.hasaniya_v13_users')||'[]'); let u=us.find(x=>x.id==='kz_'+id); if(!u){u={id:'kz_'+id,name:'',state:{}};us.push(u);}
    u.state=Object.assign({stationStatus:{},stampDates:{},verseStats:{},activeDays:[]},u.state||{}); u.state.stationStatus.s1='completed';
    u.state.verseStats.s2v4={correct:1,wrong:0,lastWrong:0,lastCorrect:Date.now()}; localStorage.setItem('waha.hasaniya_v13_users',JSON.stringify(us)); }); }"""

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))
        p.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))

        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone')
        await add_kid(p, 'هند', 'f', 2016); await p.wait_for_selector('#whoBtn')
        await corner(p); await p.click('[data-act="pKids"]'); await p.click('[data-act="kidAdd"]'); await add_kid(p, 'يوسف', 'm', 2020)
        ids = await p.evaluate(FAMJS + ".kids.map(k=>k.id)")

        # ---- one daily trip from the three sections, asking only what was studied there
        await oasis(p, 'هند'); await ready_kid(p)
        none = await p.evaluate("Array.from({length:8},()=>buildTrip(false).map(c=>c.g))")
        ok(all('kz' not in t and 'hsq' not in t for t in none), 'nothing studied in the chambers or the Hasaniya: no question from them')
        await p.evaluate(STUDY, ids); await oasis(p, 'هند'); await ready_kid(p)
        hs = await p.evaluate("POOL.hsq()")
        ok(hs and all(x.startswith('s1v') or x.startswith('s2v4|') for x in hs), 'the Hasaniya questions come from the completed station and the answered verse (%s)' % hs[:4])
        ok(await p.evaluate("POOL.kz().every(x => ['sadd', 'rih'].includes(x.split('|')[0]))"), 'the chamber questions come from lessons whose gem was earned')
        trips = await p.evaluate("Array.from({length:12},()=>buildTrip(false).map(c=>c.g==='learn'?'learn:'+String(c.id).split('|')[0]:c.g))")
        ok(all('kz' in t for t in trips) and all('hsq' in t for t in trips), 'every trip of a ten-year-old has a chamber question and a Hasaniya question')
        ok(all(t.index('learn:kz') < t.index('kz') for t in trips if 'learn:kz' in t), 'a new chamber question comes after its lesson')
        kzq = await p.evaluate("(()=>{const c=buildTrip(false).find(c=>c.g==='kz'); return c&&{html:c.html,why:c.why,q:c.q};})()")
        ok(kzq and '💎' in kzq['html'] and kzq['why'], 'chamber question carries its lesson title and its «why»')
        ok(await p.locator('.ktile', has_text='كنوز البيان').count() == 1, 'chambers tile for a ten-year-old')
        await oasis(p, 'يوسف'); await ready_kid(p)
        small = await p.evaluate("Array.from({length:8},()=>buildTrip(false).map(c=>c.g))")
        ok(all('kz' not in t for t in small) and all('hsq' in t for t in small), 'a six-year-old: Hasaniya in every trip, no chambers')
        ok(await p.locator('.ktile', has_text='كنوز البيان').count() == 0, 'no chambers tile under eight')
        await p.evaluate("store.set(`libOpen:${kid}`, true); go('home')"); await p.wait_for_timeout(300)
        ok(await p.locator('.ktile', has_text='كنوز البيان').count() == 1, '…unless the parent opens it')
        await p.evaluate("store.set(`libOpen:${kid}`, false)")

        # ---- what the other sections hold shows in the oasis
        await p.evaluate("""(ids)=>{ const k='kb-kid-'+ids[0]; const d=JSON.parse(localStorage.getItem(k)||'{}'); d.prog=d.prog||{};
            d.prog.sadd={p:true,d:Date.now()}; d.prog.rih={p:false,d:Date.now()-9*864e5}; d.qmiss={'sadd|0':Date.now()}; localStorage.setItem(k,JSON.stringify(d));
            const us=JSON.parse(localStorage.getItem('waha.hasaniya_v13_users')||'[]');
            let u=us.find(x=>x.id==='kz_'+ids[0]); if(!u){u={id:'kz_'+ids[0],name:'هند',state:{}};us.push(u);}
            u.state=Object.assign({stationStatus:{},stampDates:{},verseStats:{},activeDays:[]},u.state||{});
            u.state.stationStatus.s1='completed'; u.state.stampDates.s1=Date.now(); u.state.points=40;
            u.state.verseStats.s1v1={correct:0,wrong:1,lastWrong:Date.now(),lastCorrect:0}; localStorage.setItem('waha.hasaniya_v13_users',JSON.stringify(us));
            const w=JSON.parse(localStorage.getItem('kb-works-v1')||'[]'); w.push({id:'w1',kid:ids[0],type:'read',status:'sent',title:'قراءة'}); localStorage.setItem('kb-works-v1',JSON.stringify(w)); }""", ids)
        await oasis(p, 'هند')
        cnt = await p.inner_text('.kscene .cnt')
        ok('💎 2' in cnt and '🐪 1' in cnt, 'the scene counts gems and Hasaniya stations (%s)' % cnt)
        await shot(p, 'u01-scene')
        # misses elsewhere come back here
        n = await p.evaluate("importMisses()")
        mk = await p.evaluate("[mget('kz','sadd|0'), mget('hsq','s1v1|0'), seen('kz').includes('sadd|0')]")
        ok(n >= 2 and mk[0]['wrong'] == 1 and mk[1]['wrong'] == 1 and mk[2], 'a miss in the chambers and in the Hasaniya enters the oasis review')
        ok(await p.evaluate("importMisses()") == 0, 'each miss is taken once')
        picks = await p.evaluate("Array.from({length:30},()=>genPick('kz', new Set()).id).filter(x=>x==='sadd|0').length")
        ok(picks >= 10, 'the missed chamber question is favoured in the trip (%d/30)' % picks)
        # a real miss inside a chamber lesson is recorded
        right = await p.evaluate("DATA.kunuz.lessons.filter(l=>l.ax==='furuq')[0].quiz.map(q=>kzPlain(q.o[0]))")
        await p.goto('about:blank'); await p.goto(KZ + '#kunuz'); await p.wait_for_selector('.hello')
        await p.click('.chamber[data-ax="furuq"]'); await p.wait_for_selector('.lesson-card'); await p.locator('.lesson-card').first.click()
        await p.wait_for_selector('[data-step="1"]'); await p.click('[data-step="1"]'); await p.wait_for_selector('[data-step="2"]'); await p.click('[data-step="2"]')
        for _ in range(8):
            if await p.locator('.opt.wrong').count(): break
            nxt = p.locator('[data-next]')
            if await nxt.count(): await nxt.click(); await p.wait_for_timeout(150); continue
            opts = p.locator('.opt:not([disabled])'); n_ = await opts.count()
            if not n_: break
            wrong = [i for i in range(n_) if (await opts.nth(i).inner_text()).strip() not in right]
            await opts.nth(wrong[0] if wrong else 0).click(); await p.wait_for_timeout(150)
        qm = await p.evaluate("(ids)=>Object.keys((JSON.parse(localStorage.getItem('kb-kid-'+ids[0]))||{}).qmiss||{})", ids)
        ok(any(not k.startswith('sadd') for k in qm), 'a wrong answer in a chamber lesson is kept for the trip (%s)' % qm)

        # ---- the parent: one daily line, one approvals summary
        await oasis(p, 'هند')
        await p.click('#whoBtn'); await p.click('#ksDad'); await p.wait_for_selector('#pinIn'); await p.fill('#pinIn', '1234'); await p.click('#pinOk')
        await p.wait_for_selector('#ddBody'); await p.wait_for_timeout(600)
        t = await p.inner_text('#ddBody')
        ok('💎 كنوز البيان: «' in t and '🐪 الحسنية:' in t and 'ختمت محطة' in t, 'daily line covers the chambers and the Hasaniya')
        ok('بانتظار اعتمادك' in t and 'في «كنوز البيان»' in t, 'one place shows what waits for approval')
        await shot(p, 'u02-today', True)

        # ---- monthly measure: fixed questions, no teaching, a curve for the parent
        await p.evaluate("store.set(`tripsDone:${kid}`, 1); store.set(`trip:${kid}:${today()}`, {v:TRIP_V,cards:[],i:0,res:[],done:true}); LIB=false; go('kid')"); await p.wait_for_timeout(500)
        ok(await p.locator('#msGo').count() == 1, "the measure appears once the day's trip is done")
        form1 = await p.evaluate("msForm().map(x=>x.g+'|'+x.id)")
        ok(len(form1) == 12 and len({x.split('|')[0] for x in form1}) == 6, 'twelve questions from six games for a ten-year-old (%s)' % sorted({x.split('|')[0] for x in form1}))
        before = await p.evaluate("(f)=>f.map(x=>{const [g,...r]=x.split('|'); return JSON.stringify(mget(g, r.join('|')));})", form1)
        await p.click('#msGo'); await p.wait_for_selector('#kidMs .opt')
        await shot(p, 'u03-measure')
        for i in range(12):
            await p.wait_for_selector('#kidMs .opt:not([disabled]), #kidMs .bigplay')
            if await p.locator('#kidMs .bigplay').count(): break
            if i % 3 == 0: await p.locator('#kidMs .tiny', has_text='لا أعرف').click()
            else: await p.locator('#kidMs .opt').first.click()
            await p.wait_for_timeout(550)
        await p.wait_for_selector('#kidMs .bigplay')
        h = await p.evaluate("msHistory()")
        ok(len(h) == 1 and h[0]['n'] == 12 and 0 <= h[0]['ok'] <= 8, 'measure recorded (%s/%s)' % (h and h[0]['ok'], h and h[0]['n']))
        after = await p.evaluate("(f)=>f.map(x=>{const [g,...r]=x.split('|'); return JSON.stringify(mget(g, r.join('|')));})", form1)
        ok(before == after, 'the measure leaves the mastery records untouched')
        await shot(p, 'u04-measure-end')
        await p.evaluate("go('kid')"); await p.wait_for_timeout(300)
        ok(await p.locator('#msGo').count() == 0, 'not again before thirty days')
        await p.evaluate("(()=>{const h=msHistory(); h[0].day-=31; h[0].date='2026-09-20'; store.set(`ms:${kid}`,h); go('kid');})()"); await p.wait_for_timeout(300)
        ok(await p.locator('#msGo').count() == 1, 'due again after thirty days')
        ok(await p.evaluate("msForm().map(x=>x.g+'|'+x.id)") == form1, 'the same questions every month')
        await p.click('#msGo')
        for i in range(12):
            await p.wait_for_selector('#kidMs .opt:not([disabled]), #kidMs .bigplay')
            if await p.locator('#kidMs .bigplay').count(): break
            await p.evaluate("(()=>{const c=[...document.querySelectorAll('#kidMs .opt')]; const q=GEN[MS.items[MS.i].g](MS.items[MS.i].id); const r=c.find(b=>b.textContent===q.a); (r||c[0]).click();})()")
            await p.wait_for_timeout(550)
        await p.wait_for_selector('#kidMs .bigplay')
        h = await p.evaluate("msHistory()")
        ok(len(h) == 2 and h[1]['ok'] > h[0]['ok'], 'second measure higher (%s → %s)' % (h[0]['ok'], h[1]['ok']))
        ok('أكثر من المرة الماضية' in await p.inner_text('#kidMs'), 'the child hears the progress (girl: «أجبتِ»)' if 'أجبتِ' in await p.inner_text('#kidMs') else 'progress message')
        # parent sees the curve and the first/last table; the Friday report mentions it
        # the parent's session ended when the oasis went back to the child's pages, so the board asks for the PIN again
        await p.click('#whoBtn'); await p.click('#ksDad'); await p.wait_for_selector('#sheet:not([hidden]) #pinIn')
        await p.fill('#pinIn', '1234'); await p.click('#pinOk'); await p.wait_for_selector('#ddTabs')
        await p.locator('#ddTabs button', has_text='التقدّم').click(); await p.wait_for_timeout(400)
        t = await p.inner_text('#ddBody')
        ok('قياس الشهر' in t and 'أول قياس' in t and 'كنوز البيان' in t, 'parent sees the measure curve and the sections')
        await shot(p, 'u05-parent-measure', True)
        await p.locator('#ddTabs button', has_text='تقرير الجمعة').click(); await p.wait_for_timeout(600)
        wk = await p.input_value('#wkText')
        ok('قياس الشهر:' in wk and '💎 كنوز البيان' in wk and '🐪 الحسنية' in wk, 'the Friday report covers the measure and the three sections')
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
