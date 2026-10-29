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
  document.body.append(el);
  const t0=document.title;document.title=`${lat?'Fiche':'ورقة تدريب'} - ${l.title}`;   /* اسم ملف الـ PDF */
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
}`;
  document.head.append(st);
})();
