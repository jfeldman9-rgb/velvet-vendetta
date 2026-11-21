(function(root){
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const backOrder=[0,1], frontOrder=[1,0];
  class ArenaRenderer {
    constructor(canvas){
      this.canvas=canvas;this.g=canvas.getContext('2d');this.art={};this.fx=[];this.shake=0;this.hurtFlash=0;
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.ambient=Array.from({length:30},(_,i)=>({x:(i*.61803)%1,y:(i*.3473)%1,r:1+(i%4)*.42}));
    }
    load(key){
      if(!this.art[key]){
        const im=new Image(); im.src='assets/'+key+'.webp';
        this.art[key]={im,ready:new Promise((res,rej)=>{if(im.complete&&im.naturalWidth)res();else{im.onload=res;im.onerror=()=>{delete this.art[key];rej(Error('Could not load '+key));};}})};
      }
      return this.art[key].ready;
    }
    prepare(stage){
      const poses=['idle','walk','jump','punch','kick','special','guard','hurt','win','finale'];
      return Promise.all([stage,'aubergine',...['cory','bob'].flatMap(id=>poses.map(p=>id+'-'+p))].map(k=>this.load(k)));
    }
    reset(){this.fx.length=0;this.shake=0;this.hurtFlash=0;this.backPosition=null;}
    react(e,d){
      if(!['hit','block','special'].includes(e.type))return;
      const p=d.players[e.index],isBlock=e.type==='block',isSpecial=e.type==='special',id=isSpecial?p.id:d.players[e.attacker].id;
      const color=isBlock?'#b3efee':id==='cory'?'#f7a2de':'#a7faef',n=isSpecial?38:isBlock?14:24;
      if(!isBlock)this.shake=Math.max(this.shake,e.move==='special'?9:4);
      if(e.type==='hit')this.hurtFlash=.1;
      for(let i=0;i<n;i++){
        let a=Math.random()*Math.PI*2, speed=(isSpecial?80:65)+Math.random()*255;
        this.fx.push({x:p.x+(isSpecial?p.face*65:0),y:p.y+155+Math.random()*50,vx:Math.cos(a)*speed+(isSpecial?p.face*220:0),vy:Math.sin(a)*speed,life:.15+Math.random()*.36,t:0,color:i%3?color:'#fff4cc',kind:id==='bob'&&isSpecial?'square':'line'});
      }
      if(e.type==='hit' && e.combo>=2)this.fx.push({x:p.x,y:p.y+320,life:.75,t:0,text:e.combo+' HITS',vx:0,vy:25,color:'#e1fc68'});
    }
    advance(dt){
      this.shake=Math.max(0,this.shake-34*dt);this.hurtFlash=Math.max(0,this.hurtFlash-dt);
      const fx=this.fx;let w=0;
      for(let i=0;i<fx.length;i++){
        const f=fx[i];f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;if(!f.text)f.vy-=260*dt;
        if(f.t<f.life)fx[w++]=f;
      }
      fx.length=w;
    }
    img(key){return this.art[key]?.im;}
    cover(img,w,h,zoom=1,offset=.5){
      if(!img?.naturalWidth)return;
      const size=Math.max(w/img.naturalWidth,h/img.naturalHeight)*zoom,iw=img.naturalWidth*size,ih=img.naturalHeight*size;
      this.g.drawImage(img,(w-iw)*offset,(h-ih)*.55,iw,ih);
    }
    pose(p,index,d){
      if(d.state==='finale')return index===d.winner?'special':'hurt';
      if(d.state==='roundEnd'||d.state==='finish'||d.state==='results')return index===d.winner?'win':'hurt';
      if(p.stun>0 || !p.hp)return 'hurt';
      if(p.attack){const at=p.attack,m=at.move;return at.t<m.startup*.58?'guard':at.t>m.startup+m.active+m.recovery*.72?'idle':at.type;}
      if(p.guard||p.crouch)return 'guard';
      if(p.y>0)return 'jump';
      if(p.moving && Math.sin(p.walkPhase)>-.14)return 'walk';
      return 'idle';
    }
    actor(p,index,d,reflection){
      const g=this.g,pose=this.pose(p,index,d),im=this.img(p.id+'-'+pose);
      if(!im?.naturalWidth)return;
      const s=this.spriteScale, floor=this.floor,x=this.sx(p.x), airborne=p.y*this.yScale;
      const now=d.total,breathe=!p.y&&!p.attack&&!p.stun?Math.sin(now*4+index)*.008:0;
      let tilt=p.stun?-.045:0, lean=0, compression=p.crouch?.76:1, step=0;
      if(p.attack){
        const t=p.attack.t,m=p.attack.move,phase=clamp((t-m.startup*.55)/(m.active+m.startup*.45),0,1);
        lean=(t<m.startup*.55?-5:Math.sin(phase*Math.PI*.6)*14)*p.face*s;
        if(p.attack.type==='special')lean*=1.55;
      }
      if(p.moving&&!p.y)step=Math.abs(Math.sin(p.walkPhase))*4*s;
      if((d.state==='roundEnd'||d.state==='finish')&&index!==d.winner)tilt=-.13;
      g.save();
      if(reflection){g.beginPath();g.rect(0,floor,this.w,this.h-floor);g.clip();g.globalAlpha=.095;g.translate(x+lean,floor+airborne*.23);g.scale(p.face,-.26);}
      else {g.translate(x+lean,floor-airborne-step);g.scale(p.face,1);}
      g.rotate(tilt);g.scale(1-breathe*.3,compression+breathe);
      g.drawImage(im,-330*s,-550*s,720*s,560*s);
      g.restore();
    }
    signature(p){
      const a=p.attack;if(!a||a.type!=='special'||a.t<a.move.startup*.62)return;
      const g=this.g,progress=clamp((a.t-a.move.startup*.62)/(a.move.active+.12),0,1);
      const fade=1-clamp((a.t-a.move.startup-a.move.active)/.26,0,1);
      if(fade<=0)return;
      const x=this.sx(p.x+p.face*(60+(a.move.reach-60)*progress)),y=this.floor-(p.y+184)*this.yScale,sz=this.spriteScale;
      g.save();g.globalAlpha=fade;g.translate(x,y);g.scale(sz*p.face,sz);
      if(p.id==='cory'){
        g.shadowColor='#f546bd';g.shadowBlur=15*sz;
        for(let j=0;j<7;j++){g.save();g.rotate(j*.898+a.t*9);g.fillStyle=j%2?'#d94fa8':'#f9b7e9';g.beginPath();g.ellipse(15,0,18,5,0,0,7);g.fill();g.restore();}
        g.fillStyle='#ffe6a5';g.beginPath();g.arc(0,0,6,0,7);g.fill();
      }else{
        g.strokeStyle='#bcffea';g.lineWidth=3;g.shadowColor='#54ffdf';g.shadowBlur=12*sz;
        for(let j=0;j<4;j++){g.strokeRect(-38*j,-15+j*4,27,27-j*5);}
        g.fillStyle='#c4fff4';g.fillRect(-13,-5,28,10);
      }g.restore();
    }
    choreography(d){
      const g=this.g,t=d.elapsed,w=this.w,h=this.h,winner=d.players[d.winner],loser=d.players[1-d.winner];
      const cory=winner.id==='cory',src=this.sx(winner.x)+winner.face*60*this.spriteScale,dst=this.sx(loser.x);
      const travel=clamp((t-.35)/.68,0,1),flight=travel*travel*(3-2*travel);
      const extra=cory?Math.sin(travel*Math.PI)*h*.20:0;
      const x=src+(dst-src)*flight,y=this.floor-h*(.29+.03*flight)-extra;
      const egg=this.img('aubergine'),scale=Math.min(1,t*3.4),grow=clamp((t-.95)*2,0,1);
      g.save();g.fillStyle=cory?'rgba(39,9,44,.26)':'rgba(0,30,30,.33)';g.fillRect(0,0,w,h);
      if(cory){
        const beam=g.createLinearGradient(0,0,0,this.floor);beam.addColorStop(0,'rgba(251,227,157,.02)');beam.addColorStop(1,'rgba(251,227,157,.24)');
        g.fillStyle=beam;g.beginPath();g.moveTo(dst-h*.025,0);g.lineTo(dst+h*.12,this.floor);g.lineTo(dst-h*.12,this.floor);g.closePath();g.fill();
      }else{
        g.strokeStyle='rgba(116,255,191,.4)';g.lineWidth=1;
        const scan=this.floor-h*.67+(t*.8%1)*h*.64;
        g.beginPath();g.moveTo(dst-w*.16,scan);g.lineTo(dst+w*.16,scan);g.stroke();
      }
      const eggHeight=h*.18*(1+grow*.54)*scale,eggWidth=eggHeight*egg.naturalWidth/egg.naturalHeight;
      g.save();g.translate(x,y);g.rotate(winner.face*(cory?(.33+travel*2.9):(-.4+travel*.8)));g.shadowColor=cory?'#da4aac':'#61eac6';g.shadowBlur=17;
      g.drawImage(egg,-eggWidth/2,-eggHeight/2,eggWidth,eggHeight);g.restore();
      if(t>.91){
        const spread=clamp((t-.91)/1.11,0,1);
        for(let i=0;i<64;i++){
          const a=i*2.3999,r=(22+(i%11)*9)*spread*this.spriteScale*1.4;
          const xx=dst+Math.cos(a+t*.8)*r,yy=this.floor-h*.22+Math.sin(a)*r-spread*h*(.15+.28*(i%9)/9);
          g.globalAlpha=(1-spread*.7)*.92;g.fillStyle=cory?(i%3?'#da75b7':'#ffda8c'):(i%3?'#63e3b6':'#d894f4');
          if(cory){g.beginPath();g.ellipse(xx,yy,Math.max(1,6*this.spriteScale),Math.max(1,2*this.spriteScale),a+t,0,7);g.fill();}
          else g.fillRect(xx,yy,5*this.spriteScale,5*this.spriteScale);
        }
      }
      g.restore();
    }
    draw(d,stage){
      const c=this.canvas,g=this.g;let w=Math.max(1,c.clientWidth),h=Math.max(1,c.clientHeight),px=Math.min(devicePixelRatio||1,1.5);
      const bw=Math.round(w*px),bh=Math.round(h*px);
      if(c.width!==bw||c.height!==bh){c.width=bw;c.height=bh;}
      g.setTransform(px,0,0,px,0,0);g.clearRect(0,0,w,h);this.w=w;this.h=h;
      const [a,b]=d.players, span=clamp(Math.max((Math.abs(a.x-b.x)+360),w/h*691),680,1450);
      const mid=clamp((a.x+b.x)/2,span/2-25,1305-span/2);
      this.camW=w;this.camMid=mid;this.camSpan=span;
      if(!this.sx)this.sx=function(x){return this.camW/2+(x-this.camMid)*(this.camW/this.camSpan);};
      this.spriteScale=Math.min(h*.64/483,w/span*1.06);this.yScale=this.spriteScale*1.38;
      this.floor=h*.867;
      g.save();if(this.shake&&!this.reduced)g.translate(Math.sin(d.total*99)*this.shake,Math.cos(d.total*89)*this.shake*.45);
      const position=Math.round(clamp(.5+(mid-640)/2500,.22,.78)*100);
      if(this.backStage!==stage || position!==this.backPosition){
        const ring=c.parentElement;
        ring.style.backgroundImage='url("assets/'+stage+'.webp")';ring.style.backgroundSize='cover';
        ring.style.backgroundPosition=position+'% 55%';this.backStage=stage;this.backPosition=position;
      }
      const grad=g.createLinearGradient(0,0,0,h*.36);grad.addColorStop(0,'rgba(13,8,14,.53)');grad.addColorStop(1,'rgba(13,8,14,0)');g.fillStyle=grad;g.fillRect(0,0,w,h*.36);
      for(const m of this.ambient){g.fillStyle=stage==='opera'?'rgba(250,210,150,.36)':'rgba(152,230,213,.38)';g.beginPath();g.arc(((m.x+d.total*.009*m.r)%1)*w,((m.y+d.total*.014)%1)*h,m.r*.7,0,7);g.fill();}
      for(let i=0;i<2;i++){const p=d.players[i];
        const shadow=clamp(1-p.y/480,.42,1);g.fillStyle='rgba(16,9,16,.52)';g.beginPath();g.ellipse(this.sx(p.x),this.floor+3,84*this.spriteScale*shadow,12*this.spriteScale*shadow,0,0,7);g.fill();if(d.state!=='finale')this.actor(p,i,d,true);
      }
      const order=a.attack?frontOrder:backOrder;
      for(const i of order){
        g.save();
        if(d.state==='finale' && i!==d.winner)g.globalAlpha=1-clamp((d.elapsed-1.02)/.77,0,1);
        this.actor(d.players[i],i,d,false);g.restore();
      }
      for(let i=0;i<2;i++)this.signature(d.players[i]);
      for(const f of this.fx){
        const x=this.sx(f.x),y=this.floor-f.y*this.yScale;g.save();g.globalAlpha=Math.min(1,(1-f.t/f.life)*2);
        if(f.text){g.fillStyle=f.color;g.font='italic bold '+Math.max(17,31*this.spriteScale)+'px Arc, sans-serif';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#2a182b';g.strokeText(f.text,x,y);g.fillText(f.text,x,y);}
        else if(f.kind==='square'){g.fillStyle=f.color;g.fillRect(x,y,5*this.spriteScale,5*this.spriteScale);}
        else{g.strokeStyle=f.color;g.lineWidth=1+1.8*this.spriteScale;g.beginPath();g.moveTo(x,y);g.lineTo(x-f.vx*.04*this.spriteScale,y+f.vy*.04*this.spriteScale);g.stroke();}
        g.restore();
      }
      if(d.state==='finale'){
        const elapsed=d.elapsed,progress=clamp((elapsed-1.92)/.48,0,1),id=d.players[d.winner].id;
        if(elapsed<2.42)this.choreography(d);
        g.globalAlpha=progress;const plate=this.img(id+'-finale');
        this.cover(plate,w,h,1+(this.reduced?0:Math.max(0,elapsed-2)*.02));
        if(w/h<1.05 && progress>0){
          g.fillStyle='rgba(13,7,15,.70)';g.fillRect(0,0,w,h);
          const ph=w*plate.naturalHeight/plate.naturalWidth;g.drawImage(plate,0,h*.46-ph/2,w,ph);
        }
        g.globalAlpha=1;const shade=g.createLinearGradient(0,h*.5,0,h);shade.addColorStop(0,'transparent');shade.addColorStop(1,'rgba(12,7,15,.85)');g.fillStyle=shade;g.fillRect(0,h*.5,w,h*.5);
        if(!this.reduced){
          g.fillStyle=id==='cory'?'#ffd0e8':'#90ffe7';for(let i=0;i<18;i++){let x=((i*.618+elapsed*.065)%1)*w,y=((i*.817+elapsed*.105)%1)*h;g.globalAlpha=.23;g.fillRect(x,y,id==='cory'?6:4,3);}g.globalAlpha=1;
        }
      }g.restore();
    }
  }
  root.ArenaRenderer=ArenaRenderer;
})(window);
