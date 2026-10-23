# -*- coding: utf-8 -*-
"""Answers, address and options (2.3, second part): a word of the Quran typed in today's spelling is right, a girl is spoken to as
a girl in the oasis data, in «كنوز البيان» and in the Hasaniya's own labels, an option is found by its own text, the same option
is never offered twice, a family challenge asks a question once, the relay keeps its turns when a child is added, the daily
missions can be played, an unknown birth year plays with choices, and the child's home is drawn once however fast the taps."""
import asyncio, os, sys, json, re, functools, http.server, threading
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots11'
os.makedirs(SHOTS, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8790), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8790/'
URL, KZ, HS = BASE + 'index.html', BASE + 'kunuz/index.html', BASE + 'hasaniya/index.html'
ERRS = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: ERRS.append(m)
async def shot(p, n, full=False): await p.screenshot(path=os.path.join(SHOTS, n + '.png'), full_page=full)
async def until(p, js, timeout=10000):
    """wait_for_function evaluates its text with eval, which the pages' content policy refuses; this asks the page instead"""
    for _ in range(int(timeout / 100)):
        if await p.evaluate(js): return
        await asyncio.sleep(0.1)
    raise TimeoutError('still false: ' + js)
FAMJS = "JSON.parse(localStorage.getItem('kb-family-v1'))"
MASC = r"[ء-ي]+تَ(?![ء-يً-ْ])"

