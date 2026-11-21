import type {
  AspectRatioOption,
  ArtStyleOption,
  CameraSuggestion,
  Project,
  SceneCard,
  StoryBible,
} from '../types';

export const DEFAULT_WPM = 140;

export const ART_STYLES: ArtStyleOption[] = [
  'Cinematic Live-Action',
  '3D Pixar/Disney Animation',
  'Anime / Studio Ghibli',
  'Realistic Documentary',
  'Dark Noir',
  'Comic Book / Graphic Novel',
];

export const ASPECT_RATIOS: {
  value: AspectRatioOption;
  label: string;
  descriptor: string;
  width: number;
  height: number;
}[] = [
  { value: '16:9', label: '16:9', descriptor: 'Widescreen', width: 16, height: 9 },
  { value: '9:16', label: '9:16', descriptor: 'Vertical Reel', width: 9, height: 16 },
  { value: '21:9', label: '21:9', descriptor: 'Cinema 2.39:1', width: 21, height: 9 },
  { value: '1:1', label: '1:1', descriptor: 'Square', width: 1, height: 1 },
  { value: '4:3', label: '4:3', descriptor: 'Classic Academy', width: 4, height: 3 },
  { value: '3:4', label: '3:4', descriptor: 'Portrait', width: 3, height: 4 },
  { value: '3:2', label: '3:2', descriptor: '35mm Still', width: 3, height: 2 },
  { value: '2:3', label: '2:3', descriptor: 'Poster', width: 2, height: 3 },
];

export const SHOT_TYPES: string[] = [
  'Wide Establishing Shot',
  'Medium Shot',
  'Medium Close-Up',
  'Close-Up',
  'Extreme Close-Up',
  'Over-the-Shoulder',
  'Two-Shot',
  'Tracking Shot',
  'Point-of-View (POV)',
  'Aerial / Bird’s-Eye',
];

export const CAMERA_ANGLES: string[] = [
  'Eye-Level',
  'Low Angle',
  'High Angle',
  'Dutch / Tilted Angle',
  'Overhead / Top-Down',
  'Worm’s-Eye Angle',
  'Shoulder-Height Handheld',
  '3/4 Profile Angle',
];

