/* ================= parent corner ================= */
function backKid(){ PARENT_UNTIL=0; if(KID) return home(); return who(); }
function parentHome(){
  L=null; CUR=null; parentTouch();
  var pend=WORKS.filter(function(w){return w.status==='sent';});
  var magsPend=FAM.mags.filter(function(m){return m.status==='sent';});
  var appr=WORKS.filter(function(w){return w.status==='approved';});
  var wk=weeklyNow(), ext=Object.keys(FAM.ext).length;
  go('<div class="ax-page" style="--ax:var(--plum)"><div class="ph-top"><button class="back" type="button" data-act="backKid">'+BACK+' '+(KID?'عودوا إلى '+esc(KID.name):'رجوع')+'</button>'+
    '<button class="btn ghost small-btn" type="button" data-act="lock">'+ICON.lock+' أغلقوا الركن</button></div>'+
    '<header class="page-head"><span class="eyebrow">للوالدين</span><h1 class="h1">ركن وليّ الأمر</h1>'+
    '<p class="lead">من هنا تعتمدون أعمال الأطفال أو تعيدونها بملاحظة، وتُصدرون ما توافقون على مشاركته، وتديرون الملفات.</p></header>'+
    (FAM.pinResets.length?'<p class="tip">'+ICON.shield.replace('<svg','<svg class="ic-s"')+' أُعيد ضبط الرمز آخر مرة في '+fmtDate(FAM.pinResets[FAM.pinResets.length-1])+'، وأُلغيت الموافقات السابقة عندها.</p>':'')+
    (!FAM.rec?'<button class="banner rose" type="button" data-act="rcNew">'+ICON.lock+'<div class="bn-t"><strong>لا يوجد رمز استرداد بعد</strong><span>أنشئوه وأرسلوه إلى بريدكم؛ فبه وحده يُعاد ضبط الرمز إن نُسي.</span></div></button>':'')+
    (backupDue()?'<button class="banner gold" type="button" data-act="pBackup">'+ICON.shield+'<div class="bn-t"><strong>'+(FAM.lastBackup?'مضى أكثر من شهرٍ على آخر نسخةٍ احتياطية':'لم تحفظوا نسخةً احتياطية بعد')+'</strong><span>أصوات الأطفال وأعمالهم على هذا الجهاز وحده. احفظوا نسخةً مشفّرة في مكانٍ آمن.</span></div></button>':'')+
    (!IDB.db?'<p class="tip warn">هذا المتصفح لا يسمح بحفظ التسجيلات والرسوم بعد إغلاقه (ربما وضع التصفّح الخاص). افتحوا التطبيق في نافذةٍ عادية.</p>':'')+
    '<section><h2 class="h2">بانتظار مراجعتكم'+(pend.length?' · '+n2a(pend.length):'')+'</h2>'+
      (pend.length?'<ul class="wlist">'+pend.map(pRow).join('')+'</ul>':'<p class="muted">لا أعمال تنتظر المراجعة.</p>')+'</section>'+
    (magsPend.length?'<section><h2 class="h2">مجلّاتٌ تنتظر الإصدار</h2><ul class="wlist">'+magsPend.map(function(m){return '<li><button class="wrow" type="button" data-act="pMag" data-id="'+m.id+'" style="--ax:var(--gold)"><span class="ch-ico">'+ICON.mag+'</span><span class="wr-main"><span class="wr-t">«'+esc(m.name)+'» العدد '+n2a(m.no)+'</span><span class="wr-s">'+esc(m.title||'')+' · '+n2a((m.items||[]).length)+' أعمال</span></span><span class="wr-st"><span class="state st-mid">تنتظر الإصدار</span></span></button></li>';}).join('')+'</ul></section>':'')+
    '<section><h2 class="h2">أدوات</h2><div class="tools">'+
      ptool('pApproved','teal','check','الأعمال المعتمدة',n2a(appr.length)+' عمل · إرسالٌ إلى المعلّم، وقرار النشر، والإهداء')+
      ptool('pCode','lapis','talk','ردّ المعلّم','ألصقوا الرمز الذي أرسله المعلّم، أو أدخلوا ردّه بأنفسكم')+
      ptool('pWeekly','gold','radio','قارئ الأسبوع',wk?Gx(esc(kidById(wk.kid).name)+' ⟨قارئ|قارئة⟩ هذا الأسبوع',gOf(kidById(wk.kid))):'اختاروا أجمل قراءةٍ هذا الأسبوع')+
      ptool('pFamily','olive','users','جلسة العائلة','بطاقة هذا الأسبوع: '+plain(Gx(lessonById[fsCurrent().l].title,0)))+
      ptool('pWaha','olive','palm','لوحة الواحة','تقدّم الأطفال في «واحة اللسان العربي»، ورسائلهم وأخبارهم وتسجيلاتهم للمراجعة')+
      ptool('pVoice','teal','mic','صوت البيت','سجّلوا شرح الدروس بصوتكم ليسمعه الأطفال · '+n2a(Object.keys(FAM.nar||{}).length)+' تسجيلًا')+
      ptool('pKids','rose','users','الأطفال',n2a(FAM.kids.length)+' · الأسماء، والصيغة، والتقدّم')+
      ptool('pFrom','olive','radio','من الواحة والحسنية','تسجيلاتٌ من القسمين تضيفونها إلى الإذاعة والمجلّات')+
      ptool('pImport','olive','download','مشاركةٌ من صديق','أضيفوا عملًا أرسله صديقٌ إلى إحدى مجلّاتكم'+(ext?' ('+n2a(ext)+')':''))+
      ptool('pBackup','plum','shield','الأمان والنسخ الاحتياطي','حفظ نسخةٍ من كل شيء، وتغيير الرمز')+
    '</div></section></div>');
}
function ptool(act,c,ic,t,d){return '<button class="tool" type="button" data-act="'+act+'" style="--ax:var(--'+c+')"><span class="tool-t">'+ICON[ic].replace('<svg','<svg class="ic-s"')+' '+t+'</span><span class="tool-d">'+d+'</span></button>';}
function pRow(w){
  var k=kidById(w.kid), T=typeOf(w);
  return '<li><button class="wrow" type="button" data-act="pWork" data-id="'+w.id+'" style="--ax:var(--'+T.c+')">'+(k?avatarHTML(k,'m'):'<span class="ch-ico">'+ICON[T.ic]+'</span>')+
    '<span class="wr-main"><span class="wr-t">'+esc(clip(titleOf(w),60))+'</span><span class="wr-s">'+(k?esc(k.name)+' · ':'')+T.n+' · '+fmtDate(w.sentAt||w.updated)+(w.audio?' · '+fmtDur(w.dur):'')+'</span></span>'+
    '<span class="wr-st">'+statusChip(w,1)+'</span></button></li>';
}
function lockParent(){PARENT_UNTIL=0;toast('أُغلق ركن وليّ الأمر.');backKid();}

