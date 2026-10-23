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
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
rd = lambda *a: open(P(*a), encoding='utf-8').read()

HEAD = ('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<link rel="manifest" href="manifest.json">'
        '<meta name="theme-color" content="#1f4a28">'
        '<link rel="icon" href="@ICON@">'
        '<link rel="stylesheet" href="fonts/fonts.css">'
        '<script>window.WAHA_APP = 1;</script>'
        '<script src="js/android-shim.js"></script>'
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
    (Uthmani text, Tanzil), whole or as an excerpt; a riddle's blank «……» hides a part of it. Verse 1 may carry the basmala."""
    A = {}
    for pg in D['quran']['pages']:
        for x in pg['ayat']:
            A[(x[0], x[1])] = x[2]
    bad, n = [], [0]
    def walk(o, path):
        if isinstance(o, dict):
            s_, a_, t = o.get('s'), o.get('a'), o.get('text')
            if isinstance(s_, int) and isinstance(a_, int) and isinstance(t, str) and (s_, a_) in A:
                n[0] += 1; full = A[(s_, a_)]
                parts = [x.strip() for x in t.split('……')]
                w = parts[0].split(' ')
                if a_ == 1 and len(w) > 4 and re.sub(r'[\u064B-\u065F\u0670\u06D6-\u06ED]', '', ' '.join(w[:4])).replace('ٱ', 'ا') == 'بسم الله الرحمن الرحيم':
                    parts[0] = ' '.join(w[4:])
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


def build(verbose=True, icon='', csp=''):
    page, data, app = rd('parts', 'waha', 'page.html'), rd('parts', 'waha', 'data.json'), rd('parts', 'waha', 'app.js')
    import json as _j
    D = _j.loads(data)
    check_unknown_words(D)
    check_grading(app)
    check_gender(D)
    check_verses(D)
    D['kunuz'] = kunuz_for_trip()
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
    if verbose:
        print('waha: %d KB; warnings %d' % (len(out.encode('utf-8')) // 1024, miss))
    return miss


if __name__ == '__main__':
    sys.exit(1 if build() else 0)
