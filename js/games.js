/* 100 distinct games. Each maps to an engine with its own theme + rule twist. */
const P = {
  void:    {bg:'#0b0a1f',primary:'#7c5cff',accent:'#00e5ff',ink:'#eef0ff'},
  ember:   {bg:'#1a0b12',primary:'#ff5c35',accent:'#ffd23f',ink:'#fff1e6'},
  toxic:   {bg:'#071a14',primary:'#39ff9e',accent:'#d6ff3f',ink:'#e9ffe9'},
  cyber:   {bg:'#07121f',primary:'#00d4ff',accent:'#ff2e88',ink:'#e6f7ff'},
  royal:   {bg:'#130b26',primary:'#b06cff',accent:'#ffcf4d',ink:'#f4ecff'},
  blood:   {bg:'#1a060b',primary:'#ff3b5c',accent:'#ff9e3d',ink:'#ffe9ec'},
  arctic:  {bg:'#071820',primary:'#6ee7ff',accent:'#ffffff',ink:'#eaffff'},
  solar:   {bg:'#21130a',primary:'#ffb020',accent:'#ff5e5b',ink:'#fff4e0'},
  matrix:  {bg:'#03120c',primary:'#00ff88',accent:'#aaffcc',ink:'#d9ffe9'},
  candy:   {bg:'#1b0a1f',primary:'#ff6fd8',accent:'#7df9ff',ink:'#ffe9ff'},
  steel:   {bg:'#10151c',primary:'#8ea9c2',accent:'#4dffbc',ink:'#e8f2ff'},
  sunset:  {bg:'#1d0e1a',primary:'#ff7ab6',accent:'#ffc371',ink:'#ffeaf3'},
  ocean:   {bg:'#041521',primary:'#2fa8ff',accent:'#4dffe0',ink:'#e0f6ff'},
  lava:    {bg:'#190803',primary:'#ff6b2c',accent:'#ffe066',ink:'#fff0e0'},
  neon:    {bg:'#0d0420',primary:'#ff2fd0',accent:'#2ffff0',ink:'#f9eaff'},
  forest:  {bg:'#08170f',primary:'#5fd36e',accent:'#d7e94a',ink:'#efffe9'},
  cosmic:  {bg:'#0a0620',primary:'#8a7bff',accent:'#ff8ae2',ink:'#f0ebff'},
  rust:    {bg:'#1c0f0a',primary:'#d9793f',accent:'#ffd08a',ink:'#ffeede'},
  mint:    {bg:'#071a19',primary:'#4de0c8',accent:'#ffe66d',ink:'#e6fffa'},
  midnight:{bg:'#050b1c',primary:'#4d7cff',accent:'#ff4d9d',ink:'#e6edff'}
};
const g = (id,name,engine,genre,icon,pal,params,how,seed) => ({id,name,engine,genre,icon,theme:P[pal],params,how,seed:seed||1});

