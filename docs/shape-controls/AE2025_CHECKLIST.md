# Shape controls / Media retirement — native AE2025 checks NOT RUN

No native After Effects is available in this environment. Record Windows and AE build, tester/date, project and results. Browser/host-model tests do not establish rendering, native Undo/Redo or save/reopen.

## Existing systems and Media retirement

- [ ] Text Animate and Text Tools FX: Apply/Load/Update; existing effects/animators, fonts/colors and authored keys preserved.
- [ ] SolidGen eight generators and Create Text/Shape/Solid retain existing behavior; Quick Tools/Motion Curve/themes/accents work.
- [ ] Library is Text | Shape | SolidGen; no Media tab, cards, Inspector or search results.
- [ ] Open RC1 project with Slide Up/Pop In/Blur Reveal/RGB fringe; visual behavior/effects/expressions/comments stay intact. No cleanup on opening the panel.
- [ ] Existing Media Favorites/Recent survive reload/panel restart while remaining hidden; other scopes remain intact.

## Seven Shape presets

- [ ] Rectangle, Ellipse, custom Pen path, multiple/nested groups. Trim requires a visible enabled stroke; ambiguity fails cleanly.
- [ ] Trim Start/End/Offset/Duration sliders: defaults reproduce old reveal, modify live, keyframe endpoints/offset; Start→End animation and sampled original-start Duration.
- [ ] Path Wiggle Amount/Detail/Speed, Glow Intensity/Radius/Threshold, Blur Pulse Peak Blur/Duration: live sliders and keyed animation render correctly.
- [ ] Gaussian Blur Amount, Drop Shadow Opacity/Direction/Distance/Softness (black default), Turbulent Displace Amount/Size/Complexity/Evolution: actual Adobe match names/ranges and expression support, alpha/edges/raster bounds/effect order.
- [ ] Negative angular values, zero amount, maximum values; native Slider drag range versus typed values; bounded expressions stay valid.
- [ ] Native layer Anchor/Position/Scale/Rotation/Opacity values/keys/expressions unchanged.
- [ ] Pre-existing user Trim/Wiggle/Glow/Blur/Shadow/Turbulent/Slider controls preserved, never claimed.
- [ ] Apply → Load → Update → repeated Apply: one owned node/control set per preset; no duplicates. Multiple presets coexist on one layer.
- [ ] Keyframe and expression an AE slider; Load samples values, labels/protects it in panel. Update another control without changing keys, interpolation, easing or expressions.
- [ ] Change slider/value/key/easing after Load: stale Update rejects. Move CTI alone: loaded Update stays valid. Change selection A→B: wrong target rejects.
- [ ] Load/Update recognize instances after layer reorder, duplication, panel restart and project save/reopen.
- [ ] Reload the updated panel in an AE session retaining the RC1 module: new FX/control engine loads without a public-version bump.
- [ ] Open RC1 Shape instance; Load adds nothing, next Apply/Update adds exactly its control set. Custom managed-property edits block migration.
- [ ] Missing/renamed/duplicated control/node, stripped/malformed ownership or disabled/edited managed expression: clear non-destructive failure.
- [ ] Missing native effect/property/range/expression support: no leftover controls or native nodes; user effects/notes stay intact.
- [ ] Actual AE indexed Property invalidation after effect additions/removals; configure/rollback reacquire correct objects.
- [ ] Apply → Undo → Redo and Update → Undo → Redo; failed and partial multi-target operations; uncertain rollback stops subsequent targets and asks for one Undo.
- [ ] Reject Text/Footage/Precomp/Camera/Light/Null/locked targets; mixed selection skips invalid targets without modifying them.

## Timing and docking

- [ ] 23.976,25,30,60fps; short/long comp; CTI away from0; original start retained; near out-point durations rejected safely.
- [ ] Narrow ~300/380/600px and wide ~760/1200px, short/tall dock: no horizontal overflow/footer overlap; Back/Escape/quick Load work.
- [ ] Search, FX/Motion categories, Favorites/Recent, empty/old/unknown/duplicate collection IDs; no stale Inspector or parameter bleed.

All applicable native checks and automated suite must pass before assessing a new release candidate. No release is published by this task.
