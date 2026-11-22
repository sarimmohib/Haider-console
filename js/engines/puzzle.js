/* Puzzle engines: merger, match3, slider, lightsout, codebreaker */
import { Engine, clamp, lerp, rnd, rint, pick, shuffle, rgba, mix, shade, roundRect, pixelText, uiText, glowDot, drawGrid, TAU } from '../core.js';

/* p: size, target, spawn, obstacles, mode */
class Merger extends Engine {
  start(level){
    super.start(level);
    this.n=clamp(this.p.size||4,3,6);
    this.target=Math.min(8192,(this.p.target||128)*Math.pow(2,Math.floor((level-1)/2)));
    this.grid=Array(this.n*this.n).fill(0);
    this.blocks=new Set();
    const obs=Math.min((this.p.obstacles||0)+Math.floor(level/4),this.n*this.n/6);
    let guard=0; while(this.blocks.size<obs&&guard++<100) this.blocks.add(rint(this.rng,0,this.n*this.n-1));
    this.addTile();this.addTile();
    this.scoreTotal=0;this.moves=0;this.anim=0;
    this.drag=null;
    this.setLives(3);
    this.setHint('REACH '+this.target+' · SWIPE / ARROWS');
    this.setProgress(0);
  }
  addTile(){ const free=[];for(let i=0;i<this.grid.length;i++)if(this.grid[i]===0&&!this.blocks.has(i))free.push(i);
    if(!free.length)return; const i=pick(this.rng,free);this.grid[i]=this.rng()<(this.p.spawn||0.9)?2:4;this.grid[i+'p']=0; }
  slide(dx,dy){
    const n=this.n;let moved=false;
    const order=[];
    for(let i=0;i<n;i++) for(let j=0;j<n;j++) order.push(dx>0?[n-1-j,i]:dx<0?[j,i]:dy>0?[i,n-1-j]:[i,j]);
    for(const [r,c] of order){
      if(this.blocks.has(r*n+c))continue;
      let cr=r,cc=c;
      while(true){
        const nr=cr+dy,nc=cc+dx;
        if(nr<0||nc<0||nr>=n||nc>=n)break;
        const idx=nr*n+nc;
        if(this.blocks.has(idx))break;
        if(this.grid[idx]===0){cr=nr;cc=nc;continue;}
        if(this.grid[idx]===this.grid[r*n+c]){
          this.grid[idx]*=2;this.grid[r*n+c]=0;
          this.scoreTotal+=this.grid[idx];this.score(this.grid[idx],0,0,'');
          this.burst((nc+.5)*this.cellW(),(nr+.5)*this.cellH(),this.theme.accent,10);
          this.sfx('good');moved=true;cr=nr;cc=nc;
          if(this.grid[idx]>=this.target){this.win();return;}
          break;
        }
        if(this.p.mode==='chain'&&this.grid[idx]<this.grid[r*n+c]){cr=nr;cc=nc;continue;}
        break;
      }
      if(cr!==r||cc!==c){this.grid[cr*n+cc]=this.grid[r*n+c];this.grid[r*n+c]=0;moved=true;}
    }
    if(this.p.mode==='reverse'&&moved){for(let i=0;i<this.grid.length;i++)this.grid[i]=this.grid[i]?Math.max(2,this.grid[i]/2):0;}
    if(moved){this.addTile();this.moves++;this.sfx('move');this.anim=1;
      const max=Math.max(...this.grid);this.setProgress(Math.log2(Math.max(2,max))/Math.log2(this.target));}
    else this.sfx('bad');
    if(!this.canMove()){
      this.sfx('bad');this.shake(8);this.lifeLost();
      this.grid.fill(0);this.addTile();this.addTile();
    }
  }
  canMove(){ const n=this.n;for(let r=0;r<n;r++)for(let c=0;c<n;c++){const i=r*n+c;if(this.blocks.has(i))continue;
    if(this.grid[i]===0)return true;
    if(c+1<n&&!this.blocks.has(i+1)&&this.grid[i+1]===this.grid[i])return true;
    if(r+1<n&&!this.blocks.has(i+n)&&this.grid[i+n]===this.grid[i])return true;
  }return false;}
  cellW(){return (this.w-40)/this.n;} cellH(){return (this.h-52)/this.n;}
  key(code,phase){ if(phase!=='down')return;
    if(code==='ArrowLeft'||code==='KeyA')this.slide(-1,0);
    if(code==='ArrowRight'||code==='KeyD')this.slide(1,0);
    if(code==='ArrowUp'||code==='KeyW')this.slide(0,-1);
    if(code==='ArrowDown'||code==='KeyS')this.slide(0,1);
  }
  pointer(x,y,phase){
    if(phase==='down')this.drag={x,y};
    if(phase==='up'&&this.drag){
      const dx=x-this.drag.x,dy=y-this.drag.y;
      if(Math.hypot(dx,dy)>20){if(Math.abs(dx)>Math.abs(dy))this.slide(dx>0?1:-1,0);else this.slide(0,dy>0?1:-1);}
      else {const r=Math.floor((y-26)/this.cellH()),c=Math.floor((x-20)/this.cellW());
        if(r>=0&&c>=0&&r<this.n&&c<this.n&&this.grid[r*this.n+c])this.sfx('blip');}
      this.drag=null;
    }
  }
  update(dt,input){this.anim=Math.max(0,this.anim-dt*3);}
  draw(ctx){
    const g=this.theme,n=this.n,cw=this.cellW(),ch=this.cellH();
    ctx.save();ctx.translate(20,26);
    roundRect(ctx,-4,-4,n*cw+8,n*ch+8,8,rgba('#000',.25),rgba(g.primary,.4));
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const i=r*n+c,x=c*cw+3,y=r*ch+3,w=cw-6,h=ch-6;
      roundRect(ctx,x,y,w,h,5,rgba(g.primary,.07),rgba(g.primary,.2));
      if(this.blocks.has(i)){ctx.fillStyle=shade(g.bg,-0.5);ctx.fillRect(x+4,y+4,w-8,h-8);ctx.fillStyle=rgba(g.accent,.5);ctx.fillRect(x+8,y+8,w-16,3);continue;}
      const v=this.grid[i];if(!v)continue;
      const t=clamp(Math.log2(v)/13,0,1);
      const col=mix(g.primary,g.accent,t);
      const s=1+this.anim*0.06;
      ctx.save();ctx.translate(x+w/2,y+h/2);ctx.scale(s,s);
      roundRect(ctx,-w/2,-h/2,w,h,5,col,rgba('#ffffff',.3));
      const fs=Math.max(9,Math.min(18,18-String(v).length*2));
      pixelText(ctx,v,0,1,fs,'#080a12','center');
      ctx.restore();
    }
    ctx.restore();
    uiText(ctx,'BEST '+this.scoreTotal,this.w-16,14,12,g.primary,'right');
  }
}

