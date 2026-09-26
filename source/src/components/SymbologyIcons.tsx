import type { SymbologyMode } from '../types';

/** Lightweight SVG / CSS stand-ins for MIL-STD-2525-style and commercial decks. */
export function SymbolIcon({
  kind,
  mode,
  size = 28,
}: {
  kind?: string;
  mode: SymbologyMode;
  size?: number;
}) {
  if (mode === 'military') {
    return <MilIcon kind={kind} size={size} />;
  }
  return <CommercialIcon kind={kind} size={size} />;
}

function MilIcon({ kind, size }: { kind?: string; size: number }) {
  const stroke = '#7CFC9A';
  const fill = 'rgba(20, 40, 30, 0.85)';
  // Diamond frame ≈ friendly/hostile frame shorthand for demo
  const common = { width: size, height: size, viewBox: '0 0 40 40' };
  switch (kind) {
    case 'armor':
      return (
        <svg {...common} aria-label="Armor (2525-style SAMPLE)">
          <polygon points="20,2 38,20 20,38 2,20" fill={fill} stroke={stroke} strokeWidth="2" />
          <rect x="10" y="16" width="20" height="8" rx="1" fill="none" stroke={stroke} />
          <circle cx="14" cy="20" r="2" fill={stroke} />
          <circle cx="26" cy="20" r="2" fill={stroke} />
        </svg>
      );
    case 'ifv':
      return (
        <svg {...common} aria-label="IFV (2525-style SAMPLE)">
          <polygon points="20,2 38,20 20,38 2,20" fill={fill} stroke={stroke} strokeWidth="2" />
          <rect x="12" y="17" width="16" height="6" fill="none" stroke={stroke} />
          <line x1="20" y1="14" x2="20" y2="17" stroke={stroke} />
        </svg>
      );
    case 'arty':
      return (
        <svg {...common} aria-label="Artillery (2525-style SAMPLE)">
          <polygon points="20,2 38,20 20,38 2,20" fill={fill} stroke="#f5a623" strokeWidth="2" />
          <circle cx="20" cy="20" r="5" fill="none" stroke="#f5a623" />
          <circle cx="20" cy="20" r="2" fill="#f5a623" />
        </svg>
      );
    case 'uav':
      return (
        <svg {...common} aria-label="UAV (2525-style SAMPLE)">
          <polygon points="20,2 38,20 20,38 2,20" fill={fill} stroke="#6ec6ff" strokeWidth="2" />
          <path d="M8 20 L20 12 L32 20 L20 28 Z" fill="none" stroke="#6ec6ff" />
        </svg>
      );
    case 'ship':
      return (
        <svg {...common} aria-label="Ship (2525-style SAMPLE)">
          <ellipse cx="20" cy="20" rx="16" ry="10" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M8 22 L20 10 L32 22" fill="none" stroke={stroke} />
        </svg>
      );
    case 'port':
    case 'infra':
      return (
        <svg {...common} aria-label="Infrastructure (2525-style SAMPLE)">
          <rect x="6" y="6" width="28" height="28" fill={fill} stroke="#c9a0ff" strokeWidth="2" />
          <path d="M12 28 V14 H20 V28 M20 18 H28 V28" fill="none" stroke="#c9a0ff" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-label="Unit (2525-style SAMPLE)">
          <polygon points="20,2 38,20 20,38 2,20" fill={fill} stroke={stroke} strokeWidth="2" />
        </svg>
      );
  }
}

function CommercialIcon({ kind, size }: { kind?: string; size: number }) {
  const common = { width: size, height: size, viewBox: '0 0 40 40' };
  switch (kind) {
    case 'ship':
      return (
        <svg {...common} aria-label="Ship (commercial)">
          <rect x="4" y="18" width="32" height="10" rx="2" fill="#1e90ff" />
          <polygon points="8,18 16,8 24,8 28,18" fill="#4aa3ff" />
          <rect x="18" y="10" width="3" height="8" fill="#fff" />
        </svg>
      );
    case 'port':
      return (
        <svg {...common} aria-label="Port (commercial)">
          <rect x="6" y="22" width="28" height="10" fill="#888" />
          <rect x="10" y="10" width="8" height="12" fill="#f5a623" />
          <rect x="22" y="14" width="10" height="8" fill="#ccc" />
        </svg>
      );
    case 'pipeline':
      return (
        <svg {...common} aria-label="Pipeline (commercial)">
          <path
            d="M4 28 C12 8, 28 32, 36 12"
            fill="none"
            stroke="#e67e22"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="20" cy="20" r="4" fill="#e67e22" />
        </svg>
      );
    case 'vehicle':
      return (
        <svg {...common} aria-label="Vehicle (commercial)">
          <rect x="6" y="16" width="28" height="12" rx="2" fill="#555" />
          <circle cx="12" cy="30" r="4" fill="#222" />
          <circle cx="28" cy="30" r="4" fill="#222" />
        </svg>
      );
    case 'hazard':
      return (
        <svg {...common} aria-label="Hazard (commercial)">
          <polygon points="20,4 36,34 4,34" fill="#f1c40f" stroke="#333" />
          <text x="20" y="28" textAnchor="middle" fontSize="14" fontWeight="bold">
            !
          </text>
        </svg>
      );
    case 'sensor':
      return (
        <svg {...common} aria-label="Sensor (commercial)">
          <circle cx="20" cy="20" r="6" fill="#2ecc71" />
          <circle cx="20" cy="20" r="12" fill="none" stroke="#2ecc71" strokeWidth="2" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-label="Marker (commercial)">
          <circle cx="20" cy="20" r="10" fill="#3498db" />
        </svg>
      );
  }
}
