/* ---------- progress ---------- */
var prog={};
function save(){kidSave();}
function doneCount(list){return (list||LESSONS).filter(function(l){return prog[l.id];}).length;}

/* ---------- speech ---------- */
var hasTTS='speechSynthesis' in window, arVoice=null, voicesReady=false;
function loadVoices(){try{var vs=speechSynthesis.getVoices();if(vs&&vs.length){voicesReady=true;arVoice=vs.filter(function(v){return /^ar/i.test(v.lang);})[0]||null;}}catch(e){}}
if(hasTTS){loadVoices();try{speechSynthesis.onvoiceschanged=loadVoices;}catch(e){}}
function stopSpeak(){if(typeof vStop==='function') vStop(); narStop();if(hasTTS){try{speechSynthesis.cancel();}catch(e){}}}
function speak(btn){
  if(!hasTTS||!L) return;
  try{
    if(speechSynthesis.speaking){speechSynthesis.cancel();btn.classList.remove('on');return;}
    var txt=L.secret.map(function(x){return typeof x==='string'?x:(x.rule||'');}).filter(Boolean).map(plain).join(' ');
    var u=new SpeechSynthesisUtterance(txt);
    u.lang='ar-SA'; if(arVoice) u.voice=arVoice; u.rate=.92;
    u.onend=u.onerror=function(){btn.classList.remove('on');};
    btn.classList.add('on'); speechSynthesis.speak(u);
    if(voicesReady&&!arVoice){var n=document.getElementById('speakNote'); if(n) n.hidden=false;}
  }catch(e){btn.classList.remove('on');}
}

/* ---------- rendering ---------- */
var view=document.getElementById('view'), tray=document.getElementById('tray');
function renderTray(){
  tray.innerHTML='<span class="tray-gems">'+LESSONS.map(function(l){
    return '<span class="tg'+(prog[l.id]?' on':'')+'" style="--ax:var(--'+axById[l.ax].c+'-band)" title="'+escA(plain(G(l.title)))+'">'+STAR+'</span>';
  }).join('')+'</span><span class="tray-n">'+n2a(doneCount())+' / '+n2a(LESSONS.length)+'</span>';
  tray.setAttribute('aria-label',G('⟨جمعتَ|جمعتِ⟩ ')+''+n2a(doneCount())+' من '+n2a(LESSONS.length)+' جوهرة');
}
function go(html){
  stopSpeak(); recAbort(); radioStop(); closeModal(); presentClose(); if(DR.dirty) drawSave();
  view.innerHTML=G(html);
  hydrate(view);
  renderKidChip();
  try{window.scrollTo(0,0);}catch(e){}
  var h=view.querySelector('h1');
  if(h){h.setAttribute('tabindex','-1');try{h.focus({preventScroll:true});}catch(e){}}
  renderTray();
}
/* the recitation of a verse: in the app, from the recitation pack it carries (../audio, the teaching voice of al-Husary), so
   nothing is fetched from a website; a file that leaves the app (magazine, card) links to quran.com instead.
   The Android app opens no website, so there a verse the pack lacks has no listening link at all. */
function vAud(v){var A=window.WAHA_AUDIO,r=A&&A.h&&A.h[v.s],b=v.a2||v.a,x; if(!r) return false;
  for(x=v.a;x<=b;x++){ if(!r.some(function(p){return x>=p[0]&&x<=p[1];})) return false; } return true;}
function verse(v,o){
  var out=!!(o&&o.out), link='<a href="https://quran.com/'+v.s+'/'+v.a+(v.a2?'-'+v.a2:'')+'" target="_blank" rel="noopener">⟨استمع|استمعي⟩ للتلاوة ↗</a>';
  return '<figure class="verse"><blockquote><span class="orn">﴿</span> '+fmt(v.t)+' <span class="orn">﴾</span></blockquote>'+
    '<figcaption><span>'+(v.p?'من ':'')+'سورة '+v.n+' · '+(v.a2?((v.a2-v.a===1?'الآيتان ':'الآيات ')+n2a(v.a)+'–'+n2a(v.a2)):'الآية '+n2a(v.a))+'</span>'+
    (v.nolink?'':(!out&&vAud(v)?'<button class="vplay" type="button" data-act="vplay" data-s="'+v.s+'" data-a="'+v.a+'" data-b="'+(v.a2||v.a)+'">▶ ⟨استمع|استمعي⟩ للتلاوة</button>':
      (out||!window.AndroidBridge?link:'')))+'</figcaption></figure>';
}
var VP={a:null,b:null,h:'',q:[],i:0,s:0};
function p3(n){return ('00'+n).slice(-3);}
function vStop(){ var a=VP.a; VP.a=null; if(a){a.onended=a.onerror=null; try{a.pause();}catch(e){}} if(VP.b){VP.b.classList.remove('on'); VP.b.innerHTML=VP.h;} VP.b=null; }
function vStep(){ var au=VP.a; if(!au) return; if(VP.i>=VP.q.length){ vStop(); return; }
  au.src='../audio/h/'+p3(VP.s)+p3(VP.q[VP.i])+'.mp3';
  au.onended=function(){ if(VP.a!==au) return; VP.i++; vStep(); };
  au.onerror=function(){ if(VP.a!==au) return; vStop(); toast('تعذّر تشغيل التلاوة على هذا الجهاز.'); };
  au.play().catch(function(){ if(VP.a===au) vStop(); }); }
function vPlay(btn){ var same=VP.b===btn; stopSpeak(); if(same) return;
  var a=+btn.dataset.a, b=+btn.dataset.b, x; VP.q=[]; for(x=a;x<=b;x++) VP.q.push(x);
  VP.s=+btn.dataset.s; VP.i=0; VP.b=btn; VP.h=btn.innerHTML; btn.classList.add('on'); btn.innerHTML=G('■ ⟨أوقف|أوقفي⟩ التلاوة'); VP.a=new Audio(); vStep(); }
function block(b){
  if(typeof b==='string') return '<p>'+fmt(b)+'</p>';
  if(b.v) return verse(b.v);
  if(b.rule) return '<div class="rule"><span class="eyebrow">'+(b.label||'القاعدة')+'</span><p>'+fmt(b.rule)+'</p></div>';
  if(b.cmp) return '<div class="cmp">'+b.cmp.map(function(c){return '<div class="cmp-card"><span class="cmp-w">'+fmt(c.w)+'</span><span class="cmp-n">'+c.n+'</span><span class="cmp-m">'+fmt(c.m)+'</span></div>';}).join('')+'</div>';
  if(b.chips) return '<div class="chips">'+b.chips.map(function(c){return '<div class="chip"><span class="chip-w">'+fmt(c.w)+'</span><span class="chip-m">'+c.m+'</span></div>';}).join('')+'</div>';
  if(b.roots) return rootsHTML();
  if(b.dots) return dotsHTML();
  return '';
}

/* home */
function chamberCard(a){
  var ls=LESSONS.filter(function(l){return l.ax===a.id;});
  return '<button class="chamber" type="button" data-ax="'+a.id+'" style="--ax:var(--'+a.c+')">'+
    (a.isNew?'<span class="ch-new">خزانةٌ جديدة</span>':'')+
    '<span class="ch-ico">'+ICON[a.icon]+'</span>'+
    '<span class="ch-name">'+a.name+'</span>'+
    '<span class="ch-q">'+a.q+'</span>'+
    '<span class="ch-gems">'+ls.map(function(l){return gem(!!prog[l.id]);}).join('')+
    '<span class="ch-count">'+n2a(doneCount(ls))+' / '+n2a(ls.length)+'</span></span></button>';
}
function schItem(s){
  var used=LESSONS.filter(function(l){return l.sch===s.id;});
  return '<li'+(s.id==='samarrai'?' class="now"':'')+'><span class="node">'+STAR+'</span><div>'+
    '<p class="li-when">'+s.when+' · '+s.place+'</p>'+
    '<p class="li-name">'+s.name+'</p>'+
    '<p class="li-book">'+s.book+'</p>'+
    '<p class="li-bio">'+s.bio+'</p>'+
    (used.length?'<p class="li-lessons">'+used.map(function(l){return '<button class="tag" type="button" data-open="'+l.id+'" style="--ax:var(--'+axById[l.ax].c+')">'+l.title+'</button>';}).join('')+'</p>':'')+
    '</div></li>';
}
function nextUndone(){
  for(var i=0;i<LESSONS.length;i++){if(!prog[LESSONS[i].id]) return LESSONS[i].id;}
  return LESSONS[0].id;
}

