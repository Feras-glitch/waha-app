/* ===== الواحة ⇄ ملفات الأطفال ورمز وليّ الأمر (يعمل قبل برنامج الواحة) =====
   الأطفال ورمز وليّ الأمر من ملفات التطبيق، فلا إعداد ثانيًا. لكل طفلٍ معرّفه الثابت، وبه تُحفظ بياناته في الواحة. */
(function () {
  'use strict';
  window.KUNUZ = true;
  function lsGet(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var FAM = lsGet('kb-family-v1');
  window.KZ_FAM = FAM;
  lsSet('oasis:pin', { s: 'kunuz', h: 'family' });   /* the oasis must not ask for its own PIN: the family PIN is checked after load */
  if (!FAM || !Array.isArray(FAM.kids) || !FAM.kids.length || !FAM.pin) {
    window.KZ_NOFAM = true;                          /* setup starts in the app */
    location.replace('kunuz/index.html');
    return;
  }
  var year = new Date().getFullYear();
  var kids = FAM.kids.map(function (k) {
    var age = k.by ? Math.max(4, Math.min(16, year - k.by)) : 10;
    return { id: k.id, name: k.name, gender: k.g === 'f' ? 'f' : 'm', age: age };
  });
  lsSet('oasis:kids', kids);
  try { localStorage.removeItem('oasis:kidmap'); } catch (e) {}
  var want = null; try { want = new URLSearchParams(location.search).get('k'); } catch (e) {}
  var ids = kids.map(function (k) { return k.id; });
  var cur = ids.indexOf(want || FAM.cur);
  lsSet('oasis:kid', cur >= 0 ? cur : 0);
  window.KZ_IDS = ids;
})();
