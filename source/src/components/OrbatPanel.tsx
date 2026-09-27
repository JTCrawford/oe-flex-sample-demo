import { sphereButtonId, sphereModelForHolding } from '../data/engagementSphere';
import {
  ECHELON_LABEL,
  categoryLabel,
  holdingsInCatalogOrder,
  vehicleTotal,
} from '../data/orbat';
import type { UnitOrbat, VehicleHolding } from '../types';

interface InspectProps {
  orbat: UnitOrbat;
  variant: 'panel' | 'popup';
  onOpenSphere?: (holding: VehicleHolding) => void;
}

/** Designation plus typed vehicle counts. Rows come from the holding list. */
export function OrbatInspect({ orbat, variant, onOpenSphere }: InspectProps) {
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
            <th scope="col">Sphere</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const sphere = sphereModelForHolding(row);
            return (
              <tr key={`${row.category}:${row.typeDesignation}`}>
                <td>{categoryLabel(row.category)}</td>
                <td>{row.typeDesignation}</td>
                <td className="orbat-count">{row.count}</td>
                <td>
                  {sphere && onOpenSphere ? (
                    <button
                      type="button"
                      className="sphere-open"
                      data-testid={`sphere-open-${sphereButtonId(row)}`}
                      onClick={() => onOpenSphere(row)}
                    >
                      Sphere
                    </button>
                  ) : (
                    <span className="orbat-no-sphere" title="Not in the initial SAMPLE sphere set">
                      —
                    </span>
                  )}
                </td>
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
  onClear: () => void;
  onOpenSphere?: (holding: VehicleHolding) => void;
}

export function OrbatPanel({ orbat, onClear, onOpenSphere }: PanelProps) {
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
      <OrbatInspect orbat={orbat} variant="panel" onOpenSphere={onOpenSphere} />
      <p className="muted orbat-note">
        Fictional order of battle on this unit pin. Sphere opens a stylized SAMPLE
        model for a main battle tank, fighter/attack aircraft, or surface vessel.
        Strike history and munition rings stay on the map.
      </p>
    </aside>
  );
}
