/* ================= family sessions & presentation mode ================= */
/* A weekly quarter-hour for the whole family, built only on lessons already in the app (verified content). */
FAM.fs=FAM.fs||{done:{}};
var FCARDS=[
 {id:'fs-ghayth',l:'ghayth',w:['غَيْث','غ و ث','من الإغاثة: الماء الذي يُنقذ بعد يأس'],
  q:'متى جاءك «غيثٌ» في حياتك: خيرٌ وصل بعد انتظارٍ طويل فأفرحك؟',
  g:'«كلمات الماء»: يذكر كلُّ واحدٍ بدوره كلمةً عن الماء (غيث، مطر، سيل، نهر، ينبوع، عين، ودق…). من يتوقّف أو يكرّر يخرج، والفائز آخر من يبقى.',
  c:'استعملوا كلمة «غيث» في رسالةٍ إلى أحد الأقارب، واشرحوا له الفرق بينها وبين «مطر».'},
 {id:'fs-iyyaka',l:'iyyaka',w:['إِيَّاكَ','—','ضميرٌ قُدِّم فأفاد الاختصاص: لك وحدك'],
  q:'ما الذي نعتمد فيه على الله وحده؟ قولوها بالتقديم كما في الفاتحة: «على الله نتوكّل».',
  g:'«قدِّم الكلمة»: يقول أحدكم جملةً عادية (أحبّ أمي)، ويقدّم الآخر كلمةً فيها (أمي أحبّ)، ثم يشرح الجميع: ماذا زاد في المعنى؟',
  c:'انتبهوا في صلواتكم هذا الأسبوع إلى «إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ»، وتذكّروا معناها.'},
 {id:'fs-sadd',l:'sadd',w:['اسْتَطَاعَ','ط و ع','زيادة المبنى تدلّ على زيادة المعنى'],
  q:'ما أصعب عملٍ قمتم به هذا الأسبوع؟ صِفوه بكلمةٍ «طويلةٍ» قوية.',
  g:'«زِد حرفًا»: يقول أحدكم فعلًا (قدَر، خشُن، عشُب)، ويزيده الآخر حرفًا أو أكثر فيقوى معناه (اقتدر، اخشوشن، اعشوشب).',
  c:'ابحثوا في سورة الكهف عن «اسْطَاعُوا» و«اسْتَطَاعُوا» واقرؤوا الآية معًا.'},
 {id:'fs-jathr',l:'jathr',w:['ع ل م','ع ل م','جذرٌ تنبت منه عشرات الكلمات'],
  q:'ما جذر اسم كلّ واحدٍ منكم؟ وما معناه؟',
  g:'«سباق الجذور»: اختاروا جذرًا (ك ت ب، أو ز ر ع، أو ر س م)، ويكتب كلُّ واحدٍ في دقيقتين أكثر ما يستطيع من كلماته.',
  c:'افتحوا معجمًا (ورقيًّا أو على الشبكة) وابحثوا عن كلمةٍ واحدة بجذرها.'},
 {id:'fs-salam',l:'salam',w:['سَلَامٌ','س ل م','الجملة الاسمية تدلّ على الثبوت'],
  q:'كيف نجعل تحيّتنا في البيت أجمل؟',
  g:'«بأحسن منها»: يحيّي أحدكم الآخرين بتحيّة، ويردّ كلُّ واحدٍ بتحيّةٍ أحسن منها.',
  c:'ردّوا التحيّة طوال الأسبوع بأحسن منها: «وعليكم السلام ورحمة الله وبركاته».'},
 {id:'fs-adab',l:'adab',w:['وَإِذَا مَرِضْتُ','م ر ض','أدب إبراهيم: نسب الخير إلى الله صريحًا'],
  q:'كيف نتحدّث عن شيءٍ مؤلمٍ أو خطأٍ وقع، بلطفٍ لا يجرح؟',
  g:'«قُلها بلطف»: يقرأ أحدكم جملةً قاسية (طعامك سيّئ)، ويعيد الآخرون صياغتها بأدب (لو زاد الملح قليلًا لكان أطيب).',
  c:'جرّبوا هذا الأسبوع أن تنسبوا كلّ خيرٍ إلى صاحبه بالشكر الصريح.'},
 {id:'fs-qul',l:'qul',w:['مُبَارَكٌ','ب ر ك','الأفصح «مبارك» من البركة'],
  q:'ما العبارة الشائعة التي تقولونها كثيرًا؟ هل هي الأفصح؟',
  g:'«صيّاد العبارات»: من سمع عبارةً شائعةً تحتاج تصويبًا هذا الأسبوع يكتبها على ورقةٍ في المطبخ مع تصويبها.',
  c:'هنّئوا من ينجح هذا الأسبوع بقولكم: «مباركٌ نجاحك».'},
 {id:'fs-safar',l:'safar',w:['صِفْر','ص ف ر','سافرت فصارت zero'],
  q:'لو سافرت كلمةٌ من بيتنا إلى العالم، أيّ كلمةٍ تختارون؟ ولماذا؟',
  g:'«خمّن الأصل»: يقول أحدكم كلمةً إنجليزية (cotton، zero، algebra، giraffe، coffee، magazine)، والآخرون يخمّنون أصلها العربي.',
  c:'ابحثوا عن كلمةٍ عربيةٍ أخرى سافرت إلى لغةٍ ثانية، وأخبروا بها العائلة في الجلسة القادمة.'},
 {id:'fs-sawt',l:'sawt',w:['الخَضْم والقَضْم','خ ض م / ق ض م','صوت الحرف يشبه معناه'],
  q:'أيّ كلمةٍ عربية تشبه صوتها؟ (خرير، حفيف، صرير، زقزقة…)',
  g:'«أصواتٌ ومعانٍ»: يقول أحدكم كلمةً صوتية، ويقلّد الآخرون الصوت، ثم يذكرون شيئًا يُحدثه.',
  c:'استمعوا إلى أصوات البيت هذا الأسبوع، وسمّوا كلّ صوتٍ باسمه العربي.'},
 {id:'fs-awail',l:'awail',w:['المَائِدَة','م ي د','لا تُسمّى مائدةً إلا وعليها طعام'],
  q:'ماذا نسمّي هذه الطاولة الآن: مائدةً أم خِوانًا؟ ولماذا؟',
  g:'«اسمٌ لكلّ حال»: اختاروا أشياء من البيت، واسألوا: ماذا نسمّيه حين يمتلئ؟ وحين يفرغ؟ (كأس وزجاجة، مائدة وخوان).',
  c:'تعلّموا ثلاثة أسماءٍ لأوائل الأشياء: الصبح، والغسق، والباكورة، واستعملوها في كلامكم.'},
 {id:'fs-harf',l:'harf',w:['ضَلَّ وظَلَّ','ض ل ل / ظ ل ل','حرفٌ واحد يغيّر المعنى كلّه'],
  q:'ما الحروف التي نخلطها في كلامنا اليومي؟ (ث وس، ذ وز، ق والهمزة…)',
  g:'«الحرف الصحيح»: يقرأ أحدكم كلمةً من «مختبر الحروف» ويخطئ فيها عمدًا، والآخرون يصحّحون ويذكرون المعنى الجديد.',
  c:'سجّلوا جميعًا زوجًا من «مختبر الحروف» في التطبيق، واستمعوا إلى قراءاتكم معًا.'},
 {id:'fs-sana',l:'sana',w:['سَنَةٌ وعَامٌ','س ن و / ع و م','السنة للشدّة غالبًا، والعام للرخاء'],
  q:'اذكروا «عامًا» مرّ عليكم فيه خيرٌ كثير، و«سنةً» تعبتم فيها ثم جاء الفرج.',
  g:'«كلماتٌ توائم»: يذكر أحدكم كلمتين متقاربتين (غيث ومطر، حلف وقسم، صمت وسكوت)، والآخرون يذكرون الفرق.',
  c:'اكتبوا معًا «ميثاق العائلة» في ثلاثة أسطر، واختاروا لكلّ كلمةٍ فيه أدقّ لفظ.'}
];
var fcById={}; FCARDS.forEach(function(c){fcById[c.id]=c;});
function fsCurrent(){ var d=FAM.fs.done||{}; for(var i=0;i<FCARDS.length;i++){ var c=FCARDS[(i+(FAM.fs.skip||0))%FCARDS.length]; if(!d[c.id]) return c; } return FCARDS[(FAM.fs.skip||0)%FCARDS.length]; }
function fcardHTML(c){
  var l=lessonById[c.l], v=l&&l.verses[0];
  return '<article class="fcard"><header class="fc-h"><span class="eyebrow">جلسة العائلة · ربع ساعة</span><h2 class="h2">'+plain(Gx(l?l.title:'',0))+'</h2></header>'+
    '<div class="fc-sec"><span class="fc-k">كلمة الأسبوع</span><p><b class="fc-w">'+c.w[0]+'</b>'+(c.w[1]!=='—'?' <span class="muted">(الجذر: '+c.w[1]+')</span>':'')+' — '+c.w[2]+'</p></div>'+
    (v?'<div class="fc-sec"><span class="fc-k">آية الأسبوع</span>'+verse(v,{out:1}).replace(/⟨استمع\|استمعي⟩ للتلاوة/,'الاستماع للتلاوة')+'</div>':'')+
    '<div class="fc-sec"><span class="fc-k">سؤال المائدة</span><p>'+c.q+'</p></div>'+
    '<div class="fc-sec"><span class="fc-k">لعبة</span><p>'+c.g+'</p></div>'+
    '<div class="fc-sec"><span class="fc-k">تحدّي الأسبوع</span><p>'+c.c+'</p></div>'+
    '<p class="muted small">قبل الجلسة: يحسن أن يكون الأطفال قد أكملوا درس «'+plain(Gx(l?l.title:'',0))+'»، أو اقرؤوه معًا في أولها.</p></article>';
}
function pFamily(id){
  L=null; if(!FAM.fs.started){FAM.fs.started=true;saveFam();} var c=id?fcById[id]:fsCurrent(), d=FAM.fs.done||{}, n=Object.keys(d).length;
  go('<div class="ax-page" style="--ax:var(--olive)"><div class="ph-top no-print"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button><button class="btn ghost small-btn" type="button" data-act="print">اطبعوا البطاقة</button></div>'+
    '<header class="page-head no-print"><h1 class="h1">جلسة العائلة</h1><p class="lead">ربع ساعةٍ في الأسبوع حول المائدة: كلمة، وآية، وسؤال، ولعبة، وتحدٍّ صغير. البطاقات مبنيّةٌ على دروس التطبيق نفسها، وتشارك فيها العائلة كلّها، والأجداد إن حضروا.</p></header>'+
    fcardHTML(c)+
    '<div class="actions no-print">'+(d[c.id]?'<span class="state st-ok">أُقيمت في '+fmtDate(d[c.id])+'</span>':'<button class="btn" type="button" data-act="fsDone" data-id="'+c.id+'">'+ICON.check+' أقمنا هذه الجلسة</button>')+
      (!id?'<button class="btn ghost" type="button" data-act="fsSkip">بطاقةٌ أخرى</button>':'')+'</div>'+
    '<section class="no-print"><h2 class="h2">البطاقات · '+n2a(n)+' من '+n2a(FCARDS.length)+'</h2><ul class="wlist">'+FCARDS.map(function(x){var l=lessonById[x.l];
      return '<li><button class="wrow" type="button" data-act="pFamilyOne" data-id="'+x.id+'" style="--ax:var(--'+(l?axById[l.ax].c:'olive')+')"><span class="ch-ico">'+(d[x.id]?ICON.check:ICON.users)+'</span><span class="wr-main"><span class="wr-t">'+plain(Gx(l?l.title:'',0))+'</span><span class="wr-s">'+(d[x.id]?'أُقيمت '+fmtDate(d[x.id]):x.q)+'</span></span></button></li>';}).join('')+'</ul></section></div>');
}
function fsDone(id){FAM.fs.done=FAM.fs.done||{};FAM.fs.done[id]=Date.now();saveFam();toast('بارك الله في جلستكم!');pFamily(id);}
function fsSkip(){FAM.fs.skip=((FAM.fs.skip||0)+1)%FCARDS.length;saveFam();pFamily();}
function fsBanner(){
  if(!FAM.fs||!Object.keys(FAM.fs.done||{}).length&&!FAM.fs.started) return '';
  var c=fsCurrent(); if(!c) return '';
  return '<section class="banner olive"><span class="bn-e" aria-hidden="true">🍽</span><div class="bn-t"><strong>سؤال المائدة هذا الأسبوع</strong><span>'+c.q+' ⟨فكّر|فكّري⟩ فيه قبل جلسة العائلة.</span></div></section>';
}