/* ---------- review one work ---------- */
var RV=null;
var CHIPS=['⟨أحسنتَ|أحسنتِ⟩! عملٌ جميل.','⟨اقرأ|اقرئي⟩ بتمهّلٍ أكثر، ⟨وقف|وقفي⟩ عند نهاية الآية.','⟨انتبه|انتبهي⟩ إلى مخارج الحروف المتقاربة.','⟨راجع|راجعي⟩ الحركات في أواخر الكلمات.','⟨ارفع|ارفعي⟩ صوتك قليلًا، ⟨واقترب|واقتربي⟩ من الجهاز.','⟨أكمل|أكملي⟩ الكتابة، ⟨وأضف|وأضيفي⟩ مثالًا من عندك.'];
function pWork(id){
  var w=workById(id); if(!w) return parentHome();
  var k=kidById(w.kid), f=gOf(k), T=typeOf(w); L=null; CUR=null;
  RV={id:id,r:Object.assign({},w.rubric||{})};
  var ba=baGroups(w.kid).filter(function(b){return b.last.id===w.id&&b.first.id!==w.id;})[0];
  var rub=T.rub&&w.audio;
  go('<div class="ax-page" style="--ax:var(--'+T.c+')"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button>'+
    '<header class="page-head"><span class="eyebrow">'+(k?esc(k.name)+' · ':'')+T.n+' · '+statusChip(w,1)+'</span><h1 class="h1">'+esc(titleOf(w))+'</h1></header>'+
    '<div class="xp">'+itemBody(w,{media:'src',author:k})+'</div>'+
    (ba?'<section><h2 class="h2">قبل وبعد</h2>'+Gx(baCard(ba),f)+'</section>':'')+
    (w.notes.length?'<section class="notes">'+w.notes.slice().reverse().map(function(n){return Gx(noteHTML(n),f).replace('ملاحظة وليّ أمرك','ملاحظتكم');}).join('')+'</section>':'')+
    (w.status==='sent'||w.status==='approved'||w.status==='returned'?
    '<section class="review"><h2 class="h2">مراجعتكم</h2>'+
      (rub?'<div class="rubric">'+RUB.map(function(x){return '<div class="rb-row"><span class="rb-l">'+x[1]+'</span><div class="seg">'+[1,2,3].map(function(v){return '<button type="button" data-act="rub" data-k="'+x[0]+'" data-v="'+v+'" class="'+(RV.r[x[0]]===v?'on':'')+'">'+RUBV[v]+'</button>';}).join('')+'</div></div>';}).join('')+'</div>':'')+
      '<label for="rvNote" class="lbl">ملاحظةٌ '+Gx('⟨له|لها⟩ (⟨يقرؤها|تقرؤها⟩ ',f)+(k?esc(k.name):'')+')</label><textarea id="rvNote" rows="3" maxlength="600" placeholder="'+escA(Gx('اكتبوا ملاحظةً قصيرة تشجّعه وتوجّهه…'.replace('تشجّعه وتوجّهه','⟨تشجّعه وتوجّهه|تشجّعها وتوجّهها⟩'),f))+'"></textarea>'+
      '<div class="chips-row">'+CHIPS.map(function(c,i){return '<button type="button" class="qchip" data-act="chip" data-v="'+i+'">'+Gx(c,f)+'</button>';}).join('')+'</div>'+
      '<div class="actions">'+(w.status!=='approved'?'<button class="btn" type="button" data-act="approve">'+ICON.check+' اعتمِدوه</button>':'<button class="btn" type="button" data-act="approve">'+ICON.check+' احفظوا التقييم</button>')+
        (w.status!=='returned'?'<button class="btn ghost" type="button" data-act="returnWork">أعيدوه '+Gx('⟨إليه|إليها⟩',f)+' بملاحظة</button>':'')+'</div></section>':'')+
    (w.status==='approved'?pubPanel(w,k):'')+
    (w.log&&w.log.length?'<section><h2 class="h2">سجلّ المشاركة</h2><ul class="rev">'+w.log.slice().reverse().map(function(l){return '<li><span class="mark-ok">↗</span><span>'+fmtDate(l.d)+' · إلى '+esc(l.to)+' · باسم «'+esc(l.name)+'»</span></li>';}).join('')+'</ul></section>':'')+
    '<div class="actions"><button class="btn ghost danger-ghost" type="button" data-act="pDelWork">'+ICON.trash+' احذفوا العمل</button></div></div>');
}
function pubPanel(w,k){
  var T=typeOf(w), f=gOf(k), p=w.pub||{};
  return '<section class="pub"><h2 class="h2">النشر والمشاركة</h2><p class="muted small">أنتم تقرّرون. ما يبقى داخل التطبيق لا يغادر الجهاز؛ وما يُرسل يمرّ بتنبيهٍ وموافقة.</p>'+
    '<div class="toggles">'+
      (w.audio?tog('fam','في «إذاعة الباكورة» داخل البيت',p.fam):'')+
      (T.sec?tog('mag','يُسمح بإضافته إلى مجلّات العائلة',p.mag):'')+'</div>'+
    '<div class="actions">'+
      (w.type==='gift'?'<button class="btn" type="button" data-act="exGift">'+ICON.gift+' أصدروا الإهداء</button>':'')+
      '<button class="btn'+(w.type==='gift'?' ghost':'')+'" type="button" data-act="exTeacher">'+ICON.share+' أرسلوه إلى المعلّم</button>'+
      (w.type==='riddle'?'<button class="btn" type="button" data-act="exRiddle">'+ICON.gift+' أهدوه رابطًا للأصدقاء</button>':'')+
      (T.sec?'<button class="btn ghost" type="button" data-act="exContrib">'+ICON.share+' شاركوه مع صديقٍ لمجلّته</button>':'')+
      '<button class="btn ghost" type="button" data-act="unapprove">أعيدوه إلى المسوّدة</button></div></section>';
}
function tog(k,t,on){return '<label class="tog"><input type="checkbox" data-act-change="pub" data-k="'+k+'"'+(on?' checked':'')+'><span>'+t+'</span></label>';}
function rvNoteText(){return ((document.getElementById('rvNote')||{}).value||'').trim().slice(0,600);}
function approveWork(){
  var w=workById(RV&&RV.id); if(!w) return;
  var t=rvNoteText(), r=Object.keys(RV.r).length?RV.r:null, was=w.status;
  if(t||r) w.notes.push({by:'p',t:t,r:r,d:Date.now()});
  if(r) w.rubric=r;
  w.status='approved'; w.approvedAt=w.approvedAt||Date.now(); if(was!=='approved') w.seen=false; w.updated=Date.now(); w.pub=w.pub||{fam:true,mag:true};
  saveWorks(); toast(was==='approved'?'حُفظ التقييم.':'اعتُمد العمل.'); pWork(w.id);
}
function returnWork(){
  var w=workById(RV&&RV.id); if(!w) return;
  var t=rvNoteText(), k=kidById(w.kid);
  if(!t){var e=document.getElementById('rvNote'); if(e){e.focus();} return toast(Gx('اكتبوا ملاحظةً قصيرة '+'⟨يفهم|تفهم⟩'+' منها ما المطلوب.',gOf(k)));}
  var r=Object.keys(RV.r).length?RV.r:null;
  w.notes.push({by:'p',t:t,r:r,d:Date.now()}); if(r) w.rubric=r;
  w.status='returned'; w.updated=Date.now(); saveWorks(); toast('أُعيد العمل مع ملاحظتكم.'); parentHome();
}
async function unapprove(){
  var w=workById(RV&&RV.id); if(!w) return;
  var ok=await ask({title:'إعادته إلى المسوّدة؟',ok:'نعم',html:'<p>يعود العمل إلى الطفل ليعدّله، ويخرج من المجلّات والإذاعة حتى تعتمدوه من جديد.</p>'}); if(!ok) return;
  w.status='draft'; w.updated=Date.now();
  FAM.mags.forEach(function(m){if(m.status!=='published') m.items=(m.items||[]).filter(function(it){return it.w!==w.id;});});
  saveWorks(); saveFam(); pWork(w.id);
}
async function pDelWork(){
  var w=workById(RV&&RV.id); if(!w) return;
  var ok=await ask({title:'حذف العمل نهائيًّا؟',c:'rose',ok:'احذفوه',danger:1,html:'<p>يُحذف «'+esc(titleOf(w))+'» بتسجيله ورسمته من هذا الجهاز، ومن المجلّات التي لم تصدر.</p>'});
  if(!ok) return; await deleteWork(w); toast('حُذف العمل.'); parentHome();
}
function pApproved(){
  L=null;
  var list=WORKS.filter(function(w){return w.status==='approved';});
  go('<div class="ax-page" style="--ax:var(--teal)"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button>'+
    '<header class="page-head"><h1 class="h1">الأعمال المعتمدة</h1><p class="lead">افتحوا أيّ عمل لتقرّروا نشره، أو ترسلوه إلى المعلّم، أو تُصدروا الإهداء.</p></header>'+
    (list.length?'<ul class="wlist">'+list.map(pRow).join('')+'</ul>':'<p class="muted">لا أعمال معتمدة بعد.</p>')+'</div>');
}

