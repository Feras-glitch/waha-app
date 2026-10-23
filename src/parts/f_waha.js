/* ================= «واحة اللسان العربي» inside the family app ================= */
/* Product layout: the oasis is the front page (../index.html), this app lives in kunuz/, the Hasaniya in hasaniya/ — one origin.
   The oasis and the Hasaniya read the children and the parent PIN from here; the oasis keeps its progress under «oasis:» keys
   and its recordings in «oasisRec», the Hasaniya under «waha.hasaniya_» keys and «waha.hasaniya-rec»; all of it goes into our encrypted backup. */
ICON.palm='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c.4-4.6.3-8.4-.4-11.6"/><path d="M11.6 9.4C9.6 6.6 6.4 6 4 7.6M11.6 9.4c2-2.9 5.2-3.4 7.6-1.8M11.6 9.4C10.8 6.2 8.6 4.2 6 4.2M11.6 9.4c.9-3 3.2-4.8 5.8-4.6"/><path d="M5 21h14"/></svg>';
/* the oasis is the front door: a child with a profile lands there; «#kunuz» (or any route) keeps the treasure chambers open */
var IN_KUNUZ=false;
function toOasis(){ location.replace(wahaURL({kid:KID&&KID.id})); }
function wahaURL(o){
  o=o||{}; var q=[];
  if(o.kid) q.push('k='+encodeURIComponent(o.kid));
  if(o.dad) q.push('dad=1');
  return '../index.html'+(q.length?'?'+q.join('&'):'');
}
function wahaGo(o){
  /* the parent already entered the PIN here: the oasis honours it for the rest of the session */
  try{ if(o&&o.dad&&parentOn()) sessionStorage.setItem('kz-parent-until',String(PARENT_UNTIL)); }catch(e){}
  location.href=wahaURL(o);
}
function wahaDoor(){
  return '<button class="door wide waha-door" type="button" data-act="waha" style="--ax:var(--olive)"><span class="door-t">🌴 واحة اللسان العربي</span>'+
    '<span class="door-d">نخيل الجذور من محفوظك، وألغاز، وشعر، وحكايات، وصحيفة الواحة، ورحلةٌ كلَّ يوم مع رفيقك.</span></button>';
}

