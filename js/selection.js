/* Selected-layer context is advisory; host target validation remains authoritative. */
window.ZxTSelection = (() => {
  'use strict';
  let current = null, connected = false;
  function match(a,b){return !!a&&!!b&&a.comp===b.comp&&a.layer===b.layer&&a.token===b.token;}
  function eligibility(category,id,operation,target){
    if(!connected)return {allowed:false,reason:'Connect to After Effects first.'};
    if(!current)return {allowed:true,reason:''}; // Older hosts without inspector metadata.
    if(current.compId===null)return {allowed:false,reason:'Open a composition in After Effects.'};
    const layers=current.layers||[],count=current.total;
    if(target){
      const row=count===1&&layers[0],actual=row&&(category==='YU'?row.animations.map(a=>a.target):[row.core&&row.core.target]);
      if(!row||!actual.some(t=>match(t,target)))return {allowed:false,reason:'Selection changed. Load this layer’s settings again.'};
      if(row.locked)return {allowed:false,reason:'Unlock the selected layer first.'};
      return {allowed:true,reason:'Updates the loaded layer. Existing keyframes are preserved unless explicitly edited.'};
    }
    if(category==='Background'){
      const matching=layers.filter(l=>l.core&&l.core.id===id);
      if(matching.length&&!matching.some(l=>!l.locked))return {allowed:false,reason:'Unlock the matching background before updating it.'};
      return {allowed:true,reason:matching.length?'Updates matching selected backgrounds.':'Generates one new background in the active composition.'};
    }
    if(!count)return {allowed:false,reason:'Select a text layer in After Effects.'};
    const text=layers.filter(l=>l.type==='Text'&&!l.locked);
    if(!text.length&&!current.truncated)return {allowed:false,reason:'Select an unlocked text layer.'};
    if(operation==='update'&&category!=='YU'&&!layers.some(l=>!l.locked&&l.core&&l.core.id===id)&&!current.truncated)return {allowed:false,reason:'Apply this preset first, or load an existing instance.'};
    return {allowed:true,reason:text.length<count?'Applies to unlocked text layers; other selected layer types are skipped.':'Ready for the selected text layer'+(count===1?'':'s')+'.'};
  }
  function update(response,ready){connected=ready;current=response&&response.selection||null;}
  return {context(){ return current; },update,eligibility};
})();
