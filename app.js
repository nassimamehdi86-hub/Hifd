const $=s=>document.querySelector(s),app=$('#app'),ttl=$('#title'),back=$('#back'),who=$('#who');
let db=null,hist=[];
try{const c=window.FIREBASE_CONFIG;if(c&&!/ضع_/.test(c.projectId)){firebase.initializeApp(c);db=firebase.firestore()}}catch(e){}
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let name=store.get('name','');
const prog=()=>store.get('prog',{});
const color=c=>document.documentElement.style.setProperty('--c',c||'#14161f');
const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const show=()=>{const[f,t,c]=hist[hist.length-1];f();ttl.textContent=t;color(c);back.hidden=hist.length<2;scrollTo(0,0)};
const go=(fn,t,c)=>{hist.push([fn,t,c]);show()};
back.onclick=()=>{hist.pop();show()};
who.onclick=()=>askName(true);
const PAL={hist:'#FF9F1C',geo:'#0FB5A6',civ:'#6C4DF6',isl:'#22B35E',sci:'#FF4D8D'},ICON={hist:'📜',geo:'🌍',civ:'🏛️',isl:'🕌',sci:'🔬'};
SUBJECTS.forEach(s=>s.color=PAL[s.id]);
const PRAISE=['أحسنت!','ممتاز!','رائع!','يا بطل!','مذهل!'],OOPS=['لا بأس، تعلّم منها!','قريبًا تصيبها!','حاول في الجولة القادمة!'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
const st=()=>store.get('st',{xp:0,day:'',streak:0}),lvl=x=>Math.floor(x/100)+1;
const stars=p=>p>=90?3:p>=70?2:p>0?1:0,starsHtml=n=>'★'.repeat(n)+'☆'.repeat(3-n);
function addXp(n){const t=st();t.xp+=n;const d=new Date().toDateString();if(t.day!==d){t.streak=(t.day===new Date(Date.now()-864e5).toDateString())?t.streak+1:1;t.day=d}store.set('st',t)}
function confetti(){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const c=document.createElement('canvas');c.className='cf';document.body.append(c);const x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const P=Array.from({length:90},()=>({x:Math.random()*c.width,y:-Math.random()*c.height/2,v:2+Math.random()*4,s:6+Math.random()*8,h:Math.random()*360}));let f=0;(function t(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.y+=p.v;p.x+=Math.sin(p.y/30);x.fillStyle=`hsl(${p.h},90%,60%)`;x.fillRect(p.x,p.y,p.s,p.s*.6)});if(++f<160)requestAnimationFrame(t);else c.remove()})()}
var deferred=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
const standalone=()=>matchMedia('(display-mode:standalone)').matches||navigator.standalone;
async function install(){
  if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;const b=$('#inst');if(b)b.remove();return}
  alert(/iphone|ipad|ipod/i.test(navigator.userAgent)?'في آيفون: اضغط زر المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».':'اضغط على قائمة المتصفح ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».');
}
function askName(force){
  if(name&&!force)return;
  app.innerHTML=`<div class="res"><h2>مرحبًا</h2><p>اكتب اسمك ولقبك لتُحفظ نتائجك</p><input id="n" value="${esc(name)}" placeholder="الاسم واللقب"><div class="btn" id="ok">ابدأ</div></div>`;
  $('#ok').onclick=()=>{const v=$('#n').value.trim();if(!v)return;name=v;store.set('name',v);who.textContent='👤';hist=[];go(home,'حفظ')};
}
function home(){
  const t=st(),p=prog(),total=Object.values(p).reduce((x,r)=>x+stars(r.pct),0);
  app.innerHTML=`<div class="hero"><div class="hi">أهلًا ${esc(name)} 👋<small>هيا نحفظ ونجمع النجوم!</small></div><div class="chips"><span>🔥 ${t.streak} يوم</span><span>⭐ ${total}</span><span>🏅 مستوى ${lvl(t.xp)}</span></div><div class="xp"><i style="width:${t.xp%100}%"></i></div></div>${standalone()?'':'<div class="btn inst" id="inst">📲 ثبّت التطبيق على هاتفك</div>'}<div class="tiles">`+
  SUBJECTS.map(s=>{const ls=s.sections.flatMap(x=>x.lessons),d=ls.filter(l=>p[l.id]&&p[l.id].pct>=70).length;
    return `<div class="tile" style="--c:${s.color}" data-id="${s.id}"><span class="em">${ICON[s.id]}</span><b>${s.name}</b><small>${d} / ${ls.length} دروس</small></div>`}).join('')+'</div><div class="lnk" id="adm">دخول الأستاذ</div>';
  if($('#inst'))$('#inst').onclick=install;
  app.querySelectorAll('.tile').forEach(e=>e.onclick=()=>{const s=SUBJECTS.find(x=>x.id==e.dataset.id);go(()=>subject(s),s.name,s.color)});
  $('#adm').onclick=()=>{if(prompt('الرقم السري')===window.ADMIN_PIN)go(admin,'لوحة الأستاذ','#3b2f6b');else alert('الرقم خاطئ')};
}
function subject(s){
  const p=prog();
  app.innerHTML=s.sections.map(sec=>`<h2>${sec.name}</h2><div class="path">`+sec.lessons.map((l,i)=>{const r=p[l.id];
    return `<div class="node ${i%2?'r':'l'}" data-l="${l.id}"><span class="dot ${r&&r.pct>=70?'done':''}">${i+1}</span><div><b>${l.title}</b><small>${starsHtml(stars(r?r.pct:0))}</small></div></div>`}).join('')+'</div>').join('');
  app.querySelectorAll('.node').forEach(e=>e.onclick=()=>{
    const l=s.sections.flatMap(x=>x.lessons).find(x=>x.id==e.dataset.l);go(()=>lesson(s,l),l.title,s.color)});
}
function lesson(s,l){
  const r=prog()[l.id];
  app.innerHTML=`<h2>${l.title}</h2>${l.qs.length?`<div class="acts"><div class="btn" id="go">ابدأ الاختبار (${l.qs.length} سؤالًا)</div></div>${r?`<p class="hint">آخر نتيجة: ${r.pct}%</p>`:''}`:'<p class="hint">لم تُضف أسئلة هذا الدرس بعد.</p>'}
  <div id="pdf" class="pdf"><p class="hint">جارٍ تحميل الدرس…</p></div>
  <div class="acts"><a class="btn alt" href="${l.pdf}" target="_blank" rel="noopener">فتح الملف في صفحة مستقلة</a></div>`;
  if(l.qs.length)$('#go').onclick=()=>go(()=>quiz(s,l),l.title,s.color);
  renderPdf(l.pdf,$('#pdf'));
}
async function renderPdf(url,box){
  try{
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf=await pdfjsLib.getDocument(url).promise;
    for(let n=1;n<=pdf.numPages;n++){
      if(!box.isConnected)return;
      const pg=await pdf.getPage(n),v0=pg.getViewport({scale:1}),sc=box.clientWidth/v0.width,v=pg.getViewport({scale:sc*(devicePixelRatio||1)});
      const c=document.createElement('canvas');c.width=v.width;c.height=v.height;box.appendChild(c);
      await pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
      if(n===1)box.querySelector('.hint')?.remove();
    }
  }catch(e){
    const why=/Missing PDF|404|Unexpected/i.test(e.message||'')?'الملف غير موجود في المسار '+url+' — تأكد من رفع مجلد pdf إلى GitHub بنفس الاسم.':location.protocol==='file:'?'افتح التطبيق من رابط GitHub Pages، لا من الملف مباشرة من الجهاز.':'تأكد من الاتصال بالإنترنت ثم أعد فتح الدرس.';
    box.innerHTML=`<p class="hint">تعذّر عرض الملف داخل التطبيق.<br>${esc(why)}</p><object data="${url}" type="application/pdf" width="100%" height="500"></object>`;
  }
}
function quiz(s,l){
  let idx=shuffle(l.qs.map((_,k)=>k)),i=0,right=0,wrong=[],combo=0,gain=0;
  const draw=()=>{
    if(i>=idx.length)return done();
    const[q,a,...w]=l.qs[idx[i]],opts=shuffle([a,...w]);
    app.innerHTML=`<div class="bar"><i style="width:${i/idx.length*100}%"></i></div><p class="cnt">${i+1} / ${idx.length}${combo>1?` <span class="combo">🔥 ×${combo}</span>`:''}</p><div class="qbox">${esc(q)}</div>`+opts.map((o,k)=>`<button class="opt"><span class="ltr">${'أبجد'[k]}</span>${esc(o)}</button>`).join('')+'<div id="nx"></div>';
    app.querySelectorAll('.opt').forEach((b,k)=>b.onclick=()=>{
      app.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(opts[j]===a)x.classList.add('ok')});
      const good=opts[k]===a;
      if(good){right++;combo++;gain+=10;b.classList.add('pop')}else{b.classList.add('no');wrong.push(idx[i]);combo=0}
      $('#nx').innerHTML=`<div class="fb ${good?'g':'b'}">${good?pick(PRAISE)+' ⭐ +10':pick(OOPS)}</div><div class="btn" id="n">التالي</div>`;
      $('#n').onclick=()=>{i++;draw()};scrollTo(0,document.body.scrollHeight);
    });
  };
  const done=()=>{
    const pct=Math.round(right/idx.length*100);
    if(idx.length===l.qs.length)save(s,l,right,pct);
    if(pct>=90)gain+=20;addXp(gain);
    const n=stars(pct);
    app.innerHTML=`<div class="res"><div class="big">${n>=2?'🏆':'💪'}</div><h2>${pct}%</h2><div class="st">${starsHtml(n)}</div><p>${right} صحيحة من ${idx.length} · ‎+${gain} نقطة</p><p class="msg">${pct>=90?'أسطوري! أنت بطل هذا الدرس':pct>=70?'عمل رائع، اقتربت من القمة!':'بداية جيدة، أعد المحاولة وستتفوق!'}</p><div class="acts">${wrong.length?'<div class="btn alt" id="re">أعد الأخطاء</div>':''}<div class="btn" id="again">محاولة جديدة 🔄</div></div><div class="acts"><div class="btn alt" id="bk">الدروس</div></div></div>`;
    if(pct>=70)confetti();
    $('#again').onclick=()=>quiz(s,l);
    if(wrong.length)$('#re').onclick=()=>{idx=shuffle(wrong);wrong=[];i=0;right=0;gain=0;draw()};
    $('#bk').onclick=()=>{hist=hist.slice(0,2);show()};
  };
  draw();
}
function save(s,l,right,pct){
  const p=prog();p[l.id]={pct:Math.max(pct,(p[l.id]||{}).pct||0),at:Date.now()};store.set('prog',p);
  if(db)db.collection('results').add({student:name,subject:s.name,lessonId:l.id,lesson:l.title,right,total:l.qs.length,percent:pct,at:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});
}
async function admin(){
  if(!db){app.innerHTML='<div class="res"><p>اربط Firebase في firebase-config.js لعرض نتائج التلاميذ.</p></div>';return}
  app.innerHTML='<p class="hint">جارٍ التحميل…</p>';
  try{
    const sn=await db.collection('results').orderBy('at','desc').limit(500).get();
    const rows=sn.docs.map(d=>({id:d.id,...d.data()})),by={};
    rows.forEach(r=>{(by[r.student]??=[]).push(r.percent)});
    const avg=Object.entries(by).map(([n,a])=>`<tr><td>${esc(n)}</td><td>${a.length}</td><td>${Math.round(a.reduce((x,y)=>x+y,0)/a.length)}%</td></tr>`).join('');
    app.innerHTML=`<h2>المعدل لكل تلميذ</h2><div class="tw"><table><tr><th>التلميذ</th><th>الاختبارات</th><th>المعدل</th></tr>${avg}</table></div>
    <h2>آخر النتائج</h2><div class="tw"><table><tr><th>التلميذ</th><th>المادة</th><th>الدرس</th><th>النتيجة</th><th>التاريخ</th><th></th></tr>`+
    rows.map(r=>`<tr><td>${esc(r.student)}</td><td>${esc(r.subject)}</td><td>${esc(r.lessonId)}</td><td>${r.percent}%</td><td>${r.at?r.at.toDate().toLocaleDateString('ar'):''}</td><td><a data-d="${r.id}" style="cursor:pointer">🗑</a></td></tr>`).join('')+'</table></div>';
    app.querySelectorAll('[data-d]').forEach(a=>a.onclick=async()=>{if(confirm('حذف هذه النتيجة؟')){await db.collection('results').doc(a.dataset.d).delete();admin()}});
  }catch(e){app.innerHTML='<div class="res"><p>تعذّر التحميل. تحقق من قواعد Firestore (السماح بالقراءة والحذف).</p></div>'}
}
if(name){who.textContent='👤';go(home,'حفظ')}else askName();
