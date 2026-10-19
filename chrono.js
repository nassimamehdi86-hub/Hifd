/* مادة اليوم حسب الجدول الأسبوعي (SCHEDULE في data.js).
   أُزيل كرونو نصف الساعة: حلّت محلّه المراجعة اليومية (ربع ساعة بعدّادها الخاص في review.js). */
const chDay=()=>new Date().toDateString();
const chFmt=ms=>{const s=Math.ceil(Math.max(0,ms)/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
/* تُسجَّل المادة «راجعتها اليوم» عند إنهاء جلسة المراجعة (انظر review.js) */
const revDoneToday=id=>{const d=store.get('revDay',{});return d.day===chDay()&&(d.ids||[]).includes(id)};
const revMarkDone=id=>{let d=store.get('revDay',{});if(d.day!==chDay())d={day:chDay(),ids:[]};if(!d.ids.includes(id))d.ids.push(id);store.set('revDay',d)};
const todaySubj=()=>{const id=(window.SCHEDULE||{})[new Date().getDay()];return id?SUBJECTS.find(x=>x.id===id):null};
function todayBanner(){
  const s=todaySubj();
  if(!s)return `<div class="today rest"><span class="em">🌿</span><div><b>لا مادة مجدولة اليوم</b><small>يوم راحة من برنامج الحفظ، والمراجعة اختيارية.</small></div></div>`;
  const dn=revDoneToday(s.id);
  return `<div class="today" id="today" data-id="${s.id}" style="--c:${s.color}"><span class="em">${ICON[s.id]}</span><div><b>📅 مادة اليوم: ${s.name}</b><small>${dn?'✅ أنجزت مراجعة اليوم، أحسنت!':'مراجعة ربع ساعة — اضغط لتبدأ'}</small></div></div>`;
}
function todayToast(){
  const s=todaySubj(),k=chDay();
  if(!s||store.get('tdn','')===k)return;
  store.set('tdn',k);toast('📅 مادة اليوم: '+s.name+' — مراجعة ربع ساعة');
}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),7000);d.onclick=()=>d.remove()}
