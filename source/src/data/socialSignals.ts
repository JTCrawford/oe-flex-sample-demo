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
 * Attached to the existing Ukraine East AO so strike history, order of battle,
 * and the munition catalog stay in the same picture.
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
