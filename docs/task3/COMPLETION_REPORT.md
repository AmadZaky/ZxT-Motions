# Task 3 — Media Library and isolated Media engine

Date: 2026-10-09. Branch: feature/media-library-task3. Explicit user approval supersedes the historical Task 2 stop instruction. No Task 4, main merge, installer behavior/version changes or release publication.

## 1. Files changed

New production: media-presets.json; src/media-host.js; generated jsx/media.jsx and js/media-presets-data.js; js/media-library.js; js/media-preview.js; tools/build-media.py.
Additive integration: index.html, css/studio.css, js/workspace.js, js/main.js, js/collections.js, js/search.js, js/bridge.js, jsx/hostscript.jsx. tools/package-release.py includes Media metadata/assets; installer behavior unchanged. catalog.html regenerated because its contract embeds index/CSS/JS.
New checks: tests/media-fixture.cjs, media-host.cjs, media-safety.cjs, media-bridge.cjs, media-collections.cjs, media-boundaries.cjs, media-ui.cjs; tools/validate-media.py. Adapted only obsolete Task 2 no-Media/disabled-tab/scope-count assertions and package asset expectations. docs/task3 records plan, checkpoint and exact validation commands/exits.

## 2. Architecture

Studio remains Library | Motion | Create. Library is Text | Shape | Media | SolidGen. Media owns its schema1 metadata, ES3 host, adapter, Inspector, drafts and illustrative canvas preview; no Shape engine/adapter edits. Dispatcher routes mediaLibrary; bridge lazily loads media.jsx and explicitly checks module mediaVersion:1 and core mediaLibraryVersion:1. Load and optional eligibility inspection are read-only. Existing native selection classifications and selectionContext function remain unchanged.

## 3. Actual target detection

Host requires an AVLayer with visual FootageItem or CompItem source, stable numeric native Layer.id and source.id, available footage, hasVideo and unlocked state. PNG/JPG/video/sequences and compatible PSD/AI FootageItem sources follow the same type-based gate; filenames/extensions do not confer eligibility. Reject TextLayer, ShapeLayer, camera/light, null, audio-only, adjustment layers, SolidSource/SolidGen, missing/unavailable footage, wrong selection/comp and unstable identity. Apply handles all eligible selected layers at one CTI and reports skipped targets. Load/Update require one eligible layer; Update additionally requires loaded target/revision.

## 4. Ownership

Separate versioned [ZXT_MEDIA] comment block preserves user notes and Shape records. Exact native names: ZxT Media Motion | id | token or ZxT Media FX | id | token. Records bind preset/token/params/original CTI/comp/layer/source IDs/native name+match and scalar/vector snapshots. Every managed record must agree with native nodes. Reject duplicate IDs/tokens/names, stale/copied records, orphan managed names, missing/renamed/wrong/disabled nodes, malformed records and externally changed managed keys/expressions/values. Arbitrary user effects are never inferred owned. Different pilots coexist; one instance per preset per layer.

## 5. Four pilots

| ID | Native recipe | Controls |
|---|---|---|
| slide-up | Owned ADBE Geometry2; Position neutral pivot + [0,distance] → neutral pivot | Distance in layer pixels, Duration in seconds, Easing |
| pop-in | Separate owned ADBE Geometry2; uniform Scale start → 100; optional effect Opacity 0 → 100 | Start Scale, Duration, Easing, Fade In off/on; no overshoot |
| blur-reveal | Owned Gaussian Blur 2; Amount → 0, horizontal+vertical dimensions, Repeat Edge Pixels | Blur Amount, Duration, Easing |
| rgb-split | Explicit alternative: owned Channel Blur fringe; red Amount, blue Amount/2, green0, alpha0 | Amount in blur pixels; no invented direction |

RGB decision: Adobe VR Chromatic Aberration documentation describes radial channel scaling, not directional pixel offsets. Cloud cannot establish its exact native schema, ordinary-footage behavior or alpha safety. The approved smallest alternative is explicitly named "RGB Split · Channel Blur Fringe" in Inspector/cards/search, with recipe and pending native checks in its description. This is chromatic blur, never described as geometric displacement. Amount0 sets all four channel radii to zero; alpha radius is kept0. Pixel alpha/rendering still require native verification.

## 6. Transform motion engine

Effect Anchor/Position neutral pivot must match layer/source coordinates; uniform scale and scale/rotation/skew/opacity neutral defaults are checked before configuration. Exact match names, scalar/vector dimensions, numeric native ranges when present, expression support and errors are runtime checked. Expression endpoints also fit native ranges. Position, Scale and optional Opacity use finite clamped CTI expressions; seconds are independent of FPS. Reacquire indexed native node after addProperty. New effects append; user order is never rearranged. Native effect/property contracts remain modeled, not certified against AE2025.

## 7. Native preservation

No native Layer Transform access/writes. Native Position/Scale/Rotation/Opacity/Anchor and existing layout/keyframes remain untouched. No source duplication, compositor creation, layer movement or project restructure. No quality/collapse flags or global comp/layer motion-blur switches change. Owned Transform uses composition shutter off and shutter angle0; optional blur controls omitted pending verified native relevance. User Transform/Blur/other effects and unrelated animation remain intact.

## 8. Collections

Existing zxt-collections-v1 database; media:slide-up/media:pop-in/media:blur-reveal/media:rgb-split. Media All/Favorites/Recent scope is local. Only mutations with changed>0 enter Recent. Tests seed once, compare exact persisted serialization across reload, verify old Text/Shape/Solid/Create favorites and recents and Media favorites/recents. No database rewrite.

