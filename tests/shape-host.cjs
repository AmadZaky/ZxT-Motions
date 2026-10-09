const assert = require("node:assert/strict"),
  vm = require("node:vm"),
  { setup } = require("./shape-fixture.cjs");
const run = (e, id, operation = "apply", extra = {}) =>
  e.rpc({ action: "shapeLibrary", operation, id, params: {}, ...extra });
{
  const e = setup();
  assert(
    !run(e, "glow").message.includes("Unknown MotionAstra action"),
    "Shape route must exist",
  );
}
for (const id of ["trim-in", "path-wiggle", "glow", "blur-pulse"]) {
  const e = setup();
  assert.equal(run(e, id).ok, false, "No selection");
  const text = e.comp.add("text");
  text.selected = true;
  assert.equal(run(e, id).changed, 0, "Wrong type skipped");
  text.selected = false;
  const l = e.shape();
  l.selected = true;
  l.locked = true;
  assert.equal(run(e, id).changed, 0);
  l.locked = false;
  l.comment = "Artist notes";
  const userFx = l.fx.addProperty("ADBE Glo2");
  userFx.name = "User Glow";
  const c = e.contents(l),
    userTrim = c.addProperty("ADBE Vector Filter - Trim");
  userTrim.name = "User Trim";
  const native = JSON.stringify(
      l.transform.items.map((p) => ({
        value: p.value,
        expression: p.expression,
        keys: p.keys,
      })),
    ),
    beforeLayers = e.comp.numLayers;
  let r = run(e, id);
  assert.equal(r.changed, 1, JSON.stringify(r));
  assert(l.comment.startsWith("Artist notes"));
  assert(l.comment.includes("[ZXT_SHAPE]"));
  assert.equal(e.comp.numLayers, beforeLayers);
  const fxCount = l.fx.numProperties,
    opCount = c.numProperties,
    start = e.comp.time;
  r = run(e, id);
  assert.equal(r.changed, 1);
  assert.equal(l.fx.numProperties, fxCount);
  assert.equal(c.numProperties, opCount);
  const undoCount = e.undo.length;
  const loaded = run(e, id, "load");
  assert.equal(loaded.ok, true);
  assert(loaded.instance.target);
  assert.equal(e.undo.length, undoCount, "Load is read-only");
  e.comp.time = 6;
  r = run(e, id, "update", {
    target: loaded.instance.target,
    revision: loaded.instance.revision,
    params: {
      ...loaded.instance.params,
      ...(id === "glow"
        ? { intensity: 2 }
        : id === "path-wiggle"
          ? { amount: 12 }
          : { duration: 1.5 }),
    },
  });
  assert.equal(r.changed, 1, JSON.stringify(r));
  assert.equal(
    run(e, id, "load").instance.start,
    start,
    "Update retains CTI start",
  );
  assert.equal(l.fx.property("User Glow"), userFx);
  assert.equal(c.property("User Trim"), userTrim);
  assert.equal(
    native,
    JSON.stringify(
      l.transform.items.map((p) => ({
        value: p.value,
        expression: p.expression,
        keys: p.keys,
      })),
    ),
  );
  const instance = run(e, id, "load").instance,
    owned = (id === "glow" || id === "blur-pulse" ? l.fx : c).items.find((p) =>
      p.name.startsWith("ZxT Shape | "),
    );
  const p = owned.property(
    id === "trim-in"
      ? "ADBE Vector Trim End"
      : id === "path-wiggle"
        ? "ADBE Vector Roughen Size"
        : id === "glow"
          ? "ADBE Glo2-0004"
          : "ADBE Gaussian Blur 2-0001",
  );
  p.setValueAtTime(2, 5);
  const before = l.comment;
  r = run(e, id, "update", {
    target: instance.target,
    revision: instance.revision,
  });
  assert.equal(r.changed, 0);
  assert.equal(l.comment, before);
  assert.equal(p.numKeys, 1, "Authored keys protected");
  assert.equal(e.undo[0], "ZxT Shape · Apply");
}
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  e.contents(l).items = e
    .contents(l)
    .items.filter((p) => p.matchName !== "ADBE Vector Graphic - Stroke");
  assert.equal(run(e, "trim-in").changed, 0);
  assert.equal(l.comment, "");
}
{
  const e = setup(),
    a = e.shape(),
    b = e.shape(),
    t = e.comp.add("text");
  a.selected = b.selected = t.selected = true;
  const r = run(e, "glow");
  assert.equal(r.changed, 2);
  assert.equal(t.fx.numProperties, 0);
  assert.equal(r.severity, "warning");
  assert.equal(e.undo.length, 1, "Multi-layer single Undo");
}
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  const c = e.contents(l);
  const g = l.vectors.addProperty("ADBE Vector Group");
  g.name = "Other";
  g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group");
  assert.equal(run(e, "path-wiggle").changed, 0, "Ambiguous groups");
  l.selectedProperties = [c.property(1)];
  assert.equal(run(e, "path-wiggle").changed, 1);
  assert.equal(g.property("ADBE Vectors Group").numProperties, 1);
}
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  run(e, "glow");
  const loaded = run(e, "glow", "load").instance;
  l.selected = false;
  const other = e.shape();
  other.selected = true;
  assert.equal(
    run(e, "glow", "update", {
      target: loaded.target,
      revision: loaded.revision,
    }).ok,
    false,
  );
  assert.equal(other.fx.numProperties, 0);
}
{
  const e = setup(),
    l = e.shape();
  l.selected = true;
  const before = l.comment;
  const add = l.fx.addProperty.bind(l.fx);
  l.fx.addProperty = (name) => {
    const g = add(name);
    g.property(1).setValue = () => {
      throw Error("Native write failure");
    };
    return g;
  };
  assert.equal(run(e, "blur-pulse").changed, 0);
  assert.equal(l.fx.numProperties, 0);
  assert.equal(l.comment, before);
}
// Actual generated expressions are evaluated, not merely checked for string contents.
for (const id of ["trim-in", "blur-pulse"]) {
  const e = setup(),
    l = e.shape();
  l.selected = true;
  e.comp.time = 2;
  assert.equal(run(e, id).changed, 1);
  const g = (id === "trim-in" ? e.contents(l) : l.fx).items.find((p) =>
    p.name.startsWith("ZxT Shape | "),
  );
  const p = g.property(
    id === "trim-in" ? "ADBE Vector Trim End" : "ADBE Gaussian Blur 2-0001",
  );
  const values = [1, 2, 2.5, 3, 4].map((time) =>
    vm.runInNewContext(p.expression, { time, Math, effect: name => index => l.fx.property(name).property(index) }),
  );
  if (id === "trim-in") assert.deepEqual(values, [0, 0, 50, 100, 100]);
  else {
    assert.equal(values[0], 0);
    assert.equal(values[1], 0);
    assert(values[2] > 0);
    assert.equal(values[3], 0);
    assert.equal(values[4], 0);
  }
}
console.log(
  "PASS: four Shape pilots, CTI expressions, targets, ownership, repeat Apply/Load/Update, multi/group selection, native preservation, authored-key protection and rollback.",
);
