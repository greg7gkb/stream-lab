import { memo, useState } from 'react';
import type { Token } from './types';

type RenderMode = 'plain' | 'fade' | 'slide' | 'pop' | 'typewriter';

const MODES: { id: RenderMode; label: string }[] = [
  { id: 'plain',      label: 'Plain' },
  { id: 'fade',       label: 'Fade' },
  { id: 'slide',      label: 'Slide' },
  { id: 'pop',        label: 'Pop' },
  { id: 'typewriter', label: 'Typewriter' },
];

interface Props {
  tokens: Token[];
  streaming: boolean;
  error: string;
  outputRef: React.RefObject<HTMLDivElement>;
}

export default memo(function OutputSection({ tokens, streaming, error, outputRef }: Props) {
  const [mode, setMode] = useState<RenderMode>('plain');

  const wordCount = tokens.map(t => t.text).join('').split(/\s+/).filter(Boolean).length;

  return (
    <section className="section">
      <div className="output-header">
        <h2 className="section-label">Output</h2>
        <div className="seg-control">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              className={`seg-btn${mode === id ? ' seg-btn-active' : ''}`}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="output-box" ref={outputRef}>
        {tokens.length === 0 && !streaming
          ? <span className="placeholder">Response will appear here…</span>
          : tokens.map((token) =>
              mode === 'typewriter'
                ? token.text.split('').map((char, i) => (
                    <span
                      key={`${token.id}-${i}`}
                      className="token token-typewriter"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      {char}
                    </span>
                  ))
                : <span key={token.id} className={`token token-${mode}`}>{token.text}</span>
            )
        }
      </div>

      <div className="status-bar">
        {streaming ? (
          <span className="status streaming">● Streaming…</span>
        ) : tokens.length > 0 ? (
          <span className="status done">✓ Done — {wordCount} words</span>
        ) : null}
      </div>
    </section>
  );
});
