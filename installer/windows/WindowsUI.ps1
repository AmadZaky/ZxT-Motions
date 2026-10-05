# Windows PowerShell 5.1 / WPF. UI stays on the STA thread; file work uses a runspace.
$ErrorActionPreference = 'Stop'
$script:InstallerUiRoot = $PSScriptRoot
function New-MotionAstraWindow {
    Add-Type -AssemblyName PresentationFramework,PresentationCore,WindowsBase
    [xml]$markup = Get-Content -LiteralPath (Join-Path $script:InstallerUiRoot 'Window.xaml') -Raw -Encoding UTF8
    $reader = New-Object System.Xml.XmlNodeReader $markup
    try { return [Windows.Markup.XamlReader]::Load($reader) } finally { $reader.Close() }
}
function Start-MotionAstraJob {
    param([string]$Backend,[string]$Payload,[string]$ExtensionRoot,[string]$BackupRoot,[string[]]$OtherRoots,[hashtable]$State,[bool]$EnableDebug,[string]$OnlineVersion="")
    $worker = [PowerShell]::Create()
    [void]$worker.AddScript({
        param($backend,$payload,$extensionRoot,$backupRoot,$otherRoots,$state,$enableDebug,$onlineVersion)
        $ErrorActionPreference = 'Stop'
        $downloadRoot=$null
        try {
            . $backend
            if (Get-Process AfterFX -ErrorAction SilentlyContinue) { throw 'Close After Effects, then try again.' }
            if ($onlineVersion) {
                . (Join-Path (Split-Path $backend) 'Download.ps1')
                $downloadRoot=Join-Path ([IO.Path]::GetTempPath()) ('MotionAstra-Download-'+[Guid]::NewGuid().ToString('N'))
                New-Item -ItemType Directory -Path $downloadRoot | Out-Null
                $state.Downloading=$true
                try { $payload=Get-MotionAstraOnlinePayload $onlineVersion $downloadRoot $state } finally { $state.Downloading=$false }
            }
            $confirm = {
                param([string[]]$paths)
                $state.Answer = $null
                $state.Pending = @($paths)
                while ($null -eq $state.Answer) { Start-Sleep -Milliseconds 100 }
                return [bool]$state.Answer
            }
            $progress = { param($value,$message); $state.Percent=20+$value*0.8; $state.Message=$message }
            $installed = Install-MotionAstra $payload $extensionRoot $backupRoot $otherRoots $confirm $progress
            if (-not $installed) { $state.Cancelled=$true; $state.Message='Update cancelled. Existing files are unchanged.'; return }
            $state.Installed=$true
            if ($enableDebug) { Enable-MotionAstraCEP }
            $state.Percent=100
            $state.Success=$true
            $state.Message='ZxT-Motions is ready.'
        } catch {
            $state.Error=$_.Exception.Message
            if ($state.Installed) { $state.Error='Files installed, but CEP preference setup failed. Enable PlayerDebugMode manually using the guide. ' + $state.Error }
        } finally { if ($downloadRoot -and (Test-Path -LiteralPath $downloadRoot)) { Remove-Item -LiteralPath $downloadRoot -Recurse -Force -ErrorAction SilentlyContinue }; $state.Done=$true }
    }.ToString())
    foreach ($arg in @($Backend,$Payload,$ExtensionRoot,$BackupRoot)) { [void]$worker.AddArgument($arg) }
    [void]$worker.AddArgument($OtherRoots)
    [void]$worker.AddArgument($State)
    [void]$worker.AddArgument($EnableDebug)
    [void]$worker.AddArgument($OnlineVersion)
    $handle=$worker.BeginInvoke()
    return @{ Worker=$worker; Handle=$handle; State=$State }
}
# Metadata work stays off the WPF thread. It never downloads or executes a plugin package.
function Start-MotionAstraCatalogJob([string]$Download,[hashtable]$State) {
    $worker=[PowerShell]::Create()
    [void]$worker.AddScript({
        param($download,$state)
        try { . $download;$state.Catalog=Get-MotionAstraReleaseCatalog }
        catch { $state.Error=$_.Exception.Message }
        finally { $state.Done=$true }
    }.ToString()).AddArgument($Download).AddArgument($State)
    return @{Worker=$worker;Handle=$worker.BeginInvoke();State=$State}
}
function Update-MotionAstraVersionSelection {
    $item=$script:controls.VersionPicker.SelectedItem
    $script:selectedRelease=$null
    $script:controls.VersionConsent.IsChecked=$false
    if (-not $item) { return }
    $row=$item.Tag;$script:selectedRelease=$row
    $script:controls.VersionLabel.Text='VERSION '+$row.Tag
    $script:controls.VersionFeatures.Text=$row.Features
    $script:controls.VersionWarning.Visibility='Collapsed'
    $script:controls.VersionConsent.Visibility='Collapsed'
    if (-not $row.Recommended) {
        $script:controls.VersionWarning.Text='This is not the latest Official release. It may contain unresolved bugs, lack current fixes, or behave differently with projects and saved settings.'
        if ($row.Prerelease) { $script:controls.VersionWarning.Text='Experimental version: '+$script:controls.VersionWarning.Text }
        $script:controls.VersionWarning.Visibility='Visible'
        $script:controls.VersionConsent.Visibility='Visible'
    }
    if (-not $row.Available) { $script:controls.Details.Text=$row.Reason }
    else { $script:controls.Details.Text='' }
    $script:controls.Install.IsEnabled=[bool]$row.Available
}
function Refresh-MotionAstraVersions {
    if ($script:catalogJob -or $script:job -or $script:completed) { return }
    $script:preferredTag=$(if ($script:selectedRelease) { $script:selectedRelease.Tag } else { '' })
    $script:controls.VersionPicker.IsEnabled=$false
    $script:controls.RefreshVersions.IsEnabled=$false
    $script:controls.Install.IsEnabled=$false
    $script:controls.Status.Text='Loading available versions...'
    $script:controls.Details.Text=''
    $state=[hashtable]::Synchronized(@{Done=$false;Error=$null;Catalog=$null})
    $script:catalogJob=Start-MotionAstraCatalogJob -Download (Join-Path $script:InstallerUiRoot 'Download.ps1') -State $state
    $script:timer.Start()
}
function Complete-MotionAstraCatalog {
    $s=$script:catalogJob.State
    if (-not $s.Done -or -not $script:catalogJob.Handle.IsCompleted) { return }
    try { [void]$script:catalogJob.Worker.EndInvoke($script:catalogJob.Handle) } catch { $s.Error=$_.Exception.Message }
    $script:catalogJob.Worker.Dispose();$script:catalogJob=$null
    if (-not $script:job) { $script:timer.Stop() }
    $script:controls.RefreshVersions.IsEnabled=$true
    $script:controls.VersionPicker.Items.Clear()
    if ($s.Error) {
        $script:selectedRelease=$null;$script:controls.Status.Text='Could not load versions.'
        $script:controls.Details.Text='Check your internet connection, then select Refresh. '+$s.Error
        $script:controls.Install.IsEnabled=$false;return
    }
    $chosen=$null;$fallback=$null;$preferred=$null
    foreach ($row in $s.Catalog.Releases) {
        $item=New-Object Windows.Controls.ComboBoxItem
        $item.Content=$row.Tag;$item.Tag=$row;$item.IsEnabled=[bool]$row.Available
        if (-not $row.Available) { $item.Content+=' (unavailable)';$item.ToolTip=$row.Reason }
        [void]$script:controls.VersionPicker.Items.Add($item)
        if ($row.Available) {
            if (-not $fallback) { $fallback=$item }
            if ($row.Recommended) { $chosen=$item }
            if ($row.Tag -ceq $script:preferredTag) { $preferred=$item }
        }
    }
    $script:controls.VersionPicker.IsEnabled=$true
    if ($preferred) { $chosen=$preferred } elseif (-not $chosen) { $chosen=$fallback }
    if ($chosen) {
        $script:controls.VersionPicker.SelectedItem=$chosen
        Update-MotionAstraVersionSelection
        $script:controls.Status.Text='Choose a version, then Install / Update.'
    } else { $script:controls.Status.Text='No verified installer package is available.';$script:controls.Install.IsEnabled=$false }
}

