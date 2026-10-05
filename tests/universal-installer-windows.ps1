# Policy tests execute actual PowerShell catalog/package code with only transport mocked.
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
. (Join-Path $root 'installer\windows\Download.ps1')
function Assert($value,$message) { if (-not $value) { throw $message } }
function Reject([scriptblock]$action) { $failed=$false;try { & $action | Out-Null } catch { $failed=$true };Assert $failed 'Unsafe release accepted' }
function Release([string]$tag,[bool]$pre=$false,[string]$prefix='ZxT-Motions_v') {
 $name=$prefix+$tag.Substring(1)+'.zip'
 return @{tag_name=$tag;draft=$false;prerelease=$pre;body="# Version $tag`nPublished: 2026-10-05`n- Counter Text`n- Text Animate`n- SolidGen";assets=@(@{name=$name;state='uploaded';browser_download_url=('https://github.com/AmadZaky/ZxT-Motions/releases/download/'+$tag+'/'+$name);digest=('sha256:'+('a'*64));size=200})}
}
$script:latest=Release 'v1.0.0';$script:alpha=Release 'v3.6.1-alpha' $true;$script:old=Release 'v2.8-pre-alpha' $true 'MotionAstra_FX_v'
$script:missing=@{tag_name='Alpha';prerelease=$true;draft=$false;assets=@();body=''}
$script:rows=@($script:alpha,$script:latest,$script:old,$script:missing)
$script:requests=@()
function Invoke-RestMethod { param($Uri,$Headers,$TimeoutSec);$script:requests+=@($Uri);if ($Uri.EndsWith('/latest')) { return $script:latest };return ,$script:rows }
$c=Get-MotionAstraReleaseCatalog
Assert ($c.Releases.Count -eq 4) 'Catalog omitted old/unavailable versions'
Assert ($c.LatestTag -eq 'v1.0.0') 'Latest must come from GitHub Official metadata, not numeric ordering'
Assert (@($c.Releases | Where-Object Recommended).Count -eq 1) 'Wrong recommendations'
Assert (-not $c.Releases[0].Recommended -and $c.Releases[0].Available) 'Alpha unavailable or silently recommended'
Assert (-not $c.Releases[3].Available) 'Missing package accepted'
Assert ($c.Releases[1].Features -match 'Counter Text' -and $c.Releases[1].Features -notmatch 'Published|2026|# Version') 'Version info includes dates/metadata instead of features'
Assert ((ConvertTo-MotionAstraPackageVersion 'v2.8-pre-alpha') -eq '2.8.0') 'Legacy version normalization failed'
# A future Official release is discovered by the same installer, without rebuilding it.
$script:latest=Release 'v1.2.0';$script:rows=@($script:alpha,$script:latest)
$c=Get-MotionAstraReleaseCatalog;Assert ($c.LatestTag -eq 'v1.2.0' -and $c.Releases[1].Recommended) 'Universal installer stayed pinned'
$script:rows=@(1..100 | ForEach-Object { Release ('v1.0.'+$_) });$script:pages=0
function Invoke-RestMethod { param($Uri,$Headers,$TimeoutSec);if ($Uri.EndsWith('/latest')) { return $script:latest };$script:pages++;if ($script:pages -eq 1) { return $script:rows };return @($script:latest) }
$c=Get-MotionAstraReleaseCatalog;Assert ($c.Releases.Count -eq 101 -and $script:pages -eq 2) 'Release pagination failed'
foreach ($bad in @('v1.0.0/../../x','https://evil.com','1.0.0')) { Reject { ConvertTo-MotionAstraPackageVersion $bad } }
$bad=Release 'v1.0.0';$bad.assets[0].digest='';Reject { Get-MotionAstraReleasePackage $bad 'v1.0.0' }
$bad=Release 'v1.0.0';$bad.assets[0].browser_download_url='https://example.com/payload.zip';Reject { Get-MotionAstraReleasePackage $bad 'v1.0.0' }
$bad=Release 'v1.0.0';$bad.draft=$true;Reject { Get-MotionAstraReleasePackage $bad 'v1.0.0' }
$temp=Join-Path ([IO.Path]::GetTempPath()) ('MA-Universal-'+[Guid]::NewGuid().ToString('N'))
try {
 $payload=Join-Path $temp 'MotionAstra-FX'
 foreach ($name in @('CSXS\manifest.xml','index.html','jsx\hostscript.jsx','jsx\presets-data.jsx')) {
  $target=Join-Path $payload $name;New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null;Copy-Item (Join-Path $root $name) $target
 }
 Initialize-MotionAstraDownloadedPayload $payload ((Get-Content (Join-Path $root 'VERSION') -Raw).Trim())
 . (Join-Path $root 'install-windows.ps1');Assert-MotionAstraPayload $payload
 Assert (Test-Path (Join-Path $payload 'VERSION')) 'Verified legacy VERSION not synthesized'
 Assert (Test-Path (Join-Path $payload 'SHA256SUMS')) 'Verified legacy checksums not synthesized'
 Reject { Initialize-MotionAstraDownloadedPayload $payload '9.9.9' }
 Add-Content (Join-Path $payload 'index.html') 'tampering';Reject { Assert-MotionAstraPayload $payload }
 Write-Host 'PASS: latest Official default, future version discovery, explicit Alpha/legacy selection, unavailable releases, pagination, version/features-only info, URL/hash/identity checks and legacy integrity.'
} finally { Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue }
