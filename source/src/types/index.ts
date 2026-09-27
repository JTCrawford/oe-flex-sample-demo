export type Role = 'Analyst' | 'Warfighter' | 'PM' | 'Commercial Partner' | 'Executive';

export type Stage = 'Observe' | 'Mitigate' | 'Wargame' | 'Decide';

export type MapMode = 'globe' | '2d';

export type SymbologyMode = 'military' | 'commercial';

export type DomainId =
  | 'land'
  | 'air'
  | 'sea'
  | 'ems'
  | 'info'
  | 'cyber'
  | 'undersea'
  | 'space';

export type DomainStatus = 'LIVE' | 'STUB';

export type PmesiiChip =
  | 'Political'
  | 'Military'
  | 'Economic'
  | 'Social'
  | 'Information'
  | 'Infrastructure'
  | 'Physical'
  | 'Time';

export interface AO {
  id: string;
  name: string;
  type: 'maritime' | 'land';
  lat: number;
  lng: number;
  description: string;
}

export interface ThreatLayer {
  id: string;
  label: string;
  pmesii: PmesiiChip[];
  domain: DomainId;
  /** Feeder / force-position data — hidden from Commercial Partner */
  isFeeder: boolean;
  markers: ThreatMarker[];
}

/**
 * Canonical vehicle categories for order-of-battle holdings.
 * Add a member here and a label in `VEHICLE_CATEGORY_LABEL` — the pin
 * detail panel iterates holdings and does not switch on category.
 */
export type VehicleCategoryId = 'tank' | 'ifv' | 'artillery' | 'aircraft' | 'ship';

/** Echelon in the SAMPLE designation scheme. Extend the label map with the union. */
export type UnitEchelon =
  | 'section'
  | 'platoon'
  | 'company'
  | 'battery'
  | 'flight'
  | 'squadron'
  | 'task-force';

/** One typed vehicle holding. Several holdings may share a category. */
export interface VehicleHolding {
  category: VehicleCategoryId;
  /** Platform nomenclature, e.g. "BMP-2 (SAMPLE)". */
  typeDesignation: string;
  count: number;
  /** Shared `MunitionProfile` ids this platform is assessed to carry. */
  linkedMunitionIds?: string[];
  /**
   * Stable engagement-sphere mesh id (`sphere-mbt`, `sphere-fighter`, `sphere-vessel`).
   * Linked munitions keep their id on `MunitionProfile` instead.
   */
  engagementSphereModelId?: string;
}

/** Open-source family for a shared SAMPLE munition record. */
export type MunitionFamily = 'srbm' | 'tactical-ballistic';

/**
 * How min/max are drawn.
 * `span` — inner ring is minimum range, outer ring is maximum range.
 * `cited-bounds` — both rings are open-source cited figures (export vs domestic), not a minimum-range floor.
 */
export type MunitionRingMode = 'span' | 'cited-bounds';

/**
 * Shared UNCLASS SAMPLE munition. `id` joins ORBAT holdings to range rings
 * and to a later 3D engagement sphere. Not a real-unit attribution.
 */
export interface MunitionProfile {
  id: string;
  designation: string;
  /** Compact name for unit lists. */
  shortName: string;
  family: MunitionFamily;
  /** One-line role, e.g. theater SRBM / tactical ballistic. */
  role: string;
  rangeMinKm: number;
  rangeMaxKm: number;
  ringMode: MunitionRingMode;
  /** SAMPLE / UNCLASS note, including how the rings should be read. */
  notes: string;
  sampleLabel: 'SAMPLE';
  classification: 'UNCLASS';
  /** Stable id resolved by the engagement-sphere viewer (`sphere-tochka-u`, …). */
  engagementSphereModelId: string;
  /** Strike-label tokens that resolve inference onto this profile. */
  matchKeywords: string[];
  /** Short line folded into an inferred rationale. */
  inferenceBlurb: string;
}

/**
 * Fictional order of battle carried on a unit/force pin.
 * Infrastructure nodes omit this.
 */
export interface UnitOrbat {
  /** SAMPLE designation, e.g. "SAMPLE 2nd Mech Section". */
  designation: string;
  echelon: UnitEchelon;
  /** Parent formation. SAMPLE / fictional. */
  higherFormation: string;
  vehicles: VehicleHolding[];
  /**
   * Shared catalog ids for munitions linked to the unit.
   * Vehicle rows may also set `linkedMunitionIds`; both are read.
   */
  linkedMunitionIds?: string[];
  sampleLabel: 'SAMPLE';
}

export interface ThreatMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  milSymbol?: string;
  commercialSymbol?: string;
  pmesii: PmesiiChip[];
  /** Present on unit/force pins. Omitted for infrastructure and commercial tracks. */
  orbat?: UnitOrbat;
}

