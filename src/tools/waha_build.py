# -*- coding: utf-8 -*-
"""Build dist/index.html — «واحة اللسان العربي», the front page of the product.

The oasis source lives in parts/waha/ and is edited there:
  page.html  the page (styles and markup)
  data.json  the content (palms, poetry, stories, hadith, matn …)
  app.js     the oasis program
Around it: parts/waha_bridge.js (runs first: children and PIN from the family profiles) and
parts/waha_post.js (runs last: gendered address, parent gate before any export, links to kunuz/).
In the head: the shared manifest, local fonts, the Android bridge (js/android-shim.js) and WAHA_APP (shows the Hasaniya tile).
History: tools/archive/ keeps the page as received on 2026-10-22 and the reviewed edits applied to it.
"""
import json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
rd = lambda *a: open(P(*a), encoding='utf-8').read()

HEAD = ('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<link rel="manifest" href="manifest.json">'
        '<meta name="theme-color" content="#1f4a28">'
        '<link rel="icon" href="@ICON@">'
        '<link rel="stylesheet" href="fonts/fonts.css">'
        '<link rel="stylesheet" href="fonts/qpc/qpc.css">'   # the Mushaf's own script (KFGQPC QPC V2), the pages the oasis shows
        '<script>window.WAHA_APP = 1;</script>'
        '<script src="js/android-shim.js"></script>'
        '<script src="js/guard.js"></script>'   # the family rules every section keeps: no Quran by the speech engine, no browser save of a child's voice or picture
        '<script src="audio/manifest.js"></script>')   # the recitation pack, when this copy carries one (src/tools/audio_pack.py)
