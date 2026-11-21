/* Fixed-step fighting rules, usable from the browser and the offline release. */
(function (root) {
  "use strict";
  const limit = (value, low, high) => Math.min(high, Math.max(low, value));
  const moves = {
    punch: { startup: .10, active: .10, recovery: .14, reach: 157, damage: 8, push: 12, stun: .18 },
    kick: { startup: .19, active: .12, recovery: .24, reach: 196, damage: 13, push: 23, stun: .28 },
    cory: { startup: .27, active: .21, recovery: .36, reach: 430, damage: 24, push: 68, stun: .4 },
    bob: { startup: .15, active: .20, recovery: .38, reach: 330, damage: 21, push: 50, stun: .34 }
  };
  function fighter(id, side) {
    return { id, x: side ? 840 : 440, y: 0, vy: 0, face: side ? -1 : 1, hp: 100, meter: 42, wins: 0,
      guard: false, crouch: false, moving: 0, stun: 0, attack: null, combo: 0, chain: 0, buffer: null,
      walkPhase: 0, jumps: 0, recentBlock: 0, hintCooldown: 0 };
  }
  class Duel {
    constructor(player = 'cory', mode = 'arcade', random = Math.random) {
      this.mode = mode; this.random = random; this.players = [fighter(player,0),fighter(player==='cory'?'bob':'cory',1)];
      this.round=1; this.time=60; this.state='intro'; this.elapsed=0; this.total=0; this.winner=-1;
      this.events=[]; this.stop=0; this.aiTime=.3; this.ai={}; this.cued=false; this.viaFinale=false;
      this.sudden=false; this.endKind=''; this.stats={hits:0,blocks:0,maxCombo:0,damage:0};this.practiceTimer=0;
    }
    emit(type,data={}) { this.events.push({type,...data}); }
    setState(state) { this.state=state; this.elapsed=0; this.emit('state',{state}); }
    startRound() {
      this.players=this.players.map((p,i)=>Object.assign(fighter(p.id,i),{wins:p.wins}));
      this.time=60; this.cued=false; this.sudden=false; this.stop=0; this.ai={}; this.aiTime=.45;
      this.practiceTimer=0; this.winner=-1; this.endKind=''; this.setState('intro');
    }
    finish() {
      if(this.state!=='finish') return;
      this.viaFinale=true; this.setState('finale');
    }
    rehearse() {
      if(this.mode!=='training'||!['intro','live'].includes(this.state))return;
      this.winner=0;this.viaFinale=true;this.setState('finale');
    }
    award(i, kind) {
      this.winner=i; this.players[i].wins++;
      this.endKind=kind||'ko';
      for(const p of this.players){p.attack=null;p.buffer=null;p.guard=false;p.moving=0;}
      this.stop=0; this.setState('roundEnd');
    }
    chooseAI(dt) {
      const me=this.players[1], you=this.players[0], delta=you.x-me.x, d=Math.abs(delta);
      if(this.mode==='training')return {};
      this.aiTime-=dt;
      if(this.aiTime>0) return {...this.ai};
      this.aiTime=.16+this.random()*.28; const roll=this.random();
      this.ai={}; let tap=null;
      const approach=delta<0?'left':'right', retreat=delta<0?'right':'left';
      if(d>162) this.ai[approach]=true;
      if(d<190 && you.attack && roll<.45) this.ai={guard:true};
      else if(d<155 && roll<.13) this.ai={[retreat]:true};
      else if(me.meter>=40 && d< moves[me.id].reach && roll>.80) tap='special';
      else if(d<181 && roll>.35) tap=this.random()<.59?'punch':'kick';
      else if(d<175 && roll<.26) this.ai={guard:true};
      return tap?{...this.ai,[tap]:true}:this.ai;
    }
    control(p,input,dt,index) {
      p.stun=Math.max(0,p.stun-dt);p.recentBlock=Math.max(0,p.recentBlock-dt);p.chain=Math.max(0,p.chain-dt);
      p.hintCooldown=Math.max(0,p.hintCooldown-dt);if(!p.chain)p.combo=0;
      if(p.y>0||p.vy>0){p.vy-=1560*dt;p.y=Math.max(0,p.y+p.vy*dt);if(!p.y)p.vy=0;}
      if(p.attack){p.attack.t+=dt;const m=p.attack.move;if(p.attack.t>=m.startup+m.active+m.recovery)p.attack=null;}
      p.moving=0;p.guard=false;p.crouch=false;
      const key=['special','kick','punch'].find(k=>input[k]);
      if(key)p.buffer={key,life:.16};
      if(p.buffer){p.buffer.life-=dt;if(p.buffer.life<=0)p.buffer=null;}
      if(p.attack||p.stun>0)return;
      p.guard=!!input.guard&&!p.y;p.crouch=!!input.crouch&&!p.y;
      if(p.guard)return;
      if(input.jump && !p.y && p.vy===0){p.vy=632;p.jumps++;p.crouch=false;this.emit('jump',{index});}
      if(p.buffer) {
        const fire=p.buffer.key;p.buffer=null;
        if(fire==='special' && p.meter<40){
          if(index===0 && !p.hintCooldown){this.emit('lowMeter');p.hintCooldown=1;}
        } else {
          const m=moves[fire==='special'?p.id:fire];
          if(fire==='special'){p.meter-=40;this.emit('special',{index});}
          else this.emit('swing',{index,move:fire});
          p.attack={type:fire,move:m,t:0,landed:false,face:p.face};p.crouch=false;return;
        }
      }
      const direction=Number(Boolean(input.right))-Number(Boolean(input.left));
      p.moving=p.crouch?0:direction;
      p.x=limit(p.x+p.moving*(p.id==='cory'?335:355)*dt*(p.y?.86:1),95,1185);
      p.walkPhase+=Math.abs(p.moving)*dt*9.2;
    }
    canHit(a,b) {
      const at=a.attack;if(!at||at.landed||at.t<at.move.startup||at.t>at.move.startup+at.move.active)return false;
      const dx=(b.x-a.x)*at.face;
      if(dx< -18||dx>at.move.reach)return false;
      if(b.crouch && at.type==='punch' && !a.y)return false;
      return Math.abs(a.y-b.y)<(at.type==='special'?225:at.type==='kick'?162:118);
    }
    impact(ai,bi,attack) {
      const a=this.players[ai],b=this.players[bi],m=attack.move;
      attack.landed=true;
      if(b.guard && b.face===-attack.face) {
        b.recentBlock=.22;b.x=limit(b.x+attack.face*8,95,1185);b.meter=limit(b.meter+5,0,100);
        a.meter=limit(a.meter+2,0,100);if(bi===0)this.stats.blocks++;
        this.stop=.033;this.emit('block',{index:bi,attacker:ai});return;
      }
      b.hp=Math.max(0,b.hp-m.damage);b.stun=m.stun;b.attack=null;b.buffer=null;
      b.x=limit(b.x+attack.face*m.push,95,1185);b.meter=limit(b.meter+6,0,100);
      if(attack.type!=='special')a.meter=limit(a.meter+(attack.type==='kick'?13:9),0,100);
      a.combo=a.chain?a.combo+1:1;a.chain=.98;
      if(ai===0){this.stats.hits++;this.stats.maxCombo=Math.max(this.stats.maxCombo,a.combo);this.stats.damage+=m.damage;}
      this.stop=attack.type==='punch'?.047:.074;
      this.emit('hit',{index:bi,attacker:ai,move:attack.type,combo:a.combo});
    }
    step(dt,input={}) {
      this.total+=dt; this.elapsed+=dt;
      if(this.state==='intro'){
        if(this.elapsed>1.50&&!this.cued){this.cued=true;this.emit('fight');}
        if(this.elapsed>=6.20)this.setState('live');
        return;
      }
      if(this.state==='roundEnd'){
        const hold=this.endKind==='ko'?3.6:1.75;
        if(this.elapsed>=hold){if(this.players[this.winner].wins>=2)this.setState('finish');else {this.round++;this.startRound();}}
        return;
      }
      if(this.state==='finish'){
        if(this.winner===0 && input.finish || this.winner===1 && this.elapsed>2.0)this.finish();
        else if(this.elapsed>=6.5)this.setState('results');
        return;
      }
      if(this.state==='finale'){if(this.elapsed>=5.6){if(this.mode==='training')this.startRound();else this.setState('results');}return;}
      if(this.state!=='live')return;
      if(this.stop>0){this.stop-=dt;if(input.kick||input.punch||input.special){const p=this.players[0];p.buffer={key:input.special?'special':input.kick?'kick':'punch',life:.16};}return;}
      if(this.mode==='arcade' && !this.sudden)this.time=Math.max(0,this.time-dt);
      const [a,b]=this.players;
      if(!a.attack)a.face=b.x>=a.x?1:-1;
      if(!b.attack)b.face=a.x<=b.x?-1:1;
      const opponent=this.chooseAI(dt);
      this.control(a,input,dt,0);this.control(b,opponent,dt,1);
      const gap=b.x-a.x;
      if(Math.abs(gap)<67 && Math.abs(a.y-b.y)<112) {
        const push=(67-Math.abs(gap))*.5*Math.sign(gap||a.face);
        a.x=limit(a.x-push,95,1185);b.x=limit(b.x+push,95,1185);
      }
      const first=this.canHit(a,b)?a.attack:null, second=this.canHit(b,a)?b.attack:null;
      if(first)this.impact(0,1,first);if(second)this.impact(1,0,second);
      if(this.mode==='training'){
        b.meter=100;
        if(!b.hp){this.practiceTimer+=dt;if(this.practiceTimer>.85){b.hp=100;b.x=840;b.stun=0;this.practiceTimer=0;this.emit('dummyReset');}}
        return;
      }
      if((!a.hp&&!b.hp)||(!this.time&&a.hp===b.hp&&!this.sudden)){
        this.sudden=true;a.hp=b.hp=1;this.stop=.32;this.emit('sudden');return;
      }
      if(!a.hp||!b.hp){
        const w=a.hp>b.hp?0:1;
        this.award(w, this.players[w].hp>=100?'perfect':'ko');
      }else if(!this.time&&!this.sudden){
        this.award(a.hp>b.hp?0:1,'time');
      }
    }
  }
  root.VelvetDuel=Duel;
  if(typeof module!=='undefined'&&module.exports)module.exports=Duel;
})(typeof window==='undefined'?globalThis:window);
