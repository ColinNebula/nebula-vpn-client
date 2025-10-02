import React, { useState, useEffect } from 'react';
import './BlockchainIntegration.css';

const BlockchainIntegration = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoBalance, setCryptoBalance] = useState({
    NVPN: 1247.58,
    ETH: 2.34,
    BTC: 0.0157,
    USDC: 850.00
  });

  const [nftAccess, setNftAccess] = useState([
    { id: 1, name: 'VIP Access NFT', tier: 'Platinum', benefits: ['Unlimited bandwidth', 'Priority support', 'Beta features'], image: '👑', owned: true },
    { id: 2, name: 'Gaming Optimized', tier: 'Gold', benefits: ['Gaming servers', 'Low latency', 'DDoS protection'], image: '🎮', owned: true },
    { id: 3, name: 'Privacy Guardian', tier: 'Silver', benefits: ['Enhanced encryption', 'No-logs guarantee', 'Tor support'], image: '🛡️', owned: false },
    { id: 4, name: 'Streaming Pro', tier: 'Bronze', benefits: ['Streaming servers', '4K support', 'Multi-region'], image: '📺', owned: false }
  ]);

  const [decentralizedNodes, setDecentralizedNodes] = useState([
    { id: 1, location: 'Tokyo, Japan', stake: 1000, rewards: 45.8, uptime: 99.9, contributors: 23, status: 'active' },
    { id: 2, location: 'London, UK', stake: 850, rewards: 38.2, uptime: 98.7, contributors: 18, status: 'active' },
    { id: 3, location: 'New York, USA', stake: 1200, rewards: 52.1, uptime: 99.5, contributors: 31, status: 'active' },
    { id: 4, location: 'Sydney, Australia', stake: 750, rewards: 32.6, uptime: 97.2, contributors: 15, status: 'maintenance' }
  ]);

  const [daoGovernance, setDaoGovernance] = useState([
    { id: 1, title: 'Implement Quantum-Resistant Encryption', votes: 1247, status: 'active', timeLeft: '5 days', yourVote: null },
    { id: 2, title: 'Add New Server Locations in Africa', votes: 892, status: 'active', timeLeft: '12 days', yourVote: 'for' },
    { id: 3, title: 'Reduce Subscription Fees by 15%', votes: 2156, status: 'passed', timeLeft: 'closed', yourVote: 'for' },
    { id: 4, title: 'Integrate with Additional Blockchains', votes: 634, status: 'active', timeLeft: '3 days', yourVote: null }
  ]);

  const [smartContracts, setSmartContracts] = useState([
    { name: 'Subscription Manager', address: '0x1234...abcd', status: 'active', gasUsed: '2.3 ETH', transactions: 15847 },
    { name: 'Node Staking Pool', address: '0x5678...efgh', status: 'active', gasUsed: '5.7 ETH', transactions: 8924 },
    { name: 'Governance Token', address: '0x9012...ijkl', status: 'active', gasUsed: '1.8 ETH', transactions: 34561 },
    { name: 'NFT Access Control', address: '0x3456...mnop', status: 'upgrading', gasUsed: '0.9 ETH', transactions: 2847 }
  ]);

  const connectWallet = () => {
    // Simulate wallet connection
    setWalletConnected(true);
    setWalletAddress('0x742d35Cc6634C0532925a3b8D39860d4B4dDd6FE');
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
  };

  const handleVote = (proposalId, vote) => {
    setDaoGovernance(prev => prev.map(proposal => 
      proposal.id === proposalId 
        ? { ...proposal, yourVote: vote, votes: proposal.votes + 1 }
        : proposal
    ));
  };

  const stakeTokens = (nodeId, amount) => {
    setDecentralizedNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, stake: node.stake + amount, contributors: node.contributors + 1 }
        : node
    ));
    setCryptoBalance(prev => ({ ...prev, NVPN: prev.NVPN - amount }));
  };

  useEffect(() => {
    // Simulate real-time blockchain updates
    const interval = setInterval(() => {
      setCryptoBalance(prev => ({
        ...prev,
        NVPN: prev.NVPN + Math.random() * 2 - 1,
        ETH: prev.ETH + (Math.random() * 0.01 - 0.005),
        BTC: prev.BTC + (Math.random() * 0.0001 - 0.00005)
      }));

      setDecentralizedNodes(prev => prev.map(node => ({
        ...node,
        rewards: node.rewards + Math.random() * 0.5,
        uptime: Math.max(95, Math.min(100, node.uptime + (Math.random() - 0.3) * 0.1))
      })));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="blockchain-integration">
      <div className="blockchain-header">
        <h3>⛓️ Blockchain Integration</h3>
        <div className="wallet-status">
          {walletConnected ? (
            <div className="wallet-connected">
              <span className="wallet-address">🔗 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              <button className="disconnect-btn" onClick={disconnectWallet}>Disconnect</button>
            </div>
          ) : (
            <button className="connect-wallet-btn" onClick={connectWallet}>
              💰 Connect Wallet
            </button>
          )}
        </div>
      </div>

      <div className="blockchain-dashboard">
        {walletConnected ? (
          <>
            <div className="crypto-portfolio">
              <h4>💰 Crypto Portfolio</h4>
              <div className="balance-cards">
                {Object.entries(cryptoBalance).map(([token, balance]) => (
                  <div key={token} className="balance-card">
                    <span className="token-symbol">{token}</span>
                    <span className="token-balance">{balance.toFixed(token === 'NVPN' ? 2 : 4)}</span>
                    <span className="token-change">
                      {Math.random() > 0.5 ? '📈 +2.3%' : '📉 -1.1%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="nft-access-control">
              <h4>🎨 NFT Access Control</h4>
              <div className="nft-collection">
                {nftAccess.map(nft => (
                  <div key={nft.id} className={`nft-card ${nft.owned ? 'owned' : 'not-owned'}`}>
                    <div className="nft-image">{nft.image}</div>
                    <div className="nft-info">
                      <h5>{nft.name}</h5>
                      <span className={`nft-tier ${nft.tier.toLowerCase()}`}>{nft.tier}</span>
                      <div className="nft-benefits">
                        {nft.benefits.map((benefit, index) => (
                          <span key={index} className="benefit-tag">✓ {benefit}</span>
                        ))}
                      </div>
                      {nft.owned ? (
                        <button className="nft-btn active">🔓 Active</button>
                      ) : (
                        <button className="nft-btn purchase">💎 Purchase</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="decentralized-nodes">
              <h4>🌐 Decentralized VPN Nodes</h4>
              <div className="nodes-list">
                {decentralizedNodes.map(node => (
                  <div key={node.id} className={`node-card ${node.status}`}>
                    <div className="node-header">
                      <span className="node-location">📍 {node.location}</span>
                      <span className={`node-status ${node.status}`}>
                        {node.status === 'active' && '🟢 Active'}
                        {node.status === 'maintenance' && '🟡 Maintenance'}
                      </span>
                    </div>
                    <div className="node-metrics">
                      <div className="node-metric">
                        <span className="metric-label">Staked</span>
                        <span className="metric-value">{node.stake} NVPN</span>
                      </div>
                      <div className="node-metric">
                        <span className="metric-label">Rewards</span>
                        <span className="metric-value">{node.rewards.toFixed(1)} NVPN</span>
                      </div>
                      <div className="node-metric">
                        <span className="metric-label">Uptime</span>
                        <span className="metric-value">{node.uptime.toFixed(1)}%</span>
                      </div>
                      <div className="node-metric">
                        <span className="metric-label">Contributors</span>
                        <span className="metric-value">{node.contributors}</span>
                      </div>
                    </div>
                    <button 
                      className="stake-btn"
                      onClick={() => stakeTokens(node.id, 100)}
                      disabled={node.status !== 'active'}
                    >
                      🪙 Stake 100 NVPN
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="dao-governance">
              <h4>🗳️ DAO Governance</h4>
              <div className="proposals-list">
                {daoGovernance.map(proposal => (
                  <div key={proposal.id} className={`proposal-card ${proposal.status}`}>
                    <div className="proposal-header">
                      <h5>{proposal.title}</h5>
                      <span className={`proposal-status ${proposal.status}`}>
                        {proposal.status === 'active' && '🔴 Active'}
                        {proposal.status === 'passed' && '✅ Passed'}
                      </span>
                    </div>
                    <div className="proposal-details">
                      <span className="proposal-votes">👥 {proposal.votes} votes</span>
                      <span className="proposal-time">⏰ {proposal.timeLeft}</span>
                    </div>
                    {proposal.status === 'active' && !proposal.yourVote && (
                      <div className="voting-actions">
                        <button 
                          className="vote-btn for"
                          onClick={() => handleVote(proposal.id, 'for')}
                        >
                          👍 Vote For
                        </button>
                        <button 
                          className="vote-btn against"
                          onClick={() => handleVote(proposal.id, 'against')}
                        >
                          👎 Vote Against
                        </button>
                      </div>
                    )}
                    {proposal.yourVote && (
                      <div className="voted-status">
                        ✅ You voted: {proposal.yourVote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="smart-contracts">
              <h4>📜 Smart Contracts</h4>
              <div className="contracts-list">
                {smartContracts.map((contract, index) => (
                  <div key={index} className={`contract-card ${contract.status}`}>
                    <div className="contract-info">
                      <h5>{contract.name}</h5>
                      <span className="contract-address">{contract.address}</span>
                    </div>
                    <div className="contract-metrics">
                      <span className="contract-gas">⛽ {contract.gasUsed} gas used</span>
                      <span className="contract-transactions">📊 {contract.transactions.toLocaleString()} transactions</span>
                    </div>
                    <span className={`contract-status ${contract.status}`}>
                      {contract.status === 'active' && '🟢 Active'}
                      {contract.status === 'upgrading' && '🔄 Upgrading'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="wallet-not-connected">
            <div className="connect-prompt">
              <h4>🔗 Connect Your Wallet</h4>
              <p>Connect your Web3 wallet to access blockchain features:</p>
              <ul>
                <li>💰 Crypto payments for VPN subscriptions</li>
                <li>🎨 NFT-based access controls and premium features</li>
                <li>🌐 Participate in decentralized VPN node network</li>
                <li>🗳️ Vote on protocol governance and improvements</li>
                <li>🪙 Stake tokens and earn rewards</li>
                <li>📜 Interact with smart contracts</li>
              </ul>
              <button className="connect-main-btn" onClick={connectWallet}>
                💰 Connect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainIntegration;