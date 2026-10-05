const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{create}=require('./host-model.cjs');
(async()=>{
 const env=create(),text=env.comp.add('text'),shape=env.comp.add('shape');text.name='Title';text.selected=true;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:380,height:850}}),errors=[],actions=[];
 page.on('pageerror',e=>errors.push(e.message));await page.exposeFunction('hostRpc',p=>{actions.push(p);return env.rpc(p);});
 await page.addInitScript(()=>{window.previewWords=[];const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,...args){window.previewWords.push(String(t));return fill.call(this,t,...args);};const bridge={isAvailable:()=>true,isReady:()=>true,call:async p=>{const r=await window.hostRpc(p);if(!r.ok)throw Error(r.message);if(p.action!=='status')window.lastReply=r;return r;}};Object.defineProperty(window,'MotionAstraBridge',{get:()=>bridge,set(){}});});
 await page.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 await page.waitForFunction(()=>window.ZxTSelection.context()?.layers[0]?.name==='Title');
 const filter=mode=>page.locator('[data-collection="'+mode+'"]:visible').click();
 await filter('favorites');assert.equal(await page.locator('.card,.yu-card').count(),0);await filter('all');
 await page.locator('.card .favorite-toggle').first().click();await page.locator('.yu-card .favorite-toggle').first().click();await filter('favorites');assert.equal(await page.locator('.card').count(),1);assert.equal(await page.locator('.yu-card').count(),1);
 await page.reload();await filter('favorites');assert.equal(await page.locator('.card,.yu-card').count(),2);
 await page.locator('.customize').click();await page.locator('#apply').click();await page.waitForFunction(()=>!document.querySelector('#update').hidden);await page.locator('#close').click();
 await page.locator('.yu-customize').click();await page.locator('#yu-apply').click();await page.waitForFunction(()=>window.ZxTSelection.context()?.layers[0]?.animations.some(a=>a.phase==='IN'));
 await page.locator('#yu-back').click();await filter('recent');assert.equal(await page.locator('.card,.yu-card').count(),2);
 assert.equal(await page.locator('#selected-layer-inspector').count(),0);assert.equal(await page.evaluate(()=>ZxTSelection.context().layers[0].core.name),'Counter Text');
 await page.locator('#load-fx').click();await page.waitForFunction(()=>document.querySelector('#loaded-layer').textContent==='Title');
 assert((await page.locator('#param-progress').evaluate(e=>e.parentElement.textContent)).includes('AE keyframes'));
 const color=text.fx.property('MA2 native text color').property(3);color.setValueAtTime(1,[1,0,0,1]);color.setValueAtTime(2,[0,1,0,1]);
 await page.locator('#param-end').fill('500');await page.locator('#update').click();await page.waitForFunction(()=>!document.querySelector('#quick-anchor').disabled);assert.equal(color.numKeys,2);assert.deepEqual(actions.filter(a=>a.action==='update').at(-1).editedParameters,['end']);
 // Apply is a smart update too: consumed edits must never be replayed at a later playhead.
 await page.locator('#close').click();await page.locator('[data-workspace="Library"]').click();await page.locator('[data-tab="YU"]').click();await filter('all');await page.locator('.card').filter({hasText:'Counter Text'}).locator('.customize').click();
 await page.locator('#param-tint').fill('#2266ff');await page.locator('#update').click();await page.waitForFunction(()=>!document.querySelector('#update').hidden && !document.querySelector('#quick-anchor').disabled);assert.equal(color.numKeys,3);
 env.comp.time=5.5;await page.locator('#param-end').fill('600');await page.locator('#update').click();await page.waitForFunction(()=>!document.querySelector('#update').hidden && !document.querySelector('#quick-anchor').disabled);assert.equal(color.numKeys,3,'Prior color edit must not repeat on a later Apply');
 await page.locator('#close').click();await filter('recent');await page.locator('#load-fx').click();await page.waitForFunction(()=>document.querySelector('#apply').hidden);
 text.selected=false;shape.selected=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>document.querySelector('#update').disabled);assert.equal(shape.fx.numProperties,0);assert((await page.locator('#target-guidance').textContent()).includes('Selection changed'));
 await page.locator('#close').click();await page.locator('[data-workspace="Library"]').click();await page.locator('[data-tab="YU"]').click();await page.locator('.yu-customize').click();assert(await page.locator('#yu-apply').isDisabled());
 text.selected=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>!document.querySelector('#yu-apply').disabled);assert.equal(await page.evaluate(()=>ZxTSelection.context().total),2);
 shape.selected=false;text.locked=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>document.querySelector('#yu-apply').disabled);text.locked=false;text.selected=false;
 await page.locator('[data-workspace="Library"]').click();await page.locator('[data-tab="Background"]').click();await filter('all');await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.locator('.customize').first().click();await page.locator('#apply').click();await page.waitForFunction(()=>window.ZxTSelection.context()?.layers[0]?.name.includes('Neon Grid'));assert.equal(env.comp.numLayers,3);
 await page.locator('[data-workspace="Library"]').click();await page.locator('[data-tab="YU"]').click();await page.locator('.yu-customize').first().click();await page.locator('#yu-group').selectOption('all');await page.locator('#yu-replay').click();await page.waitForFunction(()=>window.previewWords.includes('Motion'));assert(!await page.evaluate(()=>previewWords.includes('ZxT-Motions')));
 await page.locator('#yu-back').click();env.project.activeItem=null;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>window.ZxTSelection.context()?.compId===null);await page.locator('.yu-customize').first().click();assert(await page.locator('#yu-apply').isDisabled());
 for(const width of [300,380,1200]){await page.setViewportSize({width,height:720});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');}
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: inspector target gates, mixed/locked/missing selections, native keyframe preservation via UI, favorites/recent persistence, single generation and Motion preview.');
})().catch(e=>{console.error(e);process.exit(1);});
