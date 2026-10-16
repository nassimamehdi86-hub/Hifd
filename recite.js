/* اختبار التسميع: التلميذ يسمّع كل عنوان من الدرس (صوتًا أو كتابةً) — 3 محاولات لكل عنوان ثم يظهر الحل. لا مؤقت هنا: الوقت يُنظَّم بكرونو حصة المادة (chrono.js).
   عناصر الدرس: l.rec = [[العنوان, الإجابة النموذجية, كلمات مفتاحية اختيارية, (داخلي: اتركه null), المستوى: 2 للعنوان الثانوي], ...]
   الكلمات المفتاحية: نص = كلمة مستقلة، ومصفوفة ['يتوسط','يقع بين'] = بدائل مقبولة لنفس الفكرة. القائمة تعرض كل العناوين ليختار التلميذ منها.
   إن لم يوجد l.rec يُشتقّ الاختبار من أسئلة الدرس (qs) ما عدا الأسئلة التي تعتمد على رؤية الخيارات. */
const RLIMIT=12*3600*1000,RMAX=3,RPTS=[100,70,40],RPASS=.5;
const AR_STOP=new Set('les des une est dans pour que qui par sur aux son ses ont sont avec ces cet cette mais في من على الى عن ان ما هو هي او ثم كل هذا هذه الذي التي بين كان يكون ذلك قد لا مع هذان هما انه انها التي الذين'.split(' '));
function rnorm(s){
  return String(s||'').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/œ/g,'oe').replace(/æ/g,'ae').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^\u0621-\u064A0-9a-zA-Z\s]/g,' ').replace(/(\d)(?=[^\d\s])/g,'$1 ').replace(/([^\d\s])(?=\d)/g,'$1 ').toLowerCase().replace(/\s+/g,' ').trim();
}
function rstem(w){
  w=w.replace(/^(وال|بال|كال|فال|لل|ال)/,'');
  if(w.length>3&&w[0]==='و')w=w.slice(1);
  if(w.length>4)w=w.replace(/(ات|ون|ين|ان)$/,'');
  if(w.length>3)w=w.replace(/ه$/,'');
  if(w.length>4&&/^[a-z]+$/.test(w))w=w.replace(/[sx]$/,'');   /* فرنسية: جمع */
  return w;
}
const rtok=s=>rnorm(s).split(' ').filter(w=>w&&!AR_STOP.has(w)&&(w.length>=3||/^\d+$/.test(w))).map(rstem);
/* مرادفات عامة: كلمات كل مجموعة تُعدّ متكافئة المعنى (تُطبَّع وتُجذَّع تلقائيًا). أضف مجموعات جديدة بحرية */
const RSYN=['تعريف مفهوم معنى','حرف اداة','يسمى يدعى يطلق','هدف غاية غرض مقصد','سبب علة دافع','نتيجة اثر ثمرة','مرحلة طور','اهمية فائدة فوائد','يتكون يتألف يتركب','يحتوي يشمل يتضمن','يساعد يعين يسهم','اولا اولى','ثانيا ثانية','ثالثا ثالثة'].map(g=>new Set(g.split(' ').map(w=>rstem(rnorm(w)))));
function rdist(a,b,max){
  if(Math.abs(a.length-b.length)>max)return max+1;
  let p=Array.from({length:b.length+1},(_,j)=>j);
  for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}
  return p[b.length];
}
function rsame(a,b){
  if(a===b)return true;
  if(/^\d+$/.test(a)||/^\d+$/.test(b))return false;      /* الأرقام يجب أن تتطابق تمامًا */
  if(a.length<4||b.length<4)return false;
  let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;
  if(i>=4&&i>=Math.min(a.length,b.length)-1)return true;  /* نفس الجذر مع اختلاف اللاحقة */
  const m=Math.min(a.length,b.length),t=m>=8?2:m>=5?1:0;   /* خطأ إملائي أو سماعي بسيط من التعرّف الصوتي */
  return t>0&&rdist(a,b,t)<=t;
}
const rhas=(got,w)=>got.some(g=>rsame(g,w))||RSYN.some(sy=>sy.has(w)&&got.some(g=>sy.has(g)));
/* الكلمات المفتاحية: نص عادي = كلمات منفصلة، أما مصفوفة ['يتوسط','يقع بين'] فهي بدائل مقبولة لنفس الفكرة (أي بديل يكفي) */
function rkeys(item){
  const raw=item[2]&&item[2].length?item[2]:null,out=[],seen=new Set();
  if(!raw){rtok(item[1]).forEach(w=>{if(!seen.has(w)){seen.add(w);out.push([[w]])}});return out}
  raw.forEach(k=>{
    if(Array.isArray(k)){const alts=k.map(a=>rtok(a)).filter(t=>t.length);if(alts.length)out.push(alts)}
    else rtok(k).forEach(w=>{if(!seen.has(w)){seen.add(w);out.push([[w]])}});
  });
  return out;
}
function rscore(item,text){
  const keys=rkeys(item);
  if(!keys.length)return{ok:false,hit:0,total:0};
  const got=rtok(text);
  const okK=keys.map(alts=>alts.some(ws=>ws.every(w=>rhas(got,w))));
  const hit=okK.filter(Boolean).length,total=keys.length;
  const nums=keys.map((alts,i)=>alts.every(ws=>ws.every(w=>/^\d+$/.test(w)))?i:-1).filter(i=>i>=0);
  const need=total<=2?total:Math.ceil(total*RPASS);   /* عنصر أو عنصران: كلاهما مطلوب */
  return{ok:hit>=need&&nums.every(i=>okK[i]),hit,total};   /* الأرقام والتواريخ يجب أن تصحّ دائمًا */
}
const rcheck=(item,text)=>rscore(item,text).ok;
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
  const FD=s.id==='fr'?' dir="ltr" lang="fr"':'';
  const S={sid:s.id,lid:l.id,n,start:Date.now(),order:items.map((_,k)=>k),cur:-1,att:0,rev:0,scores:[]};
  testActive={type:'recite',s,l};
  store.set('rec',S);
  clearInterval(rTimer);
  const mark=k=>{const v=S.scores[k];return v===undefined?'⚪':v>=100?'✅':v>0?'🟡':'❌'};
  const done=()=>items.filter((_,k)=>S.scores[k]!==undefined).length;

  /* ===== قائمة العناوين: التلميذ يضغط على العنوان وينطلق في الحفظ ===== */
  const menu=()=>{
    rstopMic();S.cur=-1;
    const d=done(),nxt=items.findIndex((_,k)=>S.scores[k]===undefined);
    app.innerHTML=`<div class="rtop"><span>🎙️ التسميع</span><span>${d} / ${n}</span></div><div class="bar"><i style="width:${d/n*100}%"></i></div>
    <p class="hint">${FD?'Touchez un titre pour commencer':'اضغط على أي عنوان لتبدأ حفظه وتسميعه'}</p>
    <div class="rmenu">${items.map((it,k)=>`<div class="rit${it[4]===2?' sub':''}" data-k="${k}"${FD}><span class="ri">${mark(k)}</span><span class="rt">${esc(it[0])}</span><span class="rg">${FD?'›':'‹'}</span></div>`).join('')}</div>
    ${nxt>=0?`<div class="acts"><div class="btn" id="go1">▶ ${d?'تابع من أول عنوان متبقٍّ':'ابدأ من الأول'}</div></div>`:''}
    <div class="acts"><div class="btn ${nxt<0?'':'alt'}" id="fin">🏁 أنهِ واعرض النتيجة</div></div>
    <div class="acts"><div class="btn alt rst" id="rst">🔄 صفّر كل شيء</div></div>`;
    app.querySelectorAll('.rit').forEach(el=>el.onclick=()=>open(+el.dataset.k));
    if($('#go1'))$('#go1').onclick=()=>open(nxt);
    $('#fin').onclick=()=>{if(d<n&&!confirm('بقيت عناوين لم تُسمَّع وستُحسب صفرًا. هل تريد إنهاء التسميع؟'))return;finish()};
    $('#rst').onclick=()=>{if(confirm('هل تريد تصفير كل النتائج والبدء من جديد؟')){rstopMic();localStorage.removeItem('rec');recite(s,l)}};
    scrollTo(0,0);
  };

  /* ===== حفظ عنوان واحد ===== */
  const open=k=>{
    S.cur=k;S.att=0;S.rev=S.scores[k]===undefined?0:1;   /* عنوان سبق تسميعه: تدريب لا ينقص درجته */
    store.set('rec',S);draw();
  };
  const draw=()=>{
    const k=S.cur,it=items[k];
    app.innerHTML=`<div class="rtop"><span>🎙️ التسميع</span><span>${k+1} / ${n}</span></div><div class="bar"><i style="width:${(k+1)/n*100}%"></i></div>
    <div class="qbox"${FD}>${it[3]?'':(FD?'Récite : ':'سمّع: ')}${esc(it[0])}</div>
    <p class="dots">${[0,1,2].map(j=>j<S.att?'🔴':j===S.att?'🟡':'⚪').join(' ')} &nbsp; المحاولة ${Math.min(S.att+1,RMAX)} من ${RMAX}${S.rev?' · تدريب':''}</p>
    <textarea id="ans" rows="5"${FD} placeholder="سمّع من حفظك… أو اكتب إجابتك بنفسك" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    <div class="acts"><div class="btn alt" id="mic">🎙️ ابدأ التسميع</div><div class="btn" id="chk">تحقّق ✔</div></div><div id="fb"></div>
    <div class="acts" id="tools"><div class="btn alt" id="peek">👁 أرني الحل</div><div class="btn alt" id="mn">☰ العناوين</div></div>`;
    const ta=$('#ans');
    ['paste','drop','cut','copy','contextmenu'].forEach(ev=>ta.addEventListener(ev,e=>e.preventDefault()));
    initMic($('#mic'),ta,s.id==='fr'?'fr-FR':'ar-DZ');
    $('#mn').onclick=menu;
    /* الحل النموذجي + إمكانية الإعادة + الانتقال */
    const lock=(head,leaveScore)=>{
      rstopMic();ta.disabled=true;$('#chk').hidden=true;$('#mic').hidden=true;$('#tools').hidden=true;
      const last=k>=n-1;
      $('#fb').innerHTML=`${head}<div class="mlbl">${FD?'Réponse modèle :':'الحل النموذجي:'}</div><div class="mdl"${FD}>${esc(it[1])}</div>
      <div class="acts"><div class="btn alt" id="rt">🔁 أعد المحاولة</div><div class="btn" id="nx2">${last?'☰ العناوين':'التالي ▶'}</div></div>
      ${last?'':'<div class="acts"><div class="btn alt" id="mn2">☰ العناوين</div></div>'}`;
      $('#rt').onclick=()=>{S.att=0;S.rev=1;store.set('rec',S);draw()};   /* إعادة للتدريب: لا تنقص الدرجة */
      $('#nx2').onclick=()=>last?menu():open(k+1);
      if($('#mn2'))$('#mn2').onclick=menu;
      scrollTo(0,document.body.scrollHeight);
    };
    $('#peek').onclick=()=>{              /* من اطّلع على الحل قبل الإجابة لا ينال درجة كاملة */
      if(S.scores[k]===undefined)S.scores[k]=0;
      S.rev=1;store.set('rec',S);
      lock('<div class="fb b">اقرأ الحل جيدًا ثم أعد المحاولة من حفظك 👇</div>');
    };
    $('#chk').onclick=()=>{
      const text=ta.value.trim();
      if(text.length<2){$('#fb').innerHTML='<div class="fb b">اكتب أو سمّع إجابتك أولًا</div>';return}
      rstopMic();
      const r=rscore(it,text);
      if(r.ok){
        S.scores[k]=S.rev?Math.max(S.scores[k]||0,RPTS[RMAX-1]):RPTS[S.att];
        store.set('rec',S);SFX.ok(S.att===0&&!S.rev?3:1);
        lock(`<div class="fb g">${pick(PRAISE)} ⭐</div>`);
      }else{
        S.att++;SFX.no();
        if(S.att>=RMAX){
          if(!S.rev)S.scores[k]=0;
          store.set('rec',S);
          lock('<div class="fb b">انتهت المحاولات — تأمّل الحل ثم أعد المحاولة:</div>');
        }else{
          store.set('rec',S);ta.value='';
          const near=r.total&&r.hit/r.total>=.3;
          $('#fb').innerHTML=`<div class="fb b">${near?'اقتربت! أكمل الفكرة — ':'ليست الإجابة المطلوبة بعد — '}حاول مجددًا (بقيت ${RMAX-S.att} ${RMAX-S.att===1?'محاولة':'محاولات'})</div>`;
          document.querySelector('.dots').innerHTML=[0,1,2].map(j=>j<S.att?'🔴':j===S.att?'🟡':'⚪').join(' ')+` &nbsp; المحاولة ${S.att+1} من ${RMAX}${S.rev?' · تدريب':''}`;
        }
      }
    };
  };

  const finish=()=>{
    testActive=null;clearInterval(rTimer);rstopMic();
    const sc=items.map((_,k)=>S.scores[k]??0),pct=Math.round(sc.reduce((a,b)=>a+b,0)/n),mem=sc.filter(x=>x>0).length;
    localStorage.removeItem('rec');
    const p=store.get('recp',{}),o=p[l.id]||{};p[l.id]={pct:Math.max(pct,o.pct||0),last:pct,at:Date.now()};store.set('recp',p);
    const q=store.get('outbox',[]);
    q.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ts:Date.now(),student:name,subject:s.name,lessonId:l.id,lesson:l.title,right:mem,total:n,percent:pct,kind:'recite'});
    store.set('outbox',q);flush();addXp(Math.round(pct/5));
    const best=p[l.id].pct,nst=stars(pct);
    const rows=S.order.map(k=>{const v=sc[k];return `<div class="rrow">${v>=100?'✅':v>0?'🟡':'❌'} ${esc(items[k][0])}</div>`}).join('');
    app.innerHTML=`<div class="res"><div class="big">${pct>=70?'🏆':'💪'}</div><h2>${pct}%</h2><div class="st">${starsHtml(nst)}</div>
    <p>سمّعت ${mem} من ${n} عنوانًا</p><p class="hint">✓ تم حفظ النتيجة · أفضل تسميع لك: <b>${best}%</b></p>
    <div class="rlist">${rows}</div><p class="hint">✅ من المحاولة الأولى · 🟡 بعد أكثر من محاولة · ❌ لم تُسمَّع، راجع هذه العناوين في الدرس ثم أعد الاختبار</p>
    <div class="acts"><div class="btn" id="again">أعد التسميع 🔄</div></div><div class="acts"><div class="btn alt" id="bk">الدروس</div></div></div>`;
    if(pct>=70){confetti();SFX.win()}else SFX.lose();
    $('#again').onclick=()=>recite(s,l);
    $('#bk').onclick=()=>{hist=hist.slice(0,2);show()};
  };
  menu();
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
function initMic(btn,ta,lang){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){btn.textContent='🎙️ غير متاح في هذا المتصفح';btn.style.opacity=.5;btn.onclick=()=>alert('التسميع الصوتي يعمل في Chrome. يمكنك كتابة إجابتك في الخانة.');return}
  let on=false,base='';
  btn.onclick=()=>{
    if(on){rstopMic();return}
    const r=new SR();rMic=r;r.lang=lang||'ar-DZ';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
    base=ta.value?ta.value+' ':'';
    r.onresult=e=>{let acc='';for(let i=0;i<e.results.length;i++)acc=rmerge(acc,e.results[i][0].transcript);ta.value=base+acc};
    const off=()=>{on=false;if(btn.isConnected)btn.textContent='🎙️ ابدأ التسميع';btn.classList.remove('live')};
    r.onend=off;r.onerror=off;
    try{r.start();on=true;btn.textContent='⏹ توقّف';btn.classList.add('live')}catch(e){off()}
  };
}
