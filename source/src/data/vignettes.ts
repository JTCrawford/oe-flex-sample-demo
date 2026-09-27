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

  {
    id: 'vignette-ukraine-east',
    title: 'Ukraine East — drone / missile pulse (SAMPLE)',
    aoId: 'ukraine-east',
    domain: 'land',
    durationSec: 40,
    steps: [
      {
        t: 0,
        title: 'Setup',
        description: 'BMP-2 sections hold near M03 corridor node; UAV feeder cues east (SAMPLE).',
        kind: 'attack',
      },
      {
        t: 10,
        title: 'Drone / missile pulse',
        description: 'FPV swarm and cruise missile cues strike rail / depot nodes from eastern origins (SAMPLE).',
        kind: 'attack',
      },
      {
        t: 22,
        title: 'Mitigation: C-UAS + dispersal',
        description: 'C-UAS coverage on corridor; disperse logistics away from hot-zone ring (SAMPLE).',
        kind: 'mitigation',
      },
      {
        t: 32,
        title: 'Outcome window',
        description: 'Corridor holds if C-UAS densifies; residual ballistic risk on logistics hub (SAMPLE).',
        kind: 'outcome',
      },
    ],
    mitigations: [
      {
        id: 'mit-ue-cuas',
        label: 'C-UAS corridor coverage',
        description: 'Attrit FPV / Lancet-class cues on M03 approach.',
        cost: 'Med',
        baseSuccess: 0.68,
      },
      {
        id: 'mit-ue-disperse',
        label: 'Logistics dispersal',
        description: 'Move depot stocks outside hot-zone intensity rings.',
        cost: 'Low',
        baseSuccess: 0.6,
      },
      {
        id: 'mit-ue-counterfire',
        label: 'Counterfire on MLRS',
        description: 'Suppress BM-21 battery before next fire mission.',
        cost: 'High',
        baseSuccess: 0.58,
      },
    ],
  },
  {
    id: 'vignette-bab-el-mandeb',
    title: 'Bab el-Mandeb — merchant track (SAMPLE)',
    aoId: 'bab-el-mandeb',
    domain: 'sea',
    durationSec: 36,
    steps: [
      {
        t: 0,
        title: 'Setup',
        description: 'A SAMPLE merchant track is in the southern Red Sea under the existing mock feed.',
        kind: 'attack',
      },
      {
        t: 12,
        title: 'Coastal picture',
        description: 'SAMPLE coastal section and coastal craft sit on lines toward that track.',
        kind: 'attack',
      },
      {
        t: 24,
        title: 'Mitigation: escort lane',
        description: 'SAMPLE escort and lane watch stay on the blue side of the same picture.',
        kind: 'mitigation',
      },
    ],
    mitigations: [
      {
        id: 'mit-bab-escort',
        label: 'Escort on the merchant track',
        description: 'Keep the SAMPLE escort on the blue side of the track.',
        cost: 'Med',
        baseSuccess: 0.7,
      },
    ],
  },
  {
    id: 'vignette-persian-gulf',
    title: 'Persian Gulf — platform cluster (SAMPLE)',
    aoId: 'persian-gulf',
    domain: 'sea',
    durationSec: 36,
    steps: [
      {
        t: 0,
        title: 'Setup',
        description: 'SAMPLE energy platform cluster from the existing central Gulf mock feed.',
        kind: 'attack',
      },
      {
        t: 12,
        title: 'Fast-craft picture',
        description: 'Two SAMPLE craft sections sit on lines toward the cluster.',
        kind: 'attack',
      },
      {
        t: 24,
        title: 'Mitigation: screen',
        description: 'SAMPLE screen section stays between the cluster and the first craft section.',
        kind: 'mitigation',
      },
    ],
    mitigations: [
      {
        id: 'mit-pg-screen',
        label: 'Screen the platform cluster',
        description: 'Hold the SAMPLE screen on the blue side.',
        cost: 'Med',
        baseSuccess: 0.66,
      },
    ],
  },
  {
    id: 'vignette-black-sea',
    title: 'Black Sea — USV section (SAMPLE)',
    aoId: 'black-sea',
    domain: 'sea',
    durationSec: 36,
    steps: [
      {
        t: 0,
        title: 'Setup',
        description: 'SAMPLE merchant track with a CC0 USV stand-in and a patrol stand-in.',
        kind: 'attack',
      },
      {
        t: 12,
        title: 'Patrol line',
        description: 'The SAMPLE patrol stand-in sits on a line toward the merchant track.',
        kind: 'attack',
      },
      {
        t: 24,
        title: 'Mitigation: USV and shore',
        description: 'The partner USV section and shore section stay on lines toward the patrol stand-in.',
        kind: 'mitigation',
      },
    ],
    mitigations: [
      {
        id: 'mit-bs-usv',
        label: 'Hold the USV section',
        description: 'Keep the SAMPLE USV section on the blue side of the patrol line.',
        cost: 'Med',
        baseSuccess: 0.64,
      },
    ],
  },
];

export function vignetteForAo(aoId: string): Vignette | undefined {
  return vignettes.find((v) => v.aoId === aoId);
}
