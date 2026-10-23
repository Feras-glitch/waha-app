/* ================= phase 2: «لغزٌ من صنعي» — a riddle gifted as a link ================= */
/* The riddle travels inside the link itself (after #), so nothing is uploaded anywhere.
   A friend who opens it plays it as a guest: no family profile is created or touched on their device. */
var RIDDLE_IDEAS=[
  ['لغز النقطة','ما الكلمة التي إذا وضعنا نقطةً على حرفها الأول صارت … ؟'],
  ['لغز الجذر','ما الجذر الذي تنبت منه هذه الكلمات: … و… و… ؟'],
  ['لغز التوأمين','ماءٌ ينزل من السماء بعد يأسٍ فيُحيي الأرض: أهو … أم … ؟'],
  ['لغز الوزن','كلمةٌ على وزن «فَعَلان» تدلّ على حركة … ، فما هي؟'],
  ['لغز الكلمة المسافرة','ما الكلمة العربية التي سافرت إلى الإنجليزية فصارت «…» ؟'],
  ['لغز الآية','في أيّ آيةٍ جاءت كلمة «…» بمعنى … ؟']
];
function riddleOpts(w){return [w.o1,w.o2].map(function(x){return String(x||'').trim();}).filter(Boolean);}
function b64url(str){return b64enc(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function b64urlDec(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return b64dec(s);}
function riddleURL(w,name,k){
  var o={v:1,t:titleOf(w),q:String(w.q||'').slice(0,600),a:String(w.ans||'').slice(0,120),o:riddleOpts(w).map(function(x){return x.slice(0,120);}),
    h:String(w.hint||'').slice(0,160),y:String(w.why||'').slice(0,400),n:String(name||'').slice(0,30),g:k&&k.g==='f'?'f':'m'};
  var b=b64url(JSON.stringify(o));
  return riddleBase()+'#r='+b+'.'+hashStr(b).toString(36);
}
/* the link must open for a friend: inside the Android or desktop app the page has no public address, so the published one is used */
var PUBLIC_KUNUZ='https://feras-glitch.github.io/waha-app/kunuz/index.html';
function riddleBase(){
  var h=location.hostname;
  if(!/^https?:$/.test(location.protocol)||h==='appassets.androidplatform.net') return PUBLIC_KUNUZ;
  return location.origin+location.pathname;
}
function parseRiddleHash(h){
  var m=/^r=([A-Za-z0-9_-]{8,6000})\.([a-z0-9]+)$/.exec(h||''); if(!m) return null;
  if(hashStr(m[1]).toString(36)!==m[2]) return {bad:1};
  var o; try{o=JSON.parse(b64urlDec(m[1]));}catch(e){return {bad:1};}
  if(!o||typeof o.q!=='string'||typeof o.a!=='string'||!o.q.trim()||!o.a.trim()) return {bad:1};
  return {t:String(o.t||'لغز').slice(0,60),q:o.q.slice(0,600),a:o.a.slice(0,120),o:Array.isArray(o.o)?o.o.filter(function(x){return typeof x==='string'&&x.trim();}).slice(0,3).map(function(x){return x.slice(0,120);}):[],
    h:String(o.h||'').slice(0,160),y:String(o.y||'').slice(0,400),n:String(o.n||'').slice(0,30),g:o.g==='f'?'f':'m'};
}

/* ---------- parent: gift the riddle ---------- */
async function exRiddle(){
  var w=workById(RV&&RV.id); if(!w||w.type!=='riddle') return; var k=kidById(w.kid);
  var c=await consent({kid:k,to:'الأصدقاء',link:1,what:['نصّ اللغز، وخياراته، وتلميحه، وحلّه','الاسم الذي تختارونه، وصيغة الخطاب (ولد أو بنت)']});
  if(!c) return;
  var url=riddleURL(w,c.name,k), text='لغزٌ لغويّ من '+c.name+': هل تستطيع حلّه؟';
  logShare(w,'رابط لغز',c.name); w.log[w.log.length-1].kind='riddle'; saveWorks();
  var go2=await ask({title:'رابط اللغز جاهز',c:'teal',ok:navigator.share?'أرسلوه':'انسخوا الرابط',cancel:'تمّ',
    html:'<p>يفتحه صديقكم فيحلّ اللغز في التطبيق، دون أن يُنشئ ملفًّا أو يرى شيئًا من بيانات عائلتكم.</p>'+
      '<input readonly dir="ltr" value="'+escA(url)+'" aria-label="رابط اللغز" onfocus="this.select()">'+
      '<div class="actions"><a class="btn ghost" href="https://wa.me/?text='+encodeURIComponent(text+'\n'+url)+'" target="_blank" rel="noopener">واتساب</a></div>'});
  if(go2){
    if(navigator.share){ try{await navigator.share({title:'لغزٌ من '+c.name,text:text,url:url});toast('أُرسل الرابط.');}catch(e){} }
    else { try{await navigator.clipboard.writeText(url);toast('نُسخ الرابط.');}catch(e){toast('انسخوا الرابط من المربّع.');} }
  }
  pWork(w.id);
}

/* ---------- guest player ---------- */
var GUEST=false, RZ=null;
function riddleGuest(R){
  GUEST=true; document.body.classList.add('guest');
  KID={id:'guest',name:'',g:'m'}; KD=null;
  RZ={r:R,ord:null,wrong:{},hint:false,done:false,revealed:false};
  if(!R||R.bad){
    go('<div class="ax-page narrow" style="--ax:var(--rose)"><header class="page-head center-head"><h1 class="h1">لم نستطع فتح اللغز</h1><p class="lead">يبدو أن الرابط ناقص. اطلبوا من صاحبه أن يرسله مرةً أخرى، وانسخوه كاملًا.</p></header>'+
      '<div class="actions center-actions"><a class="btn ghost" href="'+escA(location.pathname)+'">ما «كنوز البيان»؟</a></div></div>');
    return;
  }
  rzIntro();
}
function rzIntro(){
  var R=RZ.r;
  go('<div class="ax-page narrow rz" style="--ax:var(--teal)"><header class="page-head center-head"><span class="rz-seal" aria-hidden="true">'+STAR+'</span>'+
    '<span class="eyebrow">كنوز البيان</span><h1 class="h1">لغزٌ من '+(R.n?esc(R.n):'صديق')+'!</h1>'+
    '<p class="lead">'+Gx((R.n?esc(R.n):'صديقك')+' ⟨صنع|صنعت⟩ هذا اللغز اللغويّ ⟨وأهداه|وأهدته⟩ إليك. مَن سيحلّه؟',R.g==='f')+'</p></header>'+
    '<div class="form"><label for="rzName">اسمك (اختياري)</label><input id="rzName" maxlength="20" autocomplete="off"></div>'+
    '<div class="actions center-actions"><button class="btn" type="button" data-act="rzG" data-v="m">أنا ولد</button><button class="btn" type="button" data-act="rzG" data-v="f">أنا بنت</button></div>'+
    '<p class="muted small center">نسأل لنخاطبك بالصيغة الصحيحة فقط، ولا يُحفظ شيء.</p></div>');
}
/* telling the riddle's author sends the typed name out through WhatsApp: on a family's device (one of our children may be the one
   solving it) that is the parent's step, with the PIN and logged; on a friend's device nothing of ours is involved */
async function rzTell(){
  var R=RZ.r, url='https://wa.me/?text='+encodeURIComponent('حللتُ لغزك «'+R.t+'»! الجواب: «'+R.a+'»'+(KID.name?' — '+KID.name:''));
  if(FAM&&FAM.pin){
    var ok=await pinAsk({title:'رسالةٌ تخرج من الجهاز',c:'teal',ok:'أرسلوها',
      html:'<p>ستُفتح واتساب برسالةٍ إلى صاحب اللغز'+(KID.name?' فيها الاسم «'+esc(KID.name)+'»':'')+'. وبعد إرسالها لا تبقى في يدكم.</p>'});
    if(!ok) return;
    try{ logOut('رسالة واتساب إلى صاحب لغزٍ مُهدى'+(KID.name?' باسم '+KID.name:''),null); }catch(e){}
  }
  try{ window.open(url,'_blank','noopener'); }catch(e){}
}
function rzStart(g){
  var n=((document.getElementById('rzName')||{}).value||'').trim().slice(0,20);
  KID.g=g==='f'?'f':'m'; KID.name=n; rzView();
}
function rzView(){
  var R=RZ.r, f=R.g==='f';
  if(R.o.length&&!RZ.ord) RZ.ord=shuffle([R.a].concat(R.o));
  var opts=R.o.length?'<div class="opts" role="group" aria-label="الخيارات">'+RZ.ord.map(function(o,i){
      var cls='opt'+(RZ.done&&o===R.a?' right':'')+(RZ.wrong[i]?' wrong':'');
      return '<button class="'+cls+'" type="button" data-act="rzPick" data-v="'+i+'"'+(RZ.done||RZ.wrong[i]?' disabled':'')+'>'+esc(o)+'</button>';}).join('')+'</div>':'';
  var fb='';
  if(RZ.done) fb='<div class="fb-ok"><strong>'+praise()+'</strong> الجواب: «'+esc(R.a)+'».'+(R.y?'<p>'+esc(R.y)+'</p>':'')+'</div>'+
    '<div class="actions"><button class="btn" type="button" data-act="rzTell">⟨أخبر|أخبري⟩ '+Gx(R.n?esc(R.n):'⟨صاحب|صاحبة⟩ اللغز',f)+' ⟨بأنك|بأنكِ⟩ ⟨حللته|حللتِه⟩</button>'+
    '<a class="btn ghost" href="'+escA(location.pathname)+'">ما «كنوز البيان»؟</a></div>';
  else if(RZ.selfNo) fb='<div class="fb-no">لا بأس! اللغز الجيّد يُتعب العقل قليلًا، ⟨وقد عرفتَ|وقد عرفتِ⟩ الجواب الآن: «'+esc(R.a)+'».</div>'+(R.y?'<p>'+esc(R.y)+'</p>':'')+
    '<div class="actions"><a class="btn ghost" href="'+escA(location.pathname)+'">ما «كنوز البيان»؟</a></div>';
  else if(RZ.revealed) fb='<div class="fb-ok">الجواب: «<strong>'+esc(R.a)+'</strong>».'+(R.y?'<p>'+esc(R.y)+'</p>':'')+'</div>'+
    '<p class="q-count">هل ⟨أصبتَ|أصبتِ⟩؟</p><div class="actions"><button class="btn" type="button" data-act="rzSelf" data-v="1">نعم!</button><button class="btn ghost" type="button" data-act="rzSelf" data-v="0">ليس هذه المرة</button></div>';
  else if(Object.keys(RZ.wrong).length) fb='<div class="fb-no">ليست هذه. ⟨فكّر|فكّري⟩ مرةً أخرى'+(R.h&&!RZ.hint?'، أو ⟨استعن|استعيني⟩ بالتلميح':'')+'.</div>';
  go('<div class="ax-page narrow rz" style="--ax:var(--teal)"><header class="page-head"><span class="eyebrow">لغزٌ من '+(R.n?esc(R.n):'صديق')+'</span><h1 class="h1">'+esc(R.t)+'</h1></header>'+
    '<div class="rz-q">'+esc(R.q).replace(/\n/g,'<br>')+'</div>'+
    (RZ.hint&&R.h?'<p class="tip">💡 '+esc(R.h)+'</p>':'')+
    opts+
    (!R.o.length&&!RZ.revealed&&!RZ.done?'<p class="prompt">⟨فكّر|فكّري⟩ في الجواب، ثم ⟨اكشفه|اكشفيه⟩.</p><div class="actions"><button class="btn" type="button" data-act="rzReveal">⟨اكشف|اكشفي⟩ الحلّ</button></div>':'')+
    (R.h&&!RZ.hint&&!RZ.done&&!RZ.revealed?'<button class="link" type="button" data-act="rzHint">'+'⟨أرني|أريني⟩ التلميح'+'</button>':'')+
    '<div class="fb" aria-live="polite">'+fb+'</div></div>');
}
function rzPick(i){var R=RZ.r; if(RZ.done) return; if(RZ.ord[i]===R.a){RZ.done=true;} else RZ.wrong[i]=1; rzView();}
function rzSelf(v){ if(v){RZ.done=true;} else {RZ.selfNo=true;} rzView(); }
