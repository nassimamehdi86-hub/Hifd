/* ورقة تدريب كتابية (PDF للتحميل والطباعة): سؤال لكل عنوان في الدرس + مساحة إجابة تُقدَّر من طول الإجابة النموذجية.
   تعتمد على getRec(l) في recite.js: عناوين الدرس، أو أسئلته إن لم تكن له عناوين.
   الحفظ كـ PDF: من نافذة الطباعة اختر «حفظ بتنسيق PDF» (أندرويد/حاسوب)، أو «مشاركة ← حفظ في الملفات» (آيفون). */
const WS_CPL_AR=80,WS_CPL_LAT=100,WS_MIN=2,WS_MAX=14;   /* حروف الخط اليدوي في السطر الواحد، وأقل/أكثر عدد أسطر */
const wsLines=(ans,lat)=>{const n=String(ans||'').replace(/\s+/g,' ').trim().length;return Math.min(WS_MAX,Math.max(WS_MIN,Math.ceil(n/(lat?WS_CPL_LAT:WS_CPL_AR))))};
function wsBtn(l){
  if(typeof getRec!=='function'||!getRec(l).length)return '';
  return `<div class="acts"><div class="btn alt" id="ws">🖨️ ورقة تدريب للطباعة (PDF)</div></div>`;
}
function wsQuestion(item){return String(item[0]).trim()}   /* العنوان أو السؤال مباشرة بلا صيغة إضافية */
function printSheet(s,l){
  const items=getRec(l);if(!items.length)return;
  const old=document.getElementById('wsheet');if(old)old.remove();
  const lat=!/[\u0600-\u06FF]/.test(items.map(x=>x[0]).join(''));
  const dir=lat?'ltr':'rtl',stu=(typeof name==='string'&&name)||'';
  const L=lat?{n:'Nom',d:'Date',t:'Fiche d’entraînement écrit',m:'Matière',l:'Leçon',sc:'Note'}:{n:'الاسم',d:'التاريخ',t:'ورقة تدريب كتابي',m:'المادة',l:'الدرس',sc:'العلامة'};
  const el=document.createElement('div');el.id='wsheet';el.dir=dir;if(lat)el.lang='fr';
  el.innerHTML=`<div class="ws-head"><div class="ws-t">${L.t}</div><div class="ws-m">${L.m}: <b>${esc(s.name)}</b> &nbsp;·&nbsp; ${L.l}: <b>${esc(l.title)}</b></div>
    <div class="ws-f"><span>${L.n}: ${esc(stu)||'<i class="ws-b"></i>'}</span><span>${L.d}: <i class="ws-b"></i></span><span>${L.sc}: <i class="ws-b" style="min-width:20mm"></i> / ${items.length}</span></div></div>`+
    items.map((it,i)=>`<div class="ws-q"><div class="ws-qt"><b>${i+1}.</b> ${esc(wsQuestion(it))}</div>${'<div class="ws-ln"></div>'.repeat(wsLines(it[1],lat))}</div>`).join('');
  wsPrintEl(el,`${lat?'Fiche':'ورقة تدريب'} - ${l.title}`);   /* اسم ملف الـ PDF */
}
function wsPrintEl(el,docTitle){
  document.body.append(el);
  const t0=document.title;document.title=docTitle;
  const done=()=>{el.remove();document.title=t0;removeEventListener('afterprint',done)};
  addEventListener('afterprint',done);
  setTimeout(()=>print(),150);
}
/* ===== طباعة اختبارات الشهادة: كل مادة ← كل سنة، مع مساحة إجابة تحت كل سؤال =====
   الأسئلة الفرعية (1- ... 2- ...) يُترك تحت كل منها مكان خاص؛ وعدد الأسطر يُقدَّر من طول الإجابة النموذجية (أو افتراضيًا إن لم تُضف). */
