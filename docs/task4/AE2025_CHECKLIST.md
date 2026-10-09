# Final native After Effects2025 validation — NOT RUN

Environment used: Linux shell, Node/Python and Chromium headless browser with modeled host. No native Adobe After Effects2025 available. All boxes below are untested. Automated tests prove modeled contracts/Undo grouping/browser persistence, not native rendering, actual Undo/Redo or project save/reopen.

Record AE build, Windows build, tester/date, test project, source dimensions, FPS and observed outcome for each check. A failure remains open until reproduced and fixed. Do not publish or bump public version from this checklist alone.

## Text and existing systems

- [ ] YUGraphic animation: select Text, configure, Apply, Load, Update; native fonts/colors intact.
- [ ] Text Tools FX: Apply/Update, parameters and existing expressions/keyframes preserved.
- [ ] Text Favorites/Recent survive panel restart and remain scoped.
- [ ] SolidGen: existing eight generators, Inspector, Apply/Generate/Update; colors and prior animation preserved.
- [ ] Create Text/Shape/Solid; tools, Motion Curve, dark/light themes and accents unchanged.

## Shape — four pilots

- [ ] Rectangle, Ellipse and custom Pen path: Trim Path In, Path Wiggle, Glow, Blur Pulse.
- [ ] Filled versus stroked artwork; Trim requires visible enabled stroke and never hides filled artwork implicitly.
- [ ] Multiple/nested groups: reject ambiguity, honor explicit selected path/group.
- [ ] Pre-existing user Trim Paths, Wiggle/operators, Glow and Blur remain intact and unclaimed.
- [ ] Each pilot: Apply → Load settings → edit → Update → repeated Apply; no duplicate owned instance, original CTI preserved.
- [ ] Change selection A→B→A during Load and Apply; draft remains associated with actual returned target; wrong selection/revision cannot Update.
- [ ]50+ mixed selected layers including late eligible Shape; host applies only eligible unlocked targets.
- [ ] Custom owned keys/expressions/values, missing/renamed/duplicated node and malformed record reject without destroying user work.
- [ ] Apply → Undo → Redo; Update → Undo → Redo; failed Apply and partial failure restore only ZxT changes; uncertain recovery halts further mutations.
- [ ] Trim layer in-point beyond original start; timed repeat/Update reject safely. CTI/out-point duration guards.
- [ ] Real effect/operator match names/ranges, native property reference invalidation and rendering/playback performance.
- [ ] Save/close/reopen project and panel; recognize owned instances and Load/Update accurately.

## Media — four pilots

- [ ] PNG, JPG, video, image sequence, compatible PSD/AI footage and precomp; visual source validation based on native types, not extension.
- [ ] Slide Up: layer-space distance, neutral effect pivot, native Position/Anchor unchanged; Distance/Duration Update and repeated Apply.
- [ ] Pop In: owned uniform Scale start→100%; optional effect fade; native Scale/Opacity untouched.
- [ ] Blur Reveal: actual Gaussian Blur2, edge controls, amount→0; existing user Blur/effects preserved.
- [ ] RGB Split · Channel Blur Fringe: verify red Amount/blue half/green0/alpha0; actual chromatic blur, Amount0 neutral, alpha preservation. No directional RGB displacement promised.
- [ ] All native Anchor Point/Position/Scale/Rotation/Opacity values, keys and expressions unchanged by every pilot.
- [ ] Existing user Transform effect is preserved, never mistaken for ZxT-owned motion. New effects append; audit effect-order interactions.
- [ ] Each pilot: Apply → Load → edit → Update → repeated Apply; separate owned instance per preset; no stacking duplicates.
- [ ] Mixed/multiple eligible Media targets at one CTI; no stagger. Load/Update require single loaded target and correct revision/selection.
- [ ] Reject Text/Shape/Camera/Light/Null, solids/SolidGen, adjustment/audio-only/missing footage, unsupported and locked targets with clear non-destructive messages.
- [ ] Owned edits, rename/missing/duplicate/orphan/malformed/stale records reject safely; user notes and Shape comment records remain intact.
- [ ] Actual Transform/Gaussian/Channel Blur effect property contracts, ranges, expression support and neutral values.
- [ ] Apply → Undo → Redo; Update → Undo → Redo; failed and partial Apply/rollback; native uncertain-recovery behavior.
- [ ] Save/close/reopen project and panel; recognition, Load and Update after restart.
- [ ] High-resolution raster sampling/clipping, AI/PSD and continuously rasterized/collapse-transform precomp order; no quality/layout flags toggled.
- [ ] Composition/layer motion blur flags unchanged; owned Transform shutter remains0.

## Timing and docking matrix

- [ ]23.976fps;25fps;30fps;60fps. Durations measured in seconds, original start retained.
- [ ] Short composition and near out-point (duration rejects if too long); long composition; CTI away from0; before-start/endpoints.
- [ ] Narrow dock (~300/380/600px), breakpoint (~760px) and wide dock (~1200px), both short and tall: no overflow or footer overlap.
- [ ] Section switching, scoped local/global search, Favorites/Recent, correct Inspector, quick Load and Escape/Back.
- [ ] Panel close/reopen, dark/light theme and accent restore, collection persistence, empty/older/stale/duplicate saved IDs.

Release gate: all applicable native checks documented as passed, automated suite green, no blocking defect. Only then assess READY FOR RELEASE CANDIDATE; no publication is authorized by Task4.
