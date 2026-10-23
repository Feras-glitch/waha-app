/* ================= events & start ================= */
function needKid(fn){return function(t,ds){ if(!KID) return who(); return fn(t,ds); };}
var ACT={
  vplay:function(t){vPlay(t);},
  backKid:function(){backKid();},
  home:function(){home();},
  parent:function(){needParent(parentHome);},
  lock:function(){lockParent();},
  pinForgot:function(){pinForgot();},
  rcMail:function(){rcMail();},
  rcCopy:function(){rcCopy();},
  rcDone:function(){rcDone();},
  rcNew:function(){needParent(function(){rcRenew();});},
  resetReq:function(){resetRequest();},
  resetDo:function(){resetDo();},
  resetCancel:function(){resetCancel();},
  setupPin:function(){ if(FAM.pin) needParent(function(){setupPin(false);}); else setupPin(false); },
  pickKid:function(t,ds){PARENT_UNTIL=0; selectKid(ds.id); if(!IN_KUNUZ) return toOasis(); home();},
  kfG:function(t,ds){KF.name=(document.getElementById('kfName')||{}).value||KF.name;KF.g=ds.v;renderKidForm();},
  kfAv:function(t,ds){KF.name=(document.getElementById('kfName')||{}).value||KF.name;KF.av=ds.v;renderKidForm();},
  kfC:function(t,ds){KF.name=(document.getElementById('kfName')||{}).value||KF.name;KF.c=ds.v;renderKidForm();},
  kfNoPhoto:function(){KF.name=(document.getElementById('kfName')||{}).value||KF.name;KF.newPhoto=null;KF.dropPhoto=true;if(URLS['photo-tmp']){try{URL.revokeObjectURL(URLS['photo-tmp']);}catch(e){}delete URLS['photo-tmp'];}renderKidForm();},
  kidAdd:function(){kidForm(null);},
  kidEdit:function(t,ds){kidForm(ds.id);},
  kidDel:function(t,ds){kidDelete(ds.id);},
  kidReset:function(t,ds){kidResetProgress(ds.id);},
  pKids:function(){pKids();}, pProg:function(t,ds){pProg(ds.id);}, pApproved:function(){pApproved();}, pCode:function(){pCode();},
  pWeekly:function(){pWeekly();}, setWeekly:function(t,ds){setWeekly(ds.id);}, passWeekly:function(t,ds){passWeekly(ds.id);}, pImport:function(){pImport();}, extDel:function(t,ds){extDel(ds.id);},
  pFrom:function(){pFrom();}, fromAdd:function(t,ds){fromAdd(+ds.i);}, fromAll:function(){fromAll();},
  pBackup:function(){pBackup();}, backupMake:function(){backupMake();}, pWork:function(t,ds){pWork(ds.id);},
  rub:function(t,ds){ if(!RV) return; RV.r[ds.k]=+ds.v; [].slice.call(t.parentNode.children).forEach(function(b){b.classList.toggle('on',b===t);}); },
  chip:function(t,ds){ var n=document.getElementById('rvNote'); if(!n) return; n.value=(n.value?n.value.trim()+' ':'')+t.textContent; n.focus(); },
  approve:function(){approveWork();}, returnWork:function(){returnWork();}, unapprove:function(){unapprove();}, pDelWork:function(){pDelWork();},
  exTeacher:function(){exTeacher();}, exGift:function(){exGift();}, exContrib:function(){exContrib();}, manualReply:function(t,ds){manualReply(ds.id);},
  studio:needKid(function(){studio();}),
  works:needKid(function(t,ds){worksView(ds.v||null);}),
  newWork:needKid(function(t,ds){ if(!TYPES[ds.v]) return; var w=newWork(ds.v); DR.mode='draw'; workEdit(w.id); }),
  openWork:needKid(function(t,ds){DR.mode='draw';openWork(ds.id);}),
  submitWork:function(){submitWork();}, delWork:function(){delWork();},
  readSrc:function(t,ds){ if(!CUR) return; CUR.src=ds.v==='text'?'text':'lesson'; CUR.updated=Date.now(); saveWorks(); workEdit(CUR.id); },
  giftOcc:function(t,ds){ if(!CUR) return; CUR.occ=ds.v; saveWorks(); [].slice.call(t.parentNode.children).forEach(function(b){b.classList.toggle('on',b===t);}); },
  giftCard:function(t,ds){ if(!CUR) return; CUR.card=ds.v; saveWorks(); [].slice.call(t.parentNode.children).forEach(function(b){b.classList.toggle('on',b===t);}); },
  recStart:function(){recStart();}, recStop:function(){recStop();}, recDel:function(){recDel();},
  drawMode:function(t,ds){ if(!CUR) return; var id=CUR.id; (DR.dirty?drawSave():Promise.resolve()).then(function(){DR.mode=ds.v==='photo'?'photo':'draw'; workEdit(id);}); },
  drawColor:function(t,ds){ DR.color=ds.v; [].slice.call(document.querySelectorAll('.pc')).forEach(function(b){b.classList.toggle('on',b===t);}); },
  drawSize:function(t,ds){ DR.size=+ds.v; [].slice.call(t.parentNode.children).forEach(function(b){b.classList.toggle('on',b===t);}); },
  drawUndo:function(){ if(!DR.strokes.length) return; DR.strokes.pop(); redraw(); DR.dirty=true; clearTimeout(DR.t); DR.t=setTimeout(drawSave,800); },
  drawClear:async function(){
    var ok=await ask({title:'مسح الرسمة كلّها؟',c:'rose',ok:'امسحها',danger:1}); if(!ok||!CUR) return;
    DR.strokes=[]; DR.bg=null; redraw(); DR.dirty=false;
    if(CUR.image){await blobDel(CUR.image); CUR.image=null; CUR.updated=Date.now(); saveWorks();}
    var s=document.getElementById('drawSaved'); if(s) s.textContent='';
  },
  mags:needKid(function(){magsView();}), magNew:needKid(function(){magNew();}),
  magOpen:function(t,ds){ if(!parentOn()&&!KID) return who(); magOpen(ds.id); },
  magAdd:function(t,ds){magAdd(ds.id,ds.v);}, magRemove:function(t,ds){magRemove(ds.id,ds.v);}, magSend:function(t,ds){magSend(ds.id);}, magDel:function(t,ds){magDel(ds.id);},
  magPreview:function(t,ds){magPreview(ds.id);}, magExport:function(t,ds){magExport(ds.id);}, magBack:function(t,ds){magBack(ds.id);}, magPublishLocal:function(t,ds){magPublishLocal(ds.id);},
  magRadio:function(){magRadio();},
  pMag:function(t,ds){magParent(ds.id);},
  /* printing can also save the page as a file or send it (Android's print screen), so it is the parent's step, logged like an export */
  print:async function(){
    if(!(await freshParent('الطباعة قد تحفظ الصفحة ملفًّا أو ترسلها، فتحتاج رمز وليّ الأمر.'))) return;
    (FAM.waLog=FAM.waLog||[]).push({d:Date.now(),name:'طباعة: '+String(document.title||'').slice(0,60),kid:KID?KID.id:null}); if(FAM.waLog.length>200) FAM.waLog=FAM.waLog.slice(-200); saveFam();
    try{window.print();}catch(e){}
  },
  install:function(){doInstall();},
  narPlay:function(t,ds){narPlay(ds.id,t);},
  diag:needKid(function(){startDiag();}), pReport:function(t,ds){pReport(ds.id,ds.v);}, exReport:function(t,ds){exReport(ds.id,ds.v);},
  pFamily:function(){pFamily();}, pFamilyOne:function(t,ds){pFamily(ds.id);}, fsDone:function(t,ds){fsDone(ds.id);}, fsSkip:function(){fsSkip();},
  presentMag:function(t,ds){presentMag(ds.id);}, presentRadio:function(){presentRadio();},
  waha:needKid(function(){wahaGo({kid:KID.id});}), pWaha:function(){wahaGo({dad:1,kid:KID&&KID.id});},
  rm:needKid(function(){rmView();}), rmOne:needKid(function(t,ds){rmOne(ds.id);}), rmPick:function(t,ds){rmPick(+ds.i);},
  lab:needKid(function(){labView();}), labPair:needKid(function(t,ds){labPair(ds.id);}), labRec:needKid(function(t,ds){labRec(ds.id);}),
  pVoice:function(){pVoice();}, pVoiceOne:function(t,ds){pVoiceOne(ds.id);}, pVoiceG:function(t,ds){if(NV) pVoiceOne(NV.id,ds.v);},
  narRec:function(){narRec();}, narStopRec:function(){recStop();}, narDel:function(){narDel();},
  garden:needKid(function(){gardenView(KID.id,false);}),
  certs:function(t,ds){ if(ds.k){ if(!parentOn()) return needParent(function(){certsView(ds.k,true);}); return certsView(ds.k,true);} if(!KID) return who(); certsView(KID.id,false); },
  cert:function(t,ds){ if(ds.k){ if(!parentOn()) return needParent(function(){certView(ds.id,ds.k,true);}); return certView(ds.id,ds.k,true);} if(!KID) return who(); certView(ds.id,KID.id,false); },
  pGarden:function(t,ds){gardenView(ds.id,true);}, pCerts:function(t,ds){certsView(ds.id,true);},
  exCert:function(t,ds){exCert(ds.id,ds.k);}, exRiddle:function(){exRiddle();},
  rdIdea:function(t,ds){ var x=RIDDLE_IDEAS[+ds.v], q=document.getElementById('f-q'); if(!x||!q||!CUR) return;
    if((q.value||'').trim()&&!confirmIdea) { confirmIdea=true; return toast('في اللغز كتابةٌ الآن. ⟨اضغط|اضغطي⟩ الفكرة مرةً أخرى لتحلّ محلّها.'); }
    confirmIdea=false; q.value=G(x[1]); onWorkField(q); if(!(CUR.title||'').trim()){var ti=document.getElementById('f-title'); if(ti){ti.value=x[0];onWorkField(ti);}} q.focus(); },
  rzG:function(t,ds){rzStart(ds.v);}, rzPick:function(t,ds){rzPick(+ds.v);}, rzReveal:function(){RZ.revealed=true;rzView();}, rzHint:function(){RZ.hint=true;rzView();}, rzSelf:function(t,ds){rzSelf(ds.v==='1');},
  radio:needKid(function(){radioView();}), radioF:function(t,ds){radioView(ds.v);},
  radioAll:function(){radioPlay(0);}, radioPlay:function(t,ds){radioPlay(+ds.v);}
};
var confirmIdea=false;
var GUEST_ACTS=['vplay','rzG','rzPick','rzReveal','rzHint','rzSelf'];
var PARENT_ACTS=['pWaha','pReport','exReport','pFamily','pFamilyOne','fsDone','fsSkip','pVoice','pVoiceOne','pVoiceG','narRec','narDel','pGarden','pCerts','exCert','exRiddle','pKids','pProg','pApproved','pCode','pWeekly','setWeekly','passWeekly','pImport','extDel','pFrom','fromAdd','fromAll','pBackup','backupMake','pWork','rub','approve','returnWork','unapprove','pDelWork',
  'exTeacher','exGift','exContrib','manualReply','kidAdd','kidEdit','kidDel','kidReset','magExport','magBack','magPublishLocal','pMag'];
