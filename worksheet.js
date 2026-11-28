/* ورقة تدريب كتابية (PDF للتحميل والطباعة): سؤال لكل عنوان في الدرس + مساحة إجابة تُقدَّر من طول الإجابة النموذجية.
   تعتمد على getRec(l) في recite.js: عناوين الدرس، أو أسئلته إن لم تكن له عناوين.
   الحفظ كـ PDF: من نافذة الطباعة اختر «حفظ بتنسيق PDF» (أندرويد/حاسوب)، أو «مشاركة ← حفظ في الملفات» (آيفون). */
const WS_CPL_AR=80,WS_CPL_LAT=100,WS_MIN=2,WS_MAX=14;   /* حروف الخط اليدوي في السطر الواحد، وأقل/أكثر عدد أسطر */
const wsLines=(ans,lat)=>{const n=String(ans||'').replace(/\s+/g,' ').trim().length;return Math.min(WS_MAX,Math.max(WS_MIN,Math.ceil(n/(lat?WS_CPL_LAT:WS_CPL_AR))))};
function wsBtn(l){
  if(typeof getRec!=='function'||!getRec(l).length)return '';
  return `<div class="acts"><div class="btn alt" id="ws">🖨️ ورقة تدريب للطباعة (PDF)</div></div>`;
}
function wsQuestion(item){return String(item[0]).trim()}   /* السؤال (أو العنوان مباشرة) */
function printSheet(s,l){
  const rec=getRec(l);if(!rec.length)return;
  /* إن وُجدت l.wq: سؤال واحد لكل عنوان رئيسي، ومساحة الإجابة بحسب طول النقاط التابعة له */
  const items=(l.wq&&l.rec)?l.wq.map(([q,ix])=>[q,ix.map(i=>rec[i][1]).join(' ')]):rec;
  const old=document.getElementById('wsheet');if(old)old.remove();
  const lat=!/[\u0600-\u06FF]/.test(items.map(x=>x[0]).join(''));
  const dir=lat?'ltr':'rtl',stu=(typeof name==='string'&&name)||'';
  const L=lat?{n:'Nom',d:'Date',t:'Fiche d’entraînement écrit',m:'Matière',l:'Leçon',sc:'Note'}:{n:'الاسم',d:'التاريخ',t:'ورقة تدريب كتابي',m:'المادة',l:'الدرس',sc:'العلامة'};
  const el=document.createElement('div');el.id='wsheet';el.dir=dir;if(lat)el.lang='fr';
  el.innerHTML=`<div class="ws-head"><div class="ws-t">${L.t}</div><div class="ws-m">${L.m}: <b>${esc(s.name)}</b> &nbsp;·&nbsp; ${L.l}: <b>${esc(l.title)}</b></div>
    <div class="ws-f"><span>${L.n}: ${esc(stu)||'<i class="ws-b"></i>'}</span><span>${L.d}: <i class="ws-b"></i></span><span>${L.sc}: <i class="ws-b" style="min-width:20mm"></i> / ${items.length}</span></div></div>`+
    items.map((it,i)=>`<div class="ws-q"><div class="ws-qt"><b>${i+1}.</b> ${esc(wsQuestion(it))}</div>${'<div class="ws-ln"></div>'.repeat(wsLines(it[1],lat))}</div>`).join('');
  document.body.append(el);
  const t0=document.title;document.title=`${lat?'Fiche':'ورقة تدريب'} - ${l.title}`;   /* اسم ملف الـ PDF */
  const done=()=>{el.remove();document.title=t0;removeEventListener('afterprint',done)};
  addEventListener('afterprint',done);
  setTimeout(()=>print(),150);
}
/* ===== طباعة أسئلة شهادة التعليم المتوسط: نص التمرين + مساحة إجابة منقّطة، وعدد الأسطر يُقدَّر من الإجابة النموذجية (e.a) ===== */
const EX_CPL=70,EX_MIN=2,EX_MAX=14,EX_DEF_SUB=3,EX_DEF_ALL=5;   /* حروف الخط اليدوي في السطر، أقل/أكثر عدد أسطر، وعدد الأسطر الافتراضي إن لم يوجد حل */
const exLines=n=>n?Math.min(EX_MAX,Math.max(EX_MIN,Math.ceil(n/EX_CPL))):0;
const exLen=a=>(Array.isArray(a)?a.flat():[a]).join(' ').replace(/\s+/g,' ').trim().length;
function exParse(e){
  const SQ=/^\s*(?:\d+|[أ-ي])\s*[\)\-\.\/–]\s*\S/,AL=/^\s*(?:ج\s*)?(?:\d+|[أ-ي])\s*[\)\-\.:：–]/;
  const tl=String(e.t||'').split('\n').map(x=>x.trim()).filter(Boolean);
  let title='';if(tl.length&&/^(الوضعية|السؤال|التمرين|الموضوع)/.test(tl[0]))title=tl.shift();
  const first=tl.findIndex(x=>SQ.test(x));
  const head=first<0?tl:tl.slice(0,first);
  const subs=[];if(first>=0)tl.slice(first).forEach(x=>{if(SQ.test(x)||!subs.length)subs.push([x]);else subs[subs.length-1].push(x)});
  const al=String(e.a||'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(al.length&&/^عناصر الإجابة/.test(al[0]))al.shift();
  const segs=[];al.forEach(x=>{if(AL.test(x)||!segs.length)segs.push([x]);else segs[segs.length-1].push(x)});
  const total=exLen(al);
  let lens;
  if(!subs.length)lens=[total];
  else if(!total)lens=subs.map(()=>0);
  else if(segs.length>=subs.length)lens=subs.map((_,i)=>exLen(i<subs.length-1?segs[i]:segs.slice(i)));   /* فقرة لكل سؤال فرعي، والزائد يُضم إلى الأخير */
  else lens=subs.map(()=>Math.ceil(total/subs.length));                                                    /* تعذّر ربط الإجابة بالأسئلة الفرعية: توزيع متساوٍ */
  const asked=x=>{const m=/\((\d{1,2})\)\s*أسطر/.exec(x);return m?Math.min(EX_MAX,+m[1]):0};   /* التعليمة تحدد العدد صراحةً: «من عشرة (10) أسطر» */
  return {title,head,subs:subs.map((x,i)=>({q:x.join('\n'),n:asked(x.join(' '))||exLines(lens[i])||EX_DEF_SUB})),all:subs.length?0:(asked(tl.join(' '))||exLines(lens[0])||EX_DEF_ALL)};
}
function printExams(s,label,list){
  if(!list||!list.length)return;
  const old=document.getElementById('wsheet');if(old)old.remove();
  const stu=(typeof name==='string'&&name)||'';
  const items=[...list].sort((a,b)=>(b.y-a.y)||String(a.id).localeCompare(String(b.id)));
  const dots=n=>'<div class="ws-dot"></div>'.repeat(n);
  const el=document.createElement('div');el.id='wsheet';el.dir='rtl';
  el.innerHTML=`<div class="ws-head"><div class="ws-t">أسئلة شهادة التعليم المتوسط</div><div class="ws-m">المادة: <b>${esc(s.name)}</b> &nbsp;·&nbsp; ${esc(label)}</div>
    <div class="ws-f"><span>الاسم: ${esc(stu)||'<i class="ws-b"></i>'}</span><span>التاريخ: <i class="ws-b"></i></span><span>العلامة: <i class="ws-b" style="min-width:20mm"></i></span></div></div>`+
  items.map(e=>{const p=exParse(e);
    return `<div class="ws-x"><div class="ws-xh">شهادة ${esc(e.y)}${p.title?' · '+esc(p.title):''}</div>`+
      (p.head.length?`<div class="ws-st">${esc(p.head.join('\n'))}</div>`:'')+
      (p.subs.length?p.subs.map(q=>`<div class="ws-q"><div class="ws-qt">${esc(q.q)}</div>${dots(q.n)}</div>`).join(''):dots(p.all))+'</div>'}).join('');
  document.body.append(el);
  const t0=document.title;document.title=`أسئلة الشهادة - ${s.name} - ${label}`;
  const done=()=>{el.remove();document.title=t0;removeEventListener('afterprint',done)};
  addEventListener('afterprint',done);
  setTimeout(()=>print(),150);
}
(function(){
  const st=document.createElement('style');
  st.textContent=`
#wsheet{display:none}
@page{size:A4;margin:8mm}
@media print{
  html,body{background:#fff!important}
  body>*:not(#wsheet){display:none!important}
  #wsheet{display:block;color:#000;font:600 9.5pt/1.25 Tajawal,Tahoma,Arial,sans-serif}
  .ws-head{border-bottom:2px solid #000;padding-bottom:1mm;margin-bottom:2mm}
  .ws-t{font-size:13pt;font-weight:800;text-align:center;margin-bottom:0}
  .ws-m{text-align:center;font-size:9.5pt;margin-bottom:1mm}
  .ws-f{display:flex;justify-content:space-between;gap:5mm;font-size:9pt}
  .ws-f span{display:flex;align-items:flex-end;gap:2mm;flex:1}
  .ws-f span:last-child{flex:0 0 auto}
  .ws-b{display:inline-block;flex:1;min-width:30mm;border-bottom:1px solid #000;height:1em}
  .ws-q{break-inside:avoid;page-break-inside:avoid;margin-bottom:1.5mm}
  .ws-qt{font-size:10pt;font-weight:700;line-height:1.2}
  .ws-ln{height:6mm;border-bottom:1px solid #999}
  .ws-x{margin-bottom:4mm}
  .ws-xh{font-size:10.5pt;font-weight:800;border-bottom:1px solid #000;margin:2mm 0 1mm}
  .ws-st{white-space:pre-line;font-size:9.5pt;font-weight:600;line-height:1.35;margin-bottom:1mm}
  .ws-x .ws-qt{white-space:pre-line}
  .ws-dot{height:7mm;border-bottom:1.6px dotted #000}
}`;
  document.head.append(st);
})();
