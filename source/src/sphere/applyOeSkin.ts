import type { Material, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three';
import type { SphereModelId } from '../data/engagementSphere';
import {
  oeSkinById,
  repeatMetersFor,
  skinFolder,
  type OeSkin,
} from '../data/oeSkins';

export interface SkinIndex {
  modelTexture: Record<string, string>;
  modelGlb: Record<string, string>;
}

export interface ResolvedSkin {
  skin: OeSkin;
  folder: string;
  textureUrl: string;
  /** Set when this OE folder ships a full mesh for the vehicle. Null uses the recognition GLB plus the pattern. */
  glbUrl: string | null;
  meters: number;
  filter: 'nearest' | 'linear';
}

const indexCache = new Map<string, Promise<SkinIndex>>();

const EMPTY_INDEX: SkinIndex = { modelTexture: {}, modelGlb: {} };

function assetBase(): string {
  return import.meta.env.BASE_URL;
}

async function loadSkinIndex(folder: string): Promise<SkinIndex> {
  const cached = indexCache.get(folder);
  if (cached) return cached;
  const pending = fetch(`${assetBase()}models/skins/${folder}/index.json`)
    .then(async (response) => {
      if (!response.ok) return EMPTY_INDEX;
      const body = (await response.json()) as Partial<SkinIndex>;
      return {
        modelTexture: body.modelTexture ?? {},
        modelGlb: body.modelGlb ?? {},
      };
    })
    .catch(() => EMPTY_INDEX);
  indexCache.set(folder, pending);
  return pending;
}

/** Pattern URL for swatches. The viewer resolves per-vehicle overrides separately. */
export function skinSwatchUrl(skin: OeSkin, aoId: string | null): string {
  return `${assetBase()}models/skins/${skinFolder(skin, aoId)}/${skin.file}`;
}

export async function resolveSkinAssets(
  modelId: SphereModelId,
  skinId: string,
  aoId: string | null,
): Promise<ResolvedSkin> {
  const skin = oeSkinById(skinId);
  const folder = skinFolder(skin, aoId);
  const index = await loadSkinIndex(folder);
  const textureFile = index.modelTexture[modelId] ?? skin.file;
  const glbFile = index.modelGlb[modelId];
  return {
    skin,
    folder,
    textureUrl: `${assetBase()}models/skins/${folder}/${textureFile}`,
    glbUrl: glbFile ? `${assetBase()}models/skins/${folder}/${glbFile}` : null,
    meters: repeatMetersFor(skin, modelId),
    filter: skin.filter,
  };
}

export interface OeSkinSlot {
  uniforms: {
    oeCamoMap: { value: Texture | null };
    oeMeters: { value: number };
    oeStrength: { value: number };
  };
  setTexture: (texture: Texture, meters: number) => void;
  disposeTexture: () => void;
}

function isPaintable(material: Material): material is MeshStandardMaterial {
  const mat = material as MeshStandardMaterial;
  if (!mat.isMeshStandardMaterial) return false;
  if (!mat.map || !mat.metalnessMap) return false;
  const physical = mat as MeshStandardMaterial & { transmission?: number };
  if ((physical.transmission ?? 0) > 0) return false;
  if (mat.transparent && mat.opacity < 0.99) return false;
  if (mat.emissiveIntensity > 0.5) return false;
  return true;
}

/**
 * Paint surfaces pick up a triplanar OE pattern. High metalness (tracks hardware,
 * gun steel), dark rubber, and saturated marks (boot topping, SAMPLE labels) stay
 * on the baked map. Glass and lamps are separate materials and are left alone.
 */
export function bindOeSkin(
  root: Object3D,
  THREE: typeof import('three'),
): OeSkinSlot {
  const placeholder = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  placeholder.colorSpace = THREE.SRGBColorSpace;
  placeholder.wrapS = THREE.RepeatWrapping;
  placeholder.wrapT = THREE.RepeatWrapping;
  placeholder.needsUpdate = true;
  const uniforms = {
    oeCamoMap: { value: placeholder as Texture | null },
    oeMeters: { value: 4 },
    oeStrength: { value: 0 },
  };
  let current: Texture | null = null;

  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      if (!isPaintable(material)) continue;
      material.onBeforeCompile = (shader) => {
        shader.uniforms.oeCamoMap = uniforms.oeCamoMap;
        shader.uniforms.oeMeters = uniforms.oeMeters;
        shader.uniforms.oeStrength = uniforms.oeStrength;
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            '#include <common>\nvarying vec3 oeLocalPos;\nvarying vec3 oeLocalN;',
          )
          .replace(
            '#include <project_vertex>',
            '#include <project_vertex>\noeLocalPos = transformed;\noeLocalN = normal;',
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            '#include <common>\nuniform sampler2D oeCamoMap;\nuniform float oeMeters;\nuniform float oeStrength;\nvarying vec3 oeLocalPos;\nvarying vec3 oeLocalN;',
          )
          .replace(
            '#include <metalnessmap_fragment>',
            `#include <metalnessmap_fragment>
{
  vec3 oeN = abs(normalize(oeLocalN));
  oeN /= max(oeN.x + oeN.y + oeN.z, 1e-4);
  vec3 oeP = oeLocalPos / max(oeMeters, 0.25);
  vec3 oeCamo = texture2D(oeCamoMap, oeP.zy).rgb * oeN.x
    + texture2D(oeCamoMap, oeP.xz).rgb * oeN.y
    + texture2D(oeCamoMap, oeP.xy).rgb * oeN.z;
  float oeLuma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  float oeMaxc = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
  float oeMinc = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
  float oeSat = oeMaxc - oeMinc;
  float oePaint = (1.0 - smoothstep(0.16, 0.38, metalnessFactor))
    * smoothstep(0.055, 0.12, oeLuma)
    * (1.0 - smoothstep(0.18, 0.32, oeSat));
  float oeShade = clamp(oeLuma / 0.30, 0.42, 1.12);
  diffuseColor.rgb = mix(diffuseColor.rgb, oeCamo * oeShade, oePaint * oeStrength);
}`,
          );
      };
      material.customProgramCacheKey = () => 'oe-skin-v1';
      material.needsUpdate = true;
    }
  });

  return {
    uniforms,
    setTexture(texture, meters) {
      if (current && current !== texture) current.dispose();
      current = texture;
      uniforms.oeCamoMap.value = texture;
      uniforms.oeMeters.value = meters;
      uniforms.oeStrength.value = 1;
    },
    disposeTexture() {
      if (current) current.dispose();
      current = null;
      placeholder.dispose();
      uniforms.oeCamoMap.value = null;
    },
  };
}

export async function loadCamoTexture(
  THREE: typeof import('three'),
  url: string,
  filter: 'nearest' | 'linear',
): Promise<Texture> {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (filter === 'nearest') {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
  } else {
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.anisotropy = 4;
  }
  texture.needsUpdate = true;
  return texture;
}
