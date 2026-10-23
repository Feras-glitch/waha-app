/* ================= periodic diagnostic & monthly report ================= */
/* The diagnostic is the same set of questions every time (three per chamber, fixed), so growth is measured
   by comparing like with like. The monthly report is built only from what the app recorded on this device. */
function diagItems(){var out=[];AXES.forEach(function(a){out=out.concat(BANK.filter(function(b){return b.ax===a.id&&!b.lq&&b.k!=='match';}).slice(0,3));});return out;}
function startDiag(){startAssess('diag',diagItems());}
function diagList(S){return (S.diag||[]).slice();}
function diagDue(S){var l=diagList(S).pop();return !l||(Date.now()-dateOf(l.d))>90*864e5;}
function monthKey(t){var d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1);}
function monthName(mk,short){var p=mk.split('-');try{return new Intl.DateTimeFormat('ar-u-nu-arab',short?{month:'long'}:{month:'long',year:'numeric'}).format(new Date(+p[0],+p[1]-1,1));}catch(e){return mk;}}
function lastMonths(n){var d=new Date(),out=[];d.setDate(1);for(var i=0;i<n;i++){out.unshift(d.getFullYear()+'-'+pad(d.getMonth()+1));d.setMonth(d.getMonth()-1);}return out;}
function diagBanner(){
  if(!KID||!KD) return '';
  if(doneCount()<5||!diagDue(ST)) return '';
  var first=!diagList(ST).length;
  return '<button class="banner gold" type="button" data-act="diag">'+ICON.shield+'<div class="bn-t"><strong>'+(first?'⟨جرّب|جرّبي⟩ «الاختبار الدوري»':'حان وقت «الاختبار الدوري»')+'</strong><span>'+n2a(diagItems().length)+' سؤالًا ثابتة كلّ ثلاثة أشهر، '+(first?'لتكون نقطة البداية التي ⟨تقيس|تقيسين⟩ عليها تقدّمك.':'⟨لترى|لتري⟩ كم ⟨تقدّمتَ|تقدّمتِ⟩ منذ المرة الماضية.')+'</span></div></button>';
}

