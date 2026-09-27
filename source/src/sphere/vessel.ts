import type * as THREE from 'three';
import { createPartFactory, type AnchorMap } from './buildShared';

/** Stylized SAMPLE surface vessel. Not a drawing of a fielded ship. */
export const vesselAnchors: AnchorMap = {
  bridge: [0, 1.52, 0.74],
  funnel: [0, 1.64, -0.85],
  keel: [0, -0.16, -0.05],
  magazine: [0.82, 0.2, -1.15],
};

export function buildVessel(root: THREE.Group) {
  const p = createPartFactory(root);
  p.box([1.2, 0.42, 4.2], [0, 0.28, -0.1], 0x2a3036);
  p.box([1.7, 0.32, 3.9], [0, 0.58, -0.15], 0x8d98a3);
  p.cone(0.78, 1.45, [0, 0.46, 2.2], 0x8d98a3, 'z', 4);
  p.box([1.15, 0.5, 0.12], [0, 0.4, -2.25], 0x6e787f);
  p.box([0.14, 0.16, 3.1], [0, 0.02, -0.15], 0x6b5344);
  p.cyl(0.1, 0.1, 0.06, [-0.28, 0.08, -2.15], 0xc5a15a, 'z', 6);
  p.cyl(0.1, 0.1, 0.06, [0.28, 0.08, -2.15], 0xc5a15a, 'z', 6);
  p.box([0.04, 0.28, 0.16], [-0.28, 0.16, -2.32], 0x4a4038);
  p.box([0.04, 0.28, 0.16], [0.28, 0.16, -2.32], 0x4a4038);
  p.box([0.95, 0.55, 1.45], [0, 0.98, -0.25], 0xc5ced6);
  p.box([0.8, 0.38, 0.62], [0, 1.4, 0.28], 0xd5dee6);
  p.box([0.7, 0.1, 0.04], [0, 1.42, 0.6], 0x1a3344);
  p.cyl(0.16, 0.18, 0.48, [0, 1.22, -0.85], 0x9aa3ab, 'y', 8);
  p.cyl(0.1, 0.1, 0.06, [0, 1.48, -0.85], 0x2a2a2a, 'y', 8);
  p.box([0.05, 0.85, 0.05], [0, 1.85, -0.15], 0xd0d5da);
  p.box([0.38, 0.03, 0.03], [0, 2.08, -0.15], 0xd0d5da);
  p.cyl(0.12, 0.14, 0.12, [0, 0.82, 1.15], 0x4a555c, 'y', 8);
  p.cyl(0.04, 0.04, 0.45, [0, 0.88, 1.42], 0x2c2c2a, 'z', 6);
  p.box([0.1, 0.08, 0.42], [-0.92, 0.78, 0.35], 0xc45c28);
}
