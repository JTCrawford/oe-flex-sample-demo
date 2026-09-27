import type * as THREE from 'three';
import { createPartFactory, type AnchorMap } from './buildShared';

export type SrbmVariant = 'tochka' | 'iskander' | 'atacms-i' | 'atacms-later';

const SPEC: Record<
  SrbmVariant,
  { length: number; radius: number; nose: number; color: number; fin: number; rail: boolean }
> = {
  tochka: { length: 2.2, radius: 0.22, nose: 0.62, color: 0x5c6b3c, fin: 0.34, rail: true },
  iskander: { length: 3.15, radius: 0.28, nose: 0.78, color: 0x3e4a32, fin: 0.46, rail: true },
  'atacms-i': { length: 2.45, radius: 0.14, nose: 0.5, color: 0x8d9398, fin: 0.22, rail: true },
  'atacms-later': { length: 3.25, radius: 0.15, nose: 0.58, color: 0x9aa3a8, fin: 0.26, rail: false },
};

export function variantForModel(id: string): SrbmVariant {
  switch (id) {
    case 'sphere-iskander-m':
      return 'iskander';
    case 'sphere-atacms-block-i':
      return 'atacms-i';
    case 'sphere-atacms-later-block':
      return 'atacms-later';
    default:
      return 'tochka';
  }
}

/** Stylized SAMPLE round. Not a drawing of a fielded missile. */
export function srbmAnchors(variant: SrbmVariant): AnchorMap {
  const spec = SPEC[variant];
  const noseZ = spec.length / 2 + spec.nose * 0.72;
  const tailZ = -spec.length / 2 - 0.12;
  return {
    seeker: [0, spec.radius * 0.15, noseZ],
    nozzle: [0, 0, tailZ],
    joint: [0, spec.radius + 0.08, spec.length * 0.12],
    'fin-root': [spec.radius + spec.fin * 0.55, 0, -spec.length / 2 + 0.18],
  };
}

export function buildSrbm(root: THREE.Group, variant: SrbmVariant) {
  const spec = SPEC[variant];
  const p = createPartFactory(root);
  p.cyl(spec.radius, spec.radius, spec.length, [0, 0, 0], spec.color, 'z', 8);
  p.cone(
    spec.radius,
    spec.nose,
    [0, 0, spec.length / 2 + spec.nose / 2],
    spec.color,
    'z',
    8,
  );
  p.cyl(spec.radius * 0.45, spec.radius * 0.62, 0.16, [0, 0, -spec.length / 2 - 0.02], 0x2a2420, 'z', 8);
  const finZ = -spec.length / 2 + 0.22;
  const finReach = spec.radius + spec.fin * 0.45;
  p.box([spec.fin, 0.04, spec.fin * 0.7], [finReach, 0, finZ], 0x2c3130);
  p.box([spec.fin, 0.04, spec.fin * 0.7], [-finReach, 0, finZ], 0x2c3130);
  p.box([0.04, spec.fin, spec.fin * 0.7], [0, finReach, finZ], 0x2c3130);
  p.box([0.04, spec.fin, spec.fin * 0.7], [0, -finReach, finZ], 0x2c3130);
  if (spec.rail) {
    p.box(
      [spec.radius * 2.4, spec.radius * 0.45, spec.length * 0.92],
      [0, -spec.radius * 1.35, 0],
      0x4a4038,
    );
  }
}
