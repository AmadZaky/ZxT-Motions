const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  cp = require("node:child_process");
const baseline = "377f6e59b6c331aadd9b1a6d307d573ab019929b";
for (const f of [
  "shape-presets.json",
  "src/shape-host.js",
  "jsx/shape.jsx",
  "js/shape-presets-data.js",
  "js/visual-library.js",
  "js/visual-preview.js",
  "tools/build-shape.py"
])
  assert.equal(
    fs.readFileSync(f, "utf8"),
    cp.execFileSync("git", ["show", baseline + ":" + f], { encoding: "utf8" }),
    "frozen " + f
  );
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
