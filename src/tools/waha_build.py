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


def build(verbose=True, icon=''):
    page, data, app = rd('parts', 'waha', 'page.html'), rd('parts', 'waha', 'data.json'), rd('parts', 'waha', 'app.js')
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
