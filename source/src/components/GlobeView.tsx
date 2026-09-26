import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';
import { circleRingPoints } from '../data/munitionInference';
import type {
  AO,
  StrikeEvent,
  StrikeMunitionAssessment,
  StrikeOverlayToggles,
  SymbologyMode,
  ThreatLayer,
} from '../types';

/** globe.gl runtime exposes arcs/rings; published GlobeInstance typings omit some layer setters. */
type GlobeWithLayers = ReturnType<typeof Globe> & {
  arcsData: (data?: object[]) => GlobeWithLayers;
  arcStartLat: (a: string | ((d: object) => number)) => GlobeWithLayers;
  arcStartLng: (a: string | ((d: object) => number)) => GlobeWithLayers;
  arcEndLat: (a: string | ((d: object) => number)) => GlobeWithLayers;
  arcEndLng: (a: string | ((d: object) => number)) => GlobeWithLayers;
  arcAltitude: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  arcStroke: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  arcColor: (a: string | string[] | ((d: object) => string | string[] | ((t: number) => string))) => GlobeWithLayers;
  arcDashLength: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  arcDashGap: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  arcDashAnimateTime: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  ringsData: (data?: object[]) => GlobeWithLayers;
  ringLat: (a: string | ((d: object) => number)) => GlobeWithLayers;
  ringLng: (a: string | ((d: object) => number)) => GlobeWithLayers;
  ringAltitude: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  ringColor: (a: string | string[] | ((d: object) => string | string[] | ((t: number) => string))) => GlobeWithLayers;
  ringMaxRadius: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  ringPropagationSpeed: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  ringRepeatPeriod: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  pathsData: (data?: object[]) => GlobeWithLayers;
  pathPoints: (a: string | ((d: object) => object[])) => GlobeWithLayers;
  pathPointLat: (a: string | ((d: object) => number)) => GlobeWithLayers;
  pathPointLng: (a: string | ((d: object) => number)) => GlobeWithLayers;
  pathPointAlt: (a: number | string | ((d: object) => number)) => GlobeWithLayers;
  pathColor: (a: string | string[] | ((d: object) => string | string[])) => GlobeWithLayers;
  pathStroke: (a: number | null | ((d: object) => number | null)) => GlobeWithLayers;
  pathDashLength: (a: number | ((d: object) => number)) => GlobeWithLayers;
  pathDashGap: (a: number | ((d: object) => number)) => GlobeWithLayers;
  pathDashAnimateTime: (a: number | ((d: object) => number)) => GlobeWithLayers;
  pathTransitionDuration: (a: number) => GlobeWithLayers;
};

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
}

type Point = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: 'ao' | 'threat' | 'strike-impact' | 'strike-origin';
  aoId?: string;
  strikeId?: string;
  symbolKind?: string;
  color: string;
};

function milSvg(kind?: string): string {
  const stroke =
    kind === 'arty' ? '#f5a623' : kind === 'uav' ? '#6ec6ff' : '#7CFC9A';
  if (kind === 'ship') {
    return `<svg width="26" height="26" viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="16" ry="10" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><path d="M8 22 L20 10 L32 22" fill="none" stroke="${stroke}"/></svg>`;
  }
  if (kind === 'arty') {
    return `<svg width="26" height="26" viewBox="0 0 40 40"><polygon points="20,2 38,20 20,38 2,20" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="none" stroke="${stroke}"/><circle cx="20" cy="20" r="2" fill="${stroke}"/></svg>`;
  }
  if (kind === 'uav') {
    return `<svg width="26" height="26" viewBox="0 0 40 40"><polygon points="20,2 38,20 20,38 2,20" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><path d="M8 20 L20 12 L32 20 L20 28 Z" fill="none" stroke="${stroke}"/></svg>`;
  }
  return `<svg width="26" height="26" viewBox="0 0 40 40"><polygon points="20,2 38,20 20,38 2,20" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><rect x="10" y="16" width="20" height="8" rx="1" fill="none" stroke="${stroke}"/></svg>`;
}

function commercialSvg(kind?: string): string {
  if (kind === 'pipeline') {
    return `<svg width="26" height="26" viewBox="0 0 40 40"><path d="M4 28 C12 8, 28 32, 36 12" fill="none" stroke="#e67e22" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="20" r="4" fill="#e67e22"/></svg>`;
  }
  if (kind === 'port') {
    return `<svg width="26" height="26" viewBox="0 0 40 40"><rect x="6" y="22" width="28" height="10" fill="#888"/><rect x="10" y="10" width="8" height="12" fill="#f5a623"/></svg>`;
  }
  if (kind === 'hazard') {
    return `<svg width="26" height="26" viewBox="0 0 40 40"><polygon points="20,4 36,34 4,34" fill="#f1c40f" stroke="#333"/><text x="20" y="28" text-anchor="middle" font-size="14" font-weight="bold">!</text></svg>`;
  }
  if (kind === 'sensor') {
    return `<svg width="26" height="26" viewBox="0 0 40 40"><circle cx="20" cy="20" r="6" fill="#2ecc71"/><circle cx="20" cy="20" r="12" fill="none" stroke="#2ecc71" stroke-width="2"/></svg>`;
  }
  return `<svg width="26" height="26" viewBox="0 0 40 40"><rect x="4" y="18" width="32" height="10" rx="2" fill="#1e90ff"/><polygon points="8,18 16,8 24,8 28,18" fill="#4aa3ff"/></svg>`;
}

