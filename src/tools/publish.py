# -*- coding: utf-8 -*-
"""Copy the built product (src/dist/) into web/ of this repository. web/tests/ belongs to the repository and is kept.
  python3 src/tools/build.py && python3 src/tools/publish.py
  python3 src/tools/publish.py --check     (CI) exit 1 if web/ differs from what src/ builds, listing the files"""
import filecmp, os, shutil, sys

SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(SRC)
DIST = os.path.join(SRC, 'dist')
KEEP = {'tests'}


def plan(web):
    want = set()
    for base, _, files in os.walk(DIST):
        for f in files:
            want.add(os.path.relpath(os.path.join(base, f), DIST))
    have = set()
    for base, dirs, files in os.walk(web, topdown=True):
        rel = os.path.relpath(base, web)
        if rel == '.':
            dirs[:] = [d for d in dirs if d not in KEEP]
        for f in files:
            have.add(os.path.normpath(os.path.join(rel, f)))
    added = sorted(want - have)
    removed = sorted(have - want)
    changed = sorted(r for r in want & have if not filecmp.cmp(os.path.join(DIST, r), os.path.join(web, r), shallow=False))
    return added, changed, removed


def main(args):
    web = os.path.join(REPO, 'web')
    if not os.path.isdir(DIST):
        raise SystemExit('build first: python3 src/tools/build.py')
    # a build that stopped half-way leaves dist/ partial; copying it would delete most of web/
    missing = [f for f in ('index.html', 'sw.js', 'kunuz/index.html', 'hasaniya/index.html') if not os.path.isfile(os.path.join(DIST, f))]
    if missing:
        raise SystemExit('src/dist/ is incomplete (%s): the last build did not finish. Run python3 src/tools/build.py' % ', '.join(missing))
    added, changed, removed = plan(web)
    if '--check' in args:
        if added or changed or removed:
            print('web/ is not what src/ builds. Run: python3 src/tools/build.py && python3 src/tools/publish.py')
            for k, l in (('added', added), ('changed', changed), ('removed', removed)):
                for r in l:
                    print('  %s: %s' % (k, r))
            sys.exit(1)
        print('web/ matches src/')
        return
    for r in removed:
        os.remove(os.path.join(web, r))
    for r in added + changed:
        dst = os.path.join(web, r)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(DIST, r), dst)
    for base, dirs, files in os.walk(web, topdown=False):      # drop folders left empty
        if base != web and not os.listdir(base):
            os.rmdir(base)
    print('web/: %d added, %d changed, %d removed' % (len(added), len(changed), len(removed)))


if __name__ == '__main__':
    main(sys.argv[1:])
