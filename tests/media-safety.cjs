const assert = require("node:assert/strict"),
  vm = require("node:vm"),
  { setup } = require("./media-fixture.cjs");
function scene() {
  const e = setup(),
    l = e.media();
  l.selected = true;
  return {
    e,
    l,
    apply: (id = "slide-up", params = {}) =>
      e.rpc({ action: "mediaLibrary", operation: "apply", id, params })
  };
}
function blocked(change, id = "slide-up") {
  const { e, l, apply } = scene();
  change(e, l);
  const old = l.comment,
    native = JSON.stringify(l.transform.items);
  const r = apply(id);
  assert(!r.changed, JSON.stringify(r));
  assert.equal(l.comment, old);
  assert.equal(JSON.stringify(l.transform.items), native);
  return r;
}
for (const mutate of [
  (e, l) => {
    l.locked = true;
  },
  (e, l) => {
    l.nullLayer = true;
  },
  (e, l) => {
    l.adjustmentLayer = true;
  },
  (e, l) => {
    l.hasVideo = false;
  },
  (e, l) => {
    l.source.footageMissing = true;
  },
  (e, l) => {
    l.source.hasVideo = false;
  },
  (e, l) => {
    l.source = { mainSource: { isStill: true } };
  },
  (e, l) => {
    l.source.mainSource = new e.context.SolidSource();
  },
  (e, l) => {
    delete l.id;
  },
  (e, l) => {
    delete l.source.id;
  },
  (e, l) => {
    e.comp.time = l.outPoint;
  },
  (e, l) => {
    e.comp.time = l.inPoint - 0.1;
  },
  (e, l) => {
    e.project.activeItem = null;
  }
])
  blocked(mutate);
