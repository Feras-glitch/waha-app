/* ================= items, magazines, radio, exported pages ================= */
var EXPORT_CSS=/*@EXPORT_CSS@*/'';
var MAGN=[['الباكورة','أوّل الثمر، كأوّل أعمالك','gold'],['ضادُنا','لغة الضاد، لغتنا','rose'],['مِداد','حبر الكاتب الذي لا ينفد','lapis'],['غيث','الماء النافع بعد انتظار','teal']];
function magColor(name){for(var i=0;i<MAGN.length;i++){if(MAGN[i][0]===name) return MAGN[i][2];}return 'plum';}

/* one work (or a friend's contribution) as reading content. Markers are resolved with the author's gender. */
function itemBody(w,o){
  o=o||{}; var f=o.ext?w.g==='f':gOf(o.author), t=w.type, h='';
  function src(k){ if(!k) return ''; if(o.media==='pkg') return ' data-pkg="'+k+'"'; if(o.media==='data') return o.map&&o.map[k]?' src="'+o.map[k]+'"':null; return ' data-src="'+k+'"'; }
  function aud(k,lbl){var s=src(k); if(!k||s===null) return ''; return '<div class="mz-aud">'+(lbl?'<span class="mz-lbl">'+lbl+'</span>':'')+'<audio controls preload="none"'+s+'></audio>'+(w.dur?'<span class="mz-dur">'+fmtDur(w.dur)+'</span>':'')+'</div>';}
  function img(k,alt){var s=src(k); if(!k||s===null) return ''; return '<img class="mz-img" alt="'+escA(alt||'')+'"'+s+'>';}
  function vs(id){var l=lessonById[id]; return l?l.verses.map(verse).join('').replace(/\u27e8استمع\|استمعي\u27e9 للتلاوة/g,'الاستماع للتلاوة'):'';}
  if(t==='kalima') h=nl2p(w.text)+aud(w.audio,'⟨بصوت الكاتب|بصوت الكاتبة⟩');
  else if(t==='lamsa') h=vs(w.lesson)+aud(w.audio,'⟨التلاوة بصوت القارئ|التلاوة بصوت القارئة⟩')+(w.text?'<p class="mz-lbl">اللمسة</p>'+nl2p(w.text):'')+(lessonById[w.lesson]?'<p class="mz-src">من درس «'+plain(lessonById[w.lesson].title)+'» في كنوز البيان</p>':'');
  else if(t==='twins') h='<div class="mz-twins"><span class="mz-w">'+esc(w.w1||'')+'</span><span class="mz-and">و</span><span class="mz-w">'+esc(w.w2||'')+'</span></div>'+nl2p(w.text)+aud(w.audio);
  else if(t==='story') h=aud(w.audio)+nl2p(w.text);
  else if(t==='hikma') h='<blockquote class="mz-hikma">'+esc(w.text||'').split(/\n+/).filter(function(x){return x.trim();}).map(function(x){return '<span>'+x.trim()+'</span>';}).join('')+'</blockquote>'+(w.who?'<p class="mz-src">'+esc(w.who)+'</p>':'')+aud(w.audio,'الإلقاء');
  else if(t==='draw') h=img(w.image,w.title||'رسمة')+nl2p(w.text);
  else if(t==='grandma') h=(w.who?'<p class="mz-lbl">حوارٌ مع '+esc(w.who)+'</p>':'')+aud(w.audio)+(w.text?'<p class="mz-lbl">ماذا تعلّمتُ</p>'+nl2p(w.text):'');
  else if(t==='riddle'){ var ro=[w.ans].concat(riddleOpts(w)).filter(Boolean); ro.sort(function(a,b){return hashStr(a+w.q)-hashStr(b+w.q);});
    h='<p class="mz-q">'+esc(w.q||'').replace(/\n/g,'<br>')+'</p>'+(ro.length>1?'<ul class="mz-opts">'+ro.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+(w.hint?'<p class="mz-hint">تلميح: '+esc(w.hint)+'</p>':'')+
      '<details class="mz-ans"><summary>الحلّ</summary><p>'+esc(w.ans||'')+'</p>'+(w.why?'<p class="mz-src">'+esc(w.why)+'</p>':'')+'</details>'; }
  else if(t==='read'&&w.src==='pair'&&pairById[w.pair]) h=pairTable(pairById[w.pair])+aud(w.audio,'القراءة');
  else if(t==='read') h=(w.src==='text'?'<div class="read-big">'+nl2p(w.text)+'</div>':vs(w.lesson))+aud(w.audio,'القراءة');
  else if(t==='gift') h='<p class="mz-lbl">إلى '+esc(w.to||'')+(w.occ?' · '+esc(w.occ):'')+'</p>'+nl2p(w.text)+aud(w.audio);
  return Gx(h,f);
}

/* ---------- magazines (child view) ---------- */
function magById(id){return FAM.mags.filter(function(m){return m.id===id;})[0]||null;}
function magItems(m){
  return (m.items||[]).map(function(it){
    /* only works that are approved for the magazines now: a work sent back, or approved for the radio only, leaves the issue */
    if(it.w){var w=workById(it.w); if(!w||w.status!=='approved'||(w.pub&&w.pub.mag===false)) return null; return {key:'w:'+w.id,w:w,sec:w.type,kid:kidById(w.kid),name:(kidById(w.kid)||{}).name||'',g:gOf(kidById(w.kid))};}
    if(it.x){var x=FAM.ext[it.x]; if(!x) return null; return {key:'x:'+x.id,w:x,sec:x.type,ext:1,name:x.author,g:x.g==='f'};}
    return null;
  }).filter(Boolean);
}
function magsView(){
  L=null; CUR=null;
  var list=FAM.mags.slice().sort(function(a,b){return b.created-a.created;});
  go('<div class="ax-page" style="--ax:var(--gold)"><button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">مجلّاتنا</h1><p class="lead">مجلّاتٌ يحرّرها أطفال العائلة، ويكتب فيها الإخوة والأصدقاء. ⟨اختر|اختاري⟩ اسمًا، ⟨واجمع|واجمعي⟩ فيها أعمالك المعتمدة، ثم ⟨أرسلها|أرسليها⟩ إلى وليّ أمرك ليُصدرها.</p></header>'+
    '<div class="actions"><button class="btn" type="button" data-act="magNew">'+ICON.plus+' مجلةٌ جديدة</button></div>'+
    (list.length?'<div class="mags">'+list.map(magCard).join('')+'</div>':'<p class="muted">لا مجلّات بعد. ⟨ابدأ|ابدئي⟩ الأولى!</p>')+'</div>');
}
function magCard(m){
  var ed=kidById(m.editor), n=magItems(m).length, st={draft:['st-none','قيد التحرير'],sent:['st-mid','عند وليّ الأمر'],published:['st-ok','صدرت']}[m.status]||['st-none',''];
  return '<button class="magc" type="button" data-act="magOpen" data-id="'+m.id+'" style="--ax:var(--'+magColor(m.name)+')"><span class="magc-n">'+esc(m.name)+'</span>'+
    '<span class="magc-no">العدد '+n2a(m.no)+(m.title?' · '+esc(m.title):'')+'</span>'+
    '<span class="magc-s">'+(ed?Gx('⟨رئيس|رئيسة⟩ التحرير: ',gOf(ed))+esc(ed.name)+' · ':'')+n2a(n)+' '+(n===1?'عمل':'أعمال')+'</span><span class="state '+st[0]+'">'+st[1]+'</span></button>';
}
function magNew(){
  L=null;
  go('<div class="ax-page narrow" style="--ax:var(--gold)"><button class="back" type="button" data-act="mags">'+BACK+' مجلّاتنا</button>'+
    '<header class="page-head"><h1 class="h1">مجلةٌ جديدة</h1><p class="lead">⟨ستكون|ستكونين⟩ ⟨رئيس|رئيسة⟩ تحريرها: ⟨تختار|تختارين⟩ الأعمال ⟨وترتّبها|وترتّبينها⟩، ويشارك فيها إخوتك.</p></header>'+
    '<form class="form" id="magForm"><span class="lbl">اسم المجلة</span><div class="mag-names">'+MAGN.map(function(x,i){return '<label class="mn" style="--ax:var(--'+x[2]+')"><input type="radio" name="mn" value="'+x[0]+'"'+(i===0?' checked':'')+'><span class="mn-n">'+x[0]+'</span><span class="mn-d">'+x[1]+'</span></label>';}).join('')+
      '<label class="mn" style="--ax:var(--plum)"><input type="radio" name="mn" value="*"><span class="mn-n">اسمٌ من اختياري</span><input id="mnCustom" maxlength="20" placeholder="اسم المجلة"></label></div>'+
      '<label for="mTitle2" class="lbl">عنوان هذا العدد</label><input id="mTitle2" maxlength="40" placeholder="مثلًا: عدد الشتاء، أو: أسرار الحروف">'+
      '<p class="form-err" id="magErr" role="alert"></p><div class="actions"><button class="btn" type="submit">⟨أنشئ|أنشئي⟩ المجلة</button></div></form></div>');
}
function magCreate(){
  var r=document.querySelector('input[name="mn"]:checked'), name=r?r.value:'الباكورة', err=document.getElementById('magErr');
  if(name==='*'){name=((document.getElementById('mnCustom')||{}).value||'').trim(); if(!name){err.textContent=G('⟨اكتب|اكتبي⟩ اسم المجلة.');return;}}
  var no=FAM.mags.filter(function(m){return m.name===name;}).length+1;
  var m={id:uid('m'),name:name.slice(0,20),no:no,title:((document.getElementById('mTitle2')||{}).value||'').trim().slice(0,40),editor:KID.id,items:[],status:'draft',created:Date.now(),updated:Date.now()};
  FAM.mags.push(m); saveFam(); magEdit(m.id);
}
function magOpen(id){ var m=magById(id); if(!m) return magsView(); return magEdit(id); }
function canEditMag(m){return m.status==='draft';}
function magEdit(id){
  var m=magById(id); if(!m) return magsView(); L=null;
  var items=magItems(m), ed=kidById(m.editor), editable=canEditMag(m);
  var stMsg={sent:'⟨أرسلتَ|أرسلتِ⟩ المجلة إلى وليّ الأمر، وهي تنتظر إصدارها.',published:'صدرت هذه المجلة في '+fmtDate(m.pubAt||m.updated)+'.'}[m.status]||'';
  go('<div class="ax-page" style="--ax:var(--'+magColor(m.name)+')"><button class="back" type="button" data-act="mags">'+BACK+' مجلّاتنا</button>'+
    '<header class="mz-mini"><span class="mz-mini-n">'+esc(m.name)+'</span><span class="mz-mini-s">العدد '+n2a(m.no)+(m.title?' · '+esc(m.title):'')+'</span>'+
      (ed?'<span class="mz-mini-e">'+avatarHTML(ed,'s')+Gx(' ⟨رئيس|رئيسة⟩ التحرير: ',gOf(ed))+esc(ed.name)+'</span>':'')+'</header>'+
    (stMsg?'<p class="tip">'+stMsg+'</p>':'')+
    '<div class="secs">'+SEC_ORDER.map(function(s){
      var its=items.filter(function(i){return i.sec===s;}), T=TYPES[s];
      return '<section class="sec-ed" style="--ax:var(--'+T.c+')"><div class="sec-top"><span class="ch-ico">'+ICON[T.ic]+'</span><h2 class="sec-n">'+T.n+'</h2>'+
        (editable?'<button class="btn ghost small-btn" type="button" data-act="magAdd" data-id="'+m.id+'" data-v="'+s+'">'+ICON.plus+' ⟨أضف|أضيفي⟩</button>':'')+'</div>'+
        (its.length?'<ul class="sec-items">'+its.map(function(i){return '<li><span class="si-t">'+esc(titleOf(i.w))+'</span><span class="si-b">'+(i.ext?'ضيف · ':'')+esc(i.name)+'</span>'+
          (editable&&(KID&&(m.editor===KID.id||(i.w.kid===KID.id)))?'<button class="link small" type="button" data-act="magRemove" data-id="'+m.id+'" data-v="'+i.key+'">أزِل</button>':'')+'</li>';}).join('')+'</ul>':'<p class="muted small">لا شيء بعد.</p>')+'</section>';
    }).join('')+'</div>'+
    '<div class="actions">'+(items.length?'<button class="btn ghost" type="button" data-act="magPreview" data-id="'+m.id+'">'+ICON.book+' ⟨اقرأ|اقرئي⟩ المجلة</button>':'')+
      (editable&&items.length?'<button class="btn" type="button" data-act="magSend" data-id="'+m.id+'">'+ICON.check+' ⟨أرسلها|أرسليها⟩ إلى وليّ ⟨أمرك|أمركِ⟩ لإصدارها</button>':'')+
      (editable&&!items.length?'<button class="btn ghost danger-ghost" type="button" data-act="magDel" data-id="'+m.id+'">'+ICON.trash+' ⟨احذف|احذفي⟩ المجلة</button>':'')+'</div></div>');
}
function eligible(m,sec){
  var inMag={}; (m.items||[]).forEach(function(it){inMag[it.w?'w:'+it.w:'x:'+it.x]=1;});
  var ws=WORKS.filter(function(w){return w.type===sec&&w.status==='approved'&&w.pub&&w.pub.mag&&!inMag['w:'+w.id];});
  var xs=Object.keys(FAM.ext).map(function(k){return FAM.ext[k];}).filter(function(x){return x.type===sec&&!inMag['x:'+x.id];});
  return {ws:ws,xs:xs};
}
async function magAdd(id,sec){
  var m=magById(id); if(!m) return; var e=eligible(m,sec), T=TYPES[sec];
  if(!e.ws.length&&!e.xs.length){
    var go2=await ask({title:T.n,c:T.c,ok:'⟨اصنع|اصنعي⟩ واحدًا الآن',html:'<p>لا يوجد عملٌ معتمَد في هذا الباب بعد. الأعمال تدخل المجلة بعد أن يعتمدها وليّ الأمر ويسمح بنشرها.</p>'});
    if(go2){var w=newWork(sec);workEdit(w.id);} return;
  }
  var pick=await ask({title:'⟨أضف|أضيفي⟩ إلى «'+T.n+'»',c:T.c,ok:'⟨أضف|أضيفي⟩',
    html:'<div class="pick-list">'+e.ws.map(function(w){var k=kidById(w.kid);return '<label class="tog"><input type="checkbox" value="w:'+w.id+'"><span>'+esc(titleOf(w))+' <span class="muted small">· '+(k?esc(k.name):'')+'</span></span></label>';}).join('')+
      e.xs.map(function(x){return '<label class="tog"><input type="checkbox" value="x:'+x.id+'"><span>'+esc(x.title||T.n)+' <span class="muted small">· ضيف: '+esc(x.author)+'</span></span></label>';}).join('')+'</div>',
    check:function(el){var v=[].slice.call(el.querySelectorAll('input:checked')).map(function(i){return i.value;}); if(!v.length) return modalErr(el,'⟨اختر|اختاري⟩ عملًا واحدًا على الأقل.'); return v;}});
  if(!pick) return;
  pick.forEach(function(v){var p=v.split(':'); m.items.push(p[0]==='w'?{w:p[1],sec:sec}:{x:p[1],sec:sec});});
  m.updated=Date.now(); saveFam(); magEdit(m.id);
}
function magRemove(id,key){var m=magById(id); if(!m) return; m.items=m.items.filter(function(it){return (it.w?'w:'+it.w:'x:'+it.x)!==key;}); m.updated=Date.now(); saveFam(); magEdit(id);}
async function magSend(id){var m=magById(id); if(!m) return; m.status='sent'; m.sentAt=Date.now(); saveFam(); toast('⟨أرسلتَ|أرسلتِ⟩ المجلة إلى وليّ أمرك.'); magEdit(id);}
async function magDel(id){var ok=await ask({title:'حذف المجلة؟',c:'rose',ok:'احذفها',danger:1}); if(!ok) return; FAM.mags=FAM.mags.filter(function(m){return m.id!==id;}); saveFam(); magsView();}

/* the magazine as a reading page; used in-app (data-src) and in exported files (data URIs) */
function magBody(m,o){
  o=o||{}; var items=magItems(m), ed=kidById(m.editor), names=o.names||{};
  function nameOf(i){return names[i.key]!=null?names[i.key]:i.name;}
  var contrib=[]; items.forEach(function(i){var n=nameOf(i); if(n&&contrib.indexOf(n)<0) contrib.push(n);});
  var secs=SEC_ORDER.filter(function(s){return items.some(function(i){return i.sec===s;});});
  var date=o.date||m.pubAt||Date.now(), hj=fmtHijri(date);
  var edName=ed?(names['ed']!=null?names['ed']:ed.name):'';
  var h='<article class="mz" style="--mz:var(--'+magColor(m.name)+')">'+
    '<header class="mz-cover"><div class="mz-band"></div><p class="mz-kicker">مجلةٌ يصنعها الأطفال</p><h1 class="mz-name">'+esc(m.name)+'</h1>'+
      '<p class="mz-no">العدد '+n2a(m.no)+' · '+fmtDate(date)+(hj?' · '+hj:'')+'</p>'+(m.title?'<p class="mz-title">'+esc(m.title)+'</p>':'')+
      (edName?'<p class="mz-ed">'+Gx('⟨رئيس|رئيسة⟩ التحرير: ',gOf(ed))+esc(edName)+'</p>':'')+
      (contrib.length?'<p class="mz-by">بأقلام وأصوات: '+contrib.map(esc).join('، ')+'</p>':'')+'</header>'+
    '<nav class="mz-toc" aria-label="فهرس العدد"><span class="mz-toc-t">في هذا العدد</span><ol>'+secs.map(function(s){return '<li><a href="#mz-'+s+'">'+TYPES[s].n+'</a></li>';}).join('')+'</ol></nav>'+
    (items.some(function(i){return i.w.audio;})?'<div class="mz-radio no-print"><button type="button" class="mz-play" data-act="magRadio" data-id="'+m.id+'">'+ICON.play+' '+(o.forExport?'استمعوا':'⟨استمع|استمعي⟩')+' إلى العدد كاملًا</button><span class="mz-now" id="mzNow" aria-live="polite"></span></div>':'')+
    secs.map(function(s){
      return '<section class="mz-sec" id="mz-'+s+'"><h2 class="mz-sec-n"><span>'+TYPES[s].n+'</span></h2>'+
        items.filter(function(i){return i.sec===s;}).map(function(i){
          var nm=nameOf(i);
          return '<div class="mz-item" data-key="'+i.key+'"><h3 class="mz-it">'+esc(titleOf(i.w))+'</h3>'+
            '<p class="mz-byline">'+(nm?esc(nm):'')+(i.ext?' <span class="mz-guest">ضيف العدد</span>':'')+'</p>'+itemBody(i.w,{media:o.media||'src',map:o.map,author:i.kid,ext:i.ext})+'</div>';
        }).join('')+'</section>';
    }).join('')+
    '<footer class="mz-foot"><p>صُنعت هذه المجلة في تطبيق «كنوز البيان» العائلي'+(o.forExport?'، وأُرسلت بموافقة وليّ الأمر.':'.')+'</p>'+(o.forExport?'<button type="button" class="btn ghost no-print" id="mzPrint">اطبعوا المجلة</button>':'')+'</footer></article>';
  return h;
}
function magPreview(id){
  var m=magById(id); if(!m) return magsView(); L=null;
  go('<div class="ax-page wide-page" style="--ax:var(--'+magColor(m.name)+')"><div class="ph-top no-print"><button class="back" type="button" data-act="magOpen" data-id="'+m.id+'">'+BACK+' رجوع</button>'+
    '<span class="ph-acts"><button class="btn ghost small-btn" type="button" data-act="presentMag" data-id="'+m.id+'">⟨اعرضها|اعرضيها⟩ على الشاشة</button><button class="btn ghost small-btn" type="button" data-act="print">اطبعها</button></span></div><div class="xp">'+magBody(m,{media:'src'})+'</div></div>');
}

/* ---------- magazines (parent) ---------- */
function magParent(id){
  var m=magById(id); if(!m) return parentHome(); L=null;
  var items=magItems(m);
  go('<div class="ax-page wide-page" style="--ax:var(--'+magColor(m.name)+')"><div class="ph-top no-print"><button class="back" type="button" data-act="parent">'+BACK+' ركن وليّ الأمر</button></div>'+
    '<div class="pub no-print"><h2 class="h2">«'+esc(m.name)+'» العدد '+n2a(m.no)+'</h2><p class="muted small">'+n2a(items.length)+' أعمال من '+n2a(items.map(function(i){return i.name;}).filter(function(v,i,a){return a.indexOf(v)===i;}).length)+' مشاركين. '+
      (m.status==='published'?'صدرت في '+fmtDate(m.pubAt)+'.':'اقرؤوها كاملةً قبل إصدارها.')+'</p>'+
      '<div class="actions">'+(m.status==='published'?'<button class="btn" type="button" data-act="magExport" data-id="'+m.id+'">'+ICON.share+' أرسلوا نسخة</button>':'<button class="btn" type="button" data-act="magExport" data-id="'+m.id+'">'+ICON.share+' اعتمدوها وأصدروها</button>')+
        '<button class="btn ghost" type="button" data-act="print">اطبعوها أو احفظوها PDF</button><button class="btn ghost" type="button" data-act="presentMag" data-id="'+m.id+'">اعرضوها على الشاشة</button>'+
        (m.status==='sent'?'<button class="btn ghost" type="button" data-act="magBack" data-id="'+m.id+'">أعيدوها للتحرير</button>':'')+
        (m.status==='draft'?'<button class="btn ghost" type="button" data-act="magPublishLocal" data-id="'+m.id+'">اعتمدوها داخل البيت فقط</button>':'')+'</div></div>'+
    '<div class="xp">'+magBody(m,{media:'src'})+'</div></div>');
}
function magBack(id){var m=magById(id); if(!m) return; m.status='draft'; saveFam(); toast('أُعيدت المجلة للتحرير.'); magParent(id);}
function magPublishLocal(id){var m=magById(id); if(!m) return; m.status='published'; m.pubAt=Date.now(); saveFam(); toast('اعتُمدت المجلة داخل البيت.'); magParent(id);}
async function magExport(id){
  var m=magById(id); if(!m) return; var items=magItems(m);
  if(!items.length) return toast('لا أعمال معتمدة للمجلّات في هذا العدد.');
  if(!(await freshParent())) return;
  var keys=[]; items.forEach(function(i){if(i.w.audio) keys.push(i.w.audio); if(i.w.image) keys.push(i.w.image);});
  var media=await mediaMap(keys), size=sizeOfMap(media);
  var fam=[]; items.forEach(function(i){if(!i.ext&&i.kid&&fam.indexOf(i.kid)<0) fam.push(i.kid);}); var ed=kidById(m.editor); if(ed&&fam.indexOf(ed)<0) fam.push(ed);
  var guests=items.filter(function(i){return i.ext;}).map(function(i){return i.name;}).filter(function(v,i,a){return a.indexOf(v)===i;});
  var voices=items.filter(function(i){return i.w.audio;}).length, pics=items.filter(function(i){return i.w.image;}).length;
  var r=await ask({title:'قبل أن تخرج المجلة من الجهاز',c:'rose',ok:'أوافق، أصدِروا المجلة',
    html:'<div class="consent"><p>ملفٌّ واحد يحتوي على المجلة كاملة: '+n2a(items.length)+' أعمال'+(voices?'، منها '+n2a(voices)+' تسجيلاتٍ صوتية':'')+(pics?'، و'+n2a(pics)+' رسوم':'')+'.</p>'+
      '<p class="lbl">أسماء أطفالكم كما تظهر في المجلة</p>'+fam.map(function(k){return '<div class="cn-row">'+avatarHTML(k,'s')+'<input data-cn="'+k.id+'" maxlength="30" value="'+escA(k.name)+'" aria-label="الاسم الظاهر لـ'+escA(k.name)+'"><label class="tog"><input type="checkbox" data-anon="'+k.id+'"><span>بلا اسم</span></label></div>';}).join('')+
      (guests.length?'<p class="muted small">مشاركات الضيوف تظهر بالأسماء التي اختارتها عائلاتهم: '+guests.map(esc).join('، ')+'.</p>':'')+
      '<div class="warn-box"><strong>تنبيه:</strong> بعد الإرسال يخرج الملف من أيديكم: يستطيع من يستلمه أن يحفظه أو يعيد إرساله. الصور الشخصية للأطفال لا تدخل الملف أبدًا.</div>'+
      '<p class="muted small">حجم الملف نحو '+fmtMB(size)+'.</p>'+
      '<label class="tog strong"><input type="checkbox" id="cOk"><span>أنا وليّ أمر الأطفال المذكورين، وأوافق على مشاركة أعمالهم وأصواتهم في هذه المجلة.</span></label></div>',
    check:function(el){
      if(!el.querySelector('#cOk').checked) return modalErr(el,'ضعوا علامة الموافقة أولًا.');
      var map={}; fam.forEach(function(k){var anon=el.querySelector('[data-anon="'+k.id+'"]').checked, v=(el.querySelector('[data-cn="'+k.id+'"]').value||'').trim().slice(0,30); map[k.id]=anon?Gx('⟨صديقٌ صغير|صديقةٌ صغيرة⟩',gOf(k)):(v||k.name);});
      return map;
    }});
  if(!r) return;
  var names={}; items.forEach(function(i){if(!i.ext&&i.kid) names[i.key]=r[i.kid.id];}); if(ed) names.ed=r[ed.id];
  var date=m.pubAt||Date.now();
  var html=pageShell('«'+m.name+'» العدد '+n2a(m.no),'<main class="xp">'+magBody(m,{media:'data',map:media,names:names,forExport:1,date:date})+'</main>',MAG_JS);
  var res=await shareFile(safeName(m.name+' - العدد '+m.no)+'.html',html,'مجلة '+m.name);
  if(res!=='aborted'){ m.status='published'; m.pubAt=date; m.log=m.log||[]; m.log.push({d:Date.now(),names:names}); saveFam(); }
  afterShare(res); magParent(id);
}

/* ---------- radio ---------- */
var RADIO={list:[],i:-1,mag:null};
function radioStop(){var a=document.getElementById('radioAudio'); if(a){try{a.pause();}catch(e){}} RADIO.i=-1;}
var RFILTER='all';
function radioList(){
  return WORKS.filter(function(w){return w.audio&&w.status==='approved'&&(!w.pub||w.pub.fam!==false)&&(RFILTER==='all'||w.kid===RFILTER);})
    .sort(function(a,b){return (b.approvedAt||b.updated)-(a.approvedAt||a.updated);})
    .map(function(w){var k=kidById(w.kid);return {key:w.audio,t:titleOf(w),by:k?k.name:'',ty:w.from?(w.from.src==='oasis'?'من الواحة':'من الحسنية'):typeOf(w).n,c:typeOf(w).c,k:k};});
}
function radioView(f){
  L=null; if(f) RFILTER=f; RADIO.list=radioList(); RADIO.i=-1; RADIO.mag=null;
  var wk=weeklyNow();
  go('<div class="ax-page" style="--ax:var(--plum)"><button class="back" type="button" data-home>'+BACK+' الخزائن</button>'+
    '<header class="page-head"><h1 class="h1">إذاعة الباكورة</h1><p class="lead">أصوات العائلة المعتمدة في مكانٍ واحد: قراءاتٌ وحكاياتٌ وحواراتٌ وأبياتٌ وحِكَم.</p></header>'+
    (FAM.kids.length>1?'<div class="seg wrap-seg">'+[['all','الكلّ']].concat(FAM.kids.map(function(k){return [k.id,k.name];})).map(function(x){return '<button type="button" class="'+(RFILTER===x[0]?'on':'')+'" data-act="radioF" data-v="'+x[0]+'">'+esc(x[1])+'</button>';}).join('')+'</div>':'')+
    (RADIO.list.length?
      '<div class="player"><div class="pl-now" id="plNow"><span class="eyebrow">على الهواء</span><p class="pl-t">⟨اضغط|اضغطي⟩ «⟨استمع|استمعي⟩ إلى الكلّ» أو ⟨اختر|اختاري⟩ تسجيلًا</p></div>'+
        '<audio id="radioAudio" controls preload="none"></audio><div class="actions"><button class="btn" type="button" data-act="radioAll">'+ICON.play+' ⟨استمع|استمعي⟩ إلى الكلّ</button><button class="btn ghost" type="button" data-act="presentRadio">وضع العرض على الشاشة</button></div></div>'+
      '<ol class="plist">'+RADIO.list.map(function(x,i){return '<li><button class="pl-row" type="button" data-act="radioPlay" data-v="'+i+'" style="--ax:var(--'+x.c+')">'+(x.k?avatarHTML(x.k,'s'):'')+'<span class="wr-main"><span class="wr-t">'+esc(clip(x.t,60))+'</span><span class="wr-s">'+esc(x.by)+' · '+x.ty+'</span></span>'+ICON.play+'</button></li>';}).join('')+'</ol>':
      '<div class="empty"><p>لا تسجيلات معتمدة بعد. التسجيلات تظهر هنا بعد أن يعتمدها وليّ الأمر.</p><button class="btn" type="button" data-act="studio">'+ICON.mic+' ⟨سجّل|سجّلي⟩ شيئًا</button></div>')+
    (wk&&workById(wk.work)?'':'')+'</div>');
  var a=document.getElementById('radioAudio'); if(a) a.addEventListener('ended',function(){ if(RADIO.i>=0&&RADIO.i<RADIO.list.length-1) radioPlay(RADIO.i+1); else radioMark(-1); });
}
async function radioPlay(i){
  var x=RADIO.list[i], a=document.getElementById('radioAudio'); if(!x||!a) return;
  var u=await mediaURL(x.key); if(!u) return toast('تعذّر تشغيل التسجيل.');
  RADIO.i=i; a.src=u; try{await a.play();}catch(e){}
  radioMark(i);
}
function radioMark(i){
  var now=document.getElementById('plNow'), x=RADIO.list[i];
  [].slice.call(document.querySelectorAll('.pl-row')).forEach(function(b,j){b.classList.toggle('on',j===i);});
  if(now) now.innerHTML=x?'<span class="eyebrow">على الهواء · '+n2a(i+1)+' من '+n2a(RADIO.list.length)+'</span><p class="pl-t">'+esc(x.t)+'</p><p class="muted small">'+esc(x.by)+' · '+x.ty+'</p>':'<span class="eyebrow">انتهى البثّ</span><p class="pl-t">'+G('⟨شكرًا لاستماعك|شكرًا لاستماعكِ⟩')+'</p>';
}
/* magazine radio inside the in-app preview */
async function magRadio(){
  var auds=[].slice.call(document.querySelectorAll('.mz-item audio')); if(!auds.length) return;
  var now=document.getElementById('mzNow'), i=0;
  auds.forEach(function(a){a.onended=null;});
  function play(j){
    if(j>=auds.length){ if(now) now.textContent='انتهى العدد.'; return; }
    var a=auds[j], it=a.closest('.mz-item'); i=j;
    [].slice.call(document.querySelectorAll('.mz-item')).forEach(function(x){x.classList.toggle('playing',x===it);});
    if(now) now.textContent='يُذاع الآن: '+(it.querySelector('.mz-it')||{}).textContent;
    try{it.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}
    a.onended=function(){play(j+1);};
    var p=a.play(); if(p&&p.catch) p.catch(function(){});
  }
  play(0);
}

/* ---------- exported pages ---------- */
/* A file that leaves the device asks nothing of the network: no web fonts (they would tell a font server who opened it, and when),
   and a policy that lets the page load nothing from outside. Its sounds and pictures are inside it (data: URLs). */
var EXPORT_CSP='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; media-src data:; font-src data:; base-uri \'none\'; form-action \'none\'">';
function pageShell(title,body,js,pkg){
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">'+EXPORT_CSP+'<meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title>'+
    '<style>'+EXPORT_CSS+'</style></head><body>'+body+
    (pkg?'<script type="application/json" id="kb-pkg">'+JSON.stringify(pkg).replace(/</g,'\\u003c')+'<\/script>':'')+
    (js?'<script>'+js+'<\/script>':'')+'</body></html>';
}
var MAG_JS="(function(){var b=document.querySelector('.mz-play'),now=document.getElementById('mzNow');if(!b)return;b.addEventListener('click',function(){var au=[].slice.call(document.querySelectorAll('.mz-item audio'));function p(j){if(j>=au.length){if(now)now.textContent='انتهى العدد.';return;}var a=au[j],it=a.closest('.mz-item');[].forEach.call(document.querySelectorAll('.mz-item'),function(x){x.classList.toggle('playing',x===it);});if(now)now.textContent='يُذاع الآن: '+it.querySelector('.mz-it').textContent;try{it.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}a.onended=function(){p(j+1);};var r=a.play();if(r&&r.catch)r.catch(function(){});}p(0);});var pr=document.getElementById('mzPrint');if(pr)pr.addEventListener('click',function(){window.print();});})();";
function teacherPage(w,k,name,media){
  var f=gOf(k), T=typeOf(w), rub=!!(T.rub&&w.audio);
  var chips=CHIPS.map(function(c){return '<button type="button" class="qchip">'+Gx(c,f)+'</button>';}).join('');
  var body='<main class="xp tp"><header class="tp-head"><p class="eyebrow">كنوز البيان · ملفّ مراجعة</p><h1>'+esc(titleOf(w))+'</h1>'+
    '<p>'+Gx('⟨صنع|صنعت⟩ ',f)+esc(name)+' هذا العمل ('+T.n+')، وأرسله إليكم وليّ الأمر لتراجعوه. '+fmtDate(w.sentAt||w.updated)+'.</p></header>'+
    '<section class="tp-work">'+itemBody(w,{media:'data',map:media,author:k})+'</section>'+
    '<section class="tp-form"><h2>مراجعتكم</h2><form id="tf" onsubmit="return false">'+
      (rub?'<fieldset class="tp-rub"><legend>تقييم القراءة</legend>'+RUB.map(function(x){return '<div class="tp-rr"><span>'+x[1]+'</span>'+[1,2,3].map(function(v){return '<label><input type="radio" name="'+x[0]+'" value="'+v+'"><span>'+RUBV[v]+'</span></label>';}).join('')+'</div>';}).join('')+'</fieldset>':'')+
      '<fieldset class="tp-dec"><legend>القرار</legend><label><input type="radio" name="dec" value="ok"><span>اعتماد ✓</span></label><label><input type="radio" name="dec" value="fix"><span>يحتاج تعديلًا</span></label></fieldset>'+
      '<label class="lbl" for="note">ملاحظتكم '+Gx('⟨له|لها⟩ (⟨يقرؤها|تقرؤها⟩ ',f)+esc(name)+')</label><textarea id="note" name="note" rows="4" maxlength="600"></textarea><div class="chips-row">'+chips+'</div>'+
      '<label class="lbl" for="tn">اسمكم كما يظهر للطفل (اختياري)</label><input id="tn" name="tn" maxlength="40" placeholder="مثلًا: الأستاذة مريم">'+
      '<p class="tp-msg" id="msg" role="alert"></p><button type="button" class="btn" id="mk">أنشئوا رمز الردّ</button>'+
      '<div id="out" hidden><p>أرسلوا هذا الرمز إلى وليّ الأمر، فيُدخله في التطبيق:</p><textarea id="code" rows="3" readonly dir="ltr"></textarea>'+
        '<div class="actions"><button type="button" class="btn ghost" id="cp">انسخوا الرمز</button><a class="btn" id="wa" target="_blank" rel="noopener">أرسلوه عبر واتساب</a></div></div></form>'+
      '<p class="tp-alt">إن لم تعمل الأزرار في هذه المعاينة، افتحوا الملف في المتصفح، أو اكتبوا رأيكم لوليّ الأمر في رسالةٍ عادية: «اعتماد» أو «يحتاج تعديلًا» مع ملاحظتكم.</p></section>'+
    '<footer class="mz-foot"><p>أُرسل هذا الملف من تطبيق «كنوز البيان» العائلي بموافقة وليّ الأمر. لا يتّصل الملف بأي خادم، ولا يرسل شيئًا من تلقاء نفسه.</p></footer></main>';
  return pageShell('مراجعة: '+titleOf(w),body,TEACHER_JS,{k:'review',w:w.id,f:FAM.fid,t:titleOf(w),rub:rub?1:0});
}
var TEACHER_JS="(function(){var P=JSON.parse(document.getElementById('kb-pkg').textContent),f=document.getElementById('tf'),out=document.getElementById('out'),code=document.getElementById('code'),wa=document.getElementById('wa'),msg=document.getElementById('msg');function h(s){var x=0;for(var i=0;i<s.length;i++){x=(x*31+s.charCodeAt(i))>>>0;}return x.toString(36);}function b64(s){var b=new TextEncoder().encode(s),t='';for(var i=0;i<b.length;i++)t+=String.fromCharCode(b[i]);return btoa(t);}function v(n){var x=f.querySelector('input[name=\"'+n+'\"]:checked');return x?+x.value:0;}[].forEach.call(document.querySelectorAll('.qchip'),function(b){b.addEventListener('click',function(){var t=f.note;t.value=(t.value?t.value.trim()+' ':'')+b.textContent;t.focus();});});document.getElementById('mk').addEventListener('click',function(){var d=f.querySelector('input[name=\"dec\"]:checked');if(!d){msg.textContent='اختاروا القرار أولًا: اعتماد، أو يحتاج تعديلًا.';return;}msg.textContent='';var o={v:1,k:'review',w:P.w,f:P.f,d:d.value,n:f.note.value.trim().slice(0,600),tn:f.tn.value.trim().slice(0,40),at:new Date().toISOString().slice(0,10)};if(P.rub)o.r={m:v('m'),h:v('h'),t:v('t')};var b=b64(JSON.stringify(o)),c='KB1:'+b+':'+h(b);code.value=c;out.hidden=false;wa.href='https://wa.me/?text='+encodeURIComponent('ردّي على «'+P.t+'»:\\n'+c);try{code.focus();code.select();}catch(e){}});document.getElementById('cp').addEventListener('click',function(){try{code.select();}catch(e){}var ok=false;try{ok=document.execCommand('copy');}catch(e){}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code.value).then(function(){msg.textContent='نُسخ الرمز.';},function(){if(ok)msg.textContent='نُسخ الرمز.';});}else if(ok){msg.textContent='نُسخ الرمز.';}});})();";
function giftPage(w,k,name,media){
  var c=CARDS.some(function(x){return x[0]===w.card;})?w.card:'gold';
  var body='<main class="gc" style="--gc:var(--'+c+')"><div class="gc-card"><div class="gc-orn" aria-hidden="true">'+STAR+'</div>'+
    (w.occ?'<p class="gc-occ">'+esc(w.occ)+'</p>':'')+'<h1 class="gc-to">إلى '+esc(w.to||'')+'</h1>'+
    (w.text?'<div class="gc-msg">'+nl2p(w.text)+'</div>':'')+
    (media[w.audio]?'<button type="button" class="gc-play" id="gcPlay">'+ICON.play+'<span>استمعوا إلى الرسالة</span></button><audio id="gcA" controls preload="metadata" src="'+media[w.audio]+'"></audio>':'')+
    '<p class="gc-from">من '+esc(name)+'</p><p class="gc-date">'+fmtDate(Date.now())+'</p></div>'+
    '<footer class="mz-foot"><p>صُنعت هذه البطاقة في تطبيق «كنوز البيان» العائلي، وأرسلها وليّ الأمر بموافقته.</p></footer></main>';
  return pageShell('إهداءٌ إلى '+(w.to||''),body,"(function(){var b=document.getElementById('gcPlay'),a=document.getElementById('gcA');if(!b||!a)return;b.addEventListener('click',function(){if(a.paused){var p=a.play();if(p&&p.catch)p.catch(function(){});}else a.pause();});a.addEventListener('play',function(){b.classList.add('on');});a.addEventListener('pause',function(){b.classList.remove('on');});})();");
}
function contribPage(w,k,name,media){
  var T=typeOf(w), pkg={kind:'contrib',v:1,author:name,g:k&&k.g==='f'?'f':'m',work:{type:w.type,title:titleOf(w),dur:w.dur||0}};
  ['text','w1','w2','q','ans','hint','who','lesson','o1','o2','why'].forEach(function(x){if(w[x]) pkg.work[x]=String(w[x]);});
  if(w.audio&&media[w.audio]) pkg.work.audio=media[w.audio];
  if(w.image&&media[w.image]) pkg.work.image=media[w.image];
  var shown={type:w.type,title:w.title,text:w.text,w1:w.w1,w2:w.w2,q:w.q,ans:w.ans,hint:w.hint,who:w.who,lesson:w.lesson,src:w.src,dur:w.dur,o1:w.o1,o2:w.o2,why:w.why,audio:w.audio?'A':null,image:w.image?'I':null,g:pkg.g};
  var body='<main class="xp tp"><header class="tp-head"><p class="eyebrow">كنوز البيان · مشاركةٌ لمجلّتكم</p><h1>'+esc(titleOf(w))+'</h1>'+
    '<p>'+T.n+' '+Gx('⟨صنعه|صنعته⟩ ',gOf(k))+esc(name)+'، وأرسله إليكم وليّ الأمر بموافقته لتضيفوه إلى مجلّة أطفالكم.</p></header>'+
    '<section class="tp-work">'+itemBody(shown,{media:'pkg',ext:1})+'</section>'+
    '<section class="tp-form"><h2>كيف تضيفونها؟</h2><ol><li>افتحوا «كنوز البيان» على جهازكم.</li><li>ادخلوا «ركن وليّ الأمر»، ثم «مشاركةٌ من صديق».</li><li>اختاروا هذا الملف، ثم المجلة التي تضيفونه إليها.</li></ol></section>'+
    '<footer class="mz-foot"><p>صُنع هذا الملف في تطبيق «كنوز البيان» العائلي. لا يتّصل بأي خادم.</p></footer></main>';
  return pageShell('مشاركة: '+titleOf(w),body,"(function(){try{var P=JSON.parse(document.getElementById('kb-pkg').textContent).work;[].forEach.call(document.querySelectorAll('[data-pkg]'),function(el){var v=el.getAttribute('data-pkg')==='A'?P.audio:P.image;if(v)el.src=v;});}catch(e){}})();",pkg);
}
