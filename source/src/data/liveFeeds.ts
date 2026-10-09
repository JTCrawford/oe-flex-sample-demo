/** Demo-only public tracks. Not a domain pipeline and not for operational use. */

export const LIVE_DISCLAIMER =
  'LIVE – open public feed, demo only, not for operational use';

export const SHIP_COVERAGE_LABEL = 'Coverage: Baltic / Finnish waters only';

export const DIGITRAFFIC_USER = 'ThreatTec-OEFlex-demo';

export const DIGITRAFFIC_LOCATIONS =
  'https://meri.digitraffic.fi/api/ais/v1/locations';

export const DIGITRAFFIC_VESSELS =
  'https://meri.digitraffic.fi/api/ais/v1/vessels';

export const SHIP_ATTRIBUTION = 'Digitraffic / Fintraffic AIS (CC BY 4.0)';

/** Finnish / Baltic AIS footprint published for this demo. */
export const BALTIC_COVERAGE = {
  lamin: 57,
  lamax: 66,
  lomin: 17,
  lomax: 33,
} as const;

export const BALTIC_FLY = {
  lat: 60.2,
  lng: 24.6,
  zoom: 7,
  altitude: 0.32,
} as const;

export const LIVE_POLL_MS = 60_000;
export const VESSEL_REFRESH_MS = 10 * 60_000;
export const SHIP_RENDER_CAP = 400;

export type MapView = {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
  clat: number;
  clon: number;
};

export type LiveFlyRequest = {
  seq: number;
  lat: number;
  lng: number;
  zoom: number;
  altitude: number;
};

export type LiveAircraft = {
  icao: string;
  callsign: string | null;
  lat: number;
  lon: number;
  heading: number | null;
  speedKt: number | null;
  updatedAt: number;
};

export type LiveShip = {
  mmsi: number;
  name: string | null;
  callsign: string | null;
  lat: number;
  lon: number;
  heading: number | null;
  speedKt: number | null;
  updatedAt: number;
};

export type AircraftSource = 'opensky' | 'adsb.lol';

export type AircraftFeed = {
  source: AircraftSource;
  attribution: string;
  fetchedAt: number;
  aircraft: LiveAircraft[];
};

const QUERY_LAT_SPAN = 8;
const QUERY_LON_SPAN = 10;

function roundStep(n: number, step: number, dir: 'down' | 'up'): number {
  const units = n / step;
  const snapped = dir === 'down' ? Math.floor(units) : Math.ceil(units);
  return Math.round(snapped * step * 10) / 10;
}

/** Collapse tiny pans so the aircraft request stays on a shared cache key. */
export function quantizeView(view: MapView, step = 0.5): MapView {
  return {
    lamin: roundStep(view.lamin, step, 'down'),
    lomin: roundStep(view.lomin, step, 'down'),
    lamax: roundStep(view.lamax, step, 'up'),
    lomax: roundStep(view.lomax, step, 'up'),
    clat: Math.round(Math.round(view.clat / step) * step * 10) / 10,
    clon: Math.round(Math.round(view.clon / step) * step * 10) / 10,
  };
}

export function sameView(a: MapView | null, b: MapView): boolean {
  if (!a) return false;
  return (
    a.lamin === b.lamin &&
    a.lomin === b.lomin &&
    a.lamax === b.lamax &&
    a.lomax === b.lomax &&
    a.clat === b.clat &&
    a.clon === b.clon
  );
}

/** Regional box around the camera. The proxy clamps again. */
export function aircraftQueryParams(view: MapView): string {
  const latSpan = view.lamax - view.lamin;
  const lonSpan = view.lomax - view.lomin;
  const wide = latSpan > QUERY_LAT_SPAN || lonSpan > QUERY_LON_SPAN || view.lomin > view.lomax;
  const bbox = wide
    ? {
        lamin: view.clat - QUERY_LAT_SPAN / 2,
        lamax: view.clat + QUERY_LAT_SPAN / 2,
        lomin: view.clon - QUERY_LON_SPAN / 2,
        lomax: view.clon + QUERY_LON_SPAN / 2,
      }
    : view;
  const params = new URLSearchParams({
    lamin: bbox.lamin.toFixed(1),
    lomin: bbox.lomin.toFixed(1),
    lamax: bbox.lamax.toFixed(1),
    lomax: bbox.lomax.toFixed(1),
  });
  return params.toString();
}

