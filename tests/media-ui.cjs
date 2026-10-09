/* Active UI retirement replaces the historical four-Media-pilot navigation contract. */
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try {
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',x=>errors.push(x.message));const url=pathToFileURL(path.resolve('index.html')).href;await page.goto(url);
 assert.deepEqual(await page.locator('#library-navigation button').allTextContents(),['Text','Shape','SolidGen']);
 assert.equal(await page.locator('#media-library,#media-inspector').count(),0);assert.equal(await page.evaluate(()=>typeof MediaLibrary),'undefined');
 const seed={favorites:['media:slide-up','media:rgb-split','shape:glow','core:counter','create:text'],recent:['media:pop-in','shape:glow']};await page.evaluate(s=>localStorage.setItem('zxt-collections-v1',JSON.stringify(s)),seed);await page.reload();
 await page.locator('[data-tab="Shape"]').click();await page.locator('[data-preset="drop-shadow"] .favorite-toggle').click();
 const saved=await page.evaluate(()=>localStorage.getItem('zxt-collections-v1'));assert(JSON.parse(saved).favorites.includes('media:slide-up'));assert(JSON.parse(saved).recent.includes('media:pop-in'));
 await page.locator('#toggle-search').click();await page.locator('#search').fill('Slide Up');assert.equal(await page.locator('#search-results button').count(),0);
 await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem('zxt-collections-v1')),saved);await page.close();const reopened=await context.newPage();await reopened.goto(url);assert.equal(await reopened.evaluate(()=>localStorage.getItem('zxt-collections-v1')),saved);
 assert.deepEqual(errors,[]);console.log('PASS Media retirement: no tab/Inspector/search/adapter; saved collections survive reload and panel restart');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
