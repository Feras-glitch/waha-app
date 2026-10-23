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

  /* the two other sections, read for the oasis (scene counters, «سطر اليوم», «تقرير الجمعة»); nothing here writes to them */
  function dayStart(t) { var d = t ? new Date(t) : new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function hsUser(id) { var us = lsGet('waha.hasaniya_v13_users'); return Array.isArray(us) ? us.filter(function (u) { return u && u.id === 'kz_' + id; })[0] || null : null; }
  window.KZ_SECTIONS = {
    /* since: start of the period (default: today) */
    kunuz: function (i, since) {
      var id = ids[i], d = id && lsGet('kb-kid-' + id), prog = (d && d.prog) || {}, from = since || dayStart();
      var all = Object.keys(prog), fresh = all.filter(function (k) { return prog[k] && +prog[k].d >= from; });
      return { gems: all.length, fresh: fresh };
    },
    hasaniya: function (i, since) {
      var id = ids[i], u = id && hsUser(id), st = (u && u.state) || {}, from = since || dayStart();
      var ss = st.stationStatus || {}, stamps = st.stampDates || {}, vs = st.verseStats || {};
      var days = (st.activeDays || []).filter(function (k) { return k >= dayKey(from); });
      return {
        stations: Object.keys(ss).filter(function (k) { return ss[k] === 'completed'; }).length,
        points: st.points || 0,
        days: days.length,
        verses: Object.keys(vs).filter(function (k) { var s = vs[k] || {}; return Math.max(+s.lastCorrect || 0, +s.lastWrong || 0) >= from; }).length,
        stamped: Object.keys(stamps).filter(function (k) { return +stamps[k] >= from; }).length
      };
    },
    /* misses since a time: «كنوز البيان» questions (lesson|question) and Hasaniya verses answered wrongly last */
    misses: function (i, since) {
      var id = ids[i], out = [], from = since || 0; if (!id) return out;
      var d = lsGet('kb-kid-' + id), qm = (d && d.qmiss) || {};
      Object.keys(qm).forEach(function (k) { if (+qm[k] > from) out.push({ g: 'kz', id: k, t: +qm[k] }); });
      var u = hsUser(id), vs = (u && u.state && u.state.verseStats) || {};
      Object.keys(vs).forEach(function (k) { var s = vs[k] || {}; if (+s.lastWrong > from && +s.lastWrong > (+s.lastCorrect || 0)) out.push({ g: 'hsq', id: k, t: +s.lastWrong }); });
      return out;
    }
  };
})();
