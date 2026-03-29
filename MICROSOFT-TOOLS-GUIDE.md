# Microsoft Tools Integration Guide for Nebula VPN

## Quick Wins (Implement First)

### 1. Package for Microsoft Store (MSIX)

**Benefits:**
- Trusted installation (no Windows SmartScreen warnings)
- Auto-updates via Windows Update
- Better security sandbox
- Potential revenue from Store

**Implementation:**
```powershell
# Install MSIX packaging tool
winget install Microsoft.MsixPackagingTool

# Or use electron-builder with MSIX
npm install --save-dev electron-builder-squirrel-windows
```

Add to `package.json`:
```json
{
  "build": {
    "appx": {
      "displayName": "Nebula VPN",
      "publisherDisplayName": "ColinNebula",
      "identityName": "NebulaVPN",
      "publisher": "CN=YourCertificate",
      "backgroundColor": "#667eea",
      "showNameOnTiles": true
    }
  }
}
```

Build command:
```powershell
npm run electron:build:win -- --win appx
```

---

### 2. Distribute via Windows Package Manager (winget)

**Benefits:**
- `winget install NebulaVPN` for easy installation
- Automatic updates
- Trusted source
- Integrated with Windows 11

**Implementation:**

1. **Create manifest:**
```powershell
# Install winget manifest creator
winget install Microsoft.WinGetCreate

# Generate manifest
wingetcreate new NebulaVPN.exe
```

2. **Submit to winget repository:**
```powershell
# Fork winget-pkgs repo
gh repo fork microsoft/winget-pkgs

# Add your manifest to manifests/c/ColinNebula/NebulaVPN/
# Create PR
```

---

### 3. Add TypeScript for Type Safety

**Benefits:**
- Catch 90% of bugs before runtime
- Better VS Code IntelliSense
- Self-documenting code
- Team collaboration easier

**Implementation:**
```powershell
# Install TypeScript
npm install --save-dev typescript @types/react @types/react-dom @types/node @types/electron

# Create tsconfig.json
npx tsc --init

# Rename .js to .tsx gradually
# Start with one component:
mv src/App.js src/App.tsx
```

**Migration Strategy:**
1. Add `// @ts-check` to existing JS files first
2. Fix type errors one by one
3. Gradually convert to .tsx
4. Enable strict mode when ready

---

### 4. Use Playwright for E2E Testing

**Benefits:**
- Automated testing across Windows versions
- Visual regression testing
- API testing for VPN backend
- Privacy leak detection automation

**Implementation:**
```powershell
npm install --save-dev @playwright/test
npx playwright install
```

Create `tests/vpn-connection.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test('VPN connects successfully', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  
  await window.click('button:has-text("Connect")');
  await expect(window.locator('.status')).toHaveText('Connected');
  
  // Verify IP changed
  const ip = await window.locator('.current-ip').textContent();
  expect(ip).not.toBe('YOUR_REAL_IP');
  
  await app.close();
});

test('DNS leak protection works', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  
  await window.click('button:has-text("Connect")');
  
  // Run DNS leak test
  await window.click('button:has-text("Test DNS")');
  const result = await window.locator('.dns-test-result');
  await expect(result).toHaveText(/No leaks detected/);
  
  await app.close();
});
```

Run tests:
```powershell
npx playwright test
```

---

### 5. Azure Static Web Apps (Free Frontend Hosting)

**Benefits:**
- Free tier (better than GitHub Pages)
- Custom domain + SSL included
- Global CDN
- Automatic CI/CD
- Staging environments

**Implementation:**
```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Login
az login

# Create static web app
az staticwebapp create \
  --name nebula-vpn \
  --resource-group nebula-rg \
  --source https://github.com/ColinNebula/nebula-vpn-client \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --output-location "build"

# Custom domain
az staticwebapp hostname set \
  --name nebula-vpn \
  --hostname vpn.yourdomain.com
```

**GitHub Actions integration** (auto-created):
- Deploys on every push
- Preview deployments for PRs
- Automatic rollback

---

### 6. Azure App Service for Backend (Better than DigitalOcean)

