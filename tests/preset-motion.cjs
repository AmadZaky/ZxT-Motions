const assert=require('node:assert/strict'),{setup}=require('./transform-motion-fixture.cjs');
const data=require('../presets.json');
for(const preset of data.presets){
 const e=setup(),s=e.layer('text');s.selected=true;
 const applied=e.rpc({action:preset.category==='Background'?'generateBackground':'apply',id:preset.id,params:{}});assert.equal(applied.changed,1,applied.message);
 const source=e.comp.selectedLayers[0],before=source.comment,copy=e.rpc({action:'copyMotion'});assert(copy.ok,copy.message);assert.equal(copy.motion.schema,'zxt-preset-motion-1');assert.equal(copy.motion.core.id,preset.id);assert.equal(source.comment,before);
 e.comp.items.forEach(l=>l.selected=false);const t=e.layer(preset.category==='Background'?'solid':'text');t.selected=true;e.comp.time=3;
 const old={inPoint:t.inPoint,outPoint:t.outPoint,startTime:t.startTime,layers:e.comp.numLayers};const result=e.rpc({action:'pasteMotion',motion:copy.motion});assert.equal(result.changed,1,preset.name+' '+result.message);assert.deepEqual({inPoint:t.inPoint,outPoint:t.outPoint,startTime:t.startTime,layers:e.comp.numLayers},old);
 const loaded=e.rpc({action:'load'});assert.equal(loaded.id,preset.id);assert.equal(loaded.params.duration,copy.motion.core.params.duration);assert(t.markers.keys.some(k=>k.time===3));const saved=t.comment;assert.equal(e.rpc({action:'pasteMotion',motion:copy.motion}).changed,0);assert.equal(t.comment,saved);
}
const o={mode:'IN',duration:.8,stagger:.04,intensity:65,seed:17,group:'words',order:'reverse',easing:'elastic',placement:'edges'};
for(let id=1;id<=120;id++){
 const e=setup(),s=e.layer('text');s.selected=true;assert.equal(e.rpc({action:'yuText',operation:'apply',id,options:o}).changed,1);assert.equal(e.rpc({action:'yuText',operation:'apply',id:121-id,options:{...o,mode:'OUT'}}).changed,1);
 const copied=e.rpc({action:'copyMotion'});assert(copied.ok,copied.message);assert.equal(copied.motion.yu.length,2);assert.equal(copied.motion.yu[0].time,0);assert(copied.motion.yu[1].time>0);
 s.selected=false;const t=e.layer('text'),t2=e.layer('text');t.selected=t2.selected=true;t.outPoint=t2.outPoint=12;e.comp.time=3;assert.equal(e.rpc({action:'pasteMotion',motion:copied.motion}).changed,2);assert.equal(e.undo.at(-1),'Paste ZxT Motion');
 for(const l of [t,t2]){const record=JSON.parse(l.comment.match(/\[MA_YU\](.*?)\[\/MA_YU\]/)[1]);assert.equal(record.IN.id,id);assert.equal(record.OUT.id,121-id);assert.equal(record.IN.options.playhead,3);assert.equal(record.OUT.options.playhead,3+copied.motion.yu[1].time);assert.equal(record.IN.options.intensity,65);}
 const before=t.comment;assert.equal(e.rpc({action:'pasteMotion',motion:copied.motion}).changed,0);assert.equal(t.comment,before);
}
console.log('PASS: every core preset and 120 YUGraphic presets, settings, IN/OUT, CTI offsets, multi-target, no new layers/timing edits, repeated Paste conflicts.');
// Authored Choice/Progress and legacy color controller keys are part of the preset setup.
for(const kind of ['choice','progress','color']){
 const {animated}=require('./transform-motion-fixture.cjs'),e=setup(),s=e.layer();s.selected=true;
 assert.equal(e.rpc({action:'apply',id:kind==='choice'?'switcher':'ember',layout:kind==='color'?'legacy':'compact',params:{}}).changed,1);
 const name=kind==='choice'?'MA2 choice':kind==='progress'?'MA2 MotionAstra Progress':'MA2 tint';
 const p=s.fx.property(name).property(1);animated(p,[2,3],kind==='color'?[[1,0,0,1],[0,0,1,1]]:[1,3]);
 const r=e.rpc({action:'copyMotion'});assert(r.ok,r.message);s.selected=false;const t=e.layer();t.selected=true;e.comp.time=4;
 const add=t.fx.addProperty.bind(t.fx);t.fx.addProperty=name=>{const effect=add(name);animated(effect.property(1));return effect;};
 const result=e.rpc({action:'pasteMotion',motion:r.motion});assert.equal(result.changed,1,result.message);
 assert.deepEqual(t.fx.property(name).property(1).rows().map(k=>k.time),[4.5,5.5]);
}
// Conflicts and invalid payloads must not overwrite user data or existing presets.
{const e=setup(),s=e.layer();s.selected=true;e.rpc({action:'apply',id:'counter',params:{}});e.rpc({action:'yuText',operation:'apply',id:1,options:o});const {animated}=require('./transform-motion-fixture.cjs');animated(s.transform.property('ADBE Position'),[2,3],[[3,4],[5,6]],true);const copied=e.rpc({action:'copyMotion'});assert(copied.ok,copied.message);const beforeUndo=e.undo.length;assert.equal(e.rpc({action:'copyMotion'}).ok,true);assert.equal(e.undo.length,beforeUndo);
 s.selected=false;const t=e.layer();t.selected=true;t.outPoint=12;t.comment='User notes';const user=t.fx.addProperty('User effect'),mask=t.masks.addProperty('ADBE Mask Atom'),anim=t.text.property('ADBE Text Animators').addProperty('ADBE Text Animator');anim.name='User animation';e.comp.time=4;
 assert.equal(e.rpc({action:'pasteMotion',motion:copied.motion}).changed,1);assert.deepEqual(t.transform.property('ADBE Position').rows().map(k=>k.time),[4.5,5.5]);assert.equal(e.comp.time,4);assert(t.selected);assert(t.fx.items.includes(user));assert(t.masks.items.includes(mask));assert(t.text.property('ADBE Text Animators').items.includes(anim));assert(t.comment.includes('User notes'));
 for(const kind of ['locked','shape','keys','expression','short']){t.selected=false;const target=e.layer(kind==='shape'?'shape':'text');target.selected=true;if(kind==='locked')target.locked=true;if(kind==='keys')animated(target.transform.property('ADBE Scale'),[2,3],[[50,50],[80,80]]);if(kind==='expression')target.text.property('ADBE Text Document').expression='value';if(kind==='short')target.outPoint=3;const comment=target.comment;assert.equal(e.rpc({action:'pasteMotion',motion:copied.motion}).changed,0,kind);assert.equal(target.comment,comment);target.selected=false;}
 t.selected=true;const bad=JSON.parse(JSON.stringify(copied.motion));bad.yu[0].id=999;assert.equal(e.rpc({action:'pasteMotion',motion:bad}).ok,false);
}
// Rollback of newly created preset groups and target styling after a native write fails.
{const e=setup(),s=e.layer();s.selected=true;e.rpc({action:'apply',id:'counter',params:{}});e.rpc({action:'yuText',operation:'apply',id:1,options:o});const copied=e.rpc({action:'copyMotion'});s.selected=false;const t=e.layer();t.selected=true;t.comment='Keep';const before=JSON.stringify(t.text.property('ADBE Text Document').value);const group=t.text.property('ADBE Text Animators');group.addProperty=()=>{throw Error('Native selector failure');};e.comp.time=3;const r=e.rpc({action:'pasteMotion',motion:copied.motion});assert.equal(r.changed,0,r.message);assert.equal(t.comment,'Keep');assert.equal(t.fx.numProperties,0);assert.equal(JSON.stringify(t.text.property('ADBE Text Document').value),before);assert.equal(e.ends,e.undo.length);}
console.log('PASS: authored Choice/Progress/color keys, mixed core+YU+Transform relative timing, conflict skips, protected effects/masks/animators/notes, malformed clipboards and native failure rollback.');
// Pasted preset timing follows its owned start/end markers after a layer move.
{const e=setup(),s=e.layer();s.selected=true;e.rpc({action:'apply',id:'counter',params:{duration:2}});const copied=e.rpc({action:'copyMotion'});s.selected=false;const t=e.layer();t.selected=true;e.comp.time=3;assert.equal(e.rpc({action:'pasteMotion',motion:copied.motion}).changed,1);t.markers.keys.forEach(k=>k.time+=.5);assert.equal(e.rpc({action:'load'}).params.duration,2);assert.equal(e.rpc({action:'update',id:'counter',params:{duration:2}}).changed,1);assert(t.markers.keys.some(k=>k.time===3.5));}
