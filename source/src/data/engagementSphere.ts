import type { VehicleCategoryId, VehicleHolding } from '../types';
import { SAMPLE_PLATFORM } from './orbat';

export type SphereModelId = 'mbt' | 'fighter' | 'vessel';

export type WeakPointConfidence = 'known' | 'believed';

/**
 * Fictional armor note. Positions live next to the mesh in `src/sphere/*`
 * so the marker stays on the stylized hull.
 */
export interface ArmorWeakPoint {
  id: string;
  label: string;
  confidence: WeakPointConfidence;
  note: string;
}

export interface SphereModel {
  id: SphereModelId;
  title: string;
  kind: string;
  summary: string;
  weakPoints: ArmorWeakPoint[];
}

export interface SphereTarget {
  unitId: string;
  category: VehicleCategoryId;
  typeDesignation: string;
}

/**
 * Initial SAMPLE set. Aircraft is not a blanket mapping: ISR UAVs share the
 * aircraft category and do not use the fighter mesh.
 * Tanks and ships fall back by category so a new SAMPLE type still opens.
 */
const PLATFORM_MODEL: Record<string, SphereModelId> = {
  [SAMPLE_PLATFORM.t72b3]: 'mbt',
  [SAMPLE_PLATFORM.t80]: 'mbt',
  [SAMPLE_PLATFORM.fulcrum]: 'fighter',
  [SAMPLE_PLATFORM.corvette]: 'vessel',
};

const CATEGORY_MODEL: Partial<Record<VehicleCategoryId, SphereModelId>> = {
  tank: 'mbt',
  ship: 'vessel',
};

export const SPHERE_MODELS: Record<SphereModelId, SphereModel> = {
  mbt: {
    id: 'mbt',
    title: 'Main battle tank',
    kind: 'Land · stylized SAMPLE mesh',
    summary:
      'Class mesh shared by SAMPLE main battle tanks. Orbit for the glacis, turret roof, flanks, rear deck, and belly.',
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
  fighter: {
    id: 'fighter',
    title: 'Fighter / attack aircraft',
    kind: 'Air · stylized SAMPLE mesh',
    summary:
      'Class mesh for the SAMPLE fighter/attack holding. Nose, canopy, planform, tailpipes, and gear are distinct by view.',
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
  vessel: {
    id: 'vessel',
    title: 'Surface vessel',
    kind: 'Sea · stylized SAMPLE mesh',
    summary:
      'Class mesh for the SAMPLE surface combatant. Bow, bridge, stack, transom, and underhull are distinct by view.',
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
};

export function sphereModelForHolding(holding: VehicleHolding): SphereModel | null {
  const id = PLATFORM_MODEL[holding.typeDesignation] ?? CATEGORY_MODEL[holding.category];
  return id ? SPHERE_MODELS[id] : null;
}

export function sphereButtonId(holding: VehicleHolding): string {
  return `${holding.category}-${holding.typeDesignation}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
