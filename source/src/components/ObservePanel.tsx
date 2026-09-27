import type { AppState } from '../hooks/useAppState';
import { profilesForOrbat } from '../data/munitionCatalog';
import { orbatCountSummary } from '../data/orbat';
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
    visibleStrikes,
    selectedStrikeId,
    selectStrike,
    clearStrike,
    visibleLayers,
    selectedUnitId,
    toggleUnit,
  } = state;

  const unitPins = visibleLayers.flatMap((layer) =>
    layer.markers.filter((marker) => marker.orbat),
  );

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
          {visibleStrikes.length > 0 && (
            <>
              <h3>Munition inference</h3>
              <p className="muted">
                Click an impact or origin pin — or a strike below — to list likely
                munition types from range, trajectory, and threat context. UNCLASS
                SAMPLE only. History pins, arcs, and hot zones stay on the map.
              </p>
              <ul className="strike-pick-list">
                {visibleStrikes.map((s) => {
                  const selected = selectedStrikeId === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={selected ? 'active' : ''}
                        aria-pressed={selected}
                        onClick={() => (selected ? clearStrike() : selectStrike(s.id))}
                      >
                        {s.attackType} · {s.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <SalesCallout id="munitionInference" compact />
            </>
          )}
        </section>
      )}

      <section>
        <h3>Order of battle</h3>
        <p className="muted">
          Unit pins carry a SAMPLE designation, typed vehicle counts, and any
          linked munition profiles. Select a pin on the map or a unit below. The
          list follows the AO, layer toggles, PMESII filters, and the kill-switch.
          Range rings need Military symbology. Strike history stays on the map.
        </p>
        {unitPins.length === 0 ? (
          <p className="muted">No unit pins in the current Observe view.</p>
        ) : (
          <ul className="strike-pick-list">
            {unitPins.map((marker) => {
              const selected = selectedUnitId === marker.id;
              const orbat = marker.orbat;
              if (!orbat) return null;
              const linked = profilesForOrbat(orbat);
              return (
                <li key={marker.id}>
                  <button
                    type="button"
                    className={selected ? 'active' : ''}
                    aria-pressed={selected}
                    onClick={() => toggleUnit(marker.id)}
                  >
                    {orbat.designation}
                    <small className="orbat-pick-counts">{orbatCountSummary(orbat)}</small>
                    {linked.length > 0 && (
                      <small className="orbat-pick-counts">
                        {linked.map((profile) => profile.shortName).join(' · ')}
                      </small>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <SalesCallout id="orbat" compact />
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
