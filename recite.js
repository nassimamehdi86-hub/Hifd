/* اختبار التسميع: التلميذ يسمّع كل عنوان من الدرس (صوتًا أو كتابةً) — 3 محاولات لكل عنوان ثم يظهر الحل. لا مؤقت هنا: الوقت يُنظَّم بكرونو حصة المادة (chrono.js).
   عناصر الدرس: l.rec = [[العنوان, الإجابة النموذجية, كلمات مفتاحية اختيارية], ...]
   إن لم يوجد l.rec يُشتقّ الاختبار من أسئلة الدرس (qs) ما عدا الأسئلة التي تعتمد على رؤية الخيارات. */
const RLIMIT=12*3600*1000,RMAX=3,RPTS=[100,70,40],RPASS=.45;
const AR_STOP=new Set('les des une est dans pour que qui par sur aux son ses ont sont avec ces cet cette mais في من على الى عن ان ما هو هي او ثم كل هذا هذه الذي التي بين كان يكون ذلك قد لا مع هذان هما انه انها التي الذين'.split(' '));
function rnorm(s){
  return String(s||'').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/œ/g,'oe').replace(/æ/g,'ae').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^\u0621-\u064A0-9a-zA-Z\s]/g,' ').toLowerCase().replace(/\s+/g,' ').trim();
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
const RSYN=[['نزاع','خلاف','منازعه','خصومه','صراع'],['حل','تسويه','فض','انهاء','معالجه'],['ودي','سلمي','وديه','سلميه','تراضي'],['محايد','مستقل','نزيه'],['مقر','مركز','عاصمه'],['توحيد','توحد','تنسيق'],['استئناف','طعن','مستانفه'],['شكايه','شكوي','عريضه','دعوي'],['تبليغ','اعلام','اخطار'],['جريمه','جرائم','اجرام'],['عدل','انصاف','مساواه'],['حقوق','مصالح'],['بديل','عوض'],['محضر','عون'],['اول','ابتدائي'],['نهائي','باتا'],['هيئه','جهه','مؤسسه'],['الشخص','فرد','مواطن'],['تقويم','مراقبه','رقابه'],['شروط','متطلبات'],['تخفيف','يخفف','تخفف','تقليل'],['تسريع','يسرع','تسرع','سرعه'],['محافظه','يحافظ','حفاظ','حفظ','صون'],['وقايه','يحمي','حمايه','يمنع','منع'],['اعباء','ضغط','عبء'],['قضاء','محاكم','محكمه'],['تفاقم','تطور','تزايد'],['اجتماعيه','مجتمع','اجتماعي'],['علاقات','صله','روابط']].map(g=>g.map(w=>rstem(rnorm(w))));
function rlev(a,b){if(Math.abs(a.length-b.length)>2)return 9;const m=[];for(let i=0;i<=a.length;i++){m[i]=[i];}for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
function rsame(a,b){
  if(a===b)return true;
  if(RSYN.some(g=>g.some(x=>rsame0(x,a))&&g.some(x=>rsame0(x,b))))return true;   /* مرادفات: نفس المعنى بلفظ آخر */
  return rsame0(a,b);
}
function rsame0(a,b){
  if(a===b)return true;
  if(a.length<4||b.length<4)return false;
  let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;
  if(i>=4&&i>=Math.min(a.length,b.length)-1)return true;
  return a.length>=5&&b.length>=5&&rlev(a,b)<=(a.length>=8&&b.length>=8?2:1);   /* خطأ إملائي أو تعرّف صوتي غير دقيق */
}
/* يقبل المعنى الصحيح ولو بألفاظ مختلفة: كلمات الجواب كلها (لا المفتاحية فقط) + مرادفات + تقارب إملائي؛ ولا تُحسب كلمات العنوان نفسه */
function rcheck(item,text){
  const tt=rtok(item[0]),notT=w=>!tt.some(t=>rsame0(t,w));
  const got=rtok(text);if(!got.length)return false;
  const frac=ks=>ks.length?ks.filter(k=>got.some(g=>rsame(g,k))).length/ks.length:0;
  let keys=[...new Set(item[2]&&item[2].length?item[2].flatMap(rtok):rtok(item[1]))];
  const k2=keys.filter(notT);if(k2.length>=3)keys=k2;
  const hit=Math.round(frac(keys)*keys.length);
  if(keys.length&&frac(keys)>=RPASS&&hit>=Math.min(2,keys.length))return true;
  let ans=[...new Set(rtok(item[1]))].filter(notT);
  const ah=Math.round(frac(ans)*ans.length);
  return ans.length>=3&&frac(ans)>=.4&&ah>=3;
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
function recBtn(l){
  if(!getRec(l).length)return '';
  const o=store.get('recp',{})[l.id];
  return `<div class="acts"><div class="btn rec" id="rc">🎙️ اختبار التسميع</div></div>${o?`<p class="hint">تقدّم التسميع: ${o.last}% · أفضل نتيجة: ${o.pct}%</p>`:''}`;
}
let rTimer=null,rMic=null;
function rstopMic(){if(rMic){rMic._stop=true;if(rMic._flush)rMic._flush()}try{rMic&&rMic.stop()}catch(e){}rMic=null}
/* حفظ نتيجة عنوان واحد (نحتفظ بالأفضل) وإرسال التقدّم الإجمالي للأستاذ */
function rsave(s,l,items,title,score){
  const all=store.get('recpt',{}),P=all[l.id]||{},old=P[title];
  if(old!==undefined&&score<=old)return;
  P[title]=score;all[l.id]=P;store.set('recpt',all);
  const n=items.length,sc=items.map(it=>P[it[0]]||0),pct=Math.round(sc.reduce((a,b)=>a+b,0)/n),mem=sc.filter(x=>x>0).length;
  const p=store.get('recp',{}),o=p[l.id]||{};p[l.id]={pct:Math.max(pct,o.pct||0),last:pct,at:Date.now()};store.set('recp',p);
  const q=store.get('outbox',[]);
  q.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ts:Date.now(),student:name,subject:s.name,lessonId:l.id,lesson:l.title,right:mem,total:n,percent:pct,kind:'recite'});
  store.set('outbox',q);flush();addXp(Math.round((score-(old||0))/10));
}
/* قائمة كل العناوين (رئيسية وفرعية): يضغط التلميذ على عنوان فيبدأ التسميع مباشرة */
function recite(s,l){
  const items=getRec(l),n=items.length,lv=l.rlv||[];
  const FD=s.id==='fr'?' dir="ltr" lang="fr"':'';
  testActive=null;rstopMic();
  const list=()=>{
    testActive=null;
    const P=store.get('recpt',{})[l.id]||{},done=items.filter(it=>P[it[0]]>0).length;
    app.innerHTML=`<div class="rtop"><span>🎙️ التسميع</span><span>${done} / ${n}</span></div><div class="bar"><i style="width:${done/n*100}%"></i></div>
    <p class="hint">${done===n?'🏆 أحسنت! سمّعت كل العناوين — يمكنك إعادة أي عنوان':'اضغط على أي عنوان وابدأ التسميع من حفظك'}</p>
    <div class="rlist2"${FD}>${items.map((it,k)=>{const v=P[it[0]];return `<div class="rt lv${Math.min(3,lv[k]||0)}" data-k="${k}"><span>${v>=100?'✅':v>0?'🟡':v===0?'❌':'⚪'}</span><b>${esc(it[0])}</b></div>`}).join('')}</div>
    <div class="acts"><div class="btn alt rst" id="rst">🔄 ابدأ من الأول</div></div>`;
    app.querySelectorAll('.rt').forEach(e=>e.onclick=()=>one(+e.dataset.k));
    $('#rst').onclick=()=>{if(confirm('سيُمسح تقدّمك في هذا التسميع لتبدأ من العنوان الأول. هل تريد ذلك؟')){const a=store.get('recpt',{});delete a[l.id];store.set('recpt',a);list()}};
  };
  const one=k=>{
    const it=items[k];let att=0;
    testActive={type:'recite',s,l};
    const dots=()=>[0,1,2].map(j=>j<att?'🔴':j===att?'🟡':'⚪').join(' ')+` &nbsp; المحاولة ${Math.min(att+1,RMAX)} من ${RMAX}`;
    app.innerHTML=`<div class="rtop"><span>🎙️ التسميع</span><span>${k+1} / ${n}</span></div>
    <div class="qbox"${FD}>${it[3]?'':(FD?'Récite : ':'سمّع: ')}${esc(it[0])}</div>
    <p class="dots">${dots()}</p>
    <textarea id="ans" rows="5"${FD} placeholder="سمّع من حفظك… أو اكتب إجابتك بنفسك" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    <div class="acts"><div class="btn alt" id="mic">🎙️ ابدأ التسميع</div><div class="btn" id="chk">تحقّق ✔</div></div><div id="fb"></div>
    <div class="acts"><div class="btn alt rst" id="lst">📋 قائمة العناوين</div></div>`;
    const ta=$('#ans');
    $('#lst').onclick=()=>{rstopMic();list()};
    ['paste','drop','cut','copy','contextmenu'].forEach(ev=>ta.addEventListener(ev,e=>e.preventDefault()));
    initMic($('#mic'),ta,s.id==='fr'?'fr-FR':'ar-DZ');
    const end=pass=>{
      testActive=null;ta.disabled=true;$('#chk').hidden=true;$('#mic').hidden=true;const ms=document.querySelector('.mst');if(ms)ms.hidden=true;
      $('#fb').innerHTML=`<div class="fb ${pass?'g':'b'}">${pass?pick(PRAISE)+' ⭐ — أصبت المعنى':'انتهت المحاولات'}</div><p class="hint">الإجابة النموذجية:</p><div class="mdl"${FD}>${esc(it[1])}</div>
      <div class="acts"><div class="btn alt" id="rt">🔁 أعد هذا العنوان</div>${k+1<n?'<div class="btn" id="nx2">العنوان التالي ◀</div>':''}</div>`;
      $('#rt').onclick=()=>one(k);
      if($('#nx2'))$('#nx2').onclick=()=>one(k+1);
      scrollTo(0,document.body.scrollHeight);
    };
    $('#chk').onclick=()=>{
      const was=!!rMic;rstopMic();
      const run=()=>{
      const text=ta.value.trim();
      if(text.length<2){$('#fb').innerHTML='<div class="fb b">اكتب أو سمّع إجابتك أولًا</div>';return}
      if(rcheck(it,text)){rsave(s,l,items,it[0],RPTS[att]);SFX.ok(att===0?3:1);end(true)}
      else{
        att++;SFX.no();
        if(att>=RMAX){rsave(s,l,items,it[0],0);end(false)}
        else{ta.value='';$('#fb').innerHTML=`<div class="fb b">ليست الإجابة المطلوبة بعد — حاول مجددًا (بقيت ${RMAX-att} ${RMAX-att===1?'محاولة':'محاولات'})</div>`;document.querySelector('.dots').innerHTML=dots()}
      }
      };
      was?setTimeout(run,450):run();   /* ننتظر وصول آخر كلمات التسميع قبل التصحيح */
    };
  };
  list();
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
  let on=false,base='',quick=0,lastStart=0,tgt=[],shw=[],tm=null;
  /* شريط يعرض آخر ما قاله التلميذ ليعرف أين توقف ويكمل من هناك */
  const st=document.createElement('div');st.className='mst';ta.insertAdjacentElement('afterend',st);
  const tail=()=>ta.value.trim().split(/\s+/).filter(Boolean).slice(-6).join(' ');
  const show=()=>{const t=tail();st.innerHTML=on?('🔴 يستمع… '+(t?'آخر ما سمعته: «'+esc(t)+'»':'ابدأ التسميع')):(t?'⏸ توقفت عند: «'+esc(t)+'» — اضغط 🎙️ وأكمل من هنا':'')};
  const off=()=>{if(rMic&&rMic._flush)rMic._flush();on=false;if(btn.isConnected)btn.textContent='🎙️ ابدأ التسميع';btn.classList.remove('live');show()};
  const start=()=>{
    const r=new SR();rMic=r;r.lang=lang||'ar-DZ';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
    base=ta.value.trim()?ta.value.trim()+' ':'';
    /* إملاء مباشر: كل كلمة تُكتب أمام التلميذ فور نطقها (حتى قبل أن يؤكدها المتصفح) */
    tgt=[];shw=[];if(tm){clearInterval(tm);tm=null}
    const paint=()=>{ta.value=base+shw.join(' ');ta.scrollTop=ta.scrollHeight;show()};
    const pump=()=>{const back=tgt.length-shw.length;if(back<=0){clearInterval(tm);tm=null;return}for(let j=0;j<(back>8?3:1);j++)if(shw.length<tgt.length)shw.push(tgt[shw.length]);paint()};
    r._flush=()=>{shw=tgt.slice();if(tm){clearInterval(tm);tm=null}paint()};
    r.onresult=e=>{
      let acc='';for(let i=0;i<e.results.length;i++)acc=rmerge(acc,e.results[i][0].transcript);
      tgt=acc.split(/\s+/).filter(Boolean);
      let k=0;while(k<shw.length&&k<tgt.length&&shw[k]===tgt[k])k++;   /* إن غيّر المتصفح كلمات مؤقتة نصحّح من أول اختلاف */
      if(k<shw.length){shw=shw.slice(0,k);paint()}
      if(r._stop){r._flush();return}   /* كلمات متأخرة بعد الإيقاف تُكتب فورًا */
      if(!tm)tm=setInterval(pump,60);
    };
    r.onerror=e=>{if(e&&(e.error==='not-allowed'||e.error==='service-not-allowed'))r._stop=true};
    /* يتوقف المتصفح من تلقاء نفسه عند الصمت: نعيد التشغيل ونكمل على النص الموجود دون أن يفقد التلميذ مكانه */
    r.onend=()=>{
      if(r._flush)r._flush();
      if(!r._stop&&on&&btn.isConnected){
        const now=Date.now();quick=(now-lastStart<1500)?quick+1:0;lastStart=now;
        if(quick<3){setTimeout(()=>{if(on&&!r._stop){try{start()}catch(e){off()}}},250);return}
      }
      off();
    };
    try{r.start();lastStart=Date.now();on=true;btn.textContent='⏹ توقّف';btn.classList.add('live');show()}catch(e){off()}
  };
  btn.onclick=()=>{if(on){rstopMic();return}quick=0;start()};
}
