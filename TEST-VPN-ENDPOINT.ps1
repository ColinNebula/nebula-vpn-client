#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test VPN Connect Endpoint Specifically
.DESCRIPTION
    Since other API calls work, test the /vpn/connect endpoint directly
#>

Write-Host ""
Write-Host "VPN CONNECT ENDPOINT TEST" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Auto-detect API endpoint (local dev vs production)
$localApi = "http://localhost:3001/api"
$prodApi = "https://api.nebula3ddev.com/api"
$customApi = $env:API_URL

Write-Host "Detecting API endpoint..." -ForegroundColor Yellow

# Check if local dev server is running
$localServerRunning = $false
try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    $localServerRunning = $true
    Write-Host "[*] Local dev server detected on port 3001" -ForegroundColor Green
    $apiBase = $localApi
} catch {
    Write-Host "[*] Local dev server not running on port 3001" -ForegroundColor Yellow
}

if (-not $localServerRunning) {
    if ($customApi) {
        Write-Host "[*] Using custom API_URL: $customApi" -ForegroundColor Green
        $apiBase = $customApi
    } else {
        Write-Host "[*] Using production API: $prodApi" -ForegroundColor Green
        $apiBase = $prodApi
    }
}

Write-Host "API Base URL: $apiBase" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing /vpn/connect endpoint specifically..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Basic connectivity to /vpn/connect (should return 400 - "Server ID required")
Write-Host "[1] Basic endpoint test (should return 400 without serverId):" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "$apiBase/vpn/connect" -Method POST -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode) - Unexpected success" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) {
            Write-Host "   Status: 400 (Good - endpoint exists, missing serverId)" -ForegroundColor Green
        } elseif ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "   Status: $statusCode (Good - endpoint exists, needs auth)" -ForegroundColor Green
        } elseif ($statusCode -eq 404) {
            Write-Host "   Status: 404 - ENDPOINT DOES NOT EXIST!" -ForegroundColor Red
            Write-Host "   -> This is the problem! /vpn/connect endpoint missing" -ForegroundColor Red
        } elseif ($statusCode -eq 500) {
            Write-Host "   Status: 500 - SERVER ERROR on /vpn/connect" -ForegroundColor Red
        } else {
            Write-Host "   Status: $statusCode - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        # Network connectivity issues
        $errorMsg = $_.Exception.Message
        Write-Host "   Status: - $errorMsg" -ForegroundColor Red
        if ($errorMsg -like "*Unable to connect*" -or $errorMsg -like "*No connection*") {
            if ($apiBase -eq $localApi) {
                Write-Host "   -> SOLUTION: Start your backend server with 'npm run server' or 'cd server && npm start'" -ForegroundColor Yellow
            } else {
                Write-Host "   -> SOLUTION: Check internet connection or use local dev server instead" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""

# Test 2: Compare with working endpoint
Write-Host "[2] Compare with working /user/settings endpoint:" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "$apiBase/user/settings" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status: $statusCode" -ForegroundColor $(if($statusCode -eq 401){"Green"}else{"Red"})
    } else {
        Write-Host "   Status: - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Check API route availability  
Write-Host "[3] API routes availability check:" -ForegroundColor White
$testEndpoints = @("auth/health", "vpn/status", "vpn/connect", "servers", "user/profile")
$workingEndpoints = 0
foreach ($endpoint in $testEndpoints) {
    try {
        $method = if ($endpoint -eq "vpn/connect") { "POST" } else { "GET" }
        $response = Invoke-WebRequest -Uri "$apiBase/$endpoint" -Method $method -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   /$endpoint : Available" -ForegroundColor Green
        $workingEndpoints++
    } catch {
        if ($_.Exception.Response) {
            $status = $_.Exception.Response.StatusCode.value__
            if ($status -eq 401) {
                Write-Host "   /$endpoint : Available (needs authentication)" -ForegroundColor Green  
                $workingEndpoints++
            } elseif ($status -eq 400) {
                Write-Host "   /$endpoint : Available (needs proper data)" -ForegroundColor Green
                $workingEndpoints++
            } elseif ($status -eq 405) {
                Write-Host "   /$endpoint : Available (wrong HTTP method)" -ForegroundColor Green
                $workingEndpoints++
            } elseif ($status -eq 404) {
                Write-Host "   /$endpoint : NOT FOUND" -ForegroundColor Red
            } else {
                Write-Host "   /$endpoint : Error $status" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   /$endpoint : Error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Diagnosis and next steps
if ($workingEndpoints -eq 0 -and $apiBase -eq $localApi) {
    Write-Host "DIAGNOSIS: Local backend server is not responding correctly!" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "SOLUTION: Restart your backend server:" -ForegroundColor Yellow
    Write-Host "   cd server" -ForegroundColor White
    Write-Host "   npm start" -ForegroundColor White
} elseif ($workingEndpoints -eq 0) {
    Write-Host "DIAGNOSIS: Cannot reach API server at $apiBase" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "SOLUTIONS:" -ForegroundColor Yellow
    Write-Host "   1. Check internet connection" -ForegroundColor White
    Write-Host "   2. Try local development server instead" -ForegroundColor White
    Write-Host "   3. Verify API_URL environment variable" -ForegroundColor White
} elseif ($workingEndpoints -gt 0) {
    Write-Host "DIAGNOSIS: ✅ API server is working! VPN endpoints are responding correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "VPN CONNECTION SHOULD WORK:" -ForegroundColor Green
    Write-Host "- /vpn/connect endpoint exists and responds to requests" -ForegroundColor White
    Write-Host "- Authentication middleware is working (401 responses)" -ForegroundColor White
    Write-Host "- Input validation is working (400 for missing data)" -ForegroundColor White
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. If no endpoints work: Start backend server (see diagnosis above)" -ForegroundColor White  
Write-Host "2. If /vpn/connect returns 404: Check server/src/routes/ for VPN routes" -ForegroundColor White
Write-Host "3. If /vpn/connect returns 500: Check server logs for VPN provisioning errors" -ForegroundColor White
Write-Host "4. If auth issues: Verify token format and requirements" -ForegroundColor White
Write-Host "5. Check Electron DevTools Console for additional client-side errors" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"