/* p: size, colors, goal, moves, obstacles */
class Match3 extends Engine {
  start(level){
    super.start(level);
    this.n=clamp(this.p.size||7,5,9);this.colors=clamp(this.p.colors||5,4,7);
    this.cw=(this.w-32)/this.n; this.ch=(this.h-56)/this.n;
    this.goalColor=rint(this.rng,0,this.colors-1);
    this.goalCount=12+level*4;
    this.collected=0;this.moves=(this.p.moves||16)+level*2;
    this.board=[];
    for(let i=0;i<this.n*this.n;i++)this.board.push(this.makeTile());
    this.clearInitial();
    this.sel=-1;this.busy=0;this.cascade=false;
    this.setLives(3);this.setHint('MATCH '+this.goalCount+' '+(this.goalColor+1)+'s');
    this.setProgress(0);
  }
  makeTile(){return {c:rint(this.rng,0,this.colors-1),pop:1};}
  clearInitial(){let guard=0;
    while(guard++<100){let found=false;
      for(let r=0;r<this.n;r++)for(let c=0;c<this.n;c++){
        const i=r*this.n+c;
        if(c>=2&&this.board[i].c===this.board[i-1].c&&this.board[i].c===this.board[i-2].c){this.board[i]=this.makeTile();found=true;}
        if(r>=2&&this.board[i].c===this.board[i-this.n].c&&this.board[i].c===this.board[i-2*this.n].c){this.board[i]=this.makeTile();found=true;}
      }
      if(!found)break;
    }
  }
  findMatches(){
    const set=new Set();
    for(let r=0;r<this.n;r++)for(let c=0;c<this.n;c++){
      const i=r*this.n+c,col=this.board[i].c;
      if(c<=this.n-3&&this.board[i+1].c===col&&this.board[i+2].c===col){set.add(i);set.add(i+1);set.add(i+2);}
      if(r<=this.n-3&&this.board[i+this.n].c===col&&this.board[i+2*this.n].c===col){set.add(i);set.add(i+this.n);set.add(i+2*this.n);}
    }
    return [...set];
  }
  swap(a,b){[this.board[a],this.board[b]]=[this.board[b],this.board[a]];}
  adjacent(a,b){const ar=Math.floor(a/this.n),ac=a%this.n,br=Math.floor(b/this.n),bc=b%this.n;return Math.abs(ar-br)+Math.abs(ac-bc)===1;}
  resolve(){
    const matches=this.findMatches();
    if(!matches.length){
      if(this.collected>=this.goalCount){this.win();return;}
      if(this.moves<=0){this.sfx('bad');this.shake(8);this.lifeLost();this.moves=(this.p.moves||16)+this.level*2;this.collected=0;this.clearInitial();this.setProgress(0);}
      this.busy=0;this.cascade=false;return;
    }
    let gained=0;
    for(const i of matches){
      const c=this.board[i].c;
      if(c===this.goalColor)this.collected++;
      gained+=25;
      this.burst(16+(i%this.n+.5)*this.cw,28+(Math.floor(i/this.n)+.5)*this.ch,COLORS[c],8);
      this.board[i]=this.makeTile();
    }
    this.scoreTotal=(this.scoreTotal||0)+gained;
    this.score(gained,0,0,'+');this.sfx(this.cascade?'combo':'score');
    if(this.cascade)this.float(this.w/2,32,'CASCADE x'+(this.cascade+1),this.theme.accent);
    this.cascade++;this.busy=0.16;
    this.setProgress(this.collected/this.goalCount);
  }
  key(code,phase){
    if(phase!=='down'||this.busy)return;
    const r=Math.floor(this.cursor/this.n)||0,c=this.cursor%this.n||0;
    let nr=r,nc=c;
    if(code==='ArrowLeft'||code==='KeyA')nc--;if(code==='ArrowRight'||code==='KeyD')nc++;
    if(code==='ArrowUp'||code==='KeyW')nr--;if(code==='ArrowDown'||code==='KeyS')nr++;
    if(nr<0||nc<0||nr>=this.n||nc>=this.n)return;
    const to=nr*this.n+nc;
    if(this.sel>=0){if(this.adjacent(this.sel,to)){this.swap(this.sel,to);this.moves--;this.sel=-1;this.busy=0.12;}else this.sel=to;}
    else this.sel=to;
    this.cursor=to;
  }
  pointer(x,y,phase){
    if(phase!=='down'||this.busy)return;
    const c=Math.floor((x-16)/this.cw),r=Math.floor((y-28)/this.ch);
    if(c<0||r<0||c>=this.n||r>=this.n)return;
    const i=r*this.n+c;
    if(this.sel<0){this.sel=i;this.sfx('blip');return;}
    if(this.sel===i){this.sel=-1;return;}
    if(this.adjacent(this.sel,i)){this.swap(this.sel,i);this.moves--;this.sel=-1;this.busy=0.12;this.sfx('move');}
    else {this.sel=i;this.sfx('blip');}
  }
  update(dt,input){
    if(this.busy>0){this.busy-=dt;if(this.busy<=0){if(this.cascade)this.resolve();else {const m=this.findMatches();if(m.length)this.resolve();}}}
    for(const t of this.board)t.pop=Math.max(0.7,t.pop-dt*1.5);
  }
  draw(ctx){
    const g=this.theme,n=this.n;
    ctx.save();ctx.translate(16,28);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const i=r*n+c,t=this.board[i],x=c*this.cw,y=r*this.ch;
      roundRect(ctx,x+2,y+2,this.cw-4,this.ch-4,4,rgba(g.primary,.08),rgba(g.primary,.16));
      const col=COLORS[t.c%COLORS.length];
      ctx.save();ctx.translate(x+this.cw/2,y+this.ch/2);ctx.scale(t.pop,t.pop);
      glowDot(ctx,0,0,Math.min(this.cw,this.ch)*0.3,col,Math.min(this.cw,this.ch)*0.55);
      ctx.fillStyle=shade(col,-0.25);
      const s=Math.min(this.cw,this.ch)*0.3;
      if(t.c%5===0){ctx.beginPath();ctx.arc(0,0,s,0,TAU);ctx.fill();}
      else if(t.c%5===1){ctx.fillRect(-s,-s,s*2,s*2);}
      else if(t.c%5===2){ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s,s);ctx.lineTo(-s,s);ctx.closePath();ctx.fill();}
      else if(t.c%5===3){ctx.beginPath();for(let k=0;k<5;k++){const a=-Math.PI/2+k*TAU/5;const px=Math.cos(a)*s,py=Math.sin(a)*s;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();}
      else {ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s,0);ctx.lineTo(0,s);ctx.lineTo(-s,0);ctx.closePath();ctx.fill();}
      if(t.c===this.goalColor){ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.strokeRect(-s-3,-s-3,(s+3)*2,(s+3)*2);}
      ctx.restore();
      if(this.sel===i){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,this.cw-2,this.ch-2);}
    }
    ctx.restore();
  }
}
const COLORS=['#ff4d6d','#ffd23f','#4dff9e','#4dc9ff','#c77dff','#ff8f4d','#fdf5e6'];

