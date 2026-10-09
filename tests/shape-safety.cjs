const assert = require("node:assert/strict"),
  { setup } = require("./shape-fixture.cjs");
const call = (e, id, operation = "apply", more = {}) =>
  e.rpc({ action: "shapeLibrary", operation, id, params: {}, ...more });
for (const id of ["trim-in", "path-wiggle", "glow", "blur-pulse"]) {
  for (const change of [
    "expression",
    "disabled-expression",
    "value",
    "rename",
    "duplicate",
    "record",
  ]) {
    const e = setup(),
      l = e.shape();
    l.selected = true;
    assert.equal(call(e, id).changed, 1);
    const loaded = call(e, id, "load").instance;
    const parent = id === "glow" || id === "blur-pulse" ? l.fx : e.contents(l),
      g = parent.items.find((x) => x.name.startsWith("ZxT Shape | "));
    const p = g.property(
      id === "trim-in"
        ? "ADBE Vector Trim End"
        : id === "path-wiggle"
          ? "ADBE Vector Roughen Size"
          : id === "glow"
            ? "ADBE Glo2-0004"
            : "ADBE Gaussian Blur 2-0001",
    );
    if (change === "expression") p.expression = "time*3";
    if (change === "disabled-expression") {
      p.expression = "time*3";
      p.expressionEnabled = false;
    }
    if (change === "value") p.value = 333;
    if (change === "rename") g.name = "Artist renamed";
    if (change === "duplicate") {
      const dup = parent.addProperty(g.matchName);
      dup.name = g.name;
    }
    if (change === "record") l.comment += "[ZXT_SHAPE]bad[/ZXT_SHAPE]";
    const before = l.comment,
      count = parent.numProperties;
    const r = call(e, id, "update", {
      target: loaded.target,
      revision: loaded.revision,
      params: loaded.params,
    });
    assert.equal(r.changed || 0, 0, change);
    assert.equal(l.comment, before);
    assert.equal(parent.numProperties, count);
  }
  const e = setup(),
    l = e.shape();
  l.selected = true;
  call(e, id);
  const loaded = call(e, id, "load").instance;
  assert.equal(
    call(e, id, "update", { target: loaded.target, revision: "stale" }).changed,
    0,
  );
  assert.equal(
    call(e, id, "apply", {
      params: { duration: -1, amount: -1, intensity: -1 },
    }).ok,
    false,
  );
  l.selected = false;
  const cam = e.comp.add("video");
  cam.selected = true;
  assert.equal(call(e, id).changed, 0);
  cam.selected = false;
  l.selected = true;
  l.nullLayer = true;
  assert.equal(call(e, id).changed, 0);
}
// Live edits protect only owned properties, not user effects/operators or notes.
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  l.comment = 'User notes\n[MA_YU]{"custom":true}[/MA_YU]';
  call(e, "glow");
  const first = call(e, "glow", "load").instance;
  const glow = l.fx.items.find((g) => g.name.startsWith("ZxT"));
  const radius = glow.property("ADBE Glo2-0003");
  const value = radius.value,
    oldComment = l.comment;
  const setter = radius.setValue.bind(radius);
  let fail = true;
  radius.setValue = (v) => {
    if (fail) {
      fail = false;
      throw Error("Write failed once");
    }
    setter(v);
  };
  const r = call(e, "glow", "update", {
    target: first.target,
    revision: first.revision,
    params: { ...first.params, radius: 80 },
  });
  assert.equal(r.changed, 0);
  assert.equal(l.comment, oldComment);
  assert.equal(radius.value, value);
  assert(!r.recovery, "Rollback restores controlled values");
}
// Failure to roll back is surfaced, never reported as a clean success.
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  const add = l.fx.addProperty.bind(l.fx);
  l.fx.addProperty = (n) => {
    const g = add(n);
    g.property(1).setValue = () => {
      throw Error("write failure");
    };
    g.remove = () => {
      throw Error("rollback failure");
    };
    return g;
  };
  const r = call(e, "blur-pulse");
  assert.equal(r.changed, 0);
  assert.equal(r.recovery, true);
}
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  e.context.app.endUndoGroup = () => {
    throw Error("Undo failed");
  };
  const r = call(e, "glow");
  assert.equal(r.recovery, true);
}
// Fresh module registration after a project reopen/runtime restart reads the stored ownership.
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  call(e, "glow");
  const count = l.fx.numProperties;
  delete e.context.MotionAstraModules.shapeLibrary;
  require("node:vm").runInContext(
    require("node:fs").readFileSync("jsx/shape.jsx", "utf8"),
    e.context,
  );
  assert(call(e, "glow", "load").instance);
  assert.equal(call(e, "glow").changed, 1);
  assert.equal(l.fx.numProperties, count);
}
// Native threshold contracts must support both normalized and percentage hosts.
for (const max of [1, 100]) {
  const e = setup(),
    l = e.shape();
  l.selected = true;
  const add = l.fx.addProperty.bind(l.fx);
  l.fx.addProperty = (n) => {
    const g = add(n);
    if (n === "ADBE Glo2") g.property("ADBE Glo2-0002").maxValue = max;
    return g;
  };
  assert.equal(
    call(e, "glow", "apply", { params: { threshold: 35 } }).changed,
    1,
  );
  assert.equal(l.fx.property(1).property("ADBE Glo2-0002").value, max * 0.35);
}
console.log(
  "PASS: expressions/keys/values, names/duplicates, malformed/stale ownership, native rollback/recovery, module restart and both Glow threshold contracts.",
);
// Index-based identity can transfer a loaded target to a duplicate on old hosts.
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  delete l.id;
  assert.equal(
    call(e, "glow").changed || 0,
    0,
    "Shape requires stable native layer identity",
  );
  assert.equal(l.fx.numProperties, 0);
}
// A native duplicate keeps the owned record, but receives a different native ID.
{
  const e = setup(),
    source = e.shape();
  source.selected = true;
  call(e, "glow");
  const loaded = call(e, "glow", "load").instance;
  const copy = e.shape();
  copy.comment = source.comment;
  for (const fx of source.fx.items) {
    const g = copy.fx.addProperty(fx.matchName);
    g.name = fx.name;
    for (let i = 0; i < fx.items.length; i++) {
      g.items[i].value = fx.items[i].value;
      g.items[i].expression = fx.items[i].expression;
      g.items[i].expressionEnabled = fx.items[i].expressionEnabled;
    }
  }
  source.selected = false;
  copy.selected = true;
  const count = copy.fx.numProperties;
  assert.equal(
    call(e, "glow", "update", {
      target: loaded.target,
      revision: loaded.revision,
      params: { radius: 77 },
    }).ok,
    false,
  );
  assert.equal(copy.fx.property(1).property("ADBE Glo2-0003").value, 25);
  assert.equal(copy.fx.numProperties, count);
}
