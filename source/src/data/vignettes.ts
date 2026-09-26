import type { Vignette } from '../types';

export const vignettes: Vignette[] = [
  {
    id: 'vignette-suwalki-gap',
    title: 'Suwałki Gap — OPFOR armor push (SAMPLE)',
    aoId: 'suwalki-gap',
    domain: 'land',
    durationSec: 48,
    steps: [
      {
        t: 0,
        title: 'Setup',
        description: 'WEG SAMPLE OPFOR armor stages west of the Via Baltica / E67 corridor node.',
        kind: 'attack',
      },
      {
        t: 8,
        title: 'Recon probe',
        description: 'UAV feeder confirms BMP-2 section approaching the Via Baltica corridor node.',
        kind: 'attack',
      },
      {
        t: 16,
        title: 'Armor assault',
        description: 'T-72B3 platoon advances under BM-21 suppression fires.',
        kind: 'attack',
      },
      {
        t: 24,
        title: 'Mitigation: obstacle + ATGM',
        description: 'Emplace obstacles on approach; ATGM team covers bridge kill zone.',
        kind: 'mitigation',
      },
      {
        t: 32,
        title: 'Mitigation: counter-battery',
        description: 'Counter-battery cues on BM-21 battery using SAMPLE WEG signatures.',
        kind: 'mitigation',
      },
      {
        t: 40,
        title: 'Outcome window',
        description: 'Suwałki land bridge remains open if obstacles hold; residual MLRS risk east flank.',
        kind: 'outcome',
      },
    ],
    mitigations: [
      {
        id: 'mit-obstacle-atgm',
        label: 'Obstacle belt + ATGM overwatch',
        description: 'Slow armor; attrit lead tanks at bridge.',
        cost: 'Med',
        baseSuccess: 0.72,
      },
      {
        id: 'mit-counterbattery',
        label: 'Counter-battery on MLRS',
        description: 'Suppress BM-21 before assault peak.',
        cost: 'High',
        baseSuccess: 0.65,
      },
      {
        id: 'mit-uav-deny',
        label: 'UAV denial / EW',
        description: 'Blind OPFOR recon; reduce targeting quality.',
        cost: 'Low',
        baseSuccess: 0.55,
      },
    ],
  },
  {
    id: 'vignette-hormuz',
    title: 'Hormuz — shipping harassment (SAMPLE)',
    aoId: 'hormuz',
    domain: 'sea',
    durationSec: 48,
    steps: [
      {
        t: 0,
        title: 'Setup',
        description: 'VLCC Alpha and Tanker Bravo transit the strait under elevated advisory.',
        kind: 'attack',
      },
      {
        t: 8,
        title: 'Fast-boat swarm',
        description: 'Small craft approach VLCC Alpha from coastal node.',
        kind: 'attack',
      },
      {
        t: 16,
        title: 'Pipeline threat cue',
        description: 'Energy node anomaly reported near coastal pipeline (SAMPLE).',
        kind: 'attack',
      },
      {
        t: 24,
        title: 'Mitigation: escort + corridor',
        description: 'Naval escort and designated transit corridor for commercial shipping.',
        kind: 'mitigation',
      },
      {
        t: 32,
        title: 'Mitigation: port hardening',
        description: 'Terminal security surge; partner ISR cue on approaches.',
        kind: 'mitigation',
      },
      {
        t: 40,
        title: 'Outcome window',
        description: 'Transit resumes with elevated residual risk on night runs.',
        kind: 'outcome',
      },
    ],
    mitigations: [
      {
        id: 'mit-escort',
        label: 'Escort + transit corridor',
        description: 'Protect commercial hulls through chokepoint.',
        cost: 'High',
        baseSuccess: 0.78,
      },
      {
        id: 'mit-port-harden',
        label: 'Port / terminal hardening',
        description: 'Reduce shore-side disruption and pipeline exposure.',
        cost: 'Med',
        baseSuccess: 0.62,
      },
      {
        id: 'mit-commercial-isr',
        label: 'Commercial ISR partnership',
        description: 'Partner sensors cue without exposing feeder positions.',
        cost: 'Low',
        baseSuccess: 0.58,
      },
    ],
  },
];

export function vignetteForAo(aoId: string): Vignette | undefined {
  return vignettes.find((v) => v.aoId === aoId);
}
