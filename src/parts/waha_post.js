/* ===== كنوز البيان ⇄ واحة اللسان العربي: المهايئ (يعمل بعد الواحة) =====
   1) خطاب البنات: كل نصٍّ فيه ⟨مذكر|مؤنث⟩ يُحلّ حسب جنس الطفل الحالي، في الصفحة والنطق والنوافذ والملفات المصدَّرة.
   2) رمز وليّ الأمر هو رمز «كنوز البيان»، وإدارة الأطفال من التطبيق.
   3) لا يخرج ملفٌّ من الواحة إلا برمز وليّ الأمر وموافقته بعد التنبيه، ويُسجَّل في سجلّ التطبيق.
   4) زرّ العودة إلى «كنوز البيان»، والنسخ الاحتياطي من التطبيق (مشفّرًا). */
(function () {
  'use strict';
  if (!window.KUNUZ || window.KZ_NOFAM) return;
  var FAMKEY = 'kb-family-v1';
  function famGet() { try { return JSON.parse(localStorage.getItem(FAMKEY)) || null; } catch (e) { return null; } }
  function famSet(F) { try { localStorage.setItem(FAMKEY, JSON.stringify(F)); } catch (e) {} }

  /* ---------- 1) gender markers ---------- */
  var RX = /⟨([^|⟨⟩]*)\|([^⟨⟩]*)⟩/g;
  function isF() { try { return fem(); } catch (e) { return false; } }
  function R(s) { return s == null ? s : String(s).replace(RX, function (m, a, b) { return isF() ? b : a; }); }
  window.KZR = R;
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  function fixText(n) {
    var d = n.data;
    if (n.__kzO === d && n.__kzS != null) { var o = R(n.__kzS); if (o !== d) { n.__kzO = o; n.data = o; } return; }
    if (d.indexOf('⟨') < 0) { n.__kzS = null; return; }
    n.__kzS = d; var out = R(d); n.__kzO = out; n.data = out;
  }
  function fixAttr(e, a) {
    var v = e.getAttribute(a); if (v == null) return;
    var s = e.__kzA || (e.__kzA = {});
    if (s['o' + a] === v && s['s' + a] != null) { var o = R(s['s' + a]); if (o !== v) { s['o' + a] = o; e.setAttribute(a, o); } return; }
    if (v.indexOf('⟨') < 0) { s['s' + a] = null; return; }
    s['s' + a] = v; var out = R(v); s['o' + a] = out; e.setAttribute(a, out);
  }
  function fixEl(e) { for (var i = 0; i < ATTRS.length; i++) fixAttr(e, ATTRS[i]); }
  function skip(n) { return n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'STYLE'); }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { fixText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (skip(root)) return;
    if (root.nodeType === 1) fixEl(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return skip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    var n; while ((n = tw.nextNode())) { if (n.nodeType === 3) fixText(n); else fixEl(n); }
  }
  var mo = new MutationObserver(function (recs) {
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (r.type === 'characterData') fixText(r.target);
      else if (r.type === 'attributes') fixAttr(r.target, r.attributeName);
      else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
    }
    tidy();
  });
  walk(document.body);
  mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  /* speech, dialogs */
  function Rp(p) { return Array.isArray(p) ? p.map(function (x) { return typeof x === 'string' ? R(x) : x; }) : (typeof p === 'string' ? R(p) : p); }
  if (typeof say === 'function') { var _say = say; say = function (parts, opts) { return _say(Rp(parts), opts); }; }
  if (typeof ttsSay === 'function') { var _tts = ttsSay; ttsSay = function (t, tok) { return _tts(R(t), tok); }; }
  ['alert', 'confirm', 'prompt'].forEach(function (f) { var o = window[f]; if (typeof o !== 'function') return; window[f] = function () { var a = [].slice.call(arguments); if (a.length) a[0] = R(a[0]); return o.apply(window, a); }; });
  /* trip log for the parent: store resolved text (the log may be read while another child is selected) */
  if (typeof tripLogSave === 'function' && typeof TRIP !== 'undefined') {
    var _tls = tripLogSave;
    tripLogSave = function () {
      var keep = (TRIP.cards || []).map(function (c) { return { c: c, t: c.t, b: c.body && c.body.slice(), q: c.q, l: c.label }; });
      keep.forEach(function (k) { if (typeof k.t === 'string') k.c.t = R(k.t); if (k.b) k.c.body = k.b.map(function (x) { return typeof x === 'string' ? R(x) : x; }); if (typeof k.q === 'string') k.c.q = R(k.q); if (typeof k.l === 'string') k.c.label = R(k.l); });
      try { return _tls.apply(this, arguments); } finally { keep.forEach(function (k) { k.c.t = k.t; if (k.b) k.c.body = k.b; k.c.q = k.q; k.c.label = k.l; }); }
    };
  }

  /* ---------- 2) parent PIN = the family PIN ---------- */
  var PARENT_UNTIL = 0, LAST_PIN = 0;
  async function famHash(salt, pin) {
    var txt = salt + ':' + pin;
    try { if (window.crypto && crypto.subtle) { var h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)); return 's' + [].map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); } } catch (e) {}
    var x = 0; for (var i = 0; i < txt.length; i++) { x = (x * 131 + txt.charCodeAt(i)) >>> 0; } return 'h' + x.toString(36);
  }
  pinSet = function () { return true; };
  pinSave = async function () {};
  /* the PIN lock shared with كنوز البيان and the Hasaniya (key kb-pin-lock): every fifth wrong entry locks for 1, 2, 4 … 15 minutes */
  var LOCK_KEY = 'kb-pin-lock', LOCK_MAX = 15 * 60000;
  function lockGet() { try { var o = JSON.parse(localStorage.getItem(LOCK_KEY) || '{}') || {}; return { fails: +o.fails || 0, until: Math.min(+o.until || 0, Date.now() + LOCK_MAX) }; } catch (e) { return { fails: 0, until: 0 }; } }
  function lockLeft() { return Math.max(0, lockGet().until - Date.now()); }
  function lockFail() { var o = lockGet(); o.fails++; if (o.fails % 5 === 0) o.until = Date.now() + Math.min(LOCK_MAX, 60000 * Math.pow(2, o.fails / 5 - 1)); try { localStorage.setItem(LOCK_KEY, JSON.stringify(o)); } catch (e) {} }
  function lockMsg() { var s = Math.ceil(lockLeft() / 1000); return 'محاولاتٌ خاطئةٌ كثيرة. ' + (s >= 60 ? 'انتظروا ' + Math.ceil(s / 60) + ' دقيقة.' : 'انتظروا ' + s + ' ثانية.'); }
  pinCheck = async function (v) {
    var F = famGet(); if (!F || !F.pin) return false;
    if (lockLeft()) { setTimeout(function () { var fb = $('pinFb'); if (fb) fb.textContent = lockMsg(); }, 0); return false; }
    var ok = (await famHash(F.salt || '', String(v).trim())) === F.pin;
    if (ok) { try { localStorage.removeItem(LOCK_KEY); } catch (e) {} PARENT_UNTIL = Date.now() + 15 * 60 * 1000; LAST_PIN = Date.now(); resetCancelByPin(); }
    else { lockFail(); if (lockLeft()) setTimeout(function () { var fb = $('pinFb'); if (fb) fb.textContent = lockMsg(); }, 0); }
    return ok;
  };
  /* a pending «forgot PIN» request (made in the parent corner) is cancelled by anyone who knows the current PIN, and shown to everyone meanwhile */
  function resetCancelByPin() {
    var F = famGet(); if (!F || !F.resetReq) return;
    F.resetReq = null; (F.pinLog = F.pinLog || []).push({ t: Date.now(), k: 'cancel-pin-oasis' }); famSet(F);
    var b = document.getElementById('kzReset'); if (b) b.remove();
  }
  /* a pending request counts the days it was seen and notices a clock moved back (the same function as resetSeen in كنوز البيان) */
  function resetSeen(F) {
    var r = F && F.resetReq, now = Date.now(); if (!r) return false;
    var max = Math.max(+r.max || 0, +r.at || 0);
    if (now < max - 2 * 3600e3) { r.due = Math.max(+r.due || 0, now + 72 * 3600e3); r.days = []; r.back = (+r.back || 0) + 1; }
    r.max = Math.max(max, now); var t = new Date(now), d = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
    r.days = Array.isArray(r.days) ? r.days : []; if (r.days.indexOf(d) < 0) r.days = r.days.concat(d).slice(-10);
    return true;
  }
  (function resetBanner() {
    var F = famGet(); if (!F || !F.resetReq) return;
    if (resetSeen(F)) famSet(F);
    var d = function (t) { try { return new Date(t).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return ''; } };
    var b = document.createElement('a'); b.id = 'kzReset'; b.href = 'kunuz/index.html#parent'; b.setAttribute('role', 'status');
    b.style.cssText = 'display:block;margin:8px 12px;padding:10px 14px;border-radius:12px;background:#fde8e4;color:#7a2318;border:1px solid #e9a99c;text-decoration:none;font-family:var(--f-ui);line-height:1.7';
    b.textContent = '⚠ طُلبت إعادة ضبط رمز وليّ الأمر يوم ' + d(F.resetReq.at) + '، ويمكن تنفيذها بعد ' + d(F.resetReq.due) + '. إن لم تطلبوها فادخلوا ركن وليّ الأمر برمزكم الحالي فيُلغى الطلب.';
    document.body.insertBefore(b, document.body.firstChild);
  })();
  try { var pu = +sessionStorage.getItem('kz-parent-until') || 0; sessionStorage.removeItem('kz-parent-until'); if (pu > Date.now()) PARENT_UNTIL = Math.min(pu, Date.now() + 15 * 60 * 1000); } catch (e) {}
  if (typeof pinGate === 'function') { var _gate = pinGate; pinGate = function (then, opts) { if (Date.now() < PARENT_UNTIL) { PARENT_UNTIL = Date.now() + 15 * 60 * 1000; return then(); } return _gate(then, opts); }; }
  function needParent() { return Date.now() < PARENT_UNTIL ? Promise.resolve(true) : new Promise(function (res) { pinGate(function () { res(true); }); }); }
  /* the parent's session ends as soon as the oasis shows anything but the parent board */
  if (typeof go === 'function') { var _goP = go; go = function (o) { if (o !== 'dad') PARENT_UNTIL = 0; return _goP.apply(this, arguments); }; }
  /* before anything leaves the device the PIN is typed for that very action (an open dashboard is not enough) */
  function freshParent() { return Date.now() - LAST_PIN < 30000 ? Promise.resolve(true) : new Promise(function (res) { _gate(function () { res(true); }); }); }

  /* ---------- children are managed in كنوز البيان ---------- */
  function setFamCur(i) { var F = famGet(); var id = (window.KZ_IDS || [])[i]; if (F && id && F.cur !== id) { F.cur = id; famSet(F); } }
  kidsSheet = function () {
    var s = $('sheet');
    s.innerHTML = '<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">من يلعب؟</h2><button class="x" aria-label="إغلاق">✕</button></div>' +
      '<div id="kidRows" style="display:flex;flex-direction:column;gap:8px"></div>' +
      '<div class="row" style="border-top:1px solid var(--line);padding-top:8px"><button class="btn ghost sm" type="button" id="ksDad">لوحة الواحة</button><button class="btn ghost sm" type="button" id="ksTeacher">المعلم</button><a class="btn ghost sm" href="kunuz/index.html#parent" id="ksCorner">ركن وليّ الأمر</a></div>' +
      '<p class="note">«ركن وليّ الأمر» فيه ملفات الأطفال (الاسم والجنس وسنة الميلاد والصورة)، والموافقات، والنسخ الاحتياطي. وسنة الميلاد تحدّد طريقة اللعب هنا: حتى الثامنة يختار الطفل من خيارات، ومن التاسعة يكتب.</p>';
    var rows = s.querySelector('#kidRows');
    kids.forEach(function (k, i) {
      var r = el('div', 'row'); r.style.alignItems = 'center';
      var b = el('button', 'chip2', avatarHtml(k, 28) + ' ' + esc(k.name)); b.type = 'button'; b.setAttribute('aria-pressed', i === kid);
      b.addEventListener('click', function () { kid = i; store.set('kid', kid); setFamCur(i); closeSheet(); onKid(); });
      r.append(b); rows.appendChild(r);
    });
    s.querySelector('#ksDad').addEventListener('click', function () { pinGate(function () { TEACHER = false; go('dad'); }); });
    s.querySelector('#ksTeacher').addEventListener('click', function () { pinGate(function () { TEACHER = true; go('dad'); }); });
    showSheet(); s.querySelector('.x').addEventListener('click', closeSheet);
  };
  kidEditSheet = function () { location.href = 'kunuz/index.html#parent'; };
  if (typeof onKid === 'function') { var _onKid = onKid; onKid = function () { var r = _onKid.apply(this, arguments); walk(document.body); return r; }; }

  /* ---------- 3) nothing leaves the device without the parent ---------- */
  function lastReset() { var F = famGet(), r = F && F.pinResets; return Array.isArray(r) && r.length ? +r[r.length - 1] || 0 : 0; }
  function consentSheet(name) {
    return new Promise(function (res) {
      var s = $('sheet'), k = (typeof K === 'function' && K()) || {}, f = k.gender === 'f', n = esc(k.name || 'الطفل'), r = lastReset(), when = '';
      try { when = new Date(r).toLocaleDateString('ar-EG'); } catch (e) {}
      s.innerHTML = '<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">تنبيهٌ قبل إخراج ملف</h2><button class="x" aria-label="إغلاق">✕</button></div>' +
        '<p style="margin:0">سيخرج من الجهاز: <b>' + esc(name) + '</b></p>' +
        '<p class="note">قد يحمل اسم ' + n + (f ? ' وصوتها وكتابتها' : ' وصوته وكتابته') + '. وبعد إرساله إلى المعلم أو غيره لا يبقى في يدكم: من يصله يستطيع أن يحفظه أو يعيد إرساله.</p>' +
        (r && Date.now() - r < 30 * 864e5 ? '<p class="note" style="color:var(--bad)">⚠ أُعيد ضبط رمز وليّ الأمر يوم ' + esc(when) + '. إن لم تكونوا أنتم من أعاده فلا توافقوا، وراجعوا ركن وليّ الأمر.</p>' : '') +
        '<label class="row" style="gap:8px;align-items:center"><input type="checkbox" id="kzOk"> أوافق على إخراج هذا الملف</label>' +
        '<div class="btns" style="justify-content:flex-start"><button class="btn" type="button" id="kzGo" disabled>أخرجوه</button><button class="btn ghost" type="button" id="kzNo">إلغاء</button></div>';
      var settled = false, mo = null;
      var done = function (v) { if (settled) return; settled = true; if (mo) mo.disconnect(); closeSheet(); res(v); };
      showSheet();
      /* Esc, a tap outside or the Android back button hide the sheet: that is a «no» */
      mo = new MutationObserver(function () { if (s.hidden) done(false); }); mo.observe(s, { attributes: true, attributeFilter: ['hidden'] });
      s.querySelector('.x').addEventListener('click', function () { done(false); });
      s.querySelector('#kzNo').addEventListener('click', function () { done(false); });
      s.querySelector('#kzOk').addEventListener('change', function (e) { s.querySelector('#kzGo').disabled = !e.target.checked; });
      s.querySelector('#kzGo').addEventListener('click', function () { done(true); });
    });
  }
  function logExport(name) {
    var F = famGet(); if (!F) return;
    var row = { d: Date.now(), name: String(name), kid: (window.KZ_IDS || [])[kid] || null }, r = lastReset();
    if (r && Date.now() - r < 30 * 864e5) row.afterReset = r;
    F.waLog = F.waLog || []; F.waLog.push(row);
    if (F.waLog.length > 200) F.waLog = F.waLog.slice(-200);
    famSet(F);
  }
  if (typeof saveFile === 'function') {
    var _save = saveFile;
    saveFile = async function (name, text, fb) {
      await freshParent();
      var ok = await consentSheet(name);
      if (!ok) { if (fb) { fb.textContent = 'لم يخرج شيء.'; fb.className = 'fb'; } return; }
      logExport(name);
      return _save(name, typeof text === 'string' ? R(text) : text, fb || document.createElement('p'));
    };
  }

  /* the Friday report can be copied out: the clipboard is a way out of the device too */
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      var _wt = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = async function (t) {
        var label = (String(t || '').split('\n')[0].slice(0, 60) || 'نص') + ' (نسخ إلى الحافظة)';
        await freshParent();
        if (!(await consentSheet(label))) throw new DOMException('cancelled by the parent', 'AbortError');
        logExport(label);
        return _wt(R(t));
      };
    }
  } catch (e) {}

  /* ---------- 4) way home, backups, settings that do not apply here ---------- */
  function tidy() {
    var b = document.getElementById('ksBackup');
    if (b && !b.__kz) {
      b.__kz = 1; var box = b.closest('.btns');
      if (box) { box.hidden = true; var p = box.previousElementSibling; if (p && p.classList.contains('note')) p.textContent = 'تقدّم الواحة وتسجيلاتها داخلةٌ في النسخة الاحتياطية المشفّرة لـ«كنوز البيان»: ركن وليّ الأمر ← الأمان والنسخ الاحتياطي.'; }
    }
    var ai = document.getElementById('ksAi'); if (ai && !ai.__kz) { ai.__kz = 1; var l = ai.closest('label'); if (l) l.hidden = true; }
  }
  tidy();
  try { if (new URLSearchParams(location.search).get('dad')) setTimeout(function () { pinGate(function () { TEACHER = false; go('dad'); }); }, 250); } catch (e) {}
})();
