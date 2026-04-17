# Plan-Based Feature Restrictions

This document outlines how features are restricted based on subscription tiers (Free, Premium, Ultimate).

## Implementation Overview

### Configuration File
Location: `src/config/planFeatures.js`

This file contains:
- `PLAN_FEATURES` object with all feature flags for each plan
- `hasFeature(plan, feature)` helper function
- `getAllowedServers(plan, allServers)` function
- Other utility functions for plan management

### Upgrade Prompt Component
Location: `src/components/UpgradePrompt/`

A reusable component that displays when users try to access premium/ultimate features:
- **Full screen mode**: For major features (tabs, main sections)
- **Inline mode**: For smaller features within a page

## Feature Access by Plan

### FREE PLAN
**What Free Users See:**
- ✅ Dashboard (basic view only)
- ✅ 3 Server Locations (US East, US West, Europe)
- ✅ Basic Traffic Monitor
- ✅ Connection Logs
- ✅ Settings
- ✅ Limited to 1 device
- ✅ 10GB bandwidth per month
- ❌ No advanced tabs (Multi-Hop, Split Tunnel, Analytics, Security, Automation, etc.)
- ❌ No speed test
- ❌ No multi-hop VPN
- ❌ No split tunneling
- ❌ No kill switch

**Hidden UI Elements for Free Users:**
- Multi-Hop tab
- Split Tunnel tab
- Analytics tab
- Security tab
- Automation tab
- Experience tab
- Enterprise tab
- AI/ML tab
- Next-Gen tab
- Mobile Optimizations tab
- Speed Test tab

### PREMIUM PLAN ($9.99/month)
**What Premium Users Get (Everything in Free +):**
- ✅ 50+ Server Locations
- ✅ Unlimited Bandwidth
- ✅ 5 Devices
- ✅ Multi-Hop VPN
- ✅ Split Tunneling
- ✅ Kill Switch
- ✅ Speed Test
- ✅ All Analytics (Traffic, Performance, History, Usage, Map)
- ✅ All Security Features (Threat Detection, DNS Protection, IPv6, Firewall, Obfuscation, 2FA)
- ✅ Automation (Rules, Bandwidth Scheduler, Network Monitor, Privacy Audit)
- ✅ Experience Features (Live Dashboard, Customization, Quick Actions, Session Manager)
- ✅ Mobile Optimizations
- ❌ No Enterprise features
- ❌ No AI/ML features
- ❌ No Next-Gen features

### ULTIMATE PLAN ($19.99/month)
**What Ultimate Users Get (Everything +):**
- ✅ **EVERYTHING** - All features unlocked
- ✅ Unlimited Devices
- ✅ Unlimited Servers
- ✅ Enterprise Features (Network Topology, Compliance Center, API Integration, Advanced Analytics, Security Operations)
- ✅ AI/ML Features (AI Network Optimizer, Predictive Security, Intelligent Assistant, Smart Analytics, Adaptive Learning)
- ✅ Next-Gen Features (Collaborative VPN, Mobile Device Manager, Blockchain Integration, Quantum Security, Edge Computing)

## How It Works

### 1. Server Restrictions
```javascript
// In App.js
const allServers = [ /* all 10 servers */ ];
const servers = getAllowedServers(currentPlan, allServers);
// Free users only get servers with IDs '1', '2', '3'
// Premium/Ultimate get all servers
```

### 2. Tab Visibility
```javascript
// Tabs are conditionally rendered based on features
{hasFeature(currentPlan, 'multiHop') && (
  <button className="tab" onClick={() => setActiveTab('multihop')}>
    🔗 Multi-Hop
  </button>
)}
```

### 3. Feature Upgrade Prompts
```javascript
// If user doesn't have access, show upgrade prompt
{activeTab === 'multihop' && (
  hasFeature(currentPlan, 'multiHop') ? (
    <MultiHop ... />
  ) : (
    <UpgradePrompt 
      feature="multiHop"
      requiredPlan="premium"
      onUpgrade={() => setShowSubscriptionModal(true)}
      fullScreen={true}
    />
  )
)}
```

## User Experience Flow

### Free User Journey
1. **Login** → See only basic features
2. **View Servers** → Only 3 locations available
3. **Try to use advanced features** → Features hidden/not visible
4. **See "Upgrade" button** → Prominently displayed
5. **See Promo Banner** → Auto-appears after 10 seconds
6. **Click Upgrade** → Subscription modal opens

