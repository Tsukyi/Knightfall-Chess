import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../vendor/chess.js';
import {chooseMove,levels} from '../src/engine.js';
import {lessons} from '../src/lessons.js';

test('starting-position legal tree matches reference perft counts',()=>{
 const g=new Chess();assert.equal(g.perft(1),20);assert.equal(g.perft(2),400);assert.equal(g.perft(3),8902);assert.equal(g.perft(4),197281);
});
test('complex castling position matches reference perft counts',()=>{
 const g=new Chess('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');assert.equal(g.perft(1),48);assert.equal(g.perft(2),2039);assert.equal(g.perft(3),97862);
});
test('cannot move through check, castle through attacked squares, or capture own pieces',()=>{
 const g=new Chess();assert.equal(g.move({from:'e1',to:'e2'}),null);assert.equal(g.move({from:'a1',to:'a5'}),null);
 const c=new Chess('r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1');assert.equal(c.moves().includes('O-O'),false);assert.ok(c.moves().includes('O-O-O'));
});
test('en passant captures and expires after one move',()=>{
 const fen='6k1/7p/8/3pP3/8/8/8/6K1 w - d6 0 2';const g=new Chess(fen);assert.ok(g.move('exd6'));assert.equal(g.get('d5'),null);assert.equal(g.get('d6').type,'p');g.undo();assert.equal(g.fen(),fen);g.move('Kf1');g.move('h6');assert.equal(g.moves().includes('exd6'),false);
});
test('all four promotions are offered',()=>{
 const g=new Chess('8/4P2k/8/8/8/8/6Kp/8 w - - 0 1');assert.equal(g.moves({square:'e7',verbose:true}).filter(m=>m.promotion).length,4);assert.ok(g.move({from:'e7',to:'e8',promotion:'n'}));assert.equal(g.get('e8').type,'n');
});
test('checkmate, stalemate, insufficient material and repetition',()=>{
 const m=new Chess();for(const s of ['f3','e5','g4','Qh4#'])assert.ok(m.move(s));assert.ok(m.in_checkmate());
 assert.ok(new Chess('7k/5Q2/5K2/8/8/8/8/8 b - - 0 1').in_stalemate());
 assert.ok(new Chess('7k/8/5K2/8/8/8/8/8 w - - 0 1').insufficient_material());
 const r=new Chess();for(let i=0;i<2;i++)for(const s of ['Nf3','Nf6','Ng1','Ng8'])r.move(s);assert.ok(r.in_threefold_repetition());
 assert.ok(new Chess('7k/8/5K2/8/8/8/8/R7 w - - 100 51').in_draw());
});
test('PGN reload preserves game history, position and repetition',()=>{
 const g=new Chess();for(const s of ['e4','e5','Nf3','Nc6','Bc4','Bc5','O-O'])g.move(s);const copy=new Chess();assert.ok(copy.load_pgn(g.pgn()));assert.equal(copy.fen(),g.fen());assert.deepEqual(copy.history(),g.history());
 const repeated=new Chess();for(let i=0;i<2;i++)for(const s of ['Nf3','Nf6','Ng1','Ng8'])repeated.move(s);copy.load_pgn(repeated.pgn());assert.ok(copy.in_threefold_repetition());
});
for(const l of lessons)test(`guided lesson: ${l.title}`,()=>{
 const g=new Chess(l.fen);assert.ok(g.validate_fen(g.fen()).valid);
 for(const step of l.steps){assert.equal(g.game_over(),false,'lesson must allow another move');const move=g.move(step.move);assert.ok(move,step.move);assert.equal(move.san,step.move);if(step.reply)assert.ok(g.move(step.reply),step.reply);}
 if(l.id==='mate')assert.ok(g.in_checkmate());
});
for(const level of levels)test(`${level.label} bot returns a legal move`,()=>{
 const g=new Chess();g.move('e4');const fen=g.fen();const move=chooseMove({fen,level:level.id,random:()=>.99,time:150});assert.ok(move);assert.ok(g.move(move));assert.notEqual(g.fen(),fen);
});
test('hard bot finds mate in one and never proposes a move in a finished game',()=>{
 const fen='7k/8/5KQ1/8/8/8/8/8 w - - 0 1';const g=new Chess(fen);const move=chooseMove({fen,level:'hard',random:()=>.99});assert.ok(g.move(move));assert.ok(g.in_checkmate());assert.equal(chooseMove({fen:g.fen(),level:'hard'}),null);
});
test('beginner can choose non-optimal legal moves with configured randomness',()=>{
 const g=new Chess();const move=chooseMove({fen:g.fen(),level:'beginner',random:()=>0});assert.equal(move.depth,0);assert.ok(g.move(move));
});
