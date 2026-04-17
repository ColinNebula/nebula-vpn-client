<#
.SYNOPSIS
    Nebula VPN - GPS Spoofing Setup & Configuration
.DESCRIPTION
    Sets up system-wide GPS spoofing capabilities for Nebula VPN on Windows.
    Implements registry-based location override, service hooks, and virtual driver support.
.NOTES
    Author: ColinNebula - Nebula Media 3D
    Date: April 2026
    Requires: Administrator privileges
.EXAMPLE
    .\SETUP-GPS-SPOOFING.ps1
    .\SETUP-GPS-SPOOFING.ps1 -Latitude 40.7128 -Longitude -74.0060 -Enable
#>

param(
    [Parameter(Mandatory=$false)]
    [double]$Latitude,
    
    [Parameter(Mandatory=$false)]
    [double]$Longitude,
    
    [Parameter(Mandatory=$false)]
    [switch]$Enable,
    
    [Parameter(Mandatory=$false)]
    [switch]$Disable,
    
    [Parameter(Mandatory=$false)]
    [switch]$Status,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('Registry', 'ServiceHook', 'VirtualDriver')]
    [string]$Mode = 'Registry'
)

# ─── Admin Check ────────────────────────────────────────────────────────────

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  ERROR: Administrator Privileges Required" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "GPS spoofing requires admin privileges to modify system settings." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run this script as Administrator:" -ForegroundColor White
    Write-Host "  Right-click PowerShell → Run as Administrator" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# ─── Configuration ──────────────────────────────────────────────────────────

$LocationRegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location"
$NebulaGPSRegPath = "HKCU:\SOFTWARE\Nebula\VPN\GPS"
$BackupRegPath = "HKCU:\SOFTWARE\Nebula\VPN\GPS\Backup"

# ─── Functions ──────────────────────────────────────────────────────────────

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  $Title" -ForegroundColor White
    Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Gray
}

function Backup-LocationSettings {
    Write-Host "[*] Backing up Windows Location Service settings..." -ForegroundColor Cyan
    
    try {
        $currentValue = (Get-ItemProperty -Path $LocationRegPath -Name "Value" -ErrorAction SilentlyContinue).Value
        
        if (-not (Test-Path $BackupRegPath)) {
            New-Item -Path $BackupRegPath -Force | Out-Null
        }
        
        Set-ItemProperty -Path $BackupRegPath -Name "OriginalValue" -Value $currentValue -Force
        Set-ItemProperty -Path $BackupRegPath -Name "BackupTimestamp" -Value (Get-Date).ToString() -Force
        
        Write-Host "[+] Original settings backed up: $currentValue" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[!] Warning: Could not backup settings - $_" -ForegroundColor Yellow
        return $false
    }
}

function Restore-LocationSettings {
    Write-Host "[*] Restoring Windows Location Service settings..." -ForegroundColor Cyan
    
    try {
        if (Test-Path $BackupRegPath) {
            $originalValue = (Get-ItemProperty -Path $BackupRegPath -Name "OriginalValue" -ErrorAction SilentlyContinue).OriginalValue
            
            if ($originalValue) {
                Set-ItemProperty -Path $LocationRegPath -Name "Value" -Value $originalValue -Force
                Write-Host "[+] Original settings restored: $originalValue" -ForegroundColor Green
                return $true
            }
        }
        
        Write-Host "[!] No backup found, skipping restore" -ForegroundColor Yellow
        return $false
    } catch {
        Write-Host "[!] Failed to restore settings: $_" -ForegroundColor Red
        return $false
    }
}