function strikeImpactSvg(): string {
  return `<svg width="22" height="22" viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="rgba(180,40,20,0.35)" stroke="#ff5722" stroke-width="2"/><path d="M20 6 L22 16 L32 14 L24 20 L32 28 L20 24 L8 28 L16 20 L8 14 L18 16 Z" fill="#ff7043" stroke="#fff" stroke-width="0.5"/></svg>`;
}

function strikeOriginSvg(): string {
  return `<svg width="14" height="14" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="#00bcd4" stroke="#e0f7fa" stroke-width="2"/></svg>`;
}

export function GlobeView({
  aos,
  selectedAoId,
  onSelectAo,
  visibleLayers,
  symbology,
  killSwitch,
  strikes = [],
  strikeOverlays,
  showStrikeOverlays = false,
  selectedStrikeId = null,
  onSelectStrike,
  munitionAssessment = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ReturnType<typeof Globe> | null>(null);
  const onSelectRef = useRef(onSelectAo);
  const onSelectStrikeRef = useRef(onSelectStrike);
  onSelectRef.current = onSelectAo;
  onSelectStrikeRef.current = onSelectStrike;

  useEffect(() => {
    if (!containerRef.current) return;

    const globe = new Globe(containerRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#4a90d9')
      .atmosphereAltitude(0.12)
      .pointOfView({ lat: 25, lng: 55, altitude: 2.2 }, 0);

    globeRef.current = globe;
    const container = containerRef.current;

    const onResize = () => {
      if (!container) return;
      globe.width(container.clientWidth);
      globe.height(container.clientHeight);
    };
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (globeRef.current === globe) globeRef.current = null;
      // Release the WebGL context before the next Globe mounts. A leaked
      // context leaves the 2D → globe switch on a blank or stale map.
      const disposable = globe as unknown as {
        renderer: () => { forceContextLoss: () => void };
        _destructor: () => void;
      };
      try {
        disposable.renderer().forceContextLoss();
      } catch {
        /* context already gone */
      }
      try {
        disposable._destructor();
      } catch {
        /* destructor is best-effort on unmount */
      }
      container?.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current as GlobeWithLayers | null;
    if (!globe) return;

    const points: Point[] = aos.map((ao) => ({
      id: `ao-${ao.id}`,
      lat: ao.lat,
      lng: ao.lng,
      label: ao.name,
      kind: 'ao' as const,
      aoId: ao.id,
      color: selectedAoId === ao.id ? '#ff6b35' : '#f5d76e',
    }));

    if (!killSwitch) {
      for (const layer of visibleLayers) {
        for (const m of layer.markers) {
          points.push({
            id: m.id,
            lat: m.lat,
            lng: m.lng,
            label: m.label,
            kind: 'threat',
            symbolKind:
              symbology === 'military' ? m.milSymbol : m.commercialSymbol,
            color: symbology === 'military' ? '#7CFC9A' : '#1e90ff',
          });
        }
      }
    }

    const overlaysOn = showStrikeOverlays && strikes.length > 0 && strikeOverlays;
    if (overlaysOn) {
      if (strikeOverlays!.strikeHistory) {
        for (const s of strikes) {
          points.push({
            id: `impact-${s.id}`,
            lat: s.impactLat,
            lng: s.impactLng,
            label: `${s.attackType.toUpperCase()} · ${s.timestamp} — ${s.label}`,
            kind: 'strike-impact',
            strikeId: s.id,
            color: '#ff5722',
          });
        }
      }
      if (strikeOverlays!.origins) {
        for (const s of strikes) {
          points.push({
            id: `origin-${s.id}`,
            lat: s.originLat,
            lng: s.originLng,
            label: `Origin · ${s.attackType} — ${s.label}`,
            kind: 'strike-origin',
            strikeId: s.id,
            color: '#00bcd4',
          });
        }
      }
    }

    globe
      .htmlElementsData(points)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.01)
      .htmlElement((d) => {
        const p = d as unknown as Point;
        const el = document.createElement('div');
        const strikeSelected = !!p.strikeId && p.strikeId === selectedStrikeId;
        el.className = `globe-marker ${p.kind}${strikeSelected ? ' selected' : ''}`;
        el.title = p.label;
        el.style.cursor =
          p.kind === 'ao' || p.kind === 'strike-impact' || p.kind === 'strike-origin'
            ? 'pointer'
            : 'default';
        el.style.pointerEvents = 'auto';
        if (p.strikeId) el.dataset.strikeId = p.strikeId;
        el.onclick = (e) => {
          e.stopPropagation();
          if (p.kind === 'ao' && p.aoId) onSelectRef.current(p.aoId);
          if (
            (p.kind === 'strike-impact' || p.kind === 'strike-origin') &&
            p.strikeId
          ) {
            onSelectStrikeRef.current?.(p.strikeId);
          }
        };

        if (p.kind === 'ao') {
          el.innerHTML = `<div class="ao-pin" style="--c:${p.color}"><span>${p.label}</span></div>`;
        } else if (p.kind === 'strike-impact') {
          el.innerHTML = `<div class="strike-pin threat-pin-inner">${strikeImpactSvg()}</div>`;
        } else if (p.kind === 'strike-origin') {
          el.innerHTML = `<div class="strike-origin threat-pin-inner">${strikeOriginSvg()}</div>`;
        } else {
          const svg =
            symbology === 'military'
              ? milSvg(p.symbolKind)
              : commercialSvg(p.symbolKind);
          el.innerHTML = `<div class="threat-pin-inner">${svg}</div>`;
        }
        return el;
      });

    // Arcs: origin → impact when origins and/or strikeHistory
    const showArcs =
      overlaysOn &&
      (strikeOverlays!.origins || strikeOverlays!.strikeHistory);
    if (showArcs) {
      globe
        .arcsData(strikes)
        .arcStartLat('originLat')
        .arcStartLng('originLng')
        .arcEndLat('impactLat')
        .arcEndLng('impactLng')
        .arcAltitude(0.08)
        .arcStroke((d: object) =>
          (d as StrikeEvent).id === selectedStrikeId ? 1.3 : 0.6,
        )
        .arcColor((d: object) =>
          (d as StrikeEvent).id === selectedStrikeId
            ? ['#f5d76e', '#fff4c2']
            : ['rgba(0,188,212,0.7)', 'rgba(255,87,34,0.85)'],
        )
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2500);
    } else {
      globe.arcsData([]);
    }

    // Hot-zone rings on impact points
    if (overlaysOn && strikeOverlays!.hotZones) {
      globe
        .ringsData(strikes)
        .ringLat('impactLat')
        .ringLng('impactLng')
        .ringAltitude(0.002)
        .ringColor(() => (t: number) => `rgba(255,60,40,${1 - t})`)
        .ringMaxRadius((d: object) => {
          const s = d as StrikeEvent;
          return 1.2 + s.intensity * 2.5;
        })
        .ringPropagationSpeed(1.2)
        .ringRepeatPeriod(1400);
    } else {
      globe.ringsData([]);
    }

    // Static engagement envelopes for the selected strike. Hot-zone rings stay on ringsData.
    const ringPaths = (munitionAssessment?.rings ?? []).map((ring) => ({
      id: ring.id,
      color: ring.color,
      points: circleRingPoints(ring.lat, ring.lng, ring.radiusKm),
      dashLength: ring.kind === 'observed' ? 0.012 : 0.04,
      dashGap: ring.kind === 'observed' ? 0.012 : 0.018,
      stroke: ring.strokeDegrees,
    }));
    globe
      .pathsData(ringPaths)
      .pathPoints('points')
      .pathPointLat('lat')
      .pathPointLng('lng')
      .pathPointAlt(0.005)
      .pathColor('color')
      .pathStroke((d: object) => (d as { stroke: number | null }).stroke)
      .pathDashLength((d: object) => (d as { dashLength: number }).dashLength)
      .pathDashGap((d: object) => (d as { dashGap: number }).dashGap)
      .pathDashAnimateTime(0)
      .pathTransitionDuration(0);

    const selectedStrike = strikes.find((s) => s.id === selectedStrikeId) ?? null;
    if (selectedStrike) {
      globe.pointOfView(
        {
          lat: (selectedStrike.originLat + selectedStrike.impactLat) / 2,
          lng: (selectedStrike.originLng + selectedStrike.impactLng) / 2,
          altitude: 0.45,
        },
        800,
      );
    } else if (selectedAoId) {
      const ao = aos.find((a) => a.id === selectedAoId);
      if (ao) {
        globe.pointOfView({ lat: ao.lat, lng: ao.lng, altitude: 1.6 }, 800);
      }
    }
  }, [
    aos,
    selectedAoId,
    visibleLayers,
    symbology,
    killSwitch,
    strikes,
    strikeOverlays,
    showStrikeOverlays,
    selectedStrikeId,
    munitionAssessment,
  ]);

  return <div className="map-surface" ref={containerRef} data-export-root />;
}
