/* Reflex engines: jumper, flappy, reflex, tower, rhythm */
import { Engine, clamp, lerp, rnd, rint, pick, rgba, mix, shade, roundRect, pixelText, uiText, glowDot, drawGrid, TAU } from '../core.js';

/* p: mode, speed, jump, doubleJump, gravity, gaps */
class Jumper extends Engine {
  start(level){
    super.start(level);
    this.mode=this.p.mode||'runner';
    this.ground=this.h-42;
    this.x=this.mode==='runner'?100:this.w/2;
    this.y=this.ground-26;this.vy=0;this.onGround=true;
    this.jump=this.p.jump||380;this.gravity=this.p.gravity||1100;
    this.speed=(this.p.speed||210)+level*14;
    this.double=!!this.p.doubleJump;this.jumps=0;
    this.obs=[];this.spawn=0;this.invuln=0;
    this.goal=14+level*4;this.cleared=0;this.dist=0;
    this.setLives(3);this.setHint('JUMP OVER THE OBSTACLES');
    this.setProgress(0);
  }
  flap(){
    if(this.onGround||(this.double&&this.jumps<2)){
      this.vy=-this.jump;this.jumps++;this.onGround=false;this.sfx('jump');
      this.burst(this.x,this.y+20,this.theme.primary,7,{speed:60});
    }
  }
  key(code,phase){if(phase==='down'&&(code==='Space'||code==='ArrowUp'||code==='KeyW'))this.flap();}
  pointer(x,y,phase){if(phase==='down')this.flap();}
  update(dt,input){
    if(input.justPressed('Space')||input.justPressed('ArrowUp')||input.justPressed('KeyW'))this.flap();
    this.vy+=this.gravity*dt;this.y+=this.vy*dt;
    if(this.y>=this.ground-26){this.y=this.ground-26;this.vy=0;this.onGround=true;this.jumps=0;}
    this.spawn-=dt;
    if(this.spawn<=0){
      this.spawn=rnd(this.rng,0.9,1.5)*Math.max(0.55,1-this.level*0.025);
      const h=rint(this.rng,16,34);
      this.obs.push({x:this.w+20,y:this.ground-h,w:rnd(this.rng,18,30),h,passed:false});
      if(this.rng()<0.16+this.level*0.01)this.obs.push({x:this.w+60,y:this.ground-h-42,w:16,h:18,high:true,passed:false});
    }
    const sp=this.speed;
    for(const o of this.obs){o.x-=sp*dt;
      if(!o.passed&&o.x+o.w<this.x){o.passed=true;this.cleared++;this.score(50,0,0,'+');this.sfx('score');
        if(this.cleared>=this.goal){this.sfx('win');this.win();return;}}
    }
    this.obs=this.obs.filter(o=>o.x>-40);
    this.invuln-=dt;
    if(this.invuln<=0)for(const o of this.obs){
      if(this.x+14>o.x&&this.x-12<o.x+o.w&&this.y+24>o.y&&this.y<o.y+o.h+4){
        this.invuln=1.4;this.sfx('bad');this.shake(10);this.flash('#ff3b6b',0.3);
        this.burst(this.x,this.y+12,this.theme.accent,18);this.lifeLost();
        this.y=this.ground-26;this.vy=0;break;
      }
    }
    this.dist+=sp*dt;
    this.setProgress(this.cleared/this.goal);
  }
  draw(ctx){
    const g=this.theme;
    const grad=ctx.createLinearGradient(0,0,0,this.h);
    grad.addColorStop(0,shade(g.bg,-0.3));grad.addColorStop(1,g.bg);
    ctx.fillStyle=grad;ctx.fillRect(0,0,this.w,this.h);
    const off=(this.dist*0.3)%80;
    ctx.fillStyle=rgba(g.primary,.09);
    for(let x=-80;x<this.w+80;x+=80){ctx.beginPath();ctx.moveTo(x+off,this.ground);ctx.lineTo(x+40+off,this.ground-40);ctx.lineTo(x+80+off,this.ground);ctx.fill();}
    ctx.fillStyle=shade(g.primary,-0.5);ctx.fillRect(0,this.ground,this.w,this.h-this.ground);
    ctx.fillStyle=g.primary;ctx.fillRect(0,this.ground,this.w,3);
    for(const o of this.obs){
      roundRect(ctx,o.x,o.y,o.w,o.h,3,o.high?g.accent:mix(g.primary,g.accent,0.5),rgba('#fff',.2));
      ctx.fillStyle=rgba('#fff',.25);ctx.fillRect(o.x+3,o.y+3,o.w-6,2);
    }
    if(this.invuln>0&&Math.floor(this.invuln*12)%2===0)ctx.globalAlpha=.35;
    ctx.save();ctx.translate(this.x,this.y);
    roundRect(ctx,-12,0,24,26,5,g.accent,rgba('#fff',.5));
    ctx.fillStyle='#080a12';ctx.fillRect(2,6,5,4);
    ctx.fillStyle=g.primary;ctx.fillRect(-14,22,7,5);ctx.fillRect(7,22,7,5);
    ctx.restore();ctx.globalAlpha=1;
  }
}

