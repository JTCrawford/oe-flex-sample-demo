/**
 * Licensed soldier packs stay on the authoring Mac. The public demo probes
 * these URLs and falls back to the CC0 recognition mesh when they 404.
 * Do not commit the GLB files.
 */
export const SOLDIER_GLB_CANDIDATES = [
  'models/skins/soldiers/soldier-pack-aaa/SK_SoldierPackVol1.glb',
  'models/skins/soldiers/modular-soldier-pack/Soldier-Pack6.glb',
] as const;

/** Mac drop path, relative to the Vite `public/` folder. */
export const SOLDIER_MAC_ROOT =
  '~/OE-Flex-Demo/gh-pages/source/public/models/skins/soldiers/';
