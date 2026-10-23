# -*- coding: utf-8 -*-
"""Build dist/waha/index.html: «واحة اللسان العربي» as a page inside the family app.

Source: tools/waha_src.html (the oasis exactly as published; the claude.ai page skeleton is stripped).
Added, without rewriting the oasis:
  - head: viewport, manifest, icons, adapter styles
  - parts/waha_bridge.js before the oasis (family profiles and PIN)
  - parts/waha_post.js after it (gendered address, PIN, consent before export, way home)
  - gender markers ⟨masc|fem⟩ on child-facing text: STATIC below (page HTML) and tools/waha_gender.json (script),
    each edit verified against the source; a mismatch is reported instead of guessed.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

# child-facing static text in the page (exact strings from the source HTML)
STATIC = [
    ('كل المراحل وما تفتحه في واحتك', 'كل المراحل وما ⟨تفتحه|تفتحينه⟩ في واحتك'),
    ('اختر نخلة. كل نخلة جذرٌ تحفظه في القرآن؛ ثمارها كلماته. افتح الثمار لتعرف العائلة، ثم العب.',
     '⟨اختر|اختاري⟩ نخلة. كل نخلة جذرٌ ⟨تحفظه|تحفظينه⟩ في القرآن؛ ثمارها كلماته. ⟨افتح|افتحي⟩ الثمار ⟨لتعرف|لتعرفي⟩ العائلة، ثم ⟨العب|العبي⟩.'),
    ('اضغط ثمرة لتفتح الكلمة', '⟨اضغط|اضغطي⟩ ثمرة ⟨لتفتح|لتفتحي⟩ الكلمة'),
    ('>ضع الجذرَ على الوزن المناسب<', '>⟨ضع|ضعي⟩ الجذرَ على الوزن المناسب<'),
    ('اشتقّ الكلمة: جذرٌ ووزنٌ، فاكتب الكلمة', '⟨اشتقّ|اشتقّي⟩ الكلمة: جذرٌ ووزنٌ، ⟨فاكتب|فاكتبي⟩ الكلمة'),
    ('من الجذر والوزن تصنع الكلمة بنفسك ولا تحفظها.', 'من الجذر والوزن ⟨تصنع|تصنعين⟩ الكلمة بنفسك ولا ⟨تحفظها|تحفظينها⟩.'),
    ('كلمة من الجذر نفسه لا تحفظها. خمّن معناها', 'كلمة من الجذر نفسه لا ⟨تحفظها|تحفظينها⟩. ⟨خمّن|خمّني⟩ معناها'),
    ('aria-pressed="true">اكتب الكلمة الناقصة<', 'aria-pressed="true">⟨اكتب|اكتبي⟩ الكلمة الناقصة<'),
    ('aria-pressed="false">اتلُ الآية<', 'aria-pressed="false">⟨اتلُ|اتلي⟩ الآية<'),
    ('سقطت منها كلمةٌ من هذه النخلة. اكتبها.', 'سقطت منها كلمةٌ من هذه النخلة. ⟨اكتبها|اكتبيها⟩.'),
    ('اتلُ آيةً تحفظها فيها هذه الكلمة. ثم اعرض الآية وقارن.', '⟨اتلُ|اتلي⟩ آيةً ⟨تحفظها|تحفظينها⟩ فيها هذه الكلمة. ثم ⟨اعرض|اعرضي⟩ الآية ⟨وقارن|وقارني⟩.'),
    ('كن صادقًا، فهو لا يُحتسب', '⟨كن صادقًا|كوني صادقة⟩، فهو لا يُحتسب'),
    ('اكتب ثلاث جمل عن يومك', '⟨اكتب|اكتبي⟩ ثلاث جمل عن يومك'),
    ('كلما عرفتَ الجواب بتلميحات أقل', 'كلما ⟨عرفتَ|عرفتِ⟩ الجواب بتلميحات أقل'),
    ('ضع النقطة في مكانها حين تكتب', '⟨ضع|ضعي⟩ النقطة في مكانها حين ⟨تكتب|تكتبين⟩'),
    ('اضغط «اقلبها» لترى الحروف معكوسة.', '⟨اضغط|اضغطي⟩ «اقلبها» ⟨لترى|لتري⟩ الحروف معكوسة.'),
    ('aria-pressed="true">أكمل البيت<', 'aria-pressed="true">⟨أكمل|أكملي⟩ البيت<'),
    ('aria-pressed="false">اكتب آخر كلمة<', 'aria-pressed="false">⟨اكتب|اكتبي⟩ آخر كلمة<'),
    ('>ماذا تقول؟<', '>ماذا ⟨تقول|تقولين⟩؟<'),
    ('>رتّب الجملة كما تُكتب<', '>⟨رتّب|رتّبي⟩ الجملة كما تُكتب<'),
    ('id="hoCheck">تحقّق<', 'id="hoCheck">⟨تحقّق|تحقّقي⟩<'),
    ('>ضع اللونَ على وزنه<', '>⟨ضع|ضعي⟩ اللونَ على وزنه<'),
    ('>اكتب خبرك لصحيفة الواحة<', '>⟨اكتب|اكتبي⟩ خبرك لصحيفة الواحة<'),
    ('ثم ماذا؟ اكتب التفاصيل بكلمات الربط:', 'ثم ماذا؟ ⟨اكتب|اكتبي⟩ التفاصيل بكلمات الربط:'),
    ('id="swClear">ابدأ خبرًا جديدًا<', 'id="swClear">⟨ابدأ|ابدئي⟩ خبرًا جديدًا<'),
    ('إملاء بالذاكرة: انظر إلى الكلمة جيدًا، فستختفي، ثم اكتبها', 'إملاء بالذاكرة: ⟨انظر|انظري⟩ إلى الكلمة جيدًا، فستختفي، ثم ⟨اكتبها|اكتبيها⟩'),
    ('افتح أي ثمرة في نخلة واكتب أنت كلمةً جديدة.', '⟨افتح|افتحي⟩ أي ثمرة في نخلة ⟨واكتب أنت|واكتبي أنتِ⟩ كلمةً جديدة.'),
    ('>صرّف الفعل كما ورد في محفوظك<', '>⟨صرّف|صرّفي⟩ الفعل كما ورد في محفوظك<'),
    ('في القرآن الذي تحفظه، فالدليل آية.', 'في القرآن الذي ⟨تحفظه|تحفظينه⟩، فالدليل آية.'),
    ('>اكتب سؤالًا لإخوتك', '>⟨اكتب|اكتبي⟩ سؤالًا لإخوتك'),
    ('من أين أخذتَه؟', 'من أين ⟨أخذتَه|أخذتِه⟩؟'),
    ('سمّع: اكتب الكلمة الأخيرة في البيت', '⟨سمّع|سمّعي⟩: ⟨اكتب|اكتبي⟩ الكلمة الأخيرة في البيت'),
    ('🎙 سجّل هذا البيت', '🎙 ⟨سجّل|سجّلي⟩ هذا البيت'),
    ('>أعرب الكلمة الملوّنة <span', '>⟨أعرب|أعربي⟩ الكلمة الملوّنة <span'),
    ('ثم تُرفق الملف هنا.', 'ثم ⟨تُرفق|تُرفقين⟩ الملف هنا.'),
    ('تفتحها بالاستماع، وتُتمّها بأن تكتب الكلمة الناقصة', '⟨تفتحها|تفتحينها⟩ بالاستماع، ⟨وتُتمّها|وتُتمّينها⟩ بأن ⟨تكتب|تكتبي⟩ الكلمة الناقصة'),
]

# code fixes found while reviewing (exact source strings)
CODE = [
    # describes two siblings: use each sibling's own gender, not the current child's
    ("${reader.name} يقرأ السؤال بصوت عالٍ، و${first.name} يجيب أولًا، ثم يساعده الباقون.",
     "${reader.name} ${reader.gender === 'f' ? 'تقرأ' : 'يقرأ'} السؤال بصوت عالٍ، و${first.name} ${first.gender === 'f' ? 'تجيب' : 'يجيب'} أولًا، ثم ${first.gender === 'f' ? 'يساعدها' : 'يساعده'} الباقون."),
    # the child speaks to the companion: the form follows the companion (the owl is feminine), not the child
    ("T('أرني المعنى', 'أريني المعنى')", "((cmpGet() || {}).kind === 'owl' ? 'أريني المعنى' : 'أرني المعنى')"),
    ("T('لا أعرف، أسمعني الجواب', 'لا أعرف، أسمعيني الجواب')", "((cmpGet() || {}).kind === 'owl' ? 'لا أعرف، أسمعيني الجواب' : 'لا أعرف، أسمعني الجواب')"),
    # texts that describe a particular child (the parent's views, siblings, the radio presenter): that child's gender
    ("'<span class=\"badge wait\">لم يرحل اليوم</span>'", "(k.gender === 'f' ? '<span class=\"badge wait\">لم ترحل اليوم</span>' : '<span class=\"badge wait\">لم يرحل اليوم</span>')"),
    ('<p class="note" style="margin:4px 0">تعلّم: ', '<p class="note" style="margin:4px 0">${k.gender === \'f\' ? \'تعلّمت\' : \'تعلّم\'}: '),
    ('} · أصاب ${log.ok.length}', '} · ${k.gender === \'f\' ? \'أصابت\' : \'أصاب\'} ${log.ok.length}'),
    ('<span style="color:var(--date)">أخطأ في: ', '<span style="color:var(--date)">${k.gender === \'f\' ? \'أخطأت\' : \'أخطأ\'} في: '),
    ("tx.placeholder = 'كلمة له (تُقرأ بصوت الرفيق)'", "tx.placeholder = k.gender === 'f' ? 'كلمة لها (تُقرأ بصوت الرفيق)' : 'كلمة له (تُقرأ بصوت الرفيق)'"),
    ('؛ يسمعها عند فتح واحته.`', '؛ ${k.gender === \'f\' ? \'تسمعها عند فتح واحتها\' : \'يسمعها عند فتح واحته\'}.`'),
    ('اضغط الكلمة التي أخطأ فيها لتعليمها:', 'اضغط الكلمة التي ${(kids[r.kid] || {}).gender === \'f\' ? \'أخطأت\' : \'أخطأ\'} فيها لتعليمها:'),
    ('إذا أتمّها نبتت شجرتك.`', 'إذا ${(kids[to] || {}).gender === \'f\' ? \'أتمّتها\' : \'أتمّها\'} نبتت شجرتك.`'),
    ("g.status === 'mastered' ? '<span class=\"badge ok\">أتمّها</span>'", "g.status === 'mastered' ? ((kids[g.to] || {}).gender === 'f' ? '<span class=\"badge ok\">أتمّتها</span>' : '<span class=\"badge ok\">أتمّها</span>')"),
    ('`أتمّها ${esc(g.toName)}', '`${(kids[g.to] || {}).gender === \'f\' ? \'أتمّتها\' : \'أتمّها\'} ${esc(g.toName)}'),
    ('`أهدى ${esc(K().name)} ${sent} وتلقّى ${got}.', '`${fem() ? \'أهدت\' : \'أهدى\'} ${esc(K().name)} ${sent} ${fem() ? \'وتلقّت\' : \'وتلقّى\'} ${got}.'),
    ('<span class="ref">كتبها ${esc((kids[t.kid] || {}).name', '<span class="ref">${(kids[t.kid] || {}).gender === \'f\' ? \'كتبتها\' : \'كتبها\'} ${esc((kids[t.kid] || {}).name'),
    ('`كتبها ${who ? who.name', '`${who && who.gender === \'f\' ? \'كتبتها\' : \'كتبها\'} ${who ? who.name'),
    ('ref:`كتبها ${(kids[x.kid] || {}).name', 'ref:`${(kids[x.kid] || {}).gender === \'f\' ? \'كتبتها\' : \'كتبها\'} ${(kids[x.kid] || {}).name'),
    ('<span>مقدّم اليوم: ${avatarHtml(prog.presenter', '<span>${prog.presenter.gender === \'f\' ? \'مقدّمة اليوم\' : \'مقدّم اليوم\'}: ${avatarHtml(prog.presenter'),
    ("'<span class=\"note\">يقرؤها المقدّم</span>'", "(prog.presenter.gender === 'f' ? '<span class=\"note\">تقرؤها المقدّمة</span>' : '<span class=\"note\">يقرؤها المقدّم</span>')"),
    ('`مقدّم اليوم: ${prog.presenter.name}`', '`${prog.presenter.gender === \'f\' ? \'مقدّمة اليوم\' : \'مقدّم اليوم\'}: ${prog.presenter.name}`'),
    ('\\n- يتعثّر في: ', '\\n- ${r.k.gender === \'f\' ? \'تتعثّر\' : \'يتعثّر\'} في: '),
    ('${esc(r.k.name)} يتعثّر في</p>', '${esc(r.k.name)} ${r.k.gender === \'f\' ? \'تتعثّر\' : \'يتعثّر\'} في</p>'),
]

# instructions to the child inside the oasis data (quotations from books, proverbs and hadith stay as they are)
DATA = [
    ('"رتّب الحروف «ق ل م» تحصل', '"⟨رتّب|رتّبي⟩ الحروف «ق ل م» ⟨تحصل|تحصلي⟩'),
    ('"رتّب الحروف «ب ت ك ا» تحصل', '"⟨رتّب|رتّبي⟩ الحروف «ب ت ك ا» ⟨تحصل|تحصلي⟩'),
    ('"explain": "اقرأ حروفها من آخرها', '"explain": "⟨اقرأ|اقرئي⟩ حروفها من آخرها'),
]

HEAD = ('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="theme-color" content="#1C3A91">'
        '<link rel="manifest" href="../manifest.webmanifest">'
        '<link rel="icon" href="../icons/icon-192.png">'
        '<link rel="apple-touch-icon" href="../icons/apple-touch-icon.png">')


def warn(msg):
    print('WAHA WARNING:', msg)


def build(verbose=True):
    src = open(P('tools', 'waha_src.html'), encoding='utf-8').read()
    # strip the claude.ai skeleton around the real page
    m = [x.start() for x in re.finditer(r'<!doctype html>', src, flags=re.I)]
    if len(m) >= 2 and m[0] == 0:
        src = src[m[1]:]
    src = re.sub(r'\s*</body></html>\s*$', '\n', src)
    lines = src.split('\n')
    di = next(i for i, l in enumerate(lines) if '<script id="data"' in l)
    head, data, rest = '\n'.join(lines[:di]), lines[di], lines[di + 1:]

    # static markers (page HTML only)
    wrap = head.index('<div class="wrap">')
    pre, body = head[:wrap], head[wrap:]
    miss = 0
    for a, b in STATIC:
        c = body.count(a)
        if c != 1:
            warn('static text found %d times: %s' % (c, a[:50])); miss += 1; continue
        body = body.replace(a, b)
    head = pre + body

    # script markers from the reviewed list (line numbers relative to the line after the data script)
    gpath = P('tools', 'waha_gender.json')
    edits = json.load(open(gpath, encoding='utf-8')) if os.path.exists(gpath) else []
    applied = 0
    for e in edits:
        ln = e['line'] - 1
        f, r = e['find'], e['replace']
        if 0 <= ln < len(rest) and f in rest[ln]:
            cnt = rest[ln].count(f)
            if cnt == 1 or e.get('all'):
                rest[ln] = rest[ln].replace(f, r); applied += 1; continue
        # source moved: accept a unique match anywhere in the script
        hits = [i for i, l in enumerate(rest) if f in l]
        if len(hits) == 1 and rest[hits[0]].count(f) == 1:
            rest[hits[0]] = rest[hits[0]].replace(f, r); applied += 1
        else:
            warn('script text not applied (line %s): %s' % (e['line'], f[:50])); miss += 1
    for a, b in DATA:
        if data.count(a) != 1:
            warn('data text found %d times: %s' % (data.count(a), a[:50])); miss += 1; continue
        data = data.replace(a, b)
    script = '\n'.join(rest)
    for a, b in CODE:
        if script.count(a) != 1:
            warn('code fix not applied: %s' % a[:50]); miss += 1; continue
        script = script.replace(a, b)

    # injections
    css = open(P('parts', 'waha.css'), encoding='utf-8').read()
    head = head.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + HEAD + '<style>' + css + '</style>', 1)
    bridge = open(P('parts', 'waha_bridge.js'), encoding='utf-8').read()
    post = open(P('parts', 'waha_post.js'), encoding='utf-8').read()
    k = script.rfind('</script>')
    if k < 0:
        raise SystemExit('oasis script end not found')
    script = script[:k + 9] + '\n<script>\n' + post + '\n</script>' + script[k + 9:]
    out = head + '\n<script>\n' + bridge + '\n</script>\n' + data + '\n' + script
    os.makedirs(P('dist', 'waha'), exist_ok=True)
    open(P('dist', 'waha', 'index.html'), 'w', encoding='utf-8').write(out)
    if verbose:
        print('waha: %d KB; markers: static %d, script %d/%d; code fixes %d; warnings %d' % (
            len(out.encode('utf-8')) // 1024, len(STATIC), applied, len(edits), len(CODE), miss))
    return miss


if __name__ == '__main__':
    sys.exit(1 if build() else 0)
