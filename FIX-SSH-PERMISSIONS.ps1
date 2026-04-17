#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fix SSH permissions on DigitalOcean droplet

.DESCRIPTION
    Connects to droplet and fixes common SSH permission issues that prevent
    public key authentication from working.

.PARAMETER DropletIP
    IP address of your droplet

.EXAMPLE
    .\FIX-SSH-PERMISSIONS.ps1 -DropletIP 165.227.32.85
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$DropletIP
)

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  FIX SSH PERMISSIONS ON DROPLET" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

Write-Host "This script will fix SSH permissions on root@$DropletIP" -ForegroundColor Yellow
Write-Host "You will be prompted for the root password." -ForegroundColor Yellow
Write-Host ""

$fixScript = @'
#!/bin/bash
echo "Fixing SSH permissions..."

# Fix home directory permissions
chmod 755 /root
echo "✓ Fixed /root permissions (755)"

# Fix .ssh directory permissions
chmod 700 /root/.ssh
echo "✓ Fixed /root/.ssh permissions (700)"

# Fix authorized_keys permissions
chmod 600 /root/.ssh/authorized_keys
echo "✓ Fixed /root/.ssh/authorized_keys permissions (600)"

# Ensure correct ownership
chown -R root:root /root/.ssh
echo "✓ Fixed /root/.ssh ownership"

# Check SELinux (if installed)
if command -v restorecon &> /dev/null; then
    restorecon -R -v /root/.ssh
    echo "✓ Fixed SELinux contexts"
fi

# Verify sshd_config allows public key auth
if grep -q "^PubkeyAuthentication no" /etc/ssh/sshd_config; then
    sed -i 's/^PubkeyAuthentication no/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    echo "✓ Enabled PubkeyAuthentication in sshd_config"
    systemctl restart sshd
    echo "✓ Restarted SSH service"
fi

echo ""
echo "Permissions fixed! Current state:"
ls -la /root/.ssh/
echo ""
echo "authorized_keys content:"
cat /root/.ssh/authorized_keys
echo ""
'@

# Create temp script file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$fixScript | Out-File -FilePath $tempScript -Encoding ASCII

Write-Host "Uploading fix script to droplet..." -ForegroundColor Cyan
scp $tempScript root@${DropletIP}:/tmp/fix-ssh.sh

if ($LASTEXITCODE -eq 0) {
    Write-Host "Running fix script on droplet..." -ForegroundColor Cyan
    ssh root@${DropletIP} "chmod +x /tmp/fix-ssh.sh && /tmp/fix-ssh.sh && rm /tmp/fix-ssh.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n================================================================" -ForegroundColor Green
        Write-Host "  SSH PERMISSIONS FIXED!" -ForegroundColor Green
        Write-Host "================================================================`n" -ForegroundColor Green
        
        Write-Host "Testing passwordless SSH..." -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        
        $testResult = ssh -o BatchMode=yes root@${DropletIP} "echo 'SSH works!'" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nSUCCESS: $testResult" -ForegroundColor Green
            Write-Host "You can now run deployments without password!" -ForegroundColor Green
        } else {
            Write-Host "`nStill failing. Checking server logs..." -ForegroundColor Yellow
            Write-Host ""
            ssh root@${DropletIP} "tail -n 20 /var/log/auth.log | grep -i ssh"
        }
    }
} else {
    Write-Host "`nFailed to upload script. Using direct commands..." -ForegroundColor Yellow
    
    ssh root@${DropletIP} @"
chmod 755 /root
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
chown -R root:root /root/.ssh
ls -la /root/.ssh/
"@
}

# Cleanup
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host ""
