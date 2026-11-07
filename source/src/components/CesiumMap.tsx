import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { sphereModelForHolding } from '../data/engagementSphere';
import type { LiveAircraft, LiveFlyRequest, LiveShip, MapView } from '../data/liveFeeds';
import type { ResolvedEngagementLine } from '../data/scenarios';
import {
  attributionFor,
  imageryFor,
  readMapFlags,
  styleFor,
  type BaseLayerId,
} from '../map/layerCatalog';
import { affiliationOf, milSymbolCanvas, sidcForMarker } from '../map/sidc';
import {
  FUCHSIA,
  SIMULATED,
  circlePositions,
  controlMeasuresForAo,
  illuminationLabel,
  mgrsCellsForView,
  sampleFiresRing,
  sampleMarkersForAo,
  solarAltitudeDeg,
} from '../map/tacticalGraphics';
import { createTerrariumTerrainProvider } from '../map/terrariumTerrain';
import type {
  AO,
  SocialSignal,
  StrikeEvent,
  StrikeMunitionAssessment,
  StrikeOverlayToggles,
  StrikeRangeRing,
  SymbologyMode,
  ThreatLayer,
  ThreatMarker,
  VehicleHolding,
} from '../types';
import { LiveMapBanner } from './LiveMapChrome';
import {
  DEFAULT_OVERLAYS,
  MapChrome,
  type OverlayKey,
  type OverlaySetting,
  type OverlayState,
} from './MapChrome';

interface Props {
  aos: AO[];
  selectedAoId: string | null;
  onSelectAo: (id: string) => void;
  visibleLayers: ThreatLayer[];
  symbology: SymbologyMode;
  killSwitch: boolean;
  strikes?: StrikeEvent[];
  strikeOverlays?: StrikeOverlayToggles;
  showStrikeOverlays?: boolean;
  selectedStrikeId?: string | null;
  onSelectStrike?: (id: string) => void;
  munitionAssessment?: StrikeMunitionAssessment | null;
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
  onOpenSphere?: (unitId: string, holding: VehicleHolding) => void;
  unitRangeRings?: StrikeRangeRing[];
  socialSignals?: SocialSignal[];
  onSelectSocial?: (id: string) => void;
  engagementLines?: ResolvedEngagementLine[];
  liveAircraft?: LiveAircraft[];
  liveShips?: LiveShip[];
  liveFly?: LiveFlyRequest | null;
  onViewBbox?: (view: MapView) => void;
  liveAircraftOn?: boolean;
  liveShipsOn?: boolean;
  aircraftOffline?: boolean;
  shipsOffline?: boolean;
  aircraftAttribution?: string | null;
  tilted: boolean;
  onTilt: (tilted: boolean) => void;
}

const commercialCache = new Map<string, HTMLCanvasElement>();
const diamondCache = new Map<string, HTMLCanvasElement>();

