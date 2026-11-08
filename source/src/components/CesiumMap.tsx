import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { sphereModelForHolding } from '../data/engagementSphere';
import type { LiveAircraft, LiveFlyRequest, LiveShip, MapView } from '../data/liveFeeds';
import type { ResolvedEngagementLine } from '../data/scenarios';
import {
  claimClientRootSession,
  dailyCapReached,
  GoogleCapError,
  PHOTOREAL_DAILY_CAP_NOTE,
  reserveServerSession,
  type CountStore,
} from '../map/googleTilesBudget';
import {
  attributionFor,
  imageryFor,
  readMapFlags,
  styleFor,
  type BaseLayerId,
} from '../map/layerCatalog';
import { affiliationOf, milSymbolCanvas, sidcForMarker } from '../map/sidc';
import {
  applyOrthographicNadir,
  applyPerspectiveView,
  cameraGround,
  clampToNativeResolution,
  googleTilesAreShowing,
  measureMetersPerPixel,
  mppForPresetOrFloor,
  nudgeTargetToFreeCenter,
  orthoMpp,
  resolutionFloorMpp,
  syncOrthographicZoom,
} from '../map/frameCamera';
import {
  gridForPreset,
  metersPerPixelForRf,
  niceScaleLength,
  presetMatches,
  rfFromMetersPerPixel,
} from '../map/mapScale';
import {
  FUCHSIA,
  SIMULATED,
  circlePositions,
  controlMeasuresForAo,
  illuminationLabel,
  mgrsCellsForView,
  mgrsPaperGrid,
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
import { useOverlayDock } from './OverlayDock';
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
  pulseKey?: string | null;
  highlightKey?: string | null;
  strikeFocus?: { id: string; lat: number; lng: number } | null;
  socialFocus?: { id: string; lat: number; lng: number } | null;
  anchor?: { lat: number; lng: number } | null;
  onAnchor?: (point: { x: number; y: number } | null) => void;
}

const commercialCache = new Map<string, HTMLCanvasElement>();
const diamondCache = new Map<string, HTMLCanvasElement>();

/**
 * One Google root tileset for this page. Hiding the layer does not drop it,
 * and scenario changes do not call createGooglePhotorealistic3DTileset again.
 */
const NATIVE_SCALE_NOTE =
  'Finer than the free imagery here. The camera stopped at native resolution. 3D Photoreal is the high-detail option when the Google key is on.';

let googleTileset: Cesium.Cesium3DTileset | null = null;
let googleTilesetTask: Promise<Cesium.Cesium3DTileset> | null = null;
let googleDecision: 'idle' | 'denied' | 'failed' | 'started' = 'idle';

function browserCountStore(): CountStore {
  return localStorage;
}

function beginGoogleTileset(key: string): Promise<Cesium.Cesium3DTileset> {
  if (googleTileset && !googleTileset.isDestroyed()) return Promise.resolve(googleTileset);
  if (googleDecision === 'denied') return Promise.reject(new GoogleCapError());
  if (googleDecision === 'failed') {
    return Promise.reject(new Error('Google 3D Tiles did not load. Showing free imagery on elevation.'));
  }
  if (googleTilesetTask) return googleTilesetTask;
  googleTilesetTask = (async () => {
    const server = await reserveServerSession();
    if (!server.allowed) {
      googleDecision = 'denied';
      throw new GoogleCapError();
    }
    if (!claimClientRootSession(browserCountStore())) {
      googleDecision = 'denied';
      throw new GoogleCapError();
    }
    const created = await Cesium.createGooglePhotorealistic3DTileset({ key });
    googleTileset = created;
    googleDecision = 'started';
    return created;
  })().catch((error: unknown) => {
    googleTilesetTask = null;
    if (!(error instanceof GoogleCapError) && googleDecision !== 'denied') {
      googleDecision = 'failed';
    }
    throw error;
  });
  return googleTilesetTask;
}

function hideGoogleTiles(viewer: Cesium.Viewer) {
  if (googleTileset && !googleTileset.isDestroyed()) googleTileset.show = false;
  viewer.scene.globe.show = true;
  viewer.scene.requestRender();
}

