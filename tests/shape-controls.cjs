const assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const {setup}=require('./shape-fixture.cjs');
const registry=require('../shape-presets.json');
const call=(e,id,operation='apply',more={})=>e.rpc({action:'shapeLibrary',id,operation,params:{},...more});
const record=l=>JSON.parse(l.comment.split('[ZXT_SHAPE]')[1].split('[/ZXT_SHAPE]')[0]).instances;
const slider=(l,r,key)=>l.fx.property(r.controls.find(c=>c.key===key).name).property('ADBE Slider Control-0001');
function evaluate(l,expression,time) {return vm.runInNewContext(expression,{time,Math,effect:name=>index=>l.fx.property(name).property(index)});}
// Removing numeric bindings/owned controls would fail these assertions.
for(const id of ['trim-in','path-wiggle','glow','blur-pulse','gaussian-blur','drop-shadow','turbulent-displace']) {
 const e=setup(),l=e.shape();l.selected=true;
 const user=l.fx.addProperty('ADBE Slider Control');user.name='User Slider';user.property(1).setValueAtTime(2,42);
 const native=JSON.stringify(l.transform.items), before=l.comment;
 const result=call(e,id);assert.equal(result.changed,1,JSON.stringify(result));
 const r=record(l)[0],definition=registry.presets.find(p=>p.id===id);
 assert(Array.isArray(r.controls),'owned AE control descriptors are missing');
 assert.equal(r.controls.length,definition.parameters.filter(p=>p.type==='number').length,'all numeric parameters have AE controls');
 assert.equal(r.controlVersion,1);
 for(const c of r.controls) assert.equal(l.fx.property(c.name).matchName,'ADBE Slider Control');
 const count=l.fx.numProperties;assert.equal(call(e,id).changed,1);assert.equal(l.fx.numProperties,count,'no duplicate controls');
 const key=definition.parameters.find(p=>p.type==='number'&&p.key!=='duration').key,p=slider(l,r,key);
 const old=call(e,id,'load').instance;p.setValue(p.value+1);
 assert.equal(call(e,id,'update',{target:old.target,revision:old.revision,params:old.params}).changed,0,'live scalar change invalidates stale revision');
 let loaded=call(e,id,'load').instance;assert.equal(loaded.params[key],p.value,'Load reads live AE control');
 p.setValueAtTime(2,p.value);p.setValueAtTime(3,p.value+1);
 loaded=call(e,id,'load').instance;const keys=JSON.stringify(p.keys),times=JSON.stringify(p.keyTimes);
 assert.equal(call(e,id,'update',{target:loaded.target,revision:loaded.revision,params:loaded.params}).changed,1,'unchanged keyframed controls are allowed');
 assert.equal(JSON.stringify(p.keys),keys);assert.equal(JSON.stringify(p.keyTimes),times);
 assert.equal(call(e,id,'apply',{params:loaded.params}).changed,1,'repeat Apply preserves slider keys');
 assert.equal(JSON.stringify(p.keys),keys);
 loaded=call(e,id,'load').instance;
 assert.equal(call(e,id,'update',{target:loaded.target,revision:loaded.revision,params:{...loaded.params,[key]:loaded.params[key]+1}}).changed,0,'conflicting keyframed control refused');
 assert.equal(JSON.stringify(p.keys),keys);assert.equal(l.fx.property('User Slider'),user);
 assert.equal(native,JSON.stringify(l.transform.items));assert.notEqual(l.comment,before);
}
// New native FX retain the same target gate and preserve an unrelated same-type effect.
for(const [id,match] of [['gaussian-blur','ADBE Gaussian Blur 2'],['drop-shadow','ADBE Drop Shadow'],['turbulent-displace','ADBE Turbulent Displace']]) {
 const e=setup();assert.equal(call(e,id).ok,false);const t=e.comp.add('text');t.selected=true;assert.equal(call(e,id).changed,0);assert.equal(t.fx.numProperties,0);t.selected=false;
 const l=e.shape();l.selected=true;l.locked=true;assert.equal(call(e,id).changed,0);assert.equal(l.fx.numProperties,0);l.locked=false;
 const user=l.fx.addProperty(match);user.name='User '+id;user.property(1).expression='time';const view=()=>JSON.stringify(user.items.map(p=>({value:p.value,expression:p.expression,enabled:p.expressionEnabled,keys:p.keys}))),snapshot=view();
 assert.equal(call(e,id).changed,1);assert.equal(view(),snapshot);assert.equal(l.fx.property(user.name),user);
 const loaded=call(e,id,'load').instance,own=l.fx.property(record(l)[0].node.name);own.property(record(l)[0].states[0].match).setValueAtTime(2,5);
 const before=l.comment;assert.equal(call(e,id,'update',{target:loaded.target,revision:loaded.revision,params:loaded.params}).changed,0);assert.equal(l.comment,before);
}
for(const max of [1,100,255]) {
 const e=setup(),l=e.shape();l.selected=true;const add=l.fx.addProperty.bind(l.fx);l.fx.addProperty=n=>{const g=add(n);if(n==='ADBE Drop Shadow')g.property('ADBE Drop Shadow-0002').maxValue=max;return g;};
 assert.equal(call(e,'drop-shadow','apply',{params:{opacity:40}}).changed,1);const r=record(l)[0],g=l.fx.property(r.node.name);assert.equal(evaluate(l,g.property('ADBE Drop Shadow-0002').expression,e.comp.time),max*.4);
}
for(const id of ['gaussian-blur','drop-shadow','turbulent-displace']) {
 const e=setup(),l=e.shape();l.selected=true;const add=l.fx.addProperty.bind(l.fx);l.fx.addProperty=n=>{const g=add(n);if(n!=='ADBE Slider Control')g.items=[];return g;};
 assert.equal(call(e,id).changed,0);assert.equal(l.fx.numProperties,0,'missing native contract rolls back all new controllers and native node');assert.equal(l.comment,'');
}
// Real generated expressions respond to live slider edits, including Trim endpoints.
{
 const e=setup(),l=e.shape();l.selected=true;e.comp.time=2;call(e,'trim-in');const r=record(l)[0],g=e.contents(l).property(r.node.name);
 assert.deepEqual([1,2,2.5,3,4].map(t=>evaluate(l,g.property('ADBE Vector Trim End').expression,t)),[0,0,50,100,100]);
 slider(l,r,'start').setValue(20);slider(l,r,'end').setValue(80);slider(l,r,'offset').setValue(90);slider(l,r,'duration').setValue(2);
 assert.equal(evaluate(l,g.property('ADBE Vector Trim End').expression,3),50);
 assert.equal(evaluate(l,g.property('ADBE Vector Trim End').expression,4),80);
 assert.equal(evaluate(l,g.property('ADBE Vector Trim Start').expression,3),20);
 assert.equal(evaluate(l,g.property('ADBE Vector Trim Offset').expression,3),90);
}
for(const [id,match,key] of [['glow','ADBE Glo2-0004','intensity'],['blur-pulse','ADBE Gaussian Blur 2-0001','amount'],['gaussian-blur','ADBE Gaussian Blur 2-0001','amount'],['drop-shadow','ADBE Drop Shadow-0004','distance'],['turbulent-displace','ADBE Turbulent Displace-0002','amount']]) {
 const e=setup(),l=e.shape();l.selected=true;call(e,id);const r=record(l)[0],g=l.fx.property(r.node.name);slider(l,r,key).setValue(7);
 assert.equal(evaluate(l,g.property(match).expression,r.start+(id==='blur-pulse'?.5:0)),7,id+' live binding');
}
// Missing/duplicate/renamed controllers never adopt a user effect.
for(const change of ['rename','duplicate','remove','wrong-type']) {
 const e=setup(),l=e.shape();l.selected=true;call(e,'glow');const r=record(l)[0],g=l.fx.property(r.controls[0].name),loaded=call(e,'glow','load').instance;
 if(change==='rename')g.name='User renamed';if(change==='remove')g.remove();if(change==='wrong-type')g.matchName='ADBE Glo2';
 if(change==='duplicate'){const d=l.fx.addProperty(g.matchName);d.name=g.name;}
 const before=l.comment,count=l.fx.numProperties;assert.equal(call(e,'glow','update',{target:loaded.target,revision:loaded.revision,params:loaded.params}).changed||0,0);
 assert.equal(l.comment,before);assert.equal(l.fx.numProperties,count);
}
// Partial controller creation failure rolls back only new ZxT objects.
{
 const e=setup(),l=e.shape();l.selected=true;const user=l.fx.addProperty('ADBE Glo2');user.name='User Glow';const add=l.fx.addProperty.bind(l.fx);let n=0;
 l.fx.addProperty=name=>{if(name==='ADBE Slider Control'&&++n===2)throw Error('controller unavailable');return add(name);};
 const r=call(e,'glow');assert.equal(r.changed,0);assert(!r.recovery);assert.equal(l.fx.numProperties,1);assert.equal(l.fx.property(1),user);assert.equal(l.comment,'');
}
// A legacy RC1 instance remains loadable; first Update adds controls without duplicates.
{
 const e=setup(),l=e.shape();l.selected=true;
 const legacy=require('node:child_process').execFileSync('git',['show','7562f16f3a950cd8dfb797021e1b10f4a914c697:jsx/shape.jsx'],{encoding:'utf8'});
 vm.runInContext(legacy,e.context);assert.equal(call(e,'glow').changed,1);const legacyCount=l.fx.numProperties;
 vm.runInContext(fs.readFileSync('jsx/shape.jsx','utf8'),e.context);const loaded=call(e,'glow','load').instance;assert(loaded);assert.equal(l.fx.numProperties,legacyCount,'Load stays read-only');
 assert.equal(call(e,'glow','update',{target:loaded.target,revision:loaded.revision,params:loaded.params}).changed,1);
 assert.equal(l.fx.numProperties,legacyCount+3);assert.equal(record(l)[0].controls.length,3);
}
// An Update failure restores live controls, native bindings and unrelated effects.
{
 const e=setup(),l=e.shape();l.selected=true;call(e,'glow');const r=record(l)[0],loaded=call(e,'glow','load').instance,g=l.fx.property(r.node.name),p=slider(l,r,'radius');
 const before=l.comment,value=p.value,expressions=g.items.map(x=>x.expression),setter=g.property('ADBE Glo2-0003').setValue.bind(g.property('ADBE Glo2-0003'));let fail=true;
 g.property('ADBE Glo2-0003').setValue=v=>{if(fail){fail=false;throw Error('native write failure');}setter(v);};
 const result=call(e,'glow','update',{target:loaded.target,revision:loaded.revision,params:{...loaded.params,radius:80}});
 assert.equal(result.changed,0);assert(!result.recovery);assert.equal(p.value,value);assert.equal(l.comment,before);assert.deepEqual(g.items.map(x=>x.expression),expressions);
}
// Keyframe edits made after Load invalidate revision, independent of CTI changes.
{
 const e=setup(),l=e.shape();l.selected=true;call(e,'glow');const r=record(l)[0],p=slider(l,r,'radius');p.setValueAtTime(2,20);p.setValueAtTime(3,40);
 const loaded=call(e,'glow','load').instance;p.setValueAtKey(1,21);
 assert.equal(call(e,'glow','update',{target:loaded.target,revision:loaded.revision,params:loaded.params}).changed,0);
 const fresh=call(e,'glow','load').instance;e.comp.time=4;
 assert.equal(call(e,'glow','update',{target:fresh.target,revision:fresh.revision,params:fresh.params}).changed,1,'CTI alone does not stale revision');
}
console.log('PASS Shape AE controls, seven presets, live expression evaluation, keyframe preservation/revision safety, ownership/rollback and legacy migration');
// Native KeyframeEase attributes may be host getters rather than enumerable JS fields.
{
 const e=setup(),l=e.shape();l.selected=true;call(e,'glow');const r=record(l)[0],p=slider(l,r,'radius');p.setValueAtTime(2,20);let influence=30;
 const ease=()=>[Object.create(null,{speed:{get:()=>0},influence:{get:()=>influence}})];
 p.keyInInterpolationType=p.keyOutInterpolationType=()=> 'BEZIER';p.keyInTemporalEase=p.keyOutTemporalEase=ease;p.keyTemporalAutoBezier=p.keyTemporalContinuous=()=>false;
 const loaded=call(e,'glow','load').instance;influence=80;
 assert.equal(call(e,'glow','update',{target:loaded.target,revision:loaded.revision,params:loaded.params}).changed,0,'temporal easing edit invalidates revision');
}
// Authored slider expressions remain editable in AE and survive unrelated panel updates.
{
 const e=setup(),l=e.shape();l.selected=true;call(e,'glow');const r=record(l)[0],p=slider(l,r,'radius');p.expression='time*10';p.expressionEnabled=true;p.valueAtTime=(t,pre)=>pre?p.value:t*10;
 const loaded=call(e,'glow','load').instance;assert(loaded.keyed.includes('radius'));assert.equal(loaded.params.radius,e.comp.time*10);
 e.comp.time+=1;assert.equal(call(e,'glow','update',{target:loaded.target,revision:loaded.revision,params:{...loaded.params,intensity:2}}).changed,1);
 assert.equal(p.expression,'time*10');assert(p.expressionEnabled);const fresh=call(e,'glow','load').instance;
 assert.equal(call(e,'glow','update',{target:fresh.target,revision:fresh.revision,params:{...fresh.params,radius:99}}).changed,0);assert.equal(p.expression,'time*10');
}
