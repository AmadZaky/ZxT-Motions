const assert = require("node:assert/strict"),
  vm = require("node:vm"),
  { setup } = require("./media-fixture.cjs");
const e = setup(),
  l = e.media();
l.selected = true;
l.comment = "User notes";
const user = l.fx.addProperty("ADBE Gaussian Blur 2");
user.name = "User Blur";
user.property(1).setValue(7);
const userTransform = l.fx.addProperty("ADBE Geometry2");
userTransform.name = "User Transform";
userTransform.property(2).numKeys = 2;
userTransform.property(2).expression = "value";
const userState = JSON.stringify(userTransform.items);
const native = JSON.stringify(l.transform.items);
for (const id of ["slide-up", "pop-in", "blur-reveal", "rgb-split"]) {
  const a = { action: "mediaLibrary", operation: "apply", id, params: {} };
  let r = e.rpc(a);
  assert.equal(r.changed, 1, JSON.stringify(r));
  const count = l.fx.numProperties;
  let load = e.rpc({ ...a, operation: "load" });
  assert(load.instance);
  e.comp.time = 5;
  assert.equal(e.rpc(a).changed, 1);
  assert.equal(l.fx.numProperties, count);
  assert.equal(e.rpc({ ...a, operation: "load" }).instance.start, 4.5);
  const p = load.instance.params;
  p.duration = p.duration ? 1.2 : undefined;
  delete p.undefined;
  r = e.rpc({
    ...a,
    operation: "update",
    params: p,
    target: load.instance.target,
    revision: load.instance.revision
  });
  assert.equal(r.changed, 1, JSON.stringify(r));
  assert.equal(l.fx.numProperties, count);
  const bad = e.rpc({
    ...a,
    operation: "update",
    params: p,
    target: load.instance.target,
    revision: "stale"
  });
  assert.equal(bad.changed, 0);
  e.comp.time = 4.5;
}
assert.equal(JSON.stringify(l.transform.items), native);
assert.equal(user.property(1).value, 7);
assert.equal(JSON.stringify(userTransform.items), userState);
assert(l.comment.startsWith("User notes"));
assert(e.undo.every((n) => /^ZxT Media/.test(n)));
const g = l.fx.items.find((x) => x.name.includes("slide-up"));
const expression = g.property("ADBE Geometry2-0002").expression;
assert(expression.includes("Math.min(1"));
const value = vm.runInNewContext(expression, { time: 4.5 });
assert.deepEqual(Array.from(value), [480, 390]);
const b = e.media("precomp");
l.selected = false;
b.selected = true;
assert.equal(
  e.rpc({ action: "mediaLibrary", operation: "apply", id: "pop-in" }).changed,
  1
);
console.log(
  "PASS Media four pilots, repeat/load/update/revision, source identity, original CTI, vector expression, native/user preservation and modeled Undo labels"
);
