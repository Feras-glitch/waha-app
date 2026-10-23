const DATA = JSON.parse(document.getElementById('data').textContent);
const ALL = DATA.palms, CJ = DATA.conj || {items:[]}, MT = DATA.matn || {}, HIK = DATA.hikam || [], HAD = DATA.hadith || {items:[], nawawi:[]};
const GZ = DATA.alghaz, SH = DATA.shir, NT = DATA.nathr, HY = DATA.hayat, SF = DATA.sahifa;
const ROOTS = Object.keys(ALL);
const $ = (id) => document.getElementById(id);
const strip = (s) => String(s).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/ٱ/g,'ا');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MEM = {}; let STORE_WARNED = false;
function storageWarn(){ if (STORE_WARNED) return; STORE_WARNED = true; try { const w = document.createElement('div'); w.className = 'fb bad'; w.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;z-index:99;background:var(--paper);padding:10px 14px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.2)'; w.textContent = 'تنبيه: ذاكرة الجهاز ممتلئة ولا يُحفظ التقدّم. ⟨أخبر|أخبري⟩ ولي الأمر (صدّر نسخة احتياطية ثم امسح القديم).'; document.body.appendChild(w); setTimeout(() => w.remove(), 12000); } catch (e) {} }
/* الأطفال يُعرَفون بمعرّفٍ ثابت يأتي من ملفاتهم في التطبيق. برنامج الواحة يتعامل مع ترتيب الطفل (0، 1، 2…)،
   والحفظ يترجم الترتيب إلى المعرّف ذهابًا وإيابًا («m:0:…» يُحفظ «m:@k123:…»)، فحذف طفلٍ أو تغيّر الترتيب لا يخلط تقدّم أحد. */
const KIDKEY = /^([A-Za-z]+):(\d+)(:.*)?$/, NOT_KID = new Set(['relayStart']), ORPHAN = -9;
function kidIdAt(n){ try { return (kids[n] && kids[n].id) || null; } catch (e) { return null; } }
function kidAtId(id){ try { return kids.findIndex(k => k.id === id); } catch (e) { return -1; } }
function physKey(k){ const m = KIDKEY.exec(k); if (!m || NOT_KID.has(m[1])) return k; const id = kidIdAt(+m[2]); return id ? `${m[1]}:@${id}${m[3] || ''}` : k; }
function logicalKey(k){ const m = /^([A-Za-z]+):@([^:]+)(:.*)?$/.exec(k); if (!m) return k; const i = kidAtId(m[2]); return i < 0 ? null : `${m[1]}:${i}${m[3] || ''}`; }
const toId = v => (typeof v === 'number' && v >= 0 && kidIdAt(v)) ? '@' + kidIdAt(v) : v;
const toIx = v => { if (typeof v === 'string' && v[0] === '@'){ const i = kidAtId(v.slice(1)); return i < 0 ? ORPHAN : i; } return v; };
/* قوائم فيها رقم الطفل (كلمات ثلاث لغات، أسئلة الإخوة) */
const KID_LISTS = new Set(['tri', 'kq', 'kqa']);
const listIn = v => Array.isArray(v) ? v.map(x => (x && typeof x === 'object' && 'kid' in x) ? {...x, kid: toId(x.kid)} : x) : v;
const listOut = v => Array.isArray(v) ? v.map(x => (x && typeof x === 'object' && 'kid' in x) ? {...x, kid: toIx(x.kid)} : x).filter(x => !(x && x.kid === ORPHAN)) : v;
/* سجلات التسجيلات والهدايا: حقولٌ فيها رقم طفل */
const IDB_KID = {rec: ['kid', 'to'], gift: ['from', 'to']};
function recIn(st, r){ const f = IDB_KID[st]; if (!f || !r) return r; const o = {...r}; f.forEach(k => { if (k in o) o[k] = toId(o[k]); }); return o; }
function recOut(st, r){ const f = IDB_KID[st]; if (!f || !r) return r; const o = {...r}; let lost = false; f.forEach(k => { if (!(k in o)) return; o[k] = toIx(o[k]); if (o[k] === ORPHAN) lost = true; }); return lost ? null : o; }
const store = {
  get(k, d){ if (k in MEM) return MEM[k]; try{ const v = localStorage.getItem('oasis:'+physKey(k)); if (v == null) return d; const o = JSON.parse(v); return KID_LISTS.has(k) ? listOut(o) : o; }catch(e){return d;} },
  set(k,v){ MEM[k] = v; try{ localStorage.setItem('oasis:'+physKey(k), JSON.stringify(KID_LISTS.has(k) ? listIn(v) : v)); return true; }catch(e){ storageWarn(); return false; } },
  del(k){ delete MEM[k]; try { localStorage.removeItem('oasis:'+physKey(k)); } catch(e) {} },
  keys(){ let ks = []; try { ks = Object.keys(localStorage).filter(x => x.startsWith('oasis:')).map(x => logicalKey(x.slice(6))).filter(Boolean); } catch(e) {} return [...new Set([...ks, ...Object.keys(MEM)])]; },
};
/* تنظيف المفاتيح اليومية القديمة حتى لا تمتلئ الذاكرة (الرحلة بنصوصها: 3 أيام؛ سجل اليوم: 60 يومًا) */
function pruneStore(){ const keep = {trip: 3, dailyPick: 3, greeted: 3, amalPick: 3, day: 60, rvDay: 60}; const now = dayN();
  store.keys().forEach(k => { const m = /^(trip|dailyPick|greeted|amalPick|day|rvDay):\d+:(\d{4})-(\d\d)-(\d\d)$/.exec(k); if (!m) return; const d = dayN(new Date(+m[2], +m[3] - 1, +m[4])); if (now - d > keep[m[1]]) store.del(k); }); }
/* حذف طفل يجري في التطبيق، وتُحذف بياناته هناك بمعرّفه (oasisForget)، فلا ترحيل للمفاتيح هنا */
function shiftKidKeys(){}
const pick = (arr, last) => { let x; do { x = arr[Math.floor(Math.random()*arr.length)]; } while (arr.length>1 && x===last); return x; };
const shuffle = a => a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let D = ALL[store.get('root','علم')] || ALL[ROOTS[0]];

/* ---- answer checking: strict (diacritics ignored) / near (hamza, ta marbuta, ya) / wrong ---- */
const N1 = s => strip(String(s).replace(/\u0670/g, 'ا').replace(/[\u06E6\u06E7]/g, 'ي')).replace(/[،.!؟:«»"'()؛,]/g, '').replace(/\s+/g, ' ').trim();
const N2 = s => N1(s).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ؤئ]/g, 'ء');
const grade = (a, b) => N1(a) === N1(b) ? 'ok' : (N2(a) === N2(b) ? 'near' : 'bad');
const NEAR_WHY = (a, b) => { const x = N1(a), y = N1(b); if (/[أإآ]/.test(y) !== /[أإآ]/.test(x) || x.replace(/[أإآ]/g,'ا') === y.replace(/[أإآ]/g,'ا')) return '⟨انتبه|انتبهي⟩ للهمزة'; if (x.replace(/ة/g,'ه') === y.replace(/ة/g,'ه')) return '⟨انتبه|انتبهي⟩ للتاء المربوطة'; if (x.replace(/ى/g,'ي') === y.replace(/ى/g,'ي')) return '⟨انتبه|انتبهي⟩ للألف المقصورة'; return '⟨انتبه|انتبهي⟩ للرسم'; };

/* ---- kids: name + age; age decides the default (choices for the small, writing for the big) ---- */
let kids = store.get('kids', [{name:'١', age:6}, {name:'٢', age:8}, {name:'٣', age:10}, {name:'٤', age:12}]);
if (typeof kids[0] === 'string') { kids = kids.map((n, i) => ({name: n, age: [6, 8, 10, 12][i] || 8})); store.set('kids', kids); }
kids.forEach(k => { if (!k.gender) k.gender = 'm'; });
const fem = () => K().gender === 'f';
const T = (m, f) => fem() ? f : m;
let kid = store.get('kid', 0); if (kid >= kids.length) kid = 0;
const K = () => kids[kid];
const tier = () => (K().age <= 8 ? 'small' : 'big');
function avatarHtml(k, size){ return k.photo ? `<img src="${k.photo}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;vertical-align:middle">` : `<span style="display:inline-grid;place-items:center;width:${size}px;height:${size}px;border-radius:50%;background:var(--date-soft);color:var(--ink);font-weight:800;font-size:${Math.round(size*.45)}px;vertical-align:middle">${esc((k.name || '?').slice(0, 1))}</span>`; }
function renderWho(){ $('whoBtn').innerHTML = avatarHtml(K(), 26) + ' ' + esc(K().name) + ' ▾'; }
function kidsSheet(){
  const s = $('sheet'); s.innerHTML = `<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">من يلعب؟</h2><button class="x" aria-label="إغلاق">✕</button></div><div id="kidRows" style="display:flex;flex-direction:column;gap:8px"></div>
   <div class="row" style="border-top:1px solid var(--line);padding-top:8px"><button class="btn ghost sm" type="button" id="ksAdd">+ أضف طفلًا</button><button class="btn ghost sm" type="button" id="ksDad">ولي الأمر</button><button class="btn ghost sm" type="button" id="ksTeacher">المعلم</button></div>
   <p class="note">العمر يحدد الطريقة الأولى: من 6 إلى 8 يختار، ومن 10 فأكثر يكتب. الصورة تُحفظ على هذا الجهاز فقط.</p>`;
  const rows = s.querySelector('#kidRows');
  kids.forEach((k, i) => { const r = el('div','row'); r.style.alignItems = 'center';
    const b = el('button','chip2', avatarHtml(k, 28) + ' ' + esc(k.name)); b.type='button'; b.setAttribute('aria-pressed', i === kid); b.addEventListener('click', () => { kid = i; store.set('kid', kid); closeSheet(); onKid(); });
    const ed = el('button','btn ghost sm','تعديل'); ed.type='button'; ed.addEventListener('click', () => kidEditSheet(i));
    r.append(b, ed); rows.appendChild(r); });
  s.querySelector('#ksAdd').addEventListener('click', () => pinGate(() => { kids.push({name:'طفل ' + (kids.length + 1), age:8, gender:'m'}); store.set('kids', kids); kidEditSheet(kids.length - 1); }));
  s.querySelector('#ksDad').addEventListener('click', () => pinGate(() => go('dad')));
  s.querySelector('#ksTeacher').addEventListener('click', () => pinGate(() => { TEACHER = true; go('dad'); }));
  showSheet(); s.querySelector('.x').addEventListener('click', closeSheet);
}
function kidEditSheet(i){
  const k = kids[i]; const s = $('sheet');
  s.innerHTML = `<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">${avatarHtml(k, 44)} ${esc(k.name)}</h2><button class="x" aria-label="إغلاق">✕</button></div>
   <div class="fields">
    <label>الاسم<input class="f" id="keName" value="${esc(k.name)}"></label>
    <label>العمر<input class="f" id="keAge" type="number" min="4" max="16" value="${k.age}"></label>
    <label>ذكر أم أنثى؟<select class="f" id="keG"><option value="m" ${k.gender === 'm' ? 'selected' : ''}>ولد</option><option value="f" ${k.gender === 'f' ? 'selected' : ''}>بنت</option></select></label>
    <label>الصورة<input class="f" id="kePhoto" type="file" accept="image/*"></label>
   </div>
   <div class="btns" style="justify-content:flex-start"><button class="btn" type="button" id="keSave">احفظ</button>${k.photo ? '<button class="btn ghost" type="button" id="kePhotoDel">أزل الصورة</button>' : ''}${kids.length > 1 ? '<button class="btn ghost" type="button" id="keDel">احذف هذا الطفل</button>' : ''}</div><p class="fb" id="keFb"></p>`;
  showSheet(); s.querySelector('.x').addEventListener('click', closeSheet);
  s.querySelector('#kePhoto').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const img = new Image(); const url = URL.createObjectURL(f);
    img.onload = () => { const c = document.createElement('canvas'); const n = 96; c.width = c.height = n; const m = Math.min(img.width, img.height); c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, n, n); k.photo = c.toDataURL('image/jpeg', .8); URL.revokeObjectURL(url); store.set('kids', kids); $('keFb').textContent = 'أُضيفت الصورة.'; $('keFb').className = 'fb ok'; renderWho(); }; img.src = url; });
  s.querySelector('#keSave').addEventListener('click', () => { k.name = $('keName').value.trim() || k.name; k.age = Math.max(4, Math.min(16, +$('keAge').value || 8)); k.gender = $('keG').value; store.set('kids', kids); renderWho(); renderHome(); kidsSheet(); });
  const pd = s.querySelector('#kePhotoDel'); if (pd) pd.addEventListener('click', () => { delete k.photo; store.set('kids', kids); kidEditSheet(i); });
  const dl = s.querySelector('#keDel'); if (dl) dl.addEventListener('click', () => { if (!dl.dataset.c){ dl.dataset.c = '1'; dl.textContent = 'متأكد؟ اضغط مرة أخرى'; return; } pinGate(() => { kids.splice(i, 1); store.set('kids', kids); shiftKidKeys(i); if (kid > i) kid--; if (kid >= kids.length) kid = 0; store.set('kid', kid); onKid(); }); });
}
let TEACHER = false;
/* الرقم السري: يُحفظ مجزَّأً (SHA-256 مع ملح) لا نصًا؛ ويُطلب ضبطه من ولي الأمر في أول تشغيل. ليس حماية قوية من طفل يعرف أدوات المتصفح، لكنه يمنع القراءة المباشرة. */
async function pinHash(v, salt){ const d = new TextEncoder().encode(salt + ':' + v); if (crypto && crypto.subtle){ const h = await crypto.subtle.digest('SHA-256', d); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); } let x = 0; for (const c of salt + ':' + v) x = (x * 31 + c.charCodeAt(0)) >>> 0; return 'w' + x.toString(16); }
function pinSet(){ const p = store.get('pin', null); return !!(p && typeof p === 'object' && p.h); }
async function pinCheck(v){ const p = store.get('pin', null); if (!p) return false; if (typeof p === 'string') { if (v === p){ await pinSave(v); return true; } return false; } return (await pinHash(v, p.s)) === p.h; }
async function pinSave(v){ const salt = Math.random().toString(36).slice(2, 10); store.set('pin', {s: salt, h: await pinHash(v, salt)}); }
function pinGate(then, opts){
  const has = pinSet() || typeof store.get('pin', null) === 'string'; const s = $('sheet'); const setup = !has;
  s.innerHTML = `<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">${setup ? 'ولي الأمر: اختر رقمًا سريًّا (4 أرقام أو أكثر)' : 'رقم ولي الأمر'}</h2><button class="x" aria-label="إغلاق">✕</button></div><input class="f t" id="pinIn" type="password" inputmode="numeric" maxlength="8" placeholder="••••">${setup ? '<input class="f t" id="pinIn2" type="password" inputmode="numeric" maxlength="8" placeholder="أعد الرقم">' : ''}<div class="btns"><button class="btn" type="button" id="pinOk">${setup ? 'احفظ' : 'دخول'}</button></div><p class="fb" id="pinFb"></p><p class="note">${setup ? 'هذا الرقم يفتح لوحة ولي الأمر وإضافة الأطفال وحذفهم. احفظه؛ لا يمكن استرجاعه، ويُعاد ضبطه بمسح بيانات التطبيق.' : 'الرقم الذي اختاره ولي الأمر في أول تشغيل.'}</p>`;
  showSheet(); s.querySelector('.x').addEventListener('click', closeSheet); const inp = $('pinIn'); inp.focus();
  const bad = t => { $('pinFb').textContent = t; $('pinFb').className = 'fb bad'; };
  const ok = async () => { const v = inp.value.trim(); if (v.length < 4) return bad('أربعة أرقام على الأقل.');
    if (setup){ const v2 = ($('pinIn2').value || '').trim(); if (v2 !== v) return bad('الرقمان غير متطابقين.'); await pinSave(v); closeSheet(); then(); return; }
    if (await pinCheck(v)){ closeSheet(); then(); } else bad('الرقم غير صحيح.'); };
  $('pinOk').addEventListener('click', ok); s.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); }));
}
$('whoBtn').addEventListener('click', e => { e.stopPropagation(); kidsSheet(); });

/* ---- mastery: an item is mastered after two correct answers in a row; wrong items come back more often ---- */
const MK = (g, id) => `m:${kid}:${g}:${id}`;
function mget(g, id){ return store.get(MK(g, id), {n:0, ok:0, streak:0, wrong:0}); }
function seen(g){ return store.get(`seen:${kid}:${g}`, []); }
function mastered(g, id){ return mget(g, id).streak >= 2; }
/* spaced review: a mastered item comes due after 1, 3, 7, 21 then 45 days; a wrong answer resets it */
const DAY_MS = 86400000, INTERVALS = [1, 3, 7, 21, 45];
function dayN(t){ const d = t == null ? new Date() : new Date(t); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS); }
function dueOf(m){ if (m.streak < 2) return null; if (m.due != null) return m.due; return dayN(m.t || Date.now()) + INTERVALS[Math.min(m.streak - 2, INTERVALS.length - 1)]; }
function isDueM(m){ const d = dueOf(m); return d != null && d <= dayN(); }
function isDue(g, id){ return isDueM(mget(g, id)); }
function award(g, id, ok){
  const m = mget(g, id); m.n++;
  if (ok === true){ m.ok++; m.streak++; if (m.streak >= 2) m.due = dayN() + INTERVALS[Math.min(m.streak - 2, INTERVALS.length - 1)]; } else if (ok === false){ m.wrong++; m.streak = 0; m.due = null; }
  m.t = Date.now(); store.set(MK(g, id), m);
  const s = seen(g); if (!s.includes(id)){ s.push(id); store.set(`seen:${kid}:${g}`, s); }
  const dk = `day:${kid}:${today()}`; const d = store.get(dk, {}); d[g] = (d[g] || 0) + 1; store.set(dk, d);
  refreshScores(); checkStages();
}
function gstats(g){ const s = seen(g); return {seen: s.length, mastered: s.filter(id => mastered(g, id)).length, wrong: s.filter(id => mget(g, id).wrong > 0 && !mastered(g, id)).length}; }
function pickW(g, items, idOf, lastId){
  const w = items.map(it => { const id = idOf(it); if (items.length > 1 && id === lastId) return 0; const m = mget(g, id); if (m.n === 0) return 3; if (m.streak >= 2) return isDueM(m) ? 5 : 1; return m.streak === 0 ? 6 : 4; });
  let t = w.reduce((a, b) => a + b, 0) * Math.random();
  for (let i = 0; i < items.length; i++){ t -= w[i]; if (t < 0) return items[i]; }
  return items[items.length - 1];
}
function refreshScores(){
  document.querySelectorAll('.score[data-g]').forEach(e => { const s = gstats(e.dataset.g); e.innerHTML = `<span>${T('أتقنتَ','أتقنتِ')} <b>${s.mastered}</b></span><span>${T('جرّبتَ','جرّبتِ')} <b>${s.seen}</b></span>` + (s.wrong ? `<span>${T('تعود إليك','تعود إليكِ')} <b>${s.wrong}</b></span>` : ''); });
  document.querySelectorAll('.stage[data-g]').forEach(e => renderStageStrip(e));
  if ($('ltText')) { $('ltText').value = store.get(`letter:${kid}:${D.rootKey}`, ''); checkLetter(); }
}

/* ---- shared widgets ---- */
function mcq(box, options, correct, onDone, cls){
  box.innerHTML = '';
  shuffle(options.slice()).forEach(o => { const b = el('button', 'opt' + (cls ? ' ' + cls : '')); b.type = 'button'; b.textContent = o;
    b.addEventListener('click', () => { const ok = o === correct; for (const x of box.children){ x.disabled = true; if (x.textContent === correct) x.dataset.s = 'ok'; } if (!ok) b.dataset.s = 'bad'; onDone(ok); });
    box.appendChild(b); });
}
function feedback(id, st, good, bad, near){ const e = typeof id === 'string' ? $(id) : id; e.textContent = st === 'ok' || st === true ? good : (st === 'near' ? near : bad); e.className = 'fb ' + (st === true || st === 'ok' ? 'ok' : st === 'near' ? 'near' : 'bad'); }
const ALPHA = 'ابتثجحخدذرزسشصضطظعغفقكلمنهويءةىأإآؤئ';
let bankPref = null;
function typeBox(box, answer, opts){
  box.innerHTML = ''; const id = opts.id || 'ti';
  const inp = document.createElement('input'); inp.className = 'f t'; inp.type = 'text'; inp.id = id; inp.dir = 'rtl'; inp.setAttribute('autocomplete','off'); inp.setAttribute('autocapitalize','off'); inp.placeholder = opts.placeholder || '⟨اكتب|اكتبي⟩ هنا';
  const bank = el('div','bank'); const useBank = bankPref == null ? tier() === 'small' : bankPref;
  const letters = [...new Set(N1(answer).replace(/\s/g, ''))]; const extra = shuffle([...ALPHA].filter(c => !letters.includes(c))).slice(0, 3);
  shuffle([...letters, ...extra]).forEach(c => { const b = el('button', null, c); b.type='button'; b.addEventListener('click', () => { inp.value += c; inp.focus(); }); bank.appendChild(b); });
  if (/\s/.test(N1(answer))){ const b = el('button','u','مسافة'); b.type='button'; b.addEventListener('click', () => { inp.value += ' '; inp.focus(); }); bank.appendChild(b); }
  const del = el('button','u','⌫'); del.type='button'; del.addEventListener('click', () => { inp.value = inp.value.slice(0, -1); inp.focus(); }); bank.appendChild(del);
  bank.hidden = !useBank;
  const row = el('div','btns'); const chk = el('button','btn','⟨تحقّق|تحقّقي⟩'); chk.type='button'; const tog = el('button','btn ghost sm', useBank ? '⟨أخفِ|أخفي⟩ الحروف' : '⟨أظهر|أظهري⟩ الحروف'); tog.type='button';
  tog.addEventListener('click', () => { bank.hidden = !bank.hidden; bankPref = !bank.hidden; tog.textContent = bank.hidden ? '⟨أظهر|أظهري⟩ الحروف' : '⟨أخفِ|أخفي⟩ الحروف'; });
  let done = false;
  const finish = () => { if (done || !inp.value.trim()) return; done = true; const st = grade(inp.value, answer); inp.disabled = true; chk.disabled = true; for (const b of bank.children) b.disabled = true; inp.style.borderColor = st === 'ok' ? 'var(--ok)' : st === 'near' ? 'var(--near)' : 'var(--bad)'; opts.onDone(st, inp.value); };
  chk.addEventListener('click', finish); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); finish(); } });
  row.append(chk, tog); box.append(inp, bank, row); if (!opts.noFocus) inp.focus();
}
function markSpan(text, span){ return markMany(text, span ? [span] : []); }
function markMany(text, spans){ const hits = spans.map(sp => [text.indexOf(sp), sp]).filter(h => h[0] >= 0).sort((a, b) => a[0] - b[0]); let out = '', k = 0;
  for (const [i, sp] of hits){ if (i < k) continue; out += esc(text.slice(k, i)) + '<mark>' + esc(sp) + '</mark>'; k = i + sp.length; } return out + esc(text.slice(k)); }
function verseHtml(v, cls){ return `<p class="q ${cls||'s'}">﴿${markSpan(v.text, v.word)}﴾</p><p class="ref" style="margin:0">${v.name} ${v.s}:${v.a}</p>`; }
/* مقطع من الآية حول الكلمة (n كلمات قبلها وبعدها) للآيات الطويلة، مع «…» في الطرفين */
function snip(text, word, n){ const ws = text.split(' '); if (ws.length <= 2 * (n || 8) + 1) return text; const i = ws.indexOf(word); if (i < 0) return text; const a = Math.max(0, i - (n || 8)), b = Math.min(ws.length, i + (n || 8) + 1); return (a ? '… ' : '') + ws.slice(a, b).join(' ') + (b < ws.length ? ' …' : ''); }
function blankHtml(v, short){ const t = short ? snip(v.text, v.word, 8) : v.text; return `<p class="q s">﴿${esc(t).replace(esc(v.word), '<mark>……</mark>')}﴾</p><p class="ref" style="margin:0">${v.name} ${v.s}:${v.a}</p>`; }

/* ---- the growing oasis: 22 stages, each unlocks one thing in the child's scene ---- */
const STAGES = [
 {id:'S01', el:'sprout',  name:'البذرة',        desc:'فتح 6 ثمرات في النخيل',                  o:'roots',  t:'oasis',   fn: () => ROOTS.reduce((a, k) => a + store.get(`opened:${kid}:${k}`, []).length, 0), need:6},
 {id:'S02', el:'palm1',   name:'النخلة الأولى', desc:'إتقان 5 أسئلة في «الوزن المناسب»',          o:'roots',  t:'roles',   g:'rl',  need:5},
 {id:'S03', el:'spring',  name:'النبع',         desc:'إتقان 5 ألغاز في «من أنا؟»',               o:'alghaz', t:'gzWho',   g:'gzw', need:5},
 {id:'S04', el:'grass',   name:'العشب',         desc:'إتقان 6 أشياء في «الألوان»',                o:'hayat',  t:'hyColors',g:'hyc', need:6},
 {id:'S05', el:'palm2',   name:'النخلة الثانية',desc:'إتقان 6 كلمات في «نقطة تغيّر المعنى»',       o:'alghaz', t:'gzDots',  g:'gzd', need:6},
 {id:'S06', el:'tent',    name:'الخيمة',        desc:'إتقان 8 مواقف في «ماذا ⟨تقول|تقولين⟩؟»',             o:'hayat',  t:'hySay',   g:'hys', need:8},
 {id:'S07', el:'birds',   name:'الطيور',        desc:'إتقان 5 أبيات في «⟨أكمل|أكملي⟩ البيت»',             o:'shir',   t:'shAbyat', g:'sha', need:5},
 {id:'S08', el:'palm3',   name:'النخلة الثالثة',desc:'إتقان 6 كلمات في «⟨اشتقّ|اشتقّي⟩ الكلمة»',           o:'roots',  t:'derive',  g:'drv', need:6},
 {id:'S09', el:'camel',   name:'الجمل',         desc:'إتقان 9 أسئلة في الحكايات',                 o:'nathr',  t:'ntList',  g:'nt',  need:9},
 {id:'S10', el:'lake',    name:'البحيرة',       desc:'النجاح في اختبار القافلة الأول',             o:'test',   t:'test',    test:1, after:6},
 {id:'S11', el:'flowers', name:'الزهور',        desc:'إتقان 8 أمثال في «متى ⟨تقولها|تقولينها⟩؟»',             o:'hikam',  t:'hikam',   g:'hk',  need:8},
 {id:'S12', el:'fire',    name:'نار السمر',     desc:'إتقان 6 جمل في «⟨رتّب|رتّبي⟩ الجملة»',              o:'hayat',  t:'hyOrder', g:'hyo', need:6},
 {id:'S13', el:'palm4',   name:'النخلة الرابعة',desc:'إتقان 6 آيات في «⟨اكتب|اكتبي⟩ الكلمة الناقصة»',      o:'roots',  t:'recall',  g:'fill',need:6},
 {id:'S23', el:'cloud',   name:'الغيمة',        desc:'إتقان 10 كلمات في «إملاء بالذاكرة»',          o:'workshop', t:'wsDict', g:'dct', need:10},
 {id:'S14', el:'stars',   name:'النجوم',        desc:'إتقان 8 نصوص في «من القائل؟»',              o:'hadith', t:'hadith',  g:'wh',  need:8},
 {id:'S15', el:'well',    name:'البئر',         desc:'إتقان 8 ألغاز في «ألغاز وأحاجي»',            o:'alghaz', t:'gzFolk',  g:'gzf', need:8},
 {id:'S16', el:'flag',    name:'راية القافلة',  desc:'نشر خبرين في صحيفتك',                    o:'sahifa', t:'sfWrite', fn: () => store.get(`paper:${kid}`, []).length, need:2},
 {id:'S17', el:'nightingale', name:'البلبل',    desc:'إتقان 8 أبيات في تسميع قصائد شوقي',          o:'shir',   t:'shKids',  g:'pml', need:8},
 {id:'S24', el:'hive',    name:'خلية النحل',     desc:'إتقان 8 صيغ في «⟨صرّف|صرّفي⟩ الفعل»',               o:'workshop', t:'wsConj', g:'cnj', need:8},
 {id:'S25', el:'mosque',  name:'دار القرآن',     desc:'إتقان 15 بيتًا في تسميع المتون',             o:'matn',   t:'mtRecite', g:'mtn', need:15},
 {id:'S26', el:'dates',   name:'سلّة التمر',     desc:'5 تسجيلات معتمدة من ولي الأمر أو المعلم',   o:'rec',    t:'recShelf', fn: () => store.get(`recApproved:${kid}`, 0), need:5},
 {id:'S18', el:'boat',    name:'القارب',        desc:'النجاح في اختبار القافلة الثاني',            o:'test',   t:'test',    test:2, after:15},
 {id:'S19', el:'gazelle', name:'الغزال',        desc:'إتقان 5 حكايات في «⟨رتّب|رتّبي⟩ الأحداث»',           o:'nathr',  t:'ntList',  g:'nto', need:5},
 {id:'S20', el:'palm5',   name:'النخلة الكبرى', desc:'إتقان 20 سؤالًا في «الوزن المناسب»',         o:'roots',  t:'roles',   g:'rl',  need:20},
 {id:'S27', el:'kite',    name:'الطائرة الورقية', desc:'3 أسئلة من تأليفك أجازها ولي الأمر',         o:'workshop', t:'wsAsk', fn: () => store.get('kqa', []).filter(q => q.kid === kid).length, need:3},
 {id:'S28', el:'lantern', name:'الفانوس',       desc:'إهداء تسجيلٍ معتمد لأخٍ أو صديق',           o:'rec',    t:'giftShelf', fn: () => store.get(`giftsSent:${kid}`, 0), need:1},
 {id:'S29', el:'tree',    name:'شجرة العلم',     desc:'3 هدايا أتمّها من ⟨أهديتَها|أهديتِها⟩ إليهم',            o:'rec',    t:'giftShelf', fn: () => store.get(`giftsMastered:${kid}`, 0), need:3},
 {id:'S30', el:'garden',  name:'الحديقة',        desc:'5 أعمال من «⟨اعمل|اعملي⟩ به» أكّدها ولي الأمر',       o:'home',   t:'home',      fn: () => store.get(`amalDone:${kid}`, 0), need:5},
 {id:'S32', el:'market',  name:'السوق',          desc:'10 كلمات ⟨كتبتَها|كتبتِها⟩ بالصينية والإنجليزية وأجازها ولي الأمر', o:'roots', t:'palm', fn: () => triApproved(kid).length, need:10},
 {id:'S33', el:'juzstars', name:'نجمة المصحف',   desc:'جزء كامل في مصحفك بصوتك، كل صفحاته اعتمدها الشيخ', o:'rec', t:'mushaf', fn: () => store.get(`mushafUnits:${kid}`, 0), need:1},
 {id:'S34', el:'halqa',   name:'حلقة التتابع',   desc:'سورة كاملة بأصوات الإخوة في «التتابع»',          o:'rec', t:'relay',  fn: () => store.get(`relayDone:${kid}`, []).length, need:1},
 {id:'S36', el:'lamp',    name:'القنديل',        desc:'12 سؤالًا متقنًا في «كم عددها؟» من نظم الآجرومية', o:'matn', t:'mtAjr',  g:'ajc', need:12},
 {id:'S37', el:'inkwell', name:'الدواة',         desc:'15 كلمة ⟨أعربتَها|أعربتِها⟩ صحيحًا من تدريبات «التحفة السنية»', o:'matn', t:'mtAjr', g:'irb', need:15},
 {id:'S35', el:'minbar',  name:'المنبر',         desc:'10 تعريفات من الآجرومية في «ما المصطلح؟»',       o:'matn', t:'mtAjr',  g:'ajd', need:10},
 {id:'S31', el:'saqiya',  name:'الساقية',        desc:'20 سؤالًا في «مراجعة اليوم» (ما ⟨أتقنتَه|أتقنتِه⟩ يعود إليك بعد أيام)', o:'review', t:'rvCard', fn: () => store.get(`rvDone:${kid}`, 0), need:20},
 {id:'S21', el:'moon',    name:'القمر',         desc:'إتقان 10 ألغاز في «جذرٌ يختبئ»',             o:'alghaz', t:'gzRoot',  g:'gzr', need:10},
 {id:'S22', el:'caravan', name:'القافلة',       desc:'النجاح في اختبار القافلة الثالث',            o:'test',   t:'test',    test:3, after:22},
];
const STAGE_NAMES_EL = {sprout:'نبتة', palm1:'نخلة', palm2:'نخلة ثانية', palm3:'نخلة ثالثة', palm4:'نخلة رابعة', palm5:'النخلة الكبرى', spring:'نبع', lake:'بحيرة', grass:'عشب', tent:'خيمة', birds:'طيور', camel:'جمل', flowers:'زهور', fire:'نار السمر', stars:'نجوم', well:'بئر', flag:'راية', nightingale:'بلبل', boat:'قارب', gazelle:'غزال', moon:'قمر', caravan:'قافلة', cloud:'غيمة ممطرة', hive:'خلية نحل', mosque:'دار القرآن', dates:'سلّة تمر', kite:'طائرة ورقية', lantern:'فانوس', tree:'شجرة العلم', garden:'حديقة', saqiya:'ساقية', market:'سوق', juzstars:'نجوم المصحف', halqa:'حلقة', minbar:'منبر', lamp:'قنديل', inkwell:'دواة وقلم'};
function stageDone(s){ return !!store.get(`stage:${kid}:${s.id}`, false); }
function stageCur(s){ if (s.test) return store.get(`tests:${kid}`, []).some(t => t.n === s.test && t.pass) ? 1 : 0; if (s.fn) return s.fn(); return gstats(s.g).mastered; }
function stageNeed(s){ return s.test ? 1 : s.need; }
function stagesDoneCount(){ return STAGES.filter(stageDone).length; }
function stageLocked(s){ return !!s.after && stagesDoneCount() < s.after; }
function nextStage(){ return STAGES.find(s => !stageDone(s) && !stageLocked(s)) || null; }
function stageFor(g){ return STAGES.find(s => s.g === g && !stageDone(s)) || STAGES.filter(s => s.g === g).pop() || null; }
let celeQueue = [];
function checkStages(){
  let changed = false;
  for (const s of STAGES){ if (stageDone(s) || stageLocked(s)) continue; if (stageCur(s) >= stageNeed(s)){ store.set(`stage:${kid}:${s.id}`, Date.now()); celeQueue.push(s); changed = true; } }
  if (changed){ renderHome(); showCele(); }
}
function showCele(){
  if (!celeQueue.length || !$('cele').hidden) return; const s = celeQueue.shift();
  const c = $('cele'); c.innerHTML = `<div class="cc"><svg viewBox="0 0 200 200" aria-hidden="true">${SCENE_SOLO(s.el)}</svg><h2>${esc(STAGE_NAMES_EL[s.el])} جديدة في واحة ${esc(K().name)}!</h2><p>${esc(s.name)}: ${esc(s.desc)}</p><div class="btns"><button class="btn" id="ceHome">⟨انظر|انظري⟩ واحتي</button><button class="btn ghost" id="ceOn">⟨تابع|تابعي⟩ اللعب</button></div></div>`;
  c.hidden = false; $('ceHome').focus();
  $('ceHome').addEventListener('click', () => { c.hidden = true; go('home'); showCele(); });
  $('ceOn').addEventListener('click', () => { c.hidden = true; showCele(); });
}
function renderStageStrip(e){
  const g = e.dataset.g; const s = stageFor(g); if (!s){ e.hidden = true; return; } e.hidden = false;
  const cur = Math.min(stageCur(s), stageNeed(s)), need = stageNeed(s), done = stageDone(s);
  e.className = 'stage' + (done ? ' done' : '');
  e.innerHTML = `<span class="ic"><svg viewBox="0 0 200 200" aria-hidden="true">${SCENE_SOLO(s.el)}</svg></span><span class="t">${done ? `⟨فتحتَ|فتحتِ⟩ ${esc(STAGE_NAMES_EL[s.el])}. ⟨تابع|تابعي⟩ ⟨لتُتقن|لتُتقني⟩ أكثر.` : `${esc(s.name)}: ${esc(s.desc)}`}<span class="track"><i style="width:${Math.round(100*cur/need)}%"></i></span></span><span class="n" style="font-variant-numeric:tabular-nums">${cur}/${need}</span>`;
}

/* ---- drawing the oasis ---- */
const PALM_POS = {palm1:[292,232,1.35], palm2:[452,232,1.35], palm3:[222,240,1], palm4:[522,240,1], palm5:[372,226,1.75]};
function svgPalm(x, y, s){
  const tx = x + 8*s, ty = y - 78*s; let f = '';
  for (let i = 0; i < 7; i++){ const a = Math.PI * (i + .5) / 7; const ex = tx + Math.cos(a) * 44 * s, ey = ty - Math.sin(a) * 10 * s + 22 * s; f += `<path d="M${tx} ${ty} Q${(tx+ex)/2} ${Math.min(ty, ey) - 26*s} ${ex} ${ey}" stroke="var(--sc-leaf)" stroke-width="${4.5*s}" fill="none" stroke-linecap="round"/>`; }
  f += `<path d="M${tx} ${ty} Q${tx-4*s} ${ty-28*s} ${tx-2*s} ${ty-40*s}" stroke="var(--sc-leaf2)" stroke-width="${4*s}" fill="none" stroke-linecap="round"/>`;
  const trunk = `<path d="M${x-5*s} ${y} Q${x+1*s} ${y-40*s} ${tx-3*s} ${ty+2*s} L${tx+4*s} ${ty+2*s} Q${x+9*s} ${y-40*s} ${x+6*s} ${y} Z" fill="var(--sc-trunk)"/>`;
  const dates = [0,1,2].map(i => `<circle cx="${tx - 6*s + i*5*s}" cy="${ty + 8*s + (i%2)*3*s}" r="${3.2*s}" fill="var(--date)"/>`).join('');
  return trunk + f + dates;
}
function svgCamel(x, y, s, op){
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="var(--sc-trunk)" stroke="var(--sc-trunk)" opacity="${op||1}"><ellipse cx="0" cy="-20" rx="24" ry="12"/><circle cx="4" cy="-31" r="9"/><path d="M20 -24 Q31 -30 33 -46" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="38" cy="-48" rx="7" ry="4.5"/><path d="M-16 -12 L-17 2 M-7 -10 L-7 2 M8 -10 L8 2 M17 -12 L18 2" stroke-width="4" stroke-linecap="round"/><path d="M-22 -22 q-6 4 -4 10" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
}
function svgGazelle(x, y, s){
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="#b98a4f" stroke="#b98a4f"><ellipse cx="0" cy="-16" rx="16" ry="8"/><path d="M12 -20 Q18 -28 20 -36" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="22" cy="-38" rx="5" ry="3.5"/><path d="M20 -41 l-3 -9 M24 -41 l3 -9" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-10 -10 L-12 2 M-4 -9 L-4 2 M4 -9 L5 2 M10 -10 L12 2" stroke-width="3" stroke-linecap="round"/></g>`;
}
function svgBird(x, y, s, col){ return `<path d="M${x} ${y} q${5*s} ${-6*s} ${10*s} 0 q${5*s} ${-6*s} ${10*s} 0" stroke="${col||'var(--ink)'}" stroke-width="${2*s}" fill="none" stroke-linecap="round"/>`; }
function svgStar(x, y, s){ return `<path class="twinkle" d="M${x} ${y-s} L${x+s*.3} ${y-s*.3} L${x+s} ${y} L${x+s*.3} ${y+s*.3} L${x} ${y+s} L${x-s*.3} ${y+s*.3} L${x-s} ${y} L${x-s*.3} ${y-s*.3} Z" fill="var(--sc-star)"/>`; }
const SC = {
  sprout: () => `<path d="M360 232 q0 -14 -2 -22" stroke="var(--sc-leaf)" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M358 216 q-12 -8 -10 -18 q12 2 10 18 Z" fill="var(--sc-leaf)"/><path d="M358 220 q12 -8 12 -18 q-12 0 -12 18 Z" fill="var(--sc-leaf2)"/>`,
  palm1: () => svgPalm(...PALM_POS.palm1), palm2: () => svgPalm(...PALM_POS.palm2), palm3: () => svgPalm(...PALM_POS.palm3), palm4: () => svgPalm(...PALM_POS.palm4), palm5: () => svgPalm(...PALM_POS.palm5),
  spring: () => `<ellipse cx="372" cy="244" rx="26" ry="8" fill="var(--sc-water)"/><ellipse cx="372" cy="244" rx="14" ry="4" fill="var(--sc-water2)"/><ellipse cx="372" cy="244" rx="34" ry="11" stroke="var(--sc-water2)" stroke-width="1.5" fill="none" opacity=".7"/>`,
  lake: () => `<ellipse cx="372" cy="262" rx="120" ry="22" fill="var(--sc-water)"/><ellipse cx="372" cy="262" rx="90" ry="13" fill="var(--sc-water2)" opacity=".7"/><path d="M300 262 q20 -4 40 0 M350 268 q20 -4 40 0 M400 258 q20 -4 40 0" stroke="var(--sc-water)" stroke-width="2" fill="none" opacity=".8"/>`,
  grass: () => [330,345,400,415,425,320].map((x, i) => `<path d="M${x} ${250 - (i%2)*3} l-3 -12 M${x} ${250 - (i%2)*3} l0 -15 M${x} ${250 - (i%2)*3} l3 -12" stroke="var(--sc-leaf)" stroke-width="2" fill="none" stroke-linecap="round"/>`).join(''),
  flowers: () => [[150,246,'#e05a7a'],[165,250,'#f6c453'],[182,245,'#e05a7a'],[197,251,'#7b3fa0'],[212,247,'#f6c453']].map(([x,y,c]) => `<path d="M${x} ${y} l0 -10" stroke="var(--sc-leaf)" stroke-width="2"/><circle cx="${x}" cy="${y-12}" r="4" fill="${c}"/><circle cx="${x}" cy="${y-12}" r="1.5" fill="#fff"/>`).join(''),
  tent: () => `<path d="M80 234 L118 180 L156 234 Z" fill="#c9a46a"/><path d="M118 180 L156 234 L138 234 L118 196 Z" fill="#a9844d"/><path d="M112 234 L118 214 L124 234 Z" fill="var(--sc-trunk)"/>`,
  fire: () => `<path d="M168 236 l20 -3 M170 230 l18 8" stroke="var(--sc-trunk)" stroke-width="3" stroke-linecap="round"/><path d="M179 232 q-10 -10 -2 -22 q2 8 7 10 q4 -8 2 -14 q10 10 3 26 Z" fill="#e8742a"/><path d="M179 231 q-4 -6 0 -12 q3 4 4 6 q3 -4 2 -8 q5 6 0 14 Z" fill="#f6c453"/>`,
  well: () => `<rect x="548" y="214" width="28" height="22" rx="3" fill="#9a8a78"/><path d="M548 222 h28 M548 230 h28 M557 214 v22 M567 214 v22" stroke="#6e6052" stroke-width="1.2"/><path d="M546 214 L562 196 L578 214 Z" fill="var(--sc-trunk)"/><path d="M551 214 v-10 M573 214 v-10" stroke="var(--sc-trunk)" stroke-width="3"/><path d="M562 200 v10" stroke="#6e6052" stroke-width="1.5"/><rect x="558" y="208" width="8" height="6" fill="#6e6052"/>`,
  birds: () => svgBird(470, 70, 1.2) + svgBird(500, 58, 1) + svgBird(525, 74, .9),
  camel: () => svgCamel(620, 240, 1),
  gazelle: () => svgGazelle(60, 240, 1),
  boat: () => `<path d="M352 262 q20 8 40 0 l-4 6 q-16 5 -32 0 Z" fill="var(--sc-trunk)"/><path d="M372 262 v-22" stroke="var(--sc-trunk)" stroke-width="2"/><path d="M372 240 l16 18 h-16 Z" fill="#f3e6c8"/>`,
  flag: () => `<path d="M118 180 v-26" stroke="var(--sc-trunk)" stroke-width="2"/><path d="M118 154 l18 6 l-18 6 Z" fill="var(--date)"/>`,
  stars: () => svgStar(80, 40, 5) + svgStar(160, 28, 4) + svgStar(240, 48, 3.5) + svgStar(560, 36, 4.5) + svgStar(640, 60, 3.5) + svgStar(690, 30, 4),
  moon: () => `<circle cx="640" cy="52" r="18" fill="var(--sc-sun)"/><circle cx="648" cy="46" r="15" fill="var(--sc-sky1)"/>`,
  nightingale: () => `<g transform="translate(276 132)"><ellipse cx="0" cy="0" rx="7" ry="5" fill="#b98a4f"/><circle cx="6" cy="-3" r="3.5" fill="#b98a4f"/><path d="M9.5 -3 l4 1 l-4 1 Z" fill="var(--date)"/><path d="M-7 0 l-6 -4 l0 6 Z" fill="#8a6235"/></g>`,
  cloud: () => `<g transform="translate(560 70)"><ellipse cx="0" cy="0" rx="34" ry="14" fill="var(--paper)"/><circle cx="-14" cy="-8" r="14" fill="var(--paper)"/><circle cx="8" cy="-12" r="17" fill="var(--paper)"/><circle cx="24" cy="-4" r="12" fill="var(--paper)"/><path d="M-18 18 l-4 10 M-4 18 l-4 10 M10 18 l-4 10 M24 18 l-4 10" stroke="var(--sc-water)" stroke-width="2.5" stroke-linecap="round"/></g>`,
  hive: () => `<g transform="translate(560 160)"><path d="M-14 36 h28 l6 -8 h-40 Z M-18 28 h36 l5 -8 h-46 Z M-20 20 h40 l3 -8 h-46 Z M-16 12 h32 l-6 -8 h-20 Z" fill="#d9a441" stroke="#a9742a" stroke-width="1.2"/><circle cx="0" cy="28" r="3" fill="#5b3a1a"/><circle cx="-26" cy="6" r="2.2" fill="#3a2c17"/><circle cx="28" cy="14" r="2.2" fill="#3a2c17"/><circle cx="22" cy="-2" r="2.2" fill="#3a2c17"/></g>`,
  mosque: () => `<g transform="translate(640 206)"><rect x="-34" y="0" width="68" height="30" fill="#efe6d2" stroke="#b8a888" stroke-width="1.2"/><path d="M-26 0 q26 -36 52 0 Z" fill="var(--sc-leaf2)"/><rect x="38" y="-34" width="8" height="64" fill="#efe6d2" stroke="#b8a888" stroke-width="1.2"/><path d="M36 -34 q6 -12 12 0 Z" fill="var(--sc-leaf2)"/><path d="M42 -40 a3 3 0 1 1 0.1 0" fill="var(--date)"/><path d="M-8 30 v-14 a8 8 0 0 1 16 0 v14 Z" fill="var(--sc-trunk)"/></g>`,
  dates: () => `<g transform="translate(200 236)"><path d="M-16 0 h32 l-4 12 h-24 Z" fill="#c9a46a" stroke="#8a6235" stroke-width="1"/><path d="M-12 0 q12 -14 24 0" stroke="#8a6235" stroke-width="2" fill="none"/>${[-10,-4,2,8,-7,-1,5].map((x, i) => `<ellipse cx="${x}" cy="${i < 4 ? -2 : -6}" rx="3.2" ry="2.2" fill="var(--date)"/>`).join('')}</g>`,
  kite: () => `<g transform="translate(400 60)"><path d="M0 -22 L14 0 L0 22 L-14 0 Z" fill="#e05a7a"/><path d="M0 -22 V22 M-14 0 H14" stroke="#fff" stroke-width="1.2" opacity=".7"/><path d="M0 22 q-10 20 -30 60" stroke="var(--ink)" stroke-width="1.2" fill="none"/><path d="M-6 34 l6 3 M-12 46 l6 3 M-18 58 l6 3" stroke="#f6c453" stroke-width="2"/></g>`,
  lantern: () => `<g transform="translate(66 214)"><path d="M0 -26 v-6" stroke="var(--sc-trunk)" stroke-width="2"/><path d="M-7 -26 h14 l-2 4 h-10 Z" fill="#5b3a1a"/><path d="M-7 -22 q-4 10 0 22 h14 q4 -12 0 -22 Z" fill="#f6c453" stroke="#a9742a" stroke-width="1.2"/><path d="M-3 -17 v14 M3 -17 v14" stroke="#a9742a" stroke-width="1"/><circle cx="0" cy="-11" r="3" fill="#e8742a"/></g>`,
  tree: () => `<g transform="translate(150 236)"><path d="M-4 0 q2 -24 0 -46 h8 q-2 22 0 46 Z" fill="var(--sc-trunk)"/><circle cx="0" cy="-58" r="22" fill="var(--sc-leaf)"/><circle cx="-16" cy="-48" r="14" fill="var(--sc-leaf2)"/><circle cx="16" cy="-48" r="14" fill="var(--sc-leaf2)"/><circle cx="0" cy="-72" r="12" fill="var(--sc-leaf)"/>${[[-8,-60],[6,-52],[0,-44],[12,-66],[-14,-40]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#e05a7a"/>`).join('')}</g>`,
  garden: () => `<g transform="translate(250 250)"><path d="M-40 0 h80 l-6 -10 h-68 Z" fill="#8a6235"/>${[-30,-18,-6,6,18,30].map(x => `<path d="M${x} -10 l-4 -8 M${x} -10 l0 -12 M${x} -10 l4 -8" stroke="var(--sc-leaf)" stroke-width="2" stroke-linecap="round"/><circle cx="${x}" cy="-22" r="2.2" fill="#e8742a"/>`).join('')}</g>`,
  saqiya: () => `<g transform="translate(452 236)"><path d="M-30 0 h60 l-3 6 h-54 Z" fill="#9a8a78"/><path d="M-18 0 v-30 M18 0 v-30" stroke="var(--sc-trunk)" stroke-width="3"/><circle cx="0" cy="-30" r="22" fill="none" stroke="var(--sc-trunk)" stroke-width="3"/><circle cx="0" cy="-30" r="3" fill="var(--sc-trunk)"/>${[0,45,90,135].map(a => `<path d="M-22 0 h44" transform="translate(0 -30) rotate(${a})" stroke="var(--sc-trunk)" stroke-width="2.5"/>`).join('')}${[0,60,120,180,240,300].map(a => `<rect x="-4" y="-25" width="8" height="6" rx="1" transform="translate(0 -30) rotate(${a})" fill="#c9a46a"/>`).join('')}<path d="M-28 -2 q-6 -8 -14 -6" stroke="var(--sc-water)" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M-36 -6 l-2 6 M-42 -5 l-2 6" stroke="var(--sc-water2)" stroke-width="1.5" stroke-linecap="round"/></g>`,
  market: () => `<g transform="translate(300 214)"><path d="M-26 0 v-22 M26 0 v-22" stroke="var(--sc-trunk)" stroke-width="2.5"/><path d="M-32 -22 h64 l-6 -10 h-52 Z" fill="#e05a7a"/><path d="M-32 -22 h64" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 6"/><rect x="-22" y="-10" width="44" height="10" fill="#c9a46a" stroke="#8a6235" stroke-width="1"/>${[-15,-5,5,15].map((x, i) => `<circle cx="${x}" cy="-13" r="3" fill="${['#f6c453','#e8742a','var(--date)','#7b3fa0'][i]}"/>`).join('')}</g>`,
  juzstars: () => { const n = Math.max(1, store.get(`mushafUnits:${kid}`, 0)); const names = (DATA.quran && DATA.quran.units || []).map(u => u.name); return Array.from({length: n}, (_, i) => { const a = Math.PI * (0.25 + 0.5 * i / Math.max(1, n - 1)); const x = 360 + Math.cos(a) * 110, y = 70 - Math.sin(a) * 40; const S = 13; return `<g><title>${esc(names[i] || '')}</title><circle cx="${x}" cy="${y}" r="${S + 6}" fill="#f6c453" opacity=".28"/><path d="M${x} ${y-S} L${x+S*.3} ${y-S*.3} L${x+S} ${y} L${x+S*.3} ${y+S*.3} L${x} ${y+S} L${x-S*.3} ${y+S*.3} L${x-S} ${y} L${x-S*.3} ${y-S*.3} Z" fill="#f6c453" stroke="#a9742a" stroke-width="1"/><circle cx="${x}" cy="${y}" r="2.5" fill="#fff" opacity=".9"/></g>`; }).join(''); },
  halqa: () => `<g transform="translate(120 258)"><ellipse cx="0" cy="0" rx="46" ry="12" fill="#c9a46a" opacity=".8"/>${[-32,-11,11,32].map((x, i) => `<g transform="translate(${x} ${i % 2 ? -4 : 2})"><ellipse cx="0" cy="0" rx="6" ry="4" fill="var(--sc-trunk)"/><rect x="-4" y="-12" width="8" height="9" rx="2" fill="${['#e05a7a','#7b3fa0','var(--sc-leaf2)','#e8742a'][i]}"/><circle cx="0" cy="-15" r="3.2" fill="#d8b48a"/></g>`).join('')}<path d="M-6 -12 h12 v8 h-12 Z" fill="var(--paper)" stroke="#8a6235" stroke-width="1"/><path d="M0 -12 v8" stroke="#8a6235" stroke-width="1"/></g>`,
  minbar: () => `<g transform="translate(586 236)"><path d="M-10 0 h20 v-6 h-6 v-6 h-6 v-6 h-8 Z" fill="#8a6235"/><path d="M-10 0 v-18 h8" stroke="#5b3a1a" stroke-width="1.2" fill="none"/><path d="M-10 -18 h8 v-10 h-8 Z" fill="#c9a46a" stroke="#5b3a1a" stroke-width="1"/><circle cx="-6" cy="-30" r="2" fill="var(--date)"/></g>`,
  lamp: () => `<g transform="translate(610 120)"><path d="M0 -30 v10" stroke="var(--sc-trunk)" stroke-width="1.5"/><path d="M-9 -20 h18 l-3 -4 h-12 Z" fill="#a9742a"/><path d="M-9 -20 q-4 14 9 22 q13 -8 9 -22 Z" fill="#f6c453" stroke="#a9742a" stroke-width="1.2"/><circle cx="0" cy="-8" r="3.5" fill="#e8742a"/><circle cx="0" cy="-8" r="12" fill="#f6c453" opacity=".25"/></g>`,
  inkwell: () => `<g transform="translate(236 252)"><path d="M-9 0 h18 v-10 q0 -6 -6 -7 h-6 q-6 1 -6 7 Z" fill="#3a2c17"/><rect x="-5" y="-21" width="10" height="4" rx="1" fill="#5b3a1a"/><path d="M2 -20 L16 -44" stroke="#c9a46a" stroke-width="2.5" stroke-linecap="round"/><path d="M16 -44 l3 -6 l-1 7 Z" fill="#8a6235"/></g>`,
  caravan: () => svgCamel(540, 206, .45, .8) + svgCamel(580, 204, .45, .8) + svgCamel(620, 206, .45, .8) + `<path d="M532 204 q50 -8 100 0" stroke="var(--sc-trunk)" stroke-width="1" fill="none" opacity=".5"/>`,
};
const SCENE_ORDER = ['stars','moon','cloud','kite','birds','mosque','tree','caravan','lake','spring','grass','flowers','sprout','palm3','palm4','palm1','palm2','palm5','nightingale','tent','flag','fire','well','camel','gazelle','boat','hive','dates','lantern','garden','saqiya','market','juzstars','halqa','minbar','lamp','inkwell','seed'];
function sceneSvg(unlocked, newEl){
  const base = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sc-sky1)"/><stop offset="1" stop-color="var(--sc-sky2)"/></linearGradient></defs>
   <rect width="720" height="300" fill="url(#sky)"/><circle cx="100" cy="70" r="26" fill="var(--sc-sun)" opacity=".95"/>
   <path d="M0 210 Q180 160 360 205 T720 200 L720 300 L0 300 Z" fill="var(--sc-sand1)"/><path d="M0 236 Q200 214 400 240 T720 232 L720 300 L0 300 Z" fill="var(--sc-sand2)"/>`;
  const parts = SCENE_ORDER.filter(k => unlocked.has(k)).map(k => `<g class="${k === newEl ? 'new' : ''}" style="transform-origin:center">${SC[k]()}</g>`).join('');
  const hint = unlocked.size ? '' : `<text x="360" y="150" text-anchor="middle" font-family="Aref Ruqaa, Amiri, serif" font-size="26" fill="var(--ink)" opacity=".8">صحراءٌ تنتظر أول بذرة</text>`;
  return `<svg viewBox="0 0 720 300" role="img" aria-label="واحة الطفل">${base}${parts}${hint}</svg>`;
}
const SOLO_BOX = {sprout:[330,195,60], palm1:[230,100,150], palm2:[390,100,150], palm3:[176,140,110], palm4:[476,140,110], palm5:[280,50,200], spring:[322,214,100], lake:[240,220,260], grass:[310,220,130], flowers:[140,224,90], tent:[70,170,100], fire:[160,200,45], well:[536,190,55], birds:[460,40,90], camel:[580,180,80], gazelle:[30,190,70], boat:[340,230,70], flag:[100,146,50], stars:[60,10,660], moon:[612,24,60], nightingale:[260,120,36], caravan:[520,170,130], cloud:[516,46,90], hive:[526,150,70], mosque:[600,166,90], dates:[180,214,44], kite:[366,34,70], lantern:[50,178,34], tree:[122,150,60], garden:[205,216,90], saqiya:[412,176,80], market:[264,176,72], juzstars:[240,10,240], halqa:[70,224,100], minbar:[566,196,44], lamp:[590,82,40], inkwell:[218,198,44]};
function SCENE_SOLO(k){ const [x, y, w] = SOLO_BOX[k]; const s = 200 / w; return `<g transform="scale(${s}) translate(${-x} ${-y})">${k === 'moon' ? `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="var(--sc-sky1)" rx="12"/>` : ''}${SC[k]()}</g>`; }
function unlockedSet(){ return new Set(STAGES.filter(stageDone).map(s => s.el)); }

/* ---- oases & navigation ---- */
const ICON = {
  roots: `<svg viewBox="0 0 60 60"><path d="M12 50 Q30 40 48 50" fill="var(--sc-sand2)"/><path d="M28 48 Q30 30 31 16" stroke="var(--sc-trunk)" stroke-width="4" fill="none"/><path d="M31 16 q-10 -3 -15 5 M31 16 q10 -3 15 5 M31 16 q-8 -9 -14 -7 M31 16 q8 -9 14 -7 M31 16 q0 -10 -3 -13" stroke="var(--sc-leaf)" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="29" cy="22" r="2.2" fill="var(--date)"/><circle cx="33" cy="23" r="2.2" fill="var(--date)"/></svg>`,
  alghaz: `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" fill="var(--date-soft)"/><text x="30" y="41" text-anchor="middle" font-family="Aref Ruqaa, serif" font-size="32" fill="var(--date)">؟</text></svg>`,
  shir: `<svg viewBox="0 0 60 60"><path d="M14 48 Q22 20 46 10 Q40 34 20 44 Z" fill="var(--sc-leaf)"/><path d="M14 48 Q28 30 44 14" stroke="var(--paper)" stroke-width="1.5" fill="none"/><path d="M12 50 l6 -6" stroke="var(--sc-trunk)" stroke-width="3" stroke-linecap="round"/></svg>`,
  nathr: `<svg viewBox="0 0 60 60"><path d="M10 14 h18 q2 0 2 2 v32 q-2 -2 -4 -2 h-16 Z" fill="var(--paper)" stroke="var(--sc-trunk)" stroke-width="2"/><path d="M50 14 h-18 q-2 0 -2 2 v32 q2 -2 4 -2 h16 Z" fill="var(--paper)" stroke="var(--sc-trunk)" stroke-width="2"/><path d="M14 22 h10 M14 28 h10 M14 34 h8 M36 22 h10 M36 28 h10 M36 34 h8" stroke="var(--muted)" stroke-width="1.5"/></svg>`,
  hayat: `<svg viewBox="0 0 60 60"><path d="M10 30 L30 12 L50 30 V50 H10 Z" fill="var(--date-soft)" stroke="var(--date)" stroke-width="2"/><rect x="25" y="34" width="10" height="16" fill="var(--date)"/><path d="M8 30 L30 10 L52 30" stroke="var(--date)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  sahifa: `<svg viewBox="0 0 60 60"><rect x="10" y="12" width="40" height="36" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/><path d="M15 20 h30" stroke="var(--ink)" stroke-width="3"/><path d="M15 28 h14 M15 33 h14 M15 38 h14 M33 28 h12 M33 33 h12 M33 38 h12" stroke="var(--muted)" stroke-width="1.5"/></svg>`,
  hikam: `<svg viewBox="0 0 60 60"><path d="M30 10 q14 0 14 14 q0 8 -6 13 v6 h-16 v-6 q-6 -5 -6 -13 q0 -14 14 -14 Z" fill="var(--sc-sun)" stroke="var(--date)" stroke-width="2"/><rect x="23" y="44" width="14" height="6" rx="2" fill="var(--date)"/></svg>`,
  matn: `<svg viewBox="0 0 60 60"><path d="M12 46 V16 q18 -6 18 0 v30 q-18 -6 -18 0 Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/><path d="M48 46 V16 q-18 -6 -18 0 v30 q18 -6 18 0 Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/><path d="M16 24 h10 M16 30 h10 M34 24 h10 M34 30 h10" stroke="var(--muted)" stroke-width="1.5"/></svg>`,
  radio: `<svg viewBox="0 0 60 60"><rect x="8" y="22" width="44" height="28" rx="6" fill="var(--sc-trunk)"/><circle cx="22" cy="36" r="8" fill="var(--paper)"/><circle cx="22" cy="36" r="3" fill="var(--sc-trunk)"/><rect x="35" y="30" width="12" height="3" rx="1.5" fill="var(--paper)"/><rect x="35" y="37" width="12" height="3" rx="1.5" fill="var(--paper)"/><path d="M14 22 L30 8" stroke="var(--sc-trunk)" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="8" r="2.5" fill="var(--date)"/></svg>`,
  rec: `<svg viewBox="0 0 60 60"><rect x="22" y="8" width="16" height="28" rx="8" fill="var(--date)"/><path d="M16 28 q14 16 28 0" stroke="var(--ink)" stroke-width="3" fill="none"/><path d="M30 40 v10 M22 50 h16" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/></svg>`,
  workshop: `<svg viewBox="0 0 60 60"><path d="M14 44 L40 18 l6 6 L20 50 Z" fill="var(--date)"/><path d="M40 18 l4 -4 l6 6 l-4 4 Z" fill="var(--ink)"/><path d="M14 44 l-2 8 l8 -2 Z" fill="var(--ink)"/><path d="M10 12 h18" stroke="var(--muted)" stroke-width="2"/></svg>`,
  hadith: `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" fill="var(--nabi-soft)"/><text x="30" y="40" text-anchor="middle" font-family="Amiri, serif" font-size="22" fill="var(--nabi)">ﷺ</text></svg>`,
  test: `<svg viewBox="0 0 60 60"><path d="M8 44 q22 -10 44 0" stroke="var(--sc-sand2)" stroke-width="6" fill="none" stroke-linecap="round"/>${svgCamel(22, 44, .45)}${svgCamel(42, 44, .45)}</svg>`,
};
const OASES = [
 {id:'roots', name:'واحة الجذور', bl:`${ROOTS.length} نخلة من محفوظك: الجذر وعائلته وأوزانه`, games:['rl','drv','uk','fill'], tabs:[['oasis','النخيل'],['palm','النخلة'],['roles','الوزن المناسب'],['derive','⟨اشتقّ|اشتقّي⟩ الكلمة'],['unknown','الكلمة المجهولة'],['recall','آيتي'],['letter','رسالتي']]},
 {id:'alghaz', name:'الألغاز والأحاجي', bl:`${GZ.quran.length} لغزًا من القرآن، ونقاطٌ تغيّر المعنى، وجذورٌ تختبئ`, games:['gzw','gzd','gzr','gzf'], tabs:[['gzWho','من أنا؟'],['gzDots','نقطة تغيّر المعنى'],['gzRoot','جذرٌ يختبئ'],['gzFolk','ألغاز وأحاجي'],['gzPalin','من الجهتين']]},
 {id:'shir', name:'واحة الشعر', bl:`ديوان الصغار لشوقي، و${SH.abyat.length} بيتًا في الحكمة، وشعرٌ في الصحيحين`, games:['sha','shl','shp','pml'], tabs:[['shKids','ديوان الصغار'],['shAbyat','بيتٌ وحكمة'],['shSahih','في الصحيحين']]},
 {id:'nathr', name:'الحكايات والطرائف', bl:`${NT.stories.length} حكاية من كليلة ودمنة والأذكياء ونوادر جحا`, games:['nt','nto'], tabs:[['ntList','الحكايات']]},
 {id:'hayat', name:'الحياة اليومية', bl:'حوارات البيت والسوق والمدرسة، وعبارات الأدب، والألوان', games:['hys','hyo','hyc'], tabs:[['hyTalk','حوارات'],['hySay','ماذا ⟨تقول|تقولين⟩؟'],['hyOrder','⟨رتّب|رتّبي⟩ الجملة'],['hyColors','الألوان']]},
 {id:'sahifa', name:'صحيفة الواحة', bl:'⟨اقرأ|اقرئي⟩ مقالًا قصيرًا، ثم ⟨اكتب|اكتبي⟩ خبرك ⟨وانشره|وانشريه⟩ في صحيفتك', games:['sfr','sfo'], tabs:[['sfRead','⟨اقرأ|اقرئي⟩'],['sfWrite','⟨اكتب|اكتبي⟩ خبرك'],['sfMine','صحيفتي'],['sfFamily','مجلس العائلة']]},
 {id:'hikam', name:'الحكم والأمثال', bl:`${HIK.length} مثلًا: متى ⟨تقولها|تقولينها⟩؟`, games:['hk'], tabs:[['hikam','متى ⟨تقولها|تقولينها⟩؟']]},
 {id:'hadith', name:'الحديث والآثار', bl:'قول النبي ﷺ، ووصف الصحابة له، وأقوال الصحابة: لا تختلط', games:['wh'], tabs:[['hadith','الحديث والآثار']]},
 {id:'workshop', name:'ورشة الكتابة', bl:'إملاء بالذاكرة، وتصريف الأفعال كما وردت في محفوظك', games:['dct','cnj','tri','kq'], tabs:[['wsDict','إملاء بالذاكرة'],['wsConj','⟨صرّف|صرّفي⟩ الفعل'],['wsTri','بثلاث لغات'],['wsSib','أسئلة الإخوة'],['wsAsk','⟨اكتب|اكتبي⟩ سؤالًا']]},
 {id:'matn', name:'المتون', bl:'⟨سمّع|سمّعي⟩ التحفة والجزرية والحسنية ونظم الآجرومية بيتًا بيتًا، والآجرومية نثرًا', games:['mtn','ajd','ajc','irb'], tabs:[['mtRecite','⟨سمّع|سمّعي⟩'],['mtRead','⟨اقرأ|اقرئي⟩ المتن'],['mtAjr','الآجرومية']]},
 {id:'rec', name:'رفّ التسجيلات', bl:'⟨سجّل|سجّلي⟩ بصوتك، ويراجع ولي الأمر أو المعلم، ⟨وأهدِ|وأهدي⟩ المعتمدَ لإخوتك', games:['gift'], tabs:[['recShelf','تسجيلاتي'],['mushaf','مصحفي'],['relay','التتابع'],['giftShelf','هداياي']]},
 {id:'radio', name:'إذاعة الواحة', bl:'برنامج اليوم بأصوات الإخوة: قرآن وحديث وحكمة وشعر وخبر وسؤال', games:[], tabs:[['radio','برنامج اليوم']]},
 {id:'test', name:'اختبار القافلة', bl:'عشرة أسئلة بلا تلميح مما ⟨أتقنتَه|أتقنتِه⟩. النجاح يفتح البحيرة ثم القارب ثم القافلة', games:[], tabs:[['test','اختبار القافلة']], hide:true},
 {id:'kid', name:'واحتي', bl:'', games:[], tabs:[['kidHome','واحتي']], hide:true},
 {id:'trip', name:'رحلة اليوم', bl:'', games:[], tabs:[['kidTrip','رحلة اليوم']], hide:true},
 {id:'hello', name:'أهلًا', bl:'', games:[], tabs:[['kidHello','أهلًا']], hide:true},
 {id:'bag', name:'كلماتي', bl:'', games:[], tabs:[['kidBag','كلماتي']], hide:true},
 {id:'say', name:'⟨قل|قولي⟩ الجملة', bl:'', games:[], tabs:[['kidSay','⟨قل|قولي⟩ الجملة']], hide:true},
 {id:'fam', name:'تحدّي العائلة', bl:'', games:[], tabs:[['kidFam','تحدّي العائلة']], hide:true},
 {id:'msr', name:'قياس الشهر', bl:'', games:[], tabs:[['kidMs','قياس الشهر']], hide:true},
 {id:'review', name:'مراجعة اليوم', bl:'', games:[], tabs:[['rvCard','مراجعة اليوم']], hide:true},
 {id:'place', name:'تحديد المستوى', bl:'', games:[], tabs:[['plCard','تحديد المستوى']], hide:true},
 {id:'dad', name:'لوحة ولي الأمر', bl:'', games:[], tabs:[['dad','لوحة الأب']], hide:true},
];
const SECTIONS = ['home', ...OASES.flatMap(o => o.tabs.map(t => t[0]))];
const INIT = {};
let cur = {o:'home', t:'home'};
function oasisProgress(o){ const games = o.games; if (!games.length) return null; let m = 0, s = 0; games.forEach(g => { const st = gstats(g); m += st.mastered; s += st.seen; }); return {m, s}; }
/* «كنوز البيان» (الخزائن السبع) و«لمسات رمضان» صفحةٌ أخرى من التطبيق نفسه */
function kunuzGo(h){ try { voiceStop(); } catch (e) {} location.href = 'kunuz/index.html#' + h; }
function kunuzGems(){ try { const k = K(); const d = JSON.parse(localStorage.getItem('kb-kid-' + k.id) || 'null'); return d && d.prog ? Object.keys(d.prog).length : 0; } catch (e) { return 0; } }
function ramadanNow(){ try { let m = 0, dd = 0; new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {day:'numeric', month:'numeric'}).formatToParts(new Date()).forEach(p => { if (p.type === 'month') m = +p.value; if (p.type === 'day') dd = +p.value; }); return m === 9 || (m === 8 && dd >= 20); } catch (e) { return false; } }
const ICON_KUNUZ = '<svg viewBox="0 0 64 64"><rect x="15" y="15" width="34" height="34" rx="2" fill="#E0AE3A" stroke="#946709" stroke-width="2"/><rect x="15" y="15" width="34" height="34" rx="2" fill="#E0AE3A" stroke="#946709" stroke-width="2" transform="rotate(45 32 32)"/><circle cx="32" cy="32" r="7" fill="var(--paper)"/></svg>';
const ICON_RAMADAN = '<svg viewBox="0 0 64 64"><path d="M40 10a22 22 0 1 0 14 38A18 18 0 0 1 40 10z" fill="#E0AE3A"/><path d="M47 20l1.6 3.4 3.7.5-2.7 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z" fill="#E0AE3A"/></svg>';
function kunuzTiles(box){
  const n = kunuzGems();
  const a = el('button','otile', `<span class="g" aria-hidden="true">${ICON_KUNUZ}</span><span class="nm">كنوز البيان</span><span class="bl">${n ? `⟨جمعتَ|جمعتِ⟩ ${n} من جواهرها` : 'سبع خزائن من أسرار العربية والقرآن، من الخليل إلى السامرائي'}</span>`); a.type = 'button';
  a.addEventListener('click', () => kunuzGo('kunuz')); box.appendChild(a);
  const r = el('button','otile', `<span class="g" aria-hidden="true">${ICON_RAMADAN}</span><span class="nm">لمسات رمضان</span><span class="bl">ثلاثون لمسةً بيانية، لمسةٌ من كلّ جزء</span>`); r.type = 'button';
  r.addEventListener('click', () => kunuzGo('rm')); box.appendChild(r);
}
function renderHome(){
  const u = unlockedSet(); const sc = $('scene'); sc.innerHTML = sceneSvg(u, sc.dataset.new || '') + `<span class="cap">واحة ${esc(K().name)}</span><span class="cnt">${u.size} من ${STAGES.length}</span>`; sc.dataset.new = '';
  renderDaily(); if (typeof renderPlaceBox === 'function') renderPlaceBox(); const n = nextStage(); const nx = $('next');
  if (n){ const cur_ = Math.min(stageCur(n), stageNeed(n)), need = stageNeed(n);
    nx.innerHTML = `<span class="ic"><svg viewBox="0 0 200 200" aria-hidden="true">${SCENE_SOLO(n.el)}</svg></span><p class="t">الخطوة التالية: ${esc(n.name)}</p><p class="d">${esc(n.desc)}${n.test ? '' : ` — يفتح لك ${esc(STAGE_NAMES_EL[n.el])}`}</p><div class="bar2"><span class="track"><i style="width:${Math.round(100*cur_/need)}%"></i></span><span class="n">${cur_}/${need}</span></div><button class="btn go" type="button" id="nextGo">⟨اذهب|اذهبي⟩</button>`;
    $('nextGo').addEventListener('click', () => go(n.o, n.t)); nx.hidden = false; }
  else { nx.innerHTML = `<span class="ic"><svg viewBox="0 0 200 200" aria-hidden="true">${SCENE_SOLO('caravan')}</svg></span><p class="t">اكتملت واحتك!</p><p class="d">كل المراحل مفتوحة. ⟨تابع|تابعي⟩ اللعب ⟨لتُتقن|لتُتقني⟩ أكثر، أو ⟨اطلب|اطلبي⟩ من أبيك واحةً جديدة.</p>`; }
  const box = $('otiles'); box.innerHTML = ''; kunuzTiles(box);
  OASES.filter(o => !o.hide || o.id === 'test').forEach(o => { const p = oasisProgress(o); const tst = o.id === 'test'; const tn = STAGES.filter(s => s.test); const passed = tn.filter(stageDone).length; const ready = tn.find(s => !stageDone(s) && !stageLocked(s));
    const b = el('button','otile', `<span class="g" aria-hidden="true">${ICON[o.id]}</span><span class="nm">${o.name}</span><span class="bl">${tst ? (ready ? `جاهز: الاختبار ${ready.test} (⟨نجحتَ|نجحتِ⟩ في ${passed})` : passed === tn.length ? '⟨نجحتَ|نجحتِ⟩ في الاختبارات الثلاثة' : `يُفتح بعد ${tn.find(s => !stageDone(s)).after} مراحل (⟨أنجزتَ|أنجزتِ⟩ ${stagesDoneCount()})`) : (p && p.s ? `⟨أتقنتَ|أتقنتِ⟩ ${p.m} · ⟨جرّبتَ|جرّبتِ⟩ ${p.s}` : o.bl)}</span>`); b.type = 'button';
    b.addEventListener('click', () => go(o.id)); box.appendChild(b); });
  const J = $('journey'); J.innerHTML = '';
  STAGES.forEach(s => { const done = stageDone(s), locked = stageLocked(s); const cur_ = Math.min(stageCur(s), stageNeed(s)), need = stageNeed(s);
    const r = el('div','jrow' + (done ? ' done' : locked ? ' locked' : ''), `<span class="ic"><svg viewBox="0 0 200 200" aria-hidden="true">${SCENE_SOLO(s.el)}</svg></span><span><p class="t">${esc(s.name)} ← ${esc(STAGE_NAMES_EL[s.el])}</p><p class="d">${esc(s.desc)}${locked ? ` (بعد ${s.after} مراحل)` : ''}</p></span><span class="st">${done ? '✓' : `${cur_}/${need}`}</span>`);
    if (!done && !locked){ r.style.cursor = 'pointer'; r.addEventListener('click', () => go(s.o, s.t)); } J.appendChild(r); });
}
function go(o, t){
  closeSheet(); if (typeof voiceStop === 'function') voiceStop();
  if ((o === 'home' || !o) && typeof kidMode === 'function' && kidMode() && !LIB) o = 'kid';
  const O = OASES.find(x => x.id === o);
  if (!O){ cur = {o:'home', t:'home'}; }
  else { if (!t || !O.tabs.some(x => x[0] === t)) t = store.get('tab:'+o, O.tabs[0][0]); if (!O.tabs.some(x => x[0] === t)) t = O.tabs[0][0]; cur = {o, t}; store.set('tab:'+o, t); }
  for (const id of SECTIONS) $(id).hidden = id !== cur.t;
  $('where').textContent = O ? O.name : 'واحة اللسان العربي';
  const nav = $('tabs'); nav.innerHTML = ''; nav.hidden = !O || O.tabs.length < 2;
  if (O) O.tabs.forEach(([id, label]) => { const b = el('button', null, label); b.type = 'button'; b.setAttribute('role','tab'); b.dataset.t = id; b.setAttribute('aria-selected', id === cur.t); nav.appendChild(b); });
  $('seedBox').hidden = !(O && O.id === 'roots' && cur.t !== 'oasis');
  store.set('loc', cur);
  if (cur.t === 'home'){ checkStages(); renderHome(); }
  if (INIT[cur.t]) INIT[cur.t]();
  refreshScores();
  window.scrollTo({top:0});
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(cur.o, b.dataset.t); });
$('homeBtn').addEventListener('click', () => { if (typeof LIB !== 'undefined') LIB = false; go('home'); });
$('dadBtn').addEventListener('click', () => pinGate(() => { TEACHER = false; go('dad'); }));
function onKid(){ TEACHER = false; renderWho(); bankPref = null; resetGames(); renderGrove(); renderPalm(); go('home'); }
let SHEET_T = 0;
function showSheet(){ $('sheet').hidden = false; SHEET_T = performance.now(); }
function closeSheet(){ $('sheet').hidden = true; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
document.addEventListener('click', e => { const s = $('sheet'); if (!s.hidden && performance.now() - SHEET_T > 250 && !s.contains(e.target)) closeSheet(); });


/* ================= واحة الجذور ================= */
const RESETS = []; function resetGames(){ RESETS.forEach(f => f()); }
function opened(){ return store.get(`opened:${kid}:${D.rootKey}`, []); }
function drawPalm(){
  const fr = $('fronds'); const ds = $('dates'); fr.innerHTML=''; ds.innerHTML=''; const cx = 366, cy = 62;
  for (let i = 0; i < 9; i++){ const a = -Math.PI + (Math.PI * (i+0.5)/9); const x2 = cx + Math.cos(a)*300, y2 = cy + Math.sin(a)*58 + 40;
    const p = document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d', `M${cx} ${cy} Q${(cx+x2)/2} ${Math.min(cy,y2)-30} ${x2} ${y2}`); fr.appendChild(p); }
  const op = opened();
  D.family.forEach((f, i) => { const c = document.createElementNS('http://www.w3.org/2000/svg','circle'); c.setAttribute('cx', cx-50+ (i%6)*20); c.setAttribute('cy', 70 + Math.floor(i/6)*18 + (i%2)*6); c.setAttribute('r', 7); if(!op.includes(f.lemma)) c.setAttribute('opacity','.35'); ds.appendChild(c); });
}
function hl(text, word){ return text.split(' ').map(w => strip(w)===strip(word) ? `<mark>${w}</mark>` : w).join(' '); }
function ayahHtml(v){ return `<p class="q">﴿${hl(v.text, v.word)}﴾</p><p class="ref">${v.name} ${v.s}:${v.a}</p>`; }
function renderPalm(){
  $('seedRoot').textContent = D.root; $('seedText').textContent = D.seed + '.';
  $('seedN').textContent = `نخلة ${D.root}: في محفوظك ${D.total} مرة، في ${D.family.length} كلمات.`;
  drawPalm(); const box = $('fruits'); box.innerHTML=''; const op = opened();
  D.family.forEach(f => { const b = el('button','fruit', `<span class="w">${f.lemma}</span><span class="p">${f.pattern}</span><span class="c">${f.count} مرة</span>${op.includes(f.lemma) ? '<span class="done-mark">✓</span>' : ''}`); b.type='button';
    b.addEventListener('click', () => { const op = opened(); if(!op.includes(f.lemma)){ op.push(f.lemma); store.set(`opened:${kid}:${D.rootKey}`, op); drawPalm(); renderGrove(); b.insertAdjacentHTML('beforeend','<span class="done-mark">✓</span>'); checkStages(); } openSheet(f); }); box.appendChild(b); });
  const mb = $('matn'); mb.innerHTML = ''; $('matnBox').hidden = !(D.matn && D.matn.length);
  (D.matn || []).forEach(m => { const p = el('p','mq', hl(m.text, m.word) + ` <span class="ref">${m.sourceName} ${m.n}</span>`); mb.appendChild(p); });
  const add = (title, nodes) => { if (!nodes.length) return; mb.appendChild(el('p','lbl', title)).style.margin = '14px 0 6px'; nodes.forEach(n => mb.appendChild(n)); $('matnBox').hidden = false; };
  add('من الحكم والأمثال', HIK.filter(k => (k.roots||[]).includes(D.rootKey)).map(k => el('p','mq', esc(k.text))));
  add('من الحديث والآثار', HAD.items.filter(i => (i.roots||[]).includes(D.rootKey)).map(hdCard));
  add('من الشعر', SH.abyat.filter(x => (x.roots||[]).includes(D.rootKey)).map(x => el('p','mq', x.verses.map(v => `${v.a} ۞ ${v.b}`).join('<br>') + ` <span class="ref">${x.poet}</span>`)));
  rcCur = rlCur = ukCur = dvCur = flCur = null;
}
function renderGrove(){
  const g = $('grove'); g.innerHTML = '';
  ROOTS.forEach(k => { const p = ALL[k]; const op = store.get(`opened:${kid}:${k}`, []).length;
    const b = el('button','fruit tile', `<span class="w">${p.root}</span><span class="c">${p.total} مرة · ${p.family.length} كلمات</span><span class="bar"><i style="width:${Math.round(100*op/p.family.length)}%"></i></span>`); b.type='button';
    b.addEventListener('click', () => { D = p; store.set('root', k); renderPalm(); go('roots','palm'); }); g.appendChild(b); });
}
function openSheet(f){
  const s = $('sheet');
  s.innerHTML = `<div class="top"><h2>${f.lemma}</h2><button class="x" aria-label="إغلاق">✕</button></div>
   <div class="row"><span class="chip">${f.pattern}</span><span>${f.role}</span></div>
   <div><p class="lbl" style="margin:0">المعنى <span class="draft">(مسودة)</span></p><p style="margin:0;font-size:1.25rem">${f.meaning}</p></div>
   <div><p class="lbl" style="margin:0 0 6px">من محفوظك · ${f.count} مرة</p>${f.verses.map(v => ayahHtml(v) + `<div class="btns" style="justify-content:flex-start"><button class="btn ghost sm recb" type="button" data-ref="${v.name} ${v.s}:${v.a}" data-text="${esc(v.text)}">🎙 ⟨سجّل|سجّلي⟩ الآية</button></div>`).join('')}</div>
   <div><p class="lbl" style="margin:0">في يومنا <span class="draft">(مسودة)</span></p><p class="sent">${f.sentence}</p></div>
   <div id="triBlock"></div>`;
  showSheet(); s.querySelector('.x').focus(); s.querySelector('.x').addEventListener('click', closeSheet); renderTriBlock(s.querySelector('#triBlock'), D.rootKey, f.lemma);
  s.querySelectorAll('.recb').forEach(bt => bt.addEventListener('click', e => { e.stopPropagation(); recordFrom('آية', bt.dataset.ref, bt.dataset.text); }));
}

/* الوزن المناسب */
let rlCur = null;
const rlId = r => `${D.rootKey}|${r.q}`;
function rlNext(){ rlCur = pickW('rl', D.roles, rlId, rlCur && rlId(rlCur)); $('rlQ').textContent = `${D.root}: ${rlCur.q}`; $('rlFb').textContent=''; $('rlFb').className='fb'; $('rlWhy').hidden = true;
  mcq($('rlOpts'), rlCur.opts, rlCur.a, ok => {
    const same = (x,y) => strip(x)===strip(y); const f = D.family.find(z => same(z.lemma, rlCur.a)) || D.unknown.find(z => same(z.lemma, rlCur.a));
    feedback('rlFb', ok, 'أصبت.', `الجواب: ${rlCur.a}`);
    $('rlWhy').innerHTML = f ? `<p><b>${f.lemma}</b> على وزن <b>${f.pattern}</b>${f.role?' = '+f.role:''}: ${f.meaning}.</p>` : `<p><b>${rlCur.a}</b>: ${rlCur.q.replace('؟','')}.</p>`; $('rlWhy').hidden = false; award('rl', rlId(rlCur), ok); }); }
$('rlNext').addEventListener('click', rlNext);
INIT.roles = () => { if (!rlCur) rlNext(); };

/* اشتقّ الكلمة */
let dvCur = null;
const dvItems = () => D.family.filter(f => f.pattern);
const dvId = f => `${D.rootKey}|${f.lemma}`;
const IMPF = {'تَفَعَّلَ':'يَتَفَعَّلُ', 'تَفاعَلَ':'يَتَفاعَلُ', 'فَعِلَ':'يَفْعَلُ', 'فَعَلَ':'يَفْعُلُ'};
const dvPattern = f => f.lemma.startsWith('يَ') && IMPF[f.pattern] ? IMPF[f.pattern] : f.pattern;
function dvNext(){ dvCur = pickW('drv', dvItems(), dvId, dvCur && dvId(dvCur)); $('dvQ').innerHTML = `جذر <b>${D.root}</b> على وزن <b>${esc(dvPattern(dvCur))}</b>`; $('dvRole').textContent = dvCur.role ? `(${dvCur.role})` : ''; $('dvFb').textContent=''; $('dvFb').className='fb'; $('dvWhy').hidden = true;
  typeBox($('dvBox'), dvCur.lemma, {id:'dvIn', onDone: (st) => { feedback('dvFb', st, `أصبت: ${dvCur.lemma}`, `الكلمة: ${dvCur.lemma}`, `قريب! الكلمة: ${dvCur.lemma} (${NEAR_WHY($('dvIn').value, dvCur.lemma)})`);
    $('dvWhy').innerHTML = `<p><b>${dvCur.lemma}</b>: ${esc(dvCur.meaning)}.</p>` + (dvCur.verses[0] ? verseHtml(dvCur.verses[0]) : ''); $('dvWhy').hidden = false; award('drv', dvId(dvCur), st === 'ok' ? true : st === 'near' ? null : false); }}); }
$('dvNext').addEventListener('click', dvNext);
INIT.derive = () => { if (!dvCur) dvNext(); };

/* الكلمة المجهولة */
let ukCur = null;
const ukId = u => `${D.rootKey}|${u.lemma}`;
function ukNext(){ if (!D.unknown.length){ ukCur = null; $('ukWord').textContent = '—'; $('ukAyah').innerHTML = '<p class="note">كل كلمات هذا الجذر في القرآن ⟨تحفظها|تحفظينها⟩؛ لا كلمة مجهولة هنا. ⟨اختر|اختاري⟩ نخلة أخرى.</p>'; $('ukOpts').innerHTML = ''; $('ukFb').textContent = ''; $('ukWhy').hidden = true; return; } ukCur = pickW('uk', D.unknown, ukId, ukCur && ukId(ukCur)); $('ukWord').textContent = ukCur.verse.word; $('ukAyah').innerHTML = ayahHtml(ukCur.verse);
  $('ukFb').textContent=''; $('ukFb').className='fb'; $('ukWhy').hidden = true;
  mcq($('ukOpts'), ukCur.options, ukCur.options[ukCur.answer], ok => { feedback('ukFb', ok, '⟨خمّنتَ|خمّنتِ⟩ صحيحًا.', 'ليس هذا.');
    $('ukWhy').innerHTML = `<p><b>${ukCur.lemma}</b> على وزن <b>${ukCur.pattern}</b>: ${ukCur.meaning}.</p>`; $('ukWhy').hidden=false; award('uk', ukId(ukCur), ok); }, 'm'); }
$('ukNext').addEventListener('click', ukNext);
INIT.unknown = () => { if (!ukCur) ukNext(); };

/* آيتي: اكتب الكلمة الناقصة / اتلُ */
let rcMode = 'fill', rcCur = null, flCur = null;
const flItems = () => D.family.flatMap(f => f.verses.map(v => ({f, v})));
const flId = x => `${D.rootKey}|${x.v.s}:${x.v.a}|${strip(x.v.word)}`;
function flNext(){ flCur = pickW('fill', flItems(), flId, flCur && flId(flCur)); $('flAyah').innerHTML = blankHtml(flCur.v); $('flFb').textContent=''; $('flFb').className='fb'; $('flWhy').hidden = true;
  typeBox($('flBox'), flCur.v.word, {id:'flIn', placeholder:'الكلمة الناقصة', onDone: (st) => { feedback('flFb', st, 'أصبت.', `الكلمة: ${flCur.v.word}`, `قريب! الكلمة: ${flCur.v.word} (${NEAR_WHY($('flIn').value, flCur.v.word)})`);
    $('flWhy').innerHTML = verseHtml(flCur.v, '') + `<p><b>${flCur.f.lemma}</b> على وزن <b>${flCur.f.pattern}</b>: ${esc(flCur.f.meaning)}.</p>`; $('flWhy').hidden = false; award('fill', flId(flCur), st === 'ok' ? true : st === 'near' ? null : false); }}); }
$('flNext').addEventListener('click', flNext);
function rcNext(){ rcCur = pick(flItems(), rcCur); $('rcWord').textContent = rcCur.v.word; $('rcAyah').hidden = true; $('rcAyah').innerHTML='';
  $('rcBtns').innerHTML = '<button class="btn" id="rcShow">⟨اعرض|اعرضي⟩ الآية</button>'; $('rcShow').addEventListener('click', rcShow); }
function rcShow(){ $('rcAyah').innerHTML = ayahHtml(rcCur.v); $('rcAyah').hidden = false;
  $('rcBtns').innerHTML = '<button class="btn" id="y">تلوتُها صحيحة</button><button class="btn warm" id="n">لم أتذكرها</button>';
  $('y').addEventListener('click', () => { award('rc', flId(rcCur), true); rcNext(); }); $('n').addEventListener('click', () => { award('rc', flId(rcCur), false); rcNext(); }); }
$('rcMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; rcMode = b.dataset.m; for (const x of $('rcMode').children) x.setAttribute('aria-pressed', x === b); $('fillCard').hidden = rcMode !== 'fill'; $('rcCard').hidden = rcMode !== 'recite'; INIT.recall(); });
INIT.recall = () => { if (rcMode === 'fill' && !flCur) flNext(); if (rcMode === 'recite' && !rcCur) rcNext(); };

/* رسالتي */
const stems = () => D.family.map(f => ({lemma:f.lemma, key: strip(f.lemma).replace(/^ال/,'')}));
function checkLetter(){ const t = strip($('ltText').value); const S = stems();
  const box = $('ltUsed'); box.innerHTML = ''; S.forEach(s => { const sp = el('span', t.includes(s.key) ? 'on' : null); sp.textContent = s.lemma; box.appendChild(sp); });
  const n = S.filter(s => t.includes(s.key)).length; const sentences = $('ltText').value.split(/[.!؟\n]+/).filter(x => x.trim()).length;
  $('ltFb').textContent = n >= 2 && sentences >= 3 ? 'رسالة مكتملة.' : `كلمات النخلة: ${n} من 2 · جمل: ${sentences} من 3`; $('ltFb').className = 'fb ' + (n>=2&&sentences>=3?'ok':''); }
$('ltText').addEventListener('input', () => { store.set(`letter:${kid}:${D.rootKey}`, $('ltText').value); checkLetter(); });
function queueAdd(entry){ const q = store.get(`queue:${kid}`, []); q.unshift({id: Date.now().toString(36), date: new Date().toLocaleDateString('ar', {day:'numeric', month:'long'}), reviewed:false, ...entry}); store.set(`queue:${kid}`, q.slice(0, 60)); return q[0]; }
$('ltSend').addEventListener('click', () => { const t = $('ltText').value.trim(); if (!t){ $('ltFb').textContent = '⟨اكتب|اكتبي⟩ رسالتك أولًا.'; $('ltFb').className = 'fb bad'; return; } queueAdd({kind:'رسالة', title:`رسالة من نخلة ${D.root}`, text:t}); $('ltFb').textContent = 'وصلت رسالتك إلى لوحة الأب.'; $('ltFb').className = 'fb ok'; });
$('ltAi').addEventListener('click', () => aiFeedback($('ltAi'), $('ltAiOut'), 'رسالة قصيرة عن ⟨يومه|يومها⟩', $('ltText').value, `طُلب ⟨منه|منها⟩ أن ⟨يستعمل|تستعمل⟩ كلمتين على الأقل من عائلة الجذر «${D.root}»: ${D.family.map(f => f.lemma).join('، ')}.`, `رسالة من نخلة ${D.root}`));
RESETS.push(() => { rlCur = dvCur = ukCur = rcCur = flCur = null; });


/* ================= الألغاز ================= */
function modeChips(boxId, key, onChange){ const box = $(boxId); const saved = store.get(`mode:${kid}:${key}`, tier() === 'big' ? 'type' : 'mcq'); for (const b of box.querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.m === saved);
  box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; store.set(`mode:${kid}:${key}`, b.dataset.m); for (const x of box.querySelectorAll('button')) x.setAttribute('aria-pressed', x === b); onChange(b.dataset.m); }); return () => store.get(`mode:${kid}:${key}`, tier() === 'big' ? 'type' : 'mcq'); }

/* من أنا؟ */
let gwCur = null, gwShown = 1, gwDone = false, gwAt = 1;
const gwMode = modeChips('gwMode', 'gzw', () => gwNext());
const gwClues = () => gwCur.clues.map(t => ({t})).concat(gwCur.blank ? [{v: gwCur.blank}] : []);
function gwRender(){
  const L = $('gwClues'); L.innerHTML = '';
  gwClues().slice(0, gwShown).forEach(c => { const li = el('li', c.v ? 'ay' : null); li.innerHTML = c.v ? `﴿${esc(c.v.text)}﴾ <span class="ref">${c.v.name} ${c.v.s}:${c.v.a}</span>` : esc(c.t); L.appendChild(li); });
  $('gwMore').disabled = gwDone || gwShown >= gwClues().length; $('gwCount').textContent = `تلميح ${gwShown} من ${gwClues().length}`;
}
function gwDoneFn(st){ gwDone = true; gwAt = gwShown; gwShown = gwClues().length; gwRender();
  feedback('gwFb', st, `أصبت! ⟨عرفتَه|عرفتِه⟩ بعد ${gwAt} ${gwAt === 1 ? 'تلميح' : 'تلميحات'}.`, `الجواب: ${gwCur.answer}`, `قريب! الجواب: ${gwCur.answer}`);
  const w = $('gwWhy'); w.innerHTML = `<p class="lbl">الدليل من محفوظك</p>` + gwCur.proofs.map(v => verseHtml(v)).join('') + (gwCur.tafsir ? `<p class="note">${esc(gwCur.tafsir)}</p>` : '') + '<p class="draft">التلميحات مسودة؛ الآيات من المصحف.</p>';
  w.hidden = false; award('gzw', gwCur.id, st === 'ok' || st === true ? true : st === 'near' ? null : false); }
function gwNext(){ gwCur = pickW('gzw', GZ.quran, x => x.id, gwCur && gwCur.id); gwShown = 1; gwDone = false; $('gwTheme').textContent = gwCur.theme; $('gwFb').textContent=''; $('gwFb').className='fb'; $('gwWhy').hidden = true; gwRender();
  const m = gwMode(); $('gwOpts').innerHTML = ''; $('gwBox').innerHTML = '';
  if (m === 'type') typeBox($('gwBox'), gwCur.answer, {id:'gwIn', placeholder:'من أنا؟', noFocus:true, onDone: gwDoneFn});
  else mcq($('gwOpts'), gwCur.options, gwCur.answer, ok => gwDoneFn(ok)); }
$('gwMore').addEventListener('click', () => { gwShown = Math.min(gwShown + 1, gwClues().length); gwRender(); });
$('gwNext').addEventListener('click', gwNext);
INIT.gzWho = () => { if (!gwCur) gwNext(); };

/* نقطة تغيّر المعنى */
let gdCur = null, gdT = null;
const gdMode = modeChips('gdMode', 'gzd', () => gdNext());
const gdId = () => `${gdCur.id}|${gdT.word}`;
function gdNext(){ const items = GZ.dots.flatMap(g => g.words.map(w => ({g, w}))); const it = pickW('gzd', items, x => `${x.g.id}|${x.w.word}`, gdCur && gdId()); gdCur = it.g; gdT = it.w;
  $('gdRasm').textContent = gdCur.rasm; $('gdAsk').textContent = `أيّ كلمةٍ معناها: «${gdT.meaning}»؟`; $('gdFb').textContent=''; $('gdFb').className='fb'; $('gdWhy').hidden = true; $('gdOpts').innerHTML = ''; $('gdBox').innerHTML = '';
  const done = st => { feedback('gdFb', st, '⟨وضعتَ|وضعتِ⟩ النقاط في مكانها!', `الجواب: ${gdT.word}`, `قريب! الجواب: ${gdT.word} (${NEAR_WHY($('gdIn') ? $('gdIn').value : '', gdT.word)})`);
    const w = $('gdWhy'); w.innerHTML = gdCur.words.map(x => `<p><b style="font-family:var(--f-q);font-size:1.3rem">${x.word}</b>: ${esc(x.meaning)}</p>` + (x.verse ? verseHtml(x.verse) : '<p class="note">(ليست في محفوظك بعد)</p>')).join('');
    w.hidden = false; award('gzd', gdId(), st === 'ok' || st === true ? true : st === 'near' ? null : false); };
  if (gdMode() === 'type') typeBox($('gdBox'), gdT.word, {id:'gdIn', placeholder:'⟨اكتب|اكتبي⟩ الكلمة بنقاطها', noFocus:true, onDone: done});
  else { $('gdOpts').className = 'opts' + (gdCur.words.length === 3 ? ' one' : ''); mcq($('gdOpts'), gdCur.words.map(w => w.word), gdT.word, done); } }
$('gdNext').addEventListener('click', gdNext);
INIT.gzDots = () => { if (!gdCur) gdNext(); };

/* جذرٌ يختبئ */
let grCur = null;
function grNext(){
  const items = ROOTS.flatMap(k => [{k, kind:'who'}, {k, kind:'odd'}]); grCur = pickW('gzr', items, x => `${x.kind}|${x.k}`, grCur && `${grCur.kind}|${grCur.k}`);
  const k = grCur.k, P = ALL[k]; const fam = shuffle(P.family.map(f => f.lemma)); const others = shuffle(ROOTS.filter(x => x !== k));
  $('grFb').textContent=''; $('grFb').className='fb'; $('grWhy').hidden = true; $('grOpts').className = 'opts';
  if (grCur.kind === 'who' && fam.length >= 3){ const three = fam.slice(0,3);
    $('grQ').textContent = `أنا جذرٌ، ومن أولادي: «${three.join('»، «')}». من أنا؟`;
    mcq($('grOpts'), [P.root, ...others.slice(0,3).map(x => ALL[x].root)], P.root, ok => { feedback('grFb', ok, '⟨وجدتَ|وجدتِ⟩ الجذر!', `الجذر: ${P.root}`);
      $('grWhy').innerHTML = `<p>عائلة <b>${P.root}</b>: ${P.family.map(f => f.lemma).join('، ')}.</p>`; $('grWhy').hidden = false; award('gzr', `who|${k}`, ok); });
  } else { const o = ALL[others[0]]; const odd = pick(o.family.filter(f => !fam.includes(f.lemma))).lemma;
    $('grQ').textContent = `أيّ هذه الكلمات ليست من عائلة الجذر «${P.root}»؟`;
    mcq($('grOpts'), [...fam.slice(0,3), odd], odd, ok => { feedback('grFb', ok, 'أصبت! هي غريبة عن العائلة.', `الغريبة: ${odd}`);
      $('grWhy').innerHTML = `<p><b>${odd}</b> من جذر <b>${o.root}</b>، والباقي من <b>${P.root}</b>.</p>`; $('grWhy').hidden = false; award('gzr', `odd|${k}`, ok); }); } }
$('grNext').addEventListener('click', grNext);
INIT.gzRoot = () => { if (!grCur) grNext(); };

/* ألغاز وأحاجي */
const GF = [...GZ.folk.map(x => ({...x, kind:'لغز'})), ...GZ.letter.map(x => ({...x, kind:'أحجية حروف'}))];
let gfCur = null;
function gfNext(){ gfCur = pickW('gzf', GF, x => x.id, gfCur && gfCur.id); $('gfKind').textContent = gfCur.kind; $('gfQ').textContent = gfCur.q; $('gfFb').textContent=''; $('gfFb').className='fb'; $('gfWhy').hidden = true;
  mcq($('gfOpts'), gfCur.options, gfCur.answer, ok => { feedback('gfFb', ok, 'أصبت!', `الجواب: ${gfCur.answer}`);
    const w = $('gfWhy'); w.innerHTML = gfCur.verse ? `<p class="lbl">وفي محفوظك</p>${verseHtml(gfCur.verse)}` : `<p>الجواب: <b>${esc(gfCur.answer)}</b></p>`; w.hidden = false; award('gzf', gfCur.id, ok); }, 'm'); }
$('gfNext').addEventListener('click', gfNext);
INIT.gzFolk = () => { if (!gfCur) gfNext(); };

/* من الجهتين */
function renderPalin(){ const L = $('gpList'); if (L.childElementCount) return;
  GZ.palin.forEach(x => { const c = el('div','card'); const letters = x.letters.split(' ');
    c.innerHTML = `<div class="row" style="justify-content:space-between"><span class="chip">${x.kind}</span>${x.verse ? `<span class="ref">${x.verse.name} ${x.verse.s}:${x.verse.a}</span>` : ''}</div>
      <p class="big" style="font-size:2.2rem">${esc(x.text)}</p><div class="letters" data-dir="f">${letters.map(l => `<span>${l}</span>`).join('')}</div>
      <p class="note">${esc(x.explain)}${x.source ? ' · ' + esc(x.source) : ''}</p>`;
    const bt = el('button','btn ghost','⟨اقلبها|اقلبيها⟩'); bt.type='button'; const row = el('div','btns'); row.appendChild(bt); c.appendChild(row);
    bt.addEventListener('click', () => { const box = c.querySelector('.letters'); const rev = box.dataset.dir === 'f'; box.dataset.dir = rev ? 'r' : 'f';
      box.innerHTML = (rev ? letters.slice().reverse() : letters).map(l => `<span>${l}</span>`).join(''); bt.textContent = rev ? 'هي هي! ⟨أعدها|أعيديها⟩' : '⟨اقلبها|اقلبيها⟩'; });
    L.appendChild(c); }); }
INIT.gzPalin = renderPalin;

/* ================= الشعر ================= */
let poemHide = 0, poemCur = null, pmTest = null;
function poemDone(q){ return q.lines.filter(l => mastered('pml', `${q.id}|${l.i}`)).length; }
function renderKidsPoems(){ const L = $('skList'); L.innerHTML = ''; SH.qasaid.forEach(q => { const d = poemDone(q); const b = el('button','item', `<span class="w">${q.title}</span><span class="c">${q.poet} · من ${q.age} سنوات · ${q.lines.length} أبيات${d ? ` · ⟨سمّعتَ|سمّعتِ⟩ ${d}` : ''}</span>${d >= Math.min(5, q.lines.length) ? '<span class="done-mark">✓</span>' : ''}`); b.type='button'; b.addEventListener('click', () => openPoem(q)); L.appendChild(b); });
  if (!poemCur) { $('skRead').hidden = true; L.hidden = false; } }
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };
function hemi(t, li, hi){ return t.split(' ').map((w, wi) => poemHide && strip(w).length > 1 && (hash(w + li + hi + wi) % 4) < poemHide ? `<span class="gap" tabindex="0">${w}</span>` : w).join(' '); }
function poemLines(lines){ return lines.map((ln, li) => { const p = ln.split('۞').map(s => s.trim()); return `<div class="bt${p.length < 2 ? ' one' : ''}">${p.map((h, hi) => `<span>${hemi(h, li, hi)}</span>`).join('')}</div>`; }).join(''); }
function openPoem(q){ poemCur = q; poemHide = 0; pmTest = null; $('skList').hidden = true; $('skRead').hidden = false; drawPoem(); window.scrollTo({top:0}); }
const lastWord = t => { const ws = t.replace(/[،.!؟:]/g, '').trim().split(/\s+/); return ws[ws.length - 1]; };
function drawPoem(){
  const q = poemCur, R = $('skRead');
  R.innerHTML = `<div class="row" style="justify-content:space-between"><button class="back" type="button" id="pmBack">→ القصائد</button><span class="chip">من ${q.age} سنوات</span></div>
   <h2 class="big" style="font-size:2.3rem">${q.title}</h2><p class="ref" style="text-align:center;margin:0">${q.poet} · ${q.poetAbout}</p>
   <div class="poem${q.lines.length > 9 ? ' long' : ''}">${poemLines(q.lines.map(l => l.text))}</div>
   <div class="btns"><button class="btn ghost" id="pmRec">🎙 ⟨سجّل|سجّلي⟩ القصيدة</button><button class="btn warm" id="pmHide">${['⟨احفظها|احفظيها⟩: ⟨أخفِ|أخفي⟩ بعض الكلمات','⟨أخفِ|أخفي⟩ أكثر','⟨أخفِ|أخفي⟩ أكثر','⟨أخفِ|أخفي⟩ الكل تقريبًا','⟨أظهر|أظهري⟩ كل الكلمات'][poemHide]}</button><button class="btn" id="pmTest">⟨سمّعني|سمّعيني⟩</button></div>
   <p class="note" style="text-align:center">${poemHide ? '⟨اضغط|اضغطي⟩ الفراغ ⟨لترى|لتري⟩ الكلمة.' : '⟨اقرأها|اقرئيها⟩ مرات، ثم ⟨أخفِ|أخفي⟩ الكلمات، ثم «⟨سمّعني|سمّعيني⟩»: ⟨تكتب|تكتبين⟩ آخر كلمة في كل بيت.'}</p>
   <div id="pmBox"></div>
   <details><summary class="lbl">الحكاية بالنثر <span class="draft">(مسودة)</span></summary><p class="prose" style="font-size:1.15rem">${esc(q.story)}</p></details>
   <div class="gloss">${Object.entries(q.gloss).map(([k, v]) => `<span><b>${k}</b>: ${esc(v)}</span>`).join('')}</div>
   <p><b>المغزى:</b> ${esc(q.lesson)}</p>
   <p class="note">التشكيل مسودة. الحروف مطابقة للشوقيات في: ${[...new Set(q.lines.flatMap(l => l.editions))].join('، ')}.</p>`;
  addLink(R, q.link, 'ومن الحديث');
  $('pmBack').addEventListener('click', () => { poemCur = null; renderKidsPoems(); });
  $('pmHide').addEventListener('click', () => { poemHide = (poemHide + 1) % 5; drawPoem(); });
  $('pmTest').addEventListener('click', pmNext);
  $('pmRec').addEventListener('click', () => recordFrom('قصيدة', `${q.title} — ${q.poet}`, q.lines.map(l => l.text).join(' / ')));
  R.querySelectorAll('.gap').forEach(g => { const open = () => g.classList.add('open'); g.addEventListener('click', open); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); }); });
}
function pmNext(){
  const q = poemCur; const items = q.lines.map((l, i) => ({...l, i})); const it = pickW('pml', items, x => `${q.id}|${x.i}`, pmTest && `${q.id}|${pmTest.i}`); pmTest = it;
  const parts = it.text.split('۞').map(s => s.trim()); const last = lastWord(parts[parts.length - 1]); const shown = parts.map((p, i) => i === parts.length - 1 ? p.replace(/\S+\s*$/, '……') : p).join(' ۞ ');
  const B = $('pmBox'); B.innerHTML = `<div class="card" style="background:var(--bg)"><p class="lbl" style="margin:0">⟨سمّع|سمّعي⟩: ⟨اكتب|اكتبي⟩ الكلمة الأخيرة</p><p class="q s" style="text-align:center;background:var(--paper)">${esc(shown)}</p><div id="pmIn"></div><p class="fb" id="pmFb"></p><div class="btns"><button class="btn ghost" id="pmAgain">بيتٌ آخر</button></div><div class="score" data-g="pml"></div></div>`;
  typeBox(B.querySelector('#pmIn'), last, {id:'pmInp', placeholder:'الكلمة الأخيرة', onDone: st => { feedback(B.querySelector('#pmFb'), st, 'أصبت.', `الكلمة: ${last}`, `قريب! الكلمة: ${last}`); award('pml', `${q.id}|${it.i}`, st === 'ok' ? true : st === 'near' ? null : false); }});
  B.querySelector('#pmAgain').addEventListener('click', pmNext); refreshScores(); B.scrollIntoView({behavior: REDUCED ? 'auto' : 'smooth', block:'center'});
}
INIT.shKids = renderKidsPoems;

/* بيتٌ وحكمة */
let saMode = 'complete', saCur = null;
const SAG = {complete:'sha', last:'shl', poet:'shp'};
function saNext(){
  saCur = pickW(SAG[saMode], SH.abyat, x => x.id, saCur && saCur.id); const v = saCur.verses[0]; $('saFb').textContent=''; $('saFb').className='fb'; $('saWhy').hidden = true; $('saOpts').innerHTML = ''; $('saBox').innerHTML = '';
  $('saScore').dataset.g = SAG[saMode]; $('saStage').dataset.g = SAG[saMode] === 'shl' ? 'sha' : SAG[saMode]; refreshScores();
  if (saMode === 'complete'){
    $('saLbl').textContent = '⟨أكمل|أكملي⟩ البيت'; $('saQ').innerHTML = `<p class="q" style="text-align:center">${v.a} ۞ ……</p>`;
    const same = shuffle(SH.abyat.filter(x => x !== saCur && x.rhyme === saCur.rhyme)).map(x => x.verses[0].b); const rest = shuffle(SH.abyat.filter(x => x !== saCur && x.rhyme !== saCur.rhyme)).map(x => x.verses[0].b);
    mcq($('saOpts'), [v.b, ...[...same, ...rest].slice(0,3)], v.b, ok => saDone(ok), 'v');
  } else if (saMode === 'last'){
    const last = lastWord(v.b); $('saLbl').textContent = '⟨اكتب|اكتبي⟩ آخر كلمة في البيت'; $('saQ').innerHTML = `<p class="q" style="text-align:center">${v.a} ۞ ${esc(v.b.replace(/\S+\s*$/, '……'))}</p>`;
    typeBox($('saBox'), last, {id:'saIn', placeholder:'الكلمة الأخيرة', noFocus:true, onDone: st => saDone(st, last)});
  } else {
    $('saLbl').textContent = 'من الشاعر؟'; $('saQ').innerHTML = `<p class="q" style="text-align:center">${v.a} ۞ ${v.b}</p>`;
    const poets = shuffle([...new Set(SH.abyat.map(x => x.poet).filter(p => p !== saCur.poet))]).slice(0,3);
    mcq($('saOpts'), [saCur.poet, ...poets], saCur.poet, ok => saDone(ok), 'm');
  }
}
function saDone(st, last){ const g = SAG[saMode]; feedback('saFb', st, 'أصبت!', saMode === 'poet' ? `الشاعر: ${saCur.poet}` : saMode === 'last' ? `الكلمة: ${last}` : 'هذا هو الشطر الصحيح.', `قريب! الكلمة: ${last}`);
  const w = $('saWhy'); w.innerHTML = `<p class="prose" style="font-size:1.2rem">${saCur.verses.map(v => `${v.a} ۞ ${v.b}`).join('<br>')}</p><p class="ref">${saCur.poet} · ${saCur.poetAbout}</p><p><b>المعنى:</b> ${esc(saCur.meaning)} <span class="draft">(مسودة)</span></p><div class="gloss">${Object.entries(saCur.gloss).map(([k, v]) => `<span><b>${k}</b>: ${esc(v)}</span>`).join('')}</div>`;
  addLink(w, saCur.link); w.hidden = false; award(g, saCur.id, st === 'ok' || st === true ? true : st === 'near' ? null : false); }
$('saNext').addEventListener('click', saNext);
$('saMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; saMode = b.dataset.m; for (const x of $('saMode').children) x.setAttribute('aria-pressed', x === b); saNext(); });
function renderAbyatList(){ const L = $('saList'); if (L.childElementCount) return;
  SH.abyat.forEach(x => { const d = el('details','hk'); d.innerHTML = `<summary>${x.verses.map(v => `${v.a} ۞ ${v.b}`).join('<br>')} <span class="ref">${x.poet}</span></summary><p>${esc(x.meaning)}</p><p class="ref">تُقال: ${esc(x.when)}</p><p class="ref">مطابق لـ: ${[...new Set(x.verses.flatMap(v => v.editions))].join('، ')}</p>`; L.appendChild(d); }); }
INIT.shAbyat = () => { if (!saCur) saNext(); renderAbyatList(); };

/* في الصحيحين */
const SWHO = { nabi: () => 'قال النبي ﷺ', tamaththul: s => s.speaker, sahabi: s => 'قال ' + s.speaker, shair: s => s.speaker };
function sahihCard(s){ const d = el('div','hd ' + s.cat);
  d.innerHTML = `<span class="who">${SWHO[s.cat](s)}</span>${s.note ? `<p class="ctx">${esc(s.note)}</p>` : ''}<p class="fx">«${s.focus}»</p><p style="margin:0">${esc(s.meaning)} <span class="draft">(مسودة)</span></p><span class="ref">${s.bookName} ${s.ref}</span><details><summary>النص كاملًا بإسناده</summary><p>${s.fullText}</p></details>`;
  return d; }
function renderSahih(){ const L = $('ssList'); if (L.childElementCount) return; SH.sahih.forEach(s => L.appendChild(sahihCard(s))); }
INIT.shSahih = renderSahih;

/* links between oases */
function linkNode(id){
  if (!id) return null;
  const h = HAD.items.find(x => x.id === id); if (h) return hdCard(h);
  const b = SH.abyat.find(x => x.id === id); if (b) { const d = el('div','why'); d.innerHTML = `<p class="lbl">من الشعر · ${b.poet}</p><p class="prose" style="font-size:1.2rem">${b.verses.map(v => `${v.a} ۞ ${v.b}`).join('<br>')}</p>`; return d; }
  const q = SH.qasaid.find(x => x.id === id); if (q) { const d = el('div','why'); d.innerHTML = `<p>ومثلُها في الشعر: قصيدة «${q.title}» لشوقي.</p>`; const bt = el('button','btn ghost','⟨اقرأ|اقرئي⟩ القصيدة'); bt.type='button'; bt.addEventListener('click', () => { go('shir','shKids'); openPoem(q); }); d.appendChild(bt); return d; }
  const s = SH.sahih.find(x => x.id === id); if (s) return sahihCard(s);
  return null;
}
function addLink(box, id, title){ const n = linkNode(id); if (!n) return; const w = el('div', null); w.style.cssText = 'display:flex;flex-direction:column;gap:6px'; w.appendChild(el('p','lbl', title || 'ويرتبط بها')); w.appendChild(n); box.appendChild(w); }
RESETS.push(() => { gwCur = gdCur = grCur = gfCur = saCur = null; poemCur = null; pmTest = null; });


/* ================= الحكايات ================= */
let ntBook = 'all', ntCur = null;
const splitSent = t => t.split(/(?<=[.!؟])\s+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 2);
function storyDone(s){ return s.questions.every((q, i) => mastered('nt', `${s.id}|${i}`)); }
function renderStories(){
  const C = $('ntChips'); if (!C.childElementCount){ [['all','الكل'], ...[...new Set(NT.stories.map(s => s.book))].map(b => [b, b])].forEach(([k, l]) => { const b = el('button','chip2', l); b.type='button'; b.dataset.b = k; b.setAttribute('aria-pressed', k === ntBook); C.appendChild(b); });
    C.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; ntBook = b.dataset.b; for (const x of C.children) x.setAttribute('aria-pressed', x === b); ntCur = null; renderStories(); }); }
  const L = $('ntItems'); L.innerHTML = '';
  NT.stories.filter(s => ntBook === 'all' || s.book === ntBook).forEach(s => { const b = el('button','item', `<span class="w">${s.title}</span><span class="c">${s.kind} · ${s.book}</span>${storyDone(s) ? '<span class="done-mark">✓</span>' : ''}`); b.type='button'; b.addEventListener('click', () => openStory(s)); L.appendChild(b); });
  if (!ntCur){ $('ntRead').hidden = true; L.hidden = false; C.hidden = false; }
}
function orderGame(box, sentences, g, id, onDone){
  const items = sentences.map((t, i) => ({t, i})); let picked = []; let bank; do { bank = shuffle(items); } while (items.length > 1 && bank.every((b, k) => b.i === k));
  box.innerHTML = `<div class="tray ans col" aria-label="ترتيبك"></div><div class="tray col" aria-label="الجمل"></div><div class="btns"><button class="btn ghost sm" type="button">⟨ابدأ|ابدئي⟩ من جديد</button></div><p class="fb"></p>`;
  const A = box.children[0], B = box.children[1], reset = box.querySelector('button'), F = box.querySelector('.fb'); let done = false;
  const draw = () => { A.innerHTML = ''; B.innerHTML = '';
    picked.forEach((p, k) => { const t = el('button','tok s', `<span class="chip" style="margin-left:6px">${k + 1}</span>${esc(p.t)}`); t.type='button'; t.disabled = done; t.addEventListener('click', () => { picked.splice(k, 1); draw(); }); A.appendChild(t); });
    bank.filter(p => !picked.includes(p)).forEach(p => { const t = el('button','tok s', esc(p.t)); t.type='button'; t.addEventListener('click', () => { picked.push(p); draw(); if (picked.length === items.length){ done = true; const ok = picked.every((q, k) => q.i === k); F.textContent = ok ? '⟨رتّبتَها|رتّبتِها⟩ كما حدثت!' : 'ليس هذا الترتيب. الترتيب الصحيح ظهر الآن.'; F.className = 'fb ' + (ok ? 'ok' : 'bad'); if (!ok){ picked = items.slice(); } award(g, id, ok); draw(); if (onDone) onDone(ok); } }); B.appendChild(t); }); };
  reset.addEventListener('click', () => { picked = []; done = false; F.textContent = ''; draw(); }); draw();
}
function openStory(s){
  ntCur = s; $('ntItems').hidden = true; $('ntChips').hidden = true; const R = $('ntRead'); R.hidden = false;
  R.innerHTML = `<div class="row" style="justify-content:space-between"><button class="back" type="button" id="stBack">→ الحكايات</button><span class="chip">${s.kind}</span></div>
   <h2 class="big" style="font-size:2.2rem">${s.title}</h2>
   <div class="chips" id="stMode"><button class="chip2" type="button" data-m="r" aria-pressed="true">الحكاية</button><button class="chip2" type="button" data-m="o" aria-pressed="false">كما في الكتاب</button></div>
   <p class="prose" id="stR">${esc(s.retell)}</p>
   <div id="stO" hidden><p class="orig">${esc(s.original)}</p><p class="ref">${s.book}، ${s.author}. مستخرجٌ حرفًا من: ${s.editions.join('، ')}.</p></div>
   <div class="gloss">${Object.entries(s.gloss).map(([k, v]) => `<span><b>${k}</b>: ${esc(v)}</span>`).join('')}</div>
   <p class="lbl" style="margin:0">هل ⟨فهمتَ|فهمتِ⟩؟</p>
   <div id="stQ" style="display:flex;flex-direction:column;gap:10px"></div>
   <div class="mcq"><p>⟨رتّب|رتّبي⟩ الأحداث كما حدثت:</p><div id="stOrder"></div></div>
   <p><b>المغزى:</b> ${esc(s.lesson)} <span class="draft">(إعادة الحكاية والأسئلة مسودة)</span></p>`;
  const Q = R.querySelector('#stQ');
  s.questions.forEach((q, qi) => { const m = el('div','mcq'); m.appendChild(el('p', null, esc(q.q) + (mastered('nt', `${s.id}|${qi}`) ? ' <span class="badge ok">⟨أتقنتَه|أتقنتِه⟩</span>' : ''))); const o = el('div','opts one'); const f = el('p','fb'); m.appendChild(o); m.appendChild(f); Q.appendChild(m);
    mcq(o, q.options, q.options[0], ok => { f.textContent = ok ? 'أصبت.' : `الجواب: ${q.options[0]}`; f.className = 'fb ' + (ok ? 'ok' : 'bad'); award('nt', `${s.id}|${qi}`, ok); }, 'm'); });
  const sents = splitSent(s.retell); const n = Math.min(5, sents.length);
  if (n >= 3) orderGame(R.querySelector('#stOrder'), sents.slice(0, n), 'nto', s.id); else R.querySelector('#stOrder').innerHTML = '<p class="note">هذه الحكاية قصيرة؛ لا ترتيب فيها.</p>';
  addLink(R, s.link);
  R.querySelector('#stBack').addEventListener('click', () => { ntCur = null; renderStories(); });
  R.querySelector('#stMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; for (const x of b.parentNode.children) x.setAttribute('aria-pressed', x === b); R.querySelector('#stR').hidden = b.dataset.m !== 'r'; R.querySelector('#stO').hidden = b.dataset.m !== 'o'; });
  window.scrollTo({top:0});
}
INIT.ntList = renderStories;

/* ================= الحياة اليومية ================= */
let htCur = null, htHide = null;
function renderScenes(){ const L = $('htList'); L.innerHTML = ''; HY.scenes.forEach(s => { const played = store.get(`scene:${kid}:${s.id}`, false); const b = el('button','item', `<span class="w">${s.title}</span><span class="c">${s.place} · ${s.lines.length} أسطر</span>${played ? '<span class="done-mark">✓</span>' : ''}`); b.type='button'; b.addEventListener('click', () => { htCur = s; htHide = null; drawScene(); window.scrollTo({top:0}); }); L.appendChild(b); });
  if (!htCur){ $('htRead').hidden = true; L.hidden = false; } }
function drawScene(){
  const s = htCur, R = $('htRead'); $('htList').hidden = true; R.hidden = false;
  const who = [...new Set(s.lines.map(l => l.who))];
  R.innerHTML = `<div class="row" style="justify-content:space-between"><button class="back" type="button" id="scBack">→ الحوارات</button><span class="chip">${s.place}</span></div>
   <h2 class="big" style="font-size:2.2rem">${s.title}</h2>
   <div class="chips" id="scRoles"><span class="note">⟨أدِّ|أدّي⟩ الدور:</span>${who.map(w => `<button class="chip2" type="button" data-w="${esc(w)}" aria-pressed="${w === htHide}">${esc(w)}</button>`).join('')}</div>
   <div class="talk">${s.lines.map(l => `<div class="bub s${Math.min(who.indexOf(l.who), 2)}"><span class="w">${esc(l.who)}</span><span class="t${l.who === htHide ? ' hide' : ''}" tabindex="${l.who === htHide ? 0 : -1}">${esc(l.text)}</span></div>`).join('')}</div>
   <p class="note">${htHide ? `⟨قُل|قولي⟩ كلام «${esc(htHide)}» بصوتك، ثم ⟨اضغط|اضغطي⟩ الفراغ ⟨لترى|لتري⟩.` : '⟨اختر|اختاري⟩ شخصًا ⟨لتقول|لتقولي⟩ كلامه ⟨أنت|أنتِ⟩.'}</p>
   <div class="gloss">${Object.entries(s.vocab).map(([k, v]) => `<span><b>${k}</b>: ${esc(v)}</span>`).join('')}</div>
   <p class="lbl" style="margin:0">تراكيب ⟨تستعملها|تستعملينها⟩</p><div class="used">${s.phrases.map(p => `<span class="on">${esc(p)}</span>`).join('')}</div>
   <p class="draft">الحوار مسودة.</p>`;
  addLink(R, s.link, 'ومن الحديث');
  R.querySelector('#scBack').addEventListener('click', () => { htCur = null; renderScenes(); });
  R.querySelector('#scRoles').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; htHide = htHide === b.dataset.w ? null : b.dataset.w; if (htHide) store.set(`scene:${kid}:${s.id}`, true); drawScene(); });
  R.querySelectorAll('.t.hide').forEach(t => { const open = () => t.classList.remove('hide'); t.addEventListener('click', open); t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); }); });
}
INIT.hyTalk = renderScenes;

let hsCur = null;
function hsNext(){ hsCur = pickW('hys', HY.situations, x => x.id, hsCur && hsCur.id); $('hsQ').textContent = hsCur.q; $('hsFb').textContent=''; $('hsFb').className='fb'; $('hsWhy').hidden = true;
  mcq($('hsOpts'), hsCur.options, hsCur.options[0], ok => { feedback('hsFb', ok, 'أحسنت!', `الأنسب: ${hsCur.options[0]}`);
    const w = $('hsWhy'); w.innerHTML = ''; if (hsCur.link) { addLink(w, hsCur.link, 'من السنّة'); w.hidden = false; } award('hys', hsCur.id, ok); }, 'm'); }
$('hsNext').addEventListener('click', hsNext);
INIT.hySay = () => { if (!hsCur) hsNext(); };

const ORDER = HY.scenes.flatMap(s => s.lines.map((l, i) => ({...l, scene: s.title, id: `${s.id}|${i}`}))).filter(l => { const n = l.text.replace(/[،.!؟:]/g, ' ').split(/\s+/).filter(Boolean).length; return n >= 3 && n <= 8 && !l.text.includes('…'); });
let hoCur = null, hoPicked = [];
function hoWords(t){ return t.replace(/[،.!؟:]/g, ' ').split(/\s+/).filter(Boolean); }
function hoNext(){ hoCur = pickW('hyo', ORDER, x => x.id, hoCur && hoCur.id); hoPicked = []; const w = hoWords(hoCur.text); let bank; do { bank = shuffle(w.map((x, i) => ({x, i}))); } while (w.length > 1 && bank.every((b, i) => b.x === w[i]));
  hoCur.bank = bank; $('hoWho').textContent = `${hoCur.who} · ${hoCur.scene}`; $('hoFb').textContent=''; $('hoFb').className='fb'; $('hoCheck').disabled = false; hoDraw(); }
function hoDraw(){ const A = $('hoAns'), B = $('hoBank'); A.innerHTML = ''; B.innerHTML = '';
  hoPicked.forEach((b, k) => { const t = el('button','tok', esc(b.x)); t.type='button'; t.addEventListener('click', () => { hoPicked.splice(k, 1); hoDraw(); }); A.appendChild(t); });
  hoCur.bank.filter(b => !hoPicked.includes(b)).forEach(b => { const t = el('button','tok', esc(b.x)); t.type='button'; t.addEventListener('click', () => { hoPicked.push(b); hoDraw(); }); B.appendChild(t); }); }
$('hoCheck').addEventListener('click', () => { const w = hoWords(hoCur.text); if (hoPicked.length < w.length){ $('hoFb').textContent = '⟨رتّب|رتّبي⟩ كل الكلمات أولًا.'; $('hoFb').className = 'fb'; return; }
  const ok = hoPicked.map(b => b.x).join(' ') === w.join(' '); feedback('hoFb', ok, 'جملةٌ صحيحة!', `الصحيح: ${hoCur.text}`); $('hoCheck').disabled = true; award('hyo', hoCur.id, ok); });
$('hoNext').addEventListener('click', hoNext);
INIT.hyOrder = () => { if (!hoCur) hoNext(); };

const COLOR = Object.fromEntries([...HY.colors.map(c => [c.m, c]), ...HY.nisba.map(c => [c.m, c])]);
let hcCur = null;
function hcNext(){ hcCur = pickW('hyc', HY.things, x => x.noun, hcCur && hcCur.noun); const c = COLOR[hcCur.color]; const right = hcCur.g === 'm' ? c.m : c.f;
  $('hcSw').style.background = c.css; $('hcQ').textContent = `${hcCur.noun} ……`; $('hcFb').textContent=''; $('hcFb').className='fb'; $('hcWhy').hidden = true;
  mcq($('hcOpts'), [c.m, c.f], right, ok => { feedback('hcFb', ok, `${hcCur.noun} ${right}`, `نقول: ${hcCur.noun} ${right}`);
    $('hcWhy').innerHTML = `<p>«${hcCur.noun}» ${hcCur.g === 'm' ? 'مذكّر، فنقول: ' + c.m : 'مؤنّث، فنقول: ' + c.f}.</p>`; $('hcWhy').hidden = false; award('hyc', hcCur.noun, ok); }); }
$('hcNext').addEventListener('click', hcNext);
function renderColors(){ if (!hcCur) hcNext(); const T = $('hcTable'); if (T.childElementCount) return;
  T.innerHTML = `<tr><th></th><th>مذكّر</th><th>مؤنّث</th><th>جمع</th><th>صار</th><th>اللون</th></tr>` + HY.colors.map(c => `<tr><td><i style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${c.css};border:1px solid var(--line)"></i></td><td>${c.m}</td><td>${c.f}</td><td>${c.pl}</td><td>${c.verb}</td><td>${c.noun}</td></tr>`).join('');
  const V = $('hcVerses'); V.innerHTML = '<p class="lbl">ألوانٌ في محفوظك</p>'; const byA = {}; HY.colors.filter(c => c.verse).forEach(c => { const k = c.verse.s + ':' + c.verse.a; (byA[k] = byA[k] || {v: c.verse, w: []}).w.push(c.verse.word); });
  Object.values(byA).forEach(({v, w}) => V.insertAdjacentHTML('beforeend', `<p class="q s">﴿${markMany(v.text, w)}﴾</p><p class="ref" style="margin:0">${v.name} ${v.s}:${v.a}</p>`));
  const N = $('hcNisba'); HY.nisba.forEach(c => N.insertAdjacentHTML('beforeend', `<div class="sw"><i style="background:${c.css}"></i><span style="display:flex;flex-direction:column;min-width:0"><span class="w">${c.m} / ${c.f}</span><span class="c">من «${c.src}»: ${esc(c.srcMeaning)}</span></span></div>`)); }
INIT.hyColors = renderColors;

/* ================= صحيفة الواحة ================= */
const CN = new Set(SF.connectorsShow.concat(['لكن','لأن','فإذا','قبل','بعد','لذلك']).map(strip));
function connHtml(t){ return esc(t).split(' ').map(w => { const b = strip(w.replace(/[،.!؟:«»]/g, '')); const core = b.replace(/^[وف](?=..)/, ''); return CN.has(b) || CN.has(core) ? `<mark class="cn">${w}</mark>` : w; }).join(' '); }
let srCur = null;
function articleDone(a){ return a.tf.every((t, i) => mastered('sfr', `${a.id}|${i}`)); }
function renderArticles(){ const L = $('srList'); L.innerHTML = ''; SF.articles.forEach(a => { const b = el('button','item', `<span class="w">${a.title}</span><span class="c">مقالٌ قصير · ${a.body.length + 2} فقرات</span>${articleDone(a) ? '<span class="done-mark">✓</span>' : ''}`); b.type='button'; b.addEventListener('click', () => openArticle(a)); L.appendChild(b); });
  if (!srCur){ $('srRead').hidden = true; L.hidden = false; } }
function openArticle(a){ srCur = a; $('srList').hidden = true; const R = $('srRead'); R.hidden = false;
  const parts = [['المقدمة', a.intro], ...a.body.map(b => ['العرض', b]), ['الخاتمة', a.outro]];
  R.innerHTML = `<div class="row" style="justify-content:space-between"><button class="back" type="button" id="arBack">→ المقالات</button><span class="chip">صحيفة الواحة</span></div>
   <div class="paper"><h3>${a.title}</h3><span class="meta">مقالٌ نموذجي للقراءة · كلمات الربط ملوّنة</span>${parts.map(([l, t]) => `<div class="part"><span class="lbl">${l}</span><p>${connHtml(t)}</p></div>`).join('')}${a.verse ? verseHtml(a.verse) : ''}</div>
   <div class="gloss">${Object.entries(a.gloss).map(([k, v]) => `<span><b>${k}</b>: ${esc(v)}</span>`).join('')}</div>
   <p class="lbl" style="margin:0">صحٌّ أم خطأ؟</p>
   <div id="arTF" style="display:flex;flex-direction:column;gap:10px"></div>
   <div class="mcq"><p>⟨رتّب|رتّبي⟩ فقرات المقال من الأولى إلى الأخيرة:</p><div id="arOrder"></div></div>
   <p class="draft">المقال مسودة نموذجية تُراجع حقائقه.</p>`;
  const TF = R.querySelector('#arTF');
  a.tf.forEach((t, i) => { const m = el('div','mcq'); m.appendChild(el('p', null, esc(t.s))); const o = el('div','opts'); const f = el('p','fb'); m.appendChild(o); m.appendChild(f); TF.appendChild(m);
    mcq(o, ['صح', 'خطأ'], t.ok ? 'صح' : 'خطأ', ok => { f.textContent = ok ? 'أصبت.' : '⟨راجع|راجعي⟩ المقال.'; f.className = 'fb ' + (ok ? 'ok' : 'bad'); award('sfr', `${a.id}|${i}`, ok); }, 'm'); });
  orderGame(R.querySelector('#arOrder'), parts.map(p => p[1].slice(0, 70) + '…'), 'sfo', a.id);
  R.querySelector('#arBack').addEventListener('click', () => { srCur = null; renderArticles(); });
  window.scrollTo({top:0}); }
INIT.sfRead = renderArticles;

const SWF = ['swTitle','swWhen','swWhat','swWhere','swWhy','swMore'];
const PALMWORDS = Object.values(ALL).flatMap(p => p.family.map(f => strip(f.lemma).replace(/^ال/, ''))).filter(w => w.length > 2);
function draftKey(){ return `paperDraft:${kid}`; }
function loadDraft(){ const d = store.get(draftKey(), {}); SWF.forEach(id => $(id).value = d[id] || ''); updateWrite(); }
function composeNews(){ const v = Object.fromEntries(SWF.map(id => [id, $(id).value.trim()]));
  let lead = [v.swWhen, v.swWhat].filter(Boolean).join('، '); if (v.swWhere) lead += (lead ? ' ' : '') + v.swWhere; if (v.swWhy) lead += (lead ? '، ' : '') + v.swWhy; if (lead && !/[.!؟]$/.test(lead)) lead += '.';
  return {title: v.swTitle, text: [lead, v.swMore].filter(Boolean).join('\n')}; }
function updateWrite(){
  const d = Object.fromEntries(SWF.map(id => [id, $(id).value])); store.set(draftKey(), d);
  const n = composeNews(); const all = strip(n.text);
  const usedC = SF.connectorsShow.filter(c => all.split(/[\s،.!؟]+/).some(w => strip(w) === strip(c) || strip(w).replace(/^[وف]/, '') === strip(c)));
  $('swConn').innerHTML = SF.connectorsShow.map(c => `<span class="${usedC.includes(c) ? 'on' : ''}">${c}</span>`).join('');
  const sentences = n.text.split(/[.!؟\n]+/).filter(x => x.trim().split(/\s+/).length >= 2).length;
  const palm = PALMWORDS.some(w => all.includes(w));
  const checks = [['عنوان', !!n.title], ['٣ جمل أو أكثر', sentences >= 3], ['كلمتا ربط', usedC.length >= 2], ['كلمة من النخيل', palm]];
  $('swChecks').innerHTML = checks.map(([l, ok]) => `<span class="${ok ? 'on' : ''}">${ok ? '✓ ' : ''}${l}</span>`).join('');
  $('swPreview').innerHTML = `<h3>${esc(n.title || 'عنوان خبرك')}</h3><span class="meta">صحيفة الواحة · بقلم ${esc(K().name)}</span><p>${esc(n.text || '⟨اكتب|اكتبي⟩: متى؟ ماذا حدث؟ أين؟ لماذا؟ ثم التفاصيل.')}</p>`;
  return checks.every(c => c[1]);
}
function renderWrite(){ const P = $('swPrompts'); if (!P.childElementCount){ SF.prompts.forEach(p => { const b = el('button','chip2', p); b.type='button'; b.setAttribute('aria-pressed','false'); b.addEventListener('click', () => { if (!$('swTitle').value) $('swTitle').value = p; for (const x of P.children) x.setAttribute('aria-pressed', x === b); updateWrite(); }); P.appendChild(b); });
  SWF.forEach(id => $(id).addEventListener('input', updateWrite)); } loadDraft(); }
$('swSave').addEventListener('click', () => { const full = updateWrite(); const n = composeNews(); if (!n.title || !n.text){ $('swFb').textContent = '⟨اكتب|اكتبي⟩ العنوان وجملة واحدة على الأقل.'; $('swFb').className = 'fb bad'; return; }
  const list = store.get(`paper:${kid}`, []); list.unshift({...n, date: new Date().toLocaleDateString('ar', {day:'numeric', month:'long', year:'numeric'})}); store.set(`paper:${kid}`, list);
  queueAdd({kind:'خبر', title:n.title, text:n.text, ai: $('swAiOut').dataset.ai ? JSON.parse($('swAiOut').dataset.ai) : null});
  $('swFb').textContent = full ? 'نُشر الخبر في صحيفتك، وكل الشروط مكتملة!' : 'نُشر الخبر في صحيفتك. ⟨أكمل|أكملي⟩ الشروط في خبرك القادم.'; $('swFb').className = 'fb ok'; checkStages(); });
$('swClear').addEventListener('click', () => { store.set(draftKey(), {}); loadDraft(); $('swFb').textContent = ''; $('swAiOut').innerHTML = ''; delete $('swAiOut').dataset.ai; for (const x of $('swPrompts').children) x.setAttribute('aria-pressed','false'); });
$('swAi').addEventListener('click', () => { const n = composeNews(); aiFeedback($('swAi'), $('swAiOut'), 'خبرًا قصيرًا لصحيفة الأطفال', (n.title ? n.title + '\n' : '') + n.text, 'المطلوب: عنوان، وجمل مرتبة بكلمات ربط (ثم، لكنّ، لأنّ، لذلك).', n.title || 'خبر'); });
INIT.sfWrite = renderWrite;
function renderMine(){ const L = $('smList'); L.innerHTML = ''; const list = store.get(`paper:${kid}`, []);
  if (!list.length){ L.appendChild(el('div','card', `<p style="margin:0"><b>صحيفة ${esc(K().name)} فارغة بعد.</b></p><p class="note">⟨اكتب|اكتبي⟩ خبرك الأول في «⟨اكتب|اكتبي⟩ خبرك»، ثم ⟨اضغط|اضغطي⟩ «⟨انشره|انشريه⟩ في صحيفتي» فيظهر هنا.</p>`)); return; }
  list.forEach((n, i) => { const d = el('div','paper', `<h3>${esc(n.title)}</h3><span class="meta">${esc(n.date)} · بقلم ${esc(K().name)}</span><p>${esc(n.text)}</p>`);
    const del = el('button','btn ghost sm','⟨احذف|احذفي⟩'); del.type='button'; del.style.alignSelf = 'flex-start';
    del.addEventListener('click', () => { if (del.dataset.c){ list.splice(i, 1); store.set(`paper:${kid}`, list); renderMine(); } else { del.dataset.c = '1'; del.textContent = '⟨اضغط|اضغطي⟩ مرة أخرى للحذف'; del.className = 'btn warm sm'; } });
    d.appendChild(del); L.appendChild(d); }); }
INIT.sfMine = renderMine;
RESETS.push(() => { ntCur = null; htCur = null; hsCur = hoCur = hcCur = null; srCur = null; });


/* ================= ورشة الكتابة ================= */
/* إملاء بالذاكرة */
const DCT = (() => { const seen_ = new Set(); const out = [];
  const add = (w, src, m) => { const k = strip(w); if (!k || k.length < 2 || seen_.has(k)) return; seen_.add(k); out.push({w, src, m}); };
  Object.values(ALL).forEach(p => p.family.forEach(f => add(f.lemma, `نخلة ${p.root}`, f.meaning)));
  GZ.dots.forEach(g => g.words.forEach(x => add(x.word, 'نقطة تغيّر المعنى', x.meaning)));
  HY.colors.forEach(c => { add(c.m, 'الألوان', c.noun); add(c.f, 'الألوان', c.noun + ' (مؤنث)'); });
  return out; })();
let dcCur = null, dcTimer = null, dcShownAgain = false;
function dcShow(ms){
  clearTimeout(dcTimer); $('dcWord').textContent = dcCur.w; $('dcWord').hidden = false; $('dcBox').hidden = true; const bar = $('dcTimer').querySelector('i'); $('dcTimer').hidden = false;
  bar.style.transition = 'none'; bar.style.width = '100%'; requestAnimationFrame(() => { bar.style.transition = REDUCED ? 'none' : `width ${ms}ms linear`; bar.style.width = '0%'; });
  dcTimer = setTimeout(() => { $('dcWord').hidden = true; $('dcTimer').hidden = true; $('dcBox').hidden = false; const inp = $('dcIn'); if (inp) inp.focus(); }, ms);
}
function dcNext(){
  dcCur = pickW('dct', DCT, x => strip(x.w), dcCur && strip(dcCur.w)); dcShownAgain = false; $('dcFb').textContent = ''; $('dcFb').className = 'fb'; $('dcWhy').hidden = true; $('dcAgain').disabled = false;
  typeBox($('dcBox'), dcCur.w, {id:'dcIn', placeholder:'⟨اكتب|اكتبي⟩ الكلمة', noFocus:true, onDone: st => { clearTimeout(dcTimer); $('dcAgain').disabled = true;
    feedback('dcFb', st, `أصبت: ${dcCur.w}`, `الكلمة: ${dcCur.w}`, `قريب! الكلمة: ${dcCur.w} (${NEAR_WHY($('dcIn').value, dcCur.w)})`);
    $('dcWhy').innerHTML = `<p><b style="font-family:var(--f-q);font-size:1.4rem">${dcCur.w}</b>: ${esc(dcCur.m)} <span class="ref">· ${esc(dcCur.src)}</span></p>` + (dcShownAgain ? '<p class="note">⟨رأيتَها|رأيتِها⟩ مرتين، فلا تُحتسب إتقانًا هذه المرة.</p>' : ''); $('dcWhy').hidden = false;
    award('dct', strip(dcCur.w), dcShownAgain ? null : st === 'ok' ? true : st === 'near' ? null : false); }});
  dcShow(tier() === 'small' ? 4000 : 2500);
}
$('dcNext').addEventListener('click', dcNext);
$('dcAgain').addEventListener('click', () => { if (!dcCur) return; dcShownAgain = true; dcShow(2000); });
INIT.wsDict = () => { if (!dcCur) dcNext(); };

/* صرّف الفعل */
const cjDisp = f => f.replace(/ـَٔا/g, 'آ').replace(/ٱ/g, 'ا').replace(/ىٰ/g, 'ى').replace(/\u06DF/g, '').replace(/\u0670/g, 'ا');
const cjId = x => `${x.root}|${x.lemma}|${x.aspect}|${x.pgn}`;
let cjCur = null;
function cjNext(){
  cjCur = pickW('cnj', CJ.items, cjId, cjCur && cjId(cjCur)); $('cjFb').textContent = ''; $('cjFb').className = 'fb'; $('cjWhy').hidden = true;
  $('cjQ').innerHTML = `«<b>${esc(cjCur.lemma)}</b>» في <b>${esc(cjCur.aspectName)}</b> مع «<b>${esc(cjCur.pron)}</b>»`;
  const forms = CJ.items.filter(x => x.lemma === cjCur.lemma && x.root === cjCur.root);
  typeBox($('cjBox'), cjCur.form, {id:'cjIn', placeholder:'⟨اكتب|اكتبي⟩ الصيغة', onDone: st => { feedback('cjFb', st, `أصبت: ${cjDisp(cjCur.form)}`, `الصيغة: ${cjDisp(cjCur.form)}`, `قريب! الصيغة: ${cjDisp(cjCur.form)} (${NEAR_WHY($('cjIn').value, cjCur.form)})`);
    $('cjWhy').innerHTML = `<p class="lbl">كما في محفوظك</p>` + verseHtml(cjCur.verse) + `<p class="lbl" style="margin-top:6px">صيغ «${esc(cjCur.lemma)}» الواردة في محفوظك</p><div class="gloss">${forms.map(x => `<span><b>${cjDisp(x.form)}</b>: ${x.aspectName} · ${x.pron}</span>`).join('')}</div>`; $('cjWhy').hidden = false;
    award('cnj', cjId(cjCur), st === 'ok' ? true : st === 'near' ? null : false); }});
}
$('cjNext').addEventListener('click', cjNext);
INIT.wsConj = () => { if (!cjCur) cjNext(); };
RESETS.push(() => { dcCur = cjCur = null; clearTimeout(dcTimer); });


/* ================= الحكم ================= */
let hkCur = null;
function hkNext(){ if (!HIK.length) return; hkCur = pickW('hk', HIK, x => x.text, hkCur && hkCur.text); $('hkText').textContent = hkCur.text; $('hkFb').textContent=''; $('hkFb').className='fb'; $('hkWhy').hidden = true;
  mcq($('hkOpts'), hkCur.situations, hkCur.situations[0], ok => { feedback('hkFb', ok, 'أصبت.', 'ليس هذا الموقف.');
    $('hkWhy').innerHTML = `<p><b>المعنى:</b> ${hkCur.meaning}</p><p><b>تُقال:</b> ${hkCur.when}</p>`; $('hkWhy').hidden=false; award('hk', hkCur.text, ok); }, 'm'); }
function renderHikam(){ if (!hkCur) hkNext(); const L = $('hkList'); if (L.childElementCount) return;
  HIK.forEach(k => { const d = el('details','hk'); d.innerHTML = `<summary>${k.text} <span class="ref">${k.kind}</span></summary><p>${k.meaning}</p><p class="ref">تُقال: ${k.when}</p><p class="ref">المظانّ: ${k.attribution}</p>`; const rb = el('button','btn ghost sm','🎙 ⟨سجّله|سجّليه⟩'); rb.type='button'; rb.addEventListener('click', () => recordFrom('مثل', k.kind, k.text)); d.appendChild(rb); L.appendChild(d); }); }
$('hkNext').addEventListener('click', hkNext);
INIT.hikam = renderHikam;

/* ================= الحديث: الفئات الثلاث لا تُخلط ================= */
const CATQ = [['nabi','النبي ﷺ'],['wasf','صحابي يصف النبي ﷺ'],['sahabi','صحابي من كلامه']];
function hdCard(it){
  const d = el('div','hd ' + it.cat);
  const who = it.cat === 'nabi' ? 'قال النبي ﷺ' : it.cat === 'wasf' ? `قال ${it.speaker} يصف النبي ﷺ` : `قال ${it.speaker}`;
  const sib = HAD.items.filter(x => x.book === it.book && x.number === it.number && x.id !== it.id);
  d.innerHTML = `<span class="who">${who}</span>` + (it.context ? `<p class="ctx">${it.context}:</p>` : '') +
    `<p class="fx">«${it.focus}»</p><p style="margin:0">${it.meaning} <span class="draft">(مسودة)</span></p>` +
    `<span class="ref">${it.bookName} ${it.ref}</span>` +
    (sib.length ? `<p class="ref" style="margin:0">في الحديث نفسه: ${sib.map(s => (s.cat==='nabi'?'قال النبي ﷺ: ':'قال '+s.speaker+': ') + '«' + s.focus + '»').join(' — ')}</p>` : '') +
    `<details><summary>النص كاملًا بإسناده</summary><p>${it.fullText}</p></details>`;
  const rb = el('button','btn ghost sm','🎙 ⟨سجّله|سجّليه⟩'); rb.type='button'; rb.style.alignSelf='flex-start'; rb.addEventListener('click', () => recordFrom('حديث', `${it.bookName} ${it.ref}`, it.focus)); d.appendChild(rb);
  return d;
}
let hdCat = 'nabi';
function renderHadithList(){
  const L = $('hdList'); L.innerHTML = '';
  for (const b of $('hdChips').children) b.setAttribute('aria-pressed', b.dataset.c === hdCat);
  if (hdCat === 'nawawi'){
    HAD.nawawi.forEach(x => { const d = el('details','hk');
      const badge = x.status === 'active' ? '<span class="badge ok">في الصحيحين أو أحدهما</span>' : `<span class="badge wait">خارج الصحيحين${x.nawawiGrade ? ' · قال النووي: ' + x.nawawiGrade : ''} · بانتظار قرار الأب</span>`;
      d.innerHTML = `<summary>الحديث ${x.n} ${badge}</summary><p style="font-family:var(--f-q);font-size:1.15rem;line-height:1.9">${x.text}</p>` + (x.note ? `<p class="ref">${x.note}</p>` : '');
      L.appendChild(d); });
  } else HAD.items.filter(i => i.cat === hdCat).forEach(i => L.appendChild(hdCard(i)));
}
let whCur = null;
function whNext(){ if (!HAD.items.length) return; whCur = pickW('wh', HAD.items, x => x.id, whCur && whCur.id); $('whText').textContent = '«' + whCur.focus + '»';
  $('whFb').textContent=''; $('whFb').className='fb'; $('whWhy').hidden = true; const box = $('whOpts'); box.innerHTML='';
  CATQ.forEach(([c, label]) => { const b = el('button','opt m', label); b.type='button';
    b.addEventListener('click', () => { const ok = c === whCur.cat; for (const x of box.children){ x.disabled = true; } b.dataset.s = ok ? 'ok' : 'bad';
      [...box.children][CATQ.findIndex(q => q[0] === whCur.cat)].dataset.s = 'ok';
      feedback('whFb', ok, 'أصبت.', 'ليس كذلك.');
      const w = $('whWhy'); w.innerHTML = ''; w.appendChild(hdCard(whCur)); w.hidden = false; award('wh', whCur.id, ok); });
    box.appendChild(b); }); }
function renderHadith(){ if (!whCur) whNext(); renderHadithList(); $('hdSrc').textContent = 'النصوص مستخرجة آليًا من: ' + (HAD.source || '') + '. التصنيف بين الفئات الثلاث مسودة بانتظار مراجعة الأب، وفُحص آليًا أن قول النبي ﷺ يقع داخل كلامه المقتبس في النص.'; }
$('whNext').addEventListener('click', whNext);
$('hdChips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; hdCat = b.dataset.c; renderHadithList(); });
INIT.hadith = renderHadith;
RESETS.push(() => { hkCur = whCur = null; });

/* ================= اختبار القافلة: من المُتقَن فقط، بلا تلميح ================= */
const WHO_L = Object.fromEntries(CATQ);
/* «كنوز البيان» في الرحلة: دروس الخزائن السبع وأسئلتها (تُقرأ عند البناء من parts/data.js) */
const KZD = DATA.kunuz || {axes: {}, lessons: []};
const kzPlain = s => String(s == null ? '' : s).replace(/[{}\[\]]/g, '');
function kzFind(id){ const [lid, qi] = String(id).split('|'); const L = KZD.lessons.find(l => l.id === lid); const q = L && L.quiz[+qi]; return q ? {L, q} : null; }
const GEN = {
  /* السؤال خارج درسه يحتاج سياقه: عنوان الدرس وآيته (إلا إن كان السؤال إكمالًا للآية نفسها) */
  kz: id => { const x = kzFind(id); if (!x || !x.q.o || x.q.o.length < 2) return null; const v = (x.L.verses || [])[0], blank = /ـــ/.test(x.q.q);
    return {q: kzPlain(x.q.q), a: kzPlain(x.q.o[0]), alts: x.q.o.slice(1).map(kzPlain), why: kzPlain(x.q.why), label: `كنوز البيان: ${x.L.title}`,
      html: `<p class="note" style="margin:0 0 4px">💎 ${esc(x.L.title)}</p>` + (v && !blank ? `<p style="font-family:var(--f-q);font-size:1.15rem;line-height:1.9;margin:0">${esc(kzPlain(v.t))} <span class="ref">(${esc(v.n)} ${v.a})</span></p>` : '')}; },
  rl: id => { const [k, q] = id.split('|'); const P = ALL[k]; const r = P && P.roles.find(x => x.q === q); if (!r) return null; return {q:`${P.root}: ${r.q}`, a:r.a, alts:r.opts.filter(o => o !== r.a), type:true, label:`الوزن: ${r.q} (${P.root})`}; },
  drv: id => { const [k, l] = id.split('|'); const P = ALL[k]; const f = P && P.family.find(x => x.lemma === l); if (!f) return null; return {q:`من جذر ${P.root} على وزن ${dvPattern(f)}: ما الكلمة؟`, a:f.lemma, alts:P.family.filter(x => x !== f).map(x => x.lemma), type:true, label:`⟨اشتقّ|اشتقّي⟩: ${f.lemma}`}; },
  fill: id => { const [k, sa, w] = id.split('|'); const P = ALL[k]; let hit = null; P && P.family.forEach(f => f.verses.forEach(v => { if (`${v.s}:${v.a}` === sa && strip(v.word) === w) hit = {f, v}; })); if (!hit) return null;
    return {html: blankHtml(hit.v, true), a:hit.v.word, alts:P.family.filter(x => x !== hit.f).slice(0, 5).map(x => x.verses[0].word), type:true, label:`الكلمة الناقصة: ${hit.v.word} (${hit.v.name} ${hit.v.s}:${hit.v.a})`}; },
  uk: id => { const [k, l] = id.split('|'); const P = ALL[k]; const u = P && P.unknown.find(x => x.lemma === l); if (!u) return null; const v = u.verse; return {q:`ما معنى «${v ? v.word : u.lemma}» في الآية؟`, html: v ? `<p class="q s">﴿${esc(snip(v.text, v.word, 8)).replace(esc(v.word), `<mark>${esc(v.word)}</mark>`)}﴾</p><p class="ref" style="margin:0">${v.name} ${v.s}:${v.a}</p>` : '', a:u.options[u.answer], alts:u.options.filter((o, i) => i !== u.answer), label:`المجهولة: ${u.lemma}`}; },
  gzw: id => { const x = GZ.quran.find(q => q.id === id); if (!x) return null; return {q:`من أنا؟ ${x.clues.slice(0, 2).join(' ')}`, a:strip(x.answer), alts:x.options.slice(1).map(strip), type:true, label:`من أنا؟ ${x.answer}`}; },
  gzd: id => { const [g, w] = id.split('|'); const G = GZ.dots.find(x => x.id === g); const t = G && G.words.find(x => x.word === w); if (!t) return null; const alts = G.words.filter(x => x !== t).map(x => x.word); let guard = 0; while (alts.length < 3 && guard++ < 40){ const w = pick(GZ.dots).words[0].word; if (w !== t.word && !alts.includes(w)) alts.push(w); } return {q:`رسمها «${G.rasm}»، ومعناها: ${t.meaning}. ما الكلمة؟`, a:t.word, alts, type:true, label:`النقاط: ${t.word}`}; },
  gzf: id => { const x = GF.find(q => q.id === id); if (!x) return null; return {q:x.q, a:x.answer, alts:x.options.slice(1), type: x.kind === 'لغز', label:`لغز: ${x.answer}`}; },
  sha: id => { const x = SH.abyat.find(q => q.id === id); if (!x) return null; const v = x.verses[0]; return {q:`⟨أكمل|أكملي⟩: ${v.a} ۞ ……`, a:v.b, alts:shuffle(SH.abyat.filter(y => y !== x)).slice(0, 3).map(y => y.verses[0].b), label:`⟨أكمل|أكملي⟩ البيت: ${v.a}`}; },
  shl: id => { const x = SH.abyat.find(q => q.id === id); if (!x) return null; const v = x.verses[0]; const last = lastWord(v.b); return {q:`${v.a} ۞ ${v.b.replace(/\S+\s*$/, '……')}`, a:last, alts:shuffle(SH.abyat.filter(y => y !== x)).slice(0, 3).map(y => lastWord(y.verses[0].b)), type:true, label:`آخر كلمة: ${last}`}; },
  shp: id => { const x = SH.abyat.find(q => q.id === id); if (!x) return null; const v = x.verses[0]; return {q:`من قال: ${v.a} ۞ ${v.b}؟`, a:x.poet, alts:shuffle([...new Set(SH.abyat.map(y => y.poet).filter(p => p !== x.poet))]).slice(0, 3), label:`الشاعر: ${x.poet}`}; },
  pml: id => { const [qid, li] = id.split('|'); const q = SH.qasaid.find(x => x.id === qid); const l = q && q.lines[+li]; if (!l) return null; const parts = l.text.split('۞').map(s => s.trim()); const last = lastWord(parts[parts.length - 1]); return {q:parts.map((p, i) => i === parts.length - 1 ? p.replace(/\S+\s*$/, '……') : p).join(' ۞ '), a:last, alts:shuffle(q.lines.filter(x => x !== l)).slice(0, 3).map(x => lastWord(x.text)), type:true, label:`${q.title}: ${last}`}; },
  hys: id => { const x = HY.situations.find(q => q.id === id); if (!x) return null; const others = HY.situations.filter(y => y !== x && y.options[0] !== x.options[0] && !x.options.includes(y.options[0])).map(y => y.options[0]); const near = others.sort((a, b) => Math.abs(a.length - x.options[0].length) - Math.abs(b.length - x.options[0].length)).slice(0, 2); return {q:x.q + ' ماذا ⟨تقول|تقولين⟩؟', a:x.options[0], alts:[...x.options.slice(1), ...near], label:`ماذا ⟨تقول|تقولين⟩: ${x.q}`}; },
  hyc: id => { const t = HY.things.find(x => x.noun === id); if (!t) return null; const c = COLOR[t.color]; return {q:`${t.noun}: ما ${t.g === 'm' ? 'لونه' : 'لونها'}؟`, html:`<p class="ask" style="font-size:1.5rem;text-align:center">${esc(t.noun)} …… <span style="display:inline-block;width:1.3em;height:1.3em;border-radius:50%;background:${c.css || '#888'};vertical-align:middle;border:1px solid var(--line)"></span></p>`, a:t.g === 'm' ? c.m : c.f, alts:[t.g === 'm' ? c.f : c.m], label:`اللون: ${t.noun}`}; },
  hk: id => { const x = HIK.find(q => q.text === id); if (!x) return null; return {q:`متى ⟨تقول|تقولين⟩: «${x.text}»؟`, a:x.situations[0], alts:x.situations.slice(1), label:`المثل: ${x.text}`}; },
  wh: id => { const x = HAD.items.find(q => q.id === id); if (!x) return null; return {q:`من القائل: «${x.focus}»؟`, a:WHO_L[x.cat], alts:CATQ.map(c => c[1]).filter(l => l !== WHO_L[x.cat]), label:`من القائل: ${x.focus.slice(0, 30)}…`}; },
  nt: id => { const [sid, qi] = id.split('|'); const s = NT.stories.find(x => x.id === sid); const q = s && s.questions[+qi]; if (!q) return null; return {q:`${s.title}: ${q.q}`, a:q.options[0], alts:q.options.slice(1), label:`${s.title}: ${q.q}`}; },
  nto: id => { const s = NT.stories.find(x => x.id === id); return s ? {label:`⟨رتّب|رتّبي⟩ الأحداث: ${s.title}`} : null; },
  sfr: id => { const [aid, i] = id.split('|'); const a = SF.articles.find(x => x.id === aid); const t = a && a.tf[+i]; if (!t) return null; return {q:`${a.title}: «${t.s}» صحٌّ أم خطأ؟`, a:t.ok ? 'صح' : 'خطأ', alts:[t.ok ? 'خطأ' : 'صح'], label:`${a.title}: ${t.s}`}; },
  sfo: id => { const a = SF.articles.find(x => x.id === id); return a ? {label:`⟨رتّب|رتّبي⟩ الفقرات: ${a.title}`} : null; },
  gzr: id => { const [kind, k] = id.split('|'); const P = ALL[k]; if (!P) return null; return {label:`جذرٌ يختبئ: ${P.root} (${kind === 'who' ? 'من أنا' : 'الغريبة'})`}; },
  dct: id => { const x = DCT.find(y => strip(y.w) === id); if (!x) return null; return {q:`إملاء: ما الكلمة التي معناها «${x.m}» (${x.src})؟`, a:x.w, alts:shuffle(DCT.filter(y => y !== x)).slice(0, 3).map(y => y.w), type:true, label:`إملاء: ${x.w}`}; },
  cnj: id => { const x = CJ.items.find(y => cjId(y) === id); if (!x) return null; const me = cjDisp(x.form); const others = [...new Set(CJ.items.filter(y => y.lemma === x.lemma && y !== x).map(y => cjDisp(y.form)).filter(f => f !== me))]; let guard = 0; while (others.length < 3 && guard++ < 60){ const f = cjDisp(pick(CJ.items).form); if (f !== me && !others.includes(f)) others.push(f); } return {q:`⟨صرّف|صرّفي⟩ «${x.lemma}» في ${x.aspectName} مع «${x.pron}»`, a:me, alts:others.slice(0, 3), type:true, label:`⟨صرّف|صرّفي⟩: ${cjDisp(x.form)}`}; },
  rc: id => { const [k, sa] = id.split('|'); return {label:`تلاوة ${ALL[k] ? ALL[k].root : k} ${sa}`}; },
  ajd: id => { const x = AJ.defs.find(d => d.term === id); if (!x) return null; return {q:`عرّفه ابن آجرّوم: «${x.d}». ما المصطلح؟`, a:x.term, alts:shuffle(AJ.defs.filter(d => d !== x).map(d => d.term)).slice(0, 3), type:true, label:`الآجرومية: ${x.term}`}; },
  ajc: id => { const x = (AJ.counts || []).find(c => c.q === id); if (!x) return null; return {q:`في نظم الآجرومية: كم ${x.q}؟`, a:String(x.n), alts:acAlts(x.n).map(String), label:`كم ${x.q}: ${x.n}`}; },
  irb: id => { const x = irbFind(id); if (!x) return null; return {q:`⟨أعرب|أعربي⟩ «${x.w.w}» في: ${x.s.sentence}`, a:irbShort(x.w.i), alts:irbAlts(x).map(irbShort), label:`⟨أعرب|أعربي⟩: ${x.w.w} (${x.s.sentence})`}; },
  hsq: id => { const x = (DATA.hasaniya && DATA.hasaniya.quizzes || []).find(q => q.id === id); if (!x) return null; const nz = t => strip(t).replace(/ة/g, 'ه').replace(/[أإآ]/g, 'ا'); const sv = nz(x.verse), sa = nz(x.a); let shown = x.verse; const i = sv.indexOf(sa); if (i >= 0){ /* نُخفي موضع الجواب من البيت حتى لا يُقرأ من الشاشة */ const words = x.verse.split(' '); const sw = words.map(nz); let acc = '', start = -1, end = -1; for (let k = 0; k < sw.length; k++){ const from = acc.length; acc += (k ? ' ' : '') + sw[k]; if (start < 0 && acc.length > i) start = k; if (start >= 0 && acc.length >= i + sa.length){ end = k; break; } } if (start >= 0 && end >= start) shown = words.map((w, k) => k >= start && k <= end ? '……' : w).filter((w, k, arr) => w !== '……' || arr[k - 1] !== '……').join(' '); } return {q:x.q, html:`<p class="q s" style="font-family:var(--f-q)">${esc(shown)}</p><p class="ref" style="margin:0">المنظومة الحسنية</p>`, a:x.a, alts:x.alts, label:`الحسنية: ${x.q}`}; },
  tri: id => { const x = triApproved().find(t => t.id === id); if (!x) return null; return {q:`ما الكلمة العربية التي معناها: ${[x.zh, x.en].filter(Boolean).join(' / ')}؟`, a:x.lemma, alts:triAlts(x), type:true, label:`بثلاث لغات: ${x.lemma}`}; },
};
function describe(g, id){ try { const q = GEN[g] && GEN[g](id); return q ? q.label : `${g}: ${id}`; } catch (e) { return `${g}: ${id}`; } }
const GNAME = {kz:'كنوز البيان', hsq:'المنظومة الحسنية', rl:'الوزن المناسب', drv:'⟨اشتقّ|اشتقّي⟩ الكلمة', uk:'الكلمة المجهولة', fill:'الكلمة الناقصة', rc:'تلاوة', gzw:'من أنا؟', gzd:'نقطة تغيّر المعنى', gzr:'جذرٌ يختبئ', gzf:'ألغاز وأحاجي', sha:'⟨أكمل|أكملي⟩ البيت', shl:'آخر كلمة', shp:'من الشاعر؟', pml:'تسميع شوقي', nt:'أسئلة الحكايات', nto:'⟨رتّب|رتّبي⟩ الأحداث', hys:'ماذا ⟨تقول|تقولين⟩؟', hyo:'⟨رتّب|رتّبي⟩ الجملة', hyc:'الألوان', sfr:'صحٌّ أم خطأ', sfo:'⟨رتّب|رتّبي⟩ الفقرات', hk:'متى ⟨تقولها|تقولينها⟩؟', wh:'من القائل؟', dct:'إملاء بالذاكرة', cnj:'⟨صرّف|صرّفي⟩ الفعل', mtn:'تسميع المتون', kq:'أسئلة الإخوة', gift:'الهدايا', tri:'بثلاث لغات', ajd:'ما المصطلح؟ (الآجرومية)', ajc:'كم عددها؟ (الآجرومية)', irb:'⟨أعرب|أعربي⟩ (التحفة السنية)'};
function testPool(){ const pool = []; for (const g of Object.keys(GEN)) for (const id of seen(g)) if (mastered(g, id)) { const q = GEN[g](id); if (q && q.a) pool.push({g, id, ...q}); } return pool; }
let TS = null;
function testStage(){ return STAGES.filter(s => s.test).find(s => !stageDone(s) && !stageLocked(s)) || null; }
function renderTest(){
  const C = $('tsCard'); const st = testStage(); const hist = store.get(`tests:${kid}`, []); const histHtml = hist.length ? `<p class="lbl">محاولاتك</p><div class="chips">${hist.slice(-8).map(h => `<span class="badge ${h.pass ? 'ok' : 'wait'}">الاختبار ${h.n}: ${h.score}/10</span>`).join('')}</div>` : '';
  if (TS) return renderTestQ();
  if (!st){ const next = STAGES.filter(s => s.test).find(s => !stageDone(s)); C.innerHTML = `<p class="lbl" style="margin:0">اختبار القافلة</p><p class="ask">${next ? `الاختبار ${next.test} يُفتح بعد ${next.after} مراحل، و⟨أنجزتَ|أنجزتِ⟩ ${stagesDoneCount()}.` : '⟨نجحتَ|نجحتِ⟩ في الاختبارات الثلاثة. القافلة كلها في واحتك!'}</p>${histHtml}<div class="btns"><button class="btn ghost" id="tsHome">→ واحتي</button></div>`; $('tsHome').addEventListener('click', () => go('home')); return; }
  const pool = testPool(); const games = new Set(pool.map(p => p.g));
  C.innerHTML = `<p class="lbl" style="margin:0">اختبار القافلة ${st.test} — يفتح ${esc(STAGE_NAMES_EL[st.el])}</p><p class="ask">عشرة أسئلة مما ⟨أتقنتَه|أتقنتِه⟩ في كل الواحات، بلا تلميح ولا دليل. النجاح: 8 من 10.</p><p class="note">عندك الآن ${pool.length} سؤالًا متقنًا في ${games.size} ألعاب${pool.length < 10 || games.size < 3 ? '؛ يلزم 10 أسئلة في 3 ألعاب على الأقل.' : '.'}</p>${histHtml}<div class="btns"><button class="btn" id="tsStart" ${pool.length < 10 || games.size < 3 ? 'disabled' : ''}>⟨ابدأ|ابدئي⟩ الاختبار</button><button class="btn ghost" id="tsHome">→ واحتي</button></div>`;
  $('tsHome').addEventListener('click', () => go('home'));
  $('tsStart').addEventListener('click', () => { const byG = {}; shuffle(pool).forEach(p => (byG[p.g] = byG[p.g] || []).push(p)); const qs = []; const keys = shuffle(Object.keys(byG)); let i = 0; while (qs.length < 10 && keys.some(k => byG[k].length)){ const k = keys[i % keys.length]; i++; if (byG[k].length) qs.push(byG[k].shift()); }
    TS = {n: st.test, stage: st, qs, i: 0, score: 0, log: []}; renderTestQ(); });
}
function renderTestQ(){
  const C = $('tsCard'); const q = TS.qs[TS.i]; if (!q) return renderTestEnd();
  C.innerHTML = `<div class="row" style="justify-content:space-between"><span class="chip">السؤال ${TS.i + 1} من ${TS.qs.length}</span><span class="note">${GNAME[q.g] || ''}</span></div>${q.html ? q.html : `<p class="ask">${esc(q.q)}</p>`}<div class="opts one" id="tqOpts"></div><div id="tqBox"></div><p class="fb" id="tqFb"></p><div class="btns"><button class="btn" id="tqNext" hidden>التالي</button></div>`;
  const done = st => { const ok = st === 'ok' || st === true; if (ok) TS.score++; TS.log.push({g:q.g, id:q.id, ok}); feedback('tqFb', ok ? true : false, 'أصبت.', `الجواب: ${q.a}`); $('tqNext').hidden = false; $('tqNext').focus(); };
  if (q.type && tier() === 'big') typeBox($('tqBox'), q.a, {id:'tqIn', onDone: st => done(st === 'ok')});
  else mcq($('tqOpts'), [q.a, ...shuffle(q.alts).slice(0, 3)], q.a, done, q.g === 'sha' ? 'v' : 'm');
  $('tqNext').addEventListener('click', () => { TS.i++; renderTestQ(); window.scrollTo({top:0}); });
}
function renderTestEnd(){
  const C = $('tsCard'); const pass = TS.score >= 8; const hist = store.get(`tests:${kid}`, []); hist.push({n:TS.n, score:TS.score, pass, date:Date.now()}); store.set(`tests:${kid}`, hist);
  TS.log.filter(l => !l.ok).forEach(l => award(l.g, l.id, false));
  C.innerHTML = `<p class="lbl" style="margin:0">انتهى الاختبار ${TS.n}</p><p class="big" style="font-size:2.4rem">${TS.score} / ${TS.qs.length}</p><p class="ask">${pass ? `⟨نجحتَ|نجحتِ⟩! ${esc(STAGE_NAMES_EL[TS.stage.el])} في واحتك الآن.` : 'لم ⟨تصل|تصلي⟩ إلى 8 هذه المرة. ما ⟨أخطأتَ|أخطأتِ⟩ فيه سيعود إليك في ألعابه، ثم ⟨حاول|حاولي⟩ من جديد.'}</p>${TS.log.some(l => !l.ok) ? `<p class="lbl">ما ⟨أخطأتَ|أخطأتِ⟩ فيه</p><ul style="margin:0;padding-right:1.2em">${TS.log.filter(l => !l.ok).map(l => `<li>${esc(describe(l.g, l.id))}</li>`).join('')}</ul>` : ''}<div class="btns"><button class="btn" id="tsHome">→ واحتي</button></div>`;
  TS = null; $('tsHome').addEventListener('click', () => go('home')); checkStages();
}
INIT.test = renderTest;
RESETS.push(() => { TS = null; });

/* ================= لوحة الأب ================= */
let ddTab = 'today';
function renderDad(){
  const C = $('ddCard');
  if (TEACHER){ C.innerHTML = `<div class="row" style="justify-content:space-between"><p class="lbl" style="margin:0">ملف المعلم</p><button class="back" type="button" id="ddHome">→ الواحات</button></div><p class="note">استورد ملف الطالب الذي أرسله ولي الأمر، واستمع، واضغط الكلمات الخاطئة، واكتب أو سجّل ملاحظتك، ثم اعتمد أو اطلب التصحيح، وصدّر الملف لولي الأمر.</p><div id="ddRec" class="queue"></div>`;
    C.querySelector('#ddHome').addEventListener('click', () => { TEACHER = false; go('home'); }); renderReview($('ddRec'), true); return; }
  const tabs = [['today','سطر اليوم'],['progress','التقدّم'],['rec','التسجيلات'],['gift','الهدايا'],['amal','اعمل به'],['voice','صوت الرفيق'],['kidset','واجهة الطفل'],['tri','ثلاث لغات'],['week','تقرير الجمعة'],['write','الكتابات'],['kq','أسئلة الأبناء']];
  C.innerHTML = `<div class="row" style="justify-content:space-between"><p class="lbl" style="margin:0">لوحة ولي الأمر — ${avatarHtml(K(), 28)} ${esc(K().name)} (${K().age} سنوات)</p><button class="back" type="button" id="ddHome">→ واحتي</button></div>
   <div class="chips" id="ddTabs">${tabs.map(([k, l]) => `<button class="chip2" type="button" data-k="${k}" aria-pressed="${k === ddTab}">${l}</button>`).join('')}</div><div id="ddBody" style="display:flex;flex-direction:column;gap:10px"></div>`;
  C.querySelector('#ddHome').addEventListener('click', () => { LIB = false; go('home'); });
  C.querySelector('#ddTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; ddTab = b.dataset.k; renderDad(); });
  const B = C.querySelector('#ddBody');
  if (ddTab === 'today'){ renderTodayLine(B); }
  else if (ddTab === 'progress'){
    const queue = store.get(`queue:${kid}`, []); const hist = store.get(`tests:${kid}`, []);
    const rows = Object.keys(GNAME).map(g => { const s = gstats(g); return s.seen ? `<tr><td>${GNAME[g]}</td><td>${s.mastered}</td><td>${s.seen}</td><td>${s.wrong}</td></tr>` : ''; }).join('');
    const hard = Object.keys(GNAME).flatMap(g => seen(g).map(id => ({g, id, m: mget(g, id)}))).filter(x => x.m.wrong >= 2 && !mastered(x.g, x.id)).sort((a, b) => b.m.wrong - a.m.wrong).slice(0, 10);
    const tlog = store.get(`tripLog:${kid}`, []);
    const tlHtml = tlog.length ? `<p class="lbl">آخر الرحلات</p>${tlog.slice(0, 7).map(L => `<details class="qi"><summary style="cursor:pointer"><b>${esc(L.date)}</b>${L.extra ? ' (إضافية)' : ''} · تعلّم ${L.learned.length} · أصاب ${L.ok.length} · أخطأ ${L.wrong.length} · سجّل ${L.rec.length}</summary>${L.learned.length ? `<p class="note" style="margin:4px 0"><b>تعلّم:</b> ${L.learned.map(esc).join(' · ')}</p>` : ''}${L.wrong.length ? `<p class="note" style="margin:4px 0;color:var(--date)"><b>أخطأ:</b> ${L.wrong.map(esc).join(' · ')}</p>` : ''}${L.ok.length ? `<p class="note" style="margin:4px 0"><b>أصاب:</b> ${L.ok.map(esc).join(' · ')}</p>` : ''}${L.rec.length ? `<p class="note" style="margin:4px 0"><b>سجّل:</b> ${L.rec.map(esc).join(' · ')}</p>` : ''}</details>`).join('')}` : '';
    B.innerHTML = measureHTML(kid) + tlHtml + `<p class="note">«متقن» = أجاب صحيحًا مرتين متتاليتين. الخطأ يُرجع السؤال إلى الصفر ويجعله يتكرر أكثر. المتقَن يعود في «مراجعة اليوم» بعد 1 ثم 3 ثم 7 ثم 21 ثم 45 يومًا. اختبار القافلة يسأل عن المتقَن فقط، بلا تلميح.</p>
     ${(() => { const pl = store.get(`placement:${kid}`, null); return `<p class="lbl">تحديد المستوى: ${pl ? `${pl.ok}/${pl.n} في ${esc(pl.date)} — المستوى ${pl.level} (سهل ${pl.byL[0] ? pl.byL[0].join('/') : '—'} · أوسط ${pl.byL[1] ? pl.byL[1].join('/') : '—'} · أصعب ${pl.byL[2] ? pl.byL[2].join('/') : '—'})` : 'لم يُجرَ بعد'} <button class="btn ghost sm" type="button" id="ddPlace">${pl ? 'أعده' : 'أجرِه'}</button></p>`; })()}
     <p class="lbl">المراحل: ${stagesDoneCount()} من ${STAGES.length} · أيام متتالية: ${dayStreak()} · مستحق للمراجعة اليوم: ${dueCount()} (راجع ${store.get(`rvDone:${kid}`, 0)}) · الاختبارات: ${hist.filter(h => h.pass).length ? 'نجح في ' + [...new Set(hist.filter(h => h.pass).map(h => h.n))].join('، ') : 'لم ينجح بعد'} (${hist.length} محاولة)</p>
     <div class="tablewrap"><table class="dash"><tr><th>اللعبة</th><th>متقن</th><th>جرّب</th><th>يتعثر</th></tr>${rows || '<tr><td colspan="4">لم يلعب بعد.</td></tr>'}</table></div>
     <p class="lbl">الأصعب عليه (أخطأ مرتين فأكثر)</p>${hard.length ? `<ul style="margin:0;padding-right:1.2em">${hard.map(x => `<li>${esc(describe(x.g, x.id))} <span class="ref">(${x.m.wrong} أخطاء)</span></li>`).join('')}</ul>` : '<p class="note">لا شيء بعد.</p>'}
     <details><summary class="note" style="cursor:pointer">إعادة ضبط تقدّم ${esc(K().name)} كله</summary><div class="btns" style="justify-content:flex-start"><button class="btn warm sm" type="button" id="ddReset">امسح تقدّم هذا الطفل</button></div></details>`;
    B.querySelector('#ddReset').addEventListener('click', e => { const b = e.target; if (!b.dataset.c){ b.dataset.c = '1'; b.textContent = 'متأكد؟ اضغط مرة أخرى'; return; }
      store.keys().forEach(k => { if (new RegExp(`^[A-Za-z]+:${kid}(:|$)`).test(k)) store.del(k); }); ['tri','kq','kqa'].forEach(n => { const a = store.get(n, null); if (Array.isArray(a)) store.set(n, a.filter(x => x.kid !== kid)); });
      resetGames(); renderGrove(); renderPalm(); renderDad(); });
    const pb = B.querySelector('#ddPlace'); if (pb) pb.addEventListener('click', () => { store.set(`placeSkip:${kid}`, false); go('place', 'plCard'); });
  } else if (ddTab === 'rec'){ B.innerHTML = '<p class="note">استمع، واضغط الكلمة التي أخطأ فيها، واكتب أو سجّل ملاحظة، ثم اعتمد أو اطلب التصحيح. المعتمد يفتح له «سلّة التمر»، ويدخل «إذاعة الواحة». ولتسمعه العائلة في «إذاعة الباكورة» أو يضعه في مجلّة: «ركن وليّ الأمر» ← «من الواحة والحسنية».</p><div id="ddRec" class="queue"></div>'; renderReview(B.querySelector('#ddRec'), false); }
  else if (ddTab === 'gift'){ renderGiftRequests(B); }
  else if (ddTab === 'amal'){ renderAmalPanel(B); }
  else if (ddTab === 'tri'){ renderTriPanel(B); }
  else if (ddTab === 'week'){ renderWeekPanel(B); }
  else if (ddTab === 'voice'){ renderVoiceStudio(B); }
  else if (ddTab === 'kidset'){ const c = cmpGet(); B.innerHTML = `<p class="note">واجهة ${esc(K().name)} البسيطة: شاشة بزر «رحلة اليوم»، ورفيق يتكلم. «كل الواحات» تظهر لمن عمره 9 فأكثر، ويمكنك فتحها للأصغر.</p>
     <label class="row" style="gap:8px"><input type="checkbox" id="ksMode" ${kidMode() ? 'checked' : ''}> الواجهة البسيطة للطفل</label>
     <label class="row" style="gap:8px"><input type="checkbox" id="ksLib" ${store.get(`libOpen:${kid}`, false) ? 'checked' : ''}> أظهر «كل الواحات» و«كنوز البيان» حتى لو كان صغيرًا</label>
     <label class="row" style="gap:8px"><input type="checkbox" id="ksMute" ${store.get('mute', false) ? 'checked' : ''}> اكتم صوت القارئ الآلي (تبقى تسجيلاتك)</label>
     <label class="row" style="gap:8px"><input type="checkbox" id="ksAi" ${store.get('aiAllowed', false) ? 'checked' : ''}> اسمح بمساعد الواحة (يرسل نص الطفل وعمره إلى النموذج للتصحيح؛ في صفحة Claude فقط)</label>
     <p class="note">الرفيق: ${c ? esc(c.name) + ' (' + esc((CMPS[c.kind] || {}).name || '') + ')' : 'لم يُختر بعد'} <button class="btn ghost sm" type="button" id="ksReset">أعد أول لقاء</button></p>
     <p class="lbl">نسخة احتياطية من تقدّم الأطفال كلهم</p><p class="note">تشمل الإتقان والمراحل والرحلات والزينة والإعدادات (لا التسجيلات الصوتية؛ لها تصديرها في تبويب التسجيلات). خذها قبل تغيير الجهاز أو حذف التطبيق.</p>
     <div class="btns" style="justify-content:flex-start"><button class="btn sm" type="button" id="ksBackup">صدّر نسخة احتياطية</button><label class="btn ghost sm" style="cursor:pointer">استورد نسخة <input type="file" id="ksRestore" accept=".json,application/json" hidden></label></div><p class="fb" id="ksFb"></p>`;
    B.querySelector('#ksMode').addEventListener('change', e => store.set(`kidMode:${kid}`, e.target.checked));
    B.querySelector('#ksLib').addEventListener('change', e => store.set(`libOpen:${kid}`, e.target.checked));
    B.querySelector('#ksMute').addEventListener('change', e => store.set('mute', e.target.checked));
    B.querySelector('#ksAi').addEventListener('change', e => { store.set('aiAllowed', e.target.checked); document.querySelectorAll('.aiBtn').forEach(b => b.hidden = !(SAMPLE && e.target.checked)); });
    B.querySelector('#ksBackup').addEventListener('click', () => { const out = {app: 'waha', v: 1, date: today(), data: {}}; store.keys().forEach(k => { if (!/^(trip|greeted|dailyPick|amalPick):/.test(k)) out.data[k] = store.get(k, null); }); saveFile(`waha-backup-${today()}.json`, JSON.stringify(out), $('ksFb')); });
    B.querySelector('#ksRestore').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const o = JSON.parse(await f.text()); if (!o || o.app !== 'waha' || !o.data) throw new Error('bad'); const n = Object.keys(o.data).length; if (!confirm(`استيراد ${n} مفتاحًا من نسخة ${o.date || ''}؟ سيحلّ محل ما على هذا الجهاز.`)) return; Object.keys(o.data).forEach(k => store.set(k, o.data[k])); $('ksFb').textContent = 'استُوردت النسخة. أعد تحميل الصفحة.'; $('ksFb').className = 'fb ok'; setTimeout(() => location.reload(), 1200); } catch (err) { $('ksFb').textContent = 'الملف ليس نسخة احتياطية من الواحة.'; $('ksFb').className = 'fb bad'; } });
    B.querySelector('#ksReset').addEventListener('click', () => { store.del ? store.del(`cmp:${kid}`) : store.set(`cmp:${kid}`, null); store.set(`planted:${kid}`, false); renderDad(); }); }
  else if (ddTab === 'write'){
    const queue = store.get(`queue:${kid}`, []); B.innerHTML = '<p class="note">رسائله وأخباره، وتقييم مساعد الواحة إن وُجد. راجع معه خطأً واحدًا.</p><div class="queue" id="ddQ"></div>'; const Q = B.querySelector('#ddQ'); if (!queue.length) Q.innerHTML = '<p class="note">لم يرسل شيئًا بعد.</p>';
    queue.forEach(q => { const d = el('div','qi', `<div class="row" style="justify-content:space-between"><span><span class="chip">${esc(q.kind)}</span> ${esc(q.title || '')} <span class="ref">${esc(q.date)}</span></span>${q.reviewed ? '<span class="badge ok">راجعتُه</span>' : ''}</div><p class="tx">${esc(q.text)}</p>`);
      if (q.ai) d.appendChild(aiCard(q.ai)); if (!q.reviewed){ const b = el('button','btn ghost sm','راجعتُه'); b.type='button'; b.style.alignSelf='flex-start'; b.addEventListener('click', () => { q.reviewed = true; store.set(`queue:${kid}`, queue); renderDad(); }); d.appendChild(b); } Q.appendChild(d); });
  } else if (ddTab === 'kq'){
    const pend = store.get('kq', []); const appr = store.get('kqa', []); B.innerHTML = `<p class="note">أسئلة ألّفها الأبناء. ما تجيزه يظهر لإخوتهم في «أسئلة الإخوة»، ويفتح لصاحبه الطائرة الورقية بعد ثلاثة.</p><div class="queue" id="ddK"></div>${appr.length ? `<p class="lbl">المجازة (${appr.length})</p><ul style="margin:0;padding-right:1.2em">${appr.map(q => `<li>${esc((kids[q.kid] || {}).name || '')}: ${esc(q.q)} ← ${esc(q.a)}</li>`).join('')}</ul>` : ''}`;
    const Kq = B.querySelector('#ddK'); if (!pend.length) Kq.innerHTML = '<p class="note">لا أسئلة بانتظارك.</p>';
    pend.forEach(q => { const d = el('div','qi', `<p style="margin:0"><b>${esc((kids[q.kid] || {}).name || '')}</b>: ${esc(q.q)}</p><p class="note">✓ ${esc(q.a)} · ✗ ${esc(q.wrong.join('، '))}${q.src ? ' · المصدر: ' + esc(q.src) : ''}</p>`);
      const row = el('div','btns'); row.style.justifyContent = 'flex-start'; const ok = el('button','btn sm','أجِز'); ok.type='button'; const no = el('button','btn ghost sm','احذف'); no.type='button';
      ok.addEventListener('click', () => { store.set('kq', pend.filter(x => x.id !== q.id)); store.set('kqa', [...appr, q]); renderDad(); checkStages(); }); no.addEventListener('click', () => { store.set('kq', pend.filter(x => x.id !== q.id)); renderDad(); });
      row.append(ok, no); d.appendChild(row); Kq.appendChild(d); });
  }
}
/* «سطر اليوم»: لكل طفل سطر واحد — رحلة اليوم، وما أخطأ فيه، وآخر ما قاله بصوته — ورسالة منك إليه بصوتك أو بكلمة */
async function renderTodayLine(B){
  B.innerHTML = '<p class="note">كل الأطفال في شاشة واحدة. اسمع ما قالوه اليوم، وأرسل لكل واحد كلمة أو صوتك: يسمعها من رفيقه عند فتح واحته.</p>';
  const all = await recAll(); const td = today();
  /* ما ينتظر اعتمادك في القسمين: تسجيلات الواحة، وأعمال الاستوديو في «كنوز البيان» */
  { const recP = all.filter(r => r.status === 'pending' && r.source !== 'import' && r.kid >= 0).length; let works = 0; try { works = (JSON.parse(localStorage.getItem('kb-works-v1') || '[]') || []).filter(w => w && w.status === 'sent').length; } catch (e) {}
    if (recP || works){ const w = el('div','qi'); w.innerHTML = `<p class="lbl" style="margin:0 0 6px">بانتظار اعتمادك</p>`; const r = el('div','row'); r.style.cssText = 'gap:8px;flex-wrap:wrap';
      if (recP){ const b1 = el('button','btn ghost sm', `🎙 ${recP} ${recP === 1 ? 'تسجيل' : recP === 2 ? 'تسجيلان' : 'تسجيلات'} في الواحة`); b1.type = 'button'; b1.addEventListener('click', () => { ddTab = 'rec'; renderDad(); }); r.appendChild(b1); }
      if (works){ const b2 = el('a','btn ghost sm', `💎 ${works} ${works === 1 ? 'عمل' : works === 2 ? 'عملان' : 'أعمال'} في «كنوز البيان»`); b2.href = 'kunuz/index.html#parent'; r.appendChild(b2); }
      w.appendChild(r); B.appendChild(w); } }
  kids.forEach((k, i) => {
    const log = store.get(`tripLog:${i}`, []).find(L => L.date === td && !L.extra); const doneToday = !!log; const recs = all.filter(r => r.kid === i && r.date === td && ['أخبرني', 'جملة', 'كلمة', 'رأيتُها اليوم'].includes(r.kind)).sort((a, b) => b.id.localeCompare(a.id));
    const wrong = doneToday ? log.wrong : []; const bag = store.get(`bag:${i}`, []).filter(w => w.day === dayN()).map(w => w.w);
    const d = el('div','qi'); d.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center"><span>${avatarHtml(k, 28)} <b>${esc(k.name)}</b> ${doneToday ? '<span class="badge ok">رحلة اليوم ✓</span>' : (k.gender === 'f' ? '<span class="badge wait">لم ترحل اليوم</span>' : '<span class="badge wait">لم يرحل اليوم</span>')}</span><span class="ref">🔥 ${(() => { const kk = kid; kid = i; const n = dayStreak(); kid = kk; return n; })()} يوم</span></div>
      ${doneToday ? `<p class="note" style="margin:4px 0">${k.gender === 'f' ? 'تعلّمت' : 'تعلّم'}: ${bag.length ? bag.map(esc).join('، ') : (log.learned.length ? log.learned.length + ' دروس' : '—')} · ${k.gender === 'f' ? 'أصابت' : 'أصاب'} ${log.ok.length} · ${wrong.length ? `<span style="color:var(--date)">${k.gender === 'f' ? 'أخطأت' : 'أخطأ'} في: ${wrong.map(esc).join(' · ')}</span>` : 'بلا أخطاء'}</p>` : ''}`;
    { const sl = secLine(i, 0, k); if (sl){ const p2 = el('p','note'); p2.style.margin = '2px 0 4px'; p2.textContent = sl; d.appendChild(p2); } }
    recs.slice(0, 3).forEach(r => { const row = el('div','row'); row.style.alignItems = 'center'; row.innerHTML = `<span class="chip">${esc(r.kind)}</span> <span class="note">${esc(r.text).slice(0, 70)}</span>`; const m = mediaEl(r); if (m.tagName === 'AUDIO'){ m.style.width = '160px'; } row.appendChild(m); d.appendChild(row); });
    const mrow = el('div','row'); mrow.style.cssText = 'align-items:center;flex-wrap:wrap;gap:6px'; const tx = el('input','f'); tx.placeholder = k.gender === 'f' ? 'كلمة لها (تُقرأ بصوت الرفيق)' : 'كلمة له (تُقرأ بصوت الرفيق)'; tx.style.cssText = 'flex:1 1 100%;min-width:100%'; const sendT = el('button','btn ghost sm','أرسل الكلمة'); sendT.type = 'button'; const mic = el('button','btn sm','🎙 سجّل رسالة بصوتك'); mic.type = 'button'; const mb = el('div'); const fb = el('p','fb');
    sendT.addEventListener('click', async () => { const t = tx.value.trim(); if (!t) return; await recPut({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid: -1, to: i, kind: 'من أبي', ref: td, text: t, date: td, type: '', blob: null, status: 'approved', notes: [], source: 'local', heard: false}); tx.value = ''; fb.textContent = `أُرسلت إلى ${k.name}؛ ${k.gender === 'f' ? 'تسمعها عند فتح واحتها' : 'يسمعها عند فتح واحته'}.`; fb.className = 'fb ok'; });
    mic.addEventListener('click', () => { if (mb.childElementCount){ mb.innerHTML = ''; return; } micWidget(mb, {label: 'اضغط وسجّل رسالتك', max: 60000, onSaved: async blob => { await recPut({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid: -1, to: i, kind: 'من أبي', ref: td, text: tx.value.trim(), date: td, type: blob.type || 'audio/webm', blob, status: 'approved', notes: [], source: 'local', heard: false}); fb.textContent = `أُرسلت رسالتك الصوتية إلى ${k.name}.`; fb.className = 'fb ok'; }}); });
    mrow.append(tx, sendT, mic); d.append(mrow, mb, fb); B.appendChild(d);
  });
}
INIT.dad = renderDad;

/* ================= مساعد الواحة: تصحيح الكتابة بسؤال Claude (إن سمح به الأب) ================= */
let SAMPLE = undefined;
(async () => { try { SAMPLE = (window.claude && window.claude.use) ? await window.claude.use('sample') : null; } catch (e) { SAMPLE = null; } document.querySelectorAll('.aiBtn').forEach(b => b.hidden = !(SAMPLE && store.get('aiAllowed', false))); })();
function aiCard(r){ const d = el('div','ai'); d.innerHTML = `<span class="h">مساعد الواحة · ${['لم أفهم النص', 'فيه أخطاء عدة', 'فيه خطأ بسيط', 'لا أخطاء'][Math.max(0, Math.min(3, +r.score || 0))]}</span><p style="margin:0">${esc(r.praise || '')}</p>` + (Array.isArray(r.fixes) && r.fixes.length ? `<ul>${r.fixes.map(f => `<li class="fix"><b>${esc(f.wrong || '')}</b> ← <b>${esc(f.right || '')}</b>${f.why ? `: ${esc(f.why)}` : ''}</li>`).join('')}</ul>` : '') + (r.better ? `<details><summary class="note" style="cursor:pointer">صيغة أحسن</summary><p class="tx" style="font-family:var(--f-q);font-size:1.15rem;margin:4px 0 0">${esc(r.better)}</p></details>` : '') + '<span class="note">تقييم آلي؛ أبوك يراجعه.</span>'; return d; }
async function aiFeedback(btn, out, kind, text, ctx, title, qkind){
  if (!SAMPLE || !store.get('aiAllowed', false)){ out.innerHTML = '<p class="note">مساعد الواحة غير مفعّل؛ يفعّله ولي الأمر من لوحته.</p>'; return; } if (!text.trim()) return; btn.disabled = true; out.innerHTML = '<p class="note">مساعد الواحة يقرأ…</p>';
  const prompt = `أنت معلّم لغة عربية ⟨لطفل|لطفلة⟩ ⟨عمره|عمرها⟩ ${K().age} سنوات، ⟨لغته|لغتها⟩ الأم الصينية ثم الإنجليزية، والعربية ⟨لغته|لغتها⟩ الثالثة؛ ⟨يقرأ|تقرأ⟩ ⟨وينطق|وتنطق⟩ ممتازًا ⟨لكنه|لكنها⟩ ⟨ضعيف|ضعيفة⟩ في الكتابة والثروة اللغوية. ⟨كتب|كتبت⟩ ⟨الطفل|الطفلة⟩ ${kind}:\n«${text.trim().slice(0, 1500)}»\n${ctx}\nقيّم بصدق ولطف، وصحّح الإملاء والنحو والتذكير والتأنيث وحروف الجر، ولا تخترع أخطاء. أعد JSON فقط بهذا الشكل:\n{"score": 3, "praise": "جملة تشجيع قصيرة صادقة", "fixes": [{"wrong": "الكلمة أو العبارة الخاطئة كما ⟨كتبها|كتبتها⟩", "right": "الصواب", "why": "سبب قصير جدًا بلغة طفل"}], "better": "النص كله مكتوبًا صحيحًا بلغة بسيطة مشكولة قليلًا"}\nالمعنى: score 3 = لا أخطاء، 2 = خطأ بسيط واحد أو اثنان، 1 = أخطاء عدة، 0 = غير مفهوم. حدّ fixes بأهم ثلاثة. إن لم يكن خطأ فاجعل fixes مصفوفة فارغة.`;
  try { const r = await SAMPLE.json(prompt, {modelTier:'default', effort:'low', cache:false}); out.innerHTML = ''; out.appendChild(aiCard(r)); out.dataset.ai = JSON.stringify(r); queueAdd({kind: qkind || (kind.includes('خبر') ? 'خبر (مسودة)' : 'رسالة'), title, text, ai: r}); }
  catch (e) { const code = e && e.code; out.innerHTML = `<p class="note">${code === 'not_granted' || code === 'sampling_disabled' ? 'مساعد الواحة غير مسموح به على هذا الجهاز. ⟨أرِ|أرِي⟩ رسالتك لأبيك.' : code === 'rate_limited' ? 'المساعد مشغول الآن؛ ⟨حاول|حاولي⟩ بعد قليل.' : 'تعذّر التصحيح الآن؛ ⟨حاول|حاولي⟩ مرة أخرى أو ⟨أرِها|أرِيها⟩ لأبيك.'}</p>`; if (code === 'not_granted' || code === 'sampling_disabled' || code === 'not_declared') { SAMPLE = null; document.querySelectorAll('.aiBtn').forEach(b => b.hidden = true); } }
  btn.disabled = false;
}



/* ================= يوميات القافلة: مهمة اليوم ================= */
const DAILY_N = 3;
function dailyPick(){
  const key = `dailyPick:${kid}:${today()}`; let picks = store.get(key, null); if (picks) return picks;
  const games = Object.keys(GNAME).filter(g => !['rc', 'kz'].includes(g)); let weak = games.map(g => ({g, s: gstats(g)})).filter(x => x.s.wrong > 0).sort((a, b) => b.s.wrong - a.s.wrong);
  const pl = store.get(`placement:${kid}`, null); if (!weak.length && pl && pl.byG) weak = Object.keys(pl.byG).filter(g => pl.byG[g][0] < pl.byG[g][1] && games.includes(g)).sort((a, b) => (pl.byG[a][0] / pl.byG[a][1]) - (pl.byG[b][0] / pl.byG[b][1])).map(g => ({g}));
  const ns = nextStage(); const chosen = [];
  if (weak[0]) chosen.push(weak[0].g);
  if (ns && ns.g && !chosen.includes(ns.g)) chosen.push(ns.g);
  const rest = shuffle(games.filter(g => !chosen.includes(g) && Object.values(OASES).some(o => o.games.includes(g))));
  while (chosen.length < 3 && rest.length) chosen.push(rest.shift());
  picks = chosen.map(g => { const o = OASES.find(x => x.games.includes(g)); const st = STAGES.find(x => x.g === g); return {g, o: o ? o.id : 'roots', t: st ? st.t : (o ? o.tabs[0][0] : 'oasis')}; });
  store.set(key, picks); return picks;
}
function dayStreak(){ let n = 0; const d = new Date(); for (let i = 0; i < 60; i++){ const k = `dailyDone:${kid}:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (store.get(k, false)) n++; else if (i > 0) break; d.setDate(d.getDate() - 1); } return n; }
function renderDaily(){
  const box = $('daily'); const picks = dailyPick(); const d = store.get(`day:${kid}:${today()}`, {}); const done = picks.map(p => (d[p.g] || 0) >= DAILY_N);
  if (done.every(Boolean)) store.set(`dailyDone:${kid}:${today()}`, true);
  const streak = dayStreak(); const due = dueCount(); const rvToday = store.get(`rvDay:${kid}:${today()}`, 0);
  box.innerHTML = `<div class="row" style="justify-content:space-between"><span class="lbl">مهمة اليوم: ثلاث دقائق</span><span class="note">${streak ? `${streak} ${streak === 1 ? 'يوم' : streak === 2 ? 'يومان' : 'أيام'} متتالية ${'☀️'.repeat(Math.min(streak, 5))}` : '⟨ابدأ|ابدئي⟩ سلسلة أيامك'}</span></div>
   <div class="chips" id="dailyChips">${picks.map((p, i) => `<button class="chip2" type="button" data-i="${i}" aria-pressed="${done[i]}">${done[i] ? '✓ ' : ''}${GNAME[p.g]} <span class="ref">${Math.min(d[p.g] || 0, DAILY_N)}/${DAILY_N}</span></button>`).join('')}</div>
   ${(due || rvToday) ? `<div class="chips" style="margin-top:6px"><button class="chip2" type="button" id="dailyRv" aria-pressed="${!due}">${due ? '🔁 مراجعة اليوم' : '✓ ⟨راجعتَ|راجعتِ⟩ ما استُحق اليوم'} ${due ? `<span class="ref">${due} مستحقة</span>` : ''}</button></div>` : ''}
   <p class="note" style="margin-top:6px">${done.every(Boolean) ? '⟨أنهيتَ|أنهيتِ⟩ مهمة اليوم. ما زاد فهو زيادة في واحتك.' : 'ثلاثة أسئلة في كل لعبة، ثم ⟨تكون|تكونين⟩ قد ⟨أنجزتَ|أنجزتِ⟩ يومك.'}</p>`;
  box.querySelector('#dailyChips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const p = picks[+b.dataset.i]; go(p.o, p.t); });
  const rv = box.querySelector('#dailyRv'); if (rv) rv.addEventListener('click', () => go('review', 'rvCard'));
  if (typeof renderAmalDaily === 'function') renderAmalDaily();
}

/* ================= مجلس العائلة ================= */
function renderFamily(){
  const L = $('sfList'); L.innerHTML = ''; const all = [];
  kids.forEach((k, i) => { store.get(`paper:${i}`, []).forEach(n => all.push({kind:'خبر', who:k, title:n.title, text:n.text, date:n.date})); store.get(`queue:${i}`, []).filter(q => q.kind === 'رسالة').forEach(q => all.push({kind:'رسالة', who:k, title:q.title, text:q.text, date:q.date})); });
  if (!all.length){ L.appendChild(el('div','card', '<p class="note">لم ينشر أحدٌ شيئًا بعد. أول خبرٍ أو رسالة تظهر هنا للجميع.</p>')); return; }
  all.forEach(n => { const d = el('div','paper', `<div class="row" style="justify-content:space-between"><span>${avatarHtml(n.who, 28)} <b>${esc(n.who.name)}</b> <span class="chip">${n.kind}</span></span><span class="meta">${esc(n.date || '')}</span></div><h3>${esc(n.title || '')}</h3><p>${esc(n.text)}</p>`); L.appendChild(d); });
}
INIT.sfFamily = renderFamily;

/* ================= الطفل معلمًا: أسئلة الإخوة ================= */
function renderAsk(){ const M = $('kqMine'); const mine = store.get('kq', []).filter(q => q.kid === kid); const appr = store.get('kqa', []).filter(q => q.kid === kid);
  M.innerHTML = (appr.length ? `<p class="lbl">أسئلتك المجازة (${appr.length})</p>` + appr.map(q => `<p style="margin:0">✓ ${esc(q.q)} <span class="ref">← ${esc(q.a)}</span></p>`).join('') : '') + (mine.length ? `<p class="lbl" style="margin-top:8px">بانتظار ولي الأمر (${mine.length})</p>` + mine.map(q => `<p style="margin:0" class="note">${esc(q.q)}</p>`).join('') : ''); }
$('kqSend').addEventListener('click', () => { const q = $('kqQ').value.trim(), a = $('kqA').value.trim(), w1 = $('kqW1').value.trim(), w2 = $('kqW2').value.trim();
  if (!q || !a || !w1 || !w2){ $('kqFb').textContent = '⟨اكتب|اكتبي⟩ السؤال والجواب الصحيح وجوابين خاطئين.'; $('kqFb').className = 'fb bad'; return; }
  if (new Set([a, w1, w2]).size < 3){ $('kqFb').textContent = 'الأجوبة الثلاثة يجب أن تختلف.'; $('kqFb').className = 'fb bad'; return; }
  const list = store.get('kq', []); list.push({id: Date.now().toString(36), kid, q, a, wrong:[w1, w2], src:$('kqSrc').value.trim(), date: today()}); store.set('kq', list);
  ['kqQ','kqA','kqW1','kqW2','kqSrc'].forEach(id => $(id).value = ''); $('kqFb').textContent = 'أُرسل سؤالك إلى ولي الأمر. إذا أجازه ظهر لإخوتك.'; $('kqFb').className = 'fb ok'; renderAsk(); });
INIT.wsAsk = renderAsk;
let sbCur = null;
function sbNext(){ const pool = store.get('kqa', []); $('sbFb').textContent = ''; $('sbFb').className = 'fb'; $('sbWhy').hidden = true;
  if (!pool.length){ sbCur = null; $('sbQ').textContent = 'لا أسئلة مجازة بعد. ⟨اكتب|اكتبي⟩ ⟨أنت|أنتِ⟩ سؤالًا في «⟨اكتب|اكتبي⟩ سؤالًا»!'; $('sbOpts').innerHTML = ''; return; }
  sbCur = pickW('kq', pool, x => x.id, sbCur && sbCur.id); const who = kids[sbCur.kid]; $('sbQ').innerHTML = `${esc(sbCur.q)} <span class="ref">— سؤال ${esc(who ? who.name : 'أحد الإخوة')}</span>`;
  mcq($('sbOpts'), [sbCur.a, ...sbCur.wrong], sbCur.a, ok => { feedback('sbFb', ok, 'أصبت.', `الجواب: ${sbCur.a}`); if (sbCur.src){ $('sbWhy').innerHTML = `<p class="note">المصدر: ${esc(sbCur.src)}</p>`; $('sbWhy').hidden = false; } award('kq', sbCur.id, ok); }, 'm'); }
$('sbNext').addEventListener('click', sbNext);
INIT.wsSib = () => { if (!sbCur) sbNext(); };

/* ================= المتون: تسميع بيتًا بيتًا ================= */
const MTK = Object.keys(MT);
let mtKey = store.get('mtKey', MTK[0] || ''), mtCur = null;
function mtChips(boxId, onPick){ const C = $(boxId); C.innerHTML = ''; MTK.forEach(k => { const b = el('button','chip2', MT[k].name); b.type='button'; b.setAttribute('aria-pressed', k === mtKey); b.addEventListener('click', () => { mtKey = k; store.set('mtKey', k); onPick(); }); C.appendChild(b); }); }
const mtId = v => `${mtKey}|${v.n}`;
function mtNext(){
  const vs = MT[mtKey].verses; mtCur = pickW('mtn', vs, mtId, mtCur && mtId(mtCur)); const last = lastWord(mtCur.b);
  $('mtQ').textContent = `${mtCur.a} ۞ ${mtCur.b.replace(/\S+\s*$/, '……')}`; $('mtRef').textContent = `${MT[mtKey].name} · البيت ${mtCur.n}${mtCur.bab ? ' · ' + mtCur.bab : ''}`; $('mtFb').textContent = ''; $('mtFb').className = 'fb'; $('mtWhy').hidden = true;
  typeBox($('mtBox'), last, {id:'mtIn', placeholder:'الكلمة الأخيرة', onDone: st => { feedback('mtFb', st, 'أصبت.', `الكلمة: ${last}`, `قريب! الكلمة: ${last} (${NEAR_WHY($('mtIn').value, last)})`);
    $('mtWhy').innerHTML = `<p class="q s" style="text-align:center">${esc(mtCur.a)} ۞ ${esc(mtCur.b)}</p>`; $('mtWhy').hidden = false; award('mtn', mtId(mtCur), st === 'ok' ? true : st === 'near' ? null : false); }});
}
$('mtNext').addEventListener('click', mtNext);
$('mtRec').addEventListener('click', () => { if (mtCur) recordFrom('متن', `${MT[mtKey].name} ${mtCur.n}`, `${mtCur.a} ۞ ${mtCur.b}`); });
INIT.mtRecite = () => { mtChips('mtChips', () => { mtCur = null; mtNext(); }); if (!mtCur) mtNext(); };
function renderMatnRead(){ mtChips('mrChips', renderMatnRead); const L = $('mrList'); L.innerHTML = `<p class="lbl" style="margin:0">${MT[mtKey].name} ${mtKey === 'ajurrumiyya' ? '<span class="ref">(طبعة جدّو/الحكمي، 1428هـ، بحواشيها)</span>' : '<span class="draft">(نُقل من مصدره، يُراجع)</span>'}</p>`; let bab = null;
  MT[mtKey].verses.forEach(v => { if (v.bab && v.bab !== bab){ bab = v.bab; L.appendChild(el('p','lbl', esc(bab))).style.margin = '10px 0 2px'; } const m = mastered('mtn', `${mtKey}|${v.n}`);
    const p = el('div','bt', `<span>${esc(v.a)}</span><span>${esc(v.b)} <span class="ref">${v.n}${m ? ' ✓' : ''}</span></span>`); p.style.cssText = 'font-family:var(--f-q);font-size:1.2rem;line-height:1.9'; L.appendChild(p);
    if (v.note){ const n = el('p','ref', `${v.n}: ${esc(v.note)}`); n.style.cssText = 'margin:0 0 4px;font-size:.85rem'; L.appendChild(n); } }); }
INIT.mtRead = renderMatnRead;
RESETS.push(() => { sbCur = mtCur = null; });

/* ================= الآجرومية نثرًا: ما المصطلح؟ + قراءة ================= */
const AJ = DATA.ajurrumiyya || {sections:[], defs:[]};
let ajCur = null, ajMode = 'game';
function ajShow(){ for (const x of $('ajMode').children) x.setAttribute('aria-pressed', x.dataset.m === ajMode); $('ajGame').hidden = ajMode !== 'game'; $('ajCnt').hidden = ajMode !== 'cnt'; $('ajIrb').hidden = ajMode !== 'irb'; $('ajTq').hidden = ajMode !== 'tq'; if (ajMode === 'irb' && !ibCur) ibNext(); if (ajMode === 'tq') renderTq(); $('ajRead').hidden = !['read','fadl','info'].includes(ajMode);
  if (ajMode === 'read') renderAjRead(); else if (ajMode === 'fadl') renderAjFadl(); else if (ajMode === 'info') renderAjInfo(); else if (ajMode === 'cnt'){ if (!acCur) acNext(); } else if (!ajCur) ajNext(); refreshScores(); }
$('ajMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; ajMode = b.dataset.m; ajShow(); });
/* كم عددها؟ */
let acCur = null;
function acAlts(n){ const s = new Set(); for (const d of [-2, -1, 1, 2, 3, -3]) if (n + d > 1 && s.size < 3) s.add(n + d); return [...s]; }
const nzVerse = n => { const v = (MT.ajurrumiyya || {verses:[]}).verses.find(x => x.n === n); return v ? `${v.a} ۞ ${v.b}` : ''; };
function acNext(){ const C = AJ.counts || []; if (!C.length) return; acCur = pickW('ajc', C, c => c.q, acCur && acCur.q); $('acQ').textContent = `كم ${acCur.q}؟`; $('acFb').textContent = ''; $('acFb').className = 'fb'; $('acWhy').hidden = true;
  mcq($('acOpts'), [String(acCur.n), ...acAlts(acCur.n).map(String)], String(acCur.n), ok => { feedback('acFb', ok, `أصبت: ${acCur.n}.`, `العدد: ${acCur.n}.`);
    $('acWhy').innerHTML = `<p style="margin:0"><b>${acCur.items.map(esc).join('، ')}</b></p>` + acCur.verses.map(n => `<p class="q s" style="text-align:center;margin:4px 0">${esc(nzVerse(n))} <span class="ref">${n}</span></p>`).join(''); $('acWhy').hidden = false; award('ajc', acCur.q, ok); }, 'm'); }
$('acNext').addEventListener('click', acNext);
function renderAjFadl(){ const R = $('ajRead'); R.innerHTML = `<p class="lbl" style="margin:0">في فضل النحو <span class="ref">(من تقديم طبعة نظم الآجرومية)</span></p>` + (AJ.fadl || []).map((f, i) => `<div class="card" style="margin-top:8px"><p class="lbl" style="margin:0">${esc(f.who)}</p>${f.lines.map(l => `<div class="bt" style="font-family:var(--f-q);font-size:1.15rem;line-height:1.9"><span>${esc(l[0])}</span><span>${esc(l[1])}</span></div>`).join('')}<p class="ref" style="margin:4px 0 0">${esc(f.src)}</p><div class="btns" style="justify-content:flex-start"><button class="btn ghost sm" type="button" data-fi="${i}">🎙 ⟨سجّلها|سجّليها⟩</button></div></div>`).join('') + (AJ.saying ? `<p class="mq" style="margin-top:10px">«${esc(AJ.saying.text)}» <span class="ref">${esc(AJ.saying.src)}</span></p>` : '');
  R.querySelectorAll('button[data-fi]').forEach(b => b.addEventListener('click', () => { const f = AJ.fadl[+b.dataset.fi]; recordFrom('قصيدة', `فضل النحو: ${f.who.split('،')[0].split(':')[0]}`, f.lines.map(l => `${l[0]} ۞ ${l[1]}`).join('\n')); })); }
function renderAjInfo(){ const I = AJ.info || {}; $('ajRead').innerHTML = `<p class="lbl" style="margin:0">عن المتن والنظم</p>` + ['matn','nazm','why','edition'].filter(k => I[k]).map(k => `<p style="margin:6px 0">${esc(I[k])}</p>`).join(''); }
function ajNext(){
  if (!AJ.defs.length){ $('ajQ').textContent = 'لا تعريفات.'; return; }
  ajCur = pickW('ajd', AJ.defs, d => d.term, ajCur && ajCur.term); $('ajQ').textContent = `«${ajCur.d}»`; $('ajFb').textContent = ''; $('ajFb').className = 'fb'; $('ajWhy').hidden = true;
  const done = st => { feedback('ajFb', st, 'أصبت.', `المصطلح: ${ajCur.term}`, `قريب! المصطلح: ${ajCur.term}`); const sec = AJ.sections.find(s => s.bab === ajCur.bab); $('ajWhy').innerHTML = `<p class="lbl" style="margin:0">${esc(ajCur.bab)}</p>` + (sec ? sec.paras.slice(0, 2).map(p => `<p style="margin:2px 0">${esc(p)}</p>`).join('') : ''); $('ajWhy').hidden = false; award('ajd', ajCur.term, st === 'ok' || st === true ? true : st === 'near' ? null : false); };
  if (tier() === 'big') typeBox($('ajBox'), ajCur.term, {id:'ajIn', placeholder:'المصطلح', onDone: done});
  else { const o = el('div','opts'); $('ajBox').innerHTML = ''; $('ajBox').appendChild(o); mcq(o, [ajCur.term, ...shuffle(AJ.defs.filter(d => d !== ajCur).map(d => d.term)).slice(0, 3)], ajCur.term, done, 'm'); }
}
$('ajNext').addEventListener('click', ajNext);
function renderAjRead(){ const R = $('ajRead'); R.innerHTML = `<p class="lbl" style="margin:0">${esc(AJ.name || 'المقدمة الآجرومية')} <span class="draft">(نُقل من المصدر، يُراجع)</span></p>` + AJ.sections.map(s => `<details><summary class="lbl" style="cursor:pointer;margin:8px 0 2px">${esc(s.bab)}</summary>${s.paras.map(p => `<p style="margin:4px 0;font-family:var(--f-q);font-size:1.15rem;line-height:1.9">${esc(p)}</p>`).join('')}</details>`).join(''); }
INIT.mtAjr = () => ajShow();
RESETS.push(() => { ajCur = acCur = null; });


/* ================= رفّ التسجيلات: تسجيل بمسجّل الجهاز، ومراجعة ولي الأمر/المعلم، وتصدير واستيراد ================= */
let IDB = null;
function idb(){ if (IDB) return IDB; IDB = new Promise((res, rej) => { try { const r = indexedDB.open('oasisRec', 3); r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('rec')) d.createObjectStore('rec', {keyPath:'id'}); if (!d.objectStoreNames.contains('gift')) d.createObjectStore('gift', {keyPath:'id'}); if (!d.objectStoreNames.contains('voice')) d.createObjectStore('voice', {keyPath:'id'}); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); return IDB; }
async function recAll(){ try { const d = await idb(); return await new Promise((res, rej) => { const q = d.transaction('rec').objectStore('rec').getAll(); q.onsuccess = () => res((q.result || []).map(r => recOut('rec', r)).filter(Boolean)); q.onerror = () => rej(q.error); }); } catch (e) { return []; } }
async function shiftKidIdb(){}
async function recPut(r){ const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('rec', 'readwrite'); t.objectStore('rec').put(recIn('rec', r)); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function recDel(id){ const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('rec', 'readwrite'); t.objectStore('rec').delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function recCountApproved(){ const all = await recAll(); kids.forEach((k, i) => store.set(`recApproved:${i}`, all.filter(r => r.kid === i && r.status === 'approved' && r.source !== 'import').length)); checkStages(); }
const b64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); });
function unb64(s, type){ const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], {type: type || 'audio/mpeg'}); }
const STATUS = {pending:['بانتظار المراجعة','wait'], approved:['معتمد','ok'], fix:['فيه ملاحظات','wait']};
const isQuran = r => r.kind === 'آية' || r.kind === 'صفحة';
const PRIVATE_K = new Set(['أخبرني', 'رأيتُها اليوم', 'كلمة', 'جملة', 'من أبي']);   // تسجيلات بين الطفل وأبيه: لا تُهدى ولا تُصدَّر إلى المعلم ولا تدخل الإذاعة
const giftable = r => r.status === 'approved' && (!isQuran(r) || r.approvedBy === 'المعلم') && !PRIVATE_K.has(r.kind) && !String(r.type || '').startsWith('image/');
function statusBadge(r){ if (r.status === 'approved' && isQuran(r) && r.approvedBy !== 'المعلم') return '<span class="badge wait">معتمد مبدئيًّا (القرآن يعتمده الشيخ)</span>'; return `<span class="badge ${STATUS[r.status][1]}">${STATUS[r.status][0]}</span>`; }
function mediaEl(r){ if (r && r.type && String(r.type).startsWith('image/')){ const i = document.createElement('img'); i.src = URL.createObjectURL(r.blob); i.alt = ''; i.style.cssText = 'max-width:70%;max-height:260px;border-radius:12px;display:block;margin:6px auto'; return i; } return audioEl(r.blob); }
function audioEl(blob){ const a = document.createElement('audio'); a.controls = true; a.preload = 'none'; a.style.width = '100%'; a.src = URL.createObjectURL(blob); return a; }
function wordsHtml(text, marks, clickable){ return text.split(/\s+/).map((w, i) => `<span class="${clickable ? 'tok' : ''} ${marks.includes(i) ? 'rw' : ''}" data-i="${i}" style="${marks.includes(i) ? 'background:color-mix(in srgb,var(--bad) 22%,var(--bg));border-radius:6px;padding:0 4px' : ''}">${esc(w)}</span>`).join(' '); }
function recordFrom(kind, ref, text, fromGift, opts){
  opts = opts || {}; const s = $('sheet'); s.innerHTML = `<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">🎙 ⟨سجّل|سجّلي⟩ بصوتك</h2><button class="x" aria-label="إغلاق">✕</button></div>
   <span class="chip" style="align-self:flex-start">${esc(kind)} · ${esc(ref)}</span>${opts.html || `<p class="q s">${esc(text)}</p>`}
   ${MIC_OK ? '<div id="rcMic"></div><p class="note" style="margin:0">أو ⟨أرفق|أرفقي⟩ تسجيلًا من الجهاز:</p>' : '<ol class="note" style="margin:0;padding-right:1.2em"><li>⟨اقرأ|اقرئي⟩ النص بصوتٍ عالٍ ⟨وسجّله|وسجّليه⟩ بمسجّل جهازك.</li><li>ثم ⟨اضغط|اضغطي⟩ «⟨أرفق|أرفقي⟩ التسجيل» ⟨واختر|واختاري⟩ الملف.</li></ol>'}
   <input type="file" id="rcFile" accept="audio/*" capture hidden><div class="btns"><button class="btn ${MIC_OK ? 'ghost sm' : ''}" type="button" id="rcPick">⟨أرفق|أرفقي⟩ التسجيل</button></div><div id="rcPrev"></div><p class="fb" id="rcFb"></p>`;
  showSheet(); s.querySelector('.x').addEventListener('click', () => { voiceStop(); closeSheet(); });
  const save = async f => { const r = {id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid, kidName: K().name, kind, ref, text, date: today(), type: f.type || 'audio/mpeg', blob: f, status:'pending', notes:[], source:'local', fromGift: fromGift || null, ...(opts.extra || {})};
    try { await recPut(r); if (opts.onSaved) opts.onSaved(r); $('rcFb').textContent = 'حُفظ التسجيل في رفّك، وسيراه ولي الأمر.'; $('rcFb').className = 'fb ok'; $('rcPick').textContent = '⟨أرفق|أرفقي⟩ تسجيلًا آخر'; return true; }
    catch (err) { $('rcFb').textContent = 'تعذّر الحفظ على هذا الجهاز.'; $('rcFb').className = 'fb bad'; return false; } };
  if (MIC_OK && typeof micWidget === 'function') micWidget($('rcMic'), {label: '⟨اضغط|اضغطي⟩ ⟨وسجّل|وسجّلي⟩', max: 180000, onSaved: save});
  $('rcPick').addEventListener('click', () => $('rcFile').click());
  $('rcFile').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; if (await save(f)){ $('rcPrev').innerHTML = ''; $('rcPrev').appendChild(audioEl(f)); } });
}
let rsFilter = 'all';
$('rsFilter').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; rsFilter = b.dataset.f; for (const x of $('rsFilter').children) x.setAttribute('aria-pressed', x === b); renderShelf(); });
$('rsNew').addEventListener('click', () => recordFrom('نص حر', 'من اختياري', '⟨اقرأ|اقرئي⟩ أي نصٍّ ⟨تحفظه|تحفظينه⟩: آية، أو حديثًا، أو بيتًا، أو مثلًا.'));
async function renderShelf(){
  if (typeof mushafRecount === 'function') mushafRecount();
  const L = $('rsList'); L.innerHTML = '<p class="note">…</p>'; const all = (await recAll()).filter(r => r.kid === kid && r.source !== 'import').sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id));
  const list = all.filter(r => rsFilter === 'all' || r.status === rsFilter); L.innerHTML = '';
  if (!list.length){ L.innerHTML = `<p class="note">${all.length ? 'لا شيء في هذه الحالة.' : 'لا تسجيلات بعد. في كل آية وحديث وبيت زرُّ 🎙، أو ⟨ابدأ|ابدئي⟩ من «تسجيل جديد».'}</p>`; return; }
  list.forEach(r => { const d = el('div','qi'); const last = r.notes[r.notes.length - 1]; const marks = last ? last.marks || [] : [];
    d.innerHTML = `<div class="row" style="justify-content:space-between"><span><span class="chip">${esc(r.kind)}</span> ${esc(r.ref)} <span class="ref">${esc(r.date)}</span></span>${statusBadge(r)}</div><p class="tx" style="font-size:1.2rem">${wordsHtml(r.text, marks, false)}</p>`;
    d.appendChild(mediaEl(r));
    r.notes.forEach(n => { const nn = el('div','ai', `<span class="h">${esc(n.by)} · ${esc(n.date || '')}</span>${n.text ? `<p style="margin:0">${esc(n.text)}</p>` : ''}${n.marks && n.marks.length ? `<p class="note">الكلمات المعلَّمة بالأحمر هي التي يطلب منك إعادتها.</p>` : ''}`); if (n.audio) nn.appendChild(audioEl(n.audio)); d.appendChild(nn); });
    const row = el('div','btns'); row.style.justifyContent = 'flex-start';
    if (r.status !== 'approved'){ const re = el('button','btn ghost sm','🎙 ⟨أعد|أعيدي⟩ التسجيل'); re.type='button'; re.addEventListener('click', () => recordFrom(r.kind, r.ref, r.text, r.fromGift, r.page ? {extra:{page:r.page, unit:r.unit}} : undefined)); row.appendChild(re); }
    if (giftable(r)){ const gb = el('button','btn sm','🎁 ⟨أهدِه|أهدِيه⟩'); gb.type='button'; gb.addEventListener('click', () => giftSheet(r)); row.appendChild(gb); }
    const del = el('button','btn ghost sm','⟨احذف|احذفي⟩'); del.type='button'; del.addEventListener('click', async () => { if (!del.dataset.c){ del.dataset.c = '1'; del.textContent = '⟨متأكد|متأكدة⟩؟'; return; } await recDel(r.id); recCountApproved(); renderShelf(); }); row.appendChild(del);
    d.appendChild(row); L.appendChild(d); });
}
INIT.recShelf = () => { renderShelf(); recCountApproved(); };
/* تصدير واستيراد */
let DL = undefined;
(async () => { try { DL = (window.claude && window.claude.use) ? await window.claude.use('downloads') : null; } catch (e) { DL = null; } })();
async function packRecords(list, type){ const items = []; for (const r of list){ if (!r.blob) continue; const notes = []; for (const n of r.notes || []) notes.push({by:n.by, text:n.text, marks:n.marks || [], date:n.date, audio: n.audio ? {type:n.audio.type, b64: await b64(n.audio)} : null}); items.push({id:r.id, kid:r.kid, kidName:r.kidName, kind:r.kind, ref:r.ref, text:r.text, date:r.date, status:r.status, approvedBy:r.approvedBy || null, type:r.type, b64: await b64(r.blob), notes}); } return JSON.stringify({v:1, app:'واحة اللسان العربي', type, exported: new Date().toISOString(), items}); }
async function saveFile(name, text, fb){ if (!DL){ /* خارج Claude (التطبيق أو المتصفح): تنزيل عادي، وفي أندرويد تُفتح قائمة المشاركة */
    try { const ext = (name.split('.').pop() || '').toLowerCase(); const type = {json:'application/json', html:'text/html', md:'text/markdown', txt:'text/plain'}[ext] || 'application/octet-stream';
      const url = URL.createObjectURL(new Blob([text], {type: type + ';charset=utf-8'})); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      fb.textContent = window.AndroidBridge ? '⟨اختر|اختاري⟩ أين ⟨تحفظ|تحفظين⟩ الملف أو إلى من ⟨ترسله|ترسلينه⟩.' : 'نُزّل الملف.'; fb.className = 'fb ok'; } catch (e) { fb.textContent = 'تعذّر حفظ الملف.'; fb.className = 'fb bad'; } return; }
  try { await DL.save({filename: name, data: text}); fb.textContent = 'حُفظ الملف. ⟨أرسله|أرسليه⟩ إلى المعلم بالبريد أو بالرسائل.'; fb.className = 'fb ok'; } catch (e) { fb.textContent = e && e.code === 'cancelled' ? '' : 'لم يُحفظ الملف.'; fb.className = 'fb bad'; } }
$('rsExport').addEventListener('click', async () => { const list = (await recAll()).filter(r => r.kid === kid && r.source !== 'import' && r.status !== 'approved' && !PRIVATE_K.has(r.kind) && !String(r.type || '').startsWith('image/')); if (!list.length){ $('rsFb').textContent = 'لا تسجيلات تحتاج مراجعة.'; $('rsFb').className = 'fb bad'; return; } $('rsFb').textContent = 'يُجهَّز الملف…'; await saveFile(`tasjilat-${K().name}-${today()}.json`, await packRecords(list, 'child-recordings'), $('rsFb')); });
$('rsImport').addEventListener('click', () => $('rsImportFile').click());
$('rsImportFile').addEventListener('change', e => importFile(e.target.files[0], $('rsFb'), false));
async function importFile(f, fb, teacher){
  if (!f) return; let pkg; try { pkg = JSON.parse(await f.text()); } catch (e) { fb.textContent = 'الملف ليس ملف تسجيلات.'; fb.className = 'fb bad'; return; }
  if (!pkg || !Array.isArray(pkg.items)){ fb.textContent = 'الملف ليس ملف تسجيلات.'; fb.className = 'fb bad'; return; }
  const all = await recAll(); const byId = Object.fromEntries(all.map(r => [r.id, r])); let n = 0;
  for (const it of pkg.items){
    const notes = (it.notes || []).map(x => ({by:x.by, text:x.text, marks:x.marks || [], date:x.date, audio: x.audio && x.audio.b64 ? unb64(x.audio.b64, x.audio.type) : null}));
    if (teacher){ if (byId[it.id] && byId[it.id].source !== 'import') continue; await recPut({...byId[it.id], id:it.id, kid:-1, kidName:it.kidName, kind:it.kind, ref:it.ref, text:it.text, date:it.date, type:it.type, blob: unb64(it.b64, it.type), status: byId[it.id] ? byId[it.id].status : it.status, notes: byId[it.id] ? byId[it.id].notes : notes, source:'import'}); n++; }
    else { const r = byId[it.id]; if (!r || r.source === 'import') continue; if (pkg.type !== 'teacher-review') continue; r.status = it.status; if (it.status === 'approved') r.approvedBy = 'المعلم'; r.notes = [...(r.notes || []).filter(x => x.by !== 'المعلم'), ...notes]; await recPut(r); n++; }
  }
  fb.textContent = n ? (teacher ? `استُوردت ${n} تسجيلات للمراجعة.` : `وصل ردّ المعلم على ${n} تسجيلات.`) : 'لم أجد في الملف ما يخص هذا الجهاز.'; fb.className = 'fb ' + (n ? 'ok' : 'bad');
  if (!teacher) { recCountApproved(); renderShelf(); } else renderReview($('ddRec'), true);
}
/* المراجعة (ولي الأمر على الجهاز نفسه، أو المعلم بعد الاستيراد) */
async function renderReview(box, teacher){
  box.innerHTML = '<p class="note">…</p>'; const all = (await recAll()).filter(r => teacher ? r.source === 'import' : (r.kid === kid && r.source !== 'import')).sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1));
  box.innerHTML = '';
  if (teacher){ const top = el('div','btns'); top.style.justifyContent = 'flex-start'; top.innerHTML = `<button class="btn" type="button" id="tcImport">استورد ملف الطالب</button><button class="btn ghost" type="button" id="tcExport">صدّر المراجعة لولي الأمر</button><input type="file" id="tcFile" accept=".json,application/json" hidden>`; box.appendChild(top); const fb = el('p','fb'); box.appendChild(fb);
    top.querySelector('#tcImport').addEventListener('click', () => top.querySelector('#tcFile').click()); top.querySelector('#tcFile').addEventListener('change', e => importFile(e.target.files[0], fb, true));
    top.querySelector('#tcExport').addEventListener('click', async () => { const list = (await recAll()).filter(r => r.source === 'import'); if (!list.length){ fb.textContent = 'لا شيء للتصدير.'; fb.className = 'fb bad'; return; } fb.textContent = 'يُجهَّز الملف…'; await saveFile(`muraja-${today()}.json`, await packRecords(list, 'teacher-review'), fb); }); }
  if (!all.length){ box.appendChild(el('p','note', teacher ? 'استورد ملف الطالب أولًا.' : 'لا تسجيلات لهذا الطفل بعد.')); return; }
  all.forEach(r => { const d = el('div','qi'); const last = r.notes[r.notes.length - 1]; let marks = last && last.by === (teacher ? 'المعلم' : 'ولي الأمر') ? [...(last.marks || [])] : [];
    d.innerHTML = `<div class="row" style="justify-content:space-between"><span>${teacher ? `<b>${esc(r.kidName || '')}</b> · ` : ''}<span class="chip">${esc(r.kind)}</span> ${esc(r.ref)} <span class="ref">${esc(r.date)}</span></span>${statusBadge(r)}</div>${isQuran(r) && !teacher ? '<p class="note">القرآن: اعتمادك مبدئي ولا يُهدى به؛ الهدية بعد اعتماد الشيخ.</p>' : ''}
      <p class="note">اضغط الكلمة التي ${(kids[r.kid] || {}).gender === 'f' ? 'أخطأت' : 'أخطأ'} فيها لتعليمها:</p><p class="tx" style="font-size:1.2rem" data-w>${wordsHtml(r.text, marks, true)}</p>`;
    d.appendChild(mediaEl(r));
    r.notes.forEach(n => { const nn = el('div','ai', `<span class="h">${esc(n.by)} · ${esc(n.date || '')}</span>${n.text ? `<p style="margin:0">${esc(n.text)}</p>` : ''}`); if (n.audio) nn.appendChild(audioEl(n.audio)); d.appendChild(nn); });
    const ta = document.createElement('textarea'); ta.placeholder = 'ملاحظتك (الخطأ والصواب كما يُكتب ويُقرأ)'; ta.style.minHeight = '4em'; ta.id = 'nt' + r.id; d.appendChild(ta);
    const af = document.createElement('input'); af.type = 'file'; af.accept = 'audio/*'; af.setAttribute('capture', ''); af.hidden = true; af.id = 'na' + r.id; d.appendChild(af);
    const row = el('div','btns'); row.style.justifyContent = 'flex-start'; const ab = el('button','btn ghost sm','🎙 أرفق ملاحظة صوتية'); ab.type='button'; ab.addEventListener('click', () => af.click()); af.addEventListener('change', () => { ab.textContent = af.files[0] ? '🎙 ' + af.files[0].name.slice(0, 18) : '🎙 أرفق ملاحظة صوتية'; });
    const ok = el('button','btn sm','اعتمد التسجيل'); ok.type='button'; const fx = el('button','btn warm sm','يحتاج تصحيحًا'); fx.type='button';
    const save = async status => { const n = {by: teacher ? 'المعلم' : 'ولي الأمر', text: ta.value.trim(), marks: [...marks], date: today(), audio: af.files[0] || null}; if (n.text || n.marks.length || n.audio || status === 'approved') r.notes.push(n); r.status = status; if (status === 'approved') r.approvedBy = teacher ? 'المعلم' : 'ولي الأمر'; await recPut(r); recCountApproved(); renderReview(box, teacher); };
    ok.addEventListener('click', () => save('approved')); fx.addEventListener('click', () => save('fix')); row.append(ok, fx, ab); d.appendChild(row);
    d.querySelector('[data-w]').addEventListener('click', e => { const t = e.target.closest('.tok'); if (!t) return; const i = +t.dataset.i; marks = marks.includes(i) ? marks.filter(x => x !== i) : [...marks, i]; d.querySelector('[data-w]').innerHTML = wordsHtml(r.text, marks, true); });
    box.appendChild(d); });
}


/* ================= الهدايا: تسجيلٌ معتمد يُهدى، ويُتمّه المستلم بالكتابة، فتنبت شجرة عند المُهدي ================= */
async function dbAll(store){ try { const d = await idb(); return await new Promise((res, rej) => { const q = d.transaction(store).objectStore(store).getAll(); q.onsuccess = () => res((q.result || []).map(r => recOut(store, r)).filter(Boolean)); q.onerror = () => rej(q.error); }); } catch (e) { return []; } }
async function dbPut(store, r){ const d = await idb(); return new Promise((res, rej) => { const t = d.transaction(store, 'readwrite'); t.objectStore(store).put(recIn(store, r)); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function dbDel(store, id){ const d = await idb(); return new Promise((res, rej) => { const t = d.transaction(store, 'readwrite'); t.objectStore(store).delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
const APPROVER = r => r.approvedBy === 'المعلم' ? (isQuran(r) ? 'الشيخ' : 'المعلم') : 'ولي الأمر';
async function giftChain(r){ if (r.fromGift){ const g = (await dbAll('gift')).find(x => x.id === r.fromGift); if (g && g.chain) return [...g.chain, K().name]; } return [APPROVER(r), K().name]; }
function bump(key, n){ store.set(key, (store.get(key, 0) || 0) + (n || 1)); }
async function giftSheet(r){
  const s = $('sheet'); const others = kids.map((k, i) => ({k, i})).filter(x => x.i !== kid);
  s.innerHTML = `<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">🎁 ⟨أهدِ|أهدي⟩ تسجيلك</h2><button class="x" aria-label="إغلاق">✕</button></div><p class="q s">${esc(r.text)}</p><p class="note">${esc(r.kind)} · ${esc(r.ref)} · اعتمده ${APPROVER(r)}</p>
   <p class="lbl">لمن؟</p><div class="chips" id="gsTo">${others.map(x => `<button class="chip2" type="button" data-i="${x.i}">${avatarHtml(x.k, 24)} ${esc(x.k.name)}</button>`).join('')}<button class="chip2" type="button" data-i="out">صديق خارج البيت (بإذن ولي الأمر)</button></div><p class="fb" id="gsFb"></p>`;
  showSheet(); s.querySelector('.x').addEventListener('click', closeSheet);
  s.querySelector('#gsTo').addEventListener('click', async e => { const b = e.target.closest('button'); if (!b) return; const chain = await giftChain(r);
    if (b.dataset.i === 'out'){ const q = store.get(`giftReq:${kid}`, []); if (!q.some(x => x.recId === r.id)) q.push({recId: r.id, date: today()}); store.set(`giftReq:${kid}`, q); $('gsFb').textContent = 'أُرسل طلبك إلى ولي الأمر؛ هو الذي يصدّر الهدية ويقرر ظهور صورتك.'; $('gsFb').className = 'fb ok'; return; }
    const to = +b.dataset.i; const g = {id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), from: kid, fromName: K().name, fromPhoto: K().photo || null, to, toName: kids[to].name, recId: r.id, kind: r.kind, ref: r.ref, text: r.text, type: r.type, blob: r.blob, date: today(), chain, status:'sent', source:'local'};
    await dbPut('gift', g); bump(`giftsSent:${kid}`); checkStages(); $('gsFb').textContent = `أُهديت إلى ${kids[to].name}. إذا ${(kids[to] || {}).gender === 'f' ? 'أتمّتها' : 'أتمّها'} نبتت شجرتك.`; $('gsFb').className = 'fb ok'; });
}
const giftBlank = g => { const ws = g.text.split(/\s+/); const cands = ws.map((w, i) => ({w, i, n: N1(w).length})).filter(x => x.n >= 3); const pickI = cands.length ? cands[hash(g.id) % cands.length].i : ws.length - 1; return {ws, i: pickI, answer: ws[pickI]}; };
let gfMode = 'in';
function setGfMode(m){ gfMode = m; for (const x of $('gfMode').children) x.setAttribute('aria-pressed', x.dataset.m === m); }
RESETS.push(() => setGfMode('in'));
$('gfMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; setGfMode(b.dataset.m); renderGifts(); });
function chainHtml(chain){ return chain && chain.length ? `<p class="ref" style="margin:0">السند: ${chain.map(esc).join(' ← ')}</p>` : ''; }
async function renderGifts(){
  const L = $('gfList'); L.innerHTML = '<p class="note">…</p>'; const all = await dbAll('gift');
  const list = (gfMode === 'in' ? all.filter(g => g.to === kid) : all.filter(g => g.from === kid)).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id)); L.innerHTML = '';
  if (!list.length){ L.innerHTML = `<p class="note">${gfMode === 'in' ? 'لم تصلك هدية بعد.' : 'لم ⟨تُهدِ|تُهدي⟩ شيئًا بعد. التسجيل المعتمد في «تسجيلاتي» فيه زر 🎁.'}</p>`; return; }
  for (const g of list){
    const d = el('div','qi'); const fromK = g.from >= 0 ? kids[g.from] : null; const avatar = g.fromPhoto ? avatarHtml({name:g.fromName, photo:g.fromPhoto}, 36) : avatarHtml({name:g.fromName}, 36);
    const st = g.status === 'mastered' ? ((kids[g.to] || {}).gender === 'f' ? '<span class="badge ok">أتمّتها</span>' : '<span class="badge ok">أتمّها</span>') : g.status === 'opened' ? '<span class="badge wait">فُتحت</span>' : '<span class="badge wait">جديدة</span>';
    d.innerHTML = `<div class="row" style="justify-content:space-between"><span>${gfMode === 'in' ? `${avatar} هدية من <b>${esc(g.fromName)}</b>` : `إلى <b>${esc(g.toName)}</b>`} <span class="ref">${esc(g.date)}</span></span>${st}</div><span class="chip" style="align-self:flex-start">${esc(g.kind)} · ${esc(g.ref)}</span>${chainHtml(g.chain)}`;
    const a = audioEl(g.blob); d.appendChild(a);
    if (gfMode === 'in'){
      a.addEventListener('play', async () => { if (g.status === 'sent'){ g.status = 'opened'; await dbPut('gift', g); } }, {once:true});
      if (g.status !== 'mastered'){ const b = giftBlank(g); const box = el('div', null, `<p class="note">⟨استمع|استمعي⟩ ثم ⟨اكتب|اكتبي⟩ الكلمة الناقصة ⟨لتُتمّ|لتُتمّي⟩ الهدية:</p><p class="q s">${b.ws.map((w, i) => i === b.i ? '<mark>……</mark>' : esc(w)).join(' ')}</p><div class="tb"></div><p class="fb"></p>`); d.appendChild(box);
        typeBox(box.querySelector('.tb'), b.answer, {id:'gi' + g.id, noFocus:true, onDone: async stt => { feedback(box.querySelector('.fb'), stt, '⟨أتممتَ|أتممتِ⟩ الهدية!', `الكلمة: ${b.answer}. ⟨حاول|حاولي⟩ مرة أخرى بعد الاستماع.`, `قريب! الكلمة: ${b.answer}`); award('gift', g.id, stt === 'ok' ? true : stt === 'near' ? null : false);
          if (stt === 'ok'){ g.status = 'mastered'; g.masteredDate = today(); await dbPut('gift', g); if (g.source === 'local' && g.from >= 0) bump(`giftsMastered:${g.from}`); setTimeout(renderGifts, 900); } }}); }
      else { d.appendChild(el('p','note', `⟨أتممتَها|أتممتِها⟩${g.masteredDate ? ' في ' + esc(g.masteredDate) : ''}. ${g.source === 'import' ? '⟨أرسل|أرسلي⟩ ردّ الشكر ليعرف مُهديك.' : 'نبتت شجرة ' + esc(g.fromName) + '.'}`)); }
      const row = el('div','btns'); row.style.justifyContent = 'flex-start';
      const rb = el('button','btn ghost sm','🎙 ⟨سجّلها|سجّليها⟩ بصوتك'); rb.type='button'; rb.addEventListener('click', () => recordFrom(g.kind, g.ref, g.text, g.id)); row.appendChild(rb);
      if (g.source === 'import' && g.status === 'mastered' && !g.replied){ const xb = el('button','btn sm','⟨صدّر|صدّري⟩ ردّ الشكر'); xb.type='button'; xb.addEventListener('click', async () => { await saveFile(`radd-${K().name}-${today()}.json`, JSON.stringify({v:1, type:'gift-reply', items:[{id: g.id, toName: g.fromName, by: K().name, date: g.masteredDate}]}), $('gfFb')); g.replied = true; await dbPut('gift', g); }); row.appendChild(xb); }
      d.appendChild(row);
    } else if (g.status === 'mastered') d.appendChild(el('p','note', `${(kids[g.to] || {}).gender === 'f' ? 'أتمّتها' : 'أتمّها'} ${esc(g.toName)}${g.masteredDate ? ' في ' + esc(g.masteredDate) : ''}؛ نبتت شجرتك.`));
    L.appendChild(d);
  }
}
$('gfImport').addEventListener('click', () => $('gfImportFile').click());
$('gfImportFile').addEventListener('change', e => importGiftFile(e.target.files[0], $('gfFb')));
async function importGiftFile(f, fb){
  if (!f) return; let pkg; try { pkg = JSON.parse(await f.text()); } catch (e) { fb.textContent = 'الملف ليس ملف هدايا.'; fb.className = 'fb bad'; return; }
  if (!pkg || !Array.isArray(pkg.items)){ fb.textContent = 'الملف ليس ملف هدايا.'; fb.className = 'fb bad'; return; }
  const all = await dbAll('gift'); let n = 0;
  if (pkg.type === 'gift'){ for (const it of pkg.items){ if (all.some(g => g.id === it.id)) continue; await dbPut('gift', {id: it.id, from: -1, fromName: it.fromName, fromPhoto: it.fromPhoto || null, to: kid, toName: K().name, kind: it.kind, ref: it.ref, text: it.text, type: it.type, blob: unb64(it.b64, it.type), date: it.date, chain: it.chain || [], status:'sent', source:'import'}); n++; } fb.textContent = n ? `وصلتك ${n} هدايا.` : 'لا هدايا جديدة في الملف.'; }
  else if (pkg.type === 'gift-reply'){ for (const it of pkg.items){ const g = all.find(x => x.id === it.id && x.from >= 0); if (!g || g.status === 'mastered') continue; g.status = 'mastered'; g.masteredDate = it.date; await dbPut('gift', g); bump(`giftsMastered:${g.from}`); n++; } fb.textContent = n ? `أتمّ ${pkg.items[0] && pkg.items[0].by ? esc(pkg.items[0].by) : 'صديقك'} هديتك؛ نبتت شجرتك.` : 'لا ردود جديدة.'; }
  else { fb.textContent = 'الملف ليس ملف هدايا.'; fb.className = 'fb bad'; return; }
  fb.className = 'fb ' + (n ? 'ok' : 'bad'); checkStages(); renderGifts();
}
INIT.giftShelf = renderGifts;
/* لوحة ولي الأمر: طلبات الإهداء خارج البيت */
async function renderGiftRequests(box){
  const q = store.get(`giftReq:${kid}`, []); const recs = await recAll(); const gifts = await dbAll('gift');
  box.innerHTML = `<p class="note">الهدية خارج البيت تخرج من هنا فقط، باسم الطفل الأول، والصورة معطّلة إلا إن فعّلتَها للهدية. أرسل الملف إلى ولي أمر الصديق ليستورده وهو على ملف ابنه.</p>`;
  if (!q.length) box.appendChild(el('p','note','لا طلبات إهداء.'));
  for (const req of q){ const r = recs.find(x => x.id === req.recId); if (!r) continue; const d = el('div','qi', `<p style="margin:0"><span class="chip">${esc(r.kind)}</span> ${esc(r.ref)} · ${esc(req.date)}${giftable(r) ? '' : ' <span class="badge wait">لم يعد معتمدًا للإهداء</span>'}</p><p class="tx" style="font-size:1.1rem">${esc(r.text)}</p><label class="note"><input type="checkbox" id="gp${r.id}"> أرفق صورة ${esc(K().name)} في هذه الهدية</label>`);
    const row = el('div','btns'); row.style.justifyContent = 'flex-start'; const ex = el('button','btn sm','صدّر الهدية'); ex.type='button'; ex.disabled = !giftable(r); const rm = el('button','btn ghost sm','ارفض'); rm.type='button'; const fb = el('p','fb');
    ex.addEventListener('click', async () => { const chain = await giftChain(r); const withPhoto = d.querySelector('#gp' + r.id).checked; const id = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const pkg = JSON.stringify({v:1, type:'gift', items:[{id, fromName: K().name, fromPhoto: withPhoto ? (K().photo || null) : null, chain, kind: r.kind, ref: r.ref, text: r.text, type: r.type, b64: await b64(r.blob), date: today()}]});
      await saveFile(`hadiya-${K().name}-${today()}.json`, pkg, fb); if (fb.className.includes('ok')){ await dbPut('gift', {id, from: kid, fromName: K().name, to: -1, toName: 'صديق', recId: r.id, kind: r.kind, ref: r.ref, text: r.text, type: r.type, blob: r.blob, date: today(), chain, status:'sent', source:'local'}); bump(`giftsSent:${kid}`); store.set(`giftReq:${kid}`, q.filter(x => x.recId !== r.id)); checkStages(); renderGiftRequests(box); } });
    rm.addEventListener('click', () => { store.set(`giftReq:${kid}`, q.filter(x => x.recId !== r.id)); renderGiftRequests(box); });
    row.append(ex, rm); d.append(row, fb); box.appendChild(d); }
  const sent = gifts.filter(g => g.from === kid).length, got = gifts.filter(g => g.to === kid).length; box.appendChild(el('p','note', `${fem() ? 'أهدت' : 'أهدى'} ${esc(K().name)} ${sent} ${fem() ? 'وتلقّت' : 'وتلقّى'} ${got}. الهدايا المحلية بين الإخوة تمرّ مباشرة بلا إذن (الصورة على الجهاز نفسه).`));
}

/* ================= اعمل به: الحديث والأدب يُقاسان بالفعل ================= */
const AMAL = [
 {id:'a01', link:'N27', deed:'عطس أحدٌ قربي فقلتُ له: يرحمك الله.'},
 {id:'a02', link:'N22', deed:'سلّمتُ على كل من لقيتُ اليوم في البيت.'},
 {id:'a03', link:'N08', deed:'سمّيتُ الله قبل الأكل، وأكلتُ بيميني ومما يليني.'},
 {id:'a04', link:'N13', deed:'كدتُ أقول كلمةً سيئة فسكتُّ.'},
 {id:'a05', link:'N06', deed:'رحمتُ صغيرًا أو حيوانًا اليوم.'},
 {id:'a06', link:'N07', deed:'صنعتُ معروفًا لأحدٍ لم يطلبه مني.'},
 {id:'a07', link:'N15', deed:'قلتُ كلمةً طيبة لأمي أو أبي.'},
 {id:'a08', link:'N16', deed:'لقيتُ أخي بوجهٍ مبتسم.'},
 {id:'a09', link:'N17', deed:'غضبتُ فكتمتُ غضبي ولم أصرخ.'},
 {id:'a10', link:'N05', deed:'يسّرتُ على أخي الصغير في شيءٍ صعب عليه.'},
 {id:'a11', link:'N26', deed:'أحسنتُ إلى جارنا أو لم أزعجه.'},
 {id:'a12', link:'N19', deed:'واظبتُ على عملٍ صغير كل يوم هذا الأسبوع.'},
 {id:'a13', link:'W01', deed:'لم أقل «أفٍّ» لأمي ولا لأبي اليوم.'},
 {id:'a14', link:'N03', deed:'أحببتُ لأخي ما أحبه لنفسي: شاركتُه شيئًا أحبه.'},
 {id:'a15', link:'N09', deed:'علّمتُ أحدًا آيةً أو كلمةً تعلّمتُها.'},
 {id:'a16', link:'N02', deed:'لم أؤذِ أحدًا اليوم بلساني ولا بيدي.'},
 {id:'a17', link:'W06', deed:'ساعدتُ في عمل البيت.'},
 {id:'a18', link:'N10', deed:'شددتُ أخي حين احتاجني، كالبنيان.'},
];
function amalToday(){ const key = `amalPick:${kid}:${today()}`; let id = store.get(key, null); if (!id){ const done = new Set(store.get(`amalLog:${kid}`, []).map(x => x.id)); const pool = AMAL.filter(a => !done.has(a.id)); id = pick(pool.length ? pool : AMAL).id; store.set(key, id); } return AMAL.find(a => a.id === id); }
function renderAmalDaily(){
  const box = $('daily'); const a = amalToday(); const log = store.get(`amalLog:${kid}`, []); const t = log.find(x => x.id === a.id && x.date === today());
  const h = HAD.items.find(x => x.id === a.link); const w = el('div', null, `<p class="lbl" style="margin:10px 0 2px">⟨اعمل|اعملي⟩ به اليوم</p><p style="margin:0;font-size:1.05rem">${esc(a.deed)}</p>${h ? `<p class="ref" style="margin:0">${h.cat === 'nabi' ? 'قال النبي ﷺ' : 'قال ' + esc(h.speaker)}: «${esc(h.focus.length > 70 ? h.focus.slice(0, 70) + '…' : h.focus)}» — ${esc(h.bookName)} ${esc(h.ref)}</p>` : ''}`);
  const row = el('div','btns'); row.style.justifyContent = 'flex-start';
  if (!t){ const b = el('button','btn sm','فعلتُها اليوم'); b.type='button'; b.addEventListener('click', () => { log.push({id: a.id, date: today(), confirmed: false}); store.set(`amalLog:${kid}`, log); renderHome(); }); row.appendChild(b); }
  else row.appendChild(el('span', 'badge ' + (t.confirmed ? 'ok' : 'wait'), t.confirmed ? 'أكّدها ولي الأمر' : 'بانتظار تأكيد ولي الأمر'));
  w.appendChild(row); box.appendChild(w);
}
function renderAmalPanel(box){
  const log = store.get(`amalLog:${kid}`, []); const pend = log.filter(x => !x.confirmed);
  box.innerHTML = `<p class="note">ما قال الطفل إنه فعله. أكّده إن صحّ، فيُحسب له في «الحديقة». الأعمال مسودة مربوطة بأحاديث القسم.</p>`;
  if (!pend.length) box.appendChild(el('p','note','لا شيء بانتظارك.'));
  pend.forEach(x => { const a = AMAL.find(y => y.id === x.id); const d = el('div','qi', `<p style="margin:0">${esc(x.date)} · ${esc(a ? a.deed : x.id)}</p>`); const row = el('div','btns'); row.style.justifyContent = 'flex-start';
    const ok = el('button','btn sm','أكّد'); ok.type='button'; ok.addEventListener('click', () => { x.confirmed = true; store.set(`amalLog:${kid}`, log); bump(`amalDone:${kid}`); checkStages(); renderAmalPanel(box); });
    const no = el('button','btn ghost sm','احذف'); no.type='button'; no.addEventListener('click', () => { store.set(`amalLog:${kid}`, log.filter(y => y !== x)); renderAmalPanel(box); });
    row.append(ok, no); d.appendChild(row); box.appendChild(d); });
  const done = log.filter(x => x.confirmed); if (done.length) box.appendChild(el('p','note', `أُكّد ${done.length}: ` + done.slice(-5).map(x => { const a = AMAL.find(y => y.id === x.id); return esc(a ? a.deed : x.id); }).join(' · ')));
}


/* ================= مراجعة اليوم: ما أتقنتَه يعود إليك بعد 1، 3، 7، 21، 45 يومًا ================= */
function dueList(){ const out = []; for (const g of Object.keys(GEN)) for (const id of seen(g)){ const m = mget(g, id); if (isDueM(m)){ let q = null; try { q = GEN[g](id); } catch (e) {} if (q && q.a) out.push({g, id, ...q, due: dueOf(m)}); } } return out.sort((a, b) => a.due - b.due); }
function dueCount(){ let n = 0; for (const g of Object.keys(GEN)) for (const id of seen(g)) if (isDue(g, id)) n++; return n; }
let RV = null;
const RV_MAX = 10;
function renderRevise(){
  const C = $('rvBox'); if (RV) return renderReviseQ();
  const list = dueList(); const doneToday = store.get(`rvDay:${kid}:${today()}`, 0); const total = store.get(`rvDone:${kid}`, 0);
  const hist = `<p class="note">⟨راجعتَ|راجعتِ⟩ اليوم ${doneToday}، وفي المجموع ${total}.</p>`;
  if (!list.length){ C.innerHTML = `<p class="lbl" style="margin:0">مراجعة اليوم</p><p class="ask">لا شيء مستحقٌّ الآن. ما ⟨تُتقنه|تُتقنينه⟩ يعود إليك بعد يوم، ثم ثلاثة أيام، ثم أسبوع، ثم ثلاثة أسابيع، ثم شهر ونصف.</p>${hist}<div class="btns"><button class="btn ghost" id="rvHome" type="button">→ واحتي</button></div>`; $('rvHome').addEventListener('click', () => { if (kidMode()) LIB = false; go('home'); }); return; }
  C.innerHTML = `<p class="lbl" style="margin:0">مراجعة اليوم</p><p class="ask">${list.length} مستحقة للمراجعة مما ⟨أتقنتَه|أتقنتِه⟩ من قبل، بلا تلميح. الصواب يُبعدها أيامًا أكثر، والخطأ يُرجعها إلى ألعابها.</p>${hist}<div class="btns"><button class="btn" id="rvStart" type="button">⟨ابدأ|ابدئي⟩ (${Math.min(list.length, RV_MAX)})</button><button class="btn ghost" id="rvHome" type="button">→ واحتي</button></div>`;
  $('rvHome').addEventListener('click', () => { if (kidMode()) LIB = false; go('home'); });
  $('rvStart').addEventListener('click', () => { RV = {qs: list.slice(0, RV_MAX), i:0, ok:0, log:[]}; renderReviseQ(); });
}
function renderReviseQ(){
  const C = $('rvBox'); const q = RV.qs[RV.i]; if (!q) return renderReviseEnd();
  C.innerHTML = `<div class="row" style="justify-content:space-between"><span class="chip">مراجعة ${RV.i + 1} من ${RV.qs.length}</span><span class="note">${GNAME[q.g] || ''}</span></div>${q.html ? q.html : `<p class="ask">${esc(q.q)}</p>`}<div class="opts one" id="rvOpts"></div><div id="rvTBox"></div><p class="fb" id="rvFb"></p><div class="btns"><button class="btn" id="rvNext" type="button" hidden>التالي</button></div>`;
  const done = st => { const ok = st === 'ok' || st === true; if (ok) RV.ok++; RV.log.push({g:q.g, id:q.id, ok}); award(q.g, q.id, ok ? true : (st === 'near' ? null : false));
    feedback('rvFb', ok ? true : st === 'near' ? 'near' : false, '⟨أصبت|أصبتِ⟩؛ تعود إليك بعد أيام أكثر.', `الجواب: ${q.a}. تعود إليك في لعبتها.`, `قريب! الجواب: ${q.a}`);
    store.set(`rvDone:${kid}`, store.get(`rvDone:${kid}`, 0) + 1); store.set(`rvDay:${kid}:${today()}`, store.get(`rvDay:${kid}:${today()}`, 0) + 1); $('rvNext').hidden = false; $('rvNext').focus(); };
  if (q.type && tier() === 'big') typeBox($('rvTBox'), q.a, {id:'rvIn', onDone: done});
  else mcq($('rvOpts'), [q.a, ...shuffle(q.alts).slice(0, 3)], q.a, done, q.g === 'sha' ? 'v' : 'm');
  $('rvNext').addEventListener('click', () => { RV.i++; renderReviseQ(); window.scrollTo({top:0}); });
}
function renderReviseEnd(){
  const C = $('rvBox'); const n = RV.qs.length, ok = RV.ok; const bad = RV.log.filter(l => !l.ok);
  C.innerHTML = `<p class="lbl" style="margin:0">انتهت مراجعة اليوم</p><p class="big" style="font-size:2.4rem">${ok} / ${n}</p><p class="ask">${ok === n ? 'كلها صواب؛ ثبتت في ذاكرتك.' : 'ما ⟨أخطأتَ|أخطأتِ⟩ فيه عاد إلى ألعابه ليأتيك أكثر.'}</p>${bad.length ? `<ul style="margin:0;padding-right:1.2em">${bad.map(l => `<li>${esc(describe(l.g, l.id))}</li>`).join('')}</ul>` : ''}<div class="btns">${dueCount() ? '<button class="btn" id="rvMore" type="button">⟨تابع|تابعي⟩ المراجعة</button>' : ''}<button class="btn ghost" id="rvHome" type="button">→ واحتي</button></div>`;
  RV = null; $('rvHome').addEventListener('click', () => { if (kidMode()) LIB = false; go('home'); }); const m = $('rvMore'); if (m) m.addEventListener('click', renderRevise); checkStages();
}
INIT.rvCard = renderRevise;
RESETS.push(() => { RV = null; });


/* ================= اختبار تحديد المستوى: 20 سؤالًا من ثلاثة مستويات عند أول دخول ================= */
const POOL = {
  rl: () => Object.keys(ALL).flatMap(k => (ALL[k].roles || []).map(r => `${k}|${r.q}`)),
  drv: () => Object.keys(ALL).flatMap(k => ALL[k].family.map(f => `${k}|${f.lemma}`)),
  fill: () => Object.keys(ALL).flatMap(k => ALL[k].family.flatMap(f => f.verses.map(v => `${k}|${v.s}:${v.a}|${strip(v.word)}`))),
  uk: () => Object.keys(ALL).flatMap(k => (ALL[k].unknown || []).map(u => `${k}|${u.lemma}`)),
  gzw: () => GZ.quran.map(q => q.id), gzd: () => GZ.dots.flatMap(G => G.words.map(t => `${G.id}|${t.word}`)), gzf: () => GF.map(x => x.id),
  sha: () => SH.abyat.map(x => x.id), shl: () => SH.abyat.map(x => x.id), shp: () => SH.abyat.map(x => x.id), pml: () => SH.qasaid.flatMap(q => q.lines.map((l, i) => `${q.id}|${i}`)),
  hys: () => HY.situations.map(x => x.id), hyc: () => HY.things.map(t => t.noun), hk: () => HIK.map(x => x.text), wh: () => HAD.items.map(x => x.id),
  nt: () => NT.stories.flatMap(s => s.questions.map((q, i) => `${s.id}|${i}`)), sfr: () => SF.articles.flatMap(a => a.tf.map((t, i) => `${a.id}|${i}`)),
  kz: () => KZD.lessons.flatMap(l => l.quiz.map((q, i) => `${l.id}|${i}`)),
  dct: () => DCT.map(x => strip(x.w)), cnj: () => CJ.items.map(cjId), ajd: () => AJ.defs.map(d => d.term), ajc: () => (AJ.counts || []).map(c => c.q), irb: () => irbIds(), tri: () => triApproved().map(t => t.id), hsq: () => (DATA.hasaniya && DATA.hasaniya.quizzes || []).map(q => q.id),
};
const PL_LEVELS = [['hyc','hys','hk','uk','gzd'], ['rl','fill','wh','dct','shp'], ['drv','cnj','sha','shl','gzw','gzf','pml','ajd']];
const PL_COUNTS = [7, 7, 6];
function plQuestions(){
  const qs = [];
  PL_LEVELS.forEach((games, li) => { const byG = {}; games.forEach(g => { byG[g] = shuffle(POOL[g] ? POOL[g]() : []); }); const keys = shuffle(games); let i = 0, guard = 0; const per = {};
    while (qs.filter(q => q.lvl === li).length < PL_COUNTS[li] && guard++ < 400){ const g = keys[i++ % keys.length]; if ((per[g] || 0) >= 2 || !byG[g].length) continue; const id = byG[g].shift(); let q = null; try { q = GEN[g](id); } catch (e) {} if (q && q.a && q.alts && q.alts.length){ qs.push({g, id, lvl: li, ...q}); per[g] = (per[g] || 0) + 1; } } });
  return qs;
}
let PL = null;
const plKey = () => `placement:${kid}`;
function plLevel(byL){ const r = li => byL[li] ? byL[li][0] / Math.max(1, byL[li][1]) : 0; return r(2) >= 0.66 ? 3 : r(1) >= 0.57 ? 2 : 1; }
const PL_START = {1: {o:'hayat', t:'hyTalk', label:'الحياة اليومية والحِكم والكلمة المجهولة', games:['hyc','hys','hk','uk']}, 2: {o:'roots', t:'oasis', label:'النخيل: الوزن والكلمة الناقصة، ومن القائل', games:['rl','fill','wh','nt']}, 3: {o:'workshop', t:'wsConj', label:'الورشة: الاشتقاق والتصريف، والشعر', games:['drv','cnj','sha','shl']}};
function renderPlaceBox(){
  const B = $('placeBox'); if (!B) return; const pl = store.get(plKey(), null); const skip = store.get(`placeSkip:${kid}`, false); const fresh = !Object.keys(GNAME).some(g => seen(g).length);
  if (pl || skip || !fresh){ B.hidden = true; return; }
  B.hidden = false; B.innerHTML = `<p class="lbl" style="margin:0">قبل أن ⟨تبدأ|تبدئي⟩: اختبار تحديد المستوى</p><p class="note" style="margin:6px 0">عشرون سؤالًا من كل الواحات، نحو خمس دقائق. لا نجاح ولا رسوب؛ نعرف فقط من أين نبدأ معك.</p><div class="btns"><button class="btn" type="button" id="plGo">⟨ابدأ|ابدئي⟩</button><button class="btn ghost sm" type="button" id="plLater">لاحقًا</button></div>`;
  $('plGo').addEventListener('click', () => go('place', 'plCard')); $('plLater').addEventListener('click', () => { store.set(`placeSkip:${kid}`, true); B.hidden = true; });
}
function renderPlace(){
  const C = $('plBox'); if (PL) return renderPlaceQ();
  const pl = store.get(plKey(), null);
  C.innerHTML = `<p class="lbl" style="margin:0">اختبار تحديد المستوى</p><p class="ask">${pl ? `⟨أجريتَه|أجريتِه⟩ في ${esc(pl.date)}: ${pl.ok} من ${pl.n}، المستوى ${pl.level}. ⟨تعيده|تعيدينه⟩ الآن؟` : 'عشرون سؤالًا: سبعة سهلة، وسبعة أوسط، وستة أصعب، من كل الواحات. ⟨اختر|اختاري⟩ الجواب ولا ⟨تخف|تخافي⟩ من الخطأ.'}</p><div class="btns"><button class="btn" id="plStart" type="button">${pl ? '⟨أعد|أعيدي⟩ الاختبار' : '⟨ابدأ|ابدئي⟩'}</button><button class="btn ghost" id="plHome" type="button">→ واحتي</button></div>`;
  $('plHome').addEventListener('click', () => go('home'));
  $('plStart').addEventListener('click', () => { const qs = plQuestions(); if (qs.length < 10){ $('plBox').insertAdjacentHTML('beforeend', '<p class="fb bad">تعذّر تكوين الأسئلة.</p>'); return; } PL = {qs, i:0, log:[]}; renderPlaceQ(); });
}
function renderPlaceQ(){
  const C = $('plBox'); const q = PL.qs[PL.i]; if (!q) return renderPlaceEnd();
  C.innerHTML = `<div class="row" style="justify-content:space-between"><span class="chip">السؤال ${PL.i + 1} من ${PL.qs.length}</span><span class="note">${['سهل','أوسط','أصعب'][q.lvl]} · ${GNAME[q.g] || ''}</span></div>${q.html ? q.html : `<p class="ask">${esc(q.q)}</p>`}<div class="opts one" id="plOpts"></div><p class="fb" id="plFb"></p><div class="btns"><button class="btn" id="plNext" type="button" hidden>التالي</button></div>`;
  mcq($('plOpts'), [q.a, ...shuffle(q.alts).slice(0, 3)], q.a, ok => { PL.log.push({g:q.g, id:q.id, lvl:q.lvl, ok}); feedback('plFb', ok, '⟨أصبت|أصبتِ⟩.', `الجواب: ${q.a}`); $('plNext').hidden = false; $('plNext').focus(); }, q.g === 'sha' ? 'v' : 'm');
  $('plNext').addEventListener('click', () => { PL.i++; renderPlaceQ(); window.scrollTo({top:0}); });
}
function renderPlaceEnd(){
  const C = $('plBox'); const byL = {}, byG = {}; PL.log.forEach(l => { byL[l.lvl] = byL[l.lvl] || [0, 0]; byL[l.lvl][0] += l.ok ? 1 : 0; byL[l.lvl][1]++; byG[l.g] = byG[l.g] || [0, 0]; byG[l.g][0] += l.ok ? 1 : 0; byG[l.g][1]++; });
  const ok = PL.log.filter(l => l.ok).length, n = PL.log.length, level = plLevel(byL); const res = {date: today(), ok, n, level, byL, byG}; store.set(plKey(), res);
  PL.log.forEach(l => award(l.g, l.id, l.ok)); // الصواب يُحسب محاولة أولى، والخطأ يعود في لعبته
  if (level === 3 && tier() !== 'small') ['gzw','gzd','gzf'].forEach(k => store.set(`mode:${kid}:${k}`, 'type'));
  const st = PL_START[level]; const weak = Object.keys(byG).filter(g => byG[g][0] < byG[g][1]).map(g => GNAME[g]);
  C.innerHTML = `<p class="lbl" style="margin:0">انتهى اختبار تحديد المستوى</p><p class="big" style="font-size:2.4rem">${ok} / ${n}</p><p class="ask">${[1,2,3].map(li => `${['السهل','الأوسط','الأصعب'][li-1]}: ${byL[li-1] ? byL[li-1].join('/') : '—'}`).join(' · ')}</p><p class="ask">المستوى ${level}: نبدأ من <b>${esc(st.label)}</b>.${weak.length ? ` وما ⟨أخطأتَ|أخطأتِ⟩ فيه (${weak.slice(0, 4).map(esc).join('، ')}) سيأتيك في مهمة اليوم.` : ''}</p><div class="btns"><button class="btn" id="plBegin" type="button">⟨ابدأ|ابدئي⟩ من هناك</button><button class="btn ghost" id="plHome" type="button">→ واحتي</button></div>`;
  PL = null; $('plHome').addEventListener('click', () => go('home')); $('plBegin').addEventListener('click', () => go(st.o, st.t));
}
INIT.plCard = renderPlace;
RESETS.push(() => { PL = null; });


/* ================= الكلمة بثلاث لغات: الطفل يكتب الصينية والإنجليزية، وولي الأمر يجيز، والإخوة يلعبون ================= */
const triAll = () => store.get('tri', []);
function triApproved(k){ return triAll().filter(t => t.status === 'ok' && (k == null || t.kid === k)); }
function triFor(rootKey, lemma){ return triAll().filter(t => t.k === rootKey && t.lemma === lemma); }
function triAlts(x){ const P = ALL[x.k]; const fam = P ? P.family.map(f => f.lemma).filter(l => l !== x.lemma) : []; const others = triApproved().filter(t => t.lemma !== x.lemma).map(t => t.lemma); return [...new Set([...shuffle(fam).slice(0, 2), ...shuffle(others)])].slice(0, 3); }
function renderTriBlock(box, rootKey, lemma){
  const all = triFor(rootKey, lemma); const ok = all.filter(t => t.status === 'ok'); const mine = all.find(t => t.status === 'pending' && t.kid === kid);
  let h = `<p class="lbl" style="margin:0">بثلاث لغات</p>`;
  if (ok.length) h += ok.map(t => `<p style="margin:2px 0;font-size:1.15rem" dir="auto">${t.zh ? `<span lang="zh">${esc(t.zh)}</span>` : ''}${t.zh && t.en ? ' · ' : ''}${t.en ? `<span lang="en">${esc(t.en)}</span>` : ''} <span class="ref">${(kids[t.kid] || {}).gender === 'f' ? 'كتبتها' : 'كتبها'} ${esc((kids[t.kid] || {}).name || t.by || '')}</span></p>`).join('');
  if (mine) h += `<p class="note">⟨أرسلتَ|أرسلتِ⟩: ${esc([mine.zh, mine.en].filter(Boolean).join(' · '))} — بانتظار ولي الأمر.</p>`;
  else if (!ok.some(t => t.kid === kid)) h += `<div class="row" style="gap:6px;flex-wrap:wrap"><input class="f" id="triZh" lang="zh" placeholder="中文" style="flex:1;min-width:100px" autocomplete="off"><input class="f" id="triEn" lang="en" dir="ltr" placeholder="English" style="flex:1;min-width:100px" autocomplete="off"><button class="btn sm" type="button" id="triSend">⟨أرسل|أرسلي⟩ لولي الأمر</button></div><p class="fb" id="triFb"></p>`;
  box.innerHTML = h;
  const b = box.querySelector('#triSend'); if (b) b.addEventListener('click', e => { e.stopPropagation(); const zh = box.querySelector('#triZh').value.trim(), en = box.querySelector('#triEn').value.trim(); const fb = box.querySelector('#triFb');
    if (!zh && !en){ fb.textContent = '⟨اكتب|اكتبي⟩ الكلمة بالصينية أو بالإنجليزية (أو بهما).'; fb.className = 'fb bad'; return; }
    const list = triAll(); list.push({id: 't' + Date.now().toString(36), kid, by: K().name, k: rootKey, lemma, zh, en, date: today(), status:'pending'}); store.set('tri', list); renderTriBlock(box, rootKey, lemma); });
  box.querySelectorAll('input').forEach(i => i.addEventListener('click', e => e.stopPropagation()));
}
/* اللعبة */
let trCur = null;
function trNext(){
  const pool = triApproved(); $('trFb').textContent = ''; $('trFb').className = 'fb'; $('trWhy').hidden = true;
  if (!pool.length){ trCur = null; $('trQ').textContent = 'لا كلمات مجازة بعد.'; $('trRef').textContent = '⟨افتح|افتحي⟩ ثمرةً في نخلة و⟨اكتب|اكتبي⟩ كلمتها بالصينية والإنجليزية، ثم يجيزها ولي الأمر.'; $('trBox').innerHTML = ''; return; }
  trCur = pickW('tri', pool, x => x.id, trCur && trCur.id); const who = kids[trCur.kid];
  $('trQ').innerHTML = `${trCur.zh ? `<span lang="zh">${esc(trCur.zh)}</span>` : ''}${trCur.zh && trCur.en ? ' <span class="ref">/</span> ' : ''}${trCur.en ? `<span lang="en" dir="ltr">${esc(trCur.en)}</span>` : ''}`;
  $('trRef').textContent = `${who && who.gender === 'f' ? 'كتبتها' : 'كتبها'} ${who ? who.name : trCur.by || 'أحد الإخوة'} · جذر ${ALL[trCur.k] ? ALL[trCur.k].root : ''}`;
  const done = st => { feedback('trFb', st, '⟨أصبت|أصبتِ⟩.', `الكلمة: ${trCur.lemma}`, `قريب! الكلمة: ${trCur.lemma} (${NEAR_WHY($('trIn') ? $('trIn').value : '', trCur.lemma)})`); const f = ALL[trCur.k] && ALL[trCur.k].family.find(x => x.lemma === trCur.lemma); $('trWhy').innerHTML = f ? `<p><b>${f.lemma}</b> على وزن <b>${f.pattern}</b>: ${esc(f.meaning)}.</p>` : ''; $('trWhy').hidden = !f; award('tri', trCur.id, st === 'ok' || st === true ? true : st === 'near' ? null : false); };
  if (tier() === 'big') typeBox($('trBox'), trCur.lemma, {id:'trIn', placeholder:'الكلمة العربية', onDone: done});
  else { const o = el('div','opts'); $('trBox').innerHTML = ''; $('trBox').appendChild(o); mcq(o, [trCur.lemma, ...triAlts(trCur)], trCur.lemma, done, 'm'); }
}
$('trNext').addEventListener('click', trNext);
INIT.wsTri = () => { if (!trCur) trNext(); };
RESETS.push(() => { trCur = null; });
/* لوحة ولي الأمر */
function renderTriPanel(box){
  const list = triAll(); const pend = list.filter(t => t.status === 'pending'), ok = list.filter(t => t.status === 'ok');
  box.innerHTML = `<p class="note">الطفل يكتب معنى الكلمة بالصينية والإنجليزية في بطاقة النخلة؛ صحّح إن شئت ثم أجِز، فتظهر لإخوته في «بثلاث لغات».</p>` + (pend.length ? pend.map(t => `<div class="qi" data-id="${t.id}"><div class="row" style="justify-content:space-between"><span>${avatarHtml(kids[t.kid] || {name:t.by || '?'}, 28)} <b>${esc((kids[t.kid] || {}).name || t.by || '')}</b> · <b>${esc(t.lemma)}</b> <span class="ref">${esc((ALL[t.k] || {}).root || '')} · ${esc(t.date)}</span></span></div><div class="row" style="gap:6px;flex-wrap:wrap"><input class="f" lang="zh" value="${esc(t.zh || '')}" placeholder="中文" style="flex:1;min-width:100px" data-f="zh"><input class="f" lang="en" dir="ltr" value="${esc(t.en || '')}" placeholder="English" style="flex:1;min-width:100px" data-f="en"></div><div class="btns" style="justify-content:flex-start"><button class="btn sm" type="button" data-a="ok">أجِز</button><button class="btn ghost sm" type="button" data-a="del">احذف</button></div></div>`).join('') : '<p class="note">لا كلمات بانتظارك.</p>')
    + (ok.length ? `<p class="lbl">المجازة (${ok.length})</p>` + ok.map(t => `<p style="margin:0" data-id="${t.id}">✓ <b>${esc(t.lemma)}</b>: ${esc([t.zh, t.en].filter(Boolean).join(' · '))} <span class="ref">${esc((kids[t.kid] || {}).name || t.by || '')}</span> <button class="btn ghost sm" type="button" data-a="del">احذف</button></p>`).join('') : '');
  if (box.dataset.triBound) return; box.dataset.triBound = '1';
  box.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (!b) return; const row = b.closest('[data-id]'); const id = row.dataset.id; const list = triAll(); const t = list.find(x => x.id === id); if (!t) return;
    if (b.dataset.a === 'del'){ store.set('tri', list.filter(x => x.id !== id)); }
    else { row.querySelectorAll('input[data-f]').forEach(i => t[i.dataset.f] = i.value.trim()); if (!t.zh && !t.en) return; t.status = 'ok'; t.okDate = today(); store.set('tri', list); }
    checkStages(); renderTriPanel(box); });
}


/* ================= مصحفي بصوتي (بالصفحات والأجزاء) وتسميع التتابع ================= */
const QN = DATA.quran || {surahs:{}, pages:[], units:[]};
const AR_NUM = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const BASMALA = (() => { const f = QN.pages.find(p => p.p === 1); return f ? f.ayat[0][2] : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'; })();
const SNAME = s => (QN.surahs[s] || {}).name || s;
function pageTitle(pg){ const first = pg.ayat[0], last = pg.ayat[pg.ayat.length - 1]; const ss = [...new Set(pg.ayat.map(a => a[0]))]; return ss.length === 1 ? `${SNAME(first[0])} ${first[1]}–${last[1]}` : `${SNAME(first[0])} ${first[1]} → ${SNAME(last[0])} ${last[1]}`; }
function pageHtml(pg){ let h = '', cur = null; pg.ayat.forEach(([s, a, t]) => { if (s !== cur){ cur = s; if (a === 1 && s !== 1 && s !== 9) h += `<p class="lbl" style="text-align:center;margin:8px 0 2px">سورة ${esc(SNAME(s))}</p><p class="q s" style="text-align:center;margin:0">${esc(BASMALA)}</p>`; else if (a !== 1) h += `<p class="lbl" style="text-align:center;margin:8px 0 2px">${esc(SNAME(s))}</p>`; else h += `<p class="lbl" style="text-align:center;margin:8px 0 2px">سورة ${esc(SNAME(s))}</p>`; } h += `<span class="q s">${esc(t)} ﴿${AR_NUM(a)}﴾ </span>`; }); return `<div style="line-height:2.1;text-align:justify;font-family:var(--f-q)">${h}</div>`; }
const pageText = pg => pg.ayat.map(([s, a, t]) => `${t} ﴿${AR_NUM(a)}﴾`).join(' ');
let muUnit = store.get('muUnit', (QN.units[0] || {}).id);
function pageRecs(all, p, k){ return all.filter(r => r.kind === 'صفحة' && r.page === p && r.kid === k); }
function bestStatus(rs){ if (rs.some(r => r.status === 'approved' && r.approvedBy === 'المعلم')) return 'shaykh'; if (rs.some(r => r.status === 'approved')) return 'guardian'; if (rs.some(r => r.status === 'fix')) return 'fix'; if (rs.length) return 'pending'; return 'none'; }
const MU_BADGE = {shaykh:'<span class="badge ok">اعتمدها الشيخ</span>', guardian:'<span class="badge wait">معتمدة مبدئيًّا</span>', fix:'<span class="badge wait">فيها ملاحظات</span>', pending:'<span class="badge wait">بانتظار المراجعة</span>', none:''};
async function mushafRecount(){ const all = await recAll(); let n = 0; const done = []; QN.units.forEach(u => { const ok = u.pages.every(p => bestStatus(pageRecs(all, p, kid)) === 'shaykh'); if (ok){ n++; done.push(u.id); } }); const prev = store.get(`mushafUnits:${kid}`, 0); store.set(`mushafUnits:${kid}`, n); store.set(`mushafDone:${kid}`, done); if (n !== prev) checkStages(); return all; }
async function renderMushaf(){
  const all = await mushafRecount(); const C = $('muUnits'); C.innerHTML = '';
  QN.units.forEach(u => { const st = u.pages.map(p => bestStatus(pageRecs(all, p, kid))); const rec = st.filter(x => x !== 'none').length, ok = st.filter(x => x === 'shaykh').length; const b = el('button','chip2', `${ok === u.pages.length ? '⭐ ' : ''}${u.name} <span class="ref">${rec}/${u.pages.length}</span>`); b.type = 'button'; b.setAttribute('aria-pressed', u.id === muUnit); b.addEventListener('click', () => { muUnit = u.id; store.set('muUnit', u.id); renderMushaf(); }); C.appendChild(b); });
  const u = QN.units.find(x => x.id === muUnit) || QN.units[0]; if (!u) return; const B = $('muBody'); B.innerHTML = '';
  const pages = u.pages.map(p => QN.pages.find(g => g.p === p)); const sts = pages.map(pg => bestStatus(pageRecs(all, pg.p, kid))); const rec = sts.filter(x => x !== 'none').length, ok = sts.filter(x => x === 'shaykh').length, gd = sts.filter(x => x === 'guardian').length;
  const playable = pages.filter((pg, i) => sts[i] !== 'none').map(pg => pageRecs(all, pg.p, kid).sort((a, b) => (b.status === 'approved') - (a.status === 'approved') || b.date.localeCompare(a.date))[0]);
  B.innerHTML = `<p class="ask" style="margin:6px 0">${esc(u.name)}: ⟨سجّلتَ|سجّلتِ⟩ ${rec} من ${pages.length} صفحة${ok ? `، اعتمد الشيخ ${ok}` : ''}${gd ? `، ومعتمدة مبدئيًّا ${gd}` : ''}.${ok === pages.length ? ' <b>هذا الجزء في مصحفك ⭐</b>' : ''}</p><div class="btns" style="justify-content:flex-start"><button class="btn sm" type="button" id="muPlay" ${playable.length ? '' : 'disabled'}>▶ ⟨استمع|استمعي⟩ إلى ما ⟨سجّلتَ|سجّلتِ⟩ (${playable.length})</button><button class="btn ghost sm" type="button" id="muExport" ${ok ? '' : 'disabled'}>⟨صدّر|صدّري⟩ المعتمد من الشيخ (${ok})</button><button class="btn ghost sm" type="button" id="muHtml" ${ok ? '' : 'disabled'}>صفحةٌ تُسمَع في أي متصفح</button></div><p class="fb" id="muFb"></p><div id="muPlayer"></div><div class="queue" id="muPages"></div>`;
  const L = B.querySelector('#muPages');
  pages.forEach((pg, i) => { const rs = pageRecs(all, pg.p, kid); const d = el('div','qi'); d.innerHTML = `<div class="row" style="justify-content:space-between"><span><b>صفحة ${AR_NUM(pg.p)}</b> <span class="ref">${esc(pageTitle(pg))}${pg.partial ? ' (ما في النطاق منها)' : ''}</span></span>${MU_BADGE[sts[i]]}</div>`;
    const row = el('div','btns'); row.style.justifyContent = 'flex-start'; const rb = el('button','btn sm' + (rs.length ? ' ghost' : ''), rs.length ? '🎙 ⟨أعد|أعيدي⟩ تسجيلها' : '🎙 ⟨سجّل|سجّلي⟩ الصفحة'); rb.type = 'button'; rb.addEventListener('click', () => recordPage(pg, u)); row.appendChild(rb);
    const vb = el('button','btn ghost sm','📖 ⟨اقرأها|اقرئيها⟩'); vb.type = 'button'; vb.addEventListener('click', () => { const s = $('sheet'); s.innerHTML = `<div class="top"><h2 style="font-family:var(--f-ui);font-size:1.3rem">صفحة ${AR_NUM(pg.p)} · ${esc(pageTitle(pg))}</h2><button class="x" aria-label="إغلاق">✕</button></div>${pageHtml(pg)}`; showSheet(); s.querySelector('.x').addEventListener('click', closeSheet); }); row.appendChild(vb);
    if (rs.length){ const last = rs.sort((a, b) => b.date.localeCompare(a.date))[0]; const pb = el('button','btn ghost sm','▶'); pb.type = 'button'; pb.setAttribute('aria-label','⟨استمع|استمعي⟩'); pb.addEventListener('click', () => { const old = d.querySelector('audio'); if (old) old.remove(); else d.appendChild(audioEl(last.blob)); }); row.appendChild(pb); }
    d.appendChild(row); L.appendChild(d); });
  B.querySelector('#muPlay').addEventListener('click', () => playSeq(playable.map(r => ({blob:r.blob, label:`صفحة ${AR_NUM(r.page)}`})), B.querySelector('#muPlayer')));
  B.querySelector('#muHtml').addEventListener('click', async () => { const items = []; for (const pg of pages){ const r = pageRecs(all, pg.p, kid).find(x => x.status === 'approved' && x.approvedBy === 'المعلم'); if (r) items.push({title:`صفحة ${AR_NUM(pg.p)} · ${pageTitle(pg)}`, text:'', ref:'', who:K().name, b64: await b64(r.blob), type: r.type}); }
    await saveFile(`mushaf-${K().name}-${u.id}-${today()}.html`, listenHtml(`مصحف ${K().name} ⟨بصوته|بصوتها⟩ · ${u.name}`, 'الصفحات التي اعتمدها الشيخ', items), B.querySelector('#muFb')); });
  B.querySelector('#muExport').addEventListener('click', async () => { const items = []; for (const pg of pages){ const r = pageRecs(all, pg.p, kid).find(x => x.status === 'approved' && x.approvedBy === 'المعلم'); if (r) items.push({page: pg.p, ref: r.ref, title: pageTitle(pg), type: r.type, b64: await b64(r.blob), date: r.date}); }
    await saveFile(`mushaf-${K().name}-${u.id}-${today()}.json`, JSON.stringify({v:1, type:'mushaf', kid: K().name, unit: u.id, unitName: u.name, items}), B.querySelector('#muFb')); });
}
function recordPage(pg, u){ recordFrom('صفحة', `صفحة ${pg.p}`, pageText(pg), null, {html: pageHtml(pg), extra: {page: pg.p, unit: u.id}, onSaved: () => { if (cur.t === 'mushaf') renderMushaf(); }}); }
function playSeq(items, box){
  box.innerHTML = ''; if (!items.length) return; let i = 0; const a = document.createElement('audio'); a.controls = true; a.style.width = '100%'; const lab = el('p','note'); box.appendChild(lab); box.appendChild(a);
  const stop = el('button','btn ghost sm','■ ⟨أوقف|أوقفي⟩'); stop.type = 'button'; stop.addEventListener('click', () => { a.pause(); box.innerHTML = ''; }); box.appendChild(stop);
  const play = () => { if (i >= items.length){ lab.textContent = 'انتهى.'; return; } const it = items[i]; lab.textContent = `${i + 1} من ${items.length}: ${it.label}`; a.src = URL.createObjectURL(it.blob); a.play().catch(() => {}); };
  a.addEventListener('ended', () => { i++; play(); }); play();
}
INIT.mushaf = renderMushaf;
/* ---- التتابع ---- */
const RY_SURAHS = [...Object.keys(QN.surahs).map(Number)].sort((a, b) => (QN.surahs[a].n - QN.surahs[b].n) || (a - b));
let rySurah = store.get('rySurah', RY_SURAHS[0] || 112);
const ayahOf = (s, a) => { for (const pg of QN.pages) for (const x of pg.ayat) if (x[0] === s && x[1] === a) return x[2]; return ''; };
function ryAssign(s, a){ const start = store.get(`relayStart:${s}`, s % Math.max(1, kids.length)); return (start + a - 1) % Math.max(1, kids.length); }
async function renderRelay(){
  const all = await recAll(); const C = $('ryChips'); C.innerHTML = '';
  RY_SURAHS.forEach(s => { const b = el('button','chip2', `${SNAME(s)} <span class="ref">${QN.surahs[s].n}</span>`); b.type = 'button'; b.setAttribute('aria-pressed', s === rySurah); b.addEventListener('click', () => { rySurah = s; store.set('rySurah', s); renderRelay(); }); C.appendChild(b); });
  const s = rySurah, n = QN.surahs[s].n; const B = $('ryBody'); B.innerHTML = '';
  const recOf = a => all.filter(r => r.kind === 'آية' && r.ref === `${SNAME(s)} ${s}:${a}` && r.kid === ryAssign(s, a)).sort((x, y) => (y.status === 'approved') - (x.status === 'approved') || y.date.localeCompare(x.date))[0];
  const recs = Array.from({length: n}, (_, i) => recOf(i + 1)); const have = recs.filter(Boolean).length; const complete = have === n;
  if (complete){ const done = store.get(`relayDone:${kid}`, []); const part = new Set(Array.from({length: n}, (_, i) => ryAssign(s, i + 1))); if (part.has(kid) && !done.includes(s)){ done.push(s); store.set(`relayDone:${kid}`, done); checkStages(); } }
  const starts = kids.map((k, i) => `<button class="chip2" type="button" data-st="${i}" aria-pressed="${store.get(`relayStart:${s}`, s % Math.max(1, kids.length)) === i}">${avatarHtml(k, 22)} ${esc(k.name)}</button>`).join('');
  B.innerHTML = `<p class="ask" style="margin:6px 0">سورة ${esc(SNAME(s))}: سُجّلت ${have} من ${n} آية${complete ? ' — <b>اكتملت بأصواتكم</b>' : ''}.</p><div class="row" style="gap:6px;flex-wrap:wrap"><span class="note">يبدأ التناوب من:</span><span class="chips" id="ryStart">${starts}</span></div><div class="btns" style="justify-content:flex-start"><button class="btn sm" type="button" id="ryPlay" ${have ? '' : 'disabled'}>▶ ⟨استمع|استمعي⟩ إلى السورة بأصواتكم (${have})</button></div><div id="ryPlayer"></div>${s !== 1 && s !== 9 ? `<p class="q s" style="text-align:center">${esc(BASMALA)}</p>` : ''}<div class="queue" id="ryList"></div>`;
  B.querySelector('#ryStart').addEventListener('click', e => { const b = e.target.closest('button[data-st]'); if (!b) return; store.set(`relayStart:${s}`, +b.dataset.st); renderRelay(); });
  B.querySelector('#ryPlay').addEventListener('click', () => playSeq(recs.map((r, i) => r && ({blob:r.blob, label:`آية ${AR_NUM(i + 1)} · ${r.kidName}`})).filter(Boolean), B.querySelector('#ryPlayer')));
  const L = B.querySelector('#ryList');
  for (let a = 1; a <= n; a++){ const who = ryAssign(s, a); const k = kids[who]; const r = recs[a - 1]; const d = el('div','qi');
    d.innerHTML = `<div class="row" style="justify-content:space-between"><span>${avatarHtml(k, 26)} <b>${esc(k.name)}</b></span>${r ? statusBadge(r) : '<span class="badge wait">لم تُسجَّل</span>'}</div><p class="q s" style="margin:4px 0">${esc(ayahOf(s, a))} ﴿${AR_NUM(a)}﴾</p>`;
    const row = el('div','btns'); row.style.justifyContent = 'flex-start';
    if (who === kid){ const rb = el('button','btn sm' + (r ? ' ghost' : ''), r ? '🎙 ⟨أعد|أعيدي⟩ تسجيلها' : '🎙 ⟨سجّل|سجّلي⟩ آيتك'); rb.type = 'button'; rb.addEventListener('click', () => recordFrom('آية', `${SNAME(s)} ${s}:${a}`, ayahOf(s, a), null, {onSaved: () => { if (cur.t === 'relay') renderRelay(); }})); row.appendChild(rb); }
    if (r){ const pb = el('button','btn ghost sm','▶'); pb.type = 'button'; pb.setAttribute('aria-label','⟨استمع|استمعي⟩'); pb.addEventListener('click', () => { const old = d.querySelector('audio'); if (old) old.remove(); else d.appendChild(audioEl(r.blob)); }); row.appendChild(pb); }
    d.appendChild(row); L.appendChild(d); }
}
INIT.relay = renderRelay;


/* ================= إذاعة الواحة: برنامج يومي يُركَّب من أصوات الإخوة المعتمدة ================= */
function hashStr(s){ let h = 2166136261; for (const c of String(s)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
const sPick = (arr, seed) => arr.length ? arr[seed % arr.length] : null;
function familyNews(){ const all = []; kids.forEach((k, i) => store.get(`paper:${i}`, []).forEach(n => all.push({who:k.name, title:n.title, text:n.text, date:n.date}))); return all; }
const RADIO_SEGS = [
  {id:'quran',  title:'فقرة القرآن الكريم', kinds:['آية','صفحة']},
  {id:'hadith', title:'فقرة الحديث الشريف', kinds:['حديث'], fallback: seed => { const x = sPick(HAD.items.filter(i => i.cat === 'nabi'), seed); return x && {text:`قال النبي ﷺ: «${x.focus}»`, ref:`${x.bookName} ${x.ref}`}; }},
  {id:'hikma',  title:'فقرة الحكمة', kinds:['مثل'], fallback: seed => { const x = sPick(HIK, seed); return x && {text:x.text, ref:x.when ? `تُقال: ${x.when}` : ''}; }},
  {id:'shir',   title:'فقرة الشعر', kinds:['قصيدة'], fallback: seed => { const x = sPick(SH.abyat, seed); return x && {text:x.verses.map(v => `${v.a} ۞ ${v.b}`).join('\n'), ref:x.poet}; }},
  {id:'matn',   title:'فقرة المتون', kinds:['متن']},
  {id:'news',   title:'خبر الصحيفة', fallback: seed => { const x = sPick(familyNews(), seed); return x && {text:`${x.title ? x.title + ': ' : ''}${x.text}`, ref:`بقلم ${x.who}`}; }},
  {id:'tri',    title:'كلمة بثلاث لغات', fallback: seed => { const x = sPick(triApproved(), seed); return x && {text:`${x.lemma} — ${[x.zh, x.en].filter(Boolean).join(' · ')}`, ref:`${(kids[x.kid] || {}).gender === 'f' ? 'كتبتها' : 'كتبها'} ${(kids[x.kid] || {}).name || x.by || ''}`}; }},
  {id:'fam',    title:'تحدّي العائلة', fallback: seed => { const ks = store.keys().filter(k => /^fam:\d{4}-/.test(k)).sort().slice(-1); const f = ks.length ? store.get(ks[0], null) : null; return f && {text:`فريق ${f.players.join(' و')} أصاب ${f.score} من ${f.n} في تحدّي العائلة${f.score >= 3 ? '. أحسنتم!' : '. الجولة القادمة أفضل'}`, ref:f.date}; }},
  {id:'kq',     title:'سؤال الإذاعة', fallback: seed => { const x = sPick(store.get('kqa', []), seed); return x && {text:x.q, ref:`سؤال ${(kids[x.kid] || {}).name || ''}`, answer:x.a}; }},
  {id:'amal',   title:'عمل اليوم', fallback: () => { const a = (typeof amalToday === 'function') ? amalToday() : null; return a && {text:a.deed, ref:'⟨اعمل|اعملي⟩ به اليوم'}; }},
];
let radioN = 0;
async function buildRadio(){
  const all = (await recAll()).filter(r => r.status === 'approved' && !(typeof PRIVATE_K !== 'undefined' && PRIVATE_K.has(r.kind)) && !String(r.type || '').startsWith('image/')); const seed = hashStr(today() + ':' + store.get(`radioN:${today()}`, 0)); const prog = {date: today(), presenter: kids[seed % Math.max(1, kids.length)], segs: []};
  RADIO_SEGS.forEach((sg, i) => { const s = (seed + i * 7919) >>> 0; let rec = null;
    if (sg.kinds){ let pool = all.filter(r => sg.kinds.includes(r.kind)); if (sg.id === 'quran'){ const sh = pool.filter(r => r.approvedBy === 'المعلم'); if (sh.length) pool = sh; } rec = sPick(pool, s); }
    if (rec) prog.segs.push({id:sg.id, title:sg.title, rec, text:rec.text, ref:`${rec.kind} · ${rec.ref}`, who:rec.kidName, kidIdx:rec.kid});
    else if (sg.fallback){ const t = sg.fallback(s); if (t) prog.segs.push({id:sg.id, title:sg.title, ...t}); } });
  return prog;
}
async function renderRadio(){
  const C = $('rdBox'); C.innerHTML = '<p class="note">…</p>'; const prog = await buildRadio(); C.innerHTML = '';
  const head = el('div', null, `<div class="row" style="justify-content:space-between"><span class="lbl" style="margin:0">برنامج ${esc(prog.date)}</span><span>${prog.presenter.gender === 'f' ? 'مقدّمة اليوم' : 'مقدّم اليوم'}: ${avatarHtml(prog.presenter, 26)} <b>${esc(prog.presenter.name)}</b></span></div><p class="note" style="margin:4px 0 8px">المقدّم يعلن الفقرات ويقرأ ما لا تسجيل له. ما له تسجيلٌ معتمد يُشغَّل بصوت صاحبه.</p><div class="btns" style="justify-content:flex-start"><button class="btn sm" type="button" id="rdPlay" ${prog.segs.some(s => s.rec) ? '' : 'disabled'}>▶ ⟨شغّل|شغّلي⟩ الفقرات المسجّلة (${prog.segs.filter(s => s.rec).length})</button><button class="btn ghost sm" type="button" id="rdShuffle">برنامج آخر</button><button class="btn ghost sm" type="button" id="rdExport">⟨صدّر|صدّري⟩ الإذاعة صفحةً تُسمَع في أي متصفح</button></div><p class="fb" id="rdFb"></p><div id="rdPlayer"></div>`); C.appendChild(head);
  const L = el('div','queue'); C.appendChild(L);
  prog.segs.forEach((sg, i) => { const d = el('div','qi'); d.innerHTML = `<div class="row" style="justify-content:space-between"><span class="chip">${i + 1}. ${esc(sg.title)}</span>${sg.rec ? `<span>${avatarHtml(kids[sg.kidIdx] || {name:sg.who}, 24)} ${esc(sg.who)}${isQuran(sg.rec) && sg.rec.approvedBy !== 'المعلم' ? ' <span class="badge wait">مبدئي</span>' : ''}</span>` : (prog.presenter.gender === 'f' ? '<span class="note">تقرؤها المقدّمة</span>' : '<span class="note">يقرؤها المقدّم</span>')}</div><p class="q s" style="margin:4px 0;white-space:pre-line">${esc(sg.text || '')}</p>${sg.ref ? `<p class="ref" style="margin:0">${esc(sg.ref)}</p>` : ''}`;
    if (sg.rec) d.appendChild(audioEl(sg.rec.blob));
    if (sg.answer){ const b = el('button','btn ghost sm','⟨أظهر|أظهري⟩ الجواب'); b.type = 'button'; b.addEventListener('click', () => { b.replaceWith(el('p','fb ok', `الجواب: ${sg.answer}`)); }); d.appendChild(b); }
    L.appendChild(d); });
  $('rdPlay').addEventListener('click', () => playSeq(prog.segs.filter(s => s.rec).map(s => ({blob:s.rec.blob, label:`${s.title} · ${s.who}`})), $('rdPlayer')));
  $('rdShuffle').addEventListener('click', () => { store.set(`radioN:${today()}`, store.get(`radioN:${today()}`, 0) + 1); renderRadio(); });
  $('rdExport').addEventListener('click', async () => { const items = []; for (const sg of prog.segs){ if (sg.rec && isQuran(sg.rec) && sg.rec.approvedBy !== 'المعلم') items.push({title:sg.title, text:'(تسجيل القرآن يُنشر بعد اعتماد الشيخ)', ref:''}); else items.push({title:sg.title, text:sg.text, ref:sg.ref, who:sg.who, b64: sg.rec ? await b64(sg.rec.blob) : null, type: sg.rec ? sg.rec.type : null}); }
    await saveFile(`idhaa-${prog.date}.html`, listenHtml(`إذاعة الواحة · ${prog.date}`, `${prog.presenter.gender === 'f' ? 'مقدّمة اليوم' : 'مقدّم اليوم'}: ${prog.presenter.name}`, items), $('rdFb')); });
}
/* صفحة مستقلة تُسمع فيها التسجيلات في أي متصفح (للجدّ والجدّة): نص + صوت مضمّن */
function listenHtml(title, sub, items){
  const seg = items.map((it, i) => `<section><h2>${i + 1}. ${esc(it.title)}${it.who ? ` <small>— ${esc(it.who)}</small>` : ''}</h2>${it.text ? `<p class="t">${esc(it.text)}</p>` : ''}${it.ref ? `<p class="r">${esc(it.ref)}</p>` : ''}${it.b64 ? `<audio controls preload="none" src="data:${it.type || 'audio/mpeg'};base64,${it.b64}"></audio>` : ''}</section>`).join('');
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font-family:"Amiri","Noto Naskh Arabic",serif;background:#f8f1df;color:#2b2416;margin:0;padding:20px;max-width:720px;margin-inline:auto;line-height:1.9}h1{font-size:1.6rem;margin:0}h2{font-size:1.15rem;margin:0 0 4px;color:#5b3a1a}small{font-weight:400;color:#7a6a52}section{background:#fff8ea;border-radius:14px;padding:12px 16px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,.08)}.t{font-size:1.3rem;margin:4px 0;white-space:pre-line}.r{color:#7a6a52;font-size:.9rem;margin:0}audio{width:100%;margin-top:8px}.sub{color:#7a6a52;margin:4px 0 12px}</style></head><body><h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p>${seg}<p class="sub">من واحة اللسان العربي.</p></body></html>`;
}
INIT.radio = renderRadio;

/* ================= تقرير الجمعة: أسبوع كل طفل ================= */
function withKid(i, fn){ const saved = kid; kid = i; try { return fn(); } finally { kid = saved; } }
function weekDays(){ const out = []; const d = new Date(); for (let i = 0; i < 7; i++){ out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); d.setDate(d.getDate() - 1); } return out; }
function kidWeek(i, recs){
  return withKid(i, () => { const days = weekDays(); const since = Date.now() - 7 * DAY_MS; let answers = 0, active = 0, reviews = 0;
    days.forEach(dt => { const d = store.get(`day:${i}:${dt}`, {}); const n = Object.values(d).reduce((a, b) => a + b, 0); answers += n; if (n) active++; reviews += store.get(`rvDay:${i}:${dt}`, 0); });
    let mastered = 0, newMastered = 0; const weak = []; Object.keys(GNAME).forEach(g => seen(g).forEach(id => { const m = mget(g, id); if (m.streak >= 2){ mastered++; if (m.t >= since) newMastered++; } else if (m.wrong >= 2) weak.push({g, id, m}); }));
    const stages = STAGES.filter(s => { const v = store.get(`stage:${i}:${s.id}`, false); return v && v >= since; }).map(s => STAGE_NAMES_EL[s.el]);
    const rk = recs.filter(r => r.kid === i && days.includes(r.date)); const amal = store.get(`amalLog:${i}`, []).filter(x => days.includes(x.date));
    const tri = triAll().filter(t => t.kid === i && days.includes(t.okDate || '')).length; const tests = store.get(`tests:${i}`, []).filter(t => t.date >= since);
    const msh = msHistory(i), msl = msh[msh.length - 1], msp = msh[msh.length - 2];
    return {k: kids[i], sec: secLine(i, since, kids[i]), ms: msl ? `${msl.ok}/${msl.n} (${msl.date})${msp ? `، وقبله ${msp.ok}/${msp.n}` : ''}` : '', active, answers, reviews, mastered, newMastered, weak: weak.sort((a, b) => b.m.wrong - a.m.wrong).slice(0, 5), stages, rec: rk.length, recOk: rk.filter(r => r.status === 'approved').length, gifts: store.get(`giftsSent:${i}`, 0), amal: amal.filter(x => x.confirmed).length, amalPend: amal.filter(x => !x.confirmed).length, tri, tests, due: dueCount(), streak: dayStreak(), stagesAll: stagesDoneCount()}; });
}
function weekText(rows){ const days = weekDays(); return `تقرير الجمعة — واحة اللسان العربي\nمن ${days[6]} إلى ${days[0]}\n\n` + rows.map(r => `${r.k.name} (${r.k.age} سنوات)\n- أيام اللعب: ${r.active} من 7 (سلسلة: ${r.streak})\n- أسئلة أُجيبت: ${r.answers}، مراجعات: ${r.reviews}\n- متقَن جديد هذا الأسبوع: ${r.newMastered} (المجموع ${r.mastered})\n- مراحل فُتحت: ${r.stages.length ? r.stages.join('، ') : 'لا'} (المجموع ${r.stagesAll} من ${STAGES.length})\n- تسجيلات: ${r.rec} (معتمدة ${r.recOk})، هدايا مرسلة: ${r.gifts}\n- اعمل به: ${r.amal} مؤكَّدة${r.amalPend ? `، ${r.amalPend} بانتظارك` : ''}؛ كلمات بثلاث لغات: ${r.tri}\n- اختبارات القافلة: ${r.tests.length ? r.tests.map(t => `${t.score}/10${t.pass ? ' ✓' : ''}`).join('، ') : 'لا'}\n- ${r.k.gender === 'f' ? 'تتعثّر' : 'يتعثّر'} في: ${r.weak.length ? r.weak.map(w => describe(w.g, w.id)).join('؛ ') : 'لا شيء'}\n- مستحق للمراجعة الآن: ${r.due}${r.ms ? `\n- قياس الشهر: ${r.ms}` : ''}${r.sec ? `\n- ${r.sec.replace(/ · /g, '\n- ')}` : ''}`).join('\n\n'); }
async function renderWeekPanel(box){
  const recs = await recAll(); const rows = kids.map((k, i) => kidWeek(i, recs)); const days = weekDays();
  box.innerHTML = `<p class="note">آخر سبعة أيام (${esc(days[6])} ← ${esc(days[0])}) لكل الأبناء. انسخ النص وأرسله في المجموعة العائلية أو احفظه.</p>
   <div class="tablewrap"><table class="dash"><tr><th></th>${rows.map(r => `<th>${esc(r.k.name)}</th>`).join('')}</tr>
   ${[['أيام اللعب', r => `${r.active}/7`], ['أسئلة', r => r.answers], ['مراجعات', r => r.reviews], ['متقَن جديد', r => r.newMastered], ['مراحل فُتحت', r => r.stages.length], ['تسجيلات (معتمدة)', r => `${r.rec} (${r.recOk})`], ['هدايا', r => r.gifts], ['اعمل به', r => r.amal], ['ثلاث لغات', r => r.tri], ['مستحق للمراجعة', r => r.due]].map(([l, f]) => `<tr><td>${l}</td>${rows.map(r => `<td>${f(r)}</td>`).join('')}</tr>`).join('')}</table></div>
   ${rows.map(r => r.weak.length ? `<p class="lbl">${esc(r.k.name)} ${r.k.gender === 'f' ? 'تتعثّر' : 'يتعثّر'} في</p><ul style="margin:0;padding-right:1.2em">${r.weak.map(w => `<li>${esc(describe(w.g, w.id))}</li>`).join('')}</ul>` : '').join('')}
   <p class="lbl">نص التقرير</p><textarea class="f" id="wkText" rows="12" readonly style="width:100%;font-family:var(--f-ui);font-size:.95rem"></textarea>
   <div class="btns" style="justify-content:flex-start"><button class="btn sm" type="button" id="wkCopy">انسخ النص</button><button class="btn ghost sm" type="button" id="wkSave">احفظ ملفًا</button></div><p class="fb" id="wkFb"></p>`;
  const txt = weekText(rows); box.querySelector('#wkText').value = txt;
  box.querySelector('#wkCopy').addEventListener('click', async () => { const fb = box.querySelector('#wkFb'); try { await navigator.clipboard.writeText(txt); fb.textContent = 'نُسخ.'; fb.className = 'fb ok'; } catch (e) { box.querySelector('#wkText').select(); fb.textContent = 'حدّد النص وانسخه.'; fb.className = 'fb bad'; } });
  box.querySelector('#wkSave').addEventListener('click', () => saveFile(`taqrir-${days[0]}.md`, txt, box.querySelector('#wkFb')));
}


/* ================= من «التحفة السنية بشرح المقدمة الآجرومية» لمحمد محيي الدين عبد الحميد ================= */
const TF = DATA.tuhfa || {irab:[], asila:[], tamrin:[]};
const irbList = () => { const out = []; TF.irab.forEach((b, bi) => b.items.forEach((s, si) => s.words.forEach((w, wi) => { if (w.i && w.w) out.push({id:`${bi}|${si}|${wi}`, b, s, w}); }))); return out; };
const irbIds = () => irbList().map(x => x.id);
function irbFind(id){ return irbList().find(x => x.id === id) || null; }
/* المختصر: إلى أول فاصلة («فاعل مرفوع»)، والكامل يظهر بعد الإجابة */
const irbShort = t => t.split(/[،,؛]/)[0].replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' ');
function irbAlts(x){ const mine = irbShort(x.w.i); const pool = [...new Set(irbList().map(y => irbShort(y.w.i)))].filter(t => t !== mine); const same = [...new Set(x.s.words.map(w => irbShort(w.i)))].filter(t => t !== mine); return [...new Set([...shuffle(same), ...shuffle(pool)])].slice(0, 3); }
let ibCur = null;
function ibNext(){
  const L = irbList(); if (!L.length){ $('ibQ').textContent = 'لم تُضَف تدريبات بعد.'; return; }
  ibCur = pickW('irb', L, x => x.id, ibCur && ibCur.id); const s = ibCur.s;
  const nk = t => strip(t).replace(/[^\u0621-\u064A ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/^و(?=..)/, '').replace(/ا$/, '');
  const target = nk(ibCur.w.w.replace(/^(و|ف)?(ال)?(هاء|كاف|ياء|تاء|نون)\b.*$/, '')); const toks = s.sentence.split(/\s+/);
  let at = target ? toks.findIndex(t => nk(t) === target) : -1; if (at < 0 && target.length > 2) at = toks.findIndex(t => nk(t).startsWith(target) || nk(t).endsWith(target));
  $('ibQ').innerHTML = `<span style="font-family:var(--f-ui);font-size:1.1rem">⟨أعرب|أعربي⟩ «<b>${esc(ibCur.w.w)}</b>» في:</span><br>` + toks.map((t, i) => i === at ? `<mark>${esc(t)}</mark>` : esc(t)).join(' ');
  $('ibFb').textContent = ''; $('ibFb').className = 'fb'; $('ibWhy').hidden = true;
  const a = irbShort(ibCur.w.i);
  mcq($('ibOpts'), [a, ...irbAlts(ibCur)], a, ok => { feedback('ibFb', ok, '⟨أصبت|أصبتِ⟩.', `الصواب: ${a}`);
    $('ibWhy').innerHTML = `<p class="lbl" style="margin:0">إعراب الجملة كما في التحفة (${esc(ibCur.b.bab || '')}، ص ${ibCur.b.page})</p>` + s.words.map(w => `<p style="margin:2px 0"><b>${esc(w.w)}</b>: ${esc(w.i)}</p>`).join(''); $('ibWhy').hidden = false; award('irb', ibCur.id, ok); }, 'm');
}
$('ibNext').addEventListener('click', ibNext);
/* أسئلة الكتاب وتمريناته: الطفل يكتب، وتصل إجابته لولي الأمر (ومساعد الواحة إن أُذن له) */
let tqBab = null;
function tqBabs(){ const has = new Set([...TF.asila, ...TF.tamrin].map(b => b.bab)); return (TF.order || [...has]).filter(b => has.has(b)); }
function renderTq(){
  const R = $('ajTq'); const babs = tqBabs(); if (!babs.length){ R.innerHTML = '<p class="note">لم تُضَف أسئلة بعد.</p>'; return; }
  if (!tqBab || !babs.includes(tqBab)) tqBab = store.get('tqBab', babs[0]); if (!babs.includes(tqBab)) tqBab = babs[0];
  const done = store.get(`tqDone:${kid}`, []);
  R.innerHTML = `<p class="lbl" style="margin:0">أسئلة التحفة السنية وتمريناتها <span class="ref">(⟨اختر|اختاري⟩ بابًا، ثم سؤالًا، و⟨اكتب|اكتبي⟩ جوابك)</span></p><div class="chips" id="tqChips">${babs.map((b, i) => `<button class="chip2" type="button" data-i="${i}" aria-pressed="${b === tqBab}">${esc(b.replace(/^باب\s*/, ''))}</button>`).join('')}</div><div class="queue" id="tqList"></div>`;
  R.querySelector('#tqChips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tqBab = babs[+b.dataset.i]; store.set('tqBab', tqBab); renderTq(); });
  const L = R.querySelector('#tqList'); const items = [];
  TF.asila.filter(b => b.bab === tqBab).forEach(b => b.items.forEach((q, i) => items.push({id:`a${b.page}-${i}`, kind:'سؤال', text:q, page:b.page})));
  TF.tamrin.filter(b => b.bab === tqBab).forEach(b => b.items.forEach((t, i) => items.push({id:`t${b.page}-${i}`, kind:'تمرين', text:`${t.n ? t.n + ' ' : ''}${t.text}`, list:t.list || [], page:b.page})));
  items.forEach(it => { const d = el('div','qi'); const ok = done.includes(it.id);
    d.innerHTML = `<div class="row" style="justify-content:space-between"><span class="chip">${it.kind} · ص ${it.page}</span>${ok ? '<span class="badge ok">⟨أرسلتَه|أرسلتِه⟩</span>' : ''}</div><p style="margin:4px 0">${esc(it.text)}</p>${it.list && it.list.length ? `<p class="q s" style="margin:0">${it.list.map(esc).join(' · ')}</p>` : ''}`;
    const open = el('button','btn ghost sm', ok ? '⟨اكتب|اكتبي⟩ جوابًا آخر' : '⟨اكتب|اكتبي⟩ جوابك'); open.type = 'button'; open.style.alignSelf = 'flex-start';
    open.addEventListener('click', () => { open.remove(); const box = el('div', null, `<textarea class="f" rows="3" style="width:100%" placeholder="جوابك"></textarea><div class="btns" style="justify-content:flex-start"><button class="btn sm" type="button" data-a="send">⟨أرسل|أرسلي⟩ لولي الأمر</button>${SAMPLE ? '<button class="btn ghost sm" type="button" data-a="ai">صحّحه مساعد الواحة</button>' : ''}</div><p class="fb"></p><div class="aio"></div>`); d.appendChild(box);
      const ta = box.querySelector('textarea'), fb = box.querySelector('.fb');
      const mark = () => { const dd = store.get(`tqDone:${kid}`, []); if (!dd.includes(it.id)){ dd.push(it.id); store.set(`tqDone:${kid}`, dd); } };
      box.querySelector('[data-a=send]').addEventListener('click', () => { const t = ta.value.trim(); if (!t){ fb.textContent = '⟨اكتب|اكتبي⟩ جوابك أولًا.'; fb.className = 'fb bad'; return; } queueAdd({kind:`${it.kind} التحفة`, title:`${tqBab}: ${it.text.slice(0, 80)}`, text:t}); mark(); fb.textContent = 'أُرسل إلى ولي الأمر.'; fb.className = 'fb ok'; });
      const ai = box.querySelector('[data-a=ai]'); if (ai) ai.addEventListener('click', () => { if (!ta.value.trim()) return; mark(); aiFeedback(ai, box.querySelector('.aio'), 'جوابًا عن سؤال في النحو', ta.value, `السؤال من «التحفة السنية» (${tqBab}): «${it.text}${it.list && it.list.length ? ' — ' + it.list.join('، ') : ''}». قيّم صحة الجواب نحويًّا وفق مذهب الآجرومية، ثم الإملاء.`, `${tqBab}: ${it.text.slice(0, 60)}`, `${it.kind} التحفة`); });
      ta.focus(); });
    d.appendChild(open); L.appendChild(d); });
}
RESETS.push(() => { ibCur = null; });


/* ================= الصوت: صوت واحد في كل لحظة؛ تسجيل ولي الأمر لهذا النص إن وُجد، وإلا القارئ الآلي ================= */
const VX = {token: 0, audio: null, cache: {}, rec: null};
function lineKey(t){ t = String(t || '').replace(/[^\u0621-\u0652\u0670 ]/g, '').replace(/\s+/g, ' ').trim(); let h = 5381; for (const c of t) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'v' + h.toString(36) + t.length; }
async function voiceGet(id){ if (id in VX.cache) return VX.cache[id]; try { const d = await idb(); const r = await new Promise(res => { const q = d.transaction('voice').objectStore('voice').get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); VX.cache[id] = r; return r; } catch (e) { return null; } }
async function voicePut(rec){ const d = await idb(); VX.cache[rec.id] = rec; return new Promise((res, rej) => { const t = d.transaction('voice', 'readwrite'); t.objectStore('voice').put(rec); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function voiceDel(id){ const d = await idb(); delete VX.cache[id]; return new Promise(res => { const t = d.transaction('voice', 'readwrite'); t.objectStore('voice').delete(id); t.oncomplete = res; t.onerror = res; }); }
async function voiceAll(){ try { const d = await idb(); return await new Promise(res => { const q = d.transaction('voice').objectStore('voice').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); }); } catch (e) { return []; } }
/* القارئ الآلي: وقفٌ على آخر الكلمة، والتاء المربوطة هاءً، وحذف علامات الوقف القرآنية */
function ttsText(text){ return String(text || '').replace(/[ۖ-ۭ]/g, '').replace(/[﴿﴾«»()\[\]]/g, ' ').replace(/([^\s.،؛؟!:…]+)(?=\s*(?:[.،؛؟!:…]|$))/gu, w => { const m = w.match(/^(.*?[ء-ي])([ً-ْٰ]*)$/u); if (!m) return w; let b = m[1]; const sh = m[2].includes('ّ') ? 'ّ' : ''; if (b.endsWith('ة')) b = b.slice(0, -1) + 'ه'; return b + sh; }).replace(/\s+/g, ' ').trim(); }
let VOICE_AR = null;
function pickVoice(){ if (!('speechSynthesis' in window)) return null; const vs = speechSynthesis.getVoices(); VOICE_AR = vs.find(v => /^ar/i.test(v.lang) && /female|zeina|hoda|salma|laila/i.test(v.name)) || vs.find(v => /^ar/i.test(v.lang)) || null; return VOICE_AR; }
try { if ('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } } catch (e) {}
/* نطق مؤجّل يُلغى عند التنقل (حتى لا يبدأ درسٌ فوق شاشة سؤاله) */
const SAY_T = [];
function sayLater(parts, ms){ const t = setTimeout(() => { const i = SAY_T.indexOf(t); if (i >= 0) SAY_T.splice(i, 1); say(parts); }, ms || 150); SAY_T.push(t); return t; }
/* إيقاف تسجيل جارٍ بلا حفظ (عند الخروج من البطاقة) حتى لا يبقى الميكروفون مفتوحًا والرفيق أخرس */
function micAbort(){ const r = VX.rec; if (!r) return; VX.rec = null; r.aborted = true; try { r.rec.stop(); } catch (e) {} try { r.stream.getTracks().forEach(t => t.stop()); } catch (e) {} if (r.tick) clearInterval(r.tick); }
function voiceStop(){ VX.token++; SAY_T.splice(0).forEach(clearTimeout); micAbort(); if (typeof companionTalk === 'function') companionTalk(false); try { if (VX.audio){ VX.audio.pause(); } } catch (e) {} VX.audio = null; try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {} document.querySelectorAll('audio').forEach(a => { try { if (!a.dataset.keep) a.pause(); } catch (e) {} }); }
function ttsSay(text, tok){ return new Promise(res => { if (!('speechSynthesis' in window) || store.get('mute', false)){ res(); return; } try { const u = new SpeechSynthesisUtterance(ttsText(text)); u.lang = 'ar-SA'; if (VOICE_AR || pickVoice()) u.voice = VOICE_AR; u.rate = K() && K().age <= 8 ? 0.85 : 0.95; u.onend = u.onerror = () => res(); speechSynthesis.speak(u); setTimeout(res, 2500 + 160 * String(text).length); } catch (e) { res(); } }); }
/* say(text | [parts]): كل جزء يُسمع بتسجيل ولي الأمر إن سُجّل، وإلا بالقارئ الآلي */
async function say(parts, opts){
  if (VX.rec) return; voiceStop(); const tok = ++VX.token; parts = Array.isArray(parts) ? parts : [parts]; companionTalk(true);
  for (const p of parts){ if (tok !== VX.token || !p) continue;
    const r = await voiceGet(lineKey(p));
    if (tok !== VX.token) break;
    if (r && r.blob){ await new Promise(res => { const u = URL.createObjectURL(r.blob); const a = new Audio(u); VX.audio = a; a.onended = a.onerror = () => { URL.revokeObjectURL(u); res(); }; const pp = a.play(); if (pp && pp.catch) pp.catch(() => res()); }); }
    else await ttsSay(p, tok); }
  if (tok === VX.token) companionTalk(false);
}
function companionTalk(on){ document.querySelectorAll('.cmp').forEach(e => e.classList.toggle('talk', !!on)); }
/* زر صغير «اسمع» بجانب أي نص */
function hearBtn(text){ const b = el('button','hear','🔊'); b.type = 'button'; b.setAttribute('aria-label','⟨اسمع|اسمعي⟩'); b.addEventListener('click', e => { e.stopPropagation(); say(text); }); return b; }

/* ================= الميكروفون: ضغطة للبدء وضغطة للإيقاف، ثم يسمع صوته فورًا ================= */
const MIC_OK = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
async function micStart(){
  voiceStop(); const stream = await navigator.mediaDevices.getUserMedia({audio:true});
  const type = ['audio/webm;codecs=opus','audio/mp4','audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  const rec = new MediaRecorder(stream, type ? {mimeType:type} : undefined); const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  VX.rec = {rec, stream, chunks, t0: Date.now(), done: new Promise(res => { rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, {type: rec.mimeType || type || 'audio/webm'})); }; })};
  rec.start(); return VX.rec;
}
async function micStop(){ const r = VX.rec; if (!r) return null; VX.rec = null; try { r.rec.stop(); } catch (e) {} return r.done; }
/* مكوّن التسجيل الكبير: onSaved(blob) — في عارض لا يسمح بالميكروفون نرجع إلى إرفاق ملف */
function micWidget(box, opts){
  box.innerHTML = ''; const w = el('div','mic'); const b = el('button','micb', '<span class="dot"></span>'); b.type = 'button'; b.setAttribute('aria-label','⟨سجّل|سجّلي⟩');
  const lab = el('p','mlab', opts.label || '⟨اضغط|اضغطي⟩ و⟨سجّل|سجّلي⟩'); const prev = el('div','mprev'); w.append(b, lab, prev); box.appendChild(w);
  let tick = null;
  const fin = async blob => { clearInterval(tick); b.classList.remove('on'); lab.textContent = opts.again || '⟨سجّل|سجّلي⟩ مرة أخرى'; prev.innerHTML = ''; const a = audioEl(blob); a.dataset.keep = '1'; prev.appendChild(a); if (opts.onSaved) opts.onSaved(blob); let waited = 0; const t = setInterval(() => { waited += 300; const busy = VX.audio || ('speechSynthesis' in window && speechSynthesis.speaking); if (busy && waited < 8000) return; clearInterval(t); try { const pp = a.play(); if (pp && pp.catch) pp.catch(() => {}); } catch (e) {} }, 300); };
  b.addEventListener('click', async () => {
    if (!MIC_OK){ lab.textContent = 'هذا الجهاز لا يسجّل من هنا؛ ⟨أرفق|أرفقي⟩ تسجيلًا من الجهاز'; const f = document.createElement('input'); f.type = 'file'; f.accept = 'audio/*'; f.setAttribute('capture', ''); f.onchange = () => f.files[0] && fin(f.files[0]); f.click(); return; }
    if (VX.rec){ const blob = await micStop(); if (blob && blob.size && document.body.contains(b)) fin(blob); return; }
    try { await micStart(); b.classList.add('on'); const t0 = Date.now(); lab.textContent = 'أسمعك… ⟨اضغط|اضغطي⟩ ⟨لتتوقف|لتتوقفي⟩'; tick = setInterval(() => { if (!document.body.contains(b)){ clearInterval(tick); return; } lab.textContent = `أسمعك… ${Math.round((Date.now() - t0) / 1000)} ث · ⟨اضغط|اضغطي⟩ ⟨لتتوقف|لتتوقفي⟩`; if (Date.now() - t0 > (opts.max || 120000)) b.click(); }, 500); if (VX.rec) VX.rec.tick = tick; }
    catch (e) { lab.textContent = '⟨اسمح|اسمحي⟩ للتطبيق باستعمال الميكروفون ثم ⟨حاول|حاولي⟩'; if (!w.querySelector('.tiny')){ const alt = el('button','tiny','أو ⟨أرفق|أرفقي⟩ تسجيلًا من الجهاز'); alt.type = 'button'; alt.addEventListener('click', () => { const f = document.createElement('input'); f.type = 'file'; f.accept = 'audio/*'; f.setAttribute('capture', ''); f.onchange = () => f.files[0] && fin(f.files[0]); f.click(); }); w.appendChild(alt); } }
  });
}


/* ================= طبقة الطفل: أول لقاء، والشاشة بزر واحد، ورحلة اليوم ================= */
/* الرفاق: يختار الطفل واحدًا ويسمّيه في أول لقاء */
const CMPS = {
  camel: {name:'جمل', svg: () => `<svg viewBox="-40 -70 90 80">${svgCamel(0, 0, 1.15)}<circle cx="44" cy="-56" r="1.8" fill="#fff"/></svg>`},
  gazelle: {name:'غزال', svg: () => `<svg viewBox="-30 -55 65 62">${svgGazelle(0, 0, 1.1)}</svg>`},
  owl: {name:'بومة', svg: () => `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="58" rx="30" ry="34" fill="#8a6235"/><ellipse cx="50" cy="66" rx="18" ry="22" fill="#e9c89a"/><circle cx="38" cy="42" r="12" fill="#fff"/><circle cx="62" cy="42" r="12" fill="#fff"/><circle cx="39" cy="43" r="5.5" fill="#2b2416"/><circle cx="61" cy="43" r="5.5" fill="#2b2416"/><path d="M46 52 l4 7 l4 -7 Z" fill="#e8742a"/><path d="M24 28 l8 10 M76 28 l-8 10" stroke="#5b3a1a" stroke-width="5" stroke-linecap="round"/></svg>`},
  falcon: {name:'صقر', svg: () => `<svg viewBox="0 0 100 100"><path d="M50 22 q22 4 24 30 q2 26 -24 40 q-26 -14 -24 -40 q2 -26 24 -30 Z" fill="#6e5032"/><path d="M50 50 q12 4 12 20 q-4 14 -12 18 q-8 -4 -12 -18 q0 -16 12 -20 Z" fill="#e9c89a"/><circle cx="42" cy="38" r="5" fill="#fff"/><circle cx="58" cy="38" r="5" fill="#fff"/><circle cx="42" cy="38" r="2.6" fill="#2b2416"/><circle cx="58" cy="38" r="2.6" fill="#2b2416"/><path d="M46 44 q4 8 8 0 q-2 6 -4 8 q-2 -2 -4 -8 Z" fill="#f6c453"/><path d="M26 50 q-16 6 -18 26 q14 -6 22 -14 Z M74 50 q16 6 18 26 q-14 -6 -22 -14 Z" fill="#5b3a1a"/></svg>`},
};
const CMP_NAMES = ['ناجي', 'نور', 'سهيل', 'ريم', 'برق', 'زاد'];
const cmpGet = () => store.get(`cmp:${kid}`, null);
const cmpSvg = () => { const c = cmpGet(); return (CMPS[c && c.kind] || CMPS.camel).svg(); };
const cmpName = () => (cmpGet() || {}).name || 'رفيقك';
let LIB = false;
const kidMode = () => store.get(`kidMode:${kid}`, true);

/* جمل الرفيق: يسجّلها ولي الأمر في «صوت الرفيق»؛ وما لم يُسجَّل يقرؤه القارئ الآلي */
const CL = {
  hello: () => T('أهلًا بك في واحتك!', 'أهلًا بكِ في واحتكِ!'),
  pick: () => T('اختر رفيقك في الرحلة', 'اختاري رفيقكِ في الرحلة'),
  nameMe: () => T('ماذا تسمّيني؟', 'ماذا تسمّينني؟'),
  plant: () => T('هذه أرض واحتك. اضغط على الرمل لتغرس أول بذرة', 'هذه أرض واحتكِ. اضغطي على الرمل لتغرسي أول بذرة'),
  planted: () => T('غرستَ أول بذرة! كل يوم تتعلّم فيه تكبر واحتك', 'غرستِ أول بذرة! كل يوم تتعلّمين فيه تكبر واحتكِ'),
  ready: () => T('هيا نبدأ رحلة اليوم', 'هيا نبدأ رحلة اليوم'),
  greet: () => pick([T('مرحبًا! واحتك تنتظرك', 'مرحبًا! واحتكِ تنتظركِ'), T('اشتقتُ إليك! هيا نكمل الرحلة', 'اشتقتُ إليكِ! هيا نكمل الرحلة'), T('السلام عليكم! عندي لك رحلة جميلة اليوم', 'السلام عليكم! عندي لكِ رحلة جميلة اليوم')]),
  doneToday: () => T('أكملتَ رحلة اليوم! أحسنت', 'أكملتِ رحلة اليوم! أحسنتِ'),
  right: () => pick([T('أحسنت!', 'أحسنتِ!'), 'ممتاز!', 'صحيح، بارك الله فيك', T('رائع! أنت تتعلّم بسرعة', 'رائع! أنتِ تتعلّمين بسرعة')]),
  near: () => T('قريب جدًّا! انظر إلى الصواب', 'قريب جدًّا! انظري إلى الصواب'),
  wrong: () => pick([T('لا بأس، انظر إلى الجواب الصحيح', 'لا بأس، انظري إلى الجواب الصحيح'), T('ليس هذا، لكنك ستتذكّره في المرة القادمة', 'ليس هذا، لكنكِ ستتذكّرينه في المرة القادمة')]),
  recAsk: () => T('اقرأ هذا بصوتك، وسأحفظه لأبيك', 'اقرئي هذا بصوتكِ، وسأحفظه لأبيكِ'),
  recDone: () => T('صوتك جميل! حفظتُه لأبيك', 'صوتكِ جميل! حفظتُه لأبيكِ'),
  tripEnd: () => T('انتهت رحلة اليوم! انظر ماذا نبت في واحتك', 'انتهت رحلة اليوم! انظري ماذا نبت في واحتكِ'),
  again: () => T('هل تريد رحلة أخرى؟', 'هل تريدين رحلة أخرى؟'),
  learn: () => T('تعلّم هذا معي', 'تعلّمي هذا معي'),
  listen: () => T('اسمع جيدًا، ثم أسألك', 'اسمعي جيدًا، ثم أسألكِ'),
  now: () => 'والآن:',
  remember: () => T('تذكُر هذا؟', 'تذكرين هذا؟'),
  seeAnswer: () => T('انظر', 'انظري'),
};
/* كل صيغ جمل الرفيق (للمذكر والمؤنث) لاستوديو التسجيل */
function clVariants(){ const lines = new Set(); for (const k of Object.keys(CL)){ const src = CL[k].toString(); const re = /T\('([^']+)',\s*'([^']+)'\)|'([^']{4,})'/g; let m; while ((m = re.exec(src))){ if (m[1]){ lines.add(m[1]); lines.add(m[2]); } else if (m[3] && /[\u0600-\u06FF]/.test(m[3])) lines.add(m[3]); } } return [...lines]; }

/* صوت قصير للصواب والخطأ */
let ACX = null;
function chime(ok){ if (store.get('mute', false)) return; try { ACX = ACX || new (window.AudioContext || window.webkitAudioContext)(); const t = ACX.currentTime; (ok ? [523, 659, 784] : [330, 262]).forEach((f, i) => { const o = ACX.createOscillator(), g = ACX.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.setValueAtTime(0.0001, t + i * 0.11); g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.11 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.28); o.connect(g).connect(ACX.destination); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.3); }); if (navigator.vibrate) navigator.vibrate(ok ? 30 : [20, 40, 20]); } catch (e) {} }
function cmpHappy(){ document.querySelectorAll('.cmp').forEach(e => { e.classList.remove('happy'); void e.offsetWidth; e.classList.add('happy'); }); }
/* text: نص أو مصفوفة أجزاء (كل جزء يُبحث عن تسجيل الأب له على حدة، فالاسم والجملة جزءان) */
function talkRow(text, opts){ const parts = Array.isArray(text) ? text.filter(Boolean) : [text]; const r = el('div','ktalk'); r.innerHTML = `<div class="cmp">${cmpSvg()}</div>`; const b = el('div','bubble'); b.innerHTML = esc(parts.reduce((acc, p, i) => i ? acc + (/[؟!.:،]$/.test(acc) ? ' ' : '، ') + p : p, '')); text = parts; const h = hearBtn(text); h.style.marginInlineStart = '8px'; b.appendChild(h); r.appendChild(b); if (!opts || opts.say !== false) sayLater(text, 150); return r; }
const dates = () => store.get(`dates:${kid}`, 0);

/* ---------------- أول لقاء ---------------- */
let HELLO = {step: 0, kind: 'camel', name: ''};
function renderHello(){
  const C = $('kidHello'); C.innerHTML = '';
  if (HELLO.step === 0){
    C.appendChild(talkRow([K().name, CL.hello(), CL.pick()]));
    const g = el('div','pickc'); Object.entries(CMPS).forEach(([k, c]) => { const b = el('button', null, `${c.svg()}<span>${c.name}</span>`); b.type = 'button'; b.setAttribute('aria-pressed', k === HELLO.kind); b.addEventListener('click', () => { HELLO.kind = k; HELLO.step = 1; renderHello(); }); g.appendChild(b); }); C.appendChild(g);
  } else if (HELLO.step === 1){
    C.appendChild(talkRow(CL.nameMe()));
    const big = el('div','cmp'); big.style.cssText = 'width:150px;height:150px;align-self:center'; big.innerHTML = CMPS[HELLO.kind].svg(); C.appendChild(big);
    const g = el('div','chips'); g.style.justifyContent = 'center'; CMP_NAMES.forEach(n => { const b = el('button','chip2', n); b.type = 'button'; b.style.fontSize = '1.3rem'; b.addEventListener('click', () => { HELLO.name = n; inp.value = n; say(n); }); g.appendChild(b); }); C.appendChild(g);
    const inp = document.createElement('input'); inp.className = 'f'; inp.placeholder = 'أو ⟨اكتب|اكتبي⟩ اسمًا'; inp.style.cssText = 'font-size:1.3rem;text-align:center'; inp.value = HELLO.name; C.appendChild(inp);
    const ok = el('button','bigplay','هذا اسمي ✓'); ok.type = 'button'; ok.addEventListener('click', () => { HELLO.name = inp.value.trim() || HELLO.name || CMP_NAMES[0]; HELLO.step = 2; store.set(`cmp:${kid}`, {kind: HELLO.kind, name: HELLO.name}); renderHello(); }); C.appendChild(ok);
    const back = el('button','tiny','← رفيق آخر'); back.type = 'button'; back.addEventListener('click', () => { HELLO.step = 0; renderHello(); }); C.appendChild(back);
  } else {
    C.appendChild(talkRow([`أنا ${HELLO.name}!`, CL.plant()]));
    const sand = el('div','sand'); sand.innerHTML = sceneSvg(new Set(), '') + `<div class="tap">🌱 ${T('اضغط هنا', 'اضغطي هنا')}</div>`; C.appendChild(sand);
    const plantBtn = el('button','bigplay', '🌱 ' + T('اغرس البذرة', 'اغرسي البذرة')); plantBtn.type = 'button'; C.appendChild(plantBtn);
    const doPlant = () => { if (store.get(`planted:${kid}`, false)) return; store.set(`planted:${kid}`, Date.now()); chime(true); sand.innerHTML = sceneSvg(new Set(['seed']), 'seed'); plantBtn.remove(); const t = talkRow(CL.planted()); C.replaceChild(t, C.firstChild); cmpHappy();
      const go_ = el('button','bigplay','▶ ' + CL.ready()); go_.type = 'button'; go_.addEventListener('click', () => { HELLO = {step: 0, kind: 'camel', name: ''}; startTrip(); }); C.appendChild(go_); };
    sand.addEventListener('click', doPlant, {once: true}); plantBtn.addEventListener('click', doPlant, {once: true});
  }
}

/* ---------------- الشاشة الأولى: الواحة وزر واحد ---------------- */
/* ذاكرة الرفيق: يذكّر بكلمة الأمس، ويلاحظ الغياب */
function lastActiveDay(){ let best = null; store.keys().forEach(k => { const m = /^dailyDone:(\d+):(\d{4})-(\d\d)-(\d\d)$/.exec(k); if (m && +m[1] === kid){ const d = dayN(new Date(+m[2], +m[3] - 1, +m[4])); if (best == null || d > best) best = d; } }); return best; }
function companionMemory(first){ const out = []; const last = lastActiveDay(); const gap = last == null ? 0 : dayN() - last - 1;   // أيام الغياب بين آخر رحلة واليوم
  if (last == null) out.push(T('مرحبًا! واحتك تنتظرك', 'مرحبًا! واحتكِ تنتظركِ'));
  else if (first && gap >= 2) out.push(T(`غبتَ ${gap === 3 ? 'ثلاثة أيام' : gap <= 10 ? gap + ' أيام' : 'أيامًا كثيرة'}! اشتقتُ إليك`, `غبتِ ${gap === 3 ? 'ثلاثة أيام' : gap <= 10 ? gap + ' أيام' : 'أيامًا كثيرة'}! اشتقتُ إليكِ`));
  else out.push(CL.greet());
  const y = store.get(`bag:${kid}`, []).find(w => w.day === dayN() - 1 || w.day === dayN() - 2);
  if (first && y && Math.random() < .8){ const when = y.day === dayN() - 1 ? 'أمس' : 'قبل يومين'; out.push(T(`${when} تعلّمتَ كلمة «${y.w}». هل تذكر معناها؟`, `${when} تعلّمتِ كلمة «${y.w}». هل تذكرين معناها؟`)); }
  return out; }
/* صندوق مراجعة واحد: ما أخطأ فيه الطفل في «كنوز البيان» أو في الحسنية يُعلَّم هنا خطأً، فيعود إليه في رحلة اليوم (بدرسه أولًا) */
function importMisses(){ const S = window.KZ_SECTIONS; if (!S || !S.misses) return 0; let n = 0;
  try { const seenAt = store.get(`missSeen:${kid}`, 0); const list = S.misses(kid, seenAt); const hsq = (DATA.hasaniya && DATA.hasaniya.quizzes) || [];
    list.forEach(x => { const ids = x.g === 'kz' ? [x.id] : hsq.filter(q => q.ref === x.id).map(q => q.id);
      ids.forEach(id => { if (!GEN[x.g] || !GEN[x.g](id)) return; const m = mget(x.g, id); if (m.lw != null && m.lw >= dayN(x.t)) return;
        m.n++; m.wrong++; m.streak = 0; m.due = null; m.lw = dayN(x.t); m.t = Date.now(); store.set(MK(x.g, id), m);
        const sn = seen(x.g); if (!sn.includes(id)){ sn.push(id); store.set(`seen:${kid}:${x.g}`, sn); } n++; }); });
    store.set(`missSeen:${kid}`, Date.now()); } catch (e) {}
  return n; }
/* ما جمعه الطفل في القسمين الآخرين، في عدّاد مشهده: جواهر «كنوز البيان» (من الثامنة) ومحطات الحسنية */
function secCounts(){ const S = window.KZ_SECTIONS; if (!S) return ''; let out = '';
  try { if (K().age >= 8){ const z = S.kunuz(kid); if (z.gems) out += ` · 💎 ${z.gems}`; } const h = S.hasaniya(kid); if (h.stations) out += ` · 🐪 ${h.stations}`; } catch (e) {}
  return out; }
/* «سطر اليوم» و«تقرير الجمعة»: القسمان الآخران في سطر واحد لكل طفل */
function secLine(i, since, k){ const S = window.KZ_SECTIONS; if (!S) return ''; const f = k.gender === 'f'; const parts = [];
  try {
    const z = S.kunuz(i, since); const titles = z.fresh.map(id => (KZD.lessons.find(l => l.id === id) || {}).title).filter(Boolean);
    parts.push('💎 كنوز البيان: ' + (titles.length ? (titles.length > 3 ? `${titles.length} دروس` : titles.map(t => `«${t}»`).join('، ')) : 'لا جديد') + ` (المجموع ${z.gems} من ${KZD.lessons.length})`);
    const h = S.hasaniya(i, since);
    parts.push('🐪 الحسنية: ' + (h.verses || h.stamped ? [h.verses ? `${h.verses} ${h.verses === 1 ? 'بيت' : h.verses === 2 ? 'بيتان' : 'أبيات'}` : '', h.stamped ? `${f ? 'ختمت' : 'ختم'} ${h.stamped === 1 ? 'محطة' : h.stamped + ' محطات'}` : ''].filter(Boolean).join('، ') : 'لا جديد') + (since ? `، أيام الفتح ${h.days}` : '') + ` (المحطات ${h.stations}، النقاط ${h.points})`);
  } catch (e) {}
  return parts.join(' · '); }
async function renderKidHome(){
  const C = $('kidHome'); C.innerHTML = ''; const u = unlockedSet(); if (store.get(`planted:${kid}`, false)) u.add('seed');
  const tripDone = store.get(`trip:${kid}:${today()}`, null) && store.get(`trip:${kid}:${today()}`).done;
  const firstToday = !store.get(`greeted:${kid}:${today()}`, false);
  C.appendChild(talkRow(tripDone ? CL.doneToday() : [K().name, ...companionMemory(firstToday)], {say: firstToday})); store.set(`greeted:${kid}:${today()}`, true);
  /* رسالة من ولي الأمر لم تُسمع بعد */
  try { const msgs = (await recAll()).filter(r => r.kind === 'من أبي' && r.to === kid && !r.heard).sort((a, b) => b.id.localeCompare(a.id)); if (msgs.length){ const m = msgs[0]; const box = el('div','kcard msg'); box.innerHTML = `<p class="kq" style="margin:0">💌 ${T('رسالة لك من أبيك', 'رسالة لكِ من أبيكِ')}${m.text ? `: ${esc(m.text)}` : ''}</p>`; const pl = el('button','bigplay','▶ ' + T('اسمعها', 'اسمعيها')); pl.type = 'button'; pl.style.marginTop = '6px';
    pl.addEventListener('click', async () => { voiceStop(); if (m.blob){ const a = new Audio(URL.createObjectURL(m.blob)); a.dataset.keep = '1'; VX.audio = a; companionTalk(true); a.onended = () => companionTalk(false); a.play().catch(() => {}); } else if (m.text) say(m.text); m.heard = true; try { await recPut(m); } catch (e) {} pl.textContent = '✓ ' + T('سمعتَها', 'سمعتِها'); cmpHappy(); }); box.appendChild(pl); C.appendChild(box); } } catch (e) {}
  { const y = store.get(`bag:${kid}`, []).find(w => w.day === dayN() - 1 || w.day === dayN() - 2); if (firstToday && y && !tripDone && C.firstChild && C.firstChild.textContent.includes(y.w)){ const rv = el('button','tiny', ((cmpGet() || {}).kind === 'owl' ? 'أريني المعنى' : 'أرني المعنى')); rv.type = 'button'; rv.addEventListener('click', () => { rv.replaceWith(el('p','lrn', `${y.w}: ${y.m}`)); say([y.w, y.m]); }); C.appendChild(rv); } }
  const sc = el('div','kscene'); const ds = dayStreak(); sc.innerHTML = kidScene(u, '') + `<span class="cnt">🌴 ${tripsDone()} · 🟤 ${dates()}${secCounts()}${ds > 1 ? ` · 🔥 ${ds}` : ''}</span>` + (K().photo ? `<span class="kav">${avatarHtml(K(), 44)}</span>` : ''); C.appendChild(sc);
  if (!tripDone){ const nx = el('p','note', T(`رحلة اليوم تكبر نخلتك وتأتيك بهدية جديدة`, `رحلة اليوم تكبر نخلتكِ وتأتيكِ بهدية جديدة`)); nx.style.cssText = 'text-align:center;margin:0'; C.appendChild(nx); }
  const t = store.get(`trip:${kid}:${today()}`, null);
  const play = el('button', 'bigplay' + (tripDone ? ' done' : ''), tripDone ? '▶ رحلة إضافية' : t && t.i > 0 ? '▶ ⟨أكمل|أكملي⟩ رحلة اليوم' : '▶ رحلة اليوم'); play.type = 'button';
  play.addEventListener('click', () => startTrip(tripDone)); C.appendChild(play);
  if (tripDone && msDue()){ const mc = el('div','kcard'); mc.style.padding = '12px 14px'; mc.innerHTML = `<p class="lbl" style="margin:0">🧭 قياس الشهر</p><p style="margin:4px 0">${T('أسئلةٌ قليلة، ثلاث دقائق. لنعرف كم تعلّمت', 'أسئلةٌ قليلة، ثلاث دقائق. لنعرف كم تعلّمتِ')}</p>`; const mb = el('button','btn sm', '⟨ابدأ|ابدئي⟩'); mb.type = 'button'; mb.id = 'msGo'; mb.addEventListener('click', startMeasure); mc.appendChild(mb); C.appendChild(mc); }
  const row = el('div','krow');
  const all = await recAll(); const gifts = await dbAll('gift').catch(() => []); const newGifts = gifts.filter(g => g.to === kid && g.status === 'sent').length;
  const bagN = store.get(`bag:${kid}`, []).length;
  const tiles = [
    /* «كنوز البيان» مكتوبة لسنّ ٩–١٢: تظهر من الثامنة، أو لمن فتح له وليّ الأمر «كل الواحات» */
    ...(K().age >= 8 || store.get(`libOpen:${kid}`, false) ? [['💎', 'كنوز البيان', () => kunuzGo('kunuz'), 0]] : []),
    ...(ramadanNow() ? [['🌙', 'لمسات رمضان', () => kunuzGo('rm'), 0]] : []),
    ['👜', 'كلماتي', () => go('bag', 'kidBag'), bagN],
    ['🗣', '⟨قل|قولي⟩ الجملة', () => go('say', 'kidSay'), 0],
    ...(kids.length >= 2 ? [['👨‍👩‍👧‍👦', 'تحدّي العائلة', () => go('fam', 'kidFam'), 0]] : []),
    ['🎙', 'صوتي', () => go('rec', 'recShelf'), 0],
    ['🎁', 'هداياي', () => go('rec', 'giftShelf'), newGifts],
    ['📻', 'الإذاعة', () => go('radio'), 0],
    ['🗺', 'كل الواحات', () => { LIB = true; go('home'); }, 0],
  ];
  if (window.WAHA_APP) tiles.splice(2, 0, ['🐪', 'الحسنية', () => { location.href = 'hasaniya/index.html?kid=' + encodeURIComponent((window.KZ_IDS || [])[kid] || ''); }, 0]);
  if (K().age < 9 && !store.get(`libOpen:${kid}`, false)) tiles.splice(tiles.findIndex(t => t[1] === 'كل الواحات'), 1);
  tiles.forEach(([e, n, f, badge]) => { const b = el('button','ktile', `<span class="e">${e}</span>${n}${badge ? `<span class="n">${badge}</span>` : ''}`); b.type = 'button'; b.addEventListener('click', () => { voiceStop(); f(); }); row.appendChild(b); });
  C.appendChild(row);
  const amal = typeof amalToday === 'function' ? amalToday() : null;
  if (amal){ const log = store.get(`amalLog:${kid}`, []); const t = log.find(x => x.id === amal.id && x.date === today());
    const a = el('div','card'); a.style.padding = '12px 14px'; a.innerHTML = `<p class="lbl" style="margin:0">🌱 ⟨اعمل|اعملي⟩ به اليوم</p><p style="margin:4px 0;font-size:1.15rem;font-weight:700">${esc(amal.deed)}</p>`; const r = el('div','btns'); r.style.justifyContent = 'flex-start'; r.appendChild(hearBtn(amal.deed));
    if (!t){ const b = el('button','btn sm','فعلتُها اليوم ✓'); b.type = 'button'; b.addEventListener('click', () => { log.push({id: amal.id, date: today(), confirmed: false}); store.set(`amalLog:${kid}`, log); chime(true); cmpHappy(); say(T('بارك الله فيك! سأخبر أباك', 'بارك الله فيكِ! سأخبر أباكِ')); renderKidHome(); }); r.appendChild(b); }
    else r.appendChild(el('span', 'badge ' + (t.confirmed ? 'ok' : 'wait'), t.confirmed ? 'أكّدها أبوك ⭐' : 'سيراها أبوك'));
    a.appendChild(r); C.appendChild(a); }
}

/* ---------------- رحلة اليوم ---------------- */
/* الألعاب بحسب العمر: الصغير (≤7) لا يرى الآجرومية ولا «من القائل» التصنيفي؛ القصص تُرشَّح بطولها وأسئلتها بنوعها */
const G_AGE = { 7: ['hys', 'hyc', 'uk', 'gzd', 'gzw', 'hk', 'rl', 'nt', 'tri', 'hsq'], 9: ['hys', 'hyc', 'uk', 'gzd', 'gzw', 'hk', 'rl', 'nt', 'tri', 'wh', 'dct', 'ajc', 'hsq', 'kz'],
  99: ['drv', 'cnj', 'irb', 'ajd', 'sha', 'shl', 'fill', 'pml', 'dct', 'gzw', 'gzf', 'ajc', 'nt', 'sfr', 'hk', 'wh', 'uk', 'tri', 'hsq', 'kz'] };
/* رحلة واحدة من الأقسام كلها: في كل رحلة سؤال من المنظومة الحسنية، ومن الثامنة سؤال من «كنوز البيان» */
const TRIP_ALWAYS = ['hsq', 'kz'];
function gamesFor(age){ return G_AGE[age <= 7 ? 7 : age <= 9 ? 9 : 99]; }
const SMALL_G = G_AGE[9], BIG_G = G_AGE[99];
function genPick(g, avoid){ const ids = (POOL[g] ? POOL[g]() : []).filter(id => !avoid.has(g + '|' + id)); if (!ids.length) return null; const fresh = ids.filter(id => mget(g, id).n === 0), weak = ids.filter(id => { const m = mget(g, id); return m.n && m.streak < 2; }); const id = pick(weak.length && Math.random() < .6 ? weak : fresh.length ? fresh : ids); let q = null; try { q = GEN[g](id); } catch (e) {} return q && q.a && q.alts && q.alts.length ? {g, id, ...q} : null; }
/* علّم ثم اسأل: كل عنصر جديد تسبقه بطاقة «تعلّم» ثم بطاقة أخرى فاصلة ثم سؤاله (لا نسخ فوري)؛ الجواب بعد الدرس لا يُحتسب في سلسلة الإتقان.
   المنسي (خطأ بعد الدرس) يعود إليه درسه. القصة والمقالة تُقرآن كاملتين قبل أسئلتهما. الألغاز وحدها تحمل مادتها في سؤالها. */
const SELF_G = new Set(['gzw', 'gzd', 'gzf']);
const vtext = v => v ? `${v.text} (${v.name} ${v.a})` : '';
const vsnip = v => v ? `${snip(v.text, v.word, 7)} (${v.name} ${v.a})` : '';
const LEARN = {
  kz: id => { const x = kzFind(id); if (!x) return null; const v = (x.L.verses || [])[0];
    return {t: `كنوز البيان · ${KZD.axes[x.L.ax] || ''}`, big: v ? kzPlain(v.t) : x.L.title, body: [x.L.take, ...(x.L.secret || []).slice(0, 2)].map(kzPlain), quiet: v ? [`${v.n} ${v.a}`] : []}; },
  hys: id => { const x = HY.situations.find(q => q.id === id); return x && {t: 'ماذا نقول؟', big: x.options[0], body: [x.q, `في هذا الموقف نقول: ${x.options[0]}`]}; },
  hyc: id => { const t = HY.things.find(x => x.noun === id); const c = t && COLOR[t.color]; return c && {t: 'الألوان', big: `${t.noun} ${t.g === 'm' ? c.m : c.f}`, swatch: c.css, body: [`«${t.noun}» ${t.g === 'm' ? 'كلمة مذكّرة، فنقول: ' + c.m : 'كلمة مؤنّثة، فنقول: ' + c.f}`, `(مذكّر: ${c.m} · مؤنّث: ${c.f})`]}; },
  uk: id => { const [k, l] = id.split('|'); const u = ALL[k] && ALL[k].unknown.find(x => x.lemma === l); return u && {t: 'كلمة جديدة', big: u.verse ? u.verse.word : u.lemma, bagWord: u.lemma, bagMeaning: u.meaning, body: [`${u.lemma}: ${u.meaning}`, u.verse ? `في القرآن: ${vsnip(u.verse)}` : ''], quiet: u.verse ? [vsnip(u.verse)] : []}; },
  hk: id => { const x = HIK.find(q => q.text === id); return x && {t: x.kind || 'مثل', big: x.text, body: [`معناه: ${x.meaning}`, x.when ? `نقوله ${x.when.replace(/^عندما/, 'عندما')}` : '']}; },
  rl: id => { const [k, q] = id.split('|'); const P = ALL[k]; const r = P && P.roles.find(x => x.q === q); if (!r) return null; const exact = P.family.filter(x => x.lemma === r.a), loose = P.family.filter(x => strip(x.lemma) === strip(r.a)); const f = exact[0] || (loose.length === 1 ? loose[0] : null); return {t: `من جذر ${P.root}`, big: r.a, bagWord: r.a, bagMeaning: f ? f.meaning : r.q.replace(/؟$/, ''), body: [`${r.q.replace(/؟$/, '')}؟ ← ${r.a}`, f ? `معناها: ${f.meaning}` : '', f && f.sentence ? f.sentence : '']}; },
  wh: id => { const x = HAD.items.find(q => q.id === id); return x && {t: x.catName || 'من القائل', big: x.focus, body: [`القائل: ${x.speaker || WHO_L[x.cat]}`, x.meaning ? `معناه: ${x.meaning}` : '', x.bookName ? `${x.bookName} ${x.ref || ''}` : ''], quiet: [x.bookName ? `${x.bookName} ${x.ref || ''}` : '']}; },
  hsq: id => { const x = (DATA.hasaniya && DATA.hasaniya.quizzes || []).find(q => q.id === id); return x && {t: `المنظومة الحسنية · ${x.station}`, big: x.verse, body: [x.event ? `الحدث: ${x.event}` : '', x.explain || '']}; },
  tri: id => { const x = triApproved().find(t => t.id === id); return x && {t: 'بثلاث لغات', big: x.lemma, body: [[x.zh, x.en].filter(Boolean).join(' / ')]}; },
  ajc: id => { const x = (AJ.counts || []).find(c => c.q === id); return x && {t: 'من نظم الآجرومية', big: `${x.q}: ${x.n}`, body: [x.items.join('، ')]}; },
  ajd: id => { const x = AJ.defs.find(d => d.term === id); return x && {t: 'من الآجرومية', big: x.term, body: [`قال ابن آجرّوم: ${x.d}`]}; },
  drv: id => { const [k, l] = id.split('|'); const P = ALL[k]; const f = P && P.family.find(x => x.lemma === l); return f && {t: `من جذر ${P.root}، على وزن ${dvPattern(f)}`, big: f.lemma, bagWord: f.lemma, bagMeaning: f.meaning, body: [`معناها: ${f.meaning}`, f.sentence || '']}; },
  cnj: id => { const x = CJ.items.find(y => cjId(y) === id); return x && {t: `تصريف «${x.lemma}» في ${x.aspectName}`, big: `${x.pron}: ${cjDisp(x.form)}`, body: [x.verse ? `في القرآن: ${vsnip(x.verse)}` : ''], quiet: x.verse ? [vsnip(x.verse)] : []}; },
  irb: id => { const x = irbFind(id); return x && {t: 'الإعراب', big: x.s.sentence, body: [`«${x.w.w}»: ${x.w.i}`]}; },
  sha: id => { const x = SH.abyat.find(q => q.id === id); return x && {t: `بيت لـ${x.poet}`, big: x.verses.map(v => `${v.a} ۞ ${v.b}`).join('\n'), body: [x.meaning ? `معناه: ${x.meaning}` : '']}; },
  pml: id => { const [qid, li] = id.split('|'); const q = SH.qasaid.find(x => x.id === qid); const l = q && q.lines[+li]; return l && {t: `${q.title}، ${q.poet}`, big: l.text, body: [q.lesson || '']}; },
  fill: id => { const [k, sa, w] = id.split('|'); let v = null; ALL[k] && ALL[k].family.forEach(f => f.verses.forEach(x => { if (`${x.s}:${x.a}` === sa && strip(x.word) === w) v = x; })); return v && {t: `سورة ${v.name}، الآية ${v.a}`, big: snip(v.text, v.word, 7), body: [`⟨انتبه|انتبهي⟩ للكلمة: ${v.word}`], quiet: [snip(v.text, v.word, 7)]}; },
  dct: id => { const x = DCT.find(y => strip(y.w) === id); return x && {t: 'كلمة', big: x.w, bagWord: x.w, bagMeaning: x.m, body: [`معناها: ${x.m}`]}; },
};
LEARN.shl = LEARN.sha;
function learnCard(g, id){ let L = null; try { L = LEARN[g] && LEARN[g](id); } catch (e) {} if (!L) return null; L.body = (L.body || []).filter(Boolean); return {kind: 'learn', g: 'learn', id: g + '|' + id, ...L}; }
/* يحتاج درسًا: لم يُعلَّم قط (ولم يُجب عنه صوابًا من قبل)، أو نُسي بعد الدرس (آخر خطأ بعد يوم الدرس وسلسلته صفر) */
function needsLearn(c){ if (!c || SELF_G.has(c.g) || !LEARN[c.g]) return false; const m = mget(c.g, c.id); if (!m.lrn) return !m.ok; return m.streak === 0 && m.lw != null && m.lw > m.lrn; }
function markLearned(g, id){ const m = mget(g, id); m.lrn = dayN(); store.set(MK(g, id), m); }
/* الجواب بعد الدرس مباشرة: يُسجَّل محاولةً، ولا يُحتسب في سلسلة الإتقان (الإتقان يُبنى على التذكّر لا على النسخ) */
function awardAfter(g, id, ok){ const m = mget(g, id); m.n++; if (ok === true) m.ok++; else if (ok === false){ m.wrong++; m.streak = 0; m.due = null; m.lw = dayN(); } m.t = Date.now(); store.set(MK(g, id), m); const sn = seen(g); if (!sn.includes(id)){ sn.push(id); store.set(`seen:${kid}:${g}`, sn); } }
/* القصة أو المقالة كاملة ثم سؤالان منها. للصغير: قصة قصيرة وأسئلة مباشرة فقط */
const storyMinAge = x => { const n = (x.retell || '').split(/\s+/).length; return n <= 32 ? 6 : n <= 48 ? 8 : 10; };
const qMinAge = q => /المغزى|جذر|مضحك|صورةً|صورة|قصد|الدرس|لماذا كلام|الأسماء|كم / .test(q.q) ? 10 : 6;
function storyPick(g, avoid){
  const age = K().age; const list = (g === 'nt' ? NT.stories : SF.articles).filter(x => g !== 'nt' || storyMinAge(x) <= age); const qs = x => (g === 'nt' ? x.questions.filter(q => qMinAge(q) <= age) : x.tf);
  const qIdx = x => (g === 'nt' ? x.questions : x.tf).map((q, i) => i).filter(i => g !== 'nt' || qMinAge(x.questions[i]) <= age);
  const fresh = x => qIdx(x).some(i => !mget(g, `${x.id}|${i}`).ok); const cand = list.filter(x => qIdx(x).length && !avoid.has(g + '|' + x.id + '|0'));
  const x = pick(cand.filter(fresh).length ? cand.filter(fresh) : cand); if (!x) return [];
  const idx = shuffle(qIdx(x)).sort((a, b) => (mget(g, `${x.id}|${a}`).ok ? 1 : 0) - (mget(g, `${x.id}|${b}`).ok ? 1 : 0)).slice(0, 2);
  const gl = Object.entries(x.gloss || {}).map(([w, m]) => `${w}: ${m}`); const story = g === 'nt' ? {kind: 'learn', g: 'learn', id: 'nt|' + x.id, t: '⟨اسمع|اسمعي⟩ القصة', big: x.title, body: [x.retell], words: gl, story: true}
    : {kind: 'learn', g: 'learn', id: 'sfr|' + x.id, t: 'من صحيفة الواحة', big: x.title, body: [x.intro, ...(Array.isArray(x.body) ? x.body : [x.body])], words: gl, story: true};
  const out = [story]; idx.forEach(i => { const id = `${x.id}|${i}`; let q = null; try { q = GEN[g](id); } catch (e) {} if (q && q.a){ q.q = q.q.replace(/^.+?:\s*(?=[^:]*$)/, ''); out.push({g, id, ...q, after: true}); avoid.add(g + '|' + id); } });
  return out.length > 1 ? out : [];
}
/* مراجعة القصة بعد أيام: سؤال واحد بلا إعادة القصة، مع سطر تذكير بها */
function storyRecall(avoid){ const age = K().age; const cands = [];
  NT.stories.forEach(x => { if (storyMinAge(x) > age) return; x.questions.forEach((q, i) => { if (qMinAge(q) > age) return; const id = `${x.id}|${i}`; const m = mget('nt', id); if (m.ok && m.streak < 2 && m.t && dayN() - dayN(m.t) >= 3 && !avoid.has('nt|' + id)) cands.push({x, i, id}); }); });
  if (age >= 10) SF.articles.forEach(x => x.tf.forEach((q, i) => { const id = `${x.id}|${i}`; const m = mget('sfr', id); if (m.ok && m.streak < 2 && m.t && dayN() - dayN(m.t) >= 3 && !avoid.has('sfr|' + id)) cands.push({x, i, id, sfr: true}); }));
  const c = pick(cands); if (!c) return null; const g = c.sfr ? 'sfr' : 'nt'; let q = null; try { q = GEN[g](c.id); } catch (e) {} if (!q) return null;
  q.q = q.q.replace(/^.+?:\s*(?=[^:]*$)/, ''); const first = c.sfr ? c.x.intro : (c.x.retell || '').split(/[.!؟]/)[0];
  return {g, id: c.id, ...q, kind: 'review', html: `<p class="note" style="margin:0 0 6px">${esc(c.sfr ? '⟨تذكّر|تذكّري⟩ مقالة' : '⟨تذكّر|تذكّري⟩ قصة')} «${esc(c.x.title)}»: ${esc(first)}.</p>` + (q.html || '')}; }
const TRIP_V = 4;
function buildTrip(extra){
  importMisses();
  const age = K().age; const small = age <= 8; const want = age <= 7 ? 3 : small ? 4 : 5; const qs = [], avoid = new Set();
  const add = c => { if (c && !avoid.has(c.g + '|' + c.id)){ qs.push([c]); avoid.add(c.g + '|' + c.id); } };
  const due = dueList().filter(q => q.g !== 'nt' && q.g !== 'sfr'); due.slice(0, Math.max(2, Math.min(Math.ceil(due.length / 2), small ? 2 : 3))).forEach(q => add({...q, kind: 'review'}));
  const ns = nextStage(); if (ns && ns.g && POOL[ns.g] && gamesFor(age).includes(ns.g)) for (let i = 0; i < 2; i++) add(genPick(ns.g, avoid));
  for (const g of TRIP_ALWAYS) if (gamesFor(age).includes(g) && POOL[g]) add(genPick(g, avoid));
  if (Math.random() < .7) add(storyRecall(avoid));
  let storyDone = false; const pool = shuffle(gamesFor(age).filter(g => POOL[g]));
  for (const g of pool){ if (qs.reduce((n, grp) => n + grp.filter(c => c.kind !== 'learn').length, 0) >= want) break;
    if (g === 'nt' || g === 'sfr'){ if (storyDone) continue; const grp = storyPick(g, avoid); if (grp.length){ qs.push(grp); storyDone = true; } continue; }
    add(genPick(g, avoid)); }
  qs.forEach(grp => { if (grp.length === 1 && needsLearn(grp[0])){ const L = learnCard(grp[0].g, grp[0].id); if (L){ grp.unshift(L); grp[1].after = true; } } });
  if (recCardDue()){ const rc = recCardPick(); if (rc) qs.splice(Math.min(qs.length, 2), 0, [rc]); }
  /* الترتيب: الدرس، ثم بطاقة أخرى فاصلة، ثم سؤاله */
  const seq = []; let pending = null; const flush = () => { if (pending){ seq.push(pending); pending = null; } };
  qs.forEach(grp => { if (grp.length === 2 && grp[0].kind === 'learn' && !grp[0].story){ seq.push(grp[0]); flush(); pending = grp[1]; } else { seq.push(...grp); flush(); } });
  flush();
  if (!extra){ if (tripsDone() % 2 === 1 && store.get(`bag:${kid}`, []).length) seq.push(seenCardPick()); seq.push({g: 'tell', id: 'tell', q: tellQuestion()}); }
  return seq.filter(Boolean);
}
/* بطاقة التسجيل: كل رحلة للكبار، وكل ثالث رحلة للصغار */
function recCardDue(){ return K().age >= 9 || tripsDone() % 3 === 0; }
function recCardPick(){
  const c = [];
  const small = K().age <= 8;
  const mt = MT[mtKey] || MT[MTK[0]]; if (mt && !small) { const v = pick(mt.verses.slice(0, 20)); c.push({kind:'متن', ref:`${mt.name} ${v.n}`, text:`${v.a} ۞ ${v.b}`}); }
  const h = pick(small ? HIK.filter(x => x.text.length <= 30) : HIK); if (h) c.push({kind:'مثل', ref:'الحكم والأمثال', text:h.text});
  const hd = pick(HAD.items.filter(i => i.cat === 'nabi' && (!small || i.focus.length <= 60))); if (hd) c.push({kind:'حديث', ref:`${hd.bookName} ${hd.ref}`, text:hd.focus});
  const x = pick(c); return x ? {g: 'rec', id: 'rec', recItem: x} : null;
}
let TRIP = null;
function startTrip(extra){
  const key = `trip:${kid}:${today()}`; let t = store.get(key, null);
  if (!t || extra || t.done || t.v !== TRIP_V){ t = {v: TRIP_V, cards: buildTrip(!!extra), i: 0, res: [], done: false, extra: !!extra}; if (!extra) store.set(key, t); }
  TRIP = {...t, key: extra ? null : key}; go('trip', 'kidTrip');
}
function tripSave(){ if (TRIP.key) store.set(TRIP.key, {v: TRIP_V, cards: TRIP.cards, i: TRIP.i, res: TRIP.res, done: TRIP.done}); }
function renderTrip(){
  const C = $('kidTrip'); C.innerHTML = ''; if (!TRIP){ go('kid'); return; }
  const top = el('div','row'); top.style.justifyContent = 'space-between';
  const x = el('button','tiny','✕ خروج'); x.type = 'button'; x.addEventListener('click', () => { voiceStop(); go('kid'); });
  const dots = el('div','dots'); TRIP.cards.forEach((c, i) => { const d = document.createElement('i'); if (c.kind === 'learn') d.className = 'learn' + (i < TRIP.res.length ? ' ok' : i === TRIP.i ? ' now' : ''); else if (i < TRIP.res.length) d.className = TRIP.res[i] === false && K().age > 8 ? 'bad' : 'ok'; else if (i === TRIP.i) d.className = 'now'; dots.appendChild(d); });
  top.append(dots, x); C.appendChild(top);
  const c = TRIP.cards[TRIP.i]; if (!c) return tripEnd();
  if (c.g === 'rec') return recCard(C, c);
  if (c.g === 'tell') return tellCard(C, c);
  if (c.g === 'seen') return seenCard(C, c);
  if (c.kind === 'learn') return learnView(C, c);
  const prompt = c.q || '';
  C.appendChild(talkRow(c.kind === 'review' ? [CL.remember(), prompt] : c.after ? [CL.now(), prompt] : prompt, {say: true}));
  const card = el('div','kcard'); if (c.html) card.insertAdjacentHTML('beforeend', `<div class="kq">${c.html}</div>`);
  const o = el('div','kopts'); const tb = el('div'); card.append(o, tb); const fb = el('p','fb'); card.appendChild(fb); C.appendChild(card);
  const next = el('button','bigplay','التالي ◀'); next.type = 'button'; next.hidden = true; C.appendChild(next);
  const done = st => { const ok = st === true || st === 'ok'; const near = st === 'near'; chime(ok); if (ok) cmpHappy();
    if (c.after) awardAfter(c.g, c.id, ok ? true : near ? null : false); else { award(c.g, c.id, ok ? true : near ? null : false); if (!ok && !near){ const m = mget(c.g, c.id); m.lw = dayN(); store.set(MK(c.g, c.id), m); } }
    TRIP.res.push(ok || near); if (ok || near) store.set(`dates:${kid}`, dates() + 1);
    const line = ok ? CL.right() : near ? CL.near() : CL.wrong(); fb.textContent = ok ? line : `${line}: ${c.a}`; fb.className = 'fb ' + (ok ? 'ok' : near ? 'near' : 'bad'); say(ok ? line : [line, c.a]);
    if (c.why){ const w = el('p','lrn'); w.style.cssText = 'margin:6px 0 0;opacity:.85'; w.textContent = c.why; card.appendChild(w); }
    else if (!ok && !near && K().age <= 9){ const L = learnCard(c.g, c.id); if (L && (L.big || L.body.length)){ const why = el('p','lrn'); why.style.cssText = 'margin:6px 0 0;opacity:.85'; why.textContent = [L.big, L.body[0]].filter(Boolean).join(' — ').slice(0, 160); card.appendChild(why); } }
    TRIP.i++; tripSave(); next.hidden = false; next.focus(); };
  if (c.type && K().age >= 10 && Math.random() < .5) typeBox(tb, c.a, {id:'ktIn', onDone: done});
  else mcq(o, [c.a, ...shuffle([...new Set(c.alts.filter(x => x !== c.a))]).slice(0, K().age <= 7 ? 2 : 3)], c.a, done, 'm');
  o.querySelectorAll('.opt').forEach(b => b.addEventListener('pointerdown', () => {}, {passive: true}));
  next.addEventListener('click', () => { voiceStop(); renderTrip(); window.scrollTo({top: 0}); });
}
/* حقيبة الكلمات: كل كلمة جديدة فهمها الطفل في درس تدخل حقيبته */
const BAG_G = new Set(['uk', 'dct', 'drv', 'rl', 'tri']);
function bagAdd(c){ if (c.story) return; const [g] = c.id.split('|'); if (!BAG_G.has(g)) return; const w = c.bagWord || (c.big || '').split('\n')[0]; if (!w) return; const bag = store.get(`bag:${kid}`, []); if (bag.some(x => strip(x.w) === strip(w))) return; bag.unshift({w, m: c.bagMeaning || (c.body || [])[0] || '', g, id: c.id, day: dayN()}); store.set(`bag:${kid}`, bag.slice(0, 500)); }
async function renderKidBag(){
  const C = $('kidBag'); C.innerHTML = ''; const bag = store.get(`bag:${kid}`, []); const recs = (await recAll()).filter(r => r.kid === kid && r.kind === 'كلمة'); const recd = new Set(recs.map(r => r.text));
  const top = el('div','row'); top.style.justifyContent = 'space-between'; const x = el('button','tiny','✕ خروج'); x.type = 'button'; x.addEventListener('click', () => { voiceStop(); go('kid'); }); top.append(el('span','chip', `👜 ${bag.length} ${bag.length === 1 ? 'كلمة' : bag.length === 2 ? 'كلمتان' : bag.length <= 10 ? 'كلمات' : 'كلمة'}`), x); C.appendChild(top);
  C.appendChild(talkRow(bag.length ? T('هذه كلماتك. اسمعها، وقلها بصوتك', 'هذه كلماتكِ. اسمعيها، وقوليها بصوتكِ') : T('حقيبتك فارغة. كل كلمة تتعلّمها في الرحلة تدخل هنا', 'حقيبتكِ فارغة. كل كلمة تتعلّمينها في الرحلة تدخل هنا')));
  if (!bag.length) return;
  const list = el('div','kbag');
  bag.forEach(it => { const d = el('div','kcard kw'); d.innerHTML = `<p class="kq" style="font-family:var(--f-q);margin:0">${esc(it.w)}</p>${it.m ? `<p class="lrn" style="margin:2px 0">${esc(it.m)}</p>` : ''}`; const row = el('div','row'); row.style.justifyContent = 'center'; row.appendChild(hearBtn([it.w, it.m].filter(Boolean)));
    const mb = el('button','tiny', recd.has(it.w) ? '✓ ' + T('سجّلتَها', 'سجّلتِها') + ' · ⟨أعد|أعيدي⟩' : '🎙 ' + T('قلها بصوتك', 'قوليها بصوتكِ')); mb.type = 'button'; const box = el('div');
    mb.addEventListener('click', () => { if (box.childElementCount){ box.innerHTML = ''; return; } micWidget(box, {label: T('اضغط وقل الكلمة', 'اضغطي وقولي الكلمة'), max: 15000, onSaved: async blob => { try { await recPut({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid, kidName: K().name, kind: 'كلمة', ref: 'حقيبة الكلمات', text: it.w, date: today(), type: blob.type || 'audio/webm', blob, status: 'pending', notes: [], source: 'local'}); chime(true); cmpHappy(); mb.textContent = '✓ ' + T('سجّلتَها', 'سجّلتِها'); store.set(`dates:${kid}`, dates() + 1); } catch (e) {} }}); });
    row.appendChild(mb); d.append(row, box); list.appendChild(d); });
  C.appendChild(list);
}
INIT.kidBag = renderKidBag;
/* قل الجملة: موقف من الحياة اليومية، والطفل يقول الجواب بصوته لا بالاختيار؛ ثم يسمع العبارة الصحيحة ويعيدها إن شاء */
let SAY = null;
async function renderKidSay(){
  const C = $('kidSay'); C.innerHTML = ''; const recs = (await recAll()).filter(r => r.kid === kid && r.kind === 'جملة'); const done = new Set(recs.map(r => r.ref));
  if (!SAY || SAY.kid !== kid){ const fresh = HY.situations.filter(x => !done.has(x.id)); SAY = {kid, items: shuffle(fresh.length >= 3 ? fresh : HY.situations).slice(0, 3), i: 0, n: 0}; }
  const top = el('div','row'); top.style.justifyContent = 'space-between'; const x = el('button','tiny','✕ خروج'); x.type = 'button'; x.addEventListener('click', () => { voiceStop(); SAY = null; go('kid'); });
  const dots = el('div','dots'); SAY.items.forEach((_, i) => { const d = document.createElement('i'); d.className = i < SAY.i ? 'ok' : i === SAY.i ? 'now' : ''; dots.appendChild(d); }); top.append(dots, x); C.appendChild(top);
  const it = SAY.items[SAY.i];
  if (!it){ C.appendChild(talkRow(SAY.n ? T(`أحسنت! قلتَ ${SAY.n === 1 ? 'جملة' : SAY.n === 2 ? 'جملتين' : 'ثلاث جمل'} بصوتك، وسيسمعها أبوك`, `أحسنتِ! قلتِ ${SAY.n === 1 ? 'جملة' : SAY.n === 2 ? 'جملتين' : 'ثلاث جمل'} بصوتكِ، وسيسمعها أبوكِ`) : T('سمعتَ الجمل الثلاث. في المرة القادمة قلها بصوتك', 'سمعتِ الجمل الثلاث. في المرة القادمة قوليها بصوتكِ'))); cmpHappy(); chime(true); const h = el('button','bigplay','🏠 واحتي'); h.type = 'button'; h.addEventListener('click', () => { SAY = null; go('kid'); }); C.appendChild(h); return; }
  C.appendChild(talkRow([it.q, T('ماذا تقول؟ قلها بصوتك', 'ماذا تقولين؟ قوليها بصوتكِ')]));
  const card = el('div','kcard'); const mb = el('div'); const rev = el('div'); rev.hidden = true; rev.innerHTML = `<p class="lrn">${T('نقول', 'نقول')}: <b>${esc(it.options[0])}</b></p>`; rev.appendChild(hearBtn(it.options[0])); card.append(mb, rev); C.appendChild(card);
  const next = el('button','bigplay','التالي ◀'); next.type = 'button'; next.hidden = true; C.appendChild(next);
  const skip = el('button','tiny', ((cmpGet() || {}).kind === 'owl' ? 'لا أعرف، أسمعيني الجواب' : 'لا أعرف، أسمعني الجواب')); skip.type = 'button'; C.appendChild(skip);
  const reveal = () => { if (!rev.hidden) return; rev.hidden = false; say(['نقول:', it.options[0]]); next.hidden = false; skip.remove(); };
  micWidget(mb, {label: T('اضغط وقل الجملة', 'اضغطي وقولي الجملة'), again: T('أعدها بعد أن تسمع الجواب', 'أعيديها بعد أن تسمعي الجواب'), max: 20000, onSaved: async blob => { try { await recPut({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid, kidName: K().name, kind: 'جملة', ref: it.id, text: `${it.q} ← ${it.options[0]}`, date: today(), type: blob.type || 'audio/webm', blob, status: 'pending', notes: [], source: 'local'}); } catch (e) { mb.appendChild(el('p','fb bad','تعذّر حفظ التسجيل.')); } if (rev.hidden){ chime(true); cmpHappy(); store.set(`dates:${kid}`, dates() + 2); SAY.n++; } reveal(); }});
  skip.addEventListener('click', reveal);
  next.addEventListener('click', () => { voiceStop(); SAY.i++; renderKidSay(); window.scrollTo({top: 0}); });
}
INIT.kidSay = renderKidSay;
/* تحدّي العائلة: خمسة أسئلة مما أتقنه الإخوة؛ الكبير يقرأ والصغير يجيب أولًا، والنقاط للفريق، ونتيجته تُذاع في إذاعة الواحة */
let FAM = null;
const FAM_G = ['hk', 'gzw', 'wh', 'hsq', 'hys', 'uk', 'gzd', 'ajc', 'nt'];
function famQuestions(){ const qs = [], seen = new Set(); const kk = kid;
  const masteredIds = []; kids.forEach((_, i) => { kid = i; FAM_G.forEach(g => { (POOL[g] ? POOL[g]() : []).forEach(id => { if (mget(g, id).ok) masteredIds.push([g, id]); }); }); }); kid = kk;
  const pool = masteredIds.length >= 8 ? masteredIds : FAM_G.filter(g => g !== 'nt' && POOL[g]).flatMap(g => POOL[g]().map(id => [g, id]));
  const cnt = {}; const tryAdd = ([g, id], cap) => { if (qs.length >= 5 || (cnt[g] || 0) >= cap || g === 'nt') return; let q = null; try { q = GEN[g](id); } catch (e) {} if (q && q.a && q.alts && q.alts.length){ qs.push({g, id, ...q}); cnt[g] = (cnt[g] || 0) + 1; } };
  const sp = shuffle(pool); sp.forEach(x => tryAdd(x, 1)); if (qs.length < 5) sp.forEach(x => tryAdd(x, 2)); if (qs.length < 5) shuffle(FAM_G.filter(g => g !== 'nt' && POOL[g]).flatMap(g => POOL[g]().map(id => [g, id]))).forEach(x => { if (!qs.some(q => q.g === x[0] && q.id === x[1])) tryAdd(x, 3); });
  return qs; }
function renderKidFam(){
  const C = $('kidFam'); C.innerHTML = ''; const top = el('div','row'); top.style.justifyContent = 'space-between'; const x = el('button','tiny','✕ خروج'); x.type = 'button'; x.addEventListener('click', () => { voiceStop(); FAM = null; go('kid'); });
  if (!FAM){ top.append(el('span','chip','👨‍👩‍👧‍👦 تحدّي العائلة'), x); C.appendChild(top);
    const sorted = [...kids].map((k, i) => ({...k, i})).sort((a, b) => (b.age || 0) - (a.age || 0)); const reader = sorted[0], first = sorted[sorted.length - 1];
    C.appendChild(talkRow(['خمسة أسئلة للفريق كله.', `${reader.name} ${reader.gender === 'f' ? 'تقرأ' : 'يقرأ'} السؤال بصوت عالٍ، و${first.name} ${first.gender === 'f' ? 'تجيب' : 'يجيب'} أولًا، ثم ${first.gender === 'f' ? 'يساعدها' : 'يساعده'} الباقون.`]));
    const card = el('div','kcard'); card.innerHTML = `<p class="kq" style="margin:0">الفريق: ${kids.map(k => esc(k.name)).join('، ')}</p><p class="lrn">إن أصبتم ثلاثة فأكثر، كل واحد يأخذ تمرتين، وتُذاع نتيجتكم في إذاعة الواحة.</p>`; C.appendChild(card);
    const go_ = el('button','bigplay','▶ ⟨ابدأ|ابدئي⟩ التحدّي'); go_.type = 'button'; go_.addEventListener('click', () => { FAM = {qs: famQuestions(), i: 0, ok: 0}; renderKidFam(); }); C.appendChild(go_); return; }
  const dots = el('div','dots'); FAM.qs.forEach((_, i) => { const d = document.createElement('i'); d.className = i < FAM.i ? (FAM.res && FAM.res[i] ? 'ok' : 'bad') : i === FAM.i ? 'now' : ''; dots.appendChild(d); }); top.append(dots, x); C.appendChild(top);
  const q = FAM.qs[FAM.i];
  if (!q){ const n = FAM.qs.length; const win = FAM.ok >= 3; store.set(`fam:${today()}`, {score: FAM.ok, n, players: kids.map(k => k.name), date: today()}); const kk = kid; if (win && !store.get(`famWon:${today()}`, false)){ store.set(`famWon:${today()}`, true); kids.forEach((_, i) => { kid = i; store.set(`dates:${kid}`, dates() + 2); }); } kid = kk;
    C.appendChild(talkRow(win ? `أصبتم ${FAM.ok} من ${n}! فريقٌ رائع، ولكل واحد تمرتان` : `أصبتم ${FAM.ok} من ${n}. غدًا تعودون أقوى`)); if (win){ cmpHappy(); chime(true); }
    const h = el('button','bigplay','🏠 واحتي'); h.type = 'button'; h.addEventListener('click', () => { FAM = null; go('kid'); }); C.appendChild(h); const ag = el('button','tiny','تحدٍّ آخر'); ag.type = 'button'; ag.addEventListener('click', () => { FAM = {qs: famQuestions(), i: 0, ok: 0}; renderKidFam(); }); C.appendChild(ag); return; }
  C.appendChild(talkRow(`السؤال ${FAM.i + 1}: ${q.q}`, {say: false}));
  const card = el('div','kcard'); if (q.html) card.insertAdjacentHTML('beforeend', `<div class="kq">${q.html}</div>`); const o = el('div','kopts'); const fb = el('p','fb'); card.append(o, fb); C.appendChild(card);
  const next = el('button','bigplay','التالي ◀'); next.type = 'button'; next.hidden = true; C.appendChild(next);
  mcq(o, [q.a, ...shuffle(q.alts).slice(0, 3)], q.a, st => { const ok = st === true || st === 'ok'; FAM.res = FAM.res || []; FAM.res[FAM.i] = ok; if (ok) FAM.ok++; chime(ok); if (ok) cmpHappy(); fb.textContent = ok ? 'أحسنتم!' : `الجواب: ${q.a}`; fb.className = 'fb ' + (ok ? 'ok' : 'bad'); next.hidden = false; }, 'm');
  next.addEventListener('click', () => { voiceStop(); FAM.i++; renderKidFam(); window.scrollTo({top: 0}); });
}
INIT.kidFam = renderKidFam;
function learnView(C, c){
  C.appendChild(talkRow(c.story ? CL.listen() : CL.learn(), {say: false}));
  const card = el('div','kcard learn'); card.innerHTML = `<span class="chip" style="align-self:center">📖 ${esc(c.t || '')}</span>${c.swatch ? `<span style="align-self:center;width:56px;height:56px;border-radius:50%;background:${c.swatch};border:2px solid var(--line)"></span>` : ''}${c.big ? `<p class="kq big" style="font-family:var(--f-q)">${esc(c.big).replace(/ ۞ /g, '<br>').replace(/\n/g, '<br><br>')}</p>` : ''}${c.body.map(b => `<p class="lrn">${esc(b)}</p>`).join('')}${c.words && c.words.length ? `<div class="kwords">${c.words.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}`;
  const quiet = new Set((c.quiet || []).concat(c.body.filter(b => /^في القرآن:/.test(b))));
  const all = [c.big, ...c.body].filter(Boolean).filter(x => !quiet.has(x) && !/^(صحيح|سنن|الأربعون)/.test(x)).map(x => x.replace(/ ۞ /g, '، '));
  const hb = hearBtn(all); hb.style.alignSelf = 'center'; card.appendChild(hb); C.appendChild(card);
  sayLater(all, 250); if (!c.story){ const [g, ...rest] = c.id.split('|'); markLearned(g, rest.join('|')); }
  const ok = el('button','bigplay', T('فهمتُ ◀', 'فهمتُ ◀')); ok.type = 'button'; C.appendChild(ok);
  ok.addEventListener('click', () => { voiceStop(); if (TRIP.cards[TRIP.i] !== c) return; if (!c.story) store.set(`dates:${kid}`, dates() + 1); bagAdd(c); TRIP.res.push(null); TRIP.i++; tripSave(); renderTrip(); window.scrollTo({top: 0}); });
}
/* «أخبرني»: سؤال مفتوح عن يوم الطفل يجيب عنه بصوته؛ يصل إلى الأب في «سطر اليوم» */
const TELL_Q = [
  ['ماذا أكلتَ اليوم؟', 'ماذا أكلتِ اليوم؟'], ['ماذا فعلتَ هذا الصباح؟', 'ماذا فعلتِ هذا الصباح؟'], ['من لعب معك اليوم؟ وماذا لعبتم؟', 'من لعب معكِ اليوم؟ وماذا لعبتنّ؟'],
  ['ما أجمل شيء رأيته اليوم؟', 'ما أجمل شيء رأيتِه اليوم؟'], ['ماذا تحب أن تأكل غدًا؟', 'ماذا تحبين أن تأكلي غدًا؟'], ['صف غرفتك: ماذا فيها؟', 'صفي غرفتكِ: ماذا فيها؟'],
  ['ماذا قرأتَ أو حفظتَ اليوم؟', 'ماذا قرأتِ أو حفظتِ اليوم؟'], ['ما الذي أضحكك اليوم؟', 'ما الذي أضحككِ اليوم؟'], ['ماذا ستفعل بعد أن تنتهي من هنا؟', 'ماذا ستفعلين بعد أن تنتهي من هنا؟'],
  ['أخبرني عن أخيك أو أختك: ماذا يفعل الآن؟', 'أخبريني عن أخيكِ أو أختكِ: ماذا يفعل الآن؟'], ['ما الطقس اليوم؟ حارّ أم بارد؟', 'ما الطقس اليوم؟ حارّ أم بارد؟'], ['ما لونك المفضّل؟ ولماذا؟', 'ما لونكِ المفضّل؟ ولماذا؟'],
  ['ماذا تريد أن تكون حين تكبر؟', 'ماذا تريدين أن تكوني حين تكبرين؟'], ['أخبرني عن صديقك: ما اسمه وماذا تحبان؟', 'أخبريني عن صديقتكِ: ما اسمها وماذا تحبّان؟'], ['ماذا في حقيبتك المدرسية؟', 'ماذا في حقيبتكِ المدرسية؟'],
  ['ما آخر شيء اشتريتموه للبيت؟', 'ما آخر شيء اشتريتموه للبيت؟'], ['ماذا تفعل أمك الآن؟', 'ماذا تفعل أمكِ الآن؟'], ['أي سورة تحب أن تقرأ؟ ولماذا؟', 'أي سورة تحبين أن تقرئي؟ ولماذا؟'],
  ['صف لي الطريق من بيتك إلى المدرسة.', 'صفي لي الطريق من بيتكِ إلى المدرسة.'], ['ما الذي تعلّمته اليوم ولم تكن تعرفه؟', 'ما الذي تعلّمتِه اليوم ولم تكوني تعرفينه؟'],
];
function tellQuestion(){ const asked = store.get(`tellAsked:${kid}`, []); const idx = TELL_Q.map((_, i) => i).filter(i => !asked.includes(i)); const i = pick(idx.length ? idx : TELL_Q.map((_, j) => j)); asked.push(i); store.set(`tellAsked:${kid}`, asked.slice(-15)); return T(TELL_Q[i][0], TELL_Q[i][1]); }
function tellCard(C, c){
  C.appendChild(talkRow([T('قبل أن نختم، أخبرني بالعربية', 'قبل أن نختم، أخبريني بالعربية'), c.q]));
  const card = el('div','kcard'); card.innerHTML = `<p class="kq" style="margin:0">${esc(c.q)}</p><p class="lrn">${T('قل جملة أو جملتين بصوتك، وسيسمعها أبوك', 'قولي جملة أو جملتين بصوتكِ، وسيسمعها أبوكِ')}</p>`; const mb = el('div'); card.appendChild(mb); C.appendChild(card);
  const next = el('button','bigplay','التالي ◀'); next.type = 'button'; next.hidden = true; C.appendChild(next);
  const skip = el('button','tiny', T('ليس الآن', 'ليس الآن')); skip.type = 'button'; C.appendChild(skip);
  micWidget(mb, {label: T('اضغط وأخبرني', 'اضغطي وأخبريني'), max: 60000, onSaved: async blob => { if (!document.body.contains(mb)) return;
    try { await recPut({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid, kidName: K().name, kind: 'أخبرني', ref: today(), text: c.q, date: today(), type: blob.type || 'audio/webm', blob, status: 'pending', notes: [], source: 'local'}); } catch (e) { mb.appendChild(el('p','fb bad','تعذّر حفظ التسجيل.')); return; }
    chime(true); cmpHappy(); say(T('شكرًا! سأحفظها لأبيك', 'شكرًا! سأحفظها لأبيكِ')); if (!next.hidden) return; store.set(`dates:${kid}`, dates() + 2); TRIP.res.push(true); TRIP.i++; tripSave(); next.hidden = false; skip.remove(); }});
  const adv = () => { voiceStop(); renderTrip(); window.scrollTo({top: 0}); };
  next.addEventListener('click', adv); skip.addEventListener('click', () => { TRIP.res.push(null); TRIP.i++; tripSave(); adv(); });
}
/* «رأيتُها اليوم»: كلمة من حقيبته يربطها ببيته: جملة بصوته، أو صورة من الجهاز */
function seenCardPick(){ const bag = store.get(`bag:${kid}`, []); const done = store.get(`seenDone:${kid}`, []); const w = bag.find(x => !done.includes(x.w)) || bag[0]; return w ? {g: 'seen', id: 'seen|' + w.w, word: w.w, meaning: w.m} : null; }
function seenCard(C, c){
  C.appendChild(talkRow([T('تذكر كلمة', 'تذكرين كلمة') + ` «${c.word}»؟`, T('ابحث في بيتك عن شيء يشبهها أو يذكّرك بها، وقل جملة عنها', 'ابحثي في بيتكِ عن شيء يشبهها أو يذكّركِ بها، وقولي جملة عنها')]));
  const card = el('div','kcard'); card.innerHTML = `<p class="kq big" style="font-family:var(--f-q);margin:0">${esc(c.word)}</p>${c.meaning ? `<p class="lrn">${esc(c.meaning)}</p>` : ''}`; const mb = el('div'); const ph = el('div'); card.append(mb, ph); C.appendChild(card);
  const next = el('button','bigplay','التالي ◀'); next.type = 'button'; next.hidden = true; C.appendChild(next);
  const skip = el('button','tiny', 'ليس الآن'); skip.type = 'button'; C.appendChild(skip);
  const finish = () => { if (!next.hidden) return; const d = store.get(`seenDone:${kid}`, []); d.push(c.word); store.set(`seenDone:${kid}`, d.slice(-200)); chime(true); cmpHappy(); store.set(`dates:${kid}`, dates() + 2); TRIP.res.push(true); TRIP.i++; tripSave(); next.hidden = false; skip.remove(); };
  micWidget(mb, {label: T('اضغط وقل الجملة', 'اضغطي وقولي الجملة'), max: 30000, onSaved: async blob => { if (!document.body.contains(mb)) return; try { await recPut({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid, kidName: K().name, kind: 'رأيتُها اليوم', ref: c.word, text: c.word, date: today(), type: blob.type || 'audio/webm', blob, status: 'pending', notes: [], source: 'local'}); } catch (e) { mb.appendChild(el('p','fb bad','تعذّر حفظ التسجيل.')); return; } say(T('جميل! سيراها أبوك', 'جميل! سيراها أبوكِ')); finish(); }});
  const pb = el('button','tiny','📷 ' + T('أو صوّرها', 'أو صوّريها')); pb.type = 'button'; ph.appendChild(pb);
  pb.addEventListener('click', () => { const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.setAttribute('capture', 'environment'); f.onchange = async () => { const file = f.files[0]; if (!file) return; const img = new Image(); const url = URL.createObjectURL(file); img.onload = async () => { const cv = document.createElement('canvas'); const n = 480; const r = Math.min(1, n / Math.max(img.width, img.height)); cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); cv.toBlob(async blob => { try { await recPut({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid, kidName: K().name, kind: 'رأيتُها اليوم', ref: c.word, text: c.word, date: today(), type: 'image/jpeg', blob, status: 'pending', notes: [], source: 'local'}); const im = document.createElement('img'); im.src = URL.createObjectURL(blob); im.style.cssText = 'max-width:60%;border-radius:12px;display:block;margin:6px auto'; ph.appendChild(im); say(T('صورة جميلة! سيراها أبوك', 'صورة جميلة! سيراها أبوكِ')); finish(); } catch (e) { ph.appendChild(el('p','fb bad','تعذّر حفظ الصورة.')); } }, 'image/jpeg', .8); }; img.src = url; }; f.click(); });
  const adv = () => { voiceStop(); renderTrip(); window.scrollTo({top: 0}); };
  next.addEventListener('click', adv); skip.addEventListener('click', () => { TRIP.res.push(null); TRIP.i++; tripSave(); adv(); });
}
function recCard(C, c){
  const it = c.recItem; C.appendChild(talkRow(CL.recAsk()));
  const card = el('div','kcard'); card.innerHTML = `<span class="chip" style="align-self:center">${esc(it.kind)} · ${esc(it.ref)}</span><p class="kq" style="font-family:var(--f-q)">${esc(it.text).replace(' ۞ ', '<br>')}</p>`; card.querySelector('.kq').appendChild(hearBtn(it.text)); C.appendChild(card);
  const mb = el('div'); C.appendChild(mb); const next = el('button','bigplay','التالي ◀'); next.type = 'button'; next.hidden = true; C.appendChild(next);
  const skip = el('button','tiny', T('تخطَّ هذه المرة', 'تخطَّي هذه المرة')); skip.type = 'button'; C.appendChild(skip);
  micWidget(mb, {label: T('اضغط وسجّل', 'اضغطي وسجّلي'), onSaved: async blob => { if (!document.body.contains(mb) || TRIP.cards[TRIP.i] !== c && next.hidden) return;
    try { await recPut({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kid, kidName: K().name, kind: it.kind, ref: it.ref, text: it.text, date: today(), type: blob.type || 'audio/webm', blob, status: 'pending', notes: [], source: 'local'}); }
    catch (e) { const er = el('p','fb bad', 'تعذّر حفظ التسجيل على هذا الجهاز. ⟨اضغط|اضغطي⟩ «⟨تخطَّ|تخطَّي⟩» و⟨أكمل|أكملي⟩.'); mb.appendChild(er); return; }
    chime(true); cmpHappy(); say(CL.recDone()); if (!next.hidden) return; store.set(`dates:${kid}`, dates() + 2); TRIP.res.push(true); TRIP.i++; tripSave(); next.hidden = false; skip.remove(); }});
  const adv = () => { voiceStop(); renderTrip(); window.scrollTo({top: 0}); };
  next.addEventListener('click', adv); skip.addEventListener('click', () => { TRIP.res.push(null); TRIP.i++; tripSave(); adv(); });
}
/* سجل الرحلة لولي الأمر: ما تعلّمه، وما أصاب، وما أخطأ، وما سجّل (آخر 20 رحلة) */
function tripLogSave(){ const L = {date: today(), extra: !TRIP.key, learned: [], ok: [], wrong: [], rec: []};
  TRIP.cards.forEach((c, i) => { const r = TRIP.res[i]; if (c.kind === 'learn'){ if (c.story) L.learned.push(`${c.t}: ${c.big}`); else L.learned.push(`${c.big || ''}${c.body && c.body[0] ? ' — ' + c.body[0] : ''}`.slice(0, 90)); }
    else if (c.g === 'rec'){ if (r === true) L.rec.push(`${c.recItem.kind}: ${c.recItem.text.slice(0, 60)}`); }
    else if (c.g === 'tell'){ if (r === true) L.rec.push(`أخبرني: ${c.q}`); }
    else if (c.g === 'seen'){ if (r === true) L.rec.push(`رأيتُها اليوم: ${c.word}`); }
    else if (i < TRIP.res.length){ (r ? L.ok : L.wrong).push((c.label || c.q || '').slice(0, 80)); } });
  const log = store.get(`tripLog:${kid}`, []); log.unshift(L); store.set(`tripLog:${kid}`, log.slice(0, 20)); }
function tripEnd(){
  const C = $('kidTrip'); const ok = TRIP.res.filter(r => r === true).length; const first = !TRIP.done; TRIP.done = true; tripSave();
  if (first && !TRIP.gotDeco && TRIP.key){ const n = tripsDone() + 1; store.set(`tripsDone:${kid}`, n); const owned = store.get(`deco:${kid}`, []); const k = DECO_ORDER[(n - 1) % DECO_ORDER.length]; owned.push({k, slot: n - 1}); store.set(`deco:${kid}`, owned); TRIP.gotDeco = k; }
  if (TRIP.key){ store.set(`dailyDone:${kid}:${TRIP.key.split(':')[2]}`, true); }
  if (first){ tripLogSave(); }
  C.innerHTML = ''; C.appendChild(talkRow(`${CL.tripEnd()}`)); cmpHappy(); chime(true);
  const u = unlockedSet(); if (store.get(`planted:${kid}`, false)) u.add('seed');
  const sc = el('div','kscene'); sc.innerHTML = kidScene(u, TRIP.gotDeco || '') + `<span class="cnt">🟤 +${ok} · ${dates()}</span>`; C.appendChild(sc);
  if (TRIP.gotDeco){ const g = el('p','ask', `${T('هديتك من الرحلة', 'هديتكِ من الرحلة')}: ${DECO[TRIP.gotDeco].name} ${DECO[TRIP.gotDeco].e}`); g.style.cssText = 'text-align:center;font-weight:800;margin:0'; C.appendChild(g); }
  const home = el('button','bigplay','🏠 واحتي'); home.type = 'button'; home.addEventListener('click', () => { TRIP = null; go('kid'); }); C.appendChild(home);
  const more = el('button','tiny', CL.again()); more.type = 'button'; more.addEventListener('click', () => startTrip(true)); C.appendChild(more);
  checkStages();
}
/* واحة الطفل: نخلته التي تكبر مع كل رحلة + هدية زينة لكل رحلة مكتملة، فوق مشهد المراحل */
const tripsDone = () => store.get(`tripsDone:${kid}`, 0);
const DECO = {
  flower: {name:'زهرة', e:'🌸', svg: (x, y) => `<path d="M${x} ${y} v-12" stroke="var(--sc-leaf)" stroke-width="2"/>${[0,72,144,216,288].map(a => `<circle cx="${(x + 4 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(y - 14 + 4 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="3.2" fill="#e05a7a"/>`).join('')}<circle cx="${x}" cy="${y - 14}" r="2.2" fill="#f6c453"/>`},
  butterfly: {name:'فراشة', e:'🦋', svg: (x, y) => `<g transform="translate(${x} ${y - 40})"><path d="M0 0 q-10 -10 -12 0 q2 8 12 0 q10 8 12 0 q-2 -10 -12 0 Z" fill="#7b3fa0"/><path d="M0 -4 v8" stroke="#2b2416" stroke-width="1.5"/></g>`},
  stone: {name:'حجر ملوّن', e:'🪨', svg: (x, y) => `<ellipse cx="${x}" cy="${y - 3}" rx="7" ry="4.5" fill="#9a8a78"/><ellipse cx="${x - 2}" cy="${y - 5}" rx="2.5" ry="1.4" fill="#cfc3b2"/>`},
  bush: {name:'شجيرة', e:'🌿', svg: (x, y) => `<circle cx="${x - 5}" cy="${y - 6}" r="6" fill="var(--sc-leaf)"/><circle cx="${x + 5}" cy="${y - 6}" r="6" fill="var(--sc-leaf2)"/><circle cx="${x}" cy="${y - 11}" r="6" fill="var(--sc-leaf)"/>`},
  tulip: {name:'خُزامى', e:'🌷', svg: (x, y) => `<path d="M${x} ${y} v-12" stroke="var(--sc-leaf)" stroke-width="2"/><path d="M${x - 4} ${y - 12} q4 -10 8 0 q-4 4 -8 0 Z" fill="#e8742a"/>`},
  shell: {name:'صدفة', e:'🐚', svg: (x, y) => `<path d="M${x - 6} ${y} q6 -14 12 0 Z" fill="#f3e6c8" stroke="#c9a46a" stroke-width="1"/><path d="M${x} ${y} v-9 M${x - 3} ${y} l1 -7 M${x + 3} ${y} l-1 -7" stroke="#c9a46a" stroke-width=".8"/>`},
  cactus: {name:'صبّار', e:'🌵', svg: (x, y) => `<path d="M${x} ${y} v-18" stroke="#3f7d4a" stroke-width="6" stroke-linecap="round"/><path d="M${x} ${y - 8} h-6 v-6 M${x} ${y - 11} h6 v-5" stroke="#3f7d4a" stroke-width="4" stroke-linecap="round" fill="none"/>`},
  bird: {name:'عصفور', e:'🐦', svg: (x, y) => `<g transform="translate(${x} ${y - 6})"><ellipse rx="6" ry="4.5" fill="#e8742a"/><circle cx="5" cy="-3" r="3" fill="#e8742a"/><path d="M8 -3 l3 1 l-3 1 Z" fill="#f6c453"/><circle cx="5.6" cy="-3.6" r=".8" fill="#2b2416"/></g>`},
};
const DECO_ORDER = ['flower', 'stone', 'butterfly', 'bush', 'tulip', 'shell', 'bird', 'cactus', 'lantern', 'pot', 'ladybug', 'star'];
DECO.lantern = {name:'فانوس', e:'🏮', svg: (x, y) => `<path d="M${x} ${y - 22} v4" stroke="#2b2416" stroke-width="1.5"/><rect x="${x - 5}" y="${y - 18}" width="10" height="14" rx="4" fill="#e8742a"/><rect x="${x - 3}" y="${y - 15}" width="6" height="8" rx="2" fill="#f6c453"/><rect x="${x - 4}" y="${y - 4}" width="8" height="2" fill="#2b2416"/>`};
DECO.pot = {name:'جَرّة', e:'🏺', svg: (x, y) => `<path d="M${x - 5} ${y - 14} h10 l2 4 q-2 10 -7 10 q-5 0 -7 -10 Z" fill="#b5651d"/><path d="M${x - 4} ${y - 16} h8 v2 h-8 Z" fill="#8a4a12"/>`};
DECO.ladybug = {name:'دعسوقة', e:'🐞', svg: (x, y) => `<g transform="translate(${x} ${y - 5})"><ellipse rx="6" ry="4.5" fill="#c8352b"/><path d="M0 -4.5 v9" stroke="#2b2416" stroke-width="1"/><circle cx="-3" cy="-1" r="1.1" fill="#2b2416"/><circle cx="3" cy="1" r="1.1" fill="#2b2416"/><circle cx="-6" cy="0" r="2" fill="#2b2416"/></g>`};
DECO.star = {name:'نجمة', e:'⭐', svg: (x, y) => `<path d="M${x} ${y - 20} l2.4 5 5.5 .6 -4 3.8 1 5.4 -4.9 -2.7 -4.9 2.7 1 -5.4 -4 -3.8 5.5 -.6 Z" fill="#f6c453" stroke="#c9a46a" stroke-width=".8"/>`};
const DECO_SLOTS = [[150,262],[560,266],[300,276],[470,272],[90,272],[640,262],[240,284],[400,288],[520,286],[40,286],[340,262],[600,284],[180,286],[440,262],[680,282],[120,262]];
function kidPalm(){ const n = tripsDone(); if (!store.get(`planted:${kid}`, false)) return ''; if (n < 1) return SC.seed(); const s = Math.min(2.3, 0.8 + n * 0.07); return svgPalm(360, 252, s); }
function kidScene(u, newDeco){ const base = sceneSvg(new Set([...u].filter(k => k !== 'seed')), ''); const owned = store.get(`deco:${kid}`, []);
  const extra = kidPalm() + owned.map((d, i) => { const [x, y] = DECO_SLOTS[d.slot % DECO_SLOTS.length]; const yy = y - Math.floor(d.slot / DECO_SLOTS.length) * 6; return `<g transform="translate(${x} ${yy}) scale(2.4) translate(${-x} ${-yy})"><g class="${d.k === newDeco && i === owned.length - 1 ? 'new' : ''}" style="transform-origin:${x}px ${yy}px">${DECO[d.k].svg(x, yy)}</g></g>`; }).join('');
  const hint = owned.length || tripsDone() || store.get(`planted:${kid}`, false) ? '' : '';
  return base.replace(/<text[^>]*>صحراءٌ تنتظر أول بذرة<\/text>/, store.get(`planted:${kid}`, false) ? '' : '$&').replace(/<\/svg>$/, extra + hint + '</svg>'); }
/* بذرة أول لقاء في المشهد */
SC.seed = () => `<g transform="translate(360 236)"><ellipse cx="0" cy="4" rx="16" ry="5" fill="#8a6235"/><path d="M0 2 q0 -10 -2 -16" stroke="var(--sc-leaf)" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-2 -10 q-10 -6 -8 -14 q10 2 8 14 Z" fill="var(--sc-leaf)"/><path d="M-1 -8 q10 -6 10 -14 q-10 0 -10 14 Z" fill="var(--sc-leaf2)"/></g>`;
SOLO_BOX.seed = [330, 200, 60];

/* ---------------- استوديو صوت الرفيق (لولي الأمر) ---------------- */
async function renderVoiceStudio(box){
  const lines = clVariants(); const have = new Set((await voiceAll()).map(v => v.id));
  box.innerHTML = `<p class="note">سجّل جمل الرفيق بصوتك؛ ما سجّلتَه يسمعه الأطفال بصوتك، وما لم تسجّله يقرؤه الجهاز آليًّا. التسجيل لكل جملة بصيغتها (للولد والبنت). سجّلتَ ${lines.filter(l => have.has(lineKey(l))).length} من ${lines.length}.</p><div class="queue" id="vsList"></div>`;
  const L = box.querySelector('#vsList');
  lines.forEach(l => { const id = lineKey(l); const d = el('div','qi'); d.innerHTML = `<div class="row" style="justify-content:space-between"><span style="font-weight:700">${esc(l)}</span>${have.has(id) ? '<span class="badge ok">بصوتك</span>' : '<span class="badge wait">آلي</span>'}</div>`;
    const row = el('div','btns'); row.style.justifyContent = 'flex-start';
    const hb = el('button','btn ghost sm','▶ اسمع'); hb.type = 'button'; hb.addEventListener('click', () => say(l)); row.appendChild(hb);
    const rb = el('button','btn sm', have.has(id) ? '🎙 أعد التسجيل' : '🎙 سجّل'); rb.type = 'button'; rb.addEventListener('click', () => { rb.remove(); const m = el('div'); d.appendChild(m); micWidget(m, {label: 'اضغط وقل الجملة', onSaved: async blob => { await voicePut({id, text: l, blob, type: blob.type, date: today()}); renderVoiceStudio(box); }}); }); row.appendChild(rb);
    if (have.has(id)){ const db = el('button','btn ghost sm','🗑'); db.type = 'button'; db.addEventListener('click', async () => { await voiceDel(id); renderVoiceStudio(box); }); row.appendChild(db); }
    d.appendChild(row); L.appendChild(d); });
}

/* ---------------- التوجيه ---------------- */
INIT.kidHome = () => { if (!cmpGet()){ if (HELLO.kid !== kid) HELLO = {step: 0, kind: 'camel', name: '', kid}; go('hello', 'kidHello'); return; } renderKidHome(); };
INIT.kidHello = () => renderHello();
INIT.kidTrip = () => renderTrip();

/* ================= قياس الشهر: أسئلة ثابتة لكل طفل من الأقسام كلها، تُعاد كل ثلاثين يومًا =================
   لا درس قبلها ولا تمور ولا أثر لها في الإتقان: هي مقياس فقط، فيرى وليّ الأمر أين كان طفله وأين صار.
   الأسئلة نفسها كل شهر (تُختار مرة واحدة بمعرّف الطفل وتُحفظ)، فالفرق بين قياسين هو ما تعلّمه فعلًا. */
const MS_PLAN = {7: ['hys', 'hyc', 'uk', 'hk', 'hsq'], 9: ['uk', 'hk', 'wh', 'dct', 'hsq', 'kz'], 99: ['uk', 'drv', 'dct', 'ajd', 'hsq', 'kz']};
const MS_PER = 2, MS_DAYS = 30;
let MS = null;
function msHash(s){ let h = 2166136261; for (const c of String(s)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function msRand(seed){ let x = seed || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function msForm(){
  const f = store.get(`msForm:${kid}`, null); if (f && f.v === 1 && f.items.length) return f.items;
  const age = K().age, plan = MS_PLAN[age <= 7 ? 7 : age <= 9 ? 9 : 99], rnd = msRand(msHash((window.KZ_IDS || [])[kid] || K().name)); const items = [];
  plan.forEach(g => { if (!POOL[g]) return; const ids = POOL[g]().slice().sort();
    for (let i = ids.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    let k = 0; for (const id of ids){ if (k >= MS_PER) break; let q = null; try { q = GEN[g](id); } catch (e) {} if (q && q.a && q.alts && q.alts.length){ items.push({g, id}); k++; } } });
  store.set(`msForm:${kid}`, {v: 1, items, age}); return items; }
function msHistory(i){ return store.get(`ms:${i == null ? kid : i}`, []); }
function msDue(){ const h = msHistory(); return tripsDone() > 0 && (!h.length || dayN() - h[h.length - 1].day >= MS_DAYS); }
function startMeasure(){ MS = {items: msForm(), i: 0, res: []}; go('msr', 'kidMs'); }
function renderMeasure(){
  const C = $('kidMs'); C.innerHTML = ''; if (!MS){ go('kid'); return; }
  const top = el('div','row'); top.style.justifyContent = 'space-between';
  const x = el('button','tiny','✕ خروج'); x.type = 'button'; x.addEventListener('click', () => { voiceStop(); MS = null; go('kid'); });
  const dots = el('div','dots'); MS.items.forEach((_, i) => { const d = document.createElement('i'); d.className = i < MS.i ? 'ok' : i === MS.i ? 'now' : ''; dots.appendChild(d); }); top.append(dots, x); C.appendChild(top);
  const it = MS.items[MS.i]; if (!it) return measureEnd(C);
  let q = null; try { q = GEN[it.g](it.id); } catch (e) {}
  if (!q || !q.a){ MS.res.push(null); MS.i++; return renderMeasure(); }
  C.appendChild(talkRow(MS.i === 0 ? [T('قياس الشهر: أسئلةٌ قليلة نعرف بها ما تعلّمتَ. أجب بما تعرف، ولا بأس إن لم تعرف', 'قياس الشهر: أسئلةٌ قليلة نعرف بها ما تعلّمتِ. أجيبي بما تعرفين، ولا بأس إن لم تعرفي'), q.q] : q.q, {say: true}));
  const card = el('div','kcard'); if (q.html) card.insertAdjacentHTML('beforeend', `<div class="kq">${q.html}</div>`);
  const o = el('div','kopts'); card.appendChild(o); C.appendChild(card);
  const next = () => { MS.i++; setTimeout(() => { voiceStop(); renderMeasure(); window.scrollTo({top: 0}); }, 450); };
  mcq(o, [q.a, ...shuffle([...new Set((q.alts || []).filter(a => a !== q.a))]).slice(0, K().age <= 7 ? 2 : 3)], q.a, ok => { MS.res.push(!!ok); next(); }, 'm');
  const skip = el('button','tiny', T('لا أعرف', 'لا أعرف')); skip.type = 'button'; skip.addEventListener('click', () => { if (MS.res.length > MS.i) return; MS.res.push(false); next(); }); C.appendChild(skip);
}
function measureEnd(C){
  const n = MS.items.length, ok = MS.res.filter(Boolean).length, byG = {};
  MS.items.forEach((it, i) => { const b = byG[it.g] || (byG[it.g] = [0, 0]); b[1]++; if (MS.res[i]) b[0]++; });
  const h = msHistory(), prev = h[h.length - 1]; h.push({day: dayN(), date: today(), ok, n, byG}); store.set(`ms:${kid}`, h.slice(-24)); MS = null;
  const up = prev && ok > prev.ok;
  C.appendChild(talkRow(up ? T(`أحسنت! أجبتَ ${ok} من ${n}، أكثر من المرة الماضية`, `أحسنتِ! أجبتِ ${ok} من ${n}، أكثر من المرة الماضية`) : T(`شكرًا لك! أجبتَ ${ok} من ${n}. سنعيد القياس بعد شهر لنرى كم تعلّمت`, `شكرًا لكِ! أجبتِ ${ok} من ${n}. سنعيد القياس بعد شهر لنرى كم تعلّمتِ`), {say: true}));
  if (up){ chime(true); cmpHappy(); }
  const b = el('button','bigplay','◀ واحتي'); b.type = 'button'; b.addEventListener('click', () => go('kid')); C.appendChild(b);
}
INIT.kidMs = renderMeasure;
/* لوليّ الأمر: القياسات كلها لطفلٍ واحد، وأقسامها */
function measureHTML(i){
  const h = msHistory(i); if (!h.length) return '<p class="lbl">قياس الشهر</p><p class="note">لم يُجرَ بعد. يظهر للطفل بعد أول رحلة، ثم كل ثلاثين يومًا: أسئلةٌ ثابتة من الأقسام كلها، بلا تعليمٍ ولا تمور، فالفرق بين قياسين هو ما تعلّمه فعلًا.</p>';
  const max = Math.max(...h.map(x => x.n), 1);
  const bars = h.map(x => `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;min-width:34px"><div style="height:${Math.round(70 * x.ok / max)}px;width:22px;border-radius:5px 5px 0 0;background:var(--palm)" title="${x.ok}/${x.n}"></div><span class="ref" style="font-size:.75rem">${x.ok}/${x.n}</span><span class="ref" style="font-size:.7rem">${esc(String(x.date).slice(5))}</span></div>`).join('');
  const last = h[h.length - 1], first = h[0];
  const rows = Object.keys(last.byG).map(g => `<tr><td>${GNAME[g] || g}</td><td>${first.byG[g] ? first.byG[g].join('/') : '—'}</td><td>${last.byG[g].join('/')}</td></tr>`).join('');
  return `<p class="lbl">قياس الشهر</p><div style="display:flex;align-items:flex-end;gap:6px;overflow-x:auto;padding:6px 0;border-bottom:1px solid var(--line)">${bars}</div>` +
    (h.length > 1 ? `<div class="tablewrap"><table class="dash"><tr><th></th><th>أول قياس (${esc(first.date)})</th><th>آخر قياس (${esc(last.date)})</th></tr>${rows}</table></div>` : `<p class="note">القياس التالي بعد ${Math.max(0, MS_DAYS - (dayN() - last.day))} يومًا.</p>`); }

/* زر الرجوع في أندرويد: يغلق ما فوق الشاشة، ثم يعود خطوة نحو «واحتي»؛ يُرجع false عند الواحة نفسها فيخرج التطبيق */
function appBack(){
  voiceStop();
  if (!$('sheet').hidden){ closeSheet(); return true; }
  if (!$('cele').hidden){ $('cele').hidden = true; return true; }
  if (cur.o === 'kid' || (cur.o === 'home' && !kidMode())) return false;
  if (cur.o === 'home' && LIB){ LIB = false; go('home'); return true; }
  if (cur.o === 'hello'){ if (HELLO.step > 0){ HELLO.step--; renderHello(); return true; } return false; }
  if (cur.o === 'msr'){ MS = null; go('kid'); return true; }
  if (cur.o === 'trip' || cur.o === 'bag' || cur.o === 'say' || cur.o === 'fam'){ FAM = null; SAY = null; go('kid'); return true; }
  if (LIB){ go('home'); return true; }
  go('home'); return true;
}


/* ---- start ---- */
try { pruneStore(); } catch (e) {}
renderWho(); renderGrove(); renderPalm(); renderHome();
const loc = store.get('loc', {o:'home'}); go(['dad','trip','hello'].includes(loc.o) ? 'home' : loc.o, loc.t);
/* أول تشغيل: ولي الأمر يضبط رقمه السري ثم أسماء الأطفال وأعمارهم (يتكرر الطلب حتى يُضبط) */
if (typeof pinSet === 'function' && !pinSet() && typeof store.get('pin', null) !== 'string') setTimeout(() => pinGate(() => kidsSheet()), 500);
