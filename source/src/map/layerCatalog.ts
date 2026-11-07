/**
 * Free basemap catalog for the SAMPLE demo.
 * Paid imagery and 3D-tile products stay behind env flags and are not requested
 * unless the operator supplies a key locally. See docs/MAP_LAYERS_LICENSES.md.
 */

export type BaseLayerId = 'satellite' | 'terrain' | 'photoreal' | 'military';

export const BASE_LAYER_ORDER: BaseLayerId[] = [
  'satellite',
  'terrain',
  'photoreal',
  'military',
];

export const BASE_LAYER_LABEL: Record<BaseLayerId, string> = {
  satellite: 'Satellite',
  terrain: 'Terrain',
  photoreal: '3D Photoreal',
  military: 'Military Map',
};

export interface ImagerySpec {
  id: string;
  /** Cesium url template. WMTS row/col services use {z}/{y}/{x}. OSM-style use {z}/{x}/{y}. */
  url: string;
  maximumLevel: number;
  minimumLevel?: number;
  subdomains?: string;
  credit: string;
  /** West, south, east, north in degrees. Omit for global coverage. */
  rectangle?: [number, number, number, number];
}

export interface LayerStyle {
  saturation: number;
  brightness: number;
  contrast: number;
  hue: number;
  gamma: number;
  /** Terrain mesh vertical exaggeration while this basemap is showing. */
  exaggeration: number;
  lighting: boolean;
}

const GIBS_CREDIT =
  'NASA GIBS / ESDIS (Blue Marble shaded relief, public domain)';

const EOX_CREDIT =
  'EOxCloudless 2016 by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017) CC BY 4.0';

const OTM_CREDIT =
  'OpenTopoMap © OpenStreetMap contributors, SRTM · map style © OpenTopoMap (CC BY-SA)';

const USGS_IMAGERY_CREDIT =
  'U.S. Geological Survey, National Geospatial Program (public domain imagery, including NAIP)';

const USGS_TOPO_CREDIT =
  'U.S. Geological Survey, National Geospatial Program (public domain topo)';

const TERRAIN_CREDIT =
  'Elevation: Mapzen / AWS Open Data Terrain Tiles (USGS 3DEP, SRTM, GMTED2010, ETOPO1, and other open DEMs)';

/** Rough boxes where USGS National Map tiles actually have coverage. */
const US_RECTS: Array<[string, [number, number, number, number]]> = [
  ['conus', [-125.5, 24.0, -66.0, 49.6]],
  ['alaska', [-170.0, 51.0, -129.0, 71.5]],
  ['hawaii', [-160.6, 18.6, -154.5, 22.5]],
  ['puerto-rico', [-67.6, 17.6, -65.1, 18.6]],
];

const GIBS: ImagerySpec = {
  id: 'gibs-blue-marble',
  url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
  maximumLevel: 8,
  credit: GIBS_CREDIT,
};

const EOX: ImagerySpec = {
  id: 'eox-s2-2016',
  url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',
  maximumLevel: 13,
  credit: EOX_CREDIT,
};

const OPEN_TOPO: ImagerySpec = {
  id: 'opentopomap',
  url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  subdomains: 'abc',
  maximumLevel: 15,
  credit: OTM_CREDIT,
};

function usgsImagery(): ImagerySpec[] {
  return US_RECTS.map(([name, rectangle]) => ({
    id: `usgs-imagery-${name}`,
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
    minimumLevel: 5,
    maximumLevel: 16,
    credit: USGS_IMAGERY_CREDIT,
    rectangle,
  }));
}

function usgsTopo(): ImagerySpec[] {
  return US_RECTS.map(([name, rectangle]) => ({
    id: `usgs-topo-${name}`,
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
    minimumLevel: 5,
    maximumLevel: 16,
    credit: USGS_TOPO_CREDIT,
    rectangle,
  }));
}

const SATELLITE_SPECS: ImagerySpec[] = [GIBS, EOX, ...usgsImagery()];
const TERRAIN_SPECS: ImagerySpec[] = [OPEN_TOPO, ...usgsTopo()];

export function imageryFor(layer: BaseLayerId): ImagerySpec[] {
  if (layer === 'terrain' || layer === 'military') return TERRAIN_SPECS;
  return SATELLITE_SPECS;
}

export function styleFor(layer: BaseLayerId): LayerStyle {
  if (layer === 'military') {
    return {
      saturation: 0.16,
      brightness: 0.78,
      contrast: 1.18,
      hue: 0.05,
      gamma: 0.9,
      exaggeration: 1.25,
      lighting: false,
    };
  }
  if (layer === 'terrain') {
    return {
      saturation: 1,
      brightness: 1,
      contrast: 1.04,
      hue: 0,
      gamma: 1,
      exaggeration: 1.45,
      lighting: false,
    };
  }
  if (layer === 'photoreal') {
    return {
      saturation: 1.08,
      brightness: 1.02,
      contrast: 1.1,
      hue: 0,
      gamma: 0.96,
      exaggeration: 1.65,
      lighting: true,
    };
  }
  return {
    saturation: 1,
    brightness: 1,
    contrast: 1.06,
    hue: 0,
    gamma: 1,
    exaggeration: 1.15,
    lighting: false,
  };
}

export function attributionFor(layers: BaseLayerId[]): string {
  const ids = new Set(layers);
  const parts = ['CesiumJS'];
  if (ids.has('satellite') || ids.has('photoreal')) {
    parts.push(GIBS_CREDIT, EOX_CREDIT, USGS_IMAGERY_CREDIT);
  }
  if (ids.has('terrain') || ids.has('military')) {
    parts.push(OTM_CREDIT, USGS_TOPO_CREDIT);
  }
  parts.push(TERRAIN_CREDIT);
  return parts.join(' · ');
}

export const ELEVATION_CREDIT = TERRAIN_CREDIT;

/** Optional paid upgrades. Empty string means the feature stays off. */
export function readMapFlags(): { ionToken: string; google3dKey: string } {
  const ionToken = (import.meta.env.VITE_CESIUM_ION_TOKEN ?? '').trim();
  const google3dKey = (import.meta.env.VITE_GOOGLE_MAP_TILES_KEY ?? '').trim();
  return { ionToken, google3dKey };
}

export function webMercatorTile(lat: number, lng: number, zoom: number): { x: number; y: number; z: number } {
  const z = Math.max(0, Math.min(12, Math.round(zoom)));
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  const clamp = (value: number) => Math.max(0, Math.min(n - 1, value));
  return { x: clamp(x), y: clamp(y), z };
}

/** Thumbnail of the basemap around a point, using the same free endpoints as the globe. */
export function thumbnailUrl(layer: BaseLayerId, lat: number, lng: number): string {
  const tile = webMercatorTile(lat, lng, layer === 'satellite' || layer === 'photoreal' ? 5 : 6);
  if (layer === 'terrain' || layer === 'military') {
    return `https://a.tile.opentopomap.org/${tile.z}/${tile.x}/${tile.y}.png`;
  }
  return `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/${tile.z}/${tile.y}/${tile.x}.jpg`;
}

export function nextLayer(current: BaseLayerId): BaseLayerId {
  const index = BASE_LAYER_ORDER.indexOf(current);
  return BASE_LAYER_ORDER[(index + 1) % BASE_LAYER_ORDER.length] ?? 'terrain';
}
