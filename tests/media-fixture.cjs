const fs = require("node:fs"),
  vm = require("node:vm"),
  { create, property, CompItem } = require("./host-model.cjs");
function setup() {
  const e = create();
  class FootageItem {
    constructor() {
      this.hasVideo = true;
      this.footageMissing = false;
      this.width = 960;
      this.height = 540;
      this.mainSource = { isStill: true };
    }
  }
  e.context.FootageItem = FootageItem;
  e.comp.id = 501;
  e.undo = [];
  e.context.app.beginUndoGroup = (n) => e.undo.push(n);
  vm.runInContext(fs.readFileSync("jsx/media.jsx", "utf8"), e.context);
  let id = 900;
  e.media = (kind = "footage") => {
    const l = e.comp.add("still");
    l.id = ++id;
    l.source = kind === "precomp" ? new CompItem() : new FootageItem();
    l.source.id = ++id;
    l.source.hasVideo = true;
    l.name = kind;
    l.width = 960;
    l.height = 540;
    const orig = l.fx.addProperty.bind(l.fx);
    l.fx.addProperty = (name) => {
      const g = orig(name);
      let values;
      if (name === "ADBE Geometry2")
        values = [[480, 270], [480, 270], 1, 100, 100, 0, 0, 0, 100, 1, 0];
      else if (name === "ADBE Gaussian Blur 2") values = [0, 1, 0];
      else if (name === "ADBE Channel Blur") values = [0, 0, 0, 0];
      if (values) values = vm.runInContext(JSON.stringify(values), e.context);
      if (values)
        g.items = values.map((v, i) => {
          const p = property(name + "-" + String(i + 1).padStart(4, "0"), v);
          p.hasMin = true;
          p.hasMax = true;
          p.minValue = Array.isArray(v) ? [-30000, -30000] : -30000;
          p.maxValue = Array.isArray(v) ? [30000, 30000] : 30000;
          return p;
        });
      return g;
    };
    return l;
  };
  return e;
}
module.exports = { setup };
