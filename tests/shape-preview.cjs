const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function render(id,params,progress=.5){const ctx={points:[],clearRect(){},fillRect(){},save(){},translate(){},restore(){},strokeRect(){},beginPath(){},lineTo(x,y){this.points.push([x,y]);},moveTo(x,y){this.points.push([x,y]);},closePath(){},stroke(){},setLineDash(v){this.dashes=v;}},c={window:{},document:{documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=> '#222'})};vm.runInNewContext(fs.readFileSync('js/visual-preview.js','utf8'),c);c.window.ShapePreview.draw({width:240,height:240,getContext:()=>ctx},id,progress,params);return ctx;}
assert.equal(render('gaussian-blur',{amount:12}).filter,'blur(12px)','static blur preview');
const shadow=render('drop-shadow',{direction:90,distance:20,softness:15,opacity:50});assert(Math.abs(shadow.shadowOffsetX-20)<.001);assert(Math.abs(shadow.shadowOffsetY)<.001);assert.equal(shadow.shadowBlur,15);
assert.equal(render('gaussian-blur',{amount:0}).filter,'blur(0px)');
assert.deepEqual(render('turbulent-displace',{},0).points,render('turbulent-displace',{},.5).points,'static distortion has no automatic wiggle');
assert.notDeepEqual(render('turbulent-displace',{evolution:0}).points,render('turbulent-displace',{evolution:90}).points,'Evolution changes the illustration');
assert.notDeepEqual(render('turbulent-displace',{size:20}).points,render('turbulent-displace',{size:80}).points,'Size changes the illustration');
console.log('PASS illustrative Gaussian Blur/Drop Shadow previews and zero-value controls');
