/* واحة اللسان العربي: يعمل دون إنترنت بعد أول فتح (في نسخة الويب). أندرويد وسطح المكتب يقرآن الملفات من الجهاز مباشرة. */
const CACHE = "waha-v1.5";
const ASSETS = ["./", "./index.html", "./manifest.json", "./js/android-shim.js", "./fonts/fonts.css",
  "./fonts/Amiri-Regular.woff", "./fonts/Amiri-Bold.woff", "./fonts/Tajawal-Regular.woff", "./fonts/Tajawal-Medium.woff", "./fonts/Tajawal-Bold.woff", "./fonts/Tajawal-ExtraBold.woff", "./fonts/ArefRuqaa-Regular.woff", "./fonts/ArefRuqaa-Bold.woff"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith("http")) return;
  const url = new URL(e.request.url); if (url.pathname.includes("/hasaniya/")) return; /* للحسنية عامل الخدمة الخاص بها */
  const nav = e.request.mode === "navigate";
  e.respondWith(caches.match(e.request, { ignoreSearch: nav }).then(c => c || (nav ? caches.match("./index.html") : undefined)).then(cached => {
    const net = fetch(e.request).then(res => { if (res && res.status === 200 && res.type === "basic") { const cl = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); } return res; }).catch(() => cached);
    return cached || net; }));
});
