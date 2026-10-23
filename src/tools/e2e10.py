# -*- coding: utf-8 -*-
"""Protection of the children's data (2.3): the content policy of the three pages, gifts that keep only a picture as a picture,
one PIN lock for the three sections, the PIN typed again before anything leaves the device (print included), the parent's session
ending when the child's pages come back, the magazine (approved works only, a hidden name stays hidden, an exported file that asks
nothing of the network), the backup marked done only when made, a teacher's code read once, a recording kept when its page is left,
the oasis microphone stopped with its sheet, the 72-hour reset counted on three days, two open copies sharing their records,
and one recording added once however fast the taps."""
import asyncio, os, sys, json, time, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots10'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8789), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8789/'
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
FAMJS = "JSON.parse(localStorage.getItem('kb-family-v1'))"
WORKSJS = "JSON.parse(localStorage.getItem('kb-works-v1')||'[]')"
# every page records what its content policy refused
WATCH = "addEventListener('securitypolicyviolation', e => { (window.__csp = window.__csp || []).push(e.violatedDirective + ' ' + e.blockedURI); });"

SEED = r"""async (id) => {
  const blob = () => new Blob([new Uint8Array(4000)], {type: 'audio/webm'});
  const open = (name, v, up) => new Promise((res, rej) => { const r = indexedDB.open(name, v); r.onupgradeneeded = () => up(r.result); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const put = (d, st, rows) => new Promise((res, rej) => { const t = d.transaction(st, 'readwrite'); rows.forEach(x => t.objectStore(st).put(x)); t.oncomplete = res; t.onerror = () => rej(t.error); });
  const oa = await open('oasisRec', 3, d => ['rec', 'gift', 'voice'].forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, {keyPath: 'id'}); }));
  await put(oa, 'rec', [{kid: '@' + id, kidName: 'هند', date: '2026-10-20', type: 'audio/webm', notes: [], source: 'local', id: 'r1', kind: 'حديث', ref: 'صحيح البخاري ١',
    text: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', blob: blob(), status: 'approved', approvedBy: 'ولي الأمر'}]);
  oa.close(); return true;
}"""

SEEDKZ = r"""(kid) => {
  const now = Date.now(), base = {kid: kid, type: 'hikma', src: 'text', who: '', notes: [], log: [], created: now, updated: now};
  const W = JSON.parse(localStorage.getItem('kb-works-v1') || '[]');
  W.unshift({...base, id: 'w1', title: 'حكمة أولى', text: 'العلم نور', status: 'approved', approvedAt: now, pub: {fam: true, mag: true}});
  W.unshift({...base, id: 'w2', title: 'مسودة', text: 'لم تعتمد', status: 'sent', pub: {fam: true, mag: true}});
  W.unshift({...base, id: 'w3', title: 'للإذاعة', text: 'للإذاعة فقط', status: 'approved', approvedAt: now, pub: {fam: true, mag: false}});
  W.unshift({...base, id: 'wT', title: 'حكمة للمعلم', text: 'نص', status: 'sent', pub: {fam: true, mag: true}, teacher: {st: 'sent', sentAt: now}});
  localStorage.setItem('kb-works-v1', JSON.stringify(W));
  const F = JSON.parse(localStorage.getItem('kb-family-v1'));
  F.mags = F.mags || []; F.mags.push({id: 'm1', name: 'الندى', no: 1, editor: kid, items: [{w: 'w1'}, {w: 'w2'}, {w: 'w3'}], status: 'sent', created: now});
  localStorage.setItem('kb-family-v1', JSON.stringify(F));
}"""
SET_RESET = r"""(o) => { const F = JSON.parse(localStorage.getItem('kb-family-v1')), now = Date.now();
  F.resetReq = {at: now + o.at, due: now + o.due, days: o.days}; if (o.max) F.resetReq.max = now + o.max;
  localStorage.setItem('kb-family-v1', JSON.stringify(F)); }"""
STUB_PRINT = "(() => { window.__printed = 0; window.print = () => { window.__printed++; }; })()"
ADD_BTN = "(a) => { const v = document.getElementById('view'), b = document.createElement('button'); b.type = 'button'; b.id = 'tBtn'; b.dataset.act = a; b.textContent = a; const o = document.getElementById('tBtn'); if (o) o.remove(); v.appendChild(b); }"

