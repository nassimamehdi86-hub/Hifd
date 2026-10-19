/* المراجعة اليومية (ربع ساعة لكل مادة): اختبار شامل لكل أسئلة المادة (من كل الدروس الموجودة حاليًا).
   يُبنى تلقائيًا من data.js، فكل درس أو سؤال يُضاف لاحقًا يدخل في المراجعة ويزيد عدد الأسئلة دون أي تعديل هنا.
   كل سؤال بخيارين فقط: الجواب الصحيح + أقرب خيار خاطئ إليه (يُختار تلقائيًا بالتشابه النصي).
   لا تُحفظ نتائجها عند الأستاذ ولا تغيّر نجوم الدروس: هي مراجعة ذاتية فقط. */
const REV_MIN=15,REV_SEC_PER_Q=12,REV_CAP=Math.floor(REV_MIN*60/REV_SEC_PER_Q);   /* 15 د ÷ 12 ث ≈ 75 سؤالًا كحدّ أقصى */
const revN=s=>Math.min(revCount(s),REV_CAP);
const revNorm=s=>String(s).toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim();
const revGrams=s=>{const t=revNorm(s),g=new Map();for(let i=0;i<t.length-1;i++){const b=t.slice(i,i+2);g.set(b,(g.get(b)||0)+1)}return g};
function revSim(a,b){
  const A=revGrams(a),B=revGrams(b);let inter=0,na=0,nb=0;
  A.forEach(v=>na+=v);B.forEach(v=>nb+=v);
  A.forEach((v,k)=>{if(B.has(k))inter+=Math.min(v,B.get(k))});
  const dice=(na+nb)?2*inter/(na+nb):0,la=revNorm(a).length,lb=revNorm(b).length;
  return dice+0.15*(Math.min(la,lb)/Math.max(la,lb||1));   /* يفضَّل الخيار المشابه في الصياغة والطول */
}
function revPool(s){
  const out=[];
  s.sections.forEach(sec=>sec.lessons.forEach(l=>{
    const part=[];
    (l.qs||[]).forEach((it,k)=>{
      const right=it[1],wrongs=it.slice(2).filter(w=>w&&w!==right);
      if(!wrongs.length)return;
      const near=wrongs.map(w=>[revSim(right,w),w]).sort((x,y)=>y[0]-x[0])[0][1];
      part.push({q:it[0],a:right,w:near,tr:l.tr&&l.tr[k],lt:l.title,lid:l.id,key:l.id+'#'+k});
    });
    /* سؤال شقيق: أقرب سؤال آخر في الدرس جوابه مختلف (يُستعمل في صيغة «أي سؤال يناسب هذه الإجابة؟») */
    part.forEach(x=>{
      const c=part.filter(y=>y!==x&&revNorm(y.a)!==revNorm(x.a)&&revNorm(y.q)!==revNorm(x.q)).map(y=>[revSim(x.q,y.q),y.q]).sort((p,q)=>q[0]-p[0])[0];
      x.sib=c?c[1]:null;
    });
    out.push(...part);
  }));
  return out;
}
/* اختيار أسئلة الجلسة: توزيع عادل على كل الدروس (دورة بين الدروس)، وفي كل درس تُقدَّم الأسئلة التي لم تُراجَع أو راجعها التلميذ منذ أطول مدة.
   إن زاد عدد الدروس تقلّ حصة كل درس تلقائيًا ليبقى مجموع الأسئلة في حدود ربع ساعة. */
