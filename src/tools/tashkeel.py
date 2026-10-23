# -*- coding: utf-8 -*-
"""Texts awaiting the sheikh: the full tashkeel of what children of eight and under read, and the quarterly reading
passages. They live in src/parts/waha/pending/ and are not part of the app until he approves them.

  python3 src/tools/tashkeel.py            check both files against data.json: every vowelled text keeps the letters of
                                           its source exactly, carries its vowels, and its source is still the app's text
                                           (a source edited since prints as «تغيّر»: vowel the new text again)

Helpers (walk / get / skel / coverage) are shared with the scripts that prepared the files."""
import json, os, re, sys
HAR = 'ًٌٍَُِّْ'
MARKS = HAR + 'ٰ'
LET = re.compile('[\u0621-\u063F\u0641-\u064A]')   # letters (the tatweel is not one)
def skel(t):
    """letters, spaces and punctuation only: what the vowelled text must keep exactly"""
    return re.sub('[' + MARKS + 'ـ]', '', t or '')
SUN = set('تثدذرزسشصضطظلن')
UTH = re.compile('[ٱۖ-ۭ]')
def bare_words(t):
    """Arabic words; a word in Quranic (Uthmani) script keeps its own marks and is not checked"""
    return [w for tok in re.split(r'\s+', t or '') if not UTH.search(tok) for w in _bw(tok)]
def _bw(t):
    return re.findall('[ء-يً-ْٰـ]+', t)
def coverage(t):
    """(letters that need a mark, letters without one, list of words with a missing mark)"""
    need = miss = 0; bad = []
    for w in bare_words(re.sub(r'⟨([^|⟩]*)\|([^⟩]*)⟩', r'\1 \2', t or '')):
        # split into (letter, marks)
        units = []
        for ch in w:
            if LET.match(ch): units.append([ch, ''])
            elif units: units[-1][1] += ch
        wb = False
        for i, (c, m) in enumerate(units):
            prev = units[i - 1] if i else None
            nxt = units[i + 1] if i + 1 < len(units) else None
            if c in 'اآى': continue
            if c == 'ل' and i == 1 and units[0][0] == 'ا' and nxt and ('ّ' in nxt[1] or nxt[0] in SUN): continue  # ال + sun letter
            if c == 'ل' and i == 2 and units[0][0] in 'وفبك' and units[1][0] == 'ا' and nxt and ('ّ' in nxt[1] or nxt[0] in SUN): continue
            if c == 'ل' and not m and prev and nxt and 'ّ' in nxt[1] and nxt[0] in SUN and (prev[0] == 'ا' or (prev[0] == 'ل' and 'ِ' in prev[1])): continue  # لِلـ / وَالـ + sun letter
            if c == 'و' and prev and 'ُ' in prev[1] and not m: continue      # long u
            if c == 'ي' and prev and 'ِ' in prev[1] and not m: continue      # long i
            if c == 'و' and not m and nxt and nxt[0] == 'ا' and i + 2 == len(units): continue  # wāw al-jamāʿa
            need += 1
            if not m: miss += 1; wb = True
        if wb: bad.append(w)
    return need, miss, bad
def is_vowelled(t, th=0.9):
    n, m, _ = coverage(t)
    return n == 0 or (n - m) / n >= th

