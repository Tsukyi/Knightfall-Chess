export const pieceNames = {p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
const classic = {
 p:'<circle cx="32" cy="17" r="8"/><path d="M27 25h10l-2 10 8 11H21l8-11z"/><path d="M21 46h22l4 7H17z"/>',
 r:'<path d="M19 12h7v8h6v-8h6v8h7v-8h4v16l-7 5v12H22V33l-7-5V12z"/><path d="M21 45h22l5 8H16z"/><path d="M23 29h18" fill="none"/>',
 n:'<path d="M18 46c0-9 6-15 14-19l-9 2-8-6L28 9l7 5 7-4c7 12 10 24 2 36z"/><path d="M18 46h27l4 7H15z"/><path d="m24 24 8-7M34 30c9 1 7 9 3 13" fill="none"/><circle cx="32" cy="20" r="1.5" class="piece-eye"/>',
 b:'<path d="M32 9c-3 5-12 10-12 18 0 5 5 8 12 8s12-3 12-8c0-8-9-13-12-18z"/><path d="m35 19-7 9" fill="none"/><path d="M28 35h8l6 11H22zM21 46h22l5 7H16z"/><circle cx="32" cy="8" r="3"/>',
 q:'<path d="m17 19 6 7 3-14 6 12 7-12 3 14 6-7-7 21H23z"/><path d="M24 40h16l3 7H21zM21 47h22l5 6H16z"/><circle cx="16" cy="17" r="3"/><circle cx="26" cy="11" r="3"/><circle cx="39" cy="11" r="3"/><circle cx="49" cy="17" r="3"/>',
 k:'<path d="M29 8h6v5h6v6h-6v7h-6v-7h-6v-6h6z"/><path d="M32 29c-16-16-23 2-9 10h18c14-8 7-26-9-10z"/><path d="M24 39h16l3 8H21zM21 47h22l5 6H16z"/>'
};
const modern = {
 p:'<circle cx="32" cy="19" r="9"/><path d="M27 31h10l8 22H19z"/>',
 r:'<path d="M17 12h8v8h5v-8h5v8h5v-8h8v19l-8 5v17H24V36l-7-5z"/>',
 n:'<path d="m19 53 7-21-12-5L32 9l7 6 7-4 3 23-8 19z"/><path d="m31 21 4-3" fill="none"/><path d="m29 42 10-12" fill="none"/>',
 b:'<path d="M32 8 46 28 35 37l10 16H19l10-16-11-9z"/><path d="m34 19-6 9" fill="none"/>',
 q:'<path d="m15 14 11 11 6-17 6 17 11-11-7 26H22zM23 43h18l5 10H18z"/>',
 k:'<path d="M29 7h6v7h7v6h-7v9h9l-7 13 8 11H19l8-11-7-13h9v-9h-7v-6h7z"/>'
};
export function pieceSvg(type,color,style='classic',settings={}) {
 const fill=color==='w'?(settings.whitePiece||'#faf8ed'):(settings.blackPiece||'#303c31');
 const stroke=color==='w'?'#465044':'#e6e7ce';
 if(style==='letter')return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="23" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text x="32" y="42" text-anchor="middle" fill="${stroke}" font-family="Georgia,serif" font-size="30" font-weight="bold">${type==='n'?'N':type.toUpperCase()}</text></svg>`;
 return `<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${(style==='modern'?modern:classic)[type]}</g></svg>`;
}
export const icons={
 play:'<path d="m8 5 11 7-11 7z"/>',book:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14"/>',palette:'<path d="M12 3a9 9 0 1 0 0 18h1c2 0 3-2 1-4-1-1 0-3 2-3h2c6 0 3-11-6-11Z"/><path d="M7 9h.01M11 6h.01M16 7h.01M6 14h.01"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',chevron:'<path d="m9 5 7 7-7 7"/>',undo:'<path d="m8 4-5 5 5 5M3 9h10a6 6 0 0 1 0 12"/>',flip:'<path d="M4 8h16l-4-4M20 16H4l4 4"/>',bulb:'<path d="M8 16c0-3-3-4-3-7a7 7 0 0 1 14 0c0 3-3 4-3 7M8 17h8M9 21h6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',flag:'<path d="M5 22V3c5-3 9 3 14 0v10c-5 3-9-3-14 0"/>',sound:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',check:'<path d="m5 12 4 4L19 6"/>',x:'<path d="m6 6 12 12M6 18 18 6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 5a3 3 0 0 1 0 6m1 4c3 0 4 3 4 6"/>',bot:'<rect x="4" y="7" width="16" height="14" rx="4"/><path d="M12 3v4M8 12h.01M16 12h.01M8 17h8M1 12v5m22-5v5"/>',reset:'<path d="M3 11a9 9 0 1 1 3 8M3 4v7h7"/>',spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',github:'<path d="M9 21v-3c-4 1-4-2-6-2m12 5v-4c0-1 0-2-1-2 4 0 7-2 7-6 0-2-1-3-2-4 0-1 0-3-1-3-2 0-3 1-4 1h-4c-1 0-2-1-4-1-1 0-1 2-1 3-1 1-2 2-2 4 0 4 3 6 7 6-1 0-1 1-1 3"/>'
};
export function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.spark}</svg>`;}
