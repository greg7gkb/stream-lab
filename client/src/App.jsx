import { useState, useRef, useCallback } from 'react';

const SERVER_URL = '/stream';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const outputRef = useRef(null);

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
  }, []);

  const send = useCallback(async () => {
    if (streaming || !prompt.trim()) return;

    // Reset state for new request
    setOutput('');
    setError('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice('data:'.length).trim();

          if (payload === '[DONE]') {
            setStreaming(false);
            abortRef.current = null;
            return;
          }

          try {
            const { token } = JSON.parse(payload);
            setOutput((prev) => {
              const next = prev + token;
              // Scroll after state update
              requestAnimationFrame(scrollToBottom);
              return next;
            });
          } catch {
            // ignore malformed JSON lines
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Stream failed');
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [prompt, streaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>stream-lab</h1>
        <p className="subtitle">Token streaming playground</p>
      </header>

      <main className="main">
        <div className="input-row">
          <textarea
            className="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a prompt… (Enter to send, Shift+Enter for newline)"
            rows={3}
            disabled={streaming}
          />
          <div className="button-col">
            {streaming ? (
              <button className="btn btn-stop" onClick={stop}>
                Stop
              </button>
            ) : (
              <button
                className="btn btn-send"
                onClick={send}
                disabled={!prompt.trim()}
              >
                Send
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="output-box" ref={outputRef}>
          {output || (!streaming && <span className="placeholder">Response will appear here…</span>)}
          {streaming && <span className="cursor" aria-hidden="true" />}
        </div>

        <div className="status-bar">
          {streaming ? (
            <span className="status streaming">● Streaming…</span>
          ) : output ? (
            <span className="status done">✓ Done — {output.split(/\s+/).filter(Boolean).length} words</span>
          ) : null}
        </div>
      </main>
    </div>
  );
}