/* ---------- consent before anything leaves the device ---------- */
/* what: list of plain labels; returns {name} or false */
async function consent(o){
  if(!(await freshParent())) return false;
  var k=o.kid, f=gOf(k);
  var r=await ask({title:'قبل أن يخرج هذا من الجهاز',c:'rose',ok:'أوافق، أصدِروا الملف',
    html:'<div class="consent">'+
      '<p>سيُصنع '+(o.link?'رابطٌ':'ملفٌّ واحد')+' '+(o.to?(/^ال/.test(o.to)?'لل'+esc(o.to.slice(2)):'لـ'+esc(o.to))+' ':'')+'يحتوي على:</p><ul class="checks small">'+o.what.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>'+
      '<label for="cName" class="lbl">الاسم الذي يظهر في الملف</label><input id="cName" maxlength="30" value="'+escA(o.name!=null?o.name:(k?k.name:''))+'">'+
      '<label class="tog"><input type="checkbox" id="cAnon"><span>بلا اسم (يظهر: '+Gx('⟨صديقٌ صغير|صديقةٌ صغيرة⟩',f)+')</span></label>'+
      '<div class="warn-box"><strong>تنبيه:</strong> بعد الإرسال يخرج '+(o.link?'الرابط':'الملف')+' من أيديكم: يستطيع من يستلمه أن يحفظه أو يعيد إرساله، ولا يستطيع التطبيق استرجاعه. الصورة الشخصية للطفل لا تدخل الملف أبدًا.</div>'+
      (o.size?'<p class="muted small">حجم الملف نحو '+fmtMB(o.size)+(o.size>15*1048576?'، وقد يستغرق إرساله وقتًا.':'.')+'</p>':'')+
      '<label class="tog strong"><input type="checkbox" id="cOk"><span>أنا وليّ أمر '+(k?esc(k.name):'الطفل')+'، وأوافق على مشاركة هذه المعلومات'+(o.to?' مع '+esc(o.to):'')+'.</span></label></div>',
    check:function(el){
      if(!el.querySelector('#cOk').checked) return modalErr(el,'ضعوا علامة الموافقة أولًا.');
      var anon=el.querySelector('#cAnon').checked, nm=(el.querySelector('#cName').value||'').trim();
      if(!anon&&!nm) return modalErr(el,'اكتبوا اسمًا يظهر في الملف، أو اختاروا «بلا اسم».');
      return {name:anon?Gx('⟨صديقٌ صغير|صديقةٌ صغيرة⟩',f):nm.slice(0,30),anon:anon};
    }});
  return r;
}
function mediaWhat(w){
  var a=[]; if(w.audio) a.push('تسجيل صوت الطفل ('+fmtDur(w.dur)+')');
  if(w.image) a.push(w.imgKind==='photo'?'صورة الرسمة الورقية':'الرسمة');
  if((w.text||w.q||w.w1||w.to||'').trim()) a.push('النصّ المكتوب');
  a.push('العنوان، ونوع العمل، وتاريخه'); return a;
}
async function mediaMap(keys){
  var m={}; for(var i=0;i<keys.length;i++){var k=keys[i]; if(!k||m[k]) continue; var b=await blobGet(k); if(b) m[k]=await blobToDataURL(b);} return m;
}
function sizeOfMap(m){var s=0;Object.keys(m).forEach(function(k){s+=m[k].length;});return s;}
async function shareFile(name,html,title){
  var file=null;
  try{file=new File([html],name,{type:'text/html'});}catch(e){}
  if(file&&navigator.canShare&&navigator.share){
    try{ if(navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:title}); return 'shared'; } }
    catch(e){ if(e&&e.name==='AbortError') return 'aborted'; }
  }
  var b=new Blob([html],{type:'text/html'}), u=URL.createObjectURL(b), a=document.createElement('a');
  a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(u);},60000);
  return 'downloaded';
}
function safeName(s){return String(s||'').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'').replace(/\s+/g,' ').trim().slice(0,50)||'كنوز-البيان';}
function logShare(w,to,name){w.log=w.log||[];w.log.push({d:Date.now(),to:to,name:name});w.updated=Date.now();saveWorks();}
function afterShare(res){ toast(res==='shared'?'أُرسل الملف.':res==='aborted'?'أُلغي الإرسال.':'حُفظ الملف في التنزيلات، فأرسلوه من هناك.'); }

async function exTeacher(){
  var w=workById(RV&&RV.id); if(!w) return; var k=kidById(w.kid);
  var media=await mediaMap([w.audio,w.image]);
  var c=await consent({kid:k,to:'المعلّم',what:mediaWhat(w),size:sizeOfMap(media)}); if(!c) return;
  var html=teacherPage(w,k,c.name,media);
  var res=await shareFile('مراجعة - '+safeName(titleOf(w))+'.html',html,'مراجعة: '+titleOf(w));
  if(res!=='aborted'){ logShare(w,'المعلّم',c.name); w.teacher={st:'sent',sentAt:Date.now()}; saveWorks(); }
  afterShare(res); pWork(w.id);
}
async function exGift(){
  var w=workById(RV&&RV.id); if(!w) return; var k=kidById(w.kid);
  var media=await mediaMap([w.audio]);
  var c=await consent({kid:k,to:w.to||'المُهدى إليه',what:mediaWhat(w),size:sizeOfMap(media)}); if(!c) return;
  var html=giftPage(w,k,c.name,media);
  var res=await shareFile('إهداء - '+safeName(w.to||titleOf(w))+'.html',html,'إهداءٌ إلى '+(w.to||''));
  if(res!=='aborted') logShare(w,w.to||'إهداء',c.name);
  afterShare(res); pWork(w.id);
}
async function exContrib(){
  var w=workById(RV&&RV.id); if(!w) return; var k=kidById(w.kid);
  var media=await mediaMap([w.audio,w.image]);
  var c=await consent({kid:k,to:'صديقٍ لمجلّته',what:mediaWhat(w),size:sizeOfMap(media)}); if(!c) return;
  var html=contribPage(w,k,c.name,media);
  var res=await shareFile('مشاركة - '+safeName(titleOf(w))+'.html',html,'مشاركةٌ لمجلّتكم: '+titleOf(w));
  if(res!=='aborted') logShare(w,'صديق (مشاركة لمجلة)',c.name);
  afterShare(res); pWork(w.id);
}

