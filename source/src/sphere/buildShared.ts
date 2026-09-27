import * as THREE from 'three';

/** Local anchors in model space: Y up, +Z front / bow / nose, +X starboard. */
export type AnchorMap = Record<string, readonly [number, number, number]>;

export interface PartFactory {
  box(
    size: [number, number, number],
    position: [number, number, number],
    color: number,
    rotation?: [number, number, number],
  ): THREE.Mesh;
  cyl(
    radiusTop: number,
    radiusBottom: number,
    length: number,
    position: [number, number, number],
    color: number,
    axis: 'x' | 'y' | 'z',
    segments?: number,
  ): THREE.Mesh;
  cone(
    radius: number,
    length: number,
    position: [number, number, number],
    color: number,
    axis: 'y' | 'z',
    segments?: number,
  ): THREE.Mesh;
  sphere(
    radius: number,
    position: [number, number, number],
    color: number,
    segments?: number,
  ): THREE.Mesh;
}

/**
 * Shared low-poly parts. Materials are reused per color.
 * Cone tip maps to +Z when axis is 'z' (Cylinder/Cone default along +Y).
 */
export function createPartFactory(root: THREE.Group): PartFactory {
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  const material = (color: number) => {
    let mat = materials.get(color);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.78,
        metalness: 0.12,
        flatShading: true,
        side: THREE.DoubleSide,
      });
      materials.set(color, mat);
    }
    return mat;
  };

  const place = (
    mesh: THREE.Mesh,
    position: [number, number, number],
    rotation?: [number, number, number],
  ) => {
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    root.add(mesh);
    return mesh;
  };

  return {
    box(size, position, color, rotation) {
      return place(
        new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material(color)),
        position,
        rotation,
      );
    },
    cyl(radiusTop, radiusBottom, length, position, color, axis, segments = 8) {
      const rotation: [number, number, number] =
        axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
      return place(
        new THREE.Mesh(
          new THREE.CylinderGeometry(radiusTop, radiusBottom, length, segments),
          material(color),
        ),
        position,
        rotation,
      );
    },
    cone(radius, length, position, color, axis, segments = 8) {
      const rotation: [number, number, number] = axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
      return place(
        new THREE.Mesh(new THREE.ConeGeometry(radius, length, segments), material(color)),
        position,
        rotation,
      );
    },
    sphere(radius, position, color, segments = 8) {
      return place(
        new THREE.Mesh(
          new THREE.SphereGeometry(radius, segments, Math.max(6, segments - 2)),
          material(color),
        ),
        position,
      );
    },
  };
}
