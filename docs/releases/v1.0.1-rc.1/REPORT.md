# v1.0.1-rc.1 testing prerelease preparation

User selected v1.0.1-rc.1 following Task4. Base remotea6ec789/local23845bc tree439736b7719c17c3e3e0a646982391a1c250a480. Release branch release/v1.0.1-rc.1.

Numeric CEP/runtime/module/package version1.0.1; tagv1.0.1-rc.1, ZIP ZxT-Motions_v1.0.1-rc.1.zip. New isolated publisher uses --prerelease --latest=false, refuses existing tag/release, atomically creates tag at testedSOURCE_SHA and verifies it before publication. Stable workflow/main/installer sources unchanged. No engine, preset or UI functionality changes. Original frozen YUGraphic JSX is preserved with its build stamp updated only.

Local verification:73/73 active Task2/3/4 scripts passed exits0, plus release-prerelease.py (version/workflow contract and actual publisher shell with fakecommands). Existing tag/release and Git transport failure refuse publication; new RC binds exactSOURCE_SHA, prerelease flag and not-latest. Initial contractRED→GREEN; review tag-binding issue reproduced then fixed. Independent review also required LF-preserving Windows checkout; workflow sets core.autocrlf false before checkout without weakening byte comparisons.

Version-dependent tests now follow1.0.1; historical official-repair fixture stays1.0.0; advisory test references equivalent remote2d9e076 rather than unavailable local81b4e7b. Frozen-boundary tests permit only approved numeric metadata changes. Full commands/logs/runtime in validation-results.json. Previously temporary dependencies were gone; restored acorn8.15.0/Playwright1.56.1 in /tmp/zxt-rc1-deps and Chromium headless shell1194. Required source-boundary and temporary package checks passed. Known generated screenshot outputs restored.

NativeAE2025Validated=false: no native tests run, no stable-ready claim. Follow docs/task4/AE2025_CHECKLIST.md. Windows compilation/installer execution and actual Actions publication remain pending until observed successful CI. GitHub release must have the exact RC tag, prerelease=true and matching ZIP/EXE assets before claiming it published. This source prepares testing distribution only; v1.0.0 remains latest stable.
