import React, { useState, useEffect } from 'react';
import './EdgeComputing.css';

const EdgeComputing = () => {
  const [edgeNodes, setEdgeNodes] = useState([
    { id: 1, location: 'Tokyo Edge', region: 'Asia-Pacific', latency: 8, load: 23, capacity: '50 Gbps', status: 'optimal', users: 1247, cached: 89 },
    { id: 2, location: 'London Edge', region: 'Europe', latency: 12, load: 45, capacity: '40 Gbps', status: 'high-load', users: 2156, cached: 67 },
    { id: 3, location: 'New York Edge', region: 'North America', latency: 6, load: 67, capacity: '80 Gbps', status: 'congested', users: 3842, cached: 78 },
    { id: 4, location: 'Sydney Edge', region: 'Oceania', latency: 15, load: 34, capacity: '30 Gbps', status: 'optimal', users: 892, cached: 92 },
    { id: 5, location: 'Frankfurt Edge', region: 'Europe', latency: 9, load: 56, capacity: '60 Gbps', status: 'optimal', users: 1734, cached: 84 }
  ]);

  const [cdnMetrics, setCdnMetrics] = useState({
    globalCacheHitRatio: 87.3,
    totalBandwidth: 2.4, // Tbps
    edgeLocations: 247,
    cachedContent: 456.8, // TB
    requestsPerSecond: 125847,
    averageLatency: 11.2 // ms
  });

  const [contentOptimization, setContentOptimization] = useState([
    { type: 'Video Streaming', optimization: 'Adaptive Bitrate + Edge Caching', savings: '73%', latency: '8ms', status: 'active' },
    { type: 'Web Content', optimization: 'Compression + Prefetching', savings: '45%', latency: '12ms', status: 'active' },
    { type: 'Gaming Data', optimization: 'Real-time Edge Processing', savings: '68%', latency: '4ms', status: 'active' },
    { type: 'File Downloads', optimization: 'Chunked Transfer + Caching', savings: '52%', latency: '15ms', status: 'active' },
    { type: 'API Responses', optimization: 'Edge Computing + Caching', savings: '61%', latency: '6ms', status: 'testing' }
  ]);

  const [edgeAnalytics, setEdgeAnalytics] = useState({
    topContentTypes: [
      { type: 'Video (4K/8K)', percentage: 45, traffic: '1.2 Tbps' },
      { type: 'Web Assets', percentage: 28, traffic: '672 Gbps' },
      { type: 'Software Updates', percentage: 15, traffic: '360 Gbps' },
      { type: 'Gaming', percentage: 8, traffic: '192 Gbps' },
      { type: 'Other', percentage: 4, traffic: '96 Gbps' }
    ],
    regionPerformance: [
      { region: 'North America', latency: 8.2, throughput: '980 Gbps', satisfaction: 94 },
      { region: 'Europe', latency: 11.5, throughput: '760 Gbps', satisfaction: 89 },
      { region: 'Asia-Pacific', latency: 9.8, throughput: '540 Gbps', satisfaction: 92 },
      { region: 'South America', latency: 15.3, throughput: '180 Gbps', satisfaction: 86 },
      { region: 'Africa', latency: 18.7, throughput: '120 Gbps', satisfaction: 82 }
    ]
  });

  const [loadBalancing, setLoadBalancing] = useState({
    algorithm: 'AI-Powered Dynamic',
    strategies: [
      { name: 'Geographic Routing', weight: 30, efficiency: 94 },
      { name: 'Latency-Based', weight: 25, efficiency: 91 },
      { name: 'Load Distribution', weight: 20, efficiency: 88 },
      { name: 'User Preference', weight: 15, efficiency: 85 },
      { name: 'Cost Optimization', weight: 10, efficiency: 79 }
    ]
  });

  const [edgeAI, setEdgeAI] = useState([
    { service: 'Content Prediction', accuracy: 92.4, processed: '2.3M requests/min', benefit: 'Proactive caching' },
    { service: 'Traffic Optimization', accuracy: 88.7, processed: '1.8M decisions/min', benefit: 'Route optimization' },
    { service: 'Anomaly Detection', accuracy: 96.1, processed: '456K events/min', benefit: 'Security monitoring' },
    { service: 'User Behavior Analysis', accuracy: 84.3, processed: '3.1M patterns/min', benefit: 'Personalization' }
  ]);

  useEffect(() => {
    // Simulate real-time edge computing updates
    const interval = setInterval(() => {
      setEdgeNodes(prev => prev.map(node => ({
        ...node,
        latency: Math.max(3, node.latency + (Math.random() - 0.5) * 2),
        load: Math.max(10, Math.min(90, node.load + (Math.random() - 0.5) * 8)),
        users: node.users + Math.floor((Math.random() - 0.5) * 20),
        cached: Math.max(50, Math.min(95, node.cached + (Math.random() - 0.5) * 3))
      })));

      setCdnMetrics(prev => ({
        ...prev,
        globalCacheHitRatio: Math.max(75, Math.min(95, prev.globalCacheHitRatio + (Math.random() - 0.4))),
        requestsPerSecond: prev.requestsPerSecond + Math.floor((Math.random() - 0.5) * 5000),
        averageLatency: Math.max(8, Math.min(20, prev.averageLatency + (Math.random() - 0.5) * 0.5))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getNodeStatusColor = (status) => {
    switch (status) {
      case 'optimal': return '#10b981';
      case 'high-load': return '#f59e0b';
      case 'congested': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const deployEdgeNode = (region) => {
    const newNode = {
      id: edgeNodes.length + 1,
      location: `${region} Edge`,
      region: region,
      latency: Math.floor(Math.random() * 10) + 5,
      load: Math.floor(Math.random() * 30) + 10,
      capacity: '40 Gbps',
      status: 'optimal',
      users: 0,
      cached: 0
    };
    setEdgeNodes(prev => [...prev, newNode]);
  };

  return (
    <div className="edge-computing">
      <div className="edge-header">
        <h3>⚡ Edge Computing</h3>
        <div className="edge-status">
          <span className="edge-metric">🌐 {edgeNodes.length} Edge Nodes</span>
          <span className="edge-metric">📊 {cdnMetrics.globalCacheHitRatio.toFixed(1)}% Cache Hit</span>
          <span className="edge-metric">⚡ {cdnMetrics.averageLatency.toFixed(1)}ms Avg Latency</span>
        </div>
      </div>

      <div className="edge-dashboard">
        <div className="cdn-overview">
          <h4>🌍 Global CDN Metrics</h4>
          <div className="cdn-stats">
            <div className="cdn-stat">
              <span className="stat-value">{cdnMetrics.totalBandwidth.toFixed(1)} Tbps</span>
              <span className="stat-label">Total Bandwidth</span>
            </div>
            <div className="cdn-stat">
              <span className="stat-value">{cdnMetrics.edgeLocations}</span>
              <span className="stat-label">Edge Locations</span>
            </div>
            <div className="cdn-stat">
              <span className="stat-value">{cdnMetrics.cachedContent.toFixed(1)} TB</span>
              <span className="stat-label">Cached Content</span>
            </div>
            <div className="cdn-stat">
              <span className="stat-value">{(cdnMetrics.requestsPerSecond / 1000).toFixed(0)}K/s</span>
              <span className="stat-label">Requests</span>
            </div>
          </div>
        </div>

        <div className="edge-nodes">
          <h4>🖥️ Edge Node Network</h4>
          <div className="nodes-grid">
            {edgeNodes.map(node => (
              <div key={node.id} className={`edge-node-card ${node.status}`}>
                <div className="node-header">
                  <span className="node-location">{node.location}</span>
                  <span 
                    className="node-status"
                    style={{ color: getNodeStatusColor(node.status) }}
                  >
                    ● {node.status}
                  </span>
                </div>
                
                <div className="node-metrics">
                  <div className="node-metric">
                    <span className="metric-label">Latency</span>
                    <span className="metric-value">{node.latency.toFixed(1)}ms</span>
                  </div>
                  <div className="node-metric">
                    <span className="metric-label">Load</span>
                    <span className="metric-value">{node.load}%</span>
                  </div>
                  <div className="node-metric">
                    <span className="metric-label">Capacity</span>
                    <span className="metric-value">{node.capacity}</span>
                  </div>
                </div>
                
                <div className="node-stats">
                  <div className="node-stat">
                    <span className="stat-icon">👥</span>
                    <span className="stat-value">{node.users.toLocaleString()}</span>
                    <span className="stat-label">Users</span>
                  </div>
                  <div className="node-stat">
                    <span className="stat-icon">💾</span>
                    <span className="stat-value">{node.cached}%</span>
                    <span className="stat-label">Cached</span>
                  </div>
                </div>
                
                <div className="load-bar">
                  <div 
                    className="load-fill"
                    style={{ 
                      width: `${node.load}%`,
                      backgroundColor: getNodeStatusColor(node.status)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="deployment-controls">
            <h5>🚀 Deploy New Edge Node</h5>
            <div className="deployment-buttons">
              <button className="deploy-btn" onClick={() => deployEdgeNode('Mumbai')}>
                Deploy Mumbai
              </button>
              <button className="deploy-btn" onClick={() => deployEdgeNode('São Paulo')}>
                Deploy São Paulo
              </button>
              <button className="deploy-btn" onClick={() => deployEdgeNode('Cairo')}>
                Deploy Cairo
              </button>
            </div>
          </div>
        </div>

        <div className="content-optimization">
          <h4>🎯 Content Optimization</h4>
          <div className="optimization-list">
            {contentOptimization.map((content, index) => (
              <div key={index} className={`optimization-card ${content.status}`}>
                <div className="optimization-header">
                  <span className="content-type">{content.type}</span>
                  <span className={`optimization-status ${content.status}`}>
                    {content.status === 'active' && '🟢 Active'}
                    {content.status === 'testing' && '🔵 Testing'}
                  </span>
                </div>
                <div className="optimization-method">{content.optimization}</div>
                <div className="optimization-results">
                  <span className="savings">💰 {content.savings} bandwidth saved</span>
                  <span className="latency">⚡ {content.latency} average latency</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="load-balancing">
          <h4>⚖️ Intelligent Load Balancing</h4>
          <div className="balancing-overview">
            <div className="algorithm-info">
              <span className="algorithm-name">Algorithm: {loadBalancing.algorithm}</span>
            </div>
            <div className="strategies-list">
              {loadBalancing.strategies.map((strategy, index) => (
                <div key={index} className="strategy-item">
                  <div className="strategy-info">
                    <span className="strategy-name">{strategy.name}</span>
                    <span className="strategy-weight">Weight: {strategy.weight}%</span>
                  </div>
                  <div className="strategy-metrics">
                    <span className="efficiency">Efficiency: {strategy.efficiency}%</span>
                    <div className="efficiency-bar">
                      <div 
                        className="efficiency-fill"
                        style={{ width: `${strategy.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="edge-ai">
          <h4>🤖 Edge AI Services</h4>
          <div className="ai-services">
            {edgeAI.map((service, index) => (
              <div key={index} className="ai-service-card">
                <div className="service-header">
                  <span className="service-name">{service.service}</span>
                  <span className="service-accuracy">🎯 {service.accuracy}% accurate</span>
                </div>
                <div className="service-metrics">
                  <span className="service-processed">⚡ {service.processed}</span>
                  <span className="service-benefit">💡 {service.benefit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="edge-analytics">
          <h4>📊 Edge Analytics</h4>
          <div className="analytics-sections">
            <div className="content-analysis">
              <h5>📈 Content Distribution</h5>
              <div className="content-chart">
                {edgeAnalytics.topContentTypes.map((content, index) => (
                  <div key={index} className="content-item">
                    <span className="content-type">{content.type}</span>
                    <div className="content-bar">
                      <div 
                        className="content-fill"
                        style={{ width: `${content.percentage}%` }}
                      ></div>
                    </div>
                    <span className="content-percentage">{content.percentage}%</span>
                    <span className="content-traffic">{content.traffic}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="region-performance">
              <h5>🌍 Regional Performance</h5>
              <div className="regions-list">
                {edgeAnalytics.regionPerformance.map((region, index) => (
                  <div key={index} className="region-item">
                    <span className="region-name">{region.region}</span>
                    <div className="region-metrics">
                      <span className="region-latency">⚡ {region.latency}ms</span>
                      <span className="region-throughput">📊 {region.throughput}</span>
                      <span className="region-satisfaction">😊 {region.satisfaction}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdgeComputing;