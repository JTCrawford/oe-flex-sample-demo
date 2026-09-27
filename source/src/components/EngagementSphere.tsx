import { useEffect, useId, useRef, useState } from 'react';
import type { BufferGeometry, Group, Material, Mesh, Object3D, WebGLRenderer } from 'three';
import type { SphereModel, SphereModelId } from '../data/engagementSphere';
import { SalesCallout } from './SalesCallout';

interface Props {
  model: SphereModel;
  typeDesignation: string;
  unitDesignation: string;
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

async function loadSphereMesh(id: SphereModelId) {
  switch (id) {
    case 'sphere-mbt': {
      const mod = await import('../sphere/mbt');
      return { build: mod.buildMbt, anchors: mod.mbtAnchors };
    }
    case 'sphere-fighter': {
      const mod = await import('../sphere/fighter');
      return { build: mod.buildFighter, anchors: mod.fighterAnchors };
    }
    case 'sphere-vessel': {
      const mod = await import('../sphere/vessel');
      return { build: mod.buildVessel, anchors: mod.vesselAnchors };
    }
    case 'sphere-tochka-u':
    case 'sphere-iskander-m':
    case 'sphere-atacms-block-i':
    case 'sphere-atacms-later-block': {
      const mod = await import('../sphere/srbm');
      const variant = mod.variantForModel(id);
      return {
        build: (root: Group) => mod.buildSrbm(root, variant),
        anchors: mod.srbmAnchors(variant),
      };
    }
  }
}

/**
 * Lazy three.js viewer. Geometry is built on open and the WebGL context is
 * released on close so the globe can keep its own context.
 */
export default function EngagementSphere({
  model,
  typeDesignation,
  unitDesignation,
  onClose,
}: Props) {
  const titleId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const apiRef = useRef<{
    go: (dir: readonly [number, number, number]) => void;
    setOverlay: (known: boolean, believed: boolean) => void;
  } | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showKnown, setShowKnown] = useState(true);
  const [showBelieved, setShowBelieved] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
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

    void (async () => {
      let renderer: WebGLRenderer | null = null;
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import(
          'three/addons/controls/OrbitControls.js'
        );
        const mesh = await loadSphereMesh(model.id);
        if (disposed) return;

        const coarse = window.matchMedia('(pointer: coarse)').matches;
        const gl = new THREE.WebGLRenderer({
          antialias: !coarse,
          alpha: false,
          powerPreference: 'low-power',
          preserveDrawingBuffer: true,
        });
        renderer = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5));
        gl.setClearColor(0x101820, 1);
        gl.domElement.style.width = '100%';
        gl.domElement.style.height = '100%';
        gl.domElement.style.display = 'block';
        gl.domElement.style.touchAction = 'none';
        gl.domElement.dataset.testid = 'sphere-canvas';
        stage.appendChild(gl.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 200);
        const modelRoot = new THREE.Group();
        scene.add(modelRoot);
        mesh.build(modelRoot);

        const known = new THREE.Group();
        const believed = new THREE.Group();
        modelRoot.add(known, believed);
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
          const at = mesh.anchors[point.id];
          if (!at) continue;
          const marker = new THREE.Mesh(
            new THREE.OctahedronGeometry(point.confidence === 'known' ? 0.14 : 0.18, 0),
            point.confidence === 'known' ? knownMat : believedMat,
          );
          marker.position.set(at[0], at[1], at[2]);
          (point.confidence === 'known' ? known : believed).add(marker);
        }

        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        scene.add(new THREE.HemisphereLight(0xc5d4e8, 0x6a5a48, 0.75));
        const key = new THREE.DirectionalLight(0xffffff, 1.3);
        key.position.set(4, 7, 5);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0x9eb6d0, 0.5);
        fill.position.set(-5, 2, -3);
        scene.add(fill);

        const bounds = new THREE.Box3().setFromObject(modelRoot);
        const fitted = bounds.getBoundingSphere(new THREE.Sphere());
        const focus = fitted.center.clone();
        const viewRadius =
          (Math.max(fitted.radius, 0.5) * 1.55) /
          Math.tan((camera.fov * Math.PI) / 360);

        const wire = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(fitted.radius, 0.5) * 1.65, 16, 12),
          new THREE.MeshBasicMaterial({
            color: 0x6ec6ff,
            wireframe: true,
            transparent: true,
            opacity: 0.16,
          }),
        );
        wire.position.copy(focus);
        scene.add(wire);

        const controls = new OrbitControls(camera, gl.domElement);
        controls.enablePan = false;
        controls.enableDamping = false;
        controls.minDistance = Math.max(fitted.radius, 0.5) * 0.7;
        controls.maxDistance = Math.max(fitted.radius, 0.5) * 8;
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
        };
        if (!disposed) setPhase('ready');

        teardown = () => {
          cancelAnimationFrame(raf);
          apiRef.current = null;
          observer.disconnect();
          controls.removeEventListener('change', onChange);
          controls.removeEventListener('start', onStart);
          controls.dispose();
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
  }, [model]);

  useEffect(() => {
    apiRef.current?.setOverlay(showKnown, showBelieved);
  }, [showKnown, showBelieved, phase]);

  const visiblePoints = model.weakPoints.filter((point) =>
    point.confidence === 'known' ? showKnown : showBelieved,
  );

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
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sphere-head">
          <div>
            <p className="munition-kicker">UNCLASS · SAMPLE · stylized model</p>
            <h3 id={titleId}>Engagement sphere</h3>
            <p className="sphere-sub">
              {typeDesignation}
              <span> · {unitDesignation}</span>
            </p>
            <p className="sphere-model-id">
              Model <code className="sphere-id">{model.id}</code>
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="sphere-stage" ref={stageRef}>
          {phase === 'loading' && (
            <p className="sphere-status" role="status">
              Loading SAMPLE mesh…
            </p>
          )}
          {phase === 'error' && (
            <p className="sphere-status" role="alert">
              This browser could not start the SAMPLE 3D view.
            </p>
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
        <aside className="sphere-side">
          <p className="sphere-kind">{model.title}</p>
          <p className="muted">{model.kind}</p>
          <p className="sphere-summary">{model.summary}</p>
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
          <ul className="sphere-points">
            {visiblePoints.map((point) => (
              <li key={point.id} data-testid={`sphere-point-${point.id}`}>
                <strong>{point.label}</strong>
                <em>{point.confidence}</em>
                <p>{point.note}</p>
              </li>
            ))}
          </ul>
          {visiblePoints.length === 0 && (
            <p className="muted">Both overlays are off. The mesh stays in view.</p>
          )}
          <p className="sphere-fence">
            Fictional weak points on a stylized mesh. Not a photograph, not a
            technical drawing, and not an assessment of any real vehicle.
          </p>
          <SalesCallout id="engagementSphere" compact />
        </aside>
      </div>
    </div>
  );
}

function disposeHierarchy(root: Object3D) {
  const geos = new Set<BufferGeometry>();
  const mats = new Set<Material>();
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    geos.add(mesh.geometry);
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach((item) => mats.add(item));
    else mats.add(material);
  });
  geos.forEach((geometry) => geometry.dispose());
  mats.forEach((material) => material.dispose());
}