const WS_SUB=/^\s*\d+\s*[-–.)ـ]/;
let wsExtra={};   /* تمارين Firestore لكل مادة (تُضاف إلى exams.js) */
const wsExams=s=>(window.EXAMS||[]).concat(wsExtra[s.name]||[]).filter(e=>e.s===s.name);
const wsYears=s=>[...new Set(wsExams(s).map(e=>e.y))].sort((a,b)=>b-a);
function wsExamBtns(s){
  const ys=wsYears(s);if(!ys.length)return '';
  return `<h2>🖨️ طباعة اختبارات الشهادة</h2><p class="hint">اختر السنة لطباعة الاختبار كاملًا (أو حفظه PDF) مع ترك مكان للإجابة تحت كل سؤال.</p><div class="acts" id="wsx">`+
    ys.map(y=>`<div class="btn alt" data-wy="${y}">🖨️ اختبار ${y} (${wsExams(s).filter(e=>e.y===y).length} تمارين)</div>`).join('')+'</div>';
}
function wsBindExams(s,root){
  root.querySelectorAll('[data-wy]').forEach(b=>b.onclick=()=>printExam(s,+b.dataset.wy));
  if(typeof db!=='undefined'&&db&&!wsExtra[s.name])   /* تمارين مضافة من لوحة الأستاذ */
    db.collection('exams').where('s','==',s.name).get().then(q=>{
      const have=new Set((window.EXAMS||[]).map(e=>e.id));
      wsExtra[s.name]=q.docs.map(d=>d.data()).filter(e=>e&&!have.has(e.id)&&e.t);
      const box=document.getElementById('wsx');
      if(wsExtra[s.name].length&&box&&box.isConnected){const h=box.previousElementSibling.previousElementSibling,tmp=document.createElement('div');tmp.innerHTML=wsExamBtns(s);
        h.remove();box.previousElementSibling.remove();box.replaceWith(...tmp.children);wsBindExams(s,root)}
    }).catch(()=>{});
}
function wsExamBlock(e,n,lat){
  const ls=String(e.t||'').split('\n'),head=ls.shift();
  const subs=ls.filter(x=>WS_SUB.test(x)).length;
  const tot=e.a?wsLines(e.a,lat):0;
  let html=`<div class="ws-ex"><div class="ws-qt ws-eh">${esc(head)}</div>`;
  if(subs<2){   /* سؤال واحد: النص ثم مساحة الإجابة */
    html+=ls.length?`<div class="ws-body">${esc(ls.join('\n'))}</div>`:'';
    html+='<div class="ws-ln"></div>'.repeat(tot||5);
  }else{        /* أسئلة فرعية: مساحة تحت كل سؤال */
    const per=Math.max(2,tot?Math.round(tot/subs):3);let buf=[];
    const flush=()=>{if(buf.length)html+=`<div class="ws-body">${esc(buf.join('\n'))}</div>`;buf=[]};
    const lines='<div class="ws-ln"></div>'.repeat(per);
    ls.forEach((x,i)=>{
      if(WS_SUB.test(x)){flush();buf.push(x)}else buf.push(x);
      const nx=ls[i+1];
      if(buf.length&&WS_SUB.test(buf[0])&&(nx===undefined||WS_SUB.test(nx))){flush();html+=lines}
    });
    flush();
  }
  return html+'</div>';
}
function printExam(s,y){
  const list=wsExams(s).filter(e=>e.y===y);if(!list.length)return;
  const old=document.getElementById('wsheet');if(old)old.remove();
  const lat=!/[\u0600-\u06FF]/.test(list.map(e=>e.t).join(''));
  const stu=(typeof name==='string'&&name)||'';
  const el=document.createElement('div');el.id='wsheet';el.dir=lat?'ltr':'rtl';if(lat)el.lang='fr';
  el.innerHTML=`<div class="ws-head"><div class="ws-t">اختبار شهادة التعليم المتوسط — دورة ${y}</div><div class="ws-m">المادة: <b>${esc(s.name)}</b></div>
    <div class="ws-f"><span>الاسم: ${esc(stu)||'<i class="ws-b"></i>'}</span><span>التاريخ: <i class="ws-b"></i></span><span>العلامة: <i class="ws-b" style="min-width:20mm"></i></span></div></div>`+
    list.map((e,i)=>wsExamBlock(e,i+1,lat)).join('');
  wsPrintEl(el,`اختبار ${s.name} ${y}`);
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
  .ws-ex{margin-bottom:3mm}
  .ws-eh{font-size:11pt;font-weight:800;border-bottom:1px solid #000;margin-bottom:1mm;break-after:avoid;page-break-after:avoid}
  .ws-body{white-space:pre-line;font-size:10pt;font-weight:600;line-height:1.35;margin:1mm 0 .5mm;break-inside:avoid;page-break-inside:avoid}
  .ws-ex .ws-ln{height:7.5mm}
}`;
  document.head.append(st);
})();
