import { memo } from 'react';

interface Props {
  avgDelay: number;
  delayVariance: number;
  chunkSize: number;
  streaming: boolean;
  onAvgDelayChange: (v: number) => void;
  onDelayVarianceChange: (v: number) => void;
  onChunkSizeChange: (v: number) => void;
}

export default memo(function ParametersSection({
  avgDelay,
  delayVariance,
  chunkSize,
  streaming,
  onAvgDelayChange,
  onDelayVarianceChange,
  onChunkSizeChange,
}: Props) {
  return (
    <section className="section">
      <h2 className="section-label">Parameters</h2>
      <div className="params-row">
        <div className="param-group">
          <label>
            Avg Delay (ms)
            <input
              type="number"
              value={avgDelay}
              onChange={(e) => onAvgDelayChange(Math.max(0, Number(e.target.value) || 0))}
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
              onChange={(e) => onDelayVarianceChange(Math.max(0, Number(e.target.value) || 0))}
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
              onChange={(e) => onChunkSizeChange(Math.max(1, Number(e.target.value) || 1))}
              min={1}
              disabled={streaming}
            />
          </label>
        </div>
      </div>
    </section>
  );
});
