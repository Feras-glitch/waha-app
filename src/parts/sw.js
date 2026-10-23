/* واحة اللسان العربي — عامل الخدمة الوحيد للمنتج كله: الواحة (./) و«كنوز البيان» (kunuz/) والحسنية (hasaniya/).
   يحفظ كل الملفات عند أول فتح فيعمل التطبيق دون إنترنت. بيانات الأطفال لا تمرّ من هنا: هي في ذاكرة المتصفح على الجهاز.
   لا يمسح إلا ذاكرته هو (waha-…) وذاكرة النسخ القديمة من هذا المنتج، ولا يقترب من ذاكرة أي تطبيق آخر على النطاق نفسه.
   أندرويد وسطح المكتب يقرآن الملفات من الجهاز مباشرة، فلا يُسجَّل فيهما. */
var CACHE = 'waha-__VERSION__';
var ASSETS = __ASSETS__;
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
  }).then(function () { return self.clients.claim(); }));
});

/* the page for a navigation: the section's own index.html */
function pageFor(u) {
  var p = u.pathname, base = new URL('./', self.location.href).pathname;
  var rest = p.indexOf(base) === 0 ? p.slice(base.length) : p;
  if (/^kunuz\//.test(rest)) return './kunuz/index.html';
  if (/^hasaniya\//.test(rest)) return './hasaniya/index.html';
  return './index.html';
}
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || !/^https?:/.test(r.url)) return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
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