def walk(D):
    """yield (section, path, text) for every text shown to children of eight and under"""
    HY = D['hayat']
    for x in HY['situations']:
        yield 'hys', 'hayat.situations.%s.q' % x['id'], x['q']
        for i, o in enumerate(x['options']): yield 'hys', 'hayat.situations.%s.options.%d' % (x['id'], i), o
    for k, x in enumerate(D['hikam']):
        for i, s in enumerate(x['situations']): yield 'hk', 'hikam.%d.situations.%d' % (k, i), s
        yield 'hk', 'hikam.%d.meaning' % k, x['meaning']
        if x.get('when'): yield 'hk', 'hikam.%d.when' % k, x['when']
    A = D['alghaz']
    for x in A['quran']:
        for i, c in enumerate(x['clues']): yield 'gzw', 'alghaz.quran.%s.clues.%d' % (x['id'], i), c
        for i, o in enumerate(x['options']): yield 'gzw', 'alghaz.quran.%s.options.%d' % (x['id'], i), o
        yield 'gzw', 'alghaz.quran.%s.answer' % x['id'], x['answer']
    for g in A['dots']:
        for i, w in enumerate(g['words']): yield 'gzd', 'alghaz.dots.%s.words.%d.meaning' % (g['id'], i), w['meaning']
    for x in A['folk']:
        yield 'gzf', 'alghaz.folk.%s.q' % x['id'], x['q']
        yield 'gzf', 'alghaz.folk.%s.answer' % x['id'], x['answer']
        for i, o in enumerate(x['options']): yield 'gzf', 'alghaz.folk.%s.options.%d' % (x['id'], i), o
    for x in A['letter']:
        yield 'gzl', 'alghaz.letter.%s.q' % x['id'], x['q']
    for s in D['nathr']['stories']:
        yield 'ntr', 'nathr.stories.%s.title' % s['id'], s['title']
        yield 'ntr', 'nathr.stories.%s.retell' % s['id'], s['retell']
        if s.get('lesson'): yield 'ntr', 'nathr.stories.%s.lesson' % s['id'], s['lesson']
        for g, v in (s.get('gloss') or {}).items(): yield 'ntr', 'nathr.stories.%s.gloss.%s' % (s['id'], g), v
        for i, q in enumerate(s['questions']):
            yield 'ntq', 'nathr.stories.%s.questions.%d.q' % (s['id'], i), q['q']
            for j, o in enumerate(q['options']): yield 'ntq', 'nathr.stories.%s.questions.%d.options.%d' % (s['id'], i, j), o
    P = D['palms']
    for k, R in P.items():
        for i, u in enumerate(R.get('unknown') or []):
            yield 'uk', 'palms.%s.unknown.%d.meaning' % (k, i), u.get('meaning', '')
            for j, o in enumerate(u['options']): yield 'uk', 'palms.%s.unknown.%d.options.%d' % (k, i, j), o
        for i, r in enumerate(R.get('roles') or []):
            yield 'rl', 'palms.%s.roles.%d.q' % (k, i), r['q']
            for j, o in enumerate(r['opts']): yield 'rl', 'palms.%s.roles.%d.opts.%d' % (k, i, j), o
            yield 'rl', 'palms.%s.roles.%d.a' % (k, i), r['a']
        for i, f in enumerate(R.get('family') or []):
            yield 'fam', 'palms.%s.family.%d.meaning' % (k, i), f.get('meaning', '')
            if f.get('sentence'): yield 'fam', 'palms.%s.family.%d.sentence' % (k, i), f['sentence']
    for x in D['hasaniya']['quizzes']:
        p = 'hasaniya.quizzes.%s.' % x['id']
        yield 'hsq', p + 'q', x['q']; yield 'hsq', p + 'a', x['a']
        for i, a in enumerate(x['alts']): yield 'hsq', p + 'alts.%d' % i, a
        if x.get('explain'): yield 'hsq', p + 'explain', x['explain']
        if x.get('event'): yield 'hsq', p + 'event', x['event']

def get(D, path):
    """the current text at a path made by walk()"""
    parts = path.split('.'); o = D; i = 0
    while i < len(parts):
        p = parts[i]
        if isinstance(o, list):
            if p.isdigit() and not (o and isinstance(o[0], dict) and 'id' in o[0] and any(str(y.get('id')) == p for y in o)): o = o[int(p)]
            else: o = next(y for y in o if str(y.get('id')) == p)
        else: o = o[p]
        i += 1
    return o


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PEND = os.path.join(ROOT, 'parts', 'waha', 'pending')


def main():
    D = json.load(open(os.path.join(ROOT, 'parts', 'waha', 'data.json'), encoding='utf-8'))
    T = json.load(open(os.path.join(PEND, 'tashkeel.json'), encoding='utf-8'))
    bad = stale = 0
    for it in T['items']:
        try:
            cur = get(D, it['path'])
        except Exception:
            cur = None
        if cur != it['src']:
            stale += 1
            print('تغيّر (%s): %s' % (it['ref'], it['path']))
        if skel(it['v']) != skel(it['src']):
            bad += 1
            print('حروفٌ تغيّرت (%s): %s' % (it['ref'], it['path']))
        if coverage(it['v'])[1]:
            bad += 1
            print('بلا حركة (%s): %s' % (it['ref'], ' '.join(coverage(it['v'])[2])))
    O = json.load(open(os.path.join(PEND, 'orf.json'), encoding='utf-8'))
    for p in O['passages']:
        for t in [p['title'], p['text']] + [x for q in p['questions'] for x in (q['q'], q['a'])]:
            if coverage(t)[1]:
                bad += 1
                print('بلا حركة (%s): %s' % (p['id'], ' '.join(coverage(t)[2])))
        if len(bare_words(p['text'])) != p['words']:
            bad += 1
            print('عدد الكلمات (%s): %d لا %d' % (p['id'], len(bare_words(p['text'])), p['words']))
    print('%d نصًّا مشكولًا، %d قطعة قراءة؛ %d تغيّر مصدرها، %d خلل' % (len(T['items']), len(O['passages']), stale, bad))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
