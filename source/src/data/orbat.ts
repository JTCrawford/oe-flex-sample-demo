import type {
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
  artillery: 'Artillery',
  aircraft: 'Aircraft',
  ship: 'Ships',
};

const CATEGORY_ORDER: VehicleCategoryId[] = [
  'tank',
  'ifv',
  'artillery',
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
  fulcrum: 'Fulcrum analog (SAMPLE)',
  corvette: 'Corvette analog (SAMPLE)',
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

export function holding(
  category: VehicleCategoryId,
  typeDesignation: string,
  count: number,
): VehicleHolding {
  return { category, typeDesignation, count };
}

export function unitOrbat(input: Omit<UnitOrbat, 'sampleLabel'>): UnitOrbat {
  return { ...input, sampleLabel: 'SAMPLE' };
}

/** Unit pin whose map label is the standardized designation. */
export function forceMarker(
  marker: Omit<ThreatMarker, 'label'> & { orbat: UnitOrbat },
): ThreatMarker {
  return { ...marker, label: marker.orbat.designation };
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
