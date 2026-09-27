# Engagement sphere model attribution

UNCLASS SAMPLE demo only. These meshes are **original models** made for this repository. They are not photographs, scans, game rips, or CAD of fielded vehicles. Proportions follow publicly published general arrangements so each stable id reads as the named class of analog. Weak-point markers in the viewer are fictional overlays, not an assessment.

License for the geometry and baked PBR textures: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — public domain dedication. No third-party model files are vendored.

Regenerate from `source/tools/build_sphere_assets.py` (Blender 4 headless). Published files live in `source/public/models/` and are copied into the static app on build.

| Stable id | What it depicts | File | Author | License |
| --- | --- | --- | --- | --- |
| `sphere-mbt` | T-72/T-80 family SAMPLE analog (low cast turret, six road wheels, rear drive sprocket) | `source/public/models/sphere-mbt.glb` | OE Flex SAMPLE demo | CC0 |
| `sphere-fighter` | Fulcrum-family SAMPLE analog (twin tail, twin engine, gear down) | `source/public/models/sphere-fighter.glb` | OE Flex SAMPLE demo | CC0 |
| `sphere-vessel` | Corvette-class SAMPLE analog (bridge, funnel, flight deck, underhull) | `source/public/models/sphere-vessel.glb` | OE Flex SAMPLE demo | CC0 |
| `sphere-tochka-u` | Tochka-U TEL SAMPLE analog (6x6 boat hull, elevated round) | `source/public/models/sphere-tochka-u.glb` | OE Flex SAMPLE demo | CC0 |
| `sphere-iskander-m` | Iskander-M TEL SAMPLE analog (8x8, one exposed round, one closed canister) | `source/public/models/sphere-iskander-m.glb` | OE Flex SAMPLE demo | CC0 |
| `sphere-atacms-block-i` | HIMARS-class / ATACMS Block I SAMPLE analog (wheeled launcher, short round) | `source/public/models/sphere-atacms-block-i.glb` | OE Flex SAMPLE demo | CC0 |
| `sphere-atacms-later-block` | M270 / later-block ATACMS SAMPLE analog (tracked launcher, longer round) | `source/public/models/sphere-atacms-later-block.glb` | OE Flex SAMPLE demo | CC0 |

Each GLB carries base color, roughness/metal, and a normal map baked in the build script, plus glass and lamp materials where the silhouette needs them. Image-based lighting in the viewer uses three.js `RoomEnvironment` (MIT, part of the `three` dependency), not an external HDRI.

No Sketchfab, CGTrader, or other CDN models are hotlinked.
