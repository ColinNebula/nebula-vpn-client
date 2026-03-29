#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Nebula VPN to Azure (Static Web Apps + App Service)

.DESCRIPTION
    Deploys frontend to Azure Static Web Apps and backend to Azure App Service.
    More cost-effective and performant than GitHub Pages + DigitalOcean.
    
    Prerequisites:
    - Azure CLI installed: winget install Microsoft.AzureCLI
    - Logged in: az login
    - Node.js and npm installed

.PARAMETER ResourceGroup
    Azure Resource Group name (default: nebula-vpn-rg)

.PARAMETER Location
    Azure region (default: eastus2)

.PARAMETER StaticWebAppName
    Static Web App name for frontend (default: nebula-vpn-app)

.PARAMETER AppServiceName
    App Service name for backend (default: nebula-vpn-api)

.PARAMETER SkipBuild
    Skip building frontend/backend, just deploy existing builds

.EXAMPLE
    .\DEPLOY-AZURE.ps1
    .\DEPLOY-AZURE.ps1 -ResourceGroup my-rg -Location westus2
    .\DEPLOY-AZURE.ps1 -SkipBuild
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "nebula-vpn-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus2",
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName = "nebula-vpn-app",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServiceName = "nebula-vpn-api",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  AZURE DEPLOYMENT - NEBULA VPN" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# Auto-detect Azure CLI
$azCommand = Get-Command az -ErrorAction SilentlyContinue
if (-not $azCommand) {
    Write-Host "Azure CLI not in PATH. Searching common locations..." -ForegroundColor Yellow
    
    $azPaths = @(
        "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
        "${env:ProgramFiles}\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
        "${env:ProgramFiles(x86)}\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
        "${env:LOCALAPPDATA}\Programs\Azure CLI\wbin\az.cmd"
    )
    
    $foundAz = $null
    foreach ($path in $azPaths) {
        if (Test-Path $path) {
            $foundAz = $path
            Write-Host "Found Azure CLI: $path" -ForegroundColor Green
            # Add to PATH for this session
            $azDir = Split-Path $path -Parent
            $env:PATH = "$azDir;$env:PATH"
            break
        }
    }
    
    if (-not $foundAz) {
        Write-Host "Azure CLI not found. Install with: winget install Microsoft.AzureCLI" -ForegroundColor Red
        Write-Host "Or run: npm run setup:mstools" -ForegroundColor Yellow
        Write-Host "Then restart PowerShell and try again." -ForegroundColor Yellow
        exit 1
    }
}

# Check Azure CLI
Write-Host "[1/7] Checking Azure CLI..." -ForegroundColor Yellow
$azVersion = az version 2>&1 | ConvertFrom-Json
if ($azVersion.'azure-cli') {
    Write-Host "Azure CLI version: $($azVersion.'azure-cli')" -ForegroundColor Green
} else {
    Write-Host "Azure CLI not found. Install with: winget install Microsoft.AzureCLI" -ForegroundColor Red
    exit 1
}

# Check login
Write-Host "[2/7] Checking Azure login..." -ForegroundColor Yellow
$account = az account show 2>&1 | ConvertFrom-Json
if ($account.name) {
    Write-Host "Logged in as: $($account.name) ($($account.user.name))" -ForegroundColor Green
} else {
    Write-Host "Not logged in. Running: az login" -ForegroundColor Yellow
    az login
}

# Create or verify resource group
Write-Host "[3/7] Setting up resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroup | ConvertFrom-Json
if (-not $rgExists) {
    Write-Host "Creating resource group: $ResourceGroup in $Location" -ForegroundColor Gray
    az group create --name $ResourceGroup --location $Location | Out-Null
    Write-Host "Resource group created" -ForegroundColor Green
} else {
    Write-Host "Resource group exists: $ResourceGroup" -ForegroundColor Green
}

# Build frontend
if (-not $SkipBuild) {
    Write-Host "[4/7] Building React frontend..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    $env:REACT_APP_API_URL = "https://$AppServiceName.azurewebsites.net"
    npm run build
    Write-Host "Frontend build complete" -ForegroundColor Green
} else {
    Write-Host "[4/7] Skipping frontend build" -ForegroundColor Gray
}

