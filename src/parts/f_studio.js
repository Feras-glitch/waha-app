/* ================= studio: works, recorder, drawing ================= */
/* sec = magazine section order (0 = not a magazine section). a = audio: req | opt | none.
   rub = reading rubric applies (مخارج، حركات، تنغيم). */
var TYPES={
  kalima:{n:'كلمة العدد',sec:1,c:'lapis',ic:'pen',a:'opt',
    d:'افتتاحية المجلة: ⟨رحّب|رحّبي⟩ بالقرّاء، ⟨وقل|وقولي⟩ لهم ما في هذا العدد ولماذا ⟨اخترته|اخترتِه⟩.'},
  lamsa:{n:'لمسة العدد',sec:2,c:'lapis',ic:'lens',a:'req',rub:1,
    d:'⟨اختر|اختاري⟩ درسًا ⟨تعلّمته|تعلّمتِه⟩، ⟨واقرأ|واقرئي⟩ آيته بصوتك، ثم ⟨اشرح|اشرحي⟩ لمسته بكلماتك.'},
  twins:{n:'توأمان من اكتشافي',sec:3,c:'teal',ic:'twins',a:'opt',
    d:'كلمتان متقاربتان ⟨اكتشفتَ|اكتشفتِ⟩ الفرق بينهما، كالغيث والمطر.'},
  story:{n:'حكاية بصوتي',sec:4,c:'rose',ic:'mic',a:'req',
    d:'⟨احكِ|احكي⟩ حكايةً ⟨تحبّها|تحبّينها⟩ أو ⟨اخترعها|اخترعيها⟩، ⟨وسجّلها|وسجّليها⟩ بصوتك.'},
  hikma:{n:'بيتٌ وحكمة',sec:5,c:'plum',ic:'quote',a:'req',rub:1,
    d:'بيتٌ من الشعر أو حكمةٌ ⟨تحفظها|تحفظينها⟩: ⟨اكتبها|اكتبيها⟩، ⟨وألقِها|وألقيها⟩ بصوتك.'},
  draw:{n:'رسمتي',sec:6,c:'gold',ic:'brush',a:'none',
    d:'⟨ارسم|ارسمي⟩ هنا بإصبعك، أو ⟨صوّر|صوّري⟩ رسمتك الورقية.'},
  grandma:{n:'كلمات جدّتي',sec:7,c:'olive',ic:'talk',a:'req',
    d:'⟨حاور|حاوري⟩ جدّتك أو جدّك أو أحد كبار العائلة عن كلمةٍ قديمة أو مثلٍ أو لعبة، ⟨وسجّل|وسجّلي⟩ الحوار بإذنه.'},
  riddle:{n:'لغز العدد',sec:8,c:'rose',ic:'q',a:'none',
    d:'لغزٌ لغويّ ⟨تتحدّى|تتحدّين⟩ به القرّاء، وحلّه مخفيٌّ في آخره.'},
  read:{n:'قراءتي',sec:0,c:'teal',ic:'book',a:'req',rub:1,
    d:'⟨اقرأ|اقرئي⟩ آياتٍ من دروسك أو نصًّا ⟨تختاره|تختارينه⟩. يسمعك وليّ أمرك، ⟨وترى|وترين⟩ تقدّمك بين «قبل» و«بعد».'},
  gift:{n:'رسالةٌ مُهداة',sec:0,c:'gold',ic:'gift',a:'req',
    d:'رسالةٌ بصوتك إلى مَن ⟨تحبّ|تحبّين⟩: جدّتك، أو ⟨صديقك|صديقتكِ⟩، أو ⟨معلّمك|معلّمتكِ⟩. يُرسلها وليّ أمرك بعد موافقته.'}
};
var SEC_ORDER=['kalima','lamsa','twins','story','hikma','draw','grandma','riddle'];
var OCC=['شكر','تهنئة','اشتياق','عيد','تشجيع','دعاء'];
var CARDS=[['lapis','لازورد'],['gold','ذهب'],['teal','فيروز'],['rose','ورد']];
var MAXREC={story:420,grandma:480,gift:150,kalima:240};
function typeOf(w){return TYPES[w&&w.type]||TYPES.story;}
function titleOf(w){var l=w.lesson&&lessonById[w.lesson];if(w.type==='read'&&w.src==='pair'&&pairById[w.pair]) return 'مختبر الحروف: '+pairById[w.pair].t;return w.title||(w.type==='twins'&&w.w1&&w.w2?w.w1+' و'+w.w2:'')||(w.type==='lamsa'&&l?plain(Gx(l.title,0)):'')||(w.type==='read'&&w.src!=='text'&&l?'قراءة «'+plain(Gx(l.title,0))+'»':'')||(w.type==='gift'&&w.to?'إلى '+w.to:'')||typeOf(w).n;}
function readWord(n){return n===2?'قراءتان':(n<=10?n2a(n)+' قراءات':n2a(n)+' قراءة');}

