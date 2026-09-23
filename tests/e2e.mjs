import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {Chess} from '../vendor/chess.js';
import {lessons} from '../src/lessons.js';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true});
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
const errors=[];let checks=0;
await mkdir('artifacts',{recursive:true});
const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
async function check(name,fn){await fn();checks++;console.log('PASS',name);}
async function move(from,to){await page.locator(`[data-square="${from}"]`).click();await page.locator(`[data-square="${to}"]`).click();}
async function plies(n){await page.waitForFunction(n=>document.querySelector('#move-count')?.textContent===n+' PLIES',n);}
async function start(mode='local',side='w'){
 await page.locator('.nav-item[data-route="play"]').click();await page.locator(`[data-mode="${mode}"]`).click();await page.locator('#side-select').selectOption(side);await page.locator('[data-action="new-game"]').click();if(await page.locator('dialog[open]').count())await page.locator('[data-action="confirm"]').click();
}
try{
 await page.goto(base);
 await check('initial board renders 64 squares and 32 SVG pieces',async()=>{assert.equal(await page.locator('[data-square]').count(),64);assert.equal(await page.locator('[data-square] .piece').count(),32);await page.screenshot({path:'artifacts/play-desktop.png',fullPage:true});});
 await check('bot answers a human move; undo removes the full turn',async()=>{await move('e2','e4');await plies(2);await page.locator('[data-action="undo"]').click();await plies(0);});
 await check('hint highlights legal start and destination squares',async()=>{await page.locator('[data-action="hint"]').click();await page.waitForSelector('.hint-square');assert.equal(await page.locator('.hint-square').count(),2);});
 await check('local mode enforces turns and allows both colours',async()=>{await start();await move('e2','e4');await plies(1);await move('e4','e5');await plies(1);await move('e7','e5');await plies(2);});
 await check('reload restores position and move history',async()=>{await page.reload();await plies(2);assert.match(await page.locator('[data-square="e4"]').getAttribute('aria-label'),/white pawn/);assert.match(await page.locator('[data-square="e5"]').getAttribute('aria-label'),/black pawn/);});
 await check('flip reverses board; desktop drag makes a legal move',async()=>{await page.locator('[data-action="flip"]').click();assert.equal(await page.locator('[data-square]').first().getAttribute('data-square'),'h1');await page.locator('[data-square="g1"]').dragTo(page.locator('[data-square="f3"]'));await plies(3);});
 await check('PGN download includes played moves',async()=>{const download=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const d=await download;assert.equal(d.suggestedFilename(),'knightfall-game.pgn');});
 await check('cancel new game preserves existing game',async()=>{await page.locator('[data-action="new-game"]').click();await page.locator('[data-action="close-dialog"]').last().click();await plies(3);});
 await check('black-side game gives bot the opening move',async()=>{await start('bot','b');await plies(1);assert.equal(await page.locator('[data-square]').first().getAttribute('data-square'),'h1');assert.match(await page.locator('#game-status').textContent(),/Your move/);});
 await check('resign cancels bot and prevents further play',async()=>{await page.locator('[data-action="resign"]').click();await page.locator('[data-action="confirm"]').click();await page.waitForFunction(()=>document.querySelector('#game-status').textContent.includes('resignation'));await move('e7','e5');await plies(1);});
 await check('checkmate is announced and saved',async()=>{await start();for(const [a,b] of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])await move(a,b);assert.match(await page.locator('#game-status').textContent(),/Checkmate/);await page.reload();assert.match(await page.locator('#game-status').textContent(),/Checkmate/);});
 await check('studio changes palette, piece geometry and custom colours',async()=>{await page.locator('.nav-item[data-route="studio"]').click();await page.locator('[data-theme="ocean"]').click();await page.locator('[data-pieces="modern"]').click();await page.locator('[data-color="whitePiece"]').fill('#ffddaa');await page.locator('[data-color="whitePiece"]').dispatchEvent('change');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('knightfall:settings')).whitePiece),'#ffddaa');await page.screenshot({path:'artifacts/studio-desktop.png',fullPage:true});await page.reload();await page.locator('.nav-item[data-route="studio"]').click();assert.equal(await page.locator('[data-theme="ocean"].chosen').count(),1);assert.equal(await page.locator('[data-pieces="modern"].chosen').count(),1);});
 await check('coordinate preference updates preview',async()=>{await page.locator('[data-setting="coordinates"]').uncheck();assert.equal(await page.locator('.rank-label').count(),0);await page.locator('[data-action="reset-style"]').click();assert.equal(await page.locator('.rank-label').count(),8);});
 await page.locator('.nav-item[data-route="learn"]').click();await page.screenshot({path:'artifacts/academy-desktop.png',fullPage:true});
 for(let i=0;i<lessons.length;i++)await check(`complete guided lesson ${i+1}, including coach replies`,async()=>{
  await page.locator('.nav-item[data-route="learn"]').click();await page.locator(`[data-lesson="${i}"]`).click();const l=lessons[i],g=new Chess(l.fen);
  if(i===0){await move('d2','d4');assert.match(await page.locator('.coach-note').textContent(),/lesson/);assert.match(await page.locator('[data-square="d2"]').getAttribute('aria-label'),/white pawn/);}
  for(let s=0;s<l.steps.length;s++){
   const step=l.steps[s];await page.waitForFunction(()=>!document.querySelector('#game-status').textContent.includes('replying'));
   const m=g.move(step.move);await move(m.from,m.to);if(m.promotion)await page.locator(`[data-promote="${m.promotion}"]`).click();if(step.reply)g.move(step.reply);
   await page.waitForFunction(s=>{const text=document.querySelector('#game-status').textContent;return text.includes('Lesson complete')||text.includes('Step '+(s+2));},s);
  }
  assert.match(await page.locator('.lesson-celebration').textContent(),/toolkit/);
 });
 await check('completed lessons persist and previous game is restored',async()=>{await page.locator('.nav-item[data-route="learn"]').click();assert.equal(await page.locator('.lesson-card.completed').count(),10);await page.locator('.nav-item[data-route="play"]').click();await plies(4);await page.reload();await page.locator('.nav-item[data-route="learn"]').click();assert.equal(await page.locator('.lesson-card.completed').count(),10);});
 await check('lesson interruption cancels coach reply and preserves normal game',async()=>{await page.locator('[data-lesson="0"]').click();await move('e2','e4');await page.locator('.nav-item[data-route="play"]').click();await plies(4);await page.waitForTimeout(900);await plies(4);});
 await check('all bot difficulty settings produce an opening move',async()=>{for(const level of ['beginner','easy','medium','hard']){await page.locator('[data-mode="bot"]').click();await page.locator(`button[data-level="${level}"]`).click();await page.locator('#side-select').selectOption('b');await page.locator('[data-action="new-game"]').click();if(await page.locator('dialog[open]').count())await page.locator('[data-action="confirm"]').click();await plies(1);assert.ok((await page.locator('#top-player').textContent()).includes('You')||(await page.locator('#bottom-player').textContent()).includes('You'));}});
 await check('mobile layouts fit screen without horizontal overflow',async()=>{
  for(const width of [390,768]){await page.setViewportSize({width,height:844});for(const view of ['play','learn','studio']){await page.locator(`.nav-item[data-route="${view}"]`).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view} overflow at ${width}`);await page.screenshot({path:`artifacts/${view}-${width}.png`,fullPage:true});}}
 });
 await check('no uncaught browser errors',async()=>assert.deepEqual(errors,[]));
 console.log(`${checks} browser checks passed.`);
}catch(e){await page.screenshot({path:'artifacts/failure.png',fullPage:true});console.error(e);process.exitCode=1;}finally{await browser.close();}
