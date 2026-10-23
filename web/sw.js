/* واحة اللسان العربي — عامل الخدمة الوحيد للمنتج كله: الواحة (./) و«كنوز البيان» (kunuz/) والحسنية (hasaniya/).
   يحفظ كل الملفات عند أول فتح فيعمل التطبيق دون إنترنت. بيانات الأطفال لا تمرّ من هنا: هي في ذاكرة المتصفح على الجهاز.
   لا يمسح إلا ذاكرته هو (waha-…) وذاكرة النسخ القديمة من هذا المنتج، ولا يقترب من ذاكرة أي تطبيق آخر على النطاق نفسه.
   أندرويد وسطح المكتب يقرآن الملفات من الجهاز مباشرة، فلا يُسجَّل فيهما. */
var CACHE = 'waha-86a98800ff';
var ASSETS = ["./", "./index.html", "./manifest.json", "./fonts/Amiri-Bold.woff", "./fonts/Amiri-Regular.woff", "./fonts/AmiriQuran-Regular.woff", "./fonts/ArefRuqaa-Bold.woff", "./fonts/ArefRuqaa-Regular.woff", "./fonts/NotoNaskhArabic-Var.woff", "./fonts/ReemKufi-Var.woff", "./fonts/Tajawal-Bold.woff", "./fonts/Tajawal-ExtraBold.woff", "./fonts/Tajawal-Medium.woff", "./fonts/Tajawal-Regular.woff", "./fonts/fonts.css", "./hasaniya/index.html", "./hasaniya/css/styles.css", "./hasaniya/img/scenes/s10v14.webp", "./hasaniya/img/scenes/s11av11.webp", "./hasaniya/img/scenes/s11av5.webp", "./hasaniya/img/scenes/s11bv3.webp", "./hasaniya/img/scenes/s11bv4.webp", "./hasaniya/img/scenes/s11bv9.webp", "./hasaniya/img/scenes/s12av3.webp", "./hasaniya/img/scenes/s12bv5.webp", "./hasaniya/img/scenes/s12cv6.webp", "./hasaniya/img/scenes/s13v1.webp", "./hasaniya/img/scenes/s13v4.webp", "./hasaniya/img/scenes/s2v1.webp", "./hasaniya/img/scenes/s3v7.webp", "./hasaniya/img/scenes/s4v11.webp", "./hasaniya/img/scenes/s4v12.webp", "./hasaniya/img/scenes/s4v14.webp", "./hasaniya/img/scenes/s5v1.webp", "./hasaniya/img/scenes/s5v10.webp", "./hasaniya/img/scenes/s5v9.webp", "./hasaniya/img/scenes/s6v4.webp", "./hasaniya/img/scenes/s6v7.webp", "./hasaniya/img/scenes/s7v1.webp", "./hasaniya/img/scenes/s8v2.webp", "./hasaniya/img/scenes/s9v1.webp", "./hasaniya/img/scenes/s9v3.webp", "./hasaniya/js/achievements.js", "./hasaniya/js/android-shim.js", "./hasaniya/js/app.js", "./hasaniya/js/ask.js", "./hasaniya/js/audio.js", "./hasaniya/js/backup.js", "./hasaniya/js/companion.js", "./hasaniya/js/config.js", "./hasaniya/js/dashboard.js", "./hasaniya/js/editor.js", "./hasaniya/js/exercises.js", "./hasaniya/js/extras.js", "./hasaniya/js/game.js", "./hasaniya/js/guide.js", "./hasaniya/js/i18n.js", "./hasaniya/js/journey.js", "./hasaniya/js/leitner.js", "./hasaniya/js/parent.js", "./hasaniya/js/parser.js", "./hasaniya/js/pin.js", "./hasaniya/js/places.js", "./hasaniya/js/print.js", "./hasaniya/js/profile.js", "./hasaniya/js/progress.js", "./hasaniya/js/quiz.js", "./hasaniya/js/recall.js", "./hasaniya/js/recitation.js", "./hasaniya/js/safety.js", "./hasaniya/js/shadow.js", "./hasaniya/js/storage.js", "./hasaniya/js/studio.js", "./hasaniya/js/tools.js", "./hasaniya/js/ui.js", "./hasaniya/js/upgrades.js", "./hasaniya/js/users.js", "./hasaniya/js/utils.js", "./hasaniya/js/voice.js", "./hasaniya/js/voicepack.js", "./hasaniya/js/waha-early.js", "./hasaniya/js/waha-late.js", "./hasaniya/js/weekly.js", "./hasaniya/js/data/discussion.js", "./hasaniya/js/data/explanations.js", "./hasaniya/js/data/khilaf.js", "./hasaniya/js/data/links.js", "./hasaniya/js/data/manzumah.js", "./hasaniya/js/data/places.js", "./hasaniya/js/data/quizzes.js", "./hasaniya/js/data/riddles.js", "./hasaniya/js/data/scenes.js", "./hasaniya/js/data/stickers.js", "./hasaniya/js/data/stories.js", "./js/android-shim.js", "./kunuz/index.html"];
var OLD = /^(waha-|kunuz-app-|kunuz-fonts$)/;

function precache() {
  return caches.open(CACHE).then(function (c) {
    return c.addAll(ASSETS.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  });
}
self.addEventListener('install', function (e) {
  e.waitUntil(precache().then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return OLD.test(k) && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }).then(function () { return manifestKeep().catch(function () {}); }));
});

