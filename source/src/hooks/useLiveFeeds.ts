import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DIGITRAFFIC_LOCATIONS,
  DIGITRAFFIC_USER,
  DIGITRAFFIC_VESSELS,
  LIVE_POLL_MS,
  VESSEL_REFRESH_MS,
  aircraftQueryParams,
  shipsForView,
  type AircraftFeed,
  type AircraftSource,
  type LiveAircraft,
  type LiveShip,
  type MapView,
} from '../data/liveFeeds';

export type LiveFeedStatus = 'off' | 'loading' | 'live' | 'offline';

type VesselMeta = { name: string; callSign: string };

const digitrafficHeaders = {
  Accept: 'application/json',
  'Digitraffic-User': DIGITRAFFIC_USER,
};

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function shipHeading(heading: unknown, cog: unknown): number | null {
  if (typeof heading === 'number' && heading >= 0 && heading <= 359) return heading;
  if (typeof cog === 'number' && cog >= 0 && cog < 360) return cog;
  return null;
}

function shipSpeed(sog: unknown): number | null {
  if (typeof sog !== 'number' || !Number.isFinite(sog) || sog >= 102) return null;
  return sog;
}

function parseAircraft(body: unknown): AircraftFeed | null {
  if (!body || typeof body !== 'object') return null;
  const source = (body as { source?: unknown }).source;
  if (source !== 'opensky' && source !== 'adsb.lol') return null;
  const aircraft = (body as { aircraft?: unknown }).aircraft;
  if (!Array.isArray(aircraft)) return null;
  const tracks: LiveAircraft[] = [];
  for (const row of aircraft) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Partial<LiveAircraft>;
    if (typeof item.icao !== 'string' || typeof item.lat !== 'number' || typeof item.lon !== 'number') {
      continue;
    }
    tracks.push({
      icao: item.icao,
      callsign: typeof item.callsign === 'string' ? item.callsign : null,
      lat: item.lat,
      lon: item.lon,
      heading: typeof item.heading === 'number' ? item.heading : null,
      speedKt: typeof item.speedKt === 'number' ? item.speedKt : null,
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : 0,
    });
  }
  const attribution = (body as { attribution?: unknown }).attribution;
  const fetchedAt = (body as { fetchedAt?: unknown }).fetchedAt;
  return {
    source,
    attribution: typeof attribution === 'string' ? attribution : source,
    fetchedAt: typeof fetchedAt === 'number' ? fetchedAt : Math.floor(Date.now() / 1000),
    aircraft: tracks,
  };
}

function parseShips(body: unknown, vessels: Map<number, VesselMeta>): LiveShip[] {
  if (!body || typeof body !== 'object') return [];
  const features = (body as { features?: unknown }).features;
  if (!Array.isArray(features)) return [];
  const ships: LiveShip[] = [];
  for (const feature of features) {
    if (!feature || typeof feature !== 'object') continue;
    const row = feature as {
      mmsi?: unknown;
      geometry?: { coordinates?: unknown };
      properties?: {
        mmsi?: unknown;
        sog?: unknown;
        cog?: unknown;
        heading?: unknown;
        timestampExternal?: unknown;
      };
    };
    const coords = row.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const lon = coords[0];
    const lat = coords[1];
    const mmsi = typeof row.mmsi === 'number' ? row.mmsi : row.properties?.mmsi;
    if (typeof mmsi !== 'number' || typeof lat !== 'number' || typeof lon !== 'number') continue;
    const meta = vessels.get(mmsi);
    const updatedMs = row.properties?.timestampExternal;
    ships.push({
      mmsi,
      name: meta?.name ? meta.name : null,
      callsign: meta?.callSign ? meta.callSign : null,
      lat,
      lon,
      heading: shipHeading(row.properties?.heading, row.properties?.cog),
      speedKt: shipSpeed(row.properties?.sog),
      updatedAt: typeof updatedMs === 'number' ? Math.round(updatedMs / 1000) : 0,
    });
  }
  return ships;
}

