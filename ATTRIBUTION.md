# Engagement sphere model attribution

UNCLASS SAMPLE demo only. Weak-point markers are fictional overlays, not an assessment of any fielded vehicle.

## Geometry and textures

These GLBs are **original models** made for this repository in `source/tools/build_sphere_assets.py` (Blender 4 headless). They are not photographs, scans, game rips, or third-party CAD. Proportions follow publicly published general arrangements so each stable id reads as the named vehicle. They are recognition meshes, not exact-replica scans.

License for the geometry, baked PBR textures, and the plate PNGs rendered from those meshes: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). No third-party model files are vendored.

Paid packs that would replace these meshes, if authorized, are listed in [`docs/SPHERE_MODEL_PROCUREMENT.md`](docs/SPHERE_MODEL_PROCUREMENT.md). None of those files are in this repo.

Regenerate:

```bash
blender -b -P source/tools/build_sphere_assets.py
```

`ONLY=sphere-mbt` builds one id. Plates are written to `source/public/models/plates/` from the same scene (orthographic side, front, top, undercarriage). Published GLBs live in `source/public/models/`.

| Stable id | What it depicts | GLB | Plates | Author | License |
| --- | --- | --- | --- | --- | --- |
| `sphere-mbt` | T-72B3 (low turret, six road wheels, Kontakt-5 cheeks, Sosna-U housing). SAMPLE T-80 rows open this same mesh. | `source/public/models/sphere-mbt.glb` | `sphere-mbt-side.png`, `sphere-mbt-front.png`, `sphere-mbt-top.png`, `sphere-mbt-under.png` | OE Flex SAMPLE demo | CC0 |
| `sphere-fighter` | MiG-29 Fulcrum (twin tail, twin engine, LERX louvers, gear down) | `source/public/models/sphere-fighter.glb` | `sphere-fighter-side.png`, `sphere-fighter-front.png`, `sphere-fighter-top.png`, `sphere-fighter-under.png` | OE Flex SAMPLE demo | CC0 |
| `sphere-vessel` | Gulf patrol corvette (forecastle gun, bridge, funnel, flight deck, waterjets). Not a named pennant. | `source/public/models/sphere-vessel.glb` | `sphere-vessel-side.png`, `sphere-vessel-front.png`, `sphere-vessel-top.png`, `sphere-vessel-under.png` | OE Flex SAMPLE demo | CC0 |
| `sphere-tochka-u` | 9P129 Tochka-U TEL (amphibious 6×6, elevated round) | `source/public/models/sphere-tochka-u.glb` | `sphere-tochka-u-side.png`, `sphere-tochka-u-front.png`, `sphere-tochka-u-top.png`, `sphere-tochka-u-under.png` | OE Flex SAMPLE demo | CC0 |
| `sphere-iskander-m` | 9P78-1 Iskander-M TEL (8×8, one closed canister, one exposed round) | `source/public/models/sphere-iskander-m.glb` | `sphere-iskander-m-side.png`, `sphere-iskander-m-front.png`, `sphere-iskander-m-top.png`, `sphere-iskander-m-under.png` | OE Flex SAMPLE demo | CC0 |
| `sphere-atacms-block-i` | M142 HIMARS with one ATACMS Block I round erected | `source/public/models/sphere-atacms-block-i.glb` | `sphere-atacms-block-i-side.png`, `sphere-atacms-block-i-front.png`, `sphere-atacms-block-i-top.png`, `sphere-atacms-block-i-under.png` | OE Flex SAMPLE demo | CC0 |
| `sphere-atacms-later-block` | M270 MLRS, two pods, one later-block round erected | `source/public/models/sphere-atacms-later-block.glb` | `sphere-atacms-later-block-side.png`, `sphere-atacms-later-block-front.png`, `sphere-atacms-later-block-top.png`, `sphere-atacms-later-block-under.png` | OE Flex SAMPLE demo | CC0 |

Plate files are under `source/public/models/plates/`.

Each GLB carries base color, roughness, metalness, and a normal map baked in the build script, plus glass and lamp materials where the silhouette needs them. Image-based lighting in the viewer uses three.js `RoomEnvironment` (MIT, part of the `three` dependency), not an external HDRI.

No Sketchfab, CGTrader, or other CDN models are hotlinked or vendored.
