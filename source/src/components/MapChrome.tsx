import { useMemo, useState } from 'react';
import {
  BASE_LAYER_LABEL,
  BASE_LAYER_ORDER,
  thumbnailUrl,
  type BaseLayerId,
} from '../map/layerCatalog';

export type OverlayKey =
  | 'friendly'
  | 'enemy'
  | 'unknown'
  | 'control'
  | 'fires'
  | 'mgrs'
  | 'strikes'
  | 'observe'
  | 'weather'
  | 'sample';

export interface OverlaySetting {
  visible: boolean;
  opacity: number;
}

export type OverlayState = Record<OverlayKey, OverlaySetting>;

export const DEFAULT_OVERLAYS: OverlayState = {
  friendly: { visible: true, opacity: 1 },
  enemy: { visible: true, opacity: 1 },
  unknown: { visible: true, opacity: 1 },
  control: { visible: true, opacity: 0.95 },
  fires: { visible: true, opacity: 0.9 },
  mgrs: { visible: true, opacity: 0.72 },
  strikes: { visible: true, opacity: 0.9 },
  observe: { visible: true, opacity: 0.95 },
  weather: { visible: true, opacity: 1 },
  sample: { visible: true, opacity: 1 },
};

const OVERLAY_LABEL: Record<OverlayKey, string> = {
  friendly: 'Friendly units',
  enemy: 'Enemy units',
  unknown: 'Unknown units',
  control: 'Control measures',
  fires: 'Fires / range rings',
  mgrs: 'MGRS grid',
  strikes: 'Strike history',
  observe: 'Observe intel pins',
  weather: 'Weather / illumination stub',
  sample: 'SAMPLE marker layer',
};

interface Props {
  base: BaseLayerId;
  onBase: (layer: BaseLayerId) => void;
  compare: boolean;
  onCompare: (on: boolean) => void;
  compareWith: BaseLayerId;
  onCompareWith: (layer: BaseLayerId) => void;
  split: number;
  onSplit: (value: number) => void;
  tilted: boolean;
  onTilt: (tilted: boolean) => void;
  overlays: OverlayState;
  onOverlay: (key: OverlayKey, patch: Partial<OverlaySetting>) => void;
  onExport: () => void;
  exporting: boolean;
  previewLat: number;
  previewLng: number;
  attribution: string;
  photorealNote: string;
  weatherText: string | null;
}

