import type { Role } from '../types';
import { SalesCallout } from './SalesCallout';

const ROLES: { role: Role; blurb: string }[] = [
  { role: 'Analyst', blurb: 'Full Observe layers + feeder positions.' },
  { role: 'Warfighter', blurb: 'Tactical view; military symbology default.' },
  { role: 'PM', blurb: 'Program view across spine + Decide hooks.' },
  {
    role: 'Commercial Partner',
    blurb: 'Vignette + mitigation ONLY — no feeder positions.',
  },
  { role: 'Executive', blurb: 'Brief-ready view; export & Decide emphasis.' },
];

interface Props {
  onSelect: (role: Role) => void;
}

export function RoleSelector({ onSelect }: Props) {
  return (
    <div className="role-gate">
      <div className="role-card">
        <p className="brand-kicker">Threat Tec · OE Flex</p>
        <h1>OPSEC gate — select role</h1>
        <p className="muted">
          Scaffolding prototype. SAMPLE data only. Not fielded OpEx / WRAITH Hub /
          VORTEX / VOA.
        </p>
        <SalesCallout id="opsec" />
        <div className="role-grid">
          {ROLES.map(({ role, blurb }) => (
            <button
              key={role}
              type="button"
              className="role-btn"
              onClick={() => onSelect(role)}
            >
              <strong>{role}</strong>
              <span>{blurb}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
