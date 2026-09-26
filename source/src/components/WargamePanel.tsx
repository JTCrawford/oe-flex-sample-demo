import type { AppState } from '../hooks/useAppState';
import { SalesCallout } from './SalesCallout';

interface Props {
  state: AppState;
}

export function WargamePanel({ state }: Props) {
  const {
    vignette,
    selectedAo,
    selectedMitigationId,
    setSelectedMitigationId,
    runWargame,
    wargameOutcome,
  } = state;

  if (!selectedAo || !vignette) {
    return (
      <div className="panel">
        <h2>Wargame</h2>
        <p className="muted">Select AO and review Mitigate options first.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Wargame · COA analysis</h2>
      <SalesCallout id="wargame" compact />
      <p className="muted">
        Simple probabilistic red model (demo). Pick a mitigation and run.
      </p>

      <ul className="mitigation-list selectable">
        {vignette.mitigations.map((m) => (
          <li key={m.id}>
            <label>
              <input
                type="radio"
                name="mitigation"
                checked={selectedMitigationId === m.id}
                onChange={() => setSelectedMitigationId(m.id)}
              />
              <strong>{m.label}</strong>
              <span className="cost">{m.cost}</span>
            </label>
            <p>{m.description}</p>
            <small>Base success ≈ {(m.baseSuccess * 100).toFixed(0)}%</small>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="primary"
        disabled={!selectedMitigationId}
        onClick={() => {
          const m = vignette.mitigations.find(
            (x) => x.id === selectedMitigationId,
          );
          if (m) runWargame(m);
        }}
      >
        Run red model
      </button>

      {wargameOutcome && (
        <div className="outcome-card">
          <h3>Outcomes (SAMPLE)</h3>
          <p>
            Success probability:{' '}
            <strong>{(wargameOutcome.successProb * 100).toFixed(0)}%</strong>
          </p>
          <p>
            <em>Red:</em> {wargameOutcome.redResponse}
          </p>
          <p>
            <em>Residual:</em> {wargameOutcome.residualRisk}
          </p>
          <p>{wargameOutcome.narrative}</p>
        </div>
      )}
    </div>
  );
}