/* ---------- teacher reply code ---------- */
function b64enc(str){var bytes=new TextEncoder().encode(str),bin='';for(var i=0;i<bytes.length;i+=8192){bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));}return btoa(bin);}
function b64dec(b){var bin=atob(b),a=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new TextDecoder().decode(a);}
function parseReply(txt){
  var m=/KB1:([A-Za-z0-9+/=]+):([a-z0-9]+)/.exec(String(txt||'').replace(/\s+/g,''));
  if(!m) return {err:'لم نجد رمزًا صالحًا. الرمز يبدأ بـ KB1:'};
  if(hashStr(m[1]).toString(36)!==m[2]) return {err:'الرمز ناقصٌ أو تغيّر أثناء النسخ. انسخوه كاملًا من رسالة المعلّم.'};
  var o; try{o=JSON.parse(b64dec(m[1]));}catch(e){return {err:'تعذّرت قراءة الرمز.'};}
  if(!o||o.k!=='review'||typeof o.w!=='string') return {err:'هذا الرمز ليس ردَّ مراجعة.'};
  if(o.f!==FAM.fid) return {err:'هذا الرمز لعملٍ من جهازٍ آخر أو عائلةٍ أخرى.'};
  var w=workById(o.w); if(!w) return {err:'العمل الذي يخصّه الرمز لم يعد موجودًا على هذا الجهاز.'};
  /* a code is read once: pasting an old reply again must not re-approve a work that was sent back since */
  if((w.tcodes||[]).indexOf(m[2])>=0) return {err:'هذا الردّ أُدخل من قبل. إن راجع المعلّم العمل من جديد فاطلبوا منه رمزًا جديدًا.'};
  var d=o.d==='ok'?'ok':o.d==='fix'?'fix':null; if(!d) return {err:'الرمز لا يحمل قرارًا صالحًا.'};
  var r=null; if(o.r&&typeof o.r==='object'){r={};['m','h','t'].forEach(function(x){var v=+o.r[x];if(v>=1&&v<=3) r[x]=v;}); if(!Object.keys(r).length) r=null;}
  return {w:w,d:d,r:r,n:String(o.n||'').slice(0,600),tn:String(o.tn||'').slice(0,40),code:m[2]};
}
function pCode(){
  L=null;
  var sent=WORKS.filter(function(w){return w.teacher&&w.teacher.st==='sent';});
  go('<div class="ax-page narrow" style="--ax:var(--lapis)"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button>'+
    '<header class="page-head"><h1 class="h1">ردّ المعلّم</h1><p class="lead">حين يراجع المعلّم الملف، يضغط «أنشئ رمز الردّ» ويرسله إليكم. ألصقوا الرسالة كاملةً هنا.</p></header>'+
    '<form class="form" id="codeForm" novalidate><label for="codeIn">رسالة المعلّم أو الرمز</label><textarea id="codeIn" rows="4" dir="ltr" placeholder="KB1:…"></textarea>'+
    '<p class="form-err" id="codeErr" role="alert"></p><div class="actions"><button class="btn" type="submit">اقرؤوا الردّ</button></div></form>'+
    (sent.length?'<section><h2 class="h2">أو أدخلوا ردّه بأنفسكم</h2><p class="muted small">إن لم تعمل أزرار الملف عند المعلّم (يحدث هذا في بعض معاينات الهاتف)، يكفي أن يكتب لكم رأيه في رسالة.</p><ul class="wlist">'+sent.map(function(w){var k=kidById(w.kid);return '<li><button class="wrow" type="button" data-act="manualReply" data-id="'+w.id+'"><span class="ch-ico">'+ICON[typeOf(w).ic]+'</span><span class="wr-main"><span class="wr-t">'+esc(titleOf(w))+'</span><span class="wr-s">'+(k?esc(k.name)+' · ':'')+'أُرسل '+fmtDate(w.teacher.sentAt)+'</span></span></button></li>';}).join('')+'</ul></section>':'')+
  '</div>');
}
async function codeSubmit(){
  var v=(document.getElementById('codeIn')||{}).value||'', e=document.getElementById('codeErr');
  var p=parseReply(v); if(p.err){e.textContent=p.err;return;}
  applyReply(p);
}
async function applyReply(p){
  var w=p.w, k=kidById(w.kid), f=gOf(k);
  var ok=await ask({title:'ردّ '+(p.tn?esc(p.tn):'المعلّم')+' على «'+esc(titleOf(w))+'»',ok:p.d==='fix'?'أعيدوه '+Gx('⟨إليه|إليها⟩',f)+' بالملاحظة':'احفظوا الاعتماد',
    html:'<p><strong>القرار:</strong> '+(p.d==='ok'?'اعتماد ✓':'يحتاج تعديلًا')+'</p>'+(p.r?'<p class="rub-line">'+rubStars(p.r)+'</p>':'')+(p.n?'<div class="note note-t"><p>'+esc(p.n).replace(/\n/g,'<br>')+'</p></div>':'')+
      (p.d==='fix'?'<p class="muted small">سيعود العمل إلى '+esc(k?k.name:'الطفل')+' مع ملاحظة المعلّم.</p>':'')});
  if(!ok) return;
  if(p.code){ if((w.tcodes||[]).indexOf(p.code)>=0) return toast('هذا الردّ أُدخل من قبل.'); w.tcodes=(w.tcodes||[]).concat(p.code).slice(-30); }
  w.notes.push({by:'t',t:p.n,r:p.r,d:Date.now(),name:p.tn||''});
  if(p.r) w.trub=p.r;
  w.teacher={st:p.d,d:Date.now(),sentAt:w.teacher&&w.teacher.sentAt};
  if(p.d==='fix'){w.status='returned';} w.seen=false; w.updated=Date.now(); saveWorks();
  toast(p.d==='ok'?'حُفظ اعتماد المعلّم.':'أُعيد العمل مع ملاحظة المعلّم.'); pWork(w.id);
}
async function manualReply(id){
  var w=workById(id); if(!w) return;
  var r=await ask({title:'ردّ المعلّم على «'+esc(titleOf(w))+'»',ok:'احفظوا',
    html:'<div class="form"><span class="lbl">القرار</span><label class="tog"><input type="radio" name="md" value="ok" checked><span>اعتماد</span></label><label class="tog"><input type="radio" name="md" value="fix"><span>يحتاج تعديلًا</span></label>'+
      '<label class="lbl" for="mtn">اسم المعلّم (اختياري)</label><input id="mtn" maxlength="40"><label class="lbl" for="mn">ملاحظته</label><textarea id="mn" rows="3" maxlength="600"></textarea></div>',
    check:function(el){return {d:el.querySelector('[name="md"]:checked').value,tn:el.querySelector('#mtn').value.trim(),n:el.querySelector('#mn').value.trim()};}});
  if(!r) return;
  applyReply({w:w,d:r.d,r:null,n:r.n,tn:r.tn});
}

