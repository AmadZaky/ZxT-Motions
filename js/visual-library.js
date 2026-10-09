/* Shape adapter: independent metadata, forms and host route; shared Studio shell. */
window.ShapeLibrary = (() => {
  const $ = (id) => document.getElementById(id),
    presets = window.ZXT_SHAPE_PRESETS.presets;
  let api,
    preset = null,
    params = {},
    loaded = null,
    busy = false,
    visible = false,
    dirty = false,
    opening = 0,
    draftKey = null;
  const drafts = {},
    controls = new Map();
  function save() {
    if (preset && draftKey)
      drafts[draftKey] = { params: { ...params }, loaded, dirty };
  }
  function selectionKey() {
    const c = window.ZxTSelection && ZxTSelection.context();
    return JSON.stringify(c ? [c.compId, c.layers.map((l) => l.id)] : null);
  }
  function nativeSelectionMatches(response, key) {
    const captured = JSON.parse(key),
      target = response && response.selectionTarget;
    return !!(
      captured &&
      captured[1].length === 1 &&
      target &&
      target.comp === captured[0] &&
      target.layer === captured[1][0] &&
      (!response.instance ||
        (response.instance.target.comp === target.comp &&
          response.instance.target.layer === target.layer))
    );
  }
  function guidance() {
    if (!api.ready()) return "Connect to After Effects first.";
    const c = ZxTSelection.context();
    if (!c || c.compId === null) return "Open a composition in After Effects.";
    if (!c.total) return "Select a Shape layer in After Effects.";
    if (loaded) {
      const row = c.total === 1 && c.layers[0];
      if (
        !row ||
        c.compId !== loaded.target.comp ||
        row.id !== loaded.target.layer
      )
        return "Selection changed. Select the loaded Shape layer or Load settings again.";
      if (row.locked) return "Unlock the selected Shape layer.";
    }
    if (!c.layers.some((l) => l.type === "Shape" && !l.locked) && !c.truncated)
      return "Select an unlocked Shape layer.";
    return "";
  }
  function sync() {
    if (!api) return;
    const reason = guidance(),
      invalid = [...controls.values()].some((c) => !c.checkValidity());
    $("shape-apply").hidden = !!loaded;
    $("shape-update").hidden = !loaded;
    $("shape-apply").disabled = busy || !!reason || invalid;
    $("shape-update").disabled = busy || !!reason || invalid || !dirty;
    const c = ZxTSelection.context();
    $("shape-load").disabled =
      busy ||
      !api.ready() ||
      !c ||
      c.total !== 1 ||
      c.layers[0].type !== "Shape";
    $("shape-mode").textContent = loaded
      ? dirty
        ? "APPLIED · UNSAVED CHANGES"
        : "APPLIED · UP TO DATE"
      : "CUSTOMIZE SHAPE";
    $("shape-guidance").textContent =
      reason ||
      (loaded
        ? "Updates the loaded owned instance; its start time stays fixed."
        : "Applies to unlocked Shape layers. Other selected layer types are skipped.");
    for (const [key, control] of controls) control.disabled = busy || !!(loaded && loaded.keyed && loaded.keyed.includes(key));
    $("shape-back").disabled = busy;
  }
  function drawForm() {
    controls.clear();
    $("shape-parameters").textContent = "";
    for (const p of preset.parameters) {
      const wrap = document.createElement("div");
      wrap.className = "parameter";
      const label = document.createElement("label");
      label.textContent = p.label;
      if (loaded && loaded.keyed && loaded.keyed.includes(p.key)) label.textContent += " · AE animation";
      label.htmlFor = "shape-param-" + p.key;
      const input = document.createElement(
        p.type === "select" ? "select" : "input",
      );
      input.id = label.htmlFor;
      input.dataset.parameter = p.key;
      if (p.type === "select")
        for (const option of p.options) {
          const o = document.createElement("option");
          o.value = option;
          o.textContent = option.replace(/-/g, " ");
          input.appendChild(o);
        }
      else {
        input.type = "number";
        input.min = p.min;
        input.max = p.max;
        input.step = p.step;
        input.required = true;
        input.className = "exact";
      }
      input.value = params[p.key];
      if (loaded && loaded.keyed && loaded.keyed.includes(p.key)) input.title = "Edit this animated control in AE Effect Controls, then Load settings.";
      input.oninput = () => {
        params[p.key] = p.type === "number" ? Number(input.value) : input.value;
        if (p.type === "number" && !input.value) params[p.key] = NaN;
        input.setAttribute("aria-invalid", String(!input.checkValidity()));
        dirty = true;
        save();
        ShapePreview.draw($("shape-preview"), preset.id, 0.5, params);
        sync();
      };
      wrap.append(label, input);
      $("shape-parameters").appendChild(wrap);
      controls.set(p.key, input);
    }
  }
  function useInstance(instance) {
    loaded = instance;
    dirty = false;
    if (instance) params = { ...instance.params };
    drawForm();
    save();
    sync();
  }
  async function load() {
    if (busy || !preset) return;
    save(); // Preserve the original selection's dirty draft before loading another.
    const sequence = ++opening,
      id = preset.id,
      key = selectionKey(),
      r = await api.action({ action: "shapeLibrary", operation: "load", id });
    if (
      sequence === opening &&
      visible &&
      !$("shape-inspector").hidden &&
      r &&
      preset &&
      preset.id === id &&
      selectionKey() === key &&
      nativeSelectionMatches(r, key)
    ) {
      const nextKey = ZxTWorkspace.draftKey("shape:" + id);
      if (nextKey !== draftKey) {
        const nextDraft = drafts[nextKey];
        params = nextDraft
          ? { ...nextDraft.params }
          : Object.fromEntries(
              preset.parameters.map((p) => [p.key, p.default])
            );
        draftKey = nextKey;
      }
      useInstance(r.instance);
      if (!r.instance)
        api.notice("No owned instance on this layer. Use Apply.", "info");
    }
  }
  function close() {
    if (busy) return;
    save();
    ++opening;
    $("shape-inspector").hidden = true;
    ShapePreview.stop($("shape-preview"));
    ZxTWorkspace.closed();
  }
  async function openById(id) {
    if (busy || !visible) return;
    const p = presets.find((p) => p.id === id);
    if (!p) return;
    save();
    preset = p;
    draftKey = ZxTWorkspace.draftKey("shape:" + id);
    const draft = drafts[draftKey];
    params = Object.fromEntries(p.parameters.map((c) => [c.key, c.default]));
    loaded = null;
    dirty = false;
    if (draft) {
      params = { ...draft.params };
      loaded = draft.loaded;
      dirty = draft.dirty;
    }
    $("shape-title").textContent = p.name;
    $("shape-description").textContent = p.description;
    $("shape-inspector").hidden = false;
    document
      .querySelectorAll("#shape-library .card")
      .forEach((card) =>
        card.classList.toggle("selected", card.dataset.preset === id),
      );
    ZxTWorkspace.opened();
    drawForm();
    sync();
    ShapePreview.play($("shape-preview"), id, params, true);
    const sequence = ++opening,
      c = ZxTSelection.context(),
      key = selectionKey();
    if (
      !draft &&
      api.ready() &&
      c &&
      c.total === 1 &&
      c.layers[0].type === "Shape"
    ) {
      const r = await api.action({
        action: "shapeLibrary",
        operation: "load",
        id,
      });
      if (
        sequence === opening &&
        preset.id === id &&
        key === selectionKey() &&
        r &&
        nativeSelectionMatches(r, key)
      )
        useInstance(r.instance);
    }
  }
  async function apply(update) {
    if (busy || !preset) return;
    sync();
    if ($(update ? "shape-update" : "shape-apply").disabled) return;
    save();
    const r = await api.action({
      action: "shapeLibrary",
      operation: update ? "update" : "apply",
      id: preset.id,
      params: { ...params },
      target: update && loaded ? loaded.target : undefined,
      revision: update && loaded ? loaded.revision : undefined
    });
    if (
      r &&
      r.changed > 0 &&
      r.instance &&
      !r.recovery &&
      nativeSelectionMatches(
        { selectionTarget: r.instance.target, instance: r.instance },
        selectionKey()
      )
    ) {
      draftKey = ZxTWorkspace.draftKey("shape:" + preset.id);
      useInstance(r.instance);
      ShapePreview.play($("shape-preview"), preset.id, params, true);
    }
  }
  function render() {
    ShapePreview.clear();
    const category = $("shape-category").value,
      query = $("shape-search").value.trim().toLowerCase();
    const list = ZxTCollections.filter(
      presets.filter(
        (p) =>
          (category === "all" || p.category === category) &&
          (p.name + " " + p.family + " " + p.description)
            .toLowerCase()
            .includes(query),
      ),
      (p) => "shape:" + p.id,
      "Shape",
    );
    for (const family of ["Motion", "FX"]) {
      const box = $("shape-cards-" + family.toLowerCase());
      box.textContent = "";
      const items = list.filter((p) => p.category === family);
      $("shape-family-" + family.toLowerCase()).hidden = !items.length;
      for (const p of items) {
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.preset = p.id;
        if (preset && p.id === preset.id) card.classList.add("selected");
        const preview = document.createElement("button");
        preview.className = "card-preview";
        preview.type = "button";
        preview.setAttribute("aria-label", "Preview " + p.name);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 240;
        preview.appendChild(canvas);
        preview.onclick = () => openById(p.id);
        preview.onmouseenter = () => ShapePreview.play(canvas, p.id);
        preview.onmouseleave = () => {
          ShapePreview.stop(canvas);
          ShapePreview.draw(canvas, p.id);
        };
        preview.onfocus = preview.onmouseenter;
        preview.onblur = preview.onmouseleave;
        const content = document.createElement("div");
        content.className = "card-content";
        const title = document.createElement("h2");
        title.textContent = p.name;
        const actions = document.createElement("div");
        actions.className = "card-actions";
        const select = document.createElement("button");
        select.className = "shape-select";
        select.textContent = "Select";
        select.onclick = () => openById(p.id);
        actions.appendChild(select);
        content.append(title, actions);
        card.append(
          preview,
          ZxTCollections.button("shape:" + p.id, p.name),
          content,
        );
        box.appendChild(card);
        ShapePreview.draw(canvas, p.id);
      }
    }
    $("shape-count").textContent = list.length + " Shape presets";
    $("shape-empty").hidden = !!list.length;
    $("shape-empty").textContent = ZxTCollections.empty("Shape");
  }
  return {
    openById,
    close,
    loadSelected() {
      if (!preset || $("shape-inspector").hidden) {
        api.notice(
          "Select a Shape preset, then Load settings to edit its instance.",
          "info",
        );
        return;
      }
      return load();
    },
    refreshCollection() {
      if (visible) render();
    },
    init(adapter) {
      api = adapter;
      $("shape-category").onchange = render;
      $("shape-search").oninput = render;
      $("shape-back").onclick = close;
      $("shape-load").onclick = load;
      $("shape-apply").onclick = () => apply(false);
      $("shape-update").onclick = () => apply(true);
      $("shape-replay").onclick = () =>
        preset &&
        ShapePreview.play($("shape-preview"), preset.id, params, true);
    },
    setVisible(on) {
      save();
      visible = on;
      $("shape-library").hidden = !on;
      if (!on) {
        ++opening;
        $("shape-inspector").hidden = true;
        ShapePreview.clear();
        $("shape-cards-motion").textContent = "";
        $("shape-cards-fx").textContent = "";
      } else render();
    },
    setBusy(on) {
      busy = on;
      ShapePreview.suspend(on);
      sync();
    },
  };
})();