function Show-MotionAstraInstaller {
    $script:window=New-MotionAstraWindow
    $script:controls=@{}
    foreach ($name in @('DownloadConsent','VersionLabel','Heading','Destination','DebugConsent','Status','Progress','Details','Cancel','Install','VersionSection','VersionPicker','VersionFeatures','VersionWarning','VersionConsent','RefreshVersions')) {
        $script:controls[$name]=$script:window.FindName($name)
    }
    $script:packageRoot=Split-Path $script:InstallerUiRoot
    $script:payload=Join-Path $script:packageRoot 'MotionAstra-FX'
    $script:extensionRoot=Join-Path $env:APPDATA 'Adobe\CEP\extensions'
    $script:backupRoot=Join-Path $env:APPDATA 'MotionAstra Backups'
    $script:otherRoots=@()
    foreach ($common in @(${env:CommonProgramFiles(x86)},$env:CommonProgramFiles)) {
        if ($common) { $script:otherRoots += Join-Path $common 'Adobe\CEP\extensions' }
    }
    $script:controls.Destination.Text=Join-Path $script:extensionRoot 'MotionAstra-FX'
    $script:job=$null
    $script:completed=$false
    $script:onlineVersion=''
    $script:catalogJob=$null;$script:selectedRelease=$null
    $modeFile=Join-Path $script:InstallerUiRoot 'SetupMode.txt'
    $script:universalMode=(Test-Path -LiteralPath $modeFile) -and ((Get-Content -LiteralPath $modeFile -Raw).Trim() -ceq 'universal')
    $script:controls.VersionSection.Visibility='Collapsed'
    if ($script:universalMode) { $script:controls.VersionSection.Visibility='Visible';$script:controls.Install.IsEnabled=$false }
    $script:controls.DownloadConsent.Visibility='Collapsed'
    if ($script:universalMode) { $script:controls.DownloadConsent.Visibility='Visible' }
    try {
        if ($script:universalMode) { $version='Universal' } else { $version=(Get-Content -LiteralPath (Join-Path $script:payload 'VERSION') -Raw).Trim() }
        $script:controls.VersionLabel.Text=$(if ($script:universalMode) { 'UNIVERSAL WINDOWS SETUP' } else { 'VERSION '+$version })
        . (Join-Path $script:InstallerUiRoot 'Backend.ps1')
        foreach ($root in (@($script:extensionRoot)+$script:otherRoots)) {
            if (Test-Path -LiteralPath $root) {
                foreach ($folder in @(Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue)) {
                    if (Test-MotionAstraOwned $folder.FullName) { $script:controls.Install.Content='Update'; $script:controls.Status.Text='An existing version is installed.' }
                }
            }
        }
    } catch { $script:controls.Details.Text='Extract the entire release ZIP before installing. '+$_.Exception.Message; $script:controls.Install.IsEnabled=$false }
    $script:timer=New-Object Windows.Threading.DispatcherTimer
    $script:timer.Interval=[TimeSpan]::FromMilliseconds(120)
    $script:timer.Add_Tick({
        if ($script:catalogJob) { Complete-MotionAstraCatalog }
        if (-not $script:job) { return }
        $s=$script:job.State
        $script:controls.Progress.IsIndeterminate=[bool]$s.Downloading
        $script:controls.Progress.Value=$s.Percent
        $script:controls.Status.Text=$s.Message
        if ($null -ne $s.Pending) {
            $paths=$s.Pending; $s.Pending=$null
            $answer=[Windows.MessageBox]::Show($script:window, "Replace these ZxT-Motions / MotionAstra versions?`n`n"+($paths -join "`n")+"`n`nBackups will be kept in:`n"+$script:backupRoot, 'Update ZxT-Motions', 'YesNo', 'Question', 'No')
            $s.Answer=$answer -eq [Windows.MessageBoxResult]::Yes
        }
        if ($s.Done -and $script:job.Handle.IsCompleted) {
            try { [void]$script:job.Worker.EndInvoke($script:job.Handle) }
            catch { $s.Error=$_.Exception.Message }
            $script:job.Worker.Dispose(); $script:job=$null
            $script:timer.Stop()
            $script:controls.Install.IsEnabled=$true
            $script:controls.Cancel.IsEnabled=$true
            $script:controls.DebugConsent.IsEnabled=$true
            $script:controls.DownloadConsent.IsEnabled=$true
            $script:controls.VersionConsent.IsEnabled=$true
            $script:controls.VersionPicker.IsEnabled=$true
            $script:controls.RefreshVersions.IsEnabled=$true
            if ($s.Error) {
                $script:controls.Heading.Text='Setup needs your attention.'
                $script:controls.Status.Text='Installation could not finish.'
                $script:controls.Details.Text=$s.Error
                $script:controls.Install.Content='Try again'
            } elseif ($s.Success) {
                $script:controls.Progress.IsIndeterminate=$false
                $script:controls.Progress.Value=100
                $script:completed=$true
                $script:controls.Heading.Text='Ready. Set. Create.'
                $script:controls.Install.Content='Done'
                $script:controls.Cancel.Visibility='Collapsed'
                $script:controls.Details.Text="Restart After Effects, then open the installed version from Window > Extensions.`n`nPrevious versions, if any, are saved in: $script:backupRoot"
                if (-not $script:controls.DebugConsent.IsChecked) { $script:controls.Details.Text += "`nUnsigned panels were not enabled. See the installation guide if the panel is hidden." }
            } else {
                $script:controls.Install.Content='Install / Update'
                $script:controls.Progress.Value=0
            }
        }
    })
    $script:controls.Install.Add_Click({
        if ($script:completed) { $script:window.Close(); return }
        if (($script:universalMode -or $script:onlineVersion) -and -not $script:controls.DownloadConsent.IsChecked) { $script:controls.Details.Text='Please consent to downloading and installing ZxT-Motions before continuing.'; return }
        if ($script:universalMode) {
            if ($script:catalogJob -or -not $script:selectedRelease -or -not $script:selectedRelease.Available) { $script:controls.Details.Text='Choose an available version first.';return }
            if (-not $script:selectedRelease.Recommended -and -not $script:controls.VersionConsent.IsChecked) { $script:controls.Details.Text='Confirm the other-version warning before downloading this release.';return }
            $script:onlineVersion=$script:selectedRelease.Tag
        }
        $script:controls.Install.IsEnabled=$false; $script:controls.Cancel.IsEnabled=$false; $script:controls.DebugConsent.IsEnabled=$false
        $script:controls.DownloadConsent.IsEnabled=$false;$script:controls.VersionConsent.IsEnabled=$false
        $script:controls.VersionPicker.IsEnabled=$false;$script:controls.RefreshVersions.IsEnabled=$false
        $script:controls.Details.Text='Please keep this window open while setup finishes.'
        $state=[hashtable]::Synchronized(@{Percent=0;Message='Preparing setup...';Pending=$null;Answer=$null;Done=$false;Success=$false;Cancelled=$false;Installed=$false;Error=$null})
        $script:job=Start-MotionAstraJob -Backend (Join-Path $script:InstallerUiRoot 'Backend.ps1') -Payload $script:payload -ExtensionRoot $script:extensionRoot -BackupRoot $script:backupRoot -OtherRoots $script:otherRoots -State $state -EnableDebug ([bool]$script:controls.DebugConsent.IsChecked) -OnlineVersion $script:onlineVersion
        $script:timer.Start()
    })
    $script:controls.VersionPicker.Add_SelectionChanged({ Update-MotionAstraVersionSelection })
    $script:controls.RefreshVersions.Add_Click({ Refresh-MotionAstraVersions })
    $script:window.Add_Loaded({ if ($script:universalMode) { Refresh-MotionAstraVersions } })
    $script:controls.Cancel.Add_Click({ $script:window.Close() })
    $script:window.Add_Closing({ param($sender,$eventArgs); if ($script:job) { $eventArgs.Cancel=$true } elseif ($script:catalogJob) { $script:catalogJob.Worker.Stop();$script:catalogJob.Worker.Dispose();$script:catalogJob=$null;$script:timer.Stop() } })
    [void]$script:window.ShowDialog()
}
if ($MyInvocation.InvocationName -ne '.') {
    try { Show-MotionAstraInstaller; exit 0 }
    catch { Add-Type -AssemblyName PresentationFramework; [void][Windows.MessageBox]::Show($_.Exception.Message,'ZxT-Motions Setup'); exit 1 }
}
