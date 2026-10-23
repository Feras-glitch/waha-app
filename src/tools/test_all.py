# -*- coding: utf-8 -*-
"""Run every end-to-end suite against src/dist/ (build first). Exit 1 if any check fails.
  python3 src/tools/build.py && python3 src/tools/test_all.py [suite …]"""
import os, re, subprocess, sys, tempfile, time

HERE = os.path.dirname(os.path.abspath(__file__))
SUITES = ['e2e', 'e2e2', 'e2e3', 'e2e4', 'e2e5', 'e2e6', 'e2e7', 'e2e8', 'e2e9', 'e2e10', 'e2e11', 'e2e12', 'e2e13', 'e2e14']


def main(names):
    shots = tempfile.mkdtemp(prefix='waha-shots-')
    bad, total = [], 0
    for n in names or SUITES:
        t = time.time()
        r = subprocess.run([sys.executable, os.path.join(HERE, n + '.py'), os.path.join(shots, n)], capture_output=True, text=True)
        out = r.stdout
        passed = len(re.findall(r'^PASS ', out, re.M))
        fails = re.findall(r'^FAIL (.*)$', out, re.M)
        errs = re.search(r'^ERRORS: (\d+)', out, re.M)
        ok = r.returncode == 0 and errs is not None and errs.group(1) == '0' and not fails
        total += passed
        print('%-5s %-4s %3d checks  %4.0fs' % (n, 'ok' if ok else 'FAIL', passed, time.time() - t))
        if not ok:
            bad.append(n)
            for f in fails:
                print('      FAIL ' + f)
            tail = (out.split('ERRORS:')[-1] if errs else (out[-1500:] + r.stderr[-2500:])).strip()
            if tail:
                print('      ' + tail.replace('\n', '\n      '))
    print('%d checks; screenshots in %s' % (total, shots))
    if bad:
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1:])
