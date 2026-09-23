import {Chess} from '../vendor/chess.js';
import {pieceSvg,pieceNames,icon} from './pieces.js';
import {levels} from './engine.js';
import {lessons} from './lessons.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem('knightfall:'+key))??fallback;}catch{return fallback;}};
let storageWarning=false;
const write=(key,value)=>{try{localStorage.setItem('knightfall:'+key,JSON.stringify(value));}catch{if(!storageWarning){storageWarning=true;toast('Browser storage is unavailable. This session will not be saved.');}}};
export const themes=[
 {id:'grove',name:'Olive grove',light:'#eeedda',dark:'#81926b',accent:'#cad5a6'},
 {id:'walnut',name:'Walnut',light:'#ead9be',dark:'#a17c5d',accent:'#dac49e'},
 {id:'ocean',name:'Deep ocean',light:'#dce7ea',dark:'#638997',accent:'#a9cfda'},
 {id:'rose',name:'Rose quartz',light:'#f1e0df',dark:'#b4828e',accent:'#ecc2cc'},
 {id:'slate',name:'Slate',light:'#e0e3e8',dark:'#717b8d',accent:'#bac8e0'},
 {id:'lavender',name:'Lavender',light:'#ece4f2',dark:'#9781af',accent:'#d6bcec'}
];
const defaults={theme:'grove',light:'#eeedda',dark:'#81926b',pieces:'classic',whitePiece:'#faf8ed',blackPiece:'#303c31',coordinates:true,legal:true,sound:true};
const raw=read('settings',{});
const settings={...defaults};
for(const key of ['light','dark','whitePiece','blackPiece'])if(/^#[0-9a-f]{6}$/i.test(raw[key]))settings[key]=raw[key];
if(themes.some(t=>t.id===raw.theme)||raw.theme==='custom')settings.theme=raw.theme;
if(['classic','modern','letter'].includes(raw.pieces))settings.pieces=raw.pieces;
for(const key of ['coordinates','legal','sound'])if(typeof raw[key]==='boolean')settings[key]=raw[key];
let progress=read('progress',[]);if(!Array.isArray(progress))progress=[];progress=progress.filter(id=>lessons.some(l=>l.id===id));
let game=new Chess(),route='play',mode='bot',level='beginner',human='w',orientation='w',selected=null,lastMove=null,result=null;
let config={mode:'bot',level:'beginner',side:'w'},worker=null,job=0,busy=false,jobKind=null,hint=null;
let lessonIndex=0,stepIndex=0,lessonComplete=false,lessonNote='',lessonTimer=null,regular=null;
let moveList=[];
function snapshot(){return {pgn:game.pgn(),mode,level,human,orientation,result};}
function restore(s){
 const next=new Chess();if(!s||typeof s.pgn!=='string')return false;if(s.pgn.trim()&&!next.load_pgn(s.pgn))return false;
 game=next;mode=s.mode==='local'?'local':'bot';level=levels.some(l=>l.id===s.level)?s.level:'beginner';
 human=s.human==='b'?'b':'w';orientation=s.orientation==='b'?'b':'w';
 result=s.result&&typeof s.result.title==='string'?s.result:null;
 moveList=game.history({verbose:true});lastMove=moveList.at(-1)||null;
 config={mode,level,side:human};return true;
}
restore(read('game',null));
function save(){write('settings',settings);write('progress',progress);if(mode!=='lesson')write('game',snapshot());}
function applyTheme(){
 document.documentElement.style.setProperty('--square-light',settings.light);
 document.documentElement.style.setProperty('--square-dark',settings.dark);
 document.documentElement.style.setProperty('--board-accent',themes.find(t=>t.id===settings.theme)?.accent||'#cad5a6');
}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),3500);}
function sound(capture=false){
 if(!settings.sound)return;
 try{const ctx=sound.ctx||(sound.ctx=new (window.AudioContext||window.webkitAudioContext)());ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.setValueAtTime(capture?250:480,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(140,ctx.currentTime+.1);g.gain.setValueAtTime(.045,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.13);o.start();o.stop(ctx.currentTime+.14);}catch{}
}
function stopWork(){job++;worker?.terminate();worker=null;busy=false;jobKind=null;clearTimeout(lessonTimer);lessonTimer=null;}
function nav(next){
 if(route==='lesson'&&next!==route){stopWork();if(regular)restore(regular);regular=null;selected=null;hint=null;lessonComplete=false;}
 route=next;render();if(mode==='bot')scheduleBot();
}
function shell(){
 $('#app').innerHTML=`<aside class="sidebar"><a class="brand" href="#" data-route="play"><span class="brand-mark">${pieceSvg('n','w','modern',{whitePiece:'#c7d4a4'})}</span><span>knightfall<span class="brand-dot">.</span></span></a><p class="sidebar-label">A SPACE FOR YOUR NEXT MOVE</p><nav aria-label="Main navigation"><button data-route="play" aria-label="Play chess" class="nav-item ${route==='play'?'active':''}">${icon('play')}<span>Play chess</span>${icon('chevron')}</button><button data-route="learn" aria-label="The academy" class="nav-item ${['learn','lesson'].includes(route)?'active':''}">${icon('book')}<span>The academy</span><span class="nav-count">10</span></button><button data-route="studio" aria-label="Board studio" class="nav-item ${route==='studio'?'active':''}">${icon('palette')}<span>Board studio</span>${icon('chevron')}</button></nav><div class="sidebar-note"><span class="tiny-star">✳</span><h3>A little better,<br>one move at a time.</h3><p>No rush. No ratings.<br>Just you and the board.</p><button class="text-link" data-route="learn">Find your first lesson ${icon('arrow')}</button></div><div class="sidebar-bottom"><div class="profile-avatar">K</div><div><strong>Your corner</strong><span>Saved on this browser</span></div><span class="status-dot"></span></div></aside><main><header class="topbar"><span>PLAY WITH INTENTION.</span><div class="top-actions"><span class="availability"><i></i> YOUR BOARD, YOUR RULES</span><button class="icon-button ${settings.sound?'':'muted'}" data-action="sound" title="${settings.sound?'Mute':'Enable'} move sounds" aria-label="${settings.sound?'Mute':'Enable'} move sounds">${icon('sound')}</button><a class="icon-button" href="https://github.com/Tsukyi/Knightfall-Chess" target="_blank" rel="noopener" aria-label="GitHub repository">${icon('github')}</a></div></header><div id="view"></div><footer><span>Made for the love of the game.</span><span>64 squares. Endless possibilities.</span></footer></main>`;
}
function render(){applyTheme();shell();if(route==='play')renderPlay();else if(route==='learn')renderAcademy();else if(route==='lesson')renderLesson();else renderStudio();}
function heading(eyebrow,title,sub,extra=''){return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${sub}</p></div>${extra}</div>`;}
function playerName(color){if(mode==='lesson')return color==='w'?'You, the apprentice':'Clover, your coach';if(mode==='local')return color==='w'?'White player':'Black player';return color===human?'You':levels.find(l=>l.id===level).name;}
function playerBar(color){
 const isBot=mode==='lesson'?color==='b':mode==='bot'&&color!==human;
 const taken=moveList.filter(m=>m.color===color&&m.captured).map(m=>pieceSvg(m.captured,color==='w'?'b':'w',settings.pieces,settings)).join('');
 return `<div class="player-bar ${game.turn()===color&&!result?'to-move':''}"><div class="player-avatar ${isBot?'bot-avatar':''}">${icon(isBot?'bot':'users')}</div><div class="player-info"><strong>${playerName(color)} ${mode==='bot'&&isBot?'<span class="bot-tag">BOT</span>':''}</strong><span>${mode==='lesson'?color==='w'?'Learning by doing':'A patient practice partner':isBot?levels.find(l=>l.id===level).label+' · local engine':color==='w'?'Playing white':'Playing black'}</span></div><div class="captured">${taken}</div><span class="turn-pill">${game.turn()===color&&!result?'To move':color==='w'?'White':'Black'}</span></div>`;
}
function boardHTML(preview=false){
 const boardGame=preview?new Chess():game;
 const facing=preview?'w':orientation;
 const files=facing==='w'?'abcdefgh':'hgfedcba',ranks=facing==='w'?'87654321':'12345678';
 const legal=!preview&&selected?game.moves({square:selected,verbose:true}):[];
 return `<div class="board-shell"><div class="chessboard ${preview?'preview-board':''}" role="group" aria-label="${preview?'Board design preview':'Chessboard. Select a piece, then its destination.'}">${[...ranks].map((rank,ri)=>[...files].map((file,fi)=>{
  const square=file+rank,p=boardGame.get(square),dark=boardGame.square_color(square)==='dark';
  const target=legal.some(m=>m.to===square),check=!preview&&p?.type==='k'&&p.color===game.turn()&&game.in_check();
  const cls=['square',dark?'dark':'light',!preview&&selected===square?'selected':'',!preview&&lastMove&&[lastMove.from,lastMove.to].includes(square)?'last-move':'',!preview&&hint&&[hint.from,hint.to].includes(square)?'hint-square':'',check?'in-check':''].filter(Boolean).join(' ');
  const label=`${square}${p?', '+(p.color==='w'?'white ':'black ')+pieceNames[p.type]:', empty'}${target?', legal destination':''}`;
  return `<${preview?'div':'button'} class="${cls}" ${preview?'':`data-square="${square}" aria-label="${label}" aria-pressed="${selected===square}" draggable="${Boolean(p)}"`} >${settings.coordinates&&fi===0?`<span class="rank-label">${rank}</span>`:''}${p?`<span class="piece">${pieceSvg(p.type,p.color,settings.pieces,settings)}</span>`:''}${!preview&&target&&settings.legal?`<span class="legal-dot ${p?'capture-ring':''}"></span>`:''}${settings.coordinates&&ri===7?`<span class="file-label">${file}</span>`:''}</${preview?'div':'button'}>`;
 }).join('')).join('')}</div></div>`;
}
function boardArea(){return `<div class="board-column"><div id="top-player">${playerBar(orientation==='w'?'b':'w')}</div><div id="board-container">${boardHTML()}</div><div id="bottom-player">${playerBar(orientation)}</div><div class="board-toolbar"><div><button class="tool-button" data-action="undo" ${(!moveList.length||mode==='lesson')?'disabled':''} title="Take back your last turn">${icon('undo')}<span>Undo</span></button><button class="tool-button" data-action="hint" ${result||lessonComplete||busy?'disabled':''}>${icon('bulb')}<span>Hint</span></button><button class="tool-button" data-action="flip">${icon('flip')}<span>Flip</span></button></div><div><button class="icon-button" data-action="export" title="Download game as PGN" aria-label="Download game as PGN">${icon('download')}</button><button class="icon-button" data-action="resign" ${result||mode==='lesson'?'disabled':''} title="Resign game" aria-label="Resign game">${icon('flag')}</button></div></div><div id="game-status" class="game-status" role="status" aria-live="polite">${statusHTML()}</div></div>`;}
function statusHTML(){
 if(mode==='lesson')return `${icon(lessonComplete?'check':'bulb')}<span>${lessonComplete?'Lesson complete. Nicely played.':busy?'Clover is replying…':`Your move · Step ${stepIndex+1} of ${lessons[lessonIndex].steps.length}`}</span>`;
 if(result)return `${icon('flag')}<div><strong>${esc(result.title)}</strong><span>${esc(result.reason)}</span></div>`;
 if(busy)return `${icon('bot')}<span>${jobKind==='hint'?'Finding an idea…':playerName(game.turn())+' is thinking…'}</span><span class="thinking-dots">•••</span>`;
 if(hint)return `${icon('bulb')}<span>Try ${hint.san}: ${hint.from} → ${hint.to}. Look at the highlighted squares.</span>`;
 if(game.in_check())return `${icon('flag')}<span>${playerName(game.turn())} ${playerName(game.turn())==='You'?'are':'is'} in check. Protect the king.</span>`;
 return `<span class="status-dot"></span><span>${mode==='local'?playerName(game.turn())+' to move.':game.turn()===human?'Your move. Make it a good one.':'Ready when you are.'}</span><span class="status-end">No clock. No rush.</span>`;
}
function renderPlay(){
 $('#view').innerHTML=heading('THE PLAY ROOM','Make your next move<span class="serif-dot">.</span>','A worthy opponent. A familiar friend. A fresh perspective.',`<button class="subtle-button" data-route="studio">${icon('palette')} Make it yours</button>`)+`<div class="play-layout">${boardArea()}<aside class="game-side"><section class="panel setup-panel"><div class="panel-header"><h2>Set the scene</h2><span class="small-label">NEW GAME</span></div><div class="segmented"><button data-mode="bot" class="${config.mode==='bot'?'chosen':''}">${icon('bot')} Play a bot</button><button data-mode="local" class="${config.mode==='local'?'chosen':''}">${icon('users')} With a friend</button></div>${config.mode==='bot'?botSetup():`<div class="local-card"><div class="friend-art">${pieceSvg('n','w','classic',settings)}${pieceSvg('n','b','classic',settings)}</div><h3>Good company. Great game.</h3><p>Two players, one screen.<br>Take turns and let the board do the talking.</p></div>`}<div class="setup-row"><div><label for="side-select">${config.mode==='bot'?'YOUR SIDE':'BOARD VIEW'}</label><select id="side-select"><option value="w" ${config.side==='w'?'selected':''}>○ White</option><option value="b" ${config.side==='b'?'selected':''}>● Black</option><option value="random" ${config.side==='random'?'selected':''}>◇ Random</option></select></div><div class="time-option"><span class="small-label">TIME CONTROL</span><span>${icon('clock')} Take your time</span></div></div><button class="primary-button" data-action="new-game">Let's play ${icon('arrow')}</button><p class="setup-footnote">${config.mode==='bot'?'All the thinking happens on your device.':'Pass the turn, keep the conversation.'}</p></section><section class="panel moves-panel"><div class="panel-header"><h2>The story so far</h2><span id="move-count" class="small-label">${moveList.length} PLIES</span></div><div class="move-table-head"><span>#</span><span>White</span><span>Black</span></div><div id="moves" class="moves-scroll">${historyHTML()}</div></section><button class="academy-callout" data-route="learn"><span class="callout-icon">${icon('book')}</span><span><strong>Every master was a beginner.</strong><small>Find your footing in the academy</small></span>${icon('arrow')}</button></aside></div>`;
}
function botSetup(){const bot=levels.find(l=>l.id===config.level);return `<div class="bot-profile"><div class="bot-portrait" data-level="${bot.id}"><span class="bot-antenna"></span><span class="bot-face"><i></i><i></i><b></b></span><span class="bot-leaf"></span></div><div><span class="small-label">MEET YOUR OPPONENT</span><h3>${bot.name}<span class="tiny-star">✳</span></h3><p>${bot.description}</p></div></div><label class="small-label">PICK YOUR CHALLENGE</label><div class="difficulty-grid">${levels.map((l,i)=>`<button data-level="${l.id}" class="difficulty ${config.level===l.id?'chosen':''}"><span class="difficulty-bars">${[1,2,3,4].map(n=>`<i class="${n<=i+1?'filled':''}" style="height:${5+n*3}px"></i>`).join('')}</span><span>${l.label}</span>${config.level===l.id?icon('check'):''}</button>`).join('')}</div>`;}
function historyHTML(){
 if(!moveList.length)return `<div class="empty-history">${icon('spark')}<p>A blank page.<br><span>Your first move starts the story.</span></p></div>`;
 const rows=[];
 // FEN lessons can start at a later fullmove number, so use the starting position.
 const start=game.header().FEN;let number=start?Number(start.split(' ')[5]):1;
 for(let i=0;i<moveList.length;){const a=moveList[i],b=a.color==='w'&&moveList[i+1]?.color==='b'?moveList[i+1]:null;rows.push(`<div class="move-row"><span>${number++}.</span><span class="${i===moveList.length-1?'latest':''}">${a.color==='w'?a.san:'…'}</span><span class="${(b?i+1:i)===moveList.length-1?'latest':''}">${b?b.san:a.color==='b'?a.san:'—'}</span></div>`);i+=b?2:1;}
 return rows.join('');
}
function refreshBoard(){
 if(!['play','lesson'].includes(route))return;
 if($('#board-container'))$('#board-container').innerHTML=boardHTML();
 if($('#top-player'))$('#top-player').innerHTML=playerBar(orientation==='w'?'b':'w');
 if($('#bottom-player'))$('#bottom-player').innerHTML=playerBar(orientation);
 if($('#game-status'))$('#game-status').innerHTML=statusHTML();
 if($('#moves')){$('#moves').innerHTML=historyHTML();$('#moves').scrollTop=$('#moves').scrollHeight;$('#move-count').textContent=moveList.length+' PLIES';}
 $('[data-action="undo"]')?.toggleAttribute('disabled',!moveList.length||mode==='lesson');
 $('[data-action="hint"]')?.toggleAttribute('disabled',Boolean(result||lessonComplete||busy));
 $('[data-action="resign"]')?.toggleAttribute('disabled',Boolean(result||mode==='lesson'));
}
function canMove(){return !result&&!(mode==='lesson'&&(lessonComplete||busy))&&!(mode==='bot'&&game.turn()!==human);}
function clickSquare(square){
 if(!canMove())return;
 if(selected){const match=game.moves({square:selected,verbose:true}).filter(m=>m.to===square);if(match.length){if(match.some(m=>m.promotion)){promotionDialog(selected,square);return;}attemptMove(match[0]);return;}}
 const p=game.get(square);selected=p&&p.color===game.turn()&&selected!==square?square:null;hint=null;refreshBoard();
}
function promotionDialog(from,to){
 const color=game.turn();showDialog(`<p class="eyebrow">A NEW CHAPTER</p><h2>Choose your promotion.</h2><p>Your pawn has earned a new role.</p><div class="promotion-options">${['q','r','b','n'].map(p=>`<button data-promote="${p}" data-from="${from}" data-to="${to}">${pieceSvg(p,color,settings.pieces,settings)}<span>${pieceNames[p]}</span></button>`).join('')}</div>`);
}
function attemptMove(m){
 if(!canMove())return;
 if(mode==='lesson'){
  const expected=lessons[lessonIndex].steps[stepIndex].move;
  const match=game.moves({verbose:true}).find(x=>x.from===m.from&&x.to===m.to&&(x.promotion||'')===(m.promotion||''));
  if(!match||match.san!==expected){lessonNote='A legal idea, but try the lesson’s goal. '+lessons[lessonIndex].steps[stepIndex].hint;selected=null;renderLesson();return;}
  commitMove(m);const step=lessons[lessonIndex].steps[stepIndex];lessonNote=step.after;
  if(step.reply){busy=true;refreshBoard();lessonTimer=setTimeout(()=>{if(mode!=='lesson')return;commitMove(step.reply);busy=false;advanceLesson();},650);}else advanceLesson();
  renderLesson();return;
 }
 stopWork();commitMove(m);checkResult();save();refreshBoard();scheduleBot();
}
function commitMove(m){const played=game.move(m);if(!played)return false;moveList.push(played);lastMove=played;selected=null;hint=null;sound(Boolean(played.captured));return true;}
function checkResult(){
 if(game.in_checkmate())result={title:`${playerName(game.turn()==='w'?'b':'w')} ${playerName(game.turn()==='w'?'b':'w')==='You'?'win':'wins'}!`,reason:'Checkmate. A well-earned finish.',winner:game.turn()==='w'?'b':'w'};
 else if(game.in_stalemate())result={title:'Draw by stalemate',reason:'The player to move has no legal move and is not in check.',winner:null};
 else if(game.insufficient_material())result={title:'Draw — insufficient material',reason:'There is not enough material left to deliver checkmate.',winner:null};
 else if(game.in_threefold_repetition())result={title:'Draw by repetition',reason:'The same position has occurred three times.',winner:null};
 else if(game.in_draw())result={title:'Draw — fifty-move rule',reason:'Fifty moves each without a pawn move or capture.',winner:null};
}
function runWorker(kind){
 stopWork();const id=job;busy=true;jobKind=kind;const position=game.fen();refreshBoard();
 try{
  worker=new Worker(new URL('./bot-worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{
   if(data.id!==job||game.fen()!==position)return;
   worker?.terminate();worker=null;busy=false;jobKind=null;
   if(data.error){toast('The bot could not calculate. Try again.');refreshBoard();return;}
   if(kind==='hint'){hint=data.move;refreshBoard();return;}
   if(data.move)commitMove(data.move);checkResult();save();refreshBoard();
  };
  worker.onerror=()=>{worker?.terminate();worker=null;busy=false;jobKind=null;toast('Bot interrupted. Use Undo or start a new game to retry.');refreshBoard();};
  worker.postMessage({id,fen:position,pgn:game.pgn(),level:kind==='hint'?'hard':level});
 }catch{busy=false;jobKind=null;toast('This browser cannot start the bot. Try a modern browser or local two-player mode.');refreshBoard();}
}
function scheduleBot(){if(mode==='bot'&&game.turn()!==human&&!result&&!busy)runWorker('bot');}
function newGame(){
 const start=()=>{stopWork();game=new Chess();moveList=[];mode=config.mode;level=config.level;human=config.side==='random'?(Math.random()<.5?'w':'b'):config.side;orientation=human;selected=null;hint=null;lastMove=null;result=null;regular=null;lessonComplete=false;route='play';save();render();scheduleBot();};
 if(moveList.length&&!result)confirmDialog('A fresh start?','Starting a new game replaces the current game. You can download it as PGN first.',start,"Start new game");else start();
}
function undo(){
 if(mode==='lesson'||!moveList.length)return;
 stopWork();let removed=game.undo();if(removed)moveList.pop();
 if(mode==='bot'&&game.turn()!==human&&moveList.length){game.undo();moveList.pop();}
 result=null;game.header('Result','*');lastMove=moveList.at(-1)||null;selected=null;hint=null;save();refreshBoard();scheduleBot();
}
function getHint(){if(mode==='lesson'){const step=lessons[lessonIndex].steps[stepIndex];hint=game.moves({verbose:true}).find(m=>m.san===step.move);lessonNote=step.hint;renderLesson();return;}if(!canMove())return;runWorker('hint');}
function resign(){const color=mode==='bot'?human:game.turn();confirmDialog('Call it a game?','Every game is a chance to learn. You can still review or download your moves.',()=>{stopWork();result={title:`${playerName(color==='w'?'b':'w')} ${playerName(color==='w'?'b':'w')==='You'?'win':'wins'} by resignation`,reason:'Ready for another round?',winner:color==='w'?'b':'w'};save();refreshBoard();},'Resign game');}
function exportPGN(){game.header('Event',mode==='lesson'?'Knightfall Academy':'Knightfall casual game','White',playerName('w'),'Black',playerName('b'),'Date',new Date().toISOString().slice(0,10).replaceAll('-','.'),'Result',result?(result.winner==='w'?'1-0':result.winner==='b'?'0-1':'1/2-1/2'):'*');const url=URL.createObjectURL(new Blob([game.pgn({max_width:80})],{type:'application/x-chess-pgn'}));const a=document.createElement('a');a.href=url;a.download='knightfall-game.pgn';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Game downloaded as PGN.');}
function renderAcademy(){
 $('#view').innerHTML=heading('THE ACADEMY','Small lessons. Stronger moves.','Meet Clover, your patient chess coach. Learn one idea, then put it on the board.')+`<div class="academy-hero"><div class="academy-hero-icon">${pieceSvg('n','w','modern',{whitePiece:'#dce6bf'})}<span>✳</span></div><div><p class="eyebrow">YOUR CHESS JOURNEY</p><h2>There’s a good player in you.</h2><p>Ten hands-on lessons. Real moves. A bot that helps you find your way.</p></div><div class="progress-stat"><strong>${progress.length}<span> / 10</span></strong><span>LESSONS COMPLETE</span><div class="progress-track"><i style="width:${progress.length*10}%"></i></div></div></div><div class="section-heading"><h2>Start curious. Leave confident.</h2><span>Pick any lesson to begin</span></div><div class="lesson-grid">${lessons.map((l,i)=>`<button class="lesson-card ${progress.includes(l.id)?'completed':''}" data-lesson="${i}"><div class="lesson-card-top"><span class="lesson-number">${String(i+1).padStart(2,'0')}</span><span class="lesson-complete">${progress.includes(l.id)?icon('check')+' Completed':l.duration}</span></div><div class="lesson-piece">${pieceSvg(l.piece,'b','modern',settings)}</div><p class="eyebrow">${l.tag}</p><h3>${l.title}</h3><p>${l.description}</p><div class="lesson-card-bottom"><span>${progress.includes(l.id)?'Revisit lesson':'Let’s learn'}</span>${icon('arrow')}</div></button>`).join('')}</div>`;
}
function startLesson(index){
 if(mode!=='lesson')regular=snapshot();stopWork();lessonIndex=index;stepIndex=0;lessonComplete=false;lessonNote='';
 game=new Chess(lessons[index].fen);mode='lesson';orientation='w';moveList=[];lastMove=null;selected=null;result=null;hint=null;route='lesson';render();
}
function advanceLesson(){
 stepIndex++;if(stepIndex>=lessons[lessonIndex].steps.length){lessonComplete=true;if(!progress.includes(lessons[lessonIndex].id))progress.push(lessons[lessonIndex].id);write('progress',progress);}
 renderLesson();
}
function renderLesson(){
 const l=lessons[lessonIndex],step=l.steps[Math.min(stepIndex,l.steps.length-1)];
 $('#view').innerHTML=heading(`THE ACADEMY / LESSON ${String(lessonIndex+1).padStart(2,'0')}`,l.title,l.description,`<button class="subtle-button" data-route="learn">All lessons ${icon('arrow')}</button>`)+`<div class="play-layout">${boardArea()}<aside class="game-side"><section class="panel coach-panel"><div class="coach-header"><div class="player-avatar bot-avatar">${icon('bot')}</div><div><h2>Clover</h2><span>Your coach, in your corner.</span></div><span class="status-dot"></span></div><div class="lesson-step-dots">${l.steps.map((s,i)=>`<i class="${i<stepIndex?'done':i===stepIndex?'current':''}"></i>`).join('')}</div><p class="eyebrow">${lessonComplete?'LESSON COMPLETE':`STEP ${stepIndex+1} OF ${l.steps.length}`}</p><h3>${lessonComplete?'That’s a move forward.':busy?'Watch the reply.':'Let’s try this.'}</h3><p class="coach-instruction">${lessonComplete?step.after:step.text}</p>${lessonNote&&!lessonComplete?`<div class="coach-note">${icon('bulb')}<span>${lessonNote}</span></div>`:''}${lessonComplete?`<div class="lesson-celebration">${icon('check')}<span>One more idea in your toolkit.</span></div><button class="primary-button" ${lessonIndex<lessons.length-1?`data-lesson="${lessonIndex+1}"`:'data-action="practice"'}>${lessonIndex<lessons.length-1?'Next lesson':'Practice with Sprout'} ${icon('arrow')}</button>`:`<button class="subtle-button full" data-action="hint" ${busy?'disabled':''}>${icon('bulb')} A little nudge</button>`}<button class="text-link restart-lesson" data-lesson="${lessonIndex}">${icon('reset')} Restart lesson</button></section><div class="lesson-tip"><p class="eyebrow">GOOD TO KNOW</p><p>Click or tap a piece, then its destination. Dots show legal moves. You can also drag pieces on a computer.</p><p>These are guided positions. In a full game, your opponent will choose its own moves.</p></div></aside></div>`;
}
function renderStudio(){
 $('#view').innerHTML=heading('THE BOARD STUDIO','Make yourself at home.','A board that feels like you. Every choice is saved as you go.',`<button class="subtle-button" data-action="reset-style">${icon('reset')} Reset style</button>`)+`<div class="studio-layout"><div class="studio-preview"><div class="preview-topline"><span class="small-label">YOUR BOARD, REIMAGINED</span><span class="preview-badge">LIVE PREVIEW</span></div><div id="studio-board">${boardHTML(true)}</div><div class="studio-caption"><h3>A good place to think.</h3><p>Your style follows you into every game and lesson.</p><button class="primary-button" data-route="play">Back to the board ${icon('arrow')}</button></div></div><div class="studio-controls"><section class="panel"><div class="panel-header"><h2>The playing field</h2><span class="small-label">01 / COLOUR</span></div><div class="theme-grid">${themes.map(t=>`<button class="theme-option ${settings.theme===t.id?'chosen':''}" data-theme="${t.id}"><span class="theme-swatch" style="--l:${t.light};--d:${t.dark}"></span><span>${t.name}</span>${settings.theme===t.id?icon('check'):''}</button>`).join('')}</div><div class="custom-colors"><label>Light squares<input type="color" data-color="light" value="${settings.light}"></label><label>Dark squares<input type="color" data-color="dark" value="${settings.dark}"></label></div></section><section class="panel"><div class="panel-header"><h2>A cast of characters</h2><span class="small-label">02 / PIECES</span></div><div class="piece-options">${['classic','modern','letter'].map((p,i)=>`<button data-pieces="${p}" class="piece-option ${settings.pieces===p?'chosen':''}"><span>${pieceSvg('n','w',p,settings)}${pieceSvg('n','b',p,settings)}</span><strong>${['The classics','Modern lines','Letterpress'][i]}</strong></button>`).join('')}</div><div class="custom-colors"><label>White pieces<input type="color" data-color="whitePiece" value="${settings.whitePiece}"></label><label>Black pieces<input type="color" data-color="blackPiece" value="${settings.blackPiece}"></label></div></section><section class="panel preferences"><div class="panel-header"><h2>The little details</h2><span class="small-label">03 / YOUR WAY</span></div>${[['coordinates','Board coordinates','A little orientation never hurts.'],['legal','Legal move guides','See where your pieces can go.'],['sound','Move sounds','A quiet click for every move.']].map(([id,title,sub])=>`<label class="toggle-row"><span><strong>${title}</strong><small>${sub}</small></span><input type="checkbox" data-setting="${id}" ${settings[id]?'checked':''}><span class="toggle"></span></label>`).join('')}</section></div></div>`;
}
let confirmCallback=null;
function showDialog(html){const d=$('#dialog');d.innerHTML=`<button class="dialog-close icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('x')}</button>${html}`;d.showModal();}
function confirmDialog(title,body,callback,label='Confirm'){confirmCallback=callback;showDialog(`<p class="eyebrow">YOUR NEXT CHAPTER</p><h2>${title}</h2><p>${body}</p><div class="dialog-actions"><button class="subtle-button" data-action="close-dialog">Keep playing</button><button class="primary-button" data-action="confirm">${label} ${icon('arrow')}</button></div>`);}
$('#dialog').addEventListener('close',()=>{confirmCallback=null;});
document.addEventListener('click',e=>{
 const el=e.target.closest('button,a');if(!el)return;
 if(el.dataset.route){e.preventDefault();nav(el.dataset.route);return;}
 if(el.dataset.square){clickSquare(el.dataset.square);return;}
 if(el.dataset.mode){config.mode=el.dataset.mode;renderPlay();return;}
 if(el.dataset.level){config.level=el.dataset.level;renderPlay();return;}
 if(el.dataset.lesson!==undefined){startLesson(Number(el.dataset.lesson));return;}
 if(el.dataset.theme){const t=themes.find(t=>t.id===el.dataset.theme);settings.theme=t.id;settings.light=t.light;settings.dark=t.dark;save();applyTheme();renderStudio();return;}
 if(el.dataset.pieces){settings.pieces=el.dataset.pieces;save();renderStudio();return;}
 if(el.dataset.promote){const m={from:el.dataset.from,to:el.dataset.to,promotion:el.dataset.promote};$('#dialog').close();attemptMove(m);return;}
 const actions={
 'new-game':newGame,undo,hint:getHint,flip:()=>{orientation=orientation==='w'?'b':'w';save();refreshBoard();},export:exportPGN,resign,
 sound:()=>{settings.sound=!settings.sound;save();render();toast(settings.sound?'Move sounds on.':'Move sounds off.');},
 'reset-style':()=>{Object.assign(settings,defaults);save();render();toast('Back to the classics.');},
 'close-dialog':()=>$('#dialog').close(),confirm:()=>{const fn=confirmCallback;$('#dialog').close();confirmCallback=null;fn?.();},
 practice:()=>{stopWork();regular=null;mode='bot';game=new Chess();moveList=[];result=null;config={mode:'bot',level:'beginner',side:'w'};newGame();}
 };actions[el.dataset.action]?.();
});
document.addEventListener('change',e=>{
 const el=e.target;if(el.id==='side-select'){config.side=el.value;return;}
 if(el.dataset.setting){settings[el.dataset.setting]=el.checked;save();if(el.dataset.setting==='coordinates')$('#studio-board').innerHTML=boardHTML(true);}
 if(el.dataset.color){settings[el.dataset.color]=el.value;if(['light','dark'].includes(el.dataset.color))settings.theme='custom';save();applyTheme();renderStudio();}
});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.color){settings[el.dataset.color]=el.value;if(['light','dark'].includes(el.dataset.color))settings.theme='custom';applyTheme();$('#studio-board').innerHTML=boardHTML(true);}});
let dragFrom=null;
document.addEventListener('dragstart',e=>{const square=e.target.closest('[data-square]');if(!square||!canMove()){e.preventDefault();return;}const p=game.get(square.dataset.square);if(!p||p.color!==game.turn()){e.preventDefault();return;}dragFrom=square.dataset.square;e.dataTransfer.setData('text/plain',dragFrom);e.dataTransfer.effectAllowed='move';});
document.addEventListener('dragover',e=>{if(e.target.closest('[data-square]'))e.preventDefault();});
document.addEventListener('drop',e=>{const sq=e.target.closest('[data-square]');if(!sq||!dragFrom)return;e.preventDefault();selected=dragFrom;dragFrom=null;clickSquare(sq.dataset.square);});
document.addEventListener('dragend',()=>{dragFrom=null;});
document.addEventListener('keydown',e=>{const square=e.target.closest('[data-square]');if(!square)return;if(e.key==='Escape'){selected=null;hint=null;refreshBoard();return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const squares=[...document.querySelectorAll('[data-square]')],i=squares.indexOf(square),offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8}[e.key];squares[i+offset]?.focus();});
checkResult();render();scheduleBot();