export default function CesiumMap(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const tilesetRef = useRef<Cesium.Cesium3DTileset | null>(null);
  const propsRef = useRef(props);
  const sphereTimer = useRef<number | null>(null);
  useEffect(() => {
    propsRef.current = props;
  });

  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [base, setBase] = useState<BaseLayerId>('satellite');
  const [compare, setCompare] = useState(false);
  const [compareWith, setCompareWith] = useState<BaseLayerId>('terrain');
  const [split, setSplit] = useState(0.5);
  const [overlays, setOverlays] = useState<OverlayState>(DEFAULT_OVERLAYS);
  const [exporting, setExporting] = useState(false);
  const [terrainNote, setTerrainNote] = useState('open elevation');
  const [tilesNote, setTilesNote] = useState('');
  const [view, setView] = useState({ lat: 26.6, lng: 56.3, height: 16_000_000 });

  const selectedAo = props.aos.find((ao) => ao.id === props.selectedAoId) ?? null;
  const flags = readMapFlags();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let viewer: Cesium.Viewer;
    try {
      viewer = new Cesium.Viewer(host, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        baseLayer: false,
        terrain: new Cesium.Terrain(Promise.resolve(new Cesium.EllipsoidTerrainProvider())),
        requestRenderMode: false,
        targetFrameRate: 30,
        useBrowserRecommendedResolution: false,
        msaaSamples: 2,
        skyAtmosphere: new Cesium.SkyAtmosphere(),
      });
    } catch (error) {
      setBootError(error instanceof Error ? error.message : 'Cesium failed to start');
      return;
    }
    viewerRef.current = viewer;
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#071421');
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.maximumScreenSpaceError = 2.2;
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.atmosphereLightIntensity = 8;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 250;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 42_000_000;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(32, 18, 17_500_000),
    });
    const source = new Cesium.CustomDataSource('oe-sample');
    void viewer.dataSources.add(source);

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      const entity = picked && picked.id instanceof Cesium.Entity ? picked.id : undefined;
      const bag = entity?.properties;
      if (!bag) return;
      const now = Cesium.JulianDate.now();
      const kind = String(bag.kind?.getValue(now) ?? '');
      const id = String(bag.id?.getValue(now) ?? '');
      const current = propsRef.current;
      if (kind === 'ao' && id) {
        current.onSelectAo(id);
        return;
      }
      if (kind === 'unit' && id) {
        current.onSelectUnit?.(id);
        const marker = findMarker(current.visibleLayers, id);
        const holding = marker ? openableHolding(marker) : null;
        if (holding && current.onOpenSphere) {
          if (sphereTimer.current) window.clearTimeout(sphereTimer.current);
          sphereTimer.current = window.setTimeout(() => {
            current.onOpenSphere?.(id, holding);
          }, 900);
        }
        return;
      }
      if (kind === 'strike' && id) current.onSelectStrike?.(id);
      if (kind === 'social' && id) current.onSelectSocial?.(id);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    const emitView = () => {
      const rect = viewer.camera.computeViewRectangle();
      const carto = viewer.camera.positionCartographic;
      const lat = rect ? Cesium.Math.toDegrees((rect.south + rect.north) / 2) : Cesium.Math.toDegrees(carto.latitude);
      const lng = rect ? Cesium.Math.toDegrees((rect.west + rect.east) / 2) : Cesium.Math.toDegrees(carto.longitude);
      const height = carto.height;
      setView({ lat, lng, height });
      if (viewer.scene.globe.enableLighting) holdLocalNoon(viewer, lng);
      if (!rect || !propsRef.current.onViewBbox) return;
      propsRef.current.onViewBbox({
        lamin: Cesium.Math.toDegrees(rect.south),
        lamax: Cesium.Math.toDegrees(rect.north),
        lomin: Cesium.Math.toDegrees(rect.west),
        lomax: Cesium.Math.toDegrees(rect.east),
        clat: lat,
        clon: lng,
      });
    };
    viewer.camera.moveEnd.addEventListener(emitView);
    emitView();

    const { ionToken } = readMapFlags();
    void mountTerrain(viewer, ionToken).then((note) => {
      if (!cancelled) {
        setTerrainNote(note);
        viewer.scene.requestRender();
      }
    });
    setReady(true);

    return () => {
      cancelled = true;
      if (sphereTimer.current) window.clearTimeout(sphereTimer.current);
      handler.destroy();
      viewer.camera.moveEnd.removeEventListener(emitView);
      if (tilesetRef.current) {
        viewer.scene.primitives.remove(tilesetRef.current);
        tilesetRef.current = null;
      }
      viewer.destroy();
      viewerRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    applyImagery(viewer, base, compare ? compareWith : null);
    const style = styleFor(base);
    viewer.scene.verticalExaggeration = style.exaggeration;
    viewer.scene.globe.enableLighting = style.lighting;
    viewer.scene.globe.dynamicAtmosphereLighting = style.lighting;
    viewer.scene.globe.dynamicAtmosphereLightingFromSun = style.lighting;
    if (style.lighting) {
      holdLocalNoon(viewer, Cesium.Math.toDegrees(viewer.camera.positionCartographic.longitude));
    }
    viewer.scene.requestRender();
  }, [ready, base, compare, compareWith]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    viewer.scene.splitPosition = compare ? split : 0;
    viewer.scene.requestRender();
  }, [ready, compare, split]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    let cancelled = false;
    const showTiles = base === 'photoreal' && !compare && flags.google3dKey.length > 0;
    if (!showTiles) {
      if (tilesetRef.current) {
        viewer.scene.primitives.remove(tilesetRef.current);
        tilesetRef.current = null;
        viewer.scene.globe.show = true;
        viewer.scene.requestRender();
      }
      return;
    }
    setTilesNote('Loading Google Photorealistic 3D Tiles…');
    void Cesium.createGooglePhotorealistic3DTileset({ key: flags.google3dKey })
      .then((tileset) => {
        if (cancelled) {
          tileset.destroy();
          return;
        }
        if (tilesetRef.current) viewer.scene.primitives.remove(tilesetRef.current);
        tilesetRef.current = tileset;
        viewer.scene.primitives.add(tileset);
        viewer.scene.globe.show = false;
        setTilesNote('Google Photorealistic 3D Tiles (paid key, display only).');
        viewer.scene.requestRender();
      })
      .catch(() => {
        if (cancelled) return;
        viewer.scene.globe.show = true;
        setTilesNote('Google 3D Tiles did not load. Showing free imagery on elevation.');
        viewer.scene.requestRender();
      });
    return () => {
      cancelled = true;
    };
  }, [ready, base, compare, flags.google3dKey]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableTilt = props.tilted;
    controller.enableLook = props.tilted;
    const pitch = Cesium.Math.toRadians(base === 'photoreal' ? -32 : props.tilted ? -52 : -89.2);
    if (selectedAo) {
      const height = base === 'photoreal' ? 70_000 : props.tilted ? 520_000 : 980_000;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(selectedAo.lng, selectedAo.lat, height),
        orientation: { heading: 0.2, pitch, roll: 0 },
        duration: 1.15,
      });
      return;
    }
    const carto = viewer.camera.positionCartographic;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
      orientation: {
        heading: props.tilted ? viewer.camera.heading : 0,
        pitch,
        roll: 0,
      },
      duration: 0.7,
    });
  }, [ready, props.tilted, selectedAo, base]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready || !props.selectedUnitId) return;
    const marker = findMarker(propsRef.current.visibleLayers, props.selectedUnitId);
    if (!marker) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        marker.lng,
        marker.lat,
        props.tilted ? 24_000 : 55_000,
      ),
      orientation: {
        heading: viewer.camera.heading,
        pitch: Cesium.Math.toRadians(props.tilted ? -42 : -89),
        roll: 0,
      },
      duration: 0.85,
    });
  }, [ready, props.selectedUnitId, props.tilted]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const request = props.liveFly;
    if (!viewer || !ready || !request) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        request.lng,
        request.lat,
        props.tilted ? 180_000 : 420_000,
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(props.tilted ? -40 : -89),
        roll: 0,
      },
      duration: 1.1,
    });
  }, [ready, props.liveFly, props.tilted]);

  const gridLat = Math.round(view.lat);
  const gridLng = Math.round(view.lng);
  const gridHeight = Math.round(view.height / 25_000);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    const source = viewer.dataSources.getByName('oe-sample')[0];
    if (!source) return;
    source.entities.removeAll();
    paintScene(viewer, source, props, overlays, selectedAo);
    viewer.scene.requestRender();
  }, [ready, props, overlays, selectedAo, gridLat, gridLng, gridHeight]);

  const weatherText =
    overlays.weather.visible && !props.killSwitch
      ? (() => {
          const altitude = solarAltitudeDeg(view.lat, view.lng);
          return `Hypothetical stub, not a forecast. View-center solar altitude ${altitude.toFixed(0)}° · ${illuminationLabel(altitude)}.`;
        })()
      : null;

  const attribution = attributionFor(compare ? [base, compareWith] : [base]);
  const passiveTilesNote =
    base === 'photoreal' && (compare || flags.google3dKey.length === 0)
      ? 'Google Photorealistic 3D Tiles are off. Free imagery is draped on elevation.'
      : '';
  const photorealNote = [terrainNote, tilesNote || passiveTilesNote].filter(Boolean).join(' · ');

  return (
    <div className="map-stage" ref={stageRef} data-testid="cesium-map" data-base-layer={base}>
      <div ref={hostRef} className="cesium-host" />
      {!ready && !bootError && <p className="map-boot">Loading photoreal map…</p>}
      {bootError && <p className="map-boot">{bootError}</p>}
      <MapChrome
        base={base}
        onBase={(layer) => {
          setBase(layer);
          if (layer === 'photoreal' && !props.tilted) props.onTilt(true);
          if (compareWith === layer) {
            setCompareWith(layer === 'satellite' ? 'terrain' : 'satellite');
          }
        }}
        compare={compare}
        onCompare={setCompare}
        compareWith={compareWith === base ? (base === 'satellite' ? 'terrain' : 'satellite') : compareWith}
        onCompareWith={setCompareWith}
        split={split}
        onSplit={setSplit}
        tilted={props.tilted}
        onTilt={props.onTilt}
        overlays={overlays}
        onOverlay={(key: OverlayKey, patch: Partial<OverlaySetting>) => {
          setOverlays((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
        }}
        onExport={() => {
          const viewer = viewerRef.current;
          if (!viewer) return;
          setExporting(true);
          exportSlide(viewer, attribution).finally(() => setExporting(false));
        }}
        exporting={exporting}
        previewLat={selectedAo?.lat ?? 26.6}
        previewLng={selectedAo?.lng ?? 56.25}
        attribution={attribution}
        photorealNote={base === 'photoreal' || terrainNote.startsWith('Cesium') ? photorealNote : terrainNote}
        weatherText={weatherText}
      />
      <LiveMapBanner
        aircraftOn={Boolean(props.liveAircraftOn)}
        shipsOn={Boolean(props.liveShipsOn)}
        aircraftOffline={Boolean(props.aircraftOffline)}
        shipsOffline={Boolean(props.shipsOffline)}
        aircraftAttribution={props.aircraftAttribution ?? null}
      />
    </div>
  );
}

async function mountTerrain(viewer: Cesium.Viewer, ionToken: string): Promise<string> {
  if (ionToken) {
    Cesium.Ion.defaultAccessToken = ionToken;
    try {
      const provider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
        requestVertexNormals: true,
      });
      viewer.scene.setTerrain(new Cesium.Terrain(Promise.resolve(provider)));
      return 'Cesium World Terrain (ion token)';
    } catch {
      viewer.scene.setTerrain(new Cesium.Terrain(Promise.resolve(createTerrariumTerrainProvider())));
      return 'open elevation (ion terrain failed)';
    }
  }
  viewer.scene.setTerrain(new Cesium.Terrain(Promise.resolve(createTerrariumTerrainProvider())));
  return 'open elevation';
}