/* ---------- presentation mode (TV / big screen) ---------- */
var PR=null;
function presentOpen(slides,title){
  if(!slides.length) return;
  presentClose();
  var el=document.createElement('div'); el.className='present'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','وضع العرض: '+title);
  el.innerHTML='<div class="pr-top"><span class="pr-title">'+esc(title)+'</span><span class="pr-n" id="prN"></span><button type="button" class="pr-x" data-pr="x" aria-label="أغلقوا العرض">✕</button></div>'+
    '<div class="pr-stage xp" id="prStage"></div>'+
    '<div class="pr-bar"><button type="button" class="btn ghost" data-pr="prev">السابق</button><button type="button" class="btn" data-pr="auto" id="prAuto">'+ICON.play+' عرضٌ متتابع</button><button type="button" class="btn ghost" data-pr="next">التالي</button></div>';
  document.getElementById('app').appendChild(el);
  PR={el:el,s:slides,i:0,auto:false,t:0,a:null};
  el.addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('[data-pr]');if(!b) return;var v=b.dataset.pr;
    if(v==='x') presentClose(); else if(v==='next') prGo(PR.i+1); else if(v==='prev') prGo(PR.i-1); else if(v==='auto'){PR.auto=!PR.auto;prGo(PR.i);}});
  document.addEventListener('keydown',prKey);
  try{ if(el.requestFullscreen) el.requestFullscreen().catch(function(){}); }catch(e){}
  prGo(0);
}
function prKey(e){ if(!PR) return; if(e.key==='Escape') presentClose(); else if(e.key==='ArrowLeft'||e.key===' ') {e.preventDefault();prGo(PR.i+1);} else if(e.key==='ArrowRight') prGo(PR.i-1); }
function prGo(i){
  if(!PR) return; clearTimeout(PR.t); if(PR.a){try{PR.a.pause();}catch(e){}}
  if(i>=PR.s.length){ if(PR.auto){PR.auto=false;} i=PR.s.length-1; }
  if(i<0) i=0; PR.i=i;
  var st=PR.el.querySelector('#prStage'); st.innerHTML=G(PR.s[i].html); hydrate(st); st.scrollTop=0;
  PR.el.querySelector('#prN').textContent=n2a(i+1)+' / '+n2a(PR.s.length);
  var ab=PR.el.querySelector('#prAuto'); ab.innerHTML=(PR.auto?ICON.pause+' إيقاف':ICON.play+' عرضٌ متتابع'); ab.classList.toggle('on',PR.auto);
  if(PR.auto){
    var a=st.querySelector('audio');
    if(a){ PR.a=a; setTimeout(function(){ if(!PR||PR.a!==a) return; var p=a.play(); if(p&&p.catch) p.catch(function(){}); a.onended=function(){ if(PR&&PR.auto) PR.t=setTimeout(function(){prGo(PR.i+1);},1500); }; },500); }
    else PR.t=setTimeout(function(){prGo(PR.i+1);},PR.s[i].wait||9000);
  }
}
function presentClose(){
  if(!PR) return; clearTimeout(PR.t); if(PR.a){try{PR.a.pause();}catch(e){}}
  try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){}
  document.removeEventListener('keydown',prKey); PR.el.remove(); PR=null;
}
function presentMag(id){
  var m=magById(id); if(!m) return; var items=magItems(m), ed=kidById(m.editor);
  var slides=[{html:'<div class="mz pr-cover" style="--mz:var(--'+magColor(m.name)+')"><header class="mz-cover"><div class="mz-band"></div><p class="mz-kicker">مجلةٌ يصنعها الأطفال</p><h1 class="mz-name">'+esc(m.name)+'</h1><p class="mz-no">العدد '+n2a(m.no)+'</p>'+(m.title?'<p class="mz-title">'+esc(m.title)+'</p>':'')+
    (ed?'<p class="mz-ed">'+Gx('⟨رئيس|رئيسة⟩ التحرير: ',gOf(ed))+esc(ed.name)+'</p>':'')+'</header></div>',wait:6000}];
  SEC_ORDER.forEach(function(s){ items.filter(function(i){return i.sec===s;}).forEach(function(i){
    slides.push({html:'<div class="mz" style="--mz:var(--'+magColor(m.name)+')"><p class="pr-sec">'+TYPES[s].n+'</p><div class="mz-item"><h3 class="mz-it">'+esc(titleOf(i.w))+'</h3><p class="mz-byline">'+esc(i.name)+(i.ext?' <span class="mz-guest">ضيف العدد</span>':'')+'</p>'+
      itemBody(i.w,{media:'src',author:i.kid,ext:i.ext})+'</div></div>'});
  });});
  presentOpen(slides,'«'+m.name+'» العدد '+n2a(m.no));
}
function presentRadio(){
  var list=radioList(); if(!list.length) return;
  presentOpen(list.map(function(x){return {html:'<div class="pr-radio">'+(x.k?avatarHTML(x.k,'l'):'')+'<p class="pr-rt">'+esc(x.t)+'</p><p class="muted">'+esc(x.by)+' · '+x.ty+'</p><audio controls preload="none" data-src="'+x.key+'"></audio></div>'};}),'إذاعة الباكورة');
}