/* p: gap, speed, gravity, flap, wind */
class Flappy extends Engine {
  start(level){
    super.start(level);
    this.y=this.h/2;this.vy=0;
    this.gravity=(this.p.gravity||620)+level*12;
    this.flapPower=this.p.flap||-215;
    this.gap=Math.max(72,(this.p.gap||104)-level*3);
    this.speed=(this.p.speed||150)+level*9;
    this.wind=this.p.wind||0;
    this.pipes=[];this.timer=1.2;this.passed=0;
    this.goal=6+level*2;this.invuln=0;
    this.setLives(3);this.setHint('TAP TO FLY · '+this.goal+' PIPES');
    this.setProgress(0);
  }
  flap(){this.vy=this.flapPower;this.sfx('jump');this.burst(112,this.y,this.theme.primary,6,{speed:50});}
  key(code,phase){if(phase==='down'&&(code==='Space'||code==='ArrowUp'||code==='KeyW'))this.flap();}
  pointer(x,y,phase){if(phase==='down')this.flap();}
  update(dt,input){
    if(input.justPressed('Space')||input.justPressed('ArrowUp')||input.justPressed('KeyW'))this.flap();
    this.vy+=this.gravity*dt;this.y+=this.vy*dt;
    this.timer-=dt;
    if(this.timer<=0){this.timer=rnd(this.rng,1.35,1.85)*Math.max(0.7,1-this.level*0.02);
      const top=rint(this.rng,30,this.h-this.gap-50);
      this.pipes.push({x:this.w+20,top,passed:false,phase:rnd(this.rng,0,TAU)});
    }
    for(const p of this.pipes){p.x-=this.speed*dt;
      if(!p.passed&&p.x+52<112){p.passed=true;this.passed++;this.score(100,112,40,'+');this.sfx('score');
        if(this.passed>=this.goal){this.sfx('win');this.win();return;}}
    }
    this.pipes=this.pipes.filter(p=>p.x>-60);
    this.invuln-=dt;
    if(this.y<14){this.y=14;this.vy=0;}if(this.y>this.h-14){this.hit();this.y=this.h-30;this.vy=0;}
    if(this.invuln<=0)for(const p of this.pipes){
      if(112+11>p.x&&112-11<p.x+52&&(this.y-11<p.top||this.y+11>p.top+this.gap)){this.hit();this.y=Math.min(this.y,this.h-40);break;}
    }
    this.setProgress(this.passed/this.goal);
  }
  hit(){this.invuln=1.5;this.sfx('bad');this.shake(10);this.flash('#ff3b6b',0.3);this.burst(112,this.y,this.theme.accent,18);this.lifeLost();this.vy=0;}
  draw(ctx){
    const g=this.theme;
    drawGrid(ctx,this.w,this.h,28,g.primary,0.05);
    for(const p of this.pipes){
      const col=mix(g.primary,g.accent,0.35);
      roundRect(ctx,p.x,0,52,p.top,4,col,rgba('#fff',.2));
      roundRect(ctx,p.x-4,p.top-14,60,14,3,col,rgba('#fff',.25));
      const by=p.top+this.gap;
      roundRect(ctx,p.x,by,52,this.h-by,4,col,rgba('#fff',.2));
      roundRect(ctx,p.x-4,by,60,14,3,col,rgba('#fff',.25));
      ctx.fillStyle=rgba('#ffffff',.14);ctx.fillRect(p.x+8,10,4,p.top-24);ctx.fillRect(p.x+8,by+20,4,this.h-by-30);
    }
    ctx.save();ctx.translate(112,this.y);ctx.rotate(clamp(this.vy/500,-0.5,0.8));
    glowDot(ctx,0,0,13,g.accent,22);
    ctx.fillStyle='#080a12';ctx.fillRect(3,-4,4,4);
    ctx.fillStyle=g.primary;ctx.beginPath();ctx.moveTo(-12,8);ctx.lineTo(-18,14);ctx.lineTo(-8,11);ctx.fill();
    ctx.restore();
  }
}

