import type { SphereModelId } from './engagementSphere';
import type { ScenarioId } from './scenarios';

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
  'sphere-soldier': {
    strengths: [
      note(
        'section',
        'Two SAMPLE sections',
        'Ukraine–Russia thread. The blue pin is the partner infantry section. The red pin is the OPFOR infantry section. Neither pin is a real unit.',
      ),
    ],
    weaknesses: [
      note(
        'mesh',
        'Soldier file is local',
        'The licensed GLBs stay on the authoring Mac. This host shows the CC0 vehicle stand-in, or the simple map marker, when the file is missing.',
        true,
      ),
    ],
    defeat: [
      note(
        'label',
        'Section pin only',
        'SAMPLE vignette. Training label for the infantry section. This card does not name a weapon or a procedure.',
      ),
    ],
    capabilities: [
      note(
        'holding',
        'One section holding',
        'The row is a SAMPLE dismount section. It is not a table of organization.',
      ),
    ],
  },
};

const HORMUZ_ONLY = new Set<SphereModelId>(['sphere-f22', 'sphere-fa18']);

const HORMUZ: Partial<Record<SphereModelId, SphereAnalysis>> = {
  'sphere-fighter': {
    strengths: [
      note(
        'flight',
        'Hormuz strike flight',
        'Iran / Hormuz thread. SAMPLE 1st Strike Flight under SAMPLE Hormuz OPFOR Group. The public mesh is the CC0 MiG-29. Desert tan is the auto skin on this area.',
      ),
    ],
    weaknesses: [
      stub(
        'stores',
        'Stores not assessed',
        'SAMPLE stub. Stores and sensors are not in this Hormuz dataset.',
      ),
    ],
    defeat: [
      note(
        'track',
        'Still on the track',
        'SAMPLE vignette. The training question is whether the flight is still on the line toward the shipping track. This card does not name a weapon or a procedure.',
      ),
    ],
    capabilities: [
      note(
        'pin',
        'Four-ship SAMPLE row',
        'The pin holds four MiG-29 Fulcrum rows. That count is a SAMPLE label, not a squadron table.',
      ),
    ],
  },
  'sphere-f22': {
    strengths: [
      note(
        'coalition',
        'Coalition bonus flight',
        'Iran / Hormuz thread. SAMPLE 2nd Coalition Flight. Two F-22 rows sit beside the F/A-18 rows. Desert tan is the auto skin. Higher formation is SAMPLE Hormuz Coalition Air.',
      ),
    ],
    weaknesses: [
      note(
        'stand-in',
        'Fighter stand-in',
        'Licensed geometry is Mac-local. The public mesh is the CC0 MiG-29 file, not an F-22 silhouette.',
        true,
      ),
    ],
    defeat: [
      note(
        'place',
        'Place on the thread',
        'SAMPLE vignette. The training label is the coalition flight’s place opposite the OPFOR strike flight. No weapon and no procedure.',
      ),
    ],
    capabilities: [
      note(
        'pair',
        'Bonus pair',
        'The same pin also holds the F/A-18 rows. Both are SAMPLE labels on the coalition flight.',
      ),
    ],
  },
  'sphere-fa18': {
    strengths: [
      note(
        'coalition',
        'Coalition bonus flight',
        'Iran / Hormuz thread. The F/A-18 rows share SAMPLE 2nd Coalition Flight with the F-22 rows. Desert tan is the auto skin.',
      ),
    ],
    weaknesses: [
      note(
        'stand-in',
        'Fighter stand-in',
        'The public mesh is the CC0 MiG-29 file. The F/A-18 geometry is Mac-local and pending an optimized embed.',
        true,
      ),
    ],
    defeat: [
      note(
        'place',
        'Place on the thread',
        'SAMPLE vignette. The training label marks the flight on the Hormuz thread. No weapon and no procedure.',
      ),
    ],
    capabilities: [
      note(
        'pair',
        'Shared pin',
        'Two F/A-18 rows and two F-22 rows. SAMPLE labels only.',
      ),
    ],
  },
  'sphere-vessel': {
    strengths: [
      note(
        'patrol',
        'Hormuz patrol squadron',
        'Iran / Hormuz thread. SAMPLE 1st Patrol Squadron under SAMPLE Hormuz OPFOR Group. Two Gulf patrol corvette rows. Naval grey. The row does not name a pennant class.',
      ),
    ],
    weaknesses: [
      note(
        'mesh',
        'Recognition mesh',
        'The public file is the CC0 Gulf patrol corvette. It is not a named navy hull.',
      ),
    ],
    defeat: [
      note(
        'track',
        'On the shipping track',
        'SAMPLE vignette. The training question is whether the patrol is still on the line toward the shipping track. This card does not name a weapon or a procedure.',
      ),
    ],
    capabilities: [
      note(
        'group',
        'OPFOR group',
        'Higher formation is SAMPLE Hormuz OPFOR Group. Waist fittings on the mesh are SAMPLE placement, not a fitted-weapon assessment.',
      ),
    ],
  },
  'sphere-soldier': {
    strengths: [
      note(
        'ground',
        'Two ground pins',
        'Iran / Hormuz thread. The red pin is the SAMPLE coastal ground section. The blue pin is the SAMPLE coalition ground section. Both are fictional.',
      ),
    ],
    weaknesses: [
      note(
        'mesh',
        'Soldier file is local',
        'The licensed GLBs stay on the authoring Mac. A missing file keeps the CC0 vehicle stand-in and the simple map marker.',
        true,
      ),
    ],
    defeat: [
      note(
        'label',
        'Ground pin only',
        'SAMPLE vignette. Training label for the ground section. This card does not name a weapon or a procedure.',
      ),
    ],
    capabilities: [
      note(
        'holding',
        'One section each',
        'Each pin is one SAMPLE dismount section. Not a table of organization.',
      ),
    ],
  },
};

