/* ================= «مختبر الحروف»: letters that the home dialect blends ================= */
/* Minimal pairs: one letter changes, the meaning changes. Articulation notes follow the classical makharij
   (طرف اللسان والثنايا، حافة اللسان والأضراس، أقصى اللسان واللهاة، الحلق) in plain words for children. */
var PAIRS=[
 {id:'p-ths',t:'ث / س',a:'ث',b:'س',
  ma:'⟨أخرج|أخرجي⟩ طرف لسانك قليلًا بين أسنانك الأمامية، ⟨وادفع|وادفعي⟩ الهواء بهدوء.',
  mb:'⟨أبقِ|أبقي⟩ طرف لسانك خلف أسنانك الأمامية، ⟨ودع|ودعي⟩ الهواء يصفر.',
  p:[['ثَمَر','الفاكهة','سَمَر','حديث الليل'],['ثَارَ','هاج وارتفع','سَارَ','مشى'],['ثَمِين','غالي القيمة','سَمِين','كثير الشحم']]},
 {id:'p-dhz',t:'ذ / ز',a:'ذ',b:'ز',
  ma:'طرف اللسان بين الأسنان كالثاء، مع صوتٍ يهتزّ في حلقك. ⟨ضع|ضعي⟩ يدك على حلقك ⟨لتحسّ|لتحسّي⟩ به.',
  mb:'كالسين خلف الأسنان، مع صوتٍ يهتزّ: زززز.',
  p:[['ذَلَّ','هان وضعف','زَلَّ','انزلق وأخطأ'],['ذَكِيّ','سريع الفهم','زَكِيّ','طاهرٌ طيّب'],['ذَرَّ','نثر الشيء','زَرَّ','أغلق الأزرار']]},
 {id:'p-zd',t:'ظ / ض',a:'ظ',b:'ض',
  ma:'طرف اللسان بين الأسنان كالذال، مع رفع مؤخّر اللسان، فيمتلئ فمك بالصوت.',
  mb:'حافة لسانك على أضراسك العليا، مع امتلاء الصوت. وهي الحرف الذي سُمّيت به العربية: لغة الضاد.',
  p:[['ظَلَّ','بقي','ضَلَّ','تاه'],['نَاظِرَة','تنظر','نَاضِرَة','مشرقةٌ حسنة'],['حَظَرَ','منع','حَضَرَ','جاء وحضر']]},
 {id:'p-qa',t:'ق / ء',a:'ق',b:'ء',
  ma:'أقصى لسانك مع أعلى الحلق، صوتٌ قويٌّ ينقطع: قْ.',
  mb:'من أقصى الحلق، صوتٌ يُقطع فجأة: أ.',
  p:[['قَلَم','أداة الكتابة','أَلَم','وجع'],['قَمَر','كوكب الليل','أَمَرَ','طلب أن يُفعل'],['سَاقَ','قاد أمامه','سَاءَ','قَبُح']]},
 {id:'p-ss',t:'ص / س',a:'ص',b:'س',
  ma:'كالسين، لكن ⟨ارفع|ارفعي⟩ مؤخّر لسانك، فيخرج الصوت ممتلئًا.',
  mb:'خلف الأسنان، رقيقٌ يصفر.',
  p:[['صَارَ','أصبح','سَارَ','مشى'],['صَيْف','فصل الحرّ','سَيْف','سلاح الفارس'],['صَبَرَ','تحمّل','سَبَرَ','اختبر وفحص']]},
 {id:'p-tt',t:'ط / ت',a:'ط',b:'ت',
  ma:'طرف اللسان على أصول الأسنان العليا، مع تفخيمٍ قويّ.',
  mb:'المكان نفسه، والصوت رقيقٌ خفيف.',
  p:[['طِين','تراب وماء','تِين','فاكهة'],['طَابَ','حَسُن','تَابَ','رجع عن الخطأ'],['بَطّ','طائرٌ يسبح','بَتَّ','قطع وحسم']]},
 {id:'p-hh',t:'ح / هـ',a:'ح',b:'هـ',
  ma:'من وسط الحلق، نفَسٌ مبحوح كأنك ⟨تُدفئ|تُدفئين⟩ يديك.',
  mb:'من أقصى الحلق، نفَسٌ خفيف كالتنهّد.',
  p:[['حَزَمَ','ربط بإحكام','هَزَمَ','غلب'],['حَلَّ','نزل، أو فكّ','هَلَّ','ظهر الهلال'],['حَرَمَ','منع','هَرِمَ','شاخ وكبر']]},
 {id:'p-aa',t:'ع / ء',a:'ع',b:'ء',
  ma:'من وسط الحلق، مع صوتٍ يهتزّ.',
  mb:'من أقصى الحلق، صوتٌ يُقطع فجأة.',
  p:[['عَلِمَ','عرف','أَلِمَ','تألّم'],['سَعَلَ','كحّ','سَأَلَ','استفهم'],['عَمَّ','شمل','أَمَّ','قصد، وصلّى إمامًا']]},
 {id:'p-kq',t:'ك / ق',a:'ك',b:'ق',
  ma:'أقصى اللسان مع سقف الحلق، أقرب إلى الفم من القاف، صوتٌ مهموس.',
  mb:'أقصى اللسان مع أعلى الحلق، أبعد من الكاف، صوتٌ قويّ.',
  p:[['كَلْب','حيوان','قَلْب','عضوٌ في الصدر'],['كَادَ','قارب','قَادَ','تقدّم يرشد'],['كَدَّ','تعب في العمل','قَدَّ','شقّ وقطع']]}
];
var pairById={}; PAIRS.forEach(function(p){pairById[p.id]=p;});

