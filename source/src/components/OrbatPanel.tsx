import {
  ECHELON_LABEL,
  categoryLabel,
  holdingsInCatalogOrder,
  vehicleTotal,
} from '../data/orbat';
import {
  MUNITION_FAMILY_LABEL,
  formatRangeSpan,
  munitionProfileById,
  profilesForOrbat,
  ringStyleForIndex,
} from '../data/munitionCatalog';
import type { MunitionProfile, UnitOrbat } from '../types';

interface InspectProps {
  orbat: UnitOrbat;
  variant: 'panel' | 'popup';
  /** True when envelope rings for this unit are on the map. */
  rangeRingsOn?: boolean;
}

function LinkedMunitionCard({
  profile,
  index,
}: {
  profile: MunitionProfile;
  index: number;
}) {
  const style = ringStyleForIndex(index);
  return (
    <article
      className="linked-munition"
      data-testid="linked-munition"
      data-munition-id={profile.id}
    >
      <div className="munition-row">
        <span
          className="munition-swatch"
          style={{ borderColor: style.color, background: style.color }}
          aria-hidden
        />
        <span className="munition-name">{profile.designation}</span>
      </div>
      <p className="linked-kicker">UNCLASS · SAMPLE analog</p>
      <p className="linked-role">
        {MUNITION_FAMILY_LABEL[profile.family]} · {profile.role}
      </p>
      <p className="linked-range" data-testid="linked-range">
        Range <strong>{formatRangeSpan(profile)}</strong>
      </p>
      <p className="linked-notes">{profile.notes}</p>
      <p
        className="linked-sphere"
        data-testid="engagement-sphere"
        data-sphere-model-id={profile.engagementSphereModelId}
      >
        Engagement sphere{' '}
        <code className="sphere-id">{profile.engagementSphereModelId}</code>
      </p>
    </article>
  );
}

/** Designation, typed vehicle counts, and linked SAMPLE munition profiles. */
export function OrbatInspect({ orbat, variant, rangeRingsOn = false }: InspectProps) {
  const rows = holdingsInCatalogOrder(orbat.vehicles);
  const linked = profilesForOrbat(orbat);
  return (
    <div className={`orbat-body orbat-body-${variant}`}>
      <p className="orbat-designation">{orbat.designation}</p>
      <p className="orbat-meta">
        {ECHELON_LABEL[orbat.echelon]} · {orbat.higherFormation}
      </p>
      {linked.length > 0 && (
        <div
          className="linked-munition-list"
          data-testid="linked-munitions"
          data-linked-munition-ids={linked.map((profile) => profile.id).join(' ')}
        >
          <p className="linked-heading">Linked munitions</p>
          {linked.map((profile, index) => (
            <LinkedMunitionCard key={profile.id} profile={profile} index={index} />
          ))}
          {rangeRingsOn ? (
            <p className="muted linked-ring-note">
              Range rings are drawn from this unit. Each profile uses one color.
              The heavier dash is the outer figure; the finer dash is the inner
              figure.
            </p>
          ) : (
            <p className="muted linked-ring-note">
              Range rings draw from this unit when Military symbology is on and
              the Military filter is selected.
            </p>
          )}
        </div>
      )}
      <table className="orbat-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Type</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const holdingNames = (row.linkedMunitionIds ?? [])
              .map((id) => munitionProfileById(id)?.shortName ?? id)
              .join(', ');
            return (
              <tr key={`${row.category}:${row.typeDesignation}`}>
                <td>{categoryLabel(row.category)}</td>
                <td>
                  {row.typeDesignation}
                  {holdingNames && (
                    <span className="orbat-linked-type">Linked {holdingNames}</span>
                  )}
                </td>
                <td className="orbat-count">{row.count}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="orbat-total">
        {vehicleTotal(orbat)} vehicles · {orbat.sampleLabel}
      </p>
    </div>
  );
}

interface PanelProps {
  orbat: UnitOrbat;
  rangeRingsOn: boolean;
  onClear: () => void;
}

export function OrbatPanel({ orbat, rangeRingsOn, onClear }: PanelProps) {
  return (
    <aside
      className="orbat-panel"
      role="dialog"
      aria-labelledby="orbat-panel-title"
      data-testid="orbat-panel"
    >
      <header className="munition-panel-head">
        <div>
          <p className="munition-kicker">UNCLASS · SAMPLE</p>
          <h3 id="orbat-panel-title">Order of battle</h3>
        </div>
        <button type="button" onClick={onClear} aria-label="Clear selected unit">
          Clear
        </button>
      </header>
      <OrbatInspect orbat={orbat} variant="panel" rangeRingsOn={rangeRingsOn} />
      <p className="muted orbat-note">
        Fictional order of battle on this unit pin. Linked munitions come from the
        shared SAMPLE catalog. Strike-history inference still draws its own rings
        from a selected strike origin.
      </p>
    </aside>
  );
}
