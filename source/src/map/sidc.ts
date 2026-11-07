import ms from 'milsymbol';
import type { ForceSide, ThreatMarker, UnitEchelon, VehicleCategoryId } from '../types';

/**
 * MIL-STD-2525D numeric SIDC (20 digits), rendered by milsymbol.
 * Version 10, reality context, present status. Echelon sits in the amplifier field.
 */

const ECHELON_CODE: Record<UnitEchelon, string> = {
  section: '13',
  platoon: '14',
  company: '15',
  battery: '15',
  flight: '15',
  squadron: '16',
  'task-force': '16',
};

const SAMPLE_FUCHSIA = '#FF2BD6';

type SymbolSet = '10' | '01' | '30' | '20';

interface BuiltSymbol {
  sidc: string;
  label: string;
}

function identityDigit(side: ForceSide | undefined): string {
  if (side === 'friendly') return '3';
  if (side === 'adversary') return '6';
  return '1';
}

function entityFor(
  category: VehicleCategoryId | undefined,
  kind: string | undefined,
): { set: SymbolSet; entity: string; modifier: string } {
  const token = category ?? kind;
  switch (token) {
    case 'tank':
    case 'armor':
      return { set: '10', entity: '120500', modifier: '0000' };
    case 'ifv':
      return { set: '10', entity: '121102', modifier: '0000' };
    case 'infantry':
      return { set: '10', entity: '121100', modifier: '0000' };
    case 'artillery':
    case 'arty':
      return { set: '10', entity: '130300', modifier: '0000' };
    case 'shorad':
      return { set: '10', entity: '130100', modifier: '0000' };
    case 'ugv':
      return { set: '10', entity: '121900', modifier: '0000' };
    case 'aircraft':
      return { set: '01', entity: '110100', modifier: '0000' };
    case 'uav':
      return { set: '01', entity: '110300', modifier: '0000' };
    case 'ship':
      return { set: '30', entity: '120200', modifier: '0000' };
    case 'port':
      return { set: '20', entity: '121309', modifier: '0000' };
    case 'infra':
    case 'pipeline':
      return { set: '20', entity: '120800', modifier: '1000' };
    default:
      return { set: '10', entity: '000000', modifier: '0000' };
  }
}

/** 20-digit 2525D code with affiliation, symbol set, echelon, and task-force bracket. */
export function sidcForMarker(marker: ThreatMarker): string {
  const primary = marker.orbat?.vehicles.find((row) => row.count > 0);
  const { set, entity, modifier } = entityFor(primary?.category, marker.milSymbol);
  const echelon = marker.orbat?.echelon;
  const taskForce = echelon === 'task-force';
  const version = '10';
  const context = '0';
  const identity = identityDigit(marker.side);
  const status = '0';
  const hq = taskForce ? '4' : '0';
  const amplifier = echelon ? ECHELON_CODE[echelon] : '00';
  return `${version}${context}${identity}${set}${status}${hq}${amplifier}${entity}${modifier}`;
}

/** Preview symbol when the caller only has the legacy kind string. */
export function sidcForKind(kind: string | undefined, side: ForceSide = 'friendly'): string {
  return sidcForMarker({
    id: 'preview',
    lat: 0,
    lng: 0,
    label: 'SAMPLE',
    milSymbol: kind,
    pmesii: ['Military'],
    side,
    orbat: {
      designation: 'SAMPLE',
      echelon: kind === 'ship' ? 'squadron' : 'company',
      higherFormation: side === 'friendly' ? 'SAMPLE Partner Group' : 'SAMPLE OPFOR Group',
      vehicles: [],
      sampleLabel: 'SAMPLE',
    },
  });
}

export function symbolForMarker(marker: ThreatMarker): BuiltSymbol {
  return { sidc: sidcForMarker(marker), label: marker.label };
}

const canvasCache = new Map<string, HTMLCanvasElement>();

/** Framed 2525D icon without text fields. The map draws the SAMPLE label itself. */
export function milSymbolCanvas(sidc: string, size = 40): HTMLCanvasElement {
  const key = `${sidc}:${size}`;
  const cached = canvasCache.get(key);
  if (cached) return cached;
  const symbol = new ms.Symbol(sidc, {
    size,
    standard: '2525',
    infoFields: false,
    outlineWidth: 2,
  });
  const canvas = symbol.asCanvas();
  canvasCache.set(key, canvas);
  return canvas;
}

export function milSymbolSvg(kind: string | undefined, size: number): string {
  const symbol = new ms.Symbol(sidcForKind(kind), {
    size,
    standard: '2525',
    uniqueDesignation: 'SAMPLE',
    infoColor: SAMPLE_FUCHSIA,
    infoOutlineColor: '#1a1020',
    infoOutlineWidth: 2,
    infoSize: 34,
  });
  return symbol.asSVG();
}

export function affiliationOf(marker: ThreatMarker): 'friendly' | 'enemy' | 'unknown' {
  if (marker.side === 'friendly') return 'friendly';
  if (marker.side === 'adversary') return 'enemy';
  return 'unknown';
}
