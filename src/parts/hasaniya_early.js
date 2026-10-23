/* ===== الحسنية داخل «واحة اللسان العربي» (1 من 2): يعمل قبل كل ملفات الحسنية =====
   مخزن الحسنية هنا منفصلٌ عن تطبيق الحسنية المستقلّ ولو اجتمعا على نطاقٍ واحد (github.io):
   كل مفتاح «hasaniya_…» يُحفظ باسم «waha.hasaniya_…»، وقاعدة التسجيلات «hasaniya-rec» باسم «waha.hasaniya-rec».
   فلا يرى أحدهما أطفال الآخر، ولا يمسح أحدهما بيانات الآخر. */
(function () {
  'use strict';
  var NS = 'waha.';
  window.KZ_HS_NS = NS;
  function map(k) { k = String(k); return k.indexOf('hasaniya_') === 0 ? NS + k : k; }
  try {
    var LS = window.localStorage, S = Storage.prototype;
    var g = S.getItem, s = S.setItem, r = S.removeItem;
    S.getItem = function (k) { return g.call(this, this === LS ? map(k) : k); };
    S.setItem = function (k, v) { return s.call(this, this === LS ? map(k) : k, v); };
    S.removeItem = function (k) { return r.call(this, this === LS ? map(k) : k); };
  } catch (e) {}
  try {
    var F = IDBFactory.prototype, o = F.open, d = F.deleteDatabase;
    var db = function (n) { return n === 'hasaniya-rec' ? NS + n : n; };
    F.open = function (n) { var a = [].slice.call(arguments); a[0] = db(n); return o.apply(this, a); };
    F.deleteDatabase = function (n) { return d.call(this, db(n)); };
  } catch (e) {}
})();
