import { lazy, Suspense, useRef, useState } from 'react';
import { sphereModelById, sphereModelForHolding } from './data/engagementSphere';
import { SCENARIOS, scenarioById } from './data/scenarios';
import { useAppState } from './hooks/useAppState';
import { RoleSelector } from './components/RoleSelector';
import { GlobeView } from './components/GlobeView';
import { Map2D } from './components/Map2D';
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
  const state = useAppState();
  const exportRef = useRef<HTMLElement | null>(null);
  const [showDomains, setShowDomains] = useState(false);
  const [showTtpFeeds, setShowTtpFeeds] = useState(() =>
    typeof window !== 'undefined' && window.location.hash === '#ttp',
  );

  const sphereModel = state.activeSphere
    ? sphereModelById(state.activeSphere.modelId)
    : null;

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
        </div>
      </header>

      <SalesCallout id="spine" />
      {state.killSwitch && <SalesCallout id="killSwitch" compact />}

      <div className="workspace">
        <section
          className="map-col"
          ref={(node) => {
            exportRef.current = node;
          }}
        >
          {state.mapMode === 'globe' ? (
            <GlobeView
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
              unitRangeRings={state.unitRangeRings}
              selectionFocus={state.selectionFocus}
              socialMapHints={state.socialMapHints}
              engagementLines={state.engagementLines}
            />
          ) : (
            <Map2D
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
              onOpenMunitionSphere={(unitId, profile) =>
                openMunitionSphere(state, unitId, profile)
              }
              unitRangeRings={state.unitRangeRings}
              selectionFocus={state.selectionFocus}
              socialMapHints={state.socialMapHints}
              engagementLines={state.engagementLines}
            />
          )}
          {state.selectedSocial && (
            <SocialSignalPanel
              signal={state.selectedSocial}
              onClear={state.clearSocial}
            />
          )}
          {state.selectedUnit?.orbat && (
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
          {state.munitionAssessment && (
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
          <div
            className="scenario-toggle"
            role="group"
            aria-label="Engagement scenario"
            data-testid="scenario-toggle"
          >
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
            {state.symbology !== 'military'
              ? ' Engagement lines draw on the military picture.'
              : ''}
          </p>
          <p className="scenario-legend" data-testid="engagement-line-count">
            Blue friendly · Red adversary · {state.engagementLines.length} engagement lines
          </p>
          <p className="scenario-legend" data-testid="phase1-assets">
            Phase 1 meshes are the CC0 sphere models already in this repo, plus OpenStreetMap tiles. A soldier file loads only when it is already on this machine. Premium packs are not in this build.
          </p>
          <ul className="scenario-line-list" data-testid="engagement-lines">
            {state.engagementLines.map((line) => (
              <li key={line.id} data-side={line.side}>
                {line.label}
              </li>
            ))}
          </ul>
          <div className="ao-quick">
            {state.aos.map((ao) => (
              <button
                key={ao.id}
                type="button"
                className={state.selectedAoId === ao.id ? 'active' : ''}
                onClick={() => state.selectAo(ao.id)}
              >
                {ao.name}
                <small>{ao.type}</small>
              </button>
            ))}
          </div>
          <ExportBar state={state} exportTargetRef={exportRef} />
        </section>

        <aside className="side-col">
          {state.stage === 'Observe' && <ObservePanel state={state} />}
          {state.stage === 'Mitigate' && <MitigatePanel state={state} />}
          {state.stage === 'Wargame' && <WargamePanel state={state} />}
          {state.stage === 'Decide' && <DecidePanel state={state} />}
          {showDomains && <DomainPipelinePanel />}
          <AboutPanel />
        </aside>
      </div>

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
      {sphereModel && state.activeSphere && (
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
      )}
      <Toast message={state.toast} />
    </div>
  );
}