/* p: size, shuffleMoves, timeLimit, mode */
class Slider extends Engine {
  start(level){
    super.start(level);
    this.n=clamp(this.p.size||3,3,5);
    this.cw=(this.w-40)/this.n;this.ch=(this.h-56)/this.n;
    this.tiles=[];for(let i=0;i<this.n*this.n-1;i++)this.tiles.push(i);this.tiles.push(-1);
    let blank=this.tiles.length-1;
    const moves=(this.p.shuffleMoves||40)+level*16;
    for(let s=0;s<moves;s++){
      const r=Math.floor(blank/this.n),c=blank%this.n;const opts=[];
      if(r>0)opts.push(blank-this.n);if(r<this.n-1)opts.push(blank+this.n);
      if(c>0)opts.push(blank-1);if(c<this.n-1)opts.push(blank+1);
      const pickIdx=pick(this.rng,opts);[this.tiles[blank],this.tiles[pickIdx]]=[this.tiles[pickIdx],this.tiles[blank]];blank=pickIdx;
    }
    if(this.solved()){const a=this.tiles.findIndex(v=>v===-1);const b=a>=this.n?a-this.n:a+1;[this.tiles[a],this.tiles[b]]=[this.tiles[b],this.tiles[a]];}
    this.time=(this.p.timeLimit||0)||Math.max(20,90-level*4);
    this.solvedFlag=false;
    this.setLives(3);this.setHint('SOLVE THE PUZZLE · '+Math.round(this.time)+'s');
    this.setProgress(0);
  }
  solved(){return this.tiles.every((v,i)=>i===this.tiles.length-1?v===-1:v===i);}
  move(i){
    const blank=this.tiles.indexOf(-1);
    const ar=Math.floor(i/this.n),ac=i%this.n,br=Math.floor(blank/this.n),bc=blank%this.n;
    if(Math.abs(ar-br)+Math.abs(ac-bc)!==1){this.sfx('bad');return;}
    [this.tiles[i],this.tiles[blank]]=[this.tiles[blank],this.tiles[i]];
    this.sfx('move');this.score(20,i%this.n*40,0,'+');
    if(this.solved()){this.sfx('win');this.burst(this.w/2,this.h/2,this.theme.accent,50);this.win();}
    const solvedCount=this.tiles.filter((v,i)=>v===i&&v!==-1).length;
    this.setProgress(solvedCount/(this.tiles.length-1));
  }
  key(code,phase){
    if(phase!=='down')return;
    const blank=this.tiles.indexOf(-1),r=Math.floor(blank/this.n),c=blank%this.n;
    let nr=r,nc=c;
    if(code==='ArrowLeft'||code==='KeyA')nc--;if(code==='ArrowRight'||code==='KeyD')nc++;
    if(code==='ArrowUp'||code==='KeyW')nr--;if(code==='ArrowDown'||code==='KeyS')nr++;
    if(nr>=0&&nc>=0&&nr<this.n&&nc<this.n)this.move(nr*this.n+nc);
  }
  pointer(x,y,phase){ if(phase!=='down')return;
    const c=Math.floor((x-20)/this.cw),r=Math.floor((y-28)/this.ch);
    if(r>=0&&c>=0&&r<this.n&&c<this.n)this.move(r*this.n+c);
  }
  update(dt,input){
    if(this.p.timeLimit){this.time-=dt;
      if(this.time<=0){this.sfx('bad');this.shake(8);this.lifeLost();this.time=this.p.timeLimit;const a=this.tiles.indexOf(-1);const opts=[];
        if(a>=this.n)opts.push(a-this.n);if(a<this.n*(this.n-1))opts.push(a+this.n);if(a%this.n>0)opts.push(a-1);if(a%this.n<this.n-1)opts.push(a+1);
        const b=pick(this.rng,opts);[this.tiles[a],this.tiles[b]]=[this.tiles[b],this.tiles[a]];}
    }
  }
  draw(ctx){
    const g=this.theme,n=this.n;
    ctx.save();ctx.translate(20,28);
    roundRect(ctx,-4,-4,n*this.cw+8,n*this.ch+8,8,rgba('#000',.25),rgba(g.primary,.4));
    for(let i=0;i<this.tiles.length;i++){
      const v=this.tiles[i];if(v===-1)continue;
      const x=(i%n)*this.cw+2,y=Math.floor(i/n)*this.ch+2;
      const col=mix(g.primary,g.accent,v/(n*n));
      roundRect(ctx,x,y,this.cw-4,this.ch-4,4,col,rgba('#fff',.2));
      const label=this.p.mode==='color'?'':(v+1);
      if(label)pixelText(ctx,label,x+this.cw/2,y+this.ch/2,Math.min(16,this.cw*0.34),'#080a12','center');
      else {ctx.fillStyle=shade(g.bg,-0.5);ctx.beginPath();ctx.arc(x+this.cw/2,y+this.ch/2,this.cw*0.22,0,TAU);ctx.fill();}
    }
    ctx.restore();
    if(this.p.timeLimit)uiText(ctx,Math.ceil(this.time)+'s',this.w-16,14,13,g.primary,'right');
  }
}

