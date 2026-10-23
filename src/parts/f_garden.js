/* ================= phase 2: the garden of Bayan & certificates ================= */
/* Everything is derived from the child's own record: lessons (prog), tests and streak (st), approved works,
   magazines, teacher approvals, workshop writings. Certificates are stored once earned (d.certs) so they never vanish. */

function kidData(kidId){ if(KID&&KID.id===kidId&&KD){KD.prog=prog;KD.st=ST;return KD;} return kidLoad(kidId); }
function saveKidData(kidId,d){ if(KID&&KID.id===kidId&&KD){KD=d;prog=d.prog;ST=d.st;kidSave();} else lsSet(kidKey(kidId),d); }
function dateOf(s){var p=String(s||'').split('-');return p.length===3?new Date(+p[0],+p[1]-1,+p[2]).getTime():Date.now();}
function cnt(n,f){return n===1?f[0]:n===2?f[1]:(n<=10?n2a(n)+' '+f[2]:n2a(n)+' '+f[3]);}

function kidStats(kidId){
  var d=kidData(kidId), P=d.prog, S=d.st, t=today();
  var s={d:d,gems:0,perfect:0,axN:{},axHave:{},axDone:{},best:{},fullBest:null,bestStreak:(S.daily&&S.daily.best)||0,alive:false,
    approved:0,firstWork:null,teacher:0,firstTeacher:null,writings:0,mags:0,editorMag:null,weekly:0,riddles:0};
  LESSONS.forEach(function(l){ s.axN[l.ax]=(s.axN[l.ax]||0)+1; if(P[l.id]){ s.gems++; s.axHave[l.ax]=(s.axHave[l.ax]||0)+1; if(P[l.id].p) s.perfect++; } });
  AXES.forEach(function(a){ s.axDone[a.id]=(s.axHave[a.id]||0)===s.axN[a.id]; });
  (S.tests||[]).forEach(function(x){
    if(x.m==='axis'&&x.ax&&(!s.best[x.ax]||x.p>s.best[x.ax].p)) s.best[x.ax]={p:x.p,d:x.d};
    if(x.m==='full'&&(!s.fullBest||x.p>s.fullBest.p)) s.fullBest={p:x.p,d:x.d};
  });
  var D=S.daily||{}; s.alive=D.last===t||D.last===addDays(t,-1);
  var mine=WORKS.filter(function(w){return w.kid===kidId;});
  var appr=mine.filter(function(w){return w.status==='approved';}).sort(function(a,b){return (a.approvedAt||a.updated)-(b.approvedAt||b.updated);});
  s.approved=appr.length; s.firstWork=appr[0]||null;
  var tch=mine.filter(function(w){return w.teacher&&w.teacher.st==='ok';}); s.teacher=tch.length; s.firstTeacher=tch[0]||null;
  s.writings=Object.keys(d.w||{}).filter(function(k){return String(d.w[k]||'').trim().length>=15;}).length;
  var pubs=FAM.mags.filter(function(m){return m.status==='published'&&(m.editor===kidId||(m.items||[]).some(function(it){var w=it.w&&workById(it.w);return w&&w.kid===kidId;}));});
  s.mags=pubs.length; s.editorMag=pubs.filter(function(m){return m.editor===kidId;})[0]||null;
  s.weekly=Object.keys(FAM.weekly).filter(function(k){return FAM.weekly[k].kid===kidId;}).length;
  s.riddles=mine.filter(function(w){return w.type==='riddle'&&(w.log||[]).some(function(l){return l.kind==='riddle';});}).length;
  return s;
}

/* ---------- certificates ---------- */
var AX_PATRON={lamasat:'في رحاب «لمسات بيانية» للدكتور فاضل السامرائي',furuq:'في رحاب «الفروق اللغوية» لأبي هلال العسكري',
  nahw:'في رحاب «دلائل الإعجاز» لعبد القاهر الجرجاني، و«معاني النحو» للدكتور فاضل السامرائي',asrar:'في رحاب «العين» للخليل بن أحمد، و«الخصائص» لابن جني',
  aliya:'في رحاب «اللغة العالية» لعارف حجاوي',taammal:'في رحاب قناة «تأمَّل» لشادي داود',
  asma:'في رحاب «المقصد الأسنى» للغزالي، و«لمسات بيانية» للدكتور فاضل السامرائي'};
var CERT_K={x:['شهادات الإتقان','تُنال باختبارٍ حقيقي: ثمانون في المئة أو أكثر من المحاولة الأولى.','إتقان'],
  c:['شهادات الإتمام','تُنال بإكمال الدروس وجمع الجواهر.','إتمام'],
  w:['شهادات الإبداع والمواظبة','تُنال بالعمل والصبر، وباعتماد وليّ الأمر والمعلّم.','تقدير']};
