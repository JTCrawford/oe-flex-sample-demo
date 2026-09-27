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

export interface SphereFact {
  label: string;
  value: string;
}

/** Janes-style facts shown beside the orthographic plates. */
export interface SphereBriefing {
  designation: string;
  role: string;
  propulsion: string;
  munition: string;
  dimensions: SphereFact[];
  /** Honest limit of the license-clear mesh. Not the dialog title. */
  fidelity: string;
}

export interface SphereModel {
  id: SphereModelId;
  /** Exact vehicle name. Primary title in the dialog. */
  title: string;
  /** Exact designation line under the title. */
  analog: string;
  kind: string;
  summary: string;
  weakPoints: ArmorWeakPoint[];
  briefing: SphereBriefing;
}

export const PLATE_VIEWS: { id: 'side' | 'front' | 'top' | 'under'; label: string }[] = [
  { id: 'side', label: 'Side' },
  { id: 'front', label: 'Front' },
  { id: 'top', label: 'Top' },
  { id: 'under', label: 'Undercarriage' },
];

export function plateFile(id: SphereModelId, view: string): string {
  return `${id}-${view}.png`;
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
    note: 'SAMPLE: nose fairing on this round. Not a real assessment.',
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

const FIDELITY =
  'Original recognition mesh in this repo, built to published general arrangement and rendered for these plates. Not a photograph, scan, or third-party CAD. Fictional SAMPLE weak points are overlays, not an assessment.';

function srbmModel(
  id: SphereModelId,
  title: string,
  analog: string,
  summary: string,
  briefing: SphereBriefing,
): SphereModel {
  return {
    id,
    title,
    analog,
    kind: 'Launcher',
    summary,
    weakPoints: SRBM_POINTS,
    briefing,
  };
}

export const SPHERE_MODELS: Record<SphereModelId, SphereModel> = {
  'sphere-mbt': {
    id: 'sphere-mbt',
    title: 'T-72B3',
    analog: 'T-72B / T-72B3',
    kind: 'Land · main battle tank',
    summary:
      'Ukraine East SAMPLE armor opens this T-72B3 mesh (low turret, six road wheels, Kontakt-5 cheeks, Sosna-U housing). T-80 rows in this ORBAT use the same mesh until a separate id exists. Orbit the glacis, turret roof, flanks, rear deck, and belly.',
    briefing: {
      designation: 'T-72B3',
      role: 'Main battle tank',
      propulsion: 'V-92S2F diesel, 1,130 hp (public B3-family figure; sub-variants differ)',
      munition: '125 mm 2A46M-5 smoothbore, autoloader',
      dimensions: [
        { label: 'Length, gun forward', value: '9.53 m' },
        { label: 'Width', value: '3.59 m' },
        { label: 'Height', value: '2.19 m' },
        { label: 'Combat weight', value: '46.5 t' },
        { label: 'Crew', value: '3' },
      ],
      fidelity: FIDELITY,
    },
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
    title: 'MiG-29 Fulcrum',
    analog: 'MiG-29 (9.12 / 9.13)',
    kind: 'Air · fighter',
    summary:
      'Hormuz SAMPLE strike flight. Twin tails, twin RD-33 nozzles, LERX louvers, and gear down. Nose, canopy, planform, and belly are distinct by view.',
    briefing: {
      designation: 'MiG-29 Fulcrum',
      role: 'Air-superiority fighter',
      propulsion: '2 × Klimov RD-33 turbofan',
      munition: 'SAMPLE stores on the wings. Not a loadout assessment.',
      dimensions: [
        { label: 'Length', value: '17.32 m' },
        { label: 'Wingspan', value: '11.36 m' },
        { label: 'Height', value: '4.73 m' },
      ],
      fidelity: FIDELITY,
    },
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
    title: 'Gulf patrol corvette',
    analog: 'Gulf patrol corvette',
    kind: 'Sea · patrol corvette',
    summary:
      'Hormuz SAMPLE patrol squadron. Forecastile gun, bridge, mast, funnel, waist canisters, flight deck, and waterjets. The ORBAT row does not name a pennant class.',
    briefing: {
      designation: 'Gulf patrol corvette',
      role: 'Patrol corvette',
      propulsion: 'Diesel and waterjet, typical of this size band',
      munition: 'Waist canister launchers, SAMPLE placement. Not a fitted-weapon assessment.',
      dimensions: [
        { label: 'Length', value: 'about 71 m' },
        { label: 'Beam', value: 'about 11 m' },
        { label: 'Draft', value: 'about 2.8 m' },
      ],
      fidelity: `${FIDELITY} Size follows the published Gulf patrol-corvette band. This SAMPLE row is not a named navy hull.`,
    },
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
    '9P129 Tochka-U',
    '9K79-1 Tochka-U TEL',
    'Amphibious 6×6 TEL with the 9M79-class round elevated. Same mesh id as catalog tochka-u.',
    {
      designation: '9P129 Tochka-U TEL',
      role: 'Transporter-erector-launcher',
      propulsion: 'BAZ-5921 6×6 amphibious',
      munition: '9M79-1 Tochka-U (SS-21). Catalog tochka-u, cited 70–120 km.',
      dimensions: [
        { label: 'TEL length', value: 'about 9.5 m' },
        { label: 'Missile length', value: 'about 6.4 m' },
        { label: 'Cited range', value: '70–120 km' },
      ],
      fidelity: FIDELITY,
    },
  ),
  'sphere-iskander-m': srbmModel(
    'sphere-iskander-m',
    '9P78-1 Iskander-M',
    '9K720 Iskander-M TEL',
    '8×8 TEL with one closed canister and one exposed 9M723-class round. Same mesh id as catalog iskander-m.',
    {
      designation: '9P78-1 Iskander-M TEL',
      role: 'Transporter-erector-launcher',
      propulsion: 'MZKT-7930 8×8',
      munition: '9M723 Iskander-M (SS-26). Catalog iskander-m. Export cites near 280 km; domestic cites near 500 km.',
      dimensions: [
        { label: 'Missile length', value: '7.3 m' },
        { label: 'Missile diameter', value: '0.92 m' },
        { label: 'TEL, loaded', value: 'about 42–43 t' },
        { label: 'Cited range', value: '280 km and 500 km bounds' },
      ],
      fidelity: FIDELITY,
    },
  ),
  'sphere-atacms-block-i': srbmModel(
    'sphere-atacms-block-i',
    'M142 HIMARS',
    'M142 HIMARS · ATACMS Block I',
    'FMTV 6×6 with one pod and an ATACMS Block I round erected. Same mesh id as catalog atacms-block-i.',
    {
      designation: 'M142 HIMARS',
      role: 'Wheeled rocket launcher',
      propulsion: 'FMTV 6×6 diesel',
      munition: 'ATACMS Block I (MGM-140), one round in the MFOM pod. Catalog atacms-block-i, cited 25–165 km.',
      dimensions: [
        { label: 'Length', value: '7 m' },
        { label: 'Width', value: '2.4 m' },
        { label: 'Height', value: '3.2 m' },
        { label: 'Weight', value: 'about 16.2 t' },
        { label: 'Cited range', value: '25–165 km' },
      ],
      fidelity: FIDELITY,
    },
  ),
  'sphere-atacms-later-block': srbmModel(
    'sphere-atacms-later-block',
    'M270 MLRS',
    'M270 MLRS · later-block ATACMS',
    'Tracked launcher, two pods, one later-block round erected. Same mesh id as catalog atacms-later-block.',
    {
      designation: 'M270 MLRS',
      role: 'Tracked rocket launcher',
      propulsion: 'Tracked, Cummins VTA-903 diesel',
      munition: 'Later-block ATACMS from the starboard pod. Catalog atacms-later-block, cited 70–300 km.',
      dimensions: [
        { label: 'Length', value: 'about 6.9 m' },
        { label: 'Width', value: 'about 3.0 m' },
        { label: 'Height', value: 'about 2.6 m' },
        { label: 'Cited range', value: '70–300 km' },
      ],
      fidelity: FIDELITY,
    },
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
