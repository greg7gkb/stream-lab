import { memo, useEffect } from 'react';
import type { DebugEntry } from './types';

interface Props {
  debugLog: DebugEntry[];
  debugVisible: boolean;
  onToggle: () => void;
  debugRef: React.RefObject<HTMLDivElement>;
  debugSectionRef: React.RefObject<HTMLElement>;
}

export default memo(function DebugSection({
  debugLog,
  debugVisible,
  onToggle,
  debugRef,
  debugSectionRef,
}: Props) {
  useEffect(() => {
    if (debugRef.current) {
      debugRef.current.scrollTop = debugRef.current.scrollHeight;
    }
  }, [debugLog, debugRef]);

  return (
    <section className="section" ref={debugSectionRef}>
      <button className="section-toggle" onClick={onToggle}>
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
  );
});