/* ---------- weekly reader ---------- */
function pWeekly(){
  L=null;
  var since=weekStart().getTime(), cur=FAM.weekly[weekKey()];
  var c=WORKS.filter(function(w){return w.audio&&w.status==='approved'&&(w.created>=since||(w.approvedAt||0)>=since)&&['read','lamsa','hikma','story','kalima'].indexOf(w.type)>=0;})
    .sort(function(a,b){return rubTotal(b.rubric||b.trub)-rubTotal(a.rubric||a.trub);});
  go('<div class="ax-page" style="--ax:var(--gold)"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button>'+
    '<header class="page-head"><h1 class="h1">قارئ الأسبوع</h1><p class="lead">قراءات هذا الأسبوع المعتمدة (من السبت)، مرتّبةً بتقييمكم وتقييم المعلّم. اختاروا واحدةً تظهر على شاشة الأطفال جميعًا طوال الأسبوع.</p></header>'+
    (c.length?'<ul class="cands">'+c.map(function(w){var k=kidById(w.kid),r=w.rubric||w.trub,on=cur&&cur.work===w.id;
      return '<li class="cand'+(on?' on':'')+'">'+(k?avatarHTML(k,'m'):'')+'<div class="cd-m"><p class="cd-t">'+esc(titleOf(w))+' <span class="muted">· '+(k?esc(k.name):'')+' · '+typeOf(w).n+'</span></p>'+
        (r?'<p class="rub-line">'+rubStars(r)+'</p>':'<p class="muted small">بلا تقييم بعد</p>')+'<audio controls preload="none" data-src="'+w.audio+'"></audio></div>'+
        '<button class="btn'+(on?'':' ghost')+'" type="button" data-act="setWeekly" data-id="'+w.id+'">'+(on?ICON.check+' المختارة':'اختاروها')+'</button></li>';}).join('')+'</ul>':
      '<p class="muted">لا قراءات معتمدة هذا الأسبوع بعد. شجّعوا الأطفال على «قراءتي» في الاستوديو.</p>')+'</div>');
}
function setWeekly(id){var w=workById(id); if(!w) return; FAM.weekly[weekKey()]={kid:w.kid,work:w.id,d:Date.now()}; saveFam(); var k=kidById(w.kid); toast(Gx(k.name+' ⟨قارئ|قارئة⟩ الأسبوع!',gOf(k))); pWeekly();}

/* ---------- kids management ---------- */
function pKids(){
  L=null;
  go('<div class="ax-page" style="--ax:var(--rose)"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button>'+
    '<header class="page-head"><h1 class="h1">الأطفال</h1></header>'+
    '<ul class="kids">'+FAM.kids.map(function(k){var d=kidLoad(k.id),n=LESSONS.filter(function(l){return d.prog[l.id];}).length,wn=WORKS.filter(function(w){return w.kid===k.id;}).length;
      return '<li class="kid-row">'+avatarHTML(k,'m')+'<div class="kr-m"><p class="kr-n">'+esc(k.name)+' <span class="muted small">· '+(k.g==='f'?'بنت':'ولد')+'</span></p><p class="muted small">'+n2a(n)+' جوهرة · '+n2a(wn)+' عمل</p></div>'+
        '<div class="kr-a"><button class="btn ghost small-btn" type="button" data-act="pProg" data-id="'+k.id+'">التقدّم</button><button class="btn ghost small-btn" type="button" data-act="kidEdit" data-id="'+k.id+'">تعديل</button></div></li>';}).join('')+'</ul>'+
    '<div class="actions"><button class="btn" type="button" data-act="kidAdd">'+ICON.plus+' أضيفوا طفلًا</button></div></div>');
}
function pProg(id){progressFor(id,true);}
async function kidDelete(id){
  var k=kidById(id); if(!k) return;
  var ok=await ask({title:'حذف ملفّ '+esc(k.name)+'؟',c:'rose',ok:'احذفوه نهائيًّا',danger:1,html:'<p>يُحذف الملف وكلّ أعماله وتسجيلاته ورسومه وتقدّمه من هذا الجهاز، ولا يمكن التراجع.</p>'});
  if(!ok) return;
  var ws=WORKS.filter(function(w){return w.kid===id;}); for(var i=0;i<ws.length;i++) await deleteWork(ws[i]);
  if(k.photo) await blobDel('photo-'+id);
  try{localStorage.removeItem(kidKey(id));}catch(e){}
  try{await oasisForget(id);}catch(e){}
  try{await hasaniyaForget(id,k.name);}catch(e){}
  FAM.kids=FAM.kids.filter(function(x){return x.id!==id;});
  FAM.mags.forEach(function(m){if(m.editor===id) m.editor=null;});
  if(FAM.cur===id) FAM.cur=null; if(KID&&KID.id===id){KID=null;KD=null;}
  saveFam(); toast('حُذف الملف.'); pKids();
}
async function kidResetProgress(id){
  var k=kidById(id); if(!k) return;
  var ok=await ask({title:'مسح جواهر '+esc(k.name)+' ونتائجه؟',c:'rose',ok:'امسحوها',danger:1,html:'<p>تُمسح الجواهر ونتائج الاختبارات وسلسلة الأيام. الأعمال والتسجيلات تبقى.</p>'});
  if(!ok) return;
  var d=kidLoad(id); d.prog={}; d.st=freshST(); d.certs={}; d.gseen=[]; d.rm={}; lsSet(kidKey(id),d);
  if(KID&&KID.id===id){KD=d;prog=d.prog;ST=d.st;}
  toast('مُسحت النتائج.'); progressFor(id,true);
}

