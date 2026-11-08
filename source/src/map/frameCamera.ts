import * as Cesium from 'cesium';
import { metersPerPixelForRf, nativeMetersPerPixel, nativeZoom, offsetLatLng, type MapScalePreset } from './mapScale';

/**
 * Orthographic zoom keeps this height and changes the frustum width instead.
 * Cesium rewrites the width from camera height while the camera is above
 * 150 km, so the lock stays under that and the width is restored every frame.
 */
export const ORTHO_LOCK_HEIGHT = 100_000;

let nadirWidth = 0;

function restoreNadirWidth(viewer: Cesium.Viewer) {
  const frustum = viewer.camera.frustum;
  if (frustum instanceof Cesium.OrthographicFrustum && nadirWidth > 0) frustum.width = nadirWidth;
}

const scratchA = new Cesium.Cartesian2();
const scratchB = new Cesium.Cartesian2();

export function googleTilesAreShowing(
  base: string,
  compare: boolean,
  tileset: { show?: boolean; isDestroyed?: () => boolean } | null,
): boolean {
  if (base !== 'photoreal' || compare || !tileset) return false;
  if (tileset.isDestroyed?.()) return false;
  return tileset.show !== false;
}

export function resolutionFloorMpp(
  layer: 'satellite' | 'terrain' | 'photoreal' | 'military',
  lat: number,
  lng: number,
  googleDetail: boolean,
): number {
  if (googleDetail) return 0.15;
  return nativeMetersPerPixel(nativeZoom(layer, lat, lng), lat);
}

export function freeCenterInCanvas(canvas: HTMLCanvasElement): { x: number; y: number } {
  const root = (canvas.closest('.map-col') as HTMLElement | null) ?? canvas;
  const rootRect = root.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  let left = 0;
  let right = rootRect.width;
  let top = 0;
  let bottom = rootRect.height;
  const nodes = root.querySelectorAll<HTMLElement>(
    '.float-card, .overlay-panel, .dock-tab, .map-controls, .layer-switch, .scale-bar, .class-banner, .map-attribution, .weather-stub',
  );
  for (const el of nodes) {
    if (el.getClientRects().length === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    const x1 = rect.left - rootRect.left;
    const x2 = rect.right - rootRect.left;
    const y1 = rect.top - rootRect.top;
    const y2 = rect.bottom - rootRect.top;
    const tall = rect.height > 72 && y1 < rootRect.height * 0.62;
    if (tall && x1 < rootRect.width * 0.45 && x2 < rootRect.width * 0.72) left = Math.max(left, x2);
    if (tall && x1 > rootRect.width * 0.4) right = Math.min(right, x1);
    if (y1 <= 8) top = Math.max(top, y2);
    if (y2 >= rootRect.height - 10 || y1 > rootRect.height * 0.52) bottom = Math.min(bottom, y1);
  }
  if (right - left < 120) {
    left = 0;
    right = rootRect.width;
  }
  if (bottom - top < 120) {
    top = 0;
    bottom = rootRect.height;
  }
  return {
    x: (left + right) / 2 - (canvasRect.left - rootRect.left),
    y: (top + bottom) / 2 - (canvasRect.top - rootRect.top),
  };
}

export function measureMetersPerPixel(viewer: Cesium.Viewer): number | null {
  const canvas = viewer.scene.canvas;
  const free = freeCenterInCanvas(canvas);
  const span = 64;
  scratchA.x = free.x;
  scratchA.y = free.y;
  scratchB.x = free.x + span;
  scratchB.y = free.y;
  const start = viewer.camera.pickEllipsoid(scratchA);
  const end = viewer.camera.pickEllipsoid(scratchB);
  if (start && end) return Cesium.Cartesian3.distance(start, end) / span;
  const frustum = viewer.camera.frustum;
  if (frustum instanceof Cesium.OrthographicFrustum && canvas.clientWidth > 0 && frustum.width) {
    return frustum.width / canvas.clientWidth;
  }
  if (frustum instanceof Cesium.PerspectiveFrustum && frustum.fovy) {
    const height = viewer.camera.positionCartographic?.height;
    if (height && canvas.clientHeight > 0) {
      return (2 * height * Math.tan(frustum.fovy / 2)) / canvas.clientHeight;
    }
  }
  return null;
}

function groundUnderCanvas(viewer: Cesium.Viewer): { lat: number; lng: number } | null {
  const canvas = viewer.scene.canvas;
  const free = freeCenterInCanvas(canvas);
  scratchA.x = free.x;
  scratchA.y = free.y;
  const hit = viewer.camera.pickEllipsoid(scratchA);
  if (!hit) return null;
  const carto = Cesium.Cartographic.fromCartesian(hit);
  return {
    lat: Cesium.Math.toDegrees(carto.latitude),
    lng: Cesium.Math.toDegrees(carto.longitude),
  };
}

export function cameraGround(viewer: Cesium.Viewer): { lat: number; lng: number } {
  const picked = groundUnderCanvas(viewer);
  if (picked) return picked;
  const carto = viewer.camera.positionCartographic;
  return {
    lat: Cesium.Math.toDegrees(carto.latitude),
    lng: Cesium.Math.toDegrees(carto.longitude),
  };
}

function pinOrthoHeight(viewer: Cesium.Viewer) {
  const carto = viewer.camera.positionCartographic;
  if (!carto) return;
  if (Math.abs(carto.height - ORTHO_LOCK_HEIGHT) < 2) return;
  viewer.camera.position = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, ORTHO_LOCK_HEIGHT);
}

