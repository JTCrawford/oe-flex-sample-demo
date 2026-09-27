import type { ForceSide, ThreatLayer } from '../types';

/**
 * SAMPLE hotspot tour. Each id selects one area of operations.
 * Notes stay UNCLASS mock. They are not a real disposition.
 */
export type ScenarioId =
  | 'ukraine-russia'
  | 'iran-hormuz'
  | 'bab-el-mandeb'
  | 'persian-gulf'
  | 'black-sea'
  | 'suwalki-gap';

export interface Scenario {
  id: ScenarioId;
  /** Button label. */
  label: string;
  kicker: string;
  aoId: string;
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
    label: 'Strait of Hormuz',
    kicker: 'Iran',
    aoId: 'hormuz',
    summary:
      'Strait of Hormuz SAMPLE thread. Coalition pins are blue. OPFOR pins are red. Engagement lines run from the strike flight and the patrol toward the shipping tracks, and from the coalition flight and ground section toward the OPFOR strike flight and coastal ground pin.',
  },
  {
    id: 'bab-el-mandeb',
    label: 'Bab el-Mandeb',
    kicker: 'Houthis / Yemen',
    aoId: 'bab-el-mandeb',
    summary:
      'Houthis / Yemen SAMPLE thread for the southern Red Sea and Bab el-Mandeb, using the existing Red Sea mock feed. Coastal pins are red. The escort and lane watch are blue. Lines run from the coastal section and coastal craft toward the merchant track, and from the escort and lane watch back toward those pins.',
  },
  {
    id: 'persian-gulf',
    label: 'Persian Gulf',
    kicker: 'Fast craft',
    aoId: 'persian-gulf',
    summary:
      'Persian Gulf SAMPLE thread from the existing fast-craft mock feed, separate from the Strait of Hormuz pins. Two red craft sections point at the energy platform cluster. The blue screen section points at the first craft section.',
  },
  {
    id: 'black-sea',
    label: 'Black Sea',
    kicker: 'USV',
    aoId: 'black-sea',
    summary:
      'Black Sea SAMPLE picture on the CC0 corvette mesh. The partner USV stand-in and shore section are blue. The patrol stand-in is red. Lines run from the patrol toward the merchant track, and from the USV stand-in and shore section toward the patrol.',
  },
  {
    id: 'suwalki-gap',
    label: 'Suwałki Gap',
    kicker: 'Land corridor',
    aoId: 'suwalki-gap',
    summary:
      'Suwałki Gap SAMPLE land corridor. OPFOR armor, mech, and rockets are red. The corridor defense section is blue. Lines run from the armor and rockets toward the corridor node, from the mech section toward the defense section, and from the defense section toward the armor.',
  },
];

const AO_TO_SCENARIO: Record<string, ScenarioId> = {
  'ukraine-east': 'ukraine-russia',
  hormuz: 'iran-hormuz',
  'bab-el-mandeb': 'bab-el-mandeb',
  'persian-gulf': 'persian-gulf',
  'black-sea': 'black-sea',
  'suwalki-gap': 'suwalki-gap',
};

export function scenarioById(id: ScenarioId): Scenario {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0];
}

export function scenarioIdForAo(aoId: string): ScenarioId | null {
  return AO_TO_SCENARIO[aoId] ?? null;
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
  'bab-el-mandeb': [
    {
      id: 'bab-coast-ship',
      fromId: 'bab-coastal-1',
      toId: 'bab-ship-1',
      side: 'adversary',
      label: 'SAMPLE coastal section toward the merchant track',
    },
    {
      id: 'bab-craft-ship',
      fromId: 'bab-craft-1',
      toId: 'bab-ship-1',
      side: 'adversary',
      label: 'SAMPLE coastal craft toward the merchant track',
    },
    {
      id: 'bab-escort-craft',
      fromId: 'bab-escort-1',
      toId: 'bab-craft-1',
      side: 'friendly',
      label: 'SAMPLE escort toward the coastal craft',
    },
    {
      id: 'bab-watch-coast',
      fromId: 'bab-coalition-ground-1',
      toId: 'bab-coastal-1',
      side: 'friendly',
      label: 'SAMPLE lane watch toward the coastal section',
    },
  ],
  'persian-gulf': [
    {
      id: 'pg-a-platform',
      fromId: 'pg-craft-a',
      toId: 'pg-platform-1',
      side: 'adversary',
      label: 'SAMPLE fast-craft section toward the platform cluster',
    },
    {
      id: 'pg-b-platform',
      fromId: 'pg-craft-b',
      toId: 'pg-platform-1',
      side: 'adversary',
      label: 'SAMPLE second fast-craft section toward the platform cluster',
    },
    {
      id: 'pg-screen',
      fromId: 'pg-escort-1',
      toId: 'pg-craft-a',
      side: 'friendly',
      label: 'SAMPLE screen section toward the first fast-craft section',
    },
  ],
  'black-sea': [
    {
      id: 'bs-patrol-ship',
      fromId: 'bs-patrol-1',
      toId: 'bs-ship-1',
      side: 'adversary',
      label: 'SAMPLE patrol stand-in toward the merchant track',
    },
    {
      id: 'bs-usv-patrol',
      fromId: 'bs-partner-usv',
      toId: 'bs-patrol-1',
      side: 'friendly',
      label: 'SAMPLE USV section toward the patrol stand-in',
    },
    {
      id: 'bs-shore-patrol',
      fromId: 'bs-partner-inf',
      toId: 'bs-patrol-1',
      side: 'friendly',
      label: 'SAMPLE shore section toward the patrol stand-in',
    },
  ],
  'suwalki-gap': [
    {
      id: 'sg-armor-node',
      fromId: 'tank-1',
      toId: 'bridge-1',
      side: 'adversary',
      label: 'SAMPLE armor platoon toward the corridor node',
    },
    {
      id: 'sg-rockets-node',
      fromId: 'mlrs-1',
      toId: 'bridge-1',
      side: 'adversary',
      label: 'SAMPLE rocket battery toward the corridor node',
    },
    {
      id: 'sg-mech-defense',
      fromId: 'ifv-1',
      toId: 'sg-partner-inf',
      side: 'adversary',
      label: 'SAMPLE mech section toward the corridor defense section',
    },
    {
      id: 'sg-defense-armor',
      fromId: 'sg-partner-inf',
      toId: 'tank-1',
      side: 'friendly',
      label: 'SAMPLE corridor defense toward the armor platoon',
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