export function countWords(text: string | null | undefined): number {
  if (typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function estimateDurationMinutes(
  wordCount: number,
  wpm: number = DEFAULT_WPM
): number {
  if (wordCount <= 0 || wpm <= 0) return 0;
  return Math.round((wordCount / wpm) * 10) / 10;
}

export function calculateTargetWordCount(
  durationMinutes: number,
  wpm: number = DEFAULT_WPM
): number {
  const safeDuration = Math.max(0.25, durationMinutes);
  return Math.round(safeDuration * wpm);
}

export function calculateTargetSceneCount(durationMinutes: number): {
  min: number;
  max: number;
  recommended: number;
} {
  const totalSeconds = Math.max(15, Math.round(durationMinutes * 60));
  const min = Math.max(3, Math.floor(totalSeconds / 8));
  const max = Math.max(min + 1, Math.ceil(totalSeconds / 5));
  const recommended = Math.max(3, Math.round(totalSeconds / 6.5));
  return { min, max, recommended };
}

export function totalStoryboardSeconds(scenes: SceneCard[] | null | undefined): number {
  if (!Array.isArray(scenes)) return 0;
  return scenes.reduce(
    (sum, s) => sum + (Number.isFinite(s?.durationSec) ? Math.max(1, s.durationSec) : 6),
    0
  );
}

export function formatTimecode(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function renumberScenes(scenes: SceneCard[]): SceneCard[] {
  return scenes.map((scene, idx) => ({
    ...scene,
    sceneNumber: idx + 1,
  }));
}

export function reorderScenes(
  scenes: SceneCard[],
  index: number,
  direction: 'up' | 'down'
): SceneCard[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= scenes.length || targetIndex < 0 || targetIndex >= scenes.length) {
    return scenes;
  }
  const copy = [...scenes];
  const [moved] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, moved);
  return renumberScenes(copy);
}

export function insertBlankScene(
  scenes: SceneCard[],
  afterIndex: number,
  bible: StoryBible,
  idFactory: () => string = () => `scene_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
): SceneCard[] {
  const defaultLoc = bible.locations[0]?.name ?? '';
  const styleLine = [bible.artStyle, bible.customStyleModifier].filter(Boolean).join(', ');
  const blank: SceneCard = {
    id: idFactory(),
    sceneNumber: afterIndex + 2,
    durationSec: 6,
    shotType: 'Medium Shot',
    cameraAngle: 'Eye-Level',
    voiceover: '',
    imagePrompt: `Medium Shot, Eye-Level. ${defaultLoc ? `${defaultLoc}: ${bible.locations[0]?.details}. ` : ''}Style: ${styleLine}. Aspect ratio ${bible.aspectRatio}.`,
    videoPrompt: 'Slow steady push-in, subtle natural ambient motion, 24fps cinematic cadence.',
    audioNote: 'Subtle room tone and understated atmospheric score.',
    charactersPresent: [],
    locationName: defaultLoc,
    cameraSuggestions: [],
  };
  const copy = [...scenes];
  const insertPos = Math.max(0, Math.min(copy.length, afterIndex + 1));
  copy.splice(insertPos, 0, blank);
  return renumberScenes(copy);
}

export function deleteSceneAt(scenes: SceneCard[], index: number): SceneCard[] {
  if (index < 0 || index >= scenes.length) return scenes;
  const copy = scenes.filter((_, idx) => idx !== index);
  return renumberScenes(copy);
}

export function updateImagePromptFraming(
  imagePrompt: string | null | undefined,
  shotType: string | null | undefined,
  cameraAngle?: string
): string {
  const trimmed = typeof imagePrompt === 'string' ? imagePrompt.trim() : '';
  const framingLead = [
    typeof shotType === 'string' ? shotType.trim() : '',
    typeof cameraAngle === 'string' ? cameraAngle.trim() : '',
  ]
    .filter(Boolean)
    .join(', ');
  if (!framingLead) return trimmed;
  if (!trimmed) return `${framingLead}.`;

  // If prompt already begins with a short framing clause (e.g. "Wide Establishing Shot... . "), replace that first clause cleanly
  const firstPeriod = trimmed.indexOf('.');
  if (firstPeriod > 0 && firstPeriod < 85) {
    const firstSentence = trimmed.slice(0, firstPeriod).toLowerCase();
    const looksLikeFraming =
      /(shot|close-up|closeup|angle|eye-level|overhead|pov|tracking|medium|wide|over-the-shoulder|profile|handheld)/i.test(
        firstSentence
      );
    if (looksLikeFraming) {
      const rest = trimmed.slice(firstPeriod + 1).trim();
      return rest ? `${framingLead}. ${rest}` : `${framingLead}.`;
    }
  }

  return `${framingLead}. ${trimmed}`;
}

export function applyCameraSuggestionToScene(
  scene: SceneCard,
  suggestion: CameraSuggestion,
  mode: 'all' | 'shot' | 'motion' = 'all'
): SceneCard {
  const next: SceneCard = { ...scene };

  if (mode === 'all' || mode === 'shot') {
    next.shotType = suggestion.shotType;
    next.cameraAngle = suggestion.cameraAngle;
    next.imagePrompt = updateImagePromptFraming(
      scene.imagePrompt,
      suggestion.shotType,
      suggestion.cameraAngle
    );
  }

  if (mode === 'all' || mode === 'motion') {
    next.videoPrompt = suggestion.videoPrompt;
  }

  next.appliedSuggestionId = suggestion.id;
  return next;
}

export function composeConsistentImagePrompt(
  scene: SceneCard,
  bible: StoryBible
): string {
  const basePrompt = typeof scene.imagePrompt === 'string' ? scene.imagePrompt.trim() : '';
  const voiceoverText = typeof scene.voiceover === 'string' ? scene.voiceover : '';
  const locName = typeof scene.locationName === 'string' ? scene.locationName : '';
  const charsPresent = Array.isArray(scene.charactersPresent) ? scene.charactersPresent : [];
  const segments: string[] = [];

  const framingText = [scene.shotType, scene.cameraAngle].filter(Boolean).join(', ');
  if (
    framingText &&
    scene.shotType &&
    !basePrompt.toLowerCase().includes(scene.shotType.toLowerCase())
  ) {
    segments.push(`${framingText}.`);
  }

  segments.push(basePrompt || 'Cinematic scene composition.');

  // Inject matching characters from Story Bible if missing
  for (const char of bible.characters ?? []) {
    if (!char?.name?.trim() || !char?.appearance?.trim()) continue;
    const mentioned =
      charsPresent.some((c) => typeof c === 'string' && c.toLowerCase() === char.name.toLowerCase()) ||
      basePrompt.toLowerCase().includes(char.name.toLowerCase()) ||
      voiceoverText.toLowerCase().includes(char.name.toLowerCase());
    if (mentioned && !basePrompt.toLowerCase().includes(char.appearance.toLowerCase().slice(0, 24))) {
      segments.push(`${char.name} (${char.appearance.trim()}).`);
    }
  }

  // Inject matching location details from Story Bible if missing
  for (const loc of bible.locations ?? []) {
    if (!loc?.name?.trim() || !loc?.details?.trim()) continue;
    const mentioned =
      locName.toLowerCase() === loc.name.toLowerCase() ||
      basePrompt.toLowerCase().includes(loc.name.toLowerCase());
    if (mentioned && !basePrompt.toLowerCase().includes(loc.details.toLowerCase().slice(0, 24))) {
      segments.push(`Setting — ${loc.name}: ${loc.details.trim()}.`);
    }
  }

  // Ensure art style & custom modifier
  if (!basePrompt.toLowerCase().includes(bible.artStyle.toLowerCase())) {
    segments.push(`Visual Style: ${bible.artStyle}.`);
  }
  if (
    bible.customStyleModifier.trim() &&
    !basePrompt.toLowerCase().includes(bible.customStyleModifier.trim().toLowerCase().slice(0, 20))
  ) {
    segments.push(`${bible.customStyleModifier.trim()}.`);
  }

  // Ensure aspect ratio marker
  const ratioToken = bible.aspectRatio === '21:9' ? '21:9 (2.39:1 anamorphic)' : bible.aspectRatio;
  if (!basePrompt.includes(bible.aspectRatio)) {
    segments.push(`--ar ${ratioToken}`);
  }

  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

export function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(project: Project): string {
  const headers = [
    'Scene #',
    'Duration',
    'Shot Type',
    'Camera Angle',
    'Voiceover',
    'Image Prompt',
    'Video Motion Prompt',
    'Audio / SFX Note',
  ];
  const rows = project.scenes.map((scene) => [
    `SCENE ${String(scene.sceneNumber).padStart(2, '0')}`,
    `${scene.durationSec}s`,
    scene.shotType,
    scene.cameraAngle || 'Eye-Level',
    scene.voiceover,
    scene.imagePrompt,
    scene.videoPrompt,
    scene.audioNote,
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

export function exportToMarkdown(project: Project): string {
  const totalSec = totalStoryboardSeconds(project.scenes);
  const lines: string[] = [
    `# ${project.title} — Production Storyboard & Prompt Sheet`,
    '',
    `- **Art Style:** ${project.bible.artStyle}${project.bible.customStyleModifier ? ` (${project.bible.customStyleModifier})` : ''}`,
    `- **Aspect Ratio:** ${project.bible.aspectRatio}`,
    `- **Total Scenes:** ${project.scenes.length} · **Estimated Runtime:** ${formatTimecode(totalSec)} (${totalSec}s)`,
    '',
    '## Story Bible — Characters',
    '',
  ];

  if (project.bible.characters.length === 0) {
    lines.push('_No characters locked._', '');
  } else {
    for (const c of project.bible.characters) {
      lines.push(`- **${c.name}:** ${c.appearance}`);
    }
    lines.push('');
  }

  lines.push('## Story Bible — Locations', '');
  if (project.bible.locations.length === 0) {
    lines.push('_No locations locked._', '');
  } else {
    for (const l of project.bible.locations) {
      lines.push(`- **${l.name}:** ${l.details}`);
    }
    lines.push('');
  }

  lines.push(
    '## Full Script',
    '',
    (typeof project.storyScript === 'string' ? project.storyScript.trim() : '') || '_No script text._',
    ''
  );
  lines.push('## Scene Breakdown & Prompts', '');

  for (const scene of project.scenes ?? []) {
    const angleSegment = scene.cameraAngle ? ` · ${scene.cameraAngle}` : '';
    lines.push(
      `### SCENE ${String(scene.sceneNumber).padStart(2, '0')} · ${scene.durationSec}s · ${scene.shotType}${angleSegment}`,
      '',
      `**Voiceover / Dialogue:**`,
      `> ${scene.voiceover || '(Silent beat)'}`,
      '',
      `**Image Generation Prompt:**`,
      '```text',
      scene.imagePrompt || '',
      '```',
      '',
      `**Video Animation / Motion Prompt:**`,
      '```text',
      scene.videoPrompt || '',
      '```',
      '',
      `**Audio / SFX Note:** ${scene.audioNote || 'None'}`,
      '',
      '---',
      ''
    );
  }

  return lines.join('\n');
}

