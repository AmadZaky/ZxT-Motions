const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
require('./shape-fixture.cjs').setup(); // Install modeled vector/effect contracts.
const e=require('./media-fixture.cjs').setup(),media=e.media(),shape=e.comp.add('shape');
shape.id=701;shape.name='Shape fixture';
const group=shape.vectors.addProperty('ADBE Vector Group'),contents=group.property('ADBE Vectors Group');
contents.addProperty('ADBE Vector Shape - Group');contents.addProperty('ADBE Vector Graphic - Stroke').property('ADBE Vector Stroke Width').setValue(2);shape.selectedProperties=[];
vm.runInContext(fs.readFileSync('jsx/shape.jsx','utf8'),e.context);media.selected=true;
const calls=[],errors=[];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
 const context=await browser.newContext({viewport:{width:1200,height:720}});
 await context.exposeFunction('hostRpc',p=>{calls.push(p);return e.rpc(p);});
 await context.addInitScript(()=>{
  window.listenerCount=0;const add=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(...args){listenerCount++;return add.apply(this,args);};
  const bridge={isAvailable:()=>true,isReady:()=>true,call:async p=>{const r=await hostRpc(p);if(!r.ok)throw Error(r.message);return r;}};Object.defineProperty(window,'MotionAstraBridge',{get:()=>bridge,set(){}});
 });
 const url=pathToFileURL(path.resolve('index.html')).href;let page=await context.newPage();page.on('pageerror',x=>errors.push(x.message));await page.goto(url);
 const seed={favorites:['core:counter','yu:1','shape:glow','media:slide-up','core:neongrid','create:text','create:shape','create:solid','future:pilot'],recent:['core:counter','shape:glow','media:slide-up','core:neongrid','create:solid']};
 await page.evaluate(s=>localStorage.setItem('zxt-collections-v1',JSON.stringify(s)),seed);await page.reload();
 const listeners=await page.evaluate(()=>listenerCount);
 const tab=n=>page.locator(`[data-tab="${n}"]`).click();
 const mode=(scope,value)=>page.locator(`[data-collection-scope="${scope}"] [data-collection="${value}"]`).click();
 for(const width of [300,380,600,759,760,920,1200])for(const height of [300,720]){
  await page.setViewportSize({width,height});
  for(const section of ['Shape','Media']){
   const prefix=section.toLowerCase();await tab(section);await mode(section,'all');
   assert.equal(await page.locator(`#${prefix}-library .card`).count(),4);
   const id=section==='Shape'?'glow':'slide-up';await page.locator(`[data-preset="${id}"] .${prefix}-select`).click();
   assert.equal(await page.locator('main').isVisible(),width>=760);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
   const bounds=await page.evaluate(prefix=>{const i=document.getElementById(prefix+'-inspector'),a=i.querySelector('.inspector-actions').getBoundingClientRect(),f=document.querySelector('footer').getBoundingClientRect();return {over:i.scrollWidth>i.clientWidth,bottom:a.bottom,footer:f.top};},prefix);
   assert(!bounds.over);assert(bounds.bottom<=bounds.footer+1);
   // Narrow navigation returns through Back, as in existing Studio.
   await page.locator(`#${prefix}-back`).click();
   const other=section==='Shape'?'Media':'Shape';await tab(other);assert(await page.locator(`#${prefix}-inspector`).isHidden());
  }
  for(const section of ['YU','Background']){await tab(section);assert(await page.locator('#shape-inspector').isHidden());assert(await page.locator('#media-inspector').isHidden());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 }
 await page.setViewportSize({width:1200,height:720});await tab('Shape');await page.locator('#shape-category').selectOption('FX');await page.locator('#shape-search').fill('glow');await mode('Shape','favorites');assert.equal(await page.locator('#shape-library .card').count(),1);
 await tab('Media');assert.equal(await page.locator('#media-category').inputValue(),'all');assert.equal(await page.locator('#media-search').inputValue(),'');assert.equal(await page.locator('#media-library .card').count(),4);await page.locator('#media-category').selectOption('Motion');await mode('Media','recent');assert.equal(await page.locator('#media-library .card').count(),1);
 await tab('Shape');assert.equal(await page.locator('#shape-category').inputValue(),'FX');assert.equal(await page.locator('#shape-search').inputValue(),'glow');assert.equal(await page.locator('#shape-library .card').count(),1);
 await tab('YU');assert.equal(await page.evaluate(()=>ZxTCollections.getMode('Text')),'all');await tab('Background');assert.equal(await page.locator('#cards .card').count(),8);
 // Global search routes into the proper Inspector even with local filters active.
 for(const [name,title] of [['Blur Pulse','shape'],['Pop In','media']]){await page.locator('#toggle-search').click();await page.locator('#search').fill(name);assert.equal(await page.locator('#search-results button').count(),1);await page.locator('#search-results button').click();assert.equal(await page.locator('#'+title+'-title').textContent(),name);assert(await page.locator('#'+(title==='shape'?'media':'shape')+'-inspector').isHidden());await page.locator('#'+title+'-back').click();}
 assert.equal(await page.evaluate(()=>listenerCount),listeners,'tab cycles must not accumulate listeners');
 // One click still dispatches exactly one mutation after repeated navigation.
 await tab('Media');await mode('Media','all');await page.locator('#media-category').selectOption('all');await page.locator('[data-preset="slide-up"] .media-select').click();const before=calls.filter(p=>p.action==='mediaLibrary'&&p.operation==='apply').length;await page.locator('#media-apply').click();await page.waitForFunction(()=>!document.getElementById('media-update').hidden);assert.equal(calls.filter(p=>p.action==='mediaLibrary'&&p.operation==='apply').length,before+1);
 const saved=await page.evaluate(()=>localStorage.getItem('zxt-collections-v1'));assert(JSON.parse(saved).favorites.includes('future:pilot'));await page.close();page=await context.newPage();page.on('pageerror',x=>errors.push(x.message));await page.goto(url);assert.equal(await page.evaluate(()=>localStorage.getItem('zxt-collections-v1')),saved,'panel restart persistence');
 await tab('Media');await page.locator('[data-preset="slide-up"] .media-select').click();await page.waitForFunction(()=>!document.getElementById('media-update').hidden);assert(await page.locator('#media-update').isDisabled(),'reopened owned instance is clean');
 assert.deepEqual(errors,[]);console.log('PASS Task4: all Library sections,14 viewports, scoped filters/search/collections, stale Inspector removal, one mutation/listener stability, panel restart recognition');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
