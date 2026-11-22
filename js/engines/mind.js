/* Mind engines: maze, memory, stacker, sorter, trap */
import { Engine, clamp, lerp, rnd, rint, pick, shuffle, rgba, mix, shade, roundRect, pixelText, uiText, glowDot, drawGrid, TAU } from '../core.js';

/* p: size, fog, timeLimit, keys, enemies, mode */
class Maze extends Engine {
  start(level){
    super.start(level);
    this.n=clamp(this.p.size||9,7,15)|1;
    this.fog=!!this.p.fog;this.time=this.p.timeLimit||0;
    this.keyCount=this.p.keys?Math.min(3,1+Math.floor(level/3)):0;this.hasKeys=0;
    this.enemies=[];this.enemyCount=this.p.enemies||0;
    this.generate();
    this.setLives(3);this.setHint(this.keyCount?'FIND KEYS THEN EXIT':'REACH THE EXIT');this.setProgress(0);
  }
  generate(){
    const n=this.n;
    this.g=Array.from({length:n},()=>Array(n).fill(1));
    const stack=[[1,1]];this.g[1][1]=0;
    while(stack.length){
      const [x,y]=stack[stack.length-1];
      const dirs=shuffle(this.rng,[[2,0],[-2,0],[0,2],[0,-2]]);
      let carved=false;
      for(const [dx,dy] of dirs){
        const nx=x+dx,ny=y+dy;
        if(nx>0&&ny>0&&nx<n-1&&ny<n-1&&this.g[ny][nx]===1){
          this.g[y+dy/2][x+dx/2]=0;this.g[ny][nx]=0;stack.push([nx,ny]);carved=true;break;
        }
      }
      if(!carved)stack.pop();
    }
    this.g[n-2][n-2]=0;
    this.player={x:1,y:1};
    this.exit={x:n-2,y:n-2};
    this.keys=[];
    const floors=[];
    for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++)if(this.g[y][x]===0&&!(x===1&&y===1)&&!(x===n-2&&y===n-2))floors.push({x,y});
    const sh=shuffle(this.rng,floors);
    for(let i=0;i<this.keyCount;i++)this.keys.push(sh[i%sh.length]);
    this.enemies=[];
    for(let i=0;i<this.enemyCount+Math.floor(this.level/4);i++){
      const f=sh[(i*5+3)%sh.length];if(f)this.enemies.push({x:f.x,y:f.y,t:rnd(this.rng,0,TAU)});
    }
    this.cell=Math.floor(Math.min((this.w-24)/n,(this.h-36)/n));
    this.ox=Math.floor((this.w-n*this.cell)/2);this.oy=Math.floor((this.h-n*this.cell)/2)+6;
  }
  move(dx,dy){
    const p=this.player,nx=p.x+dx,ny=p.y+dy;
    if(nx<0||ny<0||nx>=this.n||ny>=this.n||this.g[ny][nx]===1){this.sfx('bad');return;}
    p.x=nx;p.y=ny;this.sfx('move');
    const ki=this.keys.findIndex(k=>k.x===nx&&k.y===ny);
    if(ki>=0){this.keys.splice(ki,1);this.hasKeys++;this.sfx('power');this.burst(this.ox+(nx+.5)*this.cell,this.oy+(ny+.5)*this.cell,this.theme.accent,16);}
    if(nx===this.exit.x&&ny===this.exit.y){
      if(this.hasKeys>=this.keyCount){this.sfx('win');this.burst(this.w/2,this.h/2,this.theme.accent,50);this.win();}
      else {this.float(this.w/2,40,'NEED '+this.keyCount+' KEYS!',this.theme.accent);this.sfx('bad');}
    }
    this.setProgress((Math.abs(nx-this.exit.x)+Math.abs(ny-this.exit.y))?clamp(1-(Math.abs(nx-this.exit.x)+Math.abs(ny-this.exit.y))/(this.n*2),0,1):1);
  }
  key(code,phase){
    if(phase!=='down')return;
    if(code==='ArrowLeft'||code==='KeyA')this.move(-1,0);
    if(code==='ArrowRight'||code==='KeyD')this.move(1,0);
    if(code==='ArrowUp'||code==='KeyW')this.move(0,-1);
    if(code==='ArrowDown'||code==='KeyS')this.move(0,1);
  }
  pointer(x,y,phase){
    if(phase!=='down')return;
    const c=Math.floor((x-this.ox)/this.cell),r=Math.floor((y-this.oy)/this.cell);
    const dx=c-this.player.x,dy=r-this.player.y;
    if(Math.abs(dx)+Math.abs(dy)===1)this.move(dx,dy);
  }
  update(dt,input){
    if(this.time){this.time-=dt;if(this.time<=0){this.sfx('bad');this.lifeLost();this.time=this.p.timeLimit;}}
    for(const e of this.enemies){
      e.t-=dt;if(e.t>0)continue;e.t=rnd(this.rng,.35,.8);
      const opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>this.g[e.y+dy]&&this.g[e.y+dy][e.x+dx]===0);
      if(!opts.length)continue;
      let choice;
      if(this.rng()<0.6+this.level*0.02){
        const cur=Math.abs(e.x-this.player.x)+Math.abs(e.y-this.player.y);
        opts.sort((a,b)=>(Math.abs(e.x+a[0]-this.player.x)+Math.abs(e.y+a[1]-this.player.y))-(Math.abs(e.x+b[0]-this.player.x)+Math.abs(e.y+b[1]-this.player.y)));
        choice=opts[0];if(cur>Math.abs(e.x+choice[0]-this.player.x)+Math.abs(e.y+choice[1]-this.player.y))choice=opts[0];else choice=pick(this.rng,opts);
      } else choice=pick(this.rng,opts);
      e.x+=choice[0];e.y+=choice[1];
      if(e.x===this.player.x&&e.y===this.player.y){this.sfx('bad');this.shake(10);this.flash('#ff3b6b',.35);this.lifeLost();this.player.x=1;this.player.y=1;}
    }
  }
  draw(ctx){
    const g=this.theme,n=this.n,c=this.cell;
    ctx.save();ctx.translate(this.ox,this.oy);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const wx=x*c,wy=y*c;
      if(this.fog&&Math.abs(x-this.player.x)+Math.abs(y-this.player.y)>4){ctx.fillStyle=shade(g.bg,-0.6);ctx.fillRect(wx,wy,c,c);continue;}
      if(this.g[y][x]===1){ctx.fillStyle=shade(g.primary,-0.62);ctx.fillRect(wx,wy,c,c);ctx.fillStyle=rgba(g.primary,.12);ctx.fillRect(wx,wy,c,2);}
      else {ctx.fillStyle=rgba(g.primary,.05);ctx.fillRect(wx,wy,c,c);}
    }
    const ex=this.exit.x*c,ey=this.exit.y*c;
    glowDot(ctx,ex+c/2,ey+c/2,c*.28,g.accent,c*.75);
    for(const k of this.keys)uiText(ctx,'◆',k.x*c+c/2,k.y*c+c/2,Math.min(16,c*.8),'#ffd23f','center');
    for(const e of this.enemies){roundRect(ctx,e.x*c+2,e.y*c+2,c-4,c-4,3,g.accent);ctx.fillStyle='#080a12';ctx.fillRect(e.x*c+c*.3,e.y*c+c*.4,2,2);ctx.fillRect(e.x*c+c*.65,e.y*c+c*.4,2,2);}
    const p=this.player;glowDot(ctx,p.x*c+c/2,p.y*c+c/2,c*.3,g.primary,c*.9);
    ctx.restore();
    uiText(ctx,this.hasKeys+'/'+this.keyCount+' KEYS',this.w-14,14,11,g.primary,'right');
  }
}

