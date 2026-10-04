/* Deterministic Transform keyframe API fixture; native AE remains a separate gate. */
const {create}=require('./host-model.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function animated(p, times=[], values=[], spatial=false) {
  let rows=[];const initial=clone(p.value);p.isSpatial=spatial;p.canVaryOverTime=true;
  const state=()=>({inType:2,outType:2,inEase:Array.from({length:spatial||typeof initial==='number'?1:initial.length},()=>({speed:12,influence:45})),outEase:Array.from({length:spatial||typeof initial==='number'?1:initial.length},()=>({speed:18,influence:65})),auto:false,continuous:false,sAuto:false,sContinuous:false,sIn:Array.isArray(initial)?initial.map(()=>0):null,sOut:Array.isArray(initial)?initial.map(()=>0):null,roving:false});
  p.setValueAtTime=(t,v)=>{let row=rows.find(r=>Math.abs(r.time-t)<1e-8);if(!row){row={time:t,value:clone(v),...state()};rows.push(row);rows.sort((a,b)=>a.time-b.time);}else row.value=clone(v);p.numKeys=rows.length;p.value=clone(v);};
  p.removeKey=i=>{rows.splice(i-1,1);p.numKeys=rows.length;};p.keyTime=i=>rows[i-1].time;p.keyValue=i=>clone(rows[i-1].value);p.keyInInterpolationType=i=>rows[i-1].inType;p.keyOutInterpolationType=i=>rows[i-1].outType;
  p.keyInTemporalEase=i=>clone(rows[i-1].inEase);p.keyOutTemporalEase=i=>clone(rows[i-1].outEase);p.keyTemporalAutoBezier=i=>rows[i-1].auto;p.keyTemporalContinuous=i=>rows[i-1].continuous;
  p.keySpatialAutoBezier=i=>rows[i-1].sAuto;p.keySpatialContinuous=i=>rows[i-1].sContinuous;p.keyInSpatialTangent=i=>clone(rows[i-1].sIn);p.keyOutSpatialTangent=i=>clone(rows[i-1].sOut);p.keyRoving=i=>rows[i-1].roving;
  p.setInterpolationTypeAtKey=(i,a,b)=>Object.assign(rows[i-1],{inType:a,outType:b});
  p.setTemporalEaseAtKey=(i,a,b)=>Object.assign(rows[i-1],{inEase:clone(a),outEase:clone(b)});
  p.setTemporalAutoBezierAtKey=(i,v)=>rows[i-1].auto=v;p.setTemporalContinuousAtKey=(i,v)=>rows[i-1].continuous=v;
  p.setSpatialAutoBezierAtKey=(i,v)=>rows[i-1].sAuto=v;p.setSpatialContinuousAtKey=(i,v)=>rows[i-1].sContinuous=v;
  p.setSpatialTangentsAtKey=(i,a,b)=>Object.assign(rows[i-1],{sIn:clone(a),sOut:clone(b)});p.setRovingAtKey=(i,v)=>rows[i-1].roving=v;
  p.rows=()=>clone(rows);p.configure=(i,patch)=>Object.assign(rows[i-1],clone(patch));
  times.forEach((t,i)=>p.setValueAtTime(t,values[i]));return p;
}
function setup(){const e=create();e.context.KeyframeInterpolationType.HOLD=3;e.undo=[];e.ends=0;e.context.app.beginUndoGroup=n=>e.undo.push(n);e.context.app.endUndoGroup=()=>e.ends++;
  e.layer=kind=>{const l=e.comp.add(kind||'text');l.transform.items.forEach(p=>animated(p,[],[],/Anchor Point|Position/.test(p.matchName)));return l;};return e;}
module.exports={setup,animated,clone};