const revSeenT=v=>typeof v==='number'?v:(v&&v.t)||0,revSeenN=v=>typeof v==='number'?1:(v&&v.n)||0;
function revPick(pool){
  const seen=store.get('revSeen',{});
  let sel=pool;
  if(pool.length>REV_CAP){
    const g={};
    pool.forEach(x=>(g[x.lid]??=[]).push(x));
    const L=Object.values(g).map(a=>a.map(x=>[revSeenT(seen[x.key]),Math.random(),x]).sort((p,q)=>p[0]-q[0]||p[1]-q[1]).map(p=>p[2]));
    sel=[];
    for(let r=0;sel.length<REV_CAP;r++){let any=false;for(const a of L){if(a[r]&&sel.length<REV_CAP){sel.push(a[r]);any=true}}if(!any)break}
  }
  /* الصيغة تتغيّر كل مرة يعود فيها السؤال: 0 = السؤال الأصلي، 1 = «هل الإجابة صحيحة؟»، 2 = «أي سؤال يناسب هذه الإجابة؟» */
  return sel.map(x=>{const n=revSeenN(seen[x.key]);let f=n%3;if(f===2&&!x.sib)f=1;return {...x,form:f,cand:Math.random()<.5}});
}
const revCount=s=>s.sections.reduce((n,sec)=>n+sec.lessons.reduce((m,l)=>m+(l.qs||[]).length,0),0);
let revTimer=null;
function review(s,subset){
  clearInterval(revTimer);
  const pool=subset||revPick(revPool(s)),FD=s.id==='fr'?' dir="ltr" lang="fr"':'',timed=!subset;
  let idx=shuffle(pool.map((_,i)=>i)),i=0,right=0,wrong=[],combo=0,gain=0,end=Date.now()+REV_MIN*60000,over=false;
  const tickUI=()=>{const e=document.getElementById('rvt');if(!e){clearInterval(revTimer);return}const l=end-Date.now();e.textContent='⏱ '+chFmt(l);e.classList.toggle('low',l<60000);if(l<=0){clearInterval(revTimer);done(true)}};
  const draw=()=>{
    if(over)return;
    if(i>=idx.length)return done(false);
    const it=pool[idx[i]],fr=s.id==='fr',f=it.form||0;
    let qhtml,opts,cor,ONE=false;
    if(f===1){
      const cand=it.cand?it.a:it.w;
      qhtml=fr?`${esc(it.q)}<div class="qtr" dir="ltr" style="font-weight:800;opacity:1">Réponse proposée : ${esc(cand)}</div>`:`${esc(it.q)}<div class="qtr" dir="auto" style="font-weight:800;opacity:1">الإجابة المقترحة: ${esc(cand)}</div>`;
      opts=fr?['✔ Vrai','✘ Faux']:['✔ صحيحة','✘ خاطئة'];cor=it.cand?opts[0]:opts[1];ONE=true;
    }else if(f===2){
      qhtml=fr?`Réponse : <b>${esc(it.a)}</b><div class="qtr" dir="ltr">Quelle question correspond à cette réponse ?</div>`:`الإجابة: <b>${esc(it.a)}</b><div class="qtr" dir="rtl">أي سؤال يناسب هذه الإجابة؟</div>`;
      opts=shuffle([it.q,it.sib]);cor=it.q;
    }else{
      qhtml=`${esc(it.q)}${it.tr?`<div class="qtr" dir="rtl">${esc(it.tr)}</div>`:''}`;
      opts=shuffle([it.a,it.w]);cor=it.a;
    }
    app.innerHTML=`${timed?`<div class="chtime" id="rvt" style="font-size:30px;margin:0 0 6px">⏱ ${chFmt(end-Date.now())}</div>`:''}<div class="bar"><i style="width:${i/idx.length*100}%"></i></div><p class="cnt">${i+1} / ${idx.length}${combo>1?` <span class="combo">🔥 ×${combo}</span>`:''}</p><p class="hint" dir="auto" style="margin:0 0 6px">📚 ${esc(it.lt)}</p><div class="qbox"${FD}>${qhtml}</div>`+
      opts.map((o,k)=>`<button class="opt"${FD}><span class="ltr">${(FD?'AB':'أب')[k]}</span>${esc(o)}</button>`).join('')+'<div id="nx"></div>';
    app.querySelectorAll('.opt').forEach((b,k)=>b.onclick=()=>{
      const good=opts[k]===cor,bs=app.querySelectorAll('.opt');
      bs.forEach((x,j)=>{x.disabled=true;if(opts[j]===cor)x.classList.add('ok')});
      bs[k].classList.add(good?'pop':'no');
      if(good){right++;combo++;gain+=5;SFX.ok(combo)}else{wrong.push(idx[i]);combo=0;SFX.no()}
      if(timed){const sn=store.get('revSeen',{});sn[it.key]={t:Date.now(),n:revSeenN(sn[it.key])+1};store.set('revSeen',sn)}
      $('#nx').innerHTML=`<div class="fb ${good?'g':'b'}">${good?pick(PRAISE):pick(OOPS)}</div><div class="btn" id="n">${i+1>=idx.length?'النتيجة':'التالي'}</div>`;
      $('#n').onclick=()=>{i++;draw()};
      scrollTo(0,document.body.scrollHeight);
    });
  };
  const done=(timeUp)=>{
    if(over)return;over=true;clearInterval(revTimer);
    const total=right+wrong.length,pct=total?Math.round(right/total*100):0;
    addXp(gain);
    app.innerHTML=`<div class="res"><div class="big">${timeUp?'⏰':pct>=70?'🏆':'💪'}</div><h2>${pct}%</h2><p>${timeUp?'انتهى الوقت · ':''}${right} صحيحة من ${total} سؤالًا أُجيب عنه · ‎+${gain} نقطة</p><p class="msg">${pct>=90?'ذاكرتك قوية، استمر على المراجعة اليومية!':pct>=70?'جيد جدًا، راجع الأخطاء لتثبيتها.':'لا بأس، المراجعة اليومية هي التي تثبّت الحفظ — أعد الأخطاء الآن.'}</p><div class="acts">${wrong.length?'<div class="btn alt" id="re">أعد الأخطاء</div>':''}<div class="btn" id="again">مراجعة جديدة 🔄</div></div><div class="acts"><div class="btn alt" id="bk">رجوع للمادة</div></div></div>`;
    if(pct>=70){confetti();SFX.win()}else SFX.lose();
    $('#again').onclick=()=>review(s);
    if(wrong.length)$('#re').onclick=()=>review(s,wrong.map(k=>pool[k]));
    $('#bk').onclick=()=>{hist=hist.slice(0,2);show()};
  };
  if(timed)revTimer=setInterval(tickUI,500);
  draw();
}