/* p: pairs, timeLimit, preview, mode, face */
class Memory extends Engine {
  start(level){
    super.start(level);
    this.mode=this.p.mode||'pairs';
    if(this.mode==='pairs'){
      this.pairs=clamp(this.p.pairs||6,4,12);
      this.cols=this.pairs<=6?4:this.pairs<=8?4:5;
      this.rows=Math.ceil(this.pairs*2/this.cols);
      const faces=shuffle(this.rng,Array.from({length:this.pairs},(_,i)=>i));
      const deck=shuffle(this.rng,[...faces,...faces]);
      this.cards=deck.map(v=>({v,up:false,done:false}));
      this.cw=(this.w-40)/this.cols;this.ch=(this.h-64)/this.rows;
      this.sel=-1;this.matched=0;this.preview=this.p.preview||1.2;
      this.cards.forEach(c=>c.up=true);
      this.time=this.p.timeLimit||0;
      this.setHint('MATCH ALL '+this.pairs+' PAIRS');
    } else {
      this.seq=[];this.len=3+level;
      for(let i=0;i<this.len;i++)this.seq.push(rint(this.rng,0,5));
      this.index=0;this.showing=true;this.timer=0.6;this.flash=-1;
      this.rounds=0;this.goal=4+level;
      this.setHint('REMEMBER & REPEAT');
    }
    this.setLives(3);this.setProgress(0);
  }
  flip(i){
    const c=this.cards[i];
    if(c.up||c.done||this.busy)return;
    c.up=true;this.sfx('blip');
    if(this.sel<0){this.sel=i;return;}
    const prev=this.cards[this.sel];
    if(prev.v===c.v){prev.done=true;c.done=true;this.matched++;this.sel=-1;this.sfx('score');
      this.burst(20+(i%this.cols+.5)*this.cw,32+(Math.floor(i/this.cols)+.5)*this.ch,this.theme.accent,14);
      this.score(100,0,0,'+');
      if(this.matched>=this.pairs){this.sfx('win');this.win();}
    } else {this.busy=0.7;this.sfx('bad');const a=this.sel,b=i;
      setTimeout(()=>{this.cards[a].up=false;this.cards[b].up=false;this.sel=-1;this.busy=0;},700);}
    this.setProgress(this.matched/this.pairs);
  }
  tapSym(i){
    if(this.showing)return;
    if(i===this.seq[this.index]){
      this.index++;this.sfx('good');this.burst(20+i*((this.w-40)/6)+((this.w-40)/6)/2,this.h-56,this.theme.primary,10);
      if(this.index>=this.seq.length){this.rounds++;this.score(200,0,0,'+');this.sfx('score');
        if(this.rounds>=this.goal){this.sfx('win');this.win();return;}
        this.seq.push(rint(this.rng,0,5));this.showing=true;this.timer=0.8;this.index=0;}
    } else {this.sfx('bad');this.shake(8);this.lifeLost();this.showing=true;this.timer=0.8;this.index=0;}
    this.setProgress(this.rounds/this.goal);
  }
  key(code,phase){
    if(phase!=='down')return;
    if(this.mode==='pairs'){
      const map={ArrowLeft:-1,KeyA:-1,ArrowRight:1,KeyD:1,ArrowUp:-this.cols,KeyW:-this.cols,ArrowDown:this.cols,KeyS:this.cols};
      if(map[code]!==undefined)this.cursor=clamp((this.cursor||0)+map[code],0,this.cards.length-1);
      if(code==='Space'||code==='Enter')this.flip(this.cursor||0);
    } else {
      if(code>='Digit1'&&code<='Digit6')this.tapSym(Number(code.slice(5))-1);
      const map={ArrowLeft:0,KeyA:0,ArrowDown:1,KeyS:1,ArrowUp:2,KeyW:2,ArrowRight:3,KeyD:3,Space:4,Enter:5};
      if(map[code]!==undefined)this.tapSym(map[code]);
    }
  }
  pointer(x,y,phase){
    if(phase!=='down')return;
    if(this.mode==='pairs'){
      const c=Math.floor((x-20)/this.cw),r=Math.floor((y-32)/this.ch);
      if(c>=0&&r>=0&&c<this.cols&&r<this.rows)this.flip(r*this.cols+c);
    } else {
      if(y>this.h-92&&y<this.h-26){const sw=(this.w-40)/6;const i=Math.floor((x-20)/sw);if(i>=0&&i<6)this.tapSym(i);}
    }
  }
  update(dt,input){
    if(this.mode==='pairs'){
      if(this.preview>0){this.preview-=dt;if(this.preview<=0)this.cards.forEach(c=>{if(!c.done)c.up=false;});}
      if(this.time){this.time-=dt;if(this.time<=0){this.sfx('bad');this.lifeLost();this.time=this.p.timeLimit;
        this.cards.forEach(c=>{c.up=false;c.done=false;});this.cards=shuffle(this.rng,this.cards);this.matched=0;this.sel=-1;this.setProgress(0);}}
    } else {
      this.timer-=dt;
      if(this.showing&&this.timer<=0){
        if(this.index<this.seq.length){this.flash=this.seq[this.index];this.index++;this.sfx('blip');this.timer=.45;}
        else {this.flash=-1;this.showing=false;this.index=0;this.timer=4;}
      }
      if(!this.showing){this.timer-=dt*0;if(this.timer<=0){this.sfx('bad');this.lifeLost();this.showing=true;this.timer=.7;this.index=0;}}
    }
  }
  draw(ctx){
    const g=this.theme;
    if(this.mode==='pairs'){
      for(let i=0;i<this.cards.length;i++){
        const c=this.cards[i],x=20+(i%this.cols)*this.cw,y=32+Math.floor(i/this.cols)*this.ch;
        if(c.up&&!c.done){
          const col=[g.primary,g.accent,'#ffd23f','#4dc9ff','#c77dff','#4dff9e'][c.v%6];
          roundRect(ctx,x+2,y+2,this.cw-4,this.ch-4,5,col,rgba('#fff',.35));
          uiText(ctx,String(c.v+1),x+this.cw/2,y+this.ch/2,Math.min(22,this.cw*.42),'#080a12','center');
        } else {
          roundRect(ctx,x+2,y+2,this.cw-4,this.ch-4,5,c.done?rgba(g.accent,.22):rgba(g.primary,.12),c.done?g.accent:rgba(g.primary,.35));
          if(c.done)uiText(ctx,'✓',x+this.cw/2,y+this.ch/2,Math.min(20,this.cw*.4),g.accent,'center');
        }
      }
    } else {
      uiText(ctx,this.showing?'WATCH...':'YOUR TURN',this.w/2,44,15,g.accent,'center');
      const sw=(this.w-40)/6;
      for(let i=0;i<6;i++){
        const col=this.flash===i?'#ffffff':[g.primary,g.accent,'#ffd23f','#4dc9ff','#c77dff','#4dff9e'][i];
        roundRect(ctx,20+i*sw+3,this.h-92,sw-6,62,7,col,rgba('#fff',.25));
      }
      uiText(ctx,'ROUND '+this.rounds+' / '+this.goal,this.w/2,24,12,g.primary,'center');
    }
  }
}

