import { memo } from 'react';

interface Props {
  output: string;
  streaming: boolean;
  error: string;
  outputRef: React.RefObject<HTMLDivElement>;
}

export default memo(function OutputSection({ output, streaming, error, outputRef }: Props) {
  return (
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
  );
});
