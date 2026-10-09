import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';
import {
  aircraftLines,
  aircraftSvg,
  bboxFromAltitude,
  escapeHtml,
  shipLines,
  shipSvg,
  type LiveAircraft,
  type LiveFlyRequest,
  type LiveShip,
  type MapView,
} from '../data/liveFeeds';
import { circleRingPoints } from '../data/munitionInference';
import type { ResolvedEngagementLine } from '../data/scenarios';
import { LiveMapBanner } from './LiveMapChrome';
import type {
  AO,
  ForceSide,
  SocialMapHint,
  StrikeEvent,
  StrikeMunitionAssessment,
  StrikeOverlayToggles,
  StrikeRangeRing,
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
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
  unitRangeRings?: StrikeRangeRing[];
  selectionFocus?: 'strike' | 'unit' | 'social' | null;
  socialMapHints?: SocialMapHint[];
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
}

type Point = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: 'ao' | 'threat' | 'strike-impact' | 'strike-origin' | 'social' | 'live';
  aoId?: string;
  strikeId?: string;
  symbolKind?: string;
  color: string;
  unitId?: string;
  side?: ForceSide;
  liveKind?: 'aircraft' | 'ship';
  heading?: number | null;
  detail?: string;
};

function milStroke(kind?: string, side?: ForceSide): string {
  if (side === 'friendly') return '#5eb1ff';
  if (side === 'adversary') return '#ff5a5a';
  if (kind === 'arty') return '#f5a623';
  if (kind === 'uav') return '#6ec6ff';
  return '#7CFC9A';
}

