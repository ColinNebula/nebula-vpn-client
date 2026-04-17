# 🎨 Replace React Logo with Nebula Logo

Your Electron app is using the React logo in the system tray because `logo192.png` and `logo512.png` still contain the React logo.

## Quick Fix (2 minutes):

### Option 1: Use Online Converter (Easiest)
1. Open https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload `public/logo.svg` (your Nebula shield logo)
3. Convert to PNG at these sizes:
   - **32x32** → Save as `tray-icon.png`
   - **192x192** → Save as `logo192.png`
   - **512x512** → Save as `logo512.png`
4. Replace the files in the `public/` folder
5. Restart Electron app

### Option 2: Use Command Line (If you have ImageMagick)
```powershell
cd public
magick logo.svg -resize 32x32 tray-icon.png
magick logo.svg -resize 192x192 logo192.png
magick logo.svg -resize 512x512 logo512.png
```

### Option 3: Use VS Code Extension
1. Install "SVG Previewer" extension
2. Right-click `logo.svg` → "Export PNG"
3. Export at 32px, 192px, and 512px

## Temporary Workaround (I already applied):

I've updated the Electron code to use `logo192.png` for the tray icon. Once you convert and replace that file with your Nebula logo PNG, the tray will show the correct icon.

## After Conversion:

Just restart the Electron app:
```powershell
npm run electron-dev
```

The tray will now show your beautiful purple shield Nebula logo! 🛡️