### Premium User Journey
1. **Login** → All Premium features visible
2. **Access advanced features** → Multi-hop, analytics, security all work
3. **Try Ultimate features** → See upgrade prompts for Ultimate-only features
4. **No promo banner** → Only shown to free users

### Ultimate User Journey
1. **Login** → Everything unlocked
2. **Full access** → All tabs visible, all features work
3. **No restrictions** → Complete platform access

## Testing Plan Restrictions

### Test as Free User
```javascript
// In App.js or browser console
localStorage.setItem('user', JSON.stringify({ 
  email: 'test@example.com', 
  plan: 'free' 
}));
// Reload page
```

### Test as Premium User
```javascript
localStorage.setItem('user', JSON.stringify({ 
  email: 'test@example.com', 
  plan: 'premium' 
}));
// Reload page
```

### Test as Ultimate User
```javascript
localStorage.setItem('user', JSON.stringify({ 
  email: 'test@example.com', 
  plan: 'ultimate' 
}));
// Reload page
```

## Adding New Feature Restrictions

### Step 1: Add to planFeatures.js
```javascript
export const PLAN_FEATURES = {
  free: {
    newFeature: false,
  },
  premium: {
    newFeature: true,
  },
  ultimate: {
    newFeature: true,
  }
};
```

### Step 2: Conditionally Render in App.js
```javascript
{hasFeature(currentPlan, 'newFeature') && (
  <button className="tab">New Feature</button>
)}
```

### Step 3: Add Upgrade Prompt
```javascript
{activeTab === 'newfeature' && (
  hasFeature(currentPlan, 'newFeature') ? (
    <NewFeatureComponent />
  ) : (
    <UpgradePrompt 
      feature="newFeature"
      requiredPlan="premium"
      onUpgrade={() => setShowSubscriptionModal(true)}
      fullScreen={true}
    />
  )
)}
```

## Migration & Upgrade Path

When a user upgrades their plan:
1. Update `currentPlan` state in App.js
2. Save to localStorage/backend
3. UI automatically updates (tabs appear, features unlock)
4. No page reload needed (React state management)

```javascript
const handlePlanUpgrade = (newPlan) => {
  setCurrentPlan(newPlan);
  localStorage.setItem('user', JSON.stringify({ 
    ...user, 
    plan: newPlan 
  }));
  // Backend API call would go here
};
```

## Bandwidth Limiting (Free Plan)

Free users have 10GB/month bandwidth limit:
- Track usage in `trafficData` state
- Show warning at 80% (8GB)
- Block connection at 100% (10GB)
- Reset monthly (backend would handle this)

```javascript
// Pseudo-code for bandwidth check
const totalUsedGB = (trafficData.totalDownload + trafficData.totalUpload) / 1024 / 1024 / 1024;
if (currentPlan === 'free' && totalUsedGB >= 10) {
  // Show upgrade modal
  // Prevent new connections
}
```

## Device Limiting

- Free: 1 device
- Premium: 5 devices
- Ultimate: Unlimited

Track devices in backend, check on connection attempt.

## Best Practices

### 1. Clear Communication
- Always explain why a feature is locked
- Show what plan is needed
- Display price and benefits

### 2. Graceful Degradation
- Free users should still get value
- Don't frustrate with too many restrictions
- Make upgrade path obvious but not annoying

### 3. Upsell Opportunities
- Show upgrade prompts at the right time
- Highlight most valuable features
- Use social proof and testimonials

### 4. A/B Testing
- Test different upgrade messages
- Experiment with promo timing
- Track conversion rates

## Analytics to Track

1. **Feature Attempt Rate**: How often free users try to access premium features
2. **Conversion Rate**: Free → Premium → Ultimate
3. **Churn Rate**: Downgrades or cancellations
4. **Feature Usage**: Which premium features are most used
5. **Upgrade Trigger**: Which feature prompts lead to upgrades

## Future Enhancements

1. **Trial Periods**: Give free users 7-day trials of premium features
2. **Feature Previews**: Show demos of locked features
3. **Usage-Based Upsells**: "You've used X, upgrade for unlimited"
4. **Team Plans**: Family/business multi-user plans
5. **Add-Ons**: À la carte feature purchases