/** Move the camera so `lat/lng` lands on the free-map center. Two passes. */
export function nudgeTargetToFreeCenter(viewer: Cesium.Viewer, lat: number, lng: number) {
  const canvas = viewer.scene.canvas;
  const target = Cesium.Cartesian3.fromDegrees(lng, lat);
  for (let pass = 0; pass < 2; pass += 1) {
    const projected = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, target);
    if (!projected) return;
    const free = freeCenterInCanvas(canvas);
    const dx = free.x - projected.x;
    const dy = free.y - projected.y;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    const mpp = measureMetersPerPixel(viewer) ?? 20;
    const frustum = viewer.camera.frustum;
    if (frustum instanceof Cesium.OrthographicFrustum) {
      const carto = viewer.camera.positionCartographic;
      const hereLat = Cesium.Math.toDegrees(carto.latitude);
      const hereLng = Cesium.Math.toDegrees(carto.longitude);
      const next = offsetLatLng(hereLat, hereLng, dy * mpp, -dx * mpp);
      viewer.camera.position = Cesium.Cartesian3.fromDegrees(next.lng, next.lat, ORTHO_LOCK_HEIGHT);
      viewer.camera.setView({
        orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
      });
      restoreNadirWidth(viewer);
      continue;
    }
    const shift = new Cesium.Cartesian3();
    Cesium.Cartesian3.multiplyByScalar(viewer.camera.right, -dx * mpp, shift);
    const up = new Cesium.Cartesian3();
    Cesium.Cartesian3.multiplyByScalar(viewer.camera.up, dy * mpp, up);
    Cesium.Cartesian3.add(viewer.camera.position, shift, viewer.camera.position);
    Cesium.Cartesian3.add(viewer.camera.position, up, viewer.camera.position);
  }
}

export function applyOrthographicNadir(viewer: Cesium.Viewer, lat: number, lng: number, mpp: number) {
  const camera = viewer.camera;
  if (!(camera.frustum instanceof Cesium.OrthographicFrustum)) camera.switchToOrthographicFrustum();
  const canvas = viewer.scene.canvas;
  camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(lng, lat, ORTHO_LOCK_HEIGHT),
    orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
  });
  nadirWidth = Math.max(1, mpp) * Math.max(1, canvas.clientWidth);
  restoreNadirWidth(viewer);
  const actual = measureMetersPerPixel(viewer);
  if (actual && actual > 0) nadirWidth *= mpp / actual;
  restoreNadirWidth(viewer);
  nudgeTargetToFreeCenter(viewer, lat, lng);
  pinOrthoHeight(viewer);
  restoreNadirWidth(viewer);
}