/* reading-rubric chart: three criteria over months; time runs right→left with the page */
var RUB_C=['--ch1','--ch2','--ch3'];
function rubricSeries(kidId,months){
  var ws=WORKS.filter(function(w){return w.kid===kidId&&(w.rubric||w.trub);});
  return months.map(function(mk){
    var row={mk:mk,n:0,m:null,h:null,t:null}, acc={m:[],h:[],t:[]};
    ws.forEach(function(w){ if(monthKey(w.approvedAt||w.updated)!==mk) return; row.n++;
      [w.rubric,w.trub].forEach(function(r){ if(!r) return; ['m','h','t'].forEach(function(k){ if(r[k]) acc[k].push(r[k]); }); }); });
    ['m','h','t'].forEach(function(k){ if(acc[k].length) row[k]=acc[k].reduce(function(a,b){return a+b;},0)/acc[k].length; });
    return row;
  });
}
function rubricChart(rows){
  var has=rows.some(function(r){return r.m||r.h||r.t;}); if(!has) return '<p class="muted">لا قراءاتٍ مقيَّمة في هذه الأشهر بعد. التقييم يُضاف حين يعتمد وليّ الأمر أو المعلّم قراءةً في «قراءتي» أو «لمسة العدد» أو «بيتٌ وحكمة» أو «مختبر الحروف».</p>';
  var W=450,H=220,R=82,Lp=104,T=16,B=34,n=rows.length, pw=W-R-Lp, ph=H-T-B;
  function x(i){return n===1?Lp+pw/2:W-R-i*pw/(n-1);}
  function y(v){return T+ph-(v-1)/2*ph;}
  var s='<svg class="rchart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="تقييم القراءة عبر الأشهر">';
  /* the page is RTL, so text-anchor "start" is the text's right edge */
  [1,2,3].forEach(function(v){s+='<line x1="'+Lp+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" class="rc-grid"/><text x="'+(W-4)+'" y="'+(y(v)+4)+'" class="rc-ax" text-anchor="start">'+RUBV[v]+'</text>';});
  var labs=[];
  rows.forEach(function(r,i){s+='<text x="'+x(i)+'" y="'+(H-12)+'" class="rc-ax" text-anchor="middle">'+monthName(r.mk,1)+'</text>';});
  RUB.forEach(function(c,ci){
    var k=c[0], pts=[]; rows.forEach(function(r,i){ if(r[k]!=null) pts.push([x(i),y(r[k]),r,i]); });
    if(pts.length>1) s+='<polyline points="'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ')+'" fill="none" style="stroke:var('+RUB_C[ci]+')" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    pts.forEach(function(p){ s+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4.5" style="fill:var('+RUB_C[ci]+')" class="rc-pt"><title>'+c[1]+' · '+monthName(p[2].mk)+': '+numA(p[2][k])+' من ٣</title></circle>'; });
    var last=pts[pts.length-1];
    if(last) labs.push({x:last[0]-10,y:last[1]+4,t:c[1]});
  });
  labs.sort(function(a,b){return a.y-b.y;});
  for(var li=1;li<labs.length;li++){ if(labs[li].y-labs[li-1].y<15) labs[li].y=labs[li-1].y+15; }
  var over=labs.length?labs[labs.length-1].y-(H-B+2):0; if(over>0) labs.forEach(function(l){l.y-=over;});
  labs.forEach(function(l){s+='<text x="'+l.x.toFixed(1)+'" y="'+l.y.toFixed(1)+'" class="rc-lab" text-anchor="start">'+l.t+'</text>';});
  s+='</svg>';
  var leg='<div class="rc-leg">'+RUB.map(function(c,ci){return '<span><i style="background:var('+RUB_C[ci]+')"></i>'+c[1]+'</span>';}).join('')+'</div>';
  var tab='<table class="rc-tab"><thead><tr><th>الشهر</th>'+RUB.map(function(c){return '<th>'+c[1]+'</th>';}).join('')+'<th>قراءات</th></tr></thead><tbody>'+
    rows.filter(function(r){return r.n;}).map(function(r){return '<tr><td>'+monthName(r.mk)+'</td>'+['m','h','t'].map(function(k){return '<td>'+(r[k]!=null?numA(r[k]):'—')+'</td>';}).join('')+'<td>'+n2a(r.n)+'</td></tr>';}).join('')+'</tbody></table>';
  return leg+'<div class="rc-wrap">'+s+'</div><details class="rc-more"><summary>الأرقام في جدول</summary>'+tab+'</details>';
}
function axisMastery(S){
  return AXES.map(function(a){
    var its=BANK.filter(function(b){return b.ax===a.id;}), tried=its.filter(function(b){return S.items[b.id];});
    var m=null; if(tried.length){var s=0;tried.forEach(function(b){s+=S.items[b.id].last;});m=Math.round(s/tried.length*100);}
    return {a:a,m:m,tried:tried.length,all:its.length};
  });
}
function reportHTML(k,mk,name){
  var d=kidData(k.id), P=d.prog, S=d.st, f=gOf(k), months=lastMonths(6);
  var gemsM=LESSONS.filter(function(l){return P[l.id]&&P[l.id].d&&monthKey(P[l.id].d)===mk;}).length, gemsAll=LESSONS.filter(function(l){return P[l.id];}).length;
  var testsM=(S.tests||[]).filter(function(x){return String(x.d).slice(0,7)===mk&&x.m!=='review';});
  var avgT=testsM.length?Math.round(testsM.reduce(function(a,x){return a+x.p;},0)/testsM.length):null;
  var mine=WORKS.filter(function(w){return w.kid===k.id;});
  var made=mine.filter(function(w){return monthKey(w.created)===mk;}).length, appr=mine.filter(function(w){return w.approvedAt&&monthKey(w.approvedAt)===mk;}).length;
  var certsM=CERTS.filter(function(c){var a=d.certs&&d.certs[c.id];return a&&monthKey(a.d)===mk;});
  var mast=axisMastery(S), diags=diagList(S);
  var weak=[]; BANK.forEach(function(b){var r=S.items[b.id]; if(b.l&&r&&r.last<1&&weak.indexOf(b.l)<0) weak.push(b.l);});
  var rows=rubricSeries(k.id,months), lastRub=rows.filter(function(r){return r.m!=null;}).pop();
  var sug=[];
  mast.filter(function(x){return x.m!==null&&x.m<50;}).forEach(function(x){sug.push('مراجعة خزانة «'+x.a.name+'» ثم «اختبار الخزانة» من جديد (الإتقان الآن '+n2a(x.m)+'٪).');});
  mast.filter(function(x){return x.m===null;}).slice(0,2).forEach(function(x){sug.push('البدء بخزانة «'+x.a.name+'»، فلم ⟨يُختبر|تُختبر⟩ فيها بعد.');});
  if(lastRub&&lastRub.m<2) sug.push('زوجٌ من «مختبر الحروف» كلّ أسبوع، فتقييم مخارج الحروف الأخير '+numA(lastRub.m)+' من ٣.');
  if(!made) sug.push('عملٌ واحد على الأقل في الاستوديو: قراءةٌ أو حكايةٌ أو رسمة.');
  if(diagDue(S)) sug.push('«الاختبار الدوري» ليُقاس التقدّم بالمقارنة.');
  if(weak.length) sug.push('مراجعة دروس: '+weak.slice(0,4).map(function(l){return '«'+plain(Gx(lessonById[l].title,f))+'»';}).join('، ')+'.');
  if(!sug.length) sug.push('الاستمرار على ما هو عليه، مع «جوهرة اليوم» يوميًّا.');
  var html='<article class="report"><header class="rp-head"><div><p class="eyebrow">كنوز البيان · تقرير شهري</p><h2 class="rp-t">'+esc(name)+'</h2><p class="rp-m">'+monthName(mk)+'</p></div>'+
      '<span class="rp-seal" aria-hidden="true">'+STAR+'</span></header>'+
    '<div class="rp-tiles"><div><b>'+n2a(gemsM)+'</b><span>جواهر هذا الشهر<br>('+n2a(gemsAll)+' من '+n2a(LESSONS.length)+' إجمالًا)</span></div>'+
      '<div><b>'+(avgT===null?'—':n2a(avgT)+'٪')+'</b><span>متوسط الاختبارات<br>('+n2a(testsM.length)+' هذا الشهر)</span></div>'+
      '<div><b>'+n2a(made)+'</b><span>أعمالٌ جديدة<br>('+n2a(appr)+' اعتُمد)</span></div>'+
      '<div><b>'+n2a(certsM.length)+'</b><span>شهادات هذا الشهر</span></div></div>'+
    '<section><h3 class="rp-h">القراءة: تقييم وليّ الأمر والمعلّم</h3>'+rubricChart(rows)+'</section>'+
    '<section><h3 class="rp-h">الإتقان في كل خزانة (الآن)</h3><div class="rp-bars">'+mast.map(function(x){
      return '<div class="rp-bar" style="--ax:var(--'+x.a.c+')"><span class="rb-n">'+x.a.name+'</span><span class="rb-t"><i style="width:'+(x.m||0)+'%"></i></span><span class="rb-v">'+(x.m===null?'لم يُختبر':n2a(x.m)+'٪')+'</span></div>';}).join('')+'</div>'+
      '<p class="rp-note">«الإتقان» نسبة ما ⟨أصابه|أصابته⟩ في آخر مرةٍ ⟨رأى|رأت⟩ فيها كلّ سؤال، من المحاولة الأولى.</p></section>'+
    '<section><h3 class="rp-h">الاختبار الدوري</h3>'+(diags.length?'<div class="rc-wrap"><table class="rc-tab"><thead><tr><th>التاريخ</th>'+AXES.map(function(a){return '<th>'+a.name+'</th>';}).join('')+'<th>المجموع</th></tr></thead><tbody>'+
      diags.map(function(x){return '<tr><td>'+fmtDate(dateOf(x.d))+'</td>'+AXES.map(function(a){var v=x.by&&x.by[a.id];return '<td>'+(v==null?'—':n2a(v)+'٪')+'</td>';}).join('')+'<td><b>'+n2a(x.p)+'٪</b></td></tr>';}).join('')+'</tbody></table></div>'+
      (diags.length>1?'<p class="rp-note">من '+n2a(diags[0].p)+'٪ في أول اختبار إلى '+n2a(diags[diags.length-1].p)+'٪ في آخره، بالأسئلة نفسها.</p>':'<p class="rp-note">هذه نقطة البداية. يُعاد الاختبار نفسه بعد ثلاثة أشهر للمقارنة.</p>'):
      '<p class="muted">لم ⟨يُجرِ|تُجرِ⟩ الاختبار الدوري بعد. هو '+n2a(diagItems().length)+' سؤالًا ثابتة، يُعاد كلّ ثلاثة أشهر فيُقاس التقدّم بالمقارنة.</p>')+'</section>'+
    (testsM.length?'<section><h3 class="rp-h">اختبارات هذا الشهر</h3><ul class="rp-list">'+testsM.map(function(x){return '<li><b>'+n2a(x.p)+'٪</b> '+MODE[x.m]+(x.ax?': '+axById[x.ax].name:'')+' · '+fmtDate(dateOf(x.d))+'</li>';}).join('')+'</ul></section>':'')+
    (certsM.length?'<section><h3 class="rp-h">شهادات هذا الشهر</h3><ul class="rp-list">'+certsM.map(function(c){return '<li>'+c.t+' · '+c.sub+'</li>';}).join('')+'</ul></section>':'')+
    '<section><h3 class="rp-h">مقترحاتٌ للشهر القادم</h3><ul class="rp-list">'+sug.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul></section>'+
    '<footer class="rp-foot">بُني هذا التقرير ممّا سجّله تطبيق «كنوز البيان» على جهاز العائلة في '+fmtDate(Date.now())+'. الدرجات من المحاولة الأولى وحدها.</footer></article>';
  return Gx(html,f);
}
function pReport(kidId,mk){
  var k=kidById(kidId); if(!k) return pKids(); L=null; certSync(k.id);
  mk=mk||monthKey(Date.now());
  go('<div class="ax-page wide-page" style="--ax:var(--plum)"><div class="ph-top no-print"><button class="back" type="button" data-act="pProg" data-id="'+k.id+'">'+BACK+' تقدّم '+esc(k.name)+'</button>'+
    '<span class="ph-acts"><button class="btn ghost small-btn" type="button" data-act="print">اطبعوه</button><button class="btn ghost small-btn" type="button" data-act="exReport" data-id="'+k.id+'" data-v="'+mk+'">'+ICON.share+' أرسلوه إلى المعلّم</button></span></div>'+
    '<div class="seg wrap-seg no-print">'+lastMonths(6).map(function(m){return '<button type="button" class="'+(m===mk?'on':'')+'" data-act="pReport" data-id="'+k.id+'" data-v="'+m+'">'+monthName(m,1)+'</button>';}).join('')+'</div>'+
    '<div class="xp">'+reportHTML(k,mk,k.name)+'</div></div>');
}
async function exReport(kidId,mk){
  var k=kidById(kidId); if(!k) return;
  var c=await consent({kid:k,to:'المعلّم',what:['تقرير شهر '+monthName(mk)+': الجواهر، ونتائج الاختبارات، وتقييم القراءة، والإتقان في كل خزانة، والمقترحات','الاسم الذي تختارونه']});
  if(!c) return;
  var html=pageShell('تقرير '+monthName(mk)+' — '+c.name,'<main class="xp">'+reportHTML(k,mk,c.name)+'<p class="no-print center-p"><button type="button" class="btn ghost" id="mzPrint">اطبعوا التقرير</button></p></main>',
    "(function(){var b=document.getElementById('mzPrint');if(b)b.addEventListener('click',function(){window.print();});})();");
  var res=await shareFile(safeName('تقرير '+monthName(mk)+' - '+c.name)+'.html',html,'تقرير شهري');
  afterShare(res);
}
