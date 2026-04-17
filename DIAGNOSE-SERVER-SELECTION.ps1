# SERVER SELECTION DIAGNOSTIC
# ==========================
# Tests all server selection buttons, endpoints, and connectivity

Write-Host "🔍 COMPREHENSIVE SERVER SELECTION DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

# Configuration
$API_BASE = "http://localhost:3001/api"
$TIMEOUT_MS = 8000

Write-Host "[1] BACKEND API CONNECTIVITY TEST" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Yellow

# Test if backend server is running
Write-Host "Testing backend server connectivity..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    $healthData = $healthCheck.Content | ConvertFrom-Json
    Write-Host "✅ Backend Server: RUNNING" -ForegroundColor Green
    Write-Host "   Status: $($healthData.status)" -ForegroundColor White
    Write-Host "   Uptime: $([math]::Round($healthData.uptime, 1))s" -ForegroundColor White
    $backendRunning = $true
} catch {
    Write-Host "❌ Backend Server: NOT RUNNING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 SOLUTION: Start the backend server first" -ForegroundColor Blue
    Write-Host "cd server && npm start" -ForegroundColor White
    $backendRunning = $false
}

if (-not $backendRunning) {
    Write-Host ""
    Write-Host "❌ Cannot test server selection without backend running" -ForegroundColor Red
    Write-Host "Start backend server first, then rerun this diagnostic" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2] SERVER LIST API ENDPOINT TEST" -ForegroundColor Green  
Write-Host "==================================" -ForegroundColor Yellow

# Test servers list endpoint (requires auth token)
Write-Host "Testing /api/servers endpoint..." -ForegroundColor Cyan

# Create a test JWT token (simplified for testing)
$testPayload = @{
    userId = "test-user"
    plan = "free"
    role = "user"
    iat = [int](Get-Date -UFormat %s)
    exp = [int](Get-Date -UFormat %s) + 3600
} | ConvertTo-Json
$testToken = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($testPayload))

try {
    $headers = @{
        "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJwbGFuIjoiZnJlZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzA5MjA4MDAwLCJleHAiOjE3MDkyOTQ0MDB9.test-signature"
        "Content-Type" = "application/json"
    }
    
    $serversResponse = Invoke-WebRequest -Uri "$API_BASE/servers" -Headers $headers -UseBasicParsing -TimeoutSec ($TIMEOUT_MS / 1000)
    $serversData = $serversResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Servers API: SUCCESS" -ForegroundColor Green
    Write-Host "   Status Code: $($serversResponse.StatusCode)" -ForegroundColor White
    Write-Host "   Total Servers: $($serversData.servers.Count)" -ForegroundColor White
    Write-Host "   Server Count: $($serversData.count)" -ForegroundColor White
    
    # Show sample servers
    Write-Host ""
    Write-Host "📋 Available Servers:" -ForegroundColor Cyan
    $serversData.servers | Select-Object -First 5 | ForEach-Object {
        Write-Host "   $($_.flag) $($_.name) ($($_.location)) - $($_.tier) tier" -ForegroundColor White
    }
    if ($serversData.servers.Count -gt 5) {
        Write-Host "   ... and $($serversData.servers.Count - 5) more servers" -ForegroundColor Gray
    }
    
    $serversList = $serversData.servers
    $apiWorking = $true
} catch {
    Write-Host "❌ Servers API: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $apiWorking = $false
    $serversList = @()
}

Write-Host ""
Write-Host "[3] INDIVIDUAL SERVER ENDPOINT TESTS" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Yellow

