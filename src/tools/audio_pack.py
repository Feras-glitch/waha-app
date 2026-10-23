# -*- coding: utf-8 -*-
"""حزمة التلاوة: ملفات صوتية تُضمَّن في نسخ التطبيق، فلا يتّصل التطبيق بأي موقع ليُسمِع القرآن.
  للتعلّم:   محمود خليل الحصري (المصحف المعلّم)، آيةً آية: audio/h/SSSAAA.mp3
             لكل آية في محفوظ الواحة (صفحات المصحف في data.json) ولكل آية تستشهد بها «كنوز البيان».
  للاستماع:  عبد الرحمن العوسي، السورة كاملة: audio/o/SSS.mp3 لكل سورة من محفوظ الواحة.
  audio/manifest.js يعرّف window.WAHA_AUDIO بما في الحزمة، فيُظهر التطبيق أزرار التلاوة لما فيها وحده.

  python3 src/tools/audio_pack.py --out DIR [--kbps 32] [--jobs 8]
  python3 src/tools/audio_pack.py --out DIR --synthetic      (فحص محلّي بلا شبكة: نغماتٌ قصيرة بدل التلاوة)

يُشغَّل في GitHub Actions (.github/workflows/audio-pack.yml) لأن الشبكة هناك متاحة، ثم يُحفظ الناتج waha-audio.zip
في صفحة Releases (audio-v1)، وتضعه مهمة «Build all» في web/audio/ قبل بناء النسخ."""
import argparse, concurrent.futures as cf, datetime, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.error, urllib.request

SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H_URL = 'https://everyayah.com/data/Husary_Muallim_128kbps/%03d%03d.mp3'
O_URL = 'https://archive.org/download/AbdAlrahman-Al3osy/%03d.mp3'
SOURCES = """حزمة التلاوة في «واحة اللسان العربي»

للتعلّم: الشيخ محمود خليل الحصري، المصحف المعلّم، آيةً آية.
  المصدر: https://everyayah.com/data/Husary_Muallim_128kbps/
للاستماع: الشيخ عبد الرحمن العوسي، السورة كاملة.
  المصدر: https://archive.org/details/AbdAlrahman-Al3osy

أُعيد ترميز الملفات صوتًا واحدًا (mono) بمعدّل %d كيلوبت في الثانية ليصغر حجمها في الجهاز، ولم يُغيَّر فيها شيءٌ غير ذلك.
للاستعمال العائلي والتعليمي غير التجاري.
"""


def needed():
    """(ayat for the teaching voice, surahs for the listening voice)"""
    D = json.load(open(os.path.join(SRC, 'parts', 'waha', 'data.json'), encoding='utf-8'))
    Q = D.get('quran') or {}
    mem = {(a[0], a[1]) for p in Q.get('pages', []) for a in p['ayat']}
    kz = set()
    for f in ('data.js', 'engine.js', 'f_ramadan.js'):
        src = open(os.path.join(SRC, 'parts', f), encoding='utf-8').read()
        for m in re.finditer(r's: *(\d+), *a: *(\d+)(?:, *a2: *(\d+))?', src):
            s, a = int(m.group(1)), int(m.group(2)); b = int(m.group(3)) if m.group(3) else a
            kz.update((s, x) for x in range(a, b + 1))
    ayat = sorted(mem | kz | {(1, 1)})          # 1:1 is the basmala played before a surah's first verse
    surahs = sorted({s for s, _ in mem})
    return ayat, surahs, len(mem), len(kz - mem)


def fetch(url, dst, tries=5):
    """True when the file came; False when the site does not have it (404). Other failures are retried, then stop the run"""
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'waha-audio-pack/1 (family app; github.com/Feras-glitch/waha-app)'})
            with urllib.request.urlopen(req, timeout=180) as r, open(dst + '.part', 'wb') as f:
                shutil.copyfileobj(r, f, 1 << 20)
            if os.path.getsize(dst + '.part') < 1024:
                raise IOError('too small')
            os.replace(dst + '.part', dst)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return False
            last = e
        except Exception as e:  # noqa: BLE001 — retried, then reported
            last = e
        time.sleep(2 + 3 * i)
    raise SystemExit('download failed: %s (%s)' % (url, last))


def synth(dst, secs):
    subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=%s' % secs,
                    '-codec:a', 'libmp3lame', '-b:a', '128k', dst], check=True)


