# Shape Task 2 — implementation and validation report

Baseline: official v1.0.0 `44976125a91da42d7641af34bb333d9da7f68fe0`.
Date: 2026-10-09. Branch: `feature/shape-library-task2`.
Scope: only the four approved Shape pilots. Media is disabled placeholder navigation.
No main merge or published release. Native After Effects was not available for testing.

## 1. Files changed

Production integration: `index.html`, `css/studio.css`, `js/workspace.js`, `js/main.js`, `js/collections.js`, `js/search.js`, `js/bridge.js`, `jsx/hostscript.jsx`, generated `catalog.html`, `tools/package-release.py` (include Shape assets only; installer unchanged).

New production files: `shape-presets.json`, `js/shape-presets-data.js`, `js/visual-library.js`, `js/visual-preview.js`, `src/shape-host.js`, `jsx/shape.jsx`, `tools/build-shape.py`.

New tests: `tests/shape-fixture.cjs`, `tests/shape-host.cjs`, `tests/shape-safety.cjs`, `tests/shape-bridge.cjs`, `tests/shape-collections.cjs`, `tests/shape-boundaries.cjs`, `tests/shape-ui.cjs`.
Existing test adaptations: `tests/official-cleanup-ui.cjs`, `tests/ui.cjs`, `tests/package.py`.
Task documentation: `docs/task2/SHAPE_TASK2_PLAN.md`, `CHECKPOINT.md`, `validation-results.json`, this report.

## 2. Architecture implemented

Library: Text | Shape | Media (disabled) | SolidGen. Top Studio navigation remains Library | Motion | Create.
Shape has independent metadata, preview, Inspector and ES3 host module. Existing dispatcher delegates only `shapeLibrary` actions. Bridge loads `jsx/shape.jsx` lazily and checks the Shape capability even when the old core version number matches.
Wide panels (760px+) retain browsing beside Inspector. Narrow panels use the existing detail/back pattern, keeping query, category and Library scroll. Primary actions remain above the footer even in 300px-high panels.
The boundary test verifies 123 existing host functions unchanged, frozen Text/YUGraphic/SolidGen assets, tools, themes, versions and installer. No Media host or presets exist.

## 3–4. Metadata and four pilots

Schema 1, IDs `trim-in`, `path-wiggle`, `glow`, `blur-pulse`. Each has name, category, family, description and typed parameter defaults/ranges/options.

| Preset | Native setup | Inspector controls | Timing |
|---|---|---|---|
| Trim Path In | Owned Trim Paths; End expression 0 → 100, Start/Offset 0 | Duration 0.05–120s; linear/ease-in/ease-out/easy | First Apply at CTI; bounded reveal |
| Path Wiggle | Owned Wiggle Paths/Roughen operator | Amount 0–500; Detail 0–10; Speed 0–20 | Amount gated to zero before first Apply CTI; native temporal evolution afterwards |
| Glow | Owned native Glow (`ADBE Glo2`) | Intensity 0–10; Radius 0–500; Threshold 0–100% | Static visual effect; threshold accommodates normalized/percentage native ranges |
| Blur Pulse | Owned Gaussian Blur 2 | Peak Blur 0–500; Duration 0.05–120s; Easing | First Apply CTI, finite 0 → peak → 0 pulse |

Motion targets one unambiguous direct path group. When several groups qualify, select one group/path in AE. Rectangle, Ellipse, Star and custom Bezier path discovery are modeled. Trim requires an enabled visible stroke: no stroke/fill is implicitly added or altered, and filled artwork remains visible. Direction controls were omitted rather than introducing unsafe path reversal.
Canvas previews are illustrative, not pixel-accurate AE renders.

## 5. Ownership and safety

Layer comments retain existing notes/data and add versioned `[ZXT_SHAPE]` records. Each record binds an exact tokened node name (`ZxT Shape | <id> | <token>`) and native match name.
Both the record and native node must agree. Missing/renamed/duplicate nodes and malformed ownership are rejected. User-created Trim Paths/Glow/Blur are never assumed owned. Existing unrelated operators, effects, native Transform keys and artwork are preserved.
Updates protect externally edited managed keys, values and expressions. Stable native `Layer.id` is required, so Shape pilots require AE22+; existing older-host paths are unchanged. Only Shape layers are writable; no selection, wrong types, locked layers and ambiguous groups give useful errors. Mixed Apply processes eligible Shape layers and reports skipped targets. Update is single loaded-target only.

## 6. Favorites / Recent