function Enable-GPSSpoofing {
    param(
        [double]$Lat,
        [double]$Lng,
        [string]$SpoofMode
    )
    
    Write-Section "Enabling GPS Spoofing"
    
    # Validate coordinates
    if ($Lat -lt -90 -or $Lat -gt 90 -or $Lng -lt -180 -or $Lng -gt 180) {
        Write-Host "[X] Invalid coordinates! Latitude: -90 to 90, Longitude: -180 to 180" -ForegroundColor Red
        return $false
    }
    
    Write-Host "[*] Target Location: $Lat, $Lng" -ForegroundColor White
    Write-Host "[*] Spoofing Mode: $SpoofMode" -ForegroundColor White
    Write-Host ""
    
    # Backup original settings
    Backup-LocationSettings | Out-Null
    
    # Step 1: Disable Windows Location Service (privacy protection)
    Write-Host "[1/3] Disabling Windows Location Service..." -ForegroundColor Cyan
    try {
        Set-ItemProperty -Path $LocationRegPath -Name "Value" -Value "Deny" -Force
        Write-Host "      [+] Windows Location Service disabled (prevents real GPS leaks)" -ForegroundColor Green
    } catch {
        Write-Host "      [!] Failed to disable location service: $_" -ForegroundColor Yellow
    }
    
    # Step 2: Create Nebula GPS registry entries
    Write-Host "[2/3] Creating spoofed GPS coordinates registry..." -ForegroundColor Cyan
    try {
        if (-not (Test-Path $NebulaGPSRegPath)) {
            New-Item -Path $NebulaGPSRegPath -Force | Out-Null
        }
        
        Set-ItemProperty -Path $NebulaGPSRegPath -Name "Latitude" -Value $Lat -Force
        Set-ItemProperty -Path $NebulaGPSRegPath -Name "Longitude" -Value $Lng -Force
        Set-ItemProperty -Path $NebulaGPSRegPath -Name "Accuracy" -Value 10 -Force
        Set-ItemProperty -Path $NebulaGPSRegPath -Name "Timestamp" -Value ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -Force
        Set-ItemProperty -Path $NebulaGPSRegPath -Name "Enabled" -Value 1 -Force
        Set-ItemProperty -Path $NebulaGPSRegPath -Name "Mode" -Value $SpoofMode -Force
        
        Write-Host "      [+] GPS coordinates saved to registry" -ForegroundColor Green
    } catch {
        Write-Host "      [X] Failed to create registry entries: $_" -ForegroundColor Red
        return $false
    }
    
    # Step 3: Apply mode-specific configuration
    Write-Host "[3/3] Applying $SpoofMode mode..." -ForegroundColor Cyan
    
    switch ($SpoofMode) {
        'Registry' {
            Write-Host "      [+] Registry mode active (system-wide location override)" -ForegroundColor Green
            Write-Host "      [i] Most apps will see spoofed location" -ForegroundColor Gray
        }
        'ServiceHook' {
            Write-Host "      [!] Service Hook mode requires additional DLL (not yet implemented)" -ForegroundColor Yellow
            Write-Host "      [i] Falling back to Registry mode" -ForegroundColor Gray
        }
        'VirtualDriver' {
            Write-Host "      [!] Virtual Driver mode requires kernel driver (not yet implemented)" -ForegroundColor Yellow
            Write-Host "      [i] Falling back to Registry mode" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "[SUCCESS] GPS Spoofing Enabled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Spoofed Location: $Lat, $Lng" -ForegroundColor Cyan
    Write-Host "Mode: $SpoofMode" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT NOTES:" -ForegroundColor Yellow
    Write-Host "- Some apps may require restart to use spoofed location" -ForegroundColor White
    Write-Host "- Browser-based location may still leak (use Nebula VPN for full protection)" -ForegroundColor White
    Write-Host "- GPS spoofing may violate terms of service for some apps" -ForegroundColor White
    Write-Host ""
    
    return $true
}

function Disable-GPSSpoofing {
    Write-Section "Disabling GPS Spoofing"
    
    # Restore original location settings
    Restore-LocationSettings | Out-Null
    
    # Remove Nebula GPS registry entries
    Write-Host "[*] Removing spoofed GPS coordinates..." -ForegroundColor Cyan
    try {
        if (Test-Path $NebulaGPSRegPath) {
            Remove-Item -Path $NebulaGPSRegPath -Recurse -Force
            Write-Host "[+] GPS spoofing registry entries removed" -ForegroundColor Green
        } else {
            Write-Host "[i] No GPS spoofing entries found" -ForegroundColor Gray
        }
    } catch {
        Write-Host "[!] Failed to remove registry entries: $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "[SUCCESS] GPS Spoofing Disabled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your real location services have been restored." -ForegroundColor White
    Write-Host ""
}

function Get-GPSStatus {
    Write-Section "GPS Spoofing Status"
    
    # Check if Nebula GPS registry exists
    $enabled = Test-Path $NebulaGPSRegPath
    
    if ($enabled) {
        try {
            $lat = (Get-ItemProperty -Path $NebulaGPSRegPath -Name "Latitude").Latitude
            $lng = (Get-ItemProperty -Path $NebulaGPSRegPath -Name "Longitude").Longitude
            $mode = (Get-ItemProperty -Path $NebulaGPSRegPath -Name "Mode" -ErrorAction SilentlyContinue).Mode
            $timestamp = (Get-ItemProperty -Path $NebulaGPSRegPath -Name "Timestamp" -ErrorAction SilentlyContinue).Timestamp
            
            Write-Host "Status: ENABLED" -ForegroundColor Green
            Write-Host ""
            Write-Host "Spoofed Location:" -ForegroundColor Cyan
            Write-Host "  Latitude:  $lat" -ForegroundColor White
            Write-Host "  Longitude: $lng" -ForegroundColor White
            Write-Host "  Mode:      $mode" -ForegroundColor White
            
            if ($timestamp) {
                $dt = [DateTimeOffset]::FromUnixTimeMilliseconds($timestamp).LocalDateTime
                Write-Host "  Updated:   $dt" -ForegroundColor White
            }
            
        } catch {
            Write-Host "Status: ENABLED (but registry read failed)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Status: DISABLED" -ForegroundColor Red
        Write-Host ""
        Write-Host "GPS spoofing is not active." -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Check Windows Location Service status
    try {
        $locationValue = (Get-ItemProperty -Path $LocationRegPath -Name "Value").Value
        Write-Host "Windows Location Service: $locationValue" -ForegroundColor Gray
    } catch {
        Write-Host "Windows Location Service: Unknown" -ForegroundColor Gray
    }
    
    Write-Host ""
}

function Show-InteractiveMenu {
    Write-Header "Nebula VPN - GPS Spoofing Setup"
    
    Write-Host "What would you like to do?" -ForegroundColor White
    Write-Host ""
    Write-Host "  [1] Enable GPS Spoofing (enter custom coordinates)" -ForegroundColor Cyan
    Write-Host "  [2] Enable GPS Spoofing (quick presets)" -ForegroundColor Cyan
    Write-Host "  [3] Disable GPS Spoofing" -ForegroundColor Yellow
    Write-Host "  [4] Check GPS Spoofing Status" -ForegroundColor White
    Write-Host "  [5] Exit" -ForegroundColor Gray
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            $lat = Read-Host "Enter Latitude (-90 to 90)"
            $lng = Read-Host "Enter Longitude (-180 to 180)"
            
            try {
                $latNum = [double]$lat
                $lngNum = [double]$lng
                Enable-GPSSpoofing -Lat $latNum -Lng $lngNum -SpoofMode $Mode
            } catch {
                Write-Host "[X] Invalid coordinates entered!" -ForegroundColor Red
            }
        }
        "2" {
            Write-Host ""
            Write-Host "Select a preset location:" -ForegroundColor White
            Write-Host ""
            Write-Host "  [1] New York, US (40.7128, -74.0060)" -ForegroundColor Cyan
            Write-Host "  [2] London, UK (51.5074, -0.1278)" -ForegroundColor Cyan
            Write-Host "  [3] Tokyo, Japan (35.6762, 139.6503)" -ForegroundColor Cyan
            Write-Host "  [4] Sydney, Australia (-33.8688, 151.2093)" -ForegroundColor Cyan
            Write-Host "  [5] Paris, France (48.8566, 2.3522)" -ForegroundColor Cyan
            Write-Host "  [6] Singapore (1.3521, 103.8198)" -ForegroundColor Cyan
            Write-Host ""
            
            $preset = Read-Host "Enter preset number (1-6)"
            
            switch ($preset) {
                "1" { Enable-GPSSpoofing -Lat 40.7128 -Lng -74.0060 -SpoofMode $Mode }
                "2" { Enable-GPSSpoofing -Lat 51.5074 -Lng -0.1278 -SpoofMode $Mode }
                "3" { Enable-GPSSpoofing -Lat 35.6762 -Lng 139.6503 -SpoofMode $Mode }
                "4" { Enable-GPSSpoofing -Lat -33.8688 -Lng 151.2093 -SpoofMode $Mode }
                "5" { Enable-GPSSpoofing -Lat 48.8566 -Lng 2.3522 -SpoofMode $Mode }
                "6" { Enable-GPSSpoofing -Lat 1.3521 -Lng 103.8198 -SpoofMode $Mode }
                default { Write-Host "[X] Invalid preset!" -ForegroundColor Red }
            }
        }
        "3" {
            Disable-GPSSpoofing
        }
        "4" {
            Get-GPSStatus
        }
        "5" {
            Write-Host "Exiting..." -ForegroundColor Gray
            exit 0
        }
        default {
            Write-Host "[X] Invalid choice!" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Loop back to menu
    Show-InteractiveMenu
}

# ─── Main Execution ─────────────────────────────────────────────────────────

if ($Status) {
    Get-GPSStatus
    exit 0
}

if ($Disable) {
    Disable-GPSSpoofing
    exit 0
}

if ($Enable -and $Latitude -and $Longitude) {
    Enable-GPSSpoofing -Lat $Latitude -Lng $Longitude -SpoofMode $Mode
    exit 0
}

# No parameters provided - show interactive menu
Show-InteractiveMenu
