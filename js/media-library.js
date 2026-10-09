/* Media adapter: independent metadata, forms and host route; shared Studio shell. */
window.MediaLibrary = (() => {
  const $ = (id) => document.getElementById(id),
    presets = window.ZXT_MEDIA_PRESETS.presets;
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
    if (!c.total) return "Select a Media layer in After Effects.";
    if (loaded) {
      const row = c.total === 1 && c.layers[0];
      if (
        !row ||
        c.compId !== loaded.target.comp ||
        row.id !== loaded.target.layer
      )
        return "Selection changed. Select the loaded Media layer or Load settings again.";
      if (row.locked) return "Unlock the selected Media layer.";
    }
    if (
      !c.layers.some(
        (l) => ["Footage", "Precomp"].includes(l.type) && !l.locked
      ) &&
      !c.truncated
    )
      return "Select an unlocked Media layer.";
    return "";
  }
  function sync() {
    if (!api) return;
    const reason = guidance(),
      invalid = [...controls.values()].some((c) => !c.checkValidity());
    $("media-apply").hidden = !!loaded;
    $("media-update").hidden = !loaded;
    $("media-apply").disabled = busy || !!reason || invalid;
    $("media-update").disabled = busy || !!reason || invalid || !dirty;
    const c = ZxTSelection.context();
    $("media-load").disabled =
      busy ||
      !api.ready() ||
      !c ||
      c.total !== 1 ||
      !["Footage", "Precomp"].includes(c.layers[0].type);
    $("media-mode").textContent = loaded
      ? dirty
        ? "APPLIED · UNSAVED CHANGES"
        : "APPLIED · UP TO DATE"
      : "CUSTOMIZE MEDIA";
    $("media-guidance").textContent =
      reason ||
      (loaded
        ? "Updates the loaded owned instance; its start time stays fixed."
        : "Applies to unlocked Media layers. Other selected layer types are skipped.");
    for (const control of controls.values()) control.disabled = busy;
    $("media-back").disabled = busy;
  }
  function drawForm() {
    controls.clear();
    $("media-parameters").textContent = "";
    for (const p of preset.parameters) {
      const wrap = document.createElement("div");
      wrap.className = "parameter";
      const label = document.createElement("label");
      label.textContent = p.label;
      label.htmlFor = "media-param-" + p.key;
      const input = document.createElement(
        p.type === "select" ? "select" : "input"
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
      input.oninput = () => {
        params[p.key] = p.type === "number" ? Number(input.value) : input.value;
        if (p.type === "number" && !input.value) params[p.key] = NaN;
        input.setAttribute("aria-invalid", String(!input.checkValidity()));
        dirty = true;
        save();
        MediaPreview.draw($("media-preview"), preset.id, 0.5, params);
        sync();
      };
      wrap.append(label, input);
      $("media-parameters").appendChild(wrap);
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
      r = await api.action({ action: "mediaLibrary", operation: "load", id });
    if (
      sequence === opening &&
      visible &&
      !$("media-inspector").hidden &&
      r &&
      preset &&
      preset.id === id &&
      selectionKey() === key &&
      nativeSelectionMatches(r, key)
    ) {
      const nextKey = ZxTWorkspace.draftKey("media:" + id);
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
    $("media-inspector").hidden = true;
    MediaPreview.stop($("media-preview"));
    ZxTWorkspace.closed();
  }
  async function openById(id) {
    if (busy || !visible) return;
    const p = presets.find((p) => p.id === id);
    if (!p) return;
    save();
    preset = p;
    draftKey = ZxTWorkspace.draftKey("media:" + id);
    const draft = drafts[draftKey];
    params = Object.fromEntries(p.parameters.map((c) => [c.key, c.default]));
    loaded = null;
    dirty = false;
    if (draft) {
      params = { ...draft.params };
      loaded = draft.loaded;
      dirty = draft.dirty;
    }
    $("media-title").textContent = p.name;
    $("media-description").textContent = p.description;
    $("media-inspector").hidden = false;
    document
      .querySelectorAll("#media-library .card")
      .forEach((card) =>
        card.classList.toggle("selected", card.dataset.preset === id)
      );
    ZxTWorkspace.opened();
    drawForm();
    sync();
    MediaPreview.play($("media-preview"), id, params, true);
    const sequence = ++opening,
      c = ZxTSelection.context(),
      key = selectionKey();
    if (
      !draft &&
      api.ready() &&
      c &&
      c.total === 1 &&
      ["Footage", "Precomp"].includes(c.layers[0].type)
    ) {
      const r = await api.action({
        action: "mediaLibrary",
        operation: "load",
        id
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
    if ($(update ? "media-update" : "media-apply").disabled) return;
    save();
    const r = await api.action({
      action: "mediaLibrary",
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
      draftKey = ZxTWorkspace.draftKey("media:" + preset.id);
      useInstance(r.instance);
      MediaPreview.play($("media-preview"), preset.id, params, true);
    }
  }
  function render() {
    MediaPreview.clear();
    const category = $("media-category").value,
      query = $("media-search").value.trim().toLowerCase();
    const list = ZxTCollections.filter(
      presets.filter(
        (p) =>
          (category === "all" || p.category === category) &&
          (p.name + " " + p.family + " " + p.description)
            .toLowerCase()
            .includes(query)
      ),
      (p) => "media:" + p.id,
      "Media"
    );
    for (const family of ["Motion", "FX"]) {
      const box = $("media-cards-" + family.toLowerCase());
      box.textContent = "";
      const items = list.filter((p) => p.category === family);
      $("media-family-" + family.toLowerCase()).hidden = !items.length;
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
        preview.onmouseenter = () => MediaPreview.play(canvas, p.id);
        preview.onmouseleave = () => {
          MediaPreview.stop(canvas);
          MediaPreview.draw(canvas, p.id);
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
        select.className = "media-select";
        select.textContent = "Select";
        select.onclick = () => openById(p.id);
        actions.appendChild(select);
        content.append(title, actions);
        card.append(
          preview,
          ZxTCollections.button("media:" + p.id, p.name),
          content
        );
        box.appendChild(card);
        MediaPreview.draw(canvas, p.id);
      }
    }
    $("media-count").textContent = list.length + " Media presets";
    $("media-empty").hidden = !!list.length;
    $("media-empty").textContent = ZxTCollections.empty("Media");
  }
  return {
    openById,
    close,
    loadSelected() {
      if (!preset || $("media-inspector").hidden) {
        api.notice(
          "Select a Media preset, then Load settings to edit its instance.",
          "info"
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
      $("media-category").onchange = render;
      $("media-search").oninput = render;
      $("media-back").onclick = close;
      $("media-load").onclick = load;
      $("media-apply").onclick = () => apply(false);
      $("media-update").onclick = () => apply(true);
      $("media-replay").onclick = () =>
        preset &&
        MediaPreview.play($("media-preview"), preset.id, params, true);
    },
    setVisible(on) {
      save();
      visible = on;
      $("media-library").hidden = !on;
      if (!on) {
        ++opening;
        $("media-inspector").hidden = true;
        MediaPreview.clear();
        $("media-cards-motion").textContent = "";
        $("media-cards-fx").textContent = "";
      } else render();
    },
    setBusy(on) {
      busy = on;
      MediaPreview.suspend(on);
      sync();
    }
  };
})();
