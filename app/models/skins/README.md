# OE skin drop-in

UNCLASS SAMPLE. Patterns in these folders are original CC0 textures from `source/tools/build_oe_skins.py`. They are not issued-fabric scans.

The sphere dialog auto-selects a skin from the open area of operations. Ukraine East OPFOR uses temperate woodland. Ukraine East partner fires use Ukrainian digital. Suwałki Gap uses temperate woodland. Hormuz air and land use desert tan. The corvette uses naval grey. Arctic and jungle are selectable and not tied to a SAMPLE AO yet.

## Replace a pattern

Put a PNG in the OE folder and keep the file name (`temperate-woodland.png`, `ukrainian-digital.png`, `desert-tan.png`, `naval-grey.png`, `arctic.png`, `jungle.png`). Reload the app. The 3D viewer and the 2D plates both sample that file.

## Per-vehicle override

Edit `index.json` in the OE folder:

```json
{
  "modelTexture": {
    "sphere-mbt": "sphere-mbt.png"
  },
  "modelGlb": {
    "sphere-mbt": "sphere-mbt.glb"
  }
}
```

- `modelTexture` swaps the camouflage image for that stable id.
- `modelGlb` swaps the whole mesh when that skin is selected. Copy `anchor:<id>` empties from the recognition GLB if weak-point markers should sit on the new hull. A mesh with no anchors keeps the recognition-mesh marker positions.

Do not add a game extract. Redistribution has to allow this public repo and the public Vercel demo. See `docs/SPHERE_MODEL_PROCUREMENT.md`.
