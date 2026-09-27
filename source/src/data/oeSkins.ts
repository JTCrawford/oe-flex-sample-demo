import type { SphereModelId } from './engagementSphere';

/**
 * Operational-environment camouflage. Each skin is an original pattern
 * (see ATTRIBUTION.md). Drop a replacement in `models/skins/<oe-id>/`
 * and name it from that folder's `index.json`.
 */
export interface OeSkin {
  id: string;
  label: string;
  /** Shown on the picker. Names the doctrine family without claiming a copied pattern. */
  summary: string;
  /**
   * Folders under `models/skins/` that carry this pattern.
   * The open AO wins when it is listed, so a later drop-in can replace one theater only.
   */
  oeIds: string[];
  /** File name inside the OE folder. */
  file: string;
  /** World meters per texture repeat on a land vehicle. */
  repeatMeters: number;
  /** Plate resample period in pixels of the source still. */
  plateTile: number;
  /** Pixel patterns stay crisp. Blotch patterns filter. */
  filter: 'nearest' | 'linear';
}

export const OE_SKINS: OeSkin[] = [
  {
    id: 'temperate-woodland',
    label: 'Temperate woodland',
    summary:
      'Russian-green family for OPFOR armor and TELs. Original blotch pattern, not a copy of Flora or EMR.',
    oeIds: ['ukraine-east', 'suwalki-gap'],
    file: 'temperate-woodland.png',
    repeatMeters: 4.2,
    plateTile: 280,
    filter: 'linear',
  },
  {
    id: 'ukrainian-digital',
    label: 'Ukrainian digital',
    summary:
      'Temperate pixel pattern for partner fires on the Ukraine East SAMPLE side. Original layout, not a scan of MM-14.',
    oeIds: ['ukraine-east'],
    file: 'ukrainian-digital.png',
    repeatMeters: 11,
    plateTile: 460,
    filter: 'nearest',
  },
  {
    id: 'desert-tan',
    label: 'Desert tan',
    summary: 'Sand and brown blotch for the Strait of Hormuz SAMPLE air and land picture.',
    oeIds: ['hormuz'],
    file: 'desert-tan.png',
    repeatMeters: 4.8,
    plateTile: 300,
    filter: 'linear',
  },
  {
    id: 'naval-grey',
    label: 'Naval grey',
    summary: 'Haze-grey panel pattern for the Gulf patrol corvette. Hull grey, not a land scheme.',
    oeIds: ['hormuz'],
    file: 'naval-grey.png',
    repeatMeters: 16,
    plateTile: 420,
    filter: 'linear',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    summary: 'White and grey disruptive pattern. No SAMPLE AO auto-selects it yet. Drop a folder to bind one.',
    oeIds: ['arctic'],
    file: 'arctic.png',
    repeatMeters: 5.5,
    plateTile: 320,
    filter: 'linear',
  },
  {
    id: 'jungle',
    label: 'Jungle',
    summary: 'Deep-green blotch. No SAMPLE AO auto-selects it yet. Drop a folder to bind one.',
    oeIds: ['jungle'],
    file: 'jungle.png',
    repeatMeters: 4.4,
    plateTile: 260,
    filter: 'linear',
  },
];

const PARTNER_MODELS = new Set<SphereModelId>([
  'sphere-atacms-block-i',
  'sphere-atacms-later-block',
]);

export function oeSkinById(id: string): OeSkin {
  return OE_SKINS.find((skin) => skin.id === id) ?? OE_SKINS[0];
}

/** Folder that should supply the pattern for this skin while `aoId` is open. */
export function skinFolder(skin: OeSkin, aoId: string | null): string {
  if (aoId && skin.oeIds.includes(aoId)) return aoId;
  return skin.oeIds[0];
}

export function repeatMetersFor(skin: OeSkin, modelId: SphereModelId): number {
  if (modelId === 'sphere-vessel') {
    return skin.id === 'naval-grey' ? skin.repeatMeters * 1.35 : skin.repeatMeters * 3;
  }
  if (modelId === 'sphere-fighter') return skin.repeatMeters * 1.35;
  return skin.repeatMeters;
}

/**
 * Skin the dialog selects when it opens. The analyst can pick another.
 * Vessel stays naval grey. Hormuz air and land go desert tan.
 * Ukraine East partner launchers go digital; other Ukraine and Suwałki vehicles go woodland.
 */
export function defaultSkinId(
  aoId: string | null,
  modelId: SphereModelId,
  unitId: string | null,
): string {
  const partner =
    (unitId?.includes('partner') ?? false) || PARTNER_MODELS.has(modelId);
  if (modelId === 'sphere-vessel') return 'naval-grey';
  if (aoId === 'hormuz') return 'desert-tan';
  if (aoId === 'ukraine-east' && partner) return 'ukrainian-digital';
  if (aoId === 'ukraine-east' || aoId === 'suwalki-gap') return 'temperate-woodland';
  if (partner) return 'ukrainian-digital';
  if (modelId === 'sphere-fighter') return 'desert-tan';
  return 'temperate-woodland';
}