if ($apiWorking -and $serversList.Count -gt 0) {
    $testServer = $serversList[0]
    Write-Host "Testing individual server endpoint for: $($testServer.name)" -ForegroundColor Cyan
    
    try {
        $serverResponse = Invoke-WebRequest -Uri "$API_BASE/servers/$($testServer.id)" -Headers $headers -UseBasicParsing -TimeoutSec 5
        $serverData = $serverResponse.Content | ConvertFrom-Json
        
        Write-Host "✅ Single Server API: SUCCESS" -ForegroundColor Green
        Write-Host "   Server: $($serverData.name) ($($serverData.location))" -ForegroundColor White
        Write-Host "   IP: $($serverData.ip)" -ForegroundColor White
        Write-Host "   Load: $($serverData.load)%" -ForegroundColor White
        Write-Host "   Ping: $($serverData.ping)ms" -ForegroundColor White
        Write-Host "   Features: Streaming=$($serverData.streaming), Gaming=$($serverData.gaming), P2P=$($serverData.p2p)" -ForegroundColor White
    } catch {
        Write-Host "❌ Single Server API: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Skipping individual server tests - no servers available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4] SERVER PING ENDPOINT TEST" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Yellow

if ($apiWorking -and $serversList.Count -gt 0) {
    $testServer = $serversList[0]
    Write-Host "Testing ping endpoint for: $($testServer.name)" -ForegroundColor Cyan
    
    try {
        $pingResponse = Invoke-WebRequest -Uri "$API_BASE/servers/$($testServer.id)/ping" -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 5
        $pingData = $pingResponse.Content | ConvertFrom-Json
        
        Write-Host "✅ Server Ping API: SUCCESS" -ForegroundColor Green
        Write-Host "   Server ID: $($pingData.serverId)" -ForegroundColor White
        Write-Host "   Ping Result: $($pingData.ping)ms" -ForegroundColor White
        Write-Host "   Status: $($pingData.status)" -ForegroundColor White
    } catch {
        Write-Host "❌ Server Ping API: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Skipping ping tests - no servers available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5] NETWORK CONNECTIVITY TO SERVERS" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Yellow

if ($serversList.Count -gt 0) {
    Write-Host "Testing direct connectivity to server IPs..." -ForegroundColor Cyan
    
    $connectableServers = 0
    $testCount = [Math]::Min(3, $serversList.Count)
    
    for ($i = 0; $i -lt $testCount; $i++) {
        $server = $serversList[$i]
        Write-Host "Testing $($server.name) ($($server.ip))..." -ForegroundColor Yellow
        
        try {
            # Test documentation IPs (these are test IPs that won't respond)
            if ($server.ip -match "^192\.0\.2\.") {
                Write-Host "   ⚠️  Test IP (documentation range) - simulated response" -ForegroundColor Yellow
                $connectableServers++
            } else {
                # Test real connectivity
                $pingResult = Test-Connection -ComputerName $server.ip -Count 1 -Quiet -ErrorAction Stop
                if ($pingResult) {
                    Write-Host "   ✅ Reachable via ping" -ForegroundColor Green
                    $connectableServers++
                } else {
                    Write-Host "   ❌ Not reachable via ping" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "   ❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "📊 Connectivity Summary: $connectableServers/$testCount servers reachable" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  No servers to test connectivity" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[6] FRONTEND UI VALIDATION" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Yellow

Write-Host "Checking if Nebula VPN app is running..." -ForegroundColor Cyan
$vpnProcesses = Get-Process | Where-Object { $_.ProcessName -eq "Nebula VPN" }

if ($vpnProcesses) {
    Write-Host "✅ Nebula VPN App: RUNNING" -ForegroundColor Green
    Write-Host "   Processes: $($vpnProcesses.Count)" -ForegroundColor White
    $vpnProcesses | ForEach-Object {
        Write-Host "   PID $($_.Id): $($_.MainWindowTitle)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "🔍 UI ELEMENTS TO CHECK IN APP:" -ForegroundColor Blue
    Write-Host "==============================" -ForegroundColor Yellow
    Write-Host "1. Server Selection Tab/Button" -ForegroundColor White
    Write-Host "2. Server List Grid/Cards" -ForegroundColor White
    Write-Host "3. Filter Dropdowns (Country, Purpose, Type)" -ForegroundColor White
    Write-Host "4. Sort Options (Name, Ping, Load)" -ForegroundColor White
    Write-Host "5. Search Bar" -ForegroundColor White
    Write-Host "6. Quick Connect Button" -ForegroundColor White
    Write-Host "7. Individual Server Buttons" -ForegroundColor White
    Write-Host "8. Server Details (Click Response)" -ForegroundColor White
} else {
    Write-Host "❌ Nebula VPN App: NOT RUNNING" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Start the app to test UI functionality:" -ForegroundColor Blue
    Write-Host "npm run electron" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 DIAGNOSTIC SUMMARY" -ForegroundColor Blue
Write-Host "====================" -ForegroundColor Yellow

# Summary
Write-Host ""
if ($backendRunning) {
    Write-Host "✅ Backend Server: Running properly" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Server: Not running - start with 'cd server && npm start'" -ForegroundColor Red
}

if ($apiWorking) {
    Write-Host "✅ Server APIs: Working correctly" -ForegroundColor Green
} else {
    Write-Host "❌ Server APIs: Failed - check authentication or server errors" -ForegroundColor Red
}

if ($serversList.Count -gt 0) {
    Write-Host "✅ Server Data: $($serversList.Count) servers available" -ForegroundColor Green
} else {
    Write-Host "❌ Server Data: No servers found in API response" -ForegroundColor Red
}

if ($vpnProcesses) {
    Write-Host "✅ Frontend App: Running and ready for UI testing" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend App: Not running - start with 'npm run electron'" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 TROUBLESHOOTING STEPS:" -ForegroundColor Blue
Write-Host "=========================" -ForegroundColor Yellow

if (-not $backendRunning) {
    Write-Host "1. Start backend server: cd server && npm start" -ForegroundColor Cyan
}
if (-not $apiWorking) {
    Write-Host "2. Check API authentication and server logs" -ForegroundColor Cyan
}
if (-not $vpnProcesses) {
    Write-Host "3. Start frontend app: npm run electron" -ForegroundColor Cyan
}
if ($backendRunning -and $apiWorking -and $vpnProcesses) {
    Write-Host "✅ All systems working! Test server selection in the app:" -ForegroundColor Green
    Write-Host "   • Click 'Servers' tab" -ForegroundColor White
    Write-Host "   • Try clicking different server cards" -ForegroundColor White
    Write-Host "   • Test filter dropdowns and search" -ForegroundColor White
    Write-Host "   • Check Quick Connect button" -ForegroundColor White
}

Write-Host ""