/** Keep shaded relief in daylight even when the real clock says the AO is in night. */
function holdLocalNoon(viewer: Cesium.Viewer, lng: number) {
  const hour = ((12 - lng / 15) % 24 + 24) % 24;
  const base = new Date();
  const utc = new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate(),
      Math.floor(hour),
      Math.round((hour % 1) * 60),
      0,
    ),
  );
  viewer.clock.currentTime = Cesium.JulianDate.fromDate(utc);
  viewer.clock.shouldAnimate = false;
}

function applyImagery(viewer: Cesium.Viewer, base: BaseLayerId, compareWith: BaseLayerId | null) {
  const layers = viewer.imageryLayers;
  layers.removeAll();
  for (const layer of buildImagery(base)) {
    layer.splitDirection = compareWith ? Cesium.SplitDirection.LEFT : Cesium.SplitDirection.NONE;
    layers.add(layer);
  }
  if (compareWith) {
    for (const layer of buildImagery(compareWith)) {
      layer.splitDirection = Cesium.SplitDirection.RIGHT;
      layers.add(layer);
    }
  }
}

function buildImagery(id: BaseLayerId): Cesium.ImageryLayer[] {
  const style = styleFor(id);
  return imageryFor(id).map((spec) => {
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: spec.url,
      maximumLevel: spec.maximumLevel,
      minimumLevel: spec.minimumLevel,
      subdomains: spec.subdomains,
      credit: spec.credit,
      enablePickFeatures: false,
      rectangle: spec.rectangle
        ? Cesium.Rectangle.fromDegrees(...spec.rectangle)
        : undefined,
    });
    const layer = new Cesium.ImageryLayer(provider);
    layer.saturation = style.saturation;
    layer.brightness = style.brightness;
    layer.contrast = style.contrast;
    layer.hue = style.hue;
    layer.gamma = style.gamma;
    return layer;
  });
}

