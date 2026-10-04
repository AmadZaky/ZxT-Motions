# ZxT-Motions v1.0.0 — Official Release (Windows only)

- Moves All / Favorites / Recent out of Quick Tools into Text, SolidGen and Create. Each tab filters only its own items; existing Favorites and Recent storage stays compatible.
- Removes repeated Panel Settings labels from Inspector controls. Parameters, AE keyframes badges and FX behavior stay unchanged.
- Removes Text Appearance and Keyframe Easing from Tools. All other tools, presets and animation engines are preserved.
- Preserves Studio layouts, themes and accents, Apply/Update workflow, search and saved collections.

This source carries the requested Official Release identity. Publication remains gated on release-candidate validation in After Effects 2025; browser and host-model checks do not replace native rendering, docking, Undo/Redo and installer validation.

## Previous Studio work

# ZxT-Motions v3.6.1 — Studio Workflow Pre-release (Windows only)

- Replaces the five primary tabs with Library / Motion / Create. Text and SolidGen live in Library; Quick Tools and Curve live in Motion.
- Uses one Inspector area: beside browsing at 760 px or wider, and a detail view with Back to Library on narrow panels. Browsing scroll position is retained.
- Simplifies preset cards to selection and Favorites. Apply / Generate belongs to Inspector; successful single-layer operations bind the saved instance for Update.
- Disables clean Update and displays applied/unsaved status. Session drafts are isolated by composition/layer/instance selection context.
- Guards follow-up loads and updates against changed layer identities and saved metadata revisions. Keeps existing native keyframe/expression protections.
- Corrects Text Animate phase loading: explicit IN/OUT never inherits BOTH or silently loads another phase. Remove validates the loaded target.
- Requires an explicit timeline check after partial batch success or an uncertain bridge reply; never automatically retries an operation.
- Preserves all 134 presets, tools, Favorites/Recent, five accents, dark/light themes and the Motion preview text. Updates the offline catalog and regression coverage.

Smart Workflow expansion, Copy/Paste Motion and Motion Stack remain deferred. Native properties or markers changed directly in AE should be loaded again before editing; metadata revision checks do not detect every native change.

Windows-only online setup, package integrity checks, backups and rollback remain unchanged. Package and installer are unsigned. Browser/host-model and Windows CI tests do not replace manual rendering, docking/scaling and Undo/Redo checks in After Effects 2025.
