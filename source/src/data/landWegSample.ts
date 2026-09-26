import type { WegEquipment } from '../types';

/**
 * SAMPLE / not ODIN — invented WEG-shaped land equipment for scaffolding only.
 * Do not treat as authoritative equipment data.
 */
export const landWegSample: WegEquipment[] = [
  {
    id: 'weg-t72b3-sample',
    designation: 'T-72B3 (SAMPLE)',
    type: 'Main Battle Tank',
    country: 'OPFOR (fictional Composite)',
    crew: 3,
    mainArmament: '125 mm smoothbore (SAMPLE)',
    notes: 'SAMPLE entry for Suwałki Gap vignette — not ODIN / not fielded catalog.',
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'weg-bmp2-sample',
    designation: 'BMP-2 (SAMPLE)',
    type: 'Infantry Fighting Vehicle',
    country: 'OPFOR (fictional Composite)',
    crew: 3,
    mainArmament: '30 mm autocannon (SAMPLE)',
    notes: 'SAMPLE — used as feeder icon in Observe land layer.',
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'weg-bm21-sample',
    designation: 'BM-21 Grad (SAMPLE)',
    type: 'MLRS',
    country: 'OPFOR (fictional Composite)',
    crew: 4,
    mainArmament: '122 mm rockets (SAMPLE)',
    notes: 'SAMPLE — artillery threat marker for land AO.',
    sampleLabel: 'SAMPLE',
  },
  {
    id: 'weg-uav-sample',
    designation: 'Orlan-10 analog (SAMPLE)',
    type: 'ISR UAV',
    country: 'OPFOR (fictional Composite)',
    crew: 0,
    mainArmament: 'EO/IR payload (SAMPLE)',
    notes: 'SAMPLE — ISR feeder; hidden from Commercial Partner role.',
    sampleLabel: 'SAMPLE',
  },
];

export const landWegMeta = {
  label: 'SAMPLE',
  claim: 'not ODIN',
  domain: 'land' as const,
  description:
    'Minimal WEG-shaped JSON for scaffolding. Invented designations for demo only.',
};
