# OE Flex — scaffolding web prototype

Threat Tec **OE Flex** clickable spine: **Observe → Mitigate → Wargame → Decide**.

This is a **greenfield scaffolding demo**, not a fielded product. All equipment and vignette content is labeled **SAMPLE / not ODIN**.

## Claim fence

Do **not** claim fielded OpEx, WRAITH Hub, VORTEX, or VOA in the UI. Legacy lineage (if any) belongs only in the About panel.

## Run locally

```bash
cd /workspace/oe-flex-app
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## Stack

- Vite + React + TypeScript
- **globe.gl** (3D globe) + **Leaflet / react-leaflet** (2D map)
- **html2canvas** for PNG export; optional WebM via `getDisplayMedia` when the browser allows

## Demo spine (success path)

1. **OPSEC gate** — pick a role. **Commercial Partner** never sees feeder-position layers.
2. Toggle **Globe / 2D map**; select **Strait of Hormuz** or **Central Corridor** (land).
3. **Observe** — layer toggles, PMESII-PT chips, symbology **Military XOR Commercial** (hard mutex).
4. **Mitigate** — play/pause vignette timeline (land WEG-sample or Hormuz shipping).
5. **Wargame** — pick mitigation, run simple probabilistic red model, view outcomes.
6. **Decide** — commit resources + partner intro stubs (ISR, security, subcontract, Red Forge VISMOD).
7. **Export** — PNG of stage view with brand/white-label + active symbology; optional WebM.
8. **Kill-switch** — blanks live Observe layers.
9. **Domains** — Land **LIVE** with WEG SAMPLE JSON; Air/Sea/EMS/Info/Cyber/Undersea/Space **STUB**.

## Sales callouts

Every stage/capability surfaces a line from `src/data/salesLines.ts` (spine, export, mil/commercial symbology, OPSEC, land, etc.).

## What is stubbed

| Area | Status |
|------|--------|
| Land domain + WEG SAMPLE | LIVE (sample JSON) |
| Sea vignette overlays | SAMPLE overlays on Hormuz (full sea pipeline STUB) |
| Air / EMS / Info / Cyber / Undersea / Space | STUB cards only |
| Partner intros / resource commit | Toast stubs |
| Encryption / real RBAC backend | Stub (client role gate only) |
| WebM recording | Optional; falls back if screen capture denied |
| Globe textures | Loaded from unpkg CDN (needs network once) |

## Sample data

- `src/data/landWegSample.ts` — SAMPLE equipment (not ODIN)
- `src/data/vignettes.ts` — land + maritime vignettes
- `src/data/salesLines.ts` — capability → sales string
- `src/data/aos.ts` — AOs + threat layers (incl. feeders)

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the domain pipeline interface.

## Built / remaining / decisions

See the deliverable checklist in the agent handoff or keep this README as the source of truth for stubs and claim fence.

## Built checklist

- [x] Role selector RBAC (Analyst / Warfighter / PM / Commercial Partner / Executive); partners hide feeders
- [x] Globe (globe.gl) + 2D (Leaflet) toggle; AOs: Strait of Hormuz + Central Corridor (land)
- [x] Observe: threat layers, PMESII-PT chips, Military XOR Commercial symbology
- [x] Mitigate: play/pause vignette timeline (land + maritime)
- [x] Wargame: pick mitigation, probabilistic red model, outcomes
- [x] Decide: resource commit + partner intro stubs (ISR, security, subcontract, Red Forge VISMOD)
- [x] Export PNG (html2canvas) with brand/white-label + symbology; optional WebM
- [x] Kill-switch blanks Observe layers
- [x] Domain pipeline panel: Land LIVE + WEG SAMPLE; others STUB
- [x] Sales-line callouts; SAMPLE / claim fence in UI + README + ARCHITECTURE.md
- [x] Engagement sphere: license-clear recognition GLBs (T-72B3, MiG-29, Gulf patrol corvette, Tochka-U, Iskander-M, HIMARS, M270) with matching 2D plates and known vs believed overlays. Licenses in repo-root `ATTRIBUTION.md`. Paid exact-replica packs, if authorized, are listed in `docs/SPHERE_MODEL_PROCUREMENT.md`.

## Remaining (next increments)

- Real RBAC/auth + encryption (currently client-only role gate)
- Full sea/air/EMS/info/cyber/undersea/space pipelines beyond STUB cards
- True MIL-STD-2525 symbol library (current = SVG/CSS stand-ins)
- Offline globe textures (currently CDN unpkg)
- Deeper COA model / multi-turn wargame
- PPTX export pack (PNG-ready today)
- Automated e2e demo script

## Decisions needing Jim / product owner

1. Confirm Commercial Partner visibility: vignette+mitigation only vs. also non-feeder commercial layers (scaffold allows non-feeder layers).
2. Sea domain: keep Hormuz SAMPLE overlays while Sea pipeline stays STUB, or promote Sea to LIVE when shipping layers ship?
3. Default symbology by role (Warfighter→Military, Partner→Commercial) — keep or lock?
4. White-label brand name string for export header.
5. Whether Red Forge / VISMOD partner hook should deep-link to a real CRM/form.
6. Priority order for next LIVE domain after Land.
