const $=s=>document.querySelector(s),app=$('#app'),ttl=$('#title'),back=$('#back'),who=$('#who');
let db=null,hist=[];
try{const c=window.FIREBASE_CONFIG;if(c&&!/ضع_/.test(c.projectId)){firebase.initializeApp(c);db=firebase.firestore()}}catch(e){}
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let name=store.get('name','');
const prog=()=>store.get('prog',{});
const color=c=>document.documentElement.style.setProperty('--c',c||'#14161f');
const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let testActive=null;
const show=()=>{testActive=null;const[f,t,c]=hist[hist.length-1];f();ttl.textContent=t;color(c);back.hidden=hist.length<2;scrollTo(0,0)};
const go=(fn,t,c)=>{hist.push([fn,t,c]);show()};
back.onclick=()=>{
  if(testActive){if(!confirm('ستُلغى كل إجاباتك ويبدأ الاختبار من الصفر. هل تريد الخروج؟'))return;testActive=null;localStorage.removeItem('rec');rstopMic()}
  hist.pop();show()};
who.onclick=()=>askName(true);
const PAL={hist:'#FF9F1C',geo:'#0FB5A6',civ:'#6C4DF6',isl:'#22B35E',sci:'#FF4D8D',math:'#A855F7',phy:'#0EA5E9',ara:'#CA8A04',fr:'#E8453C'},ICON={hist:'📜',geo:'🌍',civ:'🏛️',isl:'🕌',sci:'🔬',math:'📐',phy:'⚛️',ara:'📖',fr:'🇫🇷'};
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
let muted=store.get('mute',false),AC=null;
function tone(f,t,d,ty='sine',v=.18){if(muted)return;try{AC=AC||new(window.AudioContext||webkitAudioContext)();if(AC.state==='suspended')AC.resume();const o=AC.createOscillator(),g=AC.createGain(),s=AC.currentTime+t;o.type=ty;o.frequency.setValueAtTime(f,s);g.gain.setValueAtTime(v,s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.connect(g);g.connect(AC.destination);o.start(s);o.stop(s+d)}catch(e){}}
const SFX={tap:()=>tone(520,0,.06,'triangle',.1),ok:c=>{const k=Math.min(c,6)*45;tone(660+k,0,.12);tone(880+k,.1,.22)},no:()=>{tone(220,0,.25,'sawtooth',.1);tone(165,.14,.3,'sawtooth',.1)},win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.11,.35,'triangle',.2)),lose:()=>{tone(392,0,.2,'triangle');tone(330,.18,.35,'triangle')}};
const snd=$('#snd');snd.textContent=muted?'🔇':'🔊';
snd.onclick=()=>{muted=!muted;store.set('mute',muted);snd.textContent=muted?'🔇':'🔊';SFX.tap()};
document.addEventListener('click',e=>{if(e.target.closest('.btn,.tile,.node,#back'))SFX.tap()});
function askName(force){
  if(name&&!force)return;
  app.innerHTML=`<div class="res"><h2>مرحبًا</h2><p>اكتب اسمك ولقبك لتُحفظ نتائجك</p><input id="n" value="${esc(name)}" placeholder="الاسم واللقب"><div class="btn" id="ok">ابدأ</div></div>`;
  $('#ok').onclick=()=>{const v=$('#n').value.trim();if(!v)return;name=v;store.set('name',v);who.textContent='👤';hist=[];go(home,'حفظ')};
}
function home(){
  const t=st(),p=prog(),total=Object.values(p).reduce((x,r)=>x+stars(r.pct),0);
  app.innerHTML=`<div class="hero"><div class="hi">أهلًا ${esc(name)} 👋<small>هيا نحفظ ونجمع النجوم!</small></div><div class="chips"><span>🔥 ${t.streak} يوم</span><span>⭐ ${total}</span><span>🏅 مستوى ${lvl(t.xp)}</span></div><div class="xp"><i style="width:${t.xp%100}%"></i></div></div>${todayBanner()}${standalone()?'':'<div class="btn inst" id="inst">📲 ثبّت التطبيق على هاتفك</div>'}<div class="tiles">`+
  SUBJECTS.map(s=>{const ls=s.sections.flatMap(x=>x.lessons),d=ls.filter(l=>p[l.id]&&p[l.id].pct>=70).length;
    return `<div class="tile" style="--c:${s.color}" data-id="${s.id}"><span class="em">${ICON[s.id]}</span><b>${s.name}</b><small>${d} / ${ls.length} دروس${chDone(s.id)?' · ✅ حصة اليوم':''}</small>${(todaySubj()||{}).id===s.id?'<small>📌 مادة اليوم</small>':''}</div>`}).join('')+'</div><div class="lnk" id="adm" translate="no">دخول الأستاذ</div>';
  if($('#inst'))$('#inst').onclick=install;
  if($('#today')){const ts=SUBJECTS.find(x=>x.id===$('#today').dataset.id);$('#today').onclick=()=>go(()=>subject(ts),ts.name,ts.color)}
  todayToast();
  app.querySelectorAll('.tile').forEach(e=>e.onclick=()=>{const s=SUBJECTS.find(x=>x.id==e.dataset.id);go(()=>subject(s),s.name,s.color)});
  $('#adm').onclick=()=>go(adminGate,'لوحة الأستاذ','#3b2f6b');
}
function subject(s){
  const p=prog();
  app.innerHTML=chronoCard(s)+s.sections.map(sec=>`<h2>${sec.name}</h2><div class="path">`+sec.lessons.map((l,i)=>{const r=p[l.id];
    return `<div class="node ${i%2?'r':'l'}" data-l="${l.id}"><span class="dot ${r&&r.pct>=70?'done':''}">${i+1}</span><div><b dir="auto">${l.title}</b><small>${starsHtml(stars(r?r.pct:0))}</small></div></div>`}).join('')+'</div>').join('');
  chronoBind(s);
  app.querySelectorAll('.node').forEach(e=>e.onclick=()=>{
    const l=s.sections.flatMap(x=>x.lessons).find(x=>x.id==e.dataset.l);go(()=>lesson(s,l),l.title,s.color)});
}
const videoHtml=([id,s=0,e=0])=>/\.mp4$/.test(id)?`<h2>🎬 شرح الدرس بالفيديو</h2><div class="vid vloc"><video src="${id}" controls playsinline preload="metadata"></video></div>`:`<h2>🎬 شرح الدرس بالفيديو</h2><div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0${s?'&start='+s:''}${e?'&end='+e:''}" title="فيديو الدرس" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div><p class="hint"><a href="https://youtu.be/${id}${s?'?t='+s:''}" target="_blank" rel="noopener">إن لم يعمل الفيديو هنا، شاهده على يوتيوب</a></p>`;
function lesson(s,l){
  const r=prog()[l.id],ex=(window.EXAMS||[]).filter(e=>[].concat(e.l).includes(l.id));
  app.innerHTML=`<h2 dir="auto">${l.title}</h2>${l.qs.length?`<div class="acts"><div class="btn" id="go">ابدأ الاختبار (${l.qs.length} سؤالًا)</div></div>${(()=>{const sv=qload();return sv&&sv.lid===l.id?`<div class="acts"><div class="btn alt" id="rs">⏯ تابع من حيث توقفت (${sv.i+1} / ${sv.idx.length})</div></div>`:''})()}${r?`<p class="hint">آخر نتيجة: ${r.last??r.pct}% · أفضل نتيجة: ${r.pct}%</p>`:''}`:'<p class="hint">لم تُضف أسئلة هذا الدرس بعد.</p>'}
  ${recBtn(l)}${l.acts?`<div class="acts"><div class="btn alt" id="ac">✏️ الأنشطة والتمارين (${l.acts.reduce((n,g)=>n+g.items.length,0)})</div></div>`:''}
  ${l.v?videoHtml(l.v):''}
  ${l.pg?'<div id="pdf" class="pdf"></div>':''}<div id="exb"></div>`;
  if(l.qs.length)$('#go').onclick=()=>go(()=>quiz(s,l),l.title,s.color);
  if($('#rs'))$('#rs').onclick=()=>go(()=>quiz(s,l,true),l.title,s.color);
  if($('#rc'))$('#rc').onclick=()=>go(()=>recite(s,l),l.title,s.color);
  if($('#ac'))$('#ac').onclick=()=>go(()=>activities(s,l),l.title,s.color);
  const sx=list=>{const b=$('#exb');if(!list.length||!b)return;const was=$('#exW')&&!$('#exW').hidden;b.innerHTML=examHtml(list);bindAns(b);
    const w=$('#exW'),t=$('#exT'),lab=t.textContent.replace(/ [▾▴]$/,'');
    const set=o=>{w.hidden=!o;t.textContent=lab+(o?' ▴':' ▾')};set(was);t.onclick=()=>set(w.hidden)};
  sx(ex);
  if(db)db.collection('exams').where('l','array-contains',l.id).get().then(q=>{const ids=new Set(ex.map(e=>e.id));sx(ex.concat(q.docs.filter(d=>!ids.has(d.id)).map(d=>d.data())))}).catch(()=>{});
  if(l.pg)renderImgs(l,$('#pdf'));
}
/* نافذة الأنشطة والتمارين التفاعلية: اضغط على الإجابة الصحيحة، ثم «أظهر الحل» عند الحاجة */
function activities(s,l){
  const fr=s.id==='fr',D=fr?' dir="ltr" lang="fr"':'',st='style="font:600 18px/1.9 Tajawal;white-space:pre-line"';
  const norm=x=>String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘`]/g,"'");
  const hint={pick:'اضغط على فعل الرأي أو عبارة الرأي في الجملة (وإن كانت من كلمتين فاضغط عليهما معًا).',fill:'اختر الفعل المناسب لإكمال الجملة — كل فعل يُستعمل مرة واحدة.',build:'اختر فعل رأي لإعادة صياغة الأطروحة — الاختيار حرّ، لكن احذر الأفعال الخاطئة!',write:'اكتب جملتيك ثم اضغط «تحقّق».'};
  const tr=x=>x.ar?`<div class="qtr" dir="rtl">${esc(x.ar)}</div>`:'';
  app.innerHTML=`<h2 dir="auto">✏️ الأنشطة والتمارين</h2><p class="hint">أجب بنفسك بالضغط على الإجابة الصحيحة، وإن احتجت فاضغط «أظهر الحل» (الحلول من «Je me corrige»).</p>`+
  l.acts.map((g,i)=>{
    const ty=g.type||'show';
    return `<h2 dir="auto">${esc(g.h)}</h2><div class="qbox"${D} ${st}>${esc(g.t)}${tr(g)}</div>${hint[ty]?`<p class="hint">${hint[ty]}</p>`:''}`+
    g.items.map((it,k)=>{
      const id=`${i}-${k}`;
      let body=esc(it.q||''),ui='';
      if(ty==='pick')body=it.s.split(' ').map((x,m)=>`<span class="seg" data-m="${m}">${esc(x)}</span>`).join(' ');
      if(ty==='fill'){body=`${esc(it.pre)}<span class="blank">………</span>${esc(it.post)}`;ui=`<div class="chips"${D}>${g.opts.map(o=>`<button class="chip" data-w="${esc(o)}">${esc(o)}</button>`).join('')}</div>`}
      if(ty==='build')ui=`<div class="chips"${D}>${g.opts.map(o=>`<button class="chip" data-v="${esc(o[0])}" data-ok="${o[1]}">${esc(o[0])}</button>`).join('')}</div>`;
      if(ty==='write')ui=`<textarea class="wr" rows="4"${D} placeholder="Phrase 1 …&#10;Phrase 2 …"></textarea><div class="acts"><div class="btn" data-chk="1">تحقّق</div></div>`;
      const sol=it.a?`<div class="acts"><div class="btn alt" data-a="ac${id}">أظهر الحل</div></div><div class="qbox" id="aac${id}" hidden${D} ${st}>${esc(it.a)}</div>`:'';
      return `<div class="act" data-i="${i}" data-k="${k}"><div class="qbox"${D} ${st}>${body}${tr(it)}<div class="fb" dir="rtl"></div></div>${ui}${sol}</div>`;
    }).join('');
  }).join('');
  bindAns(app);
  const fb=(box,ok,msg)=>{const f=box.querySelector('.fb');f.className='fb '+(ok?'ok':'no');f.innerHTML=msg};
  const used=new Set(),fills=[];
  const refresh=()=>fills.forEach(b=>{if(!b._ok)b.querySelectorAll('.chip').forEach(c=>c.disabled=used.has(c.dataset.w))});
  app.querySelectorAll('.act').forEach(box=>{
    const g=l.acts[+box.dataset.i],it=g.items[+box.dataset.k],ty=g.type;
    if(ty==='pick'){
      const words=it.s.split(' '),need=new Set(it.ans),got=new Set();
      box.querySelectorAll('.seg').forEach(sp=>sp.onclick=()=>{
        const m=+sp.dataset.m;
        if(got.size===need.size||got.has(m))return;
        if(need.has(m)){
          got.add(m);sp.classList.add('ok');
          fb(box,true,got.size===need.size?'✔ أحسنت! <bdi dir="ltr">'+esc(it.ans.map(n=>words[n]).join(' ').replace(/,$/,''))+' = '+esc(it.kind)+'</bdi>':'✔ جيد، تابع…');
        }else{sp.classList.add('no');fb(box,false,'✘ ليست هذه، حاول مرة أخرى');setTimeout(()=>sp.classList.remove('no'),700)}
      });
    }
    if(ty==='fill'){
      fills.push(box);
      box.querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>{
        if(box._ok||ch.disabled)return;
        if(ch.dataset.w===it.ans){
          box._ok=true;ch.classList.add('ok');used.add(it.ans);
          box.querySelector('.blank').textContent=it.ans;
          box.querySelectorAll('.chip').forEach(c=>{if(c!==ch)c.disabled=true});
          fb(box,true,'✔ صحيح!');refresh();
        }else{ch.classList.add('no');fb(box,false,'✘ جرّب فعلًا آخر');setTimeout(()=>ch.classList.remove('no'),700)}
      });
    }
    if(ty==='build'){
      box.querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>{
        const ok=ch.dataset.ok==='1';
        box.querySelectorAll('.chip').forEach(c=>c.classList.remove('ok','no'));
        ch.classList.add(ok?'ok':'no');
        const sent=ch.dataset.v+' '+it.th;
        fb(box,ok,(ok?'✔ ':'✘ ')+'<bdi dir="ltr">'+esc(sent)+'</bdi>'+(ok?' — فعل رأي صحيح':' — هذا ليس فعل رأي'));
      });
    }
    if(ty==='write'){
      box.querySelector('[data-chk]').onclick=()=>{
        const ss=box.querySelector('textarea').value.split(/\n|(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);
        const f=box.querySelector('.fb');
        if(!ss.length){f.className='fb no';f.textContent='اكتب جملتيك أولًا';return}
        const has=x=>{x=norm(x);return /(pens|croi|estim|trouv|affirm|dout)[a-z]*\s+que/.test(x)||/persuad|convaincu|suis sur/.test(x)||/a mon avis|d'apres moi|selon moi|personnellement|en ce qui me concerne/.test(x)};
        const n=ss.filter(has).length;
        f.className='fb '+(n>=2?'ok':'no');
        f.innerHTML=ss.map(x=>(has(x)?'✔ ':'✘ ')+'<bdi dir="ltr">'+esc(x)+'</bdi>').join('<br>')+'<br>'+(n>=2?'أحسنت! جملتان فيهما فعل رأي أو عبارة رأي.':'ينقصك '+(2-n)+' جملة فيها فعل رأي (مثل: je pense que، à mon avis…).');
      };
    }
  });
}
function examHtml(ex){
  const ys=[...new Set(ex.map(e=>e.y))].sort((a,b)=>b-a),st='style="font:600 18px/1.9 Tajawal;white-space:pre-line"';
  return `<div class="acts"><div class="btn alt" id="exT">📝 أسئلة شهادة التعليم المتوسط (${ex.length})</div></div><div id="exW" hidden><p class="hint">ورد هذا الدرس في ${ex.length} تمرينًا من شهادات: ${ys.join(' · ')}</p>`+
  ys.map(y=>`<h2>شهادة ${y}</h2>`+ex.filter(e=>e.y===y).map((e,i)=>`<div class="qbox" ${st}>${esc(e.t)}</div><div class="acts"><div class="btn alt" data-a="${y}-${i}">أظهر الحل</div></div><div class="qbox" id="a${y}-${i}" hidden ${st}>${esc(e.a||'لم يُضف الحل بعد.')}</div>`).join('')).join('')+'</div>';
}
function bindAns(root){root.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=$('#a'+b.dataset.a);a.hidden=!a.hidden;b.textContent=a.hidden?'أظهر الحل':'أخفِ الحل'})}
/* صفحات الدرس كصور جاهزة (pdf/<id>-<n>.jpg): تظهر بدقة وخطوط سليمة على كل الهواتف؛ وإن فُقدت الصورة يعود العرض إلى PDF */
function renderImgs(l,box){
  box.innerHTML='';
  for(let n=1;n<=l.pg;n++){
    const im=new Image();im.alt='صفحة '+n+' من الدرس';im.decoding='async';
    im.onerror=()=>{if(!box.dataset.fb){box.dataset.fb=1;box.innerHTML='<p class="hint">تعذّر تحميل صور الدرس — استعمل زر Google Drive.</p>'}};
    im.src=l.pdf.replace(/\.pdf$/,'-'+n+'.jpg');
    box.appendChild(im);
  }
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
/* لا يُحفظ تقدّم الاختبار: مغادرة الصفحة تلغي كل الإجابات ويبدأ التلميذ من الصفر */
const qsave=S=>{},qload=()=>null,qclear=()=>localStorage.removeItem('quiz');
function quiz(s,l,resume){
  let S=resume?qload():null;
  if(!S||S.lid!==l.id||S.n!==l.qs.length){
    S={sid:s.id,lid:l.id,n:l.qs.length,idx:shuffle(l.qs.map((_,k)=>k)),i:0,right:0,wrong:[],combo:0,gain:0,round:0,opts:null,sel:null};
  }
  testActive={type:'quiz',s,l};
  const FD=s.id==='fr'?' dir="ltr" lang="fr"':'';
  const draw=()=>{
    if(S.i>=S.idx.length)return done();
    const item=l.qs[S.idx[S.i]],q=item[0],a=item[1];
    if(!S.opts)S.opts=shuffle(item.slice(1));
    qsave(S);
    const opts=S.opts;
    app.innerHTML=`<div class="bar"><i style="width:${S.i/S.idx.length*100}%"></i></div><p class="cnt">${S.i+1} / ${S.idx.length}${S.combo>1?` <span class="combo">🔥 ×${S.combo}</span>`:''}</p><div class="qbox"${FD}>${esc(q)}${l.tr&&l.tr[S.idx[S.i]]?`<div class="qtr" dir="rtl">${esc(l.tr[S.idx[S.i]])}</div>`:''}</div>`+opts.map((o,k)=>`<button class="opt"${FD}><span class="ltr">${(FD?'ABCD':'أبجد')[k]}</span>${esc(o)}</button>`).join('')+'<div id="nx"></div>';
    const mark=k=>{
      const good=opts[k]===a,bs=app.querySelectorAll('.opt');
      bs.forEach((x,j)=>{x.disabled=true;if(opts[j]===a)x.classList.add('ok')});
      bs[k].classList.add(good?'pop':'no');
      $('#nx').innerHTML=`<div class="fb ${good?'g':'b'}">${good?pick(PRAISE)+' ⭐ +10':pick(OOPS)}</div><div class="btn" id="n">التالي</div>`;
      $('#n').onclick=()=>{S.i++;S.opts=null;S.sel=null;qsave(S);draw()};
      scrollTo(0,document.body.scrollHeight);
    };
    app.querySelectorAll('.opt').forEach((b,k)=>b.onclick=()=>{
      const good=opts[k]===a;
      if(good){S.right++;S.combo++;S.gain+=10;SFX.ok(S.combo)}else{S.wrong.push(S.idx[S.i]);S.combo=0;SFX.no()}
      S.sel=k;qsave(S);mark(k);
    });
    if(S.sel!=null)mark(S.sel);   /* استعادة سؤال أُجيب عنه قبل إعادة تحميل الصفحة */
  };
  const done=()=>{
    testActive=null;qclear();
    const total=l.qs.length,correct=total-S.wrong.length,pct=Math.round(correct/total*100),corr=S.round>0;
    save(s,l,correct,pct,corr?'correction':'attempt');
    if(pct>=90)S.gain+=20;addXp(S.gain);
    const best=(prog()[l.id]||{}).pct??pct,n=stars(best),gain=S.gain;
    app.innerHTML=`<div class="res"><div class="big">${n>=2?'🏆':'💪'}</div><h2>${pct}%</h2><div class="st">${starsHtml(n)}</div><p>${corr?'النتيجة بعد التصحيح: ':''}${correct} صحيحة من ${total} · ‎+${gain} نقطة</p><p class="msg">${pct>=90?'أسطوري! أنت بطل هذا الدرس':pct>=70?'عمل رائع، اقتربت من القمة!':'بداية جيدة، أعد المحاولة وستتفوق!'}</p><p class="hint">✓ تم حفظ هذه النتيجة · أفضل نتيجة لك في هذا الدرس: <b>${best}%</b></p><div class="acts">${S.wrong.length?'<div class="btn alt" id="re">أعد الأخطاء</div>':''}<div class="btn" id="again">محاولة جديدة 🔄</div></div><div class="acts"><div class="btn alt" id="bk">الدروس</div></div></div>`;
    if(pct>=70){confetti();SFX.win()}else SFX.lose();
    $('#again').onclick=()=>quiz(s,l);
    if(S.wrong.length)$('#re').onclick=()=>{testActive={type:'quiz',s,l};S.idx=shuffle(S.wrong);S.wrong=[];S.i=0;S.right=0;S.gain=0;S.combo=0;S.round++;S.opts=null;S.sel=null;draw()};
    $('#bk').onclick=()=>{hist=hist.slice(0,2);show()};
  };
  draw();
}
/* حفظ النتيجة: محليًا (آخر نتيجة + أفضل نتيجة) ثم في قائمة انتظار تُرسل إلى Firestore مع إعادة المحاولة عند فشل الاتصال */
function save(s,l,correct,pct,kind){
  const p=prog(),o=p[l.id]||{};
  p[l.id]={pct:Math.max(pct,o.pct||0),last:pct,at:Date.now()};store.set('prog',p);
  const q=store.get('outbox',[]);
  q.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ts:Date.now(),student:name,subject:s.name,lessonId:l.id,lesson:l.title,right:correct,total:l.qs.length,percent:pct,kind});
  store.set('outbox',q);flush();
}
let flushing=false;
async function flush(){
  if(!db||flushing)return;flushing=true;
  try{
    let q=store.get('outbox',[]);
    while(q.length){
      const{id,ts,...d}=q[0];
      try{
        await Promise.race([db.collection('results').doc(id).set({...d,clientAt:ts,at:firebase.firestore.FieldValue.serverTimestamp()}),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),10000))]);
      }catch(e){if(!(e&&e.code==='permission-denied'))throw e}
      q=store.get('outbox',[]).filter(x=>x.id!==id);store.set('outbox',q);
    }
  }catch(e){}
  flushing=false;
}
addEventListener('online',flush);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)flush()});
setInterval(flush,60000);
/* مغادرة الصفحة أثناء اختبار أو تسميع: تُلغى كل الإجابات ويُعلَم الأستاذ (kind:'left') */
function leftTest(){
  const T=testActive;if(!T)return;
  testActive=null;qclear();localStorage.removeItem('rec');try{rstopMic()}catch(e){}
  store.set('leftTest',{type:T.type,sid:T.s.id,lid:T.l.id,at:Date.now()});
  const q=store.get('outbox',[]);
  q.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ts:Date.now(),student:name,subject:T.s.name,lessonId:T.l.id,lesson:T.l.title,right:0,total:T.type==='quiz'?T.l.qs.length:getRec(T.l).length,percent:0,kind:'left',mode:T.type});
  store.set('outbox',q);flush();
}
function showLeft(){
  const L=store.get('leftTest',null);if(!L)return;
  localStorage.removeItem('leftTest');
  const s=SUBJECTS.find(x=>x.id===L.sid),l=s&&s.sections.flatMap(x=>x.lessons).find(x=>x.id===L.lid),w=L.type==='quiz'?'الاختبار':'التسميع';
  app.innerHTML=`<div class="res"><div class="big">⚠️</div><h2 style="font-size:34px">غادرتَ الصفحة أثناء ${w}</h2><p>أُلغيت جميع إجاباتك وسيبدأ ${w} من الصفر، وتم إعلام الأستاذ بذلك.</p><div class="acts"><div class="btn" id="rs0">ابدأ من جديد 🔄</div></div><div class="acts"><div class="btn alt" id="hm">الدروس</div></div></div>`;
  $('#hm').onclick=()=>{hist=[];go(home,'حفظ')};
  $('#rs0').onclick=()=>{if(!s||!l){hist=[];go(home,'حفظ');return}
    hist=[[home,'حفظ'],[()=>subject(s),s.name,s.color],[()=>lesson(s,l),l.title,s.color]];
    go(()=>L.type==='quiz'?quiz(s,l):recite(s,l),l.title,s.color)};
}
document.addEventListener('visibilitychange',()=>{document.hidden?leftTest():showLeft()});
addEventListener('pagehide',leftTest);
let unlocked=false;
function adminGate(){
  if(!db){app.innerHTML='<div class="res"><p>اربط Firebase في firebase-config.js أولًا.</p></div>';return}
  if(unlocked)return admin();
  app.innerHTML='<div class="res"><h2>دخول الأستاذ</h2><input id="pw" type="password" inputmode="numeric" dir="ltr" placeholder="الرقم السري"><div class="btn" id="lg">دخول</div><p class="hint" id="er"></p></div>';
  const go2=()=>{if($('#pw').value===String(window.ADMIN_PIN||'')&&window.ADMIN_PIN){unlocked=true;admin()}else $('#er').textContent='الرقم السري غير صحيح'};
  $('#lg').onclick=go2;$('#pw').onkeydown=e=>{if(e.key==='Enter')go2()};
}
async function admin(){
  if(!db){app.innerHTML='<div class="res"><p>اربط Firebase في firebase-config.js لعرض نتائج التلاميذ.</p></div>';return}
  app.innerHTML='<p class="hint">جارٍ التحميل…</p>';
  try{
    const sn=await db.collection('results').orderBy('at','desc').limit(500).get();
    const rows=sn.docs.map(d=>({id:d.id,...d.data()})),by={};
    const bl={};rows.forEach(r=>{if(r.kind==='recite'||r.kind==='left')return;const k=r.student+'|'+r.lessonId;bl[k]=Math.max(bl[k]??0,r.percent||0)});Object.entries(bl).forEach(([k,v])=>{(by[k.split('|')[0]]??=[]).push(v)});
    const st2={},ls2={};
    rows.forEach(r=>{
      if(r.kind==='recite'||r.kind==='left')return;
      const cor=r.kind==='correction',s=st2[r.student]??={at:0,co:0,ls:new Set()},k=r.student+'|'+r.lessonId,l=ls2[k]??={n:r.student,t:r.lesson||r.lessonId,at:0,co:0,best:0};
      if(cor){s.co++;l.co++}else{s.at++;l.at++}
      s.ls.add(r.lessonId);l.best=Math.max(l.best,r.percent||0);
    });
    const avg=Object.entries(by).map(([n,a])=>{const s=st2[n]||{at:0,co:0,ls:new Set()};return `<tr><td>${esc(n)}</td><td>${s.ls.size}</td><td>${s.at}</td><td>${Math.max(0,s.at-s.ls.size)}</td><td>${s.co}</td><td>${Math.round(a.reduce((x,y)=>x+y,0)/a.length)}%</td></tr>`}).join('');
    const det=Object.values(ls2).sort((x,y)=>x.n.localeCompare(y.n,'ar')).map(l=>`<tr><td>${esc(l.n)}</td><td>${esc(l.t)}</td><td>${l.at}</td><td>${Math.max(0,l.at-1)}</td><td>${l.co}</td><td>${l.best}%</td></tr>`).join('');
    const lf=rows.filter(r=>r.kind==='left'),leftT=lf.length?`<h2>🚨 مغادرة الصفحة أثناء الاختبار (${lf.length})</h2><div class="tw"><table><tr><th>التلميذ</th><th>المادة</th><th>الدرس</th><th>أثناء</th><th>التاريخ</th></tr>${lf.map(r=>`<tr><td>${esc(r.student)}</td><td>${esc(r.subject)}</td><td>${esc(r.lesson||r.lessonId)}</td><td>${r.mode==='quiz'?'الاختيارات':'التسميع'}</td><td>${r.at?r.at.toDate().toLocaleString('ar'):''}</td></tr>`).join('')}</table></div>`:'';
    const rb={};rows.filter(r=>r.kind==='recite').forEach(r=>{const k=r.student+'|'+r.lessonId,o=rb[k]??={n:r.student,t:r.lesson||r.lessonId,c:0,best:0};o.c++;o.best=Math.max(o.best,r.percent||0)});
    const recT=Object.values(rb).length?`<h2>نتائج التسميع</h2><div class="tw"><table><tr><th>التلميذ</th><th>الدرس</th><th>المحاولات</th><th>الأفضل</th></tr>${Object.values(rb).sort((x,y)=>x.n.localeCompare(y.n,'ar')).map(o=>`<tr><td>${esc(o.n)}</td><td>${esc(o.t)}</td><td>${o.c}</td><td>${o.best}%</td></tr>`).join('')}</table></div>`:'';
    app.innerHTML=`<div class="acts"><div class="btn alt" id="out">خروج</div></div>${leftT}<h2>المعدل لكل تلميذ</h2><div class="tw"><table><tr><th>التلميذ</th><th>الدروس</th><th>المحاولات</th><th>إعادة البدء</th><th>التصحيحات</th><th>المعدل (أفضل نتيجة لكل درس)</th></tr>${avg}</table></div><h2>التفصيل حسب الدرس</h2><div class=\"tw\"><table><tr><th>التلميذ</th><th>الدرس</th><th>المحاولات</th><th>إعادة البدء</th><th>التصحيحات</th><th>الأفضل</th></tr>${det}</table></div>
    ${recT}
    <h2>آخر النتائج</h2><div class="tw"><table><tr><th>التلميذ</th><th>المادة</th><th>الدرس</th><th>النتيجة</th><th>النوع</th><th>التاريخ</th><th></th></tr>`+
    rows.map(r=>`<tr><td>${esc(r.student)}</td><td>${esc(r.subject)}</td><td>${esc(r.lessonId)}</td><td>${r.percent}%</td><td>${r.kind==='correction'?'بعد التصحيح':r.kind==='recite'?'تسميع':r.kind==='left'?'🚨 غادر الصفحة':'محاولة'}</td><td>${r.at?r.at.toDate().toLocaleString('ar'):''}</td><td><a data-d="${r.id}" style="cursor:pointer">🗑</a></td></tr>`).join('')+'</table></div>';
    $('#out').onclick=()=>{unlocked=false;hist=hist.slice(0,1);show()};
    app.querySelectorAll('[data-d]').forEach(a=>a.onclick=async()=>{if(confirm('حذف هذه النتيجة؟')){await db.collection('results').doc(a.dataset.d).delete();admin()}});
  }catch(e){app.innerHTML='<div class="res"><p>تعذّر التحميل. تحقق من القواعد ومن تفعيل الدخول بالبريد في Firebase.</p></div>'}
}
function boot(){
  if(!name)return askName();
  who.textContent='👤';flush();
  localStorage.removeItem('quiz');localStorage.removeItem('rec');
  go(home,'حفظ');
  if(store.get('leftTest',null))showLeft();
}
boot();