for (const kind of ["text", "shape"]) {
  const { e, l, apply } = scene();
  l.selected = false;
  const bad = e.comp.add(kind);
  bad.id = 22;
  bad.source = l.source;
  bad.selected = true;
  assert.equal(apply().changed, 0);
}
{
  const { e, l, apply } = scene();
  l.selected = false;
  assert.equal(apply().ok, false);
}
{
  const { e, l, apply } = scene();
  const b = e.media("precomp");
  b.selected = true;
  const bad = e.comp.add("text");
  bad.selected = true;
  const r = apply();
  assert.equal(r.changed, 2);
  assert.equal(r.severity, "warning");
  const starts = [l, b].map(
    (x) =>
      JSON.parse(x.comment.split("[ZXT_MEDIA]")[1].split("[/ZXT_MEDIA]")[0])
        .instances[0].start
  );
  assert.deepEqual(starts, [4.5, 4.5]);
}
for (const mutate of [
  (e, l, g) => {
    g.name = "Renamed";
  },
  (e, l, g) => {
    g.remove();
  },
  (e, l, g) => {
    const n = l.fx.addProperty(g.matchName);
    n.name = g.name;
  },
  (e, l, g) => {
    g.property(2).numKeys = 1;
  },
  (e, l, g) => {
    g.property(2).expression = "value";
  },
  (e, l, g) => {
    g.property(2).expressionEnabled = false;
  },
  (e, l, g) => {
    g.property(1).setValue(vm.runInContext("[9,9]", e.context));
  },
  (e, l, g) => {
    g.enabled = false;
  },
  (e, l, g) => {
    l.comment = "[ZXT_MEDIA]bad[/ZXT_MEDIA]";
  },
  (e, l, g) => {
    l.id++;
  },
  (e, l, g) => {
    l.source.id++;
  },
  (e, l, g) => {
    l.comment += "[ZXT_MEDIA]{}[/ZXT_MEDIA]";
  }
]) {
  const { e, l, apply } = scene();
  assert.equal(apply().changed, 1);
  const g = l.fx.property(1);
  mutate(e, l, g);
  const before = l.comment,
    count = l.fx.numProperties;
  assert.equal(apply().changed, 0);
  assert.equal(l.comment, before);
  assert.equal(l.fx.numProperties, count);
  assert.equal(
    e.rpc({ action: "mediaLibrary", operation: "load", id: "slide-up" }).ok,
    false
  );
}
blocked((e, l) => {
  l.fx.addProperty("ADBE Geometry2").name =
    "ZxT Media Motion | slide-up | orphan";
});
blocked((e, l) => {
  l.fx.canAddProperty = () => false;
});
blocked((e, l) => {
  const add = l.fx.addProperty;
  l.fx.addProperty = (n) => {
    const g = add(n);
    g.items[1].value = 0;
    return g;
  };
});
blocked((e, l) => {
  const add = l.fx.addProperty;
  l.fx.addProperty = (n) => {
    const g = add(n);
    g.items[1].canSetExpression = false;
    return g;
  };
});
blocked((e, l) => {
  const add = l.fx.addProperty;
  l.fx.addProperty = (n) => {
    const g = add(n);
    g.items[10].maxValue = -1;
    return g;
  };
});
{
  const { e, l, apply } = scene();
  l.comment = 'Note\n[ZXT_SHAPE]{"schema":1,"instances":[]}[/ZXT_SHAPE]';
  const orig = l.comment;
  const add = l.fx.addProperty;
  l.fx.addProperty = (n) => {
    const g = add(n);
    g.items[1].setValue = () => {
      throw Error("injected");
    };
    return g;
  };
  assert.equal(apply().changed, 0);
  assert.equal(l.fx.numProperties, 0);
  assert.equal(l.comment, orig);
}
{
  const { e, l, apply } = scene();
  assert.equal(apply().changed, 1);
  const g = l.fx.property(1),
    before = l.comment,
    states = JSON.stringify(
      g.items.map((p) => [p.value, p.expression, p.expressionEnabled])
    );
  const set = g.items[1].setValue;
  let fail = true;
  g.items[1].setValue = function (v) {
    if (fail) {
      fail = false;
      throw Error("injected");
    }
    set.call(this, v);
  };
  assert.equal(apply("slide-up", { distance: 200 }).changed, 0);
  assert.equal(l.comment, before);
  assert.equal(
    JSON.stringify(
      g.items.map((p) => [p.value, p.expression, p.expressionEnabled])
    ),
    states
  );
}
{
  const { e, l, apply } = scene();
  const b = e.media();
  b.selected = true;
  const add = l.fx.addProperty;
  l.fx.addProperty = (n) => {
    const g = add(n);
    g.items[1].setValue = () => {
      throw Error("injected");
    };
    g.remove = () => {
      throw Error("rollback");
    };
    return g;
  };
  const r = apply();
  assert(r.recovery);
  assert.equal(b.fx.numProperties, 0, "stop after uncertain rollback");
}
{
  const { e, l, apply } = scene();
  assert.equal(apply().changed, 1);
  const loaded = e.rpc({
    action: "mediaLibrary",
    operation: "load",
    id: "slide-up"
  }).instance;
  const b = e.media();
  l.selected = false;
  b.selected = true;
  const r = e.rpc({
    action: "mediaLibrary",
    operation: "update",
    id: "slide-up",
    target: loaded.target,
    revision: loaded.revision,
    params: { distance: 44 }
  });
  assert(!r.ok || r.changed === 0);
  assert.equal(b.fx.numProperties, 0);
}
for (const fps of [24, 30, 60]) {
  const { e, l, apply } = scene();
  e.comp.frameRate = fps;
  assert.equal(apply("blur-reveal", { duration: 2 }).changed, 1);
  const expression = l.fx.property(1).property(1).expression;
  assert.equal(vm.runInNewContext(expression, { time: 4.5 }), 20);
  assert.equal(vm.runInNewContext(expression, { time: 6.5 }), 0);
  assert.equal(vm.runInNewContext(expression, { time: 10000 }), 0);
}
{
  const { e, l, apply } = scene();
  l.outPoint = 5;
  assert.equal(apply("slide-up", { duration: 1 }).changed, 0);
  assert.equal(l.fx.numProperties, 0);
}
{
  const { e, l, apply } = scene();
  assert.equal(apply("pop-in", { fadeIn: "on" }).changed, 1);
  const g = l.fx.property(1);
  assert.equal(vm.runInNewContext(g.property(9).expression, { time: 4.5 }), 0);
  assert.equal(
    vm.runInNewContext(g.property(4).expression, { time: 5.5 }),
    100
  );
}
{
  const { e, l, apply } = scene();
  assert.equal(apply("rgb-split", { amount: 0 }).changed, 1);
  assert(l.fx.property(1).items.every((p) => p.value === 0));
  e.reload();
  vm.runInContext(
    require("node:fs").readFileSync("jsx/media.jsx", "utf8"),
    e.context
  );
  assert(
    e.rpc({ action: "mediaLibrary", operation: "load", id: "rgb-split" })
      .instance
  );
}
console.log(
  "PASS Media type/lock/ID guards, mixed selection, ownership/edit corruption, native contracts, failure rollback/recovery, timing/FPS, optional fade and module restart"
);
// Unbounded native angles are legal; expression endpoints must still fit bounded properties.
{
  const { e, l, apply } = scene();
  const add = l.fx.addProperty;
  l.fx.addProperty = (n) => {
    const g = add(n);
    for (const i of [5, 6, 7]) {
      g.items[i].hasMin = false;
      g.items[i].hasMax = false;
    }
    return g;
  };
  assert.equal(apply().changed, 1, "unbounded angle contract");
}
{
  const { e, l, apply } = scene();
  const add = l.fx.addProperty;
  l.fx.addProperty = (n) => {
    const g = add(n);
    g.items[0].maxValue = 5;
    return g;
  };
  assert.equal(
    apply("blur-reveal", { amount: 20 }).changed,
    0,
    "expression peak must fit actual native range"
  );
}
{
  const { e, l, apply } = scene();
  assert.equal(apply().changed, 1);
  l.inPoint = 5;
  assert.equal(
    apply().changed,
    0,
    "original start no longer inside trimmed layer"
  );
}
// Simulate indexed-group invalidation: old node handles fail, reacquisition survives.
{
  const { e, l, apply } = scene();
  const add = l.fx.addProperty;
  l.fx.addProperty = (n) => {
    for (let i = 0; i < l.fx.items.length; i++) {
      const old = l.fx.items[i],
        fresh = Object.assign(Object.create(Object.getPrototypeOf(old)), old);
      fresh.property = Object.getPrototypeOf(old).property;
      fresh.remove = () => {
        l.fx.items = l.fx.items.filter((x) => x !== fresh);
      };
      l.fx.items[i] = fresh;
      old.property = () => {
        throw Error("invalid indexed handle");
      };
    }
    return add(n);
  };
  assert.equal(apply("slide-up").changed, 1);
  assert.equal(apply("blur-reveal").changed, 1);
  assert.equal(apply("slide-up", { distance: 80 }).changed, 1);
  assert.equal(l.fx.numProperties, 2);
}
// Camera/light subclasses are ineligible despite visual-looking sources.
for (const label of ["CameraLayer", "LightLayer"]) {
  const { e, l, apply } = scene();
  class Layer extends e.context.AVLayer {}
  e.context[label] = Layer;
  l.selected = false;
  const x = new Layer(e.comp);
  x.source = l.source;
  x.id = 4;
  x.selected = true;
  e.comp.items.push(x);
  assert.equal(apply().changed, 0);
}
// A failed single-target mutation does not create an Undo entry for Load/inspect.
{
  const { e, l, apply } = scene();
  const n = e.undo.length;
  assert(
    e.rpc({ action: "mediaLibrary", operation: "inspect" }).layers[0].eligible
  );
  assert(
    e.rpc({ action: "mediaLibrary", operation: "load", id: "slide-up" }).ok
  );
  assert.equal(e.undo.length, n);
}
