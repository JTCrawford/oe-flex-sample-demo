import { sphereModelById } from '../data/engagementSphere';
import type { StrikeMunitionAssessment } from '../types';

interface Props {
  assessment: StrikeMunitionAssessment;
  onClear: () => void;
  onOpenSphere?: (modelId: string, label: string) => void;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('.000Z', 'Z').replace('T', ' ');
}

export function MunitionInferencePanel({ assessment, onClear, onOpenSphere }: Props) {
  return (
    <aside
      className="munition-panel"
      role="dialog"
      aria-labelledby="munition-inference-title"
      data-testid="munition-inference"
    >
      <header className="munition-panel-head">
        <div>
          <p className="munition-kicker">UNCLASS · SAMPLE</p>
          <h3 id="munition-inference-title">Likely munitions</h3>
        </div>
        <button type="button" onClick={onClear} aria-label="Clear selected strike">
          Clear
        </button>
      </header>

      <p className="munition-label">{assessment.label}</p>
      <p className="muted munition-meta">
        {assessment.attackType} · {formatTimestamp(assessment.timestamp)}
      </p>
      <p className="munition-range">
        Slant range <strong>{Math.round(assessment.rangeKm)} km</strong>
        {' · '}
        {assessment.bearingLabel} · {Math.round(assessment.bearingDeg)}°
      </p>
      <p className="munition-note">{assessment.trajectory}</p>
      <p className="munition-note">{assessment.threatContext}</p>

      <ol className="munition-list">
        {assessment.candidates.map((c) => {
          const pct = Math.round(c.confidence * 100);
          return (
            <li key={c.id} data-testid="munition-candidate">
              <div className="munition-row">
                <span
                  className="munition-swatch"
                  style={{
                    borderColor: c.ringColor,
                    background: c.ringColor,
                  }}
                  aria-hidden
                />
                <span className="munition-name">{c.name}</span>
                <span className="munition-pct" aria-label={`${pct}% confidence`}>
                  {pct}%
                </span>
              </div>
              <div className="conf-bar" aria-hidden>
                <span style={{ width: `${pct}%`, background: c.ringColor }} />
              </div>
              <p className="munition-rationale">{c.rationale}</p>
              <p className="muted munition-envelope">
                Envelope ring {c.envelopeMinKm}–{c.envelopeMaxKm} km from origin
              </p>
              {c.catalogNotes && <p className="munition-note">{c.catalogNotes}</p>}
              {c.engagementSphereModelId && (
                <p className="linked-sphere">
                  {sphereModelById(c.engagementSphereModelId) && onOpenSphere ? (
                    <button
                      type="button"
                      className="sphere-open"
                      data-testid="engagement-sphere"
                      data-sphere-model-id={c.engagementSphereModelId}
                      onClick={() => {
                        const modelId = c.engagementSphereModelId;
                        if (modelId) onOpenSphere(modelId, c.name);
                      }}
                    >
                      Open sphere
                    </button>
                  ) : (
                    <span>Engagement sphere</span>
                  )}{' '}
                  <code className="sphere-id">{c.engagementSphereModelId}</code>
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <p className="muted munition-legend">
        Dashed rings are SAMPLE engagement envelopes drawn from the origin. The
        pale dotted ring is the observed slant range. Rings clear when the strike
        is deselected. Strike history pins, origins, arcs, and hot zones stay up.
      </p>
    </aside>
  );
}
