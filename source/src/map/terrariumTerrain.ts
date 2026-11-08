import * as Cesium from 'cesium';
import { ELEVATION_CREDIT } from './layerCatalog';

const MAX_LEVEL = 11;
const TILE = 256;

/**
 * Web-Mercator heightmap terrain decoded from Mapzen/AWS terrarium PNGs.
 * The public S3 bucket does not send CORS headers, so tiles are read through
 * the same-origin `/api/terrain` proxy. Ocean depths are clamped to sea level
 * so satellite imagery stays on the water surface.
 */
export function createTerrariumTerrainProvider(): Cesium.TerrainProvider {
  const tilingScheme = new Cesium.WebMercatorTilingScheme();
  const levelZeroError = Cesium.TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
    tilingScheme.ellipsoid,
    TILE,
    tilingScheme.getNumberOfXTilesAtLevel(0),
  );
  const cache = new Map<string, Promise<Cesium.HeightmapTerrainData>>();
  const credit = new Cesium.Credit(ELEVATION_CREDIT);

  const flat = (childTileMask: number) =>
    new Cesium.HeightmapTerrainData({
      buffer: new Float32Array(TILE * TILE),
      width: TILE,
      height: TILE,
      childTileMask,
    });

  const provider = {
    credit,
    tilingScheme,
    errorEvent: new Cesium.Event(),
    hasWaterMask: false,
    hasVertexNormals: false,
    availability: undefined,
    getLevelMaximumGeometricError(level: number) {
      return levelZeroError / 2 ** level;
    },
    getTileDataAvailable(_x: number, _y: number, level: number) {
      return level <= MAX_LEVEL;
    },
    loadTileDataAvailability() {
      return undefined;
    },
    requestTileGeometry(x: number, y: number, level: number, request?: Cesium.Request) {
      if (level > MAX_LEVEL) return Promise.resolve(flat(0));
      const key = `${level}/${x}/${y}`;
      const cached = cache.get(key);
      if (cached) return cached;
      const childTileMask = level >= MAX_LEVEL ? 0 : 15;
      const pending = fetchTerrarium(level, x, y, request).then((heights) => {
        if (!heights) return flat(childTileMask);
        return new Cesium.HeightmapTerrainData({
          buffer: heights,
          width: TILE,
          height: TILE,
          childTileMask,
        });
      });
      cache.set(key, pending);
      if (cache.size > 180) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      return pending;
    },
  };

  return provider as unknown as Cesium.TerrainProvider;
}

async function fetchTerrarium(
  level: number,
  x: number,
  y: number,
  request?: Cesium.Request,
): Promise<Float32Array | null> {
  void request;
  const response = await fetch(`/api/terrain?z=${level}&x=${x}&y=${y}`);
  if (!response.ok) return null;
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, TILE, TILE);
  bitmap.close();
  const pixels = context.getImageData(0, 0, TILE, TILE).data;
  const heights = new Float32Array(TILE * TILE);
  for (let i = 0; i < TILE * TILE; i += 1) {
    const offset = i * 4;
    const red = pixels[offset] ?? 0;
    const green = pixels[offset + 1] ?? 0;
    const blue = pixels[offset + 2] ?? 0;
    const meters = red * 256 + green + blue / 256 - 32768;
    heights[i] = meters > 0 ? meters : 0;
  }
  return heights;
}
