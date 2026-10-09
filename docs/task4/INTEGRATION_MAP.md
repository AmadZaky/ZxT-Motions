# Task4 integration audit

Studio remains Library | Motion | Create; Library is Text | Shape | Media | SolidGen.

| Area | Shared integration | Shape owner | Media owner | Reliability result |
|---|---|---|---|---|
| Navigation | index.html; main.tab; workspace.navigate/restore | ShapeLibrary.setVisible | MediaLibrary.setVisible | section switches hide old Inspector, keep local browsing state |
| Registration | script order in index.html | shape-presets.json → build-shape.py → data + JSX | media-presets.json → build-media.py → data + JSX | four unique IDs per module, generated parity |
| Collections | ZxTCollections; zxt-collections-v1; main subscriber | shape:<id>, Shape mode | media:<id>, Media mode | successful mutations enter Recent; missing registry IDs retained invisibly |
| Search | MotionAstraSearch.init opens section, then preset | local shape-search/category | local media-search/category | correct Inspector despite local filters; no host mutation from search |
| Categories | independent section controls | Motion/FX, family details | Motion/FX, family details | local state persists; no cross-section leak |
| Inspector | workspace.opened/closed/draftKey; main.busy | visual-library.js | media-library.js | separate forms/drafts; correct Apply/Update states |
| Apply | main.action, dispatcher | shapeLibrary apply → applyOne | mediaLibrary apply → applyOne | eligible selected targets; one CTI, no stagger |
| Load/Update | quick Load routes active section | read-only Load; target/revision checked Update | read-only Load; target/revision checked Update | native returned identity prevents cached-selection draft overwrite |
| Bridge | bridge.call, lazy module map; explicit version capabilities | shape.jsx, shapeVersion1 | media.jsx, mediaVersion1 | independent ES3 modules; no native fallback |
| Host | dispatch delegates, no existing engine rewrite | src/shape-host.js | src/media-host.js |123 legacy host functions frozen |
| Ownership | layer notes preserved | [ZXT_SHAPE], exact tokened name+match | [ZXT_MEDIA], exact tokened name+match, native source identity | unrelated user operators/effects/notes untouched; controlled edits reject unsafe mutation |
| Target safety | selection status advisory only; host authoritative | actual unlocked ShapeLayer, stable Layer.id | eligible visual AVLayer/FootageItem/CompItem, stable IDs | reject incompatible/locked/missing targets without conversion |
| Timing | seconds independent of FPS | timed CTI start retained; now reject trimmed-away original start | timed CTI start retained and bounds validated | duration must fit out-point |
| Rollback | dispatcher propagates recovery; panel blocks mutations | restore controlled properties/comment or remove new node | restore controlled properties/comment or remove new node | stop further target mutations if rollback uncertain |
| Undo | dispatcher begin/endUndoGroup | ZxT Shape Apply/Update | ZxT Media Apply/Update | one modeled group; Load read-only; native Undo/Redo NOT RUN |

Duplication: both adapters independently own forms, drafts and lifecycle; both hosts own their contracts/rollback. Verified inconsistency was Shape lacking Media's native-response binding, truncated-status handling, original-start guard and recovery stop. Apply those narrowly to Shape. No shared engine or broad refactor was introduced. Collection listener is initialized once; repeated navigation does not increase listener count or mutation calls. Ownership lookup scans a layer's relevant group to detect duplicates safely; no speculative lookup optimization.

Task4 boundary exception: tests/media-boundaries.cjs now permits only verified Shape run/applyOne fixes and adapter response handling. Every other Shape host function, metadata, preview and builder remain frozen; generated JSX is regenerated from source. Text/SolidGen/Create/tools/themes/installer/version and123 legacy host bodies remain checked against the official baseline.
