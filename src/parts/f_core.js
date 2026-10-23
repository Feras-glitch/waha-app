/* ================= family layer: core ================= */
/* Everything stays on this device: metadata in localStorage, recordings and images in IndexedDB.
   Children create; a parent (behind a PIN) approves, exports, and decides publishing. */

Object.assign(ICON,{
  mic:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/></svg>',
  brush:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5l5 5L11 18l-5-5z"/><path d="M6 13c-2 0-3 1.5-3 3.5S2 20 2 20s3.5.5 5-1 1.5-3.5 1.5-3.5"/></svg>',
  camera:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
  book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/></svg>',
  radio:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l9-4"/><circle cx="15.5" cy="14" r="3"/><path d="M6.5 12h3M6.5 15h3"/></svg>',
  gift:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="1"/><path d="M3 7h18v3H3zM12 7v13"/><path d="M12 7c-1.5-3-5-3.5-5-1s5 1 5 1zm0 0c1.5-3 5-3.5 5-1s-5 1-5 1z"/></svg>',
  lock:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
  users:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.2 5 2.5 5 5.3"/></svg>',
  plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  share:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/></svg>',
  download:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>',
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path class="f" d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path class="f" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  stop:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect class="f" x="6.5" y="6.5" width="11" height="11" rx="2"/></svg>',
  trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  undo:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5L4 9l4 4"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H9"/></svg>',
  check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
  mag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M7 8.5h7M7 12h7M7 15.5h4"/></svg>',
  q:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7"/><circle class="f" cx="12" cy="17" r="1"/></svg>',
  quote:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 7H6.5A2.5 2.5 0 0 0 4 9.5V13h6zM20 7h-3.5A2.5 2.5 0 0 0 14 9.5V13h6z"/><path d="M10 13c0 3-1.5 4.5-4 5M20 13c0 3-1.5 4.5-4 5"/></svg>',
  talk:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h11v8H8l-4 3z"/><path d="M15 9h5v8l-3-2h-6v-2"/></svg>',
  pencil:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19l3.5-.8L19 7.7 16.3 5 5.8 15.5z"/><path d="M14.5 6.8l2.7 2.7"/></svg>',
  bulb:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17h6M10 20.5h4"/><path d="M8.5 14.5C7 13.3 6 11.6 6 9.5a6 6 0 0 1 12 0c0 2.1-1 3.8-2.5 5z"/></svg>'
});

/* ---------- small helpers ---------- */
var FKEY='kb-family-v1', WKEY='kb-works-v1';
function lsGet(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;}}
var LS_WARNED=false;
function lsSet(k,v){
  try{localStorage.setItem(k,JSON.stringify(v));return true;}
  catch(e){ if(!LS_WARNED){LS_WARNED=true;setTimeout(function(){toast('تعذّر الحفظ: مساحة التخزين في المتصفح ممتلئة أو محجوبة.');},50);} return false; }
}
function uid(p){return (p||'')+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function isF(){return !!(KID&&KID.g==='f');}
/* the gender markers; and the «·» separator beside a number becomes «|», since next to ١٢٣ it reads as a zero («الكلّ · ١» as «الكلّ ١٠») */
function Gx(s,f){return String(s).replace(/⟨([^|⟨⟩]*)\|([^⟨⟩]*)⟩/g,function(m,a,b){return f?b:a;}).replace(/([٠-٩]) ?·/g,'$1 |').replace(/· ?(?=[٠-٩])/g,'| ');}
function G(s){return Gx(s,isF());}
function gOf(kid){return !!(kid&&kid.g==='f');}
function clip(s,n){s=String(s||'').trim();return s.length>n?s.slice(0,n-1)+'…':s;}
function nl2p(s){return String(s||'').split(/\n{2,}/).map(function(p){return p.trim();}).filter(Boolean).map(function(p){return '<p>'+esc(p).replace(/\n/g,'<br>')+'</p>';}).join('');}
function fmtDate(t){try{return new Intl.DateTimeFormat('ar-u-nu-arab',{day:'numeric',month:'long',year:'numeric'}).format(new Date(t));}catch(e){return n2a(dstr(new Date(t)));}}
function fmtHijri(t){try{return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab',{month:'long',year:'numeric'}).format(new Date(t));}catch(e){return '';}}
function fmtDur(sec){sec=Math.max(0,Math.round(sec||0));return n2a(Math.floor(sec/60))+':'+n2a(pad(sec%60));}
function fmtMB(b){var m=b/1048576;return m<1?(n2a(Math.max(1,Math.round(b/1024)))+' ك.ب'):(numA(m)+' م.ب');}
function weekStart(t){var d=new Date(t||Date.now());d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+1)%7));return d;}
function weekKey(t){return dstr(weekStart(t));}
var PRAISE=['⟨أحسنتَ|أحسنتِ⟩ يا {n}!','⟨أصبتَ|أصبتِ⟩!','رائعٌ يا {n}!','⟨بارك الله فيك|بارك الله فيكِ⟩!','ممتاز!'];
function praise(){var p=PRAISE[Math.floor(Math.random()*PRAISE.length)], n=KID&&KID.name?esc(KID.name):'';return n?p.replace('{n}',n):p.replace(/ يا \{n\}/,'');}

/* ---------- blob store (IndexedDB) ---------- */
var IDB={db:null,ok:true}, MEM={}, URLS={};
function idbOpen(){
  return new Promise(function(res){
    if(!('indexedDB' in window)){IDB.ok=false;return res(null);}
    var r; try{r=indexedDB.open('kunuz-family',1);}catch(e){IDB.ok=false;return res(null);}
    r.onupgradeneeded=function(){r.result.createObjectStore('blobs');};
    r.onsuccess=function(){IDB.db=r.result;res(r.result);};
    r.onerror=function(){IDB.ok=false;res(null);};
    r.onblocked=function(){IDB.ok=false;res(null);};
  });
}
function idbReq(mode,fn){
  return new Promise(function(res,rej){
    if(!IDB.db) return rej(new Error('no-idb'));
    var tx=IDB.db.transaction('blobs',mode), out, r=fn(tx.objectStore('blobs'));
    if(r) r.onsuccess=function(){out=r.result;};
    tx.oncomplete=function(){res(out);}; tx.onerror=tx.onabort=function(){rej(tx.error||new Error('tx'));};
  });
}
function readBuf(blob){
  if(blob.arrayBuffer) return blob.arrayBuffer();
  return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res(fr.result);};fr.onerror=rej;fr.readAsArrayBuffer(blob);});
}
async function blobPut(k,blob){
  if(!IDB.db){MEM[k]=blob;return;}
  var buf=await readBuf(blob);
  await idbReq('readwrite',function(s){return s.put({t:blob.type||'application/octet-stream',b:buf},k);});
  if(URLS[k]){try{URL.revokeObjectURL(URLS[k]);}catch(e){} delete URLS[k];}
}
async function blobGet(k){
  if(!k) return null;
  if(!IDB.db) return MEM[k]||null;
  var o=await idbReq('readonly',function(s){return s.get(k);});
  return o?new Blob([o.b],{type:o.t}):null;
}
async function blobDel(k){
  if(!k) return;
  if(URLS[k]){try{URL.revokeObjectURL(URLS[k]);}catch(e){} delete URLS[k];}
  if(!IDB.db){delete MEM[k];return;}
  try{await idbReq('readwrite',function(s){return s.delete(k);});}catch(e){}
}
async function blobKeys(){ if(!IDB.db) return Object.keys(MEM); return (await idbReq('readonly',function(s){return s.getAllKeys();}))||[]; }
async function mediaURL(k){
  if(!k) return null; if(URLS[k]) return URLS[k];
  var b=null; try{b=await blobGet(k);}catch(e){b=null;}
  if(!b) return null;
  URLS[k]=URL.createObjectURL(b); return URLS[k];
}
function hydrate(root){
  [].slice.call((root||document).querySelectorAll('[data-src]')).forEach(function(el){
    var k=el.getAttribute('data-src'); el.removeAttribute('data-src');
    mediaURL(k).then(function(u){
      if(u){el.src=u;}
      else{var sp=document.createElement('span');sp.className='muted';sp.textContent='(تعذّر تحميل الملف)';el.replaceWith(sp);}
    });
  });
}
function blobToDataURL(b){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res(fr.result);};fr.onerror=rej;fr.readAsDataURL(b);});}
function dataURLToBlob(u){
  var m=/^data:([^;,]+)(?:;[^,]*)?;base64,(.*)$/.exec(u||''); if(!m) return null;
  var bin=atob(m[2]), n=bin.length, a=new Uint8Array(n); for(var i=0;i<n;i++) a[i]=bin.charCodeAt(i);
  return new Blob([a],{type:m[1]});
}

