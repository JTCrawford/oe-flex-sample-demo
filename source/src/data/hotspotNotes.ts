import type { SphereModelId } from './engagementSphere';
import type { ScenarioId } from './scenarios';
import type { SphereAnalysis } from './sphereAnalysis';

/**
 * UNCLASS SAMPLE cards for hotspots other than the Ukraine default.
 * Defeat lines are training labels. They do not name a weapon or a procedure.
 */
function card(
  strengths: [string, string, string],
  weaknesses: [string, string, string],
  defeat: [string, string, string],
  capabilities: [string, string, string],
): SphereAnalysis {
  const row = (
    id: string,
    title: string,
    body: string,
    stub = false,
  ): SphereAnalysis[keyof SphereAnalysis][number] => ({
    id,
    title,
    body,
    ...(stub ? { stub: true } : {}),
  });
  return {
    strengths: [row('strength', strengths[0], strengths[1])],
    weaknesses: [row('weakness', weaknesses[0], weaknesses[1], weaknesses[2] === 'stub')],
    defeat: [row('defeat', defeat[0], defeat[1])],
    capabilities: [row('capability', capabilities[0], capabilities[1], capabilities[2] === 'stub')],
  };
}

const DEFEAT = 'SAMPLE vignette. Training label only. This card does not name a weapon or a procedure.';

export const HOTSPOT_NOTES: Partial<
  Record<ScenarioId, Partial<Record<SphereModelId, SphereAnalysis>>>
