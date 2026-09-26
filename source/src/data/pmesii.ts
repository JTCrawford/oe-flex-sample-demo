import type { PmesiiChip } from '../types';

/** Single-letter PMESII-PT chips. Physical and Time sit after the hyphen. */
export const PMESII_LETTERS: Record<PmesiiChip, string> = {
  Political: 'P',
  Military: 'M',
  Economic: 'E',
  Social: 'S',
  Information: 'I',
  Infrastructure: 'I',
  Physical: 'P',
  Time: 'T',
};

/** One-sentence OE teaching tips. Shown to the right of each letter chip. */
export const PMESII_TOOLTIPS: Record<PmesiiChip, string> = {
  Political:
    'Political: governance, authority, factions, and decision-makers that shape the operating environment.',
  Military:
    'Military: force structure, posture, weapons, and combat power that can affect the fight.',
  Economic:
    'Economic: markets, trade, resources, and money flows that enable or constrain actors.',
  Social:
    'Social: demographics, culture, identity groups, and civil society that drive behavior on the ground.',
  Information:
    'Information: narratives, media, influence, and the info space that shapes perception and will.',
  Infrastructure:
    'Infrastructure: roads, ports, power, networks, and facilities that sustain operations and populations.',
  Physical:
    'Physical Environment: terrain, weather, climate, and geography that channel movement and effects.',
  Time: 'Time: tempo, windows of opportunity, seasons, and sequencing that change what is possible when.',
};