/* ---------- backup of the oasis ---------- */
function oasisDB(create){
  return new Promise(function(res){
    try{
      var r=indexedDB.open('oasisRec');
      r.onerror=function(){res(null);};
      r.onsuccess=function(){
        var d=r.result, need=['rec','gift','voice'].filter(function(s){return !d.objectStoreNames.contains(s);});
        if(!need.length||!create){res(d);return;}
        var v=d.version+1; d.close();
        var r2=indexedDB.open('oasisRec',v);
        r2.onupgradeneeded=function(){var d2=r2.result; need.forEach(function(s){if(!d2.objectStoreNames.contains(s)) d2.createObjectStore(s,{keyPath:'id'});});};
        r2.onsuccess=function(){res(r2.result);}; r2.onerror=function(){res(null);};
      };
    }catch(e){res(null);}
  });
}
async function packVal(v,depth){
  if(v instanceof Blob) return {__kzb:await blobToDataURL(v)};
  if(depth>3||v==null||typeof v!=='object') return v;
  if(Array.isArray(v)){var a=[]; for(var i=0;i<v.length;i++) a.push(await packVal(v[i],depth+1)); return a;}
  var o={}; for(var k in v) o[k]=await packVal(v[k],depth+1); return o;
}
function unpackVal(v){
  if(v==null||typeof v!=='object') return v;
  if(typeof v.__kzb==='string') return dataURLToBlob(v.__kzb);
  if(Array.isArray(v)) return v.map(unpackVal);
  var o={}; for(var k in v) o[k]=unpackVal(v[k]); return o;
}
async function oasisExport(){
  var ls={};
  try{ for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i); if(k&&k.indexOf('oasis:')===0) ls[k]=localStorage.getItem(k);} }catch(e){}
  var out={ls:ls,idb:{}};
  var d=await oasisDB(false); if(!d) return out;
  var stores=['rec','gift','voice'].filter(function(s){return d.objectStoreNames.contains(s);});
  for(var j=0;j<stores.length;j++){
    var all=await new Promise(function(res){try{var q=d.transaction(stores[j]).objectStore(stores[j]).getAll();q.onsuccess=function(){res(q.result||[]);};q.onerror=function(){res([]);};}catch(e){res([]);}});
    out.idb[stores[j]]=[]; for(var n=0;n<all.length;n++) out.idb[stores[j]].push(await packVal(all[n],0));
  }
  d.close(); return out;
}
async function oasisImport(o){
  if(!o) return;
  try{ var del=[]; for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i); if(k&&k.indexOf('oasis:')===0) del.push(k);} del.forEach(function(k){localStorage.removeItem(k);}); }catch(e){}
  Object.keys(o.ls||{}).forEach(function(k){ if(k.indexOf('oasis:')===0){ try{localStorage.setItem(k,o.ls[k]);}catch(e){} } });
  var d=await oasisDB(true); if(!d) return;
  var stores=['rec','gift','voice'];
  for(var j=0;j<stores.length;j++){
    var st=stores[j], rows=(o.idb&&o.idb[st])||[];
    await new Promise(function(res){
      try{ var t=d.transaction(st,'readwrite'), os=t.objectStore(st); os.clear(); rows.forEach(function(r){os.put(unpackVal(r));}); t.oncomplete=res; t.onerror=res; t.onabort=res; }catch(e){res();}
    });
  }
  d.close();
}
function waLogHTML(){
  var L=(FAM.waLog||[]).slice(-12).reverse(); if(!L.length) return '';
  return '<section><h2 class="h2">ما خرج من الواحة والحسنية</h2><ul class="rev">'+L.map(function(x){var k=x.kid&&kidById(x.kid);
    return '<li><span class="mark-ok">↗</span> '+fmtDate(x.d)+' · '+(x.app==='hasaniya'?'الحسنية · ':'')+esc(x.name)+(k?' · '+esc(k.name):'')+'</li>';}).join('')+'</ul></section>';
}

/* ---------- the Hasaniya (hasaniya/): its children are ours (user id «kz_»+child id); backup and deletion live here.
   Its storage names carry «waha.» (hasaniya_early.js), apart from a standalone Hasaniya on the same origin. ---------- */
