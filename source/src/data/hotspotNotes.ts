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
    'sphere-vessel': card(
      [
        'CC0 hull',
        'Black Sea thread. The blue row is a SAMPLE USV stand-in and the red row is a SAMPLE patrol. Both open the in-repo CC0 corvette. This build does not include a purchased USV mesh.',
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
        'CC0 rows',
        'Both sections use the in-repo corvette file. Counts are SAMPLE labels, not a squadron table.',
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
  'taiwan-strait': {
    'sphere-fighter': card(
      [
        'Strait strike flight',
        'Taiwan Strait thread. SAMPLE 1st Strike Flight under SAMPLE Taiwan Strait OPFOR Group. The public mesh is the CC0 MiG-29. Temperate woodland is the auto skin. Not a real squadron.',
        '',
      ],
      [
        'Stores not assessed',
        'SAMPLE stub. Stores and sensors are not in this strait dataset.',
        'stub',
      ],
      [
        'Still on the track',
        `The training question is whether the flight is still on the line toward the strait track. ${DEFEAT}`,
        '',
      ],
      [
        'Four-ship SAMPLE row',
        'The pin holds four MiG-29 Fulcrum rows. That count is a SAMPLE label, not a squadron table.',
        '',
      ],
    ),
    'sphere-f22': card(
      [
        'Coalition flight',
        'Taiwan Strait thread. SAMPLE 2nd Coalition Flight. Two F-22 rows sit beside the F/A-18 rows. Temperate woodland is the auto skin. The public mesh is the CC0 MiG-29.',
        '',
      ],
      [
        'Fighter stand-in',
        'Licensed geometry is Mac-local. The public mesh is the CC0 MiG-29 file, not an F-22 silhouette.',
        'stub',
      ],
      [
        'Place on the thread',
        `The training label is the coalition flight’s place opposite the OPFOR strike flight. ${DEFEAT}`,
        '',
      ],
      [
        'Shared pin',
        'The same pin also holds the F/A-18 rows. Both are SAMPLE labels on the coalition flight.',
        '',
      ],
    ),
    'sphere-fa18': card(
      [
        'Coalition flight',
        'Taiwan Strait thread. The F/A-18 rows share SAMPLE 2nd Coalition Flight with the F-22 rows. Temperate woodland is the auto skin.',
        '',
      ],
      [
        'Fighter stand-in',
        'The public mesh is the CC0 MiG-29 file. The F/A-18 geometry is Mac-local and pending an optimized embed.',
        'stub',
      ],
      [
        'Place on the thread',
        `The training label marks the flight on the strait thread. ${DEFEAT}`,
        '',
      ],
      [
        'Shared pin',
        'Two F/A-18 rows and two F-22 rows. SAMPLE labels only.',
        '',
      ],
    ),
    'sphere-vessel': card(
      [
        'Strait patrol',
        'Taiwan Strait thread. SAMPLE 1st Patrol Squadron. Two Gulf patrol corvette rows. Naval grey. The row does not name a pennant class.',
        '',
      ],
      [
        'Recognition mesh',
        'The public file is the CC0 Gulf patrol corvette. It is not a named navy hull.',
        '',
      ],
      [
        'On the strait track',
        `The training question is whether the patrol is still on the line toward the strait track. ${DEFEAT}`,
        '',
      ],
      [
        'OPFOR group',
        'Higher formation is SAMPLE Taiwan Strait OPFOR Group. Waist fittings on the mesh are SAMPLE placement, not a fitted-weapon assessment.',
        '',
      ],
    ),
    'sphere-soldier': card(
      [
        'Two ground pins',
        'Taiwan Strait thread. The red pin is the SAMPLE coastal section. The blue pin is the SAMPLE coalition ground section. Both are fictional.',
        '',
      ],
      [
        'Soldier file is local',
        'The licensed GLBs stay on the authoring Mac. A missing file keeps the CC0 vehicle stand-in and the simple map marker.',
        'stub',
      ],
      [
        'Ground pin only',
        `The training question is whether the coastal section is still on the line toward the strait track. ${DEFEAT}`,
        '',
      ],
      [
        'One section each',
        'Each pin is one SAMPLE dismount section. Not a table of organization.',
        '',
      ],
    ),
  },
  'korean-peninsula': {
    'sphere-mbt': card(
      [
        'Peninsula armor',
        'Korean Peninsula SAMPLE thread. The red armor platoon uses the CC0 T-72B3 recognition mesh. Temperate woodland is the auto skin. Not a real unit.',
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
    'sphere-fighter': card(
      [
        'Peninsula flight',
        'Korean Peninsula thread. SAMPLE 1st Fighter Flight. The public mesh is the CC0 MiG-29. Temperate woodland is the auto skin.',
        '',
      ],
      [
        'Sensors',
        'SAMPLE stub. Sensors and countermeasures are not in this dataset.',
        'stub',
      ],
      [
        'Named in the flight',
        `The card names the jet in the flight. It does not describe an engagement. ${DEFEAT}`,
        '',
      ],
      [
        'Two-ship SAMPLE row',
        'The pin holds two MiG-29 Fulcrum rows. That count is a SAMPLE label.',
        '',
      ],
    ),
    'sphere-soldier': card(
      [
        'Corridor defense',
        'Korean Peninsula thread. The blue pin is the SAMPLE corridor defense section. The red armor and rocket pins are the OPFOR approach.',
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
  'south-china-sea': {
    'sphere-vessel': card(
      [
        'Craft and screen',
        'South China Sea SAMPLE thread, separate from the Taiwan Strait pins. Red rows are the two craft sections. The blue row is the screen section. The public mesh is the CC0 corvette. Naval grey. The rows do not name a fleet or a reef.',
        '',
      ],
      [
        'Recognition mesh',
        'The corvette file is a stand-in. It is not a fast-craft hull.',
        'stub',
      ],
      [
        'Toward the outpost cluster',
        `The training question is whether the craft sections are still on the lines toward the outpost cluster. ${DEFEAT}`,
        '',
      ],
      [
        'SAMPLE counts',
        'Counts are labels, not an order of battle. The outpost marker is not a named reef.',
        '',
      ],
    ),
    'sphere-soldier': card(
      [
        'Shore section',
        'South China Sea thread. The blue pin is the SAMPLE shore section. Jungle is the auto skin. It is not a real unit.',
        '',
      ],
      [
        'Soldier file is local',
        'The licensed GLBs stay on the authoring Mac. A missing file keeps the CC0 vehicle stand-in and the simple map marker.',
        'stub',
      ],
      [
        'Shore pin only',
        `The training question is whether the shore section is still on the line toward the craft section. ${DEFEAT}`,
        '',
      ],
      [
        'One section',
        'The row is one SAMPLE dismount section. Not a table of organization.',
        '',
      ],
    ),
  },
  'giuk-gap': {
    'sphere-vessel': card(
      [
        'Gap patrol',
        'GIUK Gap SAMPLE thread. SAMPLE 1st Patrol Squadron. Two Gulf patrol corvette rows. Naval grey. The row does not name a pennant class.',
        '',
      ],
      [
        'Recognition mesh',
        'The public file is the CC0 Gulf patrol corvette. It is not a named navy hull.',
        '',
      ],
      [
        'On the transit track',
        `The training question is whether the patrol is still on the line toward the transit track. ${DEFEAT}`,
        '',
      ],
      [
        'OPFOR group',
        'Higher formation is SAMPLE GIUK OPFOR Group. Counts are SAMPLE labels, not a squadron table.',
        '',
      ],
    ),
    'sphere-fighter': card(
      [
        'Coalition flight',
        'GIUK Gap thread. SAMPLE 1st Coalition Flight. The public mesh is the CC0 MiG-29. Arctic is the auto skin on this area. Not a real squadron.',
        '',
      ],
      [
        'Fighter stand-in',
        'The public mesh is the CC0 MiG-29. Sensors are not in this dataset.',
        'stub',
      ],
      [
        'Still on the line',
        `The training question is whether the flight is still on the line toward the patrol. ${DEFEAT}`,
        '',
      ],
      [
        'Two-ship SAMPLE row',
        'The pin holds two MiG-29 Fulcrum rows. That count is a SAMPLE label.',
        '',
      ],
    ),
    'sphere-soldier': card(
      [
        'Picket section',
        'GIUK Gap thread. The blue pin is the SAMPLE picket section. Arctic is the auto skin. It is not a real unit.',
        '',
      ],
      [
        'Soldier file is local',
        'The licensed GLBs stay on the authoring Mac. A missing file keeps the CC0 vehicle stand-in and the simple map marker.',
        'stub',
      ],
      [
        'Picket pin only',
        `The training question is whether the picket is still on the line toward the patrol. ${DEFEAT}`,
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
  'taiwan-strait':
    'Taiwan Strait thread. This card stays its home vignette. This hotspot does not add a new assessment.',
  'korean-peninsula':
    'Korean Peninsula thread. This card stays its home vignette. This hotspot does not add a new assessment.',
  'south-china-sea':
    'South China Sea thread. This card stays its home vignette. This hotspot does not add a new assessment.',
  'giuk-gap':
    'GIUK Gap thread. This card stays its home vignette. This hotspot does not add a new assessment.',
};
