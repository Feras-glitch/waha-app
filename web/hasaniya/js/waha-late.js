/* ===== الحسنية داخل «واحة اللسان العربي» (2 من 2): يعمل بعد ملفات الحسنية وقبل إقلاعها =====
   1) لا يخرج من الجهاز ملفٌّ ولا مشاركة ولا طباعة ولا نسخٌ إلى الحافظة فيه شيء عن الطفل إلا بعد رمز وليّ الأمر (يُكتب للتوّ)
      ثم تنبيهٍ يسمّي ما سيخرج وموافقةٍ صريحة، ويُسجَّل في سجلّ العائلة. هذه البوابات تُركَّب أولًا، فإن تعطّل ما بعدها بقيت مغلقة.
   2) الأطفال هم أطفال العائلة (الاسم، ولد أو بنت، العمر) ولا يُضاف طفل أو يُحذف إلا من ركن وليّ الأمر.
   3) الرقم السري هو رمز وليّ الأمر للعائلة، ويُدار من ركن وليّ الأمر.
   4) لا عامل خدمة خاص بالحسنية: عامل الواحة يحفظ كل شيء للعمل دون إنترنت. وزرّ 🌴 للعودة إلى الواحة.
   NEEDS: أسماء الحسنية التي يعتمد عليها هذا الملف؛ يتحقق tools/build.py أنها ما زالت موجودة في نسختها المثبّتة. */
var KZ_HS_NEEDS = ['STORAGE_USERS', 'STORAGE_ACTIVE', 'STORAGE_PIN', 'createNewUser', 'getUserById', 'getCurrentUser', 'getUserName', 'saveState',
  'applyKidMode', 'showToast', 'requirePin', 'cancelPin', 'verifyPin', 'hasPin', 'showPinModal', 'managePin', 'changePin', 'removePin', 'forgotPin',
  'showUsersModal', 'openUserEditor', 'deleteUser', 'switchUser', 'exportBackup', 'importBackupFile', 'closePopup', 'appDismiss', 'showMap',
  'printCertificate', 'printTeacherReport', 'printAllCards', 'guideParentNote', 'selectParentNote', 'openHub', 'recAllForUser', 'learnedVerses',
  'completedCount', 'guideStreak', 'openGuideJournal', 'escapeHtml', 'activeUserId', 'pinUnavailable', 'pinLockState', 'pinLockSave', 'appBack'];
