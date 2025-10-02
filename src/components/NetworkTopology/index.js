import React, { useState, useEffect } from 'react';
import './NetworkTopology.css';

const NetworkTopology = ({ isConnected, selectedServer, multiHopServers, servers }) => {
  const [topologyView, setTopologyView] = useState('network'); // network, routes, traffic
  const [selectedNode, setSelectedNode] = useState(null);
  const [networkNodes, setNetworkNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [latencyData, setLatencyData] = useState({});
  const [trafficFlow, setTrafficFlow] = useState([]);
  const [scanResults, setScanResults] = useState({
    devices: 24,
    routers: 3,
    switches: 8,
    endpoints: 45,
    vulnerabilities: 2
  });

  useEffect(() => {
    // Generate network topology
    const nodes = [
      { id: 'client', name: 'Your Device', type: 'client', x: 50, y: 300, status: 'online' },
      { id: 'router', name: 'Local Router', type: 'router', x: 200, y: 300, status: 'online' },
      { id: 'isp', name: 'ISP Gateway', type: 'isp', x: 350, y: 300, status: 'online' },
      { id: 'vpn-entry', name: 'VPN Entry', type: 'vpn', x: 500, y: 200, status: isConnected ? 'online' : 'offline' },
      { id: 'vpn-exit', name: 'VPN Exit', type: 'vpn', x: 650, y: 200, status: isConnected ? 'online' : 'offline' },
      { id: 'target', name: 'Target Server', type: 'server', x: 800, y: 300, status: 'online' }
    ];

    if (multiHopServers.length > 0) {
      multiHopServers.forEach((server, index) => {
        nodes.push({
          id: `hop-${index}`,
          name: server.name,
          type: 'vpn',
          x: 500 + (index * 100),
          y: 150 + (index * 20),
          status: 'online'
        });
      });
    }

    setNetworkNodes(nodes);

    // Generate connections
    const conns = [
      { from: 'client', to: 'router', type: 'ethernet', latency: 1 },
      { from: 'router', to: 'isp', type: 'broadband', latency: 15 },
      { from: 'isp', to: 'vpn-entry', type: 'internet', latency: 45 },
      { from: 'vpn-entry', to: 'vpn-exit', type: 'tunnel', latency: 25 },
      { from: 'vpn-exit', to: 'target', type: 'internet', latency: 35 }
    ];

    setConnections(conns);

    // Generate latency heatmap data
    const latencyMap = {};
    servers.forEach(server => {
      latencyMap[server.id] = {
        latency: parseInt(server.ping),
        jitter: Math.random() * 10,
        packetLoss: Math.random() * 2,
        bandwidth: Math.random() * 100 + 50
      };
    });
    setLatencyData(latencyMap);

    // Generate traffic flow data
    const flows = [
      { from: 'client', to: 'router', volume: 85, protocol: 'HTTPS' },
      { from: 'router', to: 'isp', volume: 92, protocol: 'TCP' },
      { from: 'isp', to: 'vpn-entry', volume: 78, protocol: 'OpenVPN' },
      { from: 'vpn-entry', to: 'vpn-exit', volume: 75, protocol: 'Encrypted' },
      { from: 'vpn-exit', to: 'target', volume: 73, protocol: 'HTTPS' }
    ];
    setTrafficFlow(flows);
  }, [isConnected, multiHopServers, servers]);

  const getNodeColor = (node) => {
    if (node.status === 'offline') return '#ef4444';
    if (node.type === 'client') return '#10b981';
    if (node.type === 'vpn') return '#6366f1';
    if (node.type === 'router') return '#f59e0b';
    if (node.type === 'isp') return '#3b82f6';
    return '#8b5cf6';
  };

  const getConnectionStyle = (connection) => {
    const latency = connection.latency;
    if (latency < 20) return { color: '#10b981', width: 3 };
    if (latency < 50) return { color: '#f59e0b', width: 2 };
    return { color: '#ef4444', width: 2 };
  };

  const runNetworkScan = () => {
    alert('🔍 Network discovery scan initiated...\n\nScanning for devices, analyzing routes, and checking security posture.\n\nResults will be available in the Network Devices panel.');
    
    // Simulate scan results update
    setTimeout(() => {
      setScanResults(prev => ({
        ...prev,
        devices: prev.devices + Math.floor(Math.random() * 5),
        vulnerabilities: Math.floor(Math.random() * 3)
      }));
    }, 2000);
  };

  const traceRoute = () => {
    if (!selectedServer && multiHopServers.length === 0) {
      alert('Please connect to a server first to trace the route.');
      return;
    }
    
    const targetServer = selectedServer || multiHopServers[multiHopServers.length - 1];
    alert(`🛤️ Tracing route to ${targetServer.name}...\n\n1. Local Router (1ms)\n2. ISP Gateway (15ms)\n3. Regional Hub (45ms)\n4. ${targetServer.name} (${targetServer.ping})\n\nRoute trace complete!`);
  };

  return (
    <div className="network-topology">
      <div className="topology-header">
        <h3>🌐 Network Topology</h3>
        <div className="topology-controls">
          <div className="view-selector">
            <button 
              className={`view-btn ${topologyView === 'network' ? 'active' : ''}`}
              onClick={() => setTopologyView('network')}
            >
              🗺️ Network Map
            </button>
            <button 
              className={`view-btn ${topologyView === 'routes' ? 'active' : ''}`}
              onClick={() => setTopologyView('routes')}
            >
              🛤️ Route Analysis
            </button>
            <button 
              className={`view-btn ${topologyView === 'traffic' ? 'active' : ''}`}
              onClick={() => setTopologyView('traffic')}
            >
              📊 Traffic Flow
            </button>
          </div>
          <div className="action-buttons">
            <button className="action-btn" onClick={runNetworkScan}>
              🔍 Discover
            </button>
            <button className="action-btn" onClick={traceRoute}>
              🛤️ Trace Route
            </button>
          </div>
        </div>
      </div>

      <div className="topology-content">
        {topologyView === 'network' && (
          <div className="network-view">
            <div className="network-canvas">
              <svg width="900" height="400" viewBox="0 0 900 400">
                {/* Connection Lines */}
                {connections.map((conn, index) => {
                  const fromNode = networkNodes.find(n => n.id === conn.from);
                  const toNode = networkNodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  
                  const style = getConnectionStyle(conn);
                  return (
                    <g key={index}>
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={style.color}
                        strokeWidth={style.width}
                        strokeDasharray={conn.type === 'tunnel' ? '5,5' : 'none'}
                      />
                      <text
                        x={(fromNode.x + toNode.x) / 2}
                        y={(fromNode.y + toNode.y) / 2 - 10}
                        fill="var(--text-secondary)"
                        fontSize="12"
                        textAnchor="middle"
                      >
                        {conn.latency}ms
                      </text>
                    </g>
                  );
                })}

                {/* Network Nodes */}
                {networkNodes.map(node => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      fill={getNodeColor(node)}
                      stroke="var(--border-color)"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedNode(node)}
                    />
                    <text
                      x={node.x}
                      y={node.y + 35}
                      fill="var(--text-primary)"
                      fontSize="12"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {node.name}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 5}
                      fill="white"
                      fontSize="16"
                      textAnchor="middle"
                    >
                      {node.type === 'client' && '💻'}
                      {node.type === 'router' && '📶'}
                      {node.type === 'isp' && '🏢'}
                      {node.type === 'vpn' && '🛡️'}
                      {node.type === 'server' && '🌐'}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {selectedNode && (
              <div className="node-details">
                <h4>🔍 Node Details: {selectedNode.name}</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{selectedNode.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${selectedNode.status}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Latency:</span>
                    <span className="detail-value">
                      {latencyData[selectedNode.id]?.latency || 'N/A'}ms
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bandwidth:</span>
                    <span className="detail-value">
                      {latencyData[selectedNode.id]?.bandwidth?.toFixed(1) || 'N/A'} Mbps
                    </span>
                  </div>
                </div>
                <button 
                  className="close-details"
                  onClick={() => setSelectedNode(null)}
                >
                  ✕ Close
                </button>
              </div>
            )}
          </div>
        )}

        {topologyView === 'routes' && (
          <div className="routes-view">
            <div className="routes-grid">
              <div className="route-card">
                <h4>🛤️ Current Route Path</h4>
                <div className="route-hops">
                  {connections.map((conn, index) => (
                    <div key={index} className="hop-item">
                      <span className="hop-number">{index + 1}</span>
                      <div className="hop-details">
                        <span className="hop-name">
                          {networkNodes.find(n => n.id === conn.from)?.name} → {networkNodes.find(n => n.id === conn.to)?.name}
                        </span>
                        <span className="hop-latency">{conn.latency}ms ({conn.type})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="latency-heatmap">
                <h4>🌡️ Server Latency Heatmap</h4>
                <div className="heatmap-grid">
                  {servers.slice(0, 8).map(server => {
                    const data = latencyData[server.id] || {};
                    const latency = data.latency || parseInt(server.ping);
                    const heatLevel = latency < 30 ? 'low' : latency < 80 ? 'medium' : 'high';
                    
                    return (
                      <div key={server.id} className={`heatmap-cell ${heatLevel}`}>
                        <span className="cell-flag">{server.flag}</span>
                        <span className="cell-name">{server.name}</span>
                        <span className="cell-latency">{latency}ms</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {topologyView === 'traffic' && (
          <div className="traffic-view">
            <div className="traffic-grid">
              <div className="traffic-flow">
                <h4>📊 Real-time Traffic Flow</h4>
                <div className="flow-list">
                  {trafficFlow.map((flow, index) => (
                    <div key={index} className="flow-item">
                      <div className="flow-path">
                        <span className="flow-from">
                          {networkNodes.find(n => n.id === flow.from)?.name}
                        </span>
                        <span className="flow-arrow">→</span>
                        <span className="flow-to">
                          {networkNodes.find(n => n.id === flow.to)?.name}
                        </span>
                      </div>
                      <div className="flow-metrics">
                        <span className="flow-protocol">{flow.protocol}</span>
                        <div className="flow-volume">
                          <div className="volume-bar">
                            <div 
                              className="volume-fill"
                              style={{ width: `${flow.volume}%` }}
                            ></div>
                          </div>
                          <span className="volume-text">{flow.volume}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="network-stats">
                <h4>📈 Network Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-icon">📱</span>
                    <div className="stat-info">
                      <span className="stat-value">{scanResults.devices}</span>
                      <span className="stat-label">Devices</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">📶</span>
                    <div className="stat-info">
                      <span className="stat-value">{scanResults.routers}</span>
                      <span className="stat-label">Routers</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">🔌</span>
                    <div className="stat-info">
                      <span className="stat-value">{scanResults.switches}</span>
                      <span className="stat-label">Switches</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">💻</span>
                    <div className="stat-info">
                      <span className="stat-value">{scanResults.endpoints}</span>
                      <span className="stat-label">Endpoints</span>
                    </div>
                  </div>
                  <div className="stat-card critical">
                    <span className="stat-icon">⚠️</span>
                    <div className="stat-info">
                      <span className="stat-value">{scanResults.vulnerabilities}</span>
                      <span className="stat-label">Vulnerabilities</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="topology-legend">
        <h5>🗂️ Legend</h5>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#10b981' }}></div>
            <span>Client Device</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#f59e0b' }}></div>
            <span>Network Equipment</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#6366f1' }}></div>
            <span>VPN Infrastructure</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#8b5cf6' }}></div>
            <span>External Servers</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTopology;