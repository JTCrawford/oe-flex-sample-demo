import type { Group, Object3D } from 'three';
import type { SphereModelId } from '../data/engagementSphere';

/** Local anchors in model space: Y up, +Z front / bow / nose, +X starboard. */
export type AnchorMap = Record<string, readonly [number, number, number]>;

/**
 * Lazy-load one vendored photoreal GLB. Anchor empties are read then removed
 * so they do not render. The caller owns disposal of the returned scene.
 */
export async function loadPhotoreal(id: SphereModelId, root: Group): Promise<{
  scene: Group;
  anchors: AnchorMap;
}> {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const url = `${import.meta.env.BASE_URL}models/${id}.glb`;
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
  return { scene, anchors };
}
