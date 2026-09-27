# Battle-space placement (catalog and ORBAT)

UNCLASS SAMPLE. This note is the placement map for platforms whose licensed geometry stays on the authoring Mac.

## No public raw redistribute

Purchased packs live only under `~/OE-Flex-Demo/gh-pages/source/public/models/skins/` on that Mac:

| Mac folder | Platforms |
| --- | --- |
| `tochka-u` | Tochka-U |
| `iskander-9k720` | Iskander 9K720 |
| `magura-v5` | Magura V5 |
| `liut-ugv` | Liut UGV |
| `manpads/verba` | Verba 9K333 |
| `fighters/asset-military-fighter` | Su-27, MiG-29, F-22, F/A-18 |
| `ukrainian-armored-vehicles` | BTR-4E, Dozor-B, Novator, KrAZ Shrek, KrAZ Fiona |

Do not commit those FBX, OBJ, TGA, or RAR trees. Do not copy them into a public `models/` path that a browser can download as a standalone library. `.gitignore` ignores those directory names under `models/skins/`, ignores `models/skins/soldiers/`, ignores GLB files under `models/skins/`, and ignores raw mesh extensions under `models/`. Tracked CC0 skin PNGs under `models/skins/<oe-id>/` stay in git.

The sticky SAMPLE demo keeps the existing CC0 `sphere-*.glb` files as the renderables until an optimized private embed exists. The sphere dialog labels licensed geometry as **Mac-local / pending optimized embed** and names the public stand-in when the catalog id and the GLB id differ. OE camouflage still binds through `source/src/data/oeSkins.ts` and `source/public/models/skins/<oe-id>/index.json`. A cleared embed, later, is a `modelGlb` entry in that index. The raw pack is not that embed.

## Placed in the catalog and ORBAT

| Platform | Sphere id | Catalog / ORBAT | Battle-space group | Auto skin | Public renderable |
| --- | --- | --- | --- | --- | --- |
| Tochka-U | `sphere-tochka-u` | `tochka-u` | Ukraine East OPFOR missile battery | Temperate woodland | `sphere-tochka-u` (CC0 TEL) |
| Iskander 9K720 | `sphere-iskander-m` | `iskander-m` | Same missile battery | Temperate woodland | `sphere-iskander-m` (CC0 TEL) |
| Magura V5 | `sphere-magura` | ship holding | Ukraine East partner group, Black Sea USV section | Naval grey | `sphere-vessel` |
| Liut UGV | `sphere-liut` | UGV holding | Ukraine East partner UGV section | Ukrainian digital (woodland stays on the picker) | `sphere-mbt` |
| Verba 9K333 | `sphere-verba` | `verba` | Ukraine East partner SHORAD section | Ukrainian digital | `sphere-mbt` |
| Su-27 | `sphere-su27` | aircraft holding | Ukraine East partner fighter flight | Ukrainian digital on that partner pin | `sphere-fighter` |
| MiG-29 | `sphere-fighter` | aircraft holding | Same partner flight, and the existing OPFOR / Hormuz flights | Digital on the partner pin; woodland on Ukraine OPFOR; desert tan in Hormuz | `sphere-fighter` (CC0 MiG-29) |
| F-22 | `sphere-f22` | aircraft holding | Hormuz coalition bonus flight | Desert tan | `sphere-fighter` |
| F/A-18 | `sphere-fa18` | aircraft holding | Same bonus flight | Desert tan | `sphere-fighter` |
| BTR-4E | `sphere-btr-4e` | IFV holding | Ukraine East partner armored company | Ukrainian digital | `sphere-mbt` |
| Dozor-B | `sphere-dozor-b` | IFV holding | Same company | Ukrainian digital | `sphere-mbt` |
| Novator | `sphere-novator` | IFV holding | Same company | Ukrainian digital | `sphere-mbt` |
| KrAZ Shrek | `sphere-kraz-shrek` | IFV holding | Same company | Ukrainian digital | `sphere-mbt` |
| KrAZ Fiona | `sphere-kraz-fiona` | IFV holding | Same company | Ukrainian digital | `sphere-mbt` |

