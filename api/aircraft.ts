/**
 * Demo-only aircraft proxy.
 * OpenSky's public API does not send CORS headers for this origin, so the
 * browser calls this function instead. Anonymous OpenSky is sometimes blocked
 * from cloud egress; that path falls back to keyless adsb.lol (ODbL).
 * No credentials are read or sent.
 */

const OPENSKY_URL = 'https://opensky-network.org/api/states/all';
const ADSB_URL = 'https://api.adsb.lol/v2';
const USER_AGENT = 'ThreatTec-OEFlex-demo/1.0';
const MAX_TRACKS = 350;
const MAX_LAT_SPAN = 8;
const MAX_LON_SPAN = 10;
const MIN_SPAN = 0.4;
const OPENSKY_TIMEOUT_MS = 3500;
const ADSB_TIMEOUT_MS = 5000;
const MS_TO_KT = 1.943844;

export type AircraftTrack = {
  icao: string;
  callsign: string | null;
  lat: number;
  lon: number;
  heading: number | null;
  speedKt: number | null;
  updatedAt: number;
};

export type AircraftBbox = {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
};

export type AircraftPayload = {
  source: 'opensky' | 'adsb.lol';
  attribution: string;
  fetchedAt: number;
  bbox: AircraftBbox;
  aircraft: AircraftTrack[];
};

const OPENSKY_ATTRIBUTION = 'The OpenSky Network';
const ADSB_ATTRIBUTION = 'adsb.lol (ODbL)';

function finite(value: string | null): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round(n: number, places: number): number {
  const m = 10 ** places;
  return Math.round(n * m) / m;
}

/** Clamp a bbox into a small regional window so one poll cannot request the planet. */
export function clampBbox(input: AircraftBbox): AircraftBbox {
  let lamin = Math.max(-90, Math.min(90, input.lamin));
  let lamax = Math.max(-90, Math.min(90, input.lamax));
  let lomin = Math.max(-180, Math.min(180, input.lomin));
  let lomax = Math.max(-180, Math.min(180, input.lomax));
  if (lamin > lamax) [lamin, lamax] = [lamax, lamin];
  if (lomin > lomax) [lomin, lomax] = [lomax, lomin];

  const fit = (min: number, max: number, limit: number, floor: number, ceil: number) => {
    let lo = min;
    let hi = max;
    if (hi - lo < MIN_SPAN) {
      const c = (hi + lo) / 2;
      lo = c - MIN_SPAN / 2;
      hi = c + MIN_SPAN / 2;
    }
    if (hi - lo > limit) {
      const c = (hi + lo) / 2;
      lo = c - limit / 2;
      hi = c + limit / 2;
    }
    lo = Math.max(floor, lo);
    hi = Math.min(ceil, hi);
    return [round(lo, 3), round(hi, 3)] as const;
  };

  [lamin, lamax] = fit(lamin, lamax, MAX_LAT_SPAN, -90, 90);
  [lomin, lomax] = fit(lomin, lomax, MAX_LON_SPAN, -180, 180);
  return { lamin, lomin, lamax, lomax };
}

export function bboxFromSearch(params: URLSearchParams): AircraftBbox | null {
  const lamin = finite(params.get('lamin'));
  const lomin = finite(params.get('lomin'));
  const lamax = finite(params.get('lamax'));
  const lomax = finite(params.get('lomax'));
  if (lamin == null || lomin == null || lamax == null || lomax == null) return null;
  return clampBbox({ lamin, lomin, lamax, lomax });
}