/* p: mode, targets, speed, duration, distractors */
class Reflex extends Engine {
  start(level){
    super.start(level);
    this.mode=this.p.mode||'whack';
    this.hits=0;this.goal=8+level*2;
    this.speed=Math.max(0.35,(this.p.speed||0.9)-level*0.035);
    this.invuln=0;
    if(this.mode==='whack'){
      this.cols=3;this.rows=2;this.active=-1;this.timer=0.8;this.wrong=0;
    } else if(this.mode==='colorcall'){
      this.prompt=-1;this.timer=1;this.locked=false;
    } else {
      this.seq=[];this.step=0;this.showing=true;this.timer=0.7;this.flashIdx=-1;this.index=0;
      for(let i=0;i<3+level;i++)this.seq.push(rint(this.rng,0,3));
    }
    this.setLives(3);this.setHint(this.mode==='whack'?('HIT '+this.goal+' TARGETS'):this.mode==='colorcall'?('TAP THE CALLED COLOR'):('REPEAT THE SEQUENCE'));
    this.setProgress(0);
  }
  tap(i){
    this.sfx('blip');
    if(this.mode==='whack'){
      if(i===this.active){this.hits++;this.score(100,0,0,'+');this.burst(this.holeX(i),this.holeY(i),this.theme.accent,14);this.sfx('score');this.active=-1;this.timer=this.speed*0.5;this.shake(3);}
      else {this.wrong++;this.sfx('bad');this.lifeLost();}
    } else if(this.mode==='colorcall'){
      if(this.locked)return;
      if(i===this.prompt){this.hits++;this.score(100,0,0,'+');this.sfx('score');this.burst(this.btnX(i),this.h-56,this.theme.primary,14);this.locked=true;this.timer=0.6;}
      else {this.sfx('bad');this.lifeLost();}
    } else {
      if(this.showing)return;
      if(i===this.seq[this.index]){this.index++;this.sfx('good');this.burst(this.btnX(i),this.h-56,this.theme.primary,10);
        if(this.index>=this.seq.length){this.hits++;this.score(200,0,0,'+');this.sfx('score');
          if(this.hits>=this.goal){this.sfx('win');this.win();return;}
          this.seq.push(rint(this.rng,0,3));this.showing=true;this.timer=0.8;this.index=0;}
      } else {this.sfx('bad');this.shake(8);this.lifeLost();this.index=0;this.showing=true;this.timer=0.8;}
    }
    this.setProgress(this.hits/this.goal);
  }
  holeX(i){return this.w/2+((i%this.cols)-1)*94;} holeY(i){return 92+Math.floor(i/this.cols)*72;}
  btnX(i){return 60+i*(this.w-120)/3;}
  key(code,phase){
    if(phase!=='down')return;
    const map={ArrowLeft:0,KeyA:0,ArrowDown:1,KeyS:1,ArrowRight:2,KeyD:2,ArrowUp:3,KeyW:3,Space:0};
    if(map[code]!==undefined)this.tap(Math.min(3,map[code]));
  }
  pointer(x,y,phase){
    if(phase!=='down')return;
    if(this.mode==='whack'){
      for(let i=0;i<this.cols*this.rows;i++)if(Math.hypot(x-this.holeX(i),y-this.holeY(i))<34){this.tap(i);return;}
    } else {
      if(y>this.h-90&&y<this.h-24)for(let i=0;i<4;i++)if(Math.abs(x-this.btnX(i))<40){this.tap(i);return;}
    }
  }
  update(dt,input){
    if(this.mode==='whack'){
      this.timer-=dt;
      if(this.timer<=0){this.timer=this.speed*rnd(this.rng,0.8,1.2);
        this.active=rint(this.rng,0,this.cols*this.rows-1);this.sfx('tick');
        if(this.hits>=this.goal){this.sfx('win');this.win();}}
    } else if(this.mode==='colorcall'){
      this.timer-=dt;
      if(this.timer<=0){
        if(this.locked){this.locked=false;this.prompt=-1;this.timer=0.7;
          if(this.hits>=this.goal){this.sfx('win');this.win();}
        } else {this.prompt=rint(this.rng,0,3);this.timer=Math.max(0.7,2.1-this.level*0.08);this.sfx('tick');}
      }
    } else {
      this.timer-=dt;
      if(this.showing){
        if(this.timer<=0){
          const idx=this.index;
          if(idx<this.seq.length){this.flashIdx=this.seq[idx];this.sfx('blip');this.index++;this.timer=0.42;}
          else {this.flashIdx=-1;this.showing=false;this.index=0;this.timer=4;}
        }
      } else {
        this.timer-=dt*0;
        if(this.timer<=0){this.sfx('bad');this.lifeLost();this.seq.push(rint(this.rng,0,3));this.showing=true;this.timer=0.7;}
      }
    }
  }
  draw(ctx){
    const g=this.theme;
    if(this.mode==='whack'){
      for(let i=0;i<this.cols*this.rows;i++){
        const x=this.holeX(i),y=this.holeY(i);
        glowDot(ctx,x,y,26,rgba(g.primary,.5),50);
        ctx.fillStyle=shade(g.bg,-0.5);ctx.beginPath();ctx.ellipse(x,y,30,22,0,0,TAU);ctx.fill();
        if(this.active===i){glowDot(ctx,x,y-8,16,g.accent,34);ctx.fillStyle='#fff';ctx.fillRect(x-4,y-12,8,4);}
      }
      uiText(ctx,this.hits+' / '+this.goal,this.w/2,28,13,g.primary,'center');
    } else if(this.mode==='colorcall'){
      uiText(ctx,this.prompt<0?'GET READY':'TAP '+['RED','BLUE','GREEN','GOLD'][this.prompt],this.w/2,60,this.prompt<0?16:20,g.accent,'center');
      for(let i=0;i<4;i++)roundRect(ctx,this.btnX(i)-38,this.h-86,76,54,8,COL4[i],rgba('#fff',.3),i===this.prompt?3:1);
      uiText(ctx,this.hits+' / '+this.goal,this.w/2,24,12,g.primary,'center');
    } else {
      uiText(ctx,this.showing?'WATCH':'REPEAT',this.w/2,40,16,g.accent,'center');
      for(let i=0;i<4;i++){
        const col=this.flashIdx===i?'#ffffff':COL4[i];
        roundRect(ctx,this.btnX(i)-38,this.h-90,76,60,8,col,rgba('#fff',.3));
      }
      uiText(ctx,'STEP '+(this.index+1)+' / '+this.seq.length,this.w/2,24,12,g.primary,'center');
    }
  }
}
const COL4=['#ff4d6d','#4dc9ff','#4dff9e','#ffd23f'];