/* the page for a navigation: the section's own index.html */
function pageFor(u) {
  var p = u.pathname, base = new URL('./', self.location.href).pathname;
  var rest = p.indexOf(base) === 0 ? p.slice(base.length) : p;
  if (/^kunuz\//.test(rest)) return './kunuz/index.html';
  if (/^hasaniya\//.test(rest)) return './hasaniya/index.html';
  return './index.html';
}
/* the recitation pack (audio/): too large to keep at the first visit, so a file is kept the first time it is heard, in a store
   of its own that a new version of the app does not empty. A player asks for parts of a file (Range); they are cut from the
   kept copy. A whole surah starts at once from the network while it is being kept */
var AUDIO = 'wahaudio-1';
function part(res, range) {
  return res.blob().then(function (b) {
    var n = b.size, m = /^bytes=(\d*)-(\d*)$/.exec((range || '').trim());
    var h = { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' };
    if (!m || (m[1] === '' && m[2] === '')) { h['Content-Length'] = String(n); return new Response(b, { status: 200, headers: h }); }
    var s = m[1] === '' ? Math.max(0, n - +m[2]) : +m[1], t = (m[1] !== '' && m[2] !== '') ? Math.min(+m[2], n - 1) : n - 1;
    if (s >= n || t < s) return new Response('', { status: 416, headers: { 'Content-Range': 'bytes */' + n } });
    h['Content-Range'] = 'bytes ' + s + '-' + t + '/' + n; h['Content-Length'] = String(t - s + 1);
    return new Response(b.slice(s, t + 1), { status: 206, headers: h });
  });
}
/* what the pack holds (audio/manifest.js) is kept with it. The first visit is not yet served by this worker, so the list is fetched
   once here too; otherwise a first launch offline would have no recitation. A changed list means a new pack: the files kept from
   the old one are dropped, so a corrected verse is heard as corrected */
var MANIFEST = new URL('audio/manifest.js', self.location.href).href;
function manifestKeep(res) {
  return (res ? Promise.resolve(res) : fetch(MANIFEST, { cache: 'no-cache' })).then(function (r) {
    if (!r || r.status !== 200) {
      if (r && r.status === 404) return caches.delete(AUDIO);   // no pack in this version
      return;
    }
    return r.clone().text().then(function (txt) {
      return caches.open(AUDIO).then(function (c) {
        return c.match(MANIFEST, { ignoreSearch: true }).then(function (old) { return old ? old.text() : null; }).then(function (was) {
          var drop = (was !== null && was !== txt) ? c.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return c.delete(k); })); }) : Promise.resolve();
          return drop.then(function () { return c.put(MANIFEST, new Response(txt, { headers: { 'Content-Type': 'text/javascript' } })); });
        });
      });
    });
  });
}
var KEEPING = {};   // one download per file, however many parts the player asks for meanwhile
function keep(c, key) {
  if (!KEEPING[key]) KEEPING[key] = fetch(key).then(function (res) { return res && res.status === 200 ? c.put(key, res.clone()).then(function () { return res; }) : res; })
    .then(function (res) { delete KEEPING[key]; return res; }, function (err) { delete KEEPING[key]; throw err; });
  return KEEPING[key].then(function (res) { return res && res.clone(); });
}
function audio(e, u) {
  var r = e.request, key = u.origin + u.pathname, range = r.headers.get('range');
  return caches.open(AUDIO).then(function (c) {
    return c.match(key).then(function (hit) {
      if (hit) return part(hit, range);
      /* a whole surah: one download that plays as it arrives and is kept at the same time (a seek before it is kept asks the network
         for that part only) */
      if (/\/audio\/o\//.test(u.pathname)) {
        if (KEEPING[key] || (range && !/^bytes=0-$/.test(range.trim()))) return fetch(r);
        var once = fetch(key).then(function (res) {
          if (res && res.status === 200) e.waitUntil(c.put(key, res.clone()).catch(function () {}).then(function () { delete KEEPING[key]; }));
          else delete KEEPING[key];
          return res;
        }, function (err) { delete KEEPING[key]; throw err; });
        KEEPING[key] = once;
        return once;
      }
      return keep(c, key).then(function (res) { return res && res.status === 200 ? part(res.clone(), range) : res; }).catch(function () { return fetch(r); });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || !/^https?:/.test(r.url)) return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (/\/audio\/[^?#]+\.mp3$/.test(u.pathname)) { e.respondWith(audio(e, u)); return; }
  /* what the pack holds: asked of the network first, so a new pack (or none) is seen at once; the kept copy serves offline */
  if (/\/audio\/manifest\.js$/.test(u.pathname)) {
    e.respondWith(fetch(r.url, { cache: 'no-cache' }).then(function (res) {
      if (res && (res.status === 200 || res.status === 404)) e.waitUntil(manifestKeep(res.clone()).catch(function () {}));
      return res;
    }).catch(function () { return caches.match(MANIFEST, { cacheName: AUDIO, ignoreSearch: true }); }));
    return;
  }
  var nav = r.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(r, { ignoreSearch: nav }).then(function (hit) {
      if (hit) return hit;
      if (nav) {
        /* another app on this origin may have emptied our store: refill it in the background */
        c.keys().then(function (ks) { if (ks.length < ASSETS.length) precache().catch(function () {}); });
      }
      return fetch(r).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') { var cp = res.clone(); c.put(r, cp); }
        return res;
      }).catch(function () { return nav ? c.match(pageFor(u)) : undefined; });
    });
  }));
});
