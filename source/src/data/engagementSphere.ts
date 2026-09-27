import type { VehicleHolding } from '../types';
import { munitionProfileById } from './munitionCatalog';

/**
 * Public CC0 GLB / plate files under `models/`. New catalog ids may render one
 * of these until an optimized private embed exists.
 */
export type SphereRenderMeshId =
  | 'sphere-mbt'
  | 'sphere-fighter'
  | 'sphere-vessel'
  | 'sphere-tochka-u'
  | 'sphere-iskander-m'
  | 'sphere-atacms-block-i'
  | 'sphere-atacms-later-block';

/**
 * Stable catalog ids. Vehicle profiles and munition profiles both use these.
 * `sphere-tochka-u` / `tochka-u` and `sphere-iskander-m` / `iskander-m` are the
 * existing Ukraine East TEL ids (the GLB filenames). Later platforms add their
 * own ids and may still render a file from `SphereRenderMeshId`.
 */
export type SphereModelId =
  | SphereRenderMeshId
  | 'sphere-magura'
  | 'sphere-liut'
  | 'sphere-verba'
  | 'sphere-su27'
  | 'sphere-f22'
  | 'sphere-fa18'
  | 'sphere-btr-4e'
  | 'sphere-dozor-b'
  | 'sphere-novator'
  | 'sphere-kraz-shrek'
  | 'sphere-kraz-fiona';

export type SphereGeometryStatus = 'cc0-recognition' | 'licensed-pending-embed';

/** Which public file the sticky demo fetches, and where a purchased pack lives. */
export interface SphereGeometry {
  status: SphereGeometryStatus;
  /** CC0 file served from `models/<renderMeshId>.glb` and the matching plates. */
  renderMeshId: SphereRenderMeshId;
  /**
   * Directory under the authoring Mac `models/skins/` tree. Absent when no
   * pack has been purchased. Never a public URL.
   */
  macPack?: string;
}

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
  geometry: SphereGeometry;
}

export const PLATE_VIEWS: { id: 'side' | 'front' | 'top' | 'under'; label: string }[] = [
  { id: 'side', label: 'Side' },
  { id: 'front', label: 'Front' },
  { id: 'top', label: 'Top' },
  { id: 'under', label: 'Undercarriage' },
];

