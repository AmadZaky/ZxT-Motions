/* Isolated, ES3 Shape pilot engine. Comments + tokened native names form the
   ownership contract. Never infers ownership from an Adobe matchName alone. */
var codec,
  OPEN = "[ZXT_SHAPE]",
  CLOSE = "[/ZXT_SHAPE]",
  serial = 0;
function stop(message) {
  var e = Error("ZxT Shape: " + message);
  e.noChanges = true;
  throw e;
}
function definition(id) {
  for (var i = 0; i < registry.presets.length; i++)
    if (registry.presets[i].id === id) return registry.presets[i];
  stop("Unknown Shape preset.");
}
function parameters(id, raw) {
  var d = definition(id),
    out = {},
    i,
    p,
    v,
    j,
    valid;
  raw = raw || {};
  for (i = 0; i < d.parameters.length; i++) {
    p = d.parameters[i];
    v = raw[p.key];
    if (v === undefined) v = p["default"];
    if (p.type === "number") {
      if (typeof v !== "number" || !isFinite(v) || v < p.min || v > p.max)
        stop("Invalid " + p.label + ".");
    } else {
      valid = false;
      for (j = 0; j < p.options.length; j++)
        if (v === p.options[j]) valid = true;
      if (!valid) stop("Invalid " + p.label + ".");
    }
    out[p.key] = v;
  }
  return out;
}
function read(l) {
  var text = String(l.comment || ""),
    a = text.indexOf(OPEN),
    b = text.indexOf(CLOSE),
    data;
  if (a < 0 && b < 0) return { schema: 1, instances: [] };
  if (
    a < 0 ||
    b < a ||
    text.indexOf(OPEN, a + OPEN.length) >= 0 ||
    text.indexOf(CLOSE, b + CLOSE.length) >= 0
  )
    stop("Shape ownership record is damaged; restore it before applying.");
  try {
    data = codec.parse(text.substring(a + OPEN.length, b));
  } catch (e) {
    stop("Shape ownership record is damaged.");
  }
  if (!data || data.schema !== 1 || !(data.instances instanceof Array))
    stop("Unsupported Shape ownership record.");
  var seen = {},
    i,
    r,
    j;
  for (i = 0; i < data.instances.length; i++) {
    r = data.instances[i];
    definition(r.id);
    parameters(r.id, r.params);
    if (
      seen[r.id] ||
      typeof r.token !== "string" ||
      !/^[a-z0-9_]+$/.test(r.token) ||
      typeof r.start !== "number" ||
      !isFinite(r.start) ||
      !r.node ||
      typeof r.node.name !== "string" ||
      r.node.name !== "ZxT Shape | " + r.id + " | " + r.token ||
      typeof r.node.match !== "string" ||
      !(r.states instanceof Array) ||
      !r.states.length
    )
      stop("Shape ownership record is invalid.");
    seen[r.id] = true;
    for (j = 0; j < r.states.length; j++) {
      var s = r.states[j];
      if (
        typeof s.match !== "string" ||
        typeof s.value !== "number" ||
        !isFinite(s.value) ||
        typeof s.expression !== "string" ||
        typeof s.enabled !== "boolean"
      )
        stop("Shape property record is invalid.");
    }
    if (r.controlVersion !== undefined || r.controls !== undefined) {
      var specs = numeric(r.id);
      if (r.controlVersion !== 1 || !(r.controls instanceof Array) || r.controls.length !== specs.length)
        stop("Shape control ownership record is invalid.");
      for (j = 0; j < specs.length; j++)
        if (!r.controls[j] || r.controls[j].key !== specs[j].key || r.controls[j].name !== controlName(r, specs[j].key))
          stop("Shape control ownership record is invalid.");
    } else {
      for (j = 0; j < r.states.length; j++)
        if (r.states[j].expression.indexOf("ZxT Shape Control | ") >= 0)
          stop("Shape controller ownership is missing; restore it before Update.");
    }
  }
  return data;
}
function write(l, data) {
  var text = String(l.comment || ""),
    a = text.indexOf(OPEN),
    b = text.indexOf(CLOSE),
    record = OPEN + codec.encode(data) + CLOSE;
  if (a >= 0)
    l.comment =
      text.substring(0, a) + record + text.substring(b + CLOSE.length);
  else l.comment = text + (text ? "\n" : "") + record;
}
function instance(data, id) {
  for (var i = 0; i < data.instances.length; i++)
    if (data.instances[i].id === id) return data.instances[i];
  return null;
}
function layerId(l) {
  if (typeof l.id !== "number" || !isFinite(l.id))
    stop(
      "Shape requires stable layer IDs (AE 2022 or newer). Use AE 2025 for this pilot."
    );
  return l.id;
}
function compId(c) {
  return typeof c.id === "number" ? c.id : c.name;
}
function identity(c, l, r) {
  return { comp: compId(c), layer: layerId(l), token: r.token };
}
function same(a, b) {
  return (
    a && b && a.comp === b.comp && a.layer === b.layer && a.token === b.token
  );
}
function owned(l, r) {
  var root =
      r.node.kind === "effect"
        ? l.property("ADBE Effect Parade")
        : l.property("ADBE Root Vectors Group"),
    found = [];
  function walk(g) {
    if (!g) return;
    for (var i = 1; i <= g.numProperties; i++) {
      var p = g.property(i);
      if (p.name === r.node.name) {
        if (p.matchName !== r.node.match)
          stop("Owned Shape instance changed type.");
        found.push(p);
      }
      if (r.node.kind !== "effect" && p.numProperties) walk(p);
    }
  }
  walk(root);
  if (found.length !== 1)
    stop(
      "Owned Shape instance was removed, renamed or duplicated. Restore it before updating."
    );
  return found[0];
}
function base(p) {
  return p.valueAtTime(0, true);
}
function snapshot(p) {
  var v = base(p);
  if (typeof v !== "number" || !isFinite(v))
    stop("Native Shape property is not scalar.");
  return {
    match: p.matchName,
    value: v,
    expression: String(p.expression || ""),
    enabled: !!p.expressionEnabled
  };
}
function states(g, matches) {
  var a = [];
  for (var i = 0; i < matches.length; i++) {
    var p = g.property(matches[i]);
    if (!p) stop("Required native Shape property unavailable: " + matches[i]);
    a.push(snapshot(p));
  }
  return a;
}
function validateOwned(g, r) {
  for (var i = 0; i < r.states.length; i++) {
    var s = r.states[i],
      p = g.property(s.match);
    if (
      !p ||
      p.numKeys ||
      Math.abs(base(p) - s.value) > 0.000001 ||
      String(p.expression || "") !== s.expression ||
      !!p.expressionEnabled !== s.enabled
    )
      stop(
        "This Shape instance has custom keyframes, expressions or values. Restore its managed controls before Update."
      );
  }
}
function numeric(id) {
  var all = definition(id).parameters, out = [];
  for (var i = 0; i < all.length; i++) if (all[i].type === "number") out.push(all[i]);
  return out;
}
function controlName(r, key) {
  return "ZxT Shape Control | " + r.id + " | " + r.token + " | " + key;
}
function control(l, descriptor) {
  var effects = l.property("ADBE Effect Parade"), found = null, count = 0;
  for (var i = 1; effects && i <= effects.numProperties; i++) {
    var g = effects.property(i);
    if (g.name === descriptor.name) { found = g; count++; }
  }
  if (count !== 1 || found.matchName !== "ADBE Slider Control" || !found.property("ADBE Slider Control-0001"))
    stop("Owned Shape slider was removed, renamed, duplicated or changed type. Restore it before Update.");
  return found;
}
function controlState(l, descriptor) {
  var p = control(l, descriptor).property("ADBE Slider Control-0001"), out = snapshot(p);
  out.key = descriptor.key;
  out.keys = [];
  for (var i = 1; i <= p.numKeys; i++) {
    var k = {time:p.keyTime(i), value:p.keyValue(i)};
    if (p.keyInInterpolationType) {
      k.input = String(p.keyInInterpolationType(i)); k.output = String(p.keyOutInterpolationType(i));
      k.inEase = easeState(p.keyInTemporalEase(i)); k.outEase = easeState(p.keyOutTemporalEase(i));
      k.auto = p.keyTemporalAutoBezier(i); k.continuous = p.keyTemporalContinuous(i);
    }
    out.keys.push(k);
  }
  return out;
}
function easeState(values) {
  var out = [];
  for (var i = 0; i < values.length; i++) out.push({speed:values[i].speed, influence:values[i].influence});
  return out;
}
function controlStates(l, r) {
  var out = [];
  for (var i = 0; r.controls && i < r.controls.length; i++) out.push(controlState(l, r.controls[i]));
  return out;
}
function liveParams(l, r, time) {
  var out = parameters(r.id, r.params), specs = numeric(r.id);
  for (var i = 0; r.controls && i < r.controls.length; i++) {
    var v = control(l, r.controls[i]).property("ADBE Slider Control-0001").valueAtTime(specs[i].key === "duration" ? r.start : time, false);
    if (typeof v !== "number" || !isFinite(v)) stop("Invalid live Shape slider: " + specs[i].label);
    out[specs[i].key] = Math.max(specs[i].min, Math.min(specs[i].max, v));
  }
  return out;
}
function revision(l, r, p) {
  return codec.encode({record:r, controls:controlStates(l, r), params:p});
}
function checkRevision(l, r, text) {
  var saved;
  try { saved = codec.parse(text); } catch (e) { stop("Shape settings changed. Load them again before Update."); }
  if (!saved || codec.encode(saved.record) !== codec.encode(r) || codec.encode(saved.controls) !== codec.encode(controlStates(l, r)))
    stop("Shape settings changed. Load them again before Update.");
  return parameters(r.id, saved.params);
}
function ensureControls(l, r, p, added) {
  if (r.controls) return;
  r.controlVersion = 1; r.controls = [];
  var specs = numeric(r.id), effects = l.property("ADBE Effect Parade");
  for (var i = 0; i < specs.length; i++) {
    if (!effects || !effects.canAddProperty("ADBE Slider Control")) stop("AE Slider Control is unavailable.");
    var desc = {key:specs[i].key, name:controlName(r, specs[i].key)}, node = effects.addProperty("ADBE Slider Control");
    try { node.name = desc.name; } catch (e) {
      try { node.remove(); } catch (rollbackError) { e.recovery = true; }
      throw e;
    }
    added.push(desc); r.controls.push(desc);
    control(l, desc).property("ADBE Slider Control-0001").setValue(p[desc.key]);
  }
}
function updateControls(l, r, p, protectedParams, changed) {
  for (var i = 0; i < r.controls.length; i++) {
    var desc = r.controls[i], prop = control(l, desc).property("ADBE Slider Control-0001"), key = desc.key;
    if (prop.numKeys || String(prop.expression || "")) {
      if (Math.abs(p[key] - protectedParams[key]) > 0.000001)
        stop("" + key + " has AE keyframes or an expression. Edit it in AE Effect Controls, then Load settings.");
    } else if (Math.abs(base(prop) - p[key]) > 0.000001) {
      changed.push({descriptor:desc, state:snapshot(prop)});
      prop.setValue(p[key]);
    }
  }
}
function binding(r, key, atStart) {
  var specs = numeric(r.id), spec;
  for (var i = 0; i < specs.length; i++) if (specs[i].key === key) spec = specs[i];
  return "Math.max(" + spec.min + ",Math.min(" + spec.max + ",effect(" + codec.encode(controlName(r, key)) + ")(1).valueAtTime(" + (atStart ? r.start : "time") + ")))";
}
function bound(r, key, factor) {
  return "// ZxT Shape " + r.token + "\n" + binding(r, key, false) + (factor === undefined ? "" : "*" + factor) + ";";
}
function exported(c, l, r) {
  var p = liveParams(l, r, c.time), keyed = [];
  for (var i = 0; r.controls && i < r.controls.length; i++) {
    var prop = control(l, r.controls[i]).property("ADBE Slider Control-0001");
    if (prop.numKeys || String(prop.expression || "")) keyed.push(r.controls[i].key);
  }
  return {id:r.id, params:p, start:r.start, target:identity(c,l,r), revision:revision(l,r,p), keyed:keyed};
}
function scalar(g, name, v, expression) {
  var p = g.property(name);
  if (!p || typeof base(p) !== "number")
    stop("Native property unavailable: " + name);
  if ((p.hasMin && v < p.minValue) || (p.hasMax && v > p.maxValue))
    stop("Value outside native range: " + name);
  p.setValue(v);
  if (expression) {
    if (!p.canSetExpression)
      stop("Native property does not support expressions.");
    p.expression = expression;
    p.expressionEnabled = true;
    if (p.expressionError)
      stop("Native expression error: " + p.expressionError);
  } else if (p.canSetExpression) {
    p.expression = "";
    p.expressionEnabled = false;
  }
}
function ease(mode) {
  if (mode === "ease-in") return "u=u*u;";
  if (mode === "ease-out") return "u=1-(1-u)*(1-u);";
  if (mode === "easy") return "u=u*u*(3-2*u);";
  return "";
}
function timed(r, p, pulse) {
  var s =
    "// ZxT Shape " +
    r.token +
    "\nvar u=Math.max(0,Math.min(1,(time-" +
    r.start +
    ")/" +
    binding(r, "duration", true) +
    "));\n";
  if (pulse) s += "u=1-Math.abs(2*u-1);\n";
  if (pulse) return s + ease(p.easing) + binding(r, "amount", false) + "*u;";
  return s + ease(p.easing) + "var a=" + binding(r,"start",false) + ";a+(" + binding(r,"end",false) + "-a)*u;";
}
function matches(id) {
  if (id === "trim-in")
    return [
      "ADBE Vector Trim Start",
      "ADBE Vector Trim End",
      "ADBE Vector Trim Offset"
    ];
  if (id === "path-wiggle")
    return [
      "ADBE Vector Roughen Size",
      "ADBE Vector Roughen Detail",
      "ADBE Vector Temporal Freq"
    ];
  if (id === "glow")
    return [
      "ADBE Glo2-0001",
      "ADBE Glo2-0002",
      "ADBE Glo2-0003",
      "ADBE Glo2-0004"
    ];
  if (id === "drop-shadow") return ["ADBE Drop Shadow-0002", "ADBE Drop Shadow-0003", "ADBE Drop Shadow-0004", "ADBE Drop Shadow-0005"];
  if (id === "turbulent-displace") return ["ADBE Turbulent Displace-0002", "ADBE Turbulent Displace-0003", "ADBE Turbulent Displace-0005", "ADBE Turbulent Displace-0006"];
  return [
    "ADBE Gaussian Blur 2-0001",
    "ADBE Gaussian Blur 2-0002",
    "ADBE Gaussian Blur 2-0003"
  ];
}
function configure(g, r, p) {
  if (r.id === "trim-in") {
    scalar(g, "ADBE Vector Trim Start", p.start, bound(r,"start"));
    scalar(g, "ADBE Vector Trim Offset", p.offset, bound(r,"offset"));
    scalar(g, "ADBE Vector Trim End", 100, timed(r, p, false));
  } else if (r.id === "path-wiggle") {
    scalar(
      g,
      "ADBE Vector Roughen Size",
      p.amount,
      "// ZxT Shape " +
        r.token +
        "\ntime < " +
        r.start +
        " ? 0 : " +
        binding(r, "amount", false) +
        ";"
    );
    scalar(g, "ADBE Vector Roughen Detail", p.detail, bound(r,"detail"));
    scalar(g, "ADBE Vector Temporal Freq", p.speed, bound(r,"speed"));
  } else if (r.id === "glow") {
    var threshold = g.property("ADBE Glo2-0002");
    if (!threshold || !threshold.hasMax)
      stop("Glow threshold native range unavailable.");
    var limit = threshold.maxValue;
    if (limit !== 1 && limit !== 100) stop("Unsupported Glow threshold range.");
    scalar(g, "ADBE Glo2-0001", 1);
    scalar(g, "ADBE Glo2-0002", (p.threshold * limit) / 100, bound(r,"threshold",limit / 100));
    scalar(g, "ADBE Glo2-0003", p.radius, bound(r,"radius"));
    scalar(g, "ADBE Glo2-0004", p.intensity, bound(r,"intensity"));
  } else if (r.id === "drop-shadow") {
    var opacity = g.property("ADBE Drop Shadow-0002");
    if (!opacity || !opacity.hasMax || (opacity.maxValue !== 1 && opacity.maxValue !== 100 && opacity.maxValue !== 255))
      stop("Unsupported native Drop Shadow opacity range.");
    var factor = opacity.maxValue / 100;
    scalar(g,"ADBE Drop Shadow-0002",p.opacity * factor,bound(r,"opacity",factor));
    scalar(g,"ADBE Drop Shadow-0003",p.direction,bound(r,"direction"));
    scalar(g,"ADBE Drop Shadow-0004",p.distance,bound(r,"distance"));
    scalar(g,"ADBE Drop Shadow-0005",p.softness,bound(r,"softness"));
  } else if (r.id === "turbulent-displace") {
    scalar(g,"ADBE Turbulent Displace-0002",p.amount,bound(r,"amount"));
    scalar(g,"ADBE Turbulent Displace-0003",p.size,bound(r,"size"));
    scalar(g,"ADBE Turbulent Displace-0005",p.complexity,bound(r,"complexity"));
    scalar(g,"ADBE Turbulent Displace-0006",p.evolution,bound(r,"evolution"));
  } else {
    scalar(g, "ADBE Gaussian Blur 2-0002", 1);
    scalar(g, "ADBE Gaussian Blur 2-0003", 1);
    if (r.id === "blur-pulse") scalar(g, "ADBE Gaussian Blur 2-0001", 0, timed(r, p, true));
    else scalar(g, "ADBE Gaussian Blur 2-0001", p.amount, bound(r,"amount"));
  }
}
function groupPath(l, id) {
  var root = l.property("ADBE Root Vectors Group"),
    groups = [],
    selected = l.selectedProperties || [],
    pathNames = {
      "ADBE Vector Shape - Group": true,
      "ADBE Vector Shape - Rect": true,
      "ADBE Vector Shape - Ellipse": true,
      "ADBE Vector Shape - Star": true
    };
  function collect(c) {
    var path = false;
    for (var i = 1; i <= c.numProperties; i++) {
      var p = c.property(i);
      if (pathNames[p.matchName]) path = true;
      if (p.matchName === "ADBE Vector Group")
        collect(p.property("ADBE Vectors Group"));
    }
    if (path) groups.push(c);
  }
  function contains(g, p) {
    if (g === p) return true;
    for (var i = 1; i <= g.numProperties; i++) {
      var q = g.property(i);
      if (q === p) return true;
      if (q.numProperties && contains(q, p)) return true;
    }
    return false;
  }
  collect(root);
  if (!groups.length) stop("Shape layer has no supported path.");
  var chosen = groups[0];
  if (groups.length > 1) {
    var candidates = [];
    for (var i = 0; i < groups.length; i++)
      for (var j = 0; j < selected.length; j++) {
        var candidate = selected[j];
        if (candidate.matchName === "ADBE Vector Group")
          candidate = candidate.property("ADBE Vectors Group");
        while (candidate) {
          var isGroup = false;
          for (var gi = 0; gi < groups.length; gi++)
            if (candidate === groups[gi]) isGroup = true;
          if (isGroup) break;
          candidate = candidate.parentProperty;
        }
        if (candidate === groups[i]) {
          candidates.push(groups[i]);
          break;
        }
      }
    if (candidates.length !== 1)
      stop(
        "Select one path/group in the AE timeline when the layer has several path groups."
      );
    chosen = candidates[0];
  }
  if (id === "trim-in") {
    var stroke = false;
    for (var k = 1; k <= chosen.numProperties; k++) {
      var s = chosen.property(k);
      if (
        s.matchName === "ADBE Vector Graphic - Stroke" &&
        s.enabled !== false &&
        s.property("ADBE Vector Stroke Width") &&
        s.property("ADBE Vector Stroke Width").value > 0
      )
        stroke = true;
    }
    if (!stroke)
      stop(
        "Trim Path In needs an enabled stroke in the selected path group. Filled artwork is not hidden."
      );
  }
  return chosen;
}
function createNode(l, r) {
  var group, match;
  if (r.id === "trim-in" || r.id === "path-wiggle") {
    group = groupPath(l, r.id);
    match =
      r.id === "trim-in"
        ? "ADBE Vector Filter - Trim"
        : "ADBE Vector Filter - Roughen";
    r.node = {
      kind: "operator",
      match: match,
      name: "ZxT Shape | " + r.id + " | " + r.token
    };
  } else {
    group = l.property("ADBE Effect Parade");
    match = "ADBE Gaussian Blur 2";
    if (r.id === "glow") match = "ADBE Glo2";
    if (r.id === "drop-shadow") match = "ADBE Drop Shadow";
    if (r.id === "turbulent-displace") match = "ADBE Turbulent Displace";
    r.node = {
      kind: "effect",
      match: match,
      name: "ZxT Shape | " + r.id + " | " + r.token
    };
  }
  if (!group || !group.canAddProperty(match))
    stop("Required native Shape operator/effect unavailable.");
  var node = group.addProperty(match);
  try {
    node.name = r.node.name;
  } catch (error) {
    try {
      node.remove();
    } catch (rollbackError) {
      error.recovery = true;
    }
    throw error;
  }
  return node;
}
function restore(g, a) {
  for (var i = 0; i < a.length; i++) {
    var s = a[i],
      p = g.property(s.match);
    p.setValue(s.value);
    if (p.canSetExpression) {
      p.expression = s.expression;
      p.expressionEnabled = s.enabled;
    }
  }
}
function applyOne(c, l, a, p) {
  layerId(l); // Never bind Shape Update to a reorderable layer index.
  var data = read(l),
    r = instance(data, a.id),
    oldComment = String(l.comment || ""),
    g,
    created = false,
    before = null,
    added = [], controlChanges = [], protectedParams = null;
  if (a.operation === "update") {
    if (!r) stop("No owned instance. Apply first.");
    if (!same(a.target, identity(c, l, r)))
      stop("Selection changed. Load Shape settings again.");
    protectedParams = checkRevision(l, r, a.revision);
  }
  if (r) {
    g = owned(l, r);
    validateOwned(g, r);
    before = states(g, matches(r.id));
    if (!protectedParams) protectedParams = liveParams(l, r, c.time);
  } else {
    if (a.operation !== "apply") stop("Apply this Shape preset first.");
    if ((a.id === "trim-in" || a.id === "path-wiggle" || a.id === "blur-pulse") && (c.time < l.inPoint || c.time >= l.outPoint))
      stop("Move the playhead inside the selected layer before Apply.");
    r = {
      id: a.id,
      token: "s" + new Date().getTime().toString(36) + "_" + ++serial,
      params: p,
      start: c.time,
      node: null,
      states: []
    };
  }
  if (p.duration && (r.start < l.inPoint || r.start >= l.outPoint))
    stop("Original start is outside the current layer bounds.");
  if (p.duration && r.start + p.duration > l.outPoint + 0.000001)
    stop("Duration extends beyond the layer out-point.");
  try {
    if (!g) {
      g = createNode(l, r);
      created = true;
      g = owned(l, r);
    }
    ensureControls(l, r, p, added);
    updateControls(l, r, p, protectedParams || p, controlChanges);
    // Adding to indexed AE Effect Parade invalidates earlier Property references.
    g = owned(l, r);
    configure(g, r, p);
    r.params = p;
    r.states = states(g, matches(r.id));
    if (created) data.instances.push(r);
    write(l, data);
    return r;
  } catch (error) {
    var recovery = !!error.recovery;
    try {
      if (!created && before) restore(owned(l, r), before);
      for (var ci = controlChanges.length - 1; ci >= 0; ci--) {
        var change = controlChanges[ci];
        control(l, change.descriptor).property("ADBE Slider Control-0001").setValue(change.state.value);
      }
      for (var ai = added.length - 1; ai >= 0; ai--) control(l, added[ai]).remove();
      if (created) owned(l, r).remove();
      l.comment = oldComment;
    } catch (rollbackError) {
      recovery = true;
    }
    if (recovery) {
      var e = Error(
        String(error) + " Rollback incomplete; Undo once and inspect the layer."
      );
      e.recovery = true;
      throw e;
    }
    throw error;
  }
}
function run(a, shared) {
  codec = shared;
  definition(a.id);
  if (
    a.operation !== "apply" &&
    a.operation !== "update" &&
    a.operation !== "load"
  )
    stop("Invalid Shape operation.");
  var c = app.project && app.project.activeItem;
  if (!(c instanceof CompItem)) stop("Open a composition.");
  var layers = c.selectedLayers;
  if (!layers.length) stop("Select a Shape layer.");
  if (a.operation === "load") {
    if (
      layers.length !== 1 ||
      !(layers[0] instanceof ShapeLayer) ||
      layers[0].nullLayer
    )
      stop("Select exactly one Shape layer to load settings.");
    layerId(layers[0]);
    var d = read(layers[0]),
      r = instance(d, a.id);
    var selectionTarget = { comp: compId(c), layer: layerId(layers[0]) };
    if (!r) return { ok: true, selectionTarget: selectionTarget, instance: null };
    owned(layers[0], r);
    return {
      ok: true,
      selectionTarget: selectionTarget,
      instance: exported(c, layers[0], r)
    };
  }
  if (a.operation === "update" && (layers.length !== 1 || !a.target))
    stop("Select the loaded Shape layer to Update.");
  if (a.operation === "update") {
    var record = instance(read(layers[0]), a.id);
    if (!record || !same(a.target, identity(c, layers[0], record)))
      stop("Selection changed. Load Shape settings again.");
  }
  var p = parameters(a.id, a.params),
    changed = 0,
    errors = [],
    recovery = false;
  for (var i = 0; i < layers.length; i++) {
    var l = layers[i];
    try {
      if (!(l instanceof ShapeLayer) || l.nullLayer)
        stop("Requires a Shape layer.");
      if (l.locked) stop("Unlock the Shape layer first.");
      applyOne(c, l, a, p);
      changed++;
    } catch (e) {
      errors.push(l.name + ": " + String(e));
      if (e.recovery) {
        recovery = true;
        break;
      }
    }
  }
  var result = {
    ok: true,
    changed: changed,
    message:
      definition(a.id).name +
      ": " +
      changed +
      " Shape layer(s) " +
      (a.operation === "update" ? "updated" : "applied") +
      "."
  };
  if (errors.length) {
    result.severity = "warning";
    result.message += "\n" + errors.join("\n");
  }
  if (recovery) result.recovery = true;
  if (changed === 1 && layers.length === 1) {
    var current = instance(read(layers[0]), a.id);
    result.instance = exported(c, layers[0], current);
  }
  return result;
}
return { run: run, shapeVersion: 2 };
