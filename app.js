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
function askName(force){
  if(name&&!force)return;
  app.innerHTML=`<div class="res"><h2>مرحبًا</h2><p>اكتب اسمك ولقبك لتُحفظ نتائجك</p><input id="n" value="${esc(name)}" placeholder="الاسم واللقب"><div class="btn" id="ok">ابدأ</div></div>`;
  $('#ok').onclick=()=>{const v=$('#n').value.trim();if(!v)return;name=v;store.set('name',v);who.textContent='👤';hist=[];go(home,'حفظ')};
}
function home(){
  app.innerHTML='<div class="grid">'+SUBJECTS.map(s=>`<div class="sub" style="--c:${s.color}" data-id="${s.id}">${s.name}<small>${s.sections.reduce((a,x)=>a+x.lessons.length,0)} دروس</small></div>`).join('')+'</div><div class="lnk" id="adm">دخول الأستاذ</div>';
  app.querySelectorAll('.sub').forEach(e=>e.onclick=()=>{const s=SUBJECTS.find(x=>x.id==e.dataset.id);go(()=>subject(s),s.name,s.color)});
  $('#adm').onclick=()=>{if(prompt('الرقم السري')===window.ADMIN_PIN)go(admin,'لوحة الأستاذ','#14161f');else alert('الرقم خاطئ')};
}
function subject(s){
  const p=prog();
  app.innerHTML=s.sections.map(sec=>`<h2>${sec.name}</h2>`+sec.lessons.map(l=>`<div class="les" data-l="${l.id}"><b>${l.title}</b>${p[l.id]?`<span class="pct">${p[l.id].pct}%</span>`:''}</div>`).join('')).join('');
  app.querySelectorAll('.les').forEach(e=>e.onclick=()=>{
    const l=s.sections.flatMap(x=>x.lessons).find(x=>x.id==e.dataset.l);go(()=>lesson(s,l),l.title,s.color)});
}
function lesson(s,l){
  const r=prog()[l.id];
  app.innerHTML=`<h2>${l.title}</h2><p>${l.qs.length?`${l.qs.length} سؤالًا تغطي نقاط الدرس كلها.${r?` آخر نتيجة: ${r.pct}%`:''}`:'لم تُضف أسئلة هذا الدرس بعد.'}</p>
  <div class="acts"><a class="btn alt" href="${l.pdf}" target="_blank" rel="noopener">📄 ملف الدرس</a>${l.qs.length?'<div class="btn" id="go">ابدأ الاختبار</div>':''}</div>`;
  if(l.qs.length)$('#go').onclick=()=>go(()=>quiz(s,l),l.title,s.color);
}
function quiz(s,l){
  let idx=l.qs.map((_,k)=>k),i=0,right=0,wrong=[];
  const draw=()=>{
    if(i>=idx.length)return done();
    const[q,a,...w]=l.qs[idx[i]],opts=shuffle([a,...w]);
    app.innerHTML=`<div class="bar"><i style="width:${i/idx.length*100}%"></i></div><div class="q">${esc(q)}</div>`+opts.map(o=>`<button class="opt">${esc(o)}</button>`).join('')+'<div id="nx"></div>';
    app.querySelectorAll('.opt').forEach((b,k)=>b.onclick=()=>{
      app.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(opts[j]===a)x.classList.add('ok')});
      if(opts[k]===a)right++;else{b.classList.add('no');wrong.push(idx[i])}
      $('#nx').innerHTML='<div class="btn" id="n">التالي</div>';$('#n').onclick=()=>{i++;draw()};
    });
  };
  const done=()=>{
    const pct=Math.round(right/idx.length*100);
    if(idx.length===l.qs.length)save(s,l,right,pct);
    app.innerHTML=`<div class="res"><h2>${pct}%</h2><p>${right} صحيحة من ${idx.length}</p><div class="acts">${wrong.length?'<div class="btn alt" id="re">أعد الأخطاء</div>':''}<div class="btn" id="bk">الدروس</div></div></div>`;
    if(wrong.length)$('#re').onclick=()=>{idx=wrong;wrong=[];i=0;right=0;draw()};
    $('#bk').onclick=()=>{hist=hist.slice(0,2);show()};
  };
  draw();
}
function save(s,l,right,pct){
  const p=prog();p[l.id]={pct,at:Date.now()};store.set('prog',p);
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
