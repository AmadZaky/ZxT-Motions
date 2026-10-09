/* Local-only collections. Failed operations never enter Recent. */
window.ZxTCollections = (() => {
  'use strict';
  const key = 'zxt-collections-v1', known = new Set([
    ...window.MA_PRESETS.presets.map(p => 'core:' + p.id),
    ...window.YTMCore.presets.map(p => 'yu:' + p.id),
    ...(window.ZXT_SHAPE_PRESETS ? window.ZXT_SHAPE_PRESETS.presets.map(p => 'shape:' + p.id) : []),
    ...(window.ZXT_MEDIA_PRESETS ? window.ZXT_MEDIA_PRESETS.presets.map(p => 'media:' + p.id) : []),
    'create:text', 'create:shape', 'create:solid'
  ]), listeners = [];
  const modes = {global:'all', Text:'all', Solid:'all', Shape:'all', Media:'all', Create:'all'};
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) {}
  // Retain unavailable IDs in storage so a missing registry cannot erase another
  // section. Only registered items are exposed; the known Recent bound stays20.
  const clean = (a, limit) => {
    let count = 0;
    return Array.isArray(a) ? [...new Set(a.filter(k => typeof k === 'string'))]
      .filter(k => !known.has(k) || count++ < limit) : [];
  };
  let favorites = clean(saved.favorites, known.size), recent = clean(saved.recent, 20);
  function emit(save) {
    if (save) try { localStorage.setItem(key, JSON.stringify({favorites, recent})); } catch (_) {}
    listeners.forEach(fn => fn());
  }
  return {
    get mode() { return modes.global; },
    getMode(scope = "global") { return modes[scope] || "all"; },
    isFavorite(k) { return known.has(k) && favorites.includes(k); },
    toggle(k) { if (!known.has(k)) return; favorites = favorites.includes(k) ? favorites.filter(v => v !== k) : [...favorites, k]; emit(true); },
    record(k) { if (!known.has(k)) return; recent = clean([k, ...recent.filter(v => v !== k)], 20); emit(true); },
    setMode(value, scope = 'global') { if (!['all','favorites','recent'].includes(value) || !(scope in modes)) return; modes[scope] = value; emit(false); },
    subscribe(fn) { listeners.push(fn); },
    filter(items, id, scope = "global") {
      const mode = this.getMode(scope);
      if (mode === 'all') return items;
      const keys = mode === 'favorites' ? favorites : recent;
      const result = items.filter(p => keys.includes(id(p)));
      return mode === 'recent' ? result.sort((a,b) => keys.indexOf(id(a)) - keys.indexOf(id(b))) : result;
    },
    button(k, name) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'favorite-toggle';
      b.textContent = favorites.includes(k) ? '★' : '☆';
      b.setAttribute('aria-pressed', String(favorites.includes(k)));
      b.setAttribute('aria-label', 'Favorite ' + name); b.title = 'Favorite ' + name;
      b.onclick = () => this.toggle(k); return b;
    },
    empty(scope = 'global') { const mode = this.getMode(scope); return mode === 'favorites' ? 'No favorites here yet. Use ☆ on a preset to save it.' : mode === 'recent' ? 'No recently applied presets in this category.' : 'No matching presets.'; }
  };
})();
