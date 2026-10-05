# ZxT-Motions v1.0.0 — Official Release

Windows-only Adobe After Effects 2025 CEP extension. This release combines the Studio cleanup and Copy / Paste Motion update, with the approved same-version repair.

- Separate All / Favorites / Recent filters in Text, SolidGen and Create, with compatible saved collections.
- Cleaner Inspector labels, with actual parameter controls and AE keyframes badges preserved.
- Text Appearance and Keyframe Easing removed from Quick Tools; the other existing tools remain.
- Copy / Paste Motion in Motion → Quick Tools: known ZxT preset settings, Text Animate/YUGraphic IN/OUT and managed control keys, plus Anchor Point, Position, Scale, Rotation/Z Rotation and Opacity keyframes. Relative animation starts at the current playhead and pastes identically to every valid target.
- Select buttons now have equal left/right card spacing across narrow and wide panels.
- Preset Paste rebuilds only known setups via existing engines, skips existing managed presets, protects target animation, and keeps layer timing/layer count unchanged.
- Copy/Paste recognizes built-in Text Animate OUT expressions with Windows CRLF or CR line endings without treating them as custom edits; genuinely authored expressions and keyframes remain protected.
- Copy is read-only and session-only. Paste uses one undo group; existing target keyframes and expressions are skipped rather than overwritten. Compatible dimensions and Position representation are required.
- Preserves Studio layouts, all 134 presets, themes/accents and existing Apply/Update engines.
- Universal Windows graphical installer discovers releases from GitHub, defaults to the latest Official, shows only version/features, and downloads the selected package after consent and other-version warning acknowledgment, verifies hashes, detects old versions and retains confirmation, backups and rollback.

Download **Install ZxT-Motions.exe**, close AE, run setup, review the destination and consent to installation. Internet is required for setup; the installed panel works offline. The ZIP is available for offline/manual installation. Destination: `%APPDATA%\Adobe\CEP\extensions\MotionAstra-FX`.

The installer and extension are unsigned. Automated browser/host-model and Windows CI checks do not establish native rendering, docking, spatial/roving fidelity or Undo/Redo in AE 2025. Direct native AE validation remains outstanding; test on a duplicate project first.

No arbitrary user effect/expression copying, Smart Workflow, Motion Stack, mirroring, stagger or cross-session clipboard persistence is included.
