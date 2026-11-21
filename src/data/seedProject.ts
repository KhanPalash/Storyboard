import type { EngineSettings, Project } from '../types';

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  provider: 'gemini',
  geminiModel: 'gemini-4-hydrogen',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiModel: 'gpt-4o-mini',
  openaiApiKey: '',
};

export function createSeedProject(): Project {
  return {
    id: 'proj_kyoto_rain_demo',
    title: 'The Last Rain in Kyoto',
    updatedAt: new Date().toISOString(),
    ideaInput:
      'A quiet, poetic 1-minute short film set in Kyoto at blue hour. A young archivist brings her late grandfather’s stopped silver pocket watch to a hidden watchmaker in Gion, discovering a hidden portrait inside before stepping out onto the Kamo River bridge at dawn.',
    targetDurationMinutes: 1,
    storyScript: `VOICEOVER (Hana, soft and reflective):
In Kyoto, the autumn rain remembers every footstep we think we have outgrown.

For seven years, my grandfather's silver pocket watch sat silent on my desk—frozen at four-fifteen, the hour the last train left the valley.

Tonight, down a lantern-lit alley in Gion, I finally bring it to Master Kenji's workshop. Beneath a single brass lamp, his weathered fingers lift the engraved casing.

Inside the lid, hidden behind a hairline hinge, rests a faded photograph of two young travelers smiling into the wind.

As the gears catch breath again, Kenji smiles without looking up: "Time does not stop, Hana. It only waits for someone brave enough to wind it."

By dawn on the Kamo River bridge, the rain clears. The watch ticks steadily against my palm—and for the first time in years, the morning feels ahead of me.`,
    bible: {
      artStyle: 'Cinematic Live-Action',
      customStyleModifier:
        '35mm anamorphic lens, Kodak Vision3 500T film grain, Wong Kar-wai and Roger Deakins motivated lighting, natural skin tones, deep shadow roll-off',
      aspectRatio: '16:9',
      characters: [
        {
          id: 'char_hana',
          name: 'Hana Sato',
          appearance:
            '29-year-old Japanese woman, shoulder-length damp dark hair, calm expressive dark eyes, wearing a weathered olive-green belted trench coat over a charcoal knit sweater, carrying a clear vinyl umbrella',
        },
        {
          id: 'char_kenji',
          name: 'Master Kenji',
          appearance:
            '74-year-old Japanese watchmaker with silver cropped hair, gentle lined face, round tortoiseshell eyeglasses with a brass jeweler loupe clipped to the right lens, wearing a dark navy knit pullover under a faded indigo linen work apron',
        },
      ],
      locations: [
        {
          id: 'loc_gion',
          name: 'Gion Rain Alley',
          details:
            'Narrow historic Kyoto wooden machiya alley at blue hour during gentle autumn rain, wet dark cobblestone pavement mirroring warm amber glowing paper lanterns, dark cedar lattice doors and linen noren curtains, soft atmospheric mist',
        },
        {
          id: 'loc_workshop',
          name: 'Kenji’s Antique Watch Workshop',
          details:
            'Intimate clutter-rich wooden clockmaker studio at night, scuffed dark walnut workbench lit by a warm directional brass gooseneck desk lamp, tiny glass vials of brass gears, rain droplets streaking across wooden shoji lattice window behind',
        },
        {
          id: 'loc_bridge',
          name: 'Kamo River Wooden Bridge',
          details:
            'Graceful weathered timber arched footbridge spanning the calm Kamo River at misty dawn just after rain stops, wet planks reflecting pale silver-gold morning light breaking through slate clouds, Kyoto rooftops in hazy distance',
        },
      ],
    },
    scenes: [
      {
        id: 'scene_01',
        sceneNumber: 1,
        durationSec: 7,
        shotType: 'Wide Establishing Shot',
        cameraAngle: 'Low Eye-Level',
        voiceover:
          'In Kyoto, the autumn rain remembers every footstep we think we have outgrown.',
        imagePrompt:
          'Wide Establishing Shot, Low Eye-Level. Hana Sato (29-year-old Japanese woman, shoulder-length damp dark hair, wearing a weathered olive-green belted trench coat over a charcoal knit sweater, holding a clear vinyl umbrella) walks slowly away from camera down Gion Rain Alley (narrow historic Kyoto wooden machiya alley at blue hour during gentle autumn rain, wet dark cobblestone pavement mirroring warm amber glowing paper lanterns, cedar lattice doors, soft atmospheric mist). Visual Style: Cinematic Live-Action, 35mm anamorphic lens, Kodak Vision3 500T film grain, Roger Deakins motivated lighting. --ar 16:9',
        videoPrompt:
          'Slow, meditative forward tracking shot following Hana Sato from behind at walking pace; gentle autumn rain falls through warm amber lantern glow, shimmering reflections ripple across wet cobblestones, subtle mist drifting down the narrow wooden alley.',
        audioNote:
          'Gentle rain pattering on vinyl umbrella, distant muffled wooden footsteps on wet stone, warm solitary cello sustain.',
        charactersPresent: ['Hana Sato'],
        locationName: 'Gion Rain Alley',
        previewImageUrl: '/src/assets/images/scene_kyoto_alley_rain_1795279547991.jpg',
        appliedSuggestionId: 'sug_s1_1',
        cameraSuggestions: [
          {
            id: 'sug_s1_1',
            label: 'Meditative Rear Follow',
            shotType: 'Wide Establishing Shot',
            cameraAngle: 'Low Eye-Level',
            rationale:
              'Establishes solitude and wet cobblestone reflections while drawing the viewer into Hana’s nostalgic voiceover.',
            videoPrompt:
              'Slow, meditative forward tracking shot following Hana Sato from behind at walking pace; gentle autumn rain falls through warm amber lantern glow, shimmering reflections ripple across wet cobblestones, subtle mist drifting down the narrow wooden alley.',
          },
          {
            id: 'sug_s1_2',
            label: 'High-Angle Lantern Geometry',
            shotType: 'High Angle',
            cameraAngle: 'Elevated 3/4 Overhead',
            rationale:
              'Emphasizes the narrow machiya canyon and rhythmic rows of paper lanterns, framing Hana as small against memory and time.',
            videoPrompt:
              'Gradual crane descent from second-story eaves looking down into the glistening alley; rain ribbons cross warm amber lantern halos as Hana’s clear vinyl umbrella glides smoothly across the lower third.',
          },
          {
            id: 'sug_s1_3',
            label: 'Low Reflection Pedestal',
            shotType: 'Medium Shot',
            cameraAngle: 'Worm’s-Eye Angle',
            rationale:
              'Starts near the puddle-mirror pavement to literally echo the line "rain remembers every footstep."',
            videoPrompt:
              'Camera skims inches above wet cobblestones showing inverted amber lanterns before tilting gently upward as Hana’s boots step past a rippling puddle and move down the misty alley.',
          },
        ],
      },
      {
        id: 'scene_02',
        sceneNumber: 2,
        durationSec: 7,
        shotType: 'Medium Shot',
        cameraAngle: 'Eye-Level',
        voiceover:
          'Tonight, down a lantern-lit alley in Gion, I finally bring my grandfather’s silent pocket watch to Master Kenji’s workshop.',
        imagePrompt:
          'Medium Shot, Eye-Level across the workbench. Master Kenji (74-year-old Japanese watchmaker with silver cropped hair, gentle lined face, round tortoiseshell eyeglasses with a brass jeweler loupe clipped to the right lens, wearing a dark navy knit pullover under a faded indigo linen work apron) leans carefully over an open engraved silver pocket watch with fine steel tweezers inside Kenji’s Antique Watch Workshop (intimate wooden clockmaker studio at night, scuffed dark walnut workbench lit by a warm directional brass gooseneck desk lamp, tiny glass vials of brass gears, rain droplets streaking across wooden lattice window behind). Visual Style: Cinematic Live-Action, 35mm anamorphic lens, Kodak Vision3 500T film grain, shallow depth of field. --ar 16:9',
        videoPrompt:
          'Subtle slow dolly-in toward Master Kenji’s hands and concentrated gaze; warm tungsten desk lamp glints off polished brass tools while soft rain streaks slide down the out-of-focus lattice glass in the background.',
        audioNote:
          'Muffled rain outside lattice window, delicate metallic click of jeweler tweezers, quiet ambient wooden workshop hum.',
        charactersPresent: ['Master Kenji'],
        locationName: 'Kenji’s Antique Watch Workshop',
        previewImageUrl: '/src/assets/images/scene_watchmaker_workshop_1795279558203.jpg',
        appliedSuggestionId: 'sug_s2_1',
        cameraSuggestions: [
          {
            id: 'sug_s2_1',
            label: 'Workbench Intimate Dolly',
            shotType: 'Medium Shot',
            cameraAngle: 'Eye-Level',
            rationale:
              'Balances Master Kenji’s focused craftsmanship with the warm brass lamp and rain-streaked shoji window behind him.',
            videoPrompt:
              'Subtle slow dolly-in toward Master Kenji’s hands and concentrated gaze; warm tungsten desk lamp glints off polished brass tools while soft rain streaks slide down the out-of-focus lattice glass in the background.',
          },
          {
            id: 'sug_s2_2',
            label: 'Over-the-Shoulder Craft Reveal',
            shotType: 'Over-the-Shoulder',
            cameraAngle: 'High 3/4 Shoulder Angle',
            rationale:
              'Places the audience beside Kenji’s loupe so we discover the intricate silver watch mechanism from his perspective.',
            videoPrompt:
              'Gentle handheld arc behind Master Kenji’s indigo-aproned shoulder peering down onto the walnut workbench; tweezers hover delicately over exposed golden gears as rain light flickers on the window lattice.',
          },
          {
            id: 'sug_s2_3',
            label: 'Quiet Profile Rack Focus',
            shotType: 'Medium Close-Up',
            cameraAngle: '3/4 Profile Angle',
            rationale:
              'Shifts visual attention from the outer rain to Kenji’s steady expression, underlining shelter and patience.',
            videoPrompt:
              'Locked-off 85mm shallow-focus frame smoothly racking focus from glistening raindrops on the foreground glass vial to Master Kenji’s tortoiseshell glasses and brass loupe under warm tungsten light.',
          },
        ],
      },
      {
        id: 'scene_03',
        sceneNumber: 3,
        durationSec: 8,
        shotType: 'Extreme Close-Up',
        cameraAngle: 'High Macro Angle',
        voiceover:
          'Inside the lid, hidden behind a hairline hinge, rests a faded photograph of two young travelers smiling into the wind. "Time does not stop, Hana. It only waits for someone brave enough to wind it."',
        imagePrompt:
          'Extreme Close-Up, High Macro Angle. Master Kenji’s weathered hands gently hold open an intricately engraved antique silver pocket watch over the dark walnut workbench of Kenji’s Antique Watch Workshop, revealing gleaming golden brass clockwork gears inside the base and a faded black-and-white vintage portrait photograph of a smiling young couple tucked inside the open silver lid, tiny sunlit dust motes drifting through warm amber tungsten desk lamp light. Visual Style: Cinematic Live-Action, 35mm macro cinema lens, Kodak Vision3 500T film grain, ultra-shallow depth of field. --ar 16:9',
        videoPrompt:
          'Micro slow push-in as weathered thumb nudges the engraved silver watch lid slightly wider; golden balance wheel begins ticking smoothly into rhythmic motion, tiny dust particles float lazily through the warm tungsten beam.',
        audioNote:
          'A single crisp mechanical spring click followed by steady, intimate pocket-watch ticking rising gently over sparse piano chords.',
        charactersPresent: ['Master Kenji'],
        locationName: 'Kenji’s Antique Watch Workshop',
        previewImageUrl: '/src/assets/images/scene_pocket_watch_closeup_1795279548415.jpg',
        appliedSuggestionId: 'sug_s3_1',
        cameraSuggestions: [
          {
            id: 'sug_s3_1',
            label: 'Macro Clockwork Awakening',
            shotType: 'Extreme Close-Up',
            cameraAngle: 'High Macro Angle',
            rationale:
              'Highlights both the hidden black-and-white portrait and the exact moment the brass balance wheel springs back to life.',
            videoPrompt:
              'Micro slow push-in as weathered thumb nudges the engraved silver watch lid slightly wider; golden balance wheel begins ticking smoothly into rhythmic motion, tiny dust particles float lazily through the warm tungsten beam.',
          },
          {
            id: 'sug_s3_2',
            label: 'Top-Down Heirloom Reveal',
            shotType: 'Close-Up',
            cameraAngle: 'Overhead / Top-Down',
            rationale:
              'Frames the open pocket watch symmetrically against dark walnut like a timeless museum artifact.',
            videoPrompt:
              'Slow clockwise rotational drift overhead as warm lamp light sweeps gently across the engraved silver filigree, illuminating the vintage portrait inside the lid while tiny brass gears begin turning.',
          },
          {
            id: 'sug_s3_3',
            label: 'Emotional Tilt to Watchmaker',
            shotType: 'Close-Up',
            cameraAngle: 'Low Eye-Level',
            rationale:
              'Connects the ticking heirloom directly to Kenji’s reassuring spoken quote.',
            videoPrompt:
              'Intimate slow tilt up from the open gleaming silver watch held in weathered fingers toward Master Kenji’s soft, knowing smile bathed in warm amber side light, floating dust motes catching the rim.',
          },
        ],
      },
      {
        id: 'scene_04',
        sceneNumber: 4,
        durationSec: 8,
        shotType: 'Tracking Shot',
        cameraAngle: 'Eye-Level',
        voiceover:
          'By dawn on the Kamo River bridge, the rain clears. The watch ticks steadily against my palm—and for the first time in years, the morning feels ahead of me.',
        imagePrompt:
          'Tracking Shot, Eye-Level composed off-center. Hana Sato (29-year-old Japanese woman, shoulder-length damp dark hair, calm reflective expression, wearing a weathered olive-green belted trench coat over a charcoal knit sweater, holding a closed clear vinyl umbrella at her side) pauses at the wooden railing of Kamo River Wooden Bridge (graceful weathered timber arched footbridge spanning the calm Kamo River at misty dawn just after rain stops, wet planks reflecting pale silver-gold morning light breaking through slate clouds, Kyoto rooftops in hazy distance), looking peacefully down at the gleaming silver pocket watch resting in her open palm. Visual Style: Cinematic Live-Action, Leica 35mm cinema aesthetic, Kodak Vision3 500T film grain, cool silver-blue dawn balanced with warm golden horizon break. --ar 16:9',
        videoPrompt:
          'Smooth lateral tracking glide moving gently right along the wet timber bridge railing; dawn mist drifts lazily across the glassy river surface as silver-gold sunlight breaks softly through retreating clouds and Hana lifts her gaze toward the horizon.',
        audioNote:
          'Soft river water flowing beneath wooden pilings, distant morning birdsong, gentle pocket watch tick blending into a warm swelling string resolution.',
        charactersPresent: ['Hana Sato'],
        locationName: 'Kamo River Wooden Bridge',
        previewImageUrl: '/src/assets/images/scene_kyoto_bridge_dawn_1795279547815.jpg',
        appliedSuggestionId: 'sug_s4_1',
        cameraSuggestions: [
          {
            id: 'sug_s4_1',
            label: 'Lateral Horizon Glide',
            shotType: 'Tracking Shot',
            cameraAngle: 'Eye-Level',
            rationale:
              'Opens up negative space ahead of Hana on the bridge, visually mirroring her sense of stepping into the morning.',
            videoPrompt:
              'Smooth lateral tracking glide moving gently right along the wet timber bridge railing; dawn mist drifts lazily across the glassy river surface as silver-gold sunlight breaks softly through retreating clouds and Hana lifts her gaze toward the horizon.',
          },
          {
            id: 'sug_s4_2',
            label: 'Heroic Dawn Low-Angle',
            shotType: 'Medium Close-Up',
            cameraAngle: 'Low Angle',
            rationale:
              'Lifts Hana softly against the clearing silver-gold sky to punctuate emotional release on the final line.',
            videoPrompt:
              'Gentle slow arc around Hana from a subtle low angle as cool morning breeze stirs loose strands of damp dark hair; silver pocket watch glints in her palm as warm golden dawn light kisses the clouds behind her.',
          },
          {
            id: 'sug_s4_3',
            label: 'Poetic Pull-Back Finale',
            shotType: 'Wide Establishing Shot',
            cameraAngle: 'High Angle',
            rationale:
              'Creates a bookend symmetry with Scene 01 while transitioning from enclosed night alley to expansive sunlit river.',
            videoPrompt:
              'Graceful slow backward pull-back along the arched wooden bridge, widening from Hana at the railing to reveal the entire misty Kamo River valley glowing under breaking pale gold sunrise.',
          },
        ],
      },
    ],
    directorRole: 'Cinematographer & Prompt Architect',
    chatHistory: [
      {
        id: 'msg_welcome',
        role: 'model',
        text: 'Welcome to the Director’s Room. I have your current script, Story Bible (Hana Sato, Master Kenji, and 3 Kyoto locations), and 4 storyboard scenes loaded. Ask me to tighten pacing, upgrade lens choices, check continuity, or tailor prompts for Midjourney, Flux, Sora, Veo, or Kling.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function createBlankProject(title: string = 'Untitled Production'): Project {
  return {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    updatedAt: new Date().toISOString(),
    ideaInput: '',
    targetDurationMinutes: 1,
    storyScript: '',
    bible: {
      artStyle: 'Cinematic Live-Action',
      customStyleModifier: '',
      aspectRatio: '16:9',
      characters: [],
      locations: [],
    },
    scenes: [],
    directorRole: 'Cinematographer & Prompt Architect',
    chatHistory: [
      {
        id: `msg_init_${Date.now()}`,
        role: 'model',
        text: 'New production slate ready. Share your premise or paste a rough script in Step 1, or brainstorm visual structure and camera grammar right here.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
