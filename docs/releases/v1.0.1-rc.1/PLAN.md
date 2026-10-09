# v1.0.1-rc.1 prerelease preparation

User requested v1.0.1 and selected testing prerelease v1.0.1-rc.1. Base: completed Task4 local23845bc / remotea6ec789, identical source tree439736b7719c17c3e3e0a646982391a1c250a480.

- [x] Set numeric CEP/package version1.0.1 and rebuild only versioned metadata/Shape/Media/catalog. No engine or UI behavior changes; RC suffix belongs to release tag/ZIP, not CEP manifest.
- [x] Add isolated prerelease workflow for release/v1.0.1-rc.1, reusing Windows installer/tests and full73 active scripts; run static RC contract test before publication. Publish tagv1.0.1-rc.1 with --prerelease --latest=false and exact matching ZIP plus EXE; no stable main workflow change.
- [x] Run local73 regressions and packaging/version contract; record nativeAEValidated=false. Update only release docs and version-dependent tests; preserve historical Task4 evidence.
- [ ] Commit/upload RC branch, verify source parity and observe workflow. If no Actions trigger or tool cannot publish, identify exact blocker; never claim publication without a verified release/assets.

Known gate: native AE2025 is untested; this prerelease is for testing only. Preserve original public v1.0.0/latest; no main merge, installer redesign, additional preset or functionality.