/* chamber */
function axis(id){
  L=null;
  var a=axById[id], ls=LESSONS.filter(function(l){return l.ax===id;});
  go('<div class="ax-page" style="--ax:var(--'+a.c+')">'+
    '<button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="ax-head"><span class="ch-ico big">'+ICON[a.icon]+'</span><div><h1 class="h1">'+a.name+'</h1><p class="lead">'+a.desc+'</p></div></header>'+
    '<ul class="lessons">'+ls.map(function(l){
      return '<li><button class="lesson-card" type="button" data-open="'+l.id+'">'+gem(!!prog[l.id])+
        '<span><span class="lc-title">'+l.title+'</span><span class="lc-teaser">'+fmt(l.teaser)+'</span></span>'+
        '<span class="lc-go">'+(prog[l.id]?'⟨أعِد|أعيدي⟩ الرحلة':'⟨ابدأ|ابدئي⟩')+'</span></button></li>';
    }).join('')+'</ul>'+
    '<div class="actions"><button class="btn" type="button" data-test="'+id+'">⟨اختبر|اختبري⟩ نفسك في هذه الخزانة</button></div>'+
    '<aside class="didyou"><span class="eyebrow">هل ⟨تعلم|تعلمين⟩؟</span><p>'+a.fact+'</p></aside>'+
    (a.poem?'<aside class="poem"><span class="eyebrow">بيتان للحفظ</span>'+a.poem.b.map(function(b){return '<p class="bayt"><span>'+b[0]+'</span><span>'+b[1]+'</span></p>';}).join('')+'<p class="credit">'+a.poem.c+'</p></aside>':'')+
  '</div>');
}