export function plateFile(id: SphereModelId, view: string): string {
  return `${renderMeshId(id)}-${view}.png`;
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
  'Original recognition mesh in this repo, built to published general arrangement. OE skins are original camouflage textures in this repo, not scans of issued fabric. Not a photograph, scan, or third-party CAD. Fictional SAMPLE weak points are overlays, not an assessment.';

const PENDING_EMBED =
  'Licensed geometry is Mac-local and pending an optimized private embed. This public viewer keeps the CC0 recognition mesh.';

function cc0Geometry(renderMeshId: SphereRenderMeshId): SphereGeometry {
  return { status: 'cc0-recognition', renderMeshId };
}

function pendingGeometry(
  renderMeshId: SphereRenderMeshId,
  macPack: string,
): SphereGeometry {
  return { status: 'licensed-pending-embed', renderMeshId, macPack };
}

function pendingFidelity(mesh: SphereRenderMeshId, standIn: boolean): string {
  const line = standIn ? `Public stand-in mesh: ${mesh}.` : `Public mesh: ${mesh}.`;
  return `${FIDELITY} ${PENDING_EMBED} ${line}`;
}

function standInPoints(points: ArmorWeakPoint[]): ArmorWeakPoint[] {
  return points.map((point) => ({
    ...point,
    note: `${point.note} Marker sits on the CC0 stand-in mesh.`,
  }));
}

/** Anchor ids on `sphere-mbt`. Shared by ground stand-ins. */
const LAND_STAND_IN: ArmorWeakPoint[] = [
  {
    id: 'rear-deck',
    label: 'Rear deck grille',
    confidence: 'known',
    note: 'SAMPLE: open engine-deck mesh on the CC0 T-72B3 stand-in.',
  },
  {
    id: 'turret-ring',
    label: 'Turret ring, port',
    confidence: 'known',
    note: 'SAMPLE: shot trap on the CC0 T-72B3 stand-in.',
  },
  {
    id: 'driver-port',
    label: 'Driver vision block',
    confidence: 'known',
    note: 'SAMPLE: vision block on the CC0 T-72B3 stand-in.',
  },
  {
    id: 'belly',
    label: 'Belly plate',
    confidence: 'believed',
    note: 'SAMPLE: believed belly plate on the CC0 T-72B3 stand-in.',
  },
  {
    id: 'skirt-gap',
    label: 'Skirt gap, starboard',
    confidence: 'believed',
    note: 'SAMPLE: believed skirt gap on the CC0 T-72B3 stand-in.',
  },
];

/** Anchor ids on `sphere-fighter`. Shared by the fighter-set stand-ins. */
const AIR_STAND_IN: ArmorWeakPoint[] = [
  {
    id: 'nozzles',
    label: 'Exhaust nozzles',
    confidence: 'known',
    note: 'SAMPLE: hot section on the CC0 MiG-29 stand-in.',
  },
  {
    id: 'canopy',
    label: 'Canopy',
    confidence: 'known',
    note: 'SAMPLE: framed canopy on the CC0 MiG-29 stand-in.',
  },
  {
    id: 'wing-root',
    label: 'Wing root, starboard',
    confidence: 'believed',
    note: 'SAMPLE: believed wing root on the CC0 MiG-29 stand-in.',
  },
  {
    id: 'gear-bay',
    label: 'Gear bay',
    confidence: 'believed',
    note: 'SAMPLE: believed gear bay on the CC0 MiG-29 stand-in.',
  },
];

const ARMOR_PACK = 'ukrainian-armored-vehicles';

function armoredVehicle(
  id: SphereModelId,
  title: string,
  analog: string,
  role: string,
  summary: string,
  dimensions: SphereFact[],
): SphereModel {
  return {
    id,
    title,
    analog,
    kind: 'Land · Ukrainian armored vehicle',
    summary: `${summary} The public mesh is the CC0 T-72B3 until that vehicle's embed exists.`,
    weakPoints: standInPoints(LAND_STAND_IN),
    geometry: pendingGeometry('sphere-mbt', ARMOR_PACK),
    briefing: {
      designation: title,
      role,
      propulsion: 'Wheeled, diesel (SAMPLE band)',
      munition: 'SAMPLE turret or remote weapon. Not a fitted-weapon assessment.',
      dimensions,
      fidelity: pendingFidelity('sphere-mbt', true),
    },
  };
}

function srbmModel(
  id: SphereModelId,
  title: string,
  analog: string,
  summary: string,
  briefing: SphereBriefing,
  geometry: SphereGeometry,
): SphereModel {
  return {
    id,
    title,
    analog,
    kind: 'Launcher',
    summary,
    weakPoints: SRBM_POINTS,
    briefing,
    geometry,
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
    geometry: cc0Geometry('sphere-mbt'),
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
      'MiG-29 Fulcrum in the fighter set (with Su-27 on the Ukraine East partner flight, and F-22 / F/A-18 as Hormuz bonus airframes). Twin tails, twin RD-33 nozzles, LERX louvers, and gear down. Nose, canopy, planform, and belly are distinct by view.',
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
      fidelity: pendingFidelity('sphere-fighter', false),
    },
    geometry: pendingGeometry('sphere-fighter', 'fighters/asset-military-fighter'),
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
    geometry: cc0Geometry('sphere-vessel'),
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
    '9K79-1 Tochka-U · 9P129 TEL',
    'Tochka-U on the Ukraine East OPFOR missile battery. Amphibious 6×6 TEL with the 9M79-class round elevated. Catalog id tochka-u. Sphere id sphere-tochka-u.',
    {
      designation: 'Tochka-U',
      role: 'Transporter-erector-launcher',
      propulsion: 'BAZ-5921 6×6 amphibious',
      munition: '9M79-1 Tochka-U (SS-21). Catalog tochka-u, cited 70–120 km.',
      dimensions: [
        { label: 'TEL length', value: 'about 9.5 m' },
        { label: 'Missile length', value: 'about 6.4 m' },
        { label: 'Cited range', value: '70–120 km' },
      ],
      fidelity: pendingFidelity('sphere-tochka-u', false),
    },
    pendingGeometry('sphere-tochka-u', 'tochka-u'),
  ),
  'sphere-iskander-m': srbmModel(
    'sphere-iskander-m',
    'Iskander 9K720',
    '9K720 Iskander-M · 9P78-1 TEL',
    'Iskander 9K720 on the same Ukraine East OPFOR missile battery. 8×8 TEL with one closed canister and one exposed 9M723-class round. Catalog id iskander-m. Sphere id sphere-iskander-m.',
    {
      designation: 'Iskander 9K720',
      role: 'Transporter-erector-launcher',
      propulsion: 'MZKT-7930 8×8',
      munition: '9M723 Iskander-M (SS-26). Catalog iskander-m. Export cites near 280 km; domestic cites near 500 km.',
      dimensions: [
        { label: 'Missile length', value: '7.3 m' },
        { label: 'Missile diameter', value: '0.92 m' },
        { label: 'TEL, loaded', value: 'about 42–43 t' },
        { label: 'Cited range', value: '280 km and 500 km bounds' },
      ],
      fidelity: pendingFidelity('sphere-iskander-m', false),
    },
    pendingGeometry('sphere-iskander-m', 'iskander-9k720'),
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
    cc0Geometry('sphere-atacms-block-i'),
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
    cc0Geometry('sphere-atacms-later-block'),
  ),
  'sphere-magura': {
    id: 'sphere-magura',
    title: 'Magura V5',
    analog: 'Magura V5 USV',
    kind: 'Sea · uncrewed surface vessel',
    summary:
      'Ukraine East Black Sea USV group. Naval grey is the auto skin. The public mesh is the CC0 Gulf patrol corvette until a Magura embed exists.',
    briefing: {
      designation: 'Magura V5',
      role: 'Uncrewed surface vessel',
      propulsion: 'Surface drive, small-boat band',
      munition: 'SAMPLE one-way USV payload. Not a fitted-weapon assessment.',
      dimensions: [
        { label: 'Length', value: 'about 5.5 m' },
        { label: 'Beam', value: 'about 1.5 m' },
        { label: 'Role', value: 'Black Sea USV' },
      ],
      fidelity: pendingFidelity('sphere-vessel', true),
    },
    geometry: pendingGeometry('sphere-vessel', 'magura-v5'),
    weakPoints: standInPoints([
      {
        id: 'bridge',
        label: 'Bridge windows',
        confidence: 'known',
        note: 'SAMPLE: window band on the CC0 corvette stand-in.',
      },
      {
        id: 'funnel',
        label: 'Funnel uptake',
        confidence: 'known',
        note: 'SAMPLE: exhaust opening on the CC0 corvette stand-in.',
      },
      {
        id: 'keel',
        label: 'Keel',
        confidence: 'believed',
        note: 'SAMPLE: believed plating on the CC0 corvette stand-in.',
      },
      {
        id: 'magazine',
        label: 'Aft magazine',
        confidence: 'believed',
        note: 'SAMPLE: believed aft compartment on the CC0 corvette stand-in.',
      },
    ]),
  },
  'sphere-liut': {
    id: 'sphere-liut',
    title: 'Liut UGV',
    analog: 'Liut unmanned ground vehicle',
    kind: 'Land · UGV',
    summary:
      'Ukrainian ground UGV on the Ukraine East partner group. Auto skin is Ukrainian digital. Temperate woodland stays on the picker. The public mesh is the CC0 T-72B3 until a Liut embed exists.',
    briefing: {
      designation: 'Liut UGV',
      role: 'Unmanned ground vehicle',
      propulsion: 'Tracked or wheeled UGV band (SAMPLE)',
      munition: 'SAMPLE remote weapon or cargo fit. Not a loadout assessment.',
      dimensions: [
        { label: 'Class', value: 'small UGV' },
        { label: 'Crew', value: 'uncrewed' },
      ],
      fidelity: pendingFidelity('sphere-mbt', true),
    },
    geometry: pendingGeometry('sphere-mbt', 'liut-ugv'),
    weakPoints: standInPoints(LAND_STAND_IN),
  },
  'sphere-verba': {
    id: 'sphere-verba',
    title: 'Verba 9K333',
    analog: '9K333 Verba MANPADS',
    kind: 'Land · MANPADS / SHORAD',
    summary:
      'MANPADS / SHORAD on the Ukraine East partner group. Catalog id verba. Auto skin is Ukrainian digital. The public mesh is the CC0 T-72B3 until a Verba embed exists. SAMPLE had no MANPADS row before this entry.',
    briefing: {
      designation: 'Verba 9K333',
      role: 'Man-portable air defense',
      propulsion: 'Shoulder-fired, dismounted team',
      munition: '9K333 Verba. Catalog verba, cited about 0.5–6 km.',
      dimensions: [
        { label: 'Cited range', value: '0.5–6 km' },
        { label: 'Class', value: 'MANPADS' },
      ],
      fidelity: pendingFidelity('sphere-mbt', true),
    },
    geometry: pendingGeometry('sphere-mbt', 'manpads/verba'),
    weakPoints: standInPoints(LAND_STAND_IN),
  },
  'sphere-su27': {
    id: 'sphere-su27',
    title: 'Su-27 Flanker',
    analog: 'Su-27 Flanker',
    kind: 'Air · fighter',
    summary:
      'Ukraine East partner fighter flight, with the MiG-29. The public mesh is the CC0 MiG-29 until a Flanker embed exists.',
    briefing: {
      designation: 'Su-27 Flanker',
      role: 'Air-superiority fighter',
      propulsion: '2 × Saturn AL-31F turbofan',
      munition: 'SAMPLE stores. Not a loadout assessment.',
      dimensions: [
        { label: 'Length', value: '21.9 m' },
        { label: 'Wingspan', value: '14.7 m' },
        { label: 'Height', value: '5.9 m' },
      ],
      fidelity: pendingFidelity('sphere-fighter', true),
    },
    geometry: pendingGeometry('sphere-fighter', 'fighters/asset-military-fighter'),
    weakPoints: standInPoints(AIR_STAND_IN),
  },
  'sphere-f22': {
    id: 'sphere-f22',
    title: 'F-22 Raptor',
    analog: 'F-22 Raptor',
    kind: 'Air · fighter',
    summary:
      'Bonus airframe on the Hormuz coalition flight. Desert tan is the auto skin in that AO. The public mesh is the CC0 MiG-29 until an F-22 embed exists.',
    briefing: {
      designation: 'F-22 Raptor',
      role: 'Air-superiority fighter',
      propulsion: '2 × Pratt & Whitney F119 turbofan',
      munition: 'SAMPLE internal stores. Not a loadout assessment.',
      dimensions: [
        { label: 'Length', value: '18.9 m' },
        { label: 'Wingspan', value: '13.6 m' },
        { label: 'Height', value: '5.1 m' },
      ],
      fidelity: pendingFidelity('sphere-fighter', true),
    },
    geometry: pendingGeometry('sphere-fighter', 'fighters/asset-military-fighter'),
    weakPoints: standInPoints(AIR_STAND_IN),
  },
  'sphere-fa18': {
    id: 'sphere-fa18',
    title: 'F/A-18 Hornet',
    analog: 'F/A-18 Hornet',
    kind: 'Air · fighter',
    summary:
      'Bonus airframe beside the F-22 on the Hormuz coalition flight. The public mesh is the CC0 MiG-29 until an F/A-18 embed exists.',
    briefing: {
      designation: 'F/A-18 Hornet',
      role: 'Carrier-capable fighter',
      propulsion: '2 × General Electric F404 turbofan',
      munition: 'SAMPLE wing stores. Not a loadout assessment.',
      dimensions: [
        { label: 'Length', value: '17.1 m' },
        { label: 'Wingspan', value: '12.3 m' },
        { label: 'Height', value: '4.7 m' },
      ],
      fidelity: pendingFidelity('sphere-fighter', true),
    },
    geometry: pendingGeometry('sphere-fighter', 'fighters/asset-military-fighter'),
    weakPoints: standInPoints(AIR_STAND_IN),
  },
  'sphere-btr-4e': armoredVehicle(
    'sphere-btr-4e',
    'BTR-4E',
    'BTR-4E',
    'Wheeled infantry fighting vehicle',
    'BTR-4E in the Ukraine East partner armored group. Auto skin is Ukrainian digital. Temperate woodland stays on the picker.',
    [
      { label: 'Length', value: 'about 7.7 m' },
      { label: 'Width', value: 'about 2.9 m' },
      { label: 'Crew + dismounts', value: '3 + 7' },
    ],
  ),
  'sphere-dozor-b': armoredVehicle(
    'sphere-dozor-b',
    'Dozor-B',
    'Dozor-B',
    'Light armored car',
    'Dozor-B in the Ukraine East partner armored group. Same skin rule as the BTR-4E.',
    [
      { label: 'Length', value: 'about 5.4 m' },
      { label: 'Width', value: 'about 2.4 m' },
      { label: 'Crew', value: 'up to 8, including dismounts' },
    ],
  ),
  'sphere-novator': armoredVehicle(
    'sphere-novator',
    'Novator',
    'Novator',
    'Light armored vehicle',
    'Novator in the Ukraine East partner armored group. Same skin rule as the BTR-4E.',
    [
      { label: 'Class', value: 'light armored' },
      { label: 'Role', value: 'patrol / protected mobility' },
    ],
  ),
  'sphere-kraz-shrek': armoredVehicle(
    'sphere-kraz-shrek',
    'KrAZ Shrek',
    'KrAZ Shrek',
    'Mine-resistant ambush protected',
    'KrAZ Shrek in the Ukraine East partner armored group, with the KrAZ Fiona. Same skin rule as the BTR-4E.',
    [
      { label: 'Class', value: 'MRAP' },
      { label: 'Family', value: 'KrAZ Shrek / Fiona' },
    ],
  ),
  'sphere-kraz-fiona': armoredVehicle(
    'sphere-kraz-fiona',
    'KrAZ Fiona',
    'KrAZ Fiona',
    'Mine-resistant ambush protected',
    'KrAZ Fiona in the Ukraine East partner armored group, beside the KrAZ Shrek. Same skin rule as the BTR-4E.',
    [
      { label: 'Class', value: 'MRAP' },
      { label: 'Family', value: 'KrAZ Shrek / Fiona' },
    ],
  ),
};

export function sphereModelById(id: string | undefined): SphereModel | null {
  if (!id) return null;
  return SPHERE_MODELS[id as SphereModelId] ?? null;
}

/** CC0 file the viewer fetches for this catalog id. */
export function renderMeshId(id: SphereModelId): SphereRenderMeshId {
  return SPHERE_MODELS[id].geometry.renderMeshId;
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
