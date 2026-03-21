// Emergency fix to synchronize selectedServer state with localStorage
// This script will force the React state to match what's stored in localStorage

// Function to fix the selectedServer state synchronization 
window.fixServerSync = function() {
    console.log('🔧 Emergency server sync fix starting...');
    
    // Get the current preferences
    const prefs = JSON.parse(localStorage.getItem('nebula_prefs_colinnebula@nebula3ddev.com') || '{}');
    console.log('📋 Current preferences:', prefs);
    
    if (!prefs.selectedServerId) {
        console.log('❌ No selected server ID in preferences');
        return false;
    }
    
    // Define the server list (matching App.js allServers)
    const allServers = [
        { id: '1',  name: 'US East',          location: 'New York',      ping: '25ms',  load: 45, country: 'US', flag: '🇺🇸' },
        { id: '2',  name: 'US West',          location: 'Los Angeles',   ping: '18ms',  load: 32, country: 'US', flag: '🇺🇸' },
        { id: '3',  name: 'US Central',       location: 'Chicago',       ping: '22ms',  load: 41, country: 'US', flag: '🇺🇸' }
    ];
    
    // Find the selected server
    const selectedServer = allServers.find(s => s.id === prefs.selectedServerId);
    
    if (!selectedServer) {
        console.log('❌ Server not found for ID:', prefs.selectedServerId);
        return false;
    }
    
    console.log('✅ Found server:', selectedServer);
    
    // Try to find React component and force state update
    const rootElement = document.querySelector('#root');
    if (rootElement) {
        // Look for React fiber properties
        const reactProps = Object.keys(rootElement).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber'));
        
        if (reactProps) {
            console.log('🌉 Found React root, attempting force update...');
            
            // Trigger a re-render by dispatching a custom event
            const event = new CustomEvent('forceResetServer', {
                detail: { server: selectedServer, serverId: prefs.selectedServerId }
            });
            
            document.dispatchEvent(event);
            rootElement.dispatchEvent(event);
            
            console.log('📡 Dispatched forceResetServer event');
        }
    }
    
    // Alternative approach: try to trigger clicks to force state sync
    console.log('🔄 Attempting alternative server selection...');
    
    // Find and click server dropdown
    const serverDropdown = document.querySelector('[class*="server"], [contains(@class, "dropdown")]');
    if (serverDropdown && serverDropdown.click) {
        serverDropdown.click();
        
        setTimeout(() => {
            // Look for the US West option
            const usWestOption = Array.from(document.querySelectorAll('*'))
                .find(el => el.textContent.includes('US West') && (el.click || el.tagName === 'BUTTON'));
            
            if (usWestOption && usWestOption.click) {
                usWestOption.click();
                console.log('🎯 Clicked US West server option');
            }
        }, 500);
    }
    
    return true;
};

// Auto-execute the fix
setTimeout(() => {
    console.log('🚀 Auto-executing server sync fix...');
    window.fixServerSync();
}, 1000);