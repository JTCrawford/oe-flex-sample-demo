import type { AppState } from '../hooks/useAppState';
import { PMESII_LETTERS, PMESII_TOOLTIPS } from '../data/pmesii';
import type { StrikeOverlayToggles } from '../types';
import { SalesCallout } from './SalesCallout';
import { SymbolIcon } from './SymbologyIcons';

interface Props {
  state: AppState;
}

const STRIKE_TOGGLE_LABELS: { key: keyof StrikeOverlayToggles; label: string }[] =
  [
    { key: 'currentPositions', label: 'Current positions only' },
    { key: 'strikeHistory', label: 'Strike history (impact pins)' },
    { key: 'origins', label: 'Origin points' },
    { key: 'hotZones', label: 'Hot zones (heat / intensity)' },
  ];

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
    strikeOverlayAvailable,
    strikeOverlays,
    toggleStrikeOverlay,
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
        <p className="muted pmesii-hint">
          Hover a letter to learn that OE variable. Click to filter layers.
        </p>
        <div className="chip-row pmesii-bar" role="group" aria-label="PMESII-PT filters">
          {allPmesii.map((chip, index) => {
            const letter = PMESII_LETTERS[chip];
            const tip = PMESII_TOOLTIPS[chip];
            const showHyphen = index === 5; // after second I (Infrastructure), before Physical P
            return (
              <span key={chip} className="pmesii-letter-wrap">
                <button
                  type="button"
                  className={`chip pmesii-letter ${pmesiiFilters.has(chip) ? 'on' : ''}`}
                  onClick={() => togglePmesii(chip)}
                  aria-label={`${chip}: ${tip}`}
                  aria-pressed={pmesiiFilters.has(chip)}
                >
                  {letter}
                  <span className="pmesii-tooltip" role="tooltip">
                    {tip}
                  </span>
                </button>
                {showHyphen ? (
                  <span className="pmesii-hyphen" aria-hidden="true">
                    -
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
      </section>

      {strikeOverlayAvailable && (
        <section>
          <h3>Strike History & Hot Zones</h3>
          <p className="muted">
            SAMPLE unclassified strike overlays — Military filter + military
            symbology required.
          </p>
          <ul className="strike-overlay-list">
            {STRIKE_TOGGLE_LABELS.map(({ key, label }) => (
              <li key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={strikeOverlays[key]}
                    onChange={() => toggleStrikeOverlay(key)}
                  />
                  <span>{label}</span>
                </label>
              </li>
            ))}
          </ul>
          <SalesCallout id="strikeHistory" compact />
        </section>
      )}

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
