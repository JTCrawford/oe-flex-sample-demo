import type {
  ForceSide,
  ThreatMarker,
  UnitEchelon,
  UnitOrbat,
  VehicleCategoryId,
  VehicleHolding,
} from '../types';

/**
 * Standardized category labels. The order-of-battle panel reads this map;
 * adding a category is a catalog change, not a UI rewrite.
 *
 * Designation pattern: `SAMPLE {ordinal} {function} {echelon label}`
 * Type pattern: `{platform} (SAMPLE)` — fictional, not an ODIN extract.
 */
export const VEHICLE_CATEGORY_LABEL: Record<VehicleCategoryId, string> = {
  tank: 'Tanks',
  ifv: 'IFVs',
  ugv: 'UGVs',
  infantry: 'Infantry',
  artillery: 'Artillery',
  shorad: 'SHORAD',
  aircraft: 'Aircraft',
  ship: 'Ships',
};

const CATEGORY_ORDER: VehicleCategoryId[] = [
  'tank',
  'ifv',
  'ugv',
  'infantry',
  'artillery',
  'shorad',
  'aircraft',
  'ship',
];

export const ECHELON_LABEL: Record<UnitEchelon, string> = {
  section: 'Section',
  platoon: 'Platoon',
  company: 'Company',
  battery: 'Battery',
  flight: 'Flight',
  squadron: 'Squadron',
  'task-force': 'Task Force',
};

/** Shared SAMPLE platform names so pins do not invent ad-hoc type strings. */
export const SAMPLE_PLATFORM = {
  t72b3: 'T-72B3 (SAMPLE)',
  t80: 'T-80BVM analog (SAMPLE)',
  bmp2: 'BMP-2 (SAMPLE)',
  bm21: 'BM-21 Grad (SAMPLE)',
  orlan: 'Orlan-10 analog (SAMPLE)',
  fulcrum: 'MiG-29 Fulcrum (SAMPLE)',
  corvette: 'Gulf patrol corvette (SAMPLE)',
  tochkaTel: 'Tochka-U (SAMPLE)',
  iskanderTel: 'Iskander 9K720 (SAMPLE)',
  himars: 'M142 HIMARS (SAMPLE)',
  m270: 'M270 MLRS (SAMPLE)',
  magura: 'Magura V5 (SAMPLE)',
  liut: 'Liut UGV (SAMPLE)',
  verba: 'Verba 9K333 (SAMPLE)',
  su27: 'Su-27 Flanker (SAMPLE)',
  f22: 'F-22 Raptor (SAMPLE)',
  fa18: 'F/A-18 Hornet (SAMPLE)',
  btr4e: 'BTR-4E (SAMPLE)',
  dozorB: 'Dozor-B (SAMPLE)',
  novator: 'Novator (SAMPLE)',
  krazShrek: 'KrAZ Shrek (SAMPLE)',
  krazFiona: 'KrAZ Fiona (SAMPLE)',
  dismount: 'Dismount section (SAMPLE)',
  coastalCraft: 'Coastal craft (SAMPLE)',
  escortHull: 'Escort hull (SAMPLE)',
} as const;

export function categoryLabel(category: VehicleCategoryId): string {
  return VEHICLE_CATEGORY_LABEL[category];
}

export function sampleDesignation(
  ordinal: string,
  functionName: string,
  echelon: UnitEchelon,
): string {
  return `SAMPLE ${ordinal} ${functionName} ${ECHELON_LABEL[echelon]}`;
}

/**
 * Vehicle meshes. Linked SRBM/ATACMS holdings do not set this — they open
 * `MunitionProfile.engagementSphereModelId` for the same catalog id.
 */