**Benefits:**
- Free tier (F1) available
- Auto-scaling
- Built-in SSL (Let's Encrypt)
- Azure DDoS protection
- Integrated with Azure KeyVault

**Migration from DigitalOcean:**
```powershell
# Create App Service
az webapp up \
  --name nebula-vpn-api \
  --runtime "NODE:18-lts" \
  --resource-group nebula-rg \
  --location eastus2

# Configure environment variables
az webapp config appsettings set \
  --name nebula-vpn-api \
  --settings \
    DB_HOST="@Microsoft.KeyVault(SecretUri=...)" \
    WG_SERVER_PUBLIC_KEY="@Microsoft.KeyVault(SecretUri=...)"

# Enable auto-scaling
az monitor autoscale create \
  --name nebula-autoscale \
  --resource nebula-vpn-api \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

**Cost:** Free tier or ~$10/month (vs DigitalOcean $12/month) with better features

---

### 7. Azure Key Vault for Secrets

**Benefits:**
- Never commit secrets to Git again
- Hardware security modules (HSM)
- Access control and auditing
- Automatic rotation

**Implementation:**
```powershell
# Create Key Vault
az keyvault create \
  --name nebula-vpn-vault \
  --resource-group nebula-rg \
  --location eastus2

# Store secrets
az keyvault secret set \
  --vault-name nebula-vpn-vault \
  --name "WG-SERVER-PRIVATE-KEY" \
  --value "YOUR_PRIVATE_KEY"

az keyvault secret set \
  --vault-name nebula-vpn-vault \
  --name "DATABASE-PASSWORD" \
  --value "YOUR_DB_PASSWORD"
```

**Access from code:**
```javascript
const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");

const credential = new DefaultAzureCredential();
const client = new SecretClient("https://nebula-vpn-vault.vault.azure.net", credential);

const secret = await client.getSecret("WG-SERVER-PRIVATE-KEY");
console.log(secret.value); // Use private key
```

---

### 8. Application Insights for Monitoring

**Benefits:**
- Real-time error tracking
- Performance monitoring
- User analytics
- Custom telemetry

**Implementation:**
```powershell
npm install applicationinsights
```

Add to `electron/main.js`:
```javascript
const appInsights = require('applicationinsights');
appInsights.setup('YOUR_INSTRUMENTATION_KEY')
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .start();

// Track custom events
appInsights.defaultClient.trackEvent({
  name: 'VPN_Connected',
  properties: { server: 'US-East', protocol: 'WireGuard' }
});

appInsights.defaultClient.trackMetric({
  name: 'Connection_Speed',
  value: 125.5 // Mbps
});
```

**Dashboard:** Azure Portal → Application Insights → Live Metrics

---

### 9. Fluent UI for Windows 11 Native Look

**Benefits:**
- Native Windows 11 design
- Accessibility (WCAG 2.1 AA)
- Dark/Light theme support
- Mica/Acrylic effects

**Implementation:**
```powershell
npm install @fluentui/react-components @fluentui/react-icons
```

Replace your current UI:
```jsx
import { FluentProvider, webLightTheme, webDarkTheme, Button } from '@fluentui/react-components';
import { ShieldCheckmarkRegular } from '@fluentui/react-icons';

function App() {
  const [isDark, setIsDark] = useState(false);
  
  return (
    <FluentProvider theme={isDark ? webDarkTheme : webLightTheme}>
      <Button 
        icon={<ShieldCheckmarkRegular />}
        appearance="primary"
      >
        Connect VPN
      </Button>
    </FluentProvider>
  );
}
```

---

### 10. Azure DevOps Pipelines for CI/CD

**Benefits:**
- Free for open source (unlimited minutes)
- Parallel Windows/Mac/Linux builds
- Code signing integration
- Automatic releases

**Implementation:**

Create `azure-pipelines.yml`:
```yaml
trigger:
  - main

pool:
  vmImage: 'windows-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  
- script: npm install
  displayName: 'Install dependencies'

- script: npm run electron:build:win
  displayName: 'Build Electron app'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: 'dist'
    artifactName: 'NebulaVPN-Windows'
```

---

## Implementation Priority

### Phase 1 (This Week) - Quick Wins:
1. ✅ **TypeScript** - Add `// @ts-check` to all JS files
2. ✅ **Playwright** - Automate VPN testing
3. ✅ **Azure Static Web Apps** - Free frontend hosting

### Phase 2 (Next Week) - Distribution:
4. ✅ **MSIX Packaging** - Microsoft Store submission
5. ✅ **winget manifest** - Windows Package Manager

### Phase 3 (This Month) - Infrastructure:
6. ✅ **Azure App Service** - Migrate backend from DigitalOcean
7. ✅ **Azure Key Vault** - Secure secrets management
8. ✅ **Application Insights** - Monitoring and analytics

### Phase 4 (Optional) - Polish:
9. ✅ **Fluent UI** - Native Windows 11 design
10. ✅ **Azure DevOps** - Professional CI/CD

---

## Cost Breakdown

**Free Tier (Recommended for start):**
- Azure Static Web Apps: FREE (100GB bandwidth)
- Azure App Service: FREE (F1 tier - perfect for API)
- Azure Key Vault: $0.03/10,000 operations
- Application Insights: FREE (first 5GB/month)
- Azure DevOps: FREE (unlimited for open source)
- TypeScript: FREE
- Playwright: FREE
- winget: FREE
- Microsoft Store: $19 one-time registration

**Total Monthly Cost:** ~$0-5 (vs current DigitalOcean $12/month)

---

## Next Steps

Run this to get started:
```powershell
# 1. Add TypeScript
npm install --save-dev typescript @types/react @types/node @types/electron

# 2. Add Playwright
npm install --save-dev @playwright/test
npx playwright install

# 3. Install Azure CLI
winget install Microsoft.AzureCLI

# 4. Create Azure free account
az login
```

Want me to create implementation scripts for any of these?
