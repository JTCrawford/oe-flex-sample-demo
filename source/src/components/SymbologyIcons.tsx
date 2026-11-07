import { milSymbolSvg } from '../map/sidc';
import type { SymbologyMode } from '../types';

/** MIL-STD-2525D symbols via milsymbol, plus the commercial deck. */
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
  const svg = milSymbolSvg(kind, size);
  return (
    <span
      className="mil-symbol"
      style={{ width: size + 36, height: size + 28 }}
      aria-label="MIL-STD-2525D SAMPLE symbol"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
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