/* p: size, pattern, movesLimit, mode */
class LightsOut extends Engine {
  start(level){
    super.start(level);
    this.n=clamp(this.p.size||4,3,6);
    this.cw=(this.w-60)/this.n;this.ch=(this.h-64)/this.n;
    this.pattern=this.p.pattern||'plus';this.mode=this.p.mode||'off';
    this.grid=Array(this.n*this.n).fill(this.mode==='on'?0:1);
    const scramble=8+level*3;
    for(let s=0;s<scramble;s++)this.toggle(rint(this.rng,0,this.n-1),rint(this.rng,0,this.n-1),true);
    if(this.isGoal())this.toggle(0,0,true);
    this.moves=(this.p.movesLimit||0)||Math.max(10,26-level);
    this.setLives(3);this.setHint('ALL LIGHTS '+(this.mode==='on'?'ON':'OFF'));
    this.setProgress(0);
  }
  neighbors(r,c){const out=[[r,c]];
    if(this.pattern==='plus')out.push([r-1,c],[r+1,c],[r,c-1],[r,c+1]);
    if(this.pattern==='square')for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)out.push([r+dr,c+dc]);
    if(this.pattern==='diag')out.push([r-1,c-1],[r-1,c+1],[r+1,c-1],[r+1,c+1]);
    return out.filter(([a,b])=>a>=0&&b>=0&&a<this.n&&b<this.n);
  }
  toggle(r,c,silent){for(const [a,b] of this.neighbors(r,c))this.grid[a*this.n+b]=1-this.grid[a*this.n+b];
    if(!silent){this.sfx('blip');this.moves--;const lit=this.isGoal();this.setProgress(this.litCount()/(this.n*this.n));
      if(lit){this.sfx('win');this.burst(this.w/2,this.h/2,this.theme.accent,50);this.win();}
      else if(this.moves<=0){this.sfx('bad');this.shake(8);this.lifeLost();this.moves=Math.max(10,26-this.level);}}
  }
  isGoal(){return this.grid.every(v=>this.mode==='on'?v===1:v===0);}
  litCount(){return this.grid.filter(v=>v===1).length;}
  key(code,phase){
    if(phase!=='down')return;
    let r=this.cursorR||0,c=this.cursorC||0;
    if(code==='ArrowLeft'||code==='KeyA')c--;if(code==='ArrowRight'||code==='KeyD')c++;
    if(code==='ArrowUp'||code==='KeyW')r--;if(code==='ArrowDown'||code==='KeyS')r++;
    r=clamp(r,0,this.n-1);c=clamp(c,0,this.n-1);this.cursorR=r;this.cursorC=c;
    if(code==='Space'||code==='Enter')this.toggle(r,c);
  }
  pointer(x,y,phase){if(phase!=='down')return;
    const c=Math.floor((x-30)/this.cw),r=Math.floor((y-32)/this.ch);
    if(r>=0&&c>=0&&r<this.n&&c<this.n)this.toggle(r,c);
  }
  update(){}
  draw(ctx){
    const g=this.theme,n=this.n;
    ctx.save();ctx.translate(30,32);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const x=c*this.cw+3,y=r*this.ch+3,v=this.grid[r*n+c];
      const on=this.mode==='on'?v===1:v===1;
      if(on)glowDot(ctx,x+this.cw/2,y+this.ch/2,Math.min(this.cw,this.ch)*0.24,g.primary,Math.min(this.cw,this.ch)*0.62);
      roundRect(ctx,x,y,this.cw-6,this.ch-6,4,on?rgba(g.primary,.9):rgba(g.primary,.08),on?'#fff':rgba(g.primary,.3));
    }
    ctx.restore();
    uiText(ctx,'MOVES '+this.moves,this.w-16,14,13,g.primary,'right');
  }
}

