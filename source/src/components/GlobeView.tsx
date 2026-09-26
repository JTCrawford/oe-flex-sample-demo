import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';
import type { AO, SymbologyMode, ThreatLayer } from '../types';

interface Props {
  aos: AO[];
  selectedAoId: string | null;
  onSelectAo: (id: string) => void;
  visibleLayers: ThreatLayer[];
  symbology: SymbologyMode;
  killSwitch: boolean;
}

type Point = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: 'ao' | 'threat';
  aoId?: string;
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

export function GlobeView({
  aos,
  selectedAoId,
  onSelectAo,
  visibleLayers,
  symbology,
  killSwitch,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ReturnType<typeof Globe> | null>(null);
  const onSelectRef = useRef(onSelectAo);
  onSelectRef.current = onSelectAo;

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

    const onResize = () => {
      if (!containerRef.current) return;
      globe.width(containerRef.current.clientWidth);
      globe.height(containerRef.current.clientHeight);
    };
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (containerRef.current) containerRef.current.innerHTML = '';
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
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

    globe
      .htmlElementsData(points)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.01)
      .htmlElement((d) => {
        const p = d as unknown as Point;
        const el = document.createElement('div');
        el.className = `globe-marker ${p.kind}`;
        el.title = p.label;
        el.style.cursor = p.kind === 'ao' ? 'pointer' : 'default';
        el.style.pointerEvents = 'auto';
        el.onclick = (e) => {
          e.stopPropagation();
          if (p.kind === 'ao' && p.aoId) onSelectRef.current(p.aoId);
        };

        if (p.kind === 'ao') {
          el.innerHTML = `<div class="ao-pin" style="--c:${p.color}"><span>${p.label}</span></div>`;
        } else {
          const svg =
            symbology === 'military'
              ? milSvg(p.symbolKind)
              : commercialSvg(p.symbolKind);
          el.innerHTML = `<div class="threat-pin-inner">${svg}</div>`;
        }
        return el;
      });

    if (selectedAoId) {
      const ao = aos.find((a) => a.id === selectedAoId);
      if (ao) {
        globe.pointOfView({ lat: ao.lat, lng: ao.lng, altitude: 1.6 }, 800);
      }
    }
  }, [aos, selectedAoId, visibleLayers, symbology, killSwitch]);

  return <div className="map-surface" ref={containerRef} data-export-root />;
}