> = {
  'bab-el-mandeb': {
    'sphere-soldier': card(
      [
        'Two ground pins',
        'Houthis / Yemen thread at Bab el-Mandeb. The red pin is the SAMPLE coastal section. The blue pin is the SAMPLE lane watch. Both follow the existing Red Sea mock feed. Neither pin is a real unit.',
        '',
      ],
      [
        'Soldier file is local',
        'The licensed GLBs stay on the authoring Mac. A missing file keeps the CC0 vehicle stand-in and the simple map marker.',
        'stub',
      ],
      [
        'Section pin only',
        `The training question is whether the coastal section is still on the line toward the merchant track. ${DEFEAT}`,
        '',
      ],
      [
        'One section each',
        'Each pin is one SAMPLE dismount section. Not a table of organization.',
        '',
      ],
    ),
    'sphere-vessel': card(
      [
        'Craft and escort',
        'Bab el-Mandeb thread. The red row is SAMPLE coastal craft. The blue row is a SAMPLE escort hull. The public mesh is the CC0 corvette. The rows do not name a navy.',
        '',
      ],
      [
        'Recognition mesh',
        'Silhouette cues sit on the Gulf patrol corvette file. That file is a stand-in for this thread.',
        'stub',
      ],
      [
        'On the merchant track',
        `The training question is whether the craft section is still on the line toward the merchant track. ${DEFEAT}`,
        '',
      ],
      [
        'Mock feed',
        'Pins reuse the southern Red Sea SAMPLE feed. Counts are labels, not an order of battle.',
        '',
      ],
    ),
  },
  'persian-gulf': {
    'sphere-vessel': card(
      [
        'Fast-craft thread',
        'Persian Gulf SAMPLE thread, separate from the Strait of Hormuz pins. Red rows are the two fast-craft sections. The blue row is the screen section. The public mesh is the CC0 corvette. The rows do not name a fleet.',
        '',
      ],
      [
        'Recognition mesh',
        'The corvette file is a stand-in. It is not a fast-craft hull.',
        'stub',
      ],
      [
        'Toward the platform cluster',
        `The training question is whether the craft sections are still on the lines toward the platform cluster. ${DEFEAT}`,
        '',
      ],
      [
        'Existing mock feed',
        'The pins follow the existing central Gulf fast-craft SAMPLE feed. Counts are labels only.',
        '',
      ],
    ),
  },
  'black-sea': {
    'sphere-magura': card(
      [
        'Black Sea USV section',
        'Black Sea thread. SAMPLE partner USV section. Naval grey is the auto skin. The public mesh is still the CC0 corvette stand-in.',
        '',
      ],
      [
        'Stand-in hull',
        'Silhouette cues sit on the Gulf patrol corvette mesh. They are not a Magura hull.',
        'stub',
      ],
      [
        'Recognition label',
        `The card marks the USV section on the line toward the patrol stand-in. ${DEFEAT}`,
        '',
      ],
      [
        'Section holding',
        'Four SAMPLE USV rows. Payload fit is not assessed.',
        'stub',
      ],
    ),
    'sphere-vessel': card(
      [
        'Patrol stand-in',
        'Black Sea thread. The red row is a SAMPLE patrol section. The public mesh is the CC0 corvette. The row does not name a fleet.',
        '',
      ],
      [
        'Recognition mesh',
        'This file is the Gulf patrol corvette used as a stand-in on this thread.',
        '',
      ],
      [
        'Toward the merchant track',
        `The training question is whether the patrol is still on the line toward the merchant track. ${DEFEAT}`,
        '',
      ],
      [
        'Two-hull label',
        'The holding is two SAMPLE coastal craft. Not a squadron table.',
        '',
      ],
    ),
    'sphere-soldier': card(
      [
        'Shore section',
        'Black Sea thread. The blue pin is the SAMPLE partner shore section. It is not a real unit.',
        '',
      ],
      [
        'Soldier file is local',
        'The licensed GLBs stay on the authoring Mac. A missing file keeps the CC0 vehicle stand-in and the simple map marker.',
        'stub',
      ],
      [
        'Shore pin only',
        `The training question is whether the shore section is still on the line toward the patrol stand-in. ${DEFEAT}`,
        '',
      ],
      [
        'One section',
        'The row is one SAMPLE dismount section. Not a table of organization.',
        '',
      ],
    ),
  },
  'suwalki-gap': {
    'sphere-mbt': card(
      [
        'Corridor armor',
        'Suwałki Gap SAMPLE thread. The red armor platoon uses the CC0 recognition mesh. The vignette is an armor approach on the land corridor. Not a real unit.',
        '',
      ],
      [
        'Recognition mesh',
        'The public file is the CC0 T-72B3 recognition mesh. It is not an exact purchased hull.',
        'stub',
      ],
      [
        'On the approach',
        `The training question is whether the platoon is still on the line toward the corridor node. ${DEFEAT}`,
        '',
      ],
      [
        'Platoon label',
        'Three SAMPLE tank rows in the OPFOR platoon. Not a table of organization.',
        '',
      ],
    ),
    'sphere-soldier': card(
      [
        'Corridor defense',
        'Suwałki Gap thread. The blue pin is the SAMPLE corridor defense section. The red mech and armor pins are the OPFOR approach.',
        '',
      ],
      [
        'Soldier file is local',
        'The licensed GLBs stay on the authoring Mac. A missing file keeps the CC0 vehicle stand-in and the simple map marker.',
        'stub',
      ],
      [
        'Defense pin only',
        `The training question is whether the defense section is still on the line toward the armor platoon. ${DEFEAT}`,
        '',
      ],
      [
        'One section',
        'The row is one SAMPLE dismount section. Not a table of organization.',
        '',
      ],
    ),
  },
};

export const HOTSPOT_HOLD: Record<Exclude<ScenarioId, 'ukraine-russia'>, string> = {
  'iran-hormuz':
    'Strait of Hormuz thread. This card stays its home vignette. Hormuz does not add a new assessment for this platform.',
  'bab-el-mandeb':
    'Bab el-Mandeb thread. This card stays its home vignette. This hotspot does not add a new assessment.',
  'persian-gulf':
    'Persian Gulf thread. This card stays its home vignette. This hotspot does not add a new assessment.',
  'black-sea':
    'Black Sea thread. This card stays its home vignette. This hotspot does not add a new assessment.',
  'suwalki-gap':
    'Suwałki Gap thread. This card stays its home vignette. This hotspot does not add a new assessment.',
};
