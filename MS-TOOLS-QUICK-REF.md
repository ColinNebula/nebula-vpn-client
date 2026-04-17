# Microsoft Tools Quick Reference

Quick commands for Microsoft tools integration with Nebula VPN.

## Installation

```powershell
# Install all Microsoft tools (TypeScript, Playwright, Azure CLI, WinGet)
npm run setup:mstools

# Install specific tool
.\SETUP-MS-TOOLS.ps1 -Tool typescript
.\SETUP-MS-TOOLS.ps1 -Tool playwright
.\SETUP-MS-TOOLS.ps1 -Tool azure
```

## TypeScript

```powershell
# Type check all files
npm run typecheck

# Add type checking to a JavaScript file
# Add this to the top of any .js file:
// @ts-check

# Example with JSDoc types:
/**
 * @param {string} message
 * @param {number} timeout
 * @returns {Promise<void>}
 */
async function showNotification(message, timeout) {
  // TypeScript will now check types
}
```

**Files to check first:**
- `src/App.js` - Main React component
- `electron/main.js` - Electron main process
- `server/src/index.js` - Backend API

## Playwright Testing

```powershell
# Run all tests
npm run test:playwright

# Run tests with UI (interactive mode)
npm run test:playwright:ui

# View test report
npm run test:playwright:report

# Run specific test file
npx playwright test tests/vpn.spec.js

# Debug mode (step through tests)
npx playwright test --debug
```

**Sample tests included:**
- `tests/vpn.spec.js` - VPN connection and UI tests

**Add new tests:**
```javascript
// tests/login.spec.js
const { test, expect } = require('@playwright/test');

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Login")');
  
  await expect(page.locator('.dashboard')).toBeVisible();
});
```

## Azure Deployment

```powershell
# Deploy to Azure (FREE tier - $0/month)
npm run deploy:azure

# Deploy to specific region
.\DEPLOY-AZURE.ps1 -Location westus2

# Deploy without rebuilding
.\DEPLOY-AZURE.ps1 -SkipBuild

# View backend logs
az webapp log tail --name nebula-vpn-api --resource-group nebula-vpn-rg

# View frontend
az staticwebapp browse --name nebula-vpn-app --resource-group nebula-vpn-rg
```

**Azure resources created:**
- Static Web App (FREE tier) - Frontend hosting
- App Service F1 (FREE tier) - Backend API
- Resource Group - Container for all resources

**Upgrade to paid tier:**
```powershell
# Upgrade backend to Basic tier ($13/month, better performance)
az appservice plan update --name nebula-vpn-api-plan --resource-group nebula-vpn-rg --sku B1

# Upgrade Static Web App to Standard ($9/month, custom domains)
az staticwebapp update --name nebula-vpn-app --resource-group nebula-vpn-rg --sku Standard
```

## MSIX Packaging (Microsoft Store)

```powershell
# Install MSIX tools
winget install Microsoft.WindowsSDK

# Create MSIX package
cd electron
MakeAppx pack /d dist/win-unpacked /p Nebula-VPN.msix

# Sign package
SignTool sign /fd SHA256 /a Nebula-VPN.msix

# Install locally (testing)
Add-AppxPackage Nebula-VPN.msix
```

