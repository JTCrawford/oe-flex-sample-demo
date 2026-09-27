import type * as THREE from 'three';
import { createPartFactory, type AnchorMap } from './buildShared';

/** Stylized SAMPLE main battle tank. Not a drawing of a fielded vehicle. */
export const mbtAnchors: AnchorMap = {
  'rear-deck': [0, 1.18, -1.2],
  'turret-ring': [-0.98, 1.1, 0.18],
  'driver-port': [0, 1.02, 1.95],
  belly: [0, 0.18, 0.1],
  'skirt-gap': [1.5, 0.5, 0.45],
};

export function buildMbt(root: THREE.Group) {
  const p = createPartFactory(root);
  p.box([2.15, 0.58, 3.5], [0, 0.72, 0], 0x4e5a34);
  p.box([2.05, 0.22, 0.85], [0, 0.95, 1.45], 0x55633a, [-0.42, 0, 0]);
  p.box([1.85, 0.07, 0.85], [0, 1.08, -1.18], 0x1a1a18);
  p.box([1.7, 0.1, 2.6], [0, 0.36, 0.05], 0x8a7358);
  p.box([1.9, 0.48, 0.08], [0, 0.7, -1.78], 0x3a4030);
  p.box([0.28, 0.14, 0.1], [-0.4, 0.86, -1.86], 0x6a3a28);
  p.box([0.28, 0.14, 0.1], [0.4, 0.86, -1.86], 0x6a3a28);
  p.box([0.38, 0.48, 3.7], [-1.22, 0.42, 0], 0x1c1c1c);
  p.box([0.38, 0.48, 3.7], [1.22, 0.42, 0], 0x1c1c1c);
  p.box([0.06, 0.26, 2.6], [-1.02, 0.62, 0.05], 0x3f4a30);
  p.box([0.06, 0.26, 2.6], [1.02, 0.62, 0.05], 0x3f4a30);
  for (const x of [-1.0, 1.0]) {
    for (let i = 0; i < 6; i += 1) {
      const z = -1.35 + i * 0.54;
      p.cyl(0.17, 0.17, 0.18, [x, 0.26, z], 0x2a2a28, 'x', 8);
    }
  }
  p.box([1.4, 0.46, 1.65], [0, 1.22, 0.15], 0x3e4a2c);
  p.box([1.15, 0.26, 0.55], [0, 1.16, -0.72], 0x364228);
  p.cyl(0.16, 0.16, 0.08, [0.28, 1.5, 0.02], 0x5c6840, 'y', 8);
  p.box([0.34, 0.08, 0.06], [0, 0.98, 1.72], 0x101410);
  p.cyl(0.07, 0.07, 2.35, [0, 1.28, 1.85], 0x2c2c2a, 'z', 8);
  p.cyl(0.11, 0.11, 0.26, [0, 1.28, 1.35], 0x242422, 'z', 8);
  p.cyl(0.09, 0.09, 0.08, [0, 1.28, 3.02], 0x3a3a36, 'z', 8);
}
