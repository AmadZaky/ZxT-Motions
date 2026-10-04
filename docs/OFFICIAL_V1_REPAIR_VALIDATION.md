# v1.0.0 Official Release — approved repair

Baseline: published commit `1ff20a15013390b0dc009ae954d0cd44ed42ebea`. Public identity stays **v1.0.0 Official Release**, per user instruction. No Studio redesign, new presets or unrelated tools are included.

## Changes

- `css/studio.css`: the Text Animate Select button accounts for its 10px side margins; both edges stay inside the card at 300–1200px in dark/light mode.
- `jsx/hostscript.jsx`: known-preset clipboard layered over the existing Transform-only path. Core presets are recreated on selected compatible layers, including backgrounds on existing solids without creating extra layers. Core settings, managed Choice/Progress/color controller keys, Text Animate IN/OUT, and supported keyed Transforms share one relative origin.
- `src/yu-adapter.js` / generated `jsx/yu-text.jsx`: read-only phase snapshot, strict known-preset validation and staged reapplication through the original YUGraphic engine. Vendor source and motion math are unchanged.
- `js/bridge.js`: reload same-version cached host/module when the motion capability is missing or obsolete; load Text Animate for Copy/Paste even when its tab was never opened.
- `js/main.js`, `index.html`, generated `catalog.html`: preset-aware clipboard feedback; existing navigation/buttons/theme/collections are retained.

## Contract and safety

Copy requires one source and creates no Undo step. Clipboard data is temporary panel-session state. Paste uses one **Paste ZxT Motion** Undo group, starts at CTI plus stored offsets, and uses the same timing across targets. Layer inPoint/outPoint/startTime, parenting, selection and layer count are preserved. Pasted core timing follows owned start/end markers, including when a layer moves; Update uses the same timing.

Existing preset metadata, orphan controls/animators and locked/incompatible targets are skipped. A core preset also skips targets with existing Transform or Source Text keyframes/expressions. Plain Transform Paste retains its per-property skip policy. Copied Text Animate phases must start within target layer bounds; incompatible/too-short targets are skipped with status feedback. Duration/stagger may fit to the target text length as the existing YUGraphic engine normally does.

This is **known-preset regeneration**, not arbitrary effect/expression copying. Unrelated user effects, masks, animators, source text, artwork and settings are not copied. Custom expressions on managed parameter controls and customized YUGraphic selector keyframes/expressions are rejected rather than silently approximated. Native failure removes new setup groups and restores original static Transform/text values; failed rollback blocks further writes and requests Undo.

## Automated coverage

- `tests/preset-motion.cjs`: all 14 existing core presets and 120 YUGraphic presets; separate IN/OUT, live settings, authored scalar/color controller keys, CTI offsets, multi-target, mixed preset+Transform, repeated-Paste conflicts, locked/type/animation/duration conflicts, protected effects/masks/animators/comments, malformed clipboard and native failure rollback; shifted markers followed during Load/Update.
- `tests/preset-motion-ui.cjs`: real Studio buttons backed by deterministic host model; disabled Paste, phase clipboard/status, multi-target and repeated-Paste protection.
- `tests/select-gap-ui.cjs`: measured equal left/right gaps and no page overflow at 300, 380, 680, 1200px in both themes.
- Existing host, ES3, package and browser suite: Studio/Inspector, Apply/Update, animation preservation, collections, themes, fonts, tools, modules and original Transform timing regression.
- `tests/official-repair.py`: explicit `[official-repair]` commit may keep v1.0.0; ordinary same-version commits remain rejected. Release workflow may replace only its immediately preceding published v1.0.0 tag, after tests; other release tags retain normal safeguards.

## Direct Adobe After Effects 2025 validation still required

Actual render fidelity for every copied setup; native property ease/continuity support (including Color Control); composed/wrapped line counting; animation adaptation to different target text lengths; native Undo/Redo, real layer moves, docking, and source/target compatibility on Windows AE 2025. Node's host model is not AE rendering. Windows installer tests/build are performed separately by Windows CI. No code signing is claimed.
