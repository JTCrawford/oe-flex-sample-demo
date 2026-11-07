import { forward, inverse } from 'mgrs';
import type { AO } from '../types';

/** Example graphics are fuchsia. Simulated or hypothetical graphics are orange. */
export const FUCHSIA = '#FF2BD6';
export const SIMULATED = '#FF8C1A';

export interface LngLatLine {
  id: string;
  label: string;
  kind: 'boundary' | 'phase-line' | 'objective' | 'axis' | 'ring' | 'mgrs';
  positions: Array<[number, number]>;
  closed?: boolean;
  arrow?: boolean;
}

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

function offset(lat: number, lng: number, northKm: number, eastKm: number): [number, number] {
  const dLat = northKm / 111.32;
  const cos = Math.cos((lat * Math.PI) / 180) || 0.2;
  const dLng = eastKm / (111.32 * cos);
  return [lng + dLng, lat + dLat];
}

function circle(lat: number, lng: number, radiusKm: number, steps = 48): Array<[number, number]> {
  const positions: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * Math.PI * 2;
    positions.push(
      offset(lat, lng, Math.cos(bearing) * radiusKm, Math.sin(bearing) * radiusKm),
    );
  }
  return positions;
}

/**
 * Fictional tactical graphics around the selected area.
 * They are training geometry, not a real boundary or scheme of maneuver.
 */
export function controlMeasuresForAo(ao: AO): LngLatLine[] {
  const span = ao.type === 'maritime' ? 42 : 28;
  const nw = offset(ao.lat, ao.lng, span * 0.55, -span * 0.7);
  const ne = offset(ao.lat, ao.lng, span * 0.55, span * 0.7);
  const se = offset(ao.lat, ao.lng, -span * 0.5, span * 0.62);
  const sw = offset(ao.lat, ao.lng, -span * 0.5, -span * 0.62);
  const phaseWest = offset(ao.lat, ao.lng, -span * 0.12, -span * 0.85);
  const phaseEast = offset(ao.lat, ao.lng, -span * 0.12, span * 0.85);
  const tick = span * 0.08;
  const phaseTicks: LngLatLine[] = [-0.55, 0, 0.55].map((t, index) => {
    const mid = offset(ao.lat, ao.lng, -span * 0.12, span * t);
    const up = offset(ao.lat, ao.lng, -span * 0.12 + tick, span * t);
    return {
      id: `${ao.id}-pl-tick-${index}`,
      label: '',
      kind: 'phase-line',
      positions: [mid, up],
    };
  });
  const obj = offset(ao.lat, ao.lng, span * 0.28, span * 0.22);
  const axisStart = offset(ao.lat, ao.lng, -span * 0.42, -span * 0.35);
  const axisMid = offset(ao.lat, ao.lng, -span * 0.05, -span * 0.02);
  const axisEnd = offset(ao.lat, ao.lng, span * 0.22, span * 0.16);
  return [
    {
      id: `${ao.id}-bnd`,
      label: 'BND SAMPLE',
      kind: 'boundary',
      positions: [nw, ne, se, sw, nw],
      closed: true,
    },
    {
      id: `${ao.id}-pl`,
      label: 'PL SAMPLE',
      kind: 'phase-line',
      positions: [phaseWest, phaseEast],
    },
    ...phaseTicks,
    {
      id: `${ao.id}-obj`,
      label: 'OBJ SAMPLE',
      kind: 'objective',
      positions: circle(obj[1], obj[0], ao.type === 'maritime' ? 14 : 8),
      closed: true,
    },
    {
      id: `${ao.id}-axis`,
      label: 'AXIS SAMPLE',
      kind: 'axis',
      positions: [axisStart, axisMid, axisEnd],
      arrow: true,
    },
  ];
}

export function sampleMarkersForAo(ao: AO): MapPin[] {
  const pins: Array<[string, number, number]> = [
    ['SAMPLE reference pin', 0.35, -0.45],
    ['SAMPLE example node', -0.22, 0.4],
    ['SAMPLE training mark', 0.18, 0.55],
  ];
  const scale = ao.type === 'maritime' ? 0.55 : 0.28;
  return pins.map(([label, north, east], index) => {
    const [lng, lat] = offset(ao.lat, ao.lng, north * scale * 80, east * scale * 80);
    return { id: `${ao.id}-sample-${index}`, lat, lng, label };
  });
}

/** Hypothetical fires ring so the overlay is visible before a unit is selected. */
export function sampleFiresRing(ao: AO): { lat: number; lng: number; radiusKm: number; label: string } {
  const [lng, lat] = offset(ao.lat, ao.lng, ao.type === 'maritime' ? 18 : 10, ao.type === 'maritime' ? 16 : 9);
  return {
    lat,
    lng,
    radiusKm: ao.type === 'maritime' ? 22 : 12,
    label: 'SAMPLE fires — hypothetical',
  };
}

