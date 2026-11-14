/* guard.js: loaded by the three sections (the oasis, «كنوز البيان» and the Hasaniya) before their own scripts.
   It holds two family rules that must stay true whatever a section's own code does:
   1. the device's speech never reads the Quran (a verse is heard only from a human reciter), never says a raw ⟨m|f⟩
      marker, and uses a voice on the device when there is one: a cloud voice receives everything it speaks, the
      children's names included, so with a cloud voice the names are left out;
   2. the browser's own controls never save a child's voice or picture: no «Download» in the audio menu, no «Save image»
      on a long press or a right click. What leaves the device leaves only through the consent sheet and the PIN. */
(function () {
  'use strict';
  var W = window;
  function fam() { try { return JSON.parse(localStorage.getItem('kb-family-v1') || 'null') || {}; } catch (e) { return {}; } }
  function curKid(F) { var ks = F.kids || []; for (var i = 0; i < ks.length; i++) if (ks[i] && ks[i].id === F.cur) return ks[i]; return null; }

  /* ---- 1. speech ---- */
  /* the mushaf's own spelling (alef wasla, dagger alef, the small signs): nothing else in the app is written this way */
  var UTHM = /[ٱٰۖ-ۭ]|َ(?:آ|آ)|[^ا]ٓ/;
  var MARK = /⟨([^|⟩]*)\|([^⟩]*)⟩/g;
  function quranFree(t) {
    t = String(t == null ? '' : t)
      .replace(/﴿[^﴾]*﴾/g, ' ')                 /* a quoted verse */
      .replace(/\{[^{}]*\}/g, ' ')               /* the Hasaniya's way of quoting a verse in a story */
      .replace(/[\uFB51-\uFD3D]+/g, ' ');        /* the Mushaf script's glyph codes (QPC, from U+FB51; V2 uses U+FC41–U+FCFC): read aloud they
                                                  are other letters. ﴾﴿ (U+FD3E–F) and ﷺ (U+FDFA) are above this range and stay */
    return t.split(/(\s+)/).map(function (w) { return UTHM.test(w) ? '' : w; }).join('');
  }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function withoutNames(t, F) {
    (F.kids || []).forEach(function (k) {
      var n = k && String(k.name || '').trim(); if (!n) return;
      t = t.replace(new RegExp('(^|[\\s،.!؟:«»"])(?:يا\\s+)?' + esc(n) + '(?=$|[\\s،.!؟:«»"])', 'g'), '$1');
    });
    return t;
  }
  function arVoices() { try { return speechSynthesis.getVoices().filter(function (v) { return /^ar/i.test(v.lang); }); } catch (e) { return []; } }
  function cleanText(t) {
    var F = fam(), k = curKid(F), g = k && k.g === 'f' ? 'f' : 'm';
    t = String(t == null ? '' : t).replace(MARK, function (_, m, f) { return g === 'f' ? f : m; });
    return quranFree(t);
  }
  W.WAHA_GUARD = { quranFree: quranFree, cleanText: cleanText, isQuran: function (t) { return UTHM.test(String(t || '')) || /﴿/.test(String(t || '')); }, wrapSpeech: function () { wrapSpeech(); } };
  /* the Android app's bridge (android-shim.js) puts its own speechSynthesis in place of the WebView's: whichever object speaks,
     its speak() is wrapped, now and again once the page's scripts have run, so the guard cannot be left on an object no one uses */
  function guardSpeak(u) {
    try {
      if (u && typeof u.text === 'string') {
        var F = fam(), t = cleanText(u.text);
        /* a voice on the device first; a cloud voice (as Edge offers) only when there is none, and then without the names */
        var vs = arVoices(), local = vs.filter(function (v) { return v.localService !== false; });
        if (local.length && (!u.voice || u.voice.localService === false || !/^ar/i.test(u.voice.lang || ''))) u.voice = local[0];
        var v = u.voice || null;
        if (vs.length && !local.length && (!v || v.localService === false)) t = withoutNames(t, F);
        u.text = t;
        if (!/[ء-يa-zA-Z0-9٠-٩]/.test(t)) {
          /* nothing left to say: answer as if it had been said, so whoever waits for the end goes on */
          setTimeout(function () { try { u.dispatchEvent(new Event('end')); } catch (e) { try { if (u.onend) u.onend({}); } catch (e2) {} } }, 0);
          return false;
        }
      }
    } catch (e) {}
    return true;
  }
  function wrapSpeech() {
    try {
      var SS = W.speechSynthesis;
      if (!SS || typeof SS.speak !== 'function' || SS.speak.__wahaGuard) return;
      var speak0 = SS.speak;
      var g = function (u) { if (!guardSpeak(u)) return; return speak0.apply(this, arguments); };
      g.__wahaGuard = true;
      SS.speak = g;
    } catch (e) {}
  }
  wrapSpeech();
  setTimeout(wrapSpeech, 0);
  document.addEventListener('DOMContentLoaded', wrapSpeech);
  W.addEventListener('load', wrapSpeech);

  /* ---- 2. the browser's own save controls ---- */
  function guardEl(el) {
    try {
      var n = el.nodeName;
      if (n === 'AUDIO' || n === 'VIDEO') {
        if (el.getAttribute('controlslist') !== 'nodownload noplaybackrate') el.setAttribute('controlslist', 'nodownload noplaybackrate');
        el.disablePictureInPicture = true;
      } else if (n === 'IMG' || n === 'CANVAS') {
        el.draggable = false;
        el.style.setProperty('-webkit-touch-callout', 'none');
        el.style.setProperty('-webkit-user-select', 'none');
        el.style.setProperty('user-select', 'none');
      }
    } catch (e) {}
  }
  function guardTree(root) {
    if (!root || root.nodeType !== 1) return;
    guardEl(root);
    var l = root.querySelectorAll ? root.querySelectorAll('audio,video,img,canvas') : [];
    for (var i = 0; i < l.length; i++) guardEl(l[i]);
  }
  document.addEventListener('contextmenu', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('audio,video,img,canvas,picture,svg')) e.preventDefault();
  }, true);
  document.addEventListener('dragstart', function (e) {
    var t = e.target; if (t && t.nodeName && /^(IMG|AUDIO|VIDEO|CANVAS)$/.test(t.nodeName)) e.preventDefault();
  }, true);
  function start() {
    guardTree(document.documentElement);
    try {
      new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          var a = ms[i].addedNodes;
          for (var j = 0; j < a.length; j++) guardTree(a[j]);
          if (ms[i].type === 'attributes') guardEl(ms[i].target);
        }
      }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['controls', 'controlslist', 'src'] });
    } catch (e) {}
  }
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start);
})();
