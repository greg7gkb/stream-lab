import { useState, useRef, useCallback, useEffect } from 'react';
import type { DebugEntry } from './types';
import ParametersSection from './ParametersSection';
import InputSection from './InputSection';
import OutputSection from './OutputSection';
import DebugSection from './DebugSection';

const SERVER_URL = '/stream';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');

  const [autoWordCount, setAutoWordCount] = useState(100);

  const [chunkSize, setChunkSize] = useState(1);
  const [avgDelay, setAvgDelay] = useState(30);
  const [delayVariance, setDelayVariance] = useState(10);

  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const [debugVisible, setDebugVisible] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const debugSectionRef = useRef<HTMLElement>(null);
  const streamStartRef = useRef<number>(0);
  const seqRef = useRef<number>(0);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
  }, []);

  const send = useCallback(async () => {
    if (streaming || !prompt.trim()) return;

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
        body: JSON.stringify({ text: prompt, chunkSize, avgDelay, delayVariance }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice('data:'.length).trim();

          setDebugLog((prev) => [...prev, {
            seq: seqRef.current++,
            ms: Math.round(performance.now() - streamStartRef.current),
            raw: payload,
          }]);

          if (payload === '[DONE]') {
            setStreaming(false);
            abortRef.current = null;
            return;
          }

          try {
            const { token } = JSON.parse(payload) as { token: string };
            setOutput((prev) => {
              requestAnimationFrame(scrollToBottom);
              return prev + token;
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
  }, [prompt, streaming, chunkSize, avgDelay, delayVariance, scrollToBottom]);

  const handleDebugToggle = useCallback(() => {
    setDebugVisible((v) => {
      if (!v) requestAnimationFrame(() =>
        debugSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      );
      return !v;
    });
  }, []);

  // Scroll debug log when new entries arrive
  useEffect(() => {
    if (debugRef.current) {
      debugRef.current.scrollTop = debugRef.current.scrollHeight;
    }
  }, [debugLog]);

  return (
    <div className="app">
      <header className="header">
        <h1>stream-lab</h1>
        <p className="subtitle">Token streaming playground</p>
      </header>

      <main className="main">
        <ParametersSection
          avgDelay={avgDelay}
          delayVariance={delayVariance}
          chunkSize={chunkSize}
          streaming={streaming}
          onAvgDelayChange={setAvgDelay}
          onDelayVarianceChange={setDelayVariance}
          onChunkSizeChange={setChunkSize}
        />
        <InputSection
          prompt={prompt}
          autoWordCount={autoWordCount}
          streaming={streaming}
          onPromptChange={setPrompt}
          onAutoWordCountChange={setAutoWordCount}
          onSend={send}
          onStop={stop}
        />
        <OutputSection
          output={output}
          streaming={streaming}
          error={error}
          outputRef={outputRef}
        />
        <DebugSection
          debugLog={debugLog}
          debugVisible={debugVisible}
          onToggle={handleDebugToggle}
          debugRef={debugRef}
          debugSectionRef={debugSectionRef}
        />
      </main>
    </div>
  );
}
