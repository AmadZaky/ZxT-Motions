# Unreleased — Shape controls and Media retirement

This working-branch update follows v1.0.1-rc.1; it is not published. Numeric public version stays 1.0.1.

- Active Library: Text | Shape | SolidGen. Media Motion/FX are retired from the panel; existing project instances and saved collection IDs are preserved.
- AE Slider Controls for existing Shape presets, including Trim Start/End/Offset/Duration.
- Three Shape FX added: Gaussian Blur, Drop Shadow and Turbulent Displace.
- Load reads live AE controls; Update preserves slider keyframes/expressions and protects stale revisions. Legacy Shape instances migrate in place on successful Apply/Update.
- Text, SolidGen, Create, tools/themes, native layer transforms and installer behavior remain unchanged.

Native AE2025 validation has not been run. Follow docs/shape-controls/AE2025_CHECKLIST.md before distributing a new candidate.

---

# ZxT-Motions v1.0.1-rc.1 — Testing Prerelease

For Windows Adobe After Effects2025 testing. Package/CEP version1.0.1; prerelease tagv1.0.1-rc.1. Native AE2025 validation is outstanding; this is not a stable release and does not replace v1.0.0 as latest.

- Library now includes Text | Shape | Media | SolidGen within existing Studio Library | Motion | Create.
- Four Shape pilots: Trim Path In, Path Wiggle, Glow and Blur Pulse; native Shape targets only, path-group/stroke safety.
- Four Media pilots: Slide Up, Pop In, Blur Reveal, RGB Split · Channel Blur Fringe (chromatic blur, not directional RGB displacement).
- Media motion uses separately owned Transform effects; native layer layout and user-created effects stay intact.
- Scoped Favorites/Recent, filters, search and responsive Inspector; unavailable stored preset IDs survive missing metadata.
- Safe Apply/Load/Update/repeat with ownership/revision/selection checks; improved Shape draft binding, timing guard and recovery stop.
- Preserves existing Text/YUGraphic/Text Tools FX, SolidGen, Create, tools/themes and installer behavior. No additional feature or preset expansion.

Testing requirements: actual native AE2025 effect contracts, visuals/alpha, native Transform preservation, effect order/quality, Undo/Redo, save/reopen and narrow/wide CEP docking remain untested. Follow docs/task4/AE2025_CHECKLIST.md on a duplicate test project. Automated/browser tests do not establish native success.

Select v1.0.1-rc.1 explicitly in the universal Windows installer (non-recommended version); review the warning and installation consent. The ZIP is provided for offline/manual installation. No Mac support. Installer and extension are unsigned.