def encode(src, dst, kbps):
    subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', src, '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '22050',
                    '-codec:a', 'libmp3lame', '-b:a', '%dk' % kbps, dst], check=True)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst],
                             check=True, capture_output=True, text=True).stdout.strip() or 0)
    if d < 0.3:
        raise SystemExit('bad audio: %s (%.2fs)' % (dst, d))
    return d


def ranges(nums):
    out = []
    for n in sorted(nums):
        if out and n == out[-1][1] + 1:
            out[-1][1] = n
        else:
            out.append([n, n])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--kbps', type=int, default=32)
    ap.add_argument('--jobs', type=int, default=8)
    ap.add_argument('--synthetic', action='store_true')
    ap.add_argument('--limit', type=int, default=0, help='first N verses and surahs only (a quick check)')
    o = ap.parse_args()
    ayat, surahs, n_mem, n_kz = needed()
    if o.limit:
        ayat, surahs = ayat[:o.limit], surahs[:max(1, o.limit // 10)]
    print('verses %d (memorised %d, «كنوز البيان» %d more) · surahs %d' % (len(ayat), n_mem, n_kz, len(surahs)))
    root = os.path.join(o.out, 'audio')
    if os.path.isdir(root):
        shutil.rmtree(root)
    os.makedirs(os.path.join(root, 'h')); os.makedirs(os.path.join(root, 'o'))
    tmp = tempfile.mkdtemp(prefix='waha-audio-')
    jobs = [('h', (s, a), H_URL % (s, a), os.path.join(tmp, 'h%03d%03d.mp3' % (s, a)), os.path.join(root, 'h', '%03d%03d.mp3' % (s, a))) for s, a in ayat]
    jobs += [('o', s, O_URL % s, os.path.join(tmp, 'o%03d.mp3' % s), os.path.join(root, 'o', '%03d.mp3' % s)) for s in surahs]
    secs = {'h': 0.0, 'o': 0.0}

    def one(j):
        kind, key, url, raw, dst = j
        if o.synthetic:
            synth(raw, 1.2 if kind == 'h' else 3)
        elif not fetch(url, raw):
            return kind, key, None
        d = encode(raw, dst, o.kbps)
        os.remove(raw)
        return kind, key, d

    done, have, missing = 0, {'h': [], 'o': []}, []
    with cf.ThreadPoolExecutor(max_workers=o.jobs) as ex:
        for kind, key, d in ex.map(one, jobs):
            done += 1
            if d is None:
                missing.append('%s %s' % (kind, key))
            else:
                secs[kind] += d; have[kind].append(key)
            if done % 100 == 0:
                print('  %d / %d' % (done, len(jobs)), flush=True)
    shutil.rmtree(tmp, ignore_errors=True)
    if missing:
        print('not on the site (left out of the pack): ' + ', '.join(missing))
        if len(missing) > 0.02 * len(jobs):
            raise SystemExit('too many files missing (%d of %d)' % (len(missing), len(jobs)))
    surahs = sorted(have['o'])
    by = {}
    for s, a in sorted(have['h']):
        by.setdefault(s, []).append(a)
    man = {'v': 1, 'made': datetime.date.today().isoformat(), 'kbps': o.kbps,
           'h': {str(s): ranges(v) for s, v in sorted(by.items())}, 'o': surahs,
           'who': {'h': 'محمود خليل الحصري (المصحف المعلّم)', 'o': 'عبد الرحمن العوسي'}}
    with open(os.path.join(root, 'manifest.js'), 'w', encoding='utf-8') as f:
        f.write('/* حزمة التلاوة: ما فيها من آياتٍ وسور. يكتبه src/tools/audio_pack.py */\nwindow.WAHA_AUDIO=%s;\n' % json.dumps(man, ensure_ascii=False, separators=(',', ':')))
    with open(os.path.join(root, 'SOURCES.txt'), 'w', encoding='utf-8') as f:
        f.write(SOURCES % o.kbps)
    size = sum(os.path.getsize(os.path.join(b, x)) for b, _, fs in os.walk(root) for x in fs)
    print('teaching voice %.1f h · listening voice %.1f h · %d files · %.1f MB' % (secs['h'] / 3600, secs['o'] / 3600, len(jobs), size / 1e6))


if __name__ == '__main__':
    main()
