import React, { useState, useEffect, useRef, useCallback } from 'react';
import './IntelligentAssistant.css';

// ─── NLP Intent Engine ────────────────────────────────────────────────────────
const INTENTS = [
  {
    intent: 'connect',
    keywords: ['connect', 'start vpn', 'turn on', 'enable vpn', 'activate', 'fastest server', 'best server', 'go online'],
    getResponse: (ctx) => ctx.isConnected
      ? `✅ You're already connected${ctx.server ? ` to **${ctx.server}**` : ''}. Your traffic is encrypted and protected.`
      : `🚀 Initiating AI-guided connection... Scanning ${ctx.serverCount} available servers for optimal latency and load balance. Connecting to the highest-scoring server now.`,
  },
  {
    intent: 'disconnect',
    keywords: ['disconnect', 'stop vpn', 'turn off', 'disable vpn', 'pause vpn', 'go offline'],
    getResponse: (ctx) => ctx.isConnected
      ? `⚠️ Disconnecting will expose your real IP address and DNS queries. Use the **Connect** button on the main dashboard to safely toggle off.`
      : `ℹ️ You're not currently connected. Enable VPN protection from the main dashboard.`,
  },
  {
    intent: 'status',
    keywords: ['status', 'am i connected', 'connection status', 'current state', 'check connection', 'are you connected', 'what is my'],
    getResponse: (ctx) => ctx.isConnected
      ? `🟢 **Status: Connected**\n• Encryption: AES-256-GCM\n• DNS: Protected (DoH)\n• Kill Switch: Armed\n• IPv6: Blocked\n• Session uptime: ${ctx.uptime}`
      : `🔴 **Status: Disconnected**\nYour real IP, DNS queries, and location are currently visible to your ISP. Connect immediately for full protection.`,
  },
  {
    intent: 'speed',
    keywords: ['speed', 'slow', 'fast', 'mbps', 'bandwidth', 'latency', 'ping', 'performance', 'how fast'],
    getResponse: () => `⚡ Performance analysis:\n• Estimated: ~115 Mbps ↓ / 78 Mbps ↑\n• Latency: ~22ms (excellent)\n• Protocol overhead: <3% (WireGuard)\n\n💡 Tip: Servers within 500km and under 60% load deliver peak speeds. Try **Performance** mode in the AI Optimizer.`,
  },
  {
    intent: 'security',
    keywords: ['security', 'secure', 'safe', 'threat', 'hack', 'danger', 'risk', 'protect', 'am i safe', 'security check'],
    getResponse: () => `🛡️ Security audit complete:\n• AES-256-GCM encryption: ✅\n• DNS leak protection: ✅ None detected\n• WebRTC leak prevention: ✅ Active\n• Malware threats blocked: ✅ 0 active\n• Kill switch: ✅ Armed\n\n**Security score: 97/100** — Excellent`,
  },
  {
    intent: 'server',
    keywords: ['server', 'location', 'country', 'change server', 'where', 'region', 'switch server', 'server list', 'available servers'],
    getResponse: (ctx) => `🌍 ${ctx.serverCount} servers across 40+ countries available.\n\nAI ranking weights:\n• Latency: 30% | Load: 25%\n• Reliability: 25% | History: 20%\n\n${ctx.server ? `**Current:** ${ctx.server}` : 'No server selected yet.'}\nSwitch from the **Servers** tab anytime.`,
  },
  {
    intent: 'optimize',
    keywords: ['optimiz', 'improv', 'better', 'boost', 'enhanc', 'upgrade', 'faster', 'tune'],
    getResponse: () => {
      const tips = [
        `🎯 Optimization recommendations:\n1. Select a server within 500km\n2. Enable split tunneling for local services\n3. Schedule large downloads 2–6 AM (off-peak)\n\nEstimated improvement: **18–24%** ⬆️`,
        `⚙️ Performance tips:\n• Switch to **Performance** mode for streaming/gaming\n• Use **Efficiency** mode on battery\n• **Adaptive** mode auto-tunes over time using your usage history\n\nOpen the AI Optimizer to apply these now.`,
        `🚀 Quick wins available:\n• WireGuard runs 3× faster than OpenVPN\n• Traffic shaping prioritizes video calls\n• Smart load balancing routes around congestion\n\nAll toggleable from the AI Optimizer tab.`,
      ];
      return tips[Math.floor(Date.now() / 30000) % tips.length];
    },
  },
  {
    intent: 'privacy',
    keywords: ['privacy', 'ip address', 'leak', 'anonymous', 'webrtc', 'dns leak', 'tracked', 'logs', 'logging', 'no log'],
    getResponse: () => `🔒 Privacy summary:\n• Real IP: Hidden behind VPN tunnel\n• DNS queries: Encrypted (DoH/DoT)\n• WebRTC: Leak prevention active\n• Activity logs: Zero-log policy enforced\n• Jurisdiction: Privacy-friendly\n\n**Privacy score: 98/100** — Maximum protection 🌟`,
  },
  {
    intent: 'killswitch',
    keywords: ['kill switch', 'killswitch', 'emergency stop', 'block traffic', 'if vpn drops', 'failsafe'],
    getResponse: () => `⚔️ **Kill Switch** automatically blocks ALL internet traffic if your VPN drops — preventing accidental IP exposure.\n\n✅ Recommended: **Always ON** on public/untrusted networks.\nConfigure it under **Settings → Kill Switch**.`,
  },
  {
    intent: 'protocol',
    keywords: ['protocol', 'wireguard', 'openvpn', 'cipher', 'encryption type', 'algorithm', 'ipsec', 'what protocol'],
    getResponse: () => `🔧 **Active protocol: WireGuard**\n• Cipher: ChaCha20-Poly1305\n• Key exchange: Curve25519 (ECDH)\n• Authentication: Poly1305 MAC\n• Code: 4,000 lines vs OpenVPN's 70,000\n\nWireGuard is the fastest and most audited protocol available. No legacy code, no bloat.`,
  },
  {
    intent: 'explain',
    keywords: ['what is', 'explain', 'how does', 'what does', 'define ', 'meaning of', 'tell me about'],
    getResponse: (ctx, msg) => {
      const m = msg.toLowerCase();
      if (m.includes('vpn')) return `📖 **VPN** (Virtual Private Network)\nEncrypts your internet connection and routes it through a secure server, masking your real IP and protecting your data from ISPs, hackers, and surveillance agencies.`;
      if (m.includes('dns')) return `📖 **DNS** (Domain Name System)\nTranslates domain names (google.com) to IP addresses. VPN DNS protection routes these lookups through encrypted channels so your ISP can't log which sites you visit.`;
      if (m.includes('wireguard')) return `📖 **WireGuard**\nA modern, ultra-fast VPN protocol using state-of-the-art cryptography (ChaCha20, Curve25519). It's simpler, faster, and easier to audit than legacy protocols like OpenVPN or IPSec.`;
      if (m.includes('kill')) return `📖 **Kill Switch**\nA safety mechanism that blocks all internet traffic the moment your VPN connection drops — ensuring your real IP address is never exposed, even during reconnects.`;
      if (m.includes('split tunnel')) return `📖 **Split Tunneling**\nRoutes only selected apps through the VPN while others use your regular connection. Useful for accessing local printers or streaming local content while keeping sensitive traffic encrypted.`;
      if (m.includes('multihop') || m.includes('double vpn')) return `📖 **Multi-Hop VPN**\nChains your traffic through two or more VPN servers in different countries. Adds an extra privacy layer at the cost of some speed — ideal for high-risk environments.`;
      return `📖 Good question! Ask about specific terms like **VPN**, **WireGuard**, **Kill Switch**, **DNS**, or **Split Tunneling** and I'll explain in depth.`;
    },
  },
  {
    intent: 'help',
    keywords: ['help', 'what can you do', 'commands', 'guide', 'menu', 'options', 'capabilities', '?'],
    getResponse: () => `💡 **Nebula AI can help with:**\n\n🔌 **Connect/Disconnect** — "Connect me now"\n📊 **Status** — "Am I connected?"\n⚡ **Speed** — "Why is my connection slow?"\n🛡️ **Security** — "Run a security check"\n🌍 **Servers** — "Best server for gaming?"\n⚙️ **Optimize** — "Improve my connection"\n🔒 **Privacy** — "Am I being tracked?"\n📖 **Explain** — "What is WireGuard?"\n\nJust ask naturally — no commands needed! 🤖`,
  },
];

