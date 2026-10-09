# Task4 — Regression, Hardening and Release Preparation

Date:9 October2026 (Asia/Jakarta). Scope: final bounded development task; no features, new presets, UI redesign, main merge or publication.

## 1. Prerequisite verification

**PASS: Task3 product code is implemented.** Verified Media tab, metadata/collections/search/filtering, actual source-type detection, owned Transform effect motion, Slide Up/Pop In/Blur Reveal/approved Channel Blur fringe, Apply/Load/Update, ownership and six automated Media scripts. Present files include media-presets.json, src/media-host.js, jsx/media.jsx, js/media-library.js, js/media-preview.js, generated data and tests. Proceeded only after this inspection; no Task3 implementation was smuggled into Task4.

## 2. Starting commit and working-tree state

Recovered working tree /workspace/scratch/5fa8052b39d8/repo-work/zxt-shape-task2 was clean on feature/media-library-task3 at local81b4e7b6d84973503b838f72b3146d2e06c5c543. Remote branch rechecked at2d9e0761aff239bbc5a9a86e6871f157789ea21d using connector comparison and git ls-remote/fetch. Both trees equal **aa5156668c67f62d2ec2ca9935c0a9f92ed236f6**. Different local/remote histories have identical completed Task2/3 source. Reused current tree on feature/library-hardening-task4; no reset to main.

## 3. Files changed

Production: js/collections.js, js/visual-library.js, src/shape-host.js, generated jsx/shape.jsx and catalog.html. README.md adds only the new Library scope/targets/pilots/limits/native status.

Tests: tests/collections.cjs and tests/media-boundaries.cjs narrowly updated; new tests/task4-collections.cjs, task4-shape-host.cjs, task4-shape-ui.cjs, task4-library-ui.cjs, task4-shape-advisory.cjs. tools/validate-task4.py records all active suites. docs/task4 contains PLAN.md, INTEGRATION_MAP.md, AE2025_CHECKLIST.md, CHECKPOINT.md, baseline-results.json, validation-results.json and this report.

Known tracked screenshots altered by historical UI tests were restored to starting source. No unrelated user files were reset.

## 4. Bugs found

1. Collections save discarded unavailable IDs: a missing optional Shape/Media registry erased their stored favorites/recent on a later Text mutation. Focused test failed with missing metadata erased shape:glow.
2. Shape Load response used cached selection only: native B response overwrote A dirty draft (duration1.3 replaced1.4). No-instance Load and post-Apply binding had the same identity risk already fixed in Media.
3. Shape continued to mutate subsequent targets after rollback became uncertain. Injected failure returned recovery=true but changed1 and created a later target effect.
4. Shape accepted timed Update after trimming in-point past recorded original start (changed1).
5. Shape browser disabled Apply when the eligible target lay beyond the first50 advisory status rows. Old adapter reproducibly disabled Apply for51 mixed selections.

## 5. Bugs fixed

Retain unique string unavailable IDs invisibly within zxt-collections-v1; known Recent stays bounded20, unknown records survive reload and missing metadata. Registered-only isFavorite/filter behavior prevents phantom entries.

Shape now includes selectionTarget on every successful Load, including null instance; adapter validates native/cached identities and operation sequence/visibility, and binds successful mutations under actual returned selection. Existing token/revision semantics unchanged. Stop remaining targets on uncertain rollback. Reject timed mutation when recorded start is outside current layer bounds. Truncated advisory status defers eligibility to authoritative native host validation.

No broad consolidation. Production Media source, metadata, adapter and preview remain byte-identical to Task3. Shape metadata/preset IDs, preview/builder and all host functions except run/applyOne remain frozen. Text/SolidGen/Create/tools/themes/installer/version and123 legacy host functions remain byte-identical under boundary tests.

## 6. Library regressions tested

Text | Shape | Media | SolidGen navigation, local/global search, category/family filters, scoped All/Favorites/Recent, correct preset Inspector, stale Inspector hiding, wide/narrow/short layout. Task4 browser matrix:300/380/600/759/760/920/1200px ×300/720px (14sizes). No horizontal overflow, Inspector overflow, footer/action overlap or page errors. Local filters persist independently; search opens the correct section even with a different local filter active. Existing Studio/other-engine tests remain green.

