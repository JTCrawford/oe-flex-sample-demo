# Engagement-sphere model procurement

UNCLASS SAMPLE demo.

Purchased packs for the platforms in [Battle-space placement](BATTLESPACE_ORBAT.md) stay on the authoring Mac. They are not in this repository. The marketplace notes further down record an earlier search for exact replicas. Those notes are not a claim that a raw pack was committed here.

Jim rejected the in-repo meshes as too analog. The CC0 meshes stay the public renderables. This repo does not invent a closer CC0 stand-in and call it an exact replica of a purchased pack.

## Why a free exact replica was not shipped

License rule for this public GitHub repo and the public Vercel demo: the GLB itself must be redistributable for commercial use. CC0 and CC-BY qualify. CC-BY-NC, personal-use, editorial, Sketchfab Standard, and typical marketplace "royalty free" terms do not, until the seller says the file may be committed and served.

Searched Sketchfab (downloadable) and CGTrader for each stable id:

- Downloadable Sketchfab models of the T-72B3, MiG-29, M142, and Tochka-U that carry a CC tag are game extracts (War Thunder, Squad, or the uploader's own "Not my model") or are marked personal-use only. A CC badge on a rip is not a license. Those files were not downloaded.
- No CC0 or CC-BY original (not a rip) photoreal GLB was found for these seven exact vehicles.
- Marketplace "free" military models were personal-use or editorial, or the listing did not grant redistribution of the source file.

The meshes in `source/public/models/` remain original geometry made in `source/tools/build_sphere_assets.py`, CC0, with plates rendered from that same scene. They are recognition models from published general arrangement. They are not photographs, scans, or CAD of fielded vehicles.

OE camouflage is a separate slot. See [OE camouflage skins](#oe-camouflage-skins) below. No purchased camo archive was in this repo.

## Before anyone pays

Royalty-free listings below allow a render inside a product more often than they allow **redistributing the model file**. This repo would convert the file to GLB, commit it, and serve it from Vercel. That is redistribution.

Ask the seller, in writing, before purchase:

1. May Threat Tec commit the mesh (GLB or converted) to a **public** GitHub repository?
2. May that file be served from a public demo (Vercel)?
3. Is the mesh the author's own model, not a game extract?

If the answer is no, do not put the file in this repo. Keep it private, or commission an original model with those two rights.

Prices below are marketplace figures seen on 27 Sep 2026. They move. Confirm on the page.

## Packs to authorize

### `sphere-mbt` — T-72B / T-72B3

| | |
| --- | --- |
| Product | Russia T-72B3 Main Battle Tank |
| URL | https://www.cgtrader.com/3d-models/military/military-vehicle/t-72b3-3d-model |
| License | Royalty Free (no AI), as labeled on the listing |
| Price | On the listing. The page did not return a figure to this session. |
| Why this one | Names the T-72B3 (Sosna-U / Relikt-era description), FBX/OBJ/Blend. Free exact meshes found were Squad and War Thunder rips. |
| Alternate | https://www.cgtrader.com/3d-models/vehicle/military-vehicle/t-72-b3-main-battle-tank — low-poly T-72B3, price on the page. Likely short of the photoreal bar. |

### `sphere-fighter` — MiG-29 Fulcrum

| | |
| --- | --- |
| Product | Ukraine Fighter Jet Mikoyan MiG-29UB Fulcrum B or C Tandem |
| URL | https://www.cgtrader.com/3d-models/aircraft/military-aircraft/ukraine-fighter-jet-mikoyan-mig-29ub-fulcrum-b-or-c-tandem |
| License | Royalty Free |
| Price | $99 |
| Why this one | Listing says it was modeled from a blueprint, with OBJ and FBX. It is the two-seat UB, not a single-seat 9.12. Still the right aircraft. |
| Cheaper alternate | https://www.cgtrader.com/3d-models/aircraft/military-aircraft/mig-29--3 — rigged low-poly PBR MiG-29, $39.99, Royalty Free. |
| Do not buy | https://www.cgtrader.com/3d-models/aircraft/military-aircraft/jet-fighter-aircraft-mig-29-fulcrum — the listing text says the mesh looks like an F-14. |

Free Sketchfab Fulcrums reviewed were War Thunder extracts or "personal use only."

### `sphere-vessel` — Gulf patrol corvette

| | |
| --- | --- |
| Product | Baynunah Class Corvette UAE Navy |
| URL | https://www.cgtrader.com/3d-models/watercraft/military-watercraft/baynunah-class-corvette-uae-navy |
| License | Royalty Free |
| Price | $199 |
| Why this one | Public Gulf corvette in the same size band as the recognition mesh (about 71 m × 11 m × 2.8 m draft), photoreal, not a submarine body. |
| Identity check | The SAMPLE ORBAT row is a Hormuz OPFOR patrol squadron. It does not name a pennant class. Baynunah is a UAE Navy ship. Buy this only if that specific hull is acceptable. Otherwise commission a generic 70 m patrol corvette with the redistribution rights above. |

### `sphere-tochka-u` — 9K79-1 Tochka-U TEL

| | |
| --- | --- |
| Product | OTR 21 Tochka Tactical Ballistic Missile |
| URL | https://www.cgtrader.com/3d-models/vehicle/military-vehicle/otr-21-tochka-tactical-ballistic-missile |
| License | Royalty Free (no AI) |
| Price | On the listing. The page did not return a figure to this session. |
| Why this one | TEL-shaped Tochka, Blender file, PBR textures. Confirm the download is the 9P129 launcher and not a missile-only mesh. |
| Do not buy | https://www.renderhub.com/3dstudio/otr-21-tochka-tactical-ballistic-missile — $49, but the license is editorial / IP-restricted. |

Sketchfab "Ukrainian OTR-21 Tochka-U" (42manako) says "Not my model." Not used.

### `sphere-iskander-m` — 9K720 Iskander-M TEL

| | |
| --- | --- |
| Product | Tactical Missile Launcher Iskander 9K720 |
| URL | https://www.cgtrader.com/3d-models/vehicle/military-vehicle/tactical-missile-launcher-iskander-9k720 |
| License | Royalty Free |
| Price | $179 |
| Why this one | TEL, not a missile in isolation. |
| Cheaper alternate | https://www.cgtrader.com/3d-models/military/military-vehicle/9k720-iskander-a4deded4-3e19-4569-84e5-dc751f0707e1 — $22. Confirm it includes the 9P78-1 vehicle. |
| Store alternate | https://sketchfab.com/3d-models/9k720-iskander-1b273c96899d4a988d73e0cf9e918636 — Sketchfab Store / Fab. Price on the store page. |

### `sphere-atacms-block-i` — M142 HIMARS with ATACMS Block I

| | |
| --- | --- |
| Product | M142 HIMARS - High Mobility Artillery Rocket System |
| URL | https://www.cgtrader.com/3d-models/military/military-vehicle/himars-high-mobility-artillery-rocket-system |
| License | Royalty Free |
| Price | $29.99 |
| Why this one | Names the M142. It is low-poly, so it may still miss a photoreal bar. Ask for GLB and for a single ATACMS round in the pod (Block I is one missile, not six GMLRS). |
| Gap | A photoreal M142 with a redistribution-clear license was not found at this price. If $29.99 is too coarse, search CGTrader for an "M142 HIMARS PBR" listing at purchase time and apply the same license questions. |

Free Sketchfab HIMARS uploads reviewed were unlabeled high-poly extracts or marked "Not my model."

### `sphere-atacms-later-block` — M270 MLRS with later-block ATACMS

| | |
| --- | --- |
| Product | M270 Multiple Launch Rocket System |
| URL | https://www.cgtrader.com/3d-models/vehicle/military-vehicle/m270-multiple-launch-rocket-system-7ba1f3f3-525d-4f87-ba7c-5ab99bca13a3 |
| License | Royalty Free |
| Price | $79 |
| Why this one | Tracked M270, separate from the wheeled HIMARS mesh. |
| Sharper alternates | Game-ready M270, $149: https://www.cgtrader.com/3d-models/military/military-vehicle/m270-mlrs-game-ready |
| | PBR M270 (single price on the page; related packs were advertised from about $279): https://www.cgtrader.com/3d-models/military/military-vehicle/m270-multiple-launch-rocket-system-pbr |

## Rough authorize-to-buy total

Mid-tier picks with prices in hand: MiG-29UB $99, Baynunah $199, Iskander TEL $179, HIMARS $29.99, M270 $79. About **$586**, plus the T-72B3 and Tochka listings (price on page) and any extended-license fee for public redistribution. The HIMARS at $29.99 may need a second, sharper pack.

Do not buy the editorial Tochka, the F-14-text Fulcrum, or any Sketchfab item whose description says it came from a game.

## OE camouflage skins

Camouflage follows the operational environment. The patterns in this repo are original CC0 textures. Purchased vehicle packs are a separate slot and are not these PNGs. Places already checked, with nothing to vendor into git:

- This repo had no purchased camo archive, and it still does not.
- Vehicle packs purchased later stay on the authoring Mac. See [Battle-space placement](BATTLESPACE_ORBAT.md). They are not camouflage textures.

The dialog ships original CC0 patterns generated by `source/tools/build_oe_skins.py` and a picker that auto-selects from the open AO:

| AO | Auto skin | Who |
| --- | --- | --- |
| Ukraine East | Temperate woodland (Russian-green family) | OPFOR armor, Tochka-U, Iskander 9K720, and the task-force Fulcrum |
| Ukraine East | Ukrainian digital | Partner fires (M142 HIMARS, M270), Liut, Verba, Ukrainian armored vehicles, and the partner Su-27 / MiG-29 flight |
| Ukraine East | Naval grey | Magura V5 USV |
| Suwałki Gap | Temperate woodland | OPFOR armor |
| Strait of Hormuz | Desert tan | MiG-29, F-22, F/A-18, and any non-ship mesh opened there |
| Strait of Hormuz | Naval grey | Gulf patrol corvette (Magura uses the same skin if that sphere is opened here) |
| Taiwan Strait, Korean Peninsula | Temperate woodland | Air and land on those Phase 2a stops. Ships stay naval grey |
| South China Sea | Jungle | Air and land. Ships stay naval grey |
| GIUK Gap | Arctic | Air and land. Ships stay naval grey |

These are not scans of EMR, MM-14, MARPAT, or CARC. A paid PBR with a real issued scheme still has to clear the redistribution questions at the top of this file. Until then the gap is pattern fidelity, not the switch.

Drop a licensed file here without a code change:

```text
source/public/models/skins/<oe-id>/
  index.json
  temperate-woodland.png | ukrainian-digital.png | desert-tan.png | naval-grey.png | arctic.png | jungle.png
  <sphere-id>.png     optional, named from index.json modelTexture
  <sphere-id>.glb     optional full mesh, named from index.json modelGlb
```

`<oe-id>` is `ukraine-east`, `suwalki-gap`, `hormuz`, `arctic`, or `jungle`. Add another folder and an entry in `source/src/data/oeSkins.ts` (`oeIds`, `auto` behavior in `defaultSkinId`) when a new theater needs its own skin. Instructions sit in `source/public/models/skins/README.md`.

Regenerate the shipped PNGs with `python3 source/tools/build_oe_skins.py`.

