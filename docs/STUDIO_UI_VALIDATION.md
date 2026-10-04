# Studio UI refinement — v3.6.1

## Implemented

- Library / Motion / Create, retaining Settings, search, themes, all presets, collections and tools.
- Shared Inspector location: side-by-side at 760 px+, detail view with Back below 760 px. One library scrolling region; browsing position survives workspace changes.
- Select/star cards. Apply or Generate belongs to Inspector. A successful single-layer operation reloads that exact instance and exposes Update; clean Update is disabled.
- Loaded drafts are isolated by current composition/layer/instance context. Selection changes do not transfer a loaded Update to a different layer.
- Mutation-result selection snapshots and guarded follow-up loads; saved metadata revisions reject stale updates after another panel edit or metadata-changing Undo.
- Explicit IN/OUT loads never inherit BOTH or silently fall back to the other phase. Remove validates the loaded layer.
- Partial batch success or an uncertain bridge reply requires an explicit timeline check before another mutation. No automatic retry.

## Automated checks

Node host-model suites exercise actual ExtendScript dispatch under a modeled AE API. Chromium tests exercise the actual panel UI and bridge through that model. These are not native AE tests.

Coverage includes tools, all 14 core presets, all 120 text animation definitions, smart repeated Apply, one-layer background generation, explicit keyframe edit intent, protected expressions, selection changes, theme persistence, Favorites/Recent, search, navigation, responsive editors and pinned actions. New tests: `studio-binding.cjs`, `studio-workflow-ui.cjs`.

## Native AE 2025 checks still required

- Windows CEP dock/undock, scaling, 300 px panels and short panels.
- Real rendering, text animators, colors, property dimensions and installed fonts.
- Undo/Redo after Apply, Update, Remove and Create; inspect actual keyframes and expressions.
- Change native controls or markers directly in AE, then Load settings before editing. Metadata revision detection does not detect every independently edited native property or sampled animation value.

## Deliberate scope boundaries

Smart Workflow expansion, Copy/Paste Motion and Motion Stack are deferred. Batch Apply retains the existing report; editing through a bound Inspector requires one selected instance. This build does not add per-layer batch editing. Drafts are session-local; Reload settings deliberately reads the selected host instance. Native control refresh remains explicit to avoid discarding edits or sampling animated controls into a draft.
