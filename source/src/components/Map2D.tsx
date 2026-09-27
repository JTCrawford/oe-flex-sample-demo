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
  SocialMapHint,
  StrikeEvent,
  StrikeMunitionAssessment,
  StrikeOverlayToggles,
  ForceSide,
  StrikeRangeRing,
  SymbologyMode,
  ThreatLayer,
  MunitionProfile,
  UnitOrbat,
  VehicleHolding,
} from '../types';
import type { ResolvedEngagementLine } from '../data/scenarios';
import { OrbatInspect } from './OrbatPanel';
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
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
  onOpenSphere?: (unitId: string, holding: VehicleHolding) => void;
  onOpenMunitionSphere?: (unitId: string, profile: MunitionProfile) => void;
  unitRangeRings?: StrikeRangeRing[];
  selectionFocus?: 'strike' | 'unit' | 'social' | null;
  socialMapHints?: SocialMapHint[];
  engagementLines?: ResolvedEngagementLine[];
}

function FlyTo({ ao, suspend }: { ao: AO | null; suspend: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (ao && !suspend) map.flyTo([ao.lat, ao.lng], 6, { duration: 0.8 });
  }, [ao, map, suspend]);
  return null;
}

/** Pan to a selected unit without overriding a selected strike. */
function FlyToUnit({
  unit,
  radiusKm,
}: {
  unit: { lat: number; lng: number } | null;
  radiusKm: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!unit) return;
    if (radiusKm >= 30) {
      const dLat = radiusKm / 111;
      const cos = Math.cos((unit.lat * Math.PI) / 180) || 0.2;
      const dLng = radiusKm / (111 * cos);
      const bounds = L.latLngBounds(
        [unit.lat - dLat, unit.lng - dLng],
        [unit.lat + dLat, unit.lng + dLng],
      );
      map.fitBounds(bounds.pad(0.1), { maxZoom: 8, animate: true });
      return;
    }
    map.panTo([unit.lat, unit.lng]);
  }, [unit, radiusKm, map]);
  return null;
}

function FlyToSocial({ hints }: { hints: SocialMapHint[] }) {
  const map = useMap();
  useEffect(() => {
    if (hints.length === 0) return;
    if (hints.length === 1) {
      const only = hints[0];
      if (!only) return;
      map.flyTo([only.lat, only.lon], 7, { duration: 0.8 });
      return;
    }
    const bounds = L.latLngBounds(hints.map((hint) => [hint.lat, hint.lon]));
    map.fitBounds(bounds.pad(0.35), { maxZoom: 8 });
  }, [hints, map]);
  return null;
}

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