export function MapChrome({
  base,
  onBase,
  compare,
  onCompare,
  compareWith,
  onCompareWith,
  split,
  onSplit,
  tilted,
  onTilt,
  overlays,
  onOverlay,
  onExport,
  exporting,
  previewLat,
  previewLng,
  attribution,
  photorealNote,
  weatherText,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [overlaysOpen, setOverlaysOpen] = useState(true);
  const next = useMemo(() => {
    const index = BASE_LAYER_ORDER.indexOf(base);
    return BASE_LAYER_ORDER[(index + 1) % BASE_LAYER_ORDER.length] ?? 'terrain';
  }, [base]);

  return (
    <>
      <div className="class-banner" data-testid="classification-banner">
        UNCLASSIFIED // SAMPLE
      </div>

      <section className={`overlay-panel ${overlaysOpen ? 'open' : ''}`} data-testid="overlay-panel">
        <header>
          <button
            type="button"
            className="overlay-title"
            aria-expanded={overlaysOpen}
            onClick={() => setOverlaysOpen((open) => !open)}
          >
            Overlays
          </button>
          <span className="sample-chip">EXAMPLE</span>
        </header>
        {overlaysOpen && (
          <ul>
            {(Object.keys(OVERLAY_LABEL) as OverlayKey[]).map((key) => {
              const setting = overlays[key];
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={`eye ${setting.visible ? 'on' : ''}`}
                    aria-pressed={setting.visible}
                    aria-label={`${setting.visible ? 'Hide' : 'Show'} ${OVERLAY_LABEL[key]}`}
                    onClick={() => onOverlay(key, { visible: !setting.visible })}
                  >
                    <Eye open={setting.visible} />
                  </button>
                  <span>{OVERLAY_LABEL[key]}</span>
                  <input
                    type="range"
                    min={0.15}
                    max={1}
                    step={0.05}
                    value={setting.opacity}
                    aria-label={`${OVERLAY_LABEL[key]} opacity`}
                    disabled={!setting.visible}
                    onChange={(event) =>
                      onOverlay(key, { opacity: Number(event.target.value) })
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {weatherText && overlays.weather.visible && (
        <aside className="weather-stub" data-testid="weather-stub" style={{ opacity: overlays.weather.opacity }}>
          <strong>SAMPLE illumination</strong>
          <p>{weatherText}</p>
        </aside>
      )}

      <div className="map-controls" data-testid="map-controls">
        <div className="tilt-toggle" role="group" aria-label="Map tilt">
          <button type="button" className={!tilted ? 'active' : ''} onClick={() => onTilt(false)}>
            2D
          </button>
          <button type="button" className={tilted ? 'active' : ''} onClick={() => onTilt(true)}>
            3D
          </button>
        </div>
        <button
          type="button"
          className={compare ? 'active' : ''}
          aria-pressed={compare}
          onClick={() => onCompare(!compare)}
        >
          Compare
        </button>
        {compare && (
          <label className="compare-pick">
            Right layer
            <select
              value={compareWith}
              aria-label="Comparison base layer"
              onChange={(event) => onCompareWith(event.target.value as BaseLayerId)}
            >
              {BASE_LAYER_ORDER.filter((id) => id !== base).map((id) => (
                <option key={id} value={id}>
                  {BASE_LAYER_LABEL[id]}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="button" className="primary" onClick={onExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export view to slide'}
        </button>
      </div>

      {compare && (
        <>
          <span className="split-label left">{BASE_LAYER_LABEL[base]}</span>
          <span className="split-label right">{BASE_LAYER_LABEL[compareWith]}</span>
          <div
            className="split-bar"
            style={{ left: `${split * 100}%` }}
            role="slider"
            tabIndex={0}
            aria-valuemin={15}
            aria-valuemax={85}
            aria-valuenow={Math.round(split * 100)}
            aria-label="Swipe to compare base layers"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
              if (!bounds) return;
              const nextSplit = (event.clientX - bounds.left) / bounds.width;
              onSplit(Math.min(0.85, Math.max(0.15, nextSplit)));
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') onSplit(Math.max(0.15, split - 0.04));
              if (event.key === 'ArrowRight') onSplit(Math.min(0.85, split + 0.04));
            }}
          />
        </>
      )}

      <div className={`layer-switch ${expanded ? 'open' : ''}`} data-testid="layer-switch">
        {expanded && (
          <div className="layer-switch-grid" role="listbox" aria-label="Base layers">
            {BASE_LAYER_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={id === base}
                className={id === base ? 'active' : ''}
                onClick={() => {
                  onBase(id);
                  setExpanded(false);
                }}
              >
                <img
                  src={thumbnailUrl(id, previewLat, previewLng)}
                  alt=""
                  className={id === 'military' ? 'muted' : id === 'photoreal' ? 'tilt' : ''}
                />
                <span>{BASE_LAYER_LABEL[id]}</span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="layer-peek"
          data-testid="layer-peek"
          onClick={() => onBase(next)}
          title={`Show ${BASE_LAYER_LABEL[next]}`}
        >
          <img
            src={thumbnailUrl(next, previewLat, previewLng)}
            alt=""
            className={next === 'military' ? 'muted' : next === 'photoreal' ? 'tilt' : ''}
          />
          <span>{BASE_LAYER_LABEL[next]}</span>
        </button>
        <button
          type="button"
          className="layer-expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Close' : 'Layers'}
        </button>
      </div>

      <p className="map-attribution" data-testid="map-attribution">
        {attribution}
        {photorealNote ? ` · ${photorealNote}` : ''}
      </p>
    </>
  );
}

function Eye({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.4" fill={open ? 'currentColor' : 'none'} stroke="currentColor" />
      {!open && <path d="M5 19 L19 5" stroke="currentColor" strokeWidth="1.7" />}
    </svg>
  );
}
