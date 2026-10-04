"""Require one patch increment per main push and matching runtime versions."""
from pathlib import Path
import json,re,subprocess,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
version=(root/'VERSION').read_text().strip()
assert re.fullmatch(r'\d+\.\d+\.\d+',version),'Version must be major.minor.patch'
manifest=ET.parse(root/'CSXS/manifest.xml').getroot()
assert manifest.attrib['ExtensionBundleVersion']==version
assert all(e.attrib['Version']==version for e in manifest.findall('./ExtensionList/Extension'))
assert json.loads((root/'presets.json').read_text())['version']==version
for path in ['js/bridge.js','jsx/hostscript.jsx']:
 assert version in (root/path).read_text(),path+' is stale'
try:
 previous=subprocess.check_output(['git','show','HEAD^:VERSION'],cwd=root,stderr=subprocess.DEVNULL,text=True).strip()
except subprocess.CalledProcessError:
 text=subprocess.check_output(['git','show','HEAD^:CSXS/manifest.xml'],cwd=root,text=True)
 previous=ET.fromstring(text).attrib['ExtensionBundleVersion']
old=tuple(map(int,previous.split('.')));new=tuple(map(int,version.split('.')))
# Explicitly approved Official maintenance retains v1.0.0; no ordinary push bypass.
subject=subprocess.check_output(['git','log','-1','--format=%s'],cwd=root,text=True).strip()
official_repair=previous==version=='1.0.0' and subject.startswith('[official-repair] ')
assert official_repair or new == (old[0],old[1],old[2]+1) or (previous=='2.8.9' and version=='3.0.0') or (previous=='3.0.11' and version=='3.5.0') or (previous=='3.5.2' and version=='3.6.0') or (previous=='3.6.1' and version=='1.0.0'), f'Expected next patch or approved minor/major migration after {previous}, got {version}'
print('PASS: patch increment and runtime version parity:',version)
