# PowerShell Scripts Consolidation Plan

## Current State
- **118 PS1 files** scattered in root directory
- **0.87 MB** total size
- Many duplicates and obsolete scripts
- Poor organization

## Proposed Structure

```
scripts/
├── vpn/
│   ├── nebula-vpn.ps1          # Main VPN management tool
│   ├── diagnose.ps1             # Diagnostics
│   └── cleanup.ps1              # Cleanup utilities
├── deployment/
│   ├── deploy.ps1               # Unified deployment script
│   └── setup-ssl.ps1            # SSL setup
├── development/
│   ├── start-dev.ps1            # Start dev environment
│   └── build.ps1                # Build utilities
└── utils/
    ├── generate-secrets.ps1
    └── security-audit.ps1
```

## Script Consolidation Map

### Keep (Essential - 8 scripts)
1. **`scripts/vpn/nebula-vpn.ps1`** - Consolidates:
   - All FIX-VPN-*.ps1 (40+ files)
   - DIAGNOSE-*.ps1 (10+ files)
   - CHECK-*.ps1, VERIFY-*.ps1 (15+ files)
   - MONITOR-*.ps1, QUICK-*.ps1 (10+ files)

2. **`scripts/vpn/cleanup.ps1`** - Consolidates:
   - CLEANUP-*.ps1 (5 files)
   - COMPLETE-*-CLEANUP.ps1 (3 files)
   - RESTORE-*.ps1 (2 files)

3. **`scripts/deployment/deploy.ps1`** - Consolidates:
   - DEPLOY-*.ps1 (7 files)
   - SETUP-PRODUCTION-*.ps1 (2 files)

4. **`scripts/development/start-dev.ps1`** - Consolidates:
   - start-*.ps1 (5 files)
   - START-*.ps1 (4 files)

5. **`scripts/development/build.ps1`** - Consolidates:
   - BUILD-*.ps1 (2 files)

6. **`scripts/utils/generate-secrets.ps1`** (existing in scripts/)
7. **`scripts/utils/security-audit.ps1`** (existing in scripts/)
8. **`TEST-VPN-TUNNEL.ps1`** (keep in root for quick access)

### Delete (Obsolete - 110+ files)
- All EMERGENCY-*.ps1 (debugging artifacts)
- All WORKING-*.ps1 (fixed versions)
- All *-FINAL.ps1, *-CORRECTED.ps1, *-FIXED.ps1 (iterations)
- All *-NOW.ps1 (temporary fixes)

## Space Savings
- **Before**: 118 files, 0.87 MB
- **After**: 8-10 files, ~0.15 MB
- **Savings**: ~85% reduction

## Migration Commands

```powershell
# Run this to consolidate
.\scripts\consolidate-scripts.ps1
```

Would create a clean, organized structure with a single unified tool.