## 9. Lifecycle, Undo and rollback

New instance shows Apply; recognized instance shows Update, enabled only for dirty valid draft. Repeat Apply reuses owned instance and original start; Update preserves original start and validates current comp/layer/token/source/revision/selection. First timed Apply requires CTI inside layer and duration fitting out-point; trimmed-away original starts are rejected. Session drafts preserve A→B→A; stale asynchronous Load responses are ignored using returned native identity, including null-instance replies, even when cached status lags AE. Successful Apply/Update results bind the actual returned target draft, preserving the original selection draft. Truncated advisory status defers full selection eligibility to the host. Active Media Inspector receives quick Load and Escape/Back. No Remove control.
One meaningful dispatcher Undo group per Apply/Update; Load/inspect create none. Partial failure restores only controlled properties/comment or removes only new managed effect. Uncertain rollback halts further target mutation and returns recovery/Undo guidance. Modeled Undo grouping is not native Undo/Redo proof.

## 10. Automated tests

Exact commands, exit codes, logs and runtime paths: validation-results.json. tools/validate-media.py runs all 62 recorded Task 2 scripts plus six focused Media scripts. Final run: **68/68 scripts passed**, all exit codes0. Tests use a modeled AE environment plus actual Chromium headless shell; they cannot prove native API/visual behavior. Coverage: eligibility/source guards, four Apply/repeat/Load/Update paths, scalar/vector snapshots, managed-edit/ownership protection, stable identities, revisions, multi/mixed targets, CTI/out-point/FPS, availability/schema/range failures, injected rollback/recovery, indexed-reference invalidation model, module restart/lazy load/capability guard, collections and existing engines. Browser: search/category/families, Inspector/drafts/stale Load, local Favorites/Recent and exact reload persistence, active quick Load/Escape, 12 viewport sizes (300/380/759/760/920/1200 × 300/720), no horizontal overflow/footer overlap. Existing suite covers Text Tools/YUGraphic/SolidGen/Shape/tools/themes/ES3/packaging.

## 11. Native AE2025 checklist — NOT RUN

- [ ] Slide Up PNG/JPG/video/precomp: native Position untouched, actual motion/CTI/Distance/Duration Update/Undo/Redo.
- [ ] Pop In: native Scale/Opacity untouched; uniform effect scaling/pivot/optional fade; repeat/Update/Undo.
- [ ] Blur Reveal: user Blur preserved; independent managed Blur; edge behavior; Apply/Update/Undo.
- [ ] RGB alternative: actual channel-fringe visuals, Amount0 identity, alpha preservation, ordinary footage, user effects and Update.
- [ ] Real effect/property matches/dimensions/ranges/neutral values/expression support; actual indexed-reference invalidation.
- [ ] Save/close/reopen project and extension; ownership recognition and Load/Update.
- [ ] Narrow/short docked CEP; real keyboard/quick Load/state preservation.
- [ ] Short/long comps, differing FPS, multi-Media selections and per-layer bounds.
- [ ] Real Undo/Redo and native-failure rollback/recovery.
- [ ] Effect order with user Transform/Blur; high-resolution raster sampling/clipping and continuously rasterized/collapse-transform AI/PSD/precomp inputs.

Task 2 native Shape gate remains untested despite user acceptance and authorization to proceed.

## 12. Quality limits

Transform effect processes pixels at its effect-stack position. Native scale/rotation alter visible Slide Up displacement; Distance is layer-space pixels. Large raster scaling can soften or clip content; multiple Transform effects compose in order. Gaussian/Channel Blur edges and transparent pixels require native inspection. Continuously rasterized/collapse-transform sources may alter render ordering; no vector-quality guarantee for AI/PSD/precomps and no automatic collapse/quality/layout flag changes. Composition/layer motion blur is untouched; owned shutter default0. Canvas preview is illustrative, never an AE pixel render.

## 13. Regressions found and corrected

Fixture cross-realm arrays initially failed modeled vector validation; fixture now creates vectors in host VM realm. Native angle properties can be unbounded; range checks now validate limits when present, with focused RED→GREEN assertions. Expression peaks/endpoints also validate real ranges; trimmed-away original start fails safely. One old browser assertion counted four collections; approved Media adds fifth scope. Historical disabled/no-Media assertions adapted narrowly. Frozen boundaries remain checked. Independent review reproduced native/cached selection lag overwriting A drafts with B Load data. Focused RED→GREEN browser coverage now verifies returned native identity for recognized and null-instance responses; also fixes post-Apply draft binding and eligible targets beyond the 50-row advisory status cap. Review found no Critical issues; native API/quality concerns remain validation gates.

## 14. Unresolved issues

Native effect schemas, alpha/visual rendering, quality/order behavior, actual Undo/Redo/project persistence and CEP docking remain unverified. Runtime failures reject safely instead of silently falling back to native animation. The RGB pilot deliberately uses labeled Channel Blur fringe rather than unverified VR geometry. No release readiness claim.

## 15. Task 4 readiness

Task 3 implementation is isolated and reviewable subject to recorded final automated results and native gate. Task 4 remains NOT authorized and was not entered. Do native checklist before production/release decisions; no main merge or publication.

Primary references consulted:
- https://helpx.adobe.com/after-effects/desktop/apply-effects-and-animation-presets/list-of-effects/distort-effects.html
- https://helpx.adobe.com/uk/after-effects/desktop/immersive-video-and-vr/immersive-video-effects/vr-effects.html
- https://helpx.adobe.com/after-effects/desktop/apply-effects-and-animation-presets/list-of-effects/blur-sharpen-effects.html
