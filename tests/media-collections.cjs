const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const registry = require("../media-presets.json"),
  source = fs.readFileSync("js/collections.js", "utf8");
assert.deepEqual(
  registry.presets.map((p) => p.id),
  ["slide-up", "pop-in", "blur-reveal", "rgb-split"]
);
let saved = JSON.stringify({
  favorites: [
    "core:counter",
    "core:neongrid",
    "yu:1",
    "shape:glow",
    "create:text",
    "create:shape",
    "create:solid"
  ],
  recent: ["core:counter", "yu:1"]
});
function make() {
  const c = {
    window: {
      MA_PRESETS: require("../presets.json"),
      YTMCore: { presets: [{ id: 1 }] },
      ZXT_MEDIA_PRESETS: registry,
      ZXT_SHAPE_PRESETS: require("../shape-presets.json")
    },
    localStorage: {
      getItem: () => saved,
      setItem: (k, v) => {
        assert.equal(k, "zxt-collections-v1");
        saved = v;
      }
    }
  };
  vm.runInNewContext(source, c);
  return c.window.ZxTCollections;
}
const a = make();
a.toggle("media:rgb-split");
a.record("media:slide-up");
a.setMode("favorites", "Media");
assert.deepEqual(
  Array.from(
    a.filter(registry.presets, (p) => "media:" + p.id, "Media"),
    (p) => p.id
  ),
  ["rgb-split"]
);
a.setMode("recent", "Media");
assert.deepEqual(
  Array.from(
    a.filter(registry.presets, (p) => "media:" + p.id, "Media"),
    (p) => p.id
  ),
  ["slide-up"]
);
const exact = saved;
const b = make();
assert.equal(saved, exact, "exact persisted collections across reload");
assert(b.isFavorite("media:rgb-split"));
[
  "core:counter",
  "core:neongrid",
  "yu:1",
  "shape:glow",
  "create:text",
  "create:shape",
  "create:solid"
].forEach((k) => assert(b.isFavorite(k)));
assert(JSON.parse(saved).recent.includes("core:counter"));
assert.equal(b.getMode("Text"), "all");
console.log(
  "PASS: four pilot metadata, Media collections and old persistence remain compatible."
);