export function applyPerspectiveView(
  viewer: Cesium.Viewer,
  lat: number,
  lng: number,
  height: number,
  pitchDeg: number,
  headingRad: number,
) {
  const camera = viewer.camera;
  if (!(camera.frustum instanceof Cesium.PerspectiveFrustum)) camera.switchToPerspectiveFrustum();
  camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
    orientation: {
      heading: headingRad,
      pitch: Cesium.Math.toRadians(pitchDeg),
      roll: 0,
    },
  });
  nudgeTargetToFreeCenter(viewer, lat, lng);
}

export function clampToNativeResolution(
  viewer: Cesium.Viewer,
  layer: 'satellite' | 'terrain' | 'photoreal' | 'military',
  googleDetail: boolean,
) {
  const carto = viewer.camera.positionCartographic;
  if (!carto) return;
  const lat = Cesium.Math.toDegrees(carto.latitude);
  const lng = Cesium.Math.toDegrees(carto.longitude);
  const minMpp = resolutionFloorMpp(layer, lat, lng, googleDetail);
  const canvas = viewer.scene.canvas;
  const controller = viewer.scene.screenSpaceCameraController;
  const frustum = viewer.camera.frustum;
  if (frustum instanceof Cesium.OrthographicFrustum) {
    controller.minimumZoomDistance = 150;
    const minWidth = minMpp * Math.max(1, canvas.clientWidth);
    if (nadirWidth > 0 && nadirWidth < minWidth) nadirWidth = minWidth;
    if ((frustum.width ?? 0) < minWidth) frustum.width = minWidth;
    return;
  }
  if (frustum instanceof Cesium.PerspectiveFrustum && frustum.fovy && canvas.clientHeight > 0) {
    const minHeight = (minMpp * canvas.clientHeight) / (2 * Math.tan(frustum.fovy / 2));
    controller.minimumZoomDistance = googleDetail ? 40 : Math.max(180, minHeight);
    if (!googleDetail && carto.height < minHeight * 0.98) {
      viewer.camera.position = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, minHeight);
    }
  }
}

/**
 * Wheel zoom in orthographic mode moves the camera. Fold that height change
 * into the frustum width so the scale changes and the view stays nadir.
 */
export function syncOrthographicZoom(viewer: Cesium.Viewer, minMpp: number) {
  const camera = viewer.camera;
  const frustum = camera.frustum;
  if (!(frustum instanceof Cesium.OrthographicFrustum)) return;
  const carto = camera.positionCartographic;
  if (!carto) return;
  const height = carto.height;
  if (!Number.isFinite(height) || height < 100) return;
  const canvas = viewer.scene.canvas;
  const minWidth = minMpp * Math.max(1, canvas.clientWidth);
  const maxWidth = 12_000 * Math.max(1, canvas.clientWidth);
  if (nadirWidth <= 0 && frustum.width) nadirWidth = frustum.width;
  if (Math.abs(height - ORTHO_LOCK_HEIGHT) > 80 && nadirWidth > 0) {
    nadirWidth *= height / ORTHO_LOCK_HEIGHT;
    camera.position = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, ORTHO_LOCK_HEIGHT);
  }
  if (nadirWidth > 0) {
    nadirWidth = Math.min(maxWidth, Math.max(minWidth, nadirWidth));
    frustum.width = nadirWidth;
  }
  const heading = Math.atan2(Math.sin(camera.heading), Math.cos(camera.heading));
  if (
    Math.abs(heading) > 1e-2 ||
    Math.abs(camera.pitch + Cesium.Math.PI_OVER_TWO) > 1e-2 ||
    Math.abs(camera.roll) > 1e-2
  ) {
    camera.setView({ orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 } });
    restoreNadirWidth(viewer);
  }
}

export function orthoMpp(viewer: Cesium.Viewer): number | null {
  const frustum = viewer.camera.frustum;
  const canvas = viewer.scene.canvas;
  if (frustum instanceof Cesium.OrthographicFrustum && canvas.clientWidth > 0 && frustum.width) {
    return frustum.width / canvas.clientWidth;
  }
  return measureMetersPerPixel(viewer);
}

export function mppForPresetOrFloor(rf: MapScalePreset | number, floorMpp: number): { mpp: number; clamped: boolean } {
  const wanted = metersPerPixelForRf(rf);
  if (wanted < floorMpp) return { mpp: floorMpp, clamped: true };
  return { mpp: wanted, clamped: false };
}
