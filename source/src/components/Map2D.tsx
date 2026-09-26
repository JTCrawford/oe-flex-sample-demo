import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type {
  AO,
  StrikeEvent,
  StrikeMunitionAssessment,
  StrikeOverlayToggles,
  SymbologyMode,
  ThreatLayer,
} from '../types';
import 'leaflet/dist/leaflet.css';

interface Props {
  aos: AO[];
  selectedAoId: string | null;
  onSelectAo: (id: string) => void;
  visibleLayers: ThreatLayer[];
  symbology: SymbologyMode;
  killSwitch: boolean;
  strikes?: StrikeEvent[];
  strikeOverlays?: StrikeOverlayToggles;
  showStrikeOverlays?: boolean;
  selectedStrikeId?: string | null;
  onSelectStrike?: (id: string) => void;
  munitionAssessment?: StrikeMunitionAssessment | null;
}

function FlyTo({ ao, suspend }: { ao: AO | null; suspend: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (ao && !suspend) map.flyTo([ao.lat, ao.lng], 6, { duration: 0.8 });
  }, [ao, map, suspend]);
  return null;
}

/** Frame the selected strike and its primary envelope without dropping history layers. */
function FlyToStrike({
  strike,
  radiusKm,
}: {
  strike: StrikeEvent | null;
  radiusKm: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!strike) return;
    const fitKm = Math.min(Math.max(radiusKm, 20), 160);
    const dLat = fitKm / 111;
    const dLng = fitKm / (111 * Math.cos((strike.originLat * Math.PI) / 180));
    const bounds = L.latLngBounds(
      [strike.originLat - dLat, strike.originLng - dLng],
      [strike.originLat + dLat, strike.originLng + dLng],
    );
    bounds.extend([strike.impactLat, strike.impactLng]);
    map.fitBounds(bounds.pad(0.12), { maxZoom: 8 });
  }, [strike, radiusKm, map]);
  return null;
}

function symbolSvg(kind: string | undefined, mode: SymbologyMode): string {
  if (mode === 'military') {
    const stroke =
      kind === 'arty' ? '#f5a623' : kind === 'uav' ? '#6ec6ff' : '#7CFC9A';
    if (kind === 'ship') {
      return `<svg width="28" height="28" viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="16" ry="10" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><path d="M8 22 L20 10 L32 22" fill="none" stroke="${stroke}"/></svg>`;
    }
    if (kind === 'arty') {
      return `<svg width="28" height="28" viewBox="0 0 40 40"><polygon points="20,2 38,20 20,38 2,20" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="none" stroke="${stroke}"/><circle cx="20" cy="20" r="2" fill="${stroke}"/></svg>`;
    }
    return `<svg width="28" height="28" viewBox="0 0 40 40"><polygon points="20,2 38,20 20,38 2,20" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><rect x="10" y="16" width="20" height="8" rx="1" fill="none" stroke="${stroke}"/></svg>`;
  }
  // commercial
  if (kind === 'pipeline') {
    return `<svg width="28" height="28" viewBox="0 0 40 40"><path d="M4 28 C12 8, 28 32, 36 12" fill="none" stroke="#e67e22" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="20" r="4" fill="#e67e22"/></svg>`;
  }
  if (kind === 'port') {
    return `<svg width="28" height="28" viewBox="0 0 40 40"><rect x="6" y="22" width="28" height="10" fill="#888"/><rect x="10" y="10" width="8" height="12" fill="#f5a623"/></svg>`;
  }
  if (kind === 'hazard') {
    return `<svg width="28" height="28" viewBox="0 0 40 40"><polygon points="20,4 36,34 4,34" fill="#f1c40f" stroke="#333"/><text x="20" y="28" text-anchor="middle" font-size="14" font-weight="bold">!</text></svg>`;
  }
  return `<svg width="28" height="28" viewBox="0 0 40 40"><rect x="4" y="18" width="32" height="10" rx="2" fill="#1e90ff"/><polygon points="8,18 16,8 24,8 28,18" fill="#4aa3ff"/></svg>`;
}

