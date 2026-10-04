/* كرونو حصة الحفظ اليومية: نصف ساعة لكل مادة في اليوم (وليس لدرس واحد).
   يبدأ التلميذ العدّاد من صفحة المادة، ويبقى ظاهرًا أسفل الشاشة وهو يتنقّل بين دروس المادة ويسمّع ويختبر. لا يقطع أي اختبار عند انتهائه، فقط ينبّه. يتجدد كل يوم. */
const CH_MIN=30*60*1000,CH_GAP=5*60*1000;
const chDay=()=>new Date().toDateString();
const chGet=()=>{const c=store.get('chrono',null);return c&&c.day===chDay()?c:{day:chDay(),s:{}}};
const chLeft=(o)=>o?Math.max(0,o.left-(o.run?Date.now()-o.run:0)):CH_MIN;
const chFmt=ms=>{const s=Math.ceil(Math.max(0,ms)/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const chRunning=c=>Object.keys(c.s).find(k=>c.s[k].run);
function chToggle(id){
  const c=chGet(),was=c.s[id]&&c.s[id].run;
  Object.keys(c.s).forEach(k=>{const o=c.s[k];if(o.run){o.left=chLeft(o);o.run=0}});
  const o=c.s[id]??={left:CH_MIN,run:0};
  delete o.auto;
  if(!was&&o.left>0)o.run=Date.now();
  store.set('chrono',c);chTick();
}
function chReset(id){const c=chGet();delete c.s[id];store.set('chrono',c);chTick()}
const chDone=id=>{const o=chGet().s[id];return !!o&&o.left<=0&&!o.run};
function chronoCard(s){
  return `<div class="chcard"><div class="chl"><b>⏱ حصة اليوم — ${s.name}</b><small>نصف ساعة حفظ في اليوم. ابدأ العدّاد وأنهِ درسًا أو أكثر قبل أن ينتهي.</small></div><div class="chtime" id="chv">30:00</div><div class="acts"><div class="btn" id="chb">▶ ابدأ</div><div class="btn alt" id="chx">↺ من جديد</div></div></div>`;
}
function chronoBind(s){
  $('#chb').onclick=()=>chToggle(s.id);
  $('#chx').onclick=()=>{if(confirm('إعادة عدّاد '+s.name+' إلى 30:00؟'))chReset(s.id)};
  window.__chSubj=s.id;chTick();
}
function chTick(){
  const c=chGet();let run=chRunning(c);
  if(run&&chLeft(c.s[run])<=0){
    c.s[run].left=0;c.s[run].run=0;store.set('chrono',c);
    const sb=SUBJECTS.find(x=>x.id===run);
    toast('⏰ انتهت حصة '+(sb?sb.name:'')+' لهذا اليوم — أحسنت! 🎉');
    try{SFX.win();confetti();navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}
    run=null;
  }
  /* بطاقة المادة */
  const v=$('#chv');
  if(v&&v.isConnected){
    const id=window.__chSubj,o=c.s[id],left=chLeft(o),isRun=!!(o&&o.run),done=!!o&&left<=0;
    v.textContent=chFmt(left);v.classList.toggle('low',left>0&&left<5*60*1000);
    $('#chb').textContent=done?'✅ تمت حصة اليوم':isRun?'⏸ إيقاف مؤقت':(o&&left<CH_MIN?'▶ تابع':'▶ ابدأ');
    $('#chb').classList.toggle('dn',done);
  }
  /* الشريط العائم يظهر في كل الشاشات ما دام العدّاد يعمل */
  let chip=$('#chr');
  if(!chip){chip=document.createElement('div');chip.id='chr';chip.hidden=true;document.body.append(chip);
    chip.onclick=()=>{const r=chRunning(chGet());if(r)chToggle(r)}}
  if(run){const sb=SUBJECTS.find(x=>x.id===run),left=chLeft(c.s[run]);chip.hidden=false;chip.classList.toggle('low',left<5*60*1000);chip.textContent='⏱ '+(sb?sb.name:'')+' '+chFmt(left)+' ⏸'}
  else chip.hidden=true;
}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),7000);d.onclick=()=>d.remove()}
setInterval(chTick,1000);
/* عند مغادرة التطبيق يتوقف العدّاد تلقائيًا، ويستأنف إن عاد التلميذ خلال 5 دقائق */
document.addEventListener('visibilitychange',()=>{
  const c=chGet();
  if(document.hidden){const r=chRunning(c);if(r){const o=c.s[r];o.left=chLeft(o);o.run=0;o.auto=Date.now();store.set('chrono',c)}}
  else{const r=Object.keys(c.s).find(k=>c.s[k].auto);if(r){const o=c.s[r];if(o.left>0&&Date.now()-o.auto<CH_GAP)o.run=Date.now();delete o.auto;store.set('chrono',c)}}
  chTick();
});

/* مادة اليوم حسب الجدول الأسبوعي (SCHEDULE في data.js) */
const todaySubj=()=>{const id=(window.SCHEDULE||{})[new Date().getDay()];return id?SUBJECTS.find(x=>x.id===id):null};
function todayBanner(){
  const s=todaySubj();
  if(!s)return `<div class="today rest"><span class="em">🌿</span><div><b>لا مادة مجدولة اليوم</b><small>يوم راحة من برنامج الحفظ، وهذه مراجعة اختيارية.</small></div></div>`;
  const dn=chDone(s.id);
  return `<div class="today" id="today" data-id="${s.id}" style="--c:${s.color}"><span class="em">${ICON[s.id]}</span><div><b>📅 مادة اليوم: ${s.name}</b><small>${dn?'✅ أنجزت حصة اليوم، أحسنت!':'نصف ساعة حفظ — اضغط لتبدأ'}</small></div></div>`;
}
function todayToast(){
  const s=todaySubj(),k=chDay();
  if(!s||store.get('tdn','')===k)return;
  store.set('tdn',k);toast('📅 مادة اليوم: '+s.name+' — نصف ساعة حفظ');
}
