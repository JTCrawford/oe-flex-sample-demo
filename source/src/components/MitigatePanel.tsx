import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppState } from '../hooks/useAppState';
import { SalesCallout } from './SalesCallout';

interface Props {
  state: AppState;
}

export function MitigatePanel({ state }: Props) {
  const { vignette, selectedAo, isCommercialPartner } = state;
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    setPlaying(false);
    setT(0);
  }, [vignette?.id]);

  useEffect(() => {
    if (!playing || !vignette) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= vignette.durationSec) {
          setPlaying(false);
          return vignette.durationSec;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, vignette]);

  const currentStep = useMemo(() => {
    if (!vignette) return null;
    let step = vignette.steps[0];
    for (const s of vignette.steps) {
      if (s.t <= t) step = s;
    }
    return step;
  }, [vignette, t]);

  if (!selectedAo) {
    return (
      <div className="panel">
        <h2>Mitigate</h2>
        <p className="muted">Select an AO first.</p>
      </div>
    );
  }

  if (!vignette) {
    return (
      <div className="panel">
        <h2>Mitigate</h2>
        <p className="muted">No vignette for this AO.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Mitigate · vignette player</h2>
      <SalesCallout id="mitigate" compact />
      {isCommercialPartner && (
        <div className="banner info">
          Partner view: attack + mitigations only (no feeder positions).
        </div>
      )}
      <h3>{vignette.title}</h3>
      <p className="muted">SAMPLE vignette — not operational intel.</p>

      <div className="timeline">
        <div
          className="timeline-bar"
          style={{ width: `${(t / vignette.durationSec) * 100}%` }}
        />
      </div>
      <div className="btn-row">
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setT(0);
          }}
        >
          Reset
        </button>
        <span className="mono">
          {t.toFixed(1)}s / {vignette.durationSec}s
        </span>
      </div>

      {currentStep && (
        <div className={`vignette-step kind-${currentStep.kind}`}>
          <span className="step-kind">{currentStep.kind}</span>
          <strong>{currentStep.title}</strong>
          <p>{currentStep.description}</p>
        </div>
      )}

      <section>
        <h3>Mitigation options (feed Wargame)</h3>
        <ul className="mitigation-list">
          {vignette.mitigations.map((m) => (
            <li key={m.id}>
              <strong>{m.label}</strong>
              <span className="cost">{m.cost}</span>
              <p>{m.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
