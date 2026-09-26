import { useMemo, useState, type CSSProperties } from 'react';
import { ttpFeeds } from '../data/ttpFeeds';
import type { Stage, TtpFeed, TtpFootagePlaceholder } from '../types';

type Props = {
  onClose: () => void;
  onOpenMitigation: (aoId: string, stage: Stage) => void;
};

function MiniMap({ feed }: { feed: TtpFeed }) {
  const bounds = useMemo(() => {
    const lats = feed.pins.map((p) => p.lat);
    const lngs = feed.pins.map((p) => p.lng);
    return {
      minLat: Math.min(...lats) - 0.4,
      maxLat: Math.max(...lats) + 0.4,
      minLng: Math.min(...lngs) - 0.4,
      maxLng: Math.max(...lngs) + 0.4,
    };
  }, [feed.pins]);

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div className="ttp-minimap" style={{ borderColor: feed.accent }}>
      <div className="ttp-minimap-grid" />
      {feed.pins.map((pin) => (
        <div
          key={pin.id}
          className={`ttp-pin ttp-pin-${pin.kind}`}
          style={{ ...project(pin.lat, pin.lng), '--pin': feed.accent } as CSSProperties}
          title={`${pin.label} (${pin.lat.toFixed(2)}, ${pin.lng.toFixed(2)})`}
        >
          <span className="ttp-pin-dot" />
          <span className="ttp-pin-label">{pin.label}</span>
        </div>
      ))}
      <div className="ttp-minimap-caption">SAMPLE map pins · {feed.region}</div>
    </div>
  );
}

function FootageCard({
  clip,
  playing,
  onPlay,
}: {
  clip: TtpFootagePlaceholder;
  playing: boolean;
  onPlay: () => void;
}) {
  return (
    <div className={`ttp-footage ${playing ? 'playing' : ''}`}>
      {playing ? (
        <video
          className="ttp-video"
          src={clip.videoSrc}
          controls
          autoPlay
          playsInline
          onEnded={onPlay}
        />
      ) : (
        <button
          type="button"
          className="ttp-footage-poster"
          onClick={onPlay}
          style={{
            background: `linear-gradient(145deg, hsl(${clip.posterHue} 45% 18%), hsl(${clip.posterHue} 30% 8%))`,
          }}
        >
          <span className="ttp-play">▶</span>
        </button>
      )}
      <span className="ttp-footage-meta">
        <strong>{clip.title}</strong>
        <em>
          {clip.provenance} · {clip.durationLabel}
          {clip.hasSyncedAudio ? ' · video+audio' : ''}
        </em>
        <small>{clip.caption}</small>
        {!playing && (
          <button type="button" className="ttp-play-inline" onClick={onPlay}>
            Play SAMPLE video
          </button>
        )}
      </span>
    </div>
  );
}

export function TtpFeedsPanel({ onClose, onOpenMitigation }: Props) {
  const [selectedId, setSelectedId] = useState<string>(ttpFeeds[0]?.id ?? '');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const feed = ttpFeeds.find((f) => f.id === selectedId) ?? ttpFeeds[0];

  if (!feed) return null;

  return (
    <div className="ttp-overlay">
      <div className="ttp-shell">
        <header className="ttp-header">
          <div>
            <p className="ttp-kicker">TTP Subscription Feed · SAMPLE</p>
            <h2>Tune in — the feed never goes quiet</h2>
            <p className="ttp-sales">
              Your team learns the threat the same week it emerges — not six months later in a
              static report. Video is primary; audio only when synced to video — no audio-only
              feeds.
            </p>
          </div>
          <button type="button" className="ttp-close" onClick={onClose}>
            Back to globe
          </button>
        </header>

        <div className="ttp-layout">
          <aside className="ttp-list">
            {ttpFeeds.map((f) => (
              <button
                key={f.id}
                type="button"
                className={f.id === feed.id ? 'ttp-card active' : 'ttp-card'}
                style={{ borderLeftColor: f.accent }}
                onClick={() => {
                  setSelectedId(f.id);
                  setPlayingId(null);
                }}
              >
                <span className={`ttp-sev ttp-sev-${f.severity}`}>{f.severity}</span>
                <strong>{f.title}</strong>
                <small>{f.subtitle}</small>
                <em>{f.updatedLabel}</em>
              </button>
            ))}
          </aside>

          <section className="ttp-detail">
            <div className="ttp-detail-head" style={{ borderColor: feed.accent }}>
              <div>
                <h3>{feed.title}</h3>
                <p>
                  <strong>{feed.threatActor}</strong> · {feed.attackPattern}
                </p>
                <p className="ttp-summary">{feed.summary}</p>
                <div className="ttp-domains">
                  {feed.domains.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
              <MiniMap feed={feed} />
            </div>

            <div className="ttp-grid-2">
              <div>
                <h4>Timeline</h4>
                <ol className="ttp-timeline">
                  {feed.timeline.map((ev) => (
                    <li key={ev.id} className={`sev-${ev.severity}`}>
                      <span className="ttp-date">{ev.date}</span>
                      <div>
                        <strong>{ev.title}</strong>
                        <p>{ev.summary}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h4>Sourced footage (SAMPLE video — primary media)</h4>
                <div className="ttp-footage-grid">
                  {feed.footage.map((clip) => (
                    <FootageCard
                      key={clip.id}
                      clip={clip}
                      playing={playingId === clip.id}
                      onPlay={() =>
                        setPlayingId((cur) => (cur === clip.id ? null : clip.id))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            <h4>Mitigation options</h4>
            <div className="ttp-mit-grid">
              {feed.mitigations.map((m) => (
                <article key={m.id} className="ttp-mit">
                  <header>
                    <strong>{m.label}</strong>
                    <span>{m.cost}</span>
                  </header>
                  <p>{m.description}</p>
                  {m.linkAoId && m.linkStage && (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => onOpenMitigation(m.linkAoId!, m.linkStage!)}
                    >
                      Open in {m.linkStage}
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