const PLATFORM_SPHERE_MODEL: Record<string, string> = {
  [SAMPLE_PLATFORM.t72b3]: 'sphere-mbt',
  [SAMPLE_PLATFORM.t80]: 'sphere-mbt',
  [SAMPLE_PLATFORM.fulcrum]: 'sphere-fighter',
  [SAMPLE_PLATFORM.corvette]: 'sphere-vessel',
  [SAMPLE_PLATFORM.magura]: 'sphere-magura',
  [SAMPLE_PLATFORM.liut]: 'sphere-liut',
  [SAMPLE_PLATFORM.verba]: 'sphere-verba',
  [SAMPLE_PLATFORM.su27]: 'sphere-su27',
  [SAMPLE_PLATFORM.f22]: 'sphere-f22',
  [SAMPLE_PLATFORM.fa18]: 'sphere-fa18',
  [SAMPLE_PLATFORM.btr4e]: 'sphere-btr-4e',
  [SAMPLE_PLATFORM.dozorB]: 'sphere-dozor-b',
  [SAMPLE_PLATFORM.novator]: 'sphere-novator',
  [SAMPLE_PLATFORM.krazShrek]: 'sphere-kraz-shrek',
  [SAMPLE_PLATFORM.krazFiona]: 'sphere-kraz-fiona',
  [SAMPLE_PLATFORM.dismount]: 'sphere-soldier',
  [SAMPLE_PLATFORM.coastalCraft]: 'sphere-vessel',
  [SAMPLE_PLATFORM.escortHull]: 'sphere-vessel',
};

const CATEGORY_SPHERE_MODEL: Partial<Record<VehicleCategoryId, string>> = {
  tank: 'sphere-mbt',
  ship: 'sphere-vessel',
};

export function holding(
  category: VehicleCategoryId,
  typeDesignation: string,
  count: number,
  linkedMunitionIds?: string[],
): VehicleHolding {
  const engagementSphereModelId =
    PLATFORM_SPHERE_MODEL[typeDesignation] ??
    (category === 'aircraft' ? undefined : CATEGORY_SPHERE_MODEL[category]);
  return {
    category,
    typeDesignation,
    count,
    ...(linkedMunitionIds && linkedMunitionIds.length > 0
      ? { linkedMunitionIds }
      : {}),
    ...(engagementSphereModelId ? { engagementSphereModelId } : {}),
  };
}

export function unitOrbat(input: Omit<UnitOrbat, 'sampleLabel'>): UnitOrbat {
  return { ...input, sampleLabel: 'SAMPLE' };
}

/** Partner and coalition formations are the blue side. Other ORBAT pins are red. */
export function sideForFormation(higherFormation: string): ForceSide {
  if (/partner|coalition/i.test(higherFormation)) return 'friendly';
  return 'adversary';
}

/** Unit pin whose map label is the standardized designation. */
export function forceMarker(
  marker: Omit<ThreatMarker, 'label'> & { orbat: UnitOrbat },
): ThreatMarker {
  return {
    ...marker,
    side: marker.side ?? sideForFormation(marker.orbat.higherFormation),
    label: marker.orbat.designation,
  };
}

export function holdingsInCatalogOrder(vehicles: VehicleHolding[]): VehicleHolding[] {
  const rank = new Map(CATEGORY_ORDER.map((id, index) => [id, index]));
  return [...vehicles]
    .filter((row) => row.count > 0)
    .sort(
      (a, b) =>
        (rank.get(a.category) ?? CATEGORY_ORDER.length) -
        (rank.get(b.category) ?? CATEGORY_ORDER.length),
    );
}

export function vehicleTotal(orbat: UnitOrbat): number {
  return orbat.vehicles.reduce((sum, row) => sum + (row.count > 0 ? row.count : 0), 0);
}

/** One line of non-zero category totals, labels from the catalog. */
export function orbatCountSummary(orbat: UnitOrbat): string {
  const totals = new Map<VehicleCategoryId, number>();
  for (const row of orbat.vehicles) {
    if (row.count <= 0) continue;
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.count);
  }
  return CATEGORY_ORDER.filter((id) => totals.has(id))
    .map((id) => `${VEHICLE_CATEGORY_LABEL[id]} ${totals.get(id)}`)
    .join(' · ');
}
