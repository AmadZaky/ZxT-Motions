# ZxT-Motions v1.0.0 — Official Release

Windows-only Adobe After Effects 2025 CEP extension. This release combines the Studio cleanup and Transform-only Copy / Paste Motion update.

- Separate All / Favorites / Recent filters in Text, SolidGen and Create, with compatible saved collections.
- Cleaner Inspector labels, with actual parameter controls and AE keyframes badges preserved.
- Text Appearance and Keyframe Easing removed from Quick Tools; the other existing tools remain.
- Copy / Paste Motion in Motion → Quick Tools: Anchor Point, Position, Scale, Rotation/Z Rotation and Opacity only. Relative animation starts at the current playhead and pastes identically to every valid target.
- Copy is read-only and session-only. Paste uses one undo group; existing target keyframes and expressions are skipped rather than overwritten. Compatible dimensions and Position representation are required.
- Preserves Studio layouts, all 134 presets, themes/accents and existing Apply/Update engines.
- Windows graphical online installer downloads its exact v1.0.0 package after consent, verifies hashes, detects old versions and retains confirmation, backups and rollback.

Download **Install ZxT-Motions.exe**, close AE, run setup, review the destination and consent to installation. Internet is required for setup; the installed panel works offline. The ZIP is available for offline/manual installation. Destination: `%APPDATA%\Adobe\CEP\extensions\MotionAstra-FX`.

The installer and extension are unsigned. Automated browser/host-model and Windows CI checks do not establish native rendering, docking, spatial/roving fidelity or Undo/Redo in AE 2025. Direct native AE validation remains outstanding; test on a duplicate project first.

No effect/expression copying, Smart Workflow, Motion Stack, mirroring, stagger or cross-session clipboard persistence is included.