def kb1(obj):
    """a teacher's reply code, as the teacher's page makes it"""
    import base64
    b = base64.b64encode(json.dumps(obj, ensure_ascii=False).encode('utf-8')).decode('ascii')
    h = 0
    for ch in b: h = (h * 31 + ord(ch)) & 0xffffffff
    d, out = '0123456789abcdefghijklmnopqrstuvwxyz', ''
    while True:
        h, r = divmod(h, 36); out = d[r] + out
        if not h: break
    return 'KB1:' + b + ':' + out

async def pin_if_asked(p):
    await p.wait_for_timeout(250)
    if await p.locator('.modal #fpIn').count():
        await p.fill('#fpIn', '1234'); await p.click('.modal [data-m="1"]'); await p.wait_for_timeout(300)

async def kz_parent(p, pin='1234'):
    await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn')
    await p.fill('#pinIn', pin); await p.click('#pinForm button[type=submit]')

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True)
        await ctx.add_init_script(WATCH)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))

        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone')
        await p.wait_for_selector('#kidForm'); await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(500)
        kid = await p.evaluate(FAMJS + ".kids[0].id")

        # ---- the content policy: in the three pages, and nothing it refuses in ordinary use
        for name, url, sel in (('oasis', URL, '#whoBtn'), ('kunuz', KZ + '#parent', '#pinIn'), ('hasaniya', HS, 'body')):
            await p.goto('about:blank'); await p.goto(url); await p.wait_for_selector(sel, state='attached'); await p.wait_for_timeout(1200)
            has = await p.evaluate("!!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')")
            seen = await p.evaluate("window.__csp || []")
            ok(has and not seen, '%s: a content policy, and nothing refused by it (%s)' % (name, seen[:2]))
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn')
        ok(await p.evaluate("!!document.querySelector('script[src=\"../js/android-shim.js\"]')"), 'كنوز البيان loads the Android bridge (its files are saved through it)')

        # ---- a gift keeps only a picture as the sender's picture
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)
        kept = await p.evaluate(r"""async () => {
          const png = 'data:image/png;base64,iVBORw0KGgo=';
          const items = [
            {id: 'g-ok', fromName: 'سلمى', fromPhoto: png, kind: 'حديث', ref: 'ر', text: 'ن', type: 'audio/webm', b64: 'AAAA', date: '2026-10-20'},
            {id: 'g-web', fromName: 'سلمى', fromPhoto: 'https://example.invalid/p.png', kind: 'حديث', ref: 'ر', text: 'ن', type: 'audio/webm', b64: 'AAAA', date: '2026-10-20'},
            {id: 'g-svg', fromName: 'سلمى', fromPhoto: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', kind: 'حديث', ref: 'ر', text: 'ن', type: 'text/html', b64: 'AAAA', date: '2026-10-20'},
            {id: 'bad id!', fromName: 'x', b64: 'AAAA'}];
          const f = new File([JSON.stringify({type: 'gift', items})], 'g.json', {type: 'application/json'});
          await importGiftFile(f, document.createElement('p'));
          const g = await dbAll('gift'); const by = id => g.find(x => x.id === id) || {};
          return {n: g.length, ok: by('g-ok').fromPhoto, web: by('g-web').fromPhoto, svg: by('g-svg').fromPhoto, type: by('g-svg').type};
        }""")
        ok(kept['n'] == 3, 'three gifts kept; an item with a malformed id is skipped (%d)' % kept['n'])
        ok(kept['ok'] == 'data:image/png;base64,iVBORw0KGgo=' and kept['web'] is None and kept['svg'] is None,
           'the sender\'s picture is kept only when it is an embedded PNG, JPEG or WebP picture')
        ok(kept['type'] == 'audio/webm', 'a gift\'s sound type is a sound type')

        # ---- one PIN lock for the three sections
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn')
        for i in range(5):
            await p.fill('#pinIn', '9999'); await p.click('#pinForm button[type=submit]'); await p.wait_for_timeout(150)
        ok('محاولات' in await p.inner_text('#pinErr'), 'كنوز البيان: five wrong PINs lock the entry')
        lock = await p.evaluate("JSON.parse(localStorage.getItem('kb-pin-lock')||'{}')")
        ok(lock.get('until', 0) > time.time() * 1000, 'the lock is kept (it survives a reload)')
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_timeout(300)
        ok(await p.locator('.ph-top').count() == 0, 'even the right PIN waits for the lock')
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(300)
        await p.click('#whoBtn'); await p.click('#ksDad'); await p.wait_for_selector('#pinIn'); await p.fill('#pinIn', '1234'); await p.click('#pinOk'); await p.wait_for_timeout(400)
        ok('محاولات' in await p.inner_text('#pinFb') and await p.evaluate("$('dad').hidden"), 'the oasis keeps the same lock')
        await p.goto('about:blank'); await p.goto(HS); await p.wait_for_timeout(1500)
        ok(await p.evaluate("pinLockState().until > Date.now()"), 'the Hasaniya reads the same lock')
        await p.evaluate("localStorage.removeItem('kb-pin-lock')")

        # ---- the oasis board: leaving it ends the parent's session
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(300)
        await p.click('#whoBtn'); await p.click('#ksDad'); await p.wait_for_selector('#pinIn'); await p.fill('#pinIn', '1234'); await p.click('#pinOk')
        await until(p, "!$('dad').hidden")
        await p.click('#homeBtn'); await p.wait_for_timeout(300); await p.click('#whoBtn'); await p.click('#ksDad'); await p.wait_for_timeout(300)
        ok(await p.locator('#sheet:not([hidden]) #pinIn').count() == 1, 'oasis: back from the parent board, the board asks for the PIN again')
        await p.keyboard.press('Escape')

        # ---- the oasis microphone stops with its sheet
        await p.evaluate("recordFrom('مثل', 'المثل أ', 'النص أ')"); await p.wait_for_selector('#rcMic .micb')
        await p.click('#rcMic .micb'); await until(p, "VX.rec !== null", 5000); await p.wait_for_timeout(600)
        await p.keyboard.press('Escape'); await p.wait_for_timeout(300)
        ok(await p.evaluate("VX.rec === null"), 'oasis: closing the recording sheet with Esc stops the microphone')
        n0 = await p.evaluate("(async () => (await recAll()).length)()")
        await p.evaluate("recordFrom('مثل', 'المثل ب', 'النص ب')"); await p.wait_for_selector('#rcMic .micb')
        await p.click('#rcMic .micb'); await p.wait_for_timeout(300)
        ok(await p.evaluate("(async () => (await recAll()).length)()") == n0, 'and nothing of the first text is saved under the second')
        await p.click('#rcMic .micb'); await p.wait_for_timeout(500); await p.keyboard.press('Escape')

        # ---- كنوز البيان (its code is sealed in one function: everything below goes through its pages, its storage and its files)
        fid = await p.evaluate(FAMJS + ".fid")
        await p.evaluate(SEEDKZ, kid)

        # the PIN again before anything leaves, printing included
        await p.goto('about:blank'); await p.goto(KZ + '#radio'); await p.wait_for_selector('#view h1')
        await p.evaluate(STUB_PRINT); await p.evaluate(ADD_BTN, 'print')
        await p.click('#tBtn'); await p.wait_for_selector('#fpIn')
        await p.click('.modal [data-m="0"]'); await p.wait_for_timeout(200)
        ok(await p.evaluate("window.__printed") == 0, 'print: without the PIN typed now, nothing is printed')
        await p.click('#tBtn'); await p.wait_for_selector('#fpIn'); await p.fill('#fpIn', '0000'); await p.click('.modal [data-m="1"]')
        await p.wait_for_selector('.modal .form-err'); await shot(p, 'r01-fresh-pin')
        ok('غير صحيح' in await p.inner_text('.modal'), 'a wrong PIN is refused in the dialog')
        await p.fill('#fpIn', '1234'); await p.press('#fpIn', 'Enter'); await p.wait_for_timeout(400)
        ok(await p.evaluate("window.__printed") == 1, 'with the PIN typed now (Enter is enough), the page is printed')
        ok((await p.evaluate(FAMJS + ".waLog.slice(-1)[0].name")).startswith('طباعة'), 'and the print is written in the family log')

        # the home button ends the parent's session
        await kz_parent(p); await p.wait_for_selector('.ph-top')
        await p.click('#homeBtn'); await p.wait_for_timeout(300)
        await p.evaluate(ADD_BTN, 'pKids'); await p.click('#tBtn')
        ok(await p.locator('#pinIn').count() == 1, 'after the home button, a parent step asks for the PIN again')

        # the backup is counted only once made
        await kz_parent(p); await p.wait_for_selector('.ph-top'); await p.click('[data-act="pBackup"]'); await p.wait_for_selector('[data-act="backupMake"]')
        await p.evaluate("(() => { window.__cou = URL.createObjectURL; URL.createObjectURL = () => { throw new Error('test'); }; })()")
        await p.click('[data-act="backupMake"]'); await pin_if_asked(p); await p.wait_for_selector('.modal [data-m="1"]')
        if await p.locator('#bkPlain').count(): await p.check('#bkPlain')
        await p.click('.modal [data-m="1"]'); await p.wait_for_timeout(800)
        ok(not await p.evaluate(FAMJS + ".lastBackup"), 'a backup that could not be saved is not counted (the monthly reminder stays)')
        await p.evaluate("(() => { URL.createObjectURL = window.__cou; })()")
        async with p.expect_download() as dl:
            await p.click('[data-act="backupMake"]'); await pin_if_asked(p); await p.wait_for_selector('.modal [data-m="1"]')
            if await p.locator('#bkPlain').count(): await p.check('#bkPlain')
            await p.click('.modal [data-m="1"]')
        bk = json.loads(open(await (await dl.value).path(), encoding='utf-8').read())
        await p.wait_for_timeout(300)
        ok(bk.get('kind') == 'kb-backup' and (await p.evaluate(FAMJS + ".lastBackup") or 0) > 0 and bk['fam'].get('lastBackup'), 'a backup made is counted, in the file too')

        # a teacher's reply code is read once
        code = kb1({'k': 'review', 'w': 'wT', 'f': fid, 'd': 'ok', 'n': 'أحسنتِ', 'tn': 'الأستاذ'})
        await kz_parent(p); await p.wait_for_selector('.ph-top'); await p.click('[data-act="pCode"]'); await p.wait_for_selector('#codeIn')
        await p.fill('#codeIn', code); await p.click('#codeForm button[type=submit]'); await p.wait_for_selector('.modal [data-m="1"]'); await p.click('.modal [data-m="1"]'); await p.wait_for_timeout(300)
        wt = [w for w in await p.evaluate(WORKSJS) if w['id'] == 'wT'][0]
        ok(wt['teacher']['st'] == 'ok' and len(wt['notes']) == 1, 'a teacher\'s reply is read and applied')
        await p.click('[data-act="parent"]'); await p.wait_for_selector('.ph-top'); await p.click('[data-act="pCode"]'); await p.wait_for_selector('#codeIn')
        await p.fill('#codeIn', code); await p.click('#codeForm button[type=submit]'); await p.wait_for_timeout(300)
        ok('من قبل' in await p.inner_text('#codeErr') and len([w for w in await p.evaluate(WORKSJS) if w['id'] == 'wT'][0]['notes']) == 1, 'the same code a second time is refused')

        # the magazine: approved works only; a hidden name stays hidden; the file asks nothing of the network
        await p.click('[data-act="parent"]'); await p.wait_for_selector('[data-act="pMag"][data-id="m1"]'); await p.click('[data-act="pMag"][data-id="m1"]')
        await p.wait_for_selector('[data-act="magExport"]')
        async with p.expect_download() as dl:
            await p.click('[data-act="magExport"]'); await pin_if_asked(p); await p.wait_for_selector('.modal [data-anon]')
            await p.check('.modal [data-anon="%s"]' % kid); await p.check('#cOk'); await p.click('.modal [data-m="1"]')
        html = open(await (await dl.value).path(), encoding='utf-8').read()
        ok('العلم نور' in html and 'لم تعتمد' not in html and 'للإذاعة فقط' not in html, 'the exported issue holds the work approved for the magazines only')
        ok('هند' not in html and 'صديقةٌ صغيرة' in html, 'a name hidden by the parent is hidden in the file (the editor\'s too)')
        ok('Content-Security-Policy' in html and 'fonts.googleapis' not in html and 'https://' not in html.split('</head>')[0],
           'the file carries a policy that loads nothing from outside, and no web fonts')

        # one recording added once, however fast the taps
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.evaluate(SEED, kid)
        await kz_parent(p); await p.wait_for_selector('.ph-top'); await p.click('[data-act="pFrom"]'); await p.wait_for_selector('[data-act="fromAdd"]')
        await p.evaluate("(() => { const b = document.querySelector('[data-act=\"fromAdd\"]'); b.click(); b.click(); b.click(); })()"); await p.wait_for_timeout(1200)
        ok(len([w for w in await p.evaluate(WORKSJS) if (w.get('from') or {}).get('id') == 'r1']) == 1, 'a triple tap adds the recording once')

        # a recording of a work is kept when its page is left
        await p.goto('about:blank'); await p.goto(KZ + '#studio'); await p.wait_for_selector('[data-act="newWork"][data-v="story"]')
        await p.click('[data-act="newWork"][data-v="story"]'); await p.wait_for_selector('[data-act="recStart"]'); await p.click('[data-act="recStart"]')
        await p.wait_for_selector('[data-act="recStop"]'); await p.wait_for_timeout(2500)
        await p.click('#homeBtn'); await p.wait_for_timeout(1500)
        st = [w for w in await p.evaluate(WORKSJS) if w['type'] == 'story']
        ok(len(st) == 1 and st[0].get('audio'), 'leaving the page during a recording keeps it in the work')

        # the 72-hour reset: three days seen, and a clock moved back restarts the wait
        H = 3600 * 1000
        await p.evaluate(SET_RESET, {'at': -80 * H, 'due': -8 * H, 'days': ['2000-1-1']})
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn'); await p.click('[data-act="pinForgot"]'); await p.wait_for_timeout(300)
        ok(await p.locator('[data-act="resetDo"]').count() == 0 and 'أيامٍ مختلفة' in await p.inner_text('#view'),
           'after 72 hours seen on two days only, the new PIN still waits')
        await shot(p, 'r02-reset-days')
        await p.evaluate(SET_RESET, {'at': -80 * H, 'due': -8 * H, 'days': ['2000-1-1', '2000-1-2']})
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn'); await p.click('[data-act="pinForgot"]'); await p.wait_for_timeout(300)
        ok(await p.locator('[data-act="resetDo"]').count() == 1, 'seen on three days, it can be done')
        await p.evaluate(SET_RESET, {'at': -80 * H, 'due': -8 * H, 'days': ['2000-1-1', '2000-1-2'], 'max': 10 * H})
        await p.goto('about:blank'); await p.goto(URL); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(300)
        r = await p.evaluate(FAMJS + ".resetReq")
        ok(r.get('back') == 1 and r['due'] > time.time() * 1000 + 70 * H and len(r['days']) == 1, 'the oasis notices a clock moved back: the wait starts again')
        await p.goto('about:blank'); await p.goto(HS); await p.wait_for_timeout(1500)
        ok(await p.locator('#kzReset').count() == 1, 'the Hasaniya shows the pending request too')
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn'); await p.click('[data-act="pinForgot"]')
        await p.wait_for_selector('[data-act="resetCancel"]'); await p.click('[data-act="resetCancel"]'); await p.wait_for_timeout(300)

        # two open copies: a save in one does not undo the other's change
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn')
        p2 = await ctx.new_page(); await p2.goto(KZ + '#parent'); await p2.wait_for_selector('#pinIn')
        await p.evaluate("(() => { const f = " + FAMJS + "; f.kids[0].name = 'هند الصغيرة'; localStorage.setItem('kb-family-v1', JSON.stringify(f)); })()")
        await p2.wait_for_timeout(300); await p2.click('#kidChip'); await p2.wait_for_selector('[data-act="pickKid"]'); await p2.click('[data-act="pickKid"]'); await p2.wait_for_timeout(500)
        ok(await p.evaluate(FAMJS + ".kids[0].name") == 'هند الصغيرة', 'a save in the other tab keeps this tab\'s change')
        await p2.close()
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
