# -*- coding: utf-8 -*-
"""Adapt the lesson/assessment engine to the family layer (per-child storage, gendered rendering)."""
import re, sys
P = 'parts/engine.js'
s = open(P, encoding='utf-8').read()
D = 'parts/data.js'
d = open(D, encoding='utf-8').read()
bad = []
def rep(text, old, new, n=1, label=''):
    c = text.count(old)
    if c != n:
        bad.append((label, n, c, old[:80])); return text
    return text.replace(old, new)

# ---- data helpers: esc() must neutralise gender markers inside user text
d = rep(d, "function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}",
        "function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\u27e8/g,'&#10216;').replace(/\\u27e9/g,'&#10217;');}", 1, 'esc')

# ---- per-child progress storage (KID/KD live in the family layer)
s = rep(s, """var KEY='kunuz-albayan-v1', prog={};
try{prog=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){prog={};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(prog));}catch(e){}}""",
"""var prog={};
function save(){kidSave();}""", 1, 'prog')

s = rep(s, """var SKEY='kunuz-stats-v1', ST=null;
try{ST=JSON.parse(localStorage.getItem(SKEY)||'null');}catch(e){ST=null;}
function freshST(){return {items:{},tests:[],daily:{last:'',streak:0,best:0}};}
if(!ST||typeof ST!=='object') ST=freshST();
ST.items=ST.items||{}; ST.tests=ST.tests||[]; ST.daily=ST.daily||{last:'',streak:0,best:0};
function saveST(){try{localStorage.setItem(SKEY,JSON.stringify(ST));}catch(e){}}""",
"""function freshST(){return {items:{},tests:[],daily:{last:'',streak:0,best:0}};}
var ST=freshST();
function saveST(){kidSave();}""", 1, 'ST')

# ---- go(): gendered render, stop recorder, hydrate media, refresh header
s = rep(s, """function go(html){
  stopSpeak();
  view.innerHTML=html;""",
"""function go(html){
  stopSpeak(); recAbort(); radioStop(); closeModal();
  view.innerHTML=G(html);
  hydrate(view);
  renderKidChip();""", 1, 'go')

s = rep(s, "tray.setAttribute('aria-label','جمعت '", "tray.setAttribute('aria-label',G('⟨جمعتَ|جمعتِ⟩ ')+''", 1, 'tray')

# ---- lesson quiz feedback
s = rep(s, "fb.innerHTML='<div class=\"fb-ok\"><strong>أحسنت!</strong> '+fmt(L.quiz[qi].why)+'</div>'+",
        "fb.innerHTML=G('<div class=\"fb-ok\"><strong>'+praise()+'</strong> '+fmt(L.quiz[qi].why)+'</div>'+", 1, 'pick-ok')
s = rep(s, """'<div class="actions"><button class="btn" type="button" data-next>'+(last?'⟨خذ|خذي⟩ جوهرتك':'السؤال التالي')+'</button></div>';""",
        """'<div class="actions"><button class="btn" type="button" data-next>'+(last?'⟨خذ|خذي⟩ جوهرتك':'السؤال التالي')+'</button></div>');""", 1, 'pick-ok2')
s = rep(s, """fb.innerHTML='<div class="fb-no">ليست هذه.""", """fb.innerHTML=G('<div class="fb-no">ليست هذه.""", 1, 'pick-no')
s = rep(s, """إلى السرّ</button>.</div>';""", """إلى السرّ</button>.</div>');""", 1, 'pick-no2')

# roots / dots counters (textContent)
s = rep(s, "document.getElementById('rootCount').textContent=n?(", "document.getElementById('rootCount').textContent=G(n?(", 1, 'roots')
s = rep(s, "(n===ROOTS.length?'. شجرةٌ كاملة!':'')):'';", "(n===ROOTS.length?'. شجرةٌ كاملة!':'')):'');", 1, 'roots2')
s = rep(s, "document.getElementById('dotCount').textContent=n?(", "document.getElementById('dotCount').textContent=G(n?(", 1, 'dots')
s = rep(s, "كم تصنع النقطة؟':'')):'';", "كم تصنع النقطة؟':'')):'');", 1, 'dots2')

# assessment item re-render + praise
s = rep(s, "var el=document.getElementById('asItem'); if(el) el.innerHTML=itemHTML(AS.items[AS.i]);",
        "var el=document.getElementById('asItem'); if(el) el.innerHTML=G(itemHTML(AS.items[AS.i]));", 1, 'renderItem')
s = rep(s, "if(AS.mode==='majlis'){var tb=document.getElementById('teamBar'); if(tb) tb.outerHTML=teamBar();}",
        "if(AS.mode==='majlis'){var tb=document.getElementById('teamBar'); if(tb) tb.outerHTML=G(teamBar());}", 1, 'renderItem2')
s = rep(s, "var head=s.sc>=1?'<strong>أحسنت!</strong> '", "var head=s.sc>=1?'<strong>'+(AS.mode==='majlis'?'أحسنتم!':praise())+'</strong> '", 1, 'fbHTML')

# workshop drafts per child
s = rep(s, "try{saved=localStorage.getItem('kunuz-w-'+p.id)||'';}catch(e){}", "saved=(KD&&KD.w&&KD.w[p.id])||'';", 1, 'ws')

# majlis is a group activity
s = rep(s, '>ابدأ المسابقة<', '>ابدؤوا المسابقة<', 1, 'majlis')

# ---- remove blocks re-implemented in the family layer: home(), progressView(), reset, events
def cut(text, start, end, label):
    i = text.find(start); j = text.find(end, i + 1) if i >= 0 else -1
    if i < 0 or j < 0:
        bad.append((label, 'cut', i, j)); return text
    return text[:i] + text[j:]
s = cut(s, 'function home(){', 'function nextUndone(){', 'home')
s = cut(s, "/* ---------- parents' progress board ---------- */", '/* ---------- home block ---------- */', 'progress')
i = s.find('/* reset */')
if i < 0: bad.append(('tail', 'reset', -1))
else: s = s[:i]

# progress tile on the child's home now opens the child's own progress page
s = rep(s, """'<button class="tool hi" type="button" data-go="progress" style="--ax:var(--plum)"><span class="tool-t">لوحة التقدّم</span><span class="tool-d">للوالدين: الإتقان في كل خزانة، والدروس التي تحتاج مراجعة، وآخر الاختبارات.</span></button>'+""",
        """'<button class="tool hi" type="button" data-go="progress" style="--ax:var(--plum)"><span class="tool-t">تقدّمي</span><span class="tool-d">إتقانك في كل خزانة، والدروس التي ⟨تحتاج|تحتاجين⟩ إلى مراجعتها، وآخر ⟨اختباراتك|اختباراتكِ⟩.</span></button>'+""", 1, 'tool')

for b in bad: print('PROBLEM', b)
open(P, 'w', encoding='utf-8').write(s)
open(D, 'w', encoding='utf-8').write(d)
sys.exit(1 if bad else 0)
