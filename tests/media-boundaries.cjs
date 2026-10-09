/* Media is retired from the panel; its RC1 host remains available for saved projects. */
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const baseline='7562f16f3a950cd8dfb797021e1b10f4a914c697';
for(const f of ['media-presets.json','js/media-presets-data.js','js/media-library.js','js/media-preview.js','src/media-host.js','jsx/media.jsx','tools/build-media.py','tools/build-shape.py'])
 assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show',baseline+':'+f],{encoding:'utf8'}),'compatibility boundary '+f);
assert(!fs.readFileSync('src/media-host.js','utf8').includes('ADBE Transform Group'));
assert(fs.readFileSync('jsx/shape.jsx','utf8').includes(fs.readFileSync('src/shape-host.js','utf8')),'generated Shape parity');
const registry=require('../shape-presets.json');
assert.deepEqual(JSON.parse(fs.readFileSync('js/shape-presets-data.js','utf8').match(/window.ZXT_SHAPE_PRESETS=(.*);/)[1]),registry);
const old=JSON.parse(cp.execFileSync('git',['show',baseline+':shape-presets.json'],{encoding:'utf8'}));
for(const p of old.presets){const next=registry.presets.find(x=>x.id===p.id);assert(next);assert.equal(next.name,p.name);assert.equal(next.family,p.family);assert.equal(next.category,p.category);for(const parameter of p.parameters)assert.deepEqual(next.parameters.find(x=>x.key===parameter.key),parameter,'existing parameter contract');}
assert.deepEqual(registry.presets.map(p=>p.id),['trim-in','path-wiggle','glow','blur-pulse','gaussian-blur','drop-shadow','turbulent-displace']);
console.log('PASS retired Media compatibility bytes, existing Shape IDs/parameters, approved seven-preset scope and generated parity');