/* p: speed, blockWidth, mode, perfectBonus */
class Tower extends Engine {
  start(level){
    super.start(level);
    this.speed=(this.p.speed||130)+level*9;
    this.bw=(this.p.blockWidth||96);
    this.mode=this.p.mode||'stack';
    this.blocks=[];this.cam=0;
    this.blocks.push({x:this.w/2-this.bw/2,y:this.h-30,w:this.bw});
    this.mover={x:0,dir:1};this.placed=0;this.goal=6+level;
    this.setLives(3);this.setHint('TIME THE DROP · '+this.goal+' BLOCKS');this.setProgress(0);
  }
  drop(){
    const top=this.blocks[this.blocks.length-1];
    const x=this.mover.x;
    const overlap=Math.min(top.x+top.w,x+this.bw)-Math.max(top.x,x);
    if(overlap<=10){this.sfx('bad');this.shake(12);this.flash('#ff3b6b',0.35);this.lifeLost();return;}
    const nx=x, nw=overlap;
    const perfect=Math.abs(x-top.x)<5;
    this.blocks.push({x:nx,y:top.y-22,w:nw});
    if(perfect){this.sfx('combo');this.score(200,0,0,'PERFECT');this.burst(x+nw/2,top.y-22,this.theme.accent,20);this.shake(3);}
    else {this.sfx('good');this.score(60,0,0,'+');}
    this.placed++;
    if(this.blocks.length>7)this.cam+=22;
    this.setProgress(this.placed/this.goal);
    if(this.placed>=this.goal){this.sfx('win');this.win();return;}
    this.bw=nw;this.mover.x=0;this.mover.dir=1;
  }
  key(code,phase){if(phase==='down'&&(code==='Space'||code==='ArrowDown'||code==='KeyS'||code==='Enter'))this.drop();}
  pointer(x,y,phase){if(phase==='down')this.drop();}
  update(dt,input){
    if(input.justPressed('Space')||input.justPressed('Enter'))this.drop();
    this.mover.x+=this.mover.dir*this.speed*dt;
    if(this.mover.x>this.w-this.bw-8){this.mover.x=this.w-this.bw-8;this.mover.dir=-1;}
    if(this.mover.x<8){this.mover.x=8;this.mover.dir=1;}
  }
  draw(ctx){
    const g=this.theme;
    drawGrid(ctx,this.w,this.h,24,g.primary,0.05);
    const baseY=this.h-30;
    for(let i=0;i<this.blocks.length;i++){
      const b=this.blocks[i],y=baseY-i*22-this.cam;
      if(y<-30||y>this.h+20)continue;
      const col=mix(g.primary,g.accent,i/Math.max(1,this.blocks.length));
      roundRect(ctx,b.x,y,b.w,20,3,col,rgba('#fff',.25));
      ctx.fillStyle=rgba('#fff',.12);ctx.fillRect(b.x+3,y+3,b.w-6,2);
    }
    const top=this.blocks[this.blocks.length-1],ty=top.y-22-this.cam;
    roundRect(ctx,this.mover.x,ty-24,this.bw,20,3,rgba(g.accent,.55),g.accent,2);
    ctx.strokeStyle=rgba('#fff',.4);ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(this.mover.x+this.bw/2,ty-24);ctx.lineTo(this.mover.x+this.bw/2,ty);ctx.stroke();ctx.setLineDash([]);
    uiText(ctx,this.placed+' / '+this.goal,this.w-14,18,12,g.primary,'right');
  }
}

