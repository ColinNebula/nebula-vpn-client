# SERVER SELECTION DIAGNOSTIC - Fixed Version
Write-Host "SERVER SELECTION DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Yellow
Write-Host ""

# Test if backend server is running
Write-Host "[1] Backend Server Test" -ForegroundColor Green
Write-Host "----------------------" -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    $healthData = $healthCheck.Content | ConvertFrom-Json
    Write-Host "Backend Server: RUNNING" -ForegroundColor Green
    Write-Host "Status: $($healthData.status)" -ForegroundColor White
    Write-Host "Uptime: $([math]::Round($healthData.uptime, 1))s" -ForegroundColor White
    $backendRunning = $true
} catch {
    Write-Host "Backend Server: NOT RUNNING" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $backendRunning = $false
}

if (-not $backendRunning) {
    Write-Host ""
    Write-Host "SOLUTION: Start backend server first" -ForegroundColor Blue
    Write-Host "Command: cd server; npm start" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "[2] Server List API Test" -ForegroundColor Green  
Write-Host "-----------------------" -ForegroundColor Yellow

# Test servers list endpoint
try {
    $headers = @{
        "Authorization" = "Bearer test-token"
        "Content-Type" = "application/json"
    }
    
    $serversResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/servers" -Headers $headers -UseBasicParsing -TimeoutSec 8
    $serversData = $serversResponse.Content | ConvertFrom-Json
    
    Write-Host "Servers API: SUCCESS" -ForegroundColor Green
    Write-Host "Status Code: $($serversResponse.StatusCode)" -ForegroundColor White
    Write-Host "Total Servers: $($serversData.servers.Count)" -ForegroundColor White
    
    # Show sample servers
    Write-Host ""
    Write-Host "Available Servers:" -ForegroundColor Cyan
    $serversData.servers | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.name) ($($_.location)) - $($_.tier) tier" -ForegroundColor White
    }
    if ($serversData.servers.Count -gt 5) {
        Write-Host "  ... and $($serversData.servers.Count - 5) more servers" -ForegroundColor Gray
    }
    
    $serversList = $serversData.servers
    $apiWorking = $true
} catch {
    Write-Host "Servers API: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $apiWorking = $false
    $serversList = @()
}

Write-Host ""
Write-Host "[3] Individual Server Test" -ForegroundColor Green
Write-Host "--------------------------" -ForegroundColor Yellow

if ($apiWorking -and $serversList.Count -gt 0) {
    $testServer = $serversList[0]
    Write-Host "Testing server endpoint for: $($testServer.name)" -ForegroundColor Cyan
    
    try {
        $serverResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/servers/$($testServer.id)" -Headers $headers -UseBasicParsing -TimeoutSec 5
        $serverData = $serverResponse.Content | ConvertFrom-Json
        
        Write-Host "Single Server API: SUCCESS" -ForegroundColor Green
        Write-Host "Server: $($serverData.name)" -ForegroundColor White
        Write-Host "IP: $($serverData.ip)" -ForegroundColor White
        Write-Host "Load: $($serverData.load)%" -ForegroundColor White
        Write-Host "Ping: $($serverData.ping)ms" -ForegroundColor White
    } catch {
        Write-Host "Single Server API: FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Skipping - no servers available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4] Server Ping Test" -ForegroundColor Green
Write-Host "-------------------" -ForegroundColor Yellow

if ($apiWorking -and $serversList.Count -gt 0) {
    $testServer = $serversList[0]
    Write-Host "Testing ping endpoint for: $($testServer.name)" -ForegroundColor Cyan
    
    try {
        $pingResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/servers/$($testServer.id)/ping" -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 5
        $pingData = $pingResponse.Content | ConvertFrom-Json
        
        Write-Host "Server Ping API: SUCCESS" -ForegroundColor Green
        Write-Host "Ping Result: $($pingData.ping)ms" -ForegroundColor White
        Write-Host "Status: $($pingData.status)" -ForegroundColor White
    } catch {
        Write-Host "Server Ping API: FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Skipping - no servers available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5] VPN App Check" -ForegroundColor Green
Write-Host "----------------" -ForegroundColor Yellow

$vpnProcesses = Get-Process | Where-Object { $_.ProcessName -eq "Nebula VPN" }

if ($vpnProcesses) {
    Write-Host "Nebula VPN App: RUNNING" -ForegroundColor Green
    Write-Host "Processes: $($vpnProcesses.Count)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "UI ELEMENTS TO CHECK:" -ForegroundColor Blue
    Write-Host "1. Server Selection Tab" -ForegroundColor White
    Write-Host "2. Server List Cards" -ForegroundColor White
    Write-Host "3. Filter Dropdowns" -ForegroundColor White
    Write-Host "4. Sort Options" -ForegroundColor White
    Write-Host "5. Search Bar" -ForegroundColor White
    Write-Host "6. Quick Connect Button" -ForegroundColor White
    Write-Host "7. Individual Server Buttons" -ForegroundColor White
} else {
    Write-Host "Nebula VPN App: NOT RUNNING" -ForegroundColor Red
    Write-Host "Start with: npm run electron" -ForegroundColor White
}

Write-Host ""
Write-Host "DIAGNOSTIC SUMMARY" -ForegroundColor Blue
Write-Host "==================" -ForegroundColor Yellow

if ($backendRunning) {
    Write-Host "Backend Server: OK" -ForegroundColor Green
} else {
    Write-Host "Backend Server: FAILED - Start with 'cd server; npm start'" -ForegroundColor Red
}

if ($apiWorking) {
    Write-Host "Server APIs: OK" -ForegroundColor Green
} else {
    Write-Host "Server APIs: FAILED - Check authentication" -ForegroundColor Red
}

if ($serversList.Count -gt 0) {
    Write-Host "Server Data: $($serversList.Count) servers available" -ForegroundColor Green
} else {
    Write-Host "Server Data: No servers found" -ForegroundColor Red
}

if ($vpnProcesses) {
    Write-Host "Frontend App: Running and ready for testing" -ForegroundColor Green
} else {
    Write-Host "Frontend App: Not running - Start with 'npm run electron'" -ForegroundColor Red
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Blue
if ($backendRunning -and $apiWorking -and $vpnProcesses) {
    Write-Host "All systems working! Test server selection in the app" -ForegroundColor Green
    Write-Host "1. Click 'Servers' tab" -ForegroundColor White
    Write-Host "2. Try clicking different server cards" -ForegroundColor White
    Write-Host "3. Test filter dropdowns" -ForegroundColor White
    Write-Host "4. Check Quick Connect button" -ForegroundColor White
} else {
    if (-not $backendRunning) {
        Write-Host "1. Start backend: cd server; npm start" -ForegroundColor Cyan
    }
    if (-not $vpnProcesses) {
        Write-Host "2. Start frontend: npm run electron" -ForegroundColor Cyan
    }
}
Write-Host ""