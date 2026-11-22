/* Action engines: snake, breakout, pong, snake-likes */
import { Engine, clamp, lerp, rnd, rint, pick, shuffle, rgba, mix, shade, roundRect, pixelText, uiText, glowDot, drawGrid, TAU } from '../core.js';

/* p: grid, wrap, obstacles, foods, speed, reverse, grow */
class Snake extends Engine {
  start(level) {
    super.start(level);
    const r = this.rng;
    this.n = clamp(this.p.grid || 18, 12, 26);
    this.cell = Math.floor(Math.min((this.w - 44) / this.n, (this.h - 44) / this.n));
    this.ox = Math.floor((this.w - this.n * this.cell) / 2);
    this.oy = Math.floor((this.h - this.n * this.cell) / 2) + 4;
    const cx = Math.floor(this.n / 2), cy = Math.floor(this.n / 2);
    this.snake = [{x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy}];
    this.dir = {x:1,y:0}; this.nextDir = {x:1,y:0};
    this.wrap = !!this.p.wrap;
    this.speed = (this.p.speed || 6) + level * 0.32;
    this.acc = 0; this.eaten = 0;
    this.goal = 4 + level * 2;
    this.grow = this.p.grow || 1;
    this.pending = 0;
    this.foodN = this.p.foods || 1;
    this.foods = [];
    this.obstacles = new Set();
    const obs = Math.min((this.p.obstacles || 0) + Math.floor(level / 3), this.n * this.n / 5);
    let guard = 0;
    while (this.obstacles.size < obs && guard++ < 400) {
      const k = rint(r,1,this.n-2) + ',' + rint(r,1,this.n-2);
      if (!this.snake.some(s => s.x+','+s.y === k)) this.obstacles.add(k);
    }
    while (this.foods.length < this.foodN) this.spawnFood();
    this.invuln = 0;
    this.setLives(3);
    this.setHint('EAT TO GROW · ' + this.goal + ' TO CLEAR');
    this.setProgress(0);
  }
  spawnFood() {
    let guard = 0;
    while (guard++ < 500) {
      const x = rint(this.rng,0,this.n-1), y = rint(this.rng,0,this.n-1), k = x+','+y;
      if (!this.snake.some(s=>s.x+','+s.y===k) && !this.obstacles.has(k)) { this.foods.push({x,y,p:rnd(this.rng,0,TAU)}); return; }
    }
  }
  setDir(dx,dy) {
    if (this.p.reverse) { dx=-dx; dy=-dy; }
    if (this.dir.x === -dx && this.dir.y === -dy) return;
    this.nextDir = {x:dx,y:dy};
  }
  key(code, phase) {
    if (phase !== 'down') return;
    if (code==='ArrowLeft'||code==='KeyA') this.setDir(-1,0);
    if (code==='ArrowRight'||code==='KeyD') this.setDir(1,0);
    if (code==='ArrowUp'||code==='KeyW') this.setDir(0,-1);
    if (code==='ArrowDown'||code==='KeyS') this.setDir(0,1);
  }
  pointer(x,y,phase) {
    if (phase!=='down') return;
    const head = this.snake[0];
    const hx = this.ox + (head.x+.5)*this.cell, hy = this.oy + (head.y+.5)*this.cell;
    if (Math.abs(x-hx) > Math.abs(y-hy)) this.setDir(x>hx?1:-1,0); else this.setDir(0,y>hy?1:-1);
  }
  step() {
    this.dir = this.nextDir;
    const head = this.snake[0];
    let nx = head.x + this.dir.x, ny = head.y + this.dir.y;
    if (this.wrap) { nx=(nx+this.n)%this.n; ny=(ny+this.n)%this.n; }
    const k = nx+','+ny;
    const hitSelf = this.snake.slice(0,-1).some(s=>s.x+','+s.y===k);
    if (!this.wrap && (nx<0||ny<0||nx>=this.n||ny>=this.n) || hitSelf || this.obstacles.has(k)) {
      this.sfx('bad'); this.shake(9); this.flash('#ff3b6b',0.35);
      this.burst(this.ox+(head.x+.5)*this.cell, this.oy+(head.y+.5)*this.cell, this.theme.accent, 18);
      this.lifeLost();
      this.snake=[{x:Math.floor(this.n/2),y:Math.floor(this.n/2)},{x:Math.floor(this.n/2)-1,y:Math.floor(this.n/2)}];
      this.dir={x:1,y:0}; this.nextDir={x:1,y:0};
      return;
    }
    this.snake.unshift({x:nx,y:ny});
    const fi = this.foods.findIndex(f=>f.x===nx&&f.y===ny);
    if (fi>=0) {
      this.foods.splice(fi,1); this.spawnFood();
      this.pending += this.grow; this.eaten++;
      this.score(100*this.eaten, this.ox+(nx+.5)*this.cell, this.oy+(ny+.5)*this.cell, '+');
      this.burst(this.ox+(nx+.5)*this.cell, this.oy+(ny+.5)*this.cell, this.theme.primary, 16);
      this.sfx('score'); this.shake(3);
      this.setProgress(this.eaten/this.goal);
      if (this.eaten>=this.goal) { this.sfx('win'); this.burst(this.w/2,this.h/2,this.theme.accent,60,{speed:180}); this.win(); return; }
    }
    if (this.pending>0) this.pending--; else this.snake.pop();
  }
  update(dt, input) {
    this.acc += dt;
    const interval = 1/this.speed;
    while (this.acc >= interval) { this.acc -= interval; this.step(); if (this.dead) return; }
    for (const f of this.foods) f.p += dt*3;
  }
  draw(ctx) {
    const g=this.theme, c=this.cell;
    ctx.save();
    drawGrid(ctx,this.w,this.h,24,g.primary,0.05);
    roundRect(ctx,this.ox-3,this.oy-3,this.n*c+6,this.n*c+6,8,'rgba(0,0,0,.28)',rgba(g.primary,.5));
    for (const key of this.obstacles) { const [x,y]=key.split(',').map(Number); roundRect(ctx,this.ox+x*c+2,this.oy+y*c+2,c-4,c-4,3,shade(g.bg,-0.4),rgba(g.accent,.55)); }
    for (const f of this.foods) {
      const fx=this.ox+(f.x+.5)*c, fy=this.oy+(f.y+.5)*c, pulse=1+Math.sin(f.p)*0.18;
      glowDot(ctx,fx,fy,c*0.26*pulse,g.accent,c*0.8);
    }
    for (let i=this.snake.length-1;i>=0;i--) {
      const s=this.snake[i], x=this.ox+s.x*c, y=this.oy+s.y*c;
      const col=mix(g.primary,g.accent,i/Math.max(1,this.snake.length));
      roundRect(ctx,x+1.5,y+1.5,c-3,c-3,Math.max(2,c*0.22),col);
      if (i===0) { glowDot(ctx,x+c/2,y+c/2,c*0.16,g.accent,c*0.7); ctx.fillStyle='#06080f'; ctx.fillRect(x+c*0.28,y+c*0.3,2,2); ctx.fillRect(x+c*0.66,y+c*0.3,2,2); }
    }
    ctx.restore();
  }
}