var HS='waha.hasaniya_', HS_SKIP=/^waha\.hasaniya_(safety_backups|pin_lock|v13_parentPin)$|_corrupt_backup2?$/;
function hsDB(){
  return new Promise(function(res){
    try{ var r=indexedDB.open('waha.hasaniya-rec',1);
      r.onupgradeneeded=function(){ if(!r.result.objectStoreNames.contains('recs')) r.result.createObjectStore('recs',{keyPath:'key'}); };
      r.onsuccess=function(){res(r.result);}; r.onerror=function(){res(null);}; r.onblocked=function(){res(null);};
    }catch(e){res(null);}
  });
}
async function hasaniyaExport(){
  var ls={};
  try{ for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i); if(k&&k.indexOf(HS)===0&&!HS_SKIP.test(k)) ls[k]=localStorage.getItem(k);} }catch(e){}
  var out={ls:ls,recs:[]}, d=await hsDB(); if(!d) return out;
  var all=await new Promise(function(res){try{var q=d.transaction('recs').objectStore('recs').getAll();q.onsuccess=function(){res(q.result||[]);};q.onerror=function(){res([]);};}catch(e){res([]);}});
  for(var n=0;n<all.length;n++) out.recs.push(await packVal(all[n],0));
  d.close(); return out;
}
async function hasaniyaImport(o){
  if(!o) return;
  try{ var del=[]; for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i); if(k&&k.indexOf(HS)===0&&!HS_SKIP.test(k)) del.push(k);} del.forEach(function(k){localStorage.removeItem(k);}); }catch(e){}
  Object.keys(o.ls||{}).forEach(function(k){ if(k.indexOf(HS)===0&&!HS_SKIP.test(k)){ try{localStorage.setItem(k,o.ls[k]);}catch(e){} } });
  var d=await hsDB(); if(!d) return;
  await new Promise(function(res){
    try{ var t=d.transaction('recs','readwrite'), os=t.objectStore('recs'); os.clear(); (o.recs||[]).forEach(function(r){os.put(unpackVal(r));}); t.oncomplete=res; t.onerror=res; t.onabort=res; }catch(e){res();}
  });
  d.close();
}
/* a child deleted in the parent corner: their Hasaniya progress and recordings, the parent's recorded «يا <name>», and their copy in the safety stores */
async function hasaniyaForget(id,name){
  var uid='kz_'+id, norm=function(t){return String(t||'').replace(/[\u064B-\u0652\u0670\u0640]/g,'').replace(/[^\u0621-\u064A0-9A-Za-z]+/g,'');}, call=norm('يا '+(name||''));
  ['users_corrupt_backup','users_corrupt_backup2'].forEach(function(n){ try{
    var raw=localStorage.getItem(HS+n); if(raw==null) return; var a=null; try{a=JSON.parse(raw);}catch(e){}
    if(Array.isArray(a)) localStorage.setItem(HS+n,JSON.stringify(a.filter(function(u){return !u||u.id!==uid;}))); else localStorage.removeItem(HS+n);
  }catch(e){} });
  try{
    var us=JSON.parse(localStorage.getItem(HS+'v13_users')||'null');
    if(Array.isArray(us)){ us=us.filter(function(u){return u&&u.id!==uid;}); localStorage.setItem(HS+'v13_users',JSON.stringify(us));
      if(localStorage.getItem(HS+'v13_activeUserId')===uid) localStorage.setItem(HS+'v13_activeUserId',us[0]?us[0].id:''); }
  }catch(e){}
  try{
    var sb=JSON.parse(localStorage.getItem(HS+'safety_backups')||'null');
    if(Array.isArray(sb)){ sb.forEach(function(b){ if(b&&Array.isArray(b.users)) b.users=b.users.filter(function(u){return u&&u.id!==uid;}); });
      localStorage.setItem(HS+'safety_backups',JSON.stringify(sb.filter(function(b){return b&&b.users&&b.users.length;}))); }
  }catch(e){}
  var d=await hsDB(); if(!d) return;
  await new Promise(function(res){ try{ var t=d.transaction('recs','readwrite'), q=t.objectStore('recs').openCursor();
    q.onsuccess=function(){var c=q.result; if(!c) return; var v=c.value||{};
      if(String(v.key||'').indexOf(uid+'|')===0||(name&&v.kind==='line'&&v.uid==='author'&&norm(v.text)===call)) c.delete(); c.continue();};
    t.oncomplete=res; t.onerror=res; t.onabort=res; }catch(e){res();} });
  d.close();
}

/* a child deleted in the parent corner: their oasis progress, words and recordings go too */
async function oasisForget(id){
  var tag='@'+id;
  try{ var del=[]; for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i); if(k&&k.indexOf('oasis:')===0&&(k.indexOf(':'+tag+':')>0||k.slice(-tag.length-1)===':'+tag)) del.push(k);} del.forEach(function(k){localStorage.removeItem(k);}); }catch(e){}
  ['tri','kq','kqa'].forEach(function(n){ try{ var a=JSON.parse(localStorage.getItem('oasis:'+n)||'null'); if(Array.isArray(a)) localStorage.setItem('oasis:'+n,JSON.stringify(a.filter(function(x){return !x||x.kid!==tag;}))); }catch(e){} });
  var d=await oasisDB(false); if(!d) return;
  var F={rec:['kid','to'],gift:['from','to']};
  for(var st in F){ if(!d.objectStoreNames.contains(st)) continue;
    await new Promise(function(res){ try{ var t=d.transaction(st,'readwrite'), q=t.objectStore(st).openCursor();
      q.onsuccess=function(){var c=q.result; if(!c) return; var r=c.value; if(F[st].some(function(f){return r[f]===tag;})) c.delete(); c.continue();};
      t.oncomplete=res; t.onerror=res; t.onabort=res; }catch(e){res();} }); }
  d.close();
}
