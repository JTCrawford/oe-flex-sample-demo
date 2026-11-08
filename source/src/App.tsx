import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { sphereModelById, sphereModelForHolding } from './data/engagementSphere';
import { SCENARIOS, scenarioById } from './data/scenarios';
import { useAppState } from './hooks/useAppState';
import { useLiveFeeds } from './hooks/useLiveFeeds';
import { RoleSelector } from './components/RoleSelector';
const CesiumMap = lazy(() => import('./components/CesiumMap'));
import { MunitionInferencePanel } from './components/MunitionInferencePanel';
import { OrbatPanel } from './components/OrbatPanel';
import { SocialSignalPanel } from './components/SocialSignalPanel';
import { ObservePanel } from './components/ObservePanel';
import { MitigatePanel } from './components/MitigatePanel';
import { WargamePanel } from './components/WargamePanel';
import { DecidePanel } from './components/DecidePanel';
import { ExportBar } from './components/ExportBar';
import { DomainPipelinePanel } from './components/DomainPipelinePanel';
import { AboutPanel } from './components/AboutPanel';
import { TtpFeedsPanel } from './components/TtpFeedsPanel';
import { Toast } from './components/Toast';
import { SalesCallout } from './components/SalesCallout';
import { FloatCard, OverlayDockProvider, OverlayHideToggle, useOverlayDock } from './components/OverlayDock';
import type { MunitionProfile, Stage, VehicleHolding } from './types';
import './App.css';

const EngagementSphere = lazy(() => import('./components/EngagementSphere'));

const STAGES: Stage[] = ['Observe', 'Mitigate', 'Wargame', 'Decide'];

function openHoldingSphere(
  state: ReturnType<typeof useAppState>,
  unitId: string,
  holding: VehicleHolding,
) {
  const model = sphereModelForHolding(holding);
  if (!model) return;
  state.selectUnit(unitId);
  state.openSphere({
    unitId,
    modelId: model.id,
    label: holding.typeDesignation,
  });
}

function openMunitionSphere(
  state: ReturnType<typeof useAppState>,
  unitId: string | null,
  profile: MunitionProfile,
) {
  const model = sphereModelById(profile.engagementSphereModelId);
  if (!model) return;
  if (unitId) state.selectUnit(unitId);
  state.openSphere({
    unitId,
    modelId: model.id,
    label: profile.designation,
  });
}

export default function App() {
  return (
    <OverlayDockProvider>
      <AppShell />
    </OverlayDockProvider>
  );
}

