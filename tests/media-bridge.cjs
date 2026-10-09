const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path"),
  { setup } = require("./media-fixture.cjs");
function environment(missing) {
  const e = setup(),
    l = e.media();
  l.selected = true;
  delete e.context.MotionAstraModules;
  delete e.context.MotionAstra;
  const loads = [];
  e.context.File = (file) => ({
    filename: file,
    exists: !file.endsWith(missing)
  });
  e.context.$.evalFile = (file) => {
    loads.push(path.basename(file.filename));
    vm.runInContext(
      "(function(){" +
        fs.readFileSync("jsx/" + path.basename(file.filename), "utf8") +
        "\n}).call($.global);",
      e.context
    );
  };
  const window = {
    __adobe_cep__: {},
    SystemPath: { EXTENSION: "extension" },
    CSInterface: function () {
      this.getSystemPath = () => "/mock";
      this.evalScript = (s, cb) => cb(vm.runInContext(s, e.context));
    }
  };
  vm.runInNewContext(fs.readFileSync("js/bridge.js", "utf8"), { window });
  return { e, l, loads, bridge: window.MotionAstraBridge };
}
(async () => {
  const t = environment("yu-text.jsx");
  let r = await t.bridge.call({
    action: "mediaLibrary",
    operation: "apply",
    id: "blur-reveal",
    params: {}
  });
  assert.equal(r.changed, 1);
  assert(t.loads.includes("media.jsx"));
  assert(!t.loads.includes("yu-text.jsx"));
  assert(!t.loads.includes("fx-tools.jsx"));
  const count = t.l.fx.numProperties;
  const loaded = await t.bridge.call({
    action: "mediaLibrary",
    operation: "load",
    id: "blur-reveal"
  });
  r = await t.bridge.call({
    action: "mediaLibrary",
    operation: "update",
    id: "blur-reveal",
    params: { amount: 2 },
    target: loaded.instance.target,
    revision: loaded.instance.revision
  });
  assert.equal(r.changed, 1);
  assert.equal(t.l.fx.numProperties, count);
  delete t.e.context.MotionAstra.mediaLibraryVersion;
  await t.bridge.call({ action: "status" });
  assert.equal(
    t.loads.filter((f) => f === "hostscript.jsx").length,
    2,
    "Stale same-version core reloads"
  );
  const missing = environment("media.jsx");
  await assert.rejects(
    missing.bridge.call({
      action: "mediaLibrary",
      operation: "apply",
      id: "blur-reveal"
    }),
    /Missing media.jsx/
  );
  assert.equal(missing.l.fx.numProperties, 0);
  assert(
    (await missing.bridge.call({ action: "status" })).ok,
    "Core remains usable"
  );
  console.log(
    "PASS: actual CEP wrapper/core/scoped module load, Media route isolation, one managed instance, same-version capability guard and missing-module safety."
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
