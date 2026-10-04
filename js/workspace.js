/* Shared responsive shell. Engine adapters retain ownership of their forms. */
window.ZxTWorkspace = (() => {
  const $ = id => document.getElementById(id);
  const main = document.querySelector('main');
  let origin = null, scroll = 0, section = 'YU', library = 'YU', motion = 'Tools';
  const positions = {};
  $('workspace').appendChild($('yu-editor'));
  function opened() {
    if (!origin) { origin = document.activeElement; scroll = main.scrollTop; }
    $('workspace').classList.add('has-editor');
  }
  function closed() {
    $('workspace').classList.remove('has-editor');
    if (origin) main.scrollTop = scroll;
    if (origin && origin.isConnected) origin.focus({preventScroll:true});
    origin = null;
  }
  function navigate(name) {
    positions[section] = origin ? scroll : main.scrollTop;
    section = name;
    if (["YU","Background"].includes(name)) library = name;
    if (["Tools","Curve"].includes(name)) motion = name;
    const group = ['YU','Background'].includes(name) ? 'Library' : ['Tools','Curve'].includes(name) ? 'Motion' : name;
    $('workspace').classList.toggle('library-workspace', group === 'Library');
    $('library-navigation').hidden = group !== 'Library';
    $('motion-navigation').hidden = group !== 'Motion';
    document.querySelectorAll('[data-workspace]').forEach(b => {
      b.classList.toggle('active', b.dataset.workspace === group);
      b.setAttribute('aria-pressed', String(b.dataset.workspace === group));
    });
    $('yu-editor').hidden = true;
    closed();
  }
  return {opened,closed,navigate,draftKey(id) {
    const c = window.ZxTSelection && ZxTSelection.context();
    return id + ':' + JSON.stringify(c ? [c.compId,c.layers.map(l => [l.id,l.core && l.core.target,l.animations])] : null);
  },restore() { main.scrollTop = positions[section] || 0; },init(go) {
    document.querySelectorAll('[data-workspace]').forEach(b => b.onclick = () => {
      const g = b.dataset.workspace;
      go(g === 'Library' ? library : g === 'Motion' ? motion : 'Create');
    });
  }};
})();
