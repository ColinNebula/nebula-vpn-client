# 🖥️ Nebula VPN - Electron Desktop App

Transform your React web app into a native desktop application for Windows, Mac, and Linux!

## 📦 What's Included

### Files Created:
- **`electron/main.js`** - Main Electron process (window management, tray icon, IPC)
- **`electron/preload.js`** - Secure bridge between Electron and React
- **`public/electron.js`** - Production loader

### Features Added:
✅ **Native Desktop App** - Runs as Windows/Mac/Linux application
✅ **System Tray** - Minimize to tray, quick connect menu
✅ **Auto-launch** - Start with Windows option
✅ **Single Instance** - Prevents multiple app instances
✅ **Native Notifications** - Desktop notifications for VPN events
✅ **DevTools** - Built-in debugging in development mode

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
npm install
```

This installs:
- `electron` - Desktop framework
- `electron-builder` - Packaging tool
- `electron-is-dev` - Detect dev/production
- `concurrently` - Run multiple commands
- `wait-on` - Wait for React server

### 2. Run in Development
```powershell
npm run electron-dev
```

This will:
1. Start React dev server (port 3000)
2. Wait for it to be ready
3. Launch Electron window
4. Enable hot-reload for both React and Electron

### 3. Build Desktop App

**For Windows (.exe installer):**
```powershell
npm run dist
```

**For portable Windows app:**
```powershell
npm run electron-build -- --win portable
```

**For Mac (.dmg):**
```powershell
npm run electron-build -- --mac
```

**For Linux (.AppImage):**
```powershell
npm run electron-build -- --linux
```

Output will be in `dist/` folder.

## 🎨 Features

### System Tray Menu
Right-click tray icon:
- **Open Nebula VPN** - Show main window
- **Quick Connect** - Connect to fastest server
- **Disconnect** - Disconnect VPN
- **Settings** - Open settings panel
- **Quit** - Close application

### Window Behavior
- Close button → Minimize to tray (stays running)
- Tray icon click → Show/hide window
- Single instance - Can't open twice

### Auto-Launch
Users can enable "Launch on startup" in settings.

## 🔧 Customization

### Change Window Size
Edit `electron/main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1400,  // Change this
  height: 900,  // Change this
  // ...
});
```

### Change App Icon
Replace these files in `public/`:
- `logo192.png` - Tray icon
- `logo512.png` - App icon

### Add Menu Bar
Edit `electron/main.js`, add after `createWindow()`:
```javascript
const { Menu } = require('electron');

const template = [
  {
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

## 🔗 React Integration

### Detect Electron in React
```javascript
if (window.electron?.isElectron) {
  console.log('Running in Electron!');
}
```

### Use Electron APIs
```javascript
// Get system info
const info = await window.electron.system.getInfo();
console.log(info); // { platform: 'win32', arch: 'x64', version: '0.1.0' }

// Enable auto-launch
await window.electron.system.setAutoLaunch(true);

// Show notification
window.electron.notify('VPN Connected', 'Connected to US East');

// Listen for quick connect from tray
window.electron.vpn.onQuickConnect(() => {
  // Connect to fastest server
});

// Update tray tooltip
window.electron.vpn.onStatusChange((event, status) => {
  // Electron updates tray automatically
});
```

### Send VPN Status to Tray
In your React component:
```javascript
useEffect(() => {
  if (window.electron?.isElectron) {
    window.electron.vpn.onStatusChange((status) => {
      // Tray icon updated automatically
    });
  }
}, []);
```

## 📦 Distribution

### File Sizes (Approximate)
- **Windows Installer**: ~150 MB
- **Windows Portable**: ~200 MB
- **Mac DMG**: ~180 MB
- **Linux AppImage**: ~170 MB

### Code Signing (Optional)
For production apps, you should sign your code:

**Windows:**
1. Get code signing certificate
2. Add to `package.json`:
```json
"win": {
  "certificateFile": "cert.pfx",
  "certificatePassword": "password"
}
```

**Mac:**
1. Get Apple Developer account
2. Add to `package.json`:
```json
"mac": {
  "identity": "Developer ID Application: Your Name"
}
```

## 🐛 Troubleshooting

### "electron is not recognized"
Run `npm install` first to install Electron.

### White screen on launch
Check React dev server is running on port 3000.

### Tray icon not showing
Make sure `public/logo192.png` exists.

### Build fails
1. Clear cache: `npm run build` first
2. Delete `dist/` folder
3. Try again: `npm run dist`

## 📊 Development vs Production

| Mode | React Server | Electron Loads |
|------|-------------|----------------|
| **Development** | localhost:3000 | Live reload |
| **Production** | build/index.html | Static files |

In development (`npm run electron-dev`):
- React runs on port 3000
- Electron loads from localhost
- Changes auto-reload

In production (`npm run dist`):
- React is built to `build/`
- Electron loads from files
- No server needed

## 🎯 Next Steps

1. **Test the app**: Run `npm run electron-dev`
2. **Add Electron features**: Update tray menu, add shortcuts
3. **Integrate with backend**: Use Electron for system VPN config
4. **Build installer**: Run `npm run dist`
5. **Distribute**: Share the `.exe` file with users!

## 💡 Pro Tips

- **Auto-update**: Add `electron-updater` for automatic updates
- **Native VPN**: Use Node.js VPN libraries in main process
- **Performance**: Electron apps use ~100MB RAM base
- **Security**: Never disable `contextIsolation` or `nodeIntegration`

---

**Your Nebula VPN is now a desktop app!** 🎉