function route(g){
  if(!KID&&g!=='parent') return who();
  if(g==='daily') return daily(); if(g==='det') return detective(); if(g==='full') return testAll(); if(g==='review') return review();
  if(g==='majlis') return majlisSetup(); if(g==='progress') return progressFor(KID.id,false);
  if(g==='studio') return studio(); if(g==='works') return worksView(); if(g==='mags') return magsView(); if(g==='radio') return radioView();
  if(g==='parent') return needParent(parentHome);
  return home();
}

var APP=document.getElementById('app');
APP.addEventListener('click',function(e){
  if(e.target.closest('.modal')) return;
  var t=e.target.closest('button,[data-act]'); if(!t||t.disabled) return;
  if(t.tagName==='LABEL'||t.tagName==='INPUT') return;
  var ds=t.dataset;
  if(GUEST){ if(t.tagName==='A') return; if(t.id==='homeBtn'){location.hash='';location.reload();return;} if(ds.act&&GUEST_ACTS.indexOf(ds.act)>=0) return ACT[ds.act](t,ds); return; }
  if(ds.act){
    var fn=ACT[ds.act]; if(!fn) return;
    if(PARENT_ACTS.indexOf(ds.act)>=0&&!parentOn()) return needParent(function(){fn(t,ds);});
    if(PARENT_ACTS.indexOf(ds.act)>=0) parentTouch();
    return fn(t,ds);
  }
  /* leaving for the child's pages ends the parent's session (the next parent step asks for the PIN again) */
  if(t.id==='homeBtn'||t.hasAttribute('data-home')){ PARENT_UNTIL=0; return KID?home():who(); }
  if(t.id==='kidChip'){ PARENT_UNTIL=0; return who(); }
  if(t.id==='footParent') return needParent(parentHome);
  if(t.id==='speak') return speak(t);
  if(!KID) return;
  if(ds.open) { curPat=-1; return openLesson(ds.open); }
  if(ds.ax) return axis(ds.ax);
  if(ds.step!==undefined){ st=+ds.step; if(st===2&&!L.quiz[qi]) {qi=0;} return lessonView(); }
  if(ds.opt!==undefined) return pick(+ds.opt);
  if(t.hasAttribute('data-next')) return nextQ();
  if(ds.pat!==undefined) return showPat(+ds.pat);
  if(ds.dot!==undefined) return showDot(+ds.dot);
  if(ds.view) return ds.view==='workshop'?workshop():shelf();
  if(ds.go) return route(ds.go);
  if(ds.test) return testAxis(ds.test);
  if(ds.a!==undefined) return ansA(+ds.a);
  if(ds.a2!==undefined) return ansA2(+ds.a2);
  if(ds.ml!==undefined) return ansML(+ds.ml);
  if(ds.mr!==undefined) return ansMR(+ds.mr);
  if(t.hasAttribute('data-check')) return ansType();
  if(t.hasAttribute('data-anext')) return nextItem();
  if(t.hasAttribute('data-again')) return again();
  if(ds.mjn){MJ.n=+ds.mjn;[].slice.call(document.querySelectorAll('[data-mjn]')).forEach(function(x){x.classList.toggle('on',+x.dataset.mjn===MJ.n);});return;}
});
APP.addEventListener('submit',function(e){
  var id=e.target&&e.target.id; if(!id) return; e.preventDefault(); if(GUEST) return;
  if(id==='mjForm') return startMajlis();
  if(id==='pinForm') return pinSubmit();
  if(id==='recForm') return rcSubmit();
  if(id==='setPinForm') return setPinSubmit();
  if(id==='kidForm') return needParent(function(){kidFormSubmit();});
  if(id==='codeForm') return needParent(function(){codeSubmit();});
  if(id==='magForm') return magCreate();
});
APP.addEventListener('keydown',function(e){
  if(e.target&&e.target.id==='typeAns'&&e.key==='Enter'){e.preventDefault();ansType();}
});
APP.addEventListener('input',function(e){
  var el=e.target; if(!el||!el.dataset) return;
  if(el.dataset.wf) return onWorkField(el);
  if(el.id==='kfName'&&KF){KF.name=el.value;return;}
  if(el.id==='narBy'&&parentOn()){FAM.narBy=el.value.slice(0,20);saveFam();return;}
  if(el.dataset.w&&KD){
    KD.w[el.dataset.w]=el.value; kidSave();
    var s=document.getElementById('s-'+el.dataset.w); if(s) s.textContent=G(LS_WARNED?'تعذّر الحفظ في هذا المتصفح، ⟨فانسخ ما كتبتَ قبل أن تغادر|فانسخي ما كتبتِ قبل أن تغادري⟩.':'حُفظت كتابتك على هذا الجهاز.');
  }
});
APP.addEventListener('change',function(e){
  var el=e.target; if(!el||!el.dataset) return;
  if(el.tagName==='SELECT'&&el.dataset.wf) return onWorkField(el);
  if(el.dataset.actChange==='pub'){
    var w=workById(RV&&RV.id); if(!w||!parentOn()) return; w.pub=w.pub||{}; w.pub[el.dataset.k]=el.checked; w.updated=Date.now(); saveWorks();
    if(el.dataset.k==='mag'&&!el.checked) FAM.mags.forEach(function(m){if(m.status!=='published') m.items=(m.items||[]).filter(function(it){return it.w!==w.id;});});
    saveFam(); return toast(el.checked?'سُمح بذلك.':'أُوقف.');
  }
  var f=el.dataset.file; if(!f||!el.files||!el.files[0]) return;
  var file=el.files[0]; el.value='';
  if(f==='audio') return audioPicked(file);
  if(f==='narFile') return parentOn()?narFilePicked(file):needParent(function(){pVoice();});
  if(f==='drawPhoto') return drawPhotoPicked(file);
  if(f==='kidPhoto') return kidPhotoPicked(file);
  if(f==='contrib') return parentOn()?contribPicked(file):needParent(function(){pImport();});
  if(f==='restore') return (FAM.pin?(parentOn()?restorePicked(file):needParent(function(){pBackup();})):restorePicked(file));
});
window.addEventListener('beforeunload',function(e){ if(REC.mr){e.preventDefault();e.returnValue='';} if(DR.dirty) drawSave(); });
document.addEventListener('visibilitychange',function(){ if(document.hidden&&DR.dirty) drawSave(); });
/* Android back button (the app calls appBack()): close a dialog, then step back inside this section; on its home page it returns false and the app goes back to the oasis */
window.appBack=function(){
  if(document.querySelector('.modal')){ var c=document.querySelector('.modal [data-m="0"]'); if(c) c.click(); else closeModal(); return true; }
  if(PR){ presentClose(); return true; }
  var b=document.querySelector('#view .back'); if(b){ b.click(); return true; }
  /* on this section's home, back goes to the oasis (the front door), not out of the app */
  if(!GUEST&&FAM.pin){ PARENT_UNTIL=0; toOasis(); return true; }
  return false;
};

