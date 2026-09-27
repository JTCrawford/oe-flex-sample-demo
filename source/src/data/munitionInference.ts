import type {
  MunitionCandidate,
  StrikeAttackType,
  StrikeEvent,
  StrikeMunitionAssessment,
  StrikeRangeRing,
} from '../types';
import {
  catalogInferenceProfiles,
  munitionProfileById,
  rangeRingsForProfile,
  ringStyleForIndex,
} from './munitionCatalog';

/**
 * Unclassified SAMPLE munition inference.
 * Scores fictional class envelopes against the strike's slant range,
 * trajectory, and nearby SAMPLE strikes. Not a weapons identification.
 */

const NEAR_KM = 45;

interface Profile {
  id: string;
  name: string;
  family: StrikeAttackType;
  minKm: number;
  maxKm: number;
  keywords: string[];
  blurb: string;
}

const PROFILES: Profile[] = [
  {
    id: 'fpv',
    name: 'FPV one-way quad (SAMPLE)',
    family: 'drone',
    minKm: 1,
    maxKm: 18,
    keywords: ['fpv', 'quad'],
    blurb: 'Short-hop electric FPV profile.',
  },
  {
    id: 'lancet',
    name: 'Lancet-class loitering munition (SAMPLE)',
    family: 'drone',
    minKm: 8,
    maxKm: 45,
    keywords: ['lancet', 'loiter'],
    blurb: 'Loitering munition with a tactical standoff band.',
  },
  {
    id: 'owa',
    name: 'Shahed-class one-way UAS (SAMPLE)',
    family: 'drone',
    minKm: 40,
    maxKm: 280,
    keywords: ['shahed', 'owa', 'one-way'],
    blurb: 'Long-range one-way UAS cruise into rear nodes.',
  },
  {
    id: 'tube-122',
    name: '122mm tube artillery (SAMPLE)',
    family: 'artillery',
    minKm: 3,
    maxKm: 21,
    keywords: ['122', 'd-30', 'howitzer'],
    blurb: 'Short tube-artillery fan.',
  },
  {
    id: 'tube-152',
    name: '152mm howitzer (SAMPLE)',
    family: 'artillery',
    minKm: 5,
    maxKm: 30,
    keywords: ['152', 'trench'],
    blurb: 'Medium tube / RAP edge, usually a trench-line fires fan.',
  },
  {
    id: 'mlrs-122',
    name: '122mm MLRS / BM-21 class (SAMPLE)',
    family: 'artillery',
    minKm: 8,
    maxKm: 40,
    keywords: ['bm-21', 'grad', 'fire mission'],
    blurb: 'Unguided rocket fan, wider than tube artillery.',
  },
  {
    id: 'gmlrs',
    name: 'Guided MLRS / Tornado-class (SAMPLE)',
    family: 'artillery',
    minKm: 25,
    maxKm: 90,
    keywords: ['mlrs', 'guided', 'tornado'],
    blurb: 'Extended guided-rocket envelope past tube and Grad reach.',
  },
  {
    id: 'cruise',
    name: 'Subsonic cruise missile (SAMPLE)',
    family: 'missile',
    minKm: 50,
    maxKm: 350,
    keywords: ['cruise'],
    blurb: 'Low-altitude cruise over a long origin-to-impact track.',
  },
  {
    id: 'srbm',
    name: 'Short-range ballistic (SAMPLE)',
    family: 'missile',
    minKm: 40,
    maxKm: 300,
    keywords: ['ballistic', 'short-range'],
    blurb: 'Lofted ballistic arc rather than a terrain-following cruise.',
  },
  {
    id: 'ied-emplaced',
    name: 'Emplaced IED — pressure / command (SAMPLE)',
    family: 'ied',
    minKm: 0,
    maxKm: 15,
    keywords: ['ied', 'roadside', 'chokepoint'],
    blurb: 'Emplaced device; the reported origin is a cache or overwatch, not a launcher.',
  },
  {
    id: 'ied-efp',
    name: 'Directional EFP / off-route (SAMPLE)',
    family: 'ied',
    minKm: 0,
    maxKm: 8,
    keywords: ['efp', 'directional'],
    blurb: 'Very short standoff device aimed at a road chokepoint.',
  },
];

/**
 * Display name for a munition id.
 * Shared catalog designations win; inference class profiles remain as a fallback.
 */
