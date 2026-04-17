<#
.SYNOPSIS
    Test GPS Spoofing Implementation
.DESCRIPTION
    Verifies that GPS spoofing is working correctly on Windows.
    Tests registry settings, location service status, and spoofed coordinates.
.NOTES
    Author: ColinNebula
    Date: April 2026
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Nebula VPN - GPS Spoofing Verification Test" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Test-RegistryValue {
    param(
        [string]$Path,
        [string]$Name,
        [string]$ExpectedValue = $null
    )
    
    try {
        $value = (Get-ItemProperty -Path $Path -Name $Name -ErrorAction Stop).$Name
        if ($ExpectedValue -and $value -ne $ExpectedValue) {
            return @{ Success = $false; Value = $value; Expected = $ExpectedValue }
        }
        return @{ Success = $true; Value = $value }
    } catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# ─── Test 1: Admin Privileges ─────────────────────────────────────────────

Write-Host "[Test 1] Checking for Administrator privileges..." -ForegroundColor Cyan

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "         [PASS] Running with Administrator privileges" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "         [WARN] Not running as Administrator (some tests may fail)" -ForegroundColor Yellow
}

# ─── Test 2: GPS Module Exists ─────────────────────────────────────────────

Write-Host "[Test 2] Checking if GPS spoofing module exists..." -ForegroundColor Cyan

$gpsModulePath = Join-Path $PSScriptRoot "electron\gps-spoofer.js"

if (Test-Path $gpsModulePath) {
    Write-Host "         [PASS] GPS module found: $gpsModulePath" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "         [FAIL] GPS module not found!" -ForegroundColor Red
    $testsFailed++
}

# ─── Test 3: Windows Location Service Status ───────────────────────────────

Write-Host "[Test 3] Checking Windows Location Service status..." -ForegroundColor Cyan

$locationPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location"
$locationTest = Test-RegistryValue -Path $locationPath -Name "Value"

if ($locationTest.Success) {
    Write-Host "         [INFO] Location Service: $($locationTest.Value)" -ForegroundColor Gray
    
    if ($locationTest.Value -eq "Deny") {
        Write-Host "         [PASS] Location Service is disabled (privacy protected)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "         [INFO] Location Service is enabled (may leak real location)" -ForegroundColor Yellow
    }
} else {
    Write-Host "         [WARN] Could not read Location Service status" -ForegroundColor Yellow
}

# ─── Test 4: Nebula GPS Registry Entries ───────────────────────────────────

Write-Host "[Test 4] Checking Nebula GPS registry entries..." -ForegroundColor Cyan

$nebulaGpsPath = "HKCU:\SOFTWARE\Nebula\VPN\GPS"

