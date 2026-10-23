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
  /* numbers on screen are written ١٢٣, as in «كنوز البيان» (2.8). What is typed, Chinese or English text, and files that leave keep theirs */
  var AD = '٠١٢٣٤٥٦٧٨٩', LATIN = 'textarea,input,pre,code,[data-latin],[lang]:not([lang^="ar"])';
  /* and the «·» separator beside a number becomes «|»: next to ١٢٣ it reads as a zero */
  function D(s) { return s.replace(/[0-9]/g, function (c) { return AD[c]; }).replace(/([٠-٩]) ?·/g, '$1 |').replace(/· ?(?=[٠-٩])/g, '| '); }
  function latin(n) { var e = n.nodeType === 1 ? n : n.parentElement; try { return !!(e && e.closest(LATIN)); } catch (x) { return false; } }
  function show(s, n) { var o = R(s); return latin(n) ? o : D(o); }
  function fixText(n) {
    var d = n.data;
    if (n.__kzO === d && n.__kzS != null) { var o = show(n.__kzS, n); if (o !== d) { n.__kzO = o; n.data = o; } return; }
    if (d.indexOf('⟨') < 0 && !/[0-9]/.test(d) && !/[٠-٩] ?·|· ?[٠-٩]/.test(d)) { n.__kzS = null; return; }
    var out = show(d, n); if (out === d) { n.__kzS = null; return; }
    n.__kzS = d; n.__kzO = out; n.data = out;
  }
  function fixAttr(e, a) {
    var v = e.getAttribute(a); if (v == null) return;
    var s = e.__kzA || (e.__kzA = {});
    if (s['o' + a] === v && s['s' + a] != null) { var o = show(s['s' + a], e); if (o !== v) { s['o' + a] = o; e.setAttribute(a, o); } return; }
    if (v.indexOf('⟨') < 0 && !/[0-9]/.test(v)) { s['s' + a] = null; return; }
    var out = show(v, e); if (out === v) { s['s' + a] = null; return; }
    s['s' + a] = v; s['o' + a] = out; e.setAttribute(a, out);
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
  /* PARENT_UNTIL: the parents' session, opened only from a parents' entry (the hub, the board's own button, «?dad=1») and ending
     fifteen minutes after its PIN at most, never extended. LAST_PIN/LAST_FOR: when the PIN was last typed, and what for
     ('gate' may open the session in the next few seconds; 'export' never does; 'used' is spent) */
  var PARENT_UNTIL = 0, LAST_PIN = 0, LAST_FOR = '', SESSION_MS = 15 * 60 * 1000;
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
  /* checks the PIN against the family's (with the shared lock); 'why' says what it was typed for */
  async function pinVerify(v, why) {
    var F = famGet(); if (!F || !F.pin) return { ok: false, msg: 'لم يُضبط رمز وليّ الأمر بعد.' };
    if (lockLeft()) return { ok: false, msg: lockMsg() };
    if (!String(v || '').trim()) return { ok: false, msg: 'اكتبوا الرمز.' };
    var ok = (await famHash(F.salt || '', String(v).trim())) === F.pin;
    if (ok) { try { localStorage.removeItem(LOCK_KEY); } catch (e) {} LAST_PIN = Date.now(); LAST_FOR = why || 'gate'; resetCancelByPin(); return { ok: true }; }
    lockFail(); return { ok: false, msg: lockLeft() ? lockMsg() : 'الرمز غير صحيح.' };
  }
  pinCheck = async function (v) {
    var r = await pinVerify(v, 'gate');
    if (!r.ok && lockLeft()) setTimeout(function () { var fb = $('pinFb'); if (fb) fb.textContent = lockMsg(); }, 0);
    return r.ok;
  };
  function sessionOpen(at) { PARENT_UNTIL = (at || Date.now()) + SESSION_MS; LAST_FOR = 'used'; }
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
    /* the Android app has a clock the user cannot set (time since the device started): seen again with the wall clock further ahead
       than that clock moved, the request was sped up by hand, and its wait starts again */
    var mono = 0; try { mono = window.AndroidBridge && AndroidBridge.elapsed ? +AndroidBridge.elapsed() : 0; } catch (e) {}
    if (mono) { var o = r.mono; if (o && mono >= o.m && now - o.w > (mono - o.m) + 10 * 60000) { r.due = Math.max(+r.due || 0, now + 72 * 3600e3); r.days = []; r.fwd = (+r.fwd || 0) + 1; } r.mono = { w: now, m: mono }; }
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
  /* a session opened on another board comes along (the parents' hub), with its own end */
  try { var pu = +sessionStorage.getItem('kz-parent-until') || 0; sessionStorage.removeItem('kz-parent-until'); if (pu > Date.now()) PARENT_UNTIL = Math.min(pu, Date.now() + SESSION_MS); } catch (e) {}
  /* inside a session the board's own actions pass; otherwise the PIN is asked. A PIN typed on the board itself (the session ran out
     while the parent was there) opens a new one; a PIN typed on a child's screen is spent on that one action */
  if (typeof pinGate === 'function') {
    var _gate = pinGate;
    pinGate = function (then, opts) {
      if (Date.now() < PARENT_UNTIL) return then();
      return _gate(function () { if (typeof cur !== 'undefined' && cur && cur.o === 'dad' && LAST_FOR === 'gate') sessionOpen(LAST_PIN); try { return then(); } finally { if (LAST_FOR === 'gate') LAST_FOR = 'used'; } }, opts);
    };
  }
  function needParent() { return Date.now() < PARENT_UNTIL ? Promise.resolve(true) : new Promise(function (res) { pinGate(function () { res(true); }); }); }
  /* the board opens only inside a session, or right after the PIN typed to open it; anything else on screen ends the session */
  if (typeof go === 'function') {
    var _goP = go;
    go = function (o) {
      if (o === 'dad' && !(Date.now() < PARENT_UNTIL)) {
        if (LAST_FOR === 'gate' && Date.now() - LAST_PIN < 5000) sessionOpen(LAST_PIN);
        else { var self = this, a = arguments; return pinGate(function () { go.apply(self, a); }); }
      }
      if (o !== 'dad') PARENT_UNTIL = 0;
      return _goP.apply(this, arguments);
    };
  }
  /* a tablet locked or put aside for more than a minute, a page left for another or brought back from the browser's cache:
     the session is over, and the board gives way to the child's home */
  function endSession() { PARENT_UNTIL = 0; if (typeof cur !== 'undefined' && cur && cur.o === 'dad') { try { go('home'); } catch (e) {} } }
  var HID_AT = 0;
  document.addEventListener('visibilitychange', function () { if (document.hidden) HID_AT = Date.now(); else if (HID_AT && Date.now() - HID_AT > 60000) { HID_AT = 0; endSession(); } });
  window.addEventListener('pagehide', function () { PARENT_UNTIL = 0; });
  window.addEventListener('pageshow', function (e) { if (e.persisted) endSession(); });

  /* a restore made in another tab: reload, so this page never writes the old progress back */
  window.addEventListener('storage', function (e) { if (e.key === 'kb-epoch') { try { location.reload(); } catch (x) {} } });

  /* ---------- children are managed in كنوز البيان ---------- */
  function setFamCur(i) { var F = famGet(); var id = (window.KZ_IDS || [])[i]; if (F && id && F.cur !== id) { F.cur = id; famSet(F); } }
  kidsSheet = function () {
    var s = $('sheet');
    s.innerHTML = '<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">من يلعب؟</h2><button class="x" aria-label="إغلاق">✕</button></div>' +
      '<div id="kidRows" style="display:flex;flex-direction:column;gap:8px"></div>' +
      '<div class="row" style="border-top:1px solid var(--line);padding-top:8px"><button class="btn ghost sm" type="button" id="ksParent">👪 للوالدين</button></div>';
    var rows = s.querySelector('#kidRows');
    kids.forEach(function (k, i) {
      var r = el('div', 'row'); r.style.alignItems = 'center';
      var b = el('button', 'chip2', avatarHtml(k, 28) + ' ' + esc(k.name)); b.type = 'button'; b.setAttribute('aria-pressed', i === kid);
      b.addEventListener('click', function () { kid = i; store.set('kid', kid); setFamCur(i); closeSheet(); onKid(); });
      r.append(b); rows.appendChild(r);
    });
    s.querySelector('#ksParent').addEventListener('click', function (e) { e.stopPropagation(); parentHub(); });
    showSheet(); s.querySelector('.x').addEventListener('click', closeSheet);
  };
  /* one way in for the parents (2.8): the three boards are listed together, each a tap away, with the same code. A session opened
     with the code is carried to the next board (sessionStorage, fifteen minutes at most), so the code is not asked again */
  function handoff(url) { try { if (Date.now() < PARENT_UNTIL) sessionStorage.setItem('kz-parent-until', String(PARENT_UNTIL)); } catch (e) {} kzLeave(url); }
  function hsURL() { var id = (window.KZ_IDS || [])[kid]; return 'hasaniya/index.html?parent=1' + (id ? '&kid=' + encodeURIComponent(id) : ''); }
  /* a week for each child by age (idea 4): which section on which day, so the three sections share the week instead of all
     every day; and one week counter, a day counting in any section */
  function weekPlan() {
    var ks = (typeof kids !== 'undefined' && kids) || []; if (!ks.length) return '';
    var plan = function (a) {
      if (a <= 7) return 'الرحلة كلّ يوم · الحسنية الأحد والثلاثاء · الجمعة: تحدّي العائلة والإذاعة';
      if (a <= 8) return 'الرحلة كلّ يوم · الحسنية الأحد والثلاثاء · «كنوز البيان» الاثنين والأربعاء · الجمعة: التحدّي والإذاعة';
      return 'الرحلة كلّ يوم · «كنوز البيان» السبت والاثنين والأربعاء · الحسنية الأحد والثلاثاء · الاستوديو الخميس · الجمعة: التحدّي والإذاعة';
    };
    return '<details class="wkplan" style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">📅 خطة الأسبوع</summary>' +
      '<p class="note" style="margin:6px 0">اقتراحٌ لا قيد. يتمّ الأسبوع بأربعة أيام من السبت إلى الجمعة، ويُحسب اليوم بأيّ قسمٍ لعب فيه الطفل.</p>' +
      ks.map(function (k, i) { var n = 0; try { n = weekPlayed(i); } catch (e) {} return '<p style="margin:4px 0"><b>' + esc(k.name) + '</b> (' + esc(String(k.age)) + '): ' + plan(k.age) + ' <span class="ref">☀️ ' + n + ' من ٤</span></p>'; }).join('') + '</details>';
  }
  function parentHub() {
    var s = $('sheet');
    s.innerHTML = '<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">👪 للوالدين</h2><button class="x" aria-label="إغلاق">✕</button></div>' +
      '<p class="note" style="margin:0 0 8px">مدخلٌ واحد للوحات الثلاث، برمز وليّ الأمر نفسه. وما دامت الجلسة مفتوحة تنتقلون بينها دون أن يُطلب الرمز مرةً أخرى.</p>' +
      '<div class="hub">' +
      '<button class="hubi" type="button" id="ksDad"><b>🌴 لوحة الواحة</b><span>سطر اليوم، والتقدّم، والتسجيلات، وتقرير الجمعة، وواجهة الطفل ومحفوظه</span></button>' +
      '<button class="hubi" type="button" id="ksCorner"><b>💎 ركن وليّ الأمر</b><span>ملفات الأطفال، والرمز، والنسخ الاحتياطي، وأعمال الاستوديو، والمجلّات، وقارئ الأسبوع</span></button>' +
      '<button class="hubi" type="button" id="ksHs"><b>🐪 لوحة الحسنية</b><span>حفظ المنظومة، وتسجيلاتها، وتقاريرها</span></button>' +
      '<button class="hubi" type="button" id="ksTeacher"><b>المعلّم</b><span>مراجعة تسجيلات الواحة على هذا الجهاز</span></button></div>' + weekPlan();
    showSheet(); s.querySelector('.x').addEventListener('click', closeSheet);
    s.querySelector('#ksDad').addEventListener('click', function () { pinGate(function () { TEACHER = false; go('dad'); }); });
    s.querySelector('#ksTeacher').addEventListener('click', function () { pinGate(function () { TEACHER = true; go('dad'); }); });
    s.querySelector('#ksCorner').addEventListener('click', function () { handoff('kunuz/index.html#parent'); });
    s.querySelector('#ksHs').addEventListener('click', function () { handoff(hsURL()); });
  }
  window.KZ_PARENT_HUB = { open: parentHub, corner: function () { handoff('kunuz/index.html#parent'); }, hasaniya: function () { handoff(hsURL()); } };
  kidEditSheet = function () { kzLeave('kunuz/index.html#parent'); };
  if (typeof onKid === 'function') { var _onKid = onKid; onKid = function () { var r = _onKid.apply(this, arguments); walk(document.body); return r; }; }

  /* ---------- 3) nothing leaves the device without the parent ---------- */
  function lastReset() { var F = famGet(), r = F && F.pinResets; return Array.isArray(r) && r.length ? +r[r.length - 1] || 0 : 0; }
  function fmtDay(t) { try { return new Date(t).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  /* after a PIN reset made by waiting (without the recovery code) nothing leaves the device for thirty days, unless the recovery
     code that existed before the reset is typed: whoever waited out the 72 hours may not be the parent */
  function exportHold() { var F = famGet(); return F && +F.exportHold > Date.now() ? +F.exportHold : 0; }
  async function holdLift(code) {
    var F = famGet(), p = F && F.recPrev; if (!p || !p.salt) return false;
    var ok = (await famHash(p.salt, String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''))) === p.h;
    if (ok) { F.exportHold = 0; (F.pinLog = F.pinLog || []).push({ t: Date.now(), k: 'hold-lift' }); famSet(F); } else lockFail();
    return ok;
  }
  /* one sheet before anything leaves: what leaves, that it is then out of the parents' hands, and the PIN typed here for this
     one file (a PIN typed a moment ago for something else does not count, and this one opens nothing else) */
  function consentSheet(name) {
    return new Promise(function (res) {
      var s = $('sheet'), k = (typeof K === 'function' && K()) || {}, f = k.gender === 'f', n = esc(k.name || 'الطفل'), r = lastReset(), hold = exportHold();
      s.innerHTML = '<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">تنبيهٌ قبل إخراج ملف</h2><button class="x" aria-label="إغلاق">✕</button></div>' +
        '<p style="margin:0">سيخرج من الجهاز: <b>' + esc(name) + '</b></p>' +
        '<p class="note">' + (/^idhaa-/.test(String(name)) ? 'فيه أسماء الإخوة الذين شاركوا في الإذاعة وأصواتهم: ' + esc((typeof kids !== 'undefined' ? kids : []).map(function (x) { return x.name; }).join('، ')) : 'قد يحمل اسم ' + n + (f ? ' وصوتها وكتابتها' : ' وصوته وكتابته')) + '. وبعد إرساله إلى المعلم أو غيره لا يبقى في يدكم: من يصله يستطيع أن يحفظه أو يعيد إرساله.</p>' +
        (r && Date.now() - r < 30 * 864e5 ? '<p class="note" style="color:var(--bad)">⚠ تغيّر رمز وليّ الأمر يوم ' + esc(fmtDay(r)) + '. إن لم تكونوا أنتم من غيّره فلا توافقوا، وراجعوا ركن وليّ الأمر.</p>' : '') +
        (hold ? '<p class="note" style="color:var(--bad)">⚠ أُعيد ضبط الرمز بالانتظار دون رمز الاسترداد، فالإخراج موقوفٌ حتى ' + esc(fmtDay(hold)) + '. لرفع الإيقاف الآن اكتبوا <b>رمز الاسترداد القديم</b> (الذي كان قبل إعادة الضبط).</p>' +
          '<label class="note" for="kzRc" style="display:block;margin:6px 0 2px">رمز الاسترداد القديم</label><input id="kzRc" dir="ltr" lang="en" autocomplete="off" autocapitalize="characters" spellcheck="false" style="width:100%">'
          : '<label class="note" for="kzPin" style="display:block;margin:6px 0 2px">رمز وليّ الأمر لهذا الملف</label><input id="kzPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" style="width:100%">') +
        '<label class="row" style="gap:8px;align-items:center;min-height:44px"><input type="checkbox" id="kzOk" style="width:22px;height:22px"> أوافق على إخراج هذا الملف</label>' +
        '<p class="fb" id="kzFb" role="alert"></p>' +
        '<div class="btns" style="justify-content:flex-start"><button class="btn" type="button" id="kzGo" disabled>أخرجوه</button><button class="btn ghost" type="button" id="kzNo">إلغاء</button></div>';
      var settled = false, mo = null, busy = false;
      var done = function (v) { if (settled) return; settled = true; if (mo) mo.disconnect(); closeSheet(); res(v); };
      showSheet();
      /* Esc, a tap outside or the Android back button hide the sheet: that is a «no» */
      mo = new MutationObserver(function () { if (s.hidden) done(false); }); mo.observe(s, { attributes: true, attributeFilter: ['hidden'] });
      s.querySelector('.x').addEventListener('click', function () { done(false); });
      s.querySelector('#kzNo').addEventListener('click', function () { done(false); });
      s.querySelector('#kzOk').addEventListener('change', function (e) { s.querySelector('#kzGo').disabled = !e.target.checked; });
      var fb = s.querySelector('#kzFb');
      s.querySelector('#kzGo').addEventListener('click', async function () {
        if (busy) return; busy = true;
        try {
          if (hold) { if (lockLeft()) { fb.textContent = lockMsg(); return; } if (!(await holdLift((s.querySelector('#kzRc') || {}).value))) { fb.textContent = lockLeft() ? lockMsg() : 'رمز الاسترداد غير صحيح.'; return; } }
          else { var v = await pinVerify((s.querySelector('#kzPin') || {}).value, 'export'); if (!v.ok) { fb.textContent = v.msg; var pi = s.querySelector('#kzPin'); if (pi) { pi.value = ''; try { pi.focus(); } catch (e) {} } return; } }
          done(true);
        } finally { busy = false; }
      });
      var first = s.querySelector('#kzPin') || s.querySelector('#kzRc'); if (first) try { first.focus(); } catch (e) {}
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
  /* files that people read (a report, a page, a text) carry ١٢٣ like the screens (the parents' decision); data files (.json) and
     file names keep theirs, and so do code, preformatted text and typed fields inside a page */
  function digitsFor(name, text) {
    if (typeof text !== 'string') return text;
    var ext = (String(name || '').split('.').pop() || '').toLowerCase();
    if (ext === 'md' || ext === 'txt') return D(text);
    if (ext !== 'html' && ext !== 'htm') return text;
    try {
      var doc = new DOMParser().parseFromString(text, 'text/html'), tw = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_TEXT), n;
      while ((n = tw.nextNode())) { var p = n.parentElement; if (p && /^(SCRIPT|STYLE|CODE|PRE|TEXTAREA)$/.test(p.tagName)) continue; if (/[0-9]/.test(n.data)) n.data = D(n.data); }
      return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    } catch (e) { return text; }
  }
  if (typeof saveFile === 'function') {
    var _save = saveFile;
    saveFile = async function (name, text, fb) {
      var ok = await consentSheet(name);
      if (!ok) { if (fb) { fb.textContent = 'لم يخرج شيء.'; fb.className = 'fb'; } return; }
      logExport(name);
      return _save(name, typeof text === 'string' ? digitsFor(name, R(text)) : text, fb || document.createElement('p'));
    };
  }

  /* the Friday report can be copied out: the clipboard is a way out of the device too */
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      var _wt = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = async function (t) {
        var label = (String(t || '').split('\n')[0].slice(0, 60) || 'نص') + ' (نسخ إلى الحافظة)';
        if (!(await consentSheet(label))) throw new DOMException('cancelled by the parent', 'AbortError');
        logExport(label);
        return _wt(D(R(t)));
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
  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get('dad') || qs.get('k')) history.replaceState(history.state, '', location.pathname);
    if (qs.get('dad')) setTimeout(function () { pinGate(function () { TEACHER = false; go('dad'); }); }, 250);
    if (qs.get('hub')) setTimeout(parentHub, 250);
  } catch (e) {}
})();
