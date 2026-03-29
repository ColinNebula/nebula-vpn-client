# Nebula VPN Client 🛡️

A comprehensive and professional VPN client application built with React, offering advanced security features and real-time monitoring capabilities.

**Created by:** Developer Colin Nebula  
**Company:** Nebula Media 3D  
**Version:** 1.0.0

## 🌟 Overview

Nebula VPN Client is a modern, feature-rich VPN application designed to provide users with secure, private, and fast internet connections. Built with cutting-edge web technologies, it offers an intuitive interface combined with powerful functionality for both casual users and power users.

## ✨ Key Features

### 🔐 **Security & Privacy**
- **WireGuard Protocol**: Modern, fast, and secure VPN protocol with state-of-the-art cryptography
- **Kill Switch**: Automatically blocks internet access if VPN connection drops
- **No-Logs Policy**: Complete privacy protection with zero logging
- **Real DNS Enforcement**: OS-level DNS configuration via Windows `netsh` (not just UI toggle)
- **Database Encryption**: AES-256-GCM encryption for sensitive user data (2FA secrets, OAuth tokens)
- **Admin Privilege Detection**: Automatic detection and elevation prompts for full DNS protection
- **DNS Leak Protection**: Prevents DNS queries from bypassing the VPN tunnel with verification tools

### 🌍 **Global Server Network**
- **8+ Server Locations**: Strategically placed servers across US, Europe, Asia, and more
- **Real-time Server Status**: Live ping, load monitoring, and availability indicators
- **Smart Server Selection**: Automatic optimal server recommendation
- **Country-based Filtering**: Easy server browsing by geographic location

### 📊 **Advanced Monitoring**
- **Real-time Traffic Analysis**: Live download/upload speed monitoring
- **Data Usage Tracking**: Comprehensive session and total data statistics
- **Connection Logs**: Detailed activity logging with timestamps and event types
- **Performance Metrics**: Server load indicators and connection quality metrics

### ⚙️ **Smart Configuration**
- **Auto-Connect**: Automatic connection to preferred servers on startup
- **Protocol Selection**: Choose between OpenVPN, WireGuard, or IKEv2
- **Notification System**: Real-time alerts for connection status changes
- **Settings Export/Import**: Backup and restore configuration settings

### 🎨 **Modern User Experience**
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Dark/Light Themes**: Customizable interface themes
- **Intuitive Navigation**: Clean tab-based interface for easy feature access
- **Professional UI**: Modern glass-morphism design with smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)
- **Windows**: Administrator privileges for DNS enforcement
- **Linux/macOS**: sudo/root access for tunnel configuration

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nebula-media-3d/nebula-vpn-client.git
   cd nebula-vpn-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Configure server environment**
   ```bash
   node scripts/generate-secrets.js --admin-email your@email.com --admin-password "YourStr0ng!Pass"
   ```

4. **Start the application (Windows)**
   ```powershell
   # All-in-one launcher: Starts API server + Electron app (RECOMMENDED)
   .\start-nebula.ps1
   ```
   
   Or manually (separate terminals):
   ```bash
   # Terminal 1: Start API server
   cd server && npm start
   
   # Terminal 2: Start Electron app (as Administrator)
   .\start-vpn-admin.ps1
   ```

5. **Verify DNS enforcement**
   ```powershell
   .\verify-dns-simple.ps1
   ```

6. **Access the web version**
   Navigate to [http://localhost:3000](http://localhost:3000)
   
   Or visit the live deployment: https://colinnebula.github.io/nebula-vpn-client/

## 📱 Application Structure

```
src/
├── components/
│   ├── ConnectButton/          # Main connection control
│   ├── ServerList/             # Server selection interface
│   ├── StatusIndicator/        # Connection status display
│   ├── LoginForm/              # User authentication
│   ├── TrafficMonitor/         # Real-time traffic analysis
│   ├── SettingsPanel/          # Configuration management
│   └── ConnectionLog/          # Activity logging
├── App.js                      # Main application component
├── App.css                     # Global styles
└── index.js                    # Application entry point
```

## 🎯 Core Functionality

### Authentication System
- Secure user login with validation
- Session management with logout capability
- Demo mode for testing and evaluation

### Server Management
- **8 Global Servers**: US East/West, Europe, Asia, Canada, UK, Australia, Japan
- **Smart Sorting**: Sort by name, ping, or server load
- **Load Balancing**: Visual server load indicators (0-100%)
- **Geographic Distribution**: Flag-based country identification

### Traffic Monitoring
- **Real-time Speed**: Live download/upload bandwidth monitoring
- **Data Tracking**: Session and cumulative data usage
- **Visual Analytics**: Animated speed bars and graphs
- **Export Capabilities**: Download traffic reports

### Connection Logging
- **Event Tracking**: All connection activities logged with timestamps
- **Log Filtering**: Filter by success, error, warning, or info events
- **Search Functionality**: Find specific log entries quickly
- **Export Options**: Download logs for analysis or support

### Settings & Configuration
- **Auto-Connect**: Automatic startup connections
- **Kill Switch**: Security failsafe for connection drops
- **Protocol Selection**: Choose optimal VPN protocol
- **Notification Controls**: Customizable alert preferences

## 🛠️ Development

### Available Scripts

- **`npm start`** - Runs development server on port 3000
- **`npm test`** - Launches test runner
- **`npm run build`** - Creates production build
- **`npm run eject`** - Ejects from Create React App (one-way operation)

### Building for Production

```bash
npm run build
```

The build folder will contain the optimized production files ready for deployment.

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 Technical Specifications

- **Framework**: React 19.1.1
- **Build Tool**: Create React App 5.0.1
- **Styling**: CSS3 with modern features
- **State Management**: React Hooks (useState, useEffect)
- **Responsive Design**: CSS Grid and Flexbox
- **Performance**: Optimized rendering and efficient updates

## 🔧 Customization

### Adding New Servers
Modify the `servers` array in `App.js`:
```javascript
const servers = [
  { 
    id: '9', 
    name: 'New Server', 
    location: 'City Name', 
    ping: '50ms', 
    load: 45, 
    country: 'XX', 
    flag: '🏁' 
  }
];
```

### Theming
Update CSS variables in component stylesheets to match your brand colors and styling preferences.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed by Nebula Media 3D. All rights reserved.

## 📞 Support

For technical support or business inquiries:

- **Email**: support@nebula3ddev.com
- **Developer**: Colin Nebula (info@nebula3ddev.com)
- **Company**: Nebula Media 3D
- **Documentation**: [info.nebula3ddev.com](https://info.nebula3ddev.com)

## 🏆 Acknowledgments

- React team for the excellent framework
- Create React App for the development setup
- Contributors to open-source VPN protocols
- Nebula Media 3D design team for UI/UX inspiration

---

**© 2025 Nebula Media 3D. All rights reserved.**

*Built with ❤️ by Developer Colin Nebula*
