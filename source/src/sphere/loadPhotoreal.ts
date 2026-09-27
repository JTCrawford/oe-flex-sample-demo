import type { Group, Object3D } from 'three';
import { renderMeshId, type SphereModelId } from '../data/engagementSphere';
import { SOLDIER_GLB_CANDIDATES } from '../data/soldierMeshes';

/** Local anchors in model space: Y up, +Z front / bow / nose, +X starboard. */
export type AnchorMap = Record<string, readonly [number, number, number]>;

export type PhotorealSource = 'override' | 'soldier-glb' | 'cc0';

/**
 * Lazy-load one vendored photoreal GLB. Anchor empties are read then removed
 * so they do not render. The caller owns disposal of the returned scene.
 * Infantry probes the Mac-local soldier GLBs and keeps the CC0 mesh on a miss.
 */
export async function loadPhotoreal(
  id: SphereModelId,
  root: Group,
  urlOverride?: string | null,
): Promise<{
  scene: Group;
  anchors: AnchorMap;
  source: PhotorealSource;
  revoke?: () => void;
}> {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const fallback = `${import.meta.env.BASE_URL}models/${renderMeshId(id)}.glb`;
  let url = urlOverride || fallback;
  let source: PhotorealSource = urlOverride ? 'override' : 'cc0';
  let revoke: (() => void) | undefined;

  if (!urlOverride && id === 'sphere-soldier') {
    const local = await firstSoldierGlb();
    if (local) {
      url = local.url;
      revoke = local.revoke;
      source = 'soldier-glb';
    } else {
      url = fallback;
      source = 'cc0';
    }
  }

  const gltf = await loader.loadAsync(url);
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);
  const anchors: AnchorMap = {};
  const drop: Object3D[] = [];
  scene.traverse((obj) => {
    if (!obj.name.startsWith('anchor:')) return;
    const world = obj.getWorldPosition(new THREE.Vector3());
    const local = scene.worldToLocal(world.clone());
    anchors[obj.name.slice('anchor:'.length)] = [local.x, local.y, local.z];
    drop.push(obj);
  });
  drop.forEach((obj) => obj.removeFromParent());
  root.add(scene);
  return { scene, anchors, source, revoke };
}

/** glTF binary magic, ASCII "glTF". Rejects HTML rewrites that answer 200. */
function isGlbMagic(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 4 &&
    bytes[0] === 0x67 &&
    bytes[1] === 0x6c &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x46
  );
}

async function firstSoldierGlb(): Promise<{ url: string; revoke: () => void } | null> {
  for (const path of SOLDIER_GLB_CANDIDATES) {
    const candidate = `${import.meta.env.BASE_URL}${path}`;
    try {
      const response = await fetch(candidate);
      if (!response.ok) continue;
      const type = response.headers.get('content-type') ?? '';
      if (type.includes('text/html')) continue;
      const buffer = await response.arrayBuffer();
      if (!isGlbMagic(new Uint8Array(buffer, 0, 4))) continue;
      const blobUrl = URL.createObjectURL(
        new Blob([buffer], { type: 'model/gltf-binary' }),
      );
      return { url: blobUrl, revoke: () => URL.revokeObjectURL(blobUrl) };
    } catch {
      /* missing pack, try the next path */
    }
  }
  return null;
}