/* ---------- family state ---------- */
function freshFam(){return {v:1,fid:uid('f'),kids:[],cur:null,pin:null,salt:null,mags:[],weekly:{},ext:{},pinResets:[],created:Date.now()};}
var FAM=lsGet(FKEY,null);
if(!FAM||typeof FAM!=='object'||!Array.isArray(FAM.kids)) FAM=freshFam();
FAM.mags=FAM.mags||[]; FAM.weekly=FAM.weekly||{}; FAM.ext=FAM.ext||{}; FAM.pinResets=FAM.pinResets||[]; if(!FAM.fid) FAM.fid=uid('f');
var WORKS=lsGet(WKEY,[]); if(!Array.isArray(WORKS)) WORKS=[];
function saveFam(){return lsSet(FKEY,FAM);}
function saveWorks(){return lsSet(WKEY,WORKS);}
function workById(id){for(var i=0;i<WORKS.length;i++){if(WORKS[i].id===id) return WORKS[i];}return null;}
function kidById(id){for(var i=0;i<FAM.kids.length;i++){if(FAM.kids[i].id===id) return FAM.kids[i];}return null;}

var KID=null, KD=null;
function kidKey(id){return 'kb-kid-'+id;}
function kidLoad(id){
  var d=lsGet(kidKey(id),null)||{};
  d.prog=d.prog||{}; d.st=d.st&&typeof d.st==='object'?d.st:freshST();
  d.st.items=d.st.items||{}; d.st.tests=d.st.tests||[]; d.st.daily=d.st.daily||{last:'',days:[],wk:0}; if(!d.st.daily.days) d.st.daily.days=d.st.daily.last?[d.st.daily.last]:[]; d.w=d.w||{}; d.certs=d.certs||{}; d.st.diag=d.st.diag||[]; d.rm=d.rm||{};
  return d;
}
function selectKid(id){
  KID=kidById(id);
  if(!KID){KD=null;prog={};ST=freshST();FAM.cur=null;saveFam();return;}
  KD=kidLoad(id); prog=KD.prog; ST=KD.st; FAM.cur=id; saveFam();
  var ol=document.getElementById('oasisLink'); if(ol){ol.hidden=false; ol.href=wahaURL({kid:id});}
}
function kidSave(){if(!KID||!KD) return; KD.prog=prog; KD.st=ST; lsSet(kidKey(KID.id),KD);}
/* The app open twice (two tabs, or the oasis in one and this in another) shares these records. When the other copy saves, this one
   takes the new records at once, so its next save does not write back an old copy over the other's changes. */
window.addEventListener('storage',function(e){
  try{
    if(e.storageArea!==localStorage||!e.key||e.newValue==null) return;
    if(e.key==='kb-epoch'){ location.reload(); return; }       /* a restore made in another tab */
    if(e.key===FKEY){
      var f=JSON.parse(e.newValue); if(!f||typeof f!=='object'||!Array.isArray(f.kids)) return;
      f.mags=f.mags||[]; f.weekly=f.weekly||{}; f.ext=f.ext||{}; f.pinResets=f.pinResets||[]; FAM=f;
      if(KID){ var k=kidById(KID.id); if(k) KID=k; else { KID=null; KD=null; prog={}; ST=freshST(); } }
    }else if(e.key===WKEY){
      var w=JSON.parse(e.newValue); if(!Array.isArray(w)) return; WORKS=w;
      if(typeof CUR!=='undefined'&&CUR&&CUR.id){ CUR=workById(CUR.id)||CUR; }
    }else if(KID&&e.key===kidKey(KID.id)){
      KD=kidLoad(KID.id); prog=KD.prog; ST=KD.st;
    }
  }catch(err){}
});

/* ---------- avatars ---------- */
var AVC=['lapis','teal','rose','gold','plum','olive'];
var AVE=['🦁','🐪','🦅','🐬','🦉','🐎','🦋','🌙','⭐','🌴','🌷','🐢'];
function firstLetter(n){n=String(n||'').trim();return n?n.charAt(0):'؟';}
function avatarHTML(k,size){
  var c=AVC.indexOf(k&&k.c)>=0?k.c:'lapis', inner;
  if(k&&k.photo&&URLS['photo-'+k.id]) inner='<img alt="" src="'+URLS['photo-'+k.id]+'">';
  else if(k&&k.av&&AVE.indexOf(k.av)>=0) inner='<span class="av-e">'+k.av+'</span>';
  else inner='<span class="av-t">'+esc(firstLetter(k&&k.name))+'</span>';
  return '<span class="av av-'+({l:'lg',s:'s',m:'m'}[size]||'m')+'" style="--avc:var(--'+c+')" aria-hidden="true">'+inner+'</span>';
}
function renderKidChip(){
  var el=document.getElementById('kidChip'); if(!el) return;
  if(GUEST){el.hidden=true;var t0=document.getElementById('tray');if(t0)t0.hidden=true;return;}
  if(KID){el.hidden=false;el.innerHTML=avatarHTML(KID,'s')+'<span class="kc-n">'+esc(KID.name)+'</span>';el.setAttribute('aria-label','تغيير الطفل، الحالي: '+KID.name);}
  else el.hidden=true;
  var tr=document.getElementById('tray'); if(tr) tr.hidden=!KID;
}

/* ---------- toast & modal ---------- */
function toast(msg){
  var t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');t.setAttribute('dir','rtl');t.setAttribute('lang','ar');document.body.appendChild(t);}
  t.textContent=G(msg); t.classList.add('on'); clearTimeout(toast.h); toast.h=setTimeout(function(){t.classList.remove('on');},3600);
}
var MODAL=null;
function closeModal(){ if(!MODAL) return; var m=MODAL; MODAL=null; m.el.remove(); m.res(false); }
function ask(o){
  return new Promise(function(res){
    closeModal(); var tt=document.getElementById('toast'); if(tt) tt.classList.remove('on');
    var el=document.createElement('div'); el.className='modal'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
    el.innerHTML=G('<div class="modal-card" style="--ax:var(--'+(o.c||'lapis')+')"><h2 class="h2" id="mTitle">'+o.title+'</h2>'+(o.html||'')+
      '<p class="form-err" id="mErr" role="alert"></p><div class="actions">'+(o.ok?'<button class="btn'+(o.danger?' danger':'')+'" type="button" data-m="1">'+o.ok+'</button>':'')+
      '<button class="btn ghost" type="button" data-m="0">'+(o.cancel||'رجوع')+'</button></div></div>');
    el.setAttribute('aria-labelledby','mTitle');
    document.getElementById('app').appendChild(el);
    hydrate(el);
    MODAL={el:el,res:res};
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var b=e.target.closest('[data-m]');
      if(b){
        if(b.dataset.m==='1'){
          var v=o.check?o.check(el):true;
          if(v===false) return;
          var m=MODAL; MODAL=null; el.remove(); m.res(v); return;
        }
        closeModal(); return;
      }
      if(e.target===el) closeModal();
    });
    el.addEventListener('keydown',function(e){
      if(e.key==='Escape') closeModal();
      else if(e.key==='Enter'&&e.target.tagName==='INPUT'&&/^(text|password|number|)$/.test(e.target.type||'')){var b=el.querySelector('[data-m="1"]'); if(b){e.preventDefault();b.click();}}
    });
    var f=el.querySelector('input,textarea,select,[data-m="1"]')||el.querySelector('[data-m]'); if(f){try{f.focus();}catch(e){}}
  });
}
function modalErr(el,msg){var e=el.querySelector('#mErr'); if(e) e.textContent=G(msg); return false;}

/* ---------- parent PIN ---------- */
var PARENT_UNTIL=0, LAST_PIN=0, AFTER_PIN=null;
/* one lock for the three sections (here, the oasis and the Hasaniya), kept across reloads: every fifth wrong entry
   (PIN or recovery code) locks for a minute, then 2, 4, 8 … up to 15 minutes; a right entry clears it */
