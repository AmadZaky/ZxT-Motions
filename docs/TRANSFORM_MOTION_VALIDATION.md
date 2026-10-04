# v1.0.0 Copy / Paste Motion — Transform only

Baseline: v1.0.0 cleanup source, e65c976f236954c1efe6c1919914727b17773c6a. Version identity remains v1.0.0 / Official Release. No release has been packaged or published in this task.

## Implementation

Buttons appear in **Motion → Quick Tools → Copy / Paste Motion**, using existing disclosure/button-grid components and status feedback. No styling/navigation redesign.

The host adds `copyTransformMotion`, `pasteTransformMotion`, `validateTransformMotion`, plus bounded value/interpolation/ease/key-capture helpers. `motionNames` explicitly whitelists Anchor Point, Position, Scale, Rotation/Z Rotation and Opacity. Separated Position followers are accessed only through the existing Position helper. No arbitrary property paths or non-Transform traversal are accepted.

Copy requires one source with readable keyed Transforms. It is a read-only dispatch route and does not open an undo group. Underlying keyed values on a source expression-driven Transform can be copied, but its expression is never included. Non-keyed properties are omitted.

The panel stores plain numerical/keyframe metadata in `state.motionClipboard`, never localStorage, files or project metadata. Paste is disabled until copy succeeds; a failed recopy clears the prior buffer. Reload clears the clipboard. The existing bridge gains a capability check so a cached pre-feature v1.0.0 dispatcher is reloaded before use.

Offsets are seconds: `offset = sourceKeyTime - earliestCopiedTransformKeyTime`. The earliest across all supported copied properties is zero. `pasteTime = composition.time + offset`. Example at 30 fps: source frames 20/32/44 → offsets 0/12/24 → CTI100 → frames100/112/124. Frame rates are not remapped; time duration in seconds is preserved across compositions.

## Conservative conflicts and rollback

- Skip a locked target, unavailable/non-writable property, incompatible dimensions/spatial type or mismatched Position representation.
- Skip **any** copied destination property that already has keyframes, even if they do not overlap the proposed times. Insertion into old spatial animation can alter roving or automatic tangents outside the insert range; this feature never splices into it.
- Skip target expressions whether enabled or disabled. Never clear, replace or copy expressions.
- Other valid empty Transform properties on the same target still receive motion. All targets use the same captured CTI; no staggering or layer-time changes.
- The same values/interpolation/ease/continuity/auto-Bezier flags and spatial tangents are applied. Interior roving is restored only if the native times remain within 1 microsecond of requested offsets; a native retime causes restoration instead of silently changing timing.
- A failed write removes new keys from the affected previously unanimated property and restores its original static value. No other properties are rolled back or deleted. Rollback failure sets recovery feedback and asks for one Undo; there is no automatic retry.
- Feedback reports the actual number of layers changed and skipped-property reasons. Intentional safe skips do not block further actions behind recovery; an uncertain bridge reply or failed rollback does.
- Paste participates in the existing single undo transaction, named **Paste ZxT Motion**. Empty/rejected writes do not mutate the composition. Native AE behavior of empty undo groups remains part of manual verification.

## Automated / browser checks

35 host/model/static scripts and 14 Chromium browser scripts passed, including existing preset/engine/UI regression suites. No packaging or publishing commands were run for this feature. New tests are included in existing CI verification steps; CI has not been run on this feature candidate.

Focused tests cover:

- Copy with no/multiple selected layers, no Transform keys, all five properties separately/together, source expression exclusion, locked read-only source, unavailable composition/metadata and shared earliest origin.
- Exact frame20/32/44 →0/12/24 →100/112/124 mapping; CTI before and after source timing; multiple target layer types; matched 2D/3D and separated Position axes.
- Target animation conflicts, even non-overlap, expressions including disabled ones, locked/unsupported targets and partial compatible-property success.
- Interpolation (Linear/Bezier/Hold), temporal ease, spatial tangents, continuity/auto-Bezier flags and interior roving round-trip in the host model.
- Native-write failure injection, attribute failure and simulated roving retiming; per-property cleanup/static-value restoration. Undo-close failure, including after failed rollback, retains recovery and blocks further mutations behind the existing recovery UI.
- Effects, Masks, Text Animators, Source Text, Shape Contents, unrelated expressions, parenting, comments and layer timing preserved by model assertions.
- Session clipboard, failed recopy, disabled/offline Paste, feedback, one Paste undo group, no Copy undo, focus/selection state and existing responsive Tools at widths300/380/680/1200 and height360.
- Same-version host cache capability invalidation; existing Favorites/Recent, themes/accents, search, Inspector, Apply/Update and UI cleanup regression suites.

## Direct Adobe After Effects 2025 validation still required

Use a duplicate/test project on Windows:

1. Make frame20/32/44 keys for each supported property, copy, and paste at frames100 and10 onto empty compatible targets. Confirm source unchanged and identical offsets across multiple targets.
2. Check real native temporal ease/interpolation, automatic flags, curved spatial tangents and roving. AE may recalculate automatic metadata: any rejected timing must restore the property and give a useful status.
3. Check 2D/3D AV/Text/Shape/Solid/null layers, compatible camera/light Transforms, separated Position X/Y/Z and incompatible target types.
4. Existing target keyframes at/between/outside pasted times must remain unchanged; expressions, including disabled ones, must remain intact. Other compatible properties should still paste.
5. Verify Effects, Masks, Text Animators, Shape Contents, Layer Styles, Source Text, Track Mattes, parenting and layer timing in a real project. No code path intentionally accesses them for copying/writing.
6. One Undo must remove a successful multi-target paste and restore old static values. Redo must reinstate it. Copy, invalid selection and fully skipped paste must not add meaningful edits to Undo history.
7. Confirm CEP reload clears the clipboard, old-v1.0.0 host reuse is corrected, and docked small/short panels plus themes remain usable.

Release blockers: direct native AE 2025 checks above remain unperformed; no claim of native rendering or Undo/Redo success is made. Previously documented official installer/tag/asset publication alignment remains outside this bounded task. No new preset, effect copy, expression copy, Motion Stack, Smart Workflow, mirroring, stagger, persistence or release assets were added.

API reference used for existing ExtendScript keyframe methods: https://github.com/docsforadobe/after-effects-scripting-guide/blob/master/docs/property/property.md . The feature avoids newer APIs unrelated to the AE 2025 target.

## Files changed

- `index.html`: Tools actions, guidance and session status.
- `js/main.js`: session clipboard, action handlers, disabled/recovery state.
- `js/bridge.js`: cached host capability check.
- `jsx/hostscript.jsx`: bounded Transform capture/validation/paste and dispatch/undo integration.
- `catalog.html`: regenerated self-contained preview of the same UI; host controls remain disabled offline.
- `tests/transform-motion-fixture.cjs`: deterministic keyframe metadata fixture.
- `tests/transform-motion.cjs`: host safety/timing/preservation coverage.
- `tests/transform-motion-ui.cjs`: real-browser state/interaction coverage.
- `tests/bridge-lifecycle.cjs`: same-version host reload regression.
- `.github/workflows/release-v2.8.yml`: registers the two new test entrypoints only; publication unchanged.
- `README.md` and this report: workflow, conflict policy and validation limits.
