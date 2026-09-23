export const lessons=[
 {id:'opening',title:'Your first three moves',tag:'THE FOUNDATIONS',piece:'p',duration:'3 min',description:'Pawns, knights, bishops. Give your army room to breathe.',steps:[
  {move:'e4',reply:'e5',text:'Pawns move forward, but capture diagonally. On its first move, a pawn can advance two squares. Move your e2 pawn to e4 to claim the centre.',hint:'Select e2, then e4.',after:'Space to think. Your pawn opens a path for the bishop and queen.'},
  {move:'Nf3',reply:'Nc6',text:'Knights move in an L: two squares one way, then one across. They can jump over pieces. Develop your g1 knight to f3 and attack the e5 pawn.',hint:'The knight on g1 can jump to f3.',after:'A central knight attacks more squares than one at the edge.'},
  {move:'Bc4',reply:'Bc5',text:'Bishops travel diagonally and stay on their starting colour. Move your f1 bishop to c4, pointing towards the black king.',hint:'Follow the diagonal f1–e2–d3–c4.',after:'You played the Italian Game: centre control and quick development.'}
 ]},
 {id:'rook',title:'Take the open file',tag:'MEET THE PIECES',piece:'r',duration:'2 min',description:'Move in straight lines. Turn open space into opportunity.',fen:'6k1/p6p/8/8/8/8/6PP/R5K1 w - - 0 1',steps:[
  {move:'Rxa7',reply:'h6',text:'Rooks travel any distance along a rank or file, but cannot jump. Use the clear a-file to capture the pawn on a7.',hint:'Move the rook from a1 to a7.',after:'The seventh rank is a strong home for an active rook.'},
  {move:'Ra8+',reply:'Kf7',text:'A check attacks the king. Your opponent must respond. Move the rook to a8 and give check along the eighth rank.',hint:'Move a7 to a8.',after:'The coach must move its king out of check.'}
 ]},
 {id:'bishop',title:'Find the diagonal',tag:'MEET THE PIECES',piece:'b',duration:'2 min',description:'Spot a long diagonal and win a loose piece.',fen:'6k1/7p/6r1/8/8/8/6PP/1B4K1 w - - 0 1',steps:[
  {move:'Bxg6',reply:'h6',text:'Your bishop can see a loose rook along the b1–g6 diagonal. Capture it. A bishop is usually worth 3 pawns; a rook is worth 5.',hint:'Move your bishop from b1 to g6.',after:'A clean capture wins material. Always scan long diagonals.'}
 ]},
 {id:'queen',title:'Queen of the board',tag:'MEET THE PIECES',piece:'q',duration:'2 min',description:'Combine rook and bishop movement in one powerful piece.',fen:'6k1/7p/8/8/3r4/8/6PP/3Q2K1 w - - 0 1',steps:[
  {move:'Qxd4',reply:'h6',text:'The queen moves along ranks, files, and diagonals. Capture the unprotected rook on d4 with your queen.',hint:'Move d1 to d4.',after:'Powerful does not mean invincible. Keep the queen safe from lesser pieces.'}
 ]},
 {id:'king',title:'A king needs space',tag:'KING SAFETY',piece:'k',duration:'2 min',description:'Escape a check without walking into another attack.',fen:'4r1k1/7p/8/8/8/8/8/4K3 w - - 0 1',steps:[
  {move:'Kd2',reply:'h6',text:'Your king is in check from the e8 rook. Kings move one square in any direction, but never into check. Escape to d2.',hint:'Move the king from e1 to d2. Squares on the e-file are attacked.',after:'You cannot ignore check. Move the king, block the attack, or capture the attacker.'}
 ]},
 {id:'castle',title:'A little royal insurance',tag:'SPECIAL MOVES',piece:'k',duration:'3 min',description:'Tuck your king away and bring your rook into the game.',fen:'r3k2r/ppp2ppp/2npbn2/4p3/4P3/2NPBN2/PPP2PPP/R3K2R w KQkq - 0 1',steps:[
  {move:'O-O',reply:'O-O',text:'Castle by moving your king two squares towards the rook: e1 to g1. Neither piece may have moved, the path must be clear, and the king cannot castle out of, through, or into check.',hint:'Select the king on e1, then g1. The rook moves automatically.',after:'Your king is sheltered; your rook is closer to the centre.'}
 ]},
 {id:'fork',title:'Two threats. One knight.',tag:'TACTICS',piece:'n',duration:'3 min',description:'Attack the king and queen at the same time.',fen:'4k3/8/8/3N4/4q3/8/8/6K1 w - - 0 1',steps:[
  {move:'Nf6+',reply:'Kd8',text:'Look for a knight move that checks the king on e8 and attacks the queen on e4. This double attack is called a fork.',hint:'Jump from d5 to f6.',after:'The king must escape check, leaving the queen behind.'},
  {move:'Nxe4',text:'The coach moved its king. Now collect the queen with your knight.',hint:'Move f6 to e4.',after:'Checks gain time. A knight fork can win a much more valuable piece.'}
 ]},
 {id:'promotion',title:'Small pawn. Big future.',tag:'SPECIAL MOVES',piece:'p',duration:'2 min',description:'Reach the final rank and choose your promotion.',fen:'8/4P2k/8/8/8/8/6Kp/8 w - - 0 1',steps:[
  {move:'e8=Q',reply:'h1=Q+',text:'A pawn reaching the last rank becomes a queen, rook, bishop, or knight. Move e7 to e8 and choose a queen.',hint:'Move e7 to e8, then choose Queen.',after:'Promotion can change everything. The coach promotes too, so stay alert!'},
  {move:'Kxh1',text:'The new black queen checks you, but it is unprotected. Your king may capture an attacker when the destination is safe.',hint:'Capture the queen by moving g2 to h1.',after:'Even a queen needs protection. Your promotion left you with a winning advantage.'}
 ]},
 {id:'en-passant',title:'The passing pawn',tag:'SPECIAL MOVES',piece:'p',duration:'3 min',description:'Learn chess’s sneakiest pawn capture.',fen:'6k1/7p/8/3pP3/8/8/8/6K1 w - d6 0 2',steps:[
  {move:'exd6',reply:'h6',text:'Black just moved its pawn from d7 to d5, passing your e5 pawn. On this move only, you may capture it as if it stopped on d6. Move e5 to d6.',hint:'Move your pawn diagonally from e5 to d6. The d5 pawn disappears.',after:'En passant must happen immediately after the two-square pawn move.'}
 ]},
 {id:'mate',title:'The final move',tag:'CHECKMATE',piece:'q',duration:'3 min',description:'Work with your king to deliver a decisive finish.',fen:'7k/8/5KQ1/8/8/8/8/8 w - - 0 1',steps:[
  {move:'Qg7#',text:'Checkmate means the king is attacked and has no legal escape. Move your queen to g7. Your king on f6 protects the queen, while she seals every exit.',hint:'Move g6 to g7.',after:'Checkmate! Your queen and king work together. You are ready for a full game.'}
 ]}
];
