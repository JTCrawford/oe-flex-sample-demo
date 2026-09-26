import { useRef, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { RoleSelector } from './components/RoleSelector';
import { GlobeView } from './components/GlobeView';
import { Map2D } from './components/Map2D';
import { MunitionInferencePanel } from './components/MunitionInferencePanel';
import { OrbatPanel } from './components/OrbatPanel';
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
import type { Stage } from './types';
import './App.css';

const STAGES: Stage[] = ['Observe', 'Mitigate', 'Wargame', 'Decide'];

export default function App() {
  const state = useAppState();
  const exportRef = useRef<HTMLElement | null>(null);
  const [showDomains, setShowDomains] = useState(false);
  const [showTtpFeeds, setShowTtpFeeds] = useState(() =>
    typeof window !== 'undefined' && window.location.hash === '#ttp',
  );

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
            />
          )}
          {state.selectedUnit?.orbat && (
            <OrbatPanel orbat={state.selectedUnit.orbat} onClear={state.clearUnit} />
          )}
          {state.munitionAssessment && (
            <MunitionInferencePanel
              assessment={state.munitionAssessment}
              onClear={state.clearStrike}
            />
          )}
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
      <Toast message={state.toast} />
    </div>
  );
}