/* ---------- progress (child-facing or parent-facing) ---------- */
function progressFor(kidId,asParent){
  var k=kidById(kidId||(KID&&KID.id)); if(!k) return home();
  var d=(KID&&KID.id===k.id)?{prog:prog,st:ST}:kidLoad(k.id), P=d.prog, S=d.st, f=gOf(k);
  L=null;
  function dc(list){return (list||LESSONS).filter(function(l){return P[l.id];}).length;}
  var att=0,cor=0; Object.keys(S.items).forEach(function(x){var r=S.items[x];att+=r.n;cor+=r.c;});
  var acc=att?Math.round(cor/att*100):null, t=today();
  var due=BANK.filter(function(b){var r=S.items[b.id];return r&&r.w>0&&r.box<5&&r.due<=t;}).length;
  var D=S.daily||{}, sk=(D.last===t||D.last===addDays(t,-1))?(D.streak||0):0;
  var rows=AXES.map(function(a){
    var its=BANK.filter(function(b){return b.ax===a.id;}), tried=its.filter(function(b){return S.items[b.id];});
    var m=null; if(tried.length){var s=0;tried.forEach(function(b){s+=S.items[b.id].last;});m=Math.round(s/tried.length*100);}
    var lv=level(m), gems=LESSONS.filter(function(l){return l.ax===a.id;});
    return '<div class="mrow" style="--ax:var(--'+a.c+')"><div class="mrow-top"><span class="mrow-name">'+a.name+'</span><span class="state '+lv[0]+'">'+lv[1]+(m!==null?' · '+n2a(m)+'٪':'')+'</span></div>'+
      '<div class="as-bar"><i style="width:'+(m||0)+'%"></i></div>'+
      '<div class="mrow-sub"><span>اختُبر في '+n2a(tried.length)+' من '+n2a(its.length)+' سؤالًا · الجواهر '+n2a(dc(gems))+' من '+n2a(gems.length)+'</span>'+
      (asParent?'':'<button class="link" type="button" data-test="'+a.id+'">اختبار الخزانة</button>')+'</div></div>';
  }).join('');
  var weak=[]; BANK.forEach(function(b){var r=S.items[b.id]; if(b.l&&r&&r.last<1&&weak.indexOf(b.l)<0) weak.push(b.l);});
  var tests=(S.tests||[]).slice(-6).reverse();
  var who=esc(k.name);
  var html='<div class="ax-page" style="--ax:var(--plum)"><button class="back" type="button" data-act="'+(asParent?'pKids':'home')+'">'+BACK+' '+(asParent?'الأطفال':'الخزائن')+'</button>'+
    '<header class="page-head"><h1 class="h1">'+(asParent?'تقدّم '+who:'تقدّمي')+'</h1>'+
    '<p class="lead">'+(asParent?Gx('الدرجات من المحاولة الأولى وحدها. «الإتقان» نسبة ما ⟨أصابه|أصابته⟩ '+who+' في آخر مرةٍ ⟨رأى|رأت⟩ فيها كل سؤال. وما ⟨يخطئ|تخطئ⟩ فيه يعود في «المراجعة الذكية» بعد يوم، ثم بعد ٢ و٤ و٧ و١٤ يومًا كلما ⟨أصابه|أصابته⟩.',f):
      'الدرجات من المحاولة الأولى وحدها. وما ⟨تخطئ|تخطئين⟩ فيه يعود إليك في «المراجعة الذكية» حتى ⟨تتقنه|تتقنيه⟩.')+'</p></header>'+
    '<div class="tiles"><div class="tile"><b>'+n2a(dc())+'</b><span>جواهر من '+n2a(LESSONS.length)+'</span></div>'+
    '<div class="tile"><b>'+n2a(sk)+'</b><span>سلسلة الأيام</span></div>'+
    '<div class="tile"><b>'+(acc===null?'—':n2a(acc)+'٪')+'</b><span>دقّة الإجابات</span></div>'+
    '<div class="tile"><b>'+n2a(due)+'</b><span>تنتظر المراجعة</span></div></div>'+
    (asParent?gardenCertsBlock(k):'<div class="actions"><button class="btn ghost" type="button" data-act="garden">🌱 حديقتي</button><button class="btn ghost" type="button" data-act="certs">'+ICON.shield+' شهاداتي</button></div>')+
    '<section><h2 class="h2">الإتقان في كل خزانة</h2><div class="mrows">'+rows+'</div></section>'+
    '<section><h2 class="h2">دروسٌ تحتاج مراجعة</h2>'+(weak.length?'<p class="li-lessons">'+(asParent?weak.map(function(l){return '<span class="tag static" style="--ax:var(--'+axById[lessonById[l].ax].c+')">'+lessonById[l].title+'</span>';}).join(''):weak.map(tagFor).join(''))+'</p>':'<p class="muted">لا شيء بعد.</p>')+'</section>'+
    '<section><h2 class="h2">آخر الاختبارات</h2>'+(tests.length?'<ul class="rev">'+tests.map(function(x){var lv=level(x.p);
      return '<li><span class="state '+lv[0]+'">'+n2a(x.p)+'٪</span><span>'+MODE[x.m]+(x.ax?': '+axById[x.ax].name:'')+' · '+qWord(x.n)+' · '+n2a(x.d)+'</span></li>';}).join('')+'</ul>':'<p class="muted">لم يُجرَ اختبارٌ بعد.</p>')+'</section>'+
    (asParent?'<div class="actions"><button class="btn" type="button" data-act="pReport" data-id="'+k.id+'">التقرير الشهري</button></div><div class="actions"><button class="btn ghost danger-ghost" type="button" data-act="kidReset" data-id="'+k.id+'">امسحوا الجواهر والنتائج</button><button class="btn ghost danger-ghost" type="button" data-act="kidDel" data-id="'+k.id+'">'+ICON.trash+' احذفوا الملف</button></div>':
      '<div class="actions"><button class="btn" type="button" data-go="full">الاختبار الشامل</button><button class="btn ghost" type="button" data-act="diag">الاختبار الدوري</button><button class="btn ghost" type="button" data-go="review">المراجعة الذكية</button></div>'+
      '<p class="muted small">«الاختبار الدوري» '+n2a(diagItems().length)+' سؤالًا ثابتة لا تتغيّر، ⟨تعيده|تعيدينه⟩ كلّ ثلاثة أشهر فيُقاس تقدّمك بالمقارنة.'+(S.diag&&S.diag.length?' آخر مرة: '+fmtDate(dateOf(S.diag[S.diag.length-1].d))+' ('+n2a(S.diag[S.diag.length-1].p)+'٪).':'')+'</p>')+'</div>';
  go(asParent?Gx(html,f):html);
}

/* ---------- friend contribution import ---------- */
function pImport(){
  L=null;
  var ext=Object.keys(FAM.ext).map(function(k){return FAM.ext[k];}).sort(function(a,b){return b.d-a.d;});
  go('<div class="ax-page narrow" style="--ax:var(--olive)"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button>'+
    '<header class="page-head"><h1 class="h1">مشاركةٌ من صديق</h1><p class="lead">إذا أرسل لكم صديقٌ «ملفّ مشاركة» صنعه من «كنوز البيان» بموافقة أهله، اختاروه هنا لتضيفوه إلى إحدى مجلّاتكم.</p></header>'+
    '<div class="actions"><label class="btn file-btn">'+ICON.download+' اختاروا ملفّ المشاركة<input type="file" accept=".html,text/html" data-file="contrib" hidden></label></div>'+
    (ext.length?'<section><h2 class="h2">مشاركاتٌ مضافة</h2><ul class="wlist">'+ext.map(function(x){return '<li class="wrow static"><span class="ch-ico">'+ICON[(TYPES[x.type]||TYPES.story).ic]+'</span><span class="wr-main"><span class="wr-t">'+esc(x.title||TYPES[x.type].n)+'</span><span class="wr-s">من '+esc(x.author)+' · '+fmtDate(x.d)+'</span></span><button class="btn ghost small-btn danger-ghost" type="button" data-act="extDel" data-id="'+x.id+'">احذفوها</button></li>';}).join('')+'</ul></section>':'')+'</div>');
}
function readText(file){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res(fr.result);};fr.onerror=rej;fr.readAsText(file);});}
var AUD_RE=/^data:audio\/[a-z0-9.+-]+(;[a-z0-9=.,+-]+)*;base64,[A-Za-z0-9+/=]+$/i, IMG_RE=/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
async function contribPicked(file){
  if(!file) return; if(file.size>80*1048576) return toast('الملف كبيرٌ جدًّا.');
  var txt; try{txt=await readText(file);}catch(e){return toast('تعذّرت قراءة الملف.');}
  var m=/<script type="application\/json" id="kb-pkg">([\s\S]*?)<\/script>/.exec(txt);
  var o=null; try{o=m&&JSON.parse(m[1]);}catch(e){o=null;}
  if(!o||o.kind!=='contrib'||!o.work||!TYPES[o.work.type]||!TYPES[o.work.type].sec) return toast('هذا ليس ملفّ مشاركةٍ من «كنوز البيان».');
  var s=o.work, x={id:uid('x'),type:s.type,author:clip(o.author||'صديق',30),g:o.g==='f'?'f':'m',d:Date.now()};
  ['title','text','w1','w2','q','ans','hint','who','lesson','o1','o2','why'].forEach(function(k){if(typeof s[k]==='string') x[k]=s[k].slice(0,4000);});
  if(x.lesson&&!lessonById[x.lesson]) x.lesson='';
  if(s.audio&&AUD_RE.test(s.audio)){var ab=dataURLToBlob(s.audio); if(ab){x.audio='x-a-'+x.id; await blobPut(x.audio,ab); x.dur=+s.dur||0;}}
  if(s.image&&IMG_RE.test(s.image)){var ib=dataURLToBlob(s.image); if(ib){x.image='x-i-'+x.id; await blobPut(x.image,ib);}}
  var mags=FAM.mags.filter(function(mm){return mm.status!=='published';});
  var pick=await ask({title:'مشاركة «'+esc(x.title||TYPES[x.type].n)+'» من '+esc(x.author),ok:'أضيفوها',
    html:'<div class="xp">'+itemBody(x,{media:'src',ext:1})+'</div>'+
      (mags.length?'<label class="lbl" for="impMag">إلى أيّ مجلة؟</label><select id="impMag">'+mags.map(function(mm){return '<option value="'+mm.id+'">«'+esc(mm.name)+'» العدد '+n2a(mm.no)+(mm.title?' · '+esc(mm.title):'')+'</option>';}).join('')+'<option value="">احفظوها دون مجلةٍ الآن</option></select>':'<p class="muted small">لا مجلّاتٍ مفتوحة الآن؛ ستُحفظ المشاركة ويمكن إضافتها لاحقًا من صفحة المجلة.</p>'),
    check:function(el){var s2=el.querySelector('#impMag');return {mag:s2?s2.value:''};}});
  if(!pick){ if(x.audio) await blobDel(x.audio); if(x.image) await blobDel(x.image); return; }
  FAM.ext[x.id]=x;
  if(pick.mag){var mg=FAM.mags.filter(function(mm){return mm.id===pick.mag;})[0]; if(mg){mg.items=mg.items||[];mg.items.push({x:x.id,sec:x.type});}}
  saveFam(); setTimeout(function(){hydrate();},0); toast('أُضيفت المشاركة.'); pImport();
}
async function extDel(id){
  var x=FAM.ext[id]; if(!x) return;
  var ok=await ask({title:'حذف هذه المشاركة؟',c:'rose',ok:'احذفوها',danger:1}); if(!ok) return;
  if(x.audio) await blobDel(x.audio); if(x.image) await blobDel(x.image);
  delete FAM.ext[id]; FAM.mags.forEach(function(m){m.items=(m.items||[]).filter(function(it){return it.x!==id;});}); saveFam(); pImport();
}