var PIN_LOCK_KEY='kb-pin-lock', PIN_LOCK_MAX=15*60000;
function pinLock(){try{var o=JSON.parse(localStorage.getItem(PIN_LOCK_KEY)||'{}')||{};return {fails:+o.fails||0,until:+o.until||0};}catch(e){return {fails:0,until:0};}}
function pinLockLeft(){var o=pinLock(),u=o.until-Date.now(); if(u>PIN_LOCK_MAX){o.until=Date.now()+PIN_LOCK_MAX;try{localStorage.setItem(PIN_LOCK_KEY,JSON.stringify(o));}catch(e){} u=PIN_LOCK_MAX;} return u>0?u:0;}
function pinFail(){var o=pinLock(); o.fails++; if(o.fails%5===0) o.until=Date.now()+Math.min(PIN_LOCK_MAX,60000*Math.pow(2,o.fails/5-1)); try{localStorage.setItem(PIN_LOCK_KEY,JSON.stringify(o));}catch(e){}}
/* a right PIN clears the lock. It opens the parents' session only when typed at the corner's door (pinSubmit): a PIN typed for one
   export or one print is spent on that step and opens nothing else */
function pinOk(){try{localStorage.removeItem(PIN_LOCK_KEY);}catch(e){} LAST_PIN=Date.now();}
function pinLockMsg(){var s=Math.ceil(pinLockLeft()/1000); return 'محاولاتٌ خاطئةٌ كثيرة. أعيدوا المحاولة بعد '+(s>=60?n2a(Math.ceil(s/60))+' دقيقة':n2a(s)+' ثانية')+'.';}
function parentOn(){return Date.now()<PARENT_UNTIL;}
/* the session lasts fifteen minutes from its PIN at most; using the corner does not extend it */
function parentStart(){PARENT_UNTIL=Date.now()+15*60*1000;}
function parentTouch(){}
async function hashPin(pin,salt){
  var txt=salt+':'+pin;
  try{
    if(window.crypto&&crypto.subtle){
      var h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt));
      return 's'+[].map.call(new Uint8Array(h),function(b){return ('0'+b.toString(16)).slice(-2);}).join('');
    }
  }catch(e){}
  var x=0; for(var i=0;i<txt.length;i++){x=(x*131+txt.charCodeAt(i))>>>0;} return 'h'+x.toString(36);
}
function needParent(next){
  if(!FAM.pin) return setupWelcome();
  if(parentOn()) return next();
  AFTER_PIN=next; pinGate();
}
function pinGate(){
  L=null;
  go('<div class="ax-page narrow" style="--ax:var(--plum)"><button class="back" type="button" data-act="backKid">'+BACK+' رجوع</button>'+
    '<header class="page-head center-head"><span class="ch-ico big">'+ICON.lock+'</span><h1 class="h1">ركن وليّ الأمر</h1>'+
    '<p class="lead">هذه المنطقة للوالدين. أدخلوا رمز وليّ الأمر للمتابعة.</p></header>'+
    '<form class="form" id="pinForm" autocomplete="off" novalidate><label for="pinIn">الرمز</label>'+
    '<input id="pinIn" class="pin-in" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" required>'+
    '<p class="form-err" id="pinErr" role="alert"></p><div class="actions"><button class="btn" type="submit">دخول</button></div></form>'+
    '<button class="link small" type="button" data-act="pinForgot">نسيتم الرمز؟</button></div>');
  var i=document.getElementById('pinIn'); if(i) try{i.focus();}catch(e){}
}
async function pinSubmit(){
  var inp=document.getElementById('pinIn'), err=document.getElementById('pinErr'); if(!inp) return;
  if(pinLockLeft()){inp.value='';err.textContent=pinLockMsg();return;}
  if(!inp.value.trim()){err.textContent='اكتبوا الرمز.';try{inp.focus();}catch(e){}return;}
  var h=await hashPin(inp.value.trim(),FAM.salt||'');
  if(h===FAM.pin){pinOk();parentStart();resetCancelByPin();var n=AFTER_PIN;AFTER_PIN=null;return n?n():parentHome();}
  pinFail(); inp.value='';
  err.textContent=pinLockLeft()?pinLockMsg():'الرمز غير صحيح.';
  try{inp.focus();}catch(e){}
}
/* before anything leaves the device (a file, a backup, a print) the PIN is typed for that very step: an open parent corner is not enough.
   It is asked in a dialog, so the page under it (a certificate, a report) stays as it is. */
async function freshParent(why){
  return !!(await pinAsk({title:'رمز وليّ الأمر',c:'plum',ok:'تابعوا',html:'<p>'+(why||'هذه الخطوة تُخرج شيئًا من الجهاز، فتحتاج رمز وليّ الأمر الآن.')+'</p>'}));
}
/* a dialog (a consent sheet, or the PIN alone) that ends with the PIN typed for this step. Every time: a PIN typed a moment ago for
   something else does not count. After a reset made by waiting out the 72 hours, nothing leaves for thirty days unless the recovery
   code that existed before the reset is typed instead (whoever waited may not be the parent). Returns the dialog's value, or false */
function exportHold(){ return +FAM.exportHold>Date.now()?+FAM.exportHold:0; }
async function holdLift(code){
  var p=FAM.recPrev; if(!p||!p.salt) return false;
  if((await hashPin(rcNorm(code),p.salt))!==p.h) return false;
  FAM.exportHold=0; (FAM.pinLog=FAM.pinLog||[]).push({t:Date.now(),k:'hold-lift'}); saveFam(); return true;
}
async function pinAsk(o){
  if(!FAM.pin) return false;
  var msg='';
  for(;;){
    var hold=exportHold();
    var field=hold?'<div class="warn-box"><strong>الإخراج موقوفٌ حتى '+fmtDate(hold)+'</strong>: أُعيد ضبط الرمز بالانتظار دون رمز الاسترداد. لرفع الإيقاف الآن اكتبوا رمز الاسترداد القديم (الذي كان قبل إعادة الضبط).</div>'+
        '<label class="lbl" for="fpIn">رمز الاسترداد القديم</label><input id="fpIn" dir="ltr" lang="en" autocomplete="off" autocapitalize="characters" spellcheck="false">'
      :'<label class="lbl" for="fpIn">رمز وليّ الأمر لهذه الخطوة</label><input id="fpIn" class="pin-in" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off">';
    var r=await ask({title:o.title,c:o.c,ok:o.ok,danger:o.danger,cancel:o.cancel,
      html:(o.html||'')+field+(msg?'<p class="form-err" role="alert">'+msg+'</p>':''),
      check:function(el){
        var v=o.check?o.check(el):true; if(v===false) return false;
        var p=(el.querySelector('#fpIn').value||'').trim();
        if(pinLockLeft()) return modalErr(el,pinLockMsg());
        if(!p) return modalErr(el,hold?'اكتبوا رمز الاسترداد القديم.':'اكتبوا الرمز.');
        return {v:v,p:p};
      }});
    if(!r) return false;
    if(hold){ if(await holdLift(r.p)) return r.v; }
    else if((await hashPin(r.p,FAM.salt||''))===FAM.pin){pinOk();resetCancelByPin();return r.v;}
    pinFail(); msg=pinLockLeft()?pinLockMsg():(hold?'رمز الاسترداد غير صحيح.':'الرمز غير صحيح.');
  }
}
/* every way out of the device, from all three sections, goes into one list («ما خرج من الجهاز» in the corner) */
function logOut(name,kidId){
  (FAM.waLog=FAM.waLog||[]).push({d:Date.now(),name:String(name).slice(0,120),kid:kidId||null,app:'kunuz'});
  if(FAM.waLog.length>200) FAM.waLog=FAM.waLog.slice(-200); saveFam();
}
/* ---------- forgotten PIN: the recovery code, or a request that waits 72 hours ----------
   No server and no e-mail: the proof is the recovery code shown once when the PIN was made (the parent mails it to himself or writes it down).
   Without it, a reset is only requested; it can be done after 72 hours, a banner shows it all that time in the oasis and here,
   and any correct entry of the current PIN (here, in the oasis or in the Hasaniya) cancels it. */
