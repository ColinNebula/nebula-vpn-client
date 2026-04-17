# Quick Reference: Plan-Based Features

## 🔐 Feature Access at a Glance

| Feature | Free | Premium | Ultimate |
|---------|------|---------|----------|
| **Servers** | 3 | 50+ | All |
| **Devices** | 1 | 5 | Unlimited |
| **Bandwidth** | 10GB/mo | Unlimited | Unlimited |
| **Speed** | Standard | Ultra-Fast | Ultra-Fast |
| **Multi-Hop** | ❌ | ✅ | ✅ |
| **Split Tunneling** | ❌ | ✅ | ✅ |
| **Kill Switch** | ❌ | ✅ | ✅ |
| **Speed Test** | ❌ | ✅ | ✅ |
| **Analytics** | ❌ | ✅ | ✅ |
| **Threat Detection** | ❌ | ✅ | ✅ |
| **Automation** | ❌ | ✅ | ✅ |
| **Enterprise** | ❌ | ❌ | ✅ |
| **AI/ML** | ❌ | ❌ | ✅ |
| **Next-Gen** | ❌ | ❌ | ✅ |
| **Support** | Community | Email | Priority 24/7 |

## 🎯 Quick Test Commands

```javascript
// FREE USER TEST
localStorage.setItem('user', JSON.stringify({ email: 'test@free.com', plan: 'free' }));
location.reload();

// PREMIUM USER TEST  
localStorage.setItem('user', JSON.stringify({ email: 'test@premium.com', plan: 'premium' }));
location.reload();

// ULTIMATE USER TEST
localStorage.setItem('user', JSON.stringify({ email: 'test@ultimate.com', plan: 'ultimate' }));
location.reload();
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/config/planFeatures.js` | Feature configuration |
| `src/components/UpgradePrompt/` | Upgrade prompt component |
| `src/App.js` | Main app with restrictions |
| `PLAN_RESTRICTIONS.md` | Full documentation |
| `FEATURE_RESTRICTIONS_COMPLETE.md` | Complete guide |

## 🔧 Common Tasks

### Change Server Count for Free Users:
Edit `src/config/planFeatures.js`:
```javascript
free: {
  servers: {
    allowedServers: ['1', '2', '3', '4'], // Add more server IDs
```

### Add New Premium Feature:
1. Add to `planFeatures.js`
2. Wrap in App.js with `hasFeature()`
3. Add UpgradePrompt for free users

### Change Pricing:
Edit `src/components/SubscriptionModal/index.js`

## ✅ What Free Users See

**Visible Tabs:**
- Dashboard
- Servers (3 only)
- Traffic
- Logs
- Settings

**Hidden Tabs:**
- Multi-Hop
- Split Tunnel
- Speed Test
- Analytics
- Security
- Automation
- Experience
- Enterprise
- AI/ML
- Next-Gen
- Mobile

## 💎 What Premium Users See

**All Free Features PLUS:**
- Multi-Hop tab
- Split Tunnel tab
- Speed Test tab
- Analytics tab (full suite)
- Security tab (full suite)
- Automation tab (full suite)
- Experience tab
- Mobile tab
- 50+ servers
- Unlimited bandwidth

**Still Hidden:**
- Enterprise tab
- AI/ML tab
- Next-Gen tab

## 👑 What Ultimate Users See

**EVERYTHING!** All tabs, all features, unlimited everything.

## 🎨 UI Behavior

**Free User Clicks Hidden Feature:**
→ Nothing (tab doesn't exist)

**Free User Direct URL to Premium Feature:**
→ Beautiful full-screen upgrade prompt

**Premium User Tries Ultimate Feature:**
→ Full-screen upgrade prompt for Ultimate

**Plan Upgrades:**
→ Instant UI update, no reload needed

## 📊 Success Metrics

**Key Conversions to Track:**
1. Free → Premium conversion rate
2. Premium → Ultimate conversion rate
3. Time to first upgrade
4. Most-attempted locked features
5. Upgrade prompt → Modal → Purchase funnel

**Target Goals:**
- 15% Free → Premium
- 20% Premium → Ultimate
- <5 min time to upgrade decision

## 💡 Pro Tips

1. **Test Each Plan**: Use the quick test commands above
2. **Monitor Analytics**: Track which features users try to access
3. **A/B Test**: Try different upgrade prompt messages
4. **Seasonal Promos**: "50% off Premium this week!"
5. **User Feedback**: Ask why they upgraded or didn't

## 🚨 Troubleshooting

**Tabs Not Hiding:**
- Check `hasFeature()` wrapper in App.js
- Verify plan in localStorage
- Check browser console for errors

**Upgrade Prompt Not Showing:**
- Verify UpgradePrompt component imported
- Check ternary operator syntax
- Ensure feature name matches planFeatures.js

**Wrong Servers Showing:**
- Check `getAllowedServers()` function
- Verify server IDs in planFeatures.js
- Console.log the filtered servers array

**Plan Not Updating:**
- Check `setCurrentPlan()` call
- Verify localStorage sync
- Check React DevTools state

## 📞 Support

For issues:
1. Check `PLAN_RESTRICTIONS.md` for detailed docs
2. Review error messages in browser console
3. Test with different plans using quick commands above
4. Verify component imports in App.js