export function circlePositions(lat: number, lng: number, radiusKm: number): Array<[number, number]> {
  return circle(lat, lng, radiusKm, radiusKm > 80 ? 96 : 64);
}

const BANDS = 'CDEFGHJKLMNPQRSTUVWX';

function bandLetter(lat: number): string {
  if (lat < -80 || lat >= 84) return '';
  const index = Math.min(BANDS.length - 1, Math.max(0, Math.floor((lat + 80) / 8)));
  return BANDS[index] ?? '';
}

function zoneNumber(lng: number): number {
  const zone = Math.floor((lng + 180) / 6) + 1;
  return Math.min(60, Math.max(1, zone));
}

export interface MgrsCell {
  id: string;
  label: string;
  west: number;
  south: number;
  east: number;
  north: number;
}

function crossesDateline(west: number, east: number): boolean {
  return east < west;
}

function sampleCells(
  west: number,
  south: number,
  east: number,
  north: number,
  step: number,
  accuracy: number,
  limit: number,
): MgrsCell[] {
  const cells: MgrsCell[] = [];
  const seen = new Set<string>();
  const southClamp = Math.max(-79.5, south);
  const northClamp = Math.min(83.5, north);
  for (let lat = southClamp; lat <= northClamp + step * 0.5; lat += step) {
    for (let lng = west; lng <= east + step * 0.5; lng += step) {
      const wrapped = lng > 180 ? lng - 360 : lng < -180 ? lng + 360 : lng;
      let code = '';
      try {
        code = forward([wrapped, lat], accuracy);
      } catch {
        continue;
      }
      if (seen.has(code)) continue;
      seen.add(code);
      if (seen.size > limit) return cells;
      try {
        const [w, s, e, n] = inverse(code);
        cells.push({
          id: code,
          label: accuracy === 0 ? code : code,
          west: w,
          south: s,
          east: e,
          north: n,
        });
      } catch {
        continue;
      }
    }
  }
  return cells;
}

/**
 * MGRS grid for the current view.
 * World view draws grid-zone lines. Closer views draw 100 km, 10 km, or 1 km squares
 * from the proj4js MGRS library (MIT).
 */
export function mgrsCellsForView(
  west: number,
  south: number,
  east: number,
  north: number,
  cameraHeight: number,
): MgrsCell[] {
  const span = Math.max(Math.abs(east - west), Math.abs(north - south));
  const ranges: Array<[number, number]> = crossesDateline(west, east)
    ? [
        [west, 180],
        [-180, east],
      ]
    : [[west, east]];

  if (cameraHeight > 2_400_000 || span > 28) {
    const cells: MgrsCell[] = [];
    const westBound = Math.max(-180, Math.min(west, east) - 6);
    const eastBound = Math.min(180, Math.max(west, east) + 6);
    for (let lng = Math.floor(westBound / 6) * 6; lng < eastBound; lng += 6) {
      for (let lat = Math.max(-80, Math.floor(south / 8) * 8); lat < Math.min(84, north + 8); lat += 8) {
        const zone = zoneNumber(lng + 3);
        const band = bandLetter(lat + 4);
        if (!band) continue;
        cells.push({
          id: `${zone}${band}-${lng}-${lat}`,
          label: `${zone}${band}`,
          west: lng,
          south: lat,
          east: Math.min(180, lng + 6),
          north: Math.min(84, lat + 8),
        });
      }
    }
    return cells.slice(0, 80);
  }

  const accuracy = cameraHeight > 350_000 || span > 4 ? 0 : cameraHeight > 70_000 || span > 0.8 ? 1 : 2;
  const step = accuracy === 0 ? 0.85 : accuracy === 1 ? 0.09 : 0.012;
  const cells: MgrsCell[] = [];
  for (const [rangeWest, rangeEast] of ranges) {
    cells.push(...sampleCells(rangeWest, south, rangeEast, north, step, accuracy, 70));
    if (cells.length >= 70) break;
  }
  return cells.slice(0, 70);
}

export function solarAltitudeDeg(lat: number, lng: number, when = new Date()): number {
  const rad = Math.PI / 180;
  const start = Date.UTC(when.getUTCFullYear(), 0, 0);
  const day = (when.getTime() - start) / 86_400_000;
  const hour = when.getUTCHours() + when.getUTCMinutes() / 60 + when.getUTCSeconds() / 3600;
  const gamma = ((2 * Math.PI) / 365) * (day - 1 + (hour - 12) / 24);
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const timeOffset = eqtime + 4 * lng;
  const tst = hour * 60 + timeOffset;
  const ha = tst / 4 - 180;
  const latR = lat * rad;
  const sinAlt =
    Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(ha * rad);
  return (Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180) / Math.PI;
}

export function illuminationLabel(altitude: number): string {
  if (altitude > 6) return 'Daylight';
  if (altitude > -0.8) return 'Horizon';
  if (altitude > -6) return 'Civil twilight';
  if (altitude > -12) return 'Nautical twilight';
  return 'Night';
}