/* p: speed, pieceSet, goal, garbage */
class Stacker extends Engine {
  start(level){
    super.start(level);
    this.cols=10;this.rows=18;
    this.cell=Math.min(14,Math.floor((this.h-32)/this.rows));
    this.ox=Math.floor((this.w-this.cols*this.cell)/2)-30;this.oy=16;
    this.board=Array.from({length:this.rows},()=>Array(this.cols).fill(0));
    this.shapes={tetromino:[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]],
      domino:[[[1,1]],[[1],[1]],[[1,0],[1,0]]],
      single:[[[1]]]};
    this.set=this.p.pieceSet||'tetromino';
    this.dropInterval=Math.max(.28,(this.p.speed||0.85)-level*0.035);
    this.timer=0;this.lines=0;this.goal=5+level;
    this.spawn();
    this.garbage=(this.p.garbage||0)?Math.max(6,14-level):0;this.gTimer=this.garbage;
    this.setLives(3);this.setHint('CLEAR '+this.goal+' LINES');this.setProgress(0);
  }
  spawn(){
    const shapes=this.shapes[this.set]||this.shapes.tetromino;
    const m=pick(this.rng,shapes).map(r=>r.slice());
    this.cur={m,x:Math.floor((this.cols-m[0].length)/2),y:0};
    if(this.collides(this.cur)){this.sfx('bad');this.shake(10);this.lifeLost();
      this.board=Array.from({length:this.rows},()=>Array(this.cols).fill(0));this.spawn();}
  }
  collides(piece,dx=0,dy=0){
    for(let y=0;y<piece.m.length;y++)for(let x=0;x<piece.m[y].length;x++){
      if(!piece.m[y][x])continue;
      const px=piece.x+x+dx,py=piece.y+y+dy;
      if(px<0||px>=this.cols||py>=this.rows)return true;
      if(py>=0&&this.board[py][px])return true;
    }return false;
  }
  rotate(){
    const m=this.cur.m;
    const rot=m[0].map((_,i)=>m.map(row=>row[i]).reverse());
    const test={...this.cur,m:rot};
    if(!this.collides(test)){this.cur=test;this.sfx('blip');}
  }
  lock(){
    for(let y=0;y<this.cur.m.length;y++)for(let x=0;x<this.cur.m[y].length;x++){
      if(this.cur.m[y][x]){const py=this.cur.y+y;if(py>=0)this.board[py][this.cur.x+x]=1+Math.floor(this.level/2)%5;}
    }
    let cleared=0;
    for(let y=this.rows-1;y>=0;y--){if(this.board[y].every(v=>v)){this.board.splice(y,1);this.board.unshift(Array(this.cols).fill(0));cleared++;y++;}}
    if(cleared){this.lines+=cleared;this.sfx('combo');this.score(200*cleared,this.w/2,this.h/2,'+');
      this.shake(6);this.burst(this.w/2,this.h/2,this.theme.accent,30);this.setProgress(this.lines/this.goal);
      if(this.lines>=this.goal){this.sfx('win');this.win();return;}}
    this.spawn();
  }
  step(){
    if(!this.collides(this.cur,0,1))this.cur.y++;
    else this.lock();
  }
  key(code,phase){
    if(phase!=='down')return;
    if((code==='ArrowLeft'||code==='KeyA')&&!this.collides(this.cur,-1,0)){this.cur.x--;this.sfx('move');}
    if((code==='ArrowRight'||code==='KeyD')&&!this.collides(this.cur,1,0)){this.cur.x++;this.sfx('move');}
    if(code==='ArrowUp'||code==='KeyW')this.rotate();
    if(code==='ArrowDown'||code==='KeyS'){this.step();this.score(5,0,0,'');}
    if(code==='Space'||code==='Enter'){while(!this.collides(this.cur,0,1))this.cur.y++;this.sfx('jump');this.lock();}
  }
  pointer(x,y,phase){
    if(phase!=='down')return;
    if(x>this.ox+this.cols*this.cell+10){
      if(y<this.h/2)this.rotate();else {while(!this.collides(this.cur,0,1))this.cur.y++;this.lock();}
      return;
    }
    const c=Math.floor((x-this.ox)/this.cell);
    const target=clamp(c-Math.floor(this.cur.m[0].length/2),0,this.cols-this.cur.m[0].length);
    let guard=0;while(this.cur.x!==target&&guard++<12)this.cur.x+=Math.sign(target-this.cur.x);
  }
  update(dt,input){
    if(input.justPressed('Space')||input.justPressed('Enter')){while(!this.collides(this.cur,0,1))this.cur.y++;this.sfx('jump');this.lock();if(this.dead)return;}
    if(input.justPressed('ArrowUp')||input.justPressed('KeyW'))this.rotate();
    this.timer-=dt;if(this.timer<=0){this.timer=this.dropInterval;this.step();if(this.dead)return;}
    if(this.garbage){this.gTimer-=dt;if(this.gTimer<=0){this.gTimer=this.garbage;
      this.board.shift();const row=Array(this.cols).fill(0);row[rint(this.rng,0,this.cols-1)]=0;this.board.push(row);
      if(this.collides(this.cur)){this.sfx('bad');this.lifeLost();this.board=Array.from({length:this.rows},()=>Array(this.cols).fill(0));}
    }}
  }
  draw(ctx){
    const g=this.theme,c=this.cell;
    ctx.fillStyle=rgba('#000',.3);ctx.fillRect(this.ox-2,this.oy-2,this.cols*c+4,this.rows*c+4);
    for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){
      const v=this.board[y][x];
      if(v){const col=mix(g.primary,g.accent,(v%5)/4);roundRect(ctx,this.ox+x*c+1,this.oy+y*c+1,c-2,c-2,2,col,rgba('#fff',.15));}
      else {ctx.fillStyle=rgba(g.primary,.04);ctx.fillRect(this.ox+x*c,this.oy+y*c,c,c);}
    }
    for(let y=0;y<this.cur.m.length;y++)for(let x=0;x<this.cur.m[y].length;x++){
      if(!this.cur.m[y][x])continue;
      roundRect(ctx,this.ox+(this.cur.x+x)*c+1,this.oy+(this.cur.y+y)*c+1,c-2,c-2,2,g.accent,rgba('#fff',.4));
    }
    uiText(ctx,'LINES '+this.lines+'/'+this.goal,this.ox+this.cols*c+12,40,11,g.primary,'left');
    uiText(ctx,'NEXT',this.ox+this.cols*c+12,80,11,g.primary,'left');
  }
}