/* p: bpm, lanes, notes, mode */
class Rhythm extends Engine {
  start(level){
    super.start(level);
    this.lanes=clamp(this.p.lanes||3,2,4);
    this.bpm=(this.p.bpm||110)+level*4;
    this.interval=60/this.bpm;
    this.notes=[];this.timer=0.5;this.spawned=0;
    this.goal=(this.p.notes||16)+level*3;
    this.hitCount=0;this.combo=0;this.misses=0;
    this.lw=(this.w-60)/this.lanes;
    this.hitY=this.h-62;
    this.flash=Array(this.lanes).fill(0);
    this.setLives(3);this.setHint('TAP ON THE LINE · COMBO!');
    this.setProgress(0);
  }
  tap(lane){
    this.flash[lane]=1;
    let best=null,bd=1e9;
    for(const n of this.notes)if(n.lane===lane&&!n.hit){const d=Math.abs(n.y-this.hitY);if(d<bd){bd=d;best=n;}}
    if(best&&bd<30){best.hit=true;this.hitCount++;this.combo++;this.sfx(this.combo%5===0?'combo':'good');
      this.score(50+this.combo*5,20+lane*this.lw+this.lw/2,this.hitY,'+');
      this.burst(20+lane*this.lw+this.lw/2,this.hitY,this.theme.accent,10);
      if(this.hitCount>=this.goal){this.sfx('win');this.win();}
    } else {this.sfx('bad');this.combo=0;}
    this.setProgress(this.hitCount/this.goal);
  }
  key(code,phase){
    if(phase!=='down')return;
    const map={ArrowLeft:0,KeyA:0,ArrowDown:1,KeyS:1,ArrowUp:2,KeyW:2,ArrowRight:3,KeyD:3,Space:0};
    const l=map[code];if(l!==undefined&&l<this.lanes)this.tap(l);
  }
  pointer(x,y,phase){if(phase!=='down')return;
    const l=Math.floor((x-20)/this.lw);if(l>=0&&l<this.lanes&&y>this.hitY-50)this.tap(l);
  }
  update(dt,input){
    if(input.justPressed('Space'))this.tap(0);
    this.timer-=dt;
    if(this.timer<=0&&this.spawned<this.goal+6){
      this.timer=this.interval*(this.rng()<0.3?0.5:1);
      this.notes.push({lane:rint(this.rng,0,this.lanes-1),y:-20,hit:false});this.spawned++;
    }
    const speed=this.hitY/1.5;
    for(const n of this.notes)n.y+=speed*dt;
    for(const n of this.notes)if(!n.hit&&n.y>this.hitY+28){n.hit=true;this.combo=0;this.misses++;this.sfx('bad');
      if(this.misses>=3){this.misses=0;this.lifeLost();}}
    this.notes=this.notes.filter(n=>n.y<this.h+20);
    for(let i=0;i<this.lanes;i++)this.flash[i]=Math.max(0,this.flash[i]-dt*4);
    this.setCombo(this.combo);
  }
  draw(ctx){
    const g=this.theme;
    for(let l=0;l<this.lanes;l++){
      const x=20+l*this.lw;
      ctx.fillStyle=l%2?rgba(g.primary,.05):rgba(g.primary,.09);ctx.fillRect(x,0,this.lw,this.h);
      if(this.flash[l]){ctx.fillStyle=rgba(g.accent,this.flash[l]*0.25);ctx.fillRect(x,0,this.lw,this.h);}
      ctx.fillStyle=rgba(g.primary,.18);ctx.fillRect(x+this.lw/2-9,this.hitY-1,18,2);
      uiText(ctx,String(l+1),x+this.lw/2,this.h-20,11,rgba(g.ink,.5),'center');
    }
    ctx.strokeStyle=g.accent;ctx.lineWidth=2;ctx.globalAlpha=.7;
    ctx.beginPath();ctx.moveTo(20,this.hitY);ctx.lineTo(this.w-20,this.hitY);ctx.stroke();ctx.globalAlpha=1;
    for(const n of this.notes){if(n.hit)continue;const x=20+n.lane*this.lw+this.lw/2;
      roundRect(ctx,x-16,n.y-8,32,16,4,mix(g.primary,g.accent,.4),rgba('#fff',.4));}
    uiText(ctx,'COMBO x'+this.combo,this.w/2,24,13,g.accent,'center');
  }
}

export default { jumper:Jumper, flappy:Flappy, reflex:Reflex, tower:Tower, rhythm:Rhythm };
