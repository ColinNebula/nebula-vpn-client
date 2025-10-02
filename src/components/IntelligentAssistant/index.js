import React, { useState } from 'react';
import './IntelligentAssistant.css';

const IntelligentAssistant = () => {
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'assistant', message: 'Hello! I\'m your AI VPN assistant. How can I help you today?', timestamp: '10:30 AM' },
    { id: 2, type: 'user', message: 'Connect to the fastest server', timestamp: '10:31 AM' },
    { id: 3, type: 'assistant', message: '🚀 I\'ve analyzed current server performance. Connecting you to US West (18ms, 95% optimal). Connection established!', timestamp: '10:31 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);

  const quickActions = [
    '🚀 Connect to fastest server',
    '🔒 Enable maximum security',
    '📊 Show performance stats',
    '🛡️ Run security scan',
    '⚙️ Optimize settings',
    '📍 Change server location'
  ];

  const suggestions = [
    { icon: '💡', text: 'Your connection could be 23% faster by switching to Singapore server' },
    { icon: '🛡️', text: 'Consider enabling kill switch for better security' },
    { icon: '📊', text: 'Your data usage increased 45% this week' },
    { icon: '🔧', text: 'Split tunneling setup recommended for better performance' }
  ];

  const sendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        type: 'user',
        message: inputMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages([...chatMessages, newMessage]);
      
      // Simulate AI response
      setTimeout(() => {
        const responses = [
          '✅ I\'ve processed your request. The action has been completed successfully.',
          '🔍 Let me analyze that for you... Based on current data, I recommend the following approach.',
          '⚙️ I can help you with that! I\'ve made the necessary adjustments to optimize your connection.',
          '📊 Here\'s what I found: Your current setup is performing well, but there are opportunities for improvement.'
        ];
        
        const aiResponse = {
          id: chatMessages.length + 2,
          type: 'assistant',
          message: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setChatMessages(prev => [...prev, aiResponse]);
      }, 1000);
      
      setInputMessage('');
    }
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      alert('🎤 Voice recognition activated! Say your command...');
      setTimeout(() => {
        setIsListening(false);
        setInputMessage('Connect to fastest server please');
      }, 3000);
    }
  };

  return (
    <div className="intelligent-assistant">
      <div className="assistant-header">
        <h3>💬 AI Assistant</h3>
        <div className="assistant-status">
          <span className="status-indicator">🟢</span>
          <span>Online & Learning</span>
        </div>
      </div>

      <div className="assistant-layout">
        <div className="chat-section">
          <div className="chat-messages">
            {chatMessages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  <span className="message-text">{message.message}</span>
                  <span className="message-time">{message.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything about your VPN..."
              className="message-input"
            />
            <button 
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceToggle}
            >
              {isListening ? '🔴' : '🎤'}
            </button>
            <button className="send-btn" onClick={sendMessage}>
              📤
            </button>
          </div>
        </div>

        <div className="assistant-sidebar">
          <div className="quick-actions">
            <h4>⚡ Quick Actions</h4>
            <div className="actions-list">
              {quickActions.map((action, index) => (
                <button 
                  key={index} 
                  className="quick-action-btn"
                  onClick={() => setInputMessage(action.substring(2))}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-suggestions">
            <h4>💡 Smart Suggestions</h4>
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  <span className="suggestion-icon">{suggestion.icon}</span>
                  <span className="suggestion-text">{suggestion.text}</span>
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