/* lesson */
var L=null, st=0, qi=0, miss=0, order=null, found={};
function shuffle(arr){for(var i=arr.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}
function openLesson(id){
  L=LESSONS.filter(function(x){return x.id===id;})[0]; if(!L) return home();
  st=0; qi=0; miss=0; order=null; found={}; foundDots={}; curDot=-1;
  lessonView();
}
function scholarMini(){
  var s=L.sch&&schById[L.sch]; if(!s) return '';
  return '<aside class="sch-mini"><span class="sm-gem">'+STAR+'</span><div><span class="eyebrow">صاحب الفائدة</span>'+
    '<p class="sm-name">'+s.name+' <span class="sm-when">'+s.when+'</span></p><p class="sm-bio">'+s.bio+'</p></div></aside>';
}
function lessonView(){
  var a=axById[L.ax], body='';
  var steps=['اللغز','السرّ','التحدّي','الجوهرة'];
  if(st===0){
    body='<p class="hook">'+fmt(L.hook)+'</p>'+L.verses.map(verse).join('')+
      '<p class="prompt">⟨تأمّل|تأمّلي⟩ الكلمات الملوّنة: ماذا ⟨لاحظتَ|لاحظتِ⟩؟ ⟨فكّر|فكّري⟩ قليلًا قبل أن ⟨تكشف|تكشفي⟩ السرّ.</p>'+
      '<div class="actions"><button class="btn" type="button" data-step="1">⟨اكشف|اكشفي⟩ السرّ</button></div>';
  } else if(st===1){
    body=speakBtnHTML(L.id)+
      '<div class="secret">'+L.secret.map(block).join('')+'</div>'+scholarMini()+
      '<details class="adult"><summary>المصدر وحاشية للكبار</summary><p><strong>المصدر:</strong> '+L.src+'</p>'+(L.adult?'<p>'+L.adult+'</p>':'')+'</details>'+
      '<div class="actions"><button class="btn" type="button" data-step="2">إلى التحدّي</button><button class="btn ghost" type="button" data-step="0">'+BACK+' إلى اللغز</button></div>';
  } else if(st===2){
    body=quizHTML();
  } else {
    body=rewardHTML();
  }
  go('<div class="lesson" style="--ax:var(--'+a.c+');--key:var(--'+a.k+')">'+
    '<button class="back" type="button" data-ax="'+a.id+'">'+BACK+' '+a.name+'</button>'+
    '<h1 class="h1">'+fmt(L.title)+'</h1>'+
    '<ol class="steps">'+steps.map(function(s,i){return '<li class="'+(i<st?'done':'')+(i===st?' cur':'')+'"'+(i===st?' aria-current="step"':'')+'>'+s+'</li>';}).join('')+'</ol>'+
    '<div class="stage">'+body+'</div></div>');
  if(st===1){ refreshRoots(); refreshDots(); }
}
function quizHTML(){
  var q=L.quiz[qi];
  if(!order) order=shuffle(q.o.map(function(t,i){return {t:t,ok:i===0};}));
  return '<p class="q-count">سؤال '+n2a(qi+1)+' من '+n2a(L.quiz.length)+'</p>'+
    '<h2 class="q">'+fmt(q.q)+'</h2>'+
    '<div class="opts" role="group" aria-label="الخيارات">'+order.map(function(o,i){return '<button class="opt" type="button" data-opt="'+i+'">'+fmt(o.t)+'</button>';}).join('')+'</div>'+
    '<div class="fb" id="fb" aria-live="polite"></div>';
}
function pick(i){
  var btns=[].slice.call(view.querySelectorAll('.opt')), o=order[i], fb=document.getElementById('fb');
  if(!btns[i]||btns[i].disabled) return;
  if(o.ok){
    btns.forEach(function(b,j){b.disabled=true; if(j===i) b.classList.add('right');});
    var last=qi===L.quiz.length-1;
    fb.innerHTML=G('<div class="fb-ok"><strong>'+praise()+'</strong> '+fmt(L.quiz[qi].why)+'</div>'+
      '<div class="actions"><button class="btn" type="button" data-next>'+(last?'⟨خذ|خذي⟩ جوهرتك':'السؤال التالي')+'</button></div>');
    var nb=fb.querySelector('button'); if(nb) nb.focus();
  } else {
    miss++; btns[i].classList.add('wrong'); btns[i].disabled=true;
    /* one review box for the whole app: a miss here comes back in the oasis daily trip */
    if(KD){ KD.qmiss=KD.qmiss||{}; KD.qmiss[L.id+'|'+qi]=Date.now(); save(); }
    fb.innerHTML=G('<div class="fb-no">ليست هذه. ⟨فكّر|فكّري⟩ مرةً أخرى، أو <button class="link" type="button" data-step="1">⟨ارجع|ارجعي⟩ إلى السرّ</button>.</div>');
  }
}
function nextQ(){
  if(qi<L.quiz.length-1){qi++;order=null;lessonView();return;}
  var before=prog[L.id];
  prog[L.id]={p:!!((before&&before.p)||miss===0),d:(before&&before.d)||Date.now()};
  save(); st=3; lessonView();
}
function rewardHTML(){
  var idx=LESSONS.indexOf(L), nx=LESSONS[idx+1], total=doneCount();
  return '<div class="reward"><span class="big-gem">'+STAR+'</span>'+
    '<h2 class="h2">جوهرةٌ جديدة في خزانتك!</h2>'+
    '<p>'+(miss===0?'⟨أجبتَ|أجبتِ⟩ بلا أي خطأ. ':'')+'صار عندك '+n2a(total)+' من '+n2a(LESSONS.length)+' جوهرة.</p>'+
    '<div class="takeaway"><span class="eyebrow">خلاصة الدرس</span><p>'+fmt(L.take)+'</p></div>'+
    rewardGarden()+certNote(certSync(KID.id))+
    '<div class="actions">'+(nx?'<button class="btn" type="button" data-open="'+nx.id+'">الدرس التالي: '+nx.title+'</button>':'<button class="btn" type="button" data-home>⟨أكملتَ|أكملتِ⟩ الخزائن كلها! ⟨عُد|عودي⟩ إلى البداية</button>')+
    '<button class="btn ghost" type="button" data-ax="'+L.ax+'">'+BACK+' '+axById[L.ax].name+'</button></div></div>';
}

/* roots widget */
var curPat=-1;
function rootsHTML(){
  return '<div class="roots" id="roots">'+
    '<div class="root-tiles" aria-label="الجذر: ع ل م"><span>ع</span><span>ل</span><span>م</span></div>'+
    '<p class="center muted">⟨اضغط|اضغطي⟩ على وزنٍ ⟨لتصبّ|لتصبّي⟩ فيه الجذر:</p>'+
    '<div class="patterns">'+ROOTS.map(function(r,i){return '<button class="pat" type="button" data-pat="'+i+'">'+r.p+'</button>';}).join('')+'</div>'+
    '<div class="root-out" id="rootOut" aria-live="polite"><span class="muted">⟨اختر|اختاري⟩ وزنًا ⟨لترى|لتري⟩ الكلمة تنبت…</span></div>'+
    '<p class="root-count" id="rootCount"></p></div>';
}
function showPat(i){found[i]=1;curPat=i;refreshRoots();}
function refreshRoots(){
  var out=document.getElementById('rootOut'); if(!out) return;
  [].slice.call(document.querySelectorAll('.pat')).forEach(function(b,j){b.classList.toggle('on',!!found[j]);b.classList.toggle('cur',j===curPat);});
  if(curPat>=0&&found[curPat]){
    var r=ROOTS[curPat];
    out.innerHTML='<span class="rw">'+r.w.map(function(x){return x[1]?'<span class="rl">'+x[0]+'</span>':'<span>'+x[0]+'</span>';}).join('')+'</span>'+
      '<span class="rp">على وزن '+r.p+'</span><span class="rm">'+r.m+'</span>';
  }
  var n=Object.keys(found).length;
  document.getElementById('rootCount').textContent=G(n?('⟨اكتشفتَ|اكتشفتِ⟩ '+n2a(n)+' من '+n2a(ROOTS.length)+' كلمات من الجذر نفسه'+(n===ROOTS.length?'. شجرةٌ كاملة!':'')):'');
}

/* dotless-script widget */
var foundDots={}, curDot=-1;
function dotsHTML(){
  return '<div class="roots">'+
    '<p class="rasm" aria-label="صورة كلمةٍ بلا نقاط">ٮٮٮ</p>'+
    '<p class="center muted">⟨ضع|ضعي⟩ النقاط في أماكن مختلفة… أيّ كلمةٍ تولد؟ ⟨اضغط لتكتشف|اضغطي لتكتشفي⟩:</p>'+
    '<div class="patterns">'+RASM.map(function(r,i){return '<button class="pat" type="button" data-dot="'+i+'">الكلمة '+n2a(i+1)+'</button>';}).join('')+'</div>'+
    '<div class="root-out" id="dotOut" aria-live="polite"><span class="muted">الصورة نفسها، وأربع كلمات مختلفة…</span></div>'+
    '<p class="root-count" id="dotCount"></p></div>';
}
function showDot(i){foundDots[i]=1;curDot=i;refreshDots();}
function refreshDots(){
  var out=document.getElementById('dotOut'); if(!out) return;
  [].slice.call(document.querySelectorAll('[data-dot]')).forEach(function(b,j){b.classList.toggle('on',!!foundDots[j]);b.classList.toggle('cur',j===curDot);if(foundDots[j]) b.textContent=RASM[j].w;});
  if(curDot>=0){var r=RASM[curDot]; out.innerHTML='<span class="dw">'+r.w+'</span><span class="rm">'+r.m+'</span>';}
  var n=Object.keys(foundDots).length;
  document.getElementById('dotCount').textContent=G(n?('⟨اكتشفتَ|اكتشفتِ⟩ '+n2a(n)+' من '+n2a(RASM.length)+(n===RASM.length?'. ⟨أرأيتَ|أرأيتِ⟩ كم تصنع النقطة؟':'')):'');
}

/* imagination workshop */
function workshop(){
  L=null;
  go('<div class="ax-page" style="--ax:var(--plum)">'+
    '<button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">ورشة الخيال</h1>'+
      '<p class="lead">الكلمات تصنع الصور، والصور تصنع الخيال. ⟨اختر تمرينًا واكتب|اختاري تمرينًا واكتبي⟩، فلا جواب خاطئًا هنا. ما ⟨تكتبه|تكتبينه⟩ يُحفظ على هذا الجهاز.</p>'+
      '<p class="credit">هذه الورشة مستلهمةٌ من دعوة عبد الرحمن شردوب إلى صناعة خيال الطفل العربي.</p></header>'+
    '<div class="prompts">'+PROMPTS.map(function(p){
      var l=LESSONS.filter(function(x){return x.id===p.l;})[0], saved='';
      saved=(KD&&KD.w&&KD.w[p.id])||'';
      return '<section class="prompt-card"><h2>'+p.t+'</h2><p>'+fmt(p.p)+'</p>'+
        '<label class="sr" for="'+p.id+'">⟨اكتب|اكتبي⟩ هنا: '+p.t+'</label>'+
        '<textarea id="'+p.id+'" data-w="'+p.id+'" placeholder="⟨اكتب|اكتبي⟩ هنا…">'+esc(saved)+'</textarea>'+
        '<div class="pc-foot">'+(l?'<button class="tag" type="button" data-open="'+l.id+'" style="--ax:var(--'+axById[l.ax].c+')">من درس: '+l.title+'</button>':'')+
        '<p class="saved" id="s-'+p.id+'">'+(saved?'محفوظةٌ على هذا الجهاز.':'')+'</p></div></section>';
    }).join('')+'</div></div>');
}

/* resource shelf */
function shelf(){
  L=null;
  go('<div class="ax-page" style="--ax:var(--teal)">'+
    '<button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">رفّ الكنوز</h1>'+
      '<p class="lead">للوالدين: مصادر تُكمل هذه الخزانة. الروابط تفتح خارج التطبيق، ويحسُن أن تشاهدوها أولًا، ثم تختاروا لأطفالكم ما يناسب أعمارهم.</p></header>'+
    '<ul class="shelf">'+SHELF.map(function(r){
      return '<li class="res" style="--ax:var(--'+r.c+')"><div class="res-top"><span class="res-name">'+r.name+'</span><span class="res-kind">'+r.kind+'</span></div>'+
        '<p>'+r.d+'</p>'+(r.note?'<p class="res-note">'+r.note+'</p>':'')+
        (r.links.length?'<div class="res-links">'+r.links.map(function(k){return '<a href="'+k[1]+'" target="_blank" rel="noopener">'+k[0]+' ↗</a>';}).join('')+'</div>':'')+
      '</li>';
    }).join('')+'</ul></div>');
}

/* ================= practice & assessment ================= */
var lessonById={}; LESSONS.forEach(function(l){lessonById[l.id]=l;});

/* new items on examples and verses not used in the lessons */
var EXTRA=[
 /* لمسات بيانية */
 {id:'x-sadd-1',l:'sadd',k:'two',q:'«فَمَا اسْطَاعُوا أَنْ يَظْهَرُوهُ وَمَا اسْتَطَاعُوا لَهُ نَقْبًا»: أيّ العملين كان أصعب؟',o:['النَّقْب','الصعود فوق السدّ'],
  q2:'وما الدليل من لفظ الآية؟',o2:['جاءت مع النَّقْب الكلمةُ الأطول «اسْتَطَاعُوا»','لأن النَّقْب ذُكر في آخر الآية','لأن الصعود لا يحتاج إلى جهد'],why:'زيادة المبنى تدلّ على زيادة المعنى: الكلمة الأطول مع العمل الأشقّ.'},
 {id:'x-sadd-2',l:'sadd',k:'mcq',q:'على قاعدة «زيادة المبنى تدلّ على زيادة المعنى»، أيّ الكلمتين تدلّ على قدرةٍ أكبر؟',o:['اقْتَدَرَ','قَدَرَ'],why:'زادت حروف «اقتدر»، فقوي معناها.'},
 {id:'x-rizq-1',l:'rizq',k:'two',q:'في سورة الأنعام: «مِنْ إِمْلَاقٍ نَحْنُ نَرْزُقُكُمْ وَإِيَّاهُمْ». بمن بدأ ذكر الرزق؟',o:['بالآباء','بالأولاد'],
  q2:'لماذا؟',o2:['لأن الفقر واقعٌ بالآباء الآن، فهم المشغولون به','لأن الآباء أكبر سنًّا','لأن الأولاد لا يحتاجون إلى رزق'],why:'«مِنْ إِمْلَاقٍ»: الفقر حاصل، فطمأن الآباء على رزقهم أولًا.'},
 {id:'x-rizq-2',l:'rizq',k:'mcq',q:'كلمة «خَشْيَة» في «خَشْيَةَ إِمْلَاقٍ» تدلّ على:',o:['خوفٍ من شيءٍ لم يقع بعد','شيءٍ وقع فعلًا','فرحٍ بالغنى'],why:'الخشية خوفٌ مما يُتوقّع.'},
 {id:'x-shayb-1',l:'shayb',k:'mcq',q:'أيّ العبارتين أقوى في الدلالة على أن البيت كلَّه امتلأ نورًا؟',o:['أضاء البيتُ نورًا','أضاء نورُ البيت'],why:'كما جُعل الرأس كلُّه مشتعلًا، جُعل البيت كلُّه مضيئًا.'},
 {id:'x-shayb-2',l:'shayb',k:'mcq',q:'ما اسم نظرية عبد القاهر الجرجاني في جمال ترتيب الكلام؟',o:['النَّظْم','العَروض','الإملاء'],why:'«النَّظْم»: جمال الكلام في ترتيب كلماته وتعلّق بعضها ببعض.'},
 {id:'x-duha-1',l:'duha',k:'verse',v:{t:'أَلَمْ يَجِدْكَ يَتِيمًا {فَآوَى}',n:'الضحى',s:93,a:6},q:'ما المحذوف في «فَآوَى»؟',o:['الكاف: فآواك','الفاعل','لا شيء محذوف'],why:'حُذفت الكاف كما حُذفت في «وَمَا قَلَى»، فتناسقت نهايات الآيات.'},
 {id:'x-lam-m',ax:'lamasat',k:'match',q:'⟨صِل|صِلي⟩ كلَّ عبارةٍ بسرّها:',pairs:[['اسْطَاعُوا','الصعود: العمل الأخفّ'],['اسْتَطَاعُوا','النَّقْب: العمل الأثقل'],['وَاشْتَعَلَ الرَّأْسُ شَيْبًا','الشيب عمّ الرأس كلّه'],['وَمَا قَلَى','حذفٌ فيه لطفٌ وإكرام']],why:'لكلّ لمسةٍ سرٌّ في اختيار اللفظ.'},
 /* كلمات توائم */
 {id:'x-ghayth-1',l:'ghayth',k:'verse',v:{t:'إِنَّ اللَّهَ عِنْدَهُ عِلْمُ السَّاعَةِ وَيُنَزِّلُ ـــــ',n:'لقمان',s:31,a:34,p:1},q:'أيّ الكلمتين في الآية؟',o:['الْغَيْثَ','الْمَطَرَ'],why:'الغيث رحمةٌ ينزلها الله، فجاء في مقام النعمة.'},
 {id:'x-ghayth-2',l:'ghayth',k:'verse',v:{t:'وَأَمْطَرْنَا عَلَيْهِمْ ـــــ فَانْظُرْ كَيْفَ كَانَ عَاقِبَةُ الْمُجْرِمِينَ',n:'الأعراف',s:7,a:84},q:'أيّ الكلمتين في الآية؟',o:['مَطَرًا','غَيْثًا'],why:'حجارةٌ أُمطرت على قوم لوط عذابًا، فجاء لفظ المطر.'},
 {id:'x-rih-1',l:'rih',k:'verse',v:{t:'وَمِنْ آيَاتِهِ أَنْ يُرْسِلَ ـــــ مُبَشِّرَاتٍ',n:'الروم',s:30,a:46,p:1},q:'أيّ الكلمتين في الآية؟',o:['الرِّيَاحَ','الرِّيحَ'],why:'مبشّراتٌ بالماء والخير: رحمة، فجاءت بالجمع.'},
 {id:'x-rih-2',l:'rih',k:'verse',v:{t:'وَفِي عَادٍ إِذْ أَرْسَلْنَا عَلَيْهِمُ ـــــ الْعَقِيمَ',n:'الذاريات',s:51,a:41},q:'أيّ الكلمتين في الآية؟',o:['الرِّيحَ','الرِّيَاحَ'],why:'ريح عذابٍ عقيم لا خير فيها، فجاءت مفردة.'},
 {id:'x-sana-1',l:'sana',k:'verse',v:{t:'وَلَقَدْ أَخَذْنَا آلَ فِرْعَوْنَ ـــــ وَنَقْصٍ مِنَ الثَّمَرَاتِ',n:'الأعراف',s:7,a:130,p:1},q:'أيّ الكلمتين في الآية؟',o:['بِالسِّنِينَ','بِالْأَعْوَامِ'],why:'سنين الجدب والشدّة، فجاء لفظ «السنين».'},
 {id:'x-sana-2',l:'sana',k:'mcq',q:'«فَلَبِثَ فِيهِمْ أَلْفَ سَنَةٍ إِلَّا خَمْسِينَ عَامًا»: لماذا جاءت الخمسون بلفظ «عام» على ما ذكره السهيلي؟',o:['لأنها زمن الفرج والراحة','لأن العام أطول من السنة','لأن العدد صغير'],why:'السنة للشدّة غالبًا، والعام للرخاء والفرج.'},
 {id:'x-qasam-1',l:'qasam',k:'verse',v:{t:'ـــــ عَلَى الْكَذِبِ وَهُمْ يَعْلَمُونَ',n:'المجادلة',s:58,a:14,p:1},q:'أيّ الكلمتين في الآية؟',o:['وَيَحْلِفُونَ','وَيُقْسِمُونَ'],why:'يمينٌ على الكذب، فجاء لفظ «الحلف» كما لاحظت بنت الشاطئ.'},
 {id:'x-qasam-2',l:'qasam',k:'mcq',q:'كيف وصلت بنت الشاطئ إلى الفرق بين الحلف والقسم؟',o:['تتبّعت كلّ مواضع الكلمتين في القرآن','سألت الناس في السوق','اعتمدت على معنًى واحد في معجم'],why:'هذا هو الاستقراء: جمع المواضع كلها ثم الحكم.'},
 {id:'x-fur-m',ax:'furuq',k:'match',q:'⟨صِل|صِلي⟩ كلَّ كلمةٍ باستعمالها الغالب في القرآن:',pairs:[['الْغَيْث','ماءٌ نافع بعد يأس'],['الرِّيَاح','رحمةٌ تسوق السحاب'],['الْعَام','الرخاء والفرج'],['الْحَلِف','يمينٌ كاذبة']],why:'لكلّ كلمةٍ مكانها الذي لا تصلح فيه أختها.'},
 /* معاني النحو */
 {id:'x-iyyaka-1',l:'iyyaka',k:'verse',v:{t:'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ {عَلَيْهِ تَوَكَّلْتُ} وَإِلَيْهِ أُنِيبُ',n:'هود',s:11,a:88,p:1},q:'ماذا أفاد تقديم «عَلَيْهِ» على «تَوَكَّلْتُ»؟',o:['أن التوكّل على الله وحده','أن الجملة أجمل صوتًا فقط','لا فائدة له'],why:'تقديم ما حقّه التأخير يفيد الاختصاص، كما في «إِيَّاكَ نَعْبُدُ».'},
 {id:'x-iyyaka-2',l:'iyyaka',k:'mcq',q:'أيّ الجملتين تعني: لا أطلب العون إلا من الله؟',o:['باللهِ أستعين','أستعينُ بالله'],why:'تقديم «بالله» يفيد الاختصاص.'},
 {id:'x-salam-1',l:'salam',k:'two',q:'أيّ الجملتين تصف صفةً ثابتة دائمة؟',o:['أخي كريمٌ','أخي يُكرم ضيفه الليلة'],q2:'لماذا؟',o2:['لأن الجملة الاسمية تدلّ على الثبوت','لأنها أقصر','لأن فيها كلمة «أخي»'],why:'الاسم يدلّ على الثبوت، والفعل على التجدّد والحدوث.'},
 {id:'x-salam-2',l:'salam',k:'mcq',q:'لماذا كان ردّ إبراهيم «سَلَامٌ» أحسن من «سَلَامًا»؟',o:['لأنه جملةٌ اسمية تدلّ على الدوام','لأنه كلمةٌ أطول','لأنه قاله بصوتٍ أعلى'],why:'سلامٌ ثابتٌ دائم، فهو تحيّةٌ بأحسن منها.'},
 {id:'x-kalb-1',l:'kalb',k:'mcq',q:'⟨تصف|تصفين⟩ صورةً لبحيرةٍ هادئة لا يتحرّك ماؤها. أيّ العبارتين أدقّ؟',o:['الماءُ ساكنٌ','الماءُ يسكن'],why:'الاسم «ساكن» يصف هيئةً ثابتة، كما في «بَاسِطٌ ذِرَاعَيْهِ».'},
 {id:'x-waw-1',l:'waw',k:'mcq',q:'في سورة الزمر، أيّ الآيتين جاء فيها «فُتِحَتْ» بلا واو؟',o:['آية أهل النار','آية أهل الجنة'],why:'مع أهل النار «فُتِحَتْ» بلا واو: الأبواب تُفتح فجأةً عند وصولهم.'},
 {id:'x-nahw-m',ax:'nahw',k:'match',q:'⟨صِل|صِلي⟩ كلَّ عبارةٍ بمعناها النحوي:',pairs:[['إِيَّاكَ نَعْبُدُ','التقديم يفيد الاختصاص'],['قَالَ سَلَامٌ','الاسم يدلّ على الثبوت'],['بَاسِطٌ ذِرَاعَيْهِ','هيئةٌ ثابتة بلا حركة'],['وَفُتِحَتْ أَبْوَابُهَا','أبوابٌ مفتوحةٌ قبل الوصول']],why:'النحو معانٍ، لا قواعد جامدة.'},
 /* أسرار العربية */
 {id:'x-jathr-1',l:'jathr',k:'type',q:'⟨اكتب|اكتبي⟩ جذر كلمة «مَكْتَبَة» بثلاثة أحرف (مثل: ع ل م):',ans:['كتب'],show:'ك ت ب',why:'المكتبة مكان الكتب، من «كَتَبَ».'},
 {id:'x-jathr-2',l:'jathr',k:'type',q:'⟨اكتب|اكتبي⟩ جذر كلمة «مُسْتَشْفَى» بثلاثة أحرف:',ans:['شفي'],show:'ش ف ي',why:'من «شَفَى يَشْفِي»: الميم والسين والتاء زوائد.'},
 {id:'x-jathr-3',l:'jathr',k:'mcq',q:'ما جذر كلمة «اسْتِخْرَاج»؟',o:['خ ر ج','س ت خ','ا س ت'],why:'من «خَرَجَ»: الألف والسين والتاء زوائد.'},
 {id:'x-sawt-1',l:'sawt',k:'mcq',q:'وصف القرآن ريح عادٍ بأنها «صَرْصَر». تكرار «صَرْ… صَرْ» يوحي بـ:',o:['صوتٍ شديدٍ يتكرّر','سكونٍ وهدوء','ماءٍ ينساب'],why:'لاحظ ابن جني أن تكرار المقطع يحكي تكرار الصوت.'},
 {id:'x-sawt-2',l:'sawt',k:'mcq',q:'أيّ الكلمتين تناسب أكل الخيار الطريّ؟',o:['الخَضْم','القَضْم'],why:'الخاء الرخوة للرطب الليّن.'},
 {id:'x-quwwa-1',l:'quwwa',k:'mcq',q:'أيّ الجملتين تدلّ على خُضرةٍ أشدّ؟',o:['اخْضَوْضَرَتِ الأرض','اخْضَرَّتِ الأرض'],why:'«اخضوضر» فيها تكرارٌ وزيادة، فمعناها أقوى.'},
 {id:'x-falan-1',l:'falan',k:'mcq',q:'ثار البركان، فحدث ـــــ',o:['الثَّوَرَان','الثَّوْر','الثَّائِر'],why:'«الثَّوَرَان» على وزن فَعَلان: حركةٌ واضطراب. أما الثَّوْر فحيوان!'},
 {id:'x-asr-m',ax:'asrar',k:'match',q:'⟨صِل|صِلي⟩ كلَّ كلمةٍ بما يناسبها:',pairs:[['القَضْم','أكل اليابس الصُّلب'],['اعْشَوْشَبَ','كثُر العشب كثرةً كبيرة'],['الدَّوَرَان','حركةٌ متتابعة'],['مُعَلِّم','من الجذر: ع ل م']],why:'أصواتٌ وأوزانٌ وجذورٌ تصنع المعنى.'},
 /* اللغة العالية */
 {id:'x-insha-1',l:'insha',k:'mcq',q:'⟨أكمل|أكملي⟩ بالكتابة الصحيحة: «سأنجح في الامتحان ـــــ»',o:['إن شاء الله','إنشاء الله'],why:'«إن شاء الله»: إذا أراد الله. أما «إنشاء» فمعناها الخلق.'},
 {id:'x-harf-1',l:'harf',k:'verse',v:{t:'وُجُوهٌ يَوْمَئِذٍ ـــــ ۝ إِلَى رَبِّهَا نَاظِرَةٌ',n:'القيامة',s:75,a:22,a2:23},q:'الكلمة الناقصة معناها: مشرقةٌ حسنة. أيّهما هي؟',o:['نَاضِرَةٌ','نَاظِرَةٌ'],why:'«نَاضِرَة» بالضاد: مشرقة، و«نَاظِرَة» بالظاء: تنظر. حرفٌ واحد غيّر المعنى!'},
 {id:'x-harf-2',l:'harf',k:'mcq',q:'قال سامي: «في الحديقة سَمَرٌ كثير». ماذا يقصد على الأرجح؟',o:['ثَمَر','حديث الليل','سَمَك'],why:'نطق الثاء سينًا كما في لهجة البيت، وفي الفصحى: ثَمَر.'},
 {id:'x-taa-1',l:'taa',k:'mcq',q:'⟨أكمل|أكملي⟩ بالكتابة الصحيحة: «في حديقتنا ـــــ كبيرة»',o:['شجرة','شجره'],why:'شجرتي: ظهرت التاء، فهي تاءٌ مربوطة.'},
 {id:'x-safar-1',l:'safar',k:'mcq',q:'كلمة safari أصلها العربي:',o:['سَفَر','صَفْرَاء','صَافِرَة'],why:'من «السَّفَر»، عبر السواحيلية إلى الإنجليزية.'},
 {id:'x-safar-2',l:'safar',k:'mcq',q:'كلمة sofa (الأريكة) أصلها العربي:',o:['صُفَّة','صُوف','صَفّ'],why:'من «الصُّفّة»، عبر التركية.'},
 {id:'x-rasm-1',l:'rasm',k:'mcq',q:'أيّ كلمةٍ لها صورة «حمل» نفسها بلا نقاط؟',o:['جَمَل','قَمَر','سَهْل'],why:'ح ج خ صورتها واحدة بلا نقاط: حمل وجمل.'},
 {id:'x-ali-m',ax:'aliya',k:'match',q:'⟨صِل|صِلي⟩ كلَّ كلمةٍ بمعناها:',pairs:[['إِنْشَاء','خَلْقٌ وإيجاد'],['ظَلَّ','بقي'],['ضَلَّ','تاه'],['دار الصناعة','ترسانة']],why:'الإملاء والنطق الصحيحان يحفظان المعنى.'},
 /* تأمَّلْ وصحِّحْ */
 {id:'x-adab-1',l:'adab',k:'mcq',q:'قال الخضر عن خرق السفينة: «فَأَرَدْتُ أَنْ أَعِيبَهَا»، وعن كنز اليتيمين: «فَأَرَادَ رَبُّكَ». لماذا نسب العيب إلى نفسه؟',o:['تأدّبًا مع الله، كما فعل إبراهيم','لأنه نسي','لأن الفعلين متساويان'],why:'نسب الخير إلى الله صريحًا، ونسب ما ظاهره عيبٌ إلى نفسه.'},
 {id:'x-sukhri-1',l:'sukhri',k:'mcq',q:'قال المعلّم: «لا تتّخذوا زملاءكم ـــــ»، يقصد: لا تستهزئوا بهم.',o:['سِخْرِيًّا','سُخْرِيًّا'],why:'الاستهزاء بكسر السين: سِخريًّا.'},
 {id:'x-ruya-1',l:'ruya',k:'mcq',q:'⟨استيقظتَ فزعًا مما رأيتَ|استيقظتِ فزعةً مما رأيتِ⟩ في نومك. ماذا يُسمّى؟',o:['حُلُم','رؤيا'],why:'ما يراه النائم مما يكره حُلُم، ⟨فاستعذ بالله ولا تحدّث|فاستعيذي بالله ولا تحدّثي⟩ به.'},
 {id:'x-awail-1',l:'awail',k:'mcq',q:'طاولةٌ فارغة لا طعام عليها، ماذا تُسمّى؟',o:['خِوان','مائدة','كأس'],why:'لا تُسمّى مائدةً إلا إذا كان عليها طعام.'},
 {id:'x-awail-2',l:'awail',k:'mcq',q:'ما «الغَسَق»؟',o:['أول ظلمة الليل','أول النهار','أول المطر'],why:'الصبح أول النهار، والغسق أول الليل.'},
 {id:'x-f3-1',l:'furuq3',k:'mcq',q:'جلس الحكيم لا يتكلّم، لأن المقام يقتضي الحكمة. هو:',o:['صامت','ساكت'],why:'يوصف الحكيم بالصامت.'},
 {id:'x-qul-1',l:'qul',k:'mcq',q:'⟨أكمل|أكملي⟩ بالأفصح: «اتّصلتُ ـــــ»',o:['بصديقي','على صديقي'],why:'«اتّصل» يتعدّى بالباء.'},
 /* أسماءٌ وأوزان */
 {id:'x-rahman-1',l:'rahman',k:'mcq',q:'أيّ الكلمات على وزن «فَعْلان» الذي يدلّ على الامتلاء؟',o:['عَطْشَان','كَرِيم','كَاتِب'],why:'عطشان: ممتلئٌ عطشًا، على وزن فَعْلان كالرحمن.'},
 {id:'x-rahman-2',l:'rahman',k:'mcq',q:'أيّ الاسمين لا يُسمّى به أحدٌ إلا الله؟',o:['الرَّحْمَن','الرَّحِيم'],why:'قال الغزالي: «الرحمن أخصّ من الرحيم، ولذلك لا يُسمّى به غير الله». أما «رحيم» فوُصف به النبيّ ﷺ: «بِالْمُؤْمِنِينَ رَءُوفٌ رَحِيمٌ».'},
 {id:'x-ghafur-1',l:'ghafur',k:'mcq',q:'الخبّاز يخبز كلّ يوم، والنجّار ينجر مرّةً بعد مرّة. فوزن «فَعّال» في «غَفّار» يدلّ على:',o:['التكرار: يغفر مرّةً بعد مرّة','المرّة الواحدة','القلّة'],why:'فَعّال وزن التكرار والكثرة.'},
 {id:'x-ghafur-2',l:'ghafur',k:'verse',v:{t:'{غَافِرِ} الذَّنْبِ وَقَابِلِ التَّوْبِ',n:'غافر',s:40,a:3,p:1},q:'سُمّيت السورة بهذا الاسم. على أيّ وزنٍ «غَافِر»؟',o:['فاعِل','فَعُول','فَعّال'],why:'«غافر» اسم فاعل، يدلّ على أصل المغفرة كما قال الغزالي.'},
 {id:'x-allam-1',l:'allam',k:'verse',v:{t:'قُلْ إِنَّ رَبِّي يَقْذِفُ بِالْحَقِّ ـــــ الْغُيُوبِ',n:'سبأ',s:34,a:48},q:'أيّ الكلمتين في الآية؟',o:['عَلَّامُ','عَالِمُ'],why:'مع الجمع «الغيوب» تأتي صيغة الكثرة «علّام».'},
 {id:'x-shakur-1',l:'shakur',k:'mcq',q:'⟨ساعدتَ|ساعدتِ⟩ جارًا مسنًّا في حمل كيسٍ صغير. ماذا يعني أن الله «شكور»؟',o:['أنه يجزي على هذا العمل الصغير ثوابًا كبيرًا','أن العمل الصغير لا يُحسب','أن الثواب على قدر حجم الكيس'],why:'الشكور «يجازي بيسير الطاعات كثير الدرجات».'},
 {id:'x-samii-1',l:'samii',k:'verse',v:{t:'إِنَّ اللَّهَ كَانَ ـــــ',n:'النساء',s:4,a:58,p:1},q:'أيّ الترتيبين في الآية؟',o:['سَمِيعًا بَصِيرًا','بَصِيرًا سَمِيعًا'],why:'إذا اجتمعا اسمين لله جاء السمع أولًا.'},
 {id:'x-asma-m',ax:'asma',k:'match',q:'⟨صِل|صِلي⟩ كلَّ اسمٍ بمعنى وزنه:',pairs:[['الرَّحْمَن','فَعْلان: امتلاءٌ وفيض'],['الرَّحِيم','فَعِيل: ثبوتٌ ودوام'],['الغَفَّار','فَعّال: مرّةً بعد مرّة'],['عَلَّامُ الْغُيُوبِ','صيغة كثرةٍ مع جمع']],why:'لكلّ وزنٍ معنًى يضيفه إلى الاسم.'},
 {id:'x-tam-m',ax:'taammal',k:'match',q:'⟨صِل|صِلي⟩ كلَّ كلمةٍ بمعناها:',pairs:[['البَاكُورَة','أول الفاكهة'],['الكُوز','إناءٌ له عُروة'],['البَثّ','همٌّ شديدٌ يفيض'],['سُخْرِيًّا','يخدم بعضهم بعضًا']],why:'دقّة الأسماء تصنع دقّة التفكير.'}
];

var BANK=[];
LESSONS.forEach(function(l){l.quiz.forEach(function(q,i){BANK.push({id:'q-'+l.id+'-'+i,l:l.id,k:'mcq',q:q.q,o:q.o,why:q.why,lq:1});});});
EXTRA.forEach(function(x){BANK.push(x);});
var bankById={};
BANK.forEach(function(b){if(!b.ax&&b.l) b.ax=lessonById[b.l].ax; bankById[b.id]=b;});

/* ---------- records (per device) ---------- */
function freshST(){return {items:{},tests:[],daily:{last:'',days:[],wk:0}};}
var ST=freshST();
function saveST(){kidSave();}
function pad(n){return ('0'+n).slice(-2);}
function dstr(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function today(){return dstr(new Date());}
function addDays(s,n){var p=s.split('-');return dstr(new Date(+p[0],+p[1]-1,+p[2]+n));}
/* the week runs from Saturday to Friday. Four days of «جوهرة اليوم» fill it, chosen as the child likes; a missed day takes nothing away */
var WEEK_GOAL=4;
function weekOf(s){var p=s.split('-');return addDays(s,-((new Date(+p[0],+p[1]-1,+p[2]).getDay()+1)%7));}
function weekDaysN(D,s){var w=weekOf(s||today());return ((D&&D.days)||[]).filter(function(x){return weekOf(x)===w;}).length;}
function weekLine(n){return n>=WEEK_GOAL?'⟨أتممتَ|أتممتِ⟩ أسبوعك ✓':'هذا الأسبوع: '+n2a(n)+' من '+n2a(WEEK_GOAL)+' أيام';}
var GAPS=[1,2,4,7,14];
function record(id,sc){
  var r=ST.items[id]||{n:0,c:0,w:0,box:0,due:'',last:0};
  r.n++; r.last=sc;
  if(sc>=1){r.c++; r.box=Math.min((r.box||0)+1,5);} else {r.w++; r.box=1;}
  r.due=addDays(today(),GAPS[r.box-1]);
  ST.items[id]=r; saveST();
}
function dueList(){var t=today();return BANK.filter(function(b){var r=ST.items[b.id];return r&&r.w>0&&r.box<5&&r.due<=t;});}
function norm(s){return String(s||'').replace(/[ً-ْٰـ]/g,'').replace(/[\s،,.\-]/g,'').replace(/ى/g,'ي').replace(/[أإآ]/g,'ا');}
function hashStr(s){var h=0;for(var i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))>>>0;}return h;}
function escA(s){return esc(s).replace(/"/g,'&quot;');}
function qWord(n){return n===1?'سؤالٌ واحد':n===2?'سؤالان':(n<=10?n2a(n)+' أسئلة':n2a(n)+' سؤالًا');}
function numA(x){return n2a(Math.round(x*10)/10).replace('.','٫');}
var KIND={mcq:'سؤال',verse:'المحقّق البياني',two:'سؤالٌ وسببه',match:'⟨صِل|صِلي⟩ بين العمودين',type:'⟨اكتب|اكتبي⟩ الإجابة'};
var MODE={diag:'الاختبار الدوري',axis:'اختبار الخزانة',full:'الاختبار الشامل',det:'المحقّق البياني',review:'المراجعة الذكية',daily:'جوهرة اليوم',majlis:'مسابقة المجلس'};
function level(p){if(p===null) return ['st-none','لم يُختبر بعد']; if(p>=80) return ['st-ok','متقن']; if(p>=50) return ['st-mid','جيّد']; return ['st-low','يحتاج مراجعة'];}
function tagFor(lid){var l=lessonById[lid];return '<button class="tag" type="button" data-open="'+lid+'" style="--ax:var(--'+axById[l.ax].c+')">'+l.title+'</button>';}

/* ---------- engine ---------- */
var AS=null;
function startAssess(mode,items,o){
  o=o||{}; L=null;
  if(!items.length) return emptyAssess(mode);
  AS={mode:mode,items:items,i:0,scores:[],ax:o.ax||null,teams:o.teams||null,turn:0,pts:[0,0],s:null};
  assessView();
}
function emptyAssess(mode){
  go('<div class="ax-page" style="--ax:var(--rose)"><button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">'+MODE[mode]+'</h1>'+
    '<p class="lead">لا أسئلة تنتظر المراجعة اليوم. كل سؤالٍ ⟨تخطئ|تخطئين⟩ فيه في الاختبارات يعود إليك هنا بعد يوم، ثم بعد أيامٍ أطول كلما ⟨أصبته|أصبتِه⟩، حتى ⟨تتقنه|تتقنيه⟩.</p></header>'+
    '<div class="actions"><button class="btn" type="button" data-go="full">⟨جرّب|جرّبي⟩ الاختبار الشامل</button></div></div>');
}
function prep(b){
  var s={done:false,sc:0};
  if(b.o) s.ord=shuffle(b.o.map(function(t,i){return {t:t,ok:i===0};}));
  if(b.k==='two'){s.ord2=shuffle(b.o2.map(function(t,i){return {t:t,ok:i===0};}));s.stage=1;}
  if(b.k==='match'){s.L=shuffle(b.pairs.map(function(p,i){return i;}));s.R=shuffle(b.pairs.map(function(p,i){return i;}));s.sel=-1;s.ok={};s.miss={};s.bad=-1;}
  return s;
}
function teamBar(){
  var A=AS,t=A.teams;
  return '<div class="team" id="teamBar"><span>'+(A.turn===0?'<b>الدور: '+esc(t[0])+'</b>':esc(t[0]))+' · '+n2a(A.pts[0])+'</span>'+
    '<span>'+(A.turn===1?'<b>الدور: '+esc(t[1])+'</b>':esc(t[1]))+' · '+n2a(A.pts[1])+'</span></div>';
}
function assessView(){
  var A=AS;
  if(A.i>=A.items.length) return assessEnd();
  var b=A.items[A.i]; A.s=prep(b);
  var a=axById[b.ax]||axById.lamasat, pct=Math.round(A.i/A.items.length*100);
  go('<div class="lesson" style="--ax:var(--'+a.c+');--key:var(--'+a.k+')">'+
    '<button class="back" type="button" data-home>'+BACK+' إنهاء والعودة</button>'+
    '<h1 class="h1">'+MODE[A.mode]+(A.ax?': '+axById[A.ax].name:'')+'</h1>'+
    (A.mode==='majlis'?teamBar():'')+
    (A.items.length>1?'<div class="as-meta"><span>سؤال '+n2a(A.i+1)+' من '+n2a(A.items.length)+'</span><span>'+a.name+'</span></div><div class="as-bar"><i style="width:'+pct+'%"></i></div>':'')+
    '<div class="stage" id="asItem">'+itemHTML(b)+'</div></div>');
}
function optsHTML(ord,attr,locked,chosen,reveal){
  return '<div class="opts">'+ord.map(function(o,i){
    var cls='opt';
    if(reveal){ if(o.ok) cls+=' right'; else if(i===chosen) cls+=' wrong'; }
    else if(i===chosen) cls+=' picked';
    return '<button class="'+cls+'" type="button" data-'+attr+'="'+i+'"'+(locked?' disabled':'')+'>'+fmt(o.t)+'</button>';
  }).join('')+'</div>';
}
function itemHTML(b){
  var s=AS.s, h='<span class="kind">'+KIND[b.k]+'</span>';
  if(b.v){
    var vt=b.v.t;
    if(vt.indexOf('ـــــ')>=0) vt=s.done?vt.replace('ـــــ','{'+b.o[0]+'}'):vt.replace('ـــــ','<span class="blank" role="img" aria-label="كلمةٌ ناقصة"></span>');
    h+=verse({t:vt,n:b.v.n,s:b.v.s,a:b.v.a,a2:b.v.a2,p:b.v.p,nolink:!s.done});
  }
  h+='<h2 class="q">'+fmt(b.q)+'</h2>';
  if(b.k==='mcq'||b.k==='verse') h+=optsHTML(s.ord,'a',s.done,s.c,s.done);
  if(b.k==='two'){
    h+=optsHTML(s.ord,'a',s.stage>1,s.c1,s.done);
    if(s.stage>1) h+='<div class="q2"><h2 class="q">'+fmt(b.q2)+'</h2>'+optsHTML(s.ord2,'a2',s.done,s.c2,s.done)+'</div>';
  }
  if(b.k==='match'){
    h+='<div class="match"><div class="mcol">'+s.L.map(function(i){
        return '<button class="mbtn q'+(s.ok[i]?' done':'')+(s.sel===i?' sel':'')+'" type="button" data-ml="'+i+'"'+(s.ok[i]?' disabled':'')+'>'+fmt(b.pairs[i][0])+'</button>';
      }).join('')+'</div><div class="mcol">'+s.R.map(function(j){
        return '<button class="mbtn'+(s.ok[j]?' done':'')+(s.bad===j?' bad':'')+'" type="button" data-mr="'+j+'"'+(s.ok[j]?' disabled':'')+'>'+b.pairs[j][1]+'</button>';
      }).join('')+'</div></div>'+(s.done?'':'<p class="credit">⟨اضغط|اضغطي⟩ عبارةً من العمود الأول، ثم ما يناسبها من العمود الثاني.</p>');
  }
  if(b.k==='type'){
    h+='<div class="type-row"><input id="typeAns" type="text" autocomplete="off" aria-label="⟨اكتب|اكتبي⟩ إجابتك" placeholder="مثال: ع ل م"'+(s.done?' disabled value="'+escA(s.typed)+'"':'')+'>'+
      '<button class="btn" type="button" data-check'+(s.done?' disabled':'')+'>⟨تحقّق|تحقّقي⟩</button></div>';
  }
  if(s.done) h+=fbHTML(b,s);
  return h;
}
function fbHTML(b,s){
  var last=AS.i===AS.items.length-1;
  var lbl=AS.mode==='daily'?'تمّ':(last?(AS.mode==='majlis'?'النتيجة النهائية':'النتيجة'):'السؤال التالي');
  var cls=s.sc>=1?'fb-ok':(s.sc>0?'fb-half':'fb-no');
  var head=s.sc>=1?'<strong>'+(AS.mode==='majlis'?'أحسنتم!':praise())+'</strong> ':(s.sc>0?'<strong>إجابةٌ جزئية.</strong> ':'<strong>ليست هذه.</strong> ');
  var extra='';
  if(b.k==='type'&&s.sc<1) extra='الإجابة: «'+b.show+'». ';
  if(b.k==='match'&&s.sc<1) extra='⟨أتممتَ|أتممتِ⟩ الوصل، لكن '+(s.sc>0?'بعض الأزواج':'الأزواج')+' لم ⟨تصبها|تصيبيها⟩ من المحاولة الأولى. ';
  if(b.k==='two'&&s.sc>0&&s.sc<1) extra='الجواب صحيح، لكن السبب لم يكن الأدقّ. ';
  if(b.k==='two'&&s.sc===0) extra='الجواب الأول لم يكن صحيحًا. ';
  return '<div class="fb"><div class="'+cls+'">'+head+extra+fmt(b.why)+'</div>'+
    '<div class="actions"><button class="btn" type="button" data-anext>'+lbl+'</button></div></div>';
}
function renderItem(){
  var el=document.getElementById('asItem'); if(el) el.innerHTML=G(itemHTML(AS.items[AS.i]));
  if(AS.mode==='majlis'){var tb=document.getElementById('teamBar'); if(tb) tb.outerHTML=G(teamBar());}
}
function ansA(i){
  var b=AS.items[AS.i],s=AS.s; if(!s||s.done) return;
  if(b.k==='two'){ if(s.stage!==1) return; s.c1=i; s.stage=2; return renderItem(); }
  s.c=i; finishItem(s.ord[i].ok?1:0);
}
function ansA2(i){var s=AS.s; if(!s||s.done||s.stage!==2) return; s.c2=i; finishItem(s.ord[s.c1].ok?(s.ord2[i].ok?1:.5):0);}
function ansML(i){var s=AS.s; if(!s||s.done||s.ok[i]) return; s.sel=i; s.bad=-1; renderItem();}
function ansMR(j){
  var b=AS.items[AS.i],s=AS.s; if(!s||s.done||s.sel<0||s.ok[j]) return;
  if(s.sel===j){s.ok[j]=true;s.bad=-1;} else {s.miss[s.sel]=true;s.bad=j;}
  s.sel=-1;
  var n=b.pairs.length;
  if(Object.keys(s.ok).length===n){var good=0;for(var x=0;x<n;x++){if(!s.miss[x]) good++;} finishItem(good/n);}
  else renderItem();
}
function ansType(){
  var b=AS.items[AS.i],s=AS.s; if(!s||s.done) return;
  var inp=document.getElementById('typeAns'), v=inp?inp.value:'';
  if(!norm(v)){ if(inp) inp.focus(); return; }
  s.typed=v; finishItem(b.ans.some(function(a){return norm(a)===norm(v);})?1:0);
}
function finishItem(sc){
  var A=AS,b=A.items[A.i],s=A.s; s.done=true; s.sc=sc; A.scores[A.i]=sc;
  /* the periodic diagnostic measures, it does not teach: no right or wrong shown, nothing goes to the spaced review */
  if(A.mode==='diag'){ var st=document.getElementById('asItem'); if(st) st.style.opacity='.55'; setTimeout(function(){ if(AS===A&&A.items[A.i]===b) nextItem(); },300); return; }
  if(A.mode==='majlis'){ if(sc>=1) A.pts[A.turn]++; } else record(b.id,sc);
  if(A.mode==='daily') markDaily();
  renderItem();
  var nb=document.querySelector('[data-anext]'); if(nb){try{nb.focus();}catch(e){}}
}
function nextItem(){
  if(!AS) return home();
  AS.i++; if(AS.mode==='majlis') AS.turn=1-AS.turn;
  assessView();
}
function assessEnd(){
  var A=AS,n=A.items.length;
  if(A.mode==='daily') return dailyDone();
  if(A.mode==='majlis') return majlisEnd();
  var tot=0; A.scores.forEach(function(x){tot+=x||0;});
  var pct=Math.round(tot/n*100), lv=level(pct), a=A.ax?axById[A.ax]:null;
  if(A.mode!=='review'){
    var rec={d:today(),m:A.mode,ax:A.ax,p:pct,n:n};
    if(A.mode==='diag'){ rec.by={}; AXES.forEach(function(a){var s=0,c=0;A.items.forEach(function(b,i){if(b.ax===a.id){c++;s+=A.scores[i]||0;}}); if(c) rec.by[a.id]=Math.round(s/c*100);}); ST.diag=ST.diag||[]; ST.diag.push(rec); }
    ST.tests.push(rec); if(ST.tests.length>40) ST.tests=ST.tests.slice(-40); saveST();
  }
  var weak=[]; A.items.forEach(function(b,i){if((A.scores[i]||0)<1&&b.l&&weak.indexOf(b.l)<0) weak.push(b.l);});
  go('<div class="lesson" style="--ax:var(--'+(a?a.c:'lapis')+')">'+
    '<button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<h1 class="h1">نتيجة '+MODE[A.mode]+(a?': '+a.name:'')+'</h1>'+
    '<div class="reward"><p class="score-big">'+n2a(pct)+'٪</p><span class="state '+lv[0]+'">'+lv[1]+'</span>'+
    '<p>'+numA(tot)+' من '+n2a(n)+' درجات، محسوبةً من المحاولة الأولى وحدها.</p>'+
    certNote(certSync(KID.id))+
    '<ul class="rev">'+A.items.map(function(b,i){
      var sc=A.scores[i]||0, m=sc>=1?'<span class="mark-ok" aria-label="صحيح">✓</span>':(sc>0?'<span class="mark-mid" aria-label="جزئي">½</span>':'<span class="mark-no" aria-label="خطأ">✗</span>');
      var q=plain(b.q); if(q.length>80) q=q.slice(0,78)+'…';
      return '<li>'+m+'<span>'+q+'</span></li>';
    }).join('')+'</ul>'+
    (weak.length?'<div class="takeaway"><span class="eyebrow">دروسٌ تستحقّ المراجعة</span><p class="li-lessons">'+weak.map(tagFor).join('')+'</p></div>':'')+
    '<div class="actions">'+(A.mode!=='review'?'<button class="btn" type="button" data-again>⟨أعِد|أعيدي⟩ بأسئلةٍ جديدة</button>':'')+
    '<button class="btn ghost" type="button" data-go="progress">لوحة التقدّم</button></div></div></div>');
}
function again(){
  if(!AS) return home();
  if(AS.mode==='axis') return testAxis(AS.ax);
  if(AS.mode==='full') return testAll();
  if(AS.mode==='det') return detective();
  if(AS.mode==='diag') return startDiag();
  return home();
}

/* ---------- modes ---------- */
function testAxis(id){
  var all=BANK.filter(function(b){return b.ax===id;});
  var ex=shuffle(all.filter(function(b){return !b.lq;})), lq=shuffle(all.filter(function(b){return b.lq;}));
  var m=ex.filter(function(b){return b.k==='match';}), rest=ex.filter(function(b){return b.k!=='match';});
  startAssess('axis',shuffle(m.slice(0,1).concat(rest.slice(0,6)).concat(lq.slice(0,3))),{ax:id});
}
function testAll(){
  var items=[];
  AXES.forEach(function(a){items=items.concat(shuffle(BANK.filter(function(b){return b.ax===a.id&&!b.lq&&b.k!=='match';})).slice(0,3));});
  startAssess('full',shuffle(items));
}
function detective(){startAssess('det',shuffle(BANK.filter(function(b){return !!b.v;})).slice(0,10));}
function review(){startAssess('review',shuffle(dueList()).slice(0,10));}
function markDaily(){
  var t=today(),D=ST.daily; if(D.last===t) return;
  D.days=(D.days||[]).filter(function(x){return x>=addDays(t,-70)&&x!==t;}); D.days.push(t); D.last=t;
  if(weekDaysN(D,t)===WEEK_GOAL) D.wk=(D.wk||0)+1; saveST();
}
function weekNow(){return weekDaysN(ST.daily);}
function dailyItem(){var el=BANK.filter(function(b){return b.k!=='match';});return el[hashStr(today())%el.length];}
function daily(){ if(ST.daily.last===today()) return dailyDone(); startAssess('daily',[dailyItem()]); }
function dailyDone(){
  L=null; var due=dueList().length, wn=weekNow();
  go('<div class="ax-page" style="--ax:var(--gold)"><button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">جوهرة اليوم</h1><p class="lead">⟨أجبتَ عن سؤال اليوم. عُد|أجبتِ عن سؤال اليوم. عودي⟩ غدًا لجوهرةٍ جديدة. '+(wn>=WEEK_GOAL?'⟨أتممتَ|أتممتِ⟩ أسبوعك، وما زاد فهو خير.':'أربعة أيامٍ في الأسبوع ⟨تُتمّ|تُتمّين⟩ بها أسبوعك، ⟨تختارها|تختارينها⟩ كما ⟨تشاء|تشائين⟩.')+'</p></header>'+
    '<div class="tiles"><div class="tile"><b>'+n2a(wn)+' من '+n2a(WEEK_GOAL)+'</b><span>أيام هذا الأسبوع</span></div><div class="tile"><b>'+n2a(ST.daily.wk||0)+'</b><span>أسابيع ⟨أتممتها|أتممتِها⟩</span></div>'+
    '<div class="tile"><b>'+n2a(due)+'</b><span>تنتظر المراجعة</span></div><div class="tile"><b>'+n2a(doneCount())+'</b><span>جواهر الدروس</span></div></div>'+
    '<div class="actions">'+(due?'<button class="btn" type="button" data-go="review">المراجعة الذكية</button>':'<button class="btn" type="button" data-go="det">المحقّق البياني</button>')+
    '<button class="btn ghost" type="button" data-home>الخزائن</button></div></div>');
}
var MJ={n:10};
function majlisSetup(){
  L=null; var t1='',t2='';
  try{t1=localStorage.getItem('kunuz-t1')||'';t2=localStorage.getItem('kunuz-t2')||'';}catch(e){}
  go('<div class="ax-page" style="--ax:var(--olive)"><button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">مسابقة المجلس</h1><p class="lead">فريقان على هاتفٍ واحد، يتناوبان على الأسئلة. لكل إجابةٍ صحيحة من المحاولة الأولى نقطة، والهاتف ينتقل بين الفريقين.</p></header>'+
    '<form class="majlis-form" id="mjForm"><label for="t1">اسم الفريق الأول</label><input id="t1" maxlength="30" value="'+escA(t1||'فريق الغيث')+'">'+
    '<label for="t2">اسم الفريق الثاني</label><input id="t2" maxlength="30" value="'+escA(t2||'فريق الرياح')+'">'+
    '<span class="eyebrow">عدد الأسئلة</span><div class="seg">'+[6,10,14].map(function(k){return '<button type="button" data-mjn="'+k+'" class="'+(MJ.n===k?'on':'')+'">'+n2a(k)+'</button>';}).join('')+'</div>'+
    '<div class="actions"><button class="btn" type="submit">ابدؤوا المسابقة</button></div></form></div>');
}
function startMajlis(){
  var a=(document.getElementById('t1')||{}).value||'', b=(document.getElementById('t2')||{}).value||'';
  a=a.trim()||'الفريق الأول'; b=b.trim()||'الفريق الثاني';
  try{localStorage.setItem('kunuz-t1',a);localStorage.setItem('kunuz-t2',b);}catch(e){}
  startAssess('majlis',shuffle(BANK.filter(function(x){return x.k==='mcq'||x.k==='verse';})).slice(0,MJ.n),{teams:[a,b]});
}
function majlisEnd(){
  var A=AS,t=A.teams,p=A.pts;
  var w=p[0]===p[1]?'تعادلٌ جميل!':('فاز '+esc(p[0]>p[1]?t[0]:t[1])+'!');
  go('<div class="lesson" style="--ax:var(--olive)"><button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<h1 class="h1">'+w+'</h1><div class="reward"><span class="big-gem">'+STAR+'</span>'+
    '<div class="team"><span>'+esc(t[0])+': '+n2a(p[0])+'</span><span>'+esc(t[1])+': '+n2a(p[1])+'</span></div>'+
    '<div class="actions"><button class="btn" type="button" data-go="majlis">جولةٌ جديدة</button><button class="btn ghost" type="button" data-home>الخزائن</button></div></div></div>');
}

/* ---------- home block ---------- */
function toolsHTML(){
  var due=dueList().length, dn=ST.daily.last===today(), wn=weekNow();
  return '<section><h2 class="h2">⟨تمرّن واختبر|تمرّني واختبري⟩ نفسك</h2><div class="tools">'+
    '<button class="tool hi" type="button" data-go="daily" style="--ax:var(--gold)"><span class="tool-t">جوهرة اليوم</span>'+
      '<span class="tool-d">'+(dn?'⟨أجبتَ عن سؤال اليوم. عُد|أجبتِ عن سؤال اليوم. عودي⟩ غدًا لجوهرةٍ جديدة.':'سؤالٌ واحد كل يوم من الخزائن كلها.')+'</span><span class="tool-n">'+weekLine(wn)+'</span></button>'+
    '<button class="tool" type="button" data-go="det" style="--ax:var(--lapis)"><span class="tool-t">المحقّق البياني</span><span class="tool-d">آياتٌ لم تمرّ بك في الدروس: ⟨اكتشف|اكتشفي⟩ الكلمة المناسبة بما ⟨تعلّمته|تعلّمتِه⟩.</span></button>'+
    '<button class="tool" type="button" data-go="full" style="--ax:var(--teal)"><span class="tool-t">الاختبار الشامل</span><span class="tool-d">'+qTotalWord(AXES.length*3)+' من الخزائن '+axWord()+' بأنواعٍ مختلفة، والدرجة من المحاولة الأولى.</span></button>'+
    '<button class="tool" type="button" data-go="review" style="--ax:var(--rose)"><span class="tool-t">المراجعة الذكية</span><span class="tool-d">ما ⟨أخطأتَ|أخطأتِ⟩ فيه يعود إليك في أيامٍ متباعدة حتى ⟨تتقنه|تتقنيه⟩.</span><span class="tool-n">'+(due?qWord(due)+' تنتظرك اليوم':'لا شيء ينتظرك اليوم')+'</span></button>'+
    '<button class="tool" type="button" data-go="majlis" style="--ax:var(--olive)"><span class="tool-t">مسابقة المجلس</span><span class="tool-d">فريقان على هاتفٍ واحد، للسهرات والزيارات.</span></button>'+
    '<button class="tool hi" type="button" data-go="progress" style="--ax:var(--plum)"><span class="tool-t">تقدّمي</span><span class="tool-d">إتقانك في كل خزانة، والدروس التي ⟨تحتاج|تحتاجين⟩ إلى مراجعتها، وآخر ⟨اختباراتك|اختباراتكِ⟩.</span></button>'+
  '</div></section>';
}