function paintScene(
  viewer: Cesium.Viewer,
  source: Cesium.DataSource,
  props: Props,
  overlays: OverlayState,
  selectedAo: AO | null,
) {
  const blank = props.killSwitch;
  for (const ao of props.aos) {
    addBillboard(source, {
      id: `ao:${ao.id}`,
      kind: 'ao',
      targetId: ao.id,
      lat: ao.lat,
      lng: ao.lng,
      image: diamond('#d7ecff', '#16324f'),
      label: `${ao.name} · SAMPLE`,
      labelColor: FUCHSIA,
      opacity: 1,
      scale: ao.id === props.selectedAoId ? 1.05 : 0.78,
    });
  }

  if (!blank && props.symbology === 'military' && overlays.mgrs.visible) {
    const rect = viewBounds(viewer);
    if (rect) {
      const cells = mgrsCellsForView(rect.west, rect.south, rect.east, rect.north, rect.height);
      for (const cell of cells) {
        addPolyline(source, {
          id: `mgrs:${cell.id}`,
          positions: [
            [cell.west, cell.south],
            [cell.east, cell.south],
            [cell.east, cell.north],
            [cell.west, cell.north],
            [cell.west, cell.south],
          ],
          color: '#f3e7b3',
          opacity: 0.55 * overlays.mgrs.opacity,
          width: 1,
        });
        addOnlyLabel(source, {
          id: `mgrs-label:${cell.id}`,
          lng: (cell.west + cell.east) / 2,
          lat: (cell.south + cell.north) / 2,
          text: cell.label,
          color: '#f3e7b3',
          opacity: overlays.mgrs.opacity,
        });
      }
    }
  }

  if (!blank && selectedAo && props.symbology === 'military' && overlays.control.visible) {
    for (const graphic of controlMeasuresForAo(selectedAo)) {
      addPolyline(source, {
        id: `cm:${graphic.id}`,
        positions: graphic.positions,
        color: FUCHSIA,
        opacity: overlays.control.opacity,
        width: graphic.arrow ? 10 : graphic.kind === 'boundary' ? 2.5 : 2,
        dashed: graphic.kind !== 'axis',
        arrow: graphic.arrow,
      });
      const labelAt = graphic.positions[Math.floor(graphic.positions.length / 2)];
      if (graphic.label && labelAt) {
        addOnlyLabel(source, {
          id: `cm-label:${graphic.id}`,
          lng: labelAt[0],
          lat: labelAt[1],
          text: graphic.label,
          color: FUCHSIA,
          opacity: overlays.control.opacity,
        });
      }
    }
  }

  if (!blank && selectedAo && overlays.sample.visible) {
    for (const pin of sampleMarkersForAo(selectedAo)) {
      addBillboard(source, {
        id: `sample:${pin.id}`,
        kind: 'sample',
        targetId: pin.id,
        lat: pin.lat,
        lng: pin.lng,
        image: diamond(FUCHSIA, '#2a0a24'),
        label: pin.label,
        labelColor: FUCHSIA,
        opacity: overlays.sample.opacity,
        scale: 0.9,
      });
    }
  }

  if (!blank && overlays.fires.visible && props.symbology === 'military') {
    if (selectedAo) {
      const sample = sampleFiresRing(selectedAo);
      addPolyline(source, {
        id: 'fires:sample',
        positions: circlePositions(sample.lat, sample.lng, sample.radiusKm),
        color: SIMULATED,
        opacity: overlays.fires.opacity,
        width: 2,
        dashed: true,
      });
      addOnlyLabel(source, {
        id: 'fires:sample:label',
        lng: sample.lng,
        lat: sample.lat,
        text: sample.label,
        color: SIMULATED,
        opacity: overlays.fires.opacity,
      });
    }
    for (const ring of props.unitRangeRings ?? []) {
      addPolyline(source, {
        id: `fires:${ring.id}`,
        positions: circlePositions(ring.lat, ring.lng, ring.radiusKm),
        color: ring.color || SIMULATED,
        opacity: overlays.fires.opacity * 0.95,
        width: 2,
        dashed: true,
      });
    }
    for (const ring of props.munitionAssessment?.rings ?? []) {
      addPolyline(source, {
        id: `fires:strike:${ring.id}`,
        positions: circlePositions(ring.lat, ring.lng, ring.radiusKm),
        color: SIMULATED,
        opacity: overlays.fires.opacity * 0.8,
        width: 2,
        dashed: true,
      });
    }
  }

  if (!blank) {
    for (const layer of props.visibleLayers) {
      for (const marker of layer.markers) {
        const bucket = affiliationOf(marker);
        const setting = overlays[bucket];
        if (!setting.visible) continue;
        const military = props.symbology === 'military';
        addBillboard(source, {
          id: `unit:${marker.id}`,
          kind: 'unit',
          targetId: marker.id,
          lat: marker.lat,
          lng: marker.lng,
          image: military
            ? milSymbolCanvas(sidcForMarker(marker))
            : commercialIcon(marker.milSymbol ?? marker.commercialSymbol),
          label: marker.label,
          labelColor: FUCHSIA,
          opacity: setting.opacity,
          scale: marker.id === props.selectedUnitId ? 1.18 : 0.96,
        });
      }
    }
  }

  if (!blank && props.symbology === 'military') {
    for (const line of props.engagementLines ?? []) {
      const bucket = line.side === 'friendly' ? 'friendly' : 'enemy';
      if (!overlays[bucket].visible) continue;
      addPolyline(source, {
        id: `engage:${line.id}`,
        positions: [
          [line.fromLng, line.fromLat],
          [line.toLng, line.toLat],
        ],
        color: line.color,
        opacity: overlays[bucket].opacity,
        width: 2,
        dashed: true,
      });
    }
  }

  if (!blank && props.showStrikeOverlays && overlays.strikes.visible) {
    const toggles = props.strikeOverlays;
    for (const strike of props.strikes ?? []) {
      if (toggles?.strikeHistory !== false) {
        addPolyline(source, {
          id: `strike-line:${strike.id}`,
          positions: [
            [strike.originLng, strike.originLat],
            [strike.impactLng, strike.impactLat],
          ],
          color: SIMULATED,
          opacity: overlays.strikes.opacity,
          width: 2,
          dashed: true,
        });
      }
      if (toggles?.origins !== false) {
        addPoint(source, `strike-origin:${strike.id}`, 'strike', strike.id, strike.originLat, strike.originLng, SIMULATED, overlays.strikes.opacity, 7);
      }
      addPoint(
        source,
        `strike-impact:${strike.id}`,
        'strike',
        strike.id,
        strike.impactLat,
        strike.impactLng,
        SIMULATED,
        overlays.strikes.opacity,
        strike.id === props.selectedStrikeId ? 12 : 9,
      );
      addOnlyLabel(source, {
        id: `strike-label:${strike.id}`,
        lng: strike.impactLng,
        lat: strike.impactLat,
        text: strike.label,
        color: SIMULATED,
        opacity: overlays.strikes.opacity,
      });
      if (toggles?.hotZones !== false) {
        addPolyline(source, {
          id: `hot:${strike.id}`,
          positions: circlePositions(strike.impactLat, strike.impactLng, 6 + strike.intensity * 10),
          color: SIMULATED,
          opacity: 0.45 * overlays.strikes.opacity,
          width: 1.5,
          dashed: false,
        });
      }
    }
  }

  if (!blank && overlays.observe.visible) {
    for (const signal of props.socialSignals ?? []) {
      signal.geoHints.forEach((hint, index) => {
        if (hint.lat == null || hint.lon == null) return;
        addBillboard(source, {
          id: `social:${signal.id}:${index}`,
          kind: 'social',
          targetId: signal.id,
          lat: hint.lat,
          lng: hint.lon,
          image: diamond(SIMULATED, '#2a1608'),
          label: `${hint.name} · SAMPLE`,
          labelColor: SIMULATED,
          opacity: overlays.observe.opacity,
          scale: 0.72,
        });
      });
    }
  }

  if (!blank && props.liveAircraftOn) {
    for (const track of (props.liveAircraft ?? []).slice(0, 220)) {
      addBillboard(source, {
        id: `air:${track.icao}`,
        kind: 'live',
        targetId: track.icao,
        lat: track.lat,
        lng: track.lon,
        image: aircraftIcon(),
        label: track.callsign?.trim() || track.icao,
        labelColor: '#9ad7ff',
        opacity: 0.95,
        scale: 0.7,
        rotation: track.heading == null ? 0 : -Cesium.Math.toRadians(track.heading),
        altitude: 1200,
      });
    }
  }
  if (!blank && props.liveShipsOn) {
    for (const ship of (props.liveShips ?? []).slice(0, 220)) {
      addBillboard(source, {
        id: `ship:${ship.mmsi}`,
        kind: 'live',
        targetId: String(ship.mmsi),
        lat: ship.lat,
        lng: ship.lon,
        image: diamond('#7ec8ff', '#0c2438'),
        label: ship.name?.trim() || String(ship.mmsi),
        labelColor: '#9ad7ff',
        opacity: 0.95,
        scale: 0.62,
      });
    }
  }
}

