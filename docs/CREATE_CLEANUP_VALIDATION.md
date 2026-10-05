# v1.0.0 Official — Create and Tools cleanup

Copy / Paste Motion and the Layer Inspector are no longer exposed in the panel or catalog. Their UI state and event bindings have been removed. Existing host motion code is retained for compatibility; this change does not modify animation engines or existing project data.

Text, Shape and Solid Color creation settings use independent native disclosures, initially closed. Submit buttons stay outside the disclosures. Current form values survive closing a disclosure or switching tabs. Invalid controls reopen their disclosure before native validation attempts to focus them. Cross-panel search opens a collapsed ancestor when navigating to a parameter. Favorites and Recent retain the same IDs and saved collections.

## Automated coverage

- `tests/create-cleanup.cjs`: removed UI and event bindings, DOM-independent selection context, collapsed settings and reachable submit buttons.
- `tests/create-cleanup-ui.cjs`: removed actions, disclosure click/keyboard behavior, retained drafts, one layer per click, invalid-input reveal, search navigation, 300/380/680/1200px widths, short layouts and offline safety.
- Existing reliability/Studio tests continue checking selection changes, Apply/Update, keyframe preservation and preset Inspector loading without the removed Layer Inspector.
- Existing font tests explicitly expand creation settings and continue checking font family/style/size/color, shape geometry, HEX colors and recent-color persistence.
- Existing Official cleanup tests retain theme/accent and Text/Solid/Create Favorites/Recent coverage.
- Generated catalog, static asset/schema tests and package checks validate the offline package.

## Direct AE 2025 checks still required

On Windows, verify layer creation with installed fonts, actual native colors/geometry, Apply/Update after changing selection, native rendering, docking/resizing and Undo/Redo. Host-model/browser checks do not establish native AE rendering.
