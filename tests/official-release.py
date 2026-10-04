"""Stable release routing and installer metadata contract."""
from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
version=(root/'VERSION').read_text().strip()
assert re.fullmatch(r'\d+\.\d+\.\d+',version)
workflow=(root/'.github/workflows/release-v2.8.yml').read_text()
assert 'tag="v${version}"' in workflow, 'Official tag must have no Alpha suffix'
assert 'asset="ZxT-Motions_v${version}.zip"' in workflow
assert '--prerelease' not in workflow and '--latest' in workflow
assert 'Official Release' in workflow
fetch=(root/'installer/windows/Download.ps1').read_text()
assert '-alpha' not in fetch
assert "'/releases/tags/v'" not in fetch # URL is full repository path, pinned to exact version
assert "'https://api.github.com/repos/AmadZaky/ZxT-Motions/releases/tags/v'+$Version)" in fetch
assert '$Release.prerelease' in fetch
assert "^sha256:" in fetch and "Get-FileHash" in fetch
package=(root/'tools/package-release.py').read_text()
assert "version+'.zip'" in package and '-alpha.zip' not in package
for f in ['README.md','INSTALLATION_GUIDE.md']:
 text=(root/f).read_text();assert 'has not been published yet' not in text
print('PASS: v1.0.0 stable tag/assets, pinned official installer route, integrity checks and matching docs')