GFONTS = re.compile(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">\s*')
# one service worker for the product; an old Hasaniya-only registration (from version 1.5) is removed
SW = ('<script>(function(){if(!("serviceWorker" in navigator)||window.AndroidBridge||!/^https?:$/.test(location.protocol))return;'
      'var hs=new URL("hasaniya/",location.href).href;'
      'navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){if(r.scope===hs)r.unregister();});}).catch(function(){});'
      'navigator.serviceWorker.register("sw.js").catch(function(){});})();</script>')


def check_markers(name, s):
    bad = [m.group(0) for m in re.finditer(r'⟨[^⟩]*⟩', s) if m.group(0).count('|') != 1]
    if s.count('⟨') != s.count('⟩') or bad:
        print('WAHA WARNING: unbalanced gender markers in', name, bad[:3])
        return 1
    return 0


KZ_EXTRACT = r"""
const fs = require('fs'), vm = require('vm'); const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[1], 'utf8') + '\n;this.__L = LESSONS; this.__A = AXES;', ctx);
const axes = {}; ctx.__A.forEach(a => { axes[a.id] = String(a.name || '').replace(/[:\s]+$/, ''); });
const lessons = ctx.__L.map(l => ({ id: l.id, ax: l.ax, title: l.title, take: l.take || '',
  secret: (l.secret || []).filter(s => typeof s === 'string'), verses: (l.verses || []).map(v => ({ t: v.t, n: v.n, s: v.s, a: v.a, a2: v.a2 })),
  quiz: (l.quiz || []).map(q => ({ q: q.q, o: q.o, why: q.why || '' })) }));
process.stdout.write(JSON.stringify({ axes, lessons }));
"""


def kunuz_for_trip():
    """The treasure chambers' lessons and questions, for the oasis daily trip (game «kz»). Read from parts/data.js, so one source."""
    import shutil, subprocess, json as _j
    if not shutil.which('node'):
        raise SystemExit('node is needed to build (it reads the chambers from parts/data.js)')
    r = subprocess.run(['node', '-e', KZ_EXTRACT, P('parts', 'data.js')], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit('reading parts/data.js failed:\n' + r.stderr[:800])
    return _j.loads(r.stdout)


_HARAKAT = re.compile(r'[ً-ِْٕٓ-ٰٟۖ-ۭـ]')


def _skeleton(s, word=False):
    """Consonants and shadda only (long vowels, harakat and Uthmani marks dropped), to compare a lemma with a word in a verse."""
    for a, b in (('ٔ', 'ء'), ('ٱ', 'ا'), ('أ', 'ء'), ('إ', 'ء'), ('آ', 'ء'), ('ؤ', 'ء'), ('ئ', 'ء'), ('ى', 'ي'), ('ة', 'ت')):
        s = s.replace(a, b)
    s = _HARAKAT.sub('', s)
    if word:  # a shadda made by the word before it: tanween/nun on the first letter, or a sun letter after ال
        s = re.sub(r'^(.)ّ', r'\1', s)
        s = re.sub(r'^([وفبك]?ل?ال?)(.)ّ', r'\1\2', s)
    return re.sub('[اوي]', '', s)


def check_unknown_words(D):
    """«الكلمة المجهولة» asks the meaning of the highlighted word, so it must be the lemma itself (it once highlighted
    «عِلْمَ» for «عَلَّام»). Every consonant and shadda of the lemma has to appear, in order, in the word."""
    bad = []
    for k, p in D['palms'].items():
        for u in p.get('unknown') or []:
            v = u.get('verse')
            if not v:
                continue
            if v['word'] not in v['text'].split(' '):
                bad.append('%s «%s»: «%s» is not a word of %s %s' % (k, u['lemma'], v['word'], v['name'], v['a']))
                continue
            it = iter(_skeleton(v['word'], True))
            if not all(c in it for c in _skeleton(u['lemma'])):
                bad.append('%s «%s»: the verse highlights «%s» (%s %s)' % (k, u['lemma'], v['word'], v['name'], v['a']))
    if bad:
        raise SystemExit('waha data.json, unknown words:\n  ' + '\n  '.join(bad))


GRADE_CASES = [
    # (what a child types, the answer as the data has it, the grade)
    ('الرحمن', 'ٱلرَّحْمَٰنِ', 'ok'), ('رحمن', 'رَحْمٰن', 'ok'), ('رحمان', 'رَحْمٰن', 'ok'), ('هذا', 'هَٰذَا', 'ok'), ('ذلك', 'ذَٰلِكَ', 'ok'),
    ('إله', 'إِلَٰهَ', 'ok'), ('العالمين', 'ٱلْعَٰلَمِينَ', 'ok'), ('كتاب', 'كِتَٰبٌ', 'ok'), ('كتب', 'كِتَٰبٌ', 'bad'),
    ('السماوات', 'ٱلسَّمَٰوَٰتِ', 'ok'), ('جاء', 'جَآءَ', 'ok'), ('الآن', 'ٱلْـَٔانَ', 'ok'),
    ('موسى', 'مُوسَىٰ', 'ok'), ('الهدى', 'ٱلْهُدَىٰٓ', 'ok'), ('على', 'عَلَىٰ', 'ok'), ('ذكراها', 'ذِكْرَىٰهَآ', 'ok'), ('ونراه', 'وَنَرَىٰهُ', 'ok'),
    ('بناها', 'بَنَىٰهَا', 'ok'), ('فوقاهم', 'فَوَقَىٰهُمُ', 'ok'), ('وتقواها', 'وَتَقْوَىٰهَا', 'ok'),
    ('آمن', 'ءَامَنَ', 'ok'), ('آمنوا', 'ءَامَنُوٓا۟', 'ok'), ('قرآن', 'قُرْءَانٌ', 'ok'), ('آخر', 'ءَاخَرَ', 'ok'), ('آمنا', 'ـَٔامَنَّا', 'ok'),
    ('يسألونك', 'يَسْـَٔلُونَكَ', 'ok'), ('شيئا', 'شَيْـًٔا', 'ok'), ('ورسالاته', 'وَرِسَٰلَٰتِهِۦ', 'ok'), ('به', 'بِهِۦ', 'ok'),
    ('اقرأ', 'ٱقْرَأْ', 'ok'), ('عـلم', 'عَلِمَ', 'ok'), ('علی', 'عَلَى', 'ok'), ('کتب', 'كَتَبَ', 'ok'), ('آمن', 'آمَنَ', 'ok'),
    ('عبادي', 'عِبَٰدِى', 'ok'), ('دعائي', 'دُعَآءِىٓ', 'ok'), ('يهدي', 'يَهْدِىٓ', 'ok'), ('في', 'فِى', 'ok'), ('إلى', 'إِلَى', 'ok'),
    ('رحمه', 'رَحْمَة', 'near'), ('علي', 'عَلَى', 'near'), ('أعلم', 'اعْلَمْ', 'near'), ('سءل', 'سُئِلَ', 'near'),
    ('علم', 'عَمِلَ', 'bad'), ('موس', 'مُوسَىٰ', 'bad'),
]


def check_grading(app):
    """The oasis grades typed answers against the Quran's Uthmani spelling; these cases must keep their grade."""
    import shutil, subprocess, json as _j
    if not shutil.which('node'):
        return
    a, b = app.index('const strip = '), app.index('const NEAR_WHY')
    code = app[a:app.index('\n', a)] + '\n' + app[app.index('/* ---- answer checking', a):b]
    js = code + '\nconst C = ' + _j.dumps(GRADE_CASES, ensure_ascii=False) + ';\n' + \
        "const bad = C.filter(([t, a, g]) => grade(t, a) !== g).map(([t, a, g]) => t + ' / ' + a + ': ' + grade(t, a) + ', expected ' + g);\n" + \
        "if (bad.length) { console.log(bad.join('\\n')); process.exit(1); }"
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit('waha grading:\n  ' + (r.stdout + r.stderr).strip().replace('\n', '\n  '))


_MARK = re.compile(r'⟨[^⟨⟩]*⟩')
_MASC = re.compile(r'(?:^|[\s«(])(\w*تَ|\w*كَ|أنتَ)(?=[\s.،؟!:»)]|$)|(?:^|[.،:«]\s*)(قل|اختر|افعل|أطعم|عش|اغتنم|اسمع|احفظ|أكمل|اكتب|اقرأ|انظر|تذكّر|لا تغضب|لا تستصغر)(?=[\s«:،.]|$)')


QUOTED = {'لو كنتَ تغدّيتَ لسقيتُك', 'لولا أنك تغدّيتَ لأطعمتُك'}   # the miser's words, quoted from the story


def check_gender(D):
    """A girl is addressed in the feminine (⟨m|f⟩ markers) in everything said to the child. Outside the markers, the
    child-facing fields must not hold an explicitly masculine form (دخلتَ، لكَ، أنتَ) or a bare masculine imperative."""
    fields = []
    for x in D['hayat']['situations']:
        fields += [('hayat ' + x['id'], x['q'])] + [('hayat ' + x['id'], o) for o in x['options']]
    for i, h in enumerate(D['hikam']):
        fields += [('hikam %d' % i, h.get('meaning', '')), ('hikam %d' % i, h.get('when', ''))] + [('hikam %d' % i, t) for t in h['situations']]
    fields += [('hadith ' + x['id'], x.get('meaning', '')) for x in D['hadith']['items']]
    for x in D['alghaz']['folk']:
        fields += [('folk ' + x['id'], x['q']), ('folk ' + x['id'], x['answer'])] + [('folk ' + x['id'], o) for o in x['options']]
    for i, st in enumerate(D['nathr']['stories']):
        fields.append(('story %d' % i, st.get('lesson', '')))
        for q in st.get('questions') or []:
            fields += [('story %d' % i, q.get('q', ''))] + [('story %d' % i, o) for o in q.get('options') or []]
    bad = []
    for where, t in fields:
        m = _MASC.search(_MARK.sub(' ', t or ''))
        if m and where != 'hadith W09' and t not in QUOTED:   # W09 is with the scholar
            bad.append('%s: «%s» (%s)' % (where, t, (m.group(1) or m.group(2))))
    if bad:
        raise SystemExit('waha data.json, masculine address outside ⟨m|f⟩:\n  ' + '\n  '.join(bad))


def check_verses(D):
    """A verse shown anywhere in the oasis (palm cards, riddles, conjugations…) must match the Quran pages the app carries
    (Uthmani text, Tanzil), whole or as an excerpt; a riddle's blank «……» hides a part of it. In Hafs the basmala is ayah 1
    of al-Fatiha alone: written at the head of another surah's ayah 1 it is shown as part of that ayah, so it is refused.
    The saktat of Hafs (18:1, 36:52, 69:28, 75:27, 83:14) keep their sign ۜ in the pages: without it a child reads
    «مَن رَّاق» and «بَرَّان», a change in the recitation."""
    A = {}
    for pg in D['quran']['pages']:
        for x in pg['ayat']:
            A[(x[0], x[1])] = x[2]
    bad, n = [], [0]
    SAKTA = {(18, 1): 'عوجا', (36, 52): 'مرقدنا', (69, 28): 'ماليه', (75, 27): 'من', (83, 14): 'بل'}
    bare = lambda x: re.sub(r'[\u064B-\u065F\u0670\u06D6-\u06ED]', '', x).replace('ٱ', 'ا')
    def sakta(t, w):
        """None when the text does not reach the sakta's word; else whether every copy of the word is followed by ۜ"""
        ws = t.split(' '); at = [i for i, x in enumerate(ws) if bare(x) == w]
        return None if not at else all(i + 1 < len(ws) and ws[i + 1].startswith('\u06DC') for i in at)
    for k, w in SAKTA.items():
        if k in A and not sakta(A[k], w):
            bad.append('quran %s:%s: the sakta sign ۜ after «%s» is missing' % (k[0], k[1], w))
    def walk(o, path):
        if isinstance(o, dict):
            s_, a_, t = o.get('s'), o.get('a'), o.get('text')
            if isinstance(s_, int) and isinstance(a_, int) and isinstance(t, str):
                w = t.split('……')[0].strip().split(' ')
                if s_ != 1 and len(w) >= 4 and bare(' '.join(w[:4])) == 'بسم الله الرحمن الرحيم':
                    bad.append('%s: %s %s:%s begins with the basmala, which is not part of the ayah' % (path, o.get('name', ''), s_, a_))
                if (s_, a_) in SAKTA and sakta(t, SAKTA[(s_, a_)]) is False:
                    bad.append('%s: %s %s:%s the sakta sign ۜ is missing' % (path, o.get('name', ''), s_, a_))
            if isinstance(s_, int) and isinstance(a_, int) and isinstance(t, str) and (s_, a_) in A:
                n[0] += 1; full = A[(s_, a_)]
                parts = [x.strip() for x in t.split('……')]
                if not all(x in full for x in parts if x):
                    bad.append('%s: %s %s:%s «%s»' % (path, o.get('name', ''), s_, a_, t[:50]))
            for k, v in o.items():
                walk(v, path + '/' + k)
        elif isinstance(o, list):
            for i, v in enumerate(o):
                walk(v, '%s/%d' % (path, i))
    walk({k: v for k, v in D.items() if k != 'quran'}, '')
    if bad:
        raise SystemExit('waha data.json, verses that do not match the mushaf pages:\n  ' + '\n  '.join(bad[:20]))
    return n[0]


# the functions of app.js that waha_post.js wraps: consent before a file leaves, the PIN, the gender of what is said and shown.
# Each must stay a plain top-level function of app.js and be wrapped in waha_post.js: renamed, or made a const, the wrapper would
# quietly not apply and the build would still pass (ENG-06). saveFile also fails closed at run time (SAVE_GATE).
WAHA_NEEDS = ['say', 'ttsSay', 'tripLogSave', 'pinSet', 'pinSave', 'pinCheck', 'pinGate', 'go', 'kidsSheet', 'kidEditSheet', 'onKid', 'saveFile']


# ---------- the Mushaf's own script: KFGQPC QPC V2 (the Madinah Mushaf), ayah after ayah ----------
# src/quran/qpc-v2/: QUL's ayah-by-ayah glyph map (each ayah = one glyph per word of its page's font, the pause marks among them,
# then the ayah's end mark), and the 604 page fonts of the King Fahd Complex (fonts/pNNN.woff2, converted losslessly; README.md).
# The oasis carries the glyphs of every ayah it shows and the fonts of their pages only.
QPC_DIR = os.path.join(ROOT, 'quran', 'qpc-v2')
QMARK = re.compile(r'^[\u06D6-\u06ED\u06DE]+$')   # a pause mark or the hizb sign: a token of its own, in Tanzil as in QPC V2
_qn = lambda w: re.sub(r'[\u0640\u06D6-\u06ED]', '', w)                       # without tatweel and the small marks (Tanzil versions differ)
_qs = lambda w: re.sub(r'[\u064B-\u065F\u0670]', '', _qn(w)).replace('ٱ', 'ا')   # the bare letters


def _find(seq, sub, start=0):
    for i in range(max(start, 0), len(seq) - len(sub) + 1):
        if seq[i:i + len(sub)] == sub:
            return i
    return -1


def qpc_prepare(D):
    """D['qpc'] = {"s:a": [page, glyphs]} for every ayah the oasis shows (the Mushaf pages, every verse it quotes, the chambers' verses,
    and 1:1 for the basmala). A verse that points at a word (to colour it) gets qw, its index among the ayah's glyphs; a riddle that
    hides words gets qb. The index is found on the Tanzil text (src/quran/tanzil-uthmani.json), whose tokens go one to one with
    the glyphs in 6235 ayat of 6236 (13:37 is shown without a coloured word). Returns the pages whose fonts the oasis needs."""
    G = json.load(open(os.path.join(QPC_DIR, 'qpc-v2-ayah-by-ayah-glyphs.json'), encoding='utf-8'))
    T = json.load(open(os.path.join(ROOT, 'quran', 'tanzil-uthmani.json'), encoding='utf-8'))
    need, bad, idx = {(1, 1)}, [], [0]
    for pg in D['quran']['pages']:
        for x in pg['ayat']:
            need.add((x[0], x[1]))
    for L in (D.get('kunuz') or {}).get('lessons', []):
        for v in L.get('verses') or []:
            if isinstance(v.get('s'), int) and isinstance(v.get('a'), int):
                need.update((v['s'], x) for x in range(v['a'], (v.get('a2') or v['a']) + 1))

    def tokens(s, a):
        t = T['%d:%d' % (s, a)].split()
        if s != 1 and a == 1 and len(t) > 4 and _qs(' '.join(t[:4])) == 'بسم الله الرحمن الرحيم':
            t = t[4:]
        return t

    def place(o, path):
        s, a, key = o['s'], o['a'], '%d:%d' % (o['s'], o['a'])
        need.add((s, a))
        text, word = o.get('text') or '', o.get('word') or ''
        if not word and '……' not in text:
            return
        if key not in G or key not in T:
            return bad.append('%s %s: no glyphs' % (path, key))
        toks = tokens(s, a)
        if len(toks) != len(G[key]['text'].split(' ')) - 1:
            return   # 13:37: shown whole, nothing coloured
        nm = [i for i, t in enumerate(toks) if not QMARK.match(t)]
        W, WS = [_qn(toks[i]) for i in nm], [_qs(toks[i]) for i in nm]
        loc = lambda ws, st=0: (lambda i: i if i >= 0 else _find(WS, [_qs(w) for w in ws], st))(_find(W, [_qn(w) for w in ws], st))
        parts = [[w for w in p.split() if not QMARK.match(w)] for p in text.split('……')]
        lo, hi = 0, len(W)
        if len(parts) == 2:   # a riddle: the words between what it shows
            b, c = parts
            i = loc(b) if b else 0
            j = loc(c, i + len(b)) if c else len(W)
            if i < 0 or j < 0 or j <= i + len(b):
                return bad.append('%s %s: the hidden words are not found' % (path, key))
            o['qb'] = [nm[k] for k in range(i + len(b), j)]
        elif parts[0]:
            lo = loc(parts[0])
            if lo < 0:
                return bad.append('%s %s: the text is not in the ayah' % (path, key))
            hi = lo + len(parts[0])
        if word:
            ws = [w for w in word.split() if not QMARK.match(w)]
            i = loc(ws, lo)
            if i < 0 or i >= hi:
                i = loc(ws)
            if i < 0:
                return bad.append('%s %s: «%s» is not in the ayah' % (path, key, word))
            o['qw'] = [nm[k] for k in range(i, i + len(ws))]
        idx[0] += 1

    def walk(o, path):
        if isinstance(o, dict):
            if isinstance(o.get('s'), int) and isinstance(o.get('a'), int) and 1 <= o['s'] <= 114:
                place(o, path)
            for k, v in o.items():
                if not (path == '' and k in ('quran', 'kunuz', 'qpc')):   # the Mushaf pages, the chambers and this map; not alghaz/quran
                    walk(v, path + '/' + str(k))
        elif isinstance(o, list):
            for i, v in enumerate(o):
                walk(v, path + '/' + str(i))
    walk(D, '')
    if bad:
        raise SystemExit('waha: verses the Mushaf script cannot place:\n  ' + '\n  '.join(bad[:30]))
    D['qpc'] = {'%d:%d' % k: [G['%d:%d' % k]['page_number'], G['%d:%d' % k]['text']] for k in sorted(need)}
    return sorted({G['%d:%d' % k]['page_number'] for k in need}), idx[0]


def qpc_fonts(pages):
    """dist/fonts/qpc/: the fonts of these pages, and qpc.css naming each one qpcN (font-display: block, so a glyph is never shown in
    another font, where its code is an unrelated Arabic presentation form)."""
    out = P('dist', 'fonts', 'qpc')
    os.makedirs(out, exist_ok=True)
    css = ['/* خط مصحف المدينة (مجمع الملك فهد، QPC V2): خطّ لكل صفحة، يُحمَّل حين تُعرض آيةٌ منها. المصدر: src/quran/qpc-v2/README.md */']
    for p in pages:
        f = 'p%03d.woff2' % p
        src = os.path.join(QPC_DIR, 'fonts', f)
        if not os.path.exists(src):
            raise SystemExit('waha: the Mushaf font of page %d is missing (src/quran/qpc-v2/fonts/%s)' % (p, f))
        shutil.copyfile(src, os.path.join(out, f))
        css.append('@font-face{font-family:qpc%d;src:url(%s) format("woff2");font-display:block}' % (p, f))
    open(os.path.join(out, 'qpc.css'), 'w', encoding='utf-8').write('\n'.join(css) + '\n')


def check_needs(app, post, bridge):
    miss = [n for n in WAHA_NEEDS if not re.search(r'^(?:async\s+)?function\s+%s\s*\(' % n, app, re.M)]
    bare = [n for n in WAHA_NEEDS if not re.search(r'(?<![\w.])%s\s*=\s*(?:async\s+)?function\b' % n, post)]
    if miss or bare:
        raise SystemExit('waha: the wrapped functions changed (ENG-06):' + (' not a top-level function in app.js: ' + ', '.join(miss) if miss else '') +
                         (' not wrapped in waha_post.js: ' + ', '.join(bare) if bare else ''))
    if not re.search(r'SAVE_GATE = true; try \{ return _save\(', post) or 'if (!SAVE_GATE)' not in app:
        raise SystemExit('waha: saveFile must open only through the consent sheet (SAVE_GATE)')
    # nothing of the Claude artifact runtime: it would send a child's words to a model, or open a second way out for files (ENG-16)
    for name, code in (('app', app), ('post', post), ('bridge', bridge)):
        if re.search(r'window\.claude|claude\.use\(', code):
            raise SystemExit('waha %s: the Claude artifact runtime is not used in the product (ENG-16)' % name)


def build(verbose=True, icon='', csp=''):
    page, data, app = rd('parts', 'waha', 'page.html'), rd('parts', 'waha', 'data.json'), rd('parts', 'waha', 'app.js')
    import json as _j
    D = _j.loads(data)
    check_unknown_words(D)
    check_grading(app)
    check_gender(D)
    check_verses(D)
    D['kunuz'] = kunuz_for_trip()
    qpc_pages, qpc_n = qpc_prepare(D)
    # the home-language glosses (Traditional Chinese, pinyin, English), when present: each must name a word of the palms
    gp = os.path.join(ROOT, 'parts', 'waha', 'glosses.json')
    if os.path.exists(gp):
        G = _j.load(open(gp, encoding='utf-8')).get('words', {})
        known = {k + '|' + f['lemma'] for k, P in D['palms'].items() for f in (P.get('family') or []) + (P.get('unknown') or [])}
        stray = [k for k in G if k not in known]
        if stray:
            raise SystemExit('waha glosses.json: words not in the palms: ' + ', '.join(stray[:10]))
        D['glosses'] = {k: {'zh': v['zh'], 'py': v['py'], 'en': v['en']} for k, v in G.items()}
    # the quarterly reading passages: in the app only once the sheikh has approved them ("status": "approved" in pending/orf.json)
    op = os.path.join(ROOT, 'parts', 'waha', 'pending', 'orf.json')
    if os.path.exists(op):
        O = _j.load(open(op, encoding='utf-8'))
        if O.get('status') == 'approved':
            D['orf'] = {'levels': O['levels'], 'procedure': {'scoring': O['procedure']['scoring']},
                        'passages': [{k: x[k] for k in ('id', 'level', 'title', 'text', 'words', 'questions')} for x in O['passages']]}
    data = _j.dumps(D, ensure_ascii=False, separators=(',', ':'))
    css, bridge, post = rd('parts', 'waha.css'), rd('parts', 'waha_bridge.js'), rd('parts', 'waha_post.js')
    check_needs(app, post, bridge)
    miss = check_markers('page', page) + check_markers('app', app) + check_markers('data', data)
    if '</script' in data:
        raise SystemExit('data.json must not contain </script')
    page, n = GFONTS.subn('', page)
    if n != 1:
        raise SystemExit('waha: expected one Google Fonts link in page.html, found %d' % n)
    page = page.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + csp + HEAD.replace('@ICON@', icon) + '<style>' + css + '</style>', 1)
    out = (page.rstrip() + '\n<script>\n' + bridge + '\n</script>\n'
           '<script id="data" type="application/json">' + data + '</script>\n'
           '<script>\n' + app + '\n</script>\n<script>\n' + post + '\n</script>\n' + SW + '\n')
    # syntax check of the three scripts (node), when available
    import shutil, subprocess, tempfile
    if shutil.which('node'):
        for name, code in (('bridge', bridge), ('app', app), ('post', post)):
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
                f.write(code); tmp = f.name
            r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True); os.unlink(tmp)
            if r.returncode:
                raise SystemExit('waha %s.js syntax error:\n%s' % (name, r.stderr[:800]))
    os.makedirs(P('dist'), exist_ok=True)
    open(P('dist', 'index.html'), 'w', encoding='utf-8').write(out)
    qpc_fonts(qpc_pages)
    if verbose:
        print('waha: %d KB; warnings %d; Mushaf script: %d ayat, %d verses placed, %d page fonts' % (len(out.encode('utf-8')) // 1024, miss, len(D['qpc']), qpc_n, len(qpc_pages)))
    return miss


if __name__ == '__main__':
    sys.exit(1 if build() else 0)