export function munitionCatalogLabel(id: string): string | undefined {
  const catalog = munitionProfileById(id);
  if (catalog) return `${catalog.designation} — SAMPLE analog`;
  return PROFILES.find((profile) => profile.id === id)?.name;
}

const FAMILY_MATCH_BONUS = 0.1;
const KEYWORD_BONUS = 0.08;
const FAMILY_MISMATCH_PENALTY = 0.34;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function bearingDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function bearingLabel(deg: number): string {
  const dirs = [
    'north',
    'northeast',
    'east',
    'southeast',
    'south',
    'southwest',
    'west',
    'northwest',
  ];
  return dirs[Math.round(deg / 45) % 8] ?? 'north';
}

/** Closed lat/lng ring around a point, for globe path rendering. */
export function circleRingPoints(
  lat: number,
  lng: number,
  radiusKm: number,
  steps = 72,
): { lat: number; lng: number }[] {
  const R = 6371;
  const ang = radiusKm / R;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const points: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const brng = (i / steps) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(ang) +
        Math.cos(lat1) * Math.sin(ang) * Math.cos(brng),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(ang) * Math.cos(lat1),
        Math.cos(ang) - Math.sin(lat1) * Math.sin(lat2),
      );
    points.push({
      lat: (lat2 * 180) / Math.PI,
      lng: ((((lng2 * 180) / Math.PI + 540) % 360) - 180),
    });
  }
  return points;
}

function rangeFit(rangeKm: number, minKm: number, maxKm: number): number {
  if (rangeKm >= minKm && rangeKm <= maxKm) {
    const mid = (minKm + maxKm) / 2;
    const half = (maxKm - minKm) / 2 || 1;
    const closeness = 1 - Math.abs(rangeKm - mid) / half;
    return 0.62 + 0.28 * closeness;
  }
  const outside = rangeKm < minKm ? minKm - rangeKm : rangeKm - maxKm;
  const span = Math.max(15, maxKm - minKm);
  return Math.max(0.05, 0.55 * Math.exp(-outside / span));
}

function trajectoryNote(
  strike: StrikeEvent,
  bearing: number,
  cardinal: string,
): string {
  const track = `${cardinal} track at ${Math.round(bearing)}°`;
  switch (strike.attackType) {
    case 'ied':
      return `No flight arc — reported origin and impact are a ground offset on a ${track} (SAMPLE).`;
    case 'artillery':
      return `Ballistic fires trajectory, ${track} (SAMPLE).`;
    case 'drone':
      return `Low-altitude cruise / loiter trajectory, ${track} (SAMPLE).`;
    case 'missile':
      if (/ballistic/i.test(strike.label)) {
        return `Lofted ballistic trajectory, ${track} (SAMPLE).`;
      }
      return `Low-level cruise trajectory, ${track} (SAMPLE).`;
    default:
      return `Estimated trajectory, ${track} (SAMPLE).`;
  }
}

function threatContext(strike: StrikeEvent, peers: StrikeEvent[]): string {
  const nearby = peers.filter(
    (p) =>
      p.id !== strike.id &&
      haversineKm(strike.impactLat, strike.impactLng, p.impactLat, p.impactLng) <=
        NEAR_KM,
  );
  const word =
    strike.intensity >= 0.85 ? 'high' : strike.intensity >= 0.55 ? 'moderate' : 'low';
  const intensity = `Event intensity ${strike.intensity.toFixed(2)} (${word}).`;
  if (nearby.length === 0) {
    return `Isolated SAMPLE impact — no other strikes within ${NEAR_KM} km. ${intensity}`;
  }
  const counts = new Map<string, number>();
  for (const n of nearby) {
    counts.set(n.attackType, (counts.get(n.attackType) ?? 0) + 1);
  }
  const mix = [...counts.entries()].map(([k, v]) => `${v} ${k}`).join(', ');
  const noun = nearby.length === 1 ? 'strike' : 'strikes';
  return `${nearby.length} other SAMPLE ${noun} within ${NEAR_KM} km (${mix}). ${intensity}`;
}

function keywordHit(label: string, keywords: string[]): boolean {
  const hay = label.toLowerCase();
  return keywords.some((k) => hay.includes(k));
}