/* the back of a browser, or of the web app installed on Android, steps back inside this section as the Android app's button does:
   one guard entry in the history catches it; where there is nowhere left to go back to, the browser is let go */
(function(){ if(window.AndroidBridge||!window.history||!history.pushState) return;
  function guard(){ try{ history.pushState({wahaBack:1},'',location.href); }catch(e){} }
  if(!(history.state&&history.state.wahaBack)) guard();
  window.addEventListener('popstate',function(){ var done=false; try{ done=window.appBack(); }catch(e){} if(done) guard(); });
})();

/* ---------- start ---------- */
(async function start(){
  await idbOpen();
  for(var i=0;i<FAM.kids.length;i++){ if(FAM.kids[i].photo) await mediaURL('photo-'+FAM.kids[i].id); }
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){ try{navigator.serviceWorker.register('../sw.js').catch(function(){});}catch(e){} }
  var hr=(location.hash||'').replace('#','');
  if(hr.indexOf('r=')===0) return riddleGuest(parseRiddleHash(hr)||{bad:1});
  IN_KUNUZ=!!hr;
  if(!FAM.pin) return setupWelcome();
  if(hr==='parent'){ if(FAM.cur&&kidById(FAM.cur)) selectKid(FAM.cur); return needParent(parentHome); }
  if(!(FAM.cur&&kidById(FAM.cur))) return who();
  selectKid(FAM.cur);
  var h=(location.hash||'').replace('#','');
  if(h&&lessonById[h]) return openLesson(h);
  if(h&&axById[h]) return axis(h);
  if(h==='workshop') return workshop();
  if(h==='shelf') return shelf();
  if(h==='garden') return gardenView(KID.id,false);
  if(h==='certs') return certsView(KID.id,false);
  if(h==='rm') return rmView();
  if(h==='who') return who();
  if(!h) return toOasis();
  if(['daily','majlis','progress','studio','works','mags','radio','parent'].indexOf(h)>=0) return route(h);
  home();
})();
