# 🚨 Fix GitHub Secret Scanning Block

## What Happened?

GitHub detected OAuth secrets in your git commit history and blocked your push:
- **Google OAuth Client ID** exposed in commit `56b1b8acaa60d99328465bb5fe939a7b8b3b5ff6`
- File: `EMERGENCY-OAUTH-SECRET-FIX.md:59`

Even though we've removed the secrets from current files, they're still in git history.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Clean Git History (CHOOSE ONE)

#### Option A: PowerShell Script (RECOMMENDED for Windows)

```powershell
.\CLEANUP-GIT-HISTORY.ps1
```

#### Option B: Bash Script (Git Bash terminal)

```bash
./CLEANUP-GIT-HISTORY.sh
```

Both scripts will:
- ✅ Remove all git history (including secrets)
- ✅ Create fresh repository with current files
- ✅ Force push to GitHub (overwrite remote)

⚠️ **This deletes all commit history!** (But that's what we want since history contains secrets)

---

### Step 2: Revoke Exposed OAuth Secrets

**🔴 DO THIS IMMEDIATELY** - Anyone with the exposed secrets can use your OAuth apps!

#### Revoke Google OAuth:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID (starts with numeric ID like `552502615021-...`)
3. Click **DELETE** or **Edit** → **Reset secret**
4. Create NEW credentials and save them

#### Revoke GitHub OAuth:
1. Go to: https://github.com/settings/developers
2. Find your OAuth App
3. Click **Regenerate client secret** or **Delete** the app
4. Create new credentials and save them

---

### Step 3: Update Production

Update `server/.env` with NEW OAuth secrets:

```env
# NEW secrets from step 2
GOOGLE_CLIENT_ID=<new-client-id>
GOOGLE_CLIENT_SECRET=<new-client-secret>
GITHUB_CLIENT_ID=<new-client-id>
GITHUB_CLIENT_SECRET=<new-client-secret>

# Admin password (already updated)
ADMIN_PASSWORD=M}g0qRHPGoRV{D@aY@%hin!c1ndGr5-@
```

Then deploy:

```powershell
.\DEPLOY-PRODUCTION.ps1
```

---

## 🔍 Verify It Worked

After running cleanup script:

```powershell
# Should push successfully now
git push
```

If GitHub still blocks:
- Make sure you revoked the OLD secrets
- Check that new secrets don't match old ones
- Wait a few minutes for GitHub's cache to clear

---

## 📚 Files Created

- ✅ `CLEANUP-GIT-HISTORY.ps1` - PowerShell cleanup script
- ✅ `CLEANUP-GIT-HISTORY.sh` - Bash cleanup script  
- ✅ `ADMIN-PASSWORD.md` - Your new admin password (save then delete!)
- ✅ `server/.env` - Updated with secure admin password
- ✅ `server/.env.production` - Production template ready

---

## ⚠️ Important Notes

1. **Commit history will be destroyed** - This is intentional! The secrets are in the history.

2. **Force push overwrites GitHub** - Your remote repository will be replaced with the clean version.

3. **OAuth secrets MUST be revoked** - Until you revoke them, anyone can use your exposed credentials.

4. **Admin password is secure** - Already updated to strong generated password.

---

## 🆘 If Something Goes Wrong

The scripts include safety checks and detailed error messages. If you encounter issues:

1. **"Git not found"**: Install Git or add to PATH
   - Download: https://git-scm.com/download/win

2. **"Failed to remove .git"**: Run PowerShell as Administrator
   - Or manually delete `.git` folder in File Explorer

3. **"Push rejected"**: 
   - Make sure you revoked the OLD OAuth secrets
   - GitHub may cache secret detection for a few minutes

---

## Next Steps After Fix

Once git history is cleaned and pushed:

1. ✅ Save admin password from `ADMIN-PASSWORD.md` to password manager
2. ✅ Delete `ADMIN-PASSWORD.md` file
3. ✅ Revoke OLD OAuth secrets  
4. ✅ Generate NEW OAuth secrets
5. ✅ Update `server/.env` with new OAuth secrets
6. ✅ Deploy to production: `.\DEPLOY-PRODUCTION.ps1`
7. ✅ Test login with new admin password

---

**Ready? Run the cleanup script now:**

```powershell
.\CLEANUP-GIT-HISTORY.ps1
```

Or in Git Bash:

```bash
./CLEANUP-GIT-HISTORY.sh
```
