/* Enhanced variants with real per-cartridge mechanic twists. */
import { Engine, clamp, rnd, rint, rgba, mix, shade, roundRect, uiText, glowDot, drawGrid, TAU } from '../core.js';

/* p: speed, ai, goal, paddle, mode, twist(curve|multi|walls|shrink|blitz) */
class PongPlus extends Engine {
  start(level){
    super.start(level);
    this.tw=this.p.twist||'';
    this.ai=clamp((this.p.ai||0.55)+level*0.02,0.1,.96);
    this.speed=this.p.speed||200; this.goal=this.p.goal||5;
    this.ph=clamp(this.p.paddle||52,30,90); this.mode=this.p.mode||'classic';
    this.py=this.h/2-this.ph/2; this.ay=this.py;
    this.ps=0; this.as=0; this.balls=[];
    this.wallY=this.h/2; this.wallPhase=rnd(this.rng,0,TAU);
    this.serve(1); if(this.tw==='multi') this.serve(-1);
    this.setLives(3);
    this.setHint('FIRST TO '+this.goal+' WINS'+(this.tw?' · '+this.tw.toUpperCase():''));
    this.setProgress(0);
  }
  serve(dir, b){
    const nb={x:this.w/2,y:this.h/2+rnd(this.rng,-32,32),vx:dir*this.speed*(1+this.level*.03),vy:rnd(this.rng,-.6,.6)*this.speed,r:6,phase:rnd(this.rng,0,TAU)};
    if(b){Object.assign(b,nb);return b;} this.balls.push(nb); return nb;
  }
  key(code,phase){ if(code==='Space'&&phase==='down') for(const b of this.balls) b.vx*=-1; }
  pointer(x,y,phase){ this.targetY=y; if(phase==='down') for(const b of this.balls) b.vx*=-1; }
  update(dt,input){
    const up=input.isDown('ArrowUp')||input.isDown('KeyW'), dn=input.isDown('ArrowDown')||input.isDown('KeyS');
    if(up||dn) this.py=clamp(this.py+(dn?1:-1)*360*dt,6,this.h-this.ph-6);
    else if(this.targetY!==undefined) this.py=clamp(this.py+(this.targetY-this.py)*Math.min(1,dt*12),6,this.h-this.ph-6);
    let targetBall=null;
    for(const b of this.balls) if(!targetBall||b.x<targetBall.x) targetBall=b;
    const aiSpeed=this.ai*300, desired=(targetBall?targetBall.y:this.h/2)-this.ph/2;
    this.ay=clamp(this.ay+clamp(desired-this.ay,-aiSpeed*dt,aiSpeed*dt),6,this.h-this.ph-6);
    this.wallY=this.h/2+Math.sin(performance.now()/900+this.wallPhase)*62;
    for(const b of this.balls){
      if(this.tw==='curve') b.vy+=Math.sin(performance.now()/280+b.phase)*78*dt;
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.y<8){b.y=8;b.vy=Math.abs(b.vy);} if(b.y>this.h-8){b.y=this.h-8;b.vy=-Math.abs(b.vy);}
      if(this.tw==='walls'&&Math.abs(b.x-this.w/2)<b.r+6&&b.y>this.wallY-32&&b.y<this.wallY+32){
        b.x=b.vx<0?this.w/2+b.r+7:this.w/2-b.r-7; b.vx*=-1; this.sfx('blip');this.burst(b.x,b.y,this.theme.accent,6);
      }
      if(b.vx<0&&b.x<26&&b.x>14&&b.y>this.py&&b.y<this.py+this.ph){
        b.x=26;b.vx=Math.abs(b.vx)*1.04;const off=(b.y-(this.py+this.ph/2))/(this.ph/2);b.vy=off*b.vx*.8;
        if(this.tw==='blitz') b.vx*=1.09;
        if(this.tw==='shrink'){this.ph=Math.max(18,this.ph-3);this.py+=1;this.ay+=1;this.float(this.w/2,60,'PADDLES SHRINK',this.theme.accent);}
        this.sfx('blip');
      }
      if(b.vx>0&&b.x>this.w-26&&b.x<this.w-14&&b.y>this.ay&&b.y<this.ay+this.ph){
        b.x=this.w-26;b.vx=-Math.abs(b.vx)*1.04;const off=(b.y-(this.ay+this.ph/2))/(this.ph/2);b.vy=off*Math.abs(b.vx)*.8;
        if(this.tw==='blitz') b.vx*=1.09;
        this.sfx('blip');
      }
      if(b.x<-10){this.as++;this.sfx('bad');this.shake(6);this.float(this.w/2,60,'AI SCORES',this.theme.accent);
        if(this.as>=this.goal){this.lose();return;} this.serve(1,b);}
      if(b.x>this.w+10){this.ps++;this.sfx('score');this.burst(this.w-40,this.h/2,this.theme.primary,20);
        this.float(this.w/2,60,'YOU SCORE!',this.theme.primary);this.score(200,this.w/2,60,'+');
        if(this.ps>=this.goal){this.win();return;} this.serve(-1,b);}
    }
    this.setProgress(this.ps/this.goal);
  }
  draw(ctx){
    const g=this.theme;
    ctx.save();ctx.setLineDash([8,10]);ctx.strokeStyle=rgba(g.primary,.35);ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(this.w/2,10);ctx.lineTo(this.w/2,this.h-10);ctx.stroke();ctx.restore();
    ctx.strokeStyle=rgba(g.primary,.25);ctx.strokeRect(12,8,this.w-24,this.h-16);
    if(this.tw==='walls') roundRect(ctx,this.w/2-6,this.wallY-32,12,64,4,g.accent,rgba('#fff',.4));
    roundRect(ctx,16,this.py,10,this.ph,3,g.primary);
    roundRect(ctx,this.w-26,this.ay,10,this.ph,3,g.accent);
    for(const b of this.balls) glowDot(ctx,b.x,b.y,b.r,g.accent,20);
    uiText(ctx,String(this.ps),this.w/2-40,30,28,g.primary,'center');
    uiText(ctx,String(this.as),this.w/2+40,30,28,g.accent,'center');
  }
}

