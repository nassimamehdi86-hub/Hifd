/* اختبار التسميع: التلميذ يسمّع كل عنوان من الدرس (صوتًا أو كتابةً) — 3 محاولات لكل عنوان ثم يظهر الحل. لا مؤقت هنا: الوقت يُنظَّم بكرونو حصة المادة (chrono.js).
   عناصر الدرس: l.rec = [[العنوان, الإجابة النموذجية, كلمات مفتاحية اختيارية], ...]
   إن لم يوجد l.rec يُشتقّ الاختبار من أسئلة الدرس (qs) ما عدا الأسئلة التي تعتمد على رؤية الخيارات. */
const RLIMIT=12*3600*1000,RMAX=3,RPTS=[100,70,40],RPASS=.55;
const AR_STOP=new Set('في من على الى عن ان ما هو هي او ثم كل هذا هذه الذي التي بين كان يكون ذلك قد لا مع هذان هما انه انها التي الذين'.split(' '));
function rnorm(s){
  return String(s||'').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
    .replace(/[^\u0621-\u064A0-9a-zA-Z\s]/g,' ').toLowerCase().replace(/\s+/g,' ').trim();
}
function rstem(w){
  w=w.replace(/^(وال|بال|كال|فال|لل|ال)/,'');
  if(w.length>3&&w[0]==='و')w=w.slice(1);
  if(w.length>4)w=w.replace(/(ات|ون|ين|ان)$/,'');
  if(w.length>3)w=w.replace(/ه$/,'');
  return w;
}
const rtok=s=>rnorm(s).split(' ').filter(w=>w&&!AR_STOP.has(w)&&(w.length>=3||/^\d+$/.test(w))).map(rstem);
function rsame(a,b){
  if(a===b)return true;
  if(a.length<4||b.length<4)return false;
  let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;
  return i>=4&&i>=Math.min(a.length,b.length)-1;
}
function rcheck(item,text){
  const keys=[...new Set((item[2]&&item[2].length?item[2].flatMap(rtok):rtok(item[1])))];
  if(!keys.length)return false;
  const got=rtok(text);
  const hit=keys.filter(k=>got.some(g=>rsame(g,k))).length;
  return hit>=Math.ceil(keys.length*RPASS);
}
function getRec(l){
  if(l.rec&&l.rec.length)return l.rec;
  /* لا عناوين: نسأل عن محتوى الدرس نفسه من أسئلته. الأسئلة المعتمدة على رؤية الخيارات (أي...؟) تُحوَّل إلى «اذكر...» والسلبية (ليس...) تُهمل */
  return (l.qs||[]).map(q=>{
    let t=String(q[0]).trim();
    if(/ليس|غير\s+صحيح|لا\s+يُعد|لا\s+يعد/.test(t))return null;
    if(/^(أي|أيّ|أيها|أيهما)\s/.test(t))t='اذكر '+t.replace(/^(أي|أيّ|أيها|أيهما)\s+(مما يلي|منها|من التالية|من الآتية|مما يأتي)?\s*/,'').replace(/[؟?]\s*$/,'');
    return rtok(q[1]).length?[t,q[1],null,1]:null;
  }).filter(Boolean);
}
const rfmt=ms=>{ms=Math.max(0,ms);const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const rlive=()=>null; /* لا استئناف: مغادرة الصفحة تلغي التسميع */
function recBtn(l){
  if(!getRec(l).length)return '';
  const R=rlive(l),o=store.get('recp',{})[l.id];
  return `<div class="acts"><div class="btn rec" id="rc">${R?`⏯ تابع التسميع (العنوان ${R.i+1} من ${R.n})`:'🎙️ اختبار التسميع'}</div></div>${o?`<p class="hint">آخر تسميع: ${o.last}% · أفضل تسميع: ${o.pct}%</p>`:''}`;
}
let rTimer=null,rMic=null;
function rstopMic(){try{rMic&&rMic.stop()}catch(e){}rMic=null}
function recite(s,l){
  const items=getRec(l),n=items.length;
  let S=null;
  testActive={type:'recite',s,l};
  {
    S={sid:s.id,lid:l.id,n,start:Date.now(),order:items.map((_,k)=>k),i:0,att:0,scores:[],note:null};
    store.set('rec',S);
  }
  clearInterval(rTimer);
  const draw=()=>{
    if(S.i>=n)return finish(false);
    const it=items[S.order[S.i]];
    app.innerHTML=`<div class="rtop"><span>🎙️ التسميع</span><span>${S.i+1} / ${n}</span></div><div class="bar"><i style="width:${S.i/n*100}%"></i></div>
    <div class="qbox">${it[3]?'':'سمّع: '}${esc(it[0])}</div>
    <p class="dots">${[0,1,2].map(k=>k<S.att?'🔴':k===S.att?'🟡':'⚪').join(' ')} &nbsp; المحاولة ${Math.min(S.att+1,RMAX)} من ${RMAX}</p>
    <textarea id="ans" rows="5" placeholder="سمّع من حفظك… أو اكتب إجابتك بنفسك" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    <div class="acts"><div class="btn alt" id="mic">🎙️ ابدأ التسميع</div><div class="btn" id="chk">تحقّق ✔</div></div><div id="fb"></div><div class="acts"><div class="btn alt rst" id="rst">🔄 ابدأ من الأول</div></div>`;
    const ta=$('#ans');
    $('#rst').onclick=()=>{if(confirm('هل تريد البدء من العنوان الأول؟ ')){rstopMic();clearInterval(rTimer);localStorage.removeItem('rec');recite(s,l)}};
    ['paste','drop','cut','copy','contextmenu'].forEach(ev=>ta.addEventListener(ev,e=>e.preventDefault()));
    initMic($('#mic'),ta);
    $('#chk').onclick=()=>{
      const text=ta.value.trim();
      if(text.length<2){$('#fb').innerHTML='<div class="fb b">اكتب أو سمّع إجابتك أولًا</div>';return}
      rstopMic();
      if(rcheck(it,text)){
        S.scores[S.order[S.i]]=S.rev?RPTS[RMAX-1]:RPTS[S.att];store.set('rec',S);SFX.ok(S.att===0&&!S.rev?3:1);
        lock(`<div class="fb g">${pick(PRAISE)} ⭐</div><div class="btn" id="nx2">التالي</div>`);
      }else{
        S.att++;SFX.no();
        if(S.att>=RMAX){
          S.scores[S.order[S.i]]=0;store.set('rec',S);
          lock(`<div class="fb b">انتهت المحاولات — هذه الإجابة النموذجية:</div><div class="mdl">${esc(it[1])}</div><div class="acts"><div class="btn alt" id="rt">🔁 أعد المحاولة</div><div class="btn" id="nx2">التالي</div></div>`);
        }else{
          store.set('rec',S);ta.value='';
          $('#fb').innerHTML=`<div class="fb b">ليست الإجابة المطلوبة بعد — حاول مجددًا (بقيت ${RMAX-S.att} ${RMAX-S.att===1?'محاولة':'محاولات'})</div>`;
          document.querySelector('.dots').innerHTML=[0,1,2].map(k=>k<S.att?'🔴':k===S.att?'🟡':'⚪').join(' ')+` &nbsp; المحاولة ${S.att+1} من ${RMAX}`;
        }
      }
    };
    const lock=html=>{
      ta.disabled=true;$('#chk').hidden=true;$('#mic').hidden=true;$('#fb').innerHTML=html;
      $('#nx2').onclick=()=>{S.i++;S.att=0;S.rev=0;store.set('rec',S);draw()};
      if($('#rt'))$('#rt').onclick=()=>{S.att=0;S.rev=1;store.set('rec',S);draw()};
      scrollTo(0,document.body.scrollHeight);
    };
  };
  const finish=timeout=>{
    testActive=null;clearInterval(rTimer);rstopMic();
    const sc=items.map((_,k)=>S.scores[k]??0),pct=Math.round(sc.reduce((a,b)=>a+b,0)/n),mem=sc.filter(x=>x>0).length;
    localStorage.removeItem('rec');
    const p=store.get('recp',{}),o=p[l.id]||{};p[l.id]={pct:Math.max(pct,o.pct||0),last:pct,at:Date.now()};store.set('recp',p);
    const q=store.get('outbox',[]);
    q.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ts:Date.now(),student:name,subject:s.name,lessonId:l.id,lesson:l.title,right:mem,total:n,percent:pct,kind:'recite'});
    store.set('outbox',q);flush();addXp(Math.round(pct/5));
    const best=p[l.id].pct,nst=stars(pct);
    const rows=S.order.map((k,j)=>{const v=sc[k];return `<div class="rrow">${v>=100?'✅':v>0?'🟡':'❌'} ${esc(items[k][0])}</div>`}).join('');
    app.innerHTML=`<div class="res"><div class="big">${pct>=70?'🏆':'💪'}</div><h2>${pct}%</h2><div class="st">${starsHtml(nst)}</div>
    <p>سمّعت ${mem} من ${n} عنوانًا</p><p class="hint">✓ تم حفظ النتيجة · أفضل تسميع لك: <b>${best}%</b></p>
    <div class="rlist">${rows}</div><p class="hint">✅ من المحاولة الأولى · 🟡 بعد أكثر من محاولة · ❌ لم تُسمَّع، راجع هذه العناوين في الدرس ثم أعد الاختبار</p>
    <div class="acts"><div class="btn" id="again">أعد التسميع 🔄</div></div><div class="acts"><div class="btn alt" id="bk">الدروس</div></div></div>`;
    if(pct>=70){confetti();SFX.win()}else SFX.lose();
    $('#again').onclick=()=>recite(s,l);
    $('#bk').onclick=()=>{hist=hist.slice(0,2);show()};
  };
  draw();
}
/* دمج نتائج التعرّف الصوتي دون تكرار: في بعض هواتف أندرويد تعيد كل نتيجة الكلمات السابقة، فنحذف الجزء المكرّر */
function rmerge(acc,t){
  t=String(t||'').trim();if(!t)return acc;if(!acc)return t;
  const a=acc.split(/\s+/),b=t.split(/\s+/),na=a.map(rnorm),nb=b.map(rnorm);
  if(nb.length>=2&&na.join(' ').indexOf(nb.join(' '))>=0)return acc;
  for(let k=Math.min(na.length,nb.length);k>=1;k--){
    let ok=true;for(let j=0;j<k;j++)if(na[na.length-k+j]!==nb[j]){ok=false;break}
    if(ok)return a.concat(b.slice(k)).join(' ');
  }
  return acc+' '+t;
}
function initMic(btn,ta){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){btn.textContent='🎙️ غير متاح في هذا المتصفح';btn.style.opacity=.5;btn.onclick=()=>alert('التسميع الصوتي يعمل في Chrome. يمكنك كتابة إجابتك في الخانة.');return}
  let on=false,base='';
  btn.onclick=()=>{
    if(on){rstopMic();return}
    const r=new SR();rMic=r;r.lang='ar-DZ';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
    base=ta.value?ta.value+' ':'';
    r.onresult=e=>{let acc='';for(let i=0;i<e.results.length;i++)acc=rmerge(acc,e.results[i][0].transcript);ta.value=base+acc};
    const off=()=>{on=false;if(btn.isConnected)btn.textContent='🎙️ ابدأ التسميع';btn.classList.remove('live')};
    r.onend=off;r.onerror=off;
    try{r.start();on=true;btn.textContent='⏹ توقّف';btn.classList.add('live')}catch(e){off()}
  };
}
