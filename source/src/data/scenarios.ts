import type { ForceSide, ThreatLayer } from '../types';

/** Two SAMPLE threads. Suwałki stays an AO and is not one of these. */
export type ScenarioId = 'ukraine-russia' | 'iran-hormuz';

export interface Scenario {
  id: ScenarioId;
  /** Button label. */
  label: string;
  kicker: string;
  aoId: 'ukraine-east' | 'hormuz';
  /** What the toggle should show. UNCLASS SAMPLE only. */
  summary: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'ukraine-russia',
    label: 'Ukraine–Russia',
    kicker: 'Primary',
    aoId: 'ukraine-east',
    summary:
      'Ukraine East SAMPLE picture. Partner pins are blue. OPFOR pins are red. Engagement lines run between the missile battery and partner fires, the fighter flight and the task force, SHORAD and the task force, the rocket battery and partner armor, and the two infantry sections.',
  },
  {
    id: 'iran-hormuz',
    label: 'Iran / Hormuz',
    kicker: 'Secondary',
    aoId: 'hormuz',
    summary:
      'Hormuz SAMPLE thread. Coalition pins are blue. OPFOR pins are red. Engagement lines run from the strike flight and the patrol toward the shipping tracks, and from the coalition flight and ground section toward the OPFOR strike flight and coastal ground pin.',
  },
];

export function scenarioById(id: ScenarioId): Scenario {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0];
}

export function scenarioIdForAo(aoId: string): ScenarioId | null {
  if (aoId === 'ukraine-east') return 'ukraine-russia';
  if (aoId === 'hormuz') return 'iran-hormuz';
  return null;
}

interface EngagementSpec {
  id: string;
  fromId: string;
  toId: string;
  side: ForceSide;
  label: string;
}

const LINES: Record<ScenarioId, EngagementSpec[]> = {
  'ukraine-russia': [
    {
      id: 'ue-srbm-fires',
      fromId: 'ue-srbm-1',
      toId: 'ue-partner-atacms',
      side: 'adversary',
      label: 'SAMPLE missile battery toward partner fires',
    },
    {
      id: 'ue-air-tf',
      fromId: 'ue-partner-air',
      toId: 'ue-tf-1',
      side: 'friendly',
      label: 'SAMPLE fighter flight toward the OPFOR task force',
    },
    {
      id: 'ue-shorad-tf',
      fromId: 'ue-partner-shorad',
      toId: 'ue-tf-1',
      side: 'friendly',
      label: 'SAMPLE SHORAD section toward the OPFOR task force',
    },
    {
      id: 'ue-mlrs-armor',
      fromId: 'ue-mlrs-1',
      toId: 'ue-partner-armor',
      side: 'adversary',
      label: 'SAMPLE rocket battery toward partner armor',
    },
    {
      id: 'ue-infantry',
      fromId: 'ue-partner-inf',
      toId: 'ue-opfor-inf',
      side: 'friendly',
      label: 'SAMPLE partner infantry toward the OPFOR infantry section',
    },
  ],
  'iran-hormuz': [
    {
      id: 'hz-strike-ship',
      fromId: 'hormuz-strike-1',
      toId: 'ship-1',
      side: 'adversary',
      label: 'SAMPLE strike flight toward a shipping track',
    },
    {
      id: 'hz-coalition-strike',
      fromId: 'hormuz-coalition-1',
      toId: 'hormuz-strike-1',
      side: 'friendly',
      label: 'SAMPLE coalition flight toward the OPFOR strike flight',
    },
    {
      id: 'hz-patrol-ship',
      fromId: 'hormuz-patrol-1',
      toId: 'ship-2',
      side: 'adversary',
      label: 'SAMPLE patrol squadron toward a shipping track',
    },
    {
      id: 'hz-ground',
      fromId: 'hormuz-coalition-ground-1',
      toId: 'hormuz-coastal-1',
      side: 'friendly',
      label: 'SAMPLE coalition ground section toward the coastal ground pin',
    },
  ],
};

export interface ResolvedEngagementLine {
  id: string;
  label: string;
  side: ForceSide;
  color: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

export function sideColor(side: ForceSide): string {
  return side === 'friendly' ? '#5eb1ff' : '#ff5a5a';
}

/** Lines whose both ends are on the current visible layers. */
export function resolveEngagementLines(
  scenarioId: ScenarioId,
  layers: ThreatLayer[],
): ResolvedEngagementLine[] {
  const byId = new Map<string, { lat: number; lng: number }>();
  for (const layer of layers) {
    for (const marker of layer.markers) {
      byId.set(marker.id, { lat: marker.lat, lng: marker.lng });
    }
  }
  const resolved: ResolvedEngagementLine[] = [];
  for (const line of LINES[scenarioId]) {
    const from = byId.get(line.fromId);
    const to = byId.get(line.toId);
    if (!from || !to) continue;
    resolved.push({
      id: line.id,
      label: line.label,
      side: line.side,
      color: sideColor(line.side),
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
    });
  }
  return resolved;
}