/* p: gap, speed, gravity, flap, twist(wind|doublepipe|laser|lowgrav|shield) */
class FlappyPlus extends Engine {
  start(level){
    super.start(level);
    this.tw=this.p.twist||'';
    this.y=this.h/2;this.vy=0;
    this.gravity=((this.p.gravity||620)+level*12)*(this.tw==='lowgrav'?.72:1);
    this.flapPower=this.p.flap||-215;
    this.gap=Math.max(64,(this.p.gap||104)-level*3-(this.tw==='lowgrav'?8:0));
    this.speed=(this.p.speed||150)+level*9;
    this.pipes=[];this.timer=1.2;this.passed=0;this.goal=6+level*2;this.invuln=0;
    this.laser=null;this.laserTimer=3.5;this.shieldLeft=this.tw==='shield'?1:0;
    this.setLives(3);this.setHint('TAP TO FLY · '+this.goal+' PIPES'+(this.tw?' · '+this.tw.toUpperCase():''));this.setProgress(0);
  }
  flap(){this.vy=this.flapPower;this.sfx('jump');this.burst(112,this.y,this.theme.primary,6,{speed:50});}
  key(code,phase){if(phase==='down'&&(code==='Space'||code==='ArrowUp'||code==='KeyW'))this.flap();}
  pointer(x,y,phase){if(phase==='down')this.flap();}
  spawnPipe(){
    const top=rint(this.rng,30,this.h-this.gap-50);
    this.pipes.push({x:this.w+20,top,passed:false});
    if(this.tw==='doublepipe') this.pipes.push({x:this.w+150,top:clamp(top+rint(this.rng,-70,70),26,this.h-this.gap-26),passed:false});
  }
  update(dt,input){
    if(input.justPressed('Space')||input.justPressed('ArrowUp')||input.justPressed('KeyW'))this.flap();
    this.vy+=this.gravity*dt;
    if(this.tw==='wind') this.vy+=Math.sin(performance.now()/420)*58*dt;
    this.y+=this.vy*dt;
    this.timer-=dt;
    if(this.timer<=0){this.timer=rnd(this.rng,1.35,1.85)*Math.max(.7,1-this.level*.02);this.spawnPipe();}
    for(const p of this.pipes){p.x-=this.speed*dt;
      if(!p.passed&&p.x+52<112){p.passed=true;this.passed++;this.score(100,112,40,'+');this.sfx('score');
        if(this.passed>=this.goal){this.sfx('win');this.win();return;}}
    }
    this.pipes=this.pipes.filter(p=>p.x>-60);
    if(this.tw==='laser'){
      this.laserTimer-=dt;
      if(this.laser){this.laser.t-=dt;if(this.laser.t<=0)this.laser=null;}
      else if(this.laserTimer<=0){this.laserTimer=3.2;this.laser={y:rint(this.rng,50,this.h-60),t:.85};this.sfx('laser');}
      if(this.laser&&Math.abs(this.y-this.laser.y)<12)this.hit();
    }
    this.invuln-=dt;
    if(this.y<14){this.y=14;this.vy=0;} if(this.y>this.h-14){this.hit();this.y=this.h-30;this.vy=0;}
    if(this.invuln<=0)for(const p of this.pipes){
      if(112+11>p.x&&112-11<p.x+52&&(this.y-11<p.top||this.y+11>p.top+this.gap)){this.hit();this.y=Math.min(this.y,this.h-40);break;}
    }
    this.setProgress(this.passed/this.goal);
  }
  hit(){
    if(this.invuln>0)return;
    if(this.shieldLeft>0){this.shieldLeft--;this.invuln=1;this.sfx('power');this.float(112,this.y,'BLOCKED','#4dff9e');return;}
    this.invuln=1.5;this.sfx('bad');this.shake(10);this.flash('#ff3b6b',.3);this.burst(112,this.y,this.theme.accent,18);this.lifeLost();this.vy=0;
  }
  draw(ctx){
    const g=this.theme;
    drawGrid(ctx,this.w,this.h,28,g.primary,.05);
    for(const p of this.pipes){
      const col=mix(g.primary,g.accent,.35);
      roundRect(ctx,p.x,0,52,p.top,4,col,rgba('#fff',.2));
      roundRect(ctx,p.x-4,p.top-14,60,14,3,col,rgba('#fff',.25));
      const by=p.top+this.gap;
      roundRect(ctx,p.x,by,52,this.h-by,4,col,rgba('#fff',.2));
      roundRect(ctx,p.x-4,by,60,14,3,col,rgba('#fff',.25));
    }
    if(this.laser){ctx.fillStyle=rgba(g.accent,.85);ctx.fillRect(0,this.laser.y-2,this.w,4);ctx.fillStyle=rgba(g.accent,.2);ctx.fillRect(0,this.laser.y-9,this.w,18);}
    if(this.shieldLeft>0){ctx.strokeStyle=rgba('#4dff9e',.7);ctx.lineWidth=2;ctx.beginPath();ctx.arc(112,this.y,20,0,TAU);ctx.stroke();}
    ctx.save();ctx.translate(112,this.y);ctx.rotate(clamp(this.vy/500,-.5,.8));
    glowDot(ctx,0,0,13,g.accent,22);ctx.fillStyle='#080a12';ctx.fillRect(3,-4,4,4);
    ctx.fillStyle=g.primary;ctx.beginPath();ctx.moveTo(-12,8);ctx.lineTo(-18,14);ctx.lineTo(-8,11);ctx.fill();ctx.restore();
  }
}