var RC_ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789', RESET_WAIT=72*3600*1000, SETPIN_RESET=false, RC_SHOWN=null;
function rcNorm(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
async function rcCodeNew(){
  var a=new Uint8Array(12); crypto.getRandomValues(a);
  var c=[].map.call(a,function(x){return RC_ABC[x%RC_ABC.length];}).join('');
  var salt=uid('r'); FAM.rec={salt:salt,h:await hashPin(c,salt),at:Date.now()}; saveFam();
  return c.slice(0,4)+'-'+c.slice(4,8)+'-'+c.slice(8);
}
function rcShow(code,next){
  L=null; RC_SHOWN={code:code,next:next};
  go('<div class="ax-page narrow" style="--ax:var(--plum)">'+
    '<header class="page-head center-head"><span class="ch-ico big">'+ICON.lock+'</span><h1 class="h1">رمز الاسترداد</h1>'+
    '<p class="lead">إن نسيتم رمز وليّ الأمر يومًا فبهذا الرمز وحده تُعيدون ضبطه. يظهر الآن مرةً واحدة، ولا يُحفظ في التطبيق.</p></header>'+
    '<p class="rec-code" dir="ltr" lang="en" id="recCode">'+esc(code)+'</p>'+
    '<div class="actions center-actions"><button class="btn" type="button" data-act="rcMail">'+ICON.share+' أرسلوه إلى بريدكم</button>'+
      '<button class="btn ghost" type="button" data-act="rcCopy">انسخوه</button></div>'+
    '<aside class="didyou"><p>أرسلوه إلى بريدكم أو اكتبوه على ورقةٍ في مكانٍ لا يصل إليه الأطفال. ومن دونه تبقى إعادة الضبط ممكنة، لكنها تنتظر ٧٢ ساعة وتظهر للجميع.</p></aside>'+
    '<label class="check-row"><input type="checkbox" id="rcSaved"> حفظتُه خارج هذا الجهاز</label>'+
    '<div class="actions center-actions"><button class="btn" type="button" data-act="rcDone" id="recDone" disabled>تابعوا</button></div></div>');
  var c=document.getElementById('rcSaved'), d=document.getElementById('recDone');
  if(c&&d) c.addEventListener('change',function(){d.disabled=!c.checked;});
}
function rcText(){ return 'رمز الاسترداد لتطبيق «واحة اللسان العربي» على جهاز العائلة: '+(RC_SHOWN&&RC_SHOWN.code)+'\nبه وحده يُعاد ضبط رمز وليّ الأمر إن نُسي. لا تُطلعوا عليه الأطفال.'; }
async function rcMail(){
  if(!RC_SHOWN) return;
  if(navigator.share){ try{ await navigator.share({title:'رمز استرداد واحة اللسان العربي',text:rcText()}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  location.href='mailto:?subject='+encodeURIComponent('رمز استرداد واحة اللسان العربي')+'&body='+encodeURIComponent(rcText());
}
async function rcCopy(){
  if(!RC_SHOWN) return;
  try{ await navigator.clipboard.writeText(RC_SHOWN.code); toast('نُسخ رمز الاسترداد.'); }
  catch(e){ try{ var r=document.createRange(); r.selectNodeContents(document.getElementById('recCode')); var sl=getSelection(); sl.removeAllRanges(); sl.addRange(r); }catch(e2){} toast('حدّدنا الرمز: انسخوه من الشاشة.'); }
}
function rcDone(){ var n=RC_SHOWN&&RC_SHOWN.next; RC_SHOWN=null; if(n) n(); else parentHome(); }
async function rcRenew(){
  var ok=await ask({title:'رمز استرداد جديد؟',c:'plum',ok:'أنشئوه',html:'<p>يتوقف الرمز القديم فورًا، ويظهر الجديد مرةً واحدة لتحفظوه.</p>'});
  if(!ok) return;
  rcShow(await rcCodeNew(),function(){pBackup();});
}
function resetDue(){ return FAM.resetReq&&FAM.resetReq.due||0; }
/* The 72 hours are counted on this device's clock, which a child can move. So the request must also have been seen on three
   different days (in any of the three sections, where its banner shows), and a clock moved back restarts the wait.
   The same function is in waha_post.js and hasaniya_late.js. */
var RESET_DAYS=3;
function resetSeen(F){
  var r=F&&F.resetReq, now=Date.now(); if(!r) return false;
  var max=Math.max(+r.max||0,+r.at||0);
  if(now<max-2*3600e3){ r.due=Math.max(+r.due||0,now+RESET_WAIT); r.days=[]; r.back=(+r.back||0)+1; }
  /* the Android app has a clock the user cannot set (time since the device started): seen again with the wall clock further ahead
     than that clock moved, the request was sped up by hand, and its wait starts again */
  var mono=0; try{ mono=window.AndroidBridge&&AndroidBridge.elapsed?+AndroidBridge.elapsed():0; }catch(e){}
  if(mono){ var o=r.mono; if(o&&mono>=o.m&&now-o.w>(mono-o.m)+10*60000){ r.due=Math.max(+r.due||0,now+RESET_WAIT); r.days=[]; r.fwd=(+r.fwd||0)+1; } r.mono={w:now,m:mono}; }
  r.max=Math.max(max,now); var t=new Date(now), d=t.getFullYear()+'-'+(t.getMonth()+1)+'-'+t.getDate();
  r.days=Array.isArray(r.days)?r.days:[]; if(r.days.indexOf(d)<0) r.days=r.days.concat(d).slice(-10);
  return true;
}
function resetDays(){ return FAM.resetReq&&Array.isArray(FAM.resetReq.days)?FAM.resetReq.days.length:0; }
function resetReady(){ return !!FAM.resetReq&&Date.now()>=resetDue()&&resetDays()>=RESET_DAYS; }
if(resetSeen(FAM)) saveFam();
function resetBanner(){
  if(!FAM.resetReq) return '';
  return '<div class="banner rose reset-banner" role="status">'+ICON.lock+'<div class="bn-t"><strong>طُلبت إعادة ضبط رمز وليّ الأمر يوم '+fmtDate(FAM.resetReq.at)+'</strong>'+
    '<span>يمكن تنفيذها بعد '+fmtDate(resetDue())+'. إن لم تطلبوها فأدخلوا الرمز الحالي في ركن وليّ الأمر فيُلغى الطلب.</span></div></div>';
}
function resetCancelByPin(){
  if(!FAM.resetReq) return;
  FAM.resetReq=null; (FAM.pinLog=FAM.pinLog||[]).push({t:Date.now(),k:'cancel-pin'}); saveFam();
  toast('أُلغي طلب إعادة ضبط الرمز، لأن الرمز الصحيح أُدخل.');
}
function pinForgot(){
  L=null;
  if(FAM.resetReq) return resetPage();
  go('<div class="ax-page narrow" style="--ax:var(--rose)"><button class="back" type="button" data-act="parent">'+BACK+' رجوع</button>'+
    '<header class="page-head center-head"><span class="ch-ico big">'+ICON.lock+'</span><h1 class="h1">نسيتم الرمز؟</h1>'+
    (FAM.rec?'<p class="lead">أدخلوا <strong>رمز الاسترداد</strong> الذي ظهر لكم عند إنشاء الرمز، وأرسلتموه إلى بريدكم أو كتبتموه.</p></header>'+
      '<form class="form" id="recForm" autocomplete="off" novalidate><label for="rcIn">رمز الاسترداد</label><input id="rcIn" dir="ltr" lang="en" autocomplete="off" autocapitalize="characters" spellcheck="false" required>'+
      '<p class="form-err" id="rcErr" role="alert"></p><div class="actions"><button class="btn" type="submit">تحقّقوا</button></div></form>'
     :'<p class="lead">لم يُنشأ لهذا الجهاز رمز استرداد بعد.</p></header>')+
    '<section><h2 class="h2">'+(FAM.rec?'فقدتم رمز الاسترداد أيضًا؟':'إعادة الضبط بالانتظار')+'</h2>'+
      '<p>يُسجَّل طلب إعادة الضبط الآن، ويمكن تنفيذه بعد ٧٢ ساعة. طوال هذه المدة تظهر لافتةٌ في الواحة و«كنوز البيان»، وأيّ إدخالٍ صحيح للرمز الحالي يلغي الطلب. وعند ضبط الرمز الجديد تُلغى كلّ الموافقات السابقة.</p>'+
      '<div class="actions"><button class="btn ghost" type="button" data-act="resetReq">اطلبوا إعادة الضبط</button></div></section></div>');
  var i=document.getElementById('rcIn'); if(i) try{i.focus();}catch(e){}
}
async function rcSubmit(){
  var inp=document.getElementById('rcIn'), err=document.getElementById('rcErr'); if(!inp||!FAM.rec) return;
  if(pinLockLeft()){err.textContent=pinLockMsg();return;}
  if(!rcNorm(inp.value)){err.textContent='اكتبوا رمز الاسترداد.';return;}
  var ok=(await hashPin(rcNorm(inp.value),FAM.rec.salt))===FAM.rec.h;
  if(!ok){ pinFail(); err.textContent=pinLockLeft()?pinLockMsg():'رمز الاسترداد غير صحيح.'; return; }
  try{localStorage.removeItem(PIN_LOCK_KEY);}catch(e){} FAM.pin=null; FAM.resetReq=null; (FAM.pinLog=FAM.pinLog||[]).push({t:Date.now(),k:'code'}); saveFam();
  setupPin(true);
}
async function resetRequest(){
  var due=Date.now()+RESET_WAIT;
  var ok=await ask({title:'طلب إعادة ضبط الرمز',c:'rose',ok:'سجّلوا الطلب',danger:1,
    html:'<p>يمكن ضبط رمزٍ جديد بعد ٧٢ ساعة، أي بعد '+fmtDate(due)+'. تظهر اللافتة طوال هذه المدة، وأيّ إدخالٍ صحيح للرمز الحالي يلغي الطلب.</p>'+
      '<p>وعند ضبط الرمز الجديد <strong>تُلغى كلّ الموافقات السابقة</strong>: تعود الأعمال المعتمدة إلى «بانتظار المراجعة»، والمجلّات غير الصادرة إلى المسوّدة. الأعمال والتسجيلات نفسها لا تُحذف.</p>'});
  if(!ok) return;
  FAM.resetReq={at:Date.now(),due:due}; resetSeen(FAM); (FAM.pinLog=FAM.pinLog||[]).push({t:Date.now(),k:'request'}); saveFam();
  resetPage();
}
function resetPage(){
  L=null; var due=resetDue(), left=due-Date.now();
  go('<div class="ax-page narrow" style="--ax:var(--rose)"><button class="back" type="button" data-act="backKid">'+BACK+' رجوع</button>'+
    '<header class="page-head center-head"><span class="ch-ico big">'+ICON.lock+'</span><h1 class="h1">طلب إعادة ضبط الرمز</h1>'+
    '<p class="lead">سُجّل الطلب يوم '+fmtDate(FAM.resetReq.at)+'.</p></header>'+
    (left>0?'<p>يمكن ضبط رمزٍ جديد بعد '+fmtDate(due)+' (بعد نحو '+n2a(Math.ceil(left/3600000))+' ساعة).</p>'
      :resetReady()?'<div class="actions"><button class="btn danger" type="button" data-act="resetDo">اضبطوا رمزًا جديدًا</button></div>'
      :'<p>مضت المدة، وبقي أن يُفتح التطبيق في '+n2a(RESET_DAYS)+' أيامٍ مختلفة منذ الطلب (فُتح حتى الآن في '+n2a(resetDays())+'). هذا يحمي الرمز من تقديم ساعة الجهاز.</p>')+
    (FAM.resetReq.back?'<p class="muted small">رُجعت ساعة الجهاز إلى الوراء بعد الطلب، فبدأت المدة من جديد.</p>':'')+
    '<p class="muted small">إن لم تطلبوا هذا، فأدخلوا الرمز الحالي في ركن وليّ الأمر فيُلغى، أو ألغوه من هنا.</p>'+
    '<div class="actions"><button class="btn ghost" type="button" data-act="resetCancel">ألغوا الطلب</button></div></div>');
}
function resetCancel(){ FAM.resetReq=null; (FAM.pinLog=FAM.pinLog||[]).push({t:Date.now(),k:'cancel'}); saveFam(); toast('أُلغي الطلب، وبقي الرمز كما هو.'); who(); }
function resetDo(){
  if(!resetReady()) return resetPage();
  WORKS.forEach(function(w){ if(w.status==='approved'){w.status='sent';w.updated=Date.now();} });
  FAM.mags.forEach(function(m){ if(m.status!=='published') m.status='draft'; });
  FAM.recPrev=FAM.rec||null; FAM.exportHold=Date.now()+30*864e5; (FAM.pinLog=FAM.pinLog||[]).push({t:Date.now(),k:'reset-wait'});
  FAM.pin=null; FAM.resetReq=null; FAM.pinResets.push(Date.now()); saveWorks(); saveFam();
  setupPin(true);
}

/* ---------- install hints ---------- */
var INSTALL_EVT=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();INSTALL_EVT=e;var b=document.getElementById('installBtn');if(b) b.hidden=false;});
function isIOS(){return /iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}
function isStandalone(){try{return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}}
function installHTML(){
  if(isStandalone()) return '';
  return '<aside class="didyou install"><span class="eyebrow">ثبّتوا التطبيق على الشاشة الرئيسية</span>'+
    (isIOS()?'<p>على iPhone وiPad: اضغطوا زرّ المشاركة في Safari، ثم «إضافة إلى الشاشة الرئيسية»، وافتحوا التطبيق من أيقونته دائمًا. <strong>هذا مهمّ:</strong> Safari قد يمسح بيانات المواقع غير المثبّتة إذا لم تُفتح أيامًا، والتطبيق المثبّت محفوظٌ من ذلك. ولاحظوا أن التطبيق المثبّت له بياناته الخاصة، فابدؤوا الاستعمال منه.</p>':
      '<p>يعمل التطبيق بعدها بلا إنترنت، ويُفتح كأيّ تطبيق. في Chrome: القائمة ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>')+
    '<button class="btn ghost small-btn" type="button" id="installBtn" data-act="install"'+(INSTALL_EVT?'':' hidden')+'>ثبّتوه الآن</button></aside>';
}
async function doInstall(){ if(!INSTALL_EVT) return; INSTALL_EVT.prompt(); try{await INSTALL_EVT.userChoice;}catch(e){} INSTALL_EVT=null; var b=document.getElementById('installBtn'); if(b) b.hidden=true; }

/* ---------- first run ---------- */
/* the family's first screen belongs to the whole app, not to this section: the header says «واحة اللسان العربي» until setup is done */
function brandAsApp(on){ var n=document.querySelector('#homeBtn .b-name'), b=document.querySelector('#homeBtn .b-sub'); if(!n||!b) return; on=on||SETUP;
  if(on){ if(!n.dataset.kz){ n.dataset.kz=n.textContent; b.dataset.kz=b.textContent; } n.textContent='واحة اللسان العربي'; b.textContent='تطبيق العائلة: الواحة، و«كنوز البيان»، والمنظومة الحسنية'; }
  else if(n.dataset.kz){ n.textContent=n.dataset.kz; b.textContent=b.dataset.kz; } }
/* the end of the first setup: who starts, a test of the Arabic voice (without one, the 🔊 buttons are silent), another child */
var SETUP=false;
function setupDone(){
  L=null;
  go('<div class="ax-page narrow" style="--ax:var(--olive)"><header class="page-head center-head"><h1 class="h1">تمّ الإعداد: من يبدأ؟</h1>'+
    '<p class="lead">اختاروا الطفل الذي يلعب الآن، فتُفتح له واحته. وتعودون إلى لوحاتكم من «من يلعب؟ ← 👪 للوالدين».</p></header>'+
    '<div class="who">'+FAM.kids.map(function(k){return '<button class="who-card" type="button" data-act="setupStart" data-id="'+k.id+'" style="--ax:var(--'+(k.c||'lapis')+')">'+avatarHTML(k,'l')+'<span class="who-n">'+esc(k.name)+'</span></button>';}).join('')+'</div>'+
    '<section><h2 class="h2">هل في الجهاز صوتٌ عربي؟</h2><p>الصغار يسمعون الأسئلة والخيارات بالقارئ الآلي. جرّبوه الآن: إن لم تسمعوا جملةً عربية واضحة فثبّتوا صوتًا عربيًّا من إعدادات «تحويل النص إلى كلام» في الجهاز.</p>'+
      '<div class="actions"><button class="btn ghost" type="button" data-act="voiceTest">🔊 جرّبوا الصوت</button></div><p class="muted" id="vtFb" role="status"></p></section>'+
    '<div class="actions"><button class="btn ghost" type="button" data-act="kidAdd">➕ أضيفوا طفلًا آخر</button></div></div>');
}
function setupStart(id){ SETUP=false; PARENT_UNTIL=0; selectKid(id); toOasis(); }
function voiceTest(){
  var fb=document.getElementById('vtFb'), say=function(t){ if(fb) fb.textContent=t; };
  if(!hasTTS) return say('لا يدعم هذا المتصفح القراءة الآلية. جرّبوا تطبيق أندرويد أو متصفحًا آخر.');
  loadVoices();
  try{ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance('السلام عليكم، أنا رفيقكم في واحة اللسان العربي'); u.lang='ar-SA'; if(arVoice) u.voice=arVoice; u.rate=.92; speechSynthesis.speak(u); }catch(e){}
  say(arVoice?'هل سمعتم الجملة بالعربية؟ إن سمعتموها فالصوت جاهز.':'لم نجد صوتًا عربيًّا في الجهاز، فقد تُقرأ الجملة بصوتٍ غير عربي أو لا تُقرأ. ثبّتوا صوتًا عربيًّا من إعدادات «تحويل النص إلى كلام».');
}
function setupWelcome(){
  L=null;
  go('<div class="ax-page" style="--ax:var(--lapis)">'+
    '<header class="page-head"><span class="eyebrow">نسخة العائلة</span><h1 class="h1">أهلًا بكم في «واحة اللسان العربي»</h1>'+
    '<p class="lead">تطبيقٌ عائلي يتعلّم فيه أطفالكم العربية من محفوظهم من القرآن والحديث والشعر، ويكشفون أسرار البيان في خزائن «كنوز البيان»، ويسجّلون أصواتهم، ويكتبون ويرسمون، ويصنعون مجلّتهم الخاصة.</p>'+
    '<div class="actions"><button class="btn" type="button" data-act="setupPin">ابدؤوا: أنشئوا رمز وليّ الأمر</button>'+
    '<label class="btn ghost file-btn">عندنا نسخةٌ احتياطية<input type="file" accept=".json,application/json" data-file="restore" hidden></label></div></header>'+
    '<section class="promise"><h2 class="h2">'+ICON.shield.replace('<svg','<svg class="ic"')+' وعدُنا لكم</h2><ul class="checks">'+
      '<li><strong>كلّ شيءٍ يبقى على هذا الجهاز:</strong> أسماء الأطفال وأصواتهم ورسومهم وصورهم. لا حساب، ولا خادم، ولا رفع إلى الإنترنت.</li>'+
      '<li><strong>لا يخرج عملٌ إلا بأيديكم:</strong> أنتم من يُصدر الملف ويرسله، بعد تنبيهٍ وموافقةٍ صريحة في كل مرة، حتى في الإهداءات.</li>'+
      '<li><strong>الطفل يصنع، وأنتم تعتمدون:</strong> يرسل الطفل عمله إليكم، فتعتمدونه أو تعيدونه بملاحظة، ثم تقرّرون نشره.</li>'+
      '<li><strong>الصورة الشخصية للطفل</strong>، إن أضفتموها، تبقى هنا ولا تدخل أي ملفٍ يُرسَل.</li></ul></section>'+
    installHTML()+
    '<aside class="didyou"><span class="eyebrow">رمز وليّ الأمر</span><p>سننشئ الآن رمزًا من الأرقام يحمي ركن وليّ الأمر: الاعتماد والتصدير والإعدادات، ثم يظهر لكم <strong>رمز استرداد</strong> ترسلونه إلى بريدكم، فبه وحده يُعاد ضبط الرمز إن نُسي.</p></aside>'+
    '</div>');
}
function setupPin(afterReset){
  L=null; SETPIN_RESET=!!afterReset; var change=!!FAM.pin&&!afterReset;
  go('<div class="ax-page narrow" style="--ax:var(--plum)">'+
    '<header class="page-head center-head"><span class="ch-ico big">'+ICON.lock+'</span><h1 class="h1">'+(afterReset?'رمزٌ جديد':'رمز وليّ الأمر')+'</h1>'+
    '<p class="lead">من أربعة أرقامٍ إلى ستة. اختاروا رمزًا لا يعرفه الأطفال، ولا يُحفظ إلا على هذا الجهاز.</p></header>'+
    '<form class="form" id="setPinForm" autocomplete="off" novalidate>'+(change?'<label for="p0">الرمز الحالي</label><input id="p0" class="pin-in" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" required>':'')+'<label for="p1">'+(change?'الرمز الجديد':'الرمز')+'</label><input id="p1" class="pin-in" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" required>'+
    '<label for="p2">أعيدوا كتابة الرمز</label><input id="p2" class="pin-in" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" required>'+
    '<p class="form-err" id="setPinErr" role="alert"></p><div class="actions"><button class="btn" type="submit">احفظوا الرمز</button></div></form></div>');
}
async function setPinSubmit(){
  var a=(document.getElementById('p1')||{}).value||'', b=(document.getElementById('p2')||{}).value||'', err=document.getElementById('setPinErr');
  a=a.trim(); b=b.trim();
  if(!/^\d{4,6}$/.test(a)){err.textContent='الرمز من أربعة أرقامٍ إلى ستة، أرقامٌ فقط.';return;}
  if(a!==b){err.textContent='الرمزان غير متطابقين.';return;}
  /* changing the PIN (not making the first one, nor one after a reset) needs the current PIN typed here, and is logged and shown
     for thirty days in every consent sheet, like a reset */
  var p0=document.getElementById('p0'), change=!!p0;
  if(change){
    if(pinLockLeft()){err.textContent=pinLockMsg();return;}
    if((await hashPin((p0.value||'').trim(),FAM.salt||''))!==FAM.pin){pinFail();p0.value='';err.textContent=pinLockLeft()?pinLockMsg():'الرمز الحالي غير صحيح.';return;}
    pinOk();
  }
  FAM.salt=uid('s'); FAM.pin=await hashPin(a,FAM.salt);
  if(change){ (FAM.pinLog=FAM.pinLog||[]).push({t:Date.now(),k:'change'}); FAM.pinResets=FAM.pinResets||[]; FAM.pinResets.push(Date.now()); }
  saveFam(); parentStart();
  try{if(navigator.storage&&navigator.storage.persist) navigator.storage.persist();}catch(e){}
  var cont=function(){ if(!FAM.kids.length) return kidForm(null); toast('حُفظ الرمز الجديد.'); parentHome(); };
  /* a new family, or a PIN made after a reset, gets a new recovery code (the old one, if any, has been used or is unknown) */
  if(!FAM.rec||SETPIN_RESET){ SETPIN_RESET=false; return rcShow(await rcCodeNew(),cont); }
  cont();
}

/* ---------- kids: picker and form ---------- */
function who(){
  L=null; KID=null; KD=null; renderKidChip();
  if(!FAM.pin) return setupWelcome();
  if(!FAM.kids.length) return needParent(function(){kidForm(null);});
  go('<div class="ax-page" style="--ax:var(--lapis)">'+
    '<header class="page-head center-head"><span class="eyebrow">كنوز البيان</span><h1 class="h1">مَن معنا اليوم؟</h1></header>'+resetBanner()+
    '<div class="who">'+FAM.kids.map(function(k){
      var d=kidLoad(k.id), n=LESSONS.filter(function(l){return d.prog[l.id];}).length;
      return '<button class="who-card" type="button" data-act="pickKid" data-id="'+k.id+'" style="--ax:var(--'+(k.c||'lapis')+')">'+avatarHTML(k,'l')+
        '<span class="who-n">'+esc(k.name)+'</span><span class="who-g">'+gem(n>0)+' '+n2a(n)+' / '+n2a(LESSONS.length)+'</span></button>';
    }).join('')+'</div>'+
    '<div class="actions center-actions"><button class="btn ghost" type="button" data-act="parent">'+ICON.lock+' ركن وليّ الأمر</button></div></div>');
}
var KF=null; // kid form draft
function kidForm(id){
  var k=id?kidById(id):null;
  KF={id:id||null,name:k?k.name:'',g:k?k.g:'',by:k?(k.by||0):0,av:k?(k.av||'letter'):'letter',c:k?(k.c||'lapis'):AVC[FAM.kids.length%AVC.length],photo:k?!!k.photo:false,newPhoto:null,dropPhoto:false};
  renderKidForm();
}
function renderKidForm(){
  var bySel=document.getElementById('kfBy'); if(bySel&&KF) KF.by=+bySel.value||0;
  var k=KF, first=!FAM.kids.length, yr=new Date().getFullYear(), years=[]; for(var y=yr-4;y>=yr-16;y--) years.push(y);
  var prev={id:k.id||'tmp',name:k.name||'؟',c:k.c,av:k.av,photo:k.photo&&!k.dropPhoto};
  if(k.newPhoto&&URLS['photo-tmp']) {prev.id='tmp';prev.photo=true;}
  go('<div class="ax-page narrow" style="--ax:var(--lapis)">'+(first?'':'<button class="back" type="button" data-act="pKids">'+BACK+' الأطفال</button>')+
    '<header class="page-head"><span class="eyebrow">ركن وليّ الأمر</span><h1 class="h1">'+(k.id?'ملفّ '+esc(k.name):(first?'ملفّ الطفل الأول':'طفلٌ جديد'))+'</h1>'+
    '<p class="lead">يخاطب التطبيقُ الطفلَ باسمه، وبصيغة المذكّر أو المؤنّث في كل نصوصه وتعليقاته.</p></header>'+
    '<form class="form" id="kidForm" autocomplete="off" novalidate>'+
      '<div class="kf-prev">'+avatarHTML(prev,'l')+'</div>'+
      '<label for="kfName">الاسم</label><input id="kfName" maxlength="24" required value="'+escA(k.name)+'" placeholder="الاسم الذي يُنادى به">'+
      '<span class="lbl" id="kfGL">ولدٌ أم بنت؟</span><div class="seg big" role="radiogroup" aria-labelledby="kfGL">'+
        '<button type="button" role="radio" aria-checked="'+(k.g==='m')+'" class="'+(k.g==='m'?'on':'')+'" data-act="kfG" data-v="m">ولد</button>'+
        '<button type="button" role="radio" aria-checked="'+(k.g==='f')+'" class="'+(k.g==='f'?'on':'')+'" data-act="kfG" data-v="f">بنت</button></div>'+
      '<label for="kfBy">سنة الميلاد</label><select id="kfBy"><option value="0">لم تُحدَّد</option>'+years.map(function(y){return '<option value="'+y+'"'+(k.by===y?' selected':'')+'>'+n2a(y)+'</option>';}).join('')+'</select>'+
      '<p class="muted small" style="margin:-4px 0 0">بها تختار «واحة اللسان العربي» طريقة اللعب: حتى الثامنة يختار الطفل من خيارات، ومن التاسعة يكتب. تبقى على هذا الجهاز.</p>'+
      '<span class="lbl">الصورة الرمزية</span><div class="av-pick">'+
        '<button type="button" class="avp'+(k.av==='letter'?' on':'')+'" data-act="kfAv" data-v="letter" aria-label="الحرف الأول من الاسم">'+avatarHTML({name:k.name||'؟',c:k.c,av:'letter'},'s')+'</button>'+
        AVE.map(function(e){return '<button type="button" class="avp'+(k.av===e?' on':'')+'" data-act="kfAv" data-v="'+e+'">'+avatarHTML({c:k.c,av:e},'s')+'</button>';}).join('')+'</div>'+
      '<span class="lbl">اللون</span><div class="sw-pick">'+AVC.map(function(c){return '<button type="button" class="sw'+(k.c===c?' on':'')+'" style="--avc:var(--'+c+')" data-act="kfC" data-v="'+c+'" aria-label="'+({lapis:'أزرق',teal:'فيروزي',rose:'وردي',gold:'ذهبي',plum:'بنفسجي',olive:'زيتوني'}[c]||c)+'" aria-pressed="'+(k.c===c)+'"></button>';}).join('')+'</div>'+
      '<details class="adult"'+(k.photo||k.newPhoto?' open':'')+'><summary>صورةٌ شخصية (اختيارية)</summary>'+
        '<p>تظهر على هذا الجهاز وحده، ولا تدخل أبدًا في أي ملفٍ يُرسَل: المجلّات والإهداءات وملفات المعلّم تستعمل الحرف الأول أو الصورة الرمزية.</p>'+
        '<div class="actions"><label class="btn ghost file-btn">'+ICON.camera+' اختاروا صورة<input type="file" accept="image/*" data-file="kidPhoto" hidden></label>'+
        ((k.photo&&!k.dropPhoto)||k.newPhoto?'<button type="button" class="btn ghost" data-act="kfNoPhoto">احذفوا الصورة</button>':'')+'</div></details>'+
      /* the first child: a second one can be added right away, before the phone is handed over */
      (!k.id&&!FAM.kids.length?'<label class="tog"><input type="checkbox" id="kfMore"><span>في البيت طفلٌ آخر: أضيفوه بعد هذا</span></label>':'')+
      '<p class="form-err" id="kfErr" role="alert"></p>'+
      '<div class="actions"><button class="btn" type="submit">'+(k.id?'احفظوا':'أضيفوا الطفل')+'</button></div></form></div>');
}
async function kidPhotoPicked(file){
  if(!file||!/^image\//.test(file.type)) return toast('اختاروا ملفّ صورة.');
  try{var b=await shrinkImage(file,480,.85); KF.newPhoto=b; KF.dropPhoto=false;
    if(URLS['photo-tmp']){try{URL.revokeObjectURL(URLS['photo-tmp']);}catch(e){}}
    URLS['photo-tmp']=URL.createObjectURL(b); KF.name=(document.getElementById('kfName')||{}).value||KF.name; renderKidForm();
  }catch(e){toast('تعذّرت قراءة الصورة.');}
}
async function kidFormSubmit(){
  var name=((document.getElementById('kfName')||{}).value||'').trim(), err=document.getElementById('kfErr');
  if(!name){err.textContent='اكتبوا اسم الطفل.';return;}
  if(KF.g!=='m'&&KF.g!=='f'){err.textContent='اختاروا: ولدٌ أم بنت، ليخاطبه التطبيق بالصيغة الصحيحة.';return;}
  var k=KF.id?kidById(KF.id):null, isNew=!k;
  if(isNew){k={id:uid('k'),created:Date.now()};FAM.kids.push(k);}
  k.name=name.slice(0,24); k.g=KF.g; k.av=KF.av; k.c=KF.c; k.by=+((document.getElementById('kfBy')||{}).value||KF.by||0)||0;
  if(KF.newPhoto){await blobPut('photo-'+k.id,KF.newPhoto); k.photo=true; await mediaURL('photo-'+k.id);}
  else if(KF.dropPhoto){await blobDel('photo-'+k.id); k.photo=false;}
  if(URLS['photo-tmp']){try{URL.revokeObjectURL(URLS['photo-tmp']);}catch(e){} delete URLS['photo-tmp'];}
  var more=!!(document.getElementById('kfMore')||{}).checked;
  saveFam(); var first=FAM.kids.length===1&&isNew; KF=null;
  if(first&&more){ SETUP=true; selectKid(k.id); toast('حُفظ ملفّ '+k.name+'. والآن الطفل الثاني.'); return kidForm(null); }
  if(first){PARENT_UNTIL=0;selectKid(k.id);if(!IN_KUNUZ) return toOasis();toast(Gx('⟨أهلًا بك|أهلًا بكِ⟩ يا ',k.g==='f')+k.name+'!');return home();}
  if(SETUP){ toast('حُفظ ملفّ '+k.name+'.'); return setupDone(); }
  toast('حُفظ ملفّ '+k.name+'.'); pKids();
}
function shrinkImage(file,max,q){
  return new Promise(function(res,rej){
    var u=URL.createObjectURL(file), im=new Image();
    im.onload=function(){
      var w=im.naturalWidth,h=im.naturalHeight,s=Math.min(1,max/Math.max(w,h)), c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(w*s)); c.height=Math.max(1,Math.round(h*s));
      var x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(im,0,0,c.width,c.height);
      URL.revokeObjectURL(u);
      c.toBlob(function(b){b?res(b):rej(new Error('blob'));},'image/jpeg',q||.85);
    };
    im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('img'));};
    im.src=u;
  });
}