/* p: slots, colors, tries, mode */
class Codebreaker extends Engine {
  start(level){
    super.start(level);
    this.slots=clamp(this.p.slots||4,3,6);
    this.colors=clamp(this.p.colors||6,4,8);
    this.tries=(this.p.tries||7)+Math.floor(level/3);
    this.mode=this.p.mode||'color';
    this.secret=Array.from({length:this.slots},()=>rint(this.rng,0,this.colors-1));
    this.guess=Array(this.slots).fill(0);this.cursor=0;this.history=[];
    this.setLives(3);this.setHint('CRACK THE '+this.slots+'-CODE');this.setProgress(0);
  }
  submit(){
    const g=this.guess.slice();
    let exact=0,near=0;
    const sc=this.secret.slice(),gc=g.slice();
    for(let i=0;i<this.slots;i++)if(gc[i]===sc[i]){exact++;gc[i]=-1;sc[i]=-2;}
    for(let i=0;i<this.slots;i++)if(gc[i]>=0){const j=sc.indexOf(gc[i]);if(j>=0){near++;sc[j]=-2;}}
    this.history.push({g,exact,near});
    this.sfx('blip');
    if(exact===this.slots){this.sfx('win');this.burst(this.w/2,this.h/2,this.theme.accent,50);this.win();return;}
    if(this.history.length>=this.tries){this.sfx('bad');this.shake(10);this.lifeLost();this.secret=Array.from({length:this.slots},()=>rint(this.rng,0,this.colors-1));this.history=[];this.guess.fill(0);}
    this.setProgress(this.history.length/this.tries);
  }
  key(code,phase){
    if(phase!=='down')return;
    if(code==='ArrowLeft'||code==='KeyA')this.cursor=(this.cursor-1+this.slots)%this.slots;
    if(code==='ArrowRight'||code==='KeyD')this.cursor=(this.cursor+1)%this.slots;
    if(code==='ArrowUp'||code==='KeyW')this.guess[this.cursor]=(this.guess[this.cursor]+1)%this.colors;
    if(code==='ArrowDown'||code==='KeyS')this.guess[this.cursor]=(this.guess[this.cursor]-1+this.colors)%this.colors;
    if(code==='Digit'+this.cursor)this.guess[this.cursor]=(this.guess[this.cursor]+1)%this.colors;
    if(code==='Enter'||code==='Space')this.submit();
  }
  pointer(x,y,phase){
    if(phase!=='down')return;
    const gw=Math.min(38,(this.w-100)/this.slots);
    const sx=(this.w-(this.slots*gw))/2;
    if(y>28&&y<62){const i=Math.floor((x-sx)/gw);if(i>=0&&i<this.slots){this.cursor=i;this.guess[i]=(this.guess[i]+1)%this.colors;this.sfx('blip');return;}}
    const pw=(this.w-80)/this.colors;
    if(y>this.h-46&&y<this.h-12){const i=Math.floor((x-40)/pw);if(i>=0&&i<this.colors){this.guess[this.cursor]=i;this.cursor=(this.cursor+1)%this.slots;this.sfx('blip');return;}}
    if(y>this.h-84&&y<this.h-58)this.submit();
  }
  update(){}
  draw(ctx){
    const g=this.theme,s=this.slots,gw=Math.min(38,(this.w-100)/s),sx=(this.w-s*gw)/2;
    uiText(ctx,'TRIES '+Math.max(0,this.tries-this.history.length),this.w-14,14,12,g.primary,'right');
    for(let i=0;i<s;i++){
      const x=sx+i*gw+3,y=28;
      roundRect(ctx,x,y,gw-6,30,5,COLORS[this.guess[i]%COLORS.length],i===this.cursor?'#fff':rgba('#fff',.2),i===this.cursor?2:1);
      if(this.cursor===i){ctx.fillStyle=COLORS[this.guess[i]%COLORS.length];ctx.fillRect(x+gw/2-3,y+34,6,4);}
    }
    const rowH=Math.min(26,(this.h-190)/this.tries);
    for(let h=0;h<this.history.length;h++){
      const rec=this.history[h],y=76+h*rowH;
      for(let i=0;i<s;i++){const x=sx+i*gw+3;roundRect(ctx,x,y,gw-6,Math.min(18,rowH-4),3,COLORS[rec.g[i]%COLORS.length]);}
      uiText(ctx,rec.exact+'● '+rec.near+'○',sx+s*gw+8,y+8,11,g.accent,'left');
    }
    const pw=(this.w-80)/this.colors,py=this.h-46;
    for(let i=0;i<this.colors;i++)roundRect(ctx,40+i*pw+2,py,pw-4,26,4,COLORS[i%COLORS.length],rgba('#fff',.2));
    roundRect(ctx,this.w/2-46,this.h-84,92,20,4,g.primary,'#fff');
    uiText(ctx,'SUBMIT',this.w/2,this.h-74,11,'#080a12','center');
  }
}

export default { merger:Merger, match3:Match3, slider:Slider, lightsout:LightsOut, codebreaker:Codebreaker };