var ST_LBL={draft:'مسوّدة',sent:'عند وليّ أمرك',returned:'عاد بملاحظة',approved:'معتمَد'};
var ST_CLS={draft:'st-none',sent:'st-mid',returned:'st-low',approved:'st-ok'};
function statusChip(w,parent){
  var t=parent?{draft:'مسوّدة',sent:'بانتظار مراجعتكم',returned:'أُعيد بملاحظة',approved:'معتمَد'}[w.status]:ST_LBL[w.status];
  var h='<span class="state '+(ST_CLS[w.status]||'st-none')+'">'+(t||w.status)+'</span>';
  if(w.teacher) h+=' <span class="state '+(w.teacher.st==='ok'?'st-ok':w.teacher.st==='fix'?'st-low':'st-mid')+'">'+(w.teacher.st==='ok'?'اعتمده المعلّم':w.teacher.st==='fix'?'ملاحظة المعلّم':'عند المعلّم')+'</span>';
  return h;
}
function newWork(type,extra){
  var w={id:uid('w'),kid:KID.id,type:type,title:'',text:'',status:'draft',notes:[],pub:{fam:true,mag:true},log:[],created:Date.now(),updated:Date.now()};
  if(type==='gift'){w.card='gold';w.occ='شكر';}
  if(type==='read') w.src='lesson';
  if(extra) Object.keys(extra).forEach(function(k){w[k]=extra[k];});
  WORKS.unshift(w); saveWorks(); return w;
}
function isEmptyWork(w){return w.status==='draft'&&!w.audio&&!w.image&&!(w.text||'').trim()&&!(w.title||'').trim()&&!(w.w1||w.w2||w.q||w.ans||w.to||'').trim()&&!(w.type==='lamsa'&&w.lesson);}
function pruneEmpty(){var n=WORKS.length;WORKS=WORKS.filter(function(w){return !(isEmptyWork(w)&&Date.now()-w.created>2000&&(!CUR||CUR.id!==w.id)&&!(REC.mr&&REC.wid===w.id));});if(WORKS.length!==n) saveWorks();}
async function deleteWork(w){
  if(w.audio) await blobDel(w.audio); if(w.image) await blobDel(w.image);
  WORKS=WORKS.filter(function(x){return x.id!==w.id;});
  FAM.mags.forEach(function(m){m.items=(m.items||[]).filter(function(it){return it.w!==w.id;});});
  Object.keys(FAM.weekly).forEach(function(k){if(FAM.weekly[k].work===w.id) delete FAM.weekly[k];});
  saveWorks(); saveFam();
}

/* ---------- studio ---------- */
function studio(){
  L=null; CUR=null;
  function card(t){var T=TYPES[t];return '<button class="tcard" type="button" data-act="newWork" data-v="'+t+'" style="--ax:var(--'+T.c+')"><span class="ch-ico">'+ICON[T.ic]+'</span><span class="door-t">'+T.n+'</span><span class="door-d">'+T.d+'</span></button>';}
  go('<div class="ax-page" style="--ax:var(--rose)"><button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">استوديو الباكورة</h1>'+
    '<p class="lead">⟨اختر|اختاري⟩ ما ⟨تصنعه|تصنعينه⟩ اليوم. كلّ عملٍ يُحفظ على هذا الجهاز، ثم ⟨ترسله|ترسلينه⟩ إلى وليّ أمرك ليعتمده.</p></header>'+
    '<section><h2 class="h2">أبواب المجلة</h2><div class="tcards">'+SEC_ORDER.map(card).join('')+'</div></section>'+
    '<section><h2 class="h2">⟨لنفسك|لنفسكِ⟩ ولمن ⟨تحبّ|تحبّين⟩</h2><div class="tcards">'+card('read')+'<button class="tcard" type="button" data-act="lab" style="--ax:var(--teal)"><span class="ch-ico pair-ico">ث<i>/</i>س</span><span class="door-t">مختبر الحروف</span><span class="door-d">حروفٌ متقاربة تخلطها لهجة البيت: ⟨اقرأ|اقرئي⟩ كلماتها ⟨وأتقن|وأتقني⟩ مخارجها.</span></button>'+card('gift')+'</div></section>'+
    '<aside class="didyou"><span class="eyebrow">قبل أن ⟨تسجّل|تسجّلي⟩</span><p>⟨اختر|اختاري⟩ مكانًا هادئًا، ⟨واقترب|واقتربي⟩ من الجهاز قليلًا، ⟨وتنفّس|وتنفّسي⟩ بهدوء قبل أن ⟨تبدأ|تبدئي⟩. ⟨وتستطيع|وتستطيعين⟩ أن ⟨تعيد|تعيدي⟩ التسجيل كما ⟨تشاء|تشائين⟩.</p></aside></div>');
}

/* ---------- my works ---------- */
var WFILTER='all';
function worksView(f){
  L=null; CUR=null; if(f) WFILTER=f; pruneEmpty();
  var mine=WORKS.filter(function(w){return w.kid===KID.id;});
  var tabs=[['all','الكلّ'],['draft','مسوّدات'],['sent','عند وليّ أمري'],['returned','عادت بملاحظة'],['approved','معتمدة']];
  var list=mine.filter(function(w){return WFILTER==='all'||w.status===WFILTER;});
  var ba=baGroups(KID.id);
  go('<div class="ax-page" style="--ax:var(--teal)"><button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">أعمالي</h1><p class="lead">هنا كلّ ما ⟨صنعتَه|صنعتِه⟩. المسوّدة ⟨تعدّلها|تعدّلينها⟩ متى ⟨شئت|شئتِ⟩، وما ⟨أرسلته|أرسلتِه⟩ ينتظر وليّ أمرك.</p></header>'+
    '<div class="seg wrap-seg" role="tablist">'+tabs.map(function(t){var n=t[0]==='all'?mine.length:mine.filter(function(w){return w.status===t[0];}).length;
      return '<button type="button" role="tab" aria-selected="'+(WFILTER===t[0])+'" class="'+(WFILTER===t[0]?'on':'')+'" data-act="works" data-v="'+t[0]+'">'+t[1]+(n?' · '+n2a(n):'')+'</button>';}).join('')+'</div>'+
    (list.length?'<ul class="wlist">'+list.map(workRow).join('')+'</ul>':
      '<div class="empty"><p>'+(mine.length?'لا أعمال هنا الآن.':'لم ⟨تصنع|تصنعي⟩ عملًا بعد.')+'</p><button class="btn" type="button" data-act="studio">'+ICON.plus+' ⟨اصنع|اصنعي⟩ عملًا</button></div>')+
    (ba.length?'<section><h2 class="h2">قبل وبعد</h2><p class="lead" style="margin:0 0 12px">⟨استمع|استمعي⟩ إلى أول قراءةٍ ⟨لك|لكِ⟩ وآخر قراءةٍ للنصّ نفسه: هل ⟨تسمع|تسمعين⟩ الفرق؟</p>'+ba.map(baCard).join('')+'</section>':'')+
    '</div>');
}
function workRow(w){
  var T=typeOf(w), note=w.status==='returned'&&w.notes.length?w.notes[w.notes.length-1]:null;
  return '<li><button class="wrow" type="button" data-act="openWork" data-id="'+w.id+'" style="--ax:var(--'+T.c+')">'+
    '<span class="ch-ico">'+ICON[T.ic]+'</span><span class="wr-main"><span class="wr-t">'+esc(clip(titleOf(w),60))+'</span>'+
    '<span class="wr-s">'+T.n+' · '+fmtDate(w.updated)+(w.audio?' · '+ICON.mic.replace('<svg','<svg class="ic-s"')+' '+fmtDur(w.dur):'')+'</span>'+
    (note?'<span class="wr-note">«'+esc(clip(note.t,80))+'»</span>':'')+'</span>'+
    '<span class="wr-st">'+statusChip(w)+'</span></button></li>';
}
function openWork(id){
  var w=workById(id); if(!w) return worksView();
  if(w.kid!==(KID&&KID.id)){var k=kidById(w.kid); if(k) selectKid(k.id);}
  if(w.status==='draft'||w.status==='returned') return workEdit(id);
  if(w.status==='approved'&&!w.seen){w.seen=true;saveWorks();}
  workView(id);
}

