/* ================= «صوت البيت»: lesson explanations in a family member's voice ================= */
/* A parent (or an older sibling, from the parent corner) records each explanation once.
   Texts that address the child (⟨…|…⟩) get two recordings, one for boys and one for girls, so the voice speaks to each child correctly. */
FAM.nar=FAM.nar||{};
function narParas(id){
  var l=lessonById[id];
  if(l) return l.secret.map(function(x){
    if(typeof x==='string') return x;
    if(x.rule) return (x.label?x.label+': ':'')+x.rule;
    if(x.v) return '﴿ '+plain(x.v.t)+' ﴾';
    if(x.cmp) return x.cmp.map(function(c){return plain(c.w)+' ('+c.n+'): '+plain(c.m);}).join('. ');
    if(x.chips) return x.chips.map(function(c){return plain(c.w)+': '+c.m;}).join('، ');
    return '';
  }).filter(Boolean).map(plain);
  if(typeof rmById!=='undefined'&&rmById[id]){var r=rmById[id];return ['﴿ '+plain(r.v.t)+' ﴾'].concat(r.s.map(plain));}
  if(typeof pairById!=='undefined'&&pairById[id]){var p=pairById[id];return p.p.map(function(x){return x[0]+' ('+x[1]+')، '+x[2]+' ('+x[3]+')';});}
  return null;
}
function narTitle(id){
  if(lessonById[id]) return plain(Gx(lessonById[id].title,0));
  if(typeof rmById!=='undefined'&&rmById[id]) return 'لمسة رمضان '+n2a(rmById[id].j)+': '+rmById[id].t;
  if(typeof pairById!=='undefined'&&pairById[id]) return 'مختبر الحروف: '+pairById[id].t;
  return id;
}
function narGendered(id){var p=narParas(id);return !!(p&&p.join(' ').indexOf('⟨')>=0);}
function narKey(id,g){return id+':'+(narGendered(id)?(g==='f'?'f':'m'):'x');}
function narFor(id,g){var k=narKey(id,g);return FAM.nar[k]?{k:k,meta:FAM.nar[k]}:null;}
function famGenders(){var g=[];FAM.kids.forEach(function(k){var x=k.g==='f'?'f':'m';if(g.indexOf(x)<0)g.push(x);});return g.length?g.sort().reverse():['m','f'];}

/* child side */
var NAR_AUDIO=null, NAR_BTN=null;
function narStop(){ if(NAR_AUDIO){try{NAR_AUDIO.pause();}catch(e){}} if(NAR_BTN){NAR_BTN.classList.remove('on');} NAR_BTN=null; }
function speakBtnHTML(id){
  var n=KID&&narFor(id,KID.g);
  if(n) return '<button class="speak" type="button" data-act="narPlay" data-id="'+id+'">'+SPEAKER+' ⟨اسمع|اسمعي⟩ الشرح بصوت '+esc(n.meta.by)+'</button>';
  if(lessonById[id]&&hasTTS) return '<button class="speak" type="button" id="speak">'+SPEAKER+' اقرأ لي</button><p class="speak-note" id="speakNote" hidden>قد لا يتوفّر صوتٌ عربي على هذا الجهاز. ⟨اطلب|اطلبي⟩ من وليّ أمرك أن يسجّل الشرح بصوته في «صوت البيت».</p>';
  return '';
}
async function narPlay(id,btn){
  if(NAR_BTN===btn&&NAR_AUDIO&&!NAR_AUDIO.paused){narStop();return;}
  narStop(); var n=KID&&narFor(id,KID.g); if(!n) return;
  var u=await mediaURL('nar-'+n.k); if(!u) return toast('تعذّر تشغيل التسجيل.');
  if(!NAR_AUDIO){NAR_AUDIO=new Audio();NAR_AUDIO.addEventListener('ended',function(){narStop();});}
  NAR_AUDIO.src=u; NAR_BTN=btn; btn.classList.add('on');
  try{await NAR_AUDIO.play();}catch(e){narStop();}
}

