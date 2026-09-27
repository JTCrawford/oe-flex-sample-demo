import type { SphereModelId } from './engagementSphere';

/**
 * UNCLASS SAMPLE vignette cards for the engagement sphere.
 * Defeat notes are training labels. They are not a targeting solution
 * and they do not describe a procedure.
 */
export type SphereLayerId = 'strengths' | 'weaknesses' | 'defeat' | 'capabilities';

export interface SphereAnalysisNote {
  id: string;
  title: string;
  body: string;
  /** Set when this line is a placeholder because the SAMPLE dataset is thin. */
  stub?: boolean;
}

export type SphereAnalysis = Record<SphereLayerId, SphereAnalysisNote[]>;

export const SPHERE_LAYERS: { id: SphereLayerId; label: string }[] = [
  { id: 'strengths', label: 'Strengths' },
  { id: 'weaknesses', label: 'Weaknesses' },
  { id: 'defeat', label: 'How do I kill this?' },
  { id: 'capabilities', label: 'Capabilities' },
];

const STUB_BODY =
  'SAMPLE stub. This dataset does not carry a sourced note for this layer. The line is a placeholder, not an assessment.';

function stub(id: string, title: string, body = STUB_BODY): SphereAnalysisNote {
  return { id, title, body, stub: true };
}

function note(id: string, title: string, body: string, stubNote = false): SphereAnalysisNote {
  return { id, title, body, ...(stubNote ? { stub: true } : {}) };
}