function showGoogleTiles(viewer: Cesium.Viewer, tileset: Cesium.Cesium3DTileset) {
  if (!viewer.scene.primitives.contains(tileset)) viewer.scene.primitives.add(tileset);
  tileset.show = true;
  viewer.scene.globe.show = false;
  viewer.scene.requestRender();
}

function detachGoogleTiles(viewer: Cesium.Viewer) {
  if (!googleTileset || googleTileset.isDestroyed()) return;
  if (viewer.scene.primitives.contains(googleTileset)) {
    viewer.scene.primitives.remove(googleTileset);
  }
}

export default function CesiumMap(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const propsRef = useRef(props);
  const baseRef = useRef<BaseLayerId>('satellite');
  const compareRef = useRef(false);
  const tiltedRef = useRef(props.tilted);
  const presetRef = useRef<number | null>(null);
  const suspendRef = useRef(false);
  const noteRef = useRef('');
  const focusRef = useRef<{ lat: number; lng: number } | null>(null);
  const pendingScaleRef = useRef<number | null>(null);
  const aoSeenRef = useRef<string | null>(null);
  const tiltSeenRef = useRef<boolean | null>(null);
  const baseSeenRef = useRef<BaseLayerId | null>(null);
  const pulseRef = useRef<string | null>(null);
  const highlightRef = useRef<string | null>(null);
  const sphereTimer = useRef<number | null>(null);
  useEffect(() => {
    propsRef.current = props;
    baseRef.current = base;
    compareRef.current = compare;
    tiltedRef.current = props.tilted;
    pulseRef.current = props.pulseKey ?? null;
    highlightRef.current = props.highlightKey ?? null;
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
  const [scaleNonce, setScaleNonce] = useState(0);
  const [gridPreset, setGridPreset] = useState<number | null>(null);
  const [scaleHud, setScaleHud] = useState({
    rf: 5_000_000,
    preset: null as number | null,
    barMeters: 100_000,
    barPx: 96,
    note: '',
  });

  const frameDetailRef = useRef<(lat: number, lng: number, near: boolean) => void>(() => undefined);
  const publishHudRef = useRef(() => undefined as void);
  frameDetailRef.current = (lat, lng, near) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const heading = viewer.camera.heading;
    focusRef.current = { lat, lng };
    suspendRef.current = true;
    const google = googleTilesAreShowing(baseRef.current, compareRef.current, googleTileset);
    if (!tiltedRef.current) {
      const floor = resolutionFloorMpp(baseRef.current, lat, lng, google);
      const current = orthoMpp(viewer) ?? metersPerPixelForRf(250_000);
      const detail = metersPerPixelForRf(near ? 50_000 : 100_000);
      const mpp = Math.max(floor, Math.min(current, detail));
      if (mpp > detail * 1.08) noteRef.current = NATIVE_SCALE_NOTE;
      if (presetRef.current && !presetMatches(rfFromMetersPerPixel(mpp), presetRef.current)) presetRef.current = null;
      applyOrthographicNadir(viewer, lat, lng, mpp);
    } else {
      const height = near
        ? baseRef.current === 'photoreal'
          ? 12_000
          : 24_000
        : baseRef.current === 'photoreal'
          ? 18_000
          : 40_000;
      applyPerspectiveView(viewer, lat, lng, height, near ? -42 : -40, heading);
      clampToNativeResolution(viewer, baseRef.current, google);
    }
    suspendRef.current = false;
    publishHudRef.current();
  };
  publishHudRef.current = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const mpp = orthoMpp(viewer) ?? measureMetersPerPixel(viewer);
    if (!mpp) return;
    const rf = rfFromMetersPerPixel(mpp);
    const bar = niceScaleLength(mpp);
    const requested = presetRef.current;
    const onPreset = requested != null && presetMatches(rf, requested);
    if (requested != null && !onPreset && !suspendRef.current) presetRef.current = null;
    setScaleHud({
      rf,
      preset: onPreset ? requested : null,
      barMeters: bar.meters,
      barPx: Math.max(48, Math.min(160, bar.px)),
      note: noteRef.current,
    });
    setGridPreset(onPreset ? requested : null);
    const stage = viewer.container.closest('[data-testid="cesium-map"]');
    if (stage instanceof HTMLElement) {
      const frustum = viewer.camera.frustum;
      stage.dataset.pitch = String(Math.round(Cesium.Math.toDegrees(viewer.camera.pitch)));
      stage.dataset.heading = String(Math.round(Cesium.Math.toDegrees(viewer.camera.heading)));
      stage.dataset.frustum = frustum instanceof Cesium.OrthographicFrustum ? 'ortho' : 'persp';
    }
  };

  const selectedAo = props.aos.find((ao) => ao.id === props.selectedAoId) ?? null;
  const flags = readMapFlags();
  const dock = useOverlayDock();

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

    const resolutionFloor = () => {
      const carto = viewer.camera.positionCartographic;
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const lng = Cesium.Math.toDegrees(carto.longitude);
      return resolutionFloorMpp(
        baseRef.current,
        lat,
        lng,
        googleTilesAreShowing(baseRef.current, compareRef.current, googleTileset),
      );
    };
    const onPreRender = () => {
      if (suspendRef.current || tiltedRef.current) return;
      if (!(viewer.camera.frustum instanceof Cesium.OrthographicFrustum)) return;
      suspendRef.current = true;
      syncOrthographicZoom(viewer, resolutionFloor());
      suspendRef.current = false;
    };
    const removePre = viewer.scene.preRender.addEventListener(onPreRender);
    const publishHud = () => publishHudRef.current();
    viewer.camera.moveEnd.addEventListener(publishHud);
    const onDock = () => {
      const focus = focusRef.current;
      if (!focus || suspendRef.current || viewer.isDestroyed()) return;
      suspendRef.current = true;
      nudgeTargetToFreeCenter(viewer, focus.lat, focus.lng);
      suspendRef.current = false;
      viewer.scene.requestRender();
    };
    window.addEventListener('oe-dock-layout', onDock);
    const onPointerDown = () => {
      focusRef.current = null;
    };
    viewer.scene.canvas.addEventListener('pointerdown', onPointerDown);

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
      viewer.camera.moveEnd.removeEventListener(publishHud);
      removePre();
      window.removeEventListener('oe-dock-layout', onDock);
      viewer.scene.canvas.removeEventListener('pointerdown', onPointerDown);
      detachGoogleTiles(viewer);
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
    // Free layers until the user picks 3D Photoreal. Compare mode stays on the free drape.
    if (base !== 'photoreal' || compare) {
      hideGoogleTiles(viewer);
      return;
    }
    if (googleTileset && !googleTileset.isDestroyed()) {
      showGoogleTiles(viewer, googleTileset);
      setTilesNote('Google Photorealistic 3D Tiles (one root request this session).');
      return;
    }
    if (dailyCapReached(browserCountStore()) || googleDecision === 'denied') {
      hideGoogleTiles(viewer);
      setTilesNote(PHOTOREAL_DAILY_CAP_NOTE);
      return;
    }
    if (!flags.google3dKey) {
      hideGoogleTiles(viewer);
      return;
    }
    setTilesNote('Loading Google Photorealistic 3D Tiles…');
    void beginGoogleTileset(flags.google3dKey)
      .then((tileset) => {
        const live = viewerRef.current;
        if (!live || live.isDestroyed()) return;
        if (baseRef.current !== 'photoreal' || compareRef.current) {
          hideGoogleTiles(live);
          return;
        }
        showGoogleTiles(live, tileset);
        setTilesNote('Google Photorealistic 3D Tiles (one root request this session).');
      })
      .catch((error: unknown) => {
        const live = viewerRef.current;
        if (!live || live.isDestroyed()) return;
        if (baseRef.current !== 'photoreal' || compareRef.current) return;
        hideGoogleTiles(live);
        setTilesNote(
          error instanceof GoogleCapError
            ? PHOTOREAL_DAILY_CAP_NOTE
            : 'Google 3D Tiles did not load. Showing free imagery on elevation.',
        );
      });
  }, [ready, base, compare, flags.google3dKey]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableTilt = props.tilted;
    controller.enableLook = props.tilted;
    controller.enableRotate = props.tilted;
    const google = googleTilesAreShowing(base, compareRef.current, googleTileset);

    if (pendingScaleRef.current != null) {
      const rf = pendingScaleRef.current;
      pendingScaleRef.current = null;
      if (props.tilted) {
        pendingScaleRef.current = rf;
        props.onTilt(false);
        return;
      }
      const ground = selectedAo
        ? { lat: selectedAo.lat, lng: selectedAo.lng }
        : (focusRef.current ?? cameraGround(viewer));
      const fit = mppForPresetOrFloor(rf, resolutionFloorMpp(base, ground.lat, ground.lng, google));
      presetRef.current = fit.clamped ? null : rf;
      noteRef.current = fit.clamped ? NATIVE_SCALE_NOTE : '';
      suspendRef.current = true;
      focusRef.current = ground;
      applyOrthographicNadir(viewer, ground.lat, ground.lng, fit.mpp);
      suspendRef.current = false;
      publishHudRef.current();
      aoSeenRef.current = selectedAo?.id ?? '';
      tiltSeenRef.current = props.tilted;
      baseSeenRef.current = base;
      return;
    }

    const aoKey = selectedAo?.id ?? '';
    const first = tiltSeenRef.current === null;
    const aoChanged = aoSeenRef.current !== null && aoSeenRef.current !== aoKey;
    const tiltChanged = tiltSeenRef.current !== null && tiltSeenRef.current !== props.tilted;
    const baseChanged = baseSeenRef.current !== null && baseSeenRef.current !== base;
    aoSeenRef.current = aoKey;
    tiltSeenRef.current = props.tilted;
    baseSeenRef.current = base;
    if (first && !selectedAo) return;
    if (!first && !aoChanged && !tiltChanged && !baseChanged) return;

    const ground =
      selectedAo && (first || aoChanged || tiltChanged)
        ? { lat: selectedAo.lat, lng: selectedAo.lng }
        : (focusRef.current ?? cameraGround(viewer));

    suspendRef.current = true;
    if (!props.tilted) {
      let mpp = presetRef.current
        ? metersPerPixelForRf(presetRef.current)
        : (orthoMpp(viewer) ?? measureMetersPerPixel(viewer) ?? 1_400);
      if (tiltChanged && !presetRef.current) {
        const measured = measureMetersPerPixel(viewer);
        if (measured) mpp = measured;
      }
      const floor = resolutionFloorMpp(base, ground.lat, ground.lng, google);
      applyOrthographicNadir(viewer, ground.lat, ground.lng, Math.max(mpp, floor));
      focusRef.current = ground;
    } else if (baseChanged && base === 'photoreal') {
      applyPerspectiveView(viewer, ground.lat, ground.lng, 70_000, -32, 0);
      clampToNativeResolution(viewer, base, google);
    } else if (aoChanged && selectedAo) {
      applyPerspectiveView(
        viewer,
        selectedAo.lat,
        selectedAo.lng,
        base === 'photoreal' ? 70_000 : 520_000,
        base === 'photoreal' ? -32 : -52,
        0,
      );
      focusRef.current = { lat: selectedAo.lat, lng: selectedAo.lng };
      clampToNativeResolution(viewer, base, google);
    } else if (tiltChanged) {
      const mpp = orthoMpp(viewer) ?? measureMetersPerPixel(viewer) ?? 400;
      const fovy = Cesium.Math.toRadians(60);
      const height = (mpp * Math.max(1, viewer.scene.canvas.clientHeight)) / (2 * Math.tan(fovy / 2));
      applyPerspectiveView(
        viewer,
        ground.lat,
        ground.lng,
        Math.min(2_000_000, Math.max(8_000, height)),
        base === 'photoreal' ? -32 : -52,
        0,
      );
      clampToNativeResolution(viewer, base, google);
    }
    suspendRef.current = false;
    publishHudRef.current();
  }, [ready, props.tilted, props.onTilt, selectedAo, base, scaleNonce]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready || !props.selectedUnitId) return;
    const marker = findMarker(propsRef.current.visibleLayers, props.selectedUnitId);
    if (!marker) return;
    frameDetailRef.current(marker.lat, marker.lng, true);
  }, [ready, props.selectedUnitId, props.tilted]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const focus = props.strikeFocus;
    if (!viewer || !ready || !focus) return;
    frameDetailRef.current(focus.lat, focus.lng, true);
  }, [ready, props.strikeFocus?.id, props.tilted]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const focus = props.socialFocus;
    if (!viewer || !ready || !focus) return;
    frameDetailRef.current(focus.lat, focus.lng, true);
  }, [ready, props.socialFocus?.id, props.tilted]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    applySymbolEmphasis(viewer, props.pulseKey ?? null, props.highlightKey ?? null);
  }, [ready, props.pulseKey, props.highlightKey]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const anchor = props.anchor;
    if (!viewer || !ready || !anchor) {
      props.onAnchor?.(null);
      return;
    }
    const lat = anchor.lat;
    const lng = anchor.lng;
    const tick = () => {
      const live = viewerRef.current;
      if (!live || live.isDestroyed()) return;
      const projected = Cesium.SceneTransforms.worldToWindowCoordinates(
        live.scene,
        Cesium.Cartesian3.fromDegrees(lng, lat),
      );
      propsRef.current.onAnchor?.(projected ? { x: projected.x, y: projected.y } : null);
    };
    const remove = viewer.scene.preRender.addEventListener(tick);
    tick();
    return () => {
      remove();
    };
  }, [ready, props.anchor?.lat, props.anchor?.lng]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const request = props.liveFly;
    if (!viewer || !ready || !request) return;
    frameDetailRef.current(request.lat, request.lng, false);
  }, [ready, props.liveFly, props.tilted]);

  const gridLat = Math.round(view.lat * 40) / 40;
  const gridLng = Math.round(view.lng * 40) / 40;
  const gridHeight = Math.round(view.height / 25_000);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    const source = viewer.dataSources.getByName('oe-sample')[0];
    if (!source) return;
    source.entities.removeAll();
    paintScene(viewer, source, props, overlays, selectedAo, gridPreset);
    applySymbolEmphasis(viewer, pulseRef.current, highlightRef.current);
    viewer.scene.requestRender();
  }, [ready, props, overlays, selectedAo, gridLat, gridLng, gridHeight, gridPreset]);

  const weatherText =
    overlays.weather.visible && !props.killSwitch
      ? (() => {
          const altitude = solarAltitudeDeg(view.lat, view.lng);
          return `Hypothetical stub, not a forecast. View-center solar altitude ${altitude.toFixed(0)}° · ${illuminationLabel(altitude)}.`;
        })()
      : null;

  const attribution = attributionFor(compare ? [base, compareWith] : [base]);
  const passiveTilesNote =
    base === 'photoreal' && (compare || flags.google3dKey.length === 0) && tilesNote !== PHOTOREAL_DAILY_CAP_NOTE
      ? 'Google Photorealistic 3D Tiles are off. Free imagery is draped on elevation.'
      : '';
  const detailNote = tilesNote === PHOTOREAL_DAILY_CAP_NOTE ? '' : tilesNote || passiveTilesNote;
  const photorealNote = [terrainNote, detailNote].filter(Boolean).join(' · ');

  return (
    <div className="map-stage" ref={stageRef} data-testid="cesium-map" data-base-layer={base}>
      <div ref={hostRef} className="cesium-host" />
      {!ready && !bootError && <p className="map-boot">Loading map…</p>}
      {base === 'photoreal' && tilesNote === PHOTOREAL_DAILY_CAP_NOTE && (
        <p className="photoreal-cap-note" data-testid="photoreal-cap-note" role="status">
          {PHOTOREAL_DAILY_CAP_NOTE}
        </p>
      )}
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
        layersOpen={dock.isOpen('layers')}
        overlaysCardOpen={dock.isOpen('overlays')}
        chromeHidden={dock.hidden}
        onExpandLayers={() => dock.expand('layers')}
        onExpandOverlays={() => dock.expand('overlays')}
        onCollapseOverlays={() => dock.collapse('overlays')}
        scaleRf={scaleHud.rf}
        scalePreset={scaleHud.preset}
        scaleBarMeters={scaleHud.barMeters}
        scaleBarPx={scaleHud.barPx}
        scaleNote={scaleHud.note}
        onPickScale={(rf) => {
          pendingScaleRef.current = rf;
          setScaleNonce((nonce) => nonce + 1);
          if (props.tilted) props.onTilt(false);
        }}
        onNadir={() => {
          const live = viewerRef.current;
          if (!live || live.isDestroyed()) return;
          const ground = focusRef.current ?? cameraGround(live);
          focusRef.current = ground;
          if (!props.tilted) {
            const mpp = orthoMpp(live) ?? measureMetersPerPixel(live) ?? 200;
            suspendRef.current = true;
            applyOrthographicNadir(live, ground.lat, ground.lng, mpp);
            suspendRef.current = false;
            publishHudRef.current();
            return;
          }
          const carto = live.camera.positionCartographic;
          suspendRef.current = true;
          live.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
            orientation: { heading: live.camera.heading, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
            duration: 0.55,
            complete: () => {
              nudgeTargetToFreeCenter(live, ground.lat, ground.lng);
              suspendRef.current = false;
              publishHudRef.current();
            },
            cancel: () => {
              suspendRef.current = false;
            },
          });
        }}
        onNorthUp={() => {
          const live = viewerRef.current;
          if (!live || live.isDestroyed()) return;
          const ground = focusRef.current ?? cameraGround(live);
          if (!props.tilted) {
            suspendRef.current = true;
            live.camera.setView({ orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 } });
            nudgeTargetToFreeCenter(live, ground.lat, ground.lng);
            suspendRef.current = false;
            return;
          }
          const carto = live.camera.positionCartographic;
          suspendRef.current = true;
          live.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
            orientation: { heading: 0, pitch: live.camera.pitch, roll: 0 },
            duration: 0.45,
            complete: () => {
              suspendRef.current = false;
              publishHudRef.current();
            },
            cancel: () => {
              suspendRef.current = false;
            },
          });
        }}
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
  gridPreset: number | null,
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
      const spec = gridForPreset(gridPreset);
      if (spec) {
        const lines = mgrsPaperGrid(rect.west, rect.south, rect.east, rect.north, spec.major, spec.minor);
        for (const line of lines) {
          addPolyline(source, {
            id: `mgrs:${line.id}`,
            positions: line.positions,
            color: '#f3e7b3',
            opacity: (line.faint ? 0.28 : 0.82) * overlays.mgrs.opacity,
            width: line.faint ? 1 : 1.6,
          });
          if (!line.label) continue;
          addOnlyLabel(source, {
            id: `mgrs-label:${line.id}`,
            lng: line.labelAt[0],
            lat: line.labelAt[1],
            text: line.label,
            color: '#f3e7b3',
            opacity: line.faint ? overlays.mgrs.opacity * 0.7 : overlays.mgrs.opacity,
          });
        }
      } else {
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

function applySymbolEmphasis(viewer: Cesium.Viewer, pulse: string | null, highlight: string | null) {
  const source = viewer.dataSources.getByName('oe-sample')[0];
  if (!source) return;
  const now = Cesium.JulianDate.now();
  for (const entity of source.entities.values) {
    if (!entity.billboard || !entity.properties) continue;
    const kind = entity.properties.kind?.getValue(now);
    const id = entity.properties.id?.getValue(now);
    if (!kind || !id) continue;
    const key = `${kind}:${id}`;
    const base = Number(entity.properties.baseScale?.getValue(now) ?? 1);
    const hot = key === pulse || key === highlight;
    entity.billboard.scale = new Cesium.ConstantProperty(hot ? base * 1.65 : base);
  }
  viewer.scene.requestRender();
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
    properties: { kind: input.kind, id: input.targetId, baseScale: input.scale },
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
