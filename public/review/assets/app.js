/* On-device image review for Kuladeep Mantri. No answer-upload endpoint. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), P = window.ReviewProtocol;
  const bundle = window.REVIEW_DATA, build = window.REVIEW_BUILD;
  const data = bundle.sets[new URLSearchParams(location.search).get('demo') === '1' ? 'demo' : bundle.primary];
  const storageKey = `kmr-v3-${data.id}-${build}`;
  document.body.dataset.mode = data.mode;
  if (data.mode !== 'study') { $('mode-note').hidden = false; $('mode-note').textContent = data.mode === 'demo' ? 'Demo: 6 practice pairs. These answers are not part of the study.' : 'Local review for Kuladeep Mantri: 200 pairs.'; }
  const labels = [
    ['Something important changed', 'The story or a key fact is different.', 'The person was walking beside the horse. In the result, the person is riding it.'],
    ['Only the look changed', 'The same thing is shown, with a different style, colors, or small details. If there is no visible difference, choose Only the look changed.', 'It is still a bird on a branch. The colors and the way it is drawn changed.'],
    ['A different picture', 'The main subject or scene was replaced.', 'People looking out through glass became people in a boat among buildings.'],
    ["Can't tell", 'The change is unclear, or a picture is broken or too hard to see.', '']
  ];
  let state=null,sequence=[],loaded=[false,false],successful=[false,false],imageOwner=-1,lockedUntil=0,epoch=0,anotherTab=false,leaving=false;
  let clock=null;
  function token(bytes) { return Array.from(crypto.getRandomValues(new Uint8Array(bytes)),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase(); }
  function storageError(message) { $('storage-error').textContent=message; $('storage-error').hidden=false; }
  function now() { try { if(typeof document.hidden!=='boolean')return null;const value=window.performance?.now(); return Number.isFinite(value)?value:null; } catch { return null; } }
  function flush(interrupted=false) {
    if (!clock || !state) return;
    const row=state.items[clock.cursor], value=now(), ms=clock.phase+'_ms', flag=clock.phase+'_timing';
    if (value!==null && value>=clock.at) row[ms]=(row[ms]??0)+(value-clock.at);
    else row[flag]=(row[flag]??0)|4;
    if (interrupted) row[flag]=(row[flag]??0)|2;
    clock=null;
  }
  function persist(next) {
    try { localStorage.setItem(storageKey,JSON.stringify(next));state=next;$('storage-error').hidden=true;return true; }
    catch { storageError('This browser could not save your answers. Free some browser storage, then try the same answer again. Keep this page open.');return false; }
  }
  function startClock() {
    if (!state || clock || anotherTab || leaving || document.hidden || state.cursor>=data.total || imageOwner!==state.cursor || !successful.every(Boolean)) return;
    const row=state.items[state.cursor],phase=state.phase,flag=phase+'_timing',ms=phase+'_ms',value=now();
    if(value===null){row[flag]=(row[flag]??0)|4;persist(state);return;}
    if(row[ms]===null)row[ms]=0;
    row[flag]=(row[flag]??0)|1;
    clock={cursor:state.cursor,phase,at:value};persist(state);
  }
  function update(change) {
    if(anotherTab)return false;flush();const cursor=state.cursor,phase=state.phase,next=structuredClone(state);change(next);
    const ok=persist(next);if(ok&&cursor===state.cursor&&phase===state.phase)startClock();return ok;
  }
  function snapshot(reason) {
    const dimension=value=>Number.isFinite(value)&&value>=0?Math.round(value):null;
    const ua=navigator.userAgent||'';
    const device=/iPhone|Android.*Mobile/i.test(ua)?1:/iPad|Tablet|Android/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?2:/Macintosh|Windows|Linux|CrOS/i.test(ua)?3:0;
    return {reason,at:Math.floor(Date.now()/1000),presentation:state?state.cursor+1:1,phase:state?(state.cursor===data.total?3:state.phase==='main'?1:2):1,device,
      viewport_width:dimension(innerWidth),viewport_height:dimension(innerHeight),screen_width:dimension(window.screen?.width),screen_height:dimension(window.screen?.height)};
  }
  function row() { return {answer:0,natural:0,last_answer:0,last_natural:0,visited:false,main_skipped:false,natural_skipped:false,
    main_ms:null,natural_ms:null,main_timing:0,natural_timing:0,changes:0,natural_changes:0,zoom:0,pinch:null,
    images:[0,1].map(()=>({status:0,failures:0,retries:0,recovered:false}))}; }
  function examples(container) {
    labels.forEach(([title, explanation, detail], i) => {
      const article = document.createElement('article'); article.className = 'example';
      const h3 = document.createElement('h3'); h3.textContent = title;
      const p = document.createElement('p'); p.textContent = explanation; article.append(h3,p);
      if (bundle.examples[i]) {
        const pair = document.createElement('div'); pair.className = 'example-pair';
        bundle.examples[i].forEach((file, side) => {
          const figure = document.createElement('figure'), heading = document.createElement('figcaption'); heading.textContent = side ? 'Result' : 'Original';
          const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Enlarge ${side ? 'result' : 'original'} example: ${title}`);
          const img = document.createElement('img'); img.src = `images/${file}`; img.width = 512; img.height = 512; img.alt = `${heading.textContent} example: ${title}`;
          button.addEventListener('click', () => zoom(img.src, heading.textContent, false));
          button.append(img); figure.append(heading,button); pair.append(figure);
        });
        const note = document.createElement('p'); note.textContent = detail; article.append(pair,note);
      }
      container.append(article);
    });
  }
  function recordZoom() { if (state && state.cursor < data.total) update(next => next.items[next.cursor].zoom++); }
  function zoom(src, title, record = true) {
    if (record) recordZoom();
    $('zoom-title').textContent = title; $('zoom-image').src = src; $('zoom-image').alt = `${title}, enlarged`;
    $('zoom-dialog').showModal(); $('zoom-dialog').querySelector('.zoom-scroll').scrollTo(0,0);
  }
  function theme() {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    $('theme').textContent = dark ? 'Light mode' : 'Dark mode';
  }
  try { const saved = localStorage.getItem('kmr-theme'); if (['dark','light'].includes(saved)) document.documentElement.dataset.theme = saved; } catch {}
  theme();
  $('theme').addEventListener('click', () => { document.documentElement.dataset.theme = $('theme').textContent === 'Dark mode' ? 'dark' : 'light'; try { localStorage.setItem('kmr-theme',document.documentElement.dataset.theme); } catch {} theme(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',theme);
  examples($('welcome-examples')); examples($('help-examples'));
  ['understand','adult-agree'].forEach(id => $(id).addEventListener('change', () => { $('start').disabled = !$('understand').checked || !$('adult-agree').checked; }));
  $('start-form').addEventListener('submit', event => {
    event.preventDefault(); if (!$('understand').checked || !$('adult-agree').checked || state) return;
    const typed = $('nickname').value.trim(); let name = P.nickname(typed);
    if (typed && !name) { $('start-error').textContent = 'Use letters or digits for your nickname, or leave it blank.'; $('nickname').focus(); return; }
    if (!name) name = 'R' + token(4);
    const next={version:3,set:data.id,mode:data.mode,build,name,session:token(4),started:Math.floor(Date.now()/1000),finished:0,cursor:0,phase:'main',
      background:Number($('background').value),contact:0,snapshots:[snapshot(0)],items:Array.from({length:data.total},row)};
    if(persist(next)){sequence=P.order(name,data.id,data.mode);render();window.scrollTo(0,0);}
  });
  let codeSizeSignature='';
  function sizeCode(force=false) {
    const box=$('answer-code');if(box.hidden||$('finish').hidden)return;
    const css=getComputedStyle(box),signature=[box.clientWidth,css.fontSize,css.lineHeight,box.value].join(':');
    if(!force&&signature===codeSizeSignature)return;
    codeSizeSignature=signature;box.style.height='auto';box.style.height=(box.scrollHeight+4)+'px';
  }
  new MutationObserver(()=>sizeCode()).observe($('answer-code'),{attributes:true,attributeFilter:['style']});
  window.addEventListener('resize',()=>sizeCode());
  function exportCode() {
    const complete=P.complete(state);
    $('share').hidden=$('copy').hidden=$('answer-code').hidden=!complete;
    $('review-skipped').hidden=complete;
    if(!complete){$('parts-note').textContent='Some required picture questions were skipped. Review skipped questions before sending your answers.';return;}
    const codes=P.encode(state,build),count=codes.length;
    $('answer-code').value=codes.join('\n');
    $('parts-note').textContent=`Your answers have ${count} numbered ${count===1?'part':'parts'}. Send all ${count} ${count===1?'part':'parts'} together in one message to Kuladeep Mantri.`;
    $('share').textContent=`Send all ${count} ${count===1?'part':'parts'} together`;
    $('copy').textContent=`Copy all ${count} ${count===1?'part':'parts'}`;
    sizeCode(true);
  }
  function render() {
    flush();clock=null;
    $('welcome').hidden = true;
    const done = state.cursor === data.total;
    $('review').hidden = done; $('finish').hidden = !done;
    document.title = done ? 'Answers saved | Kuladeep Mantri' : 'Image review | Kuladeep Mantri';
    if (done) { $('finish-summary').textContent = `Your ${data.total} answers are saved on this device.`; $('contact').value = String(state.contact); exportCode(); $('share-status').textContent = ''; return; }
    const current = ++epoch, item = sequence[state.cursor], row = state.items[state.cursor];
    $('position').textContent = `${state.cursor+1} of ${data.total}`;
    $('progress').max=data.total;$('progress').value=state.items.filter(r=>r.visited).length;
    $('back').disabled = (state.cursor === 0 && state.phase === 'main') || anotherTab;
    $('main-answer').hidden = state.phase !== 'main'; $('natural-answer').hidden = state.phase !== 'natural';
    $('saved').textContent = state.items.some(r => r.answer) ? 'Saved on this device' : 'Your answers save on this device.';
    loaded=[false,false];successful=[false,false];imageOwner=state.cursor;
    document.querySelectorAll('[data-answer], [data-natural]').forEach(button=>{button.disabled=true;button.setAttribute('aria-pressed',String(button.dataset.answer?Number(button.dataset.answer)===row.answer:Number(button.dataset.natural)===row.natural));});
    function ready() {
      if(current!==epoch)return;
      const broken=loaded.some((value,i)=>value&&!successful[i]);
      $('retry-images').hidden=!broken;
      if(broken)$('saved').textContent="A picture didn't load. Retry, choose Can't tell, or skip for now.";
      if(loaded.every(Boolean))document.querySelectorAll('[data-answer], [data-natural]').forEach(button=>{button.disabled=anotherTab||(broken&&button.dataset.answer&&button.dataset.answer!=='4');});
      if(successful.every(Boolean))startClock();
    }
    function load(side,retry=false) {
      const id=side===0?'original':'result',img=$(id),src=`images/${data.pairs[item.index][side]}`;
      loaded[side]=successful[side]=false;flush();
      if(retry)update(next=>{next.items[next.cursor].images[side].retries++;next.items[next.cursor].images[side].status=1;});
      img.onload=()=>{if(current!==epoch)return;loaded[side]=successful[side]=true;
        update(next=>{const image=next.items[next.cursor].images[side];image.status=2;if(image.failures>0)image.recovered=true;});ready();};
      img.onerror=()=>{if(current!==epoch)return;loaded[side]=true;successful[side]=false;
        update(next=>{const r=next.items[next.cursor];r.images[side].status=3;r.images[side].failures++;r[next.phase+'_timing']=(r[next.phase+'_timing']??0)|8;});ready();};
      if(!retry&&img.dataset.file===src&&img.complete){loaded[side]=true;successful[side]=img.naturalWidth>0;
        update(next=>{next.items[next.cursor].images[side].status=successful[side]?2:3;});ready();}
      else {update(next=>{next.items[next.cursor].images[side].status=1;});img.dataset.file=src;img.src=src+(retry?'?retry='+state.items[state.cursor].images[side].retries:'');}
    }
    $('retry-images').onclick=()=>{for(let side=0;side<2;side++)if(!successful[side])load(side,true);};
    load(0);load(1);
    sequence.slice(state.cursor+1,state.cursor+3).forEach(next => data.pairs[next.index].forEach(file => { const img = new Image(); img.src = `images/${file}`; }));
  }
  function advance(next) {
    if(next.recovering){
      const at=next.items.findIndex((r,i)=>P.required(sequence[i],data.mode)&&!r.answer);
      next.cursor=at<0?data.total:at;
      if(at<0)next.recovering=false;
    }else next.cursor++;
    next.phase='main';
    if(next.cursor===data.total)next.finished=Math.max(next.started,Math.floor(Date.now()/1000));
  }
  function transition(change) {
    if (anotherTab || !loaded.every(Boolean) || Date.now() < lockedUntil) return;
    if (!update(change)) return;
    lockedUntil=Date.now()+180;render();
    if (state.cursor === data.total) { window.scrollTo(0,0); $('finish-title').setAttribute('tabindex','-1'); $('finish-title').focus(); }
  }
  document.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
    transition(next => {
      const row = next.items[next.cursor], answer = Number(button.dataset.answer);
      if(row.last_answer&&row.last_answer!==answer)row.changes++;
      row.answer=row.last_answer=answer;row.main_skipped=false;row.visited=true;
      if(sequence[next.cursor].repeat||next.recovering)advance(next);else next.phase='natural';
    });
  }));
  document.querySelectorAll('[data-natural]').forEach(button=>button.addEventListener('click',()=>{transition(next=>{const r=next.items[next.cursor],answer=Number(button.dataset.natural);if(r.last_natural&&r.last_natural!==answer)r.natural_changes++;r.natural=r.last_natural=answer;r.natural_skipped=false;advance(next);});}));
  $('skip-natural').addEventListener('click',()=>transition(next=>{const r=next.items[next.cursor];r.natural=0;r.natural_skipped=true;advance(next);}));
  $('skip-main').addEventListener('click',()=>transition(next=>{const r=next.items[next.cursor];r.answer=0;r.main_skipped=true;r.visited=true;advance(next);}));
  $('review-skipped').addEventListener('click',()=>{const at=state.items.findIndex((r,i)=>P.required(sequence[i],data.mode)&&!r.answer);if(at<0)return;if(update(next=>{next.cursor=at;next.phase='main';next.finished=0;next.recovering=true;})){render();window.scrollTo(0,0);}});
  function back() {
    if (!state || anotherTab || (!state.cursor && state.phase === 'main')) return;
    flush(true);
    if(state.recovering){if(update(next=>{next.cursor=data.total;next.phase='main';next.recovering=false;next.finished=Math.max(next.started,Math.floor(Date.now()/1000));}))render();return;}
    if (update(next => { if (next.phase === 'natural') next.phase = 'main'; else { next.cursor--; next.phase = 'main'; } next.finished = 0; })) {render();window.scrollTo(0,0);}
  }
  $('back').addEventListener('click',back); $('review-last').addEventListener('click',back);
  $('change-main').addEventListener('click',back);
  $('contact').addEventListener('change', () => { if (update(next => { next.contact = Number($('contact').value); })) exportCode(); });
  $('original-open').addEventListener('click', () => zoom($('original').src,'Original'));
  $('result-open').addEventListener('click', () => zoom($('result').src,'Result'));
  $('help').addEventListener('click', () => $('help-dialog').showModal());
  $('close-help').addEventListener('click', () => $('help-dialog').close()); $('close-zoom').addEventListener('click', () => $('zoom-dialog').close());
  $('answer-code').addEventListener('click', () => $('answer-code').select());
  $('share').addEventListener('click', async () => {
    if (!navigator.share) { $('share-status').textContent = 'Sharing is not available here. Copy every numbered code below and send them together.'; return; }
    try { await navigator.share({text:$('answer-code').value}); $('share-status').textContent = 'Share sheet opened. Your codes stay saved here if you need them again.'; }
    catch (error) { $('share-status').textContent = error.name === 'AbortError' ? 'Sharing canceled. Your answers are still saved.' : 'Sharing did not finish. Copy every numbered code below and send them together.'; }
  });
  $('copy').addEventListener('click', async () => {
    try { if (!navigator.clipboard) throw new Error('Unavailable'); await navigator.clipboard.writeText($('answer-code').value); $('share-status').textContent = 'Copied. Paste all the numbered codes into your message to Kuladeep Mantri.'; }
    catch { $('answer-code').focus(); $('answer-code').select(); $('answer-code').setSelectionRange(0,$('answer-code').value.length); $('share-status').textContent = 'The codes are selected. Press and hold them, then choose Copy.'; }
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey || !state) return;
    // A closing document can deliver a late timing-only save after a reload.
    // Ignore stale events and merge counters when the answers still agree.
    if (event.newValue !== localStorage.getItem(storageKey)) return;
    try {
      const incoming = JSON.parse(event.newValue);
      const answers = s => JSON.stringify([s.session,s.cursor,s.phase,s.finished,s.contact,s.items.map(r=>[r.answer,r.natural,r.changes,r.natural_changes,r.main_skipped,r.natural_skipped])]);
      if (answers(incoming) === answers(state)) {
        state.items.forEach((row,i) => ['main_ms','natural_ms','zoom'].forEach(k=>{const n=incoming.items[i][k];if(n!==null)row[k]=row[k]===null?n:Math.max(row[k],n);}));
        return;
      }
    } catch {}
    anotherTab = true; storageError('Your progress changed in another tab. Reload this page to continue with the latest saved answers.');
    document.querySelectorAll('[data-answer], [data-natural], #back, #review-last, #change-main, #contact').forEach(button => { button.disabled = true; });
  });
  document.addEventListener('visibilitychange',()=>{
    if(!state||anotherTab||state.cursor===data.total)return;
    if(document.hidden){flush(true);persist(state);}else{leaving=false;update(next=>next.snapshots.push(snapshot(2)));startClock();}
  });
  window.addEventListener('pagehide',()=>{leaving=true;if(state&&!anotherTab){flush(true);persist(state);}});
  window.addEventListener('pageshow',event=>{if(event.persisted&&state&&state.cursor<data.total){leaving=false;update(next=>next.snapshots.push(snapshot(3)));startClock();}});
  try {
    const raw=localStorage.getItem(storageKey);
    if(raw){
      const saved=JSON.parse(raw);
      if(saved.version!==3||saved.set!==data.id||saved.mode!==data.mode||saved.build!==build||!/^[A-Z0-9]{1,20}$/.test(saved.name)||!/^[A-F0-9]{8}$/.test(saved.session)||
        !Array.isArray(saved.items)||saved.items.length!==data.total||!Number.isInteger(saved.cursor)||saved.cursor<0||saved.cursor>data.total||!['main','natural'].includes(saved.phase)||
        !saved.items.every(r=>[0,1,2,3,4].includes(r.answer)&&[0,1,2].includes(r.natural)))throw new Error('Invalid saved progress');
      state=saved;sequence=P.order(state.name,data.id,data.mode);if(state.cursor<data.total){state.snapshots.push(snapshot(1));persist(state);}render();
    }
  }catch{storageError('Saved progress could not be opened. Keep this browser open and ask Kuladeep Mantri for help before starting again.');$('start').hidden=true;}
  async function offline() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) { $('offline').textContent = 'Offline saving needs HTTPS or localhost. Keep this page connected while reviewing.'; return; }
    navigator.serviceWorker.addEventListener('message', event => { if (event.data?.type === 'cache-progress' && event.data.mode === data.mode) $('offline').textContent = `Saving pictures for offline use... ${event.data.done} of ${event.data.total}`; });
    try {
      const script = `./sw.js?mode=${data.mode}`;
      const registration = await navigator.serviceWorker.register(script);
      const worker = registration.installing || registration.waiting || registration.active;
      if (!worker) throw new Error('No worker');
      if (worker.state !== 'activated') await new Promise((resolve,reject) => {
        const check = () => { if (worker.state === 'activated') resolve(); if (worker.state === 'redundant') reject(new Error('Offline install failed')); };
        worker.addEventListener('statechange',check); check();
      });
      $('offline').textContent = 'Ready for offline use. You can take a break and come back.';
      if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
    } catch { $('offline').textContent = 'Offline saving did not finish. Stay connected, or reload to try again. Your answers still save here.'; }
  }
  offline();
})();
