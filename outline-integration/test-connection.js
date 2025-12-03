/**
 * Test Outline VPN Connection
 * Run: node test-connection.js
 */

const OutlineService = require('./OutlineService');

// Example Outline access keys (you'll get these from Outline Manager)
const EXAMPLE_ACCESS_KEYS = [
  // Replace these with your actual Outline server access keys
  // Format: ss://base64encoded@server-ip:port/?outline=1
  'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTp0ZXN0cGFzc3dvcmQ=@192.0.2.1:8388/?outline=1',
  'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTp0ZXN0cGFzc3dvcmQ=@192.0.2.2:8388/?outline=1',
];

async function testOutlineIntegration() {
  console.log('🧪 Testing Outline VPN Integration\n');

  // Set environment variable
  process.env.OUTLINE_SERVERS = EXAMPLE_ACCESS_KEYS.join(',');

  const outlineService = new OutlineService();

  console.log('1️⃣ Get available servers:');
  const servers = outlineService.getServers();
  console.log(JSON.stringify(servers, null, 2));
  console.log('');

  console.log('2️⃣ Test server connectivity:');
  try {
    const testResult = await outlineService.testServer('outline-1');
    console.log(JSON.stringify(testResult, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  console.log('');

  console.log('3️⃣ Connect to server:');
  try {
    const connection = await outlineService.connect('user-123', 'outline-1');
    console.log(JSON.stringify(connection, null, 2));
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
  console.log('');

  console.log('4️⃣ Get connection status:');
  const status = outlineService.getStatus('user-123');
  console.log(JSON.stringify(status, null, 2));
  console.log('');

  console.log('5️⃣ Get traffic stats:');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  const traffic = outlineService.getTrafficStats('user-123');
  console.log(JSON.stringify(traffic, null, 2));
  console.log('');

  console.log('6️⃣ Disconnect:');
  const disconnect = await outlineService.disconnect('user-123');
  console.log(JSON.stringify(disconnect, null, 2));
  console.log('');

  console.log('✅ All tests completed!\n');

  console.log('📝 Next Steps:');
  console.log('1. Deploy Outline servers using Outline Manager');
  console.log('2. Get real access keys from your servers');
  console.log('3. Add them to server/.env as OUTLINE_SERVERS');
  console.log('4. Integrate with Nebula VPN backend');
}

testOutlineIntegration().catch(console.error);