(function () {
  'use strict';
  var FAMKEY = 'kb-family-v1', HOME = '../index.html', CORNER = '../kunuz/index.html#parent';
  function famGet() { try { return JSON.parse(localStorage.getItem(FAMKEY)) || null; } catch (e) { return null; } }
  function famSet(F) { try { localStorage.setItem(FAMKEY, JSON.stringify(F)); } catch (e) {} }
  var FAM = famGet();
  if (!FAM || !FAM.pin || !Array.isArray(FAM.kids) || !FAM.kids.length) {
    /* no family yet: setup starts in the parent's app; the Hasaniya must not create a default child meanwhile */
    window.addEventListener('DOMContentLoaded', function (e) { e.stopImmediatePropagation(); }, true);
    window.KZ_NOFAM = true;
    location.replace('../kunuz/index.html');
    return;
  }
  var uidOf = function (id) { return 'kz_' + id; };
  var famIdOf = function (uid) { return String(uid || '').indexOf('kz_') === 0 ? String(uid).slice(3) : null; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kidName() { try { return getUserName(); } catch (e) { return 'الطفل'; } }
  function isGirl() { try { return getCurrentUser().gender === 'girl'; } catch (e) { return false; } }
  var _toast = typeof showToast === 'function' ? showToast : function () {};
  function toast(m, t) { try { _toast(m, t); } catch (e) {} }

  /* ---------- the family PIN (needed by the gates) ---------- */
  var PARENT_UNTIL = 0, LAST_PIN = 0;
  try { var pu = +sessionStorage.getItem('kz-parent-until') || 0; if (pu > Date.now()) PARENT_UNTIL = Math.min(pu, Date.now() + 15 * 60 * 1000); } catch (e) {}
  function parentOn() { return Date.now() < PARENT_UNTIL; }
  async function famHash(salt, pin) {
    var txt = salt + ':' + pin;
    try { if (window.crypto && crypto.subtle) { var h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)); return 's' + [].map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); } } catch (e) {}
    var x = 0; for (var i = 0; i < txt.length; i++) { x = (x * 131 + txt.charCodeAt(i)) >>> 0; } return 'h' + x.toString(36);
  }
  var _require = typeof requirePin === 'function' ? requirePin : null;

  /* ---------- a small sheet in the Hasaniya's own style; however it closes (button, outside tap, Esc, Android back) it reports once ---------- */
  var CUR = null;
  function sheet(title, html, buttons, onClose) {
    if (CUR) CUR.close(false);
    var o = document.createElement('div'); o.className = 'modal-overlay active'; o.id = 'kzSheet';
    o.innerHTML = '<div class="modal-content" style="text-align:right;max-width:460px"><h2 style="margin-top:0;text-align:center">' + esc(title) + '</h2>' + html + '<div class="kz-btns" style="display:flex;flex-direction:column;gap:8px;margin-top:14px"></div></div>';
    var box = o.querySelector('.kz-btns'), me = { el: o };
    me.close = function (v) { if (me.done) return; me.done = true; if (CUR === me) CUR = null; o.remove(); if (onClose) onClose(v); };
    (buttons || []).forEach(function (b) {
      var x = document.createElement('button'); x.type = 'button'; x.className = 'action-btn ' + (b.cls || 'btn-gray'); x.style.width = '100%';
      x.textContent = b.t; if (b.id) x.id = b.id; if (b.disabled) x.disabled = true;
      x.addEventListener('click', function () { var keep = b.on ? b.on(x) : false; if (!keep) me.close(b.v); });
      box.appendChild(x);
    });
    o.addEventListener('click', function (e) { if (e.target === o) me.close(false); });
    CUR = me; document.body.appendChild(o);
    return o;
  }
  function wrapClose(name) {
    var f = window[name]; if (typeof f !== 'function') return;
    window[name] = function (id) { if (id === 'kzSheet') { if (CUR) CUR.close(false); return true; } return f.apply(this, arguments); };
  }
  try { wrapClose('appDismiss'); wrapClose('closePopup'); } catch (e) {}

  /* ---------- 1) nothing leaves the device without the parent ---------- */
  function describe(name, data) {
    var n = String(name || ''), k = kidName();
    if (/corrupt/.test(n)) return 'نسخة خام من بيانات كل الأطفال (للإصلاح)';
    if (/^recitation/.test(n)) return 'تسجيلات صوت ' + k + ' للأبيات';
    if (/^certificate/.test(n)) return 'شهادة ' + k;
    if (/^hasaniya_report/.test(n)) return 'تقرير تقدّم ' + k;
    if (/^hasaniya_result/.test(n)) return 'صورة نتيجة ' + k;
    if (/progress/.test(n)) return 'ملف تقدّم ' + k;
    if (/^journeyData/.test(n)) return 'محتوى المنظومة كما عدّلتموه (لا بيانات أطفال فيه)';
    if (/voicepack/i.test(n)) return 'حزمة الصوت التي سجّلتموها (فيها نداء الأطفال بأسمائهم)';
    if (/evaluation|eval/.test(n)) return 'تقييمكم لتسجيلات ' + k;
    if (/^hasaniya_week/.test(n) || (data && !data.files && data.text)) return 'تقرير الأسبوع لـ' + k;
    return (n || 'ملف') + ' (من الحسنية)';
  }
  /* the parts of one export (recordings in parts, voice-pack zips) share a stamp: one consent covers that export only */
  function batchKey(name) { var m = /^(recitation|hasaniya-voicepack)-(\d+)/.exec(String(name || '')); return m ? m[1] + '-' + m[2] : null; }
  function lastReset() { var F = famGet(), r = F && F.pinResets; return Array.isArray(r) && r.length ? +r[r.length - 1] || 0 : 0; }
  function logOut(label) {
    var F = famGet(); if (!F) return;
    var cur = null; try { cur = famIdOf(activeUserId); } catch (e) {}
    var row = { d: Date.now(), name: String(label), kid: cur, app: 'hasaniya' }, r = lastReset();
    if (r && Date.now() - r < 30 * 864e5) row.afterReset = r;
    F.waLog = F.waLog || []; F.waLog.push(row);
    if (F.waLog.length > 200) F.waLog = F.waLog.slice(-200);
    famSet(F);
  }
  var BATCH = null, APPROVED = {}, NO_UNTIL = 0, NO_LABELS = [];
  function settle(ok) {
    var b = BATCH; if (!b) return; BATCH = null;
    if (ok) { if (b.key) APPROVED[b.key] = Date.now(); b.items.forEach(function (it) { logOut(it.label); try { it.go(); } catch (e) {} }); }
    else {
      /* the Hasaniya falls back from a refused share to a download of the same file: that is the same «no» */
      NO_UNTIL = Date.now() + 3000; NO_LABELS = b.items.map(function (it) { return it.label; });
      b.items.forEach(function (it) { try { it.no(); } catch (e) {} });
    }
  }
  function consent() {
    var b = BATCH; if (!b) return;
    var r = lastReset(), when = '';
    try { when = new Date(r).toLocaleDateString('ar-EG'); } catch (e) {}
    var f = isGirl(), n = esc(kidName());
    sheet('تنبيهٌ قبل إخراج ' + (b.items.length > 1 ? 'ملفات' : 'ملف'),
      '<p style="margin:0;line-height:1.9">سيخرج من الجهاز:</p><ul id="kzWhat" style="margin:4px 0 8px;padding-right:20px;line-height:1.9">' +
        b.items.map(function (it) { return '<li><b>' + esc(it.label) + '</b></li>'; }).join('') + '</ul>' +
      '<p style="font-size:.88rem;color:#555;line-height:1.9;margin:0">قد يحمل اسم ' + n + (f ? ' وصوتها وصورتها' : ' وصوته وصورته') + '. وبعد إرساله إلى المعلم أو غيره لا يبقى في يدكم: من يصله يستطيع أن يحفظه أو يعيد إرساله.</p>' +
      (r && Date.now() - r < 30 * 864e5 ? '<p style="font-size:.88rem;color:#b3261e;line-height:1.8">⚠ أُعيد ضبط رمز وليّ الأمر يوم ' + esc(when) + '. إن لم تكونوا أنتم من أعاده فلا توافقوا، وراجعوا ركن وليّ الأمر.</p>' : '') +
      '<label style="display:flex;gap:8px;align-items:center;justify-content:flex-start;margin-top:8px"><input type="checkbox" id="kzOk"> أوافق على إخراج ما سبق</label>',
      [{ t: 'أخرجوه', cls: 'btn-success', id: 'kzGo', disabled: true, v: true }, { t: 'إلغاء', v: false }],
      function (v) { settle(!!v); });
    var c = document.getElementById('kzOk'), g = document.getElementById('kzGo');
    if (c && g) c.addEventListener('change', function () { g.disabled = !c.checked; });
  }
  /* go() runs inside the tap on «أخرجوه», so the browser still counts the save, share or print as the parent's own */
  function gate(label, go, no, key) {
    if (key && APPROVED[key] && Date.now() - APPROVED[key] < 5 * 60000) { logOut(label); return go(); }
    if (Date.now() < NO_UNTIL && NO_LABELS.indexOf(label) >= 0) return no();
    if (BATCH) {                                   /* another part of the same export, or another file, while the parent decides */
      BATCH.items.push({ label: label, go: go, no: no });
      if (!BATCH.key) BATCH.key = key;
      var ul = document.getElementById('kzWhat'); if (ul) { var li = document.createElement('li'); li.innerHTML = '<b>' + esc(label) + '</b>'; ul.appendChild(li); }
      return;
    }
    BATCH = { items: [{ label: label, go: go, no: no }], key: key };
    if (Date.now() - LAST_PIN < 30000) return consent();      /* the PIN was typed just now for this very action */
    if (!_require) { toast('تعذّر طلب رمز وليّ الأمر؛ لم يخرج شيء', 'error'); return settle(false); }
    BATCH.pin = true;
    _require(function () { if (BATCH) { BATCH.pin = false; consent(); } }, 'إخراج شيء من الجهاز يحتاج رمز وليّ الأمر');
  }
  /* while the parent decides, the Hasaniya's own «تم التصدير» would be untrue */
  try { showToast = function (m, t) { if (BATCH && t === 'success') return; return _toast.apply(this, arguments); }; } catch (e) {}
  try { var _cancelPin = cancelPin; cancelPin = function () { var r = _cancelPin.apply(this, arguments); if (BATCH && BATCH.pin) settle(false); return r; }; } catch (e) {}

  /* files: the Hasaniya makes a download link and clicks it (in Android the bridge turns that into the share screen) */
  var _click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var a = this, href = a.href || '';
    if (a.hasAttribute('download') && (href.indexOf('blob:') === 0 || href.indexOf('data:') === 0)) {
      var name = a.getAttribute('download') || 'file';
      /* the Hasaniya revokes its link after a second or two: keep the file now, hand it out after the parent agrees */
      var file = fetch(href).then(function (r) { return r.blob(); });
      gate(describe(name), function () {
        file.then(function (blob) {
          var u = URL.createObjectURL(blob), b = document.createElement('a');
          b.href = u; b.download = name; _click.call(b);
          toast(window.AndroidBridge ? 'اختاروا أين يُحفظ الملف أو إلى من يُرسل' : 'نُزّل الملف', 'success');
          setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
        }).catch(function () { toast('تعذّر تجهيز الملف. حاولوا مرة أخرى', 'error'); });
      }, function () { toast('لم يخرج شيء', 'error'); }, batchKey(name));
      return;
    }
    return _click.apply(this, arguments);
  };
  /* sharing */
  if (typeof navigator.share === 'function') {
    var _share = navigator.share;
    var share = function (data) {
      var self = this;
      return new Promise(function (res, rej) {
        var f = data && data.files && data.files[0];
        gate(describe(f ? f.name : '', data), function () { try { Promise.resolve(_share.call(self, data)).then(res, rej); } catch (e) { rej(e); } },
          function () { rej(new DOMException('cancelled by the parent', 'AbortError')); }, null);
      });
    };
    try { Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true }); } catch (e) { try { navigator.share = share; } catch (e2) {} }
  }
  /* printing (in Android: the system print screen, which can also save or send): every window the Hasaniya opens waits for the parent,
     except the verse cards, which carry nothing about the child */
  var _open = window.open, OPEN_LABEL = null, OPEN_FREE = false;
  window.open = function () {
    var args = arguments;
    if (OPEN_FREE) return _open.apply(window, args);
    var label = OPEN_LABEL || 'صفحة للطباعة فيها بيانات ' + kidName(); OPEN_LABEL = null;
    var html = '', closed = false, real = null;
    function flush() { if (!real) return; try { real.document.open(); real.document.write(html); if (closed) real.document.close(); } catch (e) {} }
    var fake = {
      document: { open: function () { html = ''; }, write: function (s) { html += s; }, writeln: function (s) { html += s + '\n'; }, close: function () { closed = true; if (real) { try { real.document.close(); } catch (e) {} } } },
      close: function () {}, focus: function () {}, print: function () {}
    };
    gate(label, function () { real = _open.apply(window, args); if (!real) { toast('اسمحوا بفتح النوافذ للطباعة', 'error'); return; } flush(); },
      function () { toast('لم يُطبع شيء', 'error'); }, null);
    return fake;
  };
  function labelled(name, label) {
    var f = window[name]; if (typeof f !== 'function') return;
    window[name] = function () { OPEN_LABEL = label(); setTimeout(function () { OPEN_LABEL = null; }, 15000); return f.apply(this, arguments); };
  }
  labelled('printCertificate', function () { return 'شهادة ' + kidName() + ' (للطباعة)'; });
  labelled('printTeacherReport', function () { return 'تقرير للمعلم عن ' + kidName() + ' (للطباعة)'; });
  if (typeof printAllCards === 'function') { var _cards = printAllCards; printAllCards = function () { OPEN_FREE = true; try { return _cards.apply(this, arguments); } finally { OPEN_FREE = false; } }; }
  /* «رسالة ناجي للوالدين»: written for the parent, so it opens with the PIN, speaks of a girl as a girl, and copying it out asks first */
  try {
    guideParentNote = function () {
      requirePin(async function () {
        var name = getUserName(), f = isGirl(), weekAgo = Date.now() - 7 * 864e5;
        var recs = typeof recAllForUser === 'function' ? await recAllForUser(activeUserId) : [];
        var week = recs.filter(function (r) { return r.kind === 'verse' && r.at >= weekAgo; }).length;
        var learned = learnedVerses('all').length, stations = completedCount(), days = guideStreak();
        var text = [
          'السلام عليكم، أنا ناجي، رفيق ' + name + ' في رحلة السيرة النبوية.',
          'هذا الأسبوع ' + (f ? 'سجّلت ' : 'سجّل ') + name + ' ' + week + ' ' + (week === 1 ? 'بيتاً' : 'أبيات') + (f ? ' بصوتها.' : ' بصوته.'),
          'إجمالي ما ' + (f ? 'حفظته' : 'حفظه') + ': ' + learned + ' ' + (learned === 1 ? 'بيت' : 'أبيات') + '، ' + (f ? 'وأكملت ' : 'وأكمل ') + stations + ' ' + (stations === 1 ? 'محطة' : 'محطات') + ' من الرحلة.',
          'عدد الأيام المتتالية التي ' + (f ? 'فتحت' : 'فتح') + ' فيها التطبيق: ' + days + '.',
          f ? 'شجّعوها على التسميع المتصل في نهاية الأسبوع لتثبت ما حفظته 🐪' : 'شجّعوه على التسميع المتصل في نهاية الأسبوع ليثبت ما حفظه 🐪'
        ].join('\n');
        openHub('📝 رسالة ناجي للوالدين',
          '<p class="note-hint">🔒 هذه الرسالة تبقى على هذا الجهاز، ولا تخرج إلا إذا نسختموها بعد موافقتكم.</p>' +
          '<textarea id="parentNoteText" class="note-text" readonly rows="8">' + escapeHtml(text) + '</textarea>' +
          '<div class="hub-row"><button class="tool-btn" onclick="selectParentNote()">📋 انسخوا النص</button><button class="tool-btn" onclick="openGuideJournal()">← الدفتر</button></div>');
      }, 'رسالة ناجي للوالدين');
    };
    var _sel = selectParentNote;
    selectParentNote = function () { var self = this; gate('رسالة ناجي عن ' + kidName() + ' (نسخ إلى الحافظة)', function () { _sel.apply(self); }, function () {}, null); };
  } catch (e) {}
  window.KZ_GATES = true;

  /* ---------- 2) children ---------- */
  try {
    (function sync() {
      var list = []; try { list = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]'); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      var byId = {}; list.forEach(function (u) { if (u && typeof u.id === 'string') byId[u.id] = u; });
      var year = new Date().getFullYear();
      var out = FAM.kids.map(function (k) {
        var u = byId[uidOf(k.id)], age = k.by ? year - k.by : 10;
        if (!u) {
          u = createNewUser(k.name, '🦁'); u.id = uidOf(k.id);
          u.small = age <= 6;                       /* a child who does not read yet: bigger buttons, riddles as choices; the parent can change it */
        }
        u.name = String(k.name || 'طفلي').slice(0, 20);
        u.gender = k.g === 'f' ? 'girl' : 'boy';
        u.avatar = k.av && k.av !== 'letter' ? k.av : (k.g === 'f' ? '🦋' : '🦁');
        u.wahaKid = k.id;
        return u;
      });
      var want = null; try { want = new URLSearchParams(location.search).get('kid'); } catch (e) {}
      var act = uidOf(want && FAM.kids.some(function (k) { return k.id === want; }) ? want : FAM.cur);
      if (!out.some(function (u) { return u.id === act; })) act = out[0].id;
      localStorage.setItem(STORAGE_USERS, JSON.stringify(out));
      localStorage.setItem(STORAGE_ACTIVE, act);
      localStorage.setItem(STORAGE_PIN, 'family');   /* «there is a PIN»: it is checked against the family PIN below */
      var cur = famIdOf(act); if (cur && FAM.cur !== cur) { FAM.cur = cur; famSet(FAM); }
      try { if (want) history.replaceState({}, '', location.pathname); } catch (e) {}
    })();
  } catch (e) { console.warn('waha: children', e); }

  /* ---------- 3) the family PIN ---------- */
  try {
    verifyPin = async function (pin) {
      pinUnavailable = false;
      var F = famGet(); if (!F || !F.pin) return false;
      var ok = (await famHash(F.salt || '', String(pin).trim())) === F.pin;
      if (ok) {
        PARENT_UNTIL = Date.now() + 15 * 60 * 1000; LAST_PIN = Date.now();
        /* whoever knows the current PIN cancels a pending «forgot PIN» request */
        var G = famGet(); if (G && G.resetReq) { G.resetReq = null; (G.pinLog = G.pinLog || []).push({ t: Date.now(), k: 'cancel-pin-hasaniya' }); famSet(G); var rb = document.getElementById('kzReset'); if (rb) rb.remove(); }
      }
      return ok;
    };
    hasPin = function () { return true; };
    /* the lock after wrong entries is the family's, shared with the oasis and كنوز البيان (key kb-pin-lock, the same counting as here) */
    pinLockState = function () { try { var o = JSON.parse(localStorage.getItem('kb-pin-lock') || '{}') || {}; return { fails: +o.fails || 0, until: Math.min(+o.until || 0, Date.now() + 15 * 60000) }; } catch (e) { return { fails: 0, until: 0 }; } };
    pinLockSave = function (o) { try { if (o && (o.fails || o.until)) localStorage.setItem('kb-pin-lock', JSON.stringify({ fails: +o.fails || 0, until: +o.until || 0 })); else localStorage.removeItem('kb-pin-lock'); } catch (e) {} };
    /* a parent who just typed the PIN is not asked again for the next screen; the session ends when the child's map is back */
    requirePin = function (cb, message) {
      if (parentOn()) { if (cb) setTimeout(cb, 0); return; }
      return _require(cb, message);
    };
    var _map = showMap;
    showMap = function () { PARENT_UNTIL = 0; return _map.apply(this, arguments); };
    document.addEventListener('visibilitychange', function () { if (document.hidden) PARENT_UNTIL = 0; });
    var _showPin = showPinModal;
    showPinModal = function (title, subtitle) {
      _showPin(title, subtitle);
      var t = document.getElementById('pinSubtitle'); if (t) t.textContent = (subtitle ? subtitle + ' — ' : '') + 'وهو رمز وليّ الأمر نفسه في الواحة.';
    };
  } catch (e) { console.warn('waha: pin', e); }

  /* a pending «forgot PIN» request: its banner shows here too, and the day is counted (the same function as resetSeen in كنوز البيان) */
  function resetSeen(F) {
    var r = F && F.resetReq, now = Date.now(); if (!r) return false;
    var max = Math.max(+r.max || 0, +r.at || 0);
    if (now < max - 2 * 3600e3) { r.due = Math.max(+r.due || 0, now + 72 * 3600e3); r.days = []; r.back = (+r.back || 0) + 1; }
    r.max = Math.max(max, now); var t = new Date(now), d = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
    r.days = Array.isArray(r.days) ? r.days : []; if (r.days.indexOf(d) < 0) r.days = r.days.concat(d).slice(-10);
    return true;
  }
  try {
    var RF = famGet();
    if (RF && RF.resetReq) {
      if (resetSeen(RF)) famSet(RF);
      window.addEventListener('DOMContentLoaded', function () {
        var d = function (t) { try { return new Date(t).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return ''; } };
        var b = document.createElement('a'); b.id = 'kzReset'; b.href = CORNER; b.setAttribute('role', 'status'); b.dir = 'rtl';
        b.style.cssText = 'display:block;position:relative;z-index:50;margin:8px 12px;padding:10px 14px;border-radius:12px;background:#fde8e4;color:#7a2318;border:1px solid #e9a99c;text-decoration:none;line-height:1.7';
        b.textContent = '⚠ طُلبت إعادة ضبط رمز وليّ الأمر يوم ' + d(RF.resetReq.at) + '، ويمكن تنفيذها بعد ' + d(RF.resetReq.due) + '. إن لم تطلبوها فادخلوا ركن وليّ الأمر برمزكم الحالي فيُلغى الطلب.';
        document.body.insertBefore(b, document.body.firstChild);
      });
    }
  } catch (e) {}

  function toCorner() { location.href = CORNER; }
  /* Android back on the Hasaniya's map goes to the oasis (the front door), not out of the app */
  try { if (typeof appBack === 'function') { var _back = appBack; appBack = function () { if (_back.apply(this, arguments)) return true; try { saveState(); } catch (e) {} location.href = HOME; return true; }; } } catch (e) {}
  function cornerSheet(title, text) {
    sheet(title, '<p style="line-height:1.9">' + text + '</p>', [{ t: 'افتحوا ركن وليّ الأمر', cls: 'btn-success', on: function () { toCorner(); } }, { t: 'إغلاق' }]);
  }
  try {
    managePin = changePin = removePin = function () {
      try { closePopup('managePinPopup'); } catch (e) {}
      cornerSheet('🔐 رمز وليّ الأمر', 'الرقم السري هنا هو رمز وليّ الأمر للعائلة كلها، يحمي الواحة و«كنوز البيان» والحسنية معًا. يُغيَّر من ركن وليّ الأمر ← الأمان والنسخ الاحتياطي.');
    };
    forgotPin = function () {
      try { cancelPin(); } catch (e) {}
      cornerSheet('نسيتم الرمز؟', 'الرمز واحدٌ للعائلة. تُعاد تهيئته من ركن وليّ الأمر ← «نسيتم الرمز؟»، ولا يُمسح شيء من تقدّم الأطفال هنا.');
    };
  } catch (e) { console.warn('waha: pin admin', e); }

  /* ---------- children are managed in the parent corner ---------- */
  try {
    var _users = showUsersModal;
    showUsersModal = function () {
      _users.apply(this, arguments);
      var pop = document.getElementById('usersPopup'); if (!pop) return;
      pop.querySelectorAll('.mini-btn.delete').forEach(function (b) { b.remove(); });
      var add = pop.querySelector('button[onclick^="openUserEditor(null"]'); if (add) add.hidden = true;
      if (!pop.querySelector('#kzKidsNote')) {
        var n = document.createElement('p'); n.id = 'kzKidsNote'; n.style.cssText = 'font-size:.85rem;color:#666;margin:10px 0 0;line-height:1.8';
        n.innerHTML = 'الأطفال هم أطفال العائلة: يُضافون ويُعدَّل اسمهم وجنسهم ويُحذفون من <a href="' + CORNER + '">ركن وليّ الأمر</a>.';
        (add || pop.querySelector('#usersList')).insertAdjacentElement('afterend', n);
      }
    };
    openUserEditor = function (id) {
      try { closePopup('usersPopup'); } catch (e) {}
      var u = id && getUserById(id);
      if (!u) { cornerSheet('➕ طفلٌ جديد', 'يُضاف الطفل مرةً واحدة في ركن وليّ الأمر، فيظهر في الواحة و«كنوز البيان» والحسنية معًا.'); return; }
      function render() {
        sheet('✏️ ' + u.name,
          '<p style="line-height:1.9">' + esc(u.name) + ' · ' + (u.gender === 'girl' ? 'بنت' : 'ولد') + '<br><small style="color:#666">الاسم والجنس والعمر والصورة تُضبط في ركن وليّ الأمر، ليكون الطفل واحدًا في كل الأقسام.</small></p>' +
          '<p style="line-height:1.9;margin-bottom:0"><b>وضع الطفل الصغير:</b> ' + (u.small ? 'مفعّل' : 'غير مفعّل') + '<br><small style="color:#666">لمن لا يقرأ بعد: أزرار أكبر وأقل، والألغاز بالاختيار.</small></p>',
          [{ t: u.small ? 'أوقفوا وضع الطفل الصغير' : 'فعّلوا وضع الطفل الصغير', cls: 'btn-success', on: function () {
              requirePin(function () { u.small = !u.small; saveState(); try { applyKidMode(); } catch (e) {} render(); }, 'وضع الطفل الصغير يضبطه الوالد'); } },
           { t: 'افتحوا ركن وليّ الأمر', on: function () { toCorner(); } }, { t: 'إغلاق' }]);
      }
      render();
    };
    deleteUser = function () { cornerSheet('حذف طفل', 'يُحذف الطفل من ركن وليّ الأمر، فتُحذف معه بياناته وتسجيلاته في كل الأقسام.'); };
    var _switch = switchUser;
    switchUser = function (id) {
      var r = _switch.apply(this, arguments);
      var f = famIdOf(id), F = famGet(); if (f && F && F.cur !== f) { F.cur = f; famSet(F); }
      try { if (window.KZ_HS_GENDER) window.KZ_HS_GENDER(); } catch (e) {}
      return r;
    };
    exportBackup = importBackupFile = function () {
      cornerSheet('💾 النسخة الاحتياطية', 'تقدّم الحسنية وتسجيلات الأطفال فيها داخلةٌ في النسخة الاحتياطية للعائلة، وهي مشفّرة بكلمة سرٍّ تختارونها: ركن وليّ الأمر ← الأمان والنسخ الاحتياطي. ومنها تكون الاستعادة.');
    };
  } catch (e) { console.warn('waha: children ui', e); }

  /* ---------- girls: the Hasaniya's own labels speak to a boy («استمع»، «سجّل»…). For a girl they are rewritten on screen
     (text, title, aria-label, placeholder), and back again for a boy. Its spoken and companion lines are already gendered upstream.
     tools/build.py checks that every phrase here is still in the pinned Hasaniya, so this list follows its updates. ---------- */
  var HS_FEM = [
    ['اضغط على ناجي', 'اضغطي على ناجي'], ['استمع مرة أخرى', 'استمعي مرة أخرى'], ['استمع للقصة', 'استمعي للقصة'],
    ['استمع للتسميع', 'استمعي للتسميع'], ['استمع للبيت', 'استمعي للبيت'], ['استمع للمعنى', 'استمعي للمعنى'], ['استمع للغز', 'استمعي للغز'],
    ['استمع للسؤال', 'استمعي للسؤال'], ['استمع للشرح', 'استمعي للشرح'], ['استمع للخيار', 'استمعي للخيار'], ['▶ استمع', '▶ استمعي'],
    ['سجّل التسميع المتصل', 'سجّلي التسميع المتصل'], ['سجّل صوتك', 'سجّلي صوتكِ'], ['⏺ سجّل', '⏺ سجّلي'], ['🎤 سجّل', '🎤 سجّلي'],
    ['⏹ أوقف التسجيل', '⏹ أوقفي التسجيل'], ['⏹ أوقف', '⏹ أوقفي'], ['أوقف القراءة', 'أوقفي القراءة'], ['🔁 أعد التسجيل', '🔁 أعيدي التسجيل'], ['🔁 أعد', '🔁 أعيدي'],
    ['رتّب الكلمات:', 'رتّبي الكلمات:'], ['رتّب المحطات', 'رتّبي المحطات'], ['رتّب بالنقر', 'رتّبي بالنقر'], ['انقر كلمات البيت بالترتيب الصحيح', 'انقري كلمات البيت بالترتيب الصحيح'],
    ['اختبر فهمك', 'اختبري فهمكِ'], ['أكمل أول محطة', 'أكملي أول محطة'], ['أكمل 5 محطات', 'أكملي 5 محطات'], ['أكمل كل المحطات', 'أكملي كل المحطات'],
    ['اجمع 100 نقطة', 'اجمعي 100 نقطة'], ['اجمع 500 نقطة', 'اجمعي 500 نقطة'], ['أكمل محطة لتملأها', 'أكملي محطة لتملئيها'], ['📖 أكمل القصة', '📖 أكملي القصة'],
    ['استمر ➡️', 'استمرّي ➡️'], ['▶ تابع الرحلة', '▶ تابعي الرحلة'], ['سمّع ما حفظت', 'سمّعي ما حفظتِ'], ['🔁 سمّع', '🔁 سمّعي'],
    ['راجع البطاقات', 'راجعي البطاقات'], ['راجع المستحق الآن', 'راجعي المستحق الآن'], ['اسأل المنظومة', 'اسألي المنظومة'],
    ['تذكّر مرة أخرى', 'تذكّري مرة أخرى'], ['🔑 تذكّر', '🔑 تذكّري'], ['اختر طريقة التذكّر:', 'اختاري طريقة التذكّر:'],
    ['اكتب جوابك', 'اكتبي جوابكِ'], ['اكتب بكلماتك', 'اكتبي بكلماتكِ'], ['اضغط أي كلمة لتسمعها', 'اضغطي أي كلمة لتسمعيها'],
    ['اضغط النقطة لترى قصتها', 'اضغطي النقطة لتري قصتها'], ['اضغط البيت للتدرّب عليه', 'اضغطي البيت للتدرّب عليه'],
    ['اضغط المحطات بالترتيب', 'اضغطي المحطات بالترتيب'], ['جرّب مرة أخرى', 'جرّبي مرة أخرى'], ['ابدأ بالمحطة', 'ابدئي بالمحطة'],
    ['حاول مرة أخرى، الكلمات المعلّمة', 'حاولي مرة أخرى، الكلمات المعلّمة'], ['↺ ابدأ من جديد', '↺ ابدئي من جديد'], ['جرّب كلمة أوضح', 'جرّبي كلمة أوضح']
  ];
  window.KZ_HS_FEM = HS_FEM;
  (function () {
    var esc = function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
    var by = function (i) { var m = {}; HS_FEM.forEach(function (p) { m[p[i]] = p[1 - i]; }); return m; };
    var MF = by(0), FM = by(1);
    var rx = function (m) { return new RegExp('(' + Object.keys(m).sort(function (a, b) { return b.length - a.length; }).map(esc).join('|') + ')(?![\\u0621-\\u064A\\u064B-\\u0652])', 'g'); };
    var RMF = rx(MF), RFM = rx(FM), ATTR = ['title', 'aria-label', 'placeholder'];
    function fix(s, girl) { return s.replace(girl ? RMF : RFM, function (w) { return (girl ? MF : FM)[w]; }); }
    function text(n, girl) { var d = n.data, o = fix(d, girl); if (o !== d) n.data = o; }
    function attrs(e, girl) { for (var i = 0; i < ATTR.length; i++) { var v = e.getAttribute(ATTR[i]); if (v) { var o = fix(v, girl); if (o !== v) e.setAttribute(ATTR[i], o); } } }
    function walk(root, girl) {
      if (!root) return;
      if (root.nodeType === 3) return text(root, girl);
      if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
      attrs(root, girl);
      var tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT), n;
      while ((n = tw.nextNode())) { if (n.nodeType === 3) text(n, girl); else if (n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE') attrs(n, girl); }
    }
    window.KZ_HS_GENDER = function () { walk(document.body, isGirl()); };
    window.addEventListener('DOMContentLoaded', function () {
      window.KZ_HS_GENDER();
      new MutationObserver(function (recs) {
        var girl = isGirl();
        recs.forEach(function (r) {
          if (r.type === 'characterData') text(r.target, girl);
          else if (r.type === 'attributes') attrs(r.target, girl);
          else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j], girl);
        });
      }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTR });
    });
  })();

  /* ---------- 4) one service worker (the oasis's), and the way home ---------- */
  try {
    var sw = navigator.serviceWorker;
    if (sw) {
      var mine = new URL('./', location.href).href;
      sw.getRegistrations().then(function (rs) { rs.forEach(function (r) { if (r.scope === mine) r.unregister(); }); }).catch(function () {});
      var _reg = sw.register.bind(sw);
      sw.register = function () { return _reg('../sw.js'); };
    }
  } catch (e) {}
  /* layout fixes on top of the Hasaniya's own styles: the «سمّع» offer stays centred on a phone (its fade-in animation used to
     drop the centring and push it half off the screen), and the header buttons are full-size tap targets */
  window.addEventListener('DOMContentLoaded', function () {
    var st = document.createElement('style'); st.id = 'kzFix';
    st.textContent = '.review-offer{left:12px!important;right:12px!important;transform:none!important;margin-inline:auto;width:auto;max-width:520px}' +
      '#mainHeader .icon-btn,#kzHome{min-width:44px;min-height:44px}';
    document.head.appendChild(st);
  });
  window.addEventListener('DOMContentLoaded', function () {
    var left = document.querySelector('#mainHeader .header-left'); if (!left || document.getElementById('kzHome')) return;
    var b = document.createElement('button'); b.id = 'kzHome'; b.className = 'icon-btn'; b.type = 'button'; b.textContent = '🌴';
    b.setAttribute('aria-label', 'العودة إلى الواحة'); b.title = 'الواحة';
    b.onclick = function () { try { saveState(); } catch (e) {} location.href = HOME; };
    left.insertBefore(b, left.firstChild);
  });
})();
