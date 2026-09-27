import {
  admiraltyExplanation,
  formatAdmiraltyBadge,
  type SocialSignalView,
} from '../data/socialSignals';

interface Props {
  signal: SocialSignalView;
  onClear: () => void;
}

export function SocialSignalPanel({ signal, onClear }: Props) {
  const located = signal.geoHints.filter((hint) => hint.lat != null && hint.lon != null);
  return (
    <aside
      className="social-panel"
      role="dialog"
      aria-labelledby="social-signal-title"
      data-testid="social-signal-panel"
    >
      <header className="munition-panel-head">
        <div>
          <p className="munition-kicker">UNCLASS · SAMPLE · SOCMINT</p>
          <h3 id="social-signal-title">Social signal</h3>
        </div>
        <button type="button" onClick={onClear} aria-label="Clear selected social signal">
          Clear
        </button>
      </header>

      <p className="admiralty-badge admiralty-badge-lg">{formatAdmiraltyBadge(signal)}</p>
      <p className="social-headline">{signal.headline}</p>
      <p className="muted social-meta">
        {signal.platform} · {signal.sourceLabel}
      </p>

      <p className="social-grade">
        {admiraltyExplanation(signal.displayReliability, signal.displayCredibility)}{' '}
        Admiralty rates the source (A–F) separately from the information (1–6).
      </p>
      {signal.upgraded && signal.upgradeNote ? (
        <p className="social-grade">
          {signal.upgradeNote} Collecting source remains{' '}
          {admiraltyExplanation(signal.reliability, signal.credibility)}{' '}
          {signal.claimStatus}.
        </p>
      ) : null}
      {signal.corroboratesHeadline ? (
        <p className="social-grade">Corroborates: {signal.corroboratesHeadline}</p>
      ) : null}

      <p className="social-body">{signal.body}</p>

      <h4 className="social-subhead">Geo hints</h4>
      <ul className="social-links">
        {signal.geoHints.map((hint) => (
          <li key={hint.name}>
            {hint.name}
            {hint.lat != null && hint.lon != null
              ? ` (${hint.lat.toFixed(2)}, ${hint.lon.toFixed(2)})`
              : ' — no coordinates, map pin omitted'}
          </li>
        ))}
      </ul>
      {located.length >= 2 ? (
        <p className="muted social-meta">Corridor drawn between the located axes.</p>
      ) : null}

      {signal.relatedUnits.length > 0 || signal.relatedMunitions.length > 0 ? (
        <>
          <h4 className="social-subhead">Related SAMPLE catalog</h4>
          <ul className="social-links">
            {signal.relatedUnits.map((unit) => (
              <li key={unit.id}>
                {unit.label} <code>{unit.id}</code>
              </li>
            ))}
            {signal.relatedMunitions.map((munition) => (
              <li key={munition.id}>
                {munition.label} <code>{munition.id}</code>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="muted social-meta">
        Fictional I&amp;W card. Strike history, munition rings, and order of battle stay on
        the map. {signal.sampleLabel} only.
      </p>
    </aside>
  );
}