# Deploy to Static Web App
Write-Host "[5/7] Deploying frontend to Azure Static Web Apps..." -ForegroundColor Yellow
$swaExists = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Static Web App: $StaticWebAppName" -ForegroundColor Gray
    $swaOutput = az staticwebapp create `
        --name $StaticWebAppName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Free `
        --source "." `
        --app-location "build" | ConvertFrom-Json
        
    Write-Host "Static Web App created: $($swaOutput.defaultHostname)" -ForegroundColor Green
    $frontendUrl = "https://$($swaOutput.defaultHostname)"
} else {
    Write-Host "Static Web App exists: $StaticWebAppName" -ForegroundColor Gray
    $swaInfo = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup | ConvertFrom-Json
    
    if ($swaInfo.defaultHostname) {
        $frontendUrl = "https://$($swaInfo.defaultHostname)"
    } else {
        $frontendUrl = "https://$StaticWebAppName.azurestaticapps.net"
    }
    
    # Upload build
    Write-Host "Uploading build to Static Web App..." -ForegroundColor Gray
    $token = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroup --query "properties.apiKey" -o tsv
    
    if ($token) {
        # Install SWA CLI if needed
        npm install -g @azure/static-web-apps-cli
        swa deploy ./build --deployment-token $token
        Write-Host "Build uploaded successfully" -ForegroundColor Green
    }
}

# Build backend
if (-not $SkipBuild) {
    Write-Host "[6/7] Preparing backend..." -ForegroundColor Yellow
    Push-Location server
    npm install --legacy-peer-deps
    Pop-Location
    Write-Host "Backend prepared" -ForegroundColor Green
} else {
    Write-Host "[6/7] Skipping backend build" -ForegroundColor Gray
}

# Deploy backend to App Service
Write-Host "[7/7] Deploying backend to Azure App Service..." -ForegroundColor Yellow
Push-Location server

# Check if App Service exists
$appExists = az webapp show --name $AppServiceName --resource-group $ResourceGroup 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating App Service: $AppServiceName" -ForegroundColor Gray
    
    # Create App Service Plan (Free tier)
    $planName = "$AppServiceName-plan"
    az appservice plan create `
        --name $planName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku F1 `
        --is-linux | Out-Null
    
    # Create App Service
    az webapp create `
        --name $AppServiceName `
        --resource-group $ResourceGroup `
        --plan $planName `
        --runtime "NODE:18-lts" | Out-Null
    
    Write-Host "App Service created" -ForegroundColor Green
}

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Gray

# Determine frontend URL for CORS
if (-not $frontendUrl) {
    $frontendUrl = "https://$StaticWebAppName.azurestaticapps.net"
}

az webapp config appsettings set `
    --name $AppServiceName `
    --resource-group $ResourceGroup `
    --settings `
        NODE_ENV=production `
        PORT=8080 `
        ALLOWED_ORIGINS="$frontendUrl" | Out-Null

# Deploy backend code
Write-Host "Deploying backend code..." -ForegroundColor Gray
az webapp up `
    --name $AppServiceName `
    --resource-group $ResourceGroup `
    --runtime "NODE:18-lts" `
    --plan "$AppServiceName-plan" | Out-Null

Pop-Location
Write-Host "Backend deployed successfully" -ForegroundColor Green

# Summary
Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Green

Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host "Backend URL:  https://$AppServiceName.azurewebsites.net" -ForegroundColor Cyan
Write-Host ""

Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Gray
Write-Host "Location: $Location" -ForegroundColor Gray
Write-Host ""

Write-Host "Cost estimate:" -ForegroundColor Yellow
Write-Host "  Static Web App (Free tier):  $0/month" -ForegroundColor Gray
Write-Host "  App Service (F1 Free tier):  $0/month" -ForegroundColor Gray
Write-Host "  Total:                       $0/month" -ForegroundColor Green
Write-Host ""

Write-Host "Upgrade options:" -ForegroundColor Yellow
Write-Host "  B1 Basic tier for backend:   ~$13/month (better performance)" -ForegroundColor Gray
Write-Host "  Static Web App Standard:     $9/month (custom domains, SLA)" -ForegroundColor Gray
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure custom domain (optional)" -ForegroundColor Gray
Write-Host "  2. Set up SSL certificate (automatic with Azure)" -ForegroundColor Gray
Write-Host "  3. Configure environment secrets in Azure Portal" -ForegroundColor Gray
Write-Host "  4. Set up Application Insights for monitoring" -ForegroundColor Gray
Write-Host "  5. Visit: $frontendUrl" -ForegroundColor Gray
Write-Host ""

Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  az webapp log tail --name $AppServiceName --resource-group $ResourceGroup" -ForegroundColor Gray
Write-Host "  az staticwebapp browse --name $StaticWebAppName --resource-group $ResourceGroup" -ForegroundColor Gray
Write-Host "  az group delete --name $ResourceGroup  # Delete all resources" -ForegroundColor Gray
Write-Host ""