function AppShell() {
  const state = useAppState();
  const dock = useOverlayDock();
  const live = useLiveFeeds({
    aircraftOn: state.liveAircraftOn,
    shipsOn: state.liveShipsOn,
    killSwitch: state.killSwitch,
    view: state.viewBbox,
  });
  const liveMap = {
    liveAircraft: live.aircraft,
    liveShips: live.ships,
    liveFly: state.liveFly,
    onViewBbox: state.reportViewBbox,
    liveAircraftOn: state.liveAircraftOn && !state.killSwitch,
    liveShipsOn: state.liveShipsOn && !state.killSwitch,
    aircraftOffline: live.aircraftStatus === 'offline',
    shipsOffline: live.shipsStatus === 'offline',
    aircraftAttribution: live.aircraftAttribution,
  };
  const exportRef = useRef<HTMLElement | null>(null);
  const [showDomains, setShowDomains] = useState(false);
  const [showTtpFeeds, setShowTtpFeeds] = useState(() =>
    typeof window !== 'undefined' && window.location.hash === '#ttp',
  );
  const [pulseKey, setPulseKey] = useState<string | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const onAnchor = useCallback((point: { x: number; y: number } | null) => {
    setAnchorPoint((previous) => {
      if (!point && !previous) return previous;
      if (
        point &&
        previous &&
        Math.abs(point.x - previous.x) < 1.5 &&
        Math.abs(point.y - previous.y) < 1.5
      ) {
        return previous;
      }
      return point;
    });
  }, []);

  const sphereModel = state.activeSphere
    ? sphereModelById(state.activeSphere.modelId)
    : null;

  const highlightKey =
    state.selectionFocus === 'unit' && state.selectedUnitId
      ? `unit:${state.selectedUnitId}`
      : state.selectionFocus === 'strike' && state.selectedStrikeId
        ? `strike:${state.selectedStrikeId}`
        : state.selectionFocus === 'social' && state.selectedSocialId
          ? `social:${state.selectedSocialId}`
          : null;
  const strikeFocus = state.selectedStrike
    ? {
        id: state.selectedStrike.id,
        lat: state.selectedStrike.impactLat,
        lng: state.selectedStrike.impactLng,
      }
    : null;
  const socialHint = state.selectedSocial?.geoHints.find(
    (hint) => hint.lat != null && hint.lon != null,
  );
  const socialFocus =
    state.selectedSocial && socialHint?.lat != null && socialHint.lon != null
      ? { id: state.selectedSocial.id, lat: socialHint.lat, lng: socialHint.lon }
      : null;
  const anchor =
    state.selectionFocus === 'unit' && state.selectedUnit
      ? { lat: state.selectedUnit.lat, lng: state.selectedUnit.lng }
      : state.selectionFocus === 'strike' && strikeFocus
        ? { lat: strikeFocus.lat, lng: strikeFocus.lng }
        : state.selectionFocus === 'social' && socialFocus
          ? { lat: socialFocus.lat, lng: socialFocus.lng }
          : null;

  useEffect(() => {
    if (!highlightKey) return;
    dock.expand('stage');
    dock.expand('callout');
    const token = highlightKey;
    const timer = window.setTimeout(() => {
      document.querySelector(`[data-map-focus="${CSS.escape(token)}"]`)?.scrollIntoView({
        block: 'nearest',
      });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [highlightKey, dock.expand]);

  useEffect(() => {
    if (state.activeSphere) dock.expand('sphere');
  }, [state.activeSphere, dock.expand]);

  useEffect(() => {
    if (showTtpFeeds) dock.expand('ttp');
  }, [showTtpFeeds, dock.expand]);

  if (!state.role) {
    return (
      <>
        <RoleSelector
          onSelect={(role) => {
            state.setRole(role);
            if (role === 'Warfighter' || role === 'Analyst') {
              state.setSymbologyMutex('military');
            } else if (role === 'Commercial Partner') {
              state.setSymbologyMutex('commercial');
            }
            state.selectScenario(state.scenarioId, role === 'Commercial Partner');
          }}
        />
        {showTtpFeeds && (
        <TtpFeedsPanel
          onClose={() => setShowTtpFeeds(false)}
          onOpenMitigation={(aoId, stage) => {
            setShowTtpFeeds(false);
            state.selectAo(aoId);
            state.setStage(stage);
          }}
        />
      )}
      <Toast message={state.toast} />
      </>
    );
  }

  return (
    <div className={`app ${state.whiteLabel ? 'white-label' : ''}`}>
      <header className="topbar">
        <div className="brand">
          {state.whiteLabel ? (
            <span className="logo">OE Flex</span>
          ) : (
            <span className="logo">Threat Tec · OE Flex</span>
          )}
          <span className="badge">SCAFFOLD · SAMPLE</span>
        </div>
        <div className="role-pill">
          Role: <strong>{state.role}</strong>
          <button type="button" className="linkish" onClick={() => state.setRole(null)}>
            Switch
          </button>
        </div>
        <nav className="spine">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              className={state.stage === s ? 'active' : ''}
              onClick={() => state.setStage(s)}
            >
              {s}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button
            type="button"
            className={state.mapMode === 'globe' ? 'active' : ''}
            onClick={() => state.setMapMode('globe')}
          >
            Globe
          </button>
          <button
            type="button"
            className={state.mapMode === '2d' ? 'active' : ''}
            onClick={() => state.setMapMode('2d')}
          >
            2D map
          </button>
          <button
            type="button"
            className={`kill ${state.killSwitch ? 'on' : ''}`}
            onClick={() => {
              state.setKillSwitch(!state.killSwitch);
              state.showToast(
                state.killSwitch
                  ? 'Kill-switch OFF — layers restored'
                  : 'Kill-switch ON — Observe layers blanked',
              );
            }}
            title="Blank live Observe layers"
          >
            Kill-switch
          </button>
          <button
            type="button"
            className={showTtpFeeds ? 'active' : ''}
            onClick={() => setShowTtpFeeds(true)}
          >
            TTP Feeds
          </button>
          <button type="button" onClick={() => setShowDomains((v) => !v)}>
            Domains
          </button>
          <OverlayHideToggle />
        </div>
      </header>

      <div className="workspace">
        <section
          className="map-col"
          ref={(node) => {
            exportRef.current = node;
          }}
        >
          <Suspense fallback={<div className="map-stage"><p className="map-boot">Loading map…</p></div>}>
            <CesiumMap
              aos={state.aos}
              selectedAoId={state.selectedAoId}
              onSelectAo={state.selectAo}
              visibleLayers={state.visibleLayers}
              symbology={state.symbology}
              killSwitch={state.killSwitch}
              strikes={state.visibleStrikes}
              strikeOverlays={state.strikeOverlays}
              showStrikeOverlays={state.strikeOverlayAvailable}
              selectedStrikeId={state.selectedStrikeId}
              onSelectStrike={state.selectStrike}
              munitionAssessment={state.munitionAssessment}
              selectedUnitId={state.selectedUnitId}
              onSelectUnit={state.selectUnit}
              onOpenSphere={(unitId, holding) => openHoldingSphere(state, unitId, holding)}
              unitRangeRings={state.unitRangeRings}
              socialSignals={state.visibleSocialSignals}
              onSelectSocial={state.selectSocial}
              engagementLines={state.engagementLines}
              tilted={state.mapMode === 'globe'}
              onTilt={(tilted) => state.setMapMode(tilted ? 'globe' : '2d')}
              pulseKey={pulseKey}
              highlightKey={highlightKey}
              strikeFocus={strikeFocus}
              socialFocus={socialFocus}
              anchor={anchor}
              onAnchor={onAnchor}
              {...liveMap}
            />
          </Suspense>
          <FloatCard id="sales" title="Brief" edge="left" index={1}>
            <SalesCallout id="spine" />
            {state.killSwitch && <SalesCallout id="killSwitch" compact />}
          </FloatCard>
          <FloatCard id="scenario" title="Scenario" edge="left" index={2} testId="scenario-card">
            <div className="scenario-toggle" role="group" aria-label="Engagement scenario" data-testid="scenario-toggle">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  data-testid={`scenario-${scenario.id}`}
                  aria-pressed={state.scenarioId === scenario.id}
                  className={state.scenarioId === scenario.id ? 'active' : ''}
                  onClick={() => state.selectScenario(scenario.id)}
                >
                  <small>{scenario.kicker}</small>
                  {scenario.label}
                </button>
              ))}
            </div>
            <p className="scenario-summary" data-testid="scenario-summary">
              {state.selectedAoId === scenarioById(state.scenarioId).aoId
                ? scenarioById(state.scenarioId).summary
                : `${scenarioById(state.scenarioId).label} stays selected. The open area is outside that thread, so its engagement lines stay off.`}
              {state.symbology !== 'military' ? ' Engagement lines draw on the military picture.' : ''}
            </p>
            <div className="ao-quick">
              {state.aos.map((ao) => (
                <button
                  key={ao.id}
                  type="button"
                  className={state.selectedAoId === ao.id ? 'active' : ''}
                  data-map-focus={`ao:${ao.id}`}
                  onMouseEnter={() => setPulseKey(`ao:${ao.id}`)}
                  onMouseLeave={() => setPulseKey(null)}
                  onClick={() => state.selectAo(ao.id)}
                >
                  {ao.name}
                  <small>{ao.type}</small>
                </button>
              ))}
            </div>
          </FloatCard>
          <FloatCard id="legend" title="Legend" edge="left" index={3}>
            <p className="scenario-legend" data-testid="engagement-line-count">
              Blue friendly · Red adversary · {state.engagementLines.length} engagement lines
            </p>
            <ul className="scenario-line-list" data-testid="engagement-lines">
              {state.engagementLines.map((line) => (
                <li key={line.id} data-side={line.side}>
                  {line.label}
                </li>
              ))}
            </ul>
            <p className="scenario-legend" data-testid="phase1-assets">
              Phase 1 meshes are the CC0 sphere models already in this repo. The map drapes free Sentinel-2, NASA, USGS, and OpenTopoMap imagery on open elevation. A soldier file loads only when it is already on this machine. Premium packs are not in this build.
            </p>
          </FloatCard>
          <FloatCard id="export" title="Export" edge="right" index={2}>
            <ExportBar state={state} exportTargetRef={exportRef} />
          </FloatCard>
          <aside className="side-col">
            <FloatCard id="stage" title={state.stage} edge="right" index={0} testId="stage-card">
              {state.stage === 'Observe' && (
                <ObservePanel state={state} live={live} onPulse={setPulseKey} />
              )}
              {state.stage === 'Mitigate' && <MitigatePanel state={state} />}
              {state.stage === 'Wargame' && <WargamePanel state={state} />}
              {state.stage === 'Decide' && <DecidePanel state={state} />}
              {showDomains && <DomainPipelinePanel />}
            </FloatCard>
            <FloatCard id="about" title="About" edge="right" index={1}>
              <AboutPanel />
            </FloatCard>
          </aside>
          {anchor && anchorPoint && dock.isOpen('callout') && !dock.hidden && (
            <div
              className="feature-callout"
              data-testid="feature-callout"
              style={{ left: anchorPoint.x, top: anchorPoint.y }}
            >
              <button type="button" className="callout-min" aria-label="Collapse details" onClick={() => dock.collapse('callout')}>
                –
              </button>
              {state.selectionFocus === 'unit' && state.selectedUnit?.orbat && (
                <OrbatPanel
                  orbat={state.selectedUnit.orbat}
                  rangeRingsOn={state.unitRangeRings.length > 0}
                  onClear={state.clearUnit}
                  onOpenSphere={(holding) => {
                    const unitId = state.selectedUnit?.id;
                    if (!unitId) return;
                    openHoldingSphere(state, unitId, holding);
                  }}
                  onOpenMunitionSphere={(profile) => {
                    const unitId = state.selectedUnit?.id;
                    if (!unitId) return;
                    openMunitionSphere(state, unitId, profile);
                  }}
                />
              )}
              {state.selectionFocus === 'social' && state.selectedSocial && (
                <SocialSignalPanel signal={state.selectedSocial} onClear={state.clearSocial} />
              )}
              {state.selectionFocus === 'strike' && state.munitionAssessment && (
                <MunitionInferencePanel
                  assessment={state.munitionAssessment}
                  onClear={state.clearStrike}
                  onOpenSphere={(modelId, label) => {
                    const model = sphereModelById(modelId);
                    if (!model) return;
                    state.openSphere({ unitId: null, modelId: model.id, label });
                  }}
                />
              )}
            </div>
          )}
          {anchor && !dock.isOpen('callout') && !dock.hidden && (
            <button type="button" className="dock-tab edge-bottom" data-testid="dock-tab-callout" onClick={() => dock.expand('callout')}>
              Details
            </button>
          )}
        </section>
      </div>

      {showTtpFeeds && (
        <div className={dock.isOpen('ttp') && !dock.hidden ? undefined : 'dock-minimized'}>
          <TtpFeedsPanel
            onClose={() => setShowTtpFeeds(false)}
            onOpenMitigation={(aoId, stage) => {
              setShowTtpFeeds(false);
              state.selectAo(aoId);
              state.setStage(stage);
            }}
          />
          {dock.isOpen('ttp') && !dock.hidden && (
            <button type="button" className="float-min" aria-label="Collapse TTP feeds" onClick={() => dock.collapse('ttp')}>
              –
            </button>
          )}
        </div>
      )}
      {showTtpFeeds && (!dock.isOpen('ttp') || dock.hidden) && (
        <button type="button" className="dock-tab edge-right" data-testid="dock-tab-ttp" onClick={() => dock.expand('ttp')}>
          TTP
        </button>
      )}
      {sphereModel && state.activeSphere && (
        <div className={dock.isOpen('sphere') && !dock.hidden ? undefined : 'dock-minimized'}>
          <Suspense
            fallback={
              <div className="sphere-backdrop">
                <p className="sphere-status">Loading SAMPLE engagement sphere…</p>
              </div>
            }
          >
            <EngagementSphere
              key={`${state.activeSphere.unitId ?? 'catalog'}:${state.activeSphere.modelId}`}
              model={sphereModel}
              typeDesignation={state.activeSphere.label}
              unitDesignation={
                state.activeSphere.unitId && state.selectedUnit
                  ? state.selectedUnit.orbat.designation
                  : 'SAMPLE catalog'
              }
              aoId={state.selectedAoId}
              unitId={state.activeSphere.unitId}
              scenarioId={state.scenarioId}
              onClose={state.closeSphere}
            />
          </Suspense>
          {dock.isOpen('sphere') && !dock.hidden && (
            <button type="button" className="float-min" aria-label="Collapse engagement sphere" onClick={() => dock.collapse('sphere')}>
              –
            </button>
          )}
        </div>
      )}
      {sphereModel && state.activeSphere && (!dock.isOpen('sphere') || dock.hidden) && (
        <button type="button" className="dock-tab edge-bottom" data-testid="dock-tab-sphere" onClick={() => dock.expand('sphere')}>
          Sphere
        </button>
      )}
      <Toast message={state.toast} />
    </div>
  );
}
