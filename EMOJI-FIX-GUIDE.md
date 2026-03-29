# Emoji Rendering Issues in Electron - Fix Guide

## Problem

Windows Electron apps often show � (question marks) or blank squares instead of emojis because:
- Windows emoji fonts may not be loaded correctly in Electron
- Font fallback doesn't work properly in some Chromium versions
- Emoji unicode characters need specific fonts to render

## Quick Fixes

### Option 1: Font Injection (Automatic)

The build script now automatically injects emoji font support:

```powershell
npm run electron:start
```

This adds CSS to force emoji font loading in the build.

### Option 2: Replace Emojis with Text (Recommended)

For 100% compatibility across all systems, replace emojis with text:

```powershell
# Replace all emojis with text alternatives
.\FIX-EMOJI.ps1

# Build and run
npm run electron:prepare
npm run electron

# To restore emojis later
.\FIX-EMOJI.ps1 -Restore
```

### Option 3: Build with Both Fixes

```powershell
# Automatic emoji replacement during build
.\BUILD-ELECTRON.ps1 -FixEmojis
npm run electron
```

## Manual Font Fix (If Automatic Fails)

If emojis still don't show, install Segoe UI Emoji font:

1. **Check if font is installed:**
   ```powershell
   Get-ChildItem "C:\Windows\Fonts" | Where-Object { $_.Name -like "*emoji*" }
   ```

2. **If not found, download from:**
   - Windows 10/11: Should be pre-installed
   - Older Windows: https://aka.ms/SegoeFonts

3. **Verify Electron font loading:**
   - Open DevTools (F12) in Electron
   - Run: `document.fonts.check('1em Segoe UI Emoji')`
   - Should return `true`

## Testing Emoji Rendering

After applying fixes, test with:

```powershell
# Build and run with DevTools
npm run electron:prepare
npm run electron

# Press F12 in the app
# Check console for font errors
```

## Emoji Replacements Used

The FIX-EMOJI.ps1 script replaces:

| Emoji | Text | Used For |
|-------|------|----------|
| ✓ | [OK] | Success indicators |
| ✗ | [X] | Close buttons |
| ⚠ | [!] | Warnings |
| 🔗 | [Link] | Multi-hop chains |
| 🔒 | [Lock] | Security features |
| 🌐 | [Globe] | Network/Internet |
| ⚡ | [Fast] | Speed/Performance |
| 🚀 | [Launch] | Start/Deploy |
| 💾 | [Save] | Save operations |
| ❤️ | <3 | Donate/Support |

## Troubleshooting

### Still seeing question marks?

1. **Rebuild completely:**
   ```powershell
   Remove-Item build -Recurse -Force
   npm run electron:prepare
   npm run electron
   ```

2. **Check character encoding:**
   ```powershell
   # All source files should be UTF-8
   Get-ChildItem src -Recurse -Filter *.js | ForEach-Object {
       [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
   }
   ```

3. **Use text replacements:**
   ```powershell
   .\FIX-EMOJI.ps1
   ```

### Emojis work in browser but not Electron?

This is normal. Browsers have better font fallback. Use `FIX-EMOJI.ps1` for Electron builds.

### Want different emoji replacements?

Edit `FIX-EMOJI.ps1` and modify the `$replacements` hashtable:

```powershell
$replacements = @{
    '🔒' = '🔐'  # Use different emoji
    '⚡' = 'FAST' # Use custom text
}
```

## Best Practices

1. **For development:** Keep emojis, use browser or `npm start`
2. **For Electron builds:** Use text replacements (`FIX-EMOJI.ps1`)
3. **For GitHub Pages:** Keep emojis (browsers handle them fine)
4. **For production:** Always test on target platform

## Automated Build Pipeline

Update your build scripts to automatically handle emojis:

```json
{
  "scripts": {
    "electron:start": "BUILD-ELECTRON.ps1 -FixEmojis ; electron .",
    "electron:build:win": "BUILD-ELECTRON.ps1 -FixEmojis ; electron-builder --win"
  }
}
```

## Related Files

- `FIX-EMOJI.ps1` - Emoji replacement script
- `BUILD-ELECTRON.ps1` - Build script with font injection
- `src/index.css` - Font-family definitions
- `electron/main.js` - Electron configuration

## Need Help?

1. Check Electron console (F12) for font errors
2. Verify build was created with `npm run electron:prepare`
3. Try clean rebuild: `Remove-Item build -Recurse -Force`
4. Use text replacements for guaranteed compatibility
