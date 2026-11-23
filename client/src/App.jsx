// client/src/App.jsx
import { useState, useRef, useEffect } from 'react';
import { useStreamingChat } from './hooks/useStreamingChat';

function App() {
  const [input, setInput] = useState('');
  const { messages, isStreaming, error, sendMessage, stopStreaming } =
    useStreamingChat();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Streaming Chat</h1>

      {/* Message list */}
      <div
        style={{
          height: '500px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#888' }}>
            Send a message to start chatting.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
            }}
          >
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>
              {msg.content}
              {/* Show cursor while streaming the current message */}
              {isStreaming &&
                msg.role === 'assistant' &&
                i === messages.length - 1 && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '16px',
                      backgroundColor: '#333',
                      marginLeft: '2px',
                      animation: 'blink 1s infinite',
                    }}
                  />
                )}
            </div>
          </div>
        ))}

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#ffebee',
              borderRadius: '8px',
              color: '#c62828',
            }}
          >
            Error: {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={stopStreaming}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ef5350',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: input.trim() ? '#1976d2' : '#ccc',
              color: 'white',
              cursor: input.trim() ? 'pointer' : 'default',
              fontSize: '16px',
            }}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}

export default App;
