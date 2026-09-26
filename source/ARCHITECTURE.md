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

Unit and force markers may carry a `UnitOrbat` (`designation`, `echelon`, `higherFormation`, `vehicles[]`). Each holding is `{ category, typeDesignation, count }` where `category` is `tank | ifv | artillery | aircraft | ship`. The pin detail panel iterates holdings and resolves labels from `VEHICLE_CATEGORY_LABEL` in `src/data/orbat.ts`, so a new category is a catalog entry, not a UI rewrite. Infrastructure markers omit `orbat`.

ORBAT rides the existing Observe gates: AO selection, layer toggles, PMESII-PT filters, Commercial Partner feeder hiding, the current-positions toggle, and the kill-switch. It does not replace strike history, origins, hot zones, or munition range rings.

## Symbology mutex

`symbology: 'military' | 'commercial'` is exclusive. Military uses 2525-style SVG frames; Commercial uses ship/port/pipeline-style icons. Export burns in the active deck only.

## Export

`html2canvas` snapshots the map column (stage view). Brand vs white-label toggle changes the burn-in header. Optional WebM uses display-media capture when permitted.

## Claim fence

Do not surface fielded OpEx / WRAITH Hub / VORTEX / VOA as live product claims in the UI.
