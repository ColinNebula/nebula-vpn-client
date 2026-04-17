#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# NUCLEAR OPTION - Complete Git History Reset
# ═══════════════════════════════════════════════════════════════════════
# 
# This script will:
# 1. Remove ALL git history (including exposed secrets)
# 2. Create a fresh repository with current files
# 3. Force push to GitHub (overwriting remote)
#
# ⚠️  WARNING: This destroys all commit history!
# ═══════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  🚨 NUCLEAR OPTION - Git History Reset"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  This will DELETE all git history and create a fresh repository."
echo "   All previous commits will be lost permanently."
echo ""
read -p "Are you sure you want to continue? (type 'YES' to confirm): " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ Aborted. No changes made."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Backup remote URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get remote URL before deleting .git
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo "❌ Error: Could not find remote URL. Is this a git repository?"
    exit 1
fi

echo "✅ Remote URL: $REMOTE_URL"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Remove .git directory"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Remove .git directory (force remove on Windows)
if [ -d ".git" ]; then
    echo "🗑️  Removing .git directory..."
    
    # Windows-specific: remove read-only attributes
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        echo "   (Windows detected - removing read-only attributes...)"
        attrib -R .git\\* /S /D 2>/dev/null || true
        rm -rf .git 2>/dev/null || {
            echo "   Trying with cmd.exe..."
            cmd //c "rd /s /q .git" 2>/dev/null || {
                echo "❌ Failed to remove .git. Try running as Administrator."
                exit 1
            }
        }
    else
        rm -rf .git
    fi
    
    echo "✅ .git directory removed"
else
    echo "⚠️  .git directory not found (already removed?)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Initialize fresh repository"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git init
echo "✅ Initialized fresh git repository"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Stage all files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git add .
echo "✅ Staged $(git diff --cached --numstat | wc -l) files"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Create initial commit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git commit -m "Initial commit (history cleaned - OAuth secrets removed)"
echo "✅ Created initial commit"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Add remote and force push"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git remote add origin "$REMOTE_URL"
echo "✅ Added remote: $REMOTE_URL"

echo ""
echo "🚀 Pushing to GitHub (force push)..."
echo ""

git push -u --force origin main

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "✅ SUCCESS! Git history has been completely reset and pushed."
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "What happened:"
echo "  ✅ All commit history deleted (including OAuth secrets)"
echo "  ✅ Fresh repository created with current files"
echo "  ✅ Pushed to GitHub (overwrote remote history)"
echo ""
echo "⚠️  IMPORTANT: You MUST still revoke the exposed OAuth secrets!"
echo "   → Google: https://console.cloud.google.com/apis/credentials"
echo "   → GitHub: https://github.com/settings/developers"
echo ""
echo "Next steps:"
echo "  1. 🔐 Revoke OAuth secrets (URLs above)"
echo "  2. 🔑 Generate new OAuth credentials"
echo "  3. 📝 Update server/.env with new secrets"
echo "  4. 🚀 Deploy to production"
echo ""