const SEEDED: Partial<Record<SphereModelId, SphereAnalysis>> = {
  'sphere-tochka-u': {
    strengths: [
      note(
        'mobile',
        'Road-mobile TEL',
        'SAMPLE story: the battery moves between hides on an amphibious 6×6 chassis. The recognition brief calls the vehicle a 9P129.',
      ),
      note(
        'one-round',
        'One round on the rail',
        'The recognition mesh shows a single elevated 9M79-class round. That is the silhouette this card uses.',
      ),
    ],
    weaknesses: [
      note(
        'exposed',
        'Elevated round is the cue',
        'SAMPLE: the card treats the raised round as a recognition cue. It is not an assessment of protection.',
      ),
      stub(
        'reload',
        'Reload and hide timing',
        'SAMPLE stub. Reload time and hide timing are not in this dataset.',
      ),
    ],
    defeat: [
      note(
        'hide',
        'Find it in the hide',
        'SAMPLE vignette: the training question is whether the launcher is still in the hide. This card does not name a weapon or a procedure.',
      ),
      note(
        'committed',
        'Erected round is committed',
        'SAMPLE vignette: once the round is up, the story treats the shot as committed. No steps are attached.',
      ),
    ],
    capabilities: [
      note(
        'envelope',
        'Cited envelope 70–120 km',
        'Catalog tochka-u. The inner ring is the 70 km minimum. The outer ring is the 120 km maximum.',
      ),
      note(
        'role',
        'Theater SRBM',
        'SAMPLE role line: transporter-erector-launcher for a 9M79-1 class round.',
      ),
    ],
  },
  'sphere-iskander-m': {
    strengths: [
      note(
        'two-round',
        'Two-round TEL',
        'The recognition mesh shows one closed canister and one exposed 9M723-class round on an 8×8 chassis.',
      ),
      note(
        'bounds',
        'Two cited range bounds',
        'The catalog draws 280 km (believed export) and 500 km (upper domestic cite). It does not add a third ring.',
      ),
    ],
    weaknesses: [
      note(
        'exposed',
        'Exposed round is a cue',
        'SAMPLE: the open round is a recognition cue on this mesh. It is not a vulnerability finding.',
      ),
      stub(
        'drill',
        'Crew drill',
        'SAMPLE stub. Crew drill and reload are not in this dataset.',
      ),
    ],
    defeat: [
      note(
        'before',
        'Before it shoots',
        'SAMPLE vignette: the training question is whether the TEL is found before it shoots. This card does not name a weapon or a procedure.',
      ),
      note(
        'rings',
        'Rings are for the brief',
        'SAMPLE vignette: the two cited rings belong on the map brief. They are not a firing solution.',
      ),
    ],
    capabilities: [
      note(
        'role',
        'Theater SRBM',
        'Catalog iskander-m. Road-mobile 9P78-1 TEL in the SAMPLE missile battery.',
      ),
      note(
        'class',
        '9K720 Iskander-M',
        'Dialog title is the system name. The mesh id stays sphere-iskander-m.',
      ),
    ],
  },
  'sphere-magura': {
    strengths: [
      note(
        'usv',
        'Uncrewed surface craft',
        'SAMPLE naval group: a small USV on the Ukraine East partner side. Naval grey is the auto skin.',
      ),
      note(
        'size',
        'Small-boat band',
        'The brief uses a length near 5.5 m. The public mesh is still the CC0 corvette stand-in.',
      ),
    ],
    weaknesses: [
      stub(
        'link',
        'Endurance and control link',
        'SAMPLE stub. Endurance, payload, and control link are not in this dataset.',
      ),
      note(
        'stand-in',
        'Stand-in hull',
        'SAMPLE: silhouette cues on this viewer sit on the Gulf patrol corvette mesh, not a Magura hull.',
        true,
      ),
    ],
    defeat: [
      stub(
        'none',
        'No defeat method named',
        'SAMPLE stub. This vignette does not name a defeat method. The card stays a recognition label.',
      ),
    ],
    capabilities: [
      note(
        'role',
        'One-way USV role',
        'SAMPLE: the holding is a Black Sea USV section. Payload fit is not assessed.',
        true,
      ),
    ],
  },
  'sphere-liut': {
    strengths: [
      note(
        'uncrewed',
        'Uncrewed ground platform',
        'SAMPLE partner group. The holding has no crew. Ukrainian digital is the auto skin. Woodland stays on the picker.',
      ),
    ],
    weaknesses: [
      stub(
        'mobility',
        'Mobility and payload',
        'SAMPLE stub. Mobility, payload, and control link are not in this dataset.',
      ),
      note(
        'stand-in',
        'Stand-in hull',
        'SAMPLE: markers sit on the CC0 T-72B3 mesh. They are not a Liut hull.',
        true,
      ),
    ],
    defeat: [
      stub(
        'none',
        'No defeat method named',
        'SAMPLE stub. This vignette does not name a defeat method. Training label only.',
      ),
    ],
    capabilities: [
      stub(
        'fit',
        'Remote fit',
        'SAMPLE stub. A remote weapon or cargo fit is a placeholder, not a loadout.',
      ),
    ],
  },
  'sphere-verba': {
    strengths: [
      note(
        'shorad',
        'Dismounted SHORAD team',
        'SAMPLE partner section. The brief calls the team shoulder-fired. Ukrainian digital is the auto skin.',
      ),
    ],
    weaknesses: [
      stub(
        'seeker',
        'Seeker and crew drill',
        'SAMPLE stub. Seeker type and crew drill are not in this dataset.',
      ),
      note(
        'stand-in',
        'Stand-in mesh',
        'SAMPLE: the public mesh is the CC0 T-72B3. It is not a missile tube.',
        true,
      ),
    ],
    defeat: [
      note(
        'label',
        'Presence only',
        'SAMPLE vignette: the card marks that a SHORAD team is in the group. It does not describe an attack.',
      ),
    ],
    capabilities: [
      note(
        'envelope',
        'Cited span 0.5–6 km',
        'Catalog verba. Inner ring is the 0.5 km minimum. Outer ring is the 6 km maximum.',
      ),
      note(
        'family',
        'MANPADS / SHORAD',
        'First SAMPLE man-portable air-defense row. Family label is MANPADS / SHORAD.',
      ),
    ],
  },
  'sphere-fighter': {
    strengths: [
      note(
        'air',
        'Twin-engine fighter',
        'SAMPLE air picture. The CC0 mesh is a MiG-29: twin tails, twin nozzles, LERX louvers, gear down.',
      ),
      note(
        'skin',
        'Skin follows the pin',
        'Partner Ukraine pins use Ukrainian digital. Ukraine OPFOR uses temperate woodland. Hormuz uses desert tan.',
      ),
    ],
    weaknesses: [
      note(
        'gear',
        'Gear-down recognition mesh',
        'SAMPLE: the mesh is shown with the gear down. That is not a combat-configuration assessment.',
      ),
      stub(
        'sensors',
        'Sensors',
        'SAMPLE stub. Sensors and countermeasures are not in this dataset.',
      ),
    ],
    defeat: [
      note(
        'named',
        'Named in the flight',
        'SAMPLE vignette: the card names the jet in the flight. It does not describe an engagement.',
      ),
    ],
    capabilities: [
      note(
        'stores',
        'Recognition stores',
        'SAMPLE stores on the wings are a placeholder. They are not a loadout.',
        true,
      ),
      note(
        'role',
        'Air-superiority role',
        'Brief line: MiG-29 Fulcrum, two Klimov RD-33 engines. Public arrangement only.',
      ),
    ],
  },
  'sphere-btr-4e': {
    strengths: [
      note(
        'wheeled',
        'Wheeled IFV',
        'SAMPLE partner armored company. The brief uses a length near 7.7 m and a crew of 3 plus dismounts.',
      ),
      note(
        'skin',
        'Ukrainian digital',
        'Auto skin on this partner company. Temperate woodland stays on the picker.',
      ),
    ],
    weaknesses: [
      stub(
        'protection',
        'Protection level',
        'SAMPLE stub. Protection level is not in this dataset.',
      ),
      note(
        'stand-in',
        'Stand-in hull',
        'SAMPLE: the public mesh is the CC0 T-72B3. The silhouette is not a BTR-4E.',
        true,
      ),
    ],
    defeat: [
      stub(
        'none',
        'No defeat method named',
        'SAMPLE stub. This vignette does not name a defeat method. The card is a recognition label for the company.',
      ),
    ],
    capabilities: [
      stub(
        'weapon',
        'Turret fit',
        'SAMPLE stub. A turret or remote weapon is a placeholder, not a fitted-weapon assessment.',
      ),
      note(
        'company',
        'Company holding',
        'SAMPLE 4th Armored Company also holds Dozor-B, Novator, KrAZ Shrek, and KrAZ Fiona.',
      ),
    ],
  },
};

function emptyLayer(layer: SphereLayerId): SphereAnalysisNote[] {
  return [
    stub(
      `${layer}-unstubbed`,
      'Not seeded',
      'SAMPLE stub. No vignette card is seeded for this platform yet.',
    ),
  ];
}

export function sphereAnalysisFor(id: SphereModelId): SphereAnalysis {
  return (
    SEEDED[id] ?? {
      strengths: emptyLayer('strengths'),
      weaknesses: emptyLayer('weaknesses'),
      defeat: emptyLayer('defeat'),
      capabilities: emptyLayer('capabilities'),
    }
  );
}