var CERTS=[];
AXES.forEach(function(a){
  CERTS.push({id:'mx-'+a.id,k:'x',c:a.c,t:'شهادة إتقان',sub:'خزانة «'+a.name+'»',patron:AX_PATRON[a.id],
    ok:function(s){var b=s.best[a.id];return b&&b.p>=80?{d:b.d,sc:b.p}:null;},
    body:function(n,aw){return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨اجتاز|اجتازت⟩ اختبار خزانة «'+a.name+'» بدرجة '+n2a(aw.sc)+'٪ من المحاولة الأولى، ⟨فاستحقّ|فاستحقّت⟩ شهادة الإتقان.';},
    need:function(s){var b=s.best[a.id];return '⟨اجتز|اجتازي⟩ «اختبار الخزانة» بثمانين في المئة أو أكثر.'+(b?' أفضل درجةٍ حتى الآن: '+n2a(b.p)+'٪.':'');},
    prog:function(s){var b=s.best[a.id];return [b?Math.min(b.p,80):0,80];}});
});
CERTS.push({id:'mx-full',k:'x',c:'gold',t:'شهادة الإتقان الشامل',sub:'الخزائن '+axWord(),patron:'من الخليل بن أحمد إلى الدكتور فاضل السامرائي',
  ok:function(s){var b=s.fullBest;return b&&b.p>=80?{d:b.d,sc:b.p}:null;},
  body:function(n,aw){return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨اجتاز|اجتازت⟩ الاختبار الشامل في الخزائن '+axWord()+' بدرجة '+n2a(aw.sc)+'٪ من المحاولة الأولى، ⟨فاستحقّ|فاستحقّت⟩ شهادة الإتقان الشامل.';},
  need:function(s){var b=s.fullBest;return '⟨اجتز|اجتازي⟩ «الاختبار الشامل» بثمانين في المئة أو أكثر.'+(b?' أفضل درجةٍ حتى الآن: '+n2a(b.p)+'٪.':'');},
  prog:function(s){var b=s.fullBest;return [b?Math.min(b.p,80):0,80];}});
AXES.forEach(function(a){
  CERTS.push({id:'ax-'+a.id,k:'c',c:a.c,t:'شهادة إتمام',sub:'خزانة «'+a.name+'»',patron:AX_PATRON[a.id],
    ok:function(s){return s.axDone[a.id]?{}:null;},
    body:function(n){var m=LESSONS.filter(function(l){return l.ax===a.id;}).length;return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨أتمّ|أتمّت⟩ دروس خزانة «'+a.name+'» كلّها، ⟨وجمع|وجمعت⟩ جواهرها '+({3:'الثلاث',4:'الأربع',5:'الخمس',6:'الستّ',7:'السبع'}[m]||'كلّها')+'.';},
    need:function(s){return '⟨أكمل|أكملي⟩ دروس الخزانة كلّها.';},
    prog:function(s){return [s.axHave[a.id]||0,s.axN[a.id]];}});
});
/* milestones; «g-all» follows the content as chambers are added (g-27 stays a milestone for those who earned it) */
var GEM_N=LESSONS.length;
[[5,'خمس جواهر','خمسًا من جواهر العربية'],[15,'خمس عشرة جوهرة','خمس عشرة جوهرةً من جواهر العربية'],[27,'سبعٌ وعشرون جوهرة','سبعًا وعشرين جوهرةً من جواهر العربية'],
 ['all','الجواهر كلّها','جواهر الخزائن '+axWord()+' كلّها، من الخليل بن أحمد إلى الدكتور فاضل السامرائي']].forEach(function(g){
  var all=g[0]==='all'; if(all) g[0]=GEM_N; else if(g[0]>=GEM_N) return;
  CERTS.push({id:'g-'+(all?'all':g[0]),k:'c',c:all?'gold':'teal',t:all?'شهادة خاتم الخزائن':'شهادة الجواهر',sub:g[1],
    ok:function(s){return s.gems>=g[0]?{}:null;},
    body:function(n){return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨جمع|جمعت⟩ '+g[2]+'.';},
    need:function(){return '⟨اجمع|اجمعي⟩ '+cnt(g[0],['جوهرة','جوهرتين','جواهر','جوهرة'])+'.';},
    prog:function(s){return [Math.min(s.gems,g[0]),g[0]];}});
});
[[7,'سبعة أيامٍ متتالية'],[30,'ثلاثون يومًا متتالية']].forEach(function(x){
  CERTS.push({id:'s-'+x[0],k:'w',c:'olive',t:'شهادة المواظبة',sub:x[1],
    ok:function(s){return s.bestStreak>=x[0]?{}:null;},
    body:function(n){return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨واظب|واظبت⟩ على «جوهرة اليوم» '+(x[0]===7?'سبعة أيامٍ متتالية':'ثلاثين يومًا متتالية')+'، وأحبّ الأعمال أدومها وإن قلّ.';},
    need:function(s){return '⟨أجب|أجيبي⟩ عن «جوهرة اليوم» '+(x[0]===7?'سبعة أيامٍ':'ثلاثين يومًا')+' متتالية.'+(s.bestStreak?' أطول سلسلةٍ لك: '+daysWord(s.bestStreak)+'.':'');},
    prog:function(s){return [Math.min(s.bestStreak,x[0]),x[0]];}});
});
CERTS.push({id:'w-1',k:'w',c:'rose',t:'⟨شهادة المبدع الصغير|شهادة المبدعة الصغيرة⟩',sub:'أوّل عملٍ معتمد',
  ok:function(s){return s.firstWork?{d:s.firstWork.approvedAt,x:titleOf(s.firstWork)}:null;},
  body:function(n,aw){return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨صنع|صنعت⟩ أوّل عملٍ يعتمده وليّ ⟨أمره|أمرها⟩'+(aw.x?': «'+esc(aw.x)+'»':'')+'.';},
  need:function(){return '⟨اصنع|اصنعي⟩ عملًا في الاستوديو يعتمده وليّ أمرك.';},prog:function(s){return [Math.min(s.approved,1),1];}});
CERTS.push({id:'t-1',k:'w',c:'lapis',t:'شهادة ثناء المعلّم',sub:'عملٌ اعتمده المعلّم',
  ok:function(s){return s.firstTeacher?{d:s.firstTeacher.teacher.d,x:titleOf(s.firstTeacher)}:null;},
  body:function(n,aw){return 'تشهد «كنوز البيان» بأنّ المعلّم اعتمد عملًا '+'⟨للطالب|للطالبة⟩ '+n+(aw.x?': «'+esc(aw.x)+'»':'')+'.';},
  need:function(){return 'عملٌ ⟨لك|لكِ⟩ يعتمده المعلّم بعد أن يرسله إليه وليّ أمرك.';},prog:function(s){return [Math.min(s.teacher,1),1];}});
CERTS.push({id:'ed-1',k:'w',c:'gold',t:'⟨شهادة رئيس التحرير|شهادة رئيسة التحرير⟩',sub:'مجلةٌ صدرت',
  ok:function(s){return s.editorMag?{d:s.editorMag.pubAt,x:'«'+s.editorMag.name+'» العدد '+n2a(s.editorMag.no)}:null;},
  body:function(n,aw){return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨حرّر|حرّرت⟩ '+(aw.x?'مجلة '+esc(aw.x):'مجلّةً')+' حتى صدرت.';},
  need:function(){return '⟨حرّر|حرّري⟩ مجلةً حتى يُصدرها وليّ أمرك.';},prog:function(s){return [s.editorMag?1:0,1];}});
CERTS.push({id:'rd-1',k:'w',c:'plum',t:'⟨شهادة قارئ الأسبوع|شهادة قارئة الأسبوع⟩',sub:'قراءةٌ جميلة',
  ok:function(s){return s.weekly?{}:null;},
  body:function(n){return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨اختير قارئ|اختيرت قارئة⟩ الأسبوع لجمال ⟨قراءته|قراءتها⟩ وحسن ⟨أدائه|أدائها⟩.';},
  need:function(){return '⟨اقرأ|اقرئي⟩ في «قراءتي» قراءةً جميلة يختارها وليّ أمرك.';},prog:function(s){return [Math.min(s.weekly,1),1];}});
CERTS.push({id:'rz-1',k:'w',c:'teal',t:'⟨شهادة صانع الألغاز|شهادة صانعة الألغاز⟩',sub:'لغزٌ مُهدى',
  ok:function(s){return s.riddles?{}:null;},
  body:function(n){return 'تشهد «كنوز البيان» بأنّ ⟨الطالب|الطالبة⟩ '+n+' ⟨صنع|صنعت⟩ لغزًا لغويًّا ⟨وأهداه|وأهدته⟩ إلى ⟨أصدقائه|أصدقائها⟩.';},
  need:function(){return '⟨اصنع|اصنعي⟩ لغزًا في الاستوديو، يهديه وليّ أمرك إلى أصدقائك.';},prog:function(s){return [Math.min(s.riddles,1),1];}});
var certById={}; CERTS.forEach(function(c){certById[c.id]=c;});

function certSync(kidId){
  if(!kidId||!kidById(kidId)) return [];
  var s=kidStats(kidId), d=s.d, got=[]; d.certs=d.certs||{};
  CERTS.forEach(function(c){
    if(d.certs[c.id]) return;
    var r=c.ok(s); if(!r) return;
    r.d=typeof r.d==='string'?dateOf(r.d):(r.d||Date.now()); r.seen=false; d.certs[c.id]=r; got.push(c);
  });
  if(got.length) saveKidData(kidId,d);
  return got;
}
function certTitle(c,f){return Gx(c.t,f)+' · '+c.sub;}
function certNote(list){
  if(!list||!list.length) return '';
  var c=list[0];
  return '<button class="banner gold" type="button" data-act="cert" data-id="'+c.id+'">'+ICON.shield+'<div class="bn-t"><strong>⟨نلتَ|نلتِ⟩ '+Gx(c.t,isF())+'!</strong><span>'+c.sub+(list.length>1?' وغيرها':'')+'. ⟨افتحها|افتحيها⟩ ⟨واطبعها|واطبعيها⟩.</span></div></button>';
}

/* ---------- garden ---------- */
function gardenItems(s){
  var it=[], certs=s.d.certs||{};
  LESSONS.forEach(function(l){ if(s.d.prog[l.id]) it.push('f:'+l.id); });
  AXES.forEach(function(a){ if(s.axDone[a.id]) it.push('t:'+a.id); if(certs['mx-'+a.id]) it.push('x:'+a.id); });
  [3,7,14].forEach(function(n,i){ if(s.bestStreak>=n) it.push('b'+(i+1)); });
  [1,3,6,10,15].forEach(function(n,i){ if(s.approved>=n) it.push('u'+(i+1)); });
  [1,2,3,4].forEach(function(n){ if(s.mags>=n) it.push('l'+n); });
  [1,2,3,4,5].forEach(function(n){ if(s.writings>=n) it.push('v'+n); });
  [1,2,3,4,5].forEach(function(n){ if(s.teacher>=n) it.push('s'+n); });
  var rmN=Object.keys(s.d.rm||{}).length; [10,20,30].forEach(function(n,i){ if(rmN>=n) it.push('r'+(i+1)); });
  if(s.weekly) it.push('n');
  if(certs['mx-full']) it.push('pk');
  return it;
}
var GWORD={f:['وردةٌ','وردتان','ورود','وردة'],t:['شجرةٌ','شجرتان','أشجار','شجرة'],x:['شجرةٌ مثمرة','شجرتان مثمرتان','أشجارٍ مثمرة','شجرةً مثمرة'],
  b:['طائرٌ','طائران','طيور','طائرًا'],u:['فراشةٌ','فراشتان','فراشات','فراشةً'],l:['فانوسٌ','فانوسان','فوانيس','فانوسًا'],
  v:['لبلابٌ على عمود','لبلابٌ على عمودين','أعمدةٍ عليها لبلاب','عمودًا عليه لبلاب'],s:['نجمةٌ','نجمتان','نجوم','نجمةً'],r:['سلسلةُ أنوار','سلسلتا أنوار','سلاسل أنوار','سلسلةَ أنوار'],n:['بلبلٌ يغنّي','',''],pk:['طاووس','','']};
function gKind(i){return i.indexOf(':')>0?i.split(':')[0]:i.replace(/\d+$/,'');}
function gardenNews(list){
  var by={},order=['f','t','x','u','b','s','r','l','v','n','pk'];
  list.forEach(function(i){var k=gKind(i);by[k]=(by[k]||0)+1;});
  return order.filter(function(k){return by[k];}).map(function(k){return GWORD[k][1]?cnt(by[k],GWORD[k]):GWORD[k][0];}).join('، و');
}
function gardenFresh(s,its){var seen=s.d.gseen; if(!Array.isArray(seen)) seen=[]; return its.filter(function(i){return seen.indexOf(i)<0;});}
function markGardenSeen(kidId,its){var d=kidData(kidId); d.gseen=its.slice(); saveKidData(kidId,d);}

function hsh(n){var x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x);}
var PLANTERS=[{ax:'lamasat',x:8,w:88,y:174,h:16,b:26,tH:44},{ax:'furuq',x:106,w:88,y:174,h:16,b:26,tH:44},{ax:'nahw',x:206,w:88,y:174,h:16,b:26,tH:44},
  {ax:'asrar',x:304,w:88,y:174,h:16,b:26,tH:44},{ax:'aliya',x:8,w:132,y:292,h:20,b:30,tH:54},{ax:'taammal',x:260,w:132,y:292,h:20,b:30,tH:54},
  {ax:'asma',x:132,w:136,y:340,h:14,b:20,tH:30,sc:.62}].filter(function(p){return !!axById[p.ax];});
var GH=PLANTERS.length>6?360:320;
function gardenSVG(s,its,o){
  o=o||{}; var has={},fresh={},id=o.id||'g',P=s.d.prog; its.forEach(function(i){has[i]=1;}); (o.fresh||[]).forEach(function(i){fresh[i]=1;});
  function G_(gi,inner){return '<g data-gi="'+gi+'"'+(fresh[gi]?' class="gd-new"':'')+'>'+inner+'</g>';}
  var h='<svg class="gsvg" viewBox="0 0 400 '+GH+'" role="img" aria-label="'+escA(o.label||'حديقة البيان')+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><linearGradient id="'+id+'-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--gd-sky1)"/><stop offset=".55" style="stop-color:var(--gd-sky2)"/><stop offset="1" style="stop-color:var(--gd-sky3)"/></linearGradient>'+
    '<radialGradient id="'+id+'-glow"><stop offset="0" stop-color="#FFD98A" stop-opacity=".9"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>'+
    '<pattern id="'+id+'-tile" width="32" height="16" patternUnits="userSpaceOnUse"><path d="M0 8L16 0L32 8L16 16Z" fill="none" style="stroke:var(--gd-floor2)" stroke-width="1"/><circle cx="16" cy="8" r="1.6" style="fill:var(--gd-floor2)"/></pattern></defs>';
  // sky, moon, stars
  h+='<rect width="400" height="180" fill="url(#'+id+'-sky)"/>';
  h+='<path d="M372 11A11 11 0 0 0 372 33A14 14 0 0 1 372 11Z" style="fill:var(--gd-moon)"/>';
  [[24,14],[96,8],[160,18],[236,9],[306,17]].forEach(function(p,i){
    if(!has['s'+(i+1)]) return;
    var x=p[0],y=p[1];
    h+=G_('s'+(i+1),'<path class="gd-tw" d="M'+x+' '+(y-6)+'Q'+x+' '+y+' '+(x+6)+' '+y+'Q'+x+' '+y+' '+x+' '+(y+6)+'Q'+x+' '+y+' '+(x-6)+' '+y+'Q'+x+' '+y+' '+x+' '+(y-6)+'Z" fill="#FFE08A"/>');
  });
  // arcade wall with four arches (alternating voussoirs, after the Great Mosque of Cordoba)
  var A=[[22,98],[114,190],[206,282],[298,374]], wall='M0 36H400V176H0Z';
  A.forEach(function(a){var m=(a[0]+a[1])/2;wall+='M'+a[0]+' 176V92Q'+a[0]+' 56 '+m+' 50Q'+a[1]+' 56 '+a[1]+' 92V176Z';});
  h+='<g>'; for(var mx=0;mx<400;mx+=20) h+='<rect x="'+(mx+3)+'" y="27" width="14" height="10" rx="1" style="fill:var(--gd-wall)"/>'; h+='</g>';
  h+='<path d="'+wall+'" fill-rule="evenodd" style="fill:var(--gd-wall)"/><rect y="36" width="400" height="5" style="fill:var(--gd-wall2)"/>';
  A.forEach(function(a){var m=(a[0]+a[1])/2;h+='<path d="M'+a[0]+' 94Q'+a[0]+' 56 '+m+' 50Q'+a[1]+' 56 '+a[1]+' 94" fill="none" style="stroke:var(--gd-vous)" stroke-width="7" stroke-dasharray="6 6"/>';});
  // ivy on the columns
  [11,106,198,290,388].forEach(function(cx,i){
    if(!has['v'+(i+1)]) return;
    var leaves=''; [162,148,134,120,106,92,78,66].forEach(function(y,j){var dx=j%2?5:-5;leaves+='<ellipse cx="'+(cx+dx)+'" cy="'+y+'" rx="4.6" ry="2.6" transform="rotate('+(j%2?-30:30)+' '+(cx+dx)+' '+y+')" style="fill:var(--gd-leaf)"/>';});
    h+=G_('v'+(i+1),'<path d="M'+cx+' 172C'+(cx-6)+' 150 '+(cx+6)+' 130 '+cx+' 110S'+(cx-6)+' 80 '+cx+' 62" fill="none" style="stroke:var(--gd-leaf2)" stroke-width="2"/>'+leaves);
  });
  // Ramadan light strings across the arcade: one for every ten touches
  [1,2,3].forEach(function(i){
    if(!has['r'+i]) return;
    var cols=[11,106,198,290,388], y0=92+i*10, sag=5+i*2, cs=['#FFD36E','#FF9E92','#7FE0CC','#FFB0D6'], g='';
    for(var c=0;c<cols.length-1;c++){
      var x1=cols[c],x2=cols[c+1],mx=(x1+x2)/2;
      g+='<path d="M'+x1+' '+y0+'Q'+mx+' '+(y0+sag*2)+' '+x2+' '+y0+'" fill="none" style="stroke:var(--gd-metal)" stroke-width=".8"/>';
      for(var k=1;k<8;k++){var t=k/8, bx=(1-t)*(1-t)*x1+2*(1-t)*t*mx+t*t*x2, by=(1-t)*(1-t)*y0+2*(1-t)*t*(y0+sag*2)+t*t*y0;
        var col=cs[(k+c+i)%4], cy=(by+2.4).toFixed(1); bx=bx.toFixed(1);
        g+='<circle cx="'+bx+'" cy="'+cy+'" r="4.6" fill="'+col+'" fill-opacity=".22"/><circle class="gd-tw" style="animation-delay:-'+((k+c+i)%5*.4).toFixed(1)+'s" cx="'+bx+'" cy="'+cy+'" r="2.3" fill="'+col+'" stroke="#3B2A10" stroke-opacity=".35" stroke-width=".5"/>';}
    }
    h+=G_('r'+i,g);
  });
  // lanterns in the arches
  A.forEach(function(a,i){
    if(!has['l'+(i+1)]) return; var m=(a[0]+a[1])/2;
    h+=G_('l'+(i+1),'<circle class="gd-glow" cx="'+m+'" cy="76" r="18" fill="url(#'+id+'-glow)"/><line x1="'+m+'" y1="50" x2="'+m+'" y2="64" style="stroke:var(--gd-metal)" stroke-width="1.4"/>'+
      '<path d="M'+(m-4)+' 64H'+(m+4)+'L'+(m+2)+' 61H'+(m-2)+'Z" style="fill:var(--gd-metal)"/><path d="M'+(m-6)+' 65H'+(m+6)+'L'+(m+8)+' 74L'+(m+6)+' 86H'+(m-6)+'L'+(m-8)+' 74Z" fill="#E0AE3A"/>'+
      '<rect x="'+(m-3.5)+'" y="68" width="7" height="14" rx="1.5" fill="#FFF0C2"/><path d="M'+(m-5)+' 86H'+(m+5)+'L'+m+' 91Z" style="fill:var(--gd-metal)"/>');
  });
  // birds on the parapet
  function bird(x,y,c,flip){return '<g transform="translate('+x+' '+y+')'+(flip?' scale(-1 1)':'')+'"><path d="M-7 -6L-14 -3L-6 -3Z" style="fill:'+c+'"/><ellipse cx="0" cy="-5" rx="7.5" ry="5" style="fill:'+c+'"/>'+
    '<ellipse cx="-1" cy="-5" rx="4" ry="2.6" fill="#000" fill-opacity=".18"/><circle cx="6" cy="-9" r="3.6" style="fill:'+c+'"/><path d="M9.3 -9.6L13 -8.6L9.3 -7.6Z" fill="#E0AE3A"/><circle cx="7" cy="-9.6" r=".9" fill="#141D3F"/></g>';}
  [[52,27,'var(--teal)'],[336,27,'var(--rose)'],[192,27,'var(--lapis)']].forEach(function(b,i){ if(has['b'+(i+1)]) h+=G_('b'+(i+1),bird(b[0],b[1],b[2],i===1)); });
  if(has.n) h+=G_('n',bird(132,27,'#9A6B2F')+'<text x="140" y="12" font-size="11" fill="#FFE08A" class="gd-note">♪</text><text x="150" y="20" font-size="9" fill="#FFE08A" class="gd-note n2">♫</text>');
  // peacock perched on the wall, tail hanging down
  if(has.pk){
    var eyes=[[279,50],[288,70],[297,62],[295,92],[307,86],[299,114],[313,108]].map(function(p){return '<ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="4" ry="5" fill="#E0AE3A"/><ellipse cx="'+p[0]+'" cy="'+(p[1]+.6)+'" rx="2.2" ry="2.8" fill="#1B4FA0"/>';}).join('');
    h+=G_('pk','<path d="M265 26C277 46 287 80 289 124L323 120C315 82 295 46 271 22Z" fill="#17705F"/><path d="M268 28C282 50 292 82 298 120M271 26C289 50 303 80 313 118" fill="none" stroke="#3FAE8C" stroke-width="1.2"/>'+eyes+
      '<ellipse cx="263" cy="21" rx="7.5" ry="8" fill="#1F5FA8"/><ellipse cx="266.5" cy="22.5" rx="5" ry="6" fill="#17705F"/>'+
      '<path d="M259.5 16Q256.5 12.5 256 9" fill="none" stroke="#1F5FA8" stroke-width="4" stroke-linecap="round"/><circle cx="256" cy="9" r="3.3" fill="#1F5FA8"/>'+
      '<path d="M253 8.4L249.6 9.4L253 10.4Z" fill="#E0AE3A"/><circle cx="255" cy="8.2" r=".9" fill="#fff"/>'+
      '<path d="M255 6L253 2.2M256.5 5.8V1.6M258 6.2L260 2.4" stroke="#1F5FA8" stroke-width=".8"/><circle cx="253" cy="2.2" r=".9" fill="#E0AE3A"/><circle cx="256.5" cy="1.6" r=".9" fill="#E0AE3A"/><circle cx="260" cy="2.4" r=".9" fill="#E0AE3A"/>');
  }
  // terrace and tiled floor
  h+='<rect y="170" width="400" height="8" style="fill:var(--gd-stone)"/><rect y="178" width="400" height="'+(GH-178)+'" style="fill:var(--gd-floor)"/><rect y="178" width="400" height="'+(GH-178)+'" fill="url(#'+id+'-tile)"/>';
  // fountain
  var alive=s.alive;
  h+='<g data-gi="fountain"><path d="M144 262L149 288Q200 302 251 288L256 262Z" style="fill:var(--gd-stone2)"/><path d="M152 274H248" style="stroke:var(--gd-stone)" stroke-width="2"/>'+
    '<ellipse cx="200" cy="262" rx="56" ry="13" style="fill:var(--gd-stone)"/><ellipse cx="200" cy="262" rx="50" ry="10" style="fill:var(--gd-water)"/>'+
    '<rect x="195" y="234" width="10" height="28" style="fill:var(--gd-stone2)"/><ellipse cx="200" cy="234" rx="18" ry="5" style="fill:var(--gd-stone)"/><ellipse cx="200" cy="233" rx="14" ry="3" style="fill:var(--gd-water)"/>'+
    '<circle cx="200" cy="226" r="3.2" fill="#E0AE3A"/>'+
    (alive?'<path class="gd-jet" d="M200 224Q184 206 168 258" fill="none" style="stroke:var(--gd-water)" stroke-width="2.2" stroke-linecap="round"/><path class="gd-jet" d="M200 224Q216 206 232 258" fill="none" style="stroke:var(--gd-water)" stroke-width="2.2" stroke-linecap="round"/>'+
      '<ellipse class="gd-rip" cx="200" cy="262" rx="20" ry="4" fill="none" stroke="#fff" stroke-opacity=".7"/>':'')+'</g>';
  // planters: trees behind, flowers, then the trough in front
  PLANTERS.forEach(function(pl){
    var a=axById[pl.ax], ls=LESSONS.filter(function(l){return l.ax===pl.ax;}), n=ls.length, col='var(--'+a.c+')', cx=pl.x+pl.w/2, y=pl.y;
    if(has['t:'+pl.ax]){
      var ty=y-pl.tH, fr='';
      if(has['x:'+pl.ax]) [[-12,-2],[10,-8],[-4,-16],[14,4],[-16,8],[2,6]].forEach(function(f){fr+='<circle cx="'+(cx+f[0])+'" cy="'+(ty+f[1])+'" r="3.4" style="fill:'+col+'" stroke="#FFE08A" stroke-width="1"/>';});
      var sc=pl.sc||1, tr=sc<1?' transform="translate('+cx+' '+y+') scale('+sc+') translate('+(-cx)+' '+(-y)+')"':'';
      h+=G_('t:'+pl.ax,'<g'+tr+'><path d="M'+(cx-3)+' '+y+'L'+(cx-2)+' '+(ty+8)+'H'+(cx+2)+'L'+(cx+3)+' '+y+'Z" style="fill:var(--gd-trunk)"/><path d="M'+cx+' '+(ty+18)+'L'+(cx-10)+' '+(ty+8)+'M'+cx+' '+(ty+22)+'L'+(cx+10)+' '+(ty+12)+'" style="stroke:var(--gd-trunk)" stroke-width="2"/>'+
        '<circle cx="'+(cx-13)+'" cy="'+(ty+4)+'" r="14" style="fill:var(--gd-leaf2)"/><circle cx="'+(cx+13)+'" cy="'+(ty+4)+'" r="14" style="fill:var(--gd-leaf2)"/><circle cx="'+cx+'" cy="'+(ty-6)+'" r="19" style="fill:var(--gd-leaf)"/>'+
        '<circle cx="'+(cx-6)+'" cy="'+(ty-12)+'" r="6" fill="#fff" fill-opacity=".12"/></g>')+(has['x:'+pl.ax]?G_('x:'+pl.ax,'<g'+tr+'>'+fr+'</g>'):'');
    }
    h+='<rect x="'+(pl.x+3)+'" y="'+(y-3)+'" width="'+(pl.w-6)+'" height="5" rx="2" style="fill:var(--gd-soil)"/>';
    ls.forEach(function(l,i){
      var fx=pl.x+(i+.5)*pl.w/n, done=P[l.id];
      if(!done){h+='<ellipse cx="'+fx+'" cy="'+(y-2)+'" rx="3.4" ry="1.8" style="fill:var(--gd-soil2)"/>';return;}
      var fh=pl.b+Math.round(hsh(LESSONS.indexOf(l)+1)*14), fy=y-fh, pet='';
      for(var k=0;k<5;k++){var an=k*Math.PI*2/5-Math.PI/2;pet+='<circle cx="'+(fx+Math.cos(an)*4.4).toFixed(1)+'" cy="'+(fy+Math.sin(an)*4.4).toFixed(1)+'" r="4" style="fill:'+col+'"/>';}
      h+=G_('f:'+l.id,'<path d="M'+fx+' '+(y-1)+'Q'+(fx+(i%2?3:-3))+' '+(y-fh/2)+' '+fx+' '+fy+'" fill="none" style="stroke:var(--gd-leaf2)" stroke-width="1.8"/>'+
        '<ellipse cx="'+(fx+(i%2?-4:4))+'" cy="'+(y-fh*.45)+'" rx="4.2" ry="2" transform="rotate('+(i%2?30:-30)+' '+(fx+(i%2?-4:4))+' '+(y-fh*.45)+')" style="fill:var(--gd-leaf)"/>'+
        pet+'<circle cx="'+fx+'" cy="'+fy+'" r="2.6" fill="'+(done.p?'#F2C14E':'#FFF6E0')+'"'+(done.p?' stroke="#B8860B" stroke-width=".6"':'')+'/>');
    });
    h+='<path d="M'+(pl.x-2)+' '+(y-1)+'H'+(pl.x+pl.w+2)+'L'+(pl.x+pl.w-5)+' '+(y+pl.h)+'H'+(pl.x+5)+'Z" style="fill:var(--gd-pot)"/>'+
      '<rect x="'+(pl.x-3)+'" y="'+(y-3)+'" width="'+(pl.w+6)+'" height="4" rx="2" style="fill:var(--gd-pot2)"/><rect x="'+(pl.x+4)+'" y="'+(y+4)+'" width="'+(pl.w-8)+'" height="3.5" rx="1.5" style="fill:'+col+'"/>';
  });
  // butterflies
  [[96,206,'var(--rose)'],[318,204,'var(--gold-fill)'],[62,254,'var(--plum)'],[344,250,'var(--teal)'],[200,198,'var(--lapis)']].forEach(function(b,i){
    if(!has['u'+(i+1)]) return;
    h+=G_('u'+(i+1),'<g transform="translate('+b[0]+' '+b[1]+')"><g class="gd-bf" style="animation-delay:-'+(i*.7)+'s"><g class="gd-w" style="animation-delay:-'+(i*.13)+'s">'+
      '<ellipse cx="-4.6" cy="-2.4" rx="5" ry="4" transform="rotate(-25 -4.6 -2.4)" style="fill:'+b[2]+'"/><ellipse cx="4.6" cy="-2.4" rx="5" ry="4" transform="rotate(25 4.6 -2.4)" style="fill:'+b[2]+'"/>'+
      '<ellipse cx="-3.2" cy="3" rx="3.2" ry="2.6" style="fill:'+b[2]+'" fill-opacity=".8"/><ellipse cx="3.2" cy="3" rx="3.2" ry="2.6" style="fill:'+b[2]+'" fill-opacity=".8"/></g>'+
      '<rect x="-.8" y="-4.5" width="1.6" height="9" rx=".8" fill="#141D3F"/><path d="M0 -4L-2.5 -8M0 -4L2.5 -8" stroke="#141D3F" stroke-width=".7"/></g></g>');
  });
  return h+'</svg>';
}
var GLEG=[
  ['🌷','وردةٌ لكلّ جوهرة','وسطها ذهبيّ إن ⟨أجبتَ|أجبتِ⟩ بلا خطأ.',function(s,c){return [s.gems,LESSONS.length];}],
  ['🌳','شجرةٌ لكلّ خزانةٍ ⟨تكملها|تكملينها⟩','في حوضها، بلون الخزانة.',function(s){return [AXES.filter(function(a){return s.axDone[a.id];}).length,AXES.length];}],
  ['🍎','ثمارٌ على الشجرة حين ⟨تتقن|تتقنين⟩ الخزانة','ثمانون في المئة أو أكثر في «اختبار الخزانة».',function(s,c){return [AXES.filter(function(a){return c['mx-'+a.id];}).length,AXES.length];}],
  ['🐦','طيورٌ على السور','حين ⟨تواظب|تواظبين⟩ على «جوهرة اليوم» ٣ أيام، ثم ٧، ثم ١٤.',function(s){return [[3,7,14].filter(function(n){return s.bestStreak>=n;}).length,3];}],
  ['🦋','فراشاتٌ تطير','كلما اعتمد وليّ أمرك أعمالًا ⟨لك|لكِ⟩: ١ ثم ٣ ثم ٦ ثم ١٠ ثم ١٥.',function(s){return [[1,3,6,10,15].filter(function(n){return s.approved>=n;}).length,5];}],
  ['⭐','نجومٌ في السماء','نجمةٌ كلما اعتمد المعلّم عملًا ⟨لك|لكِ⟩.',function(s){return [Math.min(s.teacher,5),5];}],
  ['🏮','فوانيس في الأقواس','فانوسٌ لكلّ مجلةٍ تصدر وفيها عملٌ ⟨لك|لكِ⟩.',function(s){return [Math.min(s.mags,4),4];}],
  ['🌿','لبلابٌ على الأعمدة','لكلّ تمرينٍ ⟨تكتبه|تكتبينه⟩ في «ورشة الخيال».',function(s){return [Math.min(s.writings,5),5];}],
  ['✨','أنوار رمضان على الأقواس','سلسلةٌ لكلّ عشر لمساتٍ ⟨تجيب|تجيبين⟩ عنها في «لمسات رمضان».',function(s){var n=Object.keys(s.d.rm||{}).length;return [[10,20,30].filter(function(x){return n>=x;}).length,3];}],
  ['🎶','بلبلٌ يغنّي','حين ⟨تكون قارئ|تكونين قارئة⟩ الأسبوع.',function(s){return [s.weekly?1:0,1];}],
  ['🦚','طاووسٌ على السور','حين ⟨تنال|تنالين⟩ شهادة الإتقان الشامل.',function(s,c){return [c['mx-full']?1:0,1];}]
];
function rewardGarden(){
  if(!L||!KID||!KD) return '';
  var seen=Array.isArray(KD.gseen)?KD.gseen:[];
  if(seen.indexOf('f:'+L.id)>=0) return '';
  return '<button class="banner green" type="button" data-act="garden"><span class="bn-e" aria-hidden="true">🌷</span><div class="bn-t"><strong>نبتت في حديقتك وردةٌ جديدة</strong><span>⟨اضغط|اضغطي⟩ لتراها'+(miss===0?'، ووسطها ذهبيّ لأنك ⟨أجبتَ|أجبتِ⟩ بلا خطأ':'')+'.</span></div></button>';
}
function gardenSummary(s,its){
  var f=its.filter(function(i){return i.indexOf('f:')===0;}).length, t=its.filter(function(i){return i.indexOf('t:')===0;}).length;
  return f?(cnt(f,GWORD.f)+(t?' و'+cnt(t,GWORD.t):'')):'⟨أكمل|أكملي⟩ درسًا لتنبت أول وردة.';
}

/* ---------- pages ---------- */
function gardenView(kidId,asParent){
  var k=kidById(kidId||(KID&&KID.id)); if(!k) return home(); L=null;
  certSync(k.id);
  var s=kidStats(k.id), its=gardenItems(s), fresh=asParent?[]:gardenFresh(s,its), c=s.d.certs||{}, f=gOf(k);
  var html='<div class="ax-page" style="--ax:var(--olive)"><button class="back" type="button" data-act="'+(asParent?'pProg':'home')+'"'+(asParent?' data-id="'+k.id+'"':'')+'>'+BACK+' '+(asParent?'تقدّم '+esc(k.name):'الخزائن')+'</button>'+
    '<header class="page-head"><h1 class="h1">'+(asParent?'حديقة '+esc(k.name):'حديقتي')+'</h1><p class="lead">'+(asParent?'تنمو حديقة الطفل بما يتعلّمه ويصنعه، ولا يذبل فيها شيءٌ مما ناله.':'كلّ ما ⟨تتعلّمه|تتعلّمينه⟩ ⟨وتصنعه|وتصنعينه⟩ ينبت هنا، ولا يذبل فيها شيءٌ ⟨نلتَه|نلتِه⟩.')+'</p></header>'+
    (fresh.length?'<p class="tip new-tip">✨ جديدٌ في حديقتك: '+gardenNews(fresh)+'.</p>':'')+
    (!its.length&&!asParent?'<p class="tip">🌱 حديقتك تنتظر أول وردة: ⟨أكمل|أكملي⟩ درسًا واحدًا، ⟨وتعال|وتعالَي⟩ ⟨لتراها|لتريها⟩ تنبت هنا.</p>':'')+
    '<div class="garden">'+gardenSVG(s,its,{id:'gv',fresh:fresh,label:'حديقة '+k.name})+'</div>'+
    (s.alive?'':'<p class="muted small center">النافورة تجري ما دامت سلسلة «جوهرة اليوم» قائمة.</p>')+
    '<section><h2 class="h2">'+(asParent?'كيف تنمو الحديقة؟':'كيف تنمو حديقتك؟')+'</h2><ul class="gleg">'+GLEG.map(function(g){
      var p=g[3](s,c), done=p[0]>=p[1];
      return '<li class="'+(done?'done':'')+'"><span class="gl-e" aria-hidden="true">'+g[0]+'</span><span class="gl-m"><span class="gl-t">'+g[1]+'</span><span class="gl-d">'+g[2]+'</span>'+
        '<span class="as-bar"><i style="width:'+Math.round(p[0]/p[1]*100)+'%"></i></span></span><span class="gl-n">'+n2a(p[0])+' / '+n2a(p[1])+'</span></li>';}).join('')+'</ul></section>'+
    '<div class="actions">'+(asParent?'':'<button class="btn" type="button" data-act="certs">'+ICON.shield+' شهاداتي</button>')+'</div></div>';
  go(asParent?Gx(html,f):html);
  if(!asParent&&fresh.length) markGardenSeen(k.id,its);
}
function certsView(kidId,asParent){
  var k=kidById(kidId||(KID&&KID.id)); if(!k) return home(); L=null;
  certSync(k.id);
  var s=kidStats(k.id), c=s.d.certs||{}, f=gOf(k), got=CERTS.filter(function(x){return c[x.id];}).length;
  var html='<div class="ax-page" style="--ax:var(--gold)"><button class="back" type="button" data-act="'+(asParent?'pProg':'home')+'"'+(asParent?' data-id="'+k.id+'"':'')+'>'+BACK+' '+(asParent?'تقدّم '+esc(k.name):'الخزائن')+'</button>'+
    '<header class="page-head"><h1 class="h1">'+(asParent?'شهادات '+esc(k.name):'شهاداتي')+' <span class="muted h1-n">'+n2a(got)+' / '+n2a(CERTS.length)+'</span></h1>'+
    '<p class="lead">'+(asParent?'افتحوا أيّ شهادةٍ لطباعتها، أو إرسالها إلى العائلة بعد التنبيه والموافقة.':'كلّ شهادةٍ هنا ⟨تنالها|تنالينها⟩ بعملك. ⟨افتحها|افتحيها⟩ ⟨واطبعها|واطبعيها⟩، ⟨واطلب|واطلبي⟩ من وليّ أمرك أن يرسلها إلى من ⟨تحبّ|تحبّين⟩.')+'</p></header>'+
    ['x','c','w'].map(function(kd){
      return '<section><h2 class="h2">'+CERT_K[kd][0]+'</h2><p class="muted small" style="margin:-6px 0 10px">'+CERT_K[kd][1]+'</p><div class="certs">'+CERTS.filter(function(x){return x.k===kd;}).map(function(x){
        var aw=c[x.id];
        if(aw) return '<button class="ccard on" type="button" data-act="cert" data-id="'+x.id+'"'+(asParent?' data-k="'+k.id+'"':'')+' style="--cc:var(--'+x.c+')"><span class="cc-seal">'+STAR+'</span>'+
          '<span class="cc-t">'+Gx(x.t,f)+'</span><span class="cc-s">'+x.sub+'</span><span class="cc-d">'+fmtDate(aw.d)+(aw.sc?' · '+n2a(aw.sc)+'٪':'')+(!aw.seen&&!asParent?' · <b>جديدة</b>':'')+'</span></button>';
        var p=x.prog(s);
        return '<div class="ccard" style="--cc:var(--'+x.c+')"><span class="cc-seal off">'+STAR+'</span><span class="cc-t">'+Gx(x.t,f)+'</span><span class="cc-s">'+x.sub+'</span>'+
          '<span class="cc-need">'+x.need(s)+'</span><span class="as-bar"><i style="width:'+Math.round(p[0]/p[1]*100)+'%"></i></span></div>';
      }).join('')+'</div></section>';
    }).join('')+'</div>';
  go(asParent?Gx(html,f):html);
  if(!asParent){ var ch=false; CERTS.forEach(function(x){var a=c[x.id]; if(a&&!a.seen){a.seen=true;ch=true;}}); if(ch) saveKidData(k.id,s.d); }
}
function certHTML(c,aw,name,f){
  var kd=CERT_K[c.k];
  return Gx('<div class="cert" style="--cc:var(--'+c.c+')"><div class="cert-in">'+
    ['tl','tr','bl','br'].map(function(p){return '<span class="cert-cn '+p+'" aria-hidden="true">'+STAR+'</span>';}).join('')+
    '<p class="cert-verse">﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾</p><p class="cert-brand">كنوز البيان</p>'+
    '<h2 class="cert-t">'+c.t+'</h2><p class="cert-sub">'+c.sub+'</p>'+
    '<p class="cert-body">'+c.body('<span class="cert-name">'+esc(name)+'</span>',aw)+'</p>'+
    (c.patron?'<p class="cert-patron">'+c.patron+'</p>':'')+
    '<div class="cert-foot"><div class="cert-sig"><span>التاريخ</span><b>'+fmtDate(aw.d)+'</b></div>'+
      '<div class="cert-seal" aria-hidden="true">'+STAR+'<span>'+kd[2]+'</span></div>'+
      '<div class="cert-sig"><span>وليّ الأمر</span><b class="sig-line"></b></div></div></div></div>',f);
}
function certView(id,kidId,asParent){
  var k=kidById(kidId||(KID&&KID.id)), c=certById[id]; if(!k||!c) return home();
  var d=kidData(k.id), aw=d.certs&&d.certs[id]; if(!aw) return certsView(k.id,asParent);
  L=null;
  if(!asParent&&!aw.seen){aw.seen=true;saveKidData(k.id,d);}
  go('<div class="ax-page cert-page" style="--ax:var(--'+c.c+')"><div class="ph-top no-print"><button class="back" type="button" data-act="certs"'+(asParent?' data-k="'+k.id+'"':'')+'>'+BACK+' '+(asParent?'شهادات '+esc(k.name):'شهاداتي')+'</button></div>'+
    certHTML(c,aw,k.name,gOf(k))+
    '<div class="actions no-print"><button class="btn" type="button" data-act="print">اطبعها</button>'+
      (asParent?'<button class="btn ghost" type="button" data-act="exCert" data-id="'+id+'" data-k="'+k.id+'">'+ICON.share+' أرسلوها</button>':'')+'</div>'+
    (asParent?'':'<p class="muted small no-print">⟨تريد|تريدين⟩ أن تراها جدّتك؟ ⟨اطلب|اطلبي⟩ من وليّ أمرك أن يرسلها من «ركن وليّ الأمر».</p>')+'</div>');
}
async function exCert(id,kidId){
  var k=kidById(kidId), c=certById[id]; if(!k||!c) return;
  var d=kidData(k.id), aw=d.certs&&d.certs[id]; if(!aw) return;
  var r=await consent({kid:k,to:'من تختارون من العائلة أو المعلّمين',what:['الشهادة: '+Gx(c.t,gOf(k))+' · '+c.sub,'الاسم الذي تختارونه، وتاريخ الشهادة'+(aw.sc?' ودرجة الاختبار':'')]});
  if(!r) return;
  var html=pageShell(Gx(c.t,gOf(k))+' — '+r.name,'<main class="xp cert-export">'+certHTML(c,aw,r.name,gOf(k))+'<p class="no-print center-p"><button type="button" class="btn ghost" id="mzPrint">اطبعوا الشهادة</button></p></main>',
    "(function(){var b=document.getElementById('mzPrint');if(b)b.addEventListener('click',function(){window.print();});})();");
  var res=await shareFile(safeName(Gx(c.t,gOf(k))+' - '+r.name)+'.html',html,Gx(c.t,gOf(k)));
  if(res!=='aborted'){ aw.log=aw.log||[]; aw.log.push({d:Date.now(),name:r.name}); saveKidData(k.id,d); }
  afterShare(res);
}
