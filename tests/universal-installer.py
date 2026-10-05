"""Universal setup source/UI contract; behavior executes separately in Windows CI."""
from pathlib import Path
import xml.etree.ElementTree as ET
r=Path(__file__).resolve().parent.parent
x=ET.parse(r/'installer/windows/Window.xaml');ns='{http://schemas.microsoft.com/winfx/2006/xaml}'
controls={e.attrib.get(ns+'Name'):e for e in x.iter() if ns+'Name' in e.attrib}
for name in ['VersionPicker','VersionFeatures','VersionWarning','VersionConsent','RefreshVersions']:
 assert name in controls,'Missing universal setup control: '+name
fetch=(r/'installer/windows/Download.ps1').read_text()
for name in ['Get-MotionAstraReleaseCatalog','Get-MotionAstraReleaseFeatures','Get-MotionAstraReleasePackage','Initialize-MotionAstraDownloadedPayload']:
 assert 'function '+name in fetch,'Missing universal release logic: '+name
assert '/releases/latest' in fetch and '/releases?per_page=100&page=' in fetch
ui=(r/'installer/windows/WindowsUI.ps1').read_text()
assert '$script:selectedRelease.Tag' in ui and 'VersionConsent.IsChecked' in ui
assert 'SetupMode.txt' in (r/'installer/windows/Launcher.cs').read_text()
assert 'SetupVersion.txt' not in (r/'installer/windows/Launcher.cs').read_text()
assert "'universal'" in (r/'tools/build-windows-installer.ps1').read_text()
print('PASS: universal release discovery, version/features-only UI, non-recommended confirmation and version-independent EXE')