/* ---------- before / after ---------- */
function refOf(w){
  if(w.type==='lamsa'&&w.lesson) return 'L:'+w.lesson;
  if(w.type==='read'){ if(w.src==='pair'&&w.pair) return 'P:'+w.pair; if(w.src==='lesson'&&w.lesson) return 'L:'+w.lesson; if(w.src==='text'&&norm(w.text)) return 'T:'+hashStr(norm(w.text)).toString(36); }
  if(w.type==='hikma'&&norm(w.text)) return 'T:'+hashStr(norm(w.text)).toString(36);
  return '';
}
function baGroups(kidId){
  var g={};
  WORKS.forEach(function(w){ if(w.kid!==kidId||!w.audio||!TYPES[w.type].rub) return; var r=refOf(w); if(!r) return; (g[r]=g[r]||[]).push(w); });
  return Object.keys(g).filter(function(k){return g[k].length>1;}).map(function(k){var a=g[k].slice().sort(function(x,y){return x.created-y.created;});return {ref:k,first:a[0],last:a[a.length-1],n:a.length};});
}
function rubTotal(r){return r?((r.m||0)+(r.h||0)+(r.t||0)):0;}
function baCard(b){
  var lab=b.ref.charAt(0)==='P'&&pairById[b.ref.slice(2)]?'مختبر الحروف: '+pairById[b.ref.slice(2)].t:b.ref.charAt(0)==='L'&&lessonById[b.ref.slice(2)]?plain(Gx(lessonById[b.ref.slice(2)].title,0)):clip(b.first.text,50);
  function side(w,t){var r=w.rubric||w.trub; return '<div class="ba-side"><span class="eyebrow">'+t+' · '+fmtDate(w.created)+'</span><audio controls preload="none" data-src="'+w.audio+'"></audio>'+
    (r?'<span class="ba-r">'+rubStars(r)+'</span>':'')+'</div>';}
  return '<div class="ba"><p class="ba-t">'+esc(lab)+' <span class="muted">· '+readWord(b.n)+'</span></p><div class="ba-row">'+side(b.first,'قبل')+side(b.last,'بعد')+'</div></div>';
}
var RUB=[['m','مخارج الحروف'],['h','الحركات والضبط'],['t','التنغيم والوقف']];
var RUBV=['','يحتاج تدريبًا','جيّد','متقن'];
function rubStars(r){return RUB.map(function(x){var v=r[x[0]]||0;return '<span class="rs" title="'+x[1]+': '+(RUBV[v]||'—')+'">'+x[1]+' '+('★★★'.slice(0,v))+'<i>'+('★★★'.slice(v))+'</i></span>';}).join('');}