export function parseImportedScriptFile(
  fileName: string,
  content: string
): { ok: boolean; text?: string; notice?: string } {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.docx') || lower.endsWith('.pdf')) {
    return {
      ok: false,
      notice: `Direct binary parsing for ${lower.endsWith('.pdf') ? '.pdf' : '.docx'} files requires external conversion. Please copy the text from your document and paste it directly into the Story Editor below, or export your script as .txt, .md, or .fountain.`,
    };
  }

  if (
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.fountain') ||
    lower.endsWith('.markdown')
  ) {
    const cleaned = (typeof content === 'string' ? content : '').replace(/\r\n/g, '\n').trim();
    if (!cleaned) {
      return {
        ok: false,
        notice: 'The imported file appears to be empty.',
      };
    }
    return { ok: true, text: cleaned };
  }

  return {
    ok: false,
    notice: `Unsupported file type "${fileName}". Upload a .txt, .md, or .fountain file, or paste your script directly.`,
  };
}

export function getAspectRatioStyle(ratio: AspectRatioOption): string {
  const map: Record<AspectRatioOption, string> = {
    '16:9': '16 / 9',
    '9:16': '9 / 16',
    '21:9': '21 / 9',
    '1:1': '1 / 1',
    '4:3': '4 / 3',
    '3:4': '3 / 4',
    '3:2': '3 / 2',
    '2:3': '2 / 3',
  };
  return map[ratio] ?? '16 / 9';
}

