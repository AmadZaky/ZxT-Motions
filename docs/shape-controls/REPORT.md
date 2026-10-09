# Shape AE controls and Media retirement — implementation report

## Starting state and scope

Base local commit: `320da01eff34ae8a6b445f661b0c04b32cc504fc`. Equivalent published RC source: `7562f16f3a950cd8dfb797021e1b10f4a914c697`, tree `cb9accdc0e1c93709c8d67088af877dccc70b671`. Working branch: `feature/shape-controls-media-retirement`. This is a new approved development task after Task4/RC1. Published releases, main, numeric version1.0.1 and installer behavior are unchanged.

User approved removing Media Motion/FX from the active Library, retaining other systems, adding AE Effect Controls sliders to Shape and adding exactly Gaussian Blur, Drop Shadow, Turbulent Displace. No new engine, UI redesign, motion stack or automatic loop.

## Implemented

- Active navigation is Text | Shape | SolidGen; Media tab/library/Inspector/search/adapter initialization/CSS removed. Saved Media effects/expressions/comments and collection IDs are not deleted. Media host/registry/frontend source files remain byte-identical for compatibility; the frontend files are not loaded by the panel.
- Existing four Shape preset IDs/parameters retained. Trim additionally exposes Start/End/Offset; all numeric parameters have token-owned AE Slider Controls. Trim reveal interpolates Start→End; Duration is sampled at original start for Trim/Blur Pulse.
- Seven Shape presets in the same registry/host engine: Trim Path In, Path Wiggle, Glow, Blur Pulse, Gaussian Blur, Drop Shadow, Turbulent Displace. Shadow uses native default black; scalar controls only. Turbulent Evolution is manual/keyframeable.
- Optional controlVersion1/control descriptors extend the existing schema1 ownership record. Legacy RC1 Load stays read-only; successful Apply/Update upgrades in place. User edits to managed native properties block replacement/migration.
- Load samples live slider values; Update preserves authored slider keys/expressions, locks their panel fields and rejects conflicting requests. Revision includes controller base values, expressions, keys, interpolation/easing and native record. Sampled parameters accompany revision so CTI movement alone does not invalidate settings.
- Native expressions use exact owned effect names, scalar clamping and original start. Effect references are reacquired after indexed group additions/removals. Rollback restores changed unkeyed controls/native bindings/comment and removes only new owned objects; uncertain recovery stops further targets.
- Illustrative previews support static Blur/Shadow/Turbulent controls. Static new FX do not schedule looping playback.
- Text/SolidGen engines/registries, Create, tools/themes/accents and installer sources unchanged. Existing frozen-boundary test checks123 legacy host functions and complete frozen engine/UI files.

## Verification and test changes

Baseline73/73 passed after restoring absent temporary acorn8.15.0/Playwright1.56.1 and Chromium headless shell1194. Initial missing-dependency failures were environmental and repaired before production edits.

New tests reproduced missing controllers and Media retirement (RED), then passed (GREEN). Temporal-easing revision omission, misleading Turbulent preview and same-public-build cached RC1 module were separately reproduced and fixed. Shape capability2 forces reloading the old Shape module without changing public release metadata; core/Text/Media capability guards are unchanged. Independent reviewer found no Critical/Important defect; its minor preview note was addressed with a failing regression.

Final suite status: **77/77 checks passed**, all exit codes0. `validation-results.json` records commands, exits and outputs. Additional release-prerelease.py and numeric parity check passed before feature commit. The main-push patch-increment policy is unchanged and is not a feature-branch version bump requirement.

Changed historical tests only where the approved product contract changed: navigation/scope counts remove Media; Shape catalog counts increase4→7 and FX2→5; native expression evaluation supplies actual effect lookup; Glow range fixture only intercepts Glow, not newly added sliders. Media browser tests now assert retirement/persistence; all archived Media host/safety/bridge/collection tests remain active. Media boundary tests now freeze RC1 compatibility sources instead of forbidding approved Shape changes. Global search uses exact preset title routing while allowing legitimate keyword matches. Listener metric excludes only traced Playwright input-interceptor setup and verifies ordinary listener registration is still counted; no panel accumulation was observed.

Coverage includes all existing Text/SolidGen/Create/themes/Studio tests,14 Library viewports, collections/reload/panel restart, search/filters/Inspector lifecycle, live slider bindings, keyed/expression protection, revision/selection safety, native Transform/user-effect preservation, seven-preset repeats, malformed/missing/duplicate ownership, partial failures/rollback, new effect target/range/property safety and legacy upgrade. Native effect contracts are modeled, not Adobe-validated.

## Native status and release

Native AE2025 tests completed: **none**. Native rendering/property schemas, actual indexed-reference invalidation, Undo/Redo, keyframe expression evaluation and save/reopen need [AE2025_CHECKLIST.md](AE2025_CHECKLIST.md). Windows installer compilation/execution was not rerun here; installer sources did not change. No release is published or updated by this task. **READY FOR AE VALIDATION**. No automated blocking defects remain; native validation is required before a release candidate.
