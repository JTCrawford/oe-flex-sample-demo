import type { DomainPipelineMeta } from '../types';

export const domainPipelines: DomainPipelineMeta[] = [
  {
    id: 'land',
    label: 'Land',
    status: 'LIVE',
    note: 'WEG SAMPLE JSON wired — Suwałki Gap AO (NATO land corridor).',
  },
  {
    id: 'air',
    label: 'Air',
    status: 'STUB',
    note: 'Pipeline interface ready; no live feeders.',
  },
  {
    id: 'sea',
    label: 'Sea',
    status: 'STUB',
    note: 'Hormuz maritime vignette uses SAMPLE overlays (not full sea pipeline).',
  },
  {
    id: 'ems',
    label: 'EMS',
    status: 'STUB',
    note: 'Stub — spectrum layers not connected.',
  },
  {
    id: 'info',
    label: 'Info',
    status: 'STUB',
    note: 'Stub — info ops pipeline not connected.',
  },
  {
    id: 'cyber',
    label: 'Cyber',
    status: 'STUB',
    note: 'Stub — cyber pipeline not connected.',
  },
  {
    id: 'undersea',
    label: 'Undersea',
    status: 'STUB',
    note: 'Stub — undersea pipeline not connected.',
  },
  {
    id: 'space',
    label: 'Space',
    status: 'STUB',
    note: 'Stub — space pipeline not connected.',
  },
];
