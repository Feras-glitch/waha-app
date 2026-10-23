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
        '<script src="js/android-shim.js"></script>')
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
  secret: (l.secret || []).filter(s => typeof s === 'string'), verses: (l.verses || []).map(v => ({ t: v.t, n: v.n, a: v.a })),
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


def build(verbose=True, icon=''):
    page, data, app = rd('parts', 'waha', 'page.html'), rd('parts', 'waha', 'data.json'), rd('parts', 'waha', 'app.js')
    import json as _j
    D = _j.loads(data)
    D['kunuz'] = kunuz_for_trip()
    data = _j.dumps(D, ensure_ascii=False, separators=(',', ':'))
    css, bridge, post = rd('parts', 'waha.css'), rd('parts', 'waha_bridge.js'), rd('parts', 'waha_post.js')
    miss = check_markers('page', page) + check_markers('app', app) + check_markers('data', data)
    if '</script' in data:
        raise SystemExit('data.json must not contain </script')
    page, n = GFONTS.subn('', page)
    if n != 1:
        raise SystemExit('waha: expected one Google Fonts link in page.html, found %d' % n)
    page = page.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + HEAD.replace('@ICON@', icon) + '<style>' + css + '</style>', 1)
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
