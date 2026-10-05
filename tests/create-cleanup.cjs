const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),main=fs.readFileSync('js/main.js','utf8'),selection=fs.readFileSync('js/selection.js','utf8');
assert(!/id="(?:copy-motion|paste-motion|transform-motion|selected-layer-inspector)"/.test(html),'Retired tools must not appear in the panel');
assert(!/motionClipboard|\$\("(?:copy-motion|paste-motion)"\)/.test(main),'No retired button bindings');
assert(!/selection-content|selection-summary|selection-refresh/.test(selection),'Selection context must work without Layer Inspector DOM');
for(const id of ['create-text','create-shape','create-background']){
 const form=html.match(new RegExp('<form id="'+id+'"[\\s\\S]*?</form>'))[0];
 assert(/<details class="create-section">/.test(form),'Each Create section starts collapsed');
 assert(/<\/details>\s*<button[\s\S]*?type="submit"/.test(form),'Create remains reachable outside collapsed settings');
}
console.log('PASS: retired tools removed; independent collapsible Create settings and visible submit actions.');
