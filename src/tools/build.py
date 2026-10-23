# -*- coding: utf-8 -*-
"""Build the product «واحة اللسان العربي» from src/ into src/dist/ — the same tree as web/:

  index.html            the oasis, front page (tools/waha_build.py)
  kunuz/index.html      «كنوز البيان»: the treasure chambers and the parent corner (family profiles, PIN, backups)
  hasaniya/             «المنظومة الحسنية», pinned from its own repository (tools/hasaniya_sync.py) + two adapter scripts
  sw.js                 one service worker for all three (offline after the first visit)
  manifest.json, js/android-shim.js, fonts/   shared files (parts/static/)

Then: python3 src/tools/publish.py        copies src/dist/ into web/ (web/tests/ is kept)
      python3 src/tools/publish.py --check   (CI) fails if web/ is not what src/ builds
"""
import hashlib, json, os, re, shutil, subprocess, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
rd = lambda p: open(P(p), encoding='utf-8').read()
DIST = P('dist')


def node_check(name, code):
    if not shutil.which('node'):
        return
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(code); tmp = f.name
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True); os.unlink(tmp)
    if r.returncode:
        raise SystemExit('%s: syntax error\n%s' % (name, r.stderr[:1200]))


def write(rel, text):
    path = os.path.join(DIST, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(text)


if os.path.isdir(DIST):
    shutil.rmtree(DIST)
os.makedirs(DIST)

# ---------- shared files ----------
shutil.copytree(P('parts', 'static'), DIST, dirs_exist_ok=True)
manifest = json.load(open(P('parts', 'static', 'manifest.json'), encoding='utf-8'))
ICON = manifest['icons'][0]['src']

# ---------- kunuz/ ----------
style = rd('parts/style.css')
tokens = re.sub(r'/\*.*?\*/', '', style[:style.index('*{box-sizing:border-box}')], flags=re.S)


# Every page of the product says what it may load: its own files, and images/sounds/fonts made on the device (data:, blob:).
# Nothing from another host — the "nothing leaves the device" promise is enforced by the browser, not only by our code.
# Inline scripts stay allowed (the pages are single files); file: covers the desktop app, which opens the pages from disk.
CSP = ("default-src 'self' file:; script-src 'self' file: 'unsafe-inline'; style-src 'self' file: 'unsafe-inline'; "
       "img-src 'self' file: data: blob:; media-src 'self' file: data: blob:; font-src 'self' file: data:; "
       "connect-src 'self' file: data: blob:; worker-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'")
CSP_META = '<meta http-equiv="Content-Security-Policy" content="%s">' % CSP


def with_csp(html, charset):
    i, head_end = html.find(charset), html.find('</head>')
    if i < 0 or head_end < 0 or i > head_end:
        raise SystemExit('cannot place the CSP: no %s in the head' % charset)
    return html[:i + len(charset)] + CSP_META + html[i + len(charset):]


def mini(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    return re.sub(r'\s*\n\s*', '', css)


app_css = style + '\n' + rd('parts/family.css') + '\n' + rd('parts/export.css')
export_css = mini(tokens + rd('parts/export_base.css') + rd('parts/export.css'))
js_parts = ['data.js', 'engine.js', 'f_core.js', 'f_studio.js', 'f_parent.js', 'f_mag.js', 'f_garden.js', 'f_riddle.js', 'f_lab.js',
            'f_voice.js', 'f_family.js', 'f_report.js', 'f_ramadan.js', 'f_waha.js', 'f_events.js']
js = '\n'.join(rd('parts/' + p) for p in js_parts)
# all parts share one scope: a second top-level function with the same name silently replaces the first
seen = {}
for p_ in js_parts:
    for n_, line in enumerate(rd('parts/' + p_).split('\n'), 1):
        m_ = re.match(r'(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(', line)
        if m_:
            if m_.group(1) in seen:
                raise SystemExit('duplicate function %s: %s and %s:%d' % (m_.group(1), seen[m_.group(1)], p_, n_))
            seen[m_.group(1)] = '%s:%d' % (p_, n_)
# the recordings the oasis keeps between the child and the parent must stay out of the radio here too
_pk = re.search(r"const PRIVATE_K = new Set\((\[[^\]]*\])\)", rd('parts/waha/app.js'))
_op = re.search(r"\bOA_PRIVATE=(\[[^\]]*\])", rd('parts/f_waha.js'))
assert _pk and _op and sorted(json.loads(_pk.group(1).replace("'", '"'))) == sorted(json.loads(_op.group(1).replace("'", '"'))), \
    'OA_PRIVATE in f_waha.js must list the same kinds as PRIVATE_K in waha/app.js'
# the Hasaniya verses (from the oasis data), so a recording brought into the radio carries its text
_hs = json.loads(rd('parts/waha/data.json'))['hasaniya']['verses']
assert js.count('/*@HS_VERSES@*/{}') == 1
js = js.replace('/*@HS_VERSES@*/{}', json.dumps({v['id']: [v['text'], v.get('stationTitle', '')] for v in _hs}, ensure_ascii=False, separators=(',', ':')))
assert js.count("/*@EXPORT_CSS@*/''") == 1
js = js.replace("/*@EXPORT_CSS@*/''", json.dumps(export_css, ensure_ascii=False))
assert '</script' not in js.lower().replace('<\\/script', ''), 'raw </script> inside JS'
node_check('kunuz', '(function(){\n' + js + '\n})();')
shell = rd('parts/shell.html')
assert shell.count('/*@ICON@*/') == 1
kunuz = shell.replace('/*@ICON@*/', ICON).replace('/*@CSS@*/', app_css).replace('/*@JS@*/', js)
kunuz = with_csp(kunuz, '<meta charset="utf-8">')
if 'src="../js/android-shim.js"' not in kunuz:
    raise SystemExit('kunuz/index.html must load ../js/android-shim.js: without it the Android app cannot save or send any file')
write('kunuz/index.html', kunuz)

# ---------- the oasis (front page) ----------
sys.path.insert(0, P('tools'))
import waha_build
waha_build.build(icon=ICON, csp=CSP_META)
if CSP_META not in open(os.path.join(DIST, 'index.html'), encoding='utf-8').read():
    raise SystemExit('the oasis page has no CSP')

# ---------- hasaniya/ (pinned copy + adapter) ----------
shutil.copytree(P('parts', 'hasaniya'), os.path.join(DIST, 'hasaniya'))
early, late = rd('parts/hasaniya_early.js'), rd('parts/hasaniya_late.js')
node_check('hasaniya_early', early); node_check('hasaniya_late', late)
write('hasaniya/js/waha-early.js', early)
write('hasaniya/js/waha-late.js', late)
hp = os.path.join(DIST, 'hasaniya', 'index.html')
h = open(hp, encoding='utf-8').read()
for old, new in (('<link rel="manifest" href="manifest.json">', '<link rel="manifest" href="../manifest.json">'),
                 ('<script src="js/android-shim.js"></script>', '<script src="js/waha-early.js"></script>\n<script src="js/android-shim.js"></script>'),
                 ('<script src="js/app.js"></script>', '<script src="js/app.js"></script>\n<script src="js/waha-late.js"></script>')):
    if h.count(old) != 1:
        raise SystemExit('hasaniya/index.html changed upstream; adapter hook not found: ' + old)
    h = h.replace(old, new)
h = with_csp(h, '<meta charset="UTF-8">')
open(hp, 'w', encoding='utf-8').write(h)
# the adapter must wrap the Hasaniya from both ends, and everything it overrides or calls must still exist upstream
scripts = re.findall(r'<script[^>]*src="([^"]+)"', h)
if scripts[0] != 'js/waha-early.js' or scripts[-1] != 'js/waha-late.js' or 'js/android-shim.js' not in scripts:
    raise SystemExit('hasaniya/index.html: waha-early.js must be the first script and waha-late.js the last (%s … %s)' % (scripts[:2], scripts[-2:]))
if re.search(r'<script(?![^>]*\bsrc=)[^>]*>\s*\S', h):
    raise SystemExit('hasaniya/index.html now has inline scripts: check that the adapter still wraps them')
hs_src = '\n'.join(open(os.path.join(DIST, 'hasaniya', s_), encoding='utf-8').read() for s_ in scripts if not s_.startswith('js/waha-'))
needs = json.loads(re.search(r'var KZ_HS_NEEDS = (\[[^\]]*\])', late).group(1).replace("'", '"'))
missing = [n for n in needs if not re.search(r'(^|\n)\s*(async\s+)?(function\s+%s\s*\(|(const|let|var)\s+%s\b)' % (n, n), hs_src)]
if missing:
    raise SystemExit('hasaniya upstream no longer defines what the adapter relies on: ' + ', '.join(missing))
# the girls' labels: every masculine phrase the adapter rewrites must still be in the Hasaniya (index.html or its scripts)
hs_all = hs_src + open(hp, encoding='utf-8').read()
fem = re.search(r'var HS_FEM = \[(.*?)\n  \];', late, re.S)
pairs = re.findall(r"\['([^']+)', '([^']+)'\]", fem.group(1)) if fem else []
if not pairs:
    raise SystemExit('hasaniya_late.js: HS_FEM not found')
gone = [m for m, f in pairs if m not in hs_all]
if gone:
    raise SystemExit("hasaniya: these labels are no longer in the Hasaniya, update HS_FEM in hasaniya_late.js: " + ' · '.join(gone))

# ---------- one service worker ----------
assets, digest = ['./'], hashlib.sha256()
for base, dirs, files in os.walk(DIST):
    dirs.sort()
    for f in sorted(files):
        full = os.path.join(base, f); rel = os.path.relpath(full, DIST).replace(os.sep, '/')
        if rel == 'sw.js' or f.endswith(('.md', '.txt')):
            continue
        assets.append('./' + rel)
        digest.update(rel.encode('utf-8')); digest.update(open(full, 'rb').read())
version = digest.hexdigest()[:10]
sw = rd('parts/sw.js').replace('__VERSION__', version).replace('__ASSETS__', json.dumps(assets, ensure_ascii=False))
node_check('sw', sw)
write('sw.js', sw)

size = sum(os.path.getsize(os.path.join(b, f)) for b, _, fs in os.walk(DIST) for f in fs)
print('kunuz %d KB · product %d files, %d KB · sw waha-%s' % (len(kunuz.encode('utf-8')) // 1024, len(assets), size // 1024, version))
