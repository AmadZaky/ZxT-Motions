const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const data=require('../presets.json'),source=fs.readFileSync(__dirname+'/../js/collections.js','utf8');
let saved=JSON.stringify({favorites:['core:counter','core:neongrid','yu:1'],recent:['core:neongrid','yu:1','core:counter']});
function make(){const c={window:{MA_PRESETS:data,YTMCore:{presets:[{id:1}]}},localStorage:{getItem:()=>saved,setItem:(k,v)=>{assert.equal(k,'zxt-collections-v1');saved=v;}}};vm.runInNewContext(source,c);return c.window.ZxTCollections;}
const a=make();a.setMode('favorites','Text');a.setMode('recent','Solid');
assert.equal(a.getMode('Text'),'favorites');assert.equal(a.getMode('Solid'),'recent');assert.equal(a.getMode('Create'),'all');
const texts=data.presets.filter(p=>p.category==='Text'),solids=data.presets.filter(p=>p.category==='Background');
assert.deepEqual(Array.from(a.filter(texts,p=>'core:'+p.id,'Text'),p=>p.id),['counter']);assert.deepEqual(Array.from(a.filter(solids,p=>'core:'+p.id,'Solid'),p=>p.id),['neongrid']);
a.toggle('create:text');a.record('create:shape');const b=make();assert(b.isFavorite('create:text'));b.setMode('recent','Create');assert.deepEqual(Array.from(b.filter(['text','shape','solid'],k=>'create:'+k,'Create')),['shape']);
assert(b.isFavorite('core:counter'));assert(b.isFavorite('core:neongrid'));assert(b.isFavorite('yu:1'));console.log('PASS: tab-local modes and compatible preset/Create collections persistence');
