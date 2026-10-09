/* Production Text/SolidGen engine bodies and registries are frozen at 4497612. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  cp = require("node:child_process"),
  acorn = require("acorn");
const baseline = "44976125a91da42d7641af34bb333d9da7f68fe0";
const original = (f) =>
  cp.execFileSync("git", ["show", baseline + ":" + f], { encoding: "utf8" });
for (const f of [
  "presets.json",
  "jsx/presets-data.jsx",
  "js/presets-data.js",
  "jsx/yu-text.jsx",
  "js/yu-text.js",
  "src/yu-adapter.js",
  "js/preview.js",
  "js/create.js",
  "js/selection.js",
  "css/style.css",
  "js/theme.js",
  "VERSION",
  "CSXS/manifest.xml",
  "install-windows.ps1",
  "installer/windows/Download.ps1",
  "installer/windows/Window.xaml",
  "installer/windows/WindowsUI.ps1",
])
  assert.equal(fs.readFileSync(f, "utf8"), original(f), f + " frozen");
function declarations(source) {
  const tree = acorn.parse(source, { ecmaVersion: 3, allowReserved: true }),
    found = new Map();
  function walk(n) {
    if (!n || typeof n !== "object") return;
    if (n.type === "FunctionDeclaration")
      found.set(n.id.name, source.slice(n.start, n.end));
    for (const v of Object.values(n))
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") walk(v);
  }
  walk(tree);
  return found;
}
const before = declarations(original("jsx/hostscript.jsx")),
  after = declarations(fs.readFileSync("jsx/hostscript.jsx", "utf8"));
let preserved = 0;
for (const [name, body] of before)
  if (name !== "dispatch") {
    assert.equal(after.get(name), body, name + " engine function frozen");
    preserved++;
  }
const html = fs.readFileSync("index.html", "utf8"),
  old = original("index.html");
for (const [a, b] of [
  ['<section id="yu"', '<section id="settings"'],
  ['<section id="library"', '<section id="motion-curve"'],
]) {
  const start = old.indexOf(a),
    end = old.indexOf(b, start);
  assert(start >= 0 && end > start, "Frozen section boundaries");
  assert.equal(
    html.substring(html.indexOf(a), html.indexOf(b, html.indexOf(a))),
    old.substring(start, end),
    "Frozen " + a,
  );
}
assert.deepEqual(
  JSON.parse(
    fs
      .readFileSync("js/shape-presets-data.js", "utf8")
      .match(/window.ZXT_SHAPE_PRESETS=(.*);/)[1],
  ),
  require("../shape-presets.json"),
);
assert(fs.existsSync("jsx/media.jsx"));
assert(fs.existsSync("media-presets.json"));
console.log(
  "PASS: " +
    preserved +
    " unchanged host functions; frozen Text/SolidGen, tools, themes, versions, installer; generated Shape metadata parity; authorized additive Media engine.",
);
