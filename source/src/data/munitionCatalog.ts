import type {
  MunitionFamily,
  MunitionProfile,
  StrikeAttackType,
  StrikeRangeRing,
  UnitOrbat,
} from '../types';
import { holdingsInCatalogOrder } from './orbat';

/**
 * Unclassified SAMPLE munition catalog.
 * Ids are stable join keys for ORBAT holdings and for a later 3D engagement sphere.
 * Every record is an open-source analog — not a real formation or national attribution.
 *
 * Range-ring UX (one rule for every profile):
 * - Draw two dashed rings from the selected unit (or from a strike origin when inference
 *   resolves to a catalog id), reusing the strike-envelope palette.
 * - Outer ring = rangeMaxKm. Inner ring = rangeMinKm.
 * - `span` profiles (Tochka-U, ATACMS): inner is minimum range, outer is maximum range.
 * - `cited-bounds` (Iskander-M only): open-source figures disagree. Export variants are
 *   often cited near 280 km; domestic figures are often cited near 400–500 km.
 *   The demo draws 280 km (believed export) and 500 km (upper domestic cite).
 *   It does not add a third ring at 400 km.
 */

export const MUNITION_FAMILY_LABEL: Record<MunitionFamily, string> = {
  srbm: 'Short-range ballistic',
  'tactical-ballistic': 'Tactical ballistic',
};

/** Same palette as strike-inference envelopes: one color per linked profile. */
export const ENVELOPE_RING_STYLES: {
  color: string;
  dashArray: string;
  weight: number;
  strokeDegrees: number;
}[] = [
  { color: '#f5d76e', dashArray: '12 8', weight: 3, strokeDegrees: 0.09 },
  { color: '#6ec6ff', dashArray: '6 7', weight: 2, strokeDegrees: 0.055 },
  { color: '#d7b0ff', dashArray: '2 6', weight: 2, strokeDegrees: 0.04 },
];

const INNER_DASH = '2 5';

export const MUNITION_CATALOG: MunitionProfile[] = [
  {
    id: 'tochka-u',
    designation: 'Tochka-U (SS-21 Scarab)',
    shortName: 'Tochka-U',
    family: 'srbm',
    role: 'Theater SRBM / tactical ballistic',
    rangeMinKm: 70,
    rangeMaxKm: 120,
    ringMode: 'span',
    notes:
      'UNCLASS open-source SAMPLE analog — not a real formation or national attribution. Cited envelope about 70–120 km. Inner ring is the 70 km minimum; outer ring is the 120 km maximum.',
    sampleLabel: 'SAMPLE',
    classification: 'UNCLASS',
    engagementSphereModelId: 'sphere-tochka-u',
    matchKeywords: ['tochka', 'scarab', 'ss-21', 'ss21'],
    inferenceBlurb: 'Tochka-U class theater SRBM.',
  },
  {
    id: 'iskander-m',
    designation: 'Iskander-M (SS-26 Stone)',
    shortName: 'Iskander-M',
    family: 'srbm',
    role: 'Theater SRBM / tactical ballistic',
    rangeMinKm: 280,
    rangeMaxKm: 500,
    ringMode: 'cited-bounds',
    notes:
      'UNCLASS open-source SAMPLE analog — not a real formation or national attribution. Export variants are often cited near 280 km; domestic figures are often cited near 400–500 km. Rings are those cited bounds: 280 km (believed export) and 500 km (upper domestic cite). No separate 400 km ring.',
    sampleLabel: 'SAMPLE',
    classification: 'UNCLASS',
    engagementSphereModelId: 'sphere-iskander-m',
    matchKeywords: ['iskander', 'ss-26', 'ss26'],
    inferenceBlurb:
      'Iskander-M class theater SRBM; export and domestic range cites differ.',
  },
  {
    id: 'atacms-block-i',
    designation: 'ATACMS (MGM-140) Block I',
    shortName: 'ATACMS Block I',
    family: 'tactical-ballistic',
    role: 'US tactical ballistic',
    rangeMinKm: 25,
    rangeMaxKm: 165,
    ringMode: 'span',
    notes:
      'UNCLASS open-source SAMPLE analog — not a real formation or national attribution. Block I is often cited near 25–165 km. Inner ring is the 25 km minimum; outer ring is the 165 km maximum.',
    sampleLabel: 'SAMPLE',
    classification: 'UNCLASS',
    engagementSphereModelId: 'sphere-atacms-block-i',
    matchKeywords: ['atacms', 'mgm-140', 'mgm140', 'block i'],
    inferenceBlurb: 'ATACMS Block I tactical ballistic.',
  },
  {
    id: 'atacms-later-block',
    designation: 'ATACMS later block',
    shortName: 'ATACMS later block',
    family: 'tactical-ballistic',
    role: 'US tactical ballistic',
    rangeMinKm: 70,
    rangeMaxKm: 300,
    ringMode: 'span',
    notes:
      'UNCLASS open-source SAMPLE analog — not a real formation or national attribution. Later ATACMS blocks are often cited near 70–300 km. Inner ring is the 70 km minimum; outer ring is the 300 km maximum. Block I stays a separate catalog record.',
    sampleLabel: 'SAMPLE',
    classification: 'UNCLASS',
    engagementSphereModelId: 'sphere-atacms-later-block',
    matchKeywords: ['atacms later', 'later block', 'block ia'],
    inferenceBlurb: 'Later-block ATACMS tactical ballistic.',
  },
];

