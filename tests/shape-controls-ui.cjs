const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright'),{setup}=require('./shape-fixture.cjs');
(async()=>{const e=setup(),l=e.shape();l.selected=true;const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try {
 const page=await browser.newPage({viewport:{width:380,height:720}}),errors=[];page.on('pageerror',x=>errors.push(x.message));await page.exposeFunction('hostRpc',p=>e.rpc(p));
 await page.addInitScript(()=>{const bridge={isAvailable:()=>true,isReady:()=>true,call:async p=>{const r=await hostRpc(p);if(!r.ok)throw Error(r.message);return r;}};Object.defineProperty(window,'MotionAstraBridge',{get:()=>bridge,set(){}});});
 await page.goto(pathToFileURL(path.resolve('index.html')).href);await page.locator('[data-tab="Shape"]').click();
 await page.locator('[data-preset="glow"] .shape-select').click();await page.locator('#shape-apply').click();await page.waitForFunction(()=>!document.getElementById('shape-update').hidden);
 const r=JSON.parse(l.comment.split('[ZXT_SHAPE]')[1].split('[/ZXT_SHAPE]')[0]).instances[0],slider=l.fx.property(r.controls.find(c=>c.key==='radius').name).property(1);slider.setValueAtTime(2,30);slider.setValueAtTime(3,40);
 await page.locator('#shape-load').click();await page.waitForFunction(()=>document.getElementById('shape-param-radius').value==='40');
 assert(await page.locator('#shape-param-radius').isDisabled(),'panel must not offer destructive edits to keyed AE control');
 assert((await page.locator('label[for="shape-param-radius"]').textContent()).includes('AE animation'));
 await page.locator('#shape-param-intensity').fill('2');await page.locator('#shape-update').click();await page.waitForFunction(()=>document.getElementById('shape-update').disabled);assert.deepEqual(slider.keys,[30,40]);
 await page.locator('#shape-back').click();
 for(const id of ['gaussian-blur','drop-shadow','turbulent-displace']) {await page.locator(`[data-preset="${id}"] .shape-select`).click();await page.locator('#shape-apply').click();await page.waitForFunction(()=>!document.getElementById('shape-update').hidden);assert(await page.locator('#shape-update').isDisabled());await page.locator('#shape-back').click();}
 await page.locator('#shape-category').selectOption('FX');assert.equal(await page.locator('#shape-library .card').count(),5);
 assert.deepEqual(errors,[]);console.log('PASS Shape new FX Inspector Apply/Load/Update; live AE values and keyed-control protection');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