function viewBounds(viewer: Cesium.Viewer): {
  west: number;
  south: number;
  east: number;
  north: number;
  height: number;
} | null {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return null;
  return {
    west: Cesium.Math.toDegrees(rect.west),
    south: Cesium.Math.toDegrees(rect.south),
    east: Cesium.Math.toDegrees(rect.east),
    north: Cesium.Math.toDegrees(rect.north),
    height: viewer.camera.positionCartographic.height,
  };
}

function findMarker(layers: ThreatLayer[], id: string): ThreatMarker | null {
  for (const layer of layers) {
    const marker = layer.markers.find((item) => item.id === id);
    if (marker) return marker;
  }
  return null;
}

function openableHolding(marker: ThreatMarker): VehicleHolding | null {
  for (const row of marker.orbat?.vehicles ?? []) {
    if (sphereModelForHolding(row)) return row;
  }
  return null;
}

function addBillboard(
  source: Cesium.DataSource,
  input: {
    id: string;
    kind: string;
    targetId: string;
    lat: number;
    lng: number;
    image: HTMLCanvasElement;
    label: string;
    labelColor: string;
    opacity: number;
    scale: number;
    rotation?: number;
    altitude?: number;
  },
) {
  source.entities.add({
    id: input.id,
    position: Cesium.Cartesian3.fromDegrees(input.lng, input.lat, input.altitude ?? 0),
    properties: { kind: input.kind, id: input.targetId },
    billboard: {
      image: input.image,
      scale: input.scale,
      rotation: input.rotation ?? 0,
      alignedAxis: input.rotation ? Cesium.Cartesian3.UNIT_Z : undefined,
      color: Cesium.Color.WHITE.withAlpha(input.opacity),
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      heightReference: input.altitude
        ? Cesium.HeightReference.NONE
        : Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new Cesium.NearFarScalar(1_500, 1.15, 1_800_000, 0.38),
    },
    label: {
      text: input.label,
      font: '600 12px Segoe UI, sans-serif',
      fillColor: Cesium.Color.fromCssColorString(input.labelColor).withAlpha(input.opacity),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, 26),
      heightReference: input.altitude
        ? Cesium.HeightReference.NONE
        : Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new Cesium.NearFarScalar(2_000, 1, 1_600_000, 0.35),
    },
  });
}

