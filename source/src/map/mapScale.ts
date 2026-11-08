/**
 * Screen scale for the SAMPLE map.
 * Representative fractions assume 96 CSS pixels per inch, the usual browser
 * reference pixel, not a measured display DPI. 1 inch = 96 px = 0.0254 m,
 * so meters on screen per pixel = 0.0254 / 96.
 */

export const SCREEN_DPI = 96;
export const METERS_PER_INCH = 0.0254;

/** Equatorial Web Mercator meters per pixel at zoom 0 (256 px tiles). */
export const EQUATOR_MPP_Z0 = 156543.03392804097;

export const MAP_SCALE_PRESETS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000] as const;

export type MapScalePreset = (typeof MAP_SCALE_PRESETS)[number];

export type MgrsAccuracy = 0 | 1 | 2;

/** Same rough boxes as the USGS layers in layerCatalog.ts. */
const US_COVERAGE: Array<[number, number, number, number]> = [
  [-125.5, 24.0, -66.0, 49.6],
  [-170.0, 51.0, -129.0, 71.5],
  [-160.6, 18.6, -154.5, 22.5],
  [-67.6, 17.6, -65.1, 18.6],
];

export function metersPerPixelForRf(rf: number, dpi = SCREEN_DPI): number {
  return (rf * METERS_PER_INCH) / dpi;
}

export function rfFromMetersPerPixel(mpp: number, dpi = SCREEN_DPI): number {
  if (!Number.isFinite(mpp) || mpp <= 0) return Number.POSITIVE_INFINITY;
  return (mpp * dpi) / METERS_PER_INCH;
}

/** Three significant figures, so 47,400 stays readable as 1:47,400. */
export function formatRf(rf: number): string {
  if (!Number.isFinite(rf) || rf <= 0) return '1:—';
  const digits = Math.max(0, Math.floor(Math.log10(rf)) - 2);
  const factor = 10 ** digits;
  const rounded = Math.max(factor, Math.round(rf / factor) * factor);
  return `1:${rounded.toLocaleString('en-US')}`;
}

export function formatScaleLabel(rf: number): string {
  return `1:${rf.toLocaleString('en-US')}`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    const text = Number.isInteger(km) ? String(km) : km.toFixed(1);
    return `${text} km`;
  }
  return `${Math.round(meters)} m`;
}

const SCALE_STEPS = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000,
  200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
];

/** A round ground length that lands near `targetPx` on screen. */
export function niceScaleLength(
  mpp: number,
  targetPx = 100,
  minPx = 64,
  maxPx = 150,
): { meters: number; px: number } {
  if (!Number.isFinite(mpp) || mpp <= 0) return { meters: 1, px: targetPx };
  let choice = SCALE_STEPS[0];
  let best = Infinity;
  for (const meters of SCALE_STEPS) {
    const px = meters / mpp;
    if (px < minPx || px > maxPx) continue;
    const delta = Math.abs(px - targetPx);
    if (delta < best) {
      best = delta;
      choice = meters;
    }
  }
  if (!Number.isFinite(best)) {
    choice = SCALE_STEPS.reduce((current, meters) =>
      Math.abs(meters / mpp - targetPx) < Math.abs(current / mpp - targetPx) ? meters : current,
    );
  }
  return { meters: choice, px: choice / mpp };
}

export function presetMatches(rf: number, preset: number, tolerance = 0.08): boolean {
  if (!Number.isFinite(rf) || preset <= 0) return false;
  const ratio = rf / preset;
  return ratio >= 1 - tolerance && ratio <= 1 + tolerance;
}

export function inUsCoverage(lat: number, lng: number): boolean {
  return US_COVERAGE.some(([west, south, east, north]) => lng >= west && lng <= east && lat >= south && lat <= north);
}

/**
 * Finest free zoom already documented for this layer.
 * Satellite outside the US is EOX Sentinel-2 cloudless (z13). Inside the US,
 * USGS Imagery Only / NAIP is z16. Terrain and Military Map are OpenTopoMap
 * z15, or USGS topo z16 inside those same boxes.
 */
export function nativeZoom(
  layer: 'satellite' | 'terrain' | 'photoreal' | 'military',
  lat: number,
  lng: number,
): number {
  const us = inUsCoverage(lat, lng);
  if (layer === 'terrain' || layer === 'military') return us ? 16 : 15;
  return us ? 16 : 13;
}

export function nativeMetersPerPixel(zoom: number, latDeg: number): number {
  const cos = Math.cos((latDeg * Math.PI) / 180);
  return (EQUATOR_MPP_Z0 * Math.max(0.02, Math.abs(cos))) / 2 ** zoom;
}

/**
 * Standard grid for a picked map scale.
 * 1:25k and 1:50k → 1 km. 1:100k → 10 km with 1 km faint.
 * 1:250k → 10 km. 1:500k and 1:1,000,000 → 100 km.
 * Null means the view is custom and the grid follows the view span.
 */
export function gridForPreset(rf: number | null): { major: MgrsAccuracy; minor: MgrsAccuracy | null } | null {
  if (rf === 25_000 || rf === 50_000) return { major: 2, minor: null };
  if (rf === 100_000) return { major: 1, minor: 2 };
  if (rf === 250_000) return { major: 1, minor: null };
  if (rf === 500_000 || rf === 1_000_000) return { major: 0, minor: null };
  return null;
}

export function offsetLatLng(
  lat: number,
  lng: number,
  northMeters: number,
  eastMeters: number,
): { lat: number; lng: number } {
  const dLat = northMeters / 111_320;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = eastMeters / (111_320 * Math.max(0.2, Math.abs(cos)));
  return { lat: lat + dLat, lng: lng + dLng };
}
