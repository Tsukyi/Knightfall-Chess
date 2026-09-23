import {Chess} from '../vendor/chess.js';
export const levels=[
 {id:'beginner',name:'Sprout',label:'Beginner',depth:1,time:100,random:0.65,description:'A friendly first opponent. Still finding its feet.'},
 {id:'easy',name:'Scout',label:'Easy',depth:2,time:250,random:0.15,description:'Sees captures and develops its pieces. Keep an eye on yours.'},
 {id:'medium',name:'Sage',label:'Medium',depth:3,time:800,random:0,description:'Thinks a few moves ahead. Bring a plan.'},
 {id:'hard',name:'Sentinel',label:'Hard',depth:4,time:2000,random:0,description:'Our deepest search. Patient, tactical, and hard to distract.'}
];
const values={p:100,n:320,b:335,r:500,q:900,k:0};
export function evaluate(game){
 let score=0;
 const board=game.board();
 let material=0;
 for(const row of board)for(const p of row)if(p&&p.type!=='p')material+=values[p.type];
 for(let r=0;r<8;r++)for(let f=0;f<8;f++){
  const p=board[r][f];if(!p)continue;
  const advance=p.color==='w'?6-r:r-1;
  const center=7-(Math.abs(3.5-f)+Math.abs(3.5-r));
  let bonus=0;
  if(p.type==='p')bonus=advance*9+center*3+(f===3||f===4?8:0);
  if(p.type==='n')bonus=center*15-((r===0||r===7||f===0||f===7)?15:0);
  if(p.type==='b')bonus=center*7;
  if(p.type==='r')bonus=advance*2+(advance===5?20:0);
  if(p.type==='q')bonus=center*3;
  if(p.type==='k')bonus=material<1800?center*12:((p.color==='w'?r===7:r===0)&&(f===6||f===2)?45:0)-center*8;
  score+=(values[p.type]+bonus)*(p.color==='w'?1:-1);
 }
 return score*(game.turn()==='w'?1:-1);
}
const order=m=>(m.captured?10*values[m.captured]-values[m.piece]:0)+(m.promotion?values[m.promotion]:0)+(m.san.includes('+')?35:0);
/** Search owns a private board; the UI runs this module in a cancellable worker. */
export function chooseMove({fen,pgn,level='medium',time,random=Math.random}){
 const config=levels.find(l=>l.id===level)||levels[2];
 const game=new Chess(fen);
 if(pgn)game.load_pgn(pgn);
 if(game.game_over())return null;
 const moves=game.moves({verbose:true}).sort((a,b)=>order(b)-order(a));
 if(random()<config.random)return {...moves[Math.floor(random()*moves.length)],depth:0,nodes:0};
 const deadline=performance.now()+(time??config.time);
 let nodes=0,completedDepth=0,best=moves[0],bestScore=-Infinity;
 const timeout=Symbol('timeout');
 function search(depth,alpha,beta,ply){
  if(++nodes%32===0&&performance.now()>deadline)throw timeout;
  if(game.in_checkmate())return -100000+ply;
  if(game.in_draw())return 0;
  if(depth===0)return evaluate(game);
  let score=-Infinity;
  const legal=game.moves({verbose:true}).sort((a,b)=>order(b)-order(a));
  for(const m of legal){
   game.move(m);let value;
   try{value=-search(depth-1,-beta,-alpha,ply+1);}finally{game.undo();}
   score=Math.max(score,value);alpha=Math.max(alpha,value);
   if(alpha>=beta)break;
  }
  return score;
 }
 for(let depth=1;depth<=config.depth;depth++){
  let candidate=moves[0],candidateScore=-Infinity,alpha=-Infinity;
  try{
   for(const m of moves){
    if(performance.now()>deadline&&completedDepth>0)throw timeout;
    game.move(m);let score;
    try{score=-search(depth-1,-Infinity,-alpha,1);}finally{game.undo();}
    if(score>candidateScore){candidate=m;candidateScore=score;}
    alpha=Math.max(alpha,score);
   }
   best=candidate;bestScore=candidateScore;completedDepth=depth;
   moves.sort((a,b)=>Number(b===best)-Number(a===best)||order(b)-order(a));
   if(bestScore>99000)break;
  }catch(e){if(e!==timeout)throw e;break;}
 }
 return {...best,score:Number.isFinite(bestScore)?bestScore:0,depth:completedDepth,nodes};
}
