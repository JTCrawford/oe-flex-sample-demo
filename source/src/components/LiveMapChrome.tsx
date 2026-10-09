import {
  LIVE_DISCLAIMER,
  SHIP_ATTRIBUTION,
  SHIP_COVERAGE_LABEL,
} from '../data/liveFeeds';

interface BannerProps {
  aircraftOn: boolean;
  shipsOn: boolean;
  aircraftOffline: boolean;
  shipsOffline: boolean;
  aircraftAttribution: string | null;
}

export function LiveMapBanner({
  aircraftOn,
  shipsOn,
  aircraftOffline,
  shipsOffline,
  aircraftAttribution,
}: BannerProps) {
  if (!aircraftOn && !shipsOn) return null;
  const notes = [
    aircraftOn && aircraftAttribution ? aircraftAttribution : null,
    shipsOn ? SHIP_ATTRIBUTION : null,
  ].filter((note): note is string => !!note);

  return (
    <div className="live-map-banner" data-testid="live-map-banner">
      <p>{LIVE_DISCLAIMER}</p>
      {shipsOn && <p>{SHIP_COVERAGE_LABEL}</p>}
      {notes.length > 0 && <p className="live-attr">{notes.join(' · ')}</p>}
      {(aircraftOffline || shipsOffline) && (
        <p className="live-badges">
          {aircraftOffline && (
            <span className="offline-badge" data-testid="aircraft-offline">
              Aircraft offline
            </span>
          )}
          {shipsOffline && (
            <span className="offline-badge" data-testid="ships-offline">
              Ships offline
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export function LiveTrackDetail({ lines }: { lines: string[] }) {
  return (
    <div className="live-detail">
      {lines.map((line, index) => (
        <div key={`${index}-${line}`}>{line}</div>
      ))}
    </div>
  );
}
