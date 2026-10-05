# Exercise the production catalog worker against public GitHub, without a package download.
$ErrorActionPreference='Stop'
. (Join-Path (Split-Path $PSScriptRoot) 'installer\windows\WindowsUI.ps1')
$state=[hashtable]::Synchronized(@{Done=$false;Error=$null;Catalog=$null})
$job=Start-MotionAstraCatalogJob -Download (Join-Path (Split-Path $PSScriptRoot) 'installer\windows\Download.ps1') -State $state
$deadline=[DateTime]::UtcNow.AddSeconds(120)
try {
 while (-not $job.Handle.IsCompleted) {
  if ([DateTime]::UtcNow -gt $deadline) { throw 'Live catalog timed out' }
  Start-Sleep -Milliseconds 100
 }
 [void]$job.Worker.EndInvoke($job.Handle)
 if ($state.Error) { throw ('Live catalog error: '+$state.Error) }
 if (-not $state.Catalog -or -not $state.Catalog.Releases.Count) { throw 'Empty live catalog' }
 $state.Catalog.Releases | ForEach-Object { Write-Host ($_.Tag+' | available='+$_.Available+' | recommended='+$_.Recommended+' | '+$_.Reason) }
 if (-not @($state.Catalog.Releases | Where-Object { $_.Recommended -and $_.Available }).Count) { throw 'Live latest Official not available' }
 Write-Host 'PASS: production async catalog with real public GitHub metadata; no packages downloaded.'
} finally { $job.Worker.Dispose() }