/* ---------- security & backup ---------- */
async function pBackup(){
  L=null; var est='';
  try{if(navigator.storage&&navigator.storage.estimate){var e=await navigator.storage.estimate(); est='يستعمل التطبيق نحو '+fmtMB(e.usage||0)+' من مساحة هذا المتصفح.';}}catch(x){}
  var persisted=false; try{persisted=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():false;}catch(x){}
  go('<div class="ax-page narrow" style="--ax:var(--plum)"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button>'+
    '<header class="page-head"><h1 class="h1">الأمان والنسخ الاحتياطي</h1></header>'+
    '<section><h2 class="h2">أين تُحفظ البيانات؟</h2><p>على هذا الجهاز وحده، داخل هذا المتصفح. '+est+(persisted?' وقد طلب التطبيق من المتصفح ألّا يمسحها تلقائيًّا.':' قد يمسح المتصفح البيانات إذا امتلأت مساحة الجهاز، أو إذا مُسحت بيانات المواقع، فاحفظوا نسخةً احتياطية بين حينٍ وآخر.')+'</p></section>'+
    installHTML()+
    '<section><h2 class="h2">نسخةٌ احتياطية</h2><p>ملفٌّ واحد فيه كلّ شيء: الملفات، والأعمال، والتسجيلات، والرسوم، والصور الشخصية، وتقدّم «واحة اللسان العربي» و«الحسنية» وتسجيلاتهما. يُشفَّر بكلمة سرٍّ تختارونها، فلا يفتحه غيركم. احفظوه في مكانٍ خاصّ، واحفظوا كلمة السر.</p>'+
      '<div class="actions"><button class="btn" type="button" data-act="backupMake">'+ICON.download+' احفظوا نسخةً الآن</button>'+
      '<label class="btn ghost file-btn">استعيدوا نسخة<input type="file" accept=".json,application/json" data-file="restore" hidden></label></div>'+
      (FAM.lastBackup?'<p class="muted small">آخر نسخة: '+fmtDate(FAM.lastBackup)+(FAM.lastBackupEnc?' (مشفّرة)':' (بلا تشفير)')+'</p>':'')+'</section>'+
    waLogHTML()+
    '<section><h2 class="h2">رمز وليّ الأمر</h2><div class="actions"><button class="btn ghost" type="button" data-act="setupPin">غيّروا الرمز</button></div>'+
      '<p>'+(FAM.rec?'رمز الاسترداد أُنشئ '+fmtDate(FAM.rec.at)+'. به وحده يُعاد ضبط الرمز إن نُسي؛ ومن دونه تنتظر إعادة الضبط ٧٢ ساعة وتظهر للجميع.':'<strong>لا يوجد رمز استرداد بعد.</strong> أنشئوه الآن وأرسلوه إلى بريدكم.')+'</p>'+
      '<div class="actions"><button class="btn ghost" type="button" data-act="rcNew">'+(FAM.rec?'أنشئوا رمز استرداد جديد':'أنشئوا رمز الاسترداد')+'</button></div></section>'+
    '<section><h2 class="h2">عن الخصوصية</h2><ul class="checks small"><li>لا يتّصل التطبيق بأي خادم، ولا يجمع أي بيانات. الخطوط داخل التطبيق، فلا يتّصل بالإنترنت إلا لروابط التلاوة والمصادر حين تضغطونها.</li>'+
      '<li>كلّ ملفٍّ يخرج من الجهاز يمرّ بتنبيهٍ وموافقةٍ منكم، ويُسجَّل في «سجلّ المشاركة» على العمل نفسه.</li><li>الصورة الشخصية للطفل لا تدخل أي ملفٍ مُرسَل، ويمكنكم إخفاء الاسم عند كل إرسال.</li></ul></section></div>');
}
/* encrypted backups: PBKDF2-SHA256 → AES-GCM-256, all in the browser */
function bytesToB64(u8){var s='';for(var i=0;i<u8.length;i+=32768){s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));}return btoa(s);}
function b64ToBytes(b){var s=atob(b),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a;}
async function deriveKey(pass,salt,iter){
  var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptStr(str,pass){
  var salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12)), iter=250000;
  var key=await deriveKey(pass,salt,iter), ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,new TextEncoder().encode(str)));
  return JSON.stringify({kind:'kb-backup-enc',v:1,kdf:'PBKDF2-SHA256',iter:iter,salt:bytesToB64(salt),iv:bytesToB64(iv),at:Date.now(),data:bytesToB64(ct)});
}
async function decryptStr(o,pass){
  var key=await deriveKey(pass,b64ToBytes(o.salt),+o.iter||250000);
  var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64ToBytes(o.iv)},key,b64ToBytes(o.data));
  return new TextDecoder().decode(pt);
}
function canEncrypt(){return !!(window.crypto&&crypto.subtle&&window.TextEncoder);}
async function backupMake(){
  if(!(await freshParent('النسخة الاحتياطية تحمل بيانات الأطفال وأصواتهم، فتحتاج رمز وليّ الأمر الآن.'))) return;
  var opt=await ask({title:'نسخةٌ احتياطية مشفّرة',c:'plum',ok:'احفظوا النسخة',
    html:'<p>اختاروا كلمة سرٍّ تحفظونها جيدًا: لا يُفتح الملف إلا بها، ولا يمكن استرجاعها إن نُسيت.</p>'+
      (canEncrypt()?'<label class="lbl" for="bk1">كلمة السر (ستة أحرف أو أكثر)</label><input id="bk1" type="password" autocomplete="new-password">'+
        '<label class="lbl" for="bk2">أعيدوا كتابتها</label><input id="bk2" type="password" autocomplete="new-password">'+
        '<label class="tog"><input type="checkbox" id="bkPlain"><span>بلا تشفير (لا يُنصح: من يجد الملف يرى الأصوات والصور)</span></label>':
        '<p class="tip warn">هذا المتصفح لا يدعم التشفير هنا (افتحوا التطبيق من رابطه الآمن https)، فستُحفظ النسخة بلا تشفير.</p>'),
    check:function(el){
      if(!canEncrypt()) return {plain:true};
      if(el.querySelector('#bkPlain').checked) return {plain:true};
      var a=el.querySelector('#bk1').value, b=el.querySelector('#bk2').value;
      if(a.length<6) return modalErr(el,'كلمة السر ستة أحرفٍ على الأقل.');
      if(a!==b) return modalErr(el,'الكلمتان غير متطابقتين.');
      return {pass:a};
    }});
  if(!opt) return;
  toast('نُجهّز النسخة…');
  /* «last backup» is written only once the file is made: a failed backup must not hide the monthly reminder */
  var data, miss=[];
  try{
    var kids={}; FAM.kids.forEach(function(k){kids[k.id]=kidLoad(k.id);});
    var keys=await blobKeys();
    var blobs={}; for(var i=0;i<keys.length;i++){var b=await blobGet(keys[i]); if(b) blobs[keys[i]]=await blobToDataURL(b);}
    var oasis=null; try{oasis=await oasisExport();}catch(e){miss.push('الواحة');}
    var hasaniya=null; try{hasaniya=await hasaniyaExport();}catch(e){miss.push('الحسنية');}
    var at=Date.now(), fam=JSON.parse(JSON.stringify(FAM)); fam.lastBackup=at; fam.lastBackupEnc=!!opt.pass;
    data=JSON.stringify({kind:'kb-backup',v:1,at:at,fam:fam,works:WORKS,kids:kids,blobs:blobs,oasis:oasis,hasaniya:hasaniya});
  }catch(e){ return toast('تعذّر تجهيز النسخة: '+(e&&e.message||'')+'. لم يُحفظ شيء.'); }
  if(opt.pass){ try{ data=await encryptStr(data,opt.pass); }catch(e){ return toast('تعذّر التشفير: '+(e&&e.message||'')); } }
  try{
    var u=URL.createObjectURL(new Blob([data],{type:'application/json'})), a=document.createElement('a');
    a.href=u; a.download='كنوز-البيان-نسخة-'+today()+(opt.pass?'-مشفّرة':'')+'.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(u);},60000);
  }catch(e){ return toast('تعذّر حفظ الملف: '+(e&&e.message||'')); }
  data=null;
  FAM.lastBackup=Date.now(); FAM.lastBackupEnc=!!opt.pass; saveFam();
  if(miss.length){ toast('حُفظت النسخة، لكن بلا '+miss.join(' و')+': تعذّرت قراءتها.'); return; }
  toast(opt.pass?'حُفظت النسخة المشفّرة في التنزيلات.':'حُفظت النسخة في التنزيلات.');
}
async function restorePicked(file){
  if(!file) return; var txt; try{txt=await readText(file);}catch(e){return toast('تعذّرت قراءة الملف.');}
  var o; try{o=JSON.parse(txt);}catch(e){o=null;}
  txt=null;
  if(o&&o.kind==='kb-backup-enc'){
    if(!canEncrypt()) return toast('فتح النسخة المشفّرة يحتاج التطبيق من رابطه الآمن (https).');
    var enc=o; o=null;
    var got=await ask({title:'نسخةٌ مشفّرة',c:'plum',ok:'افتحوها',html:'<p>أدخلوا كلمة السر التي حُفظت بها النسخة'+(enc.at?' ('+fmtDate(enc.at)+')':'')+'.</p><label class="lbl" for="bkp">كلمة السر</label><input id="bkp" type="password" autocomplete="current-password">',
      check:function(el){var v=el.querySelector('#bkp').value; if(!v) return modalErr(el,'اكتبوا كلمة السر.'); return {p:v};}});
    if(!got) return;
    try{ o=JSON.parse(await decryptStr(enc,got.p)); }catch(e){ return toast('كلمة السر غير صحيحة، أو الملف تالف.'); }
  }
  if(!o||o.kind!=='kb-backup'||!o.fam||!Array.isArray(o.works)) return toast('هذا ليس ملفّ نسخةٍ احتياطية من «كنوز البيان».');
  var ok=await ask({title:'استعادة النسخة؟',c:'rose',ok:'استعيدوها',danger:1,html:'<p>نسخةٌ بتاريخ '+fmtDate(o.at)+' فيها '+n2a((o.fam.kids||[]).length)+' أطفال و'+n2a(o.works.length)+' عمل. <strong>ستحلّ محلّ كل ما على هذا الجهاز الآن.</strong></p>'});
  if(!ok) return;
  try{
    /* the backup's files are written first, and only then is what it does not hold removed: a full disk or a broken file
       stops the restore with this device's data still whole */
    var old=await blobKeys(), bk=Object.keys(o.blobs||{});
    for(var j=0;j<bk.length;j++){var b=dataURLToBlob(o.blobs[bk[j]]); if(b) await blobPut(bk[j],b);}
    Object.keys(o.kids||{}).forEach(function(id){ if(!lsSet(kidKey(id),o.kids[id])) throw new Error('مساحة الجهاز'); });
    for(var i=0;i<old.length;i++){ if(bk.indexOf(old[i])<0) await blobDel(old[i]); }
    FAM.kids.forEach(function(k){ if(!(o.kids||{})[k.id]) try{localStorage.removeItem(kidKey(k.id));}catch(e){} });
    FAM=o.fam; FAM.mags=FAM.mags||[]; FAM.weekly=FAM.weekly||{}; FAM.ext=FAM.ext||{}; FAM.pinResets=FAM.pinResets||[]; FAM.nar=FAM.nar||{}; FAM.fs=FAM.fs||{done:{}};
    WORKS=o.works; saveFam(); saveWorks();
    if(o.oasis) await oasisImport(o.oasis);
    if(o.hasaniya) await hasaniyaImport(o.hasaniya);
    for(var x=0;x<FAM.kids.length;x++){if(FAM.kids[x].photo) await mediaURL('photo-'+FAM.kids[x].id);}
    KID=null; KD=null; PARENT_UNTIL=0; toast('استُعيدت النسخة. أدخلوا رمز النسخة المستعادة عند الحاجة.');
    if(FAM.cur&&kidById(FAM.cur)){selectKid(FAM.cur);home();} else who();
  }catch(e){toast('تعذّرت الاستعادة: '+(e&&e.message||''));}
}