/* p: rows, cols, pattern, paddle, balls, powerups, moving, speed */
class Breakout extends Engine {
  start(level) {
    super.start(level);
    this.rows=clamp(this.p.rows||4,2,7); this.cols=clamp(this.p.cols||9,5,14);
    this.pattern=this.p.pattern||'solid';
    this.bw=Math.floor((this.w-40)/this.cols); this.bh=14;
    this.bx=Math.floor((this.w-this.cols*this.bw)/2); this.by=38;
    this.bricks=[];
    for(let r=0;r<this.rows;r++) for(let c=0;c<this.cols;c++){
      let on=true;
      if(this.pattern==='checker') on=(r+c)%2===0;
      if(this.pattern==='pyramid') on=c>=r&&c<this.cols-r;
      if(this.pattern==='diamond') on=Math.abs(c-(this.cols-1)/2)+Math.abs(r-(this.rows-1)/2) <= (this.rows+this.cols)/4+1;
      if(this.pattern==='arch') on=(r===0&&c>1&&c<this.cols-2)||(r>0&&(c===1||c===this.cols-2));
      if(on) this.bricks.push({c,r,hp:1+Math.floor(level/5),c0:c});
    }
    this.total=this.bricks.length; this.broken=0;
    this.pw=clamp(this.p.paddle||76,44,120); this.px=this.w/2-this.pw/2; this.py=this.h-22;
    this.speed=(this.p.speed||190)+level*12;
    this.balls=[this.makeBall()]; this.powerups=[];
    this.launch=false; this.moving=!!this.p.moving; this.powerOn=!!this.p.powerups;
    this.setLives(3); this.setHint('MOVE TO AIM · TAP/SPACE TO LAUNCH'); this.setProgress(0);
  }
  makeBall(){ return {x:this.px+this.pw/2,y:this.py-8,vx:rnd(this.rng,-0.5,0.5)*this.speed,vy:-this.speed,r:5}; }
  key(code,phase){ if(code==='Space'||code==='Enter') { if(phase==='down'&&!this.launch){this.launch=true;this.sfx('start');} } }
  pointer(x,y,phase){ if(phase==='down'&&!this.launch){this.launch=true;this.sfx('start');} }
  update(dt,input){
    const dir=(input.isDown('ArrowRight')||input.isDown('KeyD')?1:0)-(input.isDown('ArrowLeft')||input.isDown('KeyA')?1:0);
    this.px=clamp(this.px+dir*340*dt,8,this.w-this.pw-8);
    if(input.pointer.down) this.px=clamp(input.pointer.x-this.pw/2,8,this.w-this.pw-8);
    if(this.moving) for(const b of this.bricks){ b.c += Math.sin(performance.now()/700+b.r)*dt*0.7; b.c=clamp(b.c,0,this.cols-1); }
    if(!this.launch){ for(const b of this.balls){b.x=this.px+this.pw/2;b.y=this.py-8;} return; }
    let alive=[];
    for(const b of this.balls){
      b.x+=b.vx*dt; b.y+=b.vy*dt;
      if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);} if(b.x>this.w-b.r){b.x=this.w-b.r;b.vx=-Math.abs(b.vx);}
      if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy);}
      if(b.vy>0&&b.y+b.r>=this.py&&b.y-b.r<=this.py+10&&b.x>=this.px&&b.x<=this.px+this.pw){
        b.y=this.py-b.r; const hit=(b.x-this.px)/this.pw-0.5;
        const sp=Math.min(Math.hypot(b.vx,b.vy)*1.015,this.speed*2.2);
        b.vx=hit*sp*1.5; b.vy=-Math.abs(sp)*Math.cos(hit*1.4); this.sfx('blip');
      }
      for(let i=this.bricks.length-1;i>=0;i--){
        const br=this.bricks[i], rx=this.bx+br.c*this.bw, ry=this.by+br.r*this.bh;
        if(b.x>rx&&b.x<rx+this.bw&&b.y>ry&&b.y<ry+this.bh){
          br.hp--; b.vy=-b.vy; this.sfx('good');
          this.burst(rx+this.bw/2,ry+this.bh/2,this.theme.accent,10);
          if(br.hp<=0){this.bricks.splice(i,1);this.broken++;this.score(120,this.w/2,ry,this.theme.accent&&'+');
            if(this.powerOn&&this.rng()<0.14) this.powerups.push({x:rx+this.bw/2,y:ry,vy:80,type:this.rng()<0.5?'wide':'multi'});
            if(this.broken>=this.total){this.sfx('win');this.win();return;}}
          break;
        }
      }
      if(b.y>this.h+12) continue; alive.push(b);
    }
    this.balls=alive;
    if(this.balls.length===0){
      this.sfx('bad');this.shake(8);this.lifeLost();
      this.px=this.w/2-this.pw/2;this.launch=false;
      this.pw=clamp(this.p.paddle||76,44,120);
      this.balls=[this.makeBall()];
      if(this.bricks.length===0){this.win();}
    }
    for(let i=this.powerups.length-1;i>=0;i--){
      const p=this.powerups[i];p.y+=p.vy*dt;
      if(p.y>this.py&&p.y<this.py+12&&p.x>this.px&&p.x<this.px+this.pw){
        if(p.type==='wide') this.pw=Math.min(this.pw*1.5,150);
        else this.balls.push({...this.makeBall(),vx:this.speed*0.7,vy:-this.speed*0.7});
        this.sfx('power');this.float(p.x,p.y,p.type==='wide'?'WIDE!':'MULTI!',this.theme.accent);this.powerups.splice(i,1);
      } else if(p.y>this.h+10) this.powerups.splice(i,1);
    }
    this.setProgress(this.broken/Math.max(1,this.total));
  }
  draw(ctx){
    const g=this.theme;
    drawGrid(ctx,this.w,this.h,20,g.primary,0.045);
    for(const b of this.bricks){
      const x=this.bx+b.c*this.bw,y=this.by+b.r*this.bh;
      const col=mix(g.primary,g.accent,b.r/Math.max(1,this.rows-1));
      roundRect(ctx,x+1,y+1,this.bw-2,this.bh-2,3,b.hp>1?shade(col,0.25):col,rgba('#ffffff',.18));
    }
    for(const p of this.powerups) roundRect(ctx,p.x-7,p.y-5,14,10,3,g.accent,'#fff');
    roundRect(ctx,this.px,this.py,this.pw,9,4,g.primary,rgba('#fff',.5));
    for(const b of this.balls) glowDot(ctx,b.x,b.y,b.r,g.accent,b.r*3);
    if(!this.launch) uiText(ctx,'TAP / SPACE TO LAUNCH',this.w/2,this.py-28,12,rgba(g.ink,.8),'center');
  }
}

