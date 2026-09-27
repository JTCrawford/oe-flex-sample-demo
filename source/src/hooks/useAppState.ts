import { useCallback, useMemo, useState } from 'react';
import { aos, threatLayersByAo } from '../data/aos';
import { inferMunitions } from '../data/munitionInference';
import { strikesByAo } from '../data/strikes';
import { vignetteForAo } from '../data/vignettes';
import type {
  MapMode,
  MitigationOption,
  Role,
  Stage,
  SymbologyMode,
  WargameOutcome,
  PmesiiChip,
  StrikeOverlayToggles,
  ThreatMarker,
  UnitOrbat,
} from '../types';

const ALL_PMESII: PmesiiChip[] = [
  'Political',
  'Military',
  'Economic',
  'Social',
  'Information',
  'Infrastructure',
  'Physical',
  'Time',
];

const DEFAULT_STRIKE_OVERLAYS: StrikeOverlayToggles = {
  currentPositions: true,
  strikeHistory: true,
  origins: true,
  hotZones: true,
};

export function useAppState() {
  const [role, setRole] = useState<Role | null>(null);
  const [stage, setStage] = useState<Stage>('Observe');
  const [mapMode, setMapMode] = useState<MapMode>('globe');
  const [selectedAoId, setSelectedAoId] = useState<string | null>(null);
  const [symbology, setSymbology] = useState<SymbologyMode>('military');
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(new Set());
  const [pmesiiFilters, setPmesiiFilters] = useState<Set<PmesiiChip>>(
    () => new Set(ALL_PMESII),
  );
  const [killSwitch, setKillSwitch] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [selectedMitigationId, setSelectedMitigationId] = useState<string | null>(
    null,
  );
  const [wargameOutcome, setWargameOutcome] = useState<WargameOutcome | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [committedResources, setCommittedResources] = useState<string[]>([]);
  const [strikeOverlays, setStrikeOverlays] =
    useState<StrikeOverlayToggles>(DEFAULT_STRIKE_OVERLAYS);
  const [selectedStrikeId, setSelectedStrikeId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const selectedAo = useMemo(
    () => aos.find((a) => a.id === selectedAoId) ?? null,
    [selectedAoId],
  );

  const vignette = useMemo(
    () => (selectedAoId ? vignetteForAo(selectedAoId) : undefined),
    [selectedAoId],
  );

  const isCommercialPartner = role === 'Commercial Partner';

  const militaryFilterActive = pmesiiFilters.has('Military');

  const strikeOverlayAvailable =
    militaryFilterActive &&
    symbology === 'military' &&
    !killSwitch &&
    !!selectedAoId;

  const visibleStrikes = useMemo(() => {
    if (
      killSwitch ||
      !selectedAoId ||
      !militaryFilterActive ||
      symbology !== 'military'
    ) {
      return [];
    }
    return strikesByAo[selectedAoId] ?? [];
  }, [killSwitch, selectedAoId, militaryFilterActive, symbology]);

  const selectedStrike = useMemo(() => {
    if (!selectedStrikeId || !strikeOverlayAvailable) return null;
    return visibleStrikes.find((s) => s.id === selectedStrikeId) ?? null;
  }, [selectedStrikeId, strikeOverlayAvailable, visibleStrikes]);

  const munitionAssessment = useMemo(
    () => (selectedStrike ? inferMunitions(selectedStrike, visibleStrikes) : null),
    [selectedStrike, visibleStrikes],
  );

  const hideCurrentUnitMarkers =
    militaryFilterActive &&
    symbology === 'military' &&
    !strikeOverlays.currentPositions;

  const visibleLayers = useMemo(() => {
    if (!selectedAoId || killSwitch) return [];
    if (hideCurrentUnitMarkers) return [];
    const layers = threatLayersByAo[selectedAoId] ?? [];
    return layers.filter((layer) => {
      if (isCommercialPartner && layer.isFeeder) return false;
      if (!enabledLayers.has(layer.id)) return false;
      const matchesPmesii = layer.pmesii.some((p) => pmesiiFilters.has(p));
      return matchesPmesii;
    });
  }, [
    selectedAoId,
    killSwitch,
    enabledLayers,
    pmesiiFilters,
    isCommercialPartner,
    hideCurrentUnitMarkers,
  ]);

  const selectedUnit = useMemo(() => {
    if (!selectedUnitId || killSwitch) return null;
    for (const layer of visibleLayers) {
      for (const marker of layer.markers) {
        if (marker.id === selectedUnitId && marker.orbat) {
          return marker as ThreatMarker & { orbat: UnitOrbat };
        }
      }
    }
    return null;
  }, [selectedUnitId, visibleLayers, killSwitch]);

  const selectAo = useCallback(
    (aoId: string) => {
      setSelectedAoId(aoId);
      setSelectedStrikeId(null);
      setSelectedUnitId(null);
      setWargameOutcome(null);
      setSelectedMitigationId(null);
      const layers = threatLayersByAo[aoId] ?? [];
      const defaults = new Set(
        layers
          .filter((l) => !(isCommercialPartner && l.isFeeder))
          .map((l) => l.id),
      );
      setEnabledLayers(defaults);
      setStage('Observe');
    },
    [isCommercialPartner],
  );

  const toggleLayer = useCallback((layerId: string) => {
    setEnabledLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }, []);

  const togglePmesii = useCallback((chip: PmesiiChip) => {
    setPmesiiFilters((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  }, []);

  const toggleStrikeOverlay = useCallback((key: keyof StrikeOverlayToggles) => {
    setStrikeOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const selectStrike = useCallback((id: string) => {
    setSelectedStrikeId(id);
  }, []);

  const clearStrike = useCallback(() => {
    setSelectedStrikeId(null);
  }, []);

  const selectUnit = useCallback((id: string) => {
    setSelectedUnitId(id);
  }, []);

  const toggleUnit = useCallback((id: string) => {
    setSelectedUnitId((prev) => (prev === id ? null : id));
  }, []);

  const clearUnit = useCallback(() => {
    setSelectedUnitId(null);
  }, []);

  const setSymbologyMutex = useCallback((mode: SymbologyMode) => {
    setSymbology(mode);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const runWargame = useCallback(
    (mitigation: MitigationOption) => {
      // Simple probabilistic red model (demo only)
      const redPressure = 0.15 + Math.random() * 0.25;
      const jitter = (Math.random() - 0.5) * 0.12;
      const successProb = Math.max(
        0.05,
        Math.min(0.95, mitigation.baseSuccess - redPressure + jitter),
      );
      const roll = Math.random();
      const success = roll < successProb;
      const outcome: WargameOutcome = {
        mitigationId: mitigation.id,
        successProb,
        redResponse: success
          ? 'Red adapts slowly; window holds for 6–12h (SAMPLE).'
          : 'Red doubles down on alternate axis; mitigation partially bypassed (SAMPLE).',
        residualRisk: success
          ? 'Elevated but manageable residual risk on flank.'
          : 'High residual risk — re-plan Decide commitments.',
        narrative: success
          ? `COA "${mitigation.label}" likely holds under SAMPLE red pressure (p≈${(successProb * 100).toFixed(0)}%).`
          : `COA "${mitigation.label}" stressed; consider alternate mitigation or partner ISR (p≈${(successProb * 100).toFixed(0)}%).`,
      };
      setSelectedMitigationId(mitigation.id);
      setWargameOutcome(outcome);
      showToast(success ? 'Wargame: COA holds (SAMPLE)' : 'Wargame: COA stressed (SAMPLE)');
    },
    [showToast],
  );

  const commitResource = useCallback(
    (label: string) => {
      setCommittedResources((prev) =>
        prev.includes(label) ? prev : [...prev, label],
      );
      showToast(`Committed: ${label} (stub)`);
    },
    [showToast],
  );

  const availableLayers = useMemo(() => {
    if (!selectedAoId) return [];
    const layers = threatLayersByAo[selectedAoId] ?? [];
    if (isCommercialPartner) return layers.filter((l) => !l.isFeeder);
    return layers;
  }, [selectedAoId, isCommercialPartner]);

  return {
    role,
    setRole,
    stage,
    setStage,
    mapMode,
    setMapMode,
    selectedAoId,
    selectedAo,
    selectAo,
    symbology,
    setSymbologyMutex,
    enabledLayers,
    toggleLayer,
    availableLayers,
    visibleLayers,
    pmesiiFilters,
    togglePmesii,
    allPmesii: ALL_PMESII,
    killSwitch,
    setKillSwitch,
    whiteLabel,
    setWhiteLabel,
    vignette,
    selectedMitigationId,
    setSelectedMitigationId,
    wargameOutcome,
    runWargame,
    toast,
    showToast,
    committedResources,
    commitResource,
    isCommercialPartner,
    aos,
    strikeOverlays,
    toggleStrikeOverlay,
    militaryFilterActive,
    visibleStrikes,
    strikeOverlayAvailable,
    selectedStrikeId,
    selectedStrike,
    selectStrike,
    clearStrike,
    munitionAssessment,
    selectedUnitId,
    selectedUnit,
    selectUnit,
    toggleUnit,
    clearUnit,
  };
}

export type AppState = ReturnType<typeof useAppState>;
