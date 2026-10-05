const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{create}=require('./host-model.cjs');
(async()=>{
 const env=create(),calls=[],errors=[];
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:380,height:650}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.exposeFunction('hostRpc',p=>{calls.push(p);return env.rpc(p);});
  await page.addInitScript(()=>{const bridge={isAvailable:()=>true,isReady:()=>true,call:async p=>{const r=await hostRpc(p);if(!r.ok)throw Error(r.message);return r;}};Object.defineProperty(window,'MotionAstraBridge',{get:()=>bridge,set(){}});});
  await page.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.waitForFunction(()=>window.ZxTSelection.context());
  assert.equal(await page.locator('#copy-motion,#paste-motion,#selected-layer-inspector').count(),0);
  await page.locator('[data-workspace="Motion"]').click();
  assert(await page.locator('#tweaker-load').isVisible());
  await page.locator('[data-workspace="Create"]').click();
  const cards=['create-text','create-shape','create-background'];
  for(const id of cards){
   assert.equal(await page.locator('#'+id+' details').evaluate(e=>e.open),false);
   assert(await page.locator('#'+id+' button[type=submit]').isVisible());
  }
  await page.locator('#create-text summary').click();
  await page.locator('#new-text-content').fill('Create draft');
  await page.locator('#new-text-size').fill('72');
  await page.locator('#create-text summary').click();
  await page.locator('[data-workspace="Library"]').click();
  await page.locator('[data-workspace="Create"]').click();
  assert.equal(await page.locator('#new-text-content').inputValue(),'Create draft');
  for(const kind of ['newText','newShape','newSolid']){
   const before=env.comp.numLayers;
   await page.locator('[data-create="'+kind+'"]').click();
   await page.waitForFunction(k=>!document.querySelector('[data-create="'+k+'"]').disabled,kind);
   assert.equal(env.comp.numLayers,before+1,'Exactly one layer per Create click');
   assert.equal(calls.filter(p=>p.name===kind).length,1);
  }
  assert.equal(calls.find(p=>p.name==='newText').text,'Create draft');
  assert.equal(calls.find(p=>p.name==='newText').size,72);
  // Invalid hidden controls are exposed for native validation rather than failing focus.
  await page.locator('#create-text summary').click();
  await page.locator('#new-text-content').fill('');
  await page.locator('#create-text summary').click();
  await page.locator('[data-create="newText"]').click();
  assert.equal(await page.locator('#create-text details').evaluate(e=>e.open),true);
  assert.equal(calls.filter(p=>p.name==='newText').length,1);
  await page.locator('#new-text-content').fill('Valid');
  await page.locator('#create-text summary').click();
  // Cross-panel search reveals a collapsed parameter without changing its draft.
  await page.locator('#toggle-search').click();await page.locator('#search').fill('Size · px');
  await page.locator('#search-results button').filter({hasText:'Size · px'}).first().click();
  assert.equal(await page.locator('#create-text details').evaluate(e=>e.open),true);
  assert.equal(await page.locator('#new-text-size').inputValue(),'72');
  await page.locator('#create-text summary').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#create-text details').evaluate(e=>e.open),false);
  for(const [width,height] of [[300,360],[380,650],[680,480],[1200,720]]){
   await page.setViewportSize({width,height});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
   for(const id of cards){await page.locator('#'+id+' button[type=submit]').scrollIntoViewIfNeeded();assert(await page.locator('#'+id+' button[type=submit]').isVisible());}
  }
  assert(!calls.some(p=>p.action==='copyMotion'||p.action==='pasteMotion'));
  const offline=await browser.newPage();await offline.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../catalog.html')).href);
  await offline.locator('[data-workspace="Create"]').click();
  assert.equal(await offline.locator('#copy-motion,#paste-motion,#selected-layer-inspector').count(),0);
  for(const kind of ['newText','newShape','newSolid'])assert(await offline.locator('[data-create="'+kind+'"]').isDisabled());
  assert.deepEqual(errors,[]);
  console.log('PASS: removed tools, independent disclosures, reachable Create actions, one layer/click, preserved drafts, validation reveal, keyboard/search, responsive and offline safety.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
