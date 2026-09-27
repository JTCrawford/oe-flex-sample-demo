import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { BufferGeometry, Material, Mesh, Object3D, Texture, WebGLRenderer } from 'three';
import { PLATE_VIEWS, renderMeshId, type SphereModel } from '../data/engagementSphere';
import type { ScenarioId } from '../data/scenarios';
import {
  SPHERE_LAYERS,
  sphereAnalysisFor,
  type SphereLayerId,
} from '../data/sphereAnalysis';
import type { PhotorealSource } from '../sphere/loadPhotoreal';
import { defaultSkinId, OE_SKINS, oeSkinById } from '../data/oeSkins';
import {
  bindOeSkin,
  loadCamoTexture,
  resolveSkinAssets,
  skinSwatchUrl,
  type OeSkinSlot,
  type ResolvedSkin,
} from '../sphere/applyOeSkin';
import { paintRecognitionPlate } from '../sphere/paintPlate';
import { SalesCallout } from './SalesCallout';

interface Props {
  model: SphereModel;
  typeDesignation: string;
  unitDesignation: string;
  aoId: string | null;
  unitId: string | null;
  scenarioId: ScenarioId;
  onClose: () => void;
}

const PRESETS: { id: string; label: string; dir: readonly [number, number, number] }[] = [
  { id: 'top', label: 'Top', dir: [0, 1, 0.16] },
  { id: 'under', label: 'Undercarriage', dir: [0, -1, 0.16] },
  { id: 'port', label: 'Port', dir: [-1, 0.12, 0] },
  { id: 'starboard', label: 'Starboard', dir: [1, 0.12, 0] },
  { id: 'front', label: 'Front', dir: [0, 0.14, 1] },
  { id: 'back', label: 'Back', dir: [0, 0.14, -1] },
];

/**
 * Lazy three.js viewer. The photoreal GLB is fetched on open and the WebGL
 * context is released on close so the globe can keep its own context.
 */
