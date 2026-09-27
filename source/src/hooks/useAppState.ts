import { useCallback, useMemo, useState } from 'react';
import { aos, threatLayersByAo } from '../data/aos';
import type { SphereTarget } from '../data/engagementSphere';
import { profilesForOrbat, rangeRingsForProfiles } from '../data/munitionCatalog';
import { inferMunitions } from '../data/munitionInference';
import {
  resolveEngagementLines,
  scenarioById,
  scenarioIdForAo,
  type ScenarioId,
} from '../data/scenarios';
import { locatedGeoHints, presentSignalsForAo } from '../data/socialSignals';
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
  const [scenarioId, setScenarioId] = useState<ScenarioId>('ukraine-russia');
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
  const [selectionFocus, setSelectionFocus] = useState<
    'strike' | 'unit' | 'social' | null
  >(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [sphereTarget, setSphereTarget] = useState<SphereTarget | null>(null);
  const [socialFeedOn, setSocialFeedOn] = useState(true);
  const [selectedSocialId, setSelectedSocialId] = useState<string | null>(null);

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

  /** Same Observe gates as strike history: AO, Military PMESII, military symbology, kill-switch. */
  const socialFeedAvailable = strikeOverlayAvailable;

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

  const visibleSocialSignals = useMemo(() => {
    if (!socialFeedAvailable || !socialFeedOn || !selectedAoId) return [];
    return presentSignalsForAo(selectedAoId);
  }, [socialFeedAvailable, socialFeedOn, selectedAoId]);

  const selectedSocial = useMemo(() => {
    if (!selectedSocialId) return null;
    return visibleSocialSignals.find((signal) => signal.id === selectedSocialId) ?? null;
  }, [selectedSocialId, visibleSocialSignals]);

  const socialMapHints = useMemo(
    () => locatedGeoHints(selectedSocial),
    [selectedSocial],
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

  const sphereStale =
    !!sphereTarget &&
    (killSwitch ||
      (sphereTarget.unitId !== null && selectedUnit?.id !== sphereTarget.unitId));
  if (sphereStale) setSphereTarget(null);

  const activeSphere = sphereStale ? null : sphereTarget;

  const linkedMunitionProfiles = useMemo(
    () => (selectedUnit ? profilesForOrbat(selectedUnit.orbat) : []),
    [selectedUnit],
  );

  const unitRangeRings = useMemo(() => {
    if (!selectedUnit || linkedMunitionProfiles.length === 0) return [];
    if (killSwitch || !militaryFilterActive || symbology !== 'military') return [];
    return rangeRingsForProfiles(
      linkedMunitionProfiles,
      selectedUnit.lat,
      selectedUnit.lng,
      `unit-${selectedUnit.id}`,
    );
  }, [
    selectedUnit,
    linkedMunitionProfiles,
    killSwitch,
    militaryFilterActive,
    symbology,
  ]);

  const selectAo = useCallback(
    (aoId: string, commercial?: boolean) => {
      setSelectedAoId(aoId);
      const mapped = scenarioIdForAo(aoId);
      if (mapped) setScenarioId(mapped);
      setSelectedStrikeId(null);
      setSelectedUnitId(null);
      setSphereTarget(null);
      setSelectionFocus(null);
      setSelectedSocialId(null);
      setWargameOutcome(null);
      setSelectedMitigationId(null);
      const hideFeeder = commercial ?? isCommercialPartner;
      const layers = threatLayersByAo[aoId] ?? [];
      const defaults = new Set(
        layers.filter((l) => !(hideFeeder && l.isFeeder)).map((l) => l.id),
      );
      setEnabledLayers(defaults);
      setStage('Observe');
    },
    [isCommercialPartner],
  );

  const selectScenario = useCallback(
    (id: ScenarioId, commercial?: boolean) => {
      setScenarioId(id);
      selectAo(scenarioById(id).aoId, commercial);
    },
    [selectAo],
  );

  const engagementLines = useMemo(() => {
    if (
      killSwitch ||
      !selectedAoId ||
      !militaryFilterActive ||
      symbology !== 'military'
    ) {
      return [];
    }
    if (scenarioById(scenarioId).aoId !== selectedAoId) return [];
    return resolveEngagementLines(scenarioId, visibleLayers);
  }, [
    killSwitch,
    selectedAoId,
    militaryFilterActive,
    symbology,
    scenarioId,
    visibleLayers,
  ]);

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
    setSelectionFocus('strike');
  }, []);

  const clearStrike = useCallback(() => {
    setSelectedStrikeId(null);
    setSelectionFocus((prev) => (prev === 'strike' ? null : prev));
  }, []);

  const selectUnit = useCallback((id: string) => {
    setSelectedUnitId(id);
    setSelectionFocus('unit');
  }, []);

  const toggleUnit = useCallback(
    (id: string) => {
      if (selectedUnitId === id) {
        setSelectedUnitId(null);
        setSelectionFocus((focus) => (focus === 'unit' ? null : focus));
        return;
      }
      setSelectedUnitId(id);
      setSelectionFocus('unit');
    },
    [selectedUnitId],
  );

  const clearUnit = useCallback(() => {
    setSelectedUnitId(null);
    setSelectionFocus((prev) => (prev === 'unit' ? null : prev));
  }, []);

  const openSphere = useCallback((target: SphereTarget) => {
    setSphereTarget(target);
  }, []);

  const closeSphere = useCallback(() => {
    setSphereTarget(null);
  }, []);

  const toggleSocialFeed = useCallback(() => {
    setSocialFeedOn((prev) => !prev);
  }, []);

  const selectSocial = useCallback((id: string) => {
    setSelectedSocialId(id);
    setSelectionFocus('social');
  }, []);

  const clearSocial = useCallback(() => {
    setSelectedSocialId(null);
    setSelectionFocus((prev) => (prev === 'social' ? null : prev));
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
    scenarioId,
    selectScenario,
    engagementLines,
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
    selectionFocus,
    selectStrike,
    clearStrike,
    munitionAssessment,
    selectedUnitId,
    selectedUnit,
    linkedMunitionProfiles,
    unitRangeRings,
    selectUnit,
    toggleUnit,
    clearUnit,
    activeSphere,
    openSphere,
    closeSphere,
    socialFeedAvailable,
    socialFeedOn,
    toggleSocialFeed,
    visibleSocialSignals,
    selectedSocialId,
    selectedSocial,
    selectSocial,
    clearSocial,
    socialMapHints,
  };
}

export type AppState = ReturnType<typeof useAppState>;