function labReadings(kidId,pid){return WORKS.filter(function(w){return w.kid===kidId&&w.type==='read'&&w.src==='pair'&&w.pair===pid;}).sort(function(a,b){return a.created-b.created;});}
function labView(){
  L=null; CUR=null;
  go('<div class="ax-page" style="--ax:var(--teal)"><button class="back" type="button" data-act="studio">'+BACK+' الاستوديو</button>'+
    '<header class="page-head"><h1 class="h1">مختبر الحروف</h1><p class="lead">حروفٌ متقاربة في المخرج، تخلطها لهجة البيت أحيانًا. إذا تغيّر الحرف تغيّر المعنى: ثمرٌ غير سمر، وقلمٌ غير ألم. ⟨اختر|اختاري⟩ زوجًا، ⟨واقرأ|واقرئي⟩ كلماته بصوتك، فيسمعك وليّ أمرك ويقيّم مخارج حروفك.</p></header>'+
    '<div class="pairs">'+PAIRS.map(function(p){
      var rs=labReadings(KID.id,p.id), last=rs[rs.length-1], r=last&&(last.rubric||last.trub);
      return '<button class="pairc" type="button" data-act="labPair" data-id="'+p.id+'"><span class="pc-l">'+p.a+'<i>/</i>'+p.b+'</span>'+
        '<span class="pc-s">'+(rs.length?readWord(rs.length)+(r&&r.m?' · '+RUBV[r.m]:''):'لم ⟨تجرّبه|تجرّبيه⟩ بعد')+'</span></button>';
    }).join('')+'</div>'+
    '<aside class="didyou"><span class="eyebrow">لماذا؟</span><p>لهجة البيت جميلة ولها مكانها، والفصحى لها أصواتها. ومن أتقن الحرفين عرف متى يستعمل كلًّا منهما. وكلّ قراءةٍ جديدة للزوج نفسه ⟨تقارنها|تقارنينها⟩ بأول قراءة في «قبل وبعد».</p></aside></div>');
}
function pairTable(p){
  return '<table class="ptab"><thead><tr><th>بـ«'+p.a+'»</th><th>بـ«'+p.b+'»</th></tr></thead><tbody>'+p.p.map(function(x){
    return '<tr><td><span class="pw">'+x[0]+'</span><span class="pm">'+x[1]+'</span></td><td><span class="pw">'+x[2]+'</span><span class="pm">'+x[3]+'</span></td></tr>';}).join('')+'</tbody></table>';
}
function labPair(id){
  var p=pairById[id]; if(!p) return labView(); L=null; CUR=null;
  var rs=labReadings(KID.id,id);
  go('<div class="ax-page" style="--ax:var(--teal)"><button class="back" type="button" data-act="lab">'+BACK+' مختبر الحروف</button>'+
    '<header class="page-head"><span class="eyebrow">مختبر الحروف</span><h1 class="h1 pair-h">'+p.a+' <i>/</i> '+p.b+'</h1></header>'+
    '<div class="cmp"><div class="cmp-card"><span class="cmp-w">'+p.a+'</span><span class="cmp-m">'+p.ma+'</span></div><div class="cmp-card"><span class="cmp-w">'+p.b+'</span><span class="cmp-m">'+p.mb+'</span></div></div>'+
    speakBtnHTML(id)+pairTable(p)+
    '<p class="prompt">⟨اقرأ|اقرئي⟩ كلّ صفٍّ من اليمين إلى اليسار: الكلمة، ثم أختها. ⟨تمهّل|تمهّلي⟩ عند الحرف المختلف.</p>'+
    '<div class="actions"><button class="btn" type="button" data-act="labRec" data-id="'+id+'">'+ICON.mic+' ⟨سجّل|سجّلي⟩ قراءتك</button></div>'+
    (rs.length?'<section><h2 class="h2">قراءاتك</h2><ul class="wlist">'+rs.slice().reverse().map(workRow).join('')+'</ul></section>':'')+
  '</div>');
}
function labRec(id){var p=pairById[id]; if(!p) return; var w=newWork('read',{src:'pair',pair:id}); DR.mode='draw'; workEdit(w.id);}
