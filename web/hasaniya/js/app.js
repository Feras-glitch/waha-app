/* الإقلاع */
let timePausedByHide = false;
/* الدمج مع «واحة اللسان»: تُفتح الحسنية من واحتي بملف الطفل (waha=1&wk=&name=&gender=&age=)، فيُختار له مستخدم بالاسم نفسه أو يُنشأ، ويظهر زر العودة إلى الواحة */
function wahaLink() {
  const p = new URLSearchParams(location.search); if (p.get("waha") !== "1") return;
  const wk = p.get("wk"), name = (p.get("name") || "").slice(0, 20), gender = p.get("gender") === "girl" ? "girl" : "boy";
  let u = users.find(x => x.wahaKid === wk) || (name && users.find(x => x.name === name && !x.wahaKid));
  if (!u) { u = createNewUser(name || "طفلي", gender === "girl" ? "🦋" : "🦁"); u.state = normalizeUserState(u.state); users.push(u); }
  u.wahaKid = wk; if (name) u.name = name; u.gender = gender;
  activeUserId = u.id; state = u.state; saveState();
  try { if (typeof vpPref === "function") vpPref("onboarded", true); } catch (e) {}
  const back = document.getElementById("backToMapBtn");
  if (back) { const w = document.createElement("button"); w.className = "icon-btn"; w.type = "button"; w.textContent = "🌴"; w.setAttribute("aria-label", "العودة إلى الواحة"); w.title = "الواحة"; w.onclick = () => { try { saveState(); } catch (e) {} location.href = "../index.html"; }; back.parentNode.insertBefore(w, back); }
  try { history.replaceState({}, "", location.pathname); } catch (e) {}
}
function init() {
  loadAll();
  try { wahaLink(); } catch (e) { console.warn("waha link", e); }
  initSpeech();
  updateUserChip();
  updatePointsDisplay();
  showMap();
  migrateLegacyRecIds().catch(e => console.warn("rec ids migrate", e)).then(() => migrateVoiceKeys()).catch(e => console.warn("voice migrate", e)).then(() => vpFixRecIds()).catch(e => console.warn("voice ids", e));
  // فحص مبكر: إن كان مخزن التسجيلات غير متاح نُخبر الوالد من البداية، لا عند أول تسجيل فاشل
  if (typeof recDb === "function") recDb().catch(() => { if (typeof recStorageFailed === "function") recStorageFailed(); });
  maybeOnboard();
  // نطلب من المتصفح ألا يمسح بيانات الطفل وتسجيلاته عند امتلاء الذاكرة (في نسخة الويب)
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}

  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", e => { if (e.target === o) appDismiss(o.id); });
    // زر ✕ يظهر في كل نافذة لا تحمل زر إغلاق واضحاً
    const content = o.querySelector(".modal-content");
    const hasClose = !!o.querySelector("button[onclick*='closePopup'], button[onclick*='cancelPin'], button[onclick*='showMap'], button[onclick*='appDismiss']");
    if (content && !hasClose && !NO_DISMISS.includes(o.id)) {
      const x = document.createElement("button");
      x.className = "modal-x"; x.type = "button"; x.setAttribute("aria-label", "إغلاق");
      x.textContent = "✕"; x.onclick = () => appDismiss(o.id);
      content.prepend(x);
    }
  });

  window.addEventListener("beforeunload", () => {
    stopMediaStream(); stopTimeTracking(); saveState();
    if (confettiRafId) try { cancelAnimationFrame(confettiRafId); } catch(e) {}
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopMediaStream();
      // الوقت لا يُحسب والتطبيق في الخلفية، ويُحفظ الآن لأن أندرويد قد يغلقه دون إنذار
      if (sessionStartTime) { stopTimeTracking(); timePausedByHide = true; }
    } else if (timePausedByHide) {
      timePausedByHide = false;
      const gs = document.getElementById("gameScreen");
      if (gs && getComputedStyle(gs).display !== "none") startTimeTracking();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      const open = [...document.querySelectorAll(".modal-overlay.active")];
      if (open.length) appDismiss(open[open.length - 1].id);
    }
  });

  // دعم اختصارات PWA
  const params = new URLSearchParams(location.search);
  const action = params.get("action");
  if (action === "review") {
    setTimeout(() => { if (Object.keys(state.mistakes || {}).length) startReview(); }, 300);
  } else if (action === "challenge") {
    setTimeout(() => { if (content.journeyData.some(s => getStationStatus(s) !== "locked")) startChallenge(); }, 300);
  } else if (action === "parent") {
    setTimeout(() => parentEntry(), 300);
  }
  if (action) {
    try { history.replaceState({}, "", location.pathname); } catch(e) {}
  }

  if (!window.AndroidBridge && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(e => console.warn("SW:", e));
      // عند تثبيت نسخة جديدة نُعلم المستخدم مرة واحدة (لا عند أول تثبيت)
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (hadController) showToast("تم تحديث التطبيق إلى نسخة جديدة. أعد فتحه لتظهر كل التحسينات", "success");
      });
    });
  }
}
window.addEventListener("DOMContentLoaded", init);
