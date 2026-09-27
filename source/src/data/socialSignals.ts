import { threatLayersByAo } from './aos';
import { munitionCatalogLabel } from './munitionInference';
import type {
  ClaimStatus,
  InformationCredibility,
  SocialMapHint,
  SocialSignal,
  SourceReliability,
} from '../types';

/**
 * UNCLASS SAMPLE social / SOCMINT indicators-and-warning cards.
 * Fictional labels only — not a scrape or republication of any real post.
 * Ukraine East keeps the original four cards. Hormuz, Bab el-Mandeb, and the
 * CC0 hotspot stops each have a few more. Grades are SAMPLE training labels
 * in the A1–F6 shape. Nothing here is scraped or bought from a vendor.
 */

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function capturedAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

export const SOCIAL_SIGNALS: SocialSignal[] = [
  {
    id: 'soc-ue-dual-axis',
    platform: 'SAMPLE Social',
    headline: 'SAMPLE channel: armor massing on two axes toward the eastern corridor',
    body:
      'Fictional indicators-and-warning post. A SAMPLE open channel describes vehicle concentrations forming on a northern approach and a second axis at the M03 corridor node. Counts are vague, no imagery is attached, and the wording follows an indicators shape (massing, dual axes) — it is not a copied account.',
    sourceLabel: 'SAMPLE Open Channel — East Corridor Watch',
    reliability: 'C',
    credibility: 3,
    claimStatus: 'reported',
    capturedAt: capturedAgo(2 * HOUR_MS),
    aoIds: ['ukraine-east'],
    geoHints: [
      { name: 'SAMPLE northern approach axis', lat: 49.62, lon: 37.9 },
      { name: 'SAMPLE M03 corridor axis', lat: 49.18, lon: 37.05 },
    ],
    relatedUnitIds: ['ue-tank-1', 'ue-bmp-1', 'ue-tf-1', 'ue-srbm-1'],
    relatedMunitionIds: ['tochka-u', 'iskander-m'],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-ue-rhetoric',
    platform: 'SAMPLE Broadcaster',
    headline: 'SAMPLE broadcaster: mobilization language calls for full readiness',
    body:
      'Fictional official-rhetoric indicator. A SAMPLE state desk uses readiness and hold-the-line language without naming a real government or quoting a real address. Treat it as an information-environment cue, not an order.',
    sourceLabel: 'SAMPLE State Broadcaster (fictional desk)',
    reliability: 'C',
    credibility: 3,
    claimStatus: 'reported',
    capturedAt: capturedAgo(6 * HOUR_MS),
    aoIds: ['ukraine-east'],
    geoHints: [{ name: 'SAMPLE eastern assembly node', lat: 49.4, lon: 37.62 }],
    relatedUnitIds: ['ue-tf-1'],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-ue-chiefs',
    platform: 'SAMPLE Forum',
    headline: 'Thin SAMPLE rumor: coalition defense chiefs to meet on resupply',
    body:
      'Single anonymous SAMPLE handle. No second source, no location fix, and no official calendar. Reliability cannot be judged, and the claim is improbable on the information in hand.',
    sourceLabel: 'SAMPLE anonymous handle gray-ledger',
    reliability: 'F',
    credibility: 5,
    claimStatus: 'unverified',
    capturedAt: capturedAgo(30 * HOUR_MS),
    aoIds: ['ukraine-east'],
    geoHints: [{ name: 'SAMPLE coalition capital (unlocated)' }],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-ue-dual-axis-corroboration',
    platform: 'SAMPLE Wire',
    headline: 'Second SAMPLE collector notes the same dual-axis vehicle pattern',
    body:
      'Independent fictional collector, separate from East Corridor Watch. It describes vehicle grouping on the northern approach and the M03 corridor without reusing the first channel’s wording. This card is what raises the first report’s displayed Admiralty grade.',
    sourceLabel: 'SAMPLE Field Desk — independent collector',
    reliability: 'B',
    credibility: 2,
    claimStatus: 'corroborated',
    capturedAt: capturedAgo(45 * MINUTE_MS),
    aoIds: ['ukraine-east'],
    geoHints: [
      { name: 'SAMPLE northern approach axis', lat: 49.62, lon: 37.9 },
      { name: 'SAMPLE M03 corridor axis', lat: 49.18, lon: 37.05 },
    ],
    relatedUnitIds: ['ue-bmp-2', 'ue-mlrs-1', 'ue-partner-atacms'],
    relatedMunitionIds: ['atacms-block-i'],
    corroboratesId: 'soc-ue-dual-axis',
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-hz-exercise',
    platform: 'SAMPLE Notice',
    headline: 'SAMPLE notice: exercise stamp A1 on a fictional lane status',
    body:
      'Training label only. A SAMPLE desk stamps this invented lane note A1 so the badge can be briefed. The text does not confirm a real transit, a real closure, or a real order.',
    sourceLabel: 'SAMPLE Exercise Desk — Hormuz lane',
    reliability: 'A',
    credibility: 1,
    claimStatus: 'substantiated',
    capturedAt: capturedAgo(20 * MINUTE_MS),
    aoIds: ['hormuz'],
    geoHints: [{ name: 'SAMPLE Hormuz lane marker', lat: 26.57, lon: 56.25 }],
    relatedUnitIds: ['hormuz-coalition-1', 'hormuz-patrol-1'],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-hz-ais',
    platform: 'SAMPLE Social',
    headline: 'SAMPLE channel: two merchant tracks disagree with the posted lane',
    body:
      'Fictional indicators post. A SAMPLE open channel says the two strait tracks do not match the lane sketch. No imagery, no real ship name, and no copied account.',
    sourceLabel: 'SAMPLE Open Channel — Strait Watch',
    reliability: 'C',
    credibility: 3,
    claimStatus: 'reported',
    capturedAt: capturedAgo(3 * HOUR_MS),
    aoIds: ['hormuz'],
    geoHints: [
      { name: 'SAMPLE merchant track alpha', lat: 26.4, lon: 56.1 },
      { name: 'SAMPLE merchant track bravo', lat: 26.7, lon: 56.4 },
    ],
    relatedUnitIds: ['hormuz-patrol-1', 'hormuz-strike-1'],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-hz-ais-corroboration',
    platform: 'SAMPLE Wire',
    headline: 'Second SAMPLE desk notes the same two-track mismatch',
    body:
      'Independent fictional desk. It describes the same pair of tracks in different words. This card is what raises the Strait Watch report’s displayed grade.',
    sourceLabel: 'SAMPLE Maritime Desk — independent collector',
    reliability: 'B',
    credibility: 2,
    claimStatus: 'corroborated',
    capturedAt: capturedAgo(50 * MINUTE_MS),
    aoIds: ['hormuz'],
    geoHints: [
      { name: 'SAMPLE merchant track alpha', lat: 26.4, lon: 56.1 },
      { name: 'SAMPLE merchant track bravo', lat: 26.7, lon: 56.4 },
    ],
    relatedUnitIds: ['hormuz-coalition-ground-1'],
    corroboratesId: 'soc-hz-ais',
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-hz-closure',
    platform: 'SAMPLE Forum',
    headline: 'SAMPLE rumor: the strait is shut for the day',
    body:
      'One anonymous SAMPLE handle. No second source and no place fix. Source reliability cannot be judged, and the truth of the line cannot be judged either.',
    sourceLabel: 'SAMPLE anonymous handle night-ledger',
    reliability: 'F',
    credibility: 6,
    claimStatus: 'unverified',
    capturedAt: capturedAgo(14 * HOUR_MS),
    aoIds: ['hormuz'],
    geoHints: [{ name: 'SAMPLE unlocated closure talk' }],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-bab-delay',
    platform: 'SAMPLE Social',
    headline: 'SAMPLE channel: merchant track held short of the southern lane',
    body:
      'Fictional Red Sea post for the Bab el-Mandeb SAMPLE thread. The wording is doubtful on its own: one channel, soft counts, no imagery. Not a copied account.',
    sourceLabel: 'SAMPLE Open Channel — Southern Lane',
    reliability: 'D',
    credibility: 4,
    claimStatus: 'reported',
    capturedAt: capturedAgo(4 * HOUR_MS),
    aoIds: ['bab-el-mandeb'],
    geoHints: [{ name: 'SAMPLE merchant track', lat: 14.7, lon: 42.5 }],
    relatedUnitIds: ['bab-craft-1', 'bab-escort-1', 'bab-coastal-1'],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-bab-rumor',
    platform: 'SAMPLE Forum',
    headline: 'SAMPLE rumor: lane watch pulled off the coastal pin',
    body:
      'Single SAMPLE handle with a history of loose talk. The line is improbable from what this card contains, and no second source is attached.',
    sourceLabel: 'SAMPLE anonymous handle red-margin',
    reliability: 'E',
    credibility: 5,
    claimStatus: 'unverified',
    capturedAt: capturedAgo(18 * HOUR_MS),
    aoIds: ['bab-el-mandeb'],
    geoHints: [{ name: 'SAMPLE coastal pin talk', lat: 15.5, lon: 41.6 }],
    relatedUnitIds: ['bab-coalition-ground-1'],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-pg-cluster',
    platform: 'SAMPLE Social',
    headline: 'SAMPLE channel: small-craft talk around the platform cluster',
    body:
      'Fictional central Gulf note from the existing fast-craft SAMPLE picture. Fairly reliable channel, doubtful detail. No real platform name and no imagery.',
    sourceLabel: 'SAMPLE Open Channel — Gulf Cluster',
    reliability: 'C',
    credibility: 4,
    claimStatus: 'reported',
    capturedAt: capturedAgo(5 * HOUR_MS),
    aoIds: ['persian-gulf'],
    geoHints: [
      { name: 'SAMPLE platform cluster', lat: 27.6, lon: 51.8 },
      { name: 'SAMPLE craft section A', lat: 27.8, lon: 50.9 },
    ],
    relatedUnitIds: ['pg-craft-a', 'pg-craft-b', 'pg-escort-1'],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-bs-shore',
    platform: 'SAMPLE Wire',
    headline: 'SAMPLE desk: shore section still marked on the patrol line',
    body:
      'Fictional Black Sea note. A usually reliable SAMPLE desk says the shore pin is still on the line toward the patrol stand-in. Possibly true on this card alone. CC0 picture only.',
    sourceLabel: 'SAMPLE Maritime Desk — Black Sea',
    reliability: 'B',
    credibility: 3,
    claimStatus: 'reported',
    capturedAt: capturedAgo(90 * MINUTE_MS),
    aoIds: ['black-sea'],
    geoHints: [
      { name: 'SAMPLE shore section', lat: 45.55, lon: 30.55 },
      { name: 'SAMPLE patrol stand-in', lat: 45.35, lon: 31.55 },
    ],
    relatedUnitIds: ['bs-partner-inf', 'bs-patrol-1', 'bs-partner-usv'],
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'soc-sg-corridor',
    platform: 'SAMPLE Social',
    headline: 'SAMPLE channel: corridor node named in local traffic talk',
    body:
      'Fictional Suwałki note. A not-usually-reliable SAMPLE channel mentions the corridor node and vehicle movement. Possibly true, and not a copied post.',
    sourceLabel: 'SAMPLE Open Channel — Corridor Talk',
    reliability: 'D',
    credibility: 3,
    claimStatus: 'reported',
    capturedAt: capturedAgo(7 * HOUR_MS),
    aoIds: ['suwalki-gap'],
    geoHints: [
      { name: 'SAMPLE corridor node', lat: 54.08, lon: 23.0 },
      { name: 'SAMPLE armor approach', lat: 54.18, lon: 22.85 },
    ],
    relatedUnitIds: ['tank-1', 'mlrs-1', 'sg-partner-inf'],
    sampleLabel: 'SAMPLE',
  },
];