function keywordSpecificity(label: string, keywords: string[]): number {
  const hay = label.toLowerCase();
  let best = 0;
  for (const keyword of keywords) {
    if (hay.includes(keyword) && keyword.length > best) best = keyword.length;
  }
  return best;
}

interface ScoredProfile {
  profile: Profile;
  confidence: number;
  rationale: string;
}

function scoreProfile(
  profile: Profile,
  strike: StrikeEvent,
  rangeKm: number,
  cardinal: string,
  threatClause: string,
): ScoredProfile {
  let confidence = rangeFit(rangeKm, profile.minKm, profile.maxKm);
  if (profile.family === strike.attackType) confidence += FAMILY_MATCH_BONUS;
  else confidence -= FAMILY_MISMATCH_PENALTY;
  if (keywordHit(strike.label, profile.keywords)) confidence += KEYWORD_BONUS;
  confidence = Math.max(0.08, Math.min(0.92, confidence));
  const inside = rangeKm >= profile.minKm && rangeKm <= profile.maxKm;
  const where = inside ? 'inside' : rangeKm < profile.minKm ? 'short of' : 'beyond';
  const familyNote =
    profile.family === strike.attackType
      ? `Matches the reported ${strike.attackType} type.`
      : `Alternate to the reported ${strike.attackType} type, kept because the measured range overlaps this envelope.`;
  const rationale = `${profile.blurb} ${Math.round(rangeKm)} km slant range sits ${where} the ${profile.minKm}–${profile.maxKm} km envelope on this ${cardinal} track. ${familyNote} ${threatClause}`;
  return { profile, confidence, rationale };
}

function byConfidence(a: ScoredProfile, b: ScoredProfile): number {
  return b.confidence - a.confidence || a.profile.id.localeCompare(b.profile.id);
}

/**
 * Infer likely SAMPLE munition types for one strike.
 * `peers` is the same AO's strike list (including this event) so threat context
 * can see the local pattern. Does not mutate strike records.
 */
