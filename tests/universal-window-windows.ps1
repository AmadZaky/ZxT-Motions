# Drive the actual universal WPF window; only GitHub transport is replaced by local fixtures.
$ErrorActionPreference='Stop'
$universalSourceRoot=Split-Path $PSScriptRoot
$temp=Join-Path ([IO.Path]::GetTempPath()) ('MA Universal Window '+[Guid]::NewGuid().ToString('N'))
$oldAppData=$env:APPDATA;$script:testFailure=$null;$script:testPhase=0
try {
 $installer=Join-Path $temp 'Installer';New-Item -ItemType Directory -Path $installer -Force | Out-Null
 Copy-Item (Join-Path $universalSourceRoot 'installer\windows\WindowsUI.ps1'),(Join-Path $universalSourceRoot 'installer\windows\Window.xaml') $installer
 Copy-Item (Join-Path $universalSourceRoot 'install-windows.ps1') (Join-Path $installer 'Backend.ps1')
 Set-Content (Join-Path $installer 'SetupMode.txt') 'universal' -Encoding ASCII
 $zip=Join-Path $temp 'package.zip';python (Join-Path $universalSourceRoot 'tools\package-release.py') --output $zip;if ($LASTEXITCODE -ne 0) { throw 'Package fixture failed' }
 $universalExpectedVersion=(Get-Content (Join-Path $universalSourceRoot 'VERSION') -Raw).Trim();$tag='v'+$universalExpectedVersion;$name='ZxT-Motions_v'+$universalExpectedVersion+'.zip'
 $asset=@{name=$name;state='uploaded';size=(Get-Item $zip).Length;digest=('sha256:'+(Get-FileHash $zip -Algorithm SHA256).Hash.ToLower());browser_download_url=('https://github.com/AmadZaky/ZxT-Motions/releases/download/'+$tag+'/'+$name)}
 $latest=@{tag_name=$tag;draft=$false;prerelease=$false;body="# Release`nPublished: 2026-10-05`n- Counter Text`n- Text Animate`n- SolidGen";assets=@($asset)}
 $alpha=@{tag_name='v3.6.1-alpha';draft=$false;prerelease=$true;body='- Experimental Text Animate';assets=@(@{name='ZxT-Motions_v3.6.1-alpha.zip';state='uploaded';size=$asset.size;digest=$asset.digest;browser_download_url='https://github.com/AmadZaky/ZxT-Motions/releases/download/v3.6.1-alpha/ZxT-Motions_v3.6.1-alpha.zip'})}
 $fixture=@{Latest=$latest;Rows=@($alpha,$latest,@{tag_name='Alpha';draft=$false;prerelease=$true;body='';assets=@()});Zip=$zip;DownloadLog=(Join-Path $temp 'download.log');Offline=(Join-Path $temp 'offline')}
 $fixture | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $installer 'fixture.json') -Encoding UTF8
 $mock=@'