export interface WegEquipment {
  id: string;
  designation: string;
  type: string;
  country: string;
  crew: number;
  mainArmament: string;
  notes: string;
  sampleLabel: 'SAMPLE';
}

export interface VignetteStep {
  t: number;
  title: string;
  description: string;
  kind: 'attack' | 'mitigation' | 'outcome';
}

export interface Vignette {
  id: string;
  title: string;
  aoId: string;
  domain: DomainId;
  durationSec: number;
  steps: VignetteStep[];
  mitigations: MitigationOption[];
}

export interface MitigationOption {
  id: string;
  label: string;
  description: string;
  cost: 'Low' | 'Med' | 'High';
  /** Base success probability 0-1 before red model */
  baseSuccess: number;
}

export interface WargameOutcome {
  mitigationId: string;
  successProb: number;
  redResponse: string;
  residualRisk: string;
  narrative: string;
}

export interface PartnerHook {
  id: string;
  label: string;
  description: string;
}

export interface DomainPipelineMeta {
  id: DomainId;
  label: string;
  status: DomainStatus;
  note: string;
}

export type ProvenanceTag = 'OSINT' | 'partner' | 'team' | 'public';

export interface TtpMapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: 'ao' | 'launch' | 'target' | 'sensor' | 'vessel';
}

export interface TtpTimelineEvent {
  id: string;
  date: string;
  title: string;
  summary: string;
  severity: 'low' | 'med' | 'high';
}

export interface TtpFootagePlaceholder {
  id: string;
  title: string;
  provenance: ProvenanceTag;
  durationLabel: string;
  posterHue: number;
  caption: string;
  /** In-app SAMPLE video (relative to app base). Required — video is primary media. */
  videoSrc: string;
  /** Audio only allowed when synced to this video track. */
  hasSyncedAudio: boolean;
}

export interface TtpMitigationCard {
  id: string;
  label: string;
  description: string;
  cost: 'Low' | 'Med' | 'High';
  /** Optional AO to focus when linking into Mitigate */
  linkAoId?: string;
  linkStage?: Stage;
}

export interface TtpFeed {
  id: string;
  title: string;
  subtitle: string;
  threatActor: string;
  attackPattern: string;
  domains: DomainId[];
  region: string;
  updatedLabel: string;
  severity: 'elevated' | 'high' | 'critical';
  summary: string;
  pins: TtpMapPin[];
  timeline: TtpTimelineEvent[];
  footage: TtpFootagePlaceholder[];
  mitigations: TtpMitigationCard[];
  accent: string;
}

export type StrikeAttackType = 'drone' | 'missile' | 'artillery' | 'ied' | 'other';

export interface StrikeEvent {
  id: string;
  aoId: string;
  attackType: StrikeAttackType;
  timestamp: string; // ISO
  originLat: number;
  originLng: number;
  impactLat: number;
  impactLng: number;
  label: string;
  intensity: number; // 0.2–1 for heat
}

export interface StrikeOverlayToggles {
  currentPositions: boolean;
  strikeHistory: boolean;
  origins: boolean;
  hotZones: boolean;
}

/** SAMPLE munition hypothesis inferred from a strike — not an identification. */
export interface MunitionCandidate {
  id: string;
  name: string;
  /** Reported strike family this profile belongs to. */
  family: StrikeAttackType;
  confidence: number;
  rationale: string;
  envelopeMinKm: number;
  envelopeMaxKm: number;
  ringColor: string;
  ringDash: string;
  /** Set when this hypothesis is a shared `MunitionProfile`. */
  catalogId?: string;
  /** Placeholder id for the 3D engagement sphere, copied from the catalog. */
  engagementSphereModelId?: string;
  /** UNCLASS SAMPLE note from the shared profile. */
  catalogNotes?: string;
}

/** Circle drawn for the selected strike only. */
export interface StrikeRangeRing {
  id: string;
  kind: 'envelope' | 'observed';
  lat: number;
  lng: number;
  radiusKm: number;
  color: string;
  dashArray: string;
  /** Leaflet stroke width in px. */
  weight: number;
  /** Globe fat-line width in degrees; null keeps a 1px stroke. */
  strokeDegrees: number | null;
  fillOpacity: number;
  label: string;
  /** Inner cited/minimum ring versus outer maximum. Omitted on legacy max-only rings. */
  band?: 'min' | 'max';
}

export interface StrikeMunitionAssessment {
  strikeId: string;
  label: string;
  attackType: StrikeAttackType;
  timestamp: string;
  rangeKm: number;
  bearingDeg: number;
  bearingLabel: string;
  trajectory: string;
  threatContext: string;
  candidates: MunitionCandidate[];
  rings: StrikeRangeRing[];
}