/* p: speed, ai, goal, paddle, mode */
class Pong extends Engine {
  start(level){
    super.start(level);
    this.ai=clamp((this.p.ai||0.55)+level*0.02,0.1,0.96);
    this.speed=this.p.speed||200; this.goal=this.p.goal||5;
    this.ph=clamp(this.p.paddle||52,30,90); this.mode=this.p.mode||'classic';
    this.py=this.h/2-this.ph/2; this.ay=this.py;
    this.ps=0; this.as=0; this.serve(1);
    this.setLives(3); this.setHint('FIRST TO '+this.goal+' WINS'); this.setProgress(0);
  }
  serve(dir){ this.ball={x:this.w/2,y:this.h/2,vx:dir*this.speed*(1+this.level*0.03),vy:rnd(this.rng,-0.6,0.6)*this.speed, r:6}; }
  key(code,phase){ if(code==='Space'&&phase==='down'&&this.ball) this.ball.vx*=-1; }
  pointer(x,y,phase){ this.targetY=y; if(phase==='down'&&this.ball) this.ball.vx*=-1; }
  update(dt,input){
    const up=input.isDown('ArrowUp')||input.isDown('KeyW'), dn=input.isDown('ArrowDown')||input.isDown('KeyS');
    if(up||dn) this.py=clamp(this.py+(dn?1:-1)*360*dt,6,this.h-this.ph-6);
    else if(this.targetY!==undefined) this.py=clamp(this.py+(this.targetY-this.py)*Math.min(1,dt*12),6,this.h-this.ph-6);
    const b=this.ball;
    const aiSpeed=this.ai*300;
    const desired=b.y-this.ph/2;
    this.ay=clamp(this.ay+clamp(desired-this.ay,-aiSpeed*dt,aiSpeed*dt),6,this.h-this.ph-6);
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.y<8){b.y=8;b.vy=Math.abs(b.vy);} if(b.y>this.h-8){b.y=this.h-8;b.vy=-Math.abs(b.vy);}
    if(b.vx<0&&b.x<26&&b.x>14&&b.y>this.py&&b.y<this.py+this.ph){
      b.x=26;b.vx=Math.abs(b.vx)*1.04;const off=(b.y-(this.py+this.ph/2))/(this.ph/2);b.vy=off*b.vx*0.8;this.sfx('blip');
    }
    if(b.vx>0&&b.x>this.w-26&&b.x<this.w-14&&b.y>this.ay&&b.y<this.ay+this.ph){
      b.x=this.w-26;b.vx=-Math.abs(b.vx)*1.04;const off=(b.y-(this.ay+this.ph/2))/(this.ph/2);b.vy=off*Math.abs(b.vx)*0.8;this.sfx('blip');
    }
    if(b.x<-10){this.as++;this.sfx('bad');this.shake(6);this.float(this.w/2,60,'AI SCORES',this.theme.accent);
      if(this.as>=this.goal){this.lose();return;} this.serve(1);}
    if(b.x>this.w+10){this.ps++;this.sfx('score');this.burst(this.w-40,this.h/2,this.theme.primary,24);
      this.float(this.w/2,60,'YOU SCORE!',this.theme.primary);this.score(200,this.w/2,60,'+');
      if(this.ps>=this.goal){this.win();return;} this.serve(-1);}
    this.setProgress(this.ps/this.goal);
  }
  draw(ctx){
    const g=this.theme;
    ctx.save();ctx.setLineDash([8,10]);ctx.strokeStyle=rgba(g.primary,.35);ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(this.w/2,10);ctx.lineTo(this.w/2,this.h-10);ctx.stroke();ctx.restore();
    ctx.strokeStyle=rgba(g.primary,.25);ctx.strokeRect(12,8,this.w-24,this.h-16);
    roundRect(ctx,16,this.py,10,this.ph,3,g.primary);
    roundRect(ctx,this.w-26,this.ay,10,this.ph,3,g.accent);
    glowDot(ctx,this.ball.x,this.ball.y,this.ball.r,g.accent,20);
    uiText(ctx,String(this.ps),this.w/2-40,30,28,g.primary,'center');
    uiText(ctx,String(this.as),this.w/2+40,30,28,g.accent,'center');
  }
}

