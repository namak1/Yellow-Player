import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173'],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4173/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/');
 const prefs=()=>page.getByRole('button',{name:'Preferences',exact:true}).click();
 const dialog=page.getByRole('dialog');
 const drag=async(dx,dy)=>{const h=await page.locator('.dialog-drag-handle').boundingBox();await page.mouse.move(h.x+120,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x+120+dx,h.y+h.height/2+dy,{steps:12});await page.mouse.up();};
 await prefs();await dialog.waitFor();const initial=await dialog.boundingBox();
 await drag(-160,60);const moved=await dialog.boundingBox();assert.ok(moved.x<initial.x-100);assert.ok(moved.y>initial.y+30);
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();await prefs();let reopened=await dialog.boundingBox();assert.ok(Math.abs(moved.x-reopened.x)<2&&Math.abs(moved.y-reopened.y)<2);
 await page.reload();await prefs();reopened=await dialog.boundingBox();assert.ok(Math.abs(moved.x-reopened.x)<2&&Math.abs(moved.y-reopened.y)<2);
 await page.getByLabel('Subtitle text direction',{exact:true}).selectOption('rtl');assert.equal(await page.getByLabel('Subtitle text direction',{exact:true}).inputValue(),'rtl');
 await page.locator('.dialog-drag-handle').focus();await page.keyboard.press('ArrowRight');const keyboard=await dialog.boundingBox();assert.ok(Math.abs(keyboard.x-reopened.x-10)<2);
 await page.locator('.dialog-drag-handle h2').dblclick();const centered=await dialog.boundingBox();assert.ok(Math.abs(centered.x-(1400-centered.width)/2)<2);
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.locator('input[type=file]').nth(1).setInputFiles('tests/fixtures/test.srt');
 await page.getByRole('button',{name:'Yellow Player menu',exact:true}).click();await page.getByRole('menuitem',{name:'Subtitles',exact:true}).hover();await page.getByRole('menuitem',{name:'Subtitle browser / editor…',exact:true}).click();
 await page.getByRole('dialog',{name:'cues',exact:true}).waitFor();const subtitleInitial=await dialog.boundingBox();await drag(100,40);const subtitleMoved=await dialog.boundingBox();assert.ok(subtitleMoved.x>subtitleInitial.x+60);
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();await prefs();const prefAgain=await dialog.boundingBox();assert.ok(Math.abs(prefAgain.x-centered.x)<2);
 await drag(5000,5000);let edge=await dialog.boundingBox();assert.ok(edge.x+edge.width<=1400&&edge.y+edge.height<=1000);
 await page.setViewportSize({width:600,height:420});await page.waitForTimeout(150);edge=await dialog.boundingBox();assert.ok(edge.x>=0&&edge.y>=0&&edge.x+edge.width<=601&&edge.y+edge.height<=421);
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.setViewportSize({width:1400,height:1000});await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await page.keyboard.press('F5');await dialog.waitFor();edge=await dialog.boundingBox();assert.ok(edge.x>=0&&edge.y>=0&&edge.x+edge.width<=1401&&edge.y+edge.height<=1001);
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/movable-preferences.png'});
 assert.deepEqual(errors,[]);console.log('PASS: Preferences and Subtitle Browser drag, persisted independent positions, controls, keyboard move, centering, edge bounds, resize and fullscreen');
}finally{await browser?.close();server.kill();}