`sphere-tochka` in conversation maps to the existing id `sphere-tochka-u`, because that is the GLB filename already on the sticky demo. `sphere-iskander` maps to `sphere-iskander-m` the same way. Titles in the dialog are **Tochka-U** and **Iskander 9K720**.

Verba is the first MANPADS / SHORAD row. Family label is `MANPADS / SHORAD`. Range rings use a 0.5–6 km span. A strike inference card picks Verba when the label names it. A short missile slant does not become Verba from envelope width alone.

## Two SAMPLE scenarios

The map column has a scenario toggle. Primary is **Ukraine–Russia** (Ukraine East). Secondary is **Iran / Hormuz**.

Ukraine–Russia draws the existing eastern-theater pins. Partner formations are blue. OPFOR formations are red. Engagement lines join the missile battery to partner fires, the fighter flight to the OPFOR task force, the SHORAD section to that task force, the rocket battery to partner armor, and the partner infantry section to the OPFOR infantry section. Sphere cards for Tochka-U, Iskander 9K720, Magura V5, Liut, Verba, the MiG-29, the BTR-4E, and the dismount section use the Ukraine vignette.

Iran / Hormuz draws the strait pins. Coalition formations are blue. OPFOR formations are red. Engagement lines join the strike flight and the patrol squadron to the SAMPLE shipping tracks, the coalition flight to the OPFOR strike flight, and the coalition ground section to the coastal ground pin. Sphere cards for the MiG-29, F-22, F/A-18, the Gulf patrol corvette, and the dismount section use the Hormuz vignette. Ukraine-only platforms keep their Ukraine card and say Hormuz does not add an assessment. The defeat layer stays a training label. It does not name a weapon or a procedure.

Commercial symbology keeps commercial icons. Engagement lines draw only on the military picture, with the Military PMESII filter on and the kill-switch off. Suwałki Gap stays selectable and is not one of the two scenarios.

## Infantry pins and soldier GLBs

Infantry rows use catalog id `sphere-soldier`. The viewer probes these paths, in order, under the Vite public root:

- `models/skins/soldiers/soldier-pack-aaa/SK_SoldierPackVol1.glb`
- `models/skins/soldiers/modular-soldier-pack/Soldier-Pack6.glb`

On a Mac demo, drop the licensed files at:

- `~/OE-Flex-Demo/gh-pages/source/public/models/skins/soldiers/soldier-pack-aaa/SK_SoldierPackVol1.glb`
- `~/OE-Flex-Demo/gh-pages/source/public/models/skins/soldiers/modular-soldier-pack/Soldier-Pack6.glb`

Those GLBs are licensed local authoring assets. They are gitignored and are not in the public Vercel build. A missing file, a non-GLB response, or an HTML rewrite falls back to the CC0 `sphere-mbt` mesh in the sphere and leaves the map pin as the simple infantry marker. The dialog says which path it took.

## Sphere manipulation and analysis layers

The engagement-sphere dialog orbits with a drag and zooms with the scroll wheel or a pinch. Four toggles sit on the card: Strengths, Weaknesses, How do I kill this?, and Capabilities. Seeded UNCLASS SAMPLE notes cover Tochka-U, Iskander 9K720, Magura V5, Liut, Verba 9K333, the MiG-29 (`sphere-fighter`), and the BTR-4E. Thin lines are marked Stub. The defeat layer is vignette language for the training card. It does not name a weapon or a procedure. Other sphere ids open the same toggles and say the card is not seeded yet. Camouflage selection is unchanged.

## Still needing geometry

These are not placed as purchased-pack entries:

- HIMARS exact and M270 exact. The demo still has the CC0 `sphere-atacms-block-i` and `sphere-atacms-later-block` recognition meshes.
- T-72 exact. `sphere-mbt` remains the CC0 T-72B3 recognition mesh. T-80 rows still open that mesh.
- Corvette exact. `sphere-vessel` remains the CC0 Gulf patrol corvette.
- Soldiers (Modular, AAA, Operators). The infantry pin probes the two staged GLB paths above and falls back when they are absent. The files are not landed in git.
- Mark Four FPV, Igla, Stinger. Not landed.
- Vampire / TB2 pack. Not purchased.

No GLB in this repo was downloaded as a stand-in for those names.
