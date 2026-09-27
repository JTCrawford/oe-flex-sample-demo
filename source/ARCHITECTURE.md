# OE Flex — domain pipeline architecture (scaffold)

## Spine

```
Observe → Mitigate → Wargame → Decide
```

UI stage state lives in `src/hooks/useAppState.ts`. Map/globe render markers from filtered Observe layers; Mitigate/Wargame read vignettes keyed by AO; Decide is commitment + partner-hook stubs.

## Domain pipeline interface

Each domain plugs in behind a common shape so Land can stay live while others remain STUB.

```ts
/** Conceptual contract — implement per domain as modules mature */
export interface DomainPipeline {
  id: 'land' | 'air' | 'sea' | 'ems' | 'info' | 'cyber' | 'undersea' | 'space';
  status: 'LIVE' | 'STUB';

  /** Threat / feeder layers for an AO (RBAC may strip feeders) */
  getLayers(aoId: string): ThreatLayer[];

  /** Optional equipment catalog (WEG-shaped for land) */
  getEquipment?(): WegEquipment[];

  /** Optional vignette ids owned by this domain */
  getVignetteIds?(): string[];
}
```

### Current wiring

| Domain   | Status | Module / data                                      |
|----------|--------|----------------------------------------------------|
| Land     | LIVE   | `landWegSample.ts` + Central Corridor layers/vignette |
| Sea      | STUB*  | Hormuz SAMPLE overlays + maritime vignette only    |
| Air      | STUB   | Card in `domains.ts`                               |
| EMS      | STUB   | Card in `domains.ts`                               |
| Info     | STUB   | Card in `domains.ts`                               |
| Cyber    | STUB   | Card in `domains.ts`                               |
| Undersea | STUB   | Card in `domains.ts`                               |
| Space    | STUB   | Card in `domains.ts`                               |

\*Sea vignette is demo content; the full sea pipeline (tracks, AIS fusion, etc.) is not implemented — status remains STUB in the Domains panel.

### How to add the next domain

1. Add SAMPLE JSON under `src/data/` (clearly labeled SAMPLE).
2. Register layers on relevant AOs in `aos.ts` (or a domain-specific loader).
3. Optionally add a vignette in `vignettes.ts`.
4. Flip status to `LIVE` in `domains.ts`.
5. Keep feeder markers tagged `isFeeder: true` so Commercial Partner RBAC continues to hide them.

## RBAC (client scaffold)

| Role                 | Observe feeders | Vignette + mitigation |
|----------------------|-----------------|------------------------|
| Analyst / Warfighter / PM / Executive | Yes             | Yes                    |
| Commercial Partner   | **No**          | Yes                    |

Kill-switch blanks all live Observe layers regardless of role.

## Order of battle

Unit and force markers may carry a `UnitOrbat` (`designation`, `echelon`, `higherFormation`, `vehicles[]`, optional `linkedMunitionIds[]`). Each holding is `{ category, typeDesignation, count, linkedMunitionIds? }` where `category` is `tank | ifv | artillery | aircraft | ship`. The pin detail panel iterates holdings and resolves labels from `VEHICLE_CATEGORY_LABEL` in `src/data/orbat.ts`, so a new category is a catalog entry, not a UI rewrite. Infrastructure markers omit `orbat`.

ORBAT rides the existing Observe gates: AO selection, layer toggles, PMESII-PT filters, Commercial Partner feeder hiding, the current-positions toggle, and the kill-switch. It does not replace strike history, origins, hot zones, or strike-origin munition range rings.

## Munition catalog

`src/data/munitionCatalog.ts` is the shared UNCLASS SAMPLE catalog. Stable ids (`tochka-u`, `iskander-m`, `atacms-block-i`, `atacms-later-block`) are the join key for unit holdings and for `engagementSphereModelId` (`sphere-tochka-u`, and the same pattern for the other three). Records are open-source analogs, not real-unit attribution.

Selecting a unit with `linkedMunitionIds` (on the unit and/or a vehicle row) shows those profiles in the existing order-of-battle panel: designation, family, range span, notes, and the engagement-sphere id. The same rings used for strike inference are drawn from the **unit** position. Military symbology plus the Military PMESII filter gate the rings, together with AO selection and the kill-switch. Strike inference is unchanged for cruise and other classes. When a strike's generic `srbm` candidate would have been shown, a catalog profile replaces that one card if the label names it or the slant range falls inside a catalog envelope.

Ring UX, one rule for every profile: an outer ring at `rangeMaxKm` and an inner ring at `rangeMinKm`.

- Tochka-U, ATACMS Block I, and ATACMS later block use `span`: inner is minimum range, outer is maximum (70–120, 25–165, and 70–300 km).
- Iskander-M uses `cited-bounds`. Open-source export figures are often ~280 km and domestic figures are often ~400–500 km. The demo draws **280 km (believed export)** and **500 km (upper domestic cite)**. It does not draw a third ring at 400 km.

## Symbology mutex

`symbology: 'military' | 'commercial'` is exclusive. Military uses 2525-style SVG frames; Commercial uses ship/port/pipeline-style icons. Export burns in the active deck only.

## Export

`html2canvas` snapshots the map column (stage view). Brand vs white-label toggle changes the burn-in header. Optional WebM uses display-media capture when permitted.

## Claim fence

Do not surface fielded OpEx / WRAITH Hub / VORTEX / VOA as live product claims in the UI.
