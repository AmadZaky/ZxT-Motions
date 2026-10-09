# Media Task 3 implementation plan

Goal: enable the existing Media Library with exactly four independent pilots, preserving completed Task 2 and all frozen systems. User approved design and implementation explicitly on 2026-10-09; no renewed approval gate. Execute inline. Stop after implementation, tests and report; Task 4 remains unauthorized.

Authority: Task 2 remote 377f6e59b6c331aadd9b1a6d307d573ab019929b, local b8922c7, identical tree 92bf7203904d4792cdf9f573c9572840a0f35040. Shell and GitHub comparison verified; clean recovered checkout used on feature/media-library-task3.

Architecture: independent schema1 metadata, generated ES3 host and data, browser adapter, Inspector and illustrative preview. Add only dispatcher/bridge/shell/search/collections/packaging integration. Preserve Shape source/generated host/metadata/adapter/preview byte-for-byte.

## 1. Host ownership and pilots
- [x] Write/run failing modeled host tests for actual AVLayer + FootageItem/CompItem eligibility, stable identity, four effects, scalar/vector snapshots, ownership damage/orphans/duplicates, repeat/load/update, original CTI, bounds, user effects/native Transform preservation and rollback.
- [x] Implement src/media-host.js; generate jsx/media.jsx and js/media-presets-data.js through tools/build-media.py.
- [x] Use owned ADBE Geometry2 for slide-up/pop-in, Gaussian Blur 2 for blur-reveal, explicitly labeled ADBE Channel Blur fringe for rgb-split. Validate exact property matches, dimensions, runtime ranges and expressions before configuration. Require neutral Transform defaults; set uniform scale, zero rotation/skew, 100 opacity, comp-shutter off and owned shutter zero. Never mutate native Transform.
- [x] Integrate lazy mediaLibrary route, module mediaVersion:1 and core mediaLibraryVersion:1; meaningful Apply/Update Undo groups, Load read-only.
- [x] Reject unsafe ownership and custom edits; bind native layer/comp IDs in records; restore controlled values/comment or remove only new effect after failure; stop further mutation on uncertain rollback.

## 2. Studio adapter and collections
- [x] Write/run failing collections and browser checks.
- [x] Enable Media tab and independent Inspector using existing Studio pattern; All/Favorites/Recent, Motion/FX category/families, local/global search, active quick Load/Escape/Back, drafts and stale response guards.
- [x] Add media: IDs to existing zxt-collections-v1; recent only on successful mutations. Seed fixture once and compare exact storage across reload.
- [x] Verify widths 300/380/759/760/920/1200 at heights300/720; actions above footer and no horizontal overflow.

## 3. Validation and report
- [x] Run existing 62 scripts with narrowly adapted obsolete no-Media assertions, plus focused Media host/safety/bridge/collections/boundaries/UI tests. Record exact commands/exits; maintain frozen function/source checks.
- [x] Include Media metadata/assets in package contract without installer changes; regenerate catalog only if required by generator contract.
- [x] Review full diff, fix verified defects, commit reviewable source and 15-topic completion report with native checklist and quality limits. No merge/release/Task4.

Review focus: transformed high-resolution input sampling/clipping; collapse-transform precomps; stale asynchronous responses; duplicate/copied layer-comment identity; rollback failures after indexed reference invalidation.

Ruling: VR Chromatic Aberrations documentation describes radial channel scaling; native property schema/ordinary-footage alpha behavior cannot be certified in cloud. Use approved smallest labeled Channel Blur fringe alternative, red Amount/blue half Amount/green0/alpha0, neutral Amount0. This is chromatic blur, not geometric displacement. Its real native rendering remains unverified.
Ruling: additive Media eligibility is returned separately by Media inspection route, keeping existing selectionContext function and type classifications byte-identical.

Review ledger: independent reviewer reproduced asynchronous native/cached selection lag. Fixed via explicit native identity in Load replies (including null instances) and correct draft binding after successful mutations; focused Chromium assertions observed RED→GREEN. Truncated selection finding regraded as Important because it blocked a valid target; host-deferred eligibility restored and tested RED→GREEN. No deferred production minors.

Ruling: Task2 source boundary test uses canonical remote377f6e59 rather than local b8922c7 so the test remains runnable from a fresh GitHub branch clone. The source trees are identical; no baseline modules changed.
