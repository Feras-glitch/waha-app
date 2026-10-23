# -*- coding: utf-8 -*-
"""Recordings from the oasis and the Hasaniya enter «إذاعة الباكورة» and the magazines only when the parent adds them:
what is offered (approved oasis recordings, the child's Hasaniya verses; never pending, private, imported or the narrator's),
what they become (a Quran recitation → «قراءتي», radio only; the rest → «بيتٌ وحكمة», radio and magazines), and that adding is
done once."""
import asyncio, os, sys, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots9'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8788), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8788/'
URL, KZ = BASE + 'index.html', BASE + 'kunuz/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
FAMJS = "JSON.parse(localStorage.getItem('kb-family-v1'))"
WORKSJS = "JSON.parse(localStorage.getItem('kb-works-v1')||'[]')"

SEED = r"""async (id) => {
  const blob = () => new Blob([new Uint8Array(4000)], {type: 'audio/webm'});
  const open = (name, v, up) => new Promise((res, rej) => { const r = indexedDB.open(name, v); r.onupgradeneeded = () => up(r.result); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const put = (d, st, rows) => new Promise((res, rej) => { const t = d.transaction(st, 'readwrite'); rows.forEach(x => t.objectStore(st).put(x)); t.oncomplete = res; t.onerror = () => rej(t.error); });
  const oa = await open('oasisRec', 3, d => ['rec', 'gift', 'voice'].forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, {keyPath: 'id'}); }));
  const base = {kid: '@' + id, kidName: 'هند', date: '2026-10-20', type: 'audio/webm', notes: [], source: 'local'};
  await put(oa, 'rec', [
    {...base, id: 'r1', kind: 'حديث', ref: 'صحيح البخاري ١', text: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', blob: blob(), status: 'approved', approvedBy: 'ولي الأمر'},
    {...base, id: 'r2', kind: 'آية', ref: 'الضحى 93:1', text: 'وَالضُّحَى', blob: blob(), status: 'approved', approvedBy: 'ولي الأمر'},
    {...base, id: 'r3', kind: 'مثل', ref: 'مثل', text: 'من جدّ وجد', blob: blob(), status: 'pending'},
    {...base, id: 'r4', kind: 'أخبرني', ref: 'اليوم', text: 'سرّ', blob: blob(), status: 'approved'},
    {...base, id: 'r5', kind: 'حديث', ref: 'من المعلم', text: 'نص', blob: blob(), status: 'approved', source: 'import'},
    {...base, id: 'r6', kind: 'بيت', ref: 'صورة', text: '', blob: new Blob([new Uint8Array(4000)], {type: 'image/png'}), type: 'image/png', status: 'approved'},
  ]);
  oa.close();
  const hs = await open('waha.hasaniya-rec', 1, d => d.createObjectStore('recs', {keyPath: 'key'}));
  await put(hs, 'recs', [
    {key: 'kz_' + id + '|s1v1', verseId: 's1v1', kind: 'verse', uid: 'kz_' + id, mime: 'audio/webm', blob: blob(), at: Date.parse('2026-10-21')},
    {key: 'author|s1v1', verseId: 's1v1', kind: 'verse', uid: 'author', mime: 'audio/webm', blob: blob(), at: 1},
    {key: 'kz_someoneelse|s1v2', verseId: 's1v2', kind: 'verse', uid: 'kz_someoneelse', mime: 'audio/webm', blob: blob(), at: 1},
  ]);
  hs.close();
  return true;
}"""

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))

        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone')
        await p.wait_for_selector('#kidForm'); await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(500)
        kid = await p.evaluate(FAMJS + ".kids[0].id")
        await p.evaluate(SEED, kid)

        # the parent's page lists what may come in, and nothing else
        await p.goto('about:blank'); await p.goto(KZ + '#parent'); await p.wait_for_selector('#pinIn')
        await p.fill('#pinIn', '1234'); await p.click('#pinForm button[type=submit]'); await p.wait_for_selector('.ph-top')
        await p.click('[data-act="pFrom"]'); await p.wait_for_selector('.from-row')
        rows = await p.locator('.from-row').all_inner_texts()
        ok(len(rows) == 3, 'three recordings offered: the approved hadith and verse of the oasis, the Hasaniya verse (%d)' % len(rows))
        allt = '\n'.join(rows)
        ok('من جدّ وجد' not in allt and 'سرّ' not in allt and 'من المعلم' not in allt, 'not the pending, the private or the imported ones')
        ok('الْحَمْدُ لِلْمَحْمُودِ' in allt and 'المقدمة' in allt, 'the Hasaniya verse carries its text and station')
        ok(sum('الحسنية' in r for r in rows) == 1, 'not the narrator\'s recording, nor another family\'s child')
        qrow = [r for r in rows if 'الضحى' in r]
        ok(qrow and 'لا يدخل المجلّات' in qrow[0], 'the Quran recitation says it is for the radio only')
        ok(await p.locator('.from-row audio').count() == 3, 'each can be heard before adding')
        await shot(p, 'q01-from-page', True)
        ok(await p.evaluate("document.documentElement.scrollWidth <= innerWidth"), 'no horizontal scroll at 390px')

        # adding: all at once, and only once
        await p.click('[data-act="fromAll"]'); await p.wait_for_function("document.querySelectorAll('[data-act=\"fromAdd\"]').length===0 && document.querySelectorAll('.from-row').length===3")
        ws = await p.evaluate(WORKSJS)
        ok(len(ws) == 3 and all(w['status'] == 'approved' and w['kid'] == kid and w.get('audio') for w in ws), 'three approved works, each with its own copy of the sound')
        q = [w for w in ws if w['from']['id'] == 'r2']
        ok(q and q[0]['type'] == 'read' and q[0]['pub'] == {'fam': True, 'mag': False}, 'the recitation is «قراءتي», radio only')
        h = [w for w in ws if w['from']['src'] == 'hasaniya']
        ok(h and h[0]['type'] == 'hikma' and h[0]['pub']['mag'] and 'المنظومة الحسنية' in h[0]['who'], 'the Hasaniya verse is «بيتٌ وحكمة» with its source')
        ok(await p.locator('[data-act="fromAll"]').count() == 0, 'nothing left to add')
        await p.click('[data-act="parent"]'); await p.wait_for_selector('.ph-top'); await p.click('[data-act="pFrom"]'); await p.wait_for_selector('.from-row')
        ok(await p.locator('[data-act="fromAdd"]').count() == 0 and len(await p.evaluate(WORKSJS)) == 3, 'opening the page again adds nothing twice')
        await shot(p, 'q02-added')

        # the radio at home
        await p.goto('about:blank'); await p.goto(KZ + '#radio'); await p.wait_for_selector('.pl-row')
        rr = await p.locator('.pl-row').all_inner_texts()
        ok(len(rr) == 3, 'three recordings in «إذاعة الباكورة»')
        ok(sum('من الواحة' in r for r in rr) == 2 and sum('من الحسنية' in r for r in rr) == 1, 'each says where it came from')
        await shot(p, 'q03-radio')

        # the magazine: the hadith and the verse, not the recitation
        await p.goto('about:blank'); await p.goto(KZ + '#mags'); await p.wait_for_selector('[data-act="magNew"]')
        await p.click('[data-act="magNew"]'); await p.wait_for_selector('#magForm'); await p.click('#magForm button[type=submit]')
        await p.wait_for_selector('[data-act="magAdd"][data-v="hikma"]'); await p.click('[data-act="magAdd"][data-v="hikma"]')
        await p.wait_for_selector('.modal .pick-list')
        picks = await p.locator('.modal .pick-list .tog').all_inner_texts()
        ok(len(picks) == 2 and not any('الضحى' in x for x in picks), 'the magazine offers the hadith and the Hasaniya verse, not the recitation')
        for cb in await p.locator('.modal .pick-list input').all(): await cb.check()
        await p.click('.modal [data-m="1"]'); await p.wait_for_timeout(400)
        m = await p.evaluate(FAMJS + ".mags[0]")
        ok(len(m['items']) == 2, 'both went into the magazine')
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