function banner(analysis: SphereAnalysis, text: string): SphereAnalysis {
  const layers: SphereLayerId[] = ['strengths', 'weaknesses', 'defeat', 'capabilities'];
  const next = { ...analysis };
  for (const layer of layers) {
    next[layer] = [note(`${layer}-scenario`, 'Scenario thread', text), ...analysis[layer]];
  }
  return next;
}

const UKRAINE_HOLDS =
  'Iran / Hormuz thread. This card stays the Ukraine–Russia SAMPLE vignette. Hormuz does not add a new assessment for this platform.';

const HORMUZ_HOLDS =
  'Ukraine–Russia thread. This platform sits on the Iran / Hormuz picture. This card does not reassess it.';

function emptyLayer(layer: SphereLayerId): SphereAnalysisNote[] {
  return [
    stub(
      `${layer}-unstubbed`,
      'Not seeded',
      'SAMPLE stub. No vignette card is seeded for this platform yet.',
    ),
  ];
}

function unseeded(): SphereAnalysis {
  return {
    strengths: emptyLayer('strengths'),
    weaknesses: emptyLayer('weaknesses'),
    defeat: emptyLayer('defeat'),
    capabilities: emptyLayer('capabilities'),
  };
}

export function sphereAnalysisFor(
  id: SphereModelId,
  scenario: ScenarioId = 'ukraine-russia',
): SphereAnalysis {
  if (scenario === 'iran-hormuz') {
    const hormuz = HORMUZ[id];
    if (hormuz) return hormuz;
    const seeded = SEEDED[id];
    if (seeded) return banner(seeded, UKRAINE_HOLDS);
    return banner(unseeded(), UKRAINE_HOLDS);
  }
  if (id === 'sphere-vessel') {
    return banner(
      unseeded(),
      'Ukraine–Russia thread. The Gulf patrol corvette is the Hormuz patrol picture. The Ukraine naval row is the Magura section.',
    );
  }
  if (HORMUZ_ONLY.has(id)) return banner(unseeded(), HORMUZ_HOLDS);
  return SEEDED[id] ?? unseeded();
}