/* p: mode, bins, speed, lives */
class Sorter extends Engine {
  start(level){
    super.start(level);
    this.mode=this.p.mode||'color';
    this.bins=clamp(this.p.bins||3,2,4);
    this.speed=(this.p.speed||55)+level*6;
    this.bw=(this.w-40)/this.bins;
    this.items=[];this.timer=0;
    this.goal=10+level*3;this.sorted=0;this.cursor=0;
    this.setLives(this.p.lives||3);this.setHint('SORT INTO THE RIGHT BIN');
    this.setProgress(0);
  }
  spawn(){
    const v=rint(this.rng,0,this.bins-1);
    this.items.push({x:rnd(this.rng,40,this.w-40),y:-16,v,spin:rnd(this.rng,0,TAU)});
  }
  drop(bin){
    let best=null,bd=1e9;
    for(const it of this.items)if(it.y>this.h-150&&it.y<this.h-30&&Math.abs(it.x-(20+bin*this.bw+this.bw/2))<this.bw/2+24){
      const d=Math.abs(it.y-(this.h-70));if(d<bd){bd=d;best=it;}
    }
    this.sfx('blip');
    if(!best){return;}
    if(best.v===bin){this.sorted++;this.score(100,20+bin*this.bw+this.bw/2,this.h-70,'+');this.sfx('score');
      this.burst(20+bin*this.bw+this.bw/2,this.h-70,this.theme.accent,14);
      if(this.sorted>=this.goal){this.sfx('win');this.win();}
    } else {this.sfx('bad');this.shake(8);this.lifeLost();}
    this.items.splice(this.items.indexOf(best),1);
    this.setProgress(this.sorted/this.goal);
  }
  key(code,phase){
    if(phase!=='down')return;
    if(code==='ArrowLeft'||code==='KeyA')this.cursor=Math.max(0,this.cursor-1);
    if(code==='ArrowRight'||code==='KeyD')this.cursor=Math.min(this.bins-1,this.cursor+1);
    if(code==='Space'||code==='Enter')this.drop(this.cursor);
    if(code>='Digit1'&&code<='Digit4')this.drop(Number(code.slice(5))-1);
  }
  pointer(x,y,phase){if(phase!=='down')return;
    const b=Math.floor((x-20)/this.bw);if(b>=0&&b<this.bins)this.drop(b);
  }
  update(dt,input){
    if(input.justPressed('Space')||input.justPressed('Enter'))this.drop(this.cursor);
    this.timer-=dt;if(this.timer<=0){this.timer=Math.max(.45,1.5-this.level*.05)*rnd(this.rng,.8,1.2);this.spawn();}
    for(const it of this.items){it.y+=this.speed*dt;it.spin+=dt*2;}
    for(let i=this.items.length-1;i>=0;i--){const it=this.items[i];
      if(it.y>this.h-28){this.items.splice(i,1);this.sfx('bad');this.lifeLost();}
    }
  }
  draw(ctx){
    const g=this.theme;
    drawGrid(ctx,this.w,this.h,24,g.primary,.04);
    for(const it of this.items){
      const col=SORT_COLORS[it.v%SORT_COLORS.length];
      ctx.save();ctx.translate(it.x,it.y);ctx.rotate(it.spin);
      if(this.mode==='shape'&&it.v%3===0){ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,10,0,TAU);ctx.fill();}
      else if(this.mode==='number'){roundRect(ctx,-11,-11,22,22,4,col);uiText(ctx,String(it.v+1),0,1,13,'#080a12','center');}
      else roundRect(ctx,-11,-11,22,22,4,col);
      ctx.restore();
    }
    for(let b=0;b<this.bins;b++){
      const x=20+b*this.bw;
      roundRect(ctx,x+2,this.h-64,this.bw-4,54,6,rgba(SORT_COLORS[b%SORT_COLORS.length],.18),SORT_COLORS[b%SORT_COLORS.length],b===this.cursor?3:1);
      uiText(ctx,this.mode==='number'?String(b+1):this.mode==='shape'?['●','■','▲','◆'][b]:['RED','BLUE','GREEN','GOLD'][b],x+this.bw/2,this.h-38,11,SORT_COLORS[b%SORT_COLORS.length],'center');
    }
    uiText(ctx,this.sorted+' / '+this.goal,this.w/2,20,12,g.primary,'center');
  }
}
const SORT_COLORS=['#ff4d6d','#4dc9ff','#4dff9e','#ffd23f','#c77dff'];