export const GAMES = [
  /* ---------- SNAKE ---------- */
  g('neon-serpent','Neon Serpent','snake','Arcade','🐍','void',{grid:18,wrap:false,foods:1,speed:6},'Eat orbs. Grow. Do not bite yourself.',11),
  g('wrap-wraith','Wrap Wraith','snake','Arcade','🌀','cyber',{grid:16,wrap:true,foods:1,speed:7},'Walls wrap around. Keep moving.',12),
  g('obstacle-viper','Obstacle Viper','snake','Arcade','🐉','ember',{grid:20,wrap:false,obstacles:14,foods:1,speed:6.5},'Dodge the blocks while you feed.',13),
  g('hyper-nibbler','Hyper Nibbler','snake','Arcade','⚡','toxic',{grid:22,wrap:false,foods:2,speed:9},'Twin orbs. Blinding speed.',14),
  g('mirror-mamba','Mirror Mamba','snake','Arcade','🪞','royal',{grid:18,wrap:true,reverse:true,foods:1,speed:6.5},'Controls are inverted. Stay sharp.',15),

  /* ---------- BREAKOUT ---------- */
  g('brick-blaster','Brick Blaster','breakout','Arcade','🧱','solar',{rows:4,cols:9,pattern:'solid',paddle:80,balls:1},'Clear every brick. Keep the ball alive.',21),
  g('prism-breaker','Prism Breaker','breakout','Arcade','💎','candy',{rows:5,cols:10,pattern:'checker',paddle:72,powerups:true},'Checker bricks drop surprises.',22),
  g('pyramid-pop','Pyramid Pop','breakout','Arcade','🔺','lava',{rows:6,cols:11,pattern:'pyramid',paddle:68,balls:1,powerups:true},'Carve through the pyramid.',23),
  g('multiball-mayhem','Multiball Mayhem','breakout','Arcade','🎱','neon',{rows:4,cols:9,pattern:'diamond',paddle:88,balls:3,powerups:true},'Three balls. Maximum chaos.',24),
  g('chrome-crusher','Chrome Crusher','breakout','Arcade','🤖','steel',{rows:5,cols:10,pattern:'arch',paddle:64,moving:true},'The bricks will not stay still.',25),

  /* ---------- PONG ---------- */
  g('pulse-pong','Pulse Pong','pong','Arcade','🏓','midnight',{speed:200,ai:0.5,goal:5,paddle:54,twist:'curve'},'Classic duel. First to five wins.',31),
  g('neon-squash','Neon Squash','pong','Arcade','🎾','matrix',{speed:260,ai:0.62,goal:7,paddle:44,mode:'squash',twist:'multi'},'Faster ball, tighter paddle.',32),
  g('hyper-hockey','Hyper Hockey','pong','Arcade','🏒','arctic',{speed:230,ai:0.68,goal:6,paddle:70,mode:'hockey',twist:'walls'},'Wide paddles, slippery puck.',33),
  g('laser-volley','Laser Volley','pong','Arcade','⚡','cyber',{speed:300,ai:0.75,goal:8,paddle:40,twist:'shrink'},'Blistering speed. Tiny margins.',34),
  g('champion-clash','Champion Clash','pong','Arcade','🏆','royal',{speed:250,ai:0.85,goal:9,paddle:48,twist:'blitz'},'Face the undisputed champion.',35),

  /* ---------- SHOOTER ---------- */
  g('star-storm','Star Storm','shooter','Action','🚀','cosmic',{formation:'waves',speed:52,weapon:'single',powerups:true},'Blast the incoming fleet.',41),
  g('swarm-strike','Swarm Strike','shooter','Action','🛸','toxic',{formation:'swarm',speed:60,weapon:'spread',powerups:true},'The swarm weaves. Spread fire helps.',42),
  g('boss-rush','Boss Rush','shooter','Action','👾','blood',{formation:'boss',speed:45,weapon:'laser',enemyHP:3},'Heavy hostiles. Laser recommended.',43),
  g('laser-legion','Laser Legion','shooter','Action','🔫','cyber',{formation:'columns',speed:58,weapon:'laser',powerups:true},'Columns of enemies. Keep firing.',44),
  g('meteor-guard','Meteor Guard','shooter','Action','☄️','ember',{formation:'waves',speed:70,weapon:'spread',enemyHP:2},'Hold the line against the barrage.',45),

  /* ---------- DODGER ---------- */
  g('falling-fury','Falling Fury','dodger','Action','🌧️','steel',{lanes:4,speed:170,spawnRate:0.9},'Dodge the falling debris.',51),
  g('lane-dash','Lane Dash','dodger','Action','🛣️','midnight',{lanes:5,speed:190,spawnRate:0.85,collect:true},'Five lanes. Grab the bonuses.',52),
  g('comet-caution','Comet Caution','dodger','Action','☄️','cosmic',{lanes:3,speed:210,spawnRate:0.75,collect:true},'Narrow lanes, fast comets.',53),
  g('shield-runner','Shield Runner','dodger','Action','🛡️','arctic',{lanes:4,speed:185,spawnRate:0.8,shield:true},'One shield. Use it wisely.',54),
  g('traffic-trap','Traffic Trap','dodger','Action','🚗','lava',{lanes:5,speed:225,spawnRate:0.7,mode:'side'},'Weave through the traffic.',55),

  /* ---------- MERGER ---------- */
  g('merge-mania','Merge Mania','merger','Puzzle','🔢','royal',{size:4,target:128},'Combine tiles. Reach 128.',61),
  g('tile-fusion','Tile Fusion','merger','Puzzle','🧊','arctic',{size:5,target:256,spawn:0.85},'A bigger board, a bigger goal.',62),
  g('chain-reaction','Chain Reaction','merger','Puzzle','⚗️','toxic',{size:4,target:256,mode:'chain'},'Chain merges to climb faster.',63),
  g('nova-merge','Nova Merge','merger','Puzzle','🌌','cosmic',{size:5,target:512,mode:'chain'},'Forge a nova from tiny tiles.',64),
  g('cube-combine','Cube Combine','merger','Puzzle','🧩','candy',{size:6,target:512,obstacles:3},'Locked cells block your path.',65),

  /* ---------- MATCH3 ---------- */
  g('gem-galaxy','Gem Galaxy','match3','Puzzle','💠','void',{size:7,colors:5,moves:16},'Match 3+ gems. Collect the marked ones.',71),
  g('crystal-clash','Crystal Clash','match3','Puzzle','🔮','candy',{size:8,colors:6,moves:15},'Six colors. Cascades are your friend.',72),
  g('prism-puzzle','Prism Puzzle','match3','Puzzle','🌈','sunset',{size:6,colors:4,moves:18},'Fewer colors, tighter board.',73),
  g('tile-tempest','Tile Tempest','match3','Puzzle','🌪️','steel',{size:8,colors:6,moves:14,goal:'score'},'Chase the score before moves run out.',74),
  g('jewel-jam','Jewel Jam','match3','Puzzle','💎','mint',{size:7,colors:5,moves:12},'A frantic race against the clock.',75),

  /* ---------- SLIDER ---------- */
  g('slide-shift','Slide Shift','slider','Puzzle','🔀','ocean',{size:3},'Slide the tiles back into order.',76),
  g('tile-tangle','Tile Tangle','slider','Puzzle','🧶','royal',{size:4},'Four by four. No shortcuts.',77),
  g('puzzle-push','Puzzle Push','slider','Puzzle','🪀','forest',{size:3,timeLimit:60},'Beat the clock.',78),
  g('color-slide','Color Slide','slider','Puzzle','🎨','sunset',{size:4,mode:'color',timeLimit:90},'Order by hue, not by number.',79),
  g('grid-glide','Grid Glide','slider','Puzzle','🔲','midnight',{size:5,timeLimit:180},'The brutal five-by-five.',80),

  /* ---------- LIGHTSOUT ---------- */
  g('lights-out','Lights Out','lightsout','Logic','💡','midnight',{size:4,pattern:'plus'},'Switch off every light.',81),
  g('blackout','Blackout','lightsout','Logic','🌑','void',{size:5,pattern:'plus'},'Plunge the grid into darkness.',82),
  g('circuit-break','Circuit Break','lightsout','Logic','⚙️','steel',{size:5,pattern:'square'},'Every switch hits its neighbours.',83),
  g('crossfire','Crossfire','lightsout','Logic','✖️','blood',{size:4,pattern:'diag'},'Diagonal toggles. Think ahead.',84),
  g('dark-matter','Dark Matter','lightsout','Logic','🌌','cosmic',{size:5,pattern:'diag',mode:'on',movesLimit:20},'Turn the whole grid on.',85),

  /* ---------- CODEBREAKER ---------- */
  g('code-cracker','Code Cracker','codebreaker','Logic','🔐','cyber',{slots:4,colors:6,tries:8},'Crack the hidden code.',86),
  g('master-mind','Master Mind','codebreaker','Logic','🧠','royal',{slots:5,colors:7,tries:9},'Five pegs. Seven colors.',87),
  g('secret-signal','Secret Signal','codebreaker','Logic','📡','matrix',{slots:4,colors:8,tries:7},'Intercept the secret signal.',88),
  g('peg-puzzle','Peg Puzzle','codebreaker','Logic','📌','candy',{slots:3,colors:5,tries:7},'A gentle introduction to deduction.',89),
  g('cipher-hunt','Cipher Hunt','codebreaker','Logic','🕵️','rust',{slots:5,colors:8,tries:8,mode:'digit'},'Digits instead of colors.',90),

  /* ---------- JUMPER ---------- */
  g('jump-jet','Jump Jet','jumper','Action','🦘','forest',{mode:'runner',speed:210,jump:380},'Hop the hurdles. Do not fall.',101),
  g('hurdle-hero','Hurdle Hero','jumper','Action','🏃','solar',{mode:'runner',speed:240,jump:400},'A faster, tougher course.',102),
  g('double-leap','Double Leap','jumper','Action','🐇','candy',{mode:'runner',speed:230,jump:350,doubleJump:true},'Two jumps. Twice the freedom.',103),
  g('sky-dash','Sky Dash','jumper','Action','☁️','arctic',{mode:'platform',speed:260,jump:420,doubleJump:true},'Leap between floating ledges.',104),
  g('runner-rush','Runner Rush','jumper','Action','💨','lava',{mode:'runner',speed:290,jump:400,gaps:2},'Full speed. No hesitation.',105),

  /* ---------- FLAPPY ---------- */
  g('flap-flurry','Flap Flurry','flappy','Arcade','🐦','candy',{gap:110,speed:145,twist:'wind'},'Tap to flap. Thread the pipes.',111),
  g('pipe-panic','Pipe Panic','flappy','Arcade','🚰','toxic',{gap:96,speed:165,twist:'doublepipe'},'Tighter gaps, faster pipes.',112),
  g('wing-it','Wing It','flappy','Arcade','🕊️','arctic',{gap:104,speed:155,flap:-200,twist:'laser'},'A lighter, floaty bird.',113),
  g('sky-tap','Sky Tap','flappy','Arcade','🌤️','sunset',{gap:92,speed:175,twist:'lowgrav'},'Tap in rhythm and survive.',114),
  g('windy-wings','Windy Wings','flappy','Arcade','🌬️','steel',{gap:88,speed:185,wind:1,twist:'shield'},'Crosswinds push you around.',115),

  /* ---------- REFLEX ---------- */
  g('whack-wonder','Whack Wonder','reflex','Reflex','🔨','ember',{mode:'whack',speed:1,targets:6},'Smack the targets before they vanish.',121),
  g('color-call','Color Call','reflex','Reflex','🎯','neon',{mode:'colorcall',speed:1.5},'Tap the color that is called.',122),
  g('memory-flash','Memory Flash','reflex','Reflex','⚡','cyber',{mode:'sequence',speed:1},'Watch the flash, repeat the order.',123),
  g('rapid-tap','Rapid Tap','reflex','Reflex','👆','solar',{mode:'whack',speed:0.65,targets:9},'Targets flash faster every level.',124),
  g('instinct','Instinct','reflex','Reflex','🌀','blood',{mode:'colorcall',speed:2},'Pure reaction. No hesitation.',125),

  /* ---------- TOWER ---------- */
  g('tower-toss','Tower Toss','tower','Reflex','🏗️','solar',{speed:130,blockWidth:100,twist:'zigzag'},'Drop each block onto the one below.',131),
  g('block-balance','Block Balance','tower','Reflex','⚖️','steel',{speed:150,blockWidth:88,mode:'balance',twist:'wind'},'Keep the tower centred.',132),
  g('stack-attack','Stack Attack','tower','Reflex','📦','ember',{speed:170,blockWidth:80,twist:'narrow'},'Overhang is trimmed. Precision wins.',133),
  g('perfect-stack','Perfect Stack','tower','Reflex','🎯','mint',{speed:190,blockWidth:72,perfectBonus:true,twist:'bomb'},'Perfect drops earn huge bonuses.',134),
  g('sky-scraper','Sky Scraper','tower','Reflex','🌇','midnight',{speed:215,blockWidth:64,twist:'sway'},'Build to the clouds.',135),

  /* ---------- RHYTHM ---------- */
  g('beat-blitz','Beat Blitz','rhythm','Rhythm','🥁','neon',{bpm:110,lanes:3,notes:14},'Tap the notes right on the line.',141),
  g('neon-rhythm','Neon Rhythm','rhythm','Rhythm','🎵','void',{bpm:125,lanes:4,notes:16},'Four lanes of pure rhythm.',142),
  g('tap-tempo','Tap Tempo','rhythm','Rhythm','🎶','candy',{bpm:100,lanes:2,notes:12},'Two lanes. Find the groove.',143),
  g('disco-dash','Disco Dash','rhythm','Rhythm','🕺','candy',{bpm:140,lanes:4,notes:18},'Turn up the tempo.',144),
  g('pulse-lanes','Pulse Lanes','rhythm','Rhythm','💓','blood',{bpm:155,lanes:3,notes:20},'Keep your combo alive.',145),

  /* ---------- MAZE ---------- */
  g('maze-runner','Maze Runner','maze','Strategy','🌀','forest',{size:9,fog:false,enemies:0},'Find the exit. Fast.',151),
  g('fog-navigator','Fog Navigator','maze','Strategy','🌫️','steel',{size:11,fog:true,enemies:0},'Only the area around you is visible.',152),
  g('key-quest','Key Quest','maze','Strategy','🔑','royal',{size:11,fog:false,keys:2},'Collect both keys before escaping.',153),
  g('chase-chamber','Chase Chamber','maze','Strategy','👹','blood',{size:11,fog:false,enemies:2},'Something is hunting you.',154),
  g('labyrinth','Labyrinth','maze','Strategy','🏛️','rust',{size:13,fog:true,keys:3,enemies:2,timeLimit:75},'The ultimate test of nerve.',155),

  /* ---------- MEMORY ---------- */
  g('memory-match','Memory Match','memory','Memory','🧠','void',{mode:'pairs',pairs:6},'Flip two cards. Find the pairs.',161),
  g('card-flip','Card Flip','memory','Memory','🃏','candy',{mode:'pairs',pairs:8,preview:1.5},'Eight pairs. Study the preview.',162),
  g('sequence-star','Sequence Star','memory','Memory','⭐','royal',{mode:'sequence'},'Repeat the flashing sequence.',163),
  g('mind-meld','Mind Meld','memory','Memory','🔮','cosmic',{mode:'pairs',pairs:10,timeLimit:60},'Ten pairs against the clock.',164),
  g('recall-rush','Recall Rush','memory','Memory','💥','ember',{mode:'sequence'},'Sequences grow longer every round.',165),

  /* ---------- STACKER ---------- */
  g('block-stack','Block Stack','stacker','Puzzle','🧱','steel',{pieceSet:'tetromino',speed:0.9},'Clear lines before the stack tops out.',171),
  g('line-clear','Line Clear','stacker','Puzzle','➖','matrix',{pieceSet:'tetromino',speed:0.7},'A slower, thoughtful climb.',172),
  g('tetra-rush','Tetra Rush','stacker','Puzzle','⏩','cyber',{pieceSet:'tetromino',speed:0.55},'Blocks drop fast. Stay calm.',173),
  g('domino-drop','Domino Drop','stacker','Puzzle','🎲','candy',{pieceSet:'domino',speed:0.8},'Only dominoes. New strategy.',174),
  g('cube-cascade','Cube Cascade','stacker','Puzzle','🔨','lava',{pieceSet:'single',speed:0.5,garbage:true},'Single cubes and rising garbage.',175),

  /* ---------- SORTER ---------- */
  g('sort-storm','Sort Storm','sorter','Reflex','🌪️','ocean',{mode:'color',bins:3,speed:55},'Send each item to its matching bin.',181),
  g('bin-dash','Bin Dash','sorter','Reflex','🗂️','solar',{mode:'color',bins:4,speed:60},'Four bins. No room for error.',182),
  g('color-catch','Color Catch','sorter','Reflex','🎨','candy',{mode:'color',bins:2,speed:50},'A calm start to sorting.',183),
  g('number-sort','Number Sort','sorter','Reflex','🔢','midnight',{mode:'number',bins:4,speed:65},'Read the number, pick the bin.',184),
  g('quick-pick','Quick Pick','sorter','Reflex','⚡','toxic',{mode:'shape',bins:4,speed:75},'Shapes fly. Sort on instinct.',185),

  /* ---------- TRAP ---------- */
  g('safe-zone','Safe Zone','trap','Strategy','⭕','arctic',{mode:'shrink',speed:130},'Stay inside the shrinking circle.',191),
  g('wall-warning','Wall Warning','trap','Strategy','🧱','steel',{mode:'walls',speed:145},'Slip past the sweeping walls.',192),
  g('chaser-chase','Chaser Chase','trap','Strategy','👻','blood',{mode:'chase',speed:150},'Never let the chaser catch you.',193),
  g('shrink-circle','Shrink Circle','trap','Strategy','🔵','cyber',{mode:'shrink',speed:160,safe:0.8},'The safe zone closes in fast.',194),
  g('survival-zone','Survival Zone','trap','Strategy','🛡️','forest',{mode:'walls',speed:170,lives:4},'Four lives. Endless walls.',195)
];

export const GENRES = ['All','Arcade','Action','Puzzle','Logic','Reflex','Memory','Rhythm','Strategy'];
export const getGame = id => GAMES.find(x=>x.id===id);