function gardenCertsBlock(k){
  certSync(k.id);
  var s=kidStats(k.id), its=gardenItems(s), c=s.d.certs||{}, got=CERTS.filter(function(x){return c[x.id];});
  return '<section class="gpair"><button class="gprev" type="button" data-act="pGarden" data-id="'+k.id+'" style="--ax:var(--olive)"><span class="gprev-svg">'+gardenSVG(s,its,{id:'gp',label:'حديقة '+k.name})+'</span>'+
    '<span class="gprev-t"><span class="door-t">حديقة '+esc(k.name)+'</span><span class="door-d">'+Gx(gardenSummary(s,its),gOf(k))+'</span></span></button>'+
    '<button class="sdoor" type="button" data-act="pCerts" data-id="'+k.id+'" style="--ax:var(--gold)"><span class="ch-ico">'+ICON.shield+'</span><span class="door-t">الشهادات</span>'+
    '<span class="door-d">'+(got.length?n2a(got.length)+' من '+n2a(CERTS.length)+'، آخرها: '+Gx(got[got.length-1].t,gOf(k)):'لم ينل شهادةً بعد.')+'</span></button></section>';
}

function backupDue(){
  var has=WORKS.length>0||FAM.kids.some(function(k){var d=kidLoad(k.id);return Object.keys(d.prog).length>0;});
  return has&&(!FAM.lastBackup||Date.now()-FAM.lastBackup>30*864e5);
}