/* p: speed, blockWidth, twist(zigzag|wind|narrow|bomb|sway) */
class TowerPlus extends Engine {
  start(level){
    super.start(level);
    this.tw=this.p.twist||'';
    this.speed=(this.p.speed||130)+level*9;
    this.bw=this.p.blockWidth||96;
    this.blocks=[];this.cam=0;
    this.blocks.push({x:this.w/2-this.bw/2,y:this.h-30,w:this.bw,bomb:false});
    this.mover={x:this.w/2-this.bw/2,dir:1};this.placed=0;this.goal=6+level;
    this.sway=rnd(this.rng,0,TAU);
    this.setLives(3);this.setHint('TIME THE DROP · '+this.goal+' BLOCKS'+(this.tw?' · '+this.tw.toUpperCase():''));this.setProgress(0);
  }
  drop(){
    const top=this.blocks[this.blocks.length-1],x=this.mover.x;
    const overlap=Math.min(top.x+top.w,x+this.bw)-Math.max(top.x,x);
    const perfect=Math.abs(x-top.x)<5;
    if(overlap<=10){this.sfx('bad');this.shake(12);this.lifeLost();return;}
    const bomb=this.tw==='bomb'&&this.placed%4===3;
    if(bomb&&!perfect){this.sfx('bad');this.shake(12);this.flash('#ff3b6b',.35);this.lifeLost();return;}
    this.blocks.push({x,y:top.y-22,w:overlap,bomb});
    if(perfect){this.sfx('combo');this.score(200,0,0,'PERFECT');this.burst(x+overlap/2,top.y-22,this.theme.accent,20);this.shake(3);}
    else {this.sfx('good');this.score(60,0,0,'+');}
    this.placed++;
    if(this.blocks.length>7)this.cam+=22;
    this.setProgress(this.placed/this.goal);
    if(this.placed>=this.goal){this.sfx('win');this.win();return;}
    if(this.tw==='narrow')this.bw=Math.max(26,overlap*.92); else this.bw=overlap;
    this.mover.x=this.w/2-this.bw/2;this.mover.dir=1;
  }
  key(code,phase){if(phase==='down'&&(code==='Space'||code==='ArrowDown'||code==='KeyS'||code==='Enter'))this.drop();}
  pointer(x,y,phase){if(phase==='down')this.drop();}
  update(dt,input){
    const sp=this.speed*(this.tw==='zigzag'?1.35:1);
    this.mover.x+=this.mover.dir*sp*dt;
    if(this.tw==='wind') this.mover.x+=Math.sin(performance.now()/330+this.sway)*38*dt;
    if(this.mover.x>this.w-this.bw-8){this.mover.x=this.w-this.bw-8;this.mover.dir=-1;}
    if(this.mover.x<8){this.mover.x=8;this.mover.dir=1;}
  }
  draw(ctx){
    const g=this.theme;
    drawGrid(ctx,this.w,this.h,24,g.primary,.05);
    const baseY=this.h-30;
    for(let i=0;i<this.blocks.length;i++){
      const b=this.blocks[i],y=baseY-i*22-this.cam;
      if(y<-30||y>this.h+20)continue;
      const sway=this.tw==='sway'?Math.sin(performance.now()/500+i*.6)*4:0;
      const col=b.bomb?'#ff3b6b':mix(g.primary,g.accent,i/Math.max(1,this.blocks.length));
      roundRect(ctx,b.x+sway,y,b.w,20,3,col,rgba('#fff',.25));
      if(b.bomb)uiText(ctx,'✕',b.x+sway+b.w/2,y+10,10,'#fff','center');
      ctx.fillStyle=rgba('#fff',.12);ctx.fillRect(b.x+sway+3,y+3,b.w-6,2);
    }
    const top=this.blocks[this.blocks.length-1],ty=top.y-22-this.cam;
    roundRect(ctx,this.mover.x,ty-24,this.bw,20,3,rgba(g.accent,.55),g.accent,2);
    ctx.strokeStyle=rgba('#fff',.4);ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(this.mover.x+this.bw/2,ty-24);ctx.lineTo(this.mover.x+this.bw/2,ty);ctx.stroke();ctx.setLineDash([]);
    uiText(ctx,this.placed+' / '+this.goal,this.w-14,18,12,g.primary,'right');
  }
}

export default { pong:PongPlus, flappy:FlappyPlus, tower:TowerPlus };