Existing `zxt-collections-v1`, using `shape:<id>`, with no new storage database. Shape All/Favorites/Recent and Motion/FX categories are local to Shape. Failed operations do not enter Recent. Existing Text/SolidGen/Create collections remain compatible.
The previous intermittent browser failure reset the persisted data to the fixture's seed. The fixture no longer reads/writes storage inside a reload-wide init hook; it seeds once before exercising the panel. New assertions compare exact serialized storage across reload and verify Shape Favorites and Recent, plus old favorites. No production collections rewrite was needed.

## 7. Apply / Load / Update / Undo

Preset selection opens its Inspector and performs read-only recognition for a single selected Shape layer. New instance → Apply; recognized owned instance → Update. Quick Load routes to Shape when its Inspector is active. Update requires parameter changes and matching selection/revision.
Repeated Apply reuses the identified owned instance; Update and repeat Apply preserve its original start. Timed presets require CTI within the layer on first Apply and duration inside out-point.
Each mutation uses one dispatcher Undo group (`ZxT Shape · Apply`/`Update`); Load creates no Undo entry. On partial failure, only newly created owned nodes are removed or controlled properties restored. Uncertain rollback explicitly requests Undo/recovery; user content is not deleted.
Session-only drafts preserve A → B → A edits and prevent applying a loaded target to a newly selected layer.

## 8. Automated validation

62/62 scripts passed: 43 host/static, 15 browser/model, 4 package/source contracts. Shape browser additionally passed 10 consecutive complete runs after the fixture correction. See `validation-results.json` for exact scripts and exit codes. Host tests use modeled AE objects, not real Adobe APIs. Browser tests run actual shipped HTML/JS in Chromium with a modeled CEP/host bridge.
Coverage includes all four pilots, target safety, multi/group selections, ownership corruption, repeated Apply, Load/Update, custom animation protection, CTI expressions, native-error rollback, reload/module isolation, normalized/percentage Glow contracts, stable layer identity, old data compatibility and ES3 grammar.
Browser coverage includes local filters, search/category/families, persisted favorites/recent, Apply/Update/load/drafts, target changes, global search, locked guard, existing Text/SolidGen navigation, and 12 viewport sizes: widths 300/380/759/760/920/1200 × heights 300/720. Horizontal overflow and footer/action overlap are asserted.
Existing browser regressions cover presets, tools, saved dark/light themes, all five accents, Create/fonts, Curve, offline and responsive flows. Temporary package tests verify Shape assets and checksums; no distributable release is published.

## 9. Required native AE 2025 checklist — not performed

- [ ] Rectangle and Ellipse shapes: stroked and filled; actual Trim result.
- [ ] Custom Pen path, nested groups and selected group/path binding.
- [ ] Multiple shape groups: ambiguity rejection, explicit selected group success.
- [ ] Existing user Trim Paths, Glow and Blur remain unchanged.
- [ ] First Apply, repeated Apply, Load settings and Update for all four pilots.
- [ ] Multi-Shape and mixed selection; no selection; wrong type; locked layer.
- [ ] Managed key/expression edits block unsafe Update; unrelated animation preserved.
- [ ] CTI-relative start, before-start state, duration endpoints and out-point guard.
- [ ] Actual Glow scalar ranges and Gaussian/Wiggle property APIs.
- [ ] Native indexed-property reference invalidation after adding an operator/effect.
- [ ] Single Undo/Redo and rollback on a real effect/operator failure.
- [ ] Save/reopen project, ownership recognition and Load/Update.
- [ ] Narrow docked CEP panel, short panel actions, keyboard/back and saved theme.
- [ ] Actual visual rendering and playback performance of every pilot.

## 10. Corrected regressions

Review found and corrected old-host index-based target identity and cross-layer draft overwriting. The reviewer verified both corrections. Resume validation corrected fixture reseeding interference and strengthened exact persistence assertions. Existing automated production regressions were not found in the final validation run.

## 11–12. Remaining issues and Task 3 recommendation

Native AE validation is the remaining gate: mocks cannot certify effect property contracts, visual output, native reference lifetimes, Undo/Redo or save/reopen behavior. Multi-group selection and stroked-path requirements are intentional pilot limits, not automatic artwork conversion.
The Shape foundation is suitable for native pilot validation. Recommend approving Task 3 only after this checklist passes (or after explicitly accepting the unresolved native checks). No Task 3 implementation has started. No installer change, extra preset, Copy/Paste, Smart Workflow, Motion Stack or release publication.
