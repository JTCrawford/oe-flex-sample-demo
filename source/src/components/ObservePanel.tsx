import type { AppState } from '../hooks/useAppState';
import { SalesCallout } from './SalesCallout';
import { SymbolIcon } from './SymbologyIcons';

interface Props {
  state: AppState;
}

export function ObservePanel({ state }: Props) {
  const {
    selectedAo,
    availableLayers,
    enabledLayers,
    toggleLayer,
    pmesiiFilters,
    togglePmesii,
    allPmesii,
    symbology,
    setSymbologyMutex,
    killSwitch,
    isCommercialPartner,
  } = state;

  if (!selectedAo) {
    return (
      <div className="panel">
        <h2>Observe</h2>
        <p className="muted">Click an AO on the globe/map to load threat layers.</p>
        <SalesCallout id="observe" compact />
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Observe · {selectedAo.name}</h2>
      <SalesCallout id="observe" compact />

      {killSwitch && (
        <div className="banner warn">
          Kill-switch active — live Observe layers blanked.
        </div>
      )}

      {isCommercialPartner && (
        <div className="banner info">
          Commercial Partner RBAC: feeder positions hidden. Vignette + mitigation
          only for sensitive feeders.
        </div>
      )}

      <section>
        <h3>Symbology deck (hard mutex)</h3>
        <div className="btn-row">
          <button
            type="button"
            className={symbology === 'military' ? 'active' : ''}
            onClick={() => setSymbologyMutex('military')}
          >
            Military (2525-style)
          </button>
          <button
            type="button"
            className={symbology === 'commercial' ? 'active' : ''}
            onClick={() => setSymbologyMutex('commercial')}
          >
            Commercial
          </button>
        </div>
        <SalesCallout
          id={symbology === 'military' ? 'milSymbology' : 'commercialSymbology'}
          compact
        />
        <div className="symbol-preview">
          <SymbolIcon
            kind={selectedAo.type === 'land' ? 'armor' : 'ship'}
            mode={symbology}
            size={32}
          />
          <span>
            Active deck: <strong>{symbology}</strong> — never both.
          </span>
        </div>
      </section>

      <section>
        <h3>PMESII-PT filters</h3>
        <div className="chip-row">
          {allPmesii.map((chip) => {
            const short: Record<string, string> = {
              Political: 'P',
              Military: 'M',
              Economic: 'E',
              Social: 'S',
              Information: 'I',
              Infrastructure: 'I',
              Physical: 'Physical',
              Time: 'Time',
            };
            return (
              <button
                key={chip}
                type="button"
                className={`chip ${pmesiiFilters.has(chip) ? 'on' : ''}`}
                onClick={() => togglePmesii(chip)}
                title={chip}
              >
                {short[chip] ?? chip}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3>Threat layers</h3>
        <ul className="layer-list">
          {availableLayers.map((layer) => (
            <li key={layer.id}>
              <label>
                <input
                  type="checkbox"
                  checked={enabledLayers.has(layer.id)}
                  disabled={killSwitch}
                  onChange={() => toggleLayer(layer.id)}
                />
                <span>
                  {layer.label}
                  {layer.isFeeder && (
                    <em className="feeder-tag"> feeder</em>
                  )}
                </span>
              </label>
              <small>{layer.pmesii.join(' · ')}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