export default function EngagementSphere({
  model,
  typeDesignation,
  unitDesignation,
  aoId,
  unitId,
  scenarioId,
  onClose,
}: Props) {
  const titleId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const apiRef = useRef<{
    go: (dir: readonly [number, number, number]) => void;
    setOverlay: (known: boolean, believed: boolean) => void;
    setSkin: (assets: ResolvedSkin) => void;
  } | null>(null);
  const autoSkinId = useMemo(
    () => defaultSkinId(aoId, model.id, unitId),
    [aoId, model.id, unitId],
  );
  const [skinId, setSkinId] = useState(autoSkinId);
  const [textureUrl, setTextureUrl] = useState(() =>
    skinSwatchUrl(oeSkinById(autoSkinId), aoId),
  );
  const [meshOverride, setMeshOverride] = useState<string | null>(null);
  const [meshSource, setMeshSource] = useState<PhotorealSource | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showKnown, setShowKnown] = useState(true);
  const [showBelieved, setShowBelieved] = useState(true);
  const [layersOn, setLayersOn] = useState<Record<SphereLayerId, boolean>>({
    strengths: false,
    weaknesses: false,
    defeat: false,
    capabilities: false,
  });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [tab, setTab] = useState<'brief' | 'mesh'>('brief');
  const skinRef = useRef(skinId);
  const aoRef = useRef(aoId);
  skinRef.current = skinId;
  aoRef.current = aoId;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 860px)');
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let disposed = false;
    let teardown = () => {};
    setPhase('loading');

    void (async () => {
      let renderer: WebGLRenderer | null = null;
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import(
          'three/addons/controls/OrbitControls.js'
        );
        const { RoomEnvironment } = await import(
          'three/addons/environments/RoomEnvironment.js'
        );
        const { loadPhotoreal } = await import('../sphere/loadPhotoreal');
        const skinAssets = await resolveSkinAssets(model.id, skinRef.current, aoRef.current);
        if (disposed) return;
        if ((skinAssets.glbUrl ?? null) !== meshOverride) {
          setMeshOverride(skinAssets.glbUrl);
          return;
        }

        const coarse = window.matchMedia('(pointer: coarse)').matches;
        const gl = new THREE.WebGLRenderer({
          antialias: !coarse,
          alpha: false,
          powerPreference: 'low-power',
          preserveDrawingBuffer: true,
        });
        renderer = gl;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5));
        gl.setClearColor(0x6a727c, 1);
        gl.domElement.style.width = '100%';
        gl.domElement.style.height = '100%';
        gl.domElement.style.display = 'block';
        gl.domElement.style.touchAction = 'none';
        gl.domElement.dataset.testid = 'sphere-canvas';
        stage.appendChild(gl.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 8000);
        const modelRoot = new THREE.Group();
        scene.add(modelRoot);
        const loaded = await loadPhotoreal(model.id, modelRoot, meshOverride);
        if (!disposed) setMeshSource(loaded.source);
        const skinSlot: OeSkinSlot = bindOeSkin(modelRoot, THREE);
        if (!meshOverride) {
          const camo = await loadCamoTexture(THREE, skinAssets.textureUrl, skinAssets.filter);
          if (disposed) {
            camo.dispose();
          } else {
            skinSlot.setTexture(camo, skinAssets.meters);
            setTextureUrl(skinAssets.textureUrl);
          }
        }
        if (disposed) {
          loaded.revoke?.();
          skinSlot.disposeTexture();
          disposeHierarchy(modelRoot);
          gl.dispose();
          gl.forceContextLoss();
          gl.domElement.remove();
          return;
        }

        const pmrem = new THREE.PMREMGenerator(gl);
        const envScene = new RoomEnvironment();
        const envTex = pmrem.fromScene(envScene, 0.04).texture;
        scene.environment = envTex;
        scene.environmentIntensity = 1.05;
        envScene.traverse((obj) => {
          const mesh = obj as Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const material = mesh.material;
            if (Array.isArray(material)) material.forEach((item) => item.dispose());
            else material?.dispose();
          }
        });

        scene.add(new THREE.HemisphereLight(0xd5e2f2, 0x6a5a48, 0.35));
        const key = new THREE.DirectionalLight(0xfff5e8, coarse ? 1.4 : 2.4);
        key.position.set(4, 8, 6);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xb7c9dc, 0.45);
        fill.position.set(-6, 2, -4);
        scene.add(fill);

        const bounds = new THREE.Box3().setFromObject(modelRoot);
        const fitted = bounds.getBoundingSphere(new THREE.Sphere());
        const span = Math.max(fitted.radius, 0.5);
        camera.near = span * 0.01;
        camera.far = span * 80;
        camera.updateProjectionMatrix();
        const markerR = span * 0.04;
        const known = new THREE.Group();
        const believed = new THREE.Group();
        loaded.scene.add(known, believed);
        const knownMat = new THREE.MeshBasicMaterial({
          color: 0xf5a623,
          side: THREE.DoubleSide,
        });
        const believedMat = new THREE.MeshBasicMaterial({
          color: 0x6ec6ff,
          wireframe: true,
          side: THREE.DoubleSide,
        });
        for (const point of model.weakPoints) {
          const at = loaded.anchors[point.id];
          if (!at) continue;
          const marker = new THREE.Mesh(
            new THREE.OctahedronGeometry(
              point.confidence === 'known' ? markerR : markerR * 1.25,
              0,
            ),
            point.confidence === 'known' ? knownMat : believedMat,
          );
          marker.position.set(at[0], at[1], at[2]);
          (point.confidence === 'known' ? known : believed).add(marker);
        }

        const shadow = contactShadowTexture(THREE);
        const footprint = Math.max(fitted.radius, 0.5) * 2.4;
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(footprint, footprint),
          new THREE.MeshBasicMaterial({
            map: shadow,
            transparent: true,
            depthWrite: false,
          }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(fitted.center.x, bounds.min.y - markerR * 0.15, fitted.center.z);
        scene.add(ground);
        const focus = fitted.center.clone();
        const viewRadius =
          (Math.max(fitted.radius, 0.5) * 1.55) /
          Math.tan((camera.fov * Math.PI) / 360);

        const wire = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(fitted.radius, 0.5) * 1.65, 20, 14),
          new THREE.MeshBasicMaterial({
            color: 0x1d4e78,
            wireframe: true,
            transparent: true,
            opacity: 0.28,
          }),
        );
        wire.position.copy(focus);
        scene.add(wire);

        const controls = new OrbitControls(camera, gl.domElement);
        controls.enablePan = false;
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.enableDamping = false;
        controls.zoomToCursor = false;
        controls.rotateSpeed = 0.85;
        controls.zoomSpeed = 0.9;
        controls.minDistance = Math.max(fitted.radius, 0.5) * 0.7;
        controls.maxDistance = Math.max(fitted.radius, 0.5) * 8;
        controls.minPolarAngle = 0.02;
        controls.maxPolarAngle = Math.PI - 0.02;
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
        controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
        controls.touches.ONE = THREE.TOUCH.ROTATE;
        controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
        controls.target.copy(focus);

        let raf = 0;
        const render = () => {
          gl.render(scene, camera);
        };
        const go = (dir: readonly [number, number, number]) => {
          cancelAnimationFrame(raf);
          const dest = focus
            .clone()
            .add(new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(viewRadius));
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const from = camera.position.clone();
          const apply = (t: number) => {
            camera.position.lerpVectors(from, dest, t);
            camera.lookAt(focus);
            controls.target.copy(focus);
            controls.update();
            render();
          };
          if (reduce) {
            apply(1);
            return;
          }
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / 460);
            const eased = t * t * (3 - 2 * t);
            apply(eased);
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        };

        const initial = new THREE.Vector3(0.9, 0.55, 1).normalize().multiplyScalar(viewRadius);
        camera.position.copy(focus.clone().add(initial));
        camera.lookAt(focus);
        controls.update();

        const onChange = () => render();
        controls.addEventListener('change', onChange);
        const onStart = () => setActivePreset(null);
        controls.addEventListener('start', onStart);

        const fit = () => {
          const width = stage.clientWidth;
          const height = stage.clientHeight;
          if (width < 2 || height < 2) return;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          gl.setSize(width, height, false);
          render();
        };
        const observer = new ResizeObserver(fit);
        observer.observe(stage);
        fit();

        apiRef.current = {
          go,
          setOverlay: (knownOn, believedOn) => {
            known.visible = knownOn;
            believed.visible = believedOn;
            render();
          },
          setSkin: (assets) => {
            if ((assets.glbUrl ?? null) !== meshOverride) {
              setMeshOverride(assets.glbUrl);
              return;
            }
            if (assets.glbUrl) {
              setTextureUrl(assets.textureUrl);
              return;
            }
            void loadCamoTexture(THREE, assets.textureUrl, assets.filter).then((tex) => {
              if (disposed) {
                tex.dispose();
                return;
              }
              skinSlot.setTexture(tex, assets.meters);
              setTextureUrl(assets.textureUrl);
              render();
            });
          },
        };
        if (!disposed) setPhase('ready');

        teardown = () => {
          loaded.revoke?.();
          cancelAnimationFrame(raf);
          apiRef.current = null;
          observer.disconnect();
          controls.removeEventListener('change', onChange);
          controls.removeEventListener('start', onStart);
          controls.dispose();
          scene.environment = null;
          envTex.dispose();
          pmrem.dispose();
          skinSlot.disposeTexture();
          disposeHierarchy(scene);
          gl.dispose();
          gl.forceContextLoss();
          gl.domElement.remove();
          renderer = null;
        };
        if (disposed) teardown();
      } catch {
        renderer?.dispose();
        renderer?.forceContextLoss();
        renderer?.domElement.remove();
        if (!disposed) setPhase('error');
      }
    })();

    return () => {
      disposed = true;
      teardown();
    };
  }, [model, meshOverride]);

  useEffect(() => {
    if (phase !== 'ready') return;
    let cancel = false;
    void resolveSkinAssets(model.id, skinId, aoId).then((assets) => {
      if (!cancel) apiRef.current?.setSkin(assets);
    });
    return () => {
      cancel = true;
    };
  }, [phase, skinId, aoId, model.id]);

  useEffect(() => {
    apiRef.current?.setOverlay(showKnown, showBelieved);
  }, [showKnown, showBelieved, phase]);

  const visiblePoints = model.weakPoints.filter((point) =>
    point.confidence === 'known' ? showKnown : showBelieved,
  );
  const analysis = useMemo(
    () => sphereAnalysisFor(model.id, scenarioId),
    [model.id, scenarioId],
  );
  const activeLayers = SPHERE_LAYERS.filter((layer) => layersOn[layer.id]);
  const toggleLayer = (id: SphereLayerId) => {
    setLayersOn((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <div
      className="sphere-backdrop"
      onClick={onClose}
    >
      <div
        className="sphere-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="engagement-sphere-viewer"
        data-sphere-model-id={model.id}
        data-scenario={scenarioId}
        data-oe-skin={skinId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sphere-head">
          <div>
            <p className="munition-kicker">
              <span className="sphere-badge">UNCLASS</span>
              <span className="sphere-badge sphere-badge-sample">SAMPLE</span>
            </p>
            <p className="sphere-eyebrow">Engagement sphere</p>
            <h3 id={titleId}>{model.title}</h3>
            <p className="sphere-sub">
              {typeDesignation}
              <span> · {unitDesignation}</span>
            </p>
            <p className="sphere-model-id">
              Model <code className="sphere-id">{model.id}</code>
            </p>
            <p
              className="sphere-geometry"
              data-testid="sphere-geometry-status"
              data-geometry-status={model.geometry.status}
              data-render-mesh={model.geometry.renderMeshId}
            >
              {model.geometry.status === 'licensed-pending-embed'
                ? 'Licensed geometry: Mac-local / pending optimized embed'
                : 'CC0 recognition mesh'}
              {model.geometry.renderMeshId !== model.id && (
                <>
                  {' '}
                  · public stand-in{' '}
                  <code className="sphere-id">{model.geometry.renderMeshId}</code>
                </>
              )}
            </p>
            {model.id === 'sphere-soldier' && (
              <p className="sphere-geometry" data-testid="sphere-mesh-source" data-mesh-source={meshSource ?? 'pending'}>
                {meshSource === 'soldier-glb'
                  ? 'Local soldier GLB loaded. This file is not part of the public demo.'
                  : meshSource === 'cc0' || meshSource === 'override'
                    ? 'Soldier GLB not on this host. Showing the CC0 stand-in. The map pin stays a simple marker.'
                    : 'Checking for a local soldier GLB…'}
              </p>
            )}
          </div>
          <button ref={closeRef} type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="sphere-toolbar">
          <div className="sphere-toggles" role="group" aria-label="Weak point overlays">
            <label>
              <input
                type="checkbox"
                data-testid="sphere-toggle-known"
                checked={showKnown}
                onChange={() => setShowKnown((value) => !value)}
              />
              <span className="sphere-swatch sphere-swatch-known" />
              Known
            </label>
            <label>
              <input
                type="checkbox"
                data-testid="sphere-toggle-believed"
                checked={showBelieved}
                onChange={() => setShowBelieved((value) => !value)}
              />
              <span className="sphere-swatch sphere-swatch-believed" />
              Believed
            </label>
          </div>
          <div className="sphere-skins" role="radiogroup" aria-label="OE camouflage">
            <span className="sphere-skins-label">OE skin</span>
            {OE_SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                role="radio"
                aria-checked={skinId === skin.id}
                data-testid={`sphere-skin-${skin.id}`}
                title={skin.summary}
                onClick={() => setSkinId(skin.id)}
              >
                <span
                  className="sphere-skin-swatch"
                  style={{ backgroundImage: `url(${skinSwatchUrl(skin, aoId)})` }}
                />
                {skin.label}
                {skin.id === autoSkinId && <small>AO</small>}
              </button>
            ))}
          </div>
          <div className="sphere-layers" role="group" aria-label="SAMPLE analysis layers">
            <span className="sphere-skins-label">Layers</span>
            {SPHERE_LAYERS.map((layer) => (
              <button
                key={layer.id}
                type="button"
                aria-pressed={layersOn[layer.id]}
                data-testid={`sphere-layer-${layer.id}`}
                onClick={() => toggleLayer(layer.id)}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>
        <div className="sphere-tabs" role="tablist" aria-label="Sphere views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'brief'}
            onClick={() => setTab('brief')}
          >
            2D plates
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'mesh'}
            onClick={() => setTab('mesh')}
          >
            3D
          </button>
        </div>
        <section
          className="sphere-plates"
          hidden={narrow && tab !== 'brief'}
          aria-label="Recognition plates"
        >
          <RecognitionPlate
            model={model}
            visiblePoints={visiblePoints}
            skinId={skinId}
            textureUrl={textureUrl}
            activeLayers={activeLayers}
            analysis={analysis}
          />
        </section>
        <div className="sphere-stage" ref={stageRef} hidden={narrow && tab !== 'mesh'}>
          {phase === 'loading' && (
            <p className="sphere-status" role="status">
              Loading photoreal SAMPLE model…
            </p>
          )}
          {phase === 'error' && (
            <p className="sphere-status" role="alert">
              This browser could not start the SAMPLE 3D view.
            </p>
          )}
          <p className="sphere-orbit-hint">Drag to orbit. Scroll or pinch to zoom.</p>
          {activeLayers.length > 0 && (
            <div className="sphere-layer-float">
              <AnalysisNotes activeLayers={activeLayers} analysis={analysis} />
            </div>
          )}
          <div className="sphere-views" role="group" aria-label="Camera presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                data-testid={`sphere-view-${preset.id}`}
                aria-pressed={activePreset === preset.id}
                disabled={phase !== 'ready'}
                onClick={() => {
                  setActivePreset(preset.id);
                  apiRef.current?.go(preset.dir);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecognitionPlate({
  model,
  visiblePoints,
  skinId,
  textureUrl,
  activeLayers,
  analysis,
}: {
  model: SphereModel;
  visiblePoints: SphereModel['weakPoints'];
  skinId: string;
  textureUrl: string;
  activeLayers: { id: SphereLayerId; label: string }[];
  analysis: ReturnType<typeof sphereAnalysisFor>;
}) {
  const { briefing } = model;
  const skin = oeSkinById(skinId);
  const base = import.meta.env.BASE_URL;
  return (
    <>
      <p className="plate-banner">
        <span>UNCLASS</span>
        <span>SAMPLE</span>
      </p>
      <h4>{briefing.designation}</h4>
      <p className="plate-role">{briefing.role}</p>
      <p className="plate-skin">OE skin · {skin.label}</p>
      <div className="plate-stills">
        {PLATE_VIEWS.map((view) => (
          <figure key={view.id} className="plate-still">
            <SkinnedStill
              plateUrl={`${base}models/plates/${renderMeshId(model.id)}-${view.id}.png`}
              textureUrl={textureUrl}
              tile={skin.plateTile}
              alt={`${briefing.designation}, ${view.label.toLowerCase()} view, ${skin.label}`}
            />
            <figcaption>{view.label}</figcaption>
          </figure>
        ))}
      </div>
      <dl className="sphere-facts">
        <dt>Propulsion</dt>
        <dd>{briefing.propulsion}</dd>
        <dt>Munition</dt>
        <dd>{briefing.munition}</dd>
        {briefing.dimensions.map((fact) => (
          <Fragment key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </Fragment>
        ))}
      </dl>
      <p className="sphere-summary">{model.summary}</p>
      <AnalysisNotes activeLayers={activeLayers} analysis={analysis} />
      <p className="plate-points-label">Weak points</p>
      <ul className="sphere-points">
        {visiblePoints.map((point) => (
          <li key={point.id} data-testid={`sphere-point-${point.id}`}>
            <strong>{point.label}</strong>
            <em>{point.confidence}</em>
            <p>{point.note}</p>
          </li>
        ))}
      </ul>
      {model.weakPoints.length === 0 && (
        <p className="sphere-summary" data-testid="sphere-no-weak-points">
          This SAMPLE pin has no weak-point markers.
        </p>
      )}
      {visiblePoints.length === 0 && model.weakPoints.length > 0 && (
        <p className="sphere-summary">Both overlays are off. The mesh stays in view.</p>
      )}
      <p className="sphere-fence">{briefing.fidelity}</p>
      <SalesCallout id="engagementSphere" compact />
    </>
  );
}

function AnalysisNotes({
  activeLayers,
  analysis,
}: {
  activeLayers: { id: SphereLayerId; label: string }[];
  analysis: ReturnType<typeof sphereAnalysisFor>;
}) {
  if (activeLayers.length === 0) {
    return (
      <p className="sphere-layer-empty">
        Turn on a layer for the SAMPLE vignette card.
      </p>
    );
  }
  return (
    <div className="sphere-layer-notes" data-testid="sphere-layer-notes">
      {activeLayers.map((layer) => (
        <section key={layer.id} aria-label={layer.label}>
          <h5>{layer.label}</h5>
          {layer.id === 'defeat' && (
            <p className="sphere-layer-fence">
              UNCLASS SAMPLE vignette. Training labels only. Not a targeting solution
              and not a procedure.
            </p>
          )}
          <ul>
            {analysis[layer.id].map((item) => (
              <li key={item.id} data-stub={item.stub ? 'true' : 'false'}>
                <strong>
                  {item.title}
                  {item.stub && <em>Stub</em>}
                </strong>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SkinnedStill({
  plateUrl,
  textureUrl,
  tile,
  alt,
}: {
  plateUrl: string;
  textureUrl: string;
  tile: number;
  alt: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let gone = false;
    setFailed(false);
    const plate = new Image();
    const camo = new Image();
    let pending = 2;
    const finish = () => {
      pending -= 1;
      if (pending > 0 || gone) return;
      const canvas = canvasRef.current;
      if (!canvas || !paintRecognitionPlate(canvas, plate, camo, tile)) {
        if (!gone) setFailed(true);
      }
    };
    plate.onload = finish;
    camo.onload = finish;
    plate.onerror = () => {
      if (!gone) setFailed(true);
    };
    camo.onerror = () => {
      if (!gone) setFailed(true);
    };
    plate.src = plateUrl;
    camo.src = textureUrl;
    return () => {
      gone = true;
    };
  }, [plateUrl, textureUrl, tile]);

  if (failed) {
    return <img src={plateUrl} alt={alt} />;
  }
  return <canvas ref={canvasRef} role="img" aria-label={alt} />;
}

function disposeHierarchy(root: Object3D) {
  const geos = new Set<BufferGeometry>();
  const mats = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    geos.add(mesh.geometry);
    const material = mesh.material;
    const list = Array.isArray(material) ? material : [material];
    list.forEach((item) => {
      if (!item) return;
      mats.add(item);
      const maps = item as Material & Record<string, Texture | null | undefined>;
      for (const key of [
        'map',
        'normalMap',
        'roughnessMap',
        'metalnessMap',
        'aoMap',
        'emissiveMap',
        'alphaMap',
        'bumpMap',
      ]) {
        const tex = maps[key];
        if (tex && 'isTexture' in tex) textures.add(tex);
      }
    });
  });
  geos.forEach((geometry) => geometry.dispose());
  mats.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

function contactShadowTexture(THREE: typeof import('three')) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0,0,0,0.45)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