/* p: formation, speed, enemyHP, powerups, weapon */
class Shooter extends Engine {
  start(level){
    super.start(level);
    this.px=this.w/2; this.py=this.h-34; this.speed=300;
    this.weapon=this.p.weapon||'single'; this.powerOn=!!this.p.powerups;
    this.bullets=[]; this.enemyBullets=[]; this.powerups=[];
    this.enemies=[]; this.formation=this.p.formation||'waves';
    this.enemySpeed=(this.p.speed||50)+level*5;
    this.hp=1+Math.floor(level/4);
    this.kills=0; this.goal=8+level*4;
    this.shootCd=0; this.enemyCd=0; this.invuln=0; this.wave=0;
    this.spawnWave();
    this.setLives(3); this.setHint('DESTROY '+this.goal+' HOSTILES'); this.setProgress(0);
  }
  spawnWave(){
    this.wave++; const cols=7, step=48, sx=(this.w-(cols-1)*step)/2;
    for(let i=0;i<cols;i++) for(let j=0;j<2;j++){
      let x=sx+i*step, y=48+j*34;
      if(this.formation==='columns'){x=sx+(i%3)*step;y=44+Math.floor(i/3)*40+j*30;}
      if(this.formation==='swarm'){x+=rnd(this.rng,-16,16);y+=rnd(this.rng,-10,10);}
      if(this.formation==='boss'&&j===1) continue;
      this.enemies.push({x,y,hp:this.hp,max:this.hp,t:rnd(this.rng,0,TAU),phase:rnd(this.rng,0,TAU)});
    }
  }
  key(code,phase){}
  update(dt,input){
    const dir=(input.isDown('ArrowRight')||input.isDown('KeyD')?1:0)-(input.isDown('ArrowLeft')||input.isDown('KeyA')?1:0);
    this.px=clamp(this.px+dir*this.speed*dt,18,this.w-18);
    if(input.pointer.down) this.px=clamp(input.pointer.x,18,this.w-18);
    this.shootCd-=dt;
    if((input.isDown('Space')||input.pointer.down)&&this.shootCd<=0){
      this.shootCd=this.weapon==='laser'?0.1:0.18; this.sfx('laser');
      const shot=(dx)=>this.bullets.push({x:this.px+dx,y:this.py-12,vy:-520});
      if(this.weapon==='spread'){shot(-10);shot(0);shot(10);} else shot(0);
    }
    for(const b of this.bullets) b.y+=b.vy*dt;
    this.bullets=this.bullets.filter(b=>b.y>-10);
    for(const e of this.enemies){
      e.t+=dt;
      if(this.formation==='swarm') e.x+=Math.cos(e.t*2+e.phase)*30*dt;
      e.y+=this.enemySpeed*dt;
      if(e.y>this.h+20) e.dead=true;
    }
    this.enemies=this.enemies.filter(e=>!e.dead);
    this.enemyCd-=dt;
    if(this.enemies.length&&this.enemyCd<=0){
      this.enemyCd=Math.max(0.6,1.8-this.level*0.06);
      const e=pick(this.rng,this.enemies);
      this.enemyBullets.push({x:e.x,y:e.y+8,vy:150+this.level*6});
    }
    for(const b of this.enemyBullets) b.y+=b.vy*dt;
    this.enemyBullets=this.enemyBullets.filter(b=>b.y<this.h+10);
    for(let i=this.bullets.length-1;i>=0;i--){
      const b=this.bullets[i]; let hit=false;
      for(let j=this.enemies.length-1;j>=0;j--){
        const e=this.enemies[j];
        if(Math.abs(b.x-e.x)<14&&Math.abs(b.y-e.y)<14){
          e.hp--; this.bullets.splice(i,1); hit=true; this.sfx('good');
          this.burst(e.x,e.y,this.theme.accent,8);
          if(e.hp<=0){this.enemies.splice(j,1);this.kills++;this.score(100,this.w/2,e.y,'+');
            if(this.powerOn&&this.rng()<0.12) this.powerups.push({x:e.x,y:e.y,vy:70,type:this.rng()<0.5?'spread':'shield'});}
          break;
        }
      }
      if(hit) continue;
    }
    this.invuln-=dt;
    for(let i=this.enemyBullets.length-1;i>=0;i--){
      const b=this.enemyBullets[i];
      if(Math.abs(b.x-this.px)<12&&Math.abs(b.y-this.py)<12){
        this.enemyBullets.splice(i,1);
        if(this.invuln<=0){this.hit();}
      }
    }
    for(const e of this.enemies) if(Math.abs(e.x-this.px)<14&&Math.abs(e.y-this.py)<14&&this.invuln<=0){this.hit();break;}
    for(let i=this.powerups.length-1;i>=0;i--){
      const p=this.powerups[i];p.y+=p.vy*dt;
      if(p.y>this.py-14&&p.y<this.py+14&&Math.abs(p.x-this.px)<18){
        if(p.type==='spread') this.weapon='spread'; else this.invuln=4;
        this.sfx('power');this.float(p.x,p.y,p.type==='spread'?'SPREAD!':'SHIELD!',this.theme.accent);this.powerups.splice(i,1);
      } else if(p.y>this.h+10) this.powerups.splice(i,1);
    }
    if(this.enemies.length===0&&this.wave<3+Math.floor(this.level/2)) this.spawnWave();
    this.setProgress(this.kills/this.goal);
    if(this.kills>=this.goal){this.sfx('win');this.win();}
  }
  hit(){ this.sfx('bad');this.shake(12);this.flash('#ff3b6b',0.4);
    this.burst(this.px,this.py,this.theme.accent,26);this.lifeLost();this.invuln=2.2;this.weapon=this.p.weapon||'single'; }
  draw(ctx){
    const g=this.theme;
    drawGrid(ctx,this.w,this.h,26,g.primary,0.05);
    for(let i=0;i<26;i++){const x=(i*97+performance.now()*0.02*(i%3+1))%this.w,y=(i*53)%this.h;ctx.fillStyle=rgba('#ffffff',.12);ctx.fillRect(x,y,1.5,1.5);}
    for(const e of this.enemies){
      const col=mix(g.accent,g.primary,e.hp/Math.max(1,e.max)-0.5);
      roundRect(ctx,e.x-12,e.y-8,24,14,4,col,rgba('#fff',.25));
      ctx.fillStyle=shade(g.bg,-0.6);ctx.fillRect(e.x-6,e.y-2,4,3);ctx.fillRect(e.x+2,e.y-2,4,3);
    }
    for(const b of this.bullets){roundRect(ctx,b.x-2,b.y-8,4,12,2,g.primary);}
    for(const b of this.enemyBullets) glowDot(ctx,b.x,b.y,3,g.accent,8);
    for(const p of this.powerups) roundRect(ctx,p.x-6,p.y-6,12,12,3,p.type==='spread'?g.primary:'#4dff9e','#fff');
    if(this.invuln>0&&Math.floor(this.invuln*10)%2===0) ctx.globalAlpha=0.4;
    ctx.save();ctx.translate(this.px,this.py);
    ctx.fillStyle=g.primary;ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(11,10);ctx.lineTo(0,5);ctx.lineTo(-11,10);ctx.closePath();ctx.fill();
    ctx.fillStyle=g.accent;ctx.fillRect(-3,2,6,8);ctx.restore();ctx.globalAlpha=1;
  }
}

