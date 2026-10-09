const fs = require("node:fs"),
  vm = require("node:vm"),
  { create, property } = require("./host-model.cjs");
function setup() {
  const e = create(),
    probe = e.comp.add("shape"),
    Group = probe.vectors.constructor;
  probe.remove();
  const original = Group.prototype.addProperty;
  if (!Group.prototype.shapeFixture) {
    Group.prototype.shapeFixture = true;
    Group.prototype.addProperty = function (name) {
      if (
        ["ADBE Vector Filter - Trim", "ADBE Vector Filter - Roughen"].includes(
          name,
        )
      ) {
        const g = new Group(name),
          names = name.includes("Trim")
            ? [
                "ADBE Vector Trim Start",
                "ADBE Vector Trim End",
                "ADBE Vector Trim Offset",
              ]
            : [
                "ADBE Vector Roughen Size",
                "ADBE Vector Roughen Detail",
                "ADBE Vector Temporal Freq",
              ];
        g.items = names.map((n) => property(n, 0));
        g.items.forEach((p) => {
          p.parentProperty = g;
          p.hasMin = true;
          p.minValue = p.matchName === "ADBE Vector Trim Offset" ? -36000 : 0;
          p.hasMax = true;
          p.maxValue = p.matchName.includes("Detail") ? 100 : 10000;
        });
        g.parentProperty = this;
        g.remove = () => {
          this.items = this.items.filter((x) => x !== g);
        };
        this.items.push(g);
        return g;
      }
      const g = original.call(this, name);
      if (["ADBE Glo2", "ADBE Gaussian Blur 2", "ADBE Drop Shadow", "ADBE Turbulent Displace"].includes(name))
        g.items.forEach((p, i) => {
          p.hasMin = true;
          p.minValue = 0;
          p.hasMax = true;
          p.maxValue = 10000;
          if (name === "ADBE Glo2" && i === 1) p.maxValue = 1;
          if (name === "ADBE Drop Shadow" && i === 1) p.maxValue = 255;
          if ((name === "ADBE Drop Shadow" && i === 2) || (name === "ADBE Turbulent Displace" && i === 5)) {p.minValue=-36000;p.maxValue=36000;}
        });
      return g;
    };
  }
  e.undo = [];
  e.context.app.beginUndoGroup = (n) => e.undo.push(n);
  if (fs.existsSync(require("node:path").join(__dirname, "../jsx/shape.jsx")))
    vm.runInContext(
      fs.readFileSync(
        require("node:path").join(__dirname, "../jsx/shape.jsx"),
        "utf8",
      ),
      e.context,
    );
  let nextId = 700;
  e.comp.id = 501;
  e.shape = () => {
    const l = e.comp.add("shape");
    l.name = "Shape";
    l.id = ++nextId;
    const g = l.vectors.addProperty("ADBE Vector Group");
    g.name = "Artwork";
    const c = g.property("ADBE Vectors Group");
    c.addProperty("ADBE Vector Shape - Group");
    c.addProperty("ADBE Vector Graphic - Stroke")
      .property("ADBE Vector Stroke Width")
      .setValue(2);
    l.selectedProperties = [];
    return l;
  };
  e.contents = (l) => l.vectors.property(1).property("ADBE Vectors Group");
  return e;
}
module.exports = { setup };