/* ---------- editor ---------- */
var CUR=null, SAVE_T=0;
function workEdit(id){
  var w=workById(id); if(!w) return worksView();
  CUR=w; L=null;
  var T=typeOf(w), locked=!(w.status==='draft'||w.status==='returned');
  if(locked) return workView(id);
  var notes=w.notes.length?'<section class="notes">'+w.notes.slice().reverse().map(noteHTML).join('')+'</section>':'';
  go('<div class="ax-page editor" style="--ax:var(--'+T.c+')"><button class="back" type="button" data-act="works">'+BACK+' أعمالي</button>'+
    '<header class="page-head"><span class="eyebrow">'+statusChip(w)+'</span><h1 class="h1">'+T.n+'</h1><p class="lead">'+T.d+'</p></header>'+
    notes+
    '<div class="form" id="wform">'+fieldsHTML(w)+'</div>'+
    '<p class="saved" id="wSaved" aria-live="polite"></p>'+
    '<p class="form-err" id="wErr" role="alert"></p>'+
    '<div class="actions sticky-actions"><button class="btn" type="button" data-act="submitWork">'+ICON.check+' ⟨أرسله|أرسليه⟩ إلى وليّ أمري</button>'+
      '<button class="btn ghost" type="button" data-act="works">احفظه مسوّدة</button>'+
      '<button class="btn ghost danger-ghost" type="button" data-act="delWork">'+ICON.trash+' احذف</button></div></div>');
  if(w.type==='draw') drawInit(w);
}
function noteHTML(n){
  return '<div class="note '+(n.by==='t'?'note-t':'note-p')+'"><span class="eyebrow">'+(n.by==='t'?'ملاحظة '+(n.name?esc(n.name):'المعلّم'):'ملاحظة وليّ أمرك')+' · '+fmtDate(n.d)+'</span>'+
    (n.t?'<p>'+esc(n.t).replace(/\n/g,'<br>')+'</p>':'')+(n.r?'<p class="rub-line">'+rubStars(n.r)+'</p>':'')+'</div>';
}
function fld(id,label,html){return '<label for="'+id+'">'+label+'</label>'+html;}
function inp(w,k,ph,max){return '<input id="f-'+k+'" data-wf="'+k+'" maxlength="'+(max||80)+'" value="'+escA(w[k]||'')+'" placeholder="'+escA(ph||'')+'">';}
function txa(w,k,ph,rows){return '<textarea id="f-'+k+'" data-wf="'+k+'" rows="'+(rows||5)+'" maxlength="4000" placeholder="'+escA(ph||'')+'">'+esc(w[k]||'')+'</textarea>';}
function lessonSelect(w){
  return '<select id="f-lesson" data-wf="lesson"><option value="">— ⟨اختر|اختاري⟩ درسًا —</option>'+AXES.map(function(a){
    return '<optgroup label="'+escA(a.name)+'">'+LESSONS.filter(function(l){return l.ax===a.id;}).map(function(l){
      return '<option value="'+l.id+'"'+(w.lesson===l.id?' selected':'')+'>'+(prog[l.id]?'✓ ':'')+plain(l.title)+'</option>';}).join('')+'</optgroup>';}).join('')+'</select>';
}
function lessonVerses(id){var l=lessonById[id];return l?'<div class="read-src" id="readSrc">'+l.verses.map(verse).join('')+'</div>':'<div id="readSrc"></div>';}
function fieldsHTML(w){
  var t=w.type, h='';
  var title=fld('f-title','العنوان',inp(w,'title',{kalima:'مثلًا: أهلًا بالشتاء',story:'اسم الحكاية',hikma:'مثلًا: بيتٌ في طلب العلم',draw:'اسم الرسمة',grandma:'مثلًا: لعبةٌ من أيام جدّتي',riddle:'مثلًا: لغز النقطة',read:'مثلًا: قراءة سورة الضحى',gift:'مثلًا: شكرًا يا جدّتي',twins:'',lamsa:''}[t]||'',60));
  if(t==='kalima') h=title+fld('f-text','كلمتك',txa(w,'text','⟨اكتب|اكتبي⟩ كلمة العدد…',7))+recBlock(w,'⟨اقرأ|اقرئي⟩ كلمتك بصوتك (اختياري)');
  else if(t==='lamsa') h=fld('f-lesson','الدرس',lessonSelect(w))+lessonVerses(w.lesson)+recBlock(w,'⟨اقرأ|اقرئي⟩ الآية بصوتك')+fld('f-text','اللمسة بكلماتك',txa(w,'text','ما السرّ الذي ⟨اكتشفته|اكتشفتِه⟩ في هذه الآية؟ ⟨اشرحه|اشرحيه⟩ ⟨لقرّائك|لقرّائكِ⟩…',6));
  else if(t==='twins') h='<div class="two">'+'<div>'+fld('f-w1','الكلمة الأولى',inp(w,'w1','غيث',24))+'</div><div>'+fld('f-w2','الكلمة الثانية',inp(w,'w2','مطر',24))+'</div></div>'+
    fld('f-text','ما الفرق بينهما؟',txa(w,'text','⟨اكتب|اكتبي⟩ الفرق، ومثالًا لكلّ كلمة…',6))+recBlock(w,'⟨اشرح|اشرحي⟩ بصوتك (اختياري)');
  else if(t==='story') h=title+recBlock(w,'⟨احكِ|احكي⟩ حكايتك')+fld('f-text','نصّ الحكاية أو ملخّصها (اختياري)',txa(w,'text','',5));
  else if(t==='hikma') h=title+fld('f-text','البيت أو الحكمة',txa(w,'text','⟨اكتب|اكتبي⟩ البيت في سطرين، أو الحكمة في سطر',3))+fld('f-who','القائل أو المصدر',inp(w,'who','مثلًا: المتنبي، أو مثلٌ عربي',60))+recBlock(w,'⟨ألقِه|ألقيه⟩ بصوتك');
  else if(t==='draw') h=title+drawHTML(w)+fld('f-text','عن رسمتي',txa(w,'text','ماذا ⟨رسمت|رسمتِ⟩؟ وما الكلمة التي ⟨ألهمتك|ألهمتكِ⟩؟',3));
  else if(t==='grandma') h='<div class="tip"><strong>قبل التسجيل:</strong> ⟨استأذن|استأذني⟩ مَن ⟨تحاوره|تحاورينه⟩، ⟨وأخبره|وأخبريه⟩ أن التسجيل لمجلّة العائلة. أسئلةٌ ⟨تبدأ|تبدئين⟩ بها: كلمةٌ قديمة ومعناها؟ مثلٌ شعبيّ وقصّته؟ لعبةٌ من أيام الطفولة واسمها؟ نصيحةٌ للأحفاد؟</div>'+
    title+fld('f-who','مع مَن الحوار؟',inp(w,'who','مثلًا: جدّتي أم محمد',40))+recBlock(w,'⟨سجّل|سجّلي⟩ الحوار')+fld('f-text','ماذا ⟨تعلّمت|تعلّمتِ⟩ من الحوار؟',txa(w,'text','',4));
  else if(t==='riddle') h='<span class="lbl">أفكارٌ ⟨تبدأ|تبدئين⟩ بها</span><div class="chips-row">'+RIDDLE_IDEAS.map(function(x,i){return '<button type="button" class="qchip" data-act="rdIdea" data-v="'+i+'">'+x[0]+'</button>';}).join('')+'</div>'+
    title+fld('f-q','اللغز',txa(w,'q','⟨اكتب|اكتبي⟩ سؤال اللغز…',3))+fld('f-ans','الجواب الصحيح',inp(w,'ans','',80))+
    '<span class="lbl">خياران خاطئان (اختياريان: إن ⟨كتبتهما|كتبتِهما⟩ صار اللغز اختيارًا من متعدّد)</span><div class="two"><div><input data-wf="o1" maxlength="60" aria-label="خيارٌ خاطئ أول" placeholder="خيارٌ خاطئ" value="'+escA(w.o1||'')+'"></div><div><input data-wf="o2" maxlength="60" aria-label="خيارٌ خاطئ ثانٍ" placeholder="خيارٌ خاطئ آخر" value="'+escA(w.o2||'')+'"></div></div>'+
    fld('f-hint','تلميح (اختياري)',inp(w,'hint','',80))+fld('f-why','لماذا هذا هو الجواب؟ (اختياري، يظهر بعد الحلّ)',txa(w,'why','',2));
  else if(t==='read'&&w.src==='pair'&&pairById[w.pair]) h='<p class="lead">⟨اقرأ|اقرئي⟩ كلّ صفّ: الكلمة، ثم أختها، ⟨وتمهّل|وتمهّلي⟩ عند الحرف المختلف.</p>'+pairTable(pairById[w.pair])+recBlock(w,'⟨اقرأ|اقرئي⟩ الكلمات بصوتك');
  else if(t==='read') h=title+'<span class="lbl">ماذا ⟨ستقرأ|ستقرئين⟩؟</span><div class="seg"><button type="button" data-act="readSrc" data-v="lesson" class="'+(w.src!=='text'?'on':'')+'">آياتٌ من درس</button><button type="button" data-act="readSrc" data-v="text" class="'+(w.src==='text'?'on':'')+'">نصٌّ من اختياري</button></div>'+
    (w.src==='text'?fld('f-text','النصّ',txa(w,'text','⟨اكتب|اكتبي⟩ أو ⟨الصق|الصقي⟩ النصّ الذي ⟨ستقرؤه|ستقرئينه⟩',4))+'<div class="read-big" id="readBig">'+nl2p(w.text)+'</div>':fld('f-lesson','الدرس',lessonSelect(w))+lessonVerses(w.lesson))+
    recBlock(w,'⟨اقرأ|اقرئي⟩ بصوتك');
  else if(t==='gift') h=fld('f-to','إلى مَن؟',inp(w,'to','مثلًا: جدّتي الحبيبة',40))+
    '<span class="lbl">المناسبة</span><div class="seg wrap-seg">'+OCC.map(function(o){return '<button type="button" data-act="giftOcc" data-v="'+o+'" class="'+(w.occ===o?'on':'')+'">'+o+'</button>';}).join('')+'</div>'+
    '<span class="lbl">لون البطاقة</span><div class="sw-pick">'+CARDS.map(function(c){return '<button type="button" class="sw'+(w.card===c[0]?' on':'')+'" style="--avc:var(--'+c[0]+')" data-act="giftCard" data-v="'+c[0]+'" aria-label="'+c[1]+'"></button>';}).join('')+'</div>'+
    fld('f-text','كلماتٌ مكتوبة على البطاقة',txa(w,'text','',3))+recBlock(w,'⟨سجّل|سجّلي⟩ رسالتك');
  return h;
}