export function useLiveFeeds(opts: {
  aircraftOn: boolean;
  shipsOn: boolean;
  killSwitch: boolean;
  view: MapView | null;
}) {
  const { aircraftOn, shipsOn, killSwitch, view } = opts;
  const aircraftEnabled = aircraftOn && !killSwitch;
  const shipsEnabled = shipsOn && !killSwitch;
  const [aircraft, setAircraft] = useState<LiveAircraft[]>([]);
  const [aircraftSource, setAircraftSource] = useState<AircraftSource | null>(null);
  const [aircraftAttribution, setAircraftAttribution] = useState<string | null>(null);
  const [aircraftStatus, setAircraftStatus] = useState<LiveFeedStatus>('off');
  const [allShips, setAllShips] = useState<LiveShip[]>([]);
  const [shipsStatus, setShipsStatus] = useState<LiveFeedStatus>('off');
  const vesselsRef = useRef<Map<number, VesselMeta>>(new Map());
  const vesselsAtRef = useRef(0);
  const aircraftReq = useRef(0);
  const shipReq = useRef(0);

  const viewKey = view
    ? `${view.lamin},${view.lomin},${view.lamax},${view.lomax},${view.clat},${view.clon}`
    : '';

  useEffect(() => {
    if (!aircraftEnabled || !view) return;
    const seq = ++aircraftReq.current;
    const query = aircraftQueryParams(view);
    let cancelled = false;

    const load = async () => {
      setAircraftStatus((prev) => (prev === 'live' ? prev : 'loading'));
      try {
        const res = await fetch(`/api/aircraft?${query}`);
        if (!res.ok) throw new Error(String(res.status));
        const feed = parseAircraft(await res.json());
        if (!feed) throw new Error('shape');
        if (cancelled || seq !== aircraftReq.current) return;
        setAircraft(feed.aircraft);
        setAircraftSource(feed.source);
        setAircraftAttribution(feed.attribution);
        setAircraftStatus('live');
      } catch {
        if (cancelled || seq !== aircraftReq.current) return;
        setAircraftStatus('offline');
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), LIVE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [aircraftEnabled, view, viewKey]);

  useEffect(() => {
    if (!shipsEnabled) return;
    const seq = ++shipReq.current;
    let cancelled = false;

    const loadVessels = async () => {
      if (
        vesselsRef.current.size > 0 &&
        Date.now() - vesselsAtRef.current < VESSEL_REFRESH_MS
      ) {
        return;
      }
      const res = await fetch(DIGITRAFFIC_VESSELS, { headers: digitrafficHeaders });
      if (!res.ok) return;
      const data: unknown = await res.json();
      if (!Array.isArray(data)) return;
      const next = new Map<number, VesselMeta>();
      for (const row of data) {
        if (!row || typeof row !== 'object') continue;
        const item = row as { mmsi?: unknown; name?: unknown; callSign?: unknown };
        if (typeof item.mmsi !== 'number') continue;
        next.set(item.mmsi, {
          name: typeof item.name === 'string' ? item.name.trim() : '',
          callSign: typeof item.callSign === 'string' ? item.callSign.trim() : '',
        });
      }
      vesselsRef.current = next;
      vesselsAtRef.current = Date.now();
    };

    const load = async () => {
      setShipsStatus((prev) => (prev === 'live' ? prev : 'loading'));
      try {
        const [locations] = await Promise.all([
          fetch(DIGITRAFFIC_LOCATIONS, { headers: digitrafficHeaders }),
          loadVessels().catch((error: unknown) => {
            if (isAbort(error)) throw error;
          }),
        ]);
        if (!locations.ok) throw new Error(String(locations.status));
        const ships = parseShips(await locations.json(), vesselsRef.current);
        if (cancelled || seq !== shipReq.current) return;
        setAllShips(ships);
        setShipsStatus('live');
      } catch {
        if (cancelled || seq !== shipReq.current) return;
        setShipsStatus('offline');
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), LIVE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [shipsEnabled]);

  const shipWindow = useMemo(() => shipsForView(allShips, view), [allShips, view]);
  const aircraftStatusShown: LiveFeedStatus =
    !aircraftOn || killSwitch ? 'off' : aircraftStatus === 'off' ? 'loading' : aircraftStatus;
  const shipsStatusShown: LiveFeedStatus =
    !shipsOn || killSwitch ? 'off' : shipsStatus === 'off' ? 'loading' : shipsStatus;

  return {
    aircraft: aircraftEnabled ? aircraft : [],
    aircraftStatus: aircraftStatusShown,
    aircraftSource,
    aircraftAttribution,
    ships: shipsEnabled ? shipWindow.shown : [],
    shipsInView: shipsEnabled ? shipWindow.inView : 0,
    shipsStatus: shipsStatusShown,
  };
}

export type LiveFeedsState = ReturnType<typeof useLiveFeeds>;