if (Test-Path $nebulaGpsPath) {
    Write-Host "         [PASS] Nebula GPS registry key exists" -ForegroundColor Green
    $testsPassed++
    
    # Check individual values
    $lat = Test-RegistryValue -Path $nebulaGpsPath -Name "Latitude"
    $lng = Test-RegistryValue -Path $nebulaGpsPath -Name "Longitude"
    $enabled = Test-RegistryValue -Path $nebulaGpsPath -Name "Enabled"
    
    if ($lat.Success -and $lng.Success) {
        Write-Host "         [INFO] Spoofed Coordinates: $($lat.Value), $($lng.Value)" -ForegroundColor Cyan
        
        # Validate coordinate ranges
        $latNum = [double]$lat.Value
        $lngNum = [double]$lng.Value
        
        if ($latNum -ge -90 -and $latNum -le 90 -and $lngNum -ge -180 -and $lngNum -le 180) {
            Write-Host "         [PASS] Coordinates are valid" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "         [FAIL] Coordinates out of range!" -ForegroundColor Red
            $testsFailed++
        }
    } else {
        Write-Host "         [FAIL] Missing coordinate values!" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($enabled.Success) {
        if ([int]$enabled.Value -eq 1) {
            Write-Host "         [PASS] GPS spoofing is ENABLED" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "         [INFO] GPS spoofing is DISABLED" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "         [INFO] Nebula GPS not configured (not an error)" -ForegroundColor Gray
}

# ─── Test 5: PowerShell Setup Script ──────────────────────────────────────

Write-Host "[Test 5] Checking GPS setup script..." -ForegroundColor Cyan

$setupScriptPath = Join-Path $PSScriptRoot "SETUP-GPS-SPOOFING.ps1"

if (Test-Path $setupScriptPath) {
    Write-Host "         [PASS] Setup script found: $setupScriptPath" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "         [FAIL] Setup script not found!" -ForegroundColor Red
    $testsFailed++
}

# ─── Test 6: Electron Preload GPS API ─────────────────────────────────────

Write-Host "[Test 6] Checking Electron preload GPS API..." -ForegroundColor Cyan

$preloadPath = Join-Path $PSScriptRoot "electron\preload.js"

if (Test-Path $preloadPath) {
    $preloadContent = Get-Content $preloadPath -Raw
    
    if ($preloadContent -match "gpsApi" -and $preloadContent -match "gps:") {
        Write-Host "         [PASS] GPS API exposed in preload.js" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "         [FAIL] GPS API not found in preload.js!" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "         [FAIL] preload.js not found!" -ForegroundColor Red
    $testsFailed++
}

# ─── Test 7: React GPS Component ──────────────────────────────────────────

Write-Host "[Test 7] Checking React GPS Override component..." -ForegroundColor Cyan

$gpsComponentPath = Join-Path $PSScriptRoot "src\components\GPSOverride\index.js"

if (Test-Path $gpsComponentPath) {
    $componentContent = Get-Content $gpsComponentPath -Raw
    
    if ($componentContent -match "window\.electron\.gps" -and $componentContent -match "toggleSystemGPS") {
        Write-Host "         [PASS] GPS Override component updated with system GPS support" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "         [WARN] GPS Override component may need updates" -ForegroundColor Yellow
    }
} else {
    Write-Host "         [FAIL] GPS Override component not found!" -ForegroundColor Red
    $testsFailed++
}

# ─── Test 8: Documentation ────────────────────────────────────────────────

Write-Host "[Test 8] Checking GPS spoofing documentation..." -ForegroundColor Cyan

$docPath = Join-Path $PSScriptRoot "GPS-SPOOFING-GUIDE.md"

if (Test-Path $docPath) {
    Write-Host "         [PASS] Documentation found: GPS-SPOOFING-GUIDE.md" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "         [WARN] Documentation not found" -ForegroundColor Yellow
}

# ─── Test Summary ──────────────────────────────────────────────────────────

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "[SUCCESS] All critical tests passed! GPS spoofing is ready to use." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\SETUP-GPS-SPOOFING.ps1" -ForegroundColor White
    Write-Host "  2. Launch Nebula VPN with admin privileges" -ForegroundColor White
    Write-Host "  3. Enable GPS spoofing in Settings → GPS Override" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[WARNING] Some tests failed. GPS spoofing may not work correctly." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  - Ensure you're running as Administrator" -ForegroundColor White
    Write-Host "  - Check that all files are present" -ForegroundColor White
    Write-Host "  - Review GPS-SPOOFING-GUIDE.md for setup instructions" -ForegroundColor White
    Write-Host ""
}

# ─── Verbose Output ────────────────────────────────────────────────────────

if ($Verbose) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host "  Detailed Registry Information" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host ""
    
    if (Test-Path $nebulaGpsPath) {
        Write-Host "Nebula GPS Registry Entries:" -ForegroundColor Cyan
        Get-ItemProperty -Path $nebulaGpsPath | Format-List
    }
    
    Write-Host ""
    Write-Host "Windows Location Service:" -ForegroundColor Cyan
    Get-ItemProperty -Path $locationPath | Format-List
}

Write-Host ""