/* ---------- autosave ---------- */
function onWorkField(el){
  if(!CUR) return; var k=el.dataset.wf; if(!k) return;
  var v=el.value; if(k==='lesson'&&v&&!lessonById[v]) v='';
  CUR[k]=v; CUR.updated=Date.now();
  if(k==='lesson'){ var rs=document.getElementById('readSrc'); if(rs){rs.outerHTML=G(lessonVerses(v));} }
  if(k==='text'&&CUR.type==='read'){ var rb=document.getElementById('readBig'); if(rb) rb.innerHTML=nl2p(v); }
  clearTimeout(SAVE_T); SAVE_T=setTimeout(function(){ if(saveWorks()){var s=document.getElementById('wSaved'); if(s) s.textContent='حُفظ تلقائيًّا.';} },400);
}
function missingFor(w){
  var t=w.type, T=TYPES[t];
  if(T.a==='req'&&!w.audio) return '⟨سجّل|سجّلي⟩ صوتك أولًا.';
  if(t==='kalima'&&!(w.text||'').trim()) return '⟨اكتب|اكتبي⟩ كلمة العدد أولًا.';
  if(t==='lamsa'&&!w.lesson) return '⟨اختر|اختاري⟩ الدرس أولًا.';
  if(t==='lamsa'&&!(w.text||'').trim()) return '⟨اشرح|اشرحي⟩ اللمسة بكلماتك.';
  if(t==='twins'&&(!(w.w1||'').trim()||!(w.w2||'').trim()||!(w.text||'').trim())) return '⟨اكتب|اكتبي⟩ الكلمتين والفرق بينهما.';
  if(t==='hikma'&&!(w.text||'').trim()) return '⟨اكتب|اكتبي⟩ البيت أو الحكمة.';
  if(t==='draw'&&!w.image) return '⟨ارسم|ارسمي⟩ أو ⟨صوّر|صوّري⟩ رسمتك أولًا.';
  if(t==='riddle'&&(!(w.q||'').trim()||!(w.ans||'').trim())) return '⟨اكتب|اكتبي⟩ اللغز وجوابه الصحيح.';
  if(t==='riddle'&&riddleOpts(w).some(function(x){return norm(x)===norm(w.ans);})) return 'أحد الخيارات الخاطئة يشبه الجواب الصحيح، ⟨فغيّره|فغيّريه⟩.';
  if(t==='read'&&w.src==='lesson'&&!w.lesson) return '⟨اختر|اختاري⟩ الدرس أولًا.';
  if(t==='read'&&w.src==='text'&&!(w.text||'').trim()) return '⟨اكتب|اكتبي⟩ النصّ الذي ⟨قرأته|قرأتِه⟩.';
  if(t==='gift'&&!(w.to||'').trim()) return '⟨اكتب|اكتبي⟩ اسم مَن ⟨ستهديه|ستهدينه⟩ الرسالة.';
  if(t==='grandma'&&!(w.who||'').trim()) return '⟨اكتب|اكتبي⟩ مع مَن كان الحوار.';
  return '';
}
async function submitWork(){
  var w=CUR; if(!w) return;
  if(REC.mr) return toast('⟨أوقف|أوقفي⟩ التسجيل أولًا.');
  if(w.type==='draw'&&DR.dirty) await drawSave();
  var m=missingFor(w), e=document.getElementById('wErr');
  if(m){ if(e) e.textContent=G(m); return; }
  w.status='sent'; w.sentAt=Date.now(); w.updated=Date.now(); w.seen=false; saveWorks();
  toast('⟨أرسلتَ|أرسلتِ⟩ «'+clip(titleOf(w),30)+'» إلى وليّ أمرك.');
  CUR=null; worksView('sent');
}
async function delWork(){
  var w=CUR; if(!w) return;
  var ok=await ask({title:'حذف هذا العمل؟',c:'rose',ok:'احذفه',danger:1,html:'<p>سيُحذف «'+esc(titleOf(w))+'» وتسجيله ورسمته من هذا الجهاز.</p>'});
  if(!ok) return; recDiscard(); await deleteWork(w); CUR=null; toast('حُذف العمل.'); worksView();
}