function makeSymbolIcon(kind: string | undefined, mode: SymbologyMode, label: string) {
  return L.divIcon({
    className: 'leaflet-symbol-wrapper',
    html: `<div class="leaflet-symbol" title="${label.replace(/"/g, '')}">${symbolSvg(kind, mode)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function makeStrikeImpactIcon(label: string, selected: boolean) {
  const svg = `<svg width="22" height="22" viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="rgba(180,40,20,0.35)" stroke="${selected ? '#f5d76e' : '#ff5722'}" stroke-width="${selected ? 3 : 2}"/><path d="M20 6 L22 16 L32 14 L24 20 L32 28 L20 24 L8 28 L16 20 L8 14 L18 16 Z" fill="#ff7043" stroke="#fff" stroke-width="0.5"/></svg>`;
  return L.divIcon({
    className: `leaflet-symbol-wrapper strike-pin${selected ? ' is-selected' : ''}`,
    html: `<div class="leaflet-symbol" title="${label.replace(/"/g, '')}">${svg}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function makeStrikeOriginIcon(label: string) {
  const svg = `<svg width="14" height="14" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="#00bcd4" stroke="#e0f7fa" stroke-width="2"/></svg>`;
  return L.divIcon({
    className: 'leaflet-symbol-wrapper strike-origin',
    html: `<div class="leaflet-symbol" title="${label.replace(/"/g, '')}">${svg}</div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/** Approximate meters for hot-zone circle from intensity (0.2–1). */
function hotZoneRadiusMeters(intensity: number): number {
  return 4000 + intensity * 18000;
}

export function Map2D({
  aos,
  selectedAoId,
  onSelectAo,
  visibleLayers,
  symbology,
  killSwitch,
  strikes = [],
  strikeOverlays,
  showStrikeOverlays = false,
  selectedStrikeId = null,
  onSelectStrike,
  munitionAssessment = null,
}: Props) {
  const selectedAo = useMemo(
    () => aos.find((a) => a.id === selectedAoId) ?? null,
    [aos, selectedAoId],
  );

  const threatMarkers = useMemo(() => {
    if (killSwitch) return [];
    const list: {
      id: string;
      lat: number;
      lng: number;
      label: string;
      symbolKind?: string;
    }[] = [];
    for (const layer of visibleLayers) {
      for (const m of layer.markers) {
        list.push({
          id: m.id,
          lat: m.lat,
          lng: m.lng,
          label: m.label,
          symbolKind:
            symbology === 'military' ? m.milSymbol : m.commercialSymbol,
        });
      }
    }
    return list;
  }, [visibleLayers, killSwitch, symbology]);

  const overlaysOn = showStrikeOverlays && strikes.length > 0 && !!strikeOverlays;
  const selectedStrike = useMemo(
    () => strikes.find((s) => s.id === selectedStrikeId) ?? null,
    [strikes, selectedStrikeId],
  );
  const focusRadiusKm = munitionAssessment?.candidates[0]?.envelopeMaxKm ?? 40;

  return (
    <div className="map-surface" data-export-root>
      <MapContainer
        center={[27, 56]}
        zoom={4}
        className="leaflet-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo ao={selectedAo} suspend={!!selectedStrike} />
        <FlyToStrike strike={selectedStrike} radiusKm={focusRadiusKm} />
        {aos.map((ao) => (
          <CircleMarker
            key={ao.id}
            center={[ao.lat, ao.lng]}
            radius={selectedAoId === ao.id ? 14 : 10}
            pathOptions={{
              color: selectedAoId === ao.id ? '#ff6b35' : '#f5d76e',
              fillColor: selectedAoId === ao.id ? '#ff6b35' : '#f5d76e',
              fillOpacity: 0.85,
              weight: 2,
            }}
            eventHandlers={{ click: () => onSelectAo(ao.id) }}
          >
            <Popup>
              <strong>{ao.name}</strong>
              <br />
              {ao.description}
              <br />
              <button type="button" onClick={() => onSelectAo(ao.id)}>
                Select AO
              </button>
            </Popup>
          </CircleMarker>
        ))}
        {threatMarkers.map((m) => (
          <Marker
            key={`${m.id}-${symbology}`}
            position={[m.lat, m.lng]}
            icon={makeSymbolIcon(m.symbolKind, symbology, m.label)}
          >
            <Popup>{m.label}</Popup>
          </Marker>
        ))}

        {overlaysOn &&
          strikeOverlays!.hotZones &&
          strikes.map((s) => (
            <Circle
              key={`hz-${s.id}`}
              center={[s.impactLat, s.impactLng]}
              radius={hotZoneRadiusMeters(s.intensity)}
              pathOptions={{
                color: '#ff3c28',
                fillColor: '#ff5722',
                fillOpacity: 0.12 + s.intensity * 0.18,
                weight: 1,
              }}
            >
              <Popup>
                Hot zone · {s.attackType} · intensity {s.intensity.toFixed(2)}
                <br />
                {s.label}
              </Popup>
            </Circle>
          ))}

        {overlaysOn &&
          (strikeOverlays!.origins || strikeOverlays!.strikeHistory) &&
          strikes.map((s) => (
            <Polyline
              key={`arc-${s.id}`}
              positions={[
                [s.originLat, s.originLng],
                [s.impactLat, s.impactLng],
              ]}
              pathOptions={{
                color: '#ff7043',
                weight: 2,
                opacity: 0.75,
                dashArray: '6 4',
              }}
            />
          ))}

        {overlaysOn &&
          selectedStrike &&
          (strikeOverlays!.origins || strikeOverlays!.strikeHistory) && (
            <Polyline
              key={`arc-selected-${selectedStrike.id}`}
              positions={[
                [selectedStrike.originLat, selectedStrike.originLng],
                [selectedStrike.impactLat, selectedStrike.impactLng],
              ]}
              pathOptions={{
                color: '#f5d76e',
                weight: 3,
                opacity: 0.95,
              }}
            />
          )}

        {munitionAssessment &&
          munitionAssessment.rings.map((ring) => (
            <Circle
              key={ring.id}
              center={[ring.lat, ring.lng]}
              radius={ring.radiusKm * 1000}
              interactive={false}
              pathOptions={{
                color: ring.color,
                fillColor: ring.color,
                fillOpacity: ring.fillOpacity,
                weight: ring.weight,
                dashArray: ring.dashArray,
                opacity: 0.95,
              }}
            />
          ))}

        {overlaysOn &&
          strikeOverlays!.strikeHistory &&
          strikes.map((s) => (
            <Marker
              key={`impact-${s.id}`}
              position={[s.impactLat, s.impactLng]}
              zIndexOffset={selectedStrikeId === s.id ? 600 : 200}
              icon={makeStrikeImpactIcon(
                `${s.attackType.toUpperCase()} · ${s.timestamp} — ${s.label}`,
                selectedStrikeId === s.id,
              )}
              eventHandlers={{
                click: () => onSelectStrike?.(s.id),
              }}
            >
              <Popup>
                <strong>Impact · {s.attackType}</strong>
                <br />
                {s.timestamp}
                <br />
                {s.label}
              </Popup>
            </Marker>
          ))}

        {overlaysOn &&
          strikeOverlays!.origins &&
          strikes.map((s) => (
            <Marker
              key={`origin-${s.id}`}
              position={[s.originLat, s.originLng]}
              zIndexOffset={selectedStrikeId === s.id ? 500 : 100}
              icon={makeStrikeOriginIcon(`Origin · ${s.attackType} — ${s.label}`)}
              eventHandlers={{
                click: () => onSelectStrike?.(s.id),
              }}
            >
              <Popup>
                <strong>Origin · {s.attackType}</strong>
                <br />
                {s.label}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