export function formatSpeedKt(speed: number | null): string {
  if (speed == null || !Number.isFinite(speed)) return '—';
  return `${Math.round(speed)} kt`;
}

export function formatHeading(deg: number | null): string {
  if (deg == null || !Number.isFinite(deg)) return '—';
  const n = ((Math.round(deg) % 360) + 360) % 360;
  return `${n}°`;
}

export function formatUpdated(unixSec: number): string {
  if (!Number.isFinite(unixSec) || unixSec <= 0) return '—';
  const d = new Date(unixSec * 1000);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toISOString().slice(0, 19).replace('T', ' ')}Z`;
}

export function aircraftLines(track: LiveAircraft): string[] {
  return [
    track.callsign ?? 'Callsign —',
    `ICAO ${track.icao.toUpperCase()}`,
    `Speed ${formatSpeedKt(track.speedKt)}`,
    `Heading ${formatHeading(track.heading)}`,
    `Updated ${formatUpdated(track.updatedAt)}`,
  ];
}

export function shipLines(track: LiveShip): string[] {
  return [
    track.name ?? 'Name —',
    `MMSI ${track.mmsi}`,
    `Callsign ${track.callsign ?? '—'}`,
    `Speed ${formatSpeedKt(track.speedKt)}`,
    `Heading ${formatHeading(track.heading)}`,
    `Updated ${formatUpdated(track.updatedAt)}`,
  ];
}

export function aircraftSvg(): string {
  return '<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1.5 L19.2 13.2 L29 17.2 L29 20.2 L19.4 18.2 L18.2 26.5 L16.2 24.6 L14 26.5 L12.8 18.2 L3 20.2 L3 17.2 L12.8 13.2 Z" fill="#7ec8ff" stroke="#041018" stroke-width="1.2"/></svg>';
}

export function shipSvg(): string {
  return '<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.2 L22.5 11.5 L23.4 24.8 L16 29.2 L8.6 24.8 L9.5 11.5 Z" fill="#3dd6a5" stroke="#041610" stroke-width="1.2"/><rect x="14.2" y="13" width="3.6" height="8" rx="0.4" fill="#08382c"/></svg>';
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return '&#39;';
  });
}

export function bboxFromAltitude(lat: number, lng: number, altitude: number): MapView {
  const halfLat = Math.min(35, Math.max(1.5, 4 + altitude * 16));
  const cos = Math.cos((lat * Math.PI) / 180) || 0.2;
  const halfLon = Math.min(50, halfLat / Math.max(0.25, cos));
  return {
    lamin: lat - halfLat,
    lamax: lat + halfLat,
    lomin: lng - halfLon,
    lomax: lng + halfLon,
    clat: lat,
    clon: lng,
  };
}

function intersects(view: MapView, box: typeof BALTIC_COVERAGE): boolean {
  return !(
    view.lamax < box.lamin ||
    view.lamin > box.lamax ||
    view.lomax < box.lomin ||
    view.lomin > box.lomax
  );
}

export function shipsForView(ships: LiveShip[], view: MapView | null): {
  shown: LiveShip[];
  inView: number;
} {
  if (!view || !intersects(view, BALTIC_COVERAGE)) return { shown: [], inView: 0 };
  const south = Math.max(view.lamin, BALTIC_COVERAGE.lamin);
  const north = Math.min(view.lamax, BALTIC_COVERAGE.lamax);
  const west = Math.max(view.lomin, BALTIC_COVERAGE.lomin);
  const east = Math.min(view.lomax, BALTIC_COVERAGE.lomax);
  const inView = ships.filter(
    (ship) => ship.lat >= south && ship.lat <= north && ship.lon >= west && ship.lon <= east,
  );
  if (inView.length <= SHIP_RENDER_CAP) return { shown: inView, inView: inView.length };
  const ranked = [...inView].sort((a, b) => {
    const da = (a.lat - view.clat) ** 2 + (a.lon - view.clon) ** 2;
    const db = (b.lat - view.clat) ** 2 + (b.lon - view.clon) ** 2;
    return da - db;
  });
  return { shown: ranked.slice(0, SHIP_RENDER_CAP), inView: inView.length };
}
