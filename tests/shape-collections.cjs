const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const registry = require("../shape-presets.json"),
  source = fs.readFileSync("js/collections.js", "utf8");
assert.deepEqual(
  registry.presets.map((p) => p.id),
  ["trim-in", "path-wiggle", "glow", "blur-pulse"],
);
let saved = JSON.stringify({
  favorites: ["core:counter", "core:neongrid", "yu:1"],
  recent: ["core:counter", "yu:1"],
});
function make() {
  const c = {
    window: {
      MA_PRESETS: require("../presets.json"),
      YTMCore: { presets: [{ id: 1 }] },
      ZXT_SHAPE_PRESETS: registry,
    },
    localStorage: {
      getItem: () => saved,
      setItem: (k, v) => {
        assert.equal(k, "zxt-collections-v1");
        saved = v;
      },
    },
  };
  vm.runInNewContext(source, c);
  return c.window.ZxTCollections;
}
const a = make();
a.toggle("shape:glow");
a.record("shape:trim-in");
a.setMode("favorites", "Shape");
assert.deepEqual(
  Array.from(
    a.filter(registry.presets, (p) => "shape:" + p.id, "Shape"),
    (p) => p.id,
  ),
  ["glow"],
);
a.setMode("recent", "Shape");
assert.deepEqual(
  Array.from(
    a.filter(registry.presets, (p) => "shape:" + p.id, "Shape"),
    (p) => p.id,
  ),
  ["trim-in"],
);
const b = make();
assert(b.isFavorite("shape:glow"));
["core:counter", "core:neongrid", "yu:1"].forEach((k) =>
  assert(b.isFavorite(k)),
);
assert(JSON.parse(saved).recent.includes("core:counter"));
assert.equal(b.getMode("Text"), "all");
console.log(
  "PASS: four pilot metadata, Shape collections and old persistence remain compatible.",
);
