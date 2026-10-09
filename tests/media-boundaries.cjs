const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  cp = require("node:child_process");
const baseline = "377f6e59b6c331aadd9b1a6d307d573ab019929b";
for (const f of [
  "shape-presets.json",
  "js/shape-presets-data.js",
  "js/visual-preview.js",
  "tools/build-shape.py"
])
  assert.equal(
    fs.readFileSync(f, "utf8"),
    cp.execFileSync("git", ["show", baseline + ":" + f], { encoding: "utf8" }),
    "frozen " + f
  );
// Task4 has verified Shape lifecycle/timing/rollback defects. All other host
// functions remain byte-identical; generated parity is checked separately.
const acorn = require('acorn');
function functions(source) {
 const out=new Map();const tree=acorn.parse(source,{ecmaVersion:3,allowReserved:true});
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration')out.set(n.id.name,source.slice(n.start,n.end));for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
 walk(tree);return out;
}
const before=functions(cp.execFileSync('git',['show',baseline+':jsx/shape.jsx'],{encoding:'utf8'})),after=functions(fs.readFileSync('jsx/shape.jsx','utf8'));
for(const [name,body] of before) if(!['run','applyOne'].includes(name))assert.equal(after.get(name),body,'frozen Shape function '+name);
assert(fs.readFileSync('jsx/shape.jsx','utf8').includes(fs.readFileSync('src/shape-host.js','utf8')),'generated Shape parity');
const registry = require("../media-presets.json");
assert.deepEqual(
  JSON.parse(
    fs
      .readFileSync("js/media-presets-data.js", "utf8")
      .match(/window.ZXT_MEDIA_PRESETS=(.*);/)[1]
  ),
  registry
);
assert.deepEqual(
  registry.presets.map((p) => p.id),
  ["slide-up", "pop-in", "blur-reveal", "rgb-split"]
);
assert(
  !fs
    .readFileSync("src/media-host.js", "utf8")
    .includes("ADBE Transform Group"),
  "never access native Transform"
);
console.log(
  "PASS completed Shape byte boundaries, four Media pilots, generated parity and independent effect Transform"
);
