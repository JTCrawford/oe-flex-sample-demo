import type { Group, Material, Object3D, Texture } from 'three';
import type { SphereAnalysis, SphereAnalysisNote, SphereLayerId } from '../data/sphereAnalysis';
import { SPHERE_LAYERS } from '../data/sphereAnalysis';

/**
 * Color-coded callouts that sit beside the mesh. They are labels, not a
 * range ring and not a line onto a hit point. The defeat layer stays off
 * the hull so it cannot be read as a firing solution.
 */
export const LAYER_SWATCH: Record<SphereLayerId, string> = {
  strengths: '#3dd68c',
  weaknesses: '#f5a623',
  defeat: '#c9a0ff',
  capabilities: '#6ec6ff',
};

const LAYER_HEX: Record<SphereLayerId, number> = {
  strengths: 0x3dd68c,
  weaknesses: 0xf5a623,
  defeat: 0xc9a0ff,
  capabilities: 0x6ec6ff,
};

/** Azimuth (radians) and height, in units of the fitted radius, for each band. */
const BAND: Record<SphereLayerId, { azimuth: number; height: number; radius: number }> = {
  strengths: { azimuth: 0.4, height: 0.55, radius: 1.72 },
  weaknesses: { azimuth: 2.5, height: -0.08, radius: 1.72 },
  defeat: { azimuth: 4.3, height: 0.95, radius: 2.15 },
  capabilities: { azimuth: -1.15, height: 0.22, radius: 1.9 },
};

export interface AnalysisOverlay {
  object: Group;
  setAnalysis: (
    analysis: SphereAnalysis,
    visible: Record<SphereLayerId, boolean>,
  ) => void;
  dispose: () => void;
}

export function createAnalysisOverlay(
  THREE: typeof import('three'),
  focus: import('three').Vector3,
  span: number,
): AnalysisOverlay {
  const root = new THREE.Group();
  root.name = 'analysis-overlay';
  const bands: Record<SphereLayerId, Group> = {
    strengths: new THREE.Group(),
    weaknesses: new THREE.Group(),
    defeat: new THREE.Group(),
    capabilities: new THREE.Group(),
  };
  (Object.keys(bands) as SphereLayerId[]).forEach((id) => {
    bands[id].name = `analysis-${id}`;
    bands[id].visible = false;
    root.add(bands[id]);
  });

  let signature = '';
  const textures: Texture[] = [];
  const owned: Object3D[] = [];

  const clearBands = () => {
    (Object.keys(bands) as SphereLayerId[]).forEach((id) => {
      bands[id].clear();
    });
    owned.splice(0).forEach((obj) => {
      obj.traverse((child) => {
        const drawable = child as import('three').Mesh & { material?: Material | Material[] };
        drawable.geometry?.dispose();
        const material = drawable.material;
        if (!material) return;
        const list = Array.isArray(material) ? material : [material];
        list.forEach((item) => item.dispose());
      });
    });
    textures.splice(0).forEach((texture) => texture.dispose());
  };

  const setAnalysis = (
    analysis: SphereAnalysis,
    visible: Record<SphereLayerId, boolean>,
  ) => {
    const next = JSON.stringify(analysis);
    if (next !== signature) {
      signature = next;
      clearBands();
      for (const layer of SPHERE_LAYERS) {
        mountLayer(THREE, bands[layer.id], layer.id, overlayNotes(analysis[layer.id]), focus, span, textures, owned);
      }
    }
    (Object.keys(bands) as SphereLayerId[]).forEach((id) => {
      bands[id].visible = visible[id];
    });
  };

  return {
    object: root,
    setAnalysis,
    dispose: () => {
      clearBands();
      root.removeFromParent();
    },
  };
}

/** Platform notes first. The scenario banner stays on the card, not on the mesh. */
function overlayNotes(notes: SphereAnalysisNote[]): SphereAnalysisNote[] {
  const platform = notes.filter((note) => !note.id.endsWith('-scenario'));
  return (platform.length > 0 ? platform : notes).slice(0, 3);
}

function mountLayer(
  THREE: typeof import('three'),
  band: Group,
  id: SphereLayerId,
  notes: SphereAnalysisNote[],
  focus: import('three').Vector3,
  span: number,
  textures: Texture[],
  owned: Object3D[],
) {
  if (notes.length === 0) return;
  const spec = BAND[id];
  const positions = notes.map((_, index) => {
    const angle = spec.azimuth + (index - (notes.length - 1) / 2) * 0.62;
    return new THREE.Vector3(
      focus.x + Math.cos(angle) * span * spec.radius,
      focus.y + spec.height * span,
      focus.z + Math.sin(angle) * span * spec.radius,
    );
  });

  if (positions.length >= 2) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(positions),
      new THREE.LineBasicMaterial({
        color: LAYER_HEX[id],
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      }),
    );
    line.renderOrder = 12;
    band.add(line);
    owned.push(line);
  }

  notes.forEach((note, index) => {
    const texture = labelTexture(THREE, note.title, LAYER_SWATCH[id]);
    textures.push(texture);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(positions[index]);
    sprite.scale.set(span * 1.45, span * 0.28, 1);
    sprite.renderOrder = 20;
    sprite.name = `analysis-label-${id}-${note.id}`;
    band.add(sprite);
    owned.push(sprite);
  });
}

function labelTexture(THREE: typeof import('three'), title: string, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    roundRect(ctx, 6, 14, 500, 68, 14);
    ctx.fillStyle = 'rgba(14, 22, 36, 0.9)';
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(6, 14, 8, 68);
    ctx.fillStyle = '#e8eef7';
    ctx.font = '600 28px sans-serif';
    ctx.textBaseline = 'middle';
    const clipped = title.length > 28 ? `${title.slice(0, 27)}…` : title;
    ctx.fillText(clipped, 26, 48);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