export function inferMunitions(
  strike: StrikeEvent,
  peers: StrikeEvent[] = [],
): StrikeMunitionAssessment {
  const rangeKm = haversineKm(
    strike.originLat,
    strike.originLng,
    strike.impactLat,
    strike.impactLng,
  );
  const bearing = bearingDeg(
    strike.originLat,
    strike.originLng,
    strike.impactLat,
    strike.impactLng,
  );
  const cardinal = bearingLabel(bearing);
  const threat = threatContext(strike, peers);
  const trajectory = trajectoryNote(strike, bearing, cardinal);
  const nearbyCount = peers.filter(
    (p) =>
      p.id !== strike.id &&
      haversineKm(strike.impactLat, strike.impactLng, p.impactLat, p.impactLng) <=
        NEAR_KM,
  ).length;
  const threatClause =
    nearbyCount > 0
      ? `Nearby threat picture: ${nearbyCount} other SAMPLE strike(s) within ${NEAR_KM} km at intensity ${strike.intensity.toFixed(2)}.`
      : `Nearby threat picture: isolated impact, intensity ${strike.intensity.toFixed(2)}.`;

  const scored = PROFILES.map((profile) =>
    scoreProfile(profile, strike, rangeKm, cardinal, threatClause),
  );
  scored.sort(byConfidence);
  // Keep a label keyword hit in the list so a short-range class named in the
  // vignette still appears when the measured range prefers a longer envelope.
  let top = scored.slice(0, 3);
  const keywordBest = scored.find((row) => keywordHit(strike.label, row.profile.keywords));
  if (keywordBest && !top.some((row) => row.profile.id === keywordBest.profile.id)) {
    top = [...top.slice(0, 2), keywordBest];
    top.sort(byConfidence);
  }

  // Prefer a shared catalog profile over the generic SRBM card when the label
  // names one, or when the measured range sits inside a catalog envelope.
  // Cruise and other class cards stay in the list.
  const catalogScored = catalogInferenceProfiles()
    .map((profile) => scoreProfile(profile, strike, rangeKm, cardinal, threatClause))
    .sort(byConfidence);
  const keywordCatalog = catalogScored
    .filter((row) => keywordHit(strike.label, row.profile.keywords))
    .sort(
      (a, b) =>
        keywordSpecificity(strike.label, b.profile.keywords) -
          keywordSpecificity(strike.label, a.profile.keywords) || byConfidence(a, b),
    )[0];
  // Tightest catalog envelope that contains the slant range. A wider band that
  // also contains the range stays available as its own record, but does not
  // outrank the closer fit. Verba stays on a keyword hit so a short missile
  // slant does not become a MANPADS card by envelope width alone.
  const inRangeCatalog = catalogScored
    .filter((row) => row.profile.id !== 'verba')
    .filter((row) => rangeKm >= row.profile.minKm && rangeKm <= row.profile.maxKm)
    .sort(
      (a, b) =>
        a.profile.maxKm -
          a.profile.minKm -
          (b.profile.maxKm - b.profile.minKm) || byConfidence(a, b),
    )[0];
  const catalogPick =
    keywordCatalog ?? (strike.attackType === 'missile' ? inRangeCatalog : undefined);
  if (catalogPick && !top.some((row) => row.profile.id === catalogPick.profile.id)) {
    const srbmIdx = top.findIndex((row) => row.profile.id === 'srbm');
    if (srbmIdx >= 0) {
      const generic = top[srbmIdx]!;
      let pick = catalogPick;
      // Keep a "ballistic" / "short-range" label ahead of a cruise card when
      // the generic SRBM slot is the one being replaced by the catalog.
      if (
        keywordHit(strike.label, generic.profile.keywords) &&
        !keywordHit(strike.label, pick.profile.keywords)
      ) {
        pick = {
          ...pick,
          confidence: Math.min(0.92, pick.confidence + KEYWORD_BONUS),
        };
      }
      top = top.map((row, index) => (index === srbmIdx ? pick : row));
      top.sort(byConfidence);
    } else if (keywordCatalog) {
      top = [...top.slice(0, 2), keywordCatalog];
      top.sort(byConfidence);
    }
  }

  const candidates: MunitionCandidate[] = top.map((row, index) => {
    const style = ringStyleForIndex(index);
    const catalog = munitionProfileById(row.profile.id);
    return {
      id: row.profile.id,
      name: catalog ? `${catalog.designation} — SAMPLE analog` : row.profile.name,
      family: row.profile.family,
      confidence: row.confidence,
      rationale: row.rationale,
      envelopeMinKm: catalog?.rangeMinKm ?? row.profile.minKm,
      envelopeMaxKm: catalog?.rangeMaxKm ?? row.profile.maxKm,
      ringColor: style.color,
      ringDash: style.dashArray,
      ...(catalog
        ? {
            catalogId: catalog.id,
            engagementSphereModelId: catalog.engagementSphereModelId,
            catalogNotes: catalog.notes,
          }
        : {}),
    };
  });

  const envelopeRings: StrikeRangeRing[] = candidates.flatMap((c, index) => {
    const catalog = c.catalogId ? munitionProfileById(c.catalogId) : undefined;
    if (catalog) {
      return rangeRingsForProfile(
        catalog,
        strike.originLat,
        strike.originLng,
        `${strike.id}-env`,
        index,
      );
    }
    const style = ringStyleForIndex(index);
    return [
      {
        id: `${strike.id}-env-${c.id}`,
        kind: 'envelope' as const,
        band: 'max' as const,
        lat: strike.originLat,
        lng: strike.originLng,
        radiusKm: c.envelopeMaxKm,
        color: c.ringColor,
        dashArray: c.ringDash,
        weight: style.weight,
        strokeDegrees: style.strokeDegrees,
        fillOpacity: 0.05,
        label: `${c.name} envelope ${c.envelopeMaxKm} km`,
      },
    ];
  });
  envelopeRings.sort((a, b) => b.radiusKm - a.radiusKm);

  const observed: StrikeRangeRing = {
    id: `${strike.id}-observed`,
    kind: 'observed',
    lat: strike.originLat,
    lng: strike.originLng,
    radiusKm: Math.max(rangeKm, 0.4),
    color: '#d6dee8',
    dashArray: '3 6',
    weight: 2,
    strokeDegrees: null,
    fillOpacity: 0,
    label: `Observed slant range ${Math.round(rangeKm)} km`,
  };

  return {
    strikeId: strike.id,
    label: strike.label,
    attackType: strike.attackType,
    timestamp: strike.timestamp,
    rangeKm,
    bearingDeg: bearing,
    bearingLabel: cardinal,
    trajectory,
    threatContext: threat,
    candidates,
    rings: [...envelopeRings, observed],
  };
}