const VALID_ART_STYLES = new Set<string>(ART_STYLES);
const VALID_ASPECT_RATIOS = new Set<string>(ASPECT_RATIOS.map((a) => a.value));
const VALID_DIRECTOR_ROLES = new Set<string>([
  'Cinematographer & Prompt Architect',
  'Screenplay & Pacing Doctor',
  'Visual Continuity Supervisor',
]);

export function sanitizeProject(raw: unknown, index: number = 0): Project | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const rawBible = (r.bible && typeof r.bible === 'object' ? r.bible : {}) as Record<
    string,
    unknown
  >;

  const artStyle =
    typeof rawBible.artStyle === 'string' && VALID_ART_STYLES.has(rawBible.artStyle)
      ? (rawBible.artStyle as ArtStyleOption)
      : 'Cinematic Live-Action';

  const aspectRatio =
    typeof rawBible.aspectRatio === 'string' && VALID_ASPECT_RATIOS.has(rawBible.aspectRatio)
      ? (rawBible.aspectRatio as AspectRatioOption)
      : '16:9';

  const characters = Array.isArray(rawBible.characters)
    ? rawBible.characters
        .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
        .map((c, idx) => ({
          id: typeof c.id === 'string' && c.id ? c.id : `char_${index}_${idx}`,
          name: typeof c.name === 'string' ? c.name : '',
          appearance: typeof c.appearance === 'string' ? c.appearance : '',
        }))
    : [];

  const locations = Array.isArray(rawBible.locations)
    ? rawBible.locations
        .filter((l): l is Record<string, unknown> => Boolean(l && typeof l === 'object'))
        .map((l, idx) => ({
          id: typeof l.id === 'string' && l.id ? l.id : `loc_${index}_${idx}`,
          name: typeof l.name === 'string' ? l.name : '',
          details: typeof l.details === 'string' ? l.details : '',
        }))
    : [];

  const scenes: SceneCard[] = Array.isArray(r.scenes)
    ? renumberScenes(
        r.scenes
          .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
          .map((s, idx) => ({
            id: typeof s.id === 'string' && s.id ? s.id : `scene_${index}_${idx}`,
            sceneNumber: idx + 1,
            durationSec:
              typeof s.durationSec === 'number' && Number.isFinite(s.durationSec) && s.durationSec > 0
                ? s.durationSec
                : 6,
            shotType: typeof s.shotType === 'string' ? s.shotType : 'Medium Shot',
            cameraAngle: typeof s.cameraAngle === 'string' ? s.cameraAngle : 'Eye-Level',
            voiceover: typeof s.voiceover === 'string' ? s.voiceover : '',
            imagePrompt: typeof s.imagePrompt === 'string' ? s.imagePrompt : '',
            videoPrompt: typeof s.videoPrompt === 'string' ? s.videoPrompt : '',
            audioNote: typeof s.audioNote === 'string' ? s.audioNote : '',
            charactersPresent: Array.isArray(s.charactersPresent)
              ? s.charactersPresent.filter((c): c is string => typeof c === 'string')
              : [],
            locationName: typeof s.locationName === 'string' ? s.locationName : '',
            previewImageUrl: typeof s.previewImageUrl === 'string' ? s.previewImageUrl : undefined,
            appliedSuggestionId:
              typeof s.appliedSuggestionId === 'string' ? s.appliedSuggestionId : undefined,
            cameraSuggestions: Array.isArray(s.cameraSuggestions)
              ? s.cameraSuggestions
                  .filter((opt): opt is Record<string, unknown> => Boolean(opt && typeof opt === 'object'))
                  .map((opt, optIdx) => ({
                    id: typeof opt.id === 'string' && opt.id ? opt.id : `sug_${idx}_${optIdx}`,
                    label: typeof opt.label === 'string' ? opt.label : `Option ${optIdx + 1}`,
                    shotType: typeof opt.shotType === 'string' ? opt.shotType : 'Medium Shot',
                    cameraAngle: typeof opt.cameraAngle === 'string' ? opt.cameraAngle : 'Eye-Level',
                    rationale: typeof opt.rationale === 'string' ? opt.rationale : '',
                    videoPrompt: typeof opt.videoPrompt === 'string' ? opt.videoPrompt : '',
                  }))
              : [],
          }))
      )
    : [];

  const chatHistory = Array.isArray(r.chatHistory)
    ? r.chatHistory
        .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object'))
        .map((m, idx) => ({
          id: typeof m.id === 'string' && m.id ? m.id : `msg_${index}_${idx}`,
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: typeof m.text === 'string' ? m.text : '',
          timestamp:
            typeof m.timestamp === 'string' ? m.timestamp : new Date().toISOString(),
        }))
    : [];

  const targetDurationMinutes =
    typeof r.targetDurationMinutes === 'number' &&
    Number.isFinite(r.targetDurationMinutes) &&
    r.targetDurationMinutes > 0
      ? r.targetDurationMinutes
      : 1;

  return {
    id: typeof r.id === 'string' && r.id ? r.id : `proj_recovered_${index}`,
    title: typeof r.title === 'string' ? r.title : 'Untitled Production',
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
    ideaInput: typeof r.ideaInput === 'string' ? r.ideaInput : '',
    targetDurationMinutes,
    storyScript: typeof r.storyScript === 'string' ? r.storyScript : '',
    bible: {
      artStyle,
      customStyleModifier:
        typeof rawBible.customStyleModifier === 'string' ? rawBible.customStyleModifier : '',
      aspectRatio,
      characters,
      locations,
    },
    scenes,
    chatHistory,
    directorRole:
      typeof r.directorRole === 'string' && VALID_DIRECTOR_ROLES.has(r.directorRole)
        ? (r.directorRole as Project['directorRole'])
        : 'Cinematographer & Prompt Architect',
  };
}

export function sanitizeProjects(raw: unknown, fallbackFactory: () => Project): Project[] {
  if (!Array.isArray(raw)) return [fallbackFactory()];
  const cleaned = raw
    .map((item, idx) => sanitizeProject(item, idx))
    .filter((p): p is Project => p !== null);
  return cleaned.length > 0 ? cleaned : [fallbackFactory()];
}
