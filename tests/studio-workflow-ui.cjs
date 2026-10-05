const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{create}=require('./host-model.cjs');
(async()=>{
 const env=create(),text=env.comp.add('text');text.name='Title';text.selected=true;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu']});
 try {
 const page=await browser.newPage({viewport:{width:380,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));let timeoutNext=false;await page.exposeFunction('hostRpc',p=>{if(timeoutNext && p.action==='apply'){timeoutNext=false;throw Error('Host response timed out');}return env.rpc(p);});
 await page.addInitScript(()=>{const bridge={isAvailable:()=>true,isReady:()=>true,call:async p=>{const r=await hostRpc(p);if(!r.ok)throw Error(r.message);return r;}};Object.defineProperty(window,'MotionAstraBridge',{get:()=>bridge,set(){}});});
 await page.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 assert.deepEqual(await page.locator('[data-workspace]').allTextContents(),['Library','Motion','Create']);
 await page.locator('.customize').first().click();await page.locator('#apply').click();
 await page.waitForFunction(()=>!document.querySelector('#update').hidden);
 assert(await page.locator('#apply').isHidden());assert(await page.locator('#update').isDisabled(),'Clean Update disabled');
 const count=text.fx.numProperties;await page.locator('#param-end').fill('800');await page.locator('#update').click();await page.waitForFunction(()=>!document.querySelector('#quick-anchor').disabled);assert.equal(text.fx.numProperties,count);
 await page.locator('#param-end').fill('825');await page.locator('#close').click();
 await page.locator('.customize').first().click();assert.equal(await page.locator('#param-end').inputValue(),'825','Loaded draft survives Back');await page.locator('#close').click();
 text.selected=false;const other=env.comp.add('text');other.name='Other';other.selected=true;
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>document.querySelector('#selection-summary').textContent.includes('Other'));
 await page.locator('.customize').first().click();assert.notEqual(await page.locator('#param-end').inputValue(),'825','No draft transfer to another layer');await page.locator('#close').click();
 other.selected=false;text.selected=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>document.querySelector('#selection-summary').textContent.includes('Title'));
 await page.locator('.customize').first().click();assert.equal(await page.locator('#param-end').inputValue(),'825');await page.locator('#close').click();
 for(const width of [300,380,759,760,920,1200]) {
  await page.setViewportSize({width,height:720});
  assert.equal(await page.locator('#inspector-empty').isVisible(),width>=760,'Wide idle Inspector guidance');
  await page.locator('.yu-customize').nth(12).scrollIntoViewIfNeeded();
  const saved=await page.evaluate(()=>document.querySelector('main').scrollTop);
  await page.locator('.yu-customize').nth(12).click();
  assert.equal(await page.locator('main').isVisible(),width>=760);
  assert(await page.locator('#yu-editor').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
  const a=await page.locator('.yu-actions').boundingBox(),f=await page.locator('footer').boundingBox();assert(a.y+a.height<=f.y+1,'actions '+width);
  await page.locator('#yu-back').click();assert(await page.locator('main').isVisible());
  assert.equal(await page.evaluate(()=>document.querySelector('main').scrollTop),saved,'Back restores scroll');
  await page.locator('[data-tab="Background"]').click();await page.locator('.customize').first().click();
  assert.equal(await page.locator('main').isVisible(),width>=760);await page.locator('#close').click();await page.locator('[data-tab="YU"]').click();
 }
 await page.locator('.yu-customize').nth(20).scrollIntoViewIfNeeded();
 const previousScroll=await page.evaluate(()=>document.querySelector('main').scrollTop);assert(previousScroll>0,'Library uses one scroll container');
 await page.locator('[data-workspace="Motion"]').click();assert(await page.locator('#tools').isVisible());await page.locator('[data-tab="Curve"]').click();assert(await page.locator('#motion-curve').isVisible());
 await page.locator('[data-workspace="Create"]').click();assert(await page.locator('#create').isVisible());
 await page.locator('[data-workspace="Library"]').click();assert.equal(await page.evaluate(()=>document.querySelector('main').scrollTop),previousScroll,'Workspace switch restores library scroll');
 text.selected=false;other.selected=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>document.querySelector('#selection-summary').textContent.includes('Other'));
 await page.locator('.customize').first().click();timeoutNext=true;await page.locator('#apply').click();await page.waitForFunction(()=>!document.querySelector('#recovery').hidden);assert(await page.locator('#apply').isDisabled());
 await page.locator('#recovery-continue').click();await page.waitForFunction(()=>document.querySelector('#recovery').hidden);assert.equal(other.fx.numProperties,0,'Uncertain reply is never automatically retried');
 assert.deepEqual(errors,[]);console.log('PASS: Studio navigation, Apply/Update binding, responsive editors and reachable actions');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