$script:fixture=Get-Content (Join-Path $PSScriptRoot 'fixture.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Invoke-RestMethod { param($Uri,$Headers,$TimeoutSec);if (Test-Path $script:fixture.Offline) { throw 'Simulated offline'; };Start-Sleep -Milliseconds 200;if ($Uri -match '/latest$|/tags/') { return $script:fixture.Latest };return ,$script:fixture.Rows }
function Invoke-WebRequest { param([switch]$UseBasicParsing,$Uri,$OutFile,$TimeoutSec);Set-Content $script:fixture.DownloadLog $Uri;Copy-Item $script:fixture.Zip $OutFile }
'@
 $download=(Get-Content (Join-Path $universalSourceRoot 'installer\windows\Download.ps1') -Raw)+"`n"+$mock
 Set-Content (Join-Path $installer 'Download.ps1') $download -Encoding UTF8
 $env:APPDATA=Join-Path $temp 'AppData'
 . (Join-Path $installer 'WindowsUI.ps1')
 Add-Type -AssemblyName PresentationFramework,PresentationCore,WindowsBase
 Set-Content $fixture.Offline 'offline'
 $script:deadline=[DateTime]::UtcNow.AddSeconds(90)
 $script:driver=New-Object Windows.Threading.DispatcherTimer;$script:driver.Interval=[TimeSpan]::FromMilliseconds(150)
 $script:driver.Add_Tick({
  try {
   if ([DateTime]::UtcNow -gt $script:deadline) { throw 'Universal window timed out' }
   if (-not $script:window.IsVisible) { return }
   if ($script:testPhase -eq 0 -and -not $script:catalogJob -and $script:controls.Status.Text -eq 'Could not load versions.') {
    if ($script:controls.Install.IsEnabled) { throw 'Offline startup allows installation' }
    Remove-Item $fixture.Offline;$script:testPhase=1
    $script:controls.RefreshVersions.RaiseEvent((New-Object Windows.RoutedEventArgs([Windows.Controls.Button]::ClickEvent)))
   } elseif ($script:testPhase -eq 1 -and $script:selectedRelease) {
    if ($script:selectedRelease.Tag -ne $tag -or -not $script:selectedRelease.Recommended) { throw 'Default is not latest Official' }
    if ($script:controls.VersionFeatures.Text -match 'Published|2026|# Release') { throw 'Version information contains dates/metadata' }
    if ($script:controls.VersionFeatures.Text -notmatch 'Counter Text') { throw 'Missing feature list' }
    if ($script:controls.VersionPicker.Items.Count -ne 3 -or $script:controls.VersionPicker.Items[2].IsEnabled) { throw 'Unavailable version is not visible/disabled' }
    $script:window.UpdateLayout()
    $bitmap=New-Object Windows.Media.Imaging.RenderTargetBitmap(640,650,96,96,([Windows.Media.PixelFormats]::Pbgra32));$bitmap.Render($script:window)
    $encoder=New-Object Windows.Media.Imaging.PngBitmapEncoder;$encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
    $stream=[IO.File]::Create((Join-Path $universalSourceRoot 'dist\installer-universal-preview.png'));try { $encoder.Save($stream) } finally { $stream.Dispose() }
    $script:controls.VersionPicker.SelectedIndex=0
    if ($script:controls.VersionWarning.Visibility -ne 'Visible' -or $script:controls.VersionConsent.IsChecked) { throw 'Other version warning missing' }
    $script:controls.DownloadConsent.IsChecked=$true
    $script:controls.Install.RaiseEvent((New-Object Windows.RoutedEventArgs([Windows.Controls.Button]::ClickEvent)))
    if ($script:job -or $script:controls.Details.Text -notmatch 'warning') { throw 'Other version bypassed acknowledgment' }
    $script:controls.VersionConsent.IsChecked=$true;$script:controls.VersionPicker.SelectedIndex=1
    if ($script:controls.VersionConsent.IsChecked -or $script:controls.VersionWarning.Visibility -ne 'Collapsed') { throw 'Selection did not reset acknowledgment' }
    $script:controls.DownloadConsent.IsChecked=$false
    $script:controls.Install.RaiseEvent((New-Object Windows.RoutedEventArgs([Windows.Controls.Button]::ClickEvent)))
    if ($script:job -or (Test-Path $fixture.DownloadLog)) { throw 'Package downloaded before consent' }
    $script:controls.DownloadConsent.IsChecked=$true;$script:controls.DebugConsent.IsChecked=$false;$script:testPhase=2
    $script:controls.Install.RaiseEvent((New-Object Windows.RoutedEventArgs([Windows.Controls.Button]::ClickEvent)))
    if ($script:controls.VersionPicker.IsEnabled -or $script:controls.RefreshVersions.IsEnabled) { throw 'Version selection was not locked during install' }
   } elseif ($script:testPhase -eq 2 -and -not $script:job) {
    if (-not $script:completed) { throw ('Universal install failed: '+$script:controls.Details.Text) }
    if (-not (Test-Path $fixture.DownloadLog)) { throw 'Selected package was never downloaded' }
    if ((Get-Content $fixture.DownloadLog -Raw).Trim() -cne $asset.browser_download_url) { throw 'Wrong version downloaded' }
    if ((Get-Content (Join-Path $env:APPDATA 'Adobe\CEP\extensions\MotionAstra-FX\VERSION') -Raw).Trim() -ne $universalExpectedVersion) { throw 'Wrong payload installed' }
    $script:testPhase=3;$script:driver.Stop()
    $script:controls.Install.RaiseEvent((New-Object Windows.RoutedEventArgs([Windows.Controls.Button]::ClickEvent)))
   }
  } catch {
   $script:testFailure=$_.Exception.Message;$script:driver.Stop()
   if ($script:job) { $script:job.Worker.Stop();$script:job.Worker.Dispose();$script:job=$null }
   if ($script:catalogJob) { $script:catalogJob.Worker.Stop();$script:catalogJob.Worker.Dispose();$script:catalogJob=$null }
   $script:window.Close()
  }
 })
 $script:driver.Start();Show-MotionAstraInstaller;$script:driver.Stop()
 if ($script:testFailure) { throw $script:testFailure };if ($script:testPhase -ne 3) { throw 'Window exited before universal flow completed' }
 Write-Host 'PASS: real universal WPF window, offline/retry, Official default, features-only information, selectable/disabled versions, other-version consent reset, download consent, locked selection, correct download/install and Done.'
} finally { $env:APPDATA=$oldAppData;Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue }
