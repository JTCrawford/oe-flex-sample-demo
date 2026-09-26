import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { AO, SymbologyMode, ThreatLayer } from '../types';
import 'leaflet/dist/leaflet.css';

interface Props {
  aos: AO[];
  selectedAoId: string | null;
  onSelectAo: (id: string) => void;
  visibleLayers: ThreatLayer[];
  symbology: SymbologyMode;
  killSwitch: boolean;
}

function FlyTo({ ao }: { ao: AO | null }) {
  const map = useMap();
  useEffect(() => {
    if (ao) map.flyTo([ao.lat, ao.lng], 6, { duration: 0.8 });
  }, [ao, map]);
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

export function Map2D({
  aos,
  selectedAoId,
  onSelectAo,
  visibleLayers,
  symbology,
  killSwitch,
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
        <FlyTo ao={selectedAo} />
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
      </MapContainer>
    </div>
  );
}
