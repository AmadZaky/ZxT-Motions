const assert=require('node:assert/strict'),{setup}=require('./shape-fixture.cjs');
const call=(e,id,operation='apply',more={})=>e.rpc({action:'shapeLibrary',id,operation,params:{},...more});
// The browser needs identity even when no owned instance exists.
{const e=setup(),l=e.shape();l.selected=true;const r=call(e,'glow','load');assert.deepEqual(r.selectionTarget,{comp:e.comp.id,layer:l.id});assert.equal(r.instance,null);}
// Uncertain rollback must stop remaining targets in the group.
{const e=setup(),a=e.shape(),b=e.shape();a.selected=b.selected=true;const add=a.fx.addProperty.bind(a.fx);a.fx.addProperty=n=>{const g=add(n);g.property(1).setValue=()=>{throw Error('write failure');};g.remove=()=>{throw Error('rollback failure');};return g;};const r=call(e,'blur-pulse');assert(r.recovery);assert.equal(r.changed,0);assert.equal(b.fx.numProperties,0,'must stop mutations after uncertain rollback');}
// A trimmed-away original start cannot silently update timed animation.
{const e=setup(),l=e.shape();l.selected=true;call(e,'blur-pulse');const loaded=call(e,'blur-pulse','load').instance;l.inPoint=loaded.start+.5;const before=l.comment;const r=call(e,'blur-pulse','update',{target:loaded.target,revision:loaded.revision});assert.equal(r.changed,0,'original start outside trimmed layer fails');assert.equal(l.comment,before);}
console.log('PASS Task4 Shape: null Load identity, uncertain rollback halts remaining targets, trimmed timing safety');
