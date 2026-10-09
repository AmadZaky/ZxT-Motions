const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('js/collections.js','utf8');
let saved=JSON.stringify({favorites:['core:counter','yu:1','shape:glow','media:slide-up','core:neongrid','create:text','create:shape','create:solid','future:pilot','shape:glow'],recent:['media:slide-up','future:pilot','shape:glow','yu:1','core:neongrid','create:solid']});
function make(metadata=true){const c={window:{MA_PRESETS:require('../presets.json'),YTMCore:{presets:[{id:1}]}},localStorage:{getItem:()=>saved,setItem:(k,v)=>{assert.equal(k,'zxt-collections-v1');saved=v;}}};if(metadata){c.window.ZXT_SHAPE_PRESETS=require('../shape-presets.json');c.window.ZXT_MEDIA_PRESETS=require('../media-presets.json');}vm.runInNewContext(source,c);return c.window.ZxTCollections;}
// Missing optional metadata must not discard other sections on the next save.
const initial=JSON.parse(saved);const without=make(false);without.toggle('core:counter');without.record('yu:1');
for(const id of initial.favorites.filter(x=>x!=='core:counter'))assert(JSON.parse(saved).favorites.includes(id),'missing metadata erased '+id);
for(const id of initial.recent)assert(JSON.parse(saved).recent.includes(id),'missing metadata erased recent '+id);
const api=make();assert(api.isFavorite('shape:glow'));assert(api.isFavorite('media:slide-up'));assert(!api.isFavorite('future:pilot'),'unavailable IDs not exposed');
api.toggle('media:pop-in');api.record('media:pop-in');
assert(JSON.parse(saved).favorites.includes('future:pilot'));assert(JSON.parse(saved).recent.includes('future:pilot'));
assert.equal(new Set(JSON.parse(saved).favorites).size,JSON.parse(saved).favorites.length);
const exact=saved;make();assert.equal(saved,exact,'restart is read-only');
api.setMode('favorites','Shape');assert.equal(api.getMode('Media'),'all');assert.equal(api.getMode('Text'),'all');
for(const raw of ['{}','null','[]','{"favorites":null,"recent":{}}']){saved=raw;const a=make();a.toggle('shape:glow');a.record('media:slide-up');assert(a.isFavorite('shape:glow'));}
console.log('PASS Task4 collections: metadata unavailable, unknown IDs, duplicates, empty/old data, all scopes and restart preservation');
