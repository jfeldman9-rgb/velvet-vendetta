(() => {
  'use strict';
  const $=id=>document.getElementById(id), all=q=>Array.from(document.querySelectorAll(q));
  const icon=id=>'<svg aria-hidden="true"><use href="#i-'+id+'"/></svg>';
  const title=id=>id==='cory'?'Cory':'Bob';
  const fighters={cory:{style:'Orchid Rush',desc:'Fast jabs build meter for a long-range burst of orchid petals.',line:'Easy, handsome. That little black suit is doing things for me.',finale:'Aubergine Ovation'},
    bob:{style:'Null Protocol',desc:'Control the gap with a heavy kick, then close it with a quick digital pulse.',line:'The name is Bob. Big Dick Bob. I brought the eggplant.',finale:'Protocol Violet'}};
  const venues={opera:'The Opera House',glasshouse:'The Glasshouse'};
  const renderer=new ArenaRenderer($('canvas')), dialog=$('dialog');
  const musicExtension='wav'; // The full-resolution offline edition selects PCM WAV here.
  const silent='data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==';
  class Sound {
    constructor(){
      this.enabled=true;try{this.enabled=localStorage.getItem('velvet-audio')!=='off';}catch(_){}
      this.unlocked=false;this.track='menu';this.music=new Audio();this.music.loop=true;this.music.volume=.26;
      this.voice=new Audio();this.voice.volume=.94;this.banter=new Audio();this.banter.volume=.9;
      this.fxPool=Array.from({length:8},()=>new Audio());this.index=0;this.quiet=false;this.lineTimer=0;
    }
    play(a){const p=a.play();if(p)p.catch(()=>{});}
    unlock(){
      if(this.unlocked||!this.enabled)return;
      this.unlocked=true;
      for(const a of [this.voice,this.banter,...this.fxPool]){a.src=silent;this.play(a);}
      this.music.src='assets/audio/'+this.track+'.'+musicExtension;this.play(this.music);
    }
    change(to){if(to===this.track)return;this.track=to;if(this.unlocked){this.music.src='assets/audio/'+to+'.'+musicExtension;if(this.enabled&&!document.hidden)this.play(this.music);}}
    sfx(id,gain=.66){if(!this.enabled||!this.unlocked)return;const a=this.fxPool[this.index++%this.fxPool.length];a.volume=gain;a.src='assets/audio/'+id+'.mp3';this.play(a);}
    say(id){if(!this.enabled||!this.unlocked)return;this.voice.src='assets/audio/'+id+'.mp3';this.play(this.voice);}
    banter(id){if(!this.enabled||!this.unlocked)return;this.banter.src='assets/audio/'+id+'.mp3';this.play(this.banter);}
    sayLater(id,ms){clearTimeout(this.lineTimer);this.lineTimer=setTimeout(()=>this.banter(id),ms);}
    toggle(){this.enabled=!this.enabled;try{localStorage.setItem('velvet-audio',this.enabled?'on':'off');}catch(_){}
      if(this.enabled){if(!this.unlocked)this.unlock();else this.play(this.music);}
      else {for(const a of [this.music,this.voice,this.banter,...this.fxPool])a.pause();clearTimeout(this.lineTimer);}
      updateSound();
    }
    pauseDucking(on){this.quiet=on;this.music.volume=on?.1:.26;if(on){this.voice.pause();this.banter.pause();}}
  }
  const audio=new Sound();
  function updateSound(){$('sound').innerHTML=icon(audio.enabled?'sound':'muted')+'<span>Sound '+(audio.enabled?'on':'off')+'</span>';$('sound').setAttribute('aria-pressed',String(audio.enabled));}
  for(const event of ['pointerup','touchend','keydown','click'])document.addEventListener(event,()=>audio.unlock(),{capture:true,passive:true});
  updateSound();
  let current='home', selection='cory', mode='arcade', arena='opera', duel=null, paused=false,dialogType='',launchId=0,loaded=false;
  let held={},taps={},acc=0,last=0,lastLabel='',capTime=0,delayed=[100,100],specialMessage='',specialTime=0,finaleHit=false;
  const keyMap={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyW:'jump',ArrowUp:'jump',KeyS:'crouch',ArrowDown:'crouch',
    KeyJ:'punch',KeyK:'kick',KeyL:'special',ShiftLeft:'guard',ShiftRight:'guard',KeyI:'guard',KeyF:'finish'};
  const holding=new Set(['left','right','crouch','guard']), heldSources=new Map();
  function refreshHeld(){held={};for(const cmd of heldSources.values())held[cmd]=true;}
  function clearInputs(){held={};taps={};heldSources.clear();all('.touchpad .down').forEach(b=>b.classList.remove('down'));}
  function screen(to){
    current=to;for(const id of ['home','select','battle'])$(id).hidden=id!==to;
    document.body.classList.toggle('fighting',to==='battle');clearInputs();window.scrollTo(0,0);
  }
  function clearDialog(){if(dialog.open)dialog.close();dialogType='';}
  function home(focus=true){
    launchId++;clearDialog();duel=null;paused=false;loaded=false;audio.pauseDucking(false);audio.change('menu');
    renderer.reset();screen('home');if(focus)$('arcade').focus({preventScroll:true});
  }
  function stage(id,click=false){
    arena=id;all('[data-arena]').forEach(b=>{const active=b.dataset.arena===id;b.classList.toggle('chosen',active);b.setAttribute('aria-pressed',String(active));b.lastElementChild.innerHTML=active?icon('check')+'<span class="sel-word">Selected</span>':'';});
    if(click)audio.sfx('menu-select',.45);
  }
  function choose(id,speak){
    selection=id;for(const b of all('[data-pick]')){const on=b.dataset.pick===id;b.setAttribute('aria-pressed',String(on));b.querySelector('i').innerHTML=on?icon('check'):'';}
    $('style-name').textContent=fighters[id].style;$('style-desc').textContent=fighters[id].desc;
    if(speak){audio.sfx('menu-select',.4);audio.say('intro-'+id);}
  }
  function select(m){
    launchId++;mode=m;duel=null;paused=false;clearDialog();audio.pauseDucking(false);audio.change('menu');
    $('begin').disabled=false;$('begin').innerHTML=icon('play')+(mode==='training'?'Train':'Fight');
    $('mode-label').textContent=(mode==='training'?'Training':'Arcade match')+' / '+venues[arena];
    screen('select');choose(selection,true);document.querySelector('[data-pick="'+selection+'"]').focus({preventScroll:true});
    renderer.prepare(arena).catch(()=>{});
  }
  function caption(text,seconds=1.6){$('caption').textContent=text;capTime=seconds;}
  async function begin(){
    const ticket=++launchId;$('begin').disabled=true;$('begin').textContent='Loading arena…';
    try{await renderer.prepare(arena);}catch(_){
      if(ticket!==launchId)return;
      $('begin').disabled=false;$('begin').textContent='Retry arena';$('style-desc').textContent='Arena art could not load. Check the connection or extract the full download and try again.';return;
    }
    if(ticket!==launchId)return;
    clearDialog();audio.pauseDucking(false);renderer.reset();screen('battle');
    duel=new VelvetDuel(selection,mode);paused=false;loaded=true;delayed=[100,100];lastLabel='';specialTime=0;finaleHit=false;
    $('venue').textContent=venues[arena]+' / '+(mode==='training'?'Training':'Arcade match');
    $('finish-now').hidden=true;audio.change(arena);audio.say('round1');caption(mode==='training'?'Training · Your partner resets after a knockout.':'Round one.',1.15);
    $('pause').focus({preventScroll:true});acc=0;last=performance.now();
    updateHUD(0);renderer.draw(duel,arena);
  }
  function showDialog(type,kicker,body){
    dialogType=type;$('dialog-kicker').textContent=kicker;$('dialog-body').innerHTML=body;
    $('close').hidden=type==='results';if(!dialog.open)dialog.showModal();clearInputs();
    const first=dialog.querySelector('#dialog-body button')||$('close');first.focus({preventScroll:true});
  }
  function suspend(){
    if(current==='battle'&&duel&&duel.state!=='results'){paused=true;audio.pauseDucking(true);clearInputs();}
  }
  function resume(){clearDialog();paused=false;clearInputs();acc=0;last=performance.now();audio.pauseDucking(false);if(current==='battle')$('pause').focus({preventScroll:true});}
  function menuButton(id,text,primary=false){return '<button id="'+id+'" class="'+(primary?'primary':'secondary')+' action">'+text+'</button>';}
  function pauseMenu(){
    if(!duel||duel.state==='results')return;suspend();showDialog('pause',venues[arena],'<h2>Paused</h2><div class="stack">'+menuButton('resume','Resume fight',true)+
      (mode==='training'?menuButton('rehearse','Rehearse fatality')+menuButton('reset','Reset training'):'')+menuButton('pause-moves','Move list')+menuButton('quit','Title screen')+'</div>');
    $('resume').onclick=resume;$('quit').onclick=()=>home();$('pause-moves').onclick=movesDialog;if($('reset'))$('reset').onclick=begin;
    if($('rehearse')){$('rehearse').disabled=!['intro','live'].includes(duel.state);$('rehearse').onclick=()=>{resume();duel.rehearse();for(const e of duel.events.splice(0))onEvent(e);};}
  }
  function movesDialog(){
    const wasPause=dialogType==='pause';if(current==='battle')suspend();
    const rows=[['Move','A / D or ← / →'],['Jump · Crouch','W / S or ↑ / ↓'],['Guard','Hold Shift or I'],['Quick jab','J'],['Heavy kick','K'],['Signature · 40 meter','L'],['Eggplant fatality','F at the finish prompt'],['Pause','Esc or P']];
    showDialog(wasPause?'pauseMoves':'moves','Field manual','<h2>Move list</h2><table class="move-table"><tbody>'+rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('')+'</tbody></table><p>Land jabs and kicks to charge your signature. Crouch under a standing jab. Win two rounds to unlock your fatality. On touchscreens, use the arena buttons.</p><div class="stack">'+menuButton('got-it',wasPause?'Back to pause':'Got it',true)+'</div>');
    $('got-it').onclick=dismiss;
  }
  function dismiss(){if(dialogType==='results')return;if(dialogType==='pauseMoves')pauseMenu();else resume();}
  function results(){
    const winner=duel.players[duel.winner].id,won=duel.winner===0;
    const resultLine=(duel.viaFinale?fighters[winner].finale+' · ':'')+duel.players[0].wins+' – '+duel.players[1].wins;
    showDialog('results',won?'Arcade victory':'Match complete','<h2><span class="result-name">'+title(winner)+'</span> wins</h2>'+
      (duel.viaFinale?'<img class="result-img" src="assets/'+winner+'-finale.webp" alt="">':'')+'<p><strong>'+resultLine+'</strong><br>'+duel.stats.hits+' hits landed · Best combo '+duel.stats.maxCombo+'</p><div class="stack">'+menuButton('rematch','Rematch',true)+menuButton('new-fighter','Choose fighter')+menuButton('done','Title screen')+'</div>');
    audio.say(winner+'-wins');audio.sayLater('line-'+winner+'-win',1700);$('rematch').onclick=begin;$('new-fighter').onclick=()=>select(mode);$('done').onclick=()=>home();
  }
  function onEvent(e){
    renderer.react(e,duel);
    if(e.type==='fight'){audio.say('fight');caption('Fight!',.75);}
    if(e.type==='jump')audio.sfx('jump',.45);
    if(e.type==='swing')audio.sfx('whoosh',.42);
    if(e.type==='block')audio.sfx('block');
    if(e.type==='hit')audio.sfx(e.move==='punch'?'punch':'kick',e.move==='punch'?.59:.72);
    if(e.type==='special'){
      audio.sfx('special-charge',.52);
      audio.sfx('special-'+duel.players[e.index].id,.78);
      audio.banter('line-'+duel.players[e.index].id+'-special');
    }
    if(e.type==='lowMeter')caption('Signature needs 40 meter.',1.1);
    if(e.type==='dummyReset')caption('Training partner restored.',.9);
    if(e.type==='sudden'){specialMessage='Sudden death';specialTime=1.4;caption('Next clean hit wins.',1.4);}
    if(e.type!=='state')return;
    switch(e.state){
      case 'intro':delayed=[100,100];renderer.reset();audio.say('round'+duel.round);caption('Round '+duel.round+'.',1.1);break;
      case 'roundEnd':audio.sfx('knockout',.75);break; // Time-up and perfect announcer cues wait on the Jason voice clone.
      case 'finish':audio.say('finish');caption('Finish it!',1.15);break;
      case 'finale':{const id=duel.players[duel.winner].id;audio.say('finale-'+id);caption(fighters[id].finale+'!',1.4);finaleHit=false;break;}
      case 'results':results();break;
    }
  }
  function label(small,big,place=''){
    const cache=small+'|'+big+'|'+place;if(cache===lastLabel)return;lastLabel=cache;
    const e=$('callout');e.querySelector('small').textContent=small;e.querySelector('b').textContent=big;e.style.top=place||'38%';
  }
  const bars=[0,1].map(i=>{const el=$('hud'+i);return{tag:el.querySelector('.hud-name span'),name:el.querySelector('strong'),wins:el.querySelector('i'),health:el.querySelector('.life'),delay:el.querySelector('.delay'),energy:el.querySelector('.meter div'),ready:el.querySelector('small')};});
  function setText(element,value){if(element.textContent!==value)element.textContent=value;}
  function updateHUD(dt){
    const d=duel;
    for(let i=0;i<2;i++){
      const p=d.players[i],b=bars[i];setText(b.tag,i?(mode==='training'?'DUMMY':'CPU'):'P1');setText(b.name,title(p.id));
      setText(b.wins,'◆'.repeat(p.wins)+'◇'.repeat(2-p.wins));
      delayed[i]=Math.max(p.hp,delayed[i]-dt*28);b.health.style.transform='scaleX('+p.hp/100+')';b.delay.style.transform='scaleX('+delayed[i]/100+')';
      b.energy.style.transform='scaleX('+p.meter/100+')';setText(b.ready,(p.meter>=40?'SIGNATURE READY':'SIGNATURE')+' · '+Math.round(p.meter));
      b.health.parentElement.setAttribute('aria-label',title(p.id)+' health');b.health.parentElement.setAttribute('aria-valuenow',String(p.hp));
    }
    setText($('clock'),mode==='training'?'∞':d.sudden?'SD':String(Math.ceil(d.time)).padStart(2,'0'));
    setText($('round-tag'),mode==='training'?'Practice':'Round '+d.round);
    $('finish-now').hidden=!(d.state==='finish'&&d.winner===0);
    if(d.state==='intro')label(mode==='training'?'Training':venues[arena],d.cued?'Fight!':mode==='training'?'Practice':'Round '+d.round);
    else if(d.state==='roundEnd')label(title(d.players[d.winner].id)+' takes the round',d.players.some(p=>p.hp===0)?'Knockout':'Time up');
    else if(d.state==='finish')label(d.winner===0?'Victory · '+Math.ceil(6.5-d.elapsed)+' seconds':'Opponent finisher','Finish it!');
    else if(d.state==='finale')label(d.elapsed>1.92?'Eggplant fatality':'',d.elapsed>1.92?fighters[d.players[d.winner].id].finale:'','72%');
    else if(specialTime>0)label('Tie break',specialMessage);
    else label('','');
    const isFinal=d.state==='finale'||d.state==='results';document.querySelector('.hud').style.opacity=isFinal?'0':'1';
  }
  function frame(now){
    const dt=Math.min(.085,Math.max(0,(now-(last||now))/1000));last=now;
    if(current==='battle'&&loaded&&duel&&!paused&&!document.hidden&&duel.state!=='results'){
      acc+=dt;let ticks=0;
      while(acc>=1/60&&ticks++<7){duel.step(1/60,{...held,...taps});taps={};acc-=1/60;
        for(const e of duel.events.splice(0))onEvent(e);
        if(duel.state==='results')break;
      }
      if(duel.state==='finale'&&duel.elapsed>.78&&!finaleHit){finaleHit=true;audio.sfx('finale-hit-'+duel.players[duel.winner].id,.82);}
      renderer.advance(dt);renderer.draw(duel,arena);updateHUD(dt);
      specialTime=Math.max(0,specialTime-dt);if(capTime>0){capTime-=dt;if(capTime<=0)$('caption').textContent='';}
    }
    requestAnimationFrame(frame);
  }
  $('arcade').onclick=()=>select('arcade');$('practice').onclick=()=>select('training');$('sel-back').onclick=()=>home();$('begin').onclick=begin;
  $('sound').onclick=()=>audio.toggle();$('moves').onclick=()=>{if(dialogType!=='results')movesDialog();};
  $('pause').onclick=pauseMenu;$('brand').onclick=e=>{e.preventDefault();if(current==='battle')pauseMenu();else home();};
  $('close').onclick=dismiss;dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  $('finish-now').onclick=()=>{if(duel&&!paused){duel.finish();for(const e of duel.events.splice(0))onEvent(e);}};
  const fullscreen=$('full');
  if(!document.documentElement.requestFullscreen)fullscreen.hidden=true;
  fullscreen.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){fullscreen.hidden=true;}};
  document.addEventListener('fullscreenchange',()=>fullscreen.setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
  all('[data-arena]').forEach(b=>b.onclick=()=>stage(b.dataset.arena,true));all('[data-pick]').forEach(b=>b.onclick=()=>choose(b.dataset.pick,true));
  document.addEventListener('keydown',e=>{
    if(dialog.open)return;
    if(current==='select' && ['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();choose(selection==='cory'?'bob':'cory',true);document.querySelector('[data-pick="'+selection+'"]').focus();return;}
    if(current==='select'&&e.code==='Escape'){home();return;}
    if(current!=='battle')return;
    if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat){e.preventDefault();pauseMenu();return;}
    const cmd=keyMap[e.code];if(!cmd||paused)return;e.preventDefault();
    if(holding.has(cmd)){heldSources.set(e.code,cmd);refreshHeld();}else if(!e.repeat)taps[cmd]=true;
  });
  document.addEventListener('keyup',e=>{heldSources.delete(e.code);refreshHeld();});
  for(const b of all('[data-hold],[data-tap]')){
    b.addEventListener('pointerdown',e=>{if(paused||current!=='battle')return;e.preventDefault();audio.unlock();b.setPointerCapture(e.pointerId);b.classList.add('down');const key='touch'+e.pointerId;
      if(b.dataset.hold){heldSources.set(key,b.dataset.hold);refreshHeld();}else taps[b.dataset.tap]=true;});
    const release=e=>{heldSources.delete('touch'+e.pointerId);refreshHeld();b.classList.remove('down');};
    b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
  }
  window.addEventListener('blur',()=>{clearInputs();if(current==='battle'&&!paused&&!dialog.open&&duel?.state!=='results')pauseMenu();});
  document.addEventListener('visibilitychange',()=>{clearInputs();if(document.hidden){for(const a of [audio.music,audio.voice,audio.banter,...audio.fxPool])a.pause();if(current==='battle'&&!dialog.open)pauseMenu();}else if(audio.enabled&&audio.unlocked)audio.play(audio.music);});
  window.addEventListener('resize',()=>{if(current==='battle'&&duel)renderer.draw(duel,arena);});
  stage(arena);requestAnimationFrame(frame);
})();