function symbolSvg(
  kind: string | undefined,
  mode: SymbologyMode,
  side?: ForceSide,
): string {
  if (mode === 'military') {
    const stroke =
      side === 'friendly'
        ? '#5eb1ff'
        : side === 'adversary'
          ? '#ff5a5a'
          : kind === 'arty'
            ? '#f5a623'
            : kind === 'uav'
              ? '#6ec6ff'
              : '#7CFC9A';
    if (kind === 'infantry') {
      return `<svg width="28" height="28" viewBox="0 0 40 40"><polygon points="20,2 38,20 20,38 2,20" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><circle cx="20" cy="14" r="3.2" fill="none" stroke="${stroke}"/><path d="M20 17.5 V26 M13 21 H27 M15 32 L20 26 L25 32" fill="none" stroke="${stroke}" stroke-width="1.6"/></svg>`;
    }
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

function makeSymbolIcon(
  kind: string | undefined,
  mode: SymbologyMode,
  label: string,
  selected: boolean,
  side?: ForceSide,
) {
  return L.divIcon({
    className: `leaflet-symbol-wrapper${selected ? ' is-selected' : ''}`,
    html: `<div class="leaflet-symbol" data-side="${side ?? ''}" title="${label.replace(/"/g, '')}">${symbolSvg(kind, mode, side)}</div>`,
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

function makeSocialHintIcon(label: string) {
  const svg = `<svg width="22" height="22" viewBox="0 0 40 40"><polygon points="20,3 37,20 20,37 3,20" fill="rgba(40,28,8,0.9)" stroke="#ffb703" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="#ffb703"/></svg>`;
  return L.divIcon({
    className: 'leaflet-symbol-wrapper social-pin is-selected',
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
  selectedUnitId = null,
  onSelectUnit,
  onOpenSphere,
  onOpenMunitionSphere,
  unitRangeRings = [],
  selectionFocus = null,
  socialMapHints = [],
  engagementLines = [],
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
      orbat?: UnitOrbat;
      side?: ForceSide;
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
          orbat: m.orbat,
          side: symbology === 'military' ? m.side : undefined,
        });
      }
    }
    return list;
  }, [visibleLayers, killSwitch, symbology]);

  const selectedUnit = useMemo(
    () => threatMarkers.find((m) => m.id === selectedUnitId && m.orbat) ?? null,
    [threatMarkers, selectedUnitId],
  );

  const overlaysOn = showStrikeOverlays && strikes.length > 0 && !!strikeOverlays;
  const selectedStrike = useMemo(
    () => strikes.find((s) => s.id === selectedStrikeId) ?? null,
    [strikes, selectedStrikeId],
  );
  const focusRadiusKm = munitionAssessment?.candidates[0]?.envelopeMaxKm ?? 40;
  const unitFocusKm = unitRangeRings.reduce(
    (max, ring) => Math.max(max, ring.radiusKm),
    0,
  );
  const mapRings = [...(munitionAssessment?.rings ?? []), ...unitRangeRings];

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
        <FlyTo
          ao={selectedAo}
          suspend={
            selectionFocus === 'strike' ||
            selectionFocus === 'unit' ||
            (selectionFocus === 'social' && socialMapHints.length > 0)
          }
        />
        <FlyToStrike
          strike={selectionFocus === 'strike' ? selectedStrike : null}
          radiusKm={focusRadiusKm}
        />
        <FlyToSocial hints={selectionFocus === 'social' ? socialMapHints : []} />
        <FlyToUnit
          unit={selectionFocus === 'unit' ? selectedUnit : null}
          radiusKm={unitFocusKm}
        />
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
        {engagementLines.map((line) => (
          <Polyline
            key={line.id}
            positions={[
              [line.fromLat, line.fromLng],
              [line.toLat, line.toLng],
            ]}
            pathOptions={{
              color: line.color,
              weight: 3,
              opacity: 0.9,
              dashArray: '10 6',
            }}
          >
            <Popup>{line.label}</Popup>
          </Polyline>
        ))}
        {threatMarkers.map((m) => (
          <Marker
            key={`${m.id}-${symbology}`}
            position={[m.lat, m.lng]}
            zIndexOffset={selectedUnitId === m.id ? 400 : 0}
            icon={makeSymbolIcon(
              m.symbolKind,
              symbology,
              m.orbat ? `${m.orbat.designation}` : m.label,
              selectedUnitId === m.id,
              m.side,
            )}
            eventHandlers={
              m.orbat
                ? { click: () => onSelectUnit?.(m.id) }
                : undefined
            }
          >
            <Popup>
              {m.orbat ? (
                <OrbatInspect
                  orbat={m.orbat}
                  variant="popup"
                  onOpenSphere={
                    onOpenSphere
                      ? (holding) => onOpenSphere(m.id, holding)
                      : undefined
                  }
                  onOpenMunitionSphere={
                    onOpenMunitionSphere
                      ? (profile) => onOpenMunitionSphere(m.id, profile)
                      : undefined
                  }
                  rangeRingsOn={selectedUnitId === m.id && unitRangeRings.length > 0}
                />
              ) : (
                m.label
              )}
            </Popup>
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

        {mapRings.map((ring) => (
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

        {socialMapHints.length >= 2 && (
          <Polyline
            positions={socialMapHints.map((hint) => [hint.lat, hint.lon])}
            pathOptions={{
              color: '#ffb703',
              weight: 3,
              opacity: 0.9,
              dashArray: '10 6',
            }}
          />
        )}

        {socialMapHints.map((hint) => (
          <Marker
            key={hint.id}
            position={[hint.lat, hint.lon]}
            zIndexOffset={700}
            icon={makeSocialHintIcon(hint.name)}
          >
            <Popup>
              <strong>{hint.name}</strong>
              <br />
              Social / SOCMINT · SAMPLE
              <br />
              {hint.headline}
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
