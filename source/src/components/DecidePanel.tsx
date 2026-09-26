import { partnerHooks } from '../data/partners';
import type { AppState } from '../hooks/useAppState';
import { SalesCallout } from './SalesCallout';

interface Props {
  state: AppState;
}

export function DecidePanel({ state }: Props) {
  const {
    selectedAo,
    wargameOutcome,
    commitResource,
    committedResources,
    showToast,
  } = state;

  return (
    <div className="panel">
      <h2>Decide · commit & partners</h2>
      <SalesCallout id="decide" compact />

      {!selectedAo && (
        <p className="muted">Select an AO to contextualize commitments.</p>
      )}

      {wargameOutcome ? (
        <div className="banner info">
          Last wargame residual: {wargameOutcome.residualRisk}
        </div>
      ) : (
        <p className="muted">Run Wargame first for residual-risk context (optional).</p>
      )}

      <section>
        <h3>Commit resources (stub)</h3>
        <div className="btn-row wrap">
          {['ISR sortie hours', 'Escort package', 'ATGM team', 'EW detachment'].map(
            (r) => (
              <button
                key={r}
                type="button"
                className={committedResources.includes(r) ? 'active' : ''}
                onClick={() => commitResource(r)}
              >
                {r}
              </button>
            ),
          )}
        </div>
        {committedResources.length > 0 && (
          <p className="muted">
            Committed: {committedResources.join(', ')}
          </p>
        )}
      </section>

      <section>
        <h3>Partner intro hooks (stub toast/modal)</h3>
        <div className="partner-grid">
          {partnerHooks.map((p) => (
            <button
              key={p.id}
              type="button"
              className="partner-btn"
              onClick={() =>
                showToast(`Partner intro stub: ${p.label} — ${p.description}`)
              }
            >
              <strong>{p.label}</strong>
              <span>{p.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
