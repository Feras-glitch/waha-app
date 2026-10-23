# -*- coding: utf-8 -*-
"""Pin «المنظومة الحسنية» from its own repository (Feras-glitch/hasaniya-app) into parts/hasaniya/.

The Hasaniya is developed in its own repository. This project keeps an untouched copy of its web/ folder,
pinned to one commit, and wraps it at build time (tools/build.py) with two small scripts:
  parts/hasaniya_early.js  before its files: its storage gets its own names, apart from the standalone app
  parts/hasaniya_late.js   after its files: family children, family PIN, parent consent before any file leaves
Nothing inside parts/hasaniya/ is edited by hand; to update, pull the Hasaniya repository and run:
  python3 src/tools/hasaniya_sync.py /path/to/hasaniya-app   (then build, test, publish)
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, 'parts', 'hasaniya')
PIN = os.path.join(ROOT, 'tools', 'hasaniya_upstream.json')
SKIP_DIRS = {'docs', 'tests', 'tools'}
SKIP_FILES = {'sw.js', 'manifest.json'}      # one service worker and one manifest for the whole product


def main(repo):
    web = os.path.join(repo, 'web')
    if not os.path.isfile(os.path.join(web, 'index.html')):
        raise SystemExit('not a hasaniya-app checkout: ' + repo)
    commit = subprocess.run(['git', '-C', repo, 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
    dirty = subprocess.run(['git', '-C', repo, 'status', '--porcelain', '--', 'web'], capture_output=True, text=True).stdout.strip()
    if os.path.isdir(DEST):
        shutil.rmtree(DEST)
    for base, dirs, files in os.walk(web):
        rel = os.path.relpath(base, web)
        dirs[:] = [d for d in dirs if not (rel == '.' and d in SKIP_DIRS)]
        for f in files:
            if rel == '.' and f in SKIP_FILES:
                continue
            os.makedirs(os.path.join(DEST, rel), exist_ok=True)
            shutil.copy2(os.path.join(base, f), os.path.join(DEST, rel, f))
    cv = re.search(r'CONTENT_VERSION\s*=\s*(\d+)', open(os.path.join(web, 'js', 'config.js'), encoding='utf-8').read())
    info = {'repo': 'Feras-glitch/hasaniya-app', 'commit': commit, 'dirty': bool(dirty),
            'content_version': int(cv.group(1)) if cv else None}
    json.dump(info, open(PIN, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('hasaniya pinned:', info)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