/* p: mode, speed, safe, lives */
class Trap extends Engine {
  start(level){
    super.start(level);
    this.mode=this.p.mode||'shrink';
    this.x=this.w/2;this.y=this.h/2;this.r=11;
    this.speed=(this.p.speed||130)+level*8;
    this.goal=12+level*2;this.elapsed=0;
    this.obstacles=[];this.spawn=0;
    this.safeR=Math.min(this.w,this.h)*0.42*(this.p.safe||1);
    this.chaser={x:30,y:30};this.invuln=0;
    this.setLives(this.p.lives||3);this.setHint('SURVIVE '+this.goal+' SECONDS');this.setProgress(0);
  }
  key(code,phase){}
  pointer(x,y,phase){}
  update(dt,input){
    this.invuln=Math.max(0,this.invuln-dt);
    let dx=(input.isDown('ArrowRight')||input.isDown('KeyD')?1:0)-(input.isDown('ArrowLeft')||input.isDown('KeyA')?1:0);
    let dy=(input.isDown('ArrowDown')||input.isDown('KeyS')?1:0)-(input.isDown('ArrowUp')||input.isDown('KeyW')?1:0);
    if(input.pointer.down){dx=clamp(input.pointer.x-this.x,-30,30)/30;dy=clamp(input.pointer.y-this.y,-30,30)/30;}
    const len=Math.hypot(dx,dy)||1;
    this.x=clamp(this.x+dx/len*this.speed*dt,this.r,this.w-this.r);
    this.y=clamp(this.y+dy/len*this.speed*dt,this.r+18,this.h-this.r);
    this.elapsed+=dt;
    if(this.mode==='shrink'){
      this.safeR=Math.max(40,Math.min(this.w,this.h)*0.42*(this.p.safe||1)-this.elapsed*4.5);
      if(Math.hypot(this.x-this.w/2,this.y-this.h/2)>this.safeR-this.r)this.hit();
    } else if(this.mode==='walls'){
      this.spawn-=dt;
      if(this.spawn<=0){this.spawn=Math.max(.35,1.1-this.level*.05);
        const horiz=this.rng()<.5;
        this.obstacles.push(horiz?{x:0,y:rnd(this.rng,40,this.h-40),w:this.w,h:10,t:rnd(this.rng,0,TAU)}
          :{x:rnd(this.rng,40,this.w-40),y:20,w:10,h:this.h,t:rnd(this.rng,0,TAU)});}
      for(const o of this.obstacles){
        if(o.w>o.h){o.y+=Math.sin(this.elapsed*2+o.t)*22*dt;}
        else {o.x+=Math.sin(this.elapsed*2+o.t)*22*dt;}
        if(this.x>o.x-this.r&&this.x<o.x+o.w+this.r&&this.y>o.y-this.r&&this.y<o.y+o.h+this.r)this.hit();
      }
    } else {
      const a=Math.atan2(this.y-this.chaser.y,this.x-this.chaser.x);
      const cs=this.speed*0.7*(1+this.level*.02);
      this.chaser.x+=Math.cos(a)*cs*dt;this.chaser.y+=Math.sin(a)*cs*dt;
      if(Math.hypot(this.x-this.chaser.x,this.y-this.chaser.y)<this.r+10)this.hit();
    }
    this.setProgress(this.elapsed/this.goal);
    if(this.elapsed>=this.goal){this.sfx('win');this.win();}
  }
  hit(){if(this.invuln>0)return;this.invuln=1.2;this.sfx('bad');this.shake(12);this.flash('#ff3b6b',.35);this.burst(this.x,this.y,this.theme.accent,20);this.lifeLost();}
  draw(ctx){
    const g=this.theme;
    drawGrid(ctx,this.w,this.h,24,g.primary,.05);
    ctx.strokeStyle=rgba(g.primary,.35);ctx.lineWidth=2;ctx.strokeRect(10,26,this.w-20,this.h-36);
    if(this.mode==='shrink'){
      ctx.strokeStyle=rgba(g.accent,.8);ctx.lineWidth=3;ctx.beginPath();ctx.arc(this.w/2,this.h/2,this.safeR,0,TAU);ctx.stroke();
      ctx.fillStyle=rgba(g.accent,.06);ctx.beginPath();ctx.arc(this.w/2,this.h/2,this.safeR,0,TAU);ctx.fill();
    }
    if(this.mode==='walls')for(const o of this.obstacles){ctx.fillStyle=g.accent;roundRect(ctx,o.x,o.y,o.w,o.h,3);}
    if(this.mode==='chase'){glowDot(ctx,this.chaser.x,this.chaser.y,12,g.accent,26);
      ctx.fillStyle='#080a12';ctx.fillRect(this.chaser.x-4,this.chaser.y-2,3,3);ctx.fillRect(this.chaser.x+1,this.chaser.y-2,3,3);}
    if(this.invuln>0&&Math.floor(this.invuln*12)%2===0)ctx.globalAlpha=.4;
    glowDot(ctx,this.x,this.y,this.r,g.primary,26);ctx.globalAlpha=1;
    uiText(ctx,Math.ceil(this.goal-this.elapsed)+'s',this.w-16,14,12,g.primary,'right');
  }
}

export default { maze:Maze, memory:Memory, stacker:Stacker, sorter:Sorter, trap:Trap };