async def oasis(p, q=''):
    await p.goto('about:blank'); await p.goto(URL + q); await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(400)

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        p = await ctx.new_page()
        p.on('pageerror', lambda e: ERRS.append('pageerror: ' + str(e)) or print('PAGEERROR', e))

        await p.goto(URL); await p.wait_for_selector('[data-act="setupPin"]')
        await p.click('[data-act="setupPin"]'); await p.fill('#p1', '1234'); await p.fill('#p2', '1234'); await p.click('#setPinForm button[type=submit]')
        await p.check('#rcSaved'); await p.click('#recDone')
        await p.wait_for_selector('#kidForm'); await p.fill('#kfName', 'هند'); await p.click('[data-act="kfG"][data-v="f"]')
        await p.select_option('#kfBy', '2016'); await p.click('#kidForm button[type=submit]')
        await p.wait_for_selector('#whoBtn'); await p.wait_for_timeout(500)

        # ---- a word of the Quran typed in today's spelling
        g = await p.evaluate("""() => [['الهدى', 'ٱلْهُدَىٰٓ'], ['آمنوا', 'ءَامَنُوٓا۟'], ['قرآن', 'قُرْءَانٌ'], ['هذا', 'هَٰذَا'], ['الرحمن', 'ٱلرَّحْمَٰنِ'],
          ['ذكراها', 'ذِكْرَىٰهَآ'], ['يسألون', 'يَسْـَٔلُونَ'], ['عبادي', 'عِبَٰدِى'], ['ورسالاته', 'وَرِسَٰلَٰتِهِۦ'], ['أنتِ', '⟨أنت|أنتِ⟩'],
          ['أعلم', 'اعْلَمْ'], ['كتب', 'كِتَٰبٌ']].map(([t, a]) => grade(t, a))""")
        ok(g[:10] == ['ok'] * 10, "the Quran's spelling read as today's: ىٰ، ءا، ـٔ، ٰ، ى after a kasra, the silah, and a ⟨m|f⟩ answer (%s)" % g[:10])
        ok(g[10:] == ['near', 'bad'], 'another word with a different hamza is only near, and a different word is wrong (%s)' % g[10:])
        cj = await p.evaluate("(() => { const x = CJ.items.find(y => y.form === 'ٱهْتَدَىٰ'); return x ? grade('اهتدى', x.form) : 'none'; })()")
        ok(cj == 'ok', 'the conjugation game accepts «اهتدى» for «ٱهْتَدَىٰ»')
        ok(await p.evaluate("CJ.items.filter(y => y.typed).length") >= 2, 'the Quran\'s assimilated forms (تَذَكَّرُونَ) accept today\'s form too')

        # ---- the same option is never offered twice
        dup = await p.evaluate("""() => { let n = 0; for (let i = 0; i < 200; i++){ const q = GEN.hys('T07'); const o = optsOf(q.a, q.alts, 3);
          if (new Set(o.map(x => N1(x))).size !== o.length) n++; } return n; }""")
        ok(dup == 0, '«الحمد لله.» and «الحمدُ لله.» are never two options (%d of 200)' % dup)
        irb = await p.evaluate("""() => { let n = 0; irbList().forEach(x => { const a = irbCore(x.w.i); if (irbAlts(x).some(t => irbCore(t) === a)) n++; }); return n; }""")
        ok(irb == 0, 'an i\'rab question never offers a second right label (%d)' % irb)

        # ---- an option with markers is found by its own text
        r = await p.evaluate("""async () => { const box = document.createElement('div'); document.body.appendChild(box); let res = null;
          mcq(box, ['⟨أنت|أنتِ⟩', 'عمّتكِ'], '⟨أنت|أنتِ⟩', v => { res = v; }); await new Promise(r => setTimeout(r, 300));
          const btn = [...box.children].find(x => x.textContent === 'أنتِ'); if (btn) btn.click(); const s = btn && btn.dataset.s; box.remove(); return [!!btn, res, s]; }""")
        ok(r == [True, True, 'ok'], 'a girl sees «أنتِ», and choosing it is right (%s)' % r)

        # ---- a girl in the oasis data
        txt = await p.evaluate("""() => { const all = []; HY.situations.forEach(x => all.push(x.q, ...x.options)); HIK.forEach(h => all.push(h.meaning, h.when, ...h.situations));
          HAD.items.forEach(x => all.push(x.meaning || '')); GZ.folk.forEach(x => all.push(x.q, x.answer, ...x.options)); return all.map(s => window.KZR(s)); }""")
        ok(not any('⟨' in t for t in txt), 'every situation, saying, meaning and riddle resolves for her (%d texts)' % len(txt))
        bad = [t for t in txt if re.search(MASC, t) and 'تغدّيتَ' not in t]
        ok(not bad, 'none speaks to her in the masculine (%s)' % bad[:2])
        await p.evaluate("go('hayat', 'hySay')"); await p.wait_for_timeout(300)
        seen = await p.evaluate("$('hsQ').textContent + ' | ' + $('hsOpts').textContent")
        ok('⟨' not in seen, '«ماذا تقولين؟» on screen: ' + seen[:80])
        await p.evaluate("go('hikam')"); await p.wait_for_timeout(300)
        ok('⟨' not in await p.evaluate("$('hkOpts').textContent"), '«متى تقولينها؟» on screen, resolved')
        ok(await p.evaluate("!HIK.some(h => h.text.includes('لَقَتَلْتُهُ'))"), 'the saying with a killing in it is gone')

        # ---- missions, birth year, family challenge, relay, the home drawn once
        ms = await p.evaluate("""() => { const bad = []; for (let i = 0; i < 40; i++){ store.del(`dailyPick:${kid}:${today()}`); dailyPick().forEach(x => {
            const o = OASES.find(y => y.id === x.o); if (x.g === 'hsq' || !o || !o.tabs.some(t => t[0] === x.t) || (POOL[x.g] && !POOL[x.g]().length)) bad.push(x.g + '>' + x.t); }); } return bad; }""")
        ok(not ms, 'every daily mission can be played, in its own tab (%s)' % ms[:3])
        fq = await p.evaluate("""() => { let d = 0; for (let i = 0; i < 60; i++){ const q = famQuestions(); if (new Set(q.map(x => x.g + '|' + x.id)).size !== q.length) d++; } return d; }""")
        ok(fq == 0, 'a family challenge asks each question once (%d of 60 had a repeat)' % fq)
        ok(await p.evaluate("tier()") == 'big', 'a ten-year-old types')
        await p.evaluate("(() => { const f = " + FAMJS + "; f.kids.push({id: 'k2', name: 'يوسف', g: 'm', by: 2020}); localStorage.setItem('kb-family-v1', JSON.stringify(f)); })()")
        await oasis(p)
        plan = await p.evaluate("ryPlan(103)")
        await p.evaluate("(() => { const f = " + FAMJS + "; f.kids.splice(1, 0, {id: 'k3', name: 'مريم', g: 'f', by: 0}); localStorage.setItem('kb-family-v1', JSON.stringify(f)); })()")
        await oasis(p)
        ok(await p.evaluate("ryPlan(103)") == plan and len(plan) == 3, 'adding a child does not move the relay\'s verses (%s)' % plan)
        ok(await p.evaluate("kids.find(k => k.id === 'k3').age") == 8, 'a child with no birth year plays with choices (age 8)')
        await p.evaluate("go('kid')"); await p.wait_for_timeout(300)
        n = await p.evaluate("(async () => { await Promise.all([renderKidHome(), renderKidHome(), renderKidHome()]); return $('kidHome').querySelectorAll('.kscene').length; })()")
        ok(n == 1, 'a triple tap on 🏠 draws the home once (%d)' % n)

        # ---- «كنوز البيان» for a girl: no markers on screen, her buttons
        await p.evaluate("(() => { const f = " + FAMJS + "; f.cur = f.kids[0].id; localStorage.setItem('kb-family-v1', JSON.stringify(f)); })()")
        await p.goto('about:blank'); await p.goto(KZ + '#studio'); await p.wait_for_selector('[data-act="newWork"]')
        await p.click('[data-act="newWork"][data-v="kalima"]'); await p.wait_for_selector('[data-act="delWork"]')
        ph = await p.evaluate("[...document.querySelectorAll('[placeholder]')].map(e => e.placeholder).join(' | ')")
        ok(ph and '⟨' not in ph and '&#10216;' not in ph, 'placeholders are resolved: ' + ph[:60])
        bt = await p.inner_text('[data-act="delWork"]') + ' | ' + await p.inner_text('.sticky-actions [data-act="works"]')
        ok('احذفي' in bt and 'احفظيه' in bt, 'her buttons: «احذفي»، «احفظيه مسوّدة» (%s)' % bt)
        ok('⟨' not in await p.evaluate("[...document.querySelectorAll('#tray [title]')].map(e => e.title).join('')"), 'the tray\'s titles are resolved')
        await shot(p, 'g01-kunuz-girl')

        # ---- the Hasaniya's own labels for a girl
        await p.goto('about:blank'); await p.goto(HS); await p.wait_for_timeout(1800)
        t = await p.evaluate("(document.getElementById('guide') || {}).title || ''")
        ok(t == 'اضغطي على ناجي', 'the Hasaniya: «اضغطي على ناجي» (%s)' % t)
        body = await p.evaluate("document.body.innerHTML")
        ok('استمعي مرة أخرى' in body and 'استمع مرة أخرى' not in body, 'the Hasaniya: «استمعي مرة أخرى»')
        await shot(p, 'g02-hasaniya-girl')
        await b.close()
    srv.shutdown()
    print('\nERRORS:', len(ERRS))
    for e in ERRS: print(' -', e)
asyncio.run(main())