function cleanCallsign(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** OpenSky state vectors. Returns null when the payload is not a states document. */
export function trimOpenSky(body: unknown, nowSec = Math.floor(Date.now() / 1000)): AircraftTrack[] | null {
  if (!body || typeof body !== 'object') return null;
  const states = (body as { states?: unknown }).states;
  if (!Array.isArray(states)) return null;
  const docTime = asNumber((body as { time?: unknown }).time);
  const out: AircraftTrack[] = [];
  for (const row of states) {
    if (!Array.isArray(row)) continue;
    const lat = asNumber(row[6]);
    const lon = asNumber(row[5]);
    const icao = typeof row[0] === 'string' ? row[0].trim().toLowerCase() : '';
    if (!icao || lat == null || lon == null) continue;
    const velocity = asNumber(row[9]);
    const updated = asNumber(row[4]) ?? asNumber(row[3]) ?? docTime ?? nowSec;
    out.push({
      icao,
      callsign: cleanCallsign(row[1]),
      lat: round(lat, 4),
      lon: round(lon, 4),
      heading: asNumber(row[10]),
      speedKt: velocity == null ? null : round(velocity * MS_TO_KT, 1),
      updatedAt: Math.round(updated),
    });
    if (out.length >= MAX_TRACKS) break;
  }
  return out;
}

type AdsbRow = {
  hex?: unknown;
  flight?: unknown;
  lat?: unknown;
  lon?: unknown;
  gs?: unknown;
  track?: unknown;
  seen?: unknown;
  seen_pos?: unknown;
};

/** adsb.lol readsb aircraft list. Returns null when `ac` is missing. */
export function trimAdsb(body: unknown, nowMs = Date.now()): AircraftTrack[] | null {
  if (!body || typeof body !== 'object') return null;
  const ac = (body as { ac?: unknown }).ac;
  if (!Array.isArray(ac)) return null;
  const now = asNumber((body as { now?: unknown }).now) ?? nowMs;
  const ranked = ac
    .map((row) => {
      const item = row as AdsbRow;
      const seen = asNumber(item.seen_pos) ?? asNumber(item.seen) ?? 0;
      return { item, seen };
    })
    .sort((a, b) => a.seen - b.seen);

  const out: AircraftTrack[] = [];
  for (const { item, seen } of ranked) {
    const lat = asNumber(item.lat);
    const lon = asNumber(item.lon);
    const icao = typeof item.hex === 'string' ? item.hex.trim().toLowerCase() : '';
    if (!icao || lat == null || lon == null) continue;
    out.push({
      icao,
      callsign: cleanCallsign(item.flight),
      lat: round(lat, 4),
      lon: round(lon, 4),
      heading: asNumber(item.track),
      speedKt: asNumber(item.gs) == null ? null : round(asNumber(item.gs) as number, 1),
      updatedAt: Math.round(now / 1000 - seen),
    });
    if (out.length >= MAX_TRACKS) break;
  }
  return out;
}

function adsbTarget(bbox: AircraftBbox): { lat: number; lon: number; dist: number } {
  const lat = (bbox.lamin + bbox.lamax) / 2;
  const lon = (bbox.lomin + bbox.lomax) / 2;
  const halfLatNm = ((bbox.lamax - bbox.lamin) * 60) / 2;
  const halfLonNm = ((bbox.lomax - bbox.lomin) * 60 * Math.cos((lat * Math.PI) / 180)) / 2;
  const dist = Math.min(250, Math.max(20, Math.ceil(Math.hypot(halfLatNm, halfLonNm))));
  return { lat: round(lat, 2), lon: round(lon, 2), dist };
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function fetchOpenSky(bbox: AircraftBbox): Promise<AircraftTrack[]> {
  const params = new URLSearchParams({
    lamin: String(bbox.lamin),
    lomin: String(bbox.lomin),
    lamax: String(bbox.lamax),
    lomax: String(bbox.lomax),
  });
  const res = await fetch(`${OPENSKY_URL}?${params}`, {
    signal: AbortSignal.timeout(OPENSKY_TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (res.status === 401 || res.status === 403 || res.status === 429 || !res.ok) {
    throw new Error(`opensky ${res.status}`);
  }
  const tracks = trimOpenSky(await readJson(res));
  if (!tracks) throw new Error('opensky shape');
  return tracks;
}

async function fetchAdsb(bbox: AircraftBbox): Promise<AircraftTrack[]> {
  const { lat, lon, dist } = adsbTarget(bbox);
  const res = await fetch(`${ADSB_URL}/lat/${lat}/lon/${lon}/dist/${dist}`, {
    signal: AbortSignal.timeout(ADSB_TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`adsb.lol ${res.status}`);
  const tracks = trimAdsb(await readJson(res));
  if (!tracks) throw new Error('adsb.lol shape');
  return tracks;
}

export async function queryAircraft(bbox: AircraftBbox): Promise<AircraftPayload> {
  const clamped = clampBbox(bbox);
  const fetchedAt = Math.floor(Date.now() / 1000);
  try {
    const aircraft = await fetchOpenSky(clamped);
    return {
      source: 'opensky',
      attribution: OPENSKY_ATTRIBUTION,
      fetchedAt,
      bbox: clamped,
      aircraft,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'opensky failed';
    console.error(`aircraft proxy fallback (${reason})`);
    const aircraft = await fetchAdsb(clamped);
    return {
      source: 'adsb.lol',
      attribution: ADSB_ATTRIBUTION,
      fetchedAt,
      bbox: clamped,
      aircraft,
    };
  }
}

function json(body: unknown, status: number, cache: boolean): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache
        ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=30'
        : 'no-store',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const bbox = bboxFromSearch(params);
  if (!bbox) {
    return json({ error: 'bbox required', aircraft: [] }, 400, false);
  }
  try {
    return json(await queryAircraft(bbox), 200, true);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unavailable';
    console.error(`aircraft proxy offline (${reason})`);
    return json(
      { offline: true, aircraft: [], error: 'aircraft feed unavailable' },
      503,
      false,
    );
  }
}