**Upload to Microsoft Store:**
1. Go to [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
2. Create new app submission
3. Upload Nebula-VPN.msix
4. Fill out app details, screenshots, description
5. Submit for certification

## WinGet Distribution

```powershell
# Install WinGet manifest creator
winget install Microsoft.WinGetCreate

# Create manifest for Nebula VPN
wingetcreate new dist/Nebula-VPN-Setup.exe

# Test manifest locally
winget install --manifest .\manifests\ColinNebula\NebulaVPN\0.2.0

# Submit to official repository
# 1. Fork: https://github.com/microsoft/winget-pkgs
# 2. Add manifest to /manifests/c/ColinNebula/NebulaVPN/0.2.0/
# 3. Create Pull Request
```

**After approval, users install with:**
```powershell
winget install ColinNebula.NebulaVPN
```

## Application Insights (Monitoring)

```powershell
# Install Application Insights SDK
npm install applicationinsights

# Add to server/src/index.js:
const appInsights = require('applicationinsights');
appInsights.setup('YOUR_INSTRUMENTATION_KEY')
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .start();

# Get instrumentation key
az monitor app-insights component create \
  --app nebula-insights \
  --location eastus2 \
  --resource-group nebula-vpn-rg
```

**View metrics:**
- Azure Portal → Application Insights → nebula-insights
- Live Metrics Stream for real-time monitoring
- Custom queries with Kusto Query Language (KQL)

## Cost Comparison

| Service | Current (GitHub/DO) | Azure (Free) | Azure (Paid) |
|---------|---------------------|--------------|--------------|
| Frontend | GitHub Pages (Free) | Static Web App (Free) | Static Web App ($9/mo) |
| Backend | DigitalOcean ($12/mo) | App Service F1 (Free) | App Service B1 ($13/mo) |
| SSL | Let's Encrypt (Free) | Included (Free) | Included (Free) |
| CDN | None | Included (Free) | Included (Free) |
| **Total** | **$12/month** | **$0/month** | **$22/month** |

**Free tier limitations:**
- 100 GB bandwidth/month (Static Web App)
- 1 GB memory, 60 min CPU/day (App Service F1)
- No custom domains (can upgrade later)

**Paid tier benefits:**
- Unlimited bandwidth
- Always-on backend
- Custom domains with SSL
- 99.95% SLA
- Better performance

## Fluent UI (Microsoft Design)

```powershell
# Install Fluent UI React
npm install @fluentui/react

# Use in components:
import { PrimaryButton, TextField, Stack } from '@fluentui/react';

function ConnectPanel() {
  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <TextField label="Server" placeholder="Enter server address" />
      <PrimaryButton text="Connect" onClick={handleConnect} />
    </Stack>
  );
}
```

**Components to replace first:**
- Buttons → `<PrimaryButton>`, `<DefaultButton>`
- Inputs → `<TextField>`, `<Dropdown>`
- Dialogs → `<Dialog>`, `<Modal>`
- Navigation → `<Nav>`, `<Pivot>`

## Recommended Workflow

### Week 1: Quick Wins
```powershell
# 1. Install tools
npm run setup:mstools

# 2. Add type checking to critical files
# Add // @ts-check to:
#   - src/App.js
#   - electron/main.js
#   - server/src/index.js

# 3. Run type checker
npm run typecheck

# 4. Deploy to Azure (FREE tier)
npm run deploy:azure

# 5. Write first Playwright test
npm run test:playwright
```

### Week 2: Testing & Packaging
```powershell
# 1. Add more Playwright tests
# tests/login.spec.js
# tests/settings.spec.js
# tests/subscription.spec.js

# 2. Create MSIX package
# Follow MSIX Packaging section above

# 3. Submit to WinGet
# Follow WinGet Distribution section above
```

### Month 1: Full Migration
```powershell
# 1. Migrate all components to TypeScript
# Rename .js → .tsx one by one

# 2. Add Application Insights monitoring
# See Application Insights section above

# 3. Implement Fluent UI design
# Replace buttons, inputs, dialogs

# 4. Set up Azure DevOps CI/CD
# Auto-deploy on git push
```

## Troubleshooting

### TypeScript errors
```powershell
# Error: "Could not find a declaration file"
npm install --save-dev @types/react @types/node

# Error: "Cannot find module"
# Add to tsconfig.json:
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowJs": true
  }
}
```

### Playwright test failures
```powershell
# Timeout errors - increase timeout
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});

# Element not found - wait for it
await page.waitForSelector('.element', { state: 'visible' });

# Debug with screenshots
await page.screenshot({ path: 'debug.png' });
```

### Azure deployment issues
```powershell
# Not logged in
az login

# Wrong subscription
az account set --subscription "Your Subscription Name"

# Backend won't start
# Check logs:
az webapp log tail --name nebula-vpn-api --resource-group nebula-vpn-rg

# Environment variables not set
az webapp config appsettings set --name nebula-vpn-api --resource-group nebula-vpn-rg --settings VAR=value
```

## Next Steps

1. **Read full guide:** [MICROSOFT-TOOLS-GUIDE.md](MICROSOFT-TOOLS-GUIDE.md)
2. **Install tools:** `npm run setup:mstools`
3. **Deploy to Azure:** `npm run deploy:azure`
4. **Write tests:** `npm run test:playwright`
5. **Add type checking:** Add `// @ts-check` to files

---

**Need help?** See [MICROSOFT-TOOLS-GUIDE.md](MICROSOFT-TOOLS-GUIDE.md) for detailed implementation guides.