const BY_ID = new Map(MUNITION_CATALOG.map((profile) => [profile.id, profile]));

export function munitionProfileById(id: string): MunitionProfile | undefined {
  return BY_ID.get(id);
}

export function ringStyleForIndex(index: number) {
  return ENVELOPE_RING_STYLES[index] ?? ENVELOPE_RING_STYLES[ENVELOPE_RING_STYLES.length - 1]!;
}

/** Unit-level ids first, then any holding ids not already listed. Unknown ids are skipped. */
export function profilesForOrbat(orbat: UnitOrbat): MunitionProfile[] {
  const ids: string[] = [];
  const push = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
  };
  for (const id of orbat.linkedMunitionIds ?? []) push(id);
  for (const row of holdingsInCatalogOrder(orbat.vehicles)) {
    for (const id of row.linkedMunitionIds ?? []) push(id);
  }
  const profiles: MunitionProfile[] = [];
  for (const id of ids) {
    const profile = BY_ID.get(id);
    if (profile) profiles.push(profile);
  }
  return profiles;
}

export function formatRangeSpan(profile: MunitionProfile): string {
  return `${profile.rangeMinKm}–${profile.rangeMaxKm} km`;
}

function ringLabels(profile: MunitionProfile): { inner: string; outer: string } {
  if (profile.ringMode === 'cited-bounds') {
    return {
      inner: `${profile.shortName} believed export ${profile.rangeMinKm} km`,
      outer: `${profile.shortName} upper domestic cite ${profile.rangeMaxKm} km`,
    };
  }
  return {
    inner: `${profile.shortName} minimum ${profile.rangeMinKm} km`,
    outer: `${profile.shortName} maximum ${profile.rangeMaxKm} km`,
  };
}

/** Inner + outer envelope rings for one catalog profile, in the shared strike-ring style. */
export function rangeRingsForProfile(
  profile: MunitionProfile,
  lat: number,
  lng: number,
  idPrefix: string,
  styleIndex: number,
): StrikeRangeRing[] {
  const style = ringStyleForIndex(styleIndex);
  const labels = ringLabels(profile);
  const rings: StrikeRangeRing[] = [
    {
      id: `${idPrefix}-${profile.id}-max`,
      kind: 'envelope',
      band: 'max',
      lat,
      lng,
      radiusKm: profile.rangeMaxKm,
      color: style.color,
      dashArray: style.dashArray,
      weight: style.weight,
      strokeDegrees: style.strokeDegrees,
      fillOpacity: 0.05,
      label: labels.outer,
    },
  ];
  if (profile.rangeMinKm > 0 && profile.rangeMinKm < profile.rangeMaxKm) {
    rings.push({
      id: `${idPrefix}-${profile.id}-min`,
      kind: 'envelope',
      band: 'min',
      lat,
      lng,
      radiusKm: profile.rangeMinKm,
      color: style.color,
      dashArray: INNER_DASH,
      weight: Math.max(1, style.weight - 1),
      strokeDegrees: Math.round(style.strokeDegrees * 0.65 * 1000) / 1000,
      fillOpacity: 0,
      label: labels.inner,
    });
  }
  return rings;
}

export function rangeRingsForProfiles(
  profiles: MunitionProfile[],
  lat: number,
  lng: number,
  idPrefix: string,
): StrikeRangeRing[] {
  const rings = profiles.flatMap((profile, index) =>
    rangeRingsForProfile(profile, lat, lng, idPrefix, index),
  );
  rings.sort((a, b) => b.radiusKm - a.radiusKm);
  return rings;
}

/** Inference-shaped rows so a strike can resolve onto a catalog id without a second card UI. */
export function catalogInferenceProfiles(): {
  id: string;
  name: string;
  family: StrikeAttackType;
  minKm: number;
  maxKm: number;
  keywords: string[];
  blurb: string;
}[] {
  return MUNITION_CATALOG.map((profile) => ({
    id: profile.id,
    name: `${profile.designation} — SAMPLE analog`,
    family: 'missile',
    minKm: profile.rangeMinKm,
    maxKm: profile.rangeMaxKm,
    keywords: profile.matchKeywords,
    blurb: profile.inferenceBlurb,
  }));
}