const RELIABILITY_BLURB: Record<SourceReliability, string> = {
  A: 'completely reliable source',
  B: 'usually reliable source',
  C: 'fairly reliable source',
  D: 'not usually reliable source',
  E: 'unreliable source',
  F: 'reliability cannot be judged',
};

const CREDIBILITY_BLURB: Record<InformationCredibility, string> = {
  1: 'information confirmed by other sources',
  2: 'information probably true',
  3: 'information possibly true',
  4: 'information doubtful',
  5: 'information improbable',
  6: 'truth of the information cannot be judged',
};

export interface SocialCatalogLink {
  id: string;
  label: string;
}

/** Derived card: raw Admiralty fields stay on the signal; display fields may be raised. */
export interface SocialSignalView extends SocialSignal {
  displayReliability: SourceReliability;
  displayCredibility: InformationCredibility;
  displayClaimStatus: ClaimStatus;
  upgraded: boolean;
  upgradeNote?: string;
  corroboratesHeadline?: string;
  relatedUnits: SocialCatalogLink[];
  relatedMunitions: SocialCatalogLink[];
}

export function admiraltyExplanation(
  reliability: SourceReliability,
  credibility: InformationCredibility,
): string {
  return `${reliability}${credibility}: ${RELIABILITY_BLURB[reliability]}; ${CREDIBILITY_BLURB[credibility]}.`;
}