/* p: lanes, speed, spawnRate, collect, shield, mode */
class Dodger extends Engine {
  start(level){
    super.start(level);
    this.lanes=clamp(this.p.lanes||4,3,6);
    this.lw=this.w/this.lanes;
    this.lane=Math.floor(this.lanes/2); this.targetLane=this.lane;
    this.speed=(this.p.speed||170)+level*11;
    this.spawn=Math.max(0.25,(this.p.spawnRate||0.9)-level*0.03);
    this.collect=!!this.p.collect; this.shield=!!this.p.shield;
    this.mode=this.p.mode||'fall'; this.hazards=[]; this.items=[];
    this.timer=0; this.goal=12+level*2; this.elapsed=0; this.shieldLeft=this.shield?1:0;
    this.setLives(3); this.setHint('SURVIVE '+this.goal+'s'); this.setProgress(0);
  }
  key(code,phase){
    if(phase!=='down')return;
    if(code==='ArrowLeft'||code==='KeyA') this.targetLane=Math.max(0,this.targetLane-1);
    if(code==='ArrowRight'||code==='KeyD') this.targetLane=Math.min(this.lanes-1,this.targetLane+1);
  }
  pointer(x,y,phase){ if(phase==='down') this.targetLane=clamp(Math.floor(x/this.lw),0,this.lanes-1); }
  update(dt,input){
    if(input.justPressed('ArrowLeft')||input.justPressed('KeyA')) this.targetLane=Math.max(0,this.targetLane-1);
    if(input.justPressed('ArrowRight')||input.justPressed('KeyD')) this.targetLane=Math.min(this.lanes-1,this.targetLane+1);
    this.lane=lerp(this.lane,this.targetLane,Math.min(1,dt*16));
    this.elapsed+=dt;
    this.timer-=dt;
    if(this.timer<=0){
      this.timer=this.spawn*rnd(this.rng,0.7,1.3);
      const ln=rint(this.rng,0,this.lanes-1);
      if(this.collect&&this.rng()<0.3) this.items.push({lane:ln,y:-20});
      else this.hazards.push({lane:ln,y:-20,spin:rnd(this.rng,0,TAU),type:rint(this.rng,0,2)});
    }
    for(const h of this.hazards){h.y+=this.speed*dt;h.spin+=dt*3;}
    this.hazards=this.hazards.filter(h=>h.y<this.h+24);
    for(const it of this.items){it.y+=this.speed*0.8*dt;}
    this.items=this.items.filter(it=>it.y<this.h+20);
    const py=this.h-34;
    for(let i=this.hazards.length-1;i>=0;i--){
      const h=this.hazards[i];
      if(h.y>py-16&&h.y<py+16&&Math.abs(h.lane-this.lane)<0.42){
        this.hazards.splice(i,1);
        if(this.shieldLeft>0){this.shieldLeft--;this.sfx('power');this.float(this.px||this.w/2,py,'BLOCKED','#4dff9e');}
        else {this.sfx('bad');this.shake(10);this.flash('#ff3b6b',0.35);this.burst((this.lane+0.5)*this.lw,py,this.theme.accent,20);this.lifeLost();}
      }
    }
    for(let i=this.items.length-1;i>=0;i--){
      const it=this.items[i];
      if(it.y>py-16&&it.y<py+16&&Math.abs(it.lane-this.lane)<0.5){
        this.items.splice(i,1);this.sfx('score');this.score(150,(it.lane+0.5)*this.lw,py,'+');this.burst((it.lane+0.5)*this.lw,py,this.theme.primary,12);
      }
    }
    this.setProgress(this.elapsed/this.goal);
    if(this.elapsed>=this.goal){this.sfx('win');this.win();}
  }
  draw(ctx){
    const g=this.theme;
    for(let i=0;i<this.lanes;i++){ctx.fillStyle=i%2?rgba(g.primary,.05):rgba(g.primary,.09);ctx.fillRect(i*this.lw,0,this.lw,this.h);}
    ctx.strokeStyle=rgba(g.primary,.18);ctx.lineWidth=1;
    for(let i=1;i<this.lanes;i++){ctx.beginPath();ctx.moveTo(i*this.lw,0);ctx.lineTo(i*this.lw,this.h);ctx.stroke();}
    for(const h of this.hazards){
      const x=(h.lane+0.5)*this.lw;
      ctx.save();ctx.translate(x,h.y);ctx.rotate(h.spin);
      ctx.fillStyle=g.accent;
      if(h.type===0){ctx.fillRect(-10,-10,20,20);}
      else if(h.type===1){ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(12,10);ctx.lineTo(-12,10);ctx.closePath();ctx.fill();}
      else {ctx.beginPath();ctx.arc(0,0,11,0,TAU);ctx.fill();}
      ctx.restore();
    }
    for(const it of this.items){const x=(it.lane+0.5)*this.lw;glowDot(ctx,x,it.y,6,g.primary,14);}
    const px=(this.lane+0.5)*this.lw, py=this.h-34;
    glowDot(ctx,px,py,12,g.primary,26);
    ctx.fillStyle='#06080f';ctx.beginPath();ctx.arc(px-4,py-2,2,0,TAU);ctx.arc(px+4,py-2,2,0,TAU);ctx.fill();
    if(this.shieldLeft>0){ctx.strokeStyle=rgba('#4dff9e',.7);ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,18,0,TAU);ctx.stroke();}
    uiText(ctx,Math.max(0,Math.ceil(this.goal-this.elapsed))+'s',this.w-14,20,13,g.primary,'right');
  }
}

export default { snake:Snake, breakout:Breakout, pong:Pong, shooter:Shooter, dodger:Dodger };