/* ---------- read-only view (child) ---------- */
function workView(id){
  var w=workById(id); if(!w) return worksView(); CUR=null; L=null;
  var T=typeOf(w), ba=baGroups(w.kid).filter(function(b){return b.last.id===w.id||b.first.id===w.id;})[0];
  var msg={sent:'⟨أرسلتَ|أرسلتِ⟩ هذا العمل إلى وليّ أمرك، وهو ينتظر مراجعته. لا ⟨تستطيع|تستطيعين⟩ تعديله الآن.',approved:'اعتمد وليّ أمرك هذا العمل. '+(w.pub&&w.pub.mag&&T.sec?'⟨ويمكنك|ويمكنكِ⟩ إضافته إلى مجلة.':'')}[w.status]||'';
  go('<div class="ax-page" style="--ax:var(--'+T.c+')"><button class="back" type="button" data-act="works">'+BACK+' أعمالي</button>'+
    '<header class="page-head"><span class="eyebrow">'+T.n+' · '+statusChip(w)+'</span><h1 class="h1">'+esc(titleOf(w))+'</h1>'+(msg?'<p class="lead">'+msg+'</p>':'')+'</header>'+
    '<div class="xp">'+itemBody(w,{media:'src',author:KID})+'</div>'+
    (w.notes.length?'<section class="notes">'+w.notes.slice().reverse().map(noteHTML).join('')+'</section>':'')+
    (ba?'<section><h2 class="h2">قبل وبعد</h2>'+baCard(ba)+'</section>':'')+
    (w.status==='approved'&&T.sec&&w.pub&&w.pub.mag?'<div class="actions"><button class="btn" type="button" data-act="mags">'+ICON.mag+' إلى مجلّاتنا</button></div>':'')+
  '</div>');
}

/* ---------- recorder ---------- */
var REC={mr:null,stream:null,chunks:[],t0:0,timer:0,raf:0,ctx:null,wid:null,discard:false,max:300,label:''};
function canRecord(){return !!(window.isSecureContext!==false&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);}
function pickMime(){var c=['audio/mp4;codecs=mp4a.40.2','audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus','audio/aac'];for(var i=0;i<c.length;i++){try{if(MediaRecorder.isTypeSupported(c[i])) return c[i];}catch(e){}}return '';}
function recBlock(w,label){REC.label=label;return '<span class="lbl">'+label+'</span><div class="rec" id="recBox">'+recInner(w)+'</div>';}
function recInner(w){
  var rec=REC.mr&&REC.wid===w.id;
  if(rec) return '<div class="rec-on"><button class="rec-btn on" type="button" data-act="recStop" aria-label="أوقف التسجيل">'+ICON.stop+'</button>'+
    '<div class="rec-mid"><span class="rec-live"><i></i>يسجّل الآن</span><span class="rec-t" id="recT">٠:٠٠</span><span class="meter" id="recMeter">'+new Array(16).join('<i></i>')+'</span></div></div>'+
    '<p class="rec-hint">'+'⟨تكلّم|تكلّمي⟩ بوضوح. ⟨اضغط|اضغطي⟩ المربّع حين ⟨تنتهي|تنتهين⟩.'+'</p>';
  var h='';
  if(w.audio) h+='<div class="rec-done"><audio controls preload="metadata" data-src="'+w.audio+'"></audio><span class="rec-d">'+fmtDur(w.dur)+'</span></div>'+
    '<div class="actions"><button class="btn ghost" type="button" data-act="recStart">'+ICON.mic+' ⟨أعِد|أعيدي⟩ التسجيل</button><button class="btn ghost danger-ghost" type="button" data-act="recDel">'+ICON.trash+' احذف التسجيل</button></div>';
  else if(canRecord()) h+='<div class="rec-idle"><button class="rec-btn" type="button" data-act="recStart" aria-label="ابدأ التسجيل">'+ICON.mic+'</button><span class="rec-cta">⟨اضغط|اضغطي⟩ ⟨لتبدأ|لتبدئي⟩ التسجيل</span></div>';
  if(!canRecord()) h+='<p class="rec-hint">'+(window.isSecureContext===false?'التسجيل المباشر يحتاج فتح التطبيق من رابطه الآمن (https). ':'هذا المتصفح لا يدعم التسجيل المباشر. ')+'⟨استعمل|استعملي⟩ تطبيق التسجيل في الجهاز:</p>';
  h+='<label class="link small file-link">'+(canRecord()?'أو ⟨سجّل|سجّلي⟩ بتطبيق الجهاز / ⟨اختر|اختاري⟩ ملفًّا صوتيًّا':'⟨سجّل|سجّلي⟩ بتطبيق الجهاز')+'<input type="file" accept="audio/*" capture data-file="audio" hidden></label>';
  h+='<p class="rec-msg" id="recMsg" role="alert"></p>';
  return h;
}
function renderRec(){var b=document.getElementById('recBox'); if(b&&CUR){b.innerHTML=G(recInner(CUR));hydrate(b);}}
function recMsg(m){var e=document.getElementById('recMsg'); if(e) e.textContent=G(m); else toast(m);}
async function recStart(){
  var w=CUR; if(!w||REC.mr) return;
  if(!canRecord()) return recMsg('التسجيل المباشر غير متاح هنا.');
  try{ REC.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}); }
  catch(e){
    var n=e&&e.name;
    return recMsg(n==='NotAllowedError'||n==='SecurityError'?'لم يُسمح باستعمال المايكروفون. ⟨اطلب|اطلبي⟩ من وليّ أمرك السماح به من إعدادات المتصفح، ثم ⟨أعِد|أعيدي⟩ المحاولة.':
      n==='NotFoundError'?'لم نجد مايكروفونًا في هذا الجهاز.':'تعذّر تشغيل المايكروفون. ⟨جرّب|جرّبي⟩ مرةً أخرى.');
  }
  if(CUR!==w){REC.stream.getTracks().forEach(function(t){t.stop();});REC.stream=null;return;}
  var mime=pickMime();
  try{REC.mr=new MediaRecorder(REC.stream,mime?{mimeType:mime}:undefined);}catch(e){REC.mr=new MediaRecorder(REC.stream);}
  REC.chunks=[]; REC.wid=w.id; REC.discard=false; REC.max=MAXREC[w.type]||240;
  REC.mr.ondataavailable=function(e){if(e.data&&e.data.size) REC.chunks.push(e.data);};
  REC.mr.onstop=recDone;
  REC.mr.start(1000); REC.t0=Date.now();
  renderRec(); recMeter();
  REC.timer=setInterval(function(){
    var s=(Date.now()-REC.t0)/1000, el=document.getElementById('recT');
    if(el) el.textContent=fmtDur(s)+' / '+fmtDur(REC.max);
    if(s>=REC.max) recStop();
  },250);
}
function recMeter(){
  try{
    var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    REC.ctx=new AC(); var src=REC.ctx.createMediaStreamSource(REC.stream), an=REC.ctx.createAnalyser(); an.fftSize=512; src.connect(an);
    var buf=new Uint8Array(an.fftSize);
    (function loop(){
      if(!REC.mr) return;
      an.getByteTimeDomainData(buf); var sum=0; for(var i=0;i<buf.length;i++){var v=(buf[i]-128)/128;sum+=v*v;}
      var lvl=Math.min(1,Math.sqrt(sum/buf.length)*4), m=document.getElementById('recMeter');
      if(m){var bars=m.children,n=Math.round(lvl*bars.length);for(var j=0;j<bars.length;j++) bars[j].className=j<n?'on':'';}
      REC.raf=requestAnimationFrame(loop);
    })();
  }catch(e){}
}
function recStop(){ if(REC.mr&&REC.mr.state!=='inactive'){try{REC.mr.stop();}catch(e){recCleanup();}} }
function recCleanup(){
  clearInterval(REC.timer); cancelAnimationFrame(REC.raf);
  if(REC.stream){REC.stream.getTracks().forEach(function(t){t.stop();});}
  if(REC.ctx){try{REC.ctx.close();}catch(e){}}
  REC.stream=null; REC.ctx=null;
}
async function recDone(){
  var dur=(Date.now()-REC.t0)/1000, type=(REC.mr&&REC.mr.mimeType)||'audio/webm', wid=REC.wid, discard=REC.discard, sink=REC.sink, left=REC.left; REC.left=false;
  var blob=new Blob(REC.chunks,{type:type.split(';')[0]==='audio/mp4'?'audio/mp4':type});
  recCleanup(); REC.mr=null; REC.chunks=[]; REC.sink=null; REC.narId=null;
  if(discard){ if(sink&&sink.after) sink.after(); return; }
  if(blob.size<800||dur<1){ if(left) return; if(sink){toast('التسجيل قصيرٌ جدًّا.'); if(sink.after) sink.after(); return;} renderRec(); return recMsg('التسجيل قصيرٌ جدًّا. ⟨أعِد|أعيدي⟩ المحاولة.'); }
  if(sink) return sink.save(blob,dur);
  await setWorkAudio(wid,blob,dur,left);
}
function recDiscard(){ if(REC.mr){REC.discard=true;recStop();} }
/* leaving the page (back, home, another child) stops a work's recording and keeps it: a long story is not lost to one tap.
   A recording made for something else (the narrator's voice) is dropped, as its page is gone. */