/* parent side */
function narGroups(){
  var g=AXES.map(function(a){return {t:a.name,c:a.c,ids:LESSONS.filter(function(l){return l.ax===a.id;}).map(function(l){return l.id;})};});
  if(typeof RAMADAN!=='undefined'&&RAMADAN.length) g.push({t:'لمسات رمضان',c:'gold',ids:RAMADAN.map(function(r){return r.id;})});
  if(typeof PAIRS!=='undefined'&&PAIRS.length) g.push({t:'مختبر الحروف: النطق النموذجي',c:'teal',ids:PAIRS.map(function(p){return p.id;})});
  return g;
}
function pVoice(){
  L=null; var gs=famGenders(), tot=0, done=0;
  var body=narGroups().map(function(gr){
    return '<section><h2 class="h2">'+gr.t+'</h2><ul class="wlist">'+gr.ids.map(function(id){
      var vars=narGendered(id)?gs:['x'];
      var st=vars.map(function(g){tot++;var k=id+':'+g,m=FAM.nar[k]; if(m) done++;
        var lab=g==='x'?'':(g==='f'?'للبنات ':'للبنين ');
        return '<span class="state '+(m?'st-ok':'st-none')+'">'+lab+(m?'✓ '+fmtDur(m.dur)+' · '+esc(m.by):'لم يُسجَّل')+'</span>';}).join(' ');
      return '<li><button class="wrow" type="button" data-act="pVoiceOne" data-id="'+id+'" style="--ax:var(--'+gr.c+')"><span class="ch-ico">'+ICON.mic+'</span>'+
        '<span class="wr-main"><span class="wr-t">'+esc(narTitle(id))+'</span><span class="wr-s nar-st">'+st+'</span></span></button></li>';
    }).join('')+'</ul></section>';
  }).join('');
  go('<div class="ax-page" style="--ax:var(--teal)"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button>'+
    '<header class="page-head"><h1 class="h1">صوت البيت</h1><p class="lead">سجّلوا شرح كل درسٍ بصوتكم مرةً واحدة، فيسمعه الأطفال بصوتٍ يعرفونه حين يضغطون زرّ الشرح، بدل الصوت الآلي الذي قد لا يتوفّر بالعربية على الجهاز. وما يخاطب الطفل مباشرةً يُسجَّل مرتين: للبنين وللبنات.</p></header>'+
    '<div class="form"><label for="narBy">اسم القارئ كما يظهر للأطفال</label><input id="narBy" maxlength="20" value="'+escA(FAM.narBy||'')+'" placeholder="مثلًا: ماما، أو بابا، أو أخي يوسف"></div>'+
    '<p class="muted small">سُجّل '+n2a(done)+' من '+n2a(tot)+'.</p>'+body+'</div>');
}
var NV=null;
function pVoiceOne(id,g){
  var ps=narParas(id); if(!ps) return pVoice();
  var gs=famGenders(), gd=narGendered(id);
  NV={id:id,g:gd?(g||gs[0]):'x'}; L=null;
  var f=NV.g==='f';
  go('<div class="ax-page narrow" style="--ax:var(--teal)"><button class="back" type="button" data-act="pVoice">'+BACK+' صوت البيت</button>'+
    '<header class="page-head"><span class="eyebrow">صوت البيت</span><h1 class="h1">'+esc(narTitle(id))+'</h1>'+
    '<p class="lead">اقرؤوا النصّ بتمهّلٍ وصوتٍ واضح، كأنكم تشرحونه للطفل.'+(gd?' هذا النصّ يخاطب الطفل، فسجّلوه '+(gs.length>1?'مرّةً للبنين ومرّةً للبنات.':(gs[0]==='f'?'بصيغة المؤنّث.':'بصيغة المذكّر.')):'')+'</p></header>'+
    (gd&&gs.length>1?'<div class="seg"><button type="button" data-act="pVoiceG" data-v="m" class="'+(!f?'on':'')+'">للبنين</button><button type="button" data-act="pVoiceG" data-v="f" class="'+(f?'on':'')+'">للبنات</button></div>':'')+
    '<div class="nar-text">'+ps.map(function(p){return '<p>'+esc(Gx(p,f)).replace(/⟨|⟩/g,'')+'</p>';}).join('')+'</div>'+
    '<div class="rec" id="narBox"></div></div>');
  narRender();
}
function narRender(){
  var b=document.getElementById('narBox'); if(!b||!NV) return;
  var k=NV.id+':'+NV.g, m=FAM.nar[k], recOn=REC.mr&&REC.narId===k, h='';
  if(recOn) h='<div class="rec-on"><button class="rec-btn on" type="button" data-act="narStopRec" aria-label="أوقفوا التسجيل">'+ICON.stop+'</button>'+
    '<div class="rec-mid"><span class="rec-live"><i></i>يسجّل الآن</span><span class="rec-t" id="recT">٠:٠٠</span><span class="meter" id="recMeter">'+new Array(16).join('<i></i>')+'</span></div></div>';
  else{
    if(m) h+='<div class="rec-done"><audio controls preload="metadata" data-src="nar-'+k+'"></audio><span class="rec-d">'+fmtDur(m.dur)+' · '+esc(m.by)+'</span></div>';
    if(canRecord()) h+='<div class="actions"><button class="btn'+(m?' ghost':'')+'" type="button" data-act="narRec">'+ICON.mic+' '+(m?'أعيدوا التسجيل':'سجّلوا')+'</button>'+(m?'<button class="btn ghost danger-ghost" type="button" data-act="narDel">'+ICON.trash+' احذفوه</button>':'')+'</div>';
    h+='<label class="link small file-link">أو اختاروا ملفًّا صوتيًّا مسجّلًا<input type="file" accept="audio/*" data-file="narFile" hidden></label>';
  }
  b.innerHTML=h; hydrate(b);
}
async function narRec(){
  if(!NV||REC.mr) return;
  if(!canRecord()) return toast('التسجيل المباشر غير متاح هنا.');
  try{REC.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});}
  catch(e){return toast('لم يُسمح باستعمال المايكروفون. اسمحوا به من إعدادات المتصفح.');}
  var k=NV.id+':'+NV.g, mime=pickMime();
  try{REC.mr=new MediaRecorder(REC.stream,mime?{mimeType:mime}:undefined);}catch(e){REC.mr=new MediaRecorder(REC.stream);}
  REC.chunks=[]; REC.wid=null; REC.narId=k; REC.discard=false; REC.max=600;
  REC.sink={save:function(blob,dur){return saveNarration(k,blob,dur);},after:narRender};
  REC.mr.ondataavailable=function(e){if(e.data&&e.data.size) REC.chunks.push(e.data);};
  REC.mr.onstop=recDone; REC.mr.start(1000); REC.t0=Date.now();
  narRender(); recMeter();
  REC.timer=setInterval(function(){var s=(Date.now()-REC.t0)/1000,el=document.getElementById('recT'); if(el) el.textContent=fmtDur(s)+' / '+fmtDur(REC.max); if(s>=REC.max) recStop();},250);
}
async function saveNarration(k,blob,dur){
  try{await blobPut('nar-'+k,blob);}catch(e){return toast('تعذّر حفظ التسجيل: قد تكون مساحة الجهاز ممتلئة.');}
  FAM.nar[k]={by:(FAM.narBy||'').trim()||'وليّ الأمر',d:Date.now(),dur:dur}; saveFam();
  narRender(); toast('حُفظ التسجيل.');
}
async function narDel(){
  if(!NV) return; var k=NV.id+':'+NV.g;
  var ok=await ask({title:'حذف هذا التسجيل؟',c:'rose',ok:'احذفوه',danger:1}); if(!ok) return;
  await blobDel('nar-'+k); delete FAM.nar[k]; saveFam(); narRender();
}
async function narFilePicked(file){
  if(!NV||!file) return;
  if(!/^audio\//.test(file.type)&&!/\.(m4a|mp3|wav|ogg|opus|webm|aac)$/i.test(file.name||'')) return toast('هذا ليس ملفًّا صوتيًّا.');
  var dur=await new Promise(function(res){var a=document.createElement('audio'),u=URL.createObjectURL(file);a.preload='metadata';a.onloadedmetadata=function(){var d=a.duration;URL.revokeObjectURL(u);res(isFinite(d)?d:0);};a.onerror=function(){URL.revokeObjectURL(u);res(0);};a.src=u;});
  await saveNarration(NV.id+':'+NV.g,file,dur);
}