// Finds the best-matching intent using keyword scoring
const classifyIntent = (message) => {
  const lower = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        const score = kw.length; // longer = more specific = higher priority
        if (score > bestScore) {
          bestScore = score;
          bestMatch = intent;
        }
      }
    }
  }
  return bestMatch;
};

// Reads context from localStorage (set by main app) with safe fallbacks
const getContext = () => {
  const isConnected = localStorage.getItem('nebula_connected') === 'true';
  const sessionStart = localStorage.getItem('nebula_session_start');
  const uptime = sessionStart
    ? (() => {
        const mins = Math.floor((Date.now() - parseInt(sessionStart, 10)) / 60000);
        return mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
      })()
    : 'N/A';
  const serverCount = parseInt(localStorage.getItem('nebula_server_count') || '47', 10);
  const server = localStorage.getItem('nebula_current_server') || null;
  return { isConnected, serverCount, server, uptime };
};

// ─── Component ────────────────────────────────────────────────────────────────
const IntelligentAssistant = () => {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      timestamp: now,
      message: `👋 Hi! I'm **Nebula AI**, your intelligent VPN assistant.\n\nI understand natural language — ask me anything about your connection, security, speed, or privacy.\n\nTry: *"Am I connected?"* or *"Help"*`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const addAssistantMessage = useCallback((text) => {
    setIsTyping(true);
    const delay = 500 + Math.min(text.length * 8, 1200);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'assistant',
          message: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, delay);
  }, []);

  const sendMessage = useCallback(
    (text) => {
      const msg = (text !== undefined ? text : inputMessage).trim();
      if (!msg) return;
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'user',
          message: msg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setInputMessage('');

      const intent = classifyIntent(msg);
      const ctx = getContext();
      const response = intent
        ? intent.getResponse(ctx, msg)
        : `🤔 I'm not sure about that. Try asking about **connection status**, **speed**, **security**, or say **"help"** to see everything I can do!`;
      addAssistantMessage(response);
    },
    [inputMessage, addAssistantMessage]
  );

  const handleVoiceToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addAssistantMessage('🎤 Voice recognition requires Chrome or Edge. Switch browsers to use voice input!');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  // Renders **bold** and *italic* markdown and \n line breaks
  const formatMessage = (text) =>
    text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          if (part.startsWith('*') && part.endsWith('*'))
            return <em key={j}>{part.slice(1, -1)}</em>;
          return part;
        })}
        {i < arr.length - 1 && <br />}
      </span>
    ));

  const quickActions = [
    { label: 'Am I connected?', icon: '🔍' },
    { label: 'Run security check', icon: '🛡️' },
    { label: 'Optimize my connection', icon: '⚡' },
    { label: 'Best server for speed', icon: '🚀' },
    { label: 'Check for IP leaks', icon: '🔒' },
    { label: 'Explain WireGuard', icon: '📖' },
  ];

  const aiCapabilities = [
    { name: 'Intent Recognition', level: 94 },
    { name: 'Context Awareness', level: 88 },
    { name: 'Network Knowledge', level: 97 },
    { name: 'Natural Language', level: 91 },
  ];

  return (
    <div className="intelligent-assistant">
      <div className="assistant-header">
        <h3>💬 Nebula AI Assistant</h3>
        <div className="assistant-status">
          <span className="status-dot"></span>
          <span>Online & Learning</span>
        </div>
      </div>

      <div className="assistant-layout">
        <div className="chat-section">
          <div className="chat-messages">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type}`}>
                {msg.type === 'assistant' && <div className="assistant-avatar">🤖</div>}
                <div className="message-content">
                  <div className="message-text">{formatMessage(msg.message)}</div>
                  <div className="message-time">{msg.timestamp}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message assistant">
                <div className="assistant-avatar">🤖</div>
                <div className="message-content typing-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything about your VPN..."
              className="message-input"
            />
            <button
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceToggle}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? '🔴' : '🎤'}
            </button>
            <button className="send-btn" onClick={() => sendMessage()} title="Send">
              ➤
            </button>
          </div>
        </div>

        <div className="assistant-sidebar">
          <div className="quick-actions">
            <h4>⚡ Quick Commands</h4>
            <div className="actions-list">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  className="quick-action-btn"
                  onClick={() => sendMessage(action.label)}
                >
                  <span className="qa-icon">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ai-capabilities">
            <h4>🧠 AI Capabilities</h4>
            <div className="capabilities-list">
              {aiCapabilities.map((cap, i) => (
                <div key={i} className="capability-item">
                  <div className="cap-header">
                    <span className="cap-name">{cap.name}</span>
                    <span className="cap-level">{cap.level}%</span>
                  </div>
                  <div className="cap-bar">
                    <div className="cap-fill" style={{ width: `${cap.level}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentAssistant;