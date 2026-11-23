// client/src/hooks/useStreamingChat.js
import { useState, useCallback, useRef } from 'react';

export function useStreamingChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const sendMessage = useCallback(async (userMessage) => {
    // Add user message to the list
    const userMsg = { role: 'user', content: userMessage };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setIsStreaming(true);
    setError(null);

    // Create an abort controller so we can cancel the stream
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Add a placeholder for the AI response
    const aiMessageIndex = updatedMessages.length;
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Read the stream using ReadableStream API
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the incomplete last line in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'text') {
                // Append the new text to the AI message
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[aiMessageIndex] = {
                    ...updated[aiMessageIndex],
                    content: updated[aiMessageIndex].content + parsed.text,
                  };
                  return updated;
                });
              } else if (parsed.type === 'error') {
                setError(parsed.error);
              }
              // 'done' type -- stream is complete
            } catch {
              // Skip lines that are not valid JSON (empty lines, etc.)
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled -- not an error
        console.log('Stream cancelled by user');
      } else {
        setError(err.message);
        // Remove the empty AI message on error
        setMessages((prev) => prev.filter((_, i) => i !== aiMessageIndex));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}