function recAbort(){ if(REC.mr){ if(REC.sink) REC.discard=true; else REC.left=true; recStop(); } }
async function setWorkAudio(wid,blob,dur,left){
  var w=workById(wid); if(!w) return;
  var key='a-'+w.id+'-'+Date.now().toString(36);
  try{await blobPut(key,blob);}catch(e){return recMsg('تعذّر حفظ التسجيل: قد تكون مساحة الجهاز ممتلئة.');}
  if(w.audio) await blobDel(w.audio);
  w.audio=key; w.dur=dur; w.updated=Date.now(); saveWorks();
  if(CUR&&CUR.id===w.id&&!left){ renderRec(); toast('حُفظ تسجيلك.'); }
  else toast('حُفظ التسجيل في «'+clip(titleOf(w),30)+'».');
}
async function recDel(){
  var w=CUR; if(!w||!w.audio) return;
  var ok=await ask({title:'حذف التسجيل؟',c:'rose',ok:'احذفه',danger:1}); if(!ok) return;
  await blobDel(w.audio); w.audio=null; w.dur=0; w.updated=Date.now(); saveWorks(); renderRec();
}
async function audioPicked(file){
  var w=CUR; if(!w||!file) return;
  if(!/^audio\//.test(file.type)&&!/\.(m4a|mp3|wav|ogg|opus|webm|aac|3gp|amr)$/i.test(file.name||'')) return recMsg('هذا ليس ملفًّا صوتيًّا.');
  if(file.size>30*1048576) return recMsg('الملف كبيرٌ جدًّا (أكثر من ٣٠ م.ب).');
  var dur=await new Promise(function(res){var a=document.createElement('audio'),u=URL.createObjectURL(file);a.preload='metadata';a.onloadedmetadata=function(){var d=a.duration;URL.revokeObjectURL(u);res(isFinite(d)?d:0);};a.onerror=function(){URL.revokeObjectURL(u);res(0);};a.src=u;});
  await setWorkAudio(w.id,file,dur);
}

/* ---------- drawing ---------- */
var DR={c:null,x:null,strokes:[],cur:null,color:'#141D3F',size:10,bg:null,dirty:false,t:0,mode:'draw'};
var PAL=['#141D3F','#2445A8','#0E7768','#4A761C','#E0AE3A','#E07A1F','#B3362B','#D9659B','#6E3FA3','#8B5A2B','#FFFFFF'];
var SIZES=[[5,'رفيع'],[12,'متوسط'],[26,'عريض']];
function drawHTML(w){
  return '<span class="lbl">رسمتك</span><div class="seg"><button type="button" data-act="drawMode" data-v="draw" class="'+(DR.mode==='draw'?'on':'')+'">'+ICON.brush+' أرسم هنا</button>'+
    '<button type="button" data-act="drawMode" data-v="photo" class="'+(DR.mode==='photo'?'on':'')+'">'+ICON.camera+' أصوّر رسمتي الورقية</button></div>'+
    (DR.mode==='photo'?
      '<div class="photo-box">'+(w.image?'<img class="drawn" alt="رسمتك" data-src="'+w.image+'">':'')+
      '<p class="tip">⟨ضع|ضعي⟩ الورقة في مكانٍ مضيء، ⟨وصوّرها|وصوّريها⟩ من فوقها مباشرة. ⟨وتأكّد|وتأكّدي⟩ أن الصورة لا تُظهر وجه أحد.</p>'+
      '<label class="btn file-btn">'+ICON.camera+' '+(w.image?'⟨صوّر|صوّري⟩ من جديد':'⟨صوّر|صوّري⟩ الرسمة')+'<input type="file" accept="image/*" capture="environment" data-file="drawPhoto" hidden></label></div>':
      '<div class="canvas-wrap"><canvas id="drawCanvas" width="1200" height="900" aria-label="لوحة الرسم"></canvas></div>'+
      '<div class="palette" role="group" aria-label="الألوان">'+PAL.map(function(c){return '<button type="button" class="pc'+(DR.color===c?' on':'')+'" style="--pc:'+c+'" data-act="drawColor" data-v="'+c+'" aria-label="'+(c==='#FFFFFF'?'ممحاة':'لون')+'">'+(c==='#FFFFFF'?'<span>ممحاة</span>':'')+'</button>';}).join('')+'</div>'+
      '<div class="draw-tools"><div class="seg">'+SIZES.map(function(s){return '<button type="button" data-act="drawSize" data-v="'+s[0]+'" class="'+(DR.size===s[0]?'on':'')+'"><i class="dot" style="--d:'+Math.round(s[0]/2+4)+'px"></i>'+s[1]+'</button>';}).join('')+'</div>'+
      '<button type="button" class="btn ghost" data-act="drawUndo">'+ICON.undo+' تراجع</button><button type="button" class="btn ghost danger-ghost" data-act="drawClear">'+ICON.trash+' امسح</button></div>'+
      '<p class="saved" id="drawSaved"></p>');
}
function drawInit(w){
  var c=document.getElementById('drawCanvas'); DR.c=c; DR.wid=w.id; DR.strokes=[]; DR.cur=null; DR.bg=null; DR.dirty=false;
  if(!c) return;
  DR.x=c.getContext('2d');
  if(w.image){ blobGet(w.image).then(function(b){ if(!b) return redraw(); var u=URL.createObjectURL(b), im=new Image(); im.onload=function(){DR.bg=im;redraw();URL.revokeObjectURL(u);}; im.src=u; }); }
  redraw();
  function pt(e){var r=c.getBoundingClientRect();return [(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height];}
  c.addEventListener('pointerdown',function(e){ e.preventDefault(); try{c.setPointerCapture(e.pointerId);}catch(x){} DR.cur={c:DR.color,s:DR.size,p:[pt(e)]}; drawStroke(DR.cur,true); });
  c.addEventListener('pointermove',function(e){ if(!DR.cur) return; e.preventDefault(); var evs=e.getCoalescedEvents?e.getCoalescedEvents():[e]; if(!evs.length) evs=[e];
    evs.forEach(function(ev){DR.cur.p.push(pt(ev));}); drawStroke(DR.cur,false,evs.length+1); });
  function end(){ if(!DR.cur) return; DR.strokes.push(DR.cur); DR.cur=null; DR.dirty=true; clearTimeout(DR.t); DR.t=setTimeout(drawSave,1200); }
  c.addEventListener('pointerup',end); c.addEventListener('pointercancel',end); c.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse') end(); });
}
function drawStroke(s,first,n){
  var x=DR.x; if(!x) return; var p=s.p;
  x.lineCap='round'; x.lineJoin='round'; x.strokeStyle=s.c; x.fillStyle=s.c; x.lineWidth=s.s;
  if(p.length===1){x.beginPath();x.arc(p[0][0],p[0][1],s.s/2,0,Math.PI*2);x.fill();return;}
  var from=first?0:Math.max(0,p.length-1-(n||1));
  x.beginPath(); x.moveTo(p[from][0],p[from][1]); for(var i=from+1;i<p.length;i++) x.lineTo(p[i][0],p[i][1]); x.stroke();
}
function redraw(){
  var x=DR.x,c=DR.c; if(!x) return;
  x.fillStyle='#FFFFFF'; x.fillRect(0,0,c.width,c.height);
  if(DR.bg){var s=Math.min(c.width/DR.bg.width,c.height/DR.bg.height),w=DR.bg.width*s,h=DR.bg.height*s;x.drawImage(DR.bg,(c.width-w)/2,(c.height-h)/2,w,h);}
  DR.strokes.forEach(function(s){drawStroke(s,true);});
}
function drawSave(){
  return new Promise(function(res){
    var w=workById(DR.wid),c=DR.c; if(!w||!c||!DR.dirty) return res();
    clearTimeout(DR.t);
    c.toBlob(async function(b){
      if(!b) return res();
      var key='i-'+w.id+'-'+Date.now().toString(36);
      try{await blobPut(key,b);}catch(e){toast('تعذّر حفظ الرسمة.');return res();}
      if(w.image) await blobDel(w.image);
      w.image=key; w.imgKind='draw'; w.updated=Date.now(); DR.dirty=false; saveWorks();
      var s=document.getElementById('drawSaved'); if(s) s.textContent='حُفظت الرسمة.';
      res();
    },'image/jpeg',.9);
  });
}
async function drawPhotoPicked(file){
  var w=CUR; if(!w||!file) return;
  if(!/^image\//.test(file.type)) return toast('هذا ليس ملفّ صورة.');
  try{
    var b=await shrinkImage(file,1600,.86), key='i-'+w.id+'-'+Date.now().toString(36);
    await blobPut(key,b); if(w.image) await blobDel(w.image);
    w.image=key; w.imgKind='photo'; w.updated=Date.now(); saveWorks(); workEdit(w.id); toast('حُفظت صورة رسمتك.');
  }catch(e){toast('تعذّرت قراءة الصورة.');}
}