export function relativeCapturedAt(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const minutes = Math.floor(Math.max(0, now - then) / MINUTE_MS);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Badge shape: `C3 · reported · 2h ago`. */
export function formatAdmiraltyBadge(
  view: Pick<
    SocialSignalView,
    'displayReliability' | 'displayCredibility' | 'displayClaimStatus' | 'capturedAt'
  >,
  now = Date.now(),
): string {
  return `${view.displayReliability}${view.displayCredibility} · ${view.displayClaimStatus} · ${relativeCapturedAt(view.capturedAt, now)}`;
}

function relatedUnitLabels(aoId: string, ids: string[] | undefined): SocialCatalogLink[] {
  if (!ids || ids.length === 0) return [];
  const byId = new Map<string, string>();
  for (const layer of threatLayersByAo[aoId] ?? []) {
    for (const marker of layer.markers) {
      if (marker.orbat) byId.set(marker.id, marker.orbat.designation);
    }
  }
  return ids.flatMap((id) => {
    const label = byId.get(id);
    return label ? [{ id, label }] : [];
  });
}

function relatedMunitionLabels(ids: string[] | undefined): SocialCatalogLink[] {
  if (!ids || ids.length === 0) return [];
  return ids.flatMap((id) => {
    const label = munitionCatalogLabel(id);
    return label ? [{ id, label }] : [];
  });
}

function presentSocialSignal(
  signal: SocialSignal,
  aoSignals: SocialSignal[],
  aoId: string,
): SocialSignalView {
  const supporters = aoSignals.filter((other) => other.corroboratesId === signal.id);
  const supporter = supporters[0];
  const upgraded = Boolean(supporter) && signal.claimStatus === 'reported';
  const target = signal.corroboratesId
    ? aoSignals.find((other) => other.id === signal.corroboratesId)
    : undefined;
  return {
    ...signal,
    displayReliability: upgraded ? 'B' : signal.reliability,
    displayCredibility: upgraded ? 2 : signal.credibility,
    displayClaimStatus: upgraded ? 'corroborated' : signal.claimStatus,
    upgraded,
    upgradeNote:
      upgraded && supporter
        ? `Independent SAMPLE source “${supporter.sourceLabel}” corroborates this report. Displayed grade raised from ${signal.reliability}${signal.credibility} ${signal.claimStatus} to B2 corroborated.`
        : undefined,
    corroboratesHeadline: target?.headline,
    relatedUnits: relatedUnitLabels(aoId, signal.relatedUnitIds),
    relatedMunitions: relatedMunitionLabels(signal.relatedMunitionIds),
  };
}

export function presentSignalsForAo(aoId: string): SocialSignalView[] {
  const rows = SOCIAL_SIGNALS.filter((signal) => signal.aoIds.includes(aoId));
  return [...rows]
    .sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt))
    .map((signal) => presentSocialSignal(signal, rows, aoId));
}

/** Hints that have coordinates. Unlocated names stay in the detail panel only. */
export function locatedGeoHints(signal: SocialSignal | null): SocialMapHint[] {
  if (!signal) return [];
  return signal.geoHints.flatMap((hint, index) => {
    if (hint.lat == null || hint.lon == null) return [];
    return [
      {
        id: `${signal.id}-geo-${index}`,
        name: hint.name,
        lat: hint.lat,
        lon: hint.lon,
        headline: signal.headline,
      },
    ];
  });
}
