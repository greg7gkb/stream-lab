import { memo, useState, useEffect } from 'react';
import type { Token } from './types';

type RenderMode = 'plain' | 'fade' | 'slide' | 'pop' | 'typewriter';

const TYPEWRITER_MS_PER_CHAR = 30;

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

function renderToken(token: Token, mode: RenderMode, onAnimationEnd?: () => void): React.ReactNode {
  if (mode === 'typewriter') {
    if (token.text.length === 0) return null;
    return (
      <span
        key={token.id}
        className="token token-typewriter"
        style={{
          animationDuration: `${token.text.length * TYPEWRITER_MS_PER_CHAR}ms`,
          animationTimingFunction: `steps(${token.text.length}, end)`,
        }}
        onAnimationEnd={onAnimationEnd}
      >
        {token.text}
      </span>
    );
  }
  return <span key={token.id} className={`token token-${mode}`}>{token.text}</span>;
}

export default memo(function OutputSection({ tokens, streaming, error, outputRef }: Props) {
  const [mode, setMode] = useState<RenderMode>('plain');
  const [shownCount, setShownCount] = useState(1);

  // Reset queue when a new stream starts (tokens array cleared)
  useEffect(() => {
    if (tokens.length === 0) setShownCount(1);
  }, [tokens.length]);

  const wordCount = tokens.map(t => t.text).join('').split(/\s+/).filter(Boolean).length;

  const visibleTokens = mode === 'typewriter' ? tokens.slice(0, shownCount) : tokens;

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
          : visibleTokens.map((token, idx) => {
              const isLast = idx === visibleTokens.length - 1;
              return renderToken(
                token,
                mode,
                mode === 'typewriter' && isLast ? () => setShownCount(c => c + 1) : undefined,
              );
            })
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