function addPolyline(
  source: Cesium.DataSource,
  input: {
    id: string;
    positions: Array<[number, number]>;
    color: string;
    opacity: number;
    width: number;
    dashed?: boolean;
    arrow?: boolean;
  },
) {
  if (input.positions.length < 2) return;
  const color = Cesium.Color.fromCssColorString(input.color).withAlpha(input.opacity);
  source.entities.add({
    id: input.id,
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray(input.positions.flat()),
      clampToGround: true,
      width: input.width,
      arcType: Cesium.ArcType.GEODESIC,
      material: input.arrow
        ? new Cesium.PolylineArrowMaterialProperty(color)
        : input.dashed
          ? new Cesium.PolylineDashMaterialProperty({ color, dashLength: 16 })
          : color,
    },
  });
}

function addOnlyLabel(
  source: Cesium.DataSource,
  input: { id: string; lng: number; lat: number; text: string; color: string; opacity: number },
) {
  source.entities.add({
    id: input.id,
    position: Cesium.Cartesian3.fromDegrees(input.lng, input.lat),
    label: {
      text: input.text,
      font: '600 12px Segoe UI, sans-serif',
      fillColor: Cesium.Color.fromCssColorString(input.color).withAlpha(input.opacity),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new Cesium.NearFarScalar(2_000, 1, 2_200_000, 0.4),
    },
  });
}

