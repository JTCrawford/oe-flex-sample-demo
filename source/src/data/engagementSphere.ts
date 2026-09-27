import type { VehicleHolding } from '../types';
import { munitionProfileById } from './munitionCatalog';

/**
 * Stable mesh ids. Vehicle profiles use `sphere-mbt`, `sphere-fighter`, and
 * `sphere-vessel`. Munition profiles use the catalog's `engagementSphereModelId`
 * (`sphere-tochka-u`, `sphere-iskander-m`, `sphere-atacms-block-i`,
 * `sphere-atacms-later-block`).
 */
export type SphereModelId =
  | 'sphere-mbt'
  | 'sphere-fighter'
  | 'sphere-vessel'
  | 'sphere-tochka-u'
  | 'sphere-iskander-m'
  | 'sphere-atacms-block-i'
  | 'sphere-atacms-later-block';

export type WeakPointConfidence = 'known' | 'believed';

export interface ArmorWeakPoint {
  id: string;
  label: string;
  confidence: WeakPointConfidence;
  note: string;
}

export interface SphereModel {
  id: SphereModelId;
  title: string;
  /** Short SAMPLE-analog label shown in the viewer. */
  analog: string;
  kind: string;
  summary: string;
  weakPoints: ArmorWeakPoint[];
}

export interface SphereTarget {
  /** Set when the sphere was opened from a unit pin. Null for a strike catalog row. */
  unitId: string | null;
  modelId: SphereModelId;
  label: string;
}

const SRBM_POINTS: ArmorWeakPoint[] = [
  {
    id: 'seeker',
    label: 'Nose fairing',
    confidence: 'known',
    note: 'SAMPLE: nose fairing on this analog round. Not a real assessment.',
  },
  {
    id: 'nozzle',
    label: 'Tail nozzle',
    confidence: 'known',
    note: 'SAMPLE: nozzle at the tail of the round.',
  },
  {
    id: 'joint',
    label: 'Mid-body joint',
    confidence: 'believed',
    note: 'SAMPLE: believed joint near mid-body. Not confirmed in this dataset.',
  },
  {
    id: 'fin-root',
    label: 'Fin root',
    confidence: 'believed',
    note: 'SAMPLE: believed fin root. Analyst estimate only.',
  },
];

function srbmModel(
  id: SphereModelId,
  title: string,
  analog: string,
  summary: string,
): SphereModel {
  return {
    id,
    title,
    analog,
    kind: 'Munition · photoreal SAMPLE analog',
    summary,
    weakPoints: SRBM_POINTS,
  };
}