/* ---------- the child's home ---------- */
function home(){
  if(!KID) return who();
  L=null;
  var d=doneCount(), mine=WORKS.filter(function(w){return w.kid===KID.id;});
  var back=mine.filter(function(w){return w.status==='returned';}), fresh=mine.filter(function(w){return w.status==='approved'&&!w.seen;});
  var wk=weeklyNow(), wkw=wk&&workById(wk.work), wkk=wk&&kidById(wk.kid);
  var banners=resetBanner(), newC=certSync(KID.id), gs=kidStats(KID.id), gits=gardenItems(gs), gnew=gardenFresh(gs,gits);
  var unseenC=CERTS.filter(function(c){var a=gs.d.certs[c.id];return a&&!a.seen;});
  if(wkw&&wkk&&wkw.audio){
    var me=wkk.id===KID.id;
    banners+='<section class="banner gold">'+avatarHTML(wkk,'m')+'<div class="bn-t"><span class="eyebrow">'+Gx('⟨قارئ|قارئة⟩ الأسبوع',gOf(wkk))+'</span>'+
      '<p>'+(me?'⟨أنتَ قارئ|أنتِ قارئة⟩ هذا الأسبوع! اختار وليّ أمرك ⟨قراءتك|قراءتكِ⟩: «'+esc(titleOf(wkw))+'».':Gx(esc(wkk.name)+' ⟨قارئ|قارئة⟩ هذا الأسبوع: «',gOf(wkk))+esc(titleOf(wkw))+'».')+'</p>'+
      '<audio controls preload="none" data-src="'+wkw.audio+'"></audio></div></section>';
  } else if(Object.keys(FAM.weekly).length&&typeof weeklyTurn==='function'){
    var tk=weeklyTurn(); if(tk&&tk.id===KID.id) banners+='<button class="banner gold" type="button" data-act="studio">'+ICON.radio+'<div class="bn-t"><strong>هذا الأسبوع دورك في «قارئ الأسبوع»</strong><span>⟨سجّل|سجّلي⟩ قراءةً جميلة في «قراءتي»، ⟨واعرضها|واعرضيها⟩ على وليّ أمرك ليختارها.</span></div></button>';
  }
  if(back.length) banners+='<button class="banner rose" type="button" data-act="works" data-v="returned">'+ICON.talk+'<div class="bn-t"><strong>'+(back.length===1?'عاد إليك عملٌ بملاحظة':'عادت إليك '+n2a(back.length)+' أعمال بملاحظات')+'</strong><span>⟨افتحه|افتحيه⟩ ⟨واقرأ|واقرئي⟩ الملاحظة، ثم ⟨عدّله|عدّليه⟩ ⟨وأرسله|وأرسليه⟩ من جديد.</span></div></button>';
  if(fresh.length) banners+='<button class="banner ok" type="button" data-act="works" data-v="approved">'+ICON.check+'<div class="bn-t"><strong>'+(fresh.length===1?'اعتمد وليّ أمرك عملًا ⟨لك|لكِ⟩':'اعتمد وليّ أمرك '+n2a(fresh.length)+' من أعمالك')+'</strong><span>«'+esc(clip(titleOf(fresh[0]),40))+'»'+(fresh.length>1?' وغيره':'')+'</span></div></button>';
  if(unseenC.length) banners+=certNote(unseenC);
  banners+=rmBanner()+fsBanner()+diagBanner();
  if(gnew.length) banners+='<button class="banner green" type="button" data-act="garden"><span class="bn-e" aria-hidden="true">🌱</span><div class="bn-t"><strong>جديدٌ في حديقتك</strong><span>'+gardenNews(gnew)+'. ⟨تعال|تعالَي⟩ ⟨وانظر|وانظري⟩!</span></div></button>';
  var nC=CERTS.filter(function(c){return gs.d.certs[c.id];}).length;
  go('<section class="hello">'+avatarHTML(KID,'l')+'<div><h1 class="h1">⟨أهلًا بك|أهلًا بكِ⟩ يا '+esc(KID.name)+'</h1>'+
      '<p class="lead">في كل درسٍ لغزٌ من القرآن أو من اللغة: ⟨تتأمّله|تتأمّلينه⟩ أولًا، ثم ⟨تكشف|تكشفين⟩ سرّه، ثم ⟨تجيب|تجيبين⟩ عن التحدّي ⟨لتربح|لتربحي⟩ جوهرة. وفي الاستوديو ⟨تصنع|تصنعين⟩ أعمالك، ⟨وتجمعها|وتجمعينها⟩ في مجلّتك.</p></div></section>'+
    banners+
    '<section class="feature" style="--ax:var(--lapis)">'+
      '<div class="f-txt"><span class="eyebrow">سؤال الدكتور السامرائي</span>'+
      '<p>اعتاد الدكتور فاضل السامرائي أن يقف عند كلمةٍ في القرآن ويسأل: لماذا قيلت هذه الكلمة ولم تُقَل غيرها؟ ولماذا قُدّمت هذه وأُخّرت تلك؟ هذا السؤال هو مفتاح خزانتنا.</p></div>'+
      '<button class="btn" type="button" data-open="'+(d?nextUndone():'sadd')+'">'+(d?(d===LESSONS.length?'⟨راجع|راجعي⟩ أول جوهرة':'⟨تابع|تابعي⟩ رحلتك'):'⟨ابدأ|ابدئي⟩ بأشهر لمساته')+'</button>'+
    '</section>'+
    '<section class="gpair"><button class="gprev" type="button" data-act="garden" style="--ax:var(--olive)"><span class="gprev-svg">'+gardenSVG(gs,gits,{id:'gh',label:'حديقتي'})+'</span>'+
      '<span class="gprev-t"><span class="door-t">حديقتي</span><span class="door-d">'+gardenSummary(gs,gits)+'</span></span></button>'+
      '<button class="sdoor" type="button" data-act="certs" style="--ax:var(--gold)"><span class="ch-ico">'+ICON.shield+'</span><span class="door-t">شهاداتي</span>'+
      '<span class="door-d">'+(nC?n2a(nC)+' من '+n2a(CERTS.length)+' شهادة':'شهاداتٌ ⟨تنالها|تنالينها⟩ بالإتقان والإبداع والمواظبة.')+'</span></button></section>'+
    '<section><h2 class="h2">استوديو الباكورة</h2>'+
      '<div class="studio-doors">'+
        doorBtn('studio','rose','mic','⟨اصنع|اصنعي⟩ عملًا','⟨سجّل|سجّلي⟩ صوتك، ⟨واكتب|واكتبي⟩، ⟨وارسم|وارسمي⟩.')+
        doorBtn('works','teal','book','أعمالي',worksSummary(mine))+
        doorBtn('mags','gold','mag','مجلّاتنا',magsSummary())+
        doorBtn('radio','plum','radio','إذاعة الباكورة','أصوات العائلة في مكانٍ واحد.')+
      '</div></section>'+
    '<section><h2 class="h2">الخزائن '+axWord()+'</h2><p class="lead" style="margin:0 0 12px">'+gemsWord(LESSONS.length)+' من أسرار العربية، جمعناها من كتب علماء أحبّوها، من الخليل بن أحمد إلى الدكتور فاضل السامرائي وعارف حجاوي وقناة «تأمَّل».</p><div class="chambers">'+AXES.map(chamberCard).join('')+'</div></section>'+
    toolsHTML()+
    (function(x){ return x ? '<section class="doors">'+x+'</section>' : ''; })(wahaDoor()+rmDoor())+   /* the way back to the oasis and Ramadan's door stay in sight */
    '<details class="fold"><summary><span class="h2">المزيد: ورشة الخيال، ورفّ الكنوز</span></summary><section class="doors">'+
      '<button class="door" type="button" data-view="workshop" style="--ax:var(--plum)"><span class="door-t">ورشة الخيال</span><span class="door-d">تمارين كتابةٍ تحوّل ما ⟨تعلّمته|تعلّمتِه⟩ إلى صورٍ من خيالك.</span></button>'+
      '<button class="door" type="button" data-view="shelf" style="--ax:var(--teal)"><span class="door-t">رفّ الكنوز</span><span class="door-d">أغنيةٌ وقنواتٌ وكتبٌ تُكمل الرحلة، للوالدين والأطفال.</span></button>'+
    '</section></details>'+
    '<details class="fold"><summary><span class="h2">سلسلة العلماء</span></summary><section>'+
      '<p class="lead" style="margin:0 0 12px">من صاحب أول معجمٍ عربي إلى صاحب «لمسات بيانية»: كلٌّ منهم بنى على من سبقه. ⟨اضغط|اضغطي⟩ على اسم درسٍ ⟨لتفتحه|لتفتحيه⟩.</p>'+
      '<ol class="chain">'+SCH.map(schItem).join('')+'</ol></section></details>');
}
function doorBtn(act,c,ic,t,d){
  return '<button class="sdoor" type="button" data-act="'+act+'" style="--ax:var(--'+c+')"><span class="ch-ico">'+ICON[ic]+'</span><span class="door-t">'+t+'</span><span class="door-d">'+d+'</span></button>';
}
function worksSummary(mine){
  if(!mine.length) return 'كلّ ما ⟨تصنعه|تصنعينه⟩ يُحفظ هنا.';
  var a=mine.filter(function(w){return w.status==='approved';}).length;
  return n2a(mine.length)+' '+(mine.length===1?'عمل':(mine.length<=10?'أعمال':'عملًا'))+(a?'، منها '+n2a(a)+' معتمَد':'')+'.';
}
function magsSummary(){
  var n=FAM.mags.length;
  return n?(n2a(n)+' '+(n===1?'مجلة':(n===2?'مجلّتان':'مجلّات'))+' في العائلة.'):'«الباكورة» و«ضادُنا» و«مِداد» و«غيث».';
}
function weeklyNow(){var w=FAM.weekly[weekKey()];return w&&kidById(w.kid)&&workById(w.work)?w:null;}
