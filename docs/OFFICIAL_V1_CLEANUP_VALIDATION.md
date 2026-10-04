# ZxT-Motions v1.0.0 Official Release identity — cleanup validation

Baseline: v3.6.1, commit 20625c2f31525972ccd3561bb60e8a072041b7b9.

## Bounded cleanup

- Removed the global All / Favorites / Recent row below Quick Tools.
- Added independent Text, SolidGen and Create collection rows. Text includes its existing Text Tools FX and Text Animate presets; SolidGen filters background presets; Create filters its existing Text, Shape and Solid Color cards.
- Reused `zxt-collections-v1`, keeping existing `core:` and `yu:` identities and adding `create:` identities to the same Favorites and Recent lists. Recent keeps its existing shared 20-item limit and records successful operations only. Filter selection remains session-local, as before.
- Removed repeated Panel Settings labels, preserving every parameter input and AE keyframes badges.
- Removed only Text Appearance and Keyframe Easing from Tools. Remaining sections match the baseline: FX settings, Anchor point, Arrange layers, Align & distribute, Position & parenting, Remove effects. Motion Curve is unchanged.
- Set visible/runtime metadata to ZxT-Motions v1.0.0 / Official Release. The version gate permits this explicit one-time 3.6.1 → 1.0.0 identity migration.
- Preserved navigation, Studio styling, themes, accents, all 134 presets, animations and Apply/Update logic. No post-v1.0 features were added.

## Automated / browser validated

34 host/model/compatibility scripts and 13 Chromium browser scripts passed. The two new cleanup checks are integrated into the existing CI test steps. CI has not been run for this candidate.

- Independent tab filters, scoped empty states and switching; legacy Favorites/Recent compatibility and reload persistence; successful Create recording and favorites.
- Global search, including navigation to a Create item hidden by its collection filter. Font search retains focus and drafts: unchanged forms are not moved/rebuilt.
- Inspector inputs and native model color round-trips; repeated Apply, Update, keyed property preservation, selection-change guards, single background generation and error handling.
- Existing Tools, 14 core Apply/Update setups, Text Animate, Motion Curve, bridge lifecycle, expression and ES3 parser gates.
- Saved dark/light themes, all five accents and contrast checks; widths 300, 320, 380, 680, 760/768, 1200 px across relevant suites, and short panels down to 360 px. No horizontal document overflow. Inspector actions remain reachable; Back restores library scrolling.
- Offline catalog and mutation guards; package integrity and complete checksums, Windows-only contents.
- Baseline comparison proves preset definitions and host/animation engines differ only in version metadata; remaining Tools sections match exactly after the two removals.
- Version parity and the approved version migration passed in a temporary Git fixture.

The focus regression caught in Create during this task was fixed and its affected browser suites rerun successfully. Existing test selectors were adjusted to use the visible tab collection and return from narrow Inspector before selecting a filter.

## Direct AE 2025 / Windows validation still required

- Docked wide/medium/narrow/short panels, display scaling, themes and collection persistence in CEP.
- Real selected layers, text/font/color rendering, solid generation, representative presets and every remaining tool on supported layer types.
- Repeat Apply and Update on existing v3.6.1 projects; native keyframes/expressions and selection changes.
- Real AE Undo/Redo and project save/reopen; the host model is not a substitute for these checks.
- Candidate Windows GUI installer, replacement/rollback and native CEP launch. No current Windows EXE was compiled or native installer/AE run performed here.

## Release status / blockers

Ready for release-candidate validation. No known cleanup regression remains in the automated tests.

Not officially published. The existing publication workflow and online installer still resolve `-alpha` tags/assets. Official publication must align the tag, package name, online installer route and release status, and compile/verify its matching Windows EXE. Those distribution changes are intentionally outside this UI-only task. Do not distribute a v1.0.0 online EXE pointing at missing Alpha assets.

The validation ZIP uses the existing offline GUI/CMD fallback and contains the complete panel with checksums; it does not contain a newly compiled EXE. Installation instructions in the package describe the manual route.

## Files changed

- `.github/workflows/release-v2.8.yml`
- `CSXS/manifest.xml`
- `INSTALLATION_GUIDE.md`
- `README.md`
- `RELEASE_NOTES.md`
- `VERSION`
- `catalog.html`
- `css/studio.css`
- `index.html`
- `js/bridge.js`
- `js/collections.js`
- `js/create.js`
- `js/main.js`
- `js/presets-data.js`
- `js/search.js`
- `js/yu-text.js`
- `jsx/fx-tools.jsx`
- `jsx/hostscript.jsx`
- `jsx/presets-data.jsx`
- `jsx/yu-text.jsx`
- `presets.json`
- `tests/background-stability.cjs`
- `tests/bridge.cjs`
- `tests/features-282.cjs`
- `tests/loop-migration.cjs`
- `tests/official-cleanup-ui.cjs`
- `tests/official-collections.cjs`
- `tests/reliability-ui.cjs`
- `tests/switcher-choice.cjs`
- `tools/check-version.py`
- `docs/OFFICIAL_V1_CLEANUP_VALIDATION.md` (this report)