function milSvg(kind?: string, side?: ForceSide): string {
  const stroke = milStroke(kind, side);
  if (kind === 'infantry') {
    return `<svg width="26" height="26" viewBox="0 0 40 40"><polygon points="20,2 38,20 20,38 2,20" fill="rgba(20,40,30,0.85)" stroke="${stroke}" stroke-width="2"/><circle cx="20" cy="14" r="3.2" fill="none" stroke="${stroke}"/><path d="M20 17.5 V26 M13 21 H27 M15 32 L20 26 L25 32" fill="none" stroke="${stroke}" stroke-width="1.6"/></svg>`;
  }
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

function socialHintSvg(): string {
  return `<svg width="22" height="22" viewBox="0 0 40 40"><polygon points="20,3 37,20 20,37 3,20" fill="rgba(40,28,8,0.9)" stroke="#ffb703" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="#ffb703"/></svg>`;
}

function liveDetailHtml(lines: string[]): string {
  return lines.map((line) => `<div>${escapeHtml(line)}</div>`).join('');
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
  selectedUnitId = null,
  onSelectUnit,
  unitRangeRings = [],
  selectionFocus = null,
  socialMapHints = [],
  engagementLines = [],
  liveAircraft = [],
  liveShips = [],
  liveFly = null,
  onViewBbox,
  liveAircraftOn = false,
  liveShipsOn = false,
  aircraftOffline = false,
  shipsOffline = false,
  aircraftAttribution = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ReturnType<typeof Globe> | null>(null);
  const povKeyRef = useRef('');
  const onSelectRef = useRef(onSelectAo);
  const onSelectStrikeRef = useRef(onSelectStrike);
  const onSelectUnitRef = useRef(onSelectUnit);
  onSelectRef.current = onSelectAo;
  onSelectStrikeRef.current = onSelectStrike;
  onSelectUnitRef.current = onSelectUnit;

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
    const globe = globeRef.current as {
      pointOfView: () => { lat: number; lng: number; altitude?: number };
      controls: () => {
        addEventListener: (name: string, fn: () => void) => void;
        removeEventListener: (name: string, fn: () => void) => void;
      };
    } | null;
    if (!globe || !onViewBbox) return;
    const emit = () => {
      const pov = globe.pointOfView();
      onViewBbox(bboxFromAltitude(pov.lat, pov.lng, pov.altitude ?? 1.5));
    };
    emit();
    const controls = globe.controls();
    controls.addEventListener('end', emit);
    const timer = window.setTimeout(emit, 1000);
    return () => {
      controls.removeEventListener('end', emit);
      window.clearTimeout(timer);
    };
  }, [onViewBbox, liveFly]);

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
      for (const hint of socialMapHints) {
        points.push({
          id: hint.id,
          lat: hint.lat,
          lng: hint.lon,
          label: `${hint.name} — ${hint.headline}`,
          kind: 'social',
          color: '#ffb703',
        });
      }
      for (const layer of visibleLayers) {
        for (const m of layer.markers) {
          points.push({
            id: m.id,
            lat: m.lat,
            lng: m.lng,
            label: m.orbat?.designation ?? m.label,
            kind: 'threat',
            symbolKind:
              symbology === 'military' ? m.milSymbol : m.commercialSymbol,
            color:
              symbology === 'military'
                ? m.side === 'friendly'
                  ? '#5eb1ff'
                  : m.side === 'adversary'
                    ? '#ff5a5a'
                    : '#7CFC9A'
                : '#1e90ff',
            unitId: m.orbat ? m.id : undefined,
            side: symbology === 'military' ? m.side : undefined,
          });
        }
      }
      for (const track of liveAircraft) {
        points.push({
          id: `ac-${track.icao}`,
          lat: track.lat,
          lng: track.lon,
          label: track.callsign ?? track.icao.toUpperCase(),
          kind: 'live',
          liveKind: 'aircraft',
          heading: track.heading,
          detail: liveDetailHtml(aircraftLines(track)),
          color: '#7ec8ff',
        });
      }
      for (const track of liveShips) {
        points.push({
          id: `sh-${track.mmsi}`,
          lat: track.lat,
          lng: track.lon,
          label: track.name ?? String(track.mmsi),
          kind: 'live',
          liveKind: 'ship',
          heading: track.heading,
          detail: liveDetailHtml(shipLines(track)),
          color: '#3dd6a5',
        });
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
        const unitSelected = !!p.unitId && p.unitId === selectedUnitId;
        el.className = `globe-marker ${p.kind}${strikeSelected || unitSelected || p.kind === 'social' ? ' selected' : ''}`;
        el.title = p.label;
        el.style.cursor =
          p.kind === 'ao' ||
          p.kind === 'strike-impact' ||
          p.kind === 'strike-origin' ||
          p.kind === 'live' ||
          !!p.unitId
            ? 'pointer'
            : 'default';
        el.style.pointerEvents = 'auto';
        if (p.strikeId) el.dataset.strikeId = p.strikeId;
        if (p.side) el.dataset.side = p.side;
        el.dataset.pinId = p.id;
        el.onclick = (e) => {
          e.stopPropagation();
          if (p.kind === 'ao' && p.aoId) onSelectRef.current(p.aoId);
          if (
            (p.kind === 'strike-impact' || p.kind === 'strike-origin') &&
            p.strikeId
          ) {
            onSelectStrikeRef.current?.(p.strikeId);
          }
          if (p.kind === 'threat' && p.unitId) {
            onSelectUnitRef.current?.(p.unitId);
          }
        };

        if (p.kind === 'ao') {
          el.innerHTML = `<div class="ao-pin" style="--c:${p.color}"><span>${p.label}</span></div>`;
        } else if (p.kind === 'strike-impact') {
          el.innerHTML = `<div class="strike-pin threat-pin-inner">${strikeImpactSvg()}</div>`;
        } else if (p.kind === 'strike-origin') {
          el.innerHTML = `<div class="strike-origin threat-pin-inner">${strikeOriginSvg()}</div>`;
        } else if (p.kind === 'social') {
          el.innerHTML = `<div class="social-pin threat-pin-inner">${socialHintSvg()}</div>`;
        } else if (p.kind === 'live') {
          const svg = p.liveKind === 'ship' ? shipSvg() : aircraftSvg();
          const rot = p.heading == null ? 0 : Math.round(p.heading);
          el.title = '';
          el.innerHTML = `<div class="live-rot" style="transform:rotate(${rot}deg)">${svg}</div><div class="live-card">${p.detail ?? ''}</div>`;
          el.onclick = (e) => {
            e.stopPropagation();
            el.classList.toggle('live-open');
          };
        } else {
          const svg =
            symbology === 'military'
              ? milSvg(p.symbolKind, p.side)
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

    // Static engagement envelopes for the selected strike and any linked unit profile.
    // Hot-zone rings stay on ringsData.
    const envelopeRings = [...(munitionAssessment?.rings ?? []), ...unitRangeRings];
    const ringPaths = envelopeRings.map((ring) => ({
      id: ring.id,
      color: ring.color,
      points: circleRingPoints(ring.lat, ring.lng, ring.radiusKm),
      dashLength:
        ring.kind === 'observed' ? 0.012 : ring.band === 'min' ? 0.014 : 0.04,
      dashGap: ring.kind === 'observed' ? 0.012 : ring.band === 'min' ? 0.02 : 0.018,
      stroke: ring.strokeDegrees,
    }));
    const engagementPaths = engagementLines.map((line) => ({
      id: line.id,
      color: line.color,
      points: [
        { lat: line.fromLat, lng: line.fromLng },
        { lat: line.toLat, lng: line.toLng },
      ],
      dashLength: 0.35,
      dashGap: 0.12,
      stroke: 0.12,
    }));
    const socialCorridor =
      !killSwitch && socialMapHints.length >= 2
        ? [
            {
              id: 'social-corridor',
              color: '#ffb703',
              points: socialMapHints.map((hint) => ({ lat: hint.lat, lng: hint.lon })),
              dashLength: 0.08,
              dashGap: 0.05,
              stroke: 0.07,
            },
          ]
        : [];
    globe
      .pathsData([...ringPaths, ...socialCorridor, ...engagementPaths])
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
    const selectedUnitPoint = points.find((p) => p.unitId && p.unitId === selectedUnitId);
    const unitRingKm = unitRangeRings.reduce((max, ring) => Math.max(max, ring.radiusKm), 0);
    const povKey = [
      selectedAoId ?? '',
      selectionFocus ?? '',
      selectedStrikeId ?? '',
      selectedUnitId ?? '',
      liveFly?.seq ?? 0,
      killSwitch ? 'kill' : '',
      socialMapHints.map((hint) => hint.id).join(','),
    ].join('|');
    if (povKey === povKeyRef.current) {
      /* Camera stays put while live tracks refresh. */
    } else if (selectionFocus === 'strike' && selectedStrike) {
      povKeyRef.current = povKey;
      globe.pointOfView(
        {
          lat: (selectedStrike.originLat + selectedStrike.impactLat) / 2,
          lng: (selectedStrike.originLng + selectedStrike.impactLng) / 2,
          altitude: 0.45,
        },
        800,
      );
    } else if (selectionFocus === 'unit' && selectedUnitPoint) {
      povKeyRef.current = povKey;
      const altitude =
        unitRingKm > 0 ? Math.min(2.15, 0.32 + unitRingKm / 420) : 0.55;
      globe.pointOfView(
        { lat: selectedUnitPoint.lat, lng: selectedUnitPoint.lng, altitude },
        800,
      );
    } else if (!killSwitch && selectionFocus === 'social' && socialMapHints.length > 0) {
      povKeyRef.current = povKey;
      const lat =
        socialMapHints.reduce((sum, hint) => sum + hint.lat, 0) / socialMapHints.length;
      const lng =
        socialMapHints.reduce((sum, hint) => sum + hint.lon, 0) / socialMapHints.length;
      globe.pointOfView(
        { lat, lng, altitude: socialMapHints.length > 1 ? 0.7 : 0.55 },
        800,
      );
    } else if (liveFly) {
      povKeyRef.current = povKey;
      globe.pointOfView(
        { lat: liveFly.lat, lng: liveFly.lng, altitude: liveFly.altitude },
        800,
      );
    } else if (selectedAoId) {
      povKeyRef.current = povKey;
      const ao = aos.find((a) => a.id === selectedAoId);
      if (ao) {
        globe.pointOfView({ lat: ao.lat, lng: ao.lng, altitude: 1.6 }, 800);
      }
    } else {
      povKeyRef.current = povKey;
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
    selectedUnitId,
    munitionAssessment,
    unitRangeRings,
    selectionFocus,
    socialMapHints,
    engagementLines,
    liveAircraft,
    liveShips,
    liveFly,
  ]);

  return (
    <div className="map-surface" data-export-root>
      <div className="map-surface-canvas" ref={containerRef} />
      {(liveAircraftOn || liveShipsOn) && (
        <LiveMapBanner
          aircraftOn={liveAircraftOn}
          shipsOn={liveShipsOn}
          aircraftOffline={aircraftOffline}
          shipsOffline={shipsOffline}
          aircraftAttribution={aircraftAttribution}
        />
      )}
    </div>
  );
}