## 7. Collections regressions tested

Text/YU, Shape, Media, SolidGen and all three Create favorites; recent history; exact serialized reload and new-page panel restart; empty/old/malformed storage; unknown/stale IDs; duplicated IDs; optional metadata unavailable then restored. Unknown IDs retained invisibly, known IDs deduplicated, no new storage database. Blocked-storage behavior and20 known-Recent limit remain tested. Only successful host mutations enter Recent.

## 8. Shape regressions tested

Four pilots: Trim Path In, Path Wiggle, Glow, Blur Pulse. Modeled targets/path ambiguity/stroke/group logic, Apply/repeat/Load/Update, custom values/keys/expressions, missing/renamed/duplicate/malformed ownership, unrelated user operators/effects/animation/notes, start/duration/out-point and new trim guard. Multiple/mixed selections and advisory truncation. Independent reviewer reran collections, Shape host and Shape UI; no Critical/Important defect found. Native visual correctness is untested.

## 9. Media regressions tested

Slide Up, Pop In, Blur Reveal and RGB Split · Channel Blur Fringe. All previous Media source eligibility, stable IDs, native contract/range/availability, Apply/repeat/Load/Update/revision/selection/drafts, ownership damage, indexed-reference invalidation, injected failure/rollback, multi-target/mixed selections and differing FPS tests pass. Native Layer Transform and arbitrary user Transform/Blur effects remain unchanged in model assertions; host Media never accesses native Transform group. Source scope unchanged.

## 10. Inspector lifecycle results

Preset/configure/Apply/change selection/Load/Update/switch section/return/reopen covered in existing and added browser tests. Dirty A→B→A drafts survive recognized and no-instance native response lag; stale replies ignored. Successful mutation binds its actual native target. No Shape/Media parameter bleed. Clean owned instance shows disabled Update; valid dirty draft enables it; wrong selection/revision fails. New panel recognizes owned Media via Load while session-only drafts reset. Quick Load and Escape/Back route active Inspector. No retired Layer Inspector restored.

## 11. Ownership safety results

Versioned comment records plus exact tokened name/match remain required. No ownership inferred from Adobe match names alone. User-created Trim/Wiggle/Glow/Blur/Transform/other effects and unrelated keyframes/expressions survive. Damaged/missing/duplicate/stale managed records and edited controlled values/expressions/keys block unsafe mutation. Existing Shape ownership semantics unchanged; native selection identity added to Load response, not ownership schema. Media source identity retained. Native-save persistence remains a manual gate.

## 12. Undo/Redo status

Modeled assertions verify one meaningful dispatcher Undo group per Apply/Update; Load/inspect read-only. Existing/injected failure tests verify restoration of only controlled properties/comment or removal of newly owned nodes; uncertain recovery blocks panel mutation and now stops later Shape targets like Media. **Actual AE Undo/Redo NOT RUN.** Browser/model results do not prove native Undo stack or real Adobe-failure rollback.

## 13. RGB Split decision

Keep Task3's explicitly approved substitute and stable ID rgb-split. It uses owned **ADBE Channel Blur**, not VR Chromatic Aberrations. Display name **RGB Split · Channel Blur Fringe** and description accurately call it chromatic blur, not directional displacement. Red=Amount, blue=Amount/2, green/alpha=0; Amount0 neutral in model. No new compositing/source duplication engine. Alpha/rendering/ordinary-footage suitability remain mandatory native checks. No additional rename or disablement needed based on modeled evidence; if native validation fails, hold the pilot/update rather than invent a new engine in this task.

## 14. Automated tests and results

Baseline: **68/68 scripts passed**, all exits0. Final: **73/73 scripts passed**, all exits0 (68existing +5Task4). Exact commands/outputs/exits/environment: baseline-results.json and validation-results.json. Node24.19.0, Python3, acorn/Playwright dependencies under /tmp/zxt-task3-deps/node_modules; Chromium headless shell1194. Original full Chromium socket limitation avoided using actual headless-shell Chromium; no simulated browser rendering.

