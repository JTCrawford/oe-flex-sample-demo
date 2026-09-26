import {
  ECHELON_LABEL,
  categoryLabel,
  holdingsInCatalogOrder,
  vehicleTotal,
} from '../data/orbat';
import type { UnitOrbat } from '../types';

interface InspectProps {
  orbat: UnitOrbat;
  variant: 'panel' | 'popup';
}

/** Designation plus typed vehicle counts. Rows come from the holding list. */
export function OrbatInspect({ orbat, variant }: InspectProps) {
  const rows = holdingsInCatalogOrder(orbat.vehicles);
  return (
    <div className={`orbat-body orbat-body-${variant}`}>
      <p className="orbat-designation">{orbat.designation}</p>
      <p className="orbat-meta">
        {ECHELON_LABEL[orbat.echelon]} · {orbat.higherFormation}
      </p>
      <table className="orbat-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Type</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.category}:${row.typeDesignation}`}>
              <td>{categoryLabel(row.category)}</td>
              <td>{row.typeDesignation}</td>
              <td className="orbat-count">{row.count}</td>
            </tr>
          ))}
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
  onClear: () => void;
}

export function OrbatPanel({ orbat, onClear }: PanelProps) {
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
      <OrbatInspect orbat={orbat} variant="panel" />
      <p className="muted orbat-note">
        Fictional order of battle on this unit pin. Category labels come from the
        shared catalog, so a new vehicle type renders here without a UI change.
        Strike history and munition rings are unchanged.
      </p>
    </aside>
  );
}
