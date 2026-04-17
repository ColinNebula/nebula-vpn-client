# RUN THESE COMMANDS IN GIT BASH (not PowerShell)

# ========================================
# NUCLEAR OPTION: Fresh Git History
# ========================================

# 1. Get remote URL (save this!)
git remote get-url origin

# 2. Remove .git folder (DELETES ALL HISTORY)
rm -rf .git

# 3. Initialize fresh repository
git init
git add .
git commit -m "Initial commit - OAuth secrets removed from history"
git branch -M main

# 4. Add remote (use URL from step 1)
git remote add origin https://github.com/ColinNebula/nebula-vpn-client.git

# 5. Force push (OVERWRITES GitHub)
git push -u --force origin main

# ========================================
# VERIFY SECRETS ARE GONE
# ========================================

# Search history for exposed secret (should return nothing)
git log -S "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" --all

# Expected output: (nothing)

# ========================================
# ⚠️ CRITICAL: DO THIS FIRST!
# ========================================

# BEFORE running the above, REVOKE the exposed secrets:
#
# 1. Google OAuth:
#    https://console.cloud.google.com/apis/credentials
#    → Find client ID 552502615021...
#    → DELETE it
#    → Create NEW OAuth credentials
#
# 2. GitHub OAuth:
#    https://github.com/settings/developers
#    → Find your OAuth app
#    → Regenerate secret or delete app
#
# 3. Update server/.env with NEW secrets
#
# 4. Update production server:
#    ssh root@165.227.32.85
#    nano /opt/nebula-vpn-server/.env
#    (paste new secrets)
#    systemctl restart nebula-vpn-server
