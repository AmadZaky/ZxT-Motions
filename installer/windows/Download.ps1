# Universal online setup. Public metadata loads independently; package download requires UI consent.
$script:MotionAstraRepository='https://api.github.com/repos/AmadZaky/ZxT-Motions'
function ConvertTo-MotionAstraPackageVersion([string]$Tag) {
    if ($Tag -notmatch '^v(\d+\.\d+(?:\.\d+)?)(?:-[A-Za-z0-9.-]+)?$') { throw 'This release has no supported version identity.' }
    $version=$Matches[1];if ($version.Split('.').Count -eq 2) { $version+='.0' };return $version
}
function Get-MotionAstraReleasePackage($Release,[string]$Tag) {
    [void](ConvertTo-MotionAstraPackageVersion $Tag)
    if ($Release.tag_name -cne $Tag -or $Release.draft) { throw 'Unexpected GitHub release.' }
    $suffix=$Tag.Substring(1)+'.zip'
    $names=@(('ZxT-Motions_v'+$suffix),('MotionAstra_FX_v'+$suffix))
    $assets=@($Release.assets | Where-Object { $names -ccontains $_.name })
    if ($assets.Count -ne 1) { throw 'No unambiguous installer package is available for this version.' }
    $asset=$assets[0]
    $expected='https://github.com/AmadZaky/ZxT-Motions/releases/download/'+$Tag+'/'+$asset.name
    if ($asset.state -ne 'uploaded' -or $asset.browser_download_url -cne $expected -or $asset.digest -notmatch '^sha256:[a-fA-F0-9]{64}$' -or $asset.size -le 0 -or $asset.size -gt 536870912) { throw 'Release URL, checksum or size is invalid. Download refused.' }
    return $asset
}
function Get-MotionAstraReleaseFeatures($Release) {
    $lines=@([string]$Release.body -split '\r?\n' | Where-Object { $_ -match '^\s*[-*]\s+\S' } | Select-Object -First 12)
    if (-not $lines.Count) { return 'Feature details are not listed for this version.' }
    $features=@($lines | ForEach-Object { $text=$_ -replace '^\s*[-*]\s+','';$text=$text -replace '\[([^\]]+)\]\([^)]+\)','$1';$text=$text -replace '[`*_~]','';([string][char]0x2022)+' '+$text })
    return ($features -join "`n")
}
function Get-MotionAstraReleaseCatalog {
    [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
    $headers=@{'User-Agent'='ZxT-Motions-Setup';'Accept'='application/vnd.github+json'}
    $latest=$null
    try { $latest=Invoke-RestMethod -Uri ($script:MotionAstraRepository+'/releases/latest') -Headers $headers -TimeoutSec 30 }
    catch { if (-not $_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne 404) { throw } }
    $rows=@();$page=1
    do {
        $batch=@(Invoke-RestMethod -Uri ($script:MotionAstraRepository+'/releases?per_page=100&page='+$page) -Headers $headers -TimeoutSec 30)
        foreach ($release in $batch) {
            if ($release.draft) { continue }
            $reason='';$version='';$available=$false
            try { $version=ConvertTo-MotionAstraPackageVersion $release.tag_name;[void](Get-MotionAstraReleasePackage $release $release.tag_name);$available=$true } catch { $reason=$_.Exception.Message }
            $rows += [pscustomobject]@{Tag=[string]$release.tag_name;Version=$version;Features=(Get-MotionAstraReleaseFeatures $release);Available=$available;Reason=$reason;Prerelease=[bool]$release.prerelease;Recommended=([bool]$latest -and $release.tag_name -ceq $latest.tag_name -and -not $release.prerelease)}
        }
        $page++
        if ($page -gt 50 -and $batch.Count -eq 100) { throw 'Too many release pages. Please retry or download from GitHub directly.' }
    } while ($batch.Count -eq 100)
    return [pscustomobject]@{Releases=$rows;LatestTag=$(if ($latest) { [string]$latest.tag_name } else { '' })}
}

function Expand-MotionAstraDownload([string]$Zip,[string]$Destination,[string]$Digest,[long]$Size) {
    if ((Get-Item -LiteralPath $Zip).Length -ne $Size) { throw 'Incomplete download. Retry with an internet connection.' }
    if ((Get-FileHash -LiteralPath $Zip -Algorithm SHA256).Hash -ine $Digest.Substring(7)) { throw 'Download checksum mismatch. No installation changes made.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive=[IO.Compression.ZipFile]::OpenRead($Zip)
    try {
        $total=0L;$seen=@{};$plan=@()
        if ($archive.Entries.Count -gt 5000) { throw 'Too many archive entries.' }
        foreach ($entry in $archive.Entries) {
            $name=$entry.FullName.Replace('\','/')
            if ($name -match '(^/|:|(^|/)\.\.(/|$))' -or (($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960) { throw 'Unsafe archive entry.' }
            if (-not $name.StartsWith('MotionAstra-FX/')) { continue }
            if ($name.EndsWith('/')) { continue }
            if ($seen.ContainsKey($name)) { throw 'Duplicate archive path.' };$seen[$name]=$true
            $total += $entry.Length
            if ($total -gt 536870912) { throw 'Expanded package exceeds size limit.' }
            $target=[IO.Path]::GetFullPath((Join-Path $Destination $name))
            $prefix=[IO.Path]::GetFullPath($Destination).TrimEnd('\')+'\'
            if (-not $target.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe archive path.' }
            $plan+=@{Entry=$entry;Target=$target}
        }
        foreach ($item in $plan) {
            New-Item -ItemType Directory -Force -Path (Split-Path $item.Target) | Out-Null
            [IO.Compression.ZipFileExtensions]::ExtractToFile($item.Entry,$item.Target,$false)
        }
    } finally { $archive.Dispose() }
    return (Join-Path $Destination 'MotionAstra-FX')
}
# Only called after the complete ZIP passes its published SHA256/size checks.
# Early legacy releases omit VERSION/internal checksums; synthesize them from the verified archive.
function Initialize-MotionAstraDownloadedPayload([string]$Payload,[string]$Version) {
    foreach ($name in @('CSXS\manifest.xml','index.html','jsx\hostscript.jsx','jsx\presets-data.jsx')) {
        if (-not (Test-Path -LiteralPath (Join-Path $Payload $name) -PathType Leaf)) { throw ('This version is incompatible with this installer: missing '+$name+'. Existing installation is unchanged.') }
    }
    [xml]$manifest=Get-Content -LiteralPath (Join-Path $Payload 'CSXS\manifest.xml') -Raw
    if ($manifest.ExtensionManifest.ExtensionBundleId -cne 'com.motionastra.fx' -or [string]$manifest.ExtensionManifest.ExtensionBundleVersion -cne $Version) { throw 'Downloaded extension identity/version does not match the selected release.' }
    $versionFile=Join-Path $Payload 'VERSION'
    if (Test-Path -LiteralPath $versionFile) {
        if ((Get-Content -LiteralPath $versionFile -Raw).Trim() -cne $Version) { throw 'Downloaded version does not match the selected release.' }
    } else { Set-Content -LiteralPath $versionFile -Value $Version -Encoding ASCII }
    $sums=Join-Path $Payload 'SHA256SUMS'
    if (-not (Test-Path -LiteralPath $sums)) {
        $lines=@(Get-ChildItem -LiteralPath $Payload -Recurse -File | ForEach-Object { (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()+'  '+$_.FullName.Substring($Payload.Length+1).Replace('\','/') })
        Set-Content -LiteralPath $sums -Value $lines -Encoding ASCII
    }
}
function Get-MotionAstraOnlinePayload([string]$Tag,[string]$Workspace,[hashtable]$State) {
    $version=ConvertTo-MotionAstraPackageVersion $Tag
    [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
    $State.Message='Checking selected release...';$State.Percent=2
    $release=Invoke-RestMethod -Uri ($script:MotionAstraRepository+'/releases/tags/'+[Uri]::EscapeDataString($Tag)) -Headers @{'User-Agent'='ZxT-Motions-Setup';'Accept'='application/vnd.github+json'} -TimeoutSec 30
    $asset=Get-MotionAstraReleasePackage $release $Tag
    $State.Message='Downloading ZxT-Motions '+$Tag+'...';$State.Percent=5
    $zip=Join-Path $Workspace 'package.zip'
    Invoke-WebRequest -UseBasicParsing -Uri $asset.browser_download_url -OutFile $zip -TimeoutSec 180 | Out-Null
    $State.Message='Verifying selected package...';$State.Percent=15
    $payload=Expand-MotionAstraDownload $zip (Join-Path $Workspace 'unpacked') $asset.digest $asset.size
    Initialize-MotionAstraDownloadedPayload $payload $version
    return $payload
}
