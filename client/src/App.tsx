import { useState, useRef, useCallback, useEffect } from 'react';

interface DebugEntry {
  seq: number;
  ms: number;   // elapsed ms since stream start
  raw: string;  // raw SSE payload
}

const SERVER_URL = '/stream';

// --- Simple lorem-ipsum-style text generator ---

const WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'a', 'lazy', 'dog',
  'she', 'walked', 'through', 'an', 'open', 'field', 'under', 'bright',
  'blue', 'sky', 'with', 'soft', 'clouds', 'drifting', 'slowly', 'above',
  'he', 'sat', 'by', 'river', 'watching', 'water', 'flow', 'past',
  'ancient', 'stones', 'covered', 'in', 'green', 'moss', 'they', 'built',
  'small', 'cabin', 'near', 'edge', 'of', 'forest', 'where', 'tall',
  'trees', 'swayed', 'gently', 'wind', 'birds', 'sang', 'their', 'morning',
  'songs', 'while', 'sun', 'rose', 'behind', 'distant', 'mountains',
  'light', 'filled', 'valley', 'and', 'shadows', 'retreated', 'into',
  'deep', 'ravines', 'children', 'played', 'on', 'warm', 'sand', 'waves',
  'crashed', 'against', 'rocky', 'shore', 'each', 'day', 'brought', 'new',
  'stories', 'to', 'those', 'who', 'listened', 'carefully', 'old', 'man',
  'told', 'tales', 'from', 'long', 'ago', 'when', 'world', 'was', 'young',
  'still', 'full', 'wonder', 'people', 'gathered', 'around', 'fire',
  'sharing', 'bread', 'laughter', 'stars', 'appeared', 'one', 'night',
  'fell', 'across', 'land', 'gentle', 'rain', 'began', 'fall', 'quietly',
];

function generateText(wordCount: number): string {
  const result: string[] = [];
  let sentenceLength = 0;
  const targetLength = randomInt(8, 15);
  let currentTarget = targetLength;

  for (let i = 0; i < wordCount; i++) {
    let word = WORDS[randomInt(0, WORDS.length - 1)];

    // Capitalize first word of a sentence
    if (sentenceLength === 0) {
      word = word[0].toUpperCase() + word.slice(1);
    }

    sentenceLength++;

    if (sentenceLength >= currentTarget || i === wordCount - 1) {
      // End the sentence
      word += '.';
      sentenceLength = 0;
      currentTarget = randomInt(8, 15);
    }

    result.push(word);
  }

  return result.join(' ');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Component ---

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate word count
  const [autoWordCount, setAutoWordCount] = useState(100);

  // Streaming parameters
  const [chunkSize, setChunkSize] = useState(1);
  const [avgDelay, setAvgDelay] = useState(30);
  const [delayVariance, setDelayVariance] = useState(10);

  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const [debugVisible, setDebugVisible] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const debugRef = useRef<HTMLDivElement | null>(null);
  const debugSectionRef = useRef<HTMLElement | null>(null);
  const streamStartRef = useRef<number>(0);
  const seqRef = useRef<number>(0);

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

  const handleAutoGenerate = useCallback(() => {
    const count = Math.max(1, autoWordCount);
    setPrompt(generateText(count));
  }, [autoWordCount]);

  const send = useCallback(async () => {
    if (streaming || !prompt.trim()) return;

    // Reset state for new request
    setOutput('');
    setError('');
    setDebugLog([]);
    setStreaming(true);
    streamStartRef.current = performance.now();
    seqRef.current = 0;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: prompt,
          chunkSize,
          avgDelay,
          delayVariance,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop()!; // keep incomplete last line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice('data:'.length).trim();

          const entry: DebugEntry = {
            seq: seqRef.current++,
            ms: Math.round(performance.now() - streamStartRef.current),
            raw: payload,
          };
          setDebugLog((prev) => [...prev, entry]);

          if (payload === '[DONE]') {
            setStreaming(false);
            abortRef.current = null;
            return;
          }

          try {
            const { token } = JSON.parse(payload) as { token: string };
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
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Stream failed');
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [prompt, streaming, chunkSize, avgDelay, delayVariance]);

  useEffect(() => {
    if (debugRef.current) {
      debugRef.current.scrollTop = debugRef.current.scrollHeight;
    }
  }, [debugLog]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        <section className="section">
          <h2 className="section-label">Parameters</h2>
          <div className="params-row">
          <div className="param-group">
            <label>
              Avg Delay (ms)
              <input
                type="number"
                value={avgDelay}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAvgDelay(Math.max(0, Number(e.target.value) || 0))
                }
                min={0}
                disabled={streaming}
              />
            </label>
          </div>
          <div className="param-group">
            <label>
              Delay Variance (ms, σ)
              <input
                type="number"
                value={delayVariance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDelayVariance(Math.max(0, Number(e.target.value) || 0))
                }
                min={0}
                disabled={streaming}
              />
            </label>
          </div>
          <div className="param-group">
            <label>
              Chunk Size (words)
              <input
                type="number"
                value={chunkSize}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setChunkSize(Math.max(1, Number(e.target.value) || 1))
                }
                min={1}
                disabled={streaming}
              />
            </label>
          </div>
        </div>
        </section>

        <section className="section">
          <h2 className="section-label">Input</h2>
          <div className="input-row">
          <textarea
            className="prompt-input"
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a prompt… (Enter to send, Shift+Enter for newline)"
            rows={3}
            disabled={streaming}
          />
          <div className="button-col">
            <div className="auto-generate-group">
              <label className="auto-word-label">
                Words
                <input
                  type="number"
                  className="auto-word-input"
                  value={autoWordCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAutoWordCount(Math.max(1, Number(e.target.value) || 1))
                  }
                  min={1}
                  disabled={streaming}
                />
              </label>
              <button
                className="btn-auto"
                onClick={handleAutoGenerate}
                disabled={streaming}
              >
                Auto Generate
              </button>
            </div>
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
        </section>

        <section className="section">
          <h2 className="section-label">Output</h2>
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
        </section>
        <section className="section" ref={debugSectionRef}>
          <button
            className="section-toggle"
            onClick={() => {
              setDebugVisible((v) => {
                if (!v) requestAnimationFrame(() => debugSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
                return !v;
              });
            }}
          >
            <h2 className="section-label">Debug</h2>
            <span className="section-toggle-icon">{debugVisible ? '▾' : '▸'}</span>
          </button>
          {debugVisible && (
            <div className="debug-log" ref={debugRef}>
              {debugLog.length === 0
                ? <span className="placeholder">Events will appear here…</span>
                : debugLog.map((entry) => (
                    <div key={entry.seq} className="debug-entry">
                      <span className="debug-seq">{String(entry.seq).padStart(4, '0')}</span>
                      <span className="debug-ms">{entry.ms}ms</span>
                      <span className="debug-raw">{entry.raw}</span>
                    </div>
                  ))
              }
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