Final suite ran72scripts sequentially; advisory regression was added and run separately with captured exit0 and appended to the same evidence. Durable runner now contains all73. Additional final checks: shape-boundaries, package.py, official-release.py and git diff --check all exit0 after required documentation edits. Temporary packaging checks created no published release.

## 15. Existing tests still passing

All68 prior active Task2/3 scripts pass, including Text/YUGraphic/Text Tools, SolidGen, Create, tools/themes/accent, responsive Studio, collections, ES3, lazy bridge and package/source contracts. Changed tests: collections expected unknown saved IDs to be deleted; Task4 preservation requires retaining them while keeping20 known Recent. media-boundaries previously froze entire Shape source/adapter; verified Task4 bug fixes now permit run/applyOne changes while preserving every other Shape host function and metadata/preview/builder.

Inventory: the only unrun .cjs product test is historical fxtools-ui.cjs, which requires the retired FXTools tab/Remove UI; restoring it is explicitly outside scope. Historical backend FXTools tests are already included in68. Seven Windows .ps1 installer/window/live-catalog checks cannot execute in Linux (no PowerShell/WPF); installer behavior is unchanged and static/Python package/installer tests pass. Native JSX smoke scripts require Adobe. These excluded checks are not counted as passed.

## 16. Native AE2025 checklist

See [AE2025_CHECKLIST.md](AE2025_CHECKLIST.md). It covers Text smoke, Shape rectangle/ellipse/Pen/multiple groups/user operators/effects, Media PNG/JPG/video/sequence/precomp, all pilots/lifecycle/ownership/native Transform preservation/Undo/save-reopen,23.976/25/30/60fps, short/long comps/CTI away from0, narrow/wide/short docking, actual native schemas/ranges/neutral/alpha/rendering/effect order/collapse flags.

## 17. Native tests actually completed

**None.** Adobe After Effects2025 was not available in this Linux environment. No native visual, API/property, Undo/Redo, project-save/reopen or docked-CEP success is claimed. Task2 and Task3 native gates remain outstanding despite accepted implementations.

## 18. Known limitations

Illustrative canvas previews are not AE pixel renders. Distance is layer-space pixels; native scale/rotation and effect stack order alter visible displacement. Raster sampling/clipping/blur edges/alpha, high-res footage and continuously rasterized/collapse-transform AI/PSD/precomp behavior require native inspection; no vector-quality promise or native flag toggling. Owned Transform shutter remains0; global motion-blur untouched. Shape requires unambiguous path group and Trim enabled stroke. Runtime contract failures reject rather than silently fallback to native animation. Drafts are session-only; collections remain local.

## 19. Unresolved blockers

No known blocking automated/production regression remains after this bounded pass and independent review. Native API/rendering/Undo/save/reopen/CEP checks and Windows-only native installer checks are unrun platform gates; the former blocks release-candidate classification. No new feature, preset, engine or UI system was introduced. No public version bump, installer modification, main merge, Mac support or release publication.

Review: no verified Critical/Important issues; no deferred production minors. Reviewer identified advisory test missing from runner while it was being added; now included and recorded. Rulings: user authorization overrides historical Task3 stop; current tree reused; prior unavailable-ID deletion assertion superseded by preservation requirement; Shape freeze exception limited to verified reliability fixes. If these boundary choices were wrong, the cost is the documented collection compatibility/Shape lifecycle change; covering regressions and native checklist make them reviewable.

GitHub feature-branch push was blocked by automatic approval review: exporting the source/documentation payload was judged to require explicit upload authorization. No retry, connector workaround, merge or publication occurred. Source is committed locally on feature/library-hardening-task4; remote Task3 remains unchanged. This blocks remote delivery, not native-validation readiness.

## 20. Release-readiness classification

Automated/static checks pass; native AE2025 validation is still required. The complete source update is ready to run that checklist. Not a release candidate and no publication authorized.

**READY FOR AE VALIDATION**