export const SPHERE_MODELS: Record<SphereModelId, SphereModel> = {
  'sphere-mbt': {
    id: 'sphere-mbt',
    title: 'Main battle tank',
    analog: 'T-72/T-80 family SAMPLE analog',
    kind: 'Land · photoreal SAMPLE analog',
    summary:
      'Original photoreal model shared by SAMPLE T-72 and T-80 holdings. Orbit for the glacis, turret roof, flanks, rear deck, and belly.',
    weakPoints: [
      {
        id: 'rear-deck',
        label: 'Rear deck grille',
        confidence: 'known',
        note: 'SAMPLE: open engine-deck mesh on the rear slope.',
      },
      {
        id: 'turret-ring',
        label: 'Turret ring, port',
        confidence: 'known',
        note: 'SAMPLE: shot trap where the turret meets the hull.',
      },
      {
        id: 'driver-port',
        label: 'Driver vision block',
        confidence: 'known',
        note: 'SAMPLE: vision block on the glacis.',
      },
      {
        id: 'belly',
        label: 'Belly plate',
        confidence: 'believed',
        note: 'SAMPLE: believed thin plate under the fighting compartment. Not confirmed in this dataset.',
      },
      {
        id: 'skirt-gap',
        label: 'Skirt gap, starboard',
        confidence: 'believed',
        note: 'SAMPLE: believed gap above the road wheels. Analyst estimate only.',
      },
    ],
  },
  'sphere-fighter': {
    id: 'sphere-fighter',
    title: 'Fighter / attack aircraft',
    analog: 'Fulcrum-family SAMPLE analog',
    kind: 'Air · photoreal SAMPLE analog',
    summary:
      'Original twin-tail, twin-engine photoreal analog for the SAMPLE fighter/attack holding. Nose, canopy, planform, nozzles, and gear are distinct by view.',
    weakPoints: [
      {
        id: 'nozzles',
        label: 'Exhaust nozzles',
        confidence: 'known',
        note: 'SAMPLE: hot section at the tailpipes.',
      },
      {
        id: 'canopy',
        label: 'Canopy',
        confidence: 'known',
        note: 'SAMPLE: framed transparency over the cockpit.',
      },
      {
        id: 'wing-root',
        label: 'Wing root, starboard',
        confidence: 'believed',
        note: 'SAMPLE: believed joint where the wing meets the fuselage.',
      },
      {
        id: 'gear-bay',
        label: 'Gear bay',
        confidence: 'believed',
        note: 'SAMPLE: believed unarmored doors on the belly. Estimate only.',
      },
    ],
  },
  'sphere-vessel': {
    id: 'sphere-vessel',
    title: 'Surface vessel',
    analog: 'Corvette-class SAMPLE analog',
    kind: 'Sea · photoreal SAMPLE analog',
    summary:
      'Original photoreal corvette-class analog. Bow, bridge, funnel, flight deck, and underhull are distinct by view.',
    weakPoints: [
      {
        id: 'bridge',
        label: 'Bridge windows',
        confidence: 'known',
        note: 'SAMPLE: window band on the forward face of the bridge.',
      },
      {
        id: 'funnel',
        label: 'Funnel uptake',
        confidence: 'known',
        note: 'SAMPLE: exhaust opening on the stack.',
      },
      {
        id: 'keel',
        label: 'Keel',
        confidence: 'believed',
        note: 'SAMPLE: believed plating along the underhull centerline.',
      },
      {
        id: 'magazine',
        label: 'Aft magazine',
        confidence: 'believed',
        note: 'SAMPLE: believed compartment below the waterline, aft. Estimate only.',
      },
    ],
  },
  'sphere-tochka-u': srbmModel(
    'sphere-tochka-u',
    'Tochka-U',
    'Tochka-U TEL SAMPLE analog',
    'Original photoreal 6x6 TEL with an elevated round for catalog id tochka-u. Same mesh id as the linked munition card.',
  ),
  'sphere-iskander-m': srbmModel(
    'sphere-iskander-m',
    'Iskander-M',
    'Iskander-M TEL SAMPLE analog',
    'Original photoreal 8x8 TEL with one exposed round and one closed canister for catalog id iskander-m. Same mesh id as the linked munition card.',
  ),
  'sphere-atacms-block-i': srbmModel(
    'sphere-atacms-block-i',
    'ATACMS Block I',
    'HIMARS-class / ATACMS Block I SAMPLE analog',
    'Original photoreal wheeled HIMARS-class launcher with a short Block I round for catalog id atacms-block-i. Same mesh id as the linked munition card.',
  ),
  'sphere-atacms-later-block': srbmModel(
    'sphere-atacms-later-block',
    'ATACMS later block',
    'M270 / later-block ATACMS SAMPLE analog',
    'Original photoreal tracked MLRS-class launcher with a longer SAMPLE round for catalog id atacms-later-block. Same mesh id as the linked munition card.',
  ),
};

export function sphereModelById(id: string | undefined): SphereModel | null {
  if (!id) return null;
  return SPHERE_MODELS[id as SphereModelId] ?? null;
}

/** Vehicle mesh id, or the first linked catalog munition's sphere id. */
export function resolveSphereModelId(holding: VehicleHolding): string | null {
  if (holding.engagementSphereModelId) return holding.engagementSphereModelId;
  const linkedId = holding.linkedMunitionIds?.[0];
  if (!linkedId) return null;
  return munitionProfileById(linkedId)?.engagementSphereModelId ?? null;
}

export function sphereModelForHolding(holding: VehicleHolding): SphereModel | null {
  return sphereModelById(resolveSphereModelId(holding) ?? undefined);
}

export function sphereButtonId(holding: VehicleHolding): string {
  return `${holding.category}-${holding.typeDesignation}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