function addPoint(
  source: Cesium.DataSource,
  id: string,
  kind: string,
  targetId: string,
  lat: number,
  lng: number,
  color: string,
  opacity: number,
  size: number,
) {
  source.entities.add({
    id,
    position: Cesium.Cartesian3.fromDegrees(lng, lat),
    properties: { kind, id: targetId },
    point: {
      pixelSize: size,
      color: Cesium.Color.fromCssColorString(color).withAlpha(opacity),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 1,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}

function diamond(fill: string, stroke: string): HTMLCanvasElement {
  const key = `${fill}|${stroke}`;
  const cached = diamondCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.translate(14, 14);
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(11, 0);
  ctx.lineTo(0, 11);
  ctx.lineTo(-11, 0);
  ctx.closePath();
  ctx.fillStyle = stroke;
  ctx.fill();
  ctx.strokeStyle = fill;
  ctx.lineWidth = 2;
  ctx.stroke();
  diamondCache.set(key, canvas);
  return canvas;
}

function commercialIcon(kind: string | undefined): HTMLCanvasElement {
  const key = kind ?? 'node';
  const cached = commercialCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.strokeStyle = '#e67e22';
  ctx.fillStyle = '#123';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(14, 14, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f5a623';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(key === 'ship' ? 'S' : kind === 'port' ? 'P' : '•', 14, 18);
  commercialCache.set(key, canvas);
  return canvas;
}

function aircraftIcon(): HTMLCanvasElement {
  const cached = commercialCache.get('__aircraft');
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#9ad7ff';
  ctx.beginPath();
  ctx.moveTo(12, 2);
  ctx.lineTo(16, 20);
  ctx.lineTo(12, 16);
  ctx.lineTo(8, 20);
  ctx.closePath();
  ctx.fill();
  commercialCache.set('__aircraft', canvas);
  return canvas;
}

function exportSlide(viewer: Cesium.Viewer, attribution: string): Promise<void> {
  return new Promise((resolve) => {
    const remove = viewer.scene.postRender.addEventListener(() => {
      remove();
      const source = viewer.canvas;
      const slide = document.createElement('canvas');
      slide.width = 1920;
      slide.height = 1080;
      const ctx = slide.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, 1920, 1080);
      const scale = Math.max(1920 / source.width, 1080 / source.height);
      const width = source.width * scale;
      const height = source.height * scale;
      ctx.drawImage(source, (1920 - width) / 2, (1080 - height) / 2, width, height);
      ctx.fillStyle = '#FF2BD6';
      ctx.fillRect(0, 0, 1920, 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 24px Segoe UI, sans-serif';
      ctx.fillText('UNCLASSIFIED // SAMPLE', 28, 36);
      ctx.fillStyle = 'rgba(6, 10, 18, 0.82)';
      ctx.fillRect(0, 1000, 1920, 80);
      ctx.fillStyle = '#f4f7fb';
      ctx.font = '16px Segoe UI, sans-serif';
      ctx.fillText(attribution.slice(0, 180), 28, 1048);
      const link = document.createElement('a');
      link.href = slide.toDataURL('image/png');
      link.download = 'oe-flex-sample-slide.png';
      link.click();
      resolve();
    });
    viewer.scene.requestRender();
  });
}
