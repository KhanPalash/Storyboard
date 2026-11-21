import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCameraSuggestionToScene,
  calculateTargetSceneCount,
  calculateTargetWordCount,
  composeConsistentImagePrompt,
  countWords,
  deleteSceneAt,
  escapeCsvCell,
  estimateDurationMinutes,
  exportToCsv,
  exportToMarkdown,
  formatTimecode,
  getAspectRatioStyle,
  insertBlankScene,
  parseImportedScriptFile,
  reorderScenes,
  sanitizeProjects,
  totalStoryboardSeconds,
  updateImagePromptFraming,
} from './storyboard';
import type { CameraSuggestion, Project, SceneCard, StoryBible } from '../types';

const sampleBible: StoryBible = {
  artStyle: 'Cinematic Live-Action',
  customStyleModifier: '35mm Kodak Vision3 500T film grain',
  aspectRatio: '16:9',
  characters: [
    {
      id: 'c1',
      name: 'Hana Sato',
      appearance: '29-year-old Japanese woman, shoulder-length damp dark hair, olive trench coat',
    },
  ],
  locations: [
    {
      id: 'l1',
      name: 'Gion Alley',
      appearance: undefined as unknown as string,
      details: 'Narrow wet cobblestone lane, cedar machiya facades, glowing amber paper lanterns',
    } as StoryBible['locations'][number],
  ],
};

const sampleScenes: SceneCard[] = [
  {
    id: 's1',
    sceneNumber: 1,
    durationSec: 6,
    shotType: 'Wide Establishing Shot',
    voiceover: 'In Kyoto, rain remembers every footstep.',
    imagePrompt: 'Hana Sato walking down Gion Alley holding an umbrella.',
    videoPrompt: 'Slow dolly forward down wet cobblestones.',
    audioNote: 'Steady autumn rain on paper umbrellas.',
    charactersPresent: ['Hana Sato'],
    locationName: 'Gion Alley',
  },
  {
    id: 's2',
    sceneNumber: 2,
    durationSec: 7,
    shotType: 'Close-Up',
    voiceover: 'He always kept the broken watch.',
    imagePrompt: 'Close-up of silver pocket watch in weathered hands.',
    videoPrompt: 'Macro push-in with gentle tungsten flicker.',
    audioNote: 'Soft mechanical ticking.',
    charactersPresent: [],
    locationName: 'Workshop',
  },
];

test('word count and 140 WPM pacing calculations', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   one   two\nthree  '), 3);
  assert.equal(calculateTargetWordCount(1), 140);
  assert.equal(calculateTargetWordCount(2.5), 350);
  assert.equal(estimateDurationMinutes(140), 1);
  assert.equal(estimateDurationMinutes(70), 0.5);
});

test('target scene count scales between 5s and 8s per scene', () => {
  const oneMin = calculateTargetSceneCount(1);
  assert.equal(oneMin.min, 7);
  assert.equal(oneMin.max, 12);
  assert.ok(oneMin.recommended >= oneMin.min && oneMin.recommended <= oneMin.max);
});

test('timecode formatting and total storyboard duration', () => {
  assert.equal(totalStoryboardSeconds(sampleScenes), 13);
  assert.equal(formatTimecode(0), '00:00');
  assert.equal(formatTimecode(65), '01:05');
  assert.equal(formatTimecode(125), '02:05');
});

test('reorderScenes moves scenes up/down and renumbers sequentially', () => {
  const movedDown = reorderScenes(sampleScenes, 0, 'down');
  assert.equal(movedDown[0].id, 's2');
  assert.equal(movedDown[0].sceneNumber, 1);
  assert.equal(movedDown[1].id, 's1');
  assert.equal(movedDown[1].sceneNumber, 2);

  // Out of bounds returns unchanged order
  const unchanged = reorderScenes(sampleScenes, 0, 'up');
  assert.equal(unchanged[0].id, 's1');
});

test('insertBlankScene and deleteSceneAt maintain sequential numbering', () => {
  const inserted = insertBlankScene(sampleScenes, 0, sampleBible, () => 'blank_1');
  assert.equal(inserted.length, 3);
  assert.equal(inserted[1].id, 'blank_1');
  assert.equal(inserted[1].sceneNumber, 2);
  assert.equal(inserted[2].sceneNumber, 3);

  const deleted = deleteSceneAt(inserted, 1);
  assert.equal(deleted.length, 2);
  assert.equal(deleted[0].id, 's1');
  assert.equal(deleted[1].id, 's2');
  assert.equal(deleted[1].sceneNumber, 2);
});

test('composeConsistentImagePrompt injects Story Bible characters, locations, style, and aspect ratio', () => {
  const prompt = composeConsistentImagePrompt(sampleScenes[0], sampleBible);
  assert.ok(prompt.includes('Wide Establishing Shot'));
  assert.ok(prompt.includes('29-year-old Japanese woman'));
  assert.ok(prompt.includes('Narrow wet cobblestone lane'));
  assert.ok(prompt.includes('Cinematic Live-Action'));
  assert.ok(prompt.includes('35mm Kodak Vision3 500T'));
  assert.ok(prompt.includes('--ar 16:9'));
});

test('CSV and Markdown exports properly escape quotes and include all columns', () => {
  assert.equal(escapeCsvCell('Hello, "World"'), '"Hello, ""World"""');

  const project: Project = {
    id: 'p1',
    title: 'Test Film',
    updatedAt: '2026-11-21T00:00:00.000Z',
    ideaInput: 'Idea',
    targetDurationMinutes: 1,
    storyScript: 'Script body.',
    bible: sampleBible,
    scenes: sampleScenes,
    chatHistory: [],
    directorRole: 'Cinematographer & Prompt Architect',
  };

  const csv = exportToCsv(project);
  assert.ok(
    csv.startsWith(
      'Scene #,Duration,Shot Type,Camera Angle,Voiceover,Image Prompt,Video Motion Prompt,Audio / SFX Note'
    )
  );
  assert.ok(csv.includes('SCENE 01,6s,Wide Establishing Shot,Eye-Level'));

  const md = exportToMarkdown(project);
  assert.ok(md.includes('# Test Film — Production Storyboard & Prompt Sheet'));
  assert.ok(md.includes('### SCENE 01 · 6s · Wide Establishing Shot'));
  assert.ok(md.includes('Hana Sato'));
});

test('updateImagePromptFraming replaces existing shot lead cleanly without losing Story Bible body', () => {
  const original =
    'Wide Establishing Shot from behind. Hana Sato wears an olive trench coat in Gion Alley. --ar 16:9';
  const updated = updateImagePromptFraming(original, 'Low Angle Close-Up', 'Low Angle');
  assert.equal(
    updated,
    'Low Angle Close-Up, Low Angle. Hana Sato wears an olive trench coat in Gion Alley. --ar 16:9'
  );
});

test('applyCameraSuggestionToScene supports all, shot, and motion modes', () => {
  const suggestion: CameraSuggestion = {
    id: 'sug_1',
    label: 'Intimate Low Push',
    shotType: 'Medium Close-Up',
    cameraAngle: 'Low Angle',
    rationale: 'Elevates emotional resolve while keeping lanterns overhead.',
    videoPrompt: 'Slow 50mm dolly-in from low angle as rain streaks across lens.',
  };

  const allApplied = applyCameraSuggestionToScene(sampleScenes[0], suggestion, 'all');
  assert.equal(allApplied.shotType, 'Medium Close-Up');
  assert.equal(allApplied.cameraAngle, 'Low Angle');
  assert.equal(allApplied.videoPrompt, suggestion.videoPrompt);
  assert.ok(allApplied.imagePrompt.startsWith('Medium Close-Up, Low Angle.'));
  assert.equal(allApplied.appliedSuggestionId, 'sug_1');

  const motionOnly = applyCameraSuggestionToScene(sampleScenes[0], suggestion, 'motion');
  assert.equal(motionOnly.shotType, sampleScenes[0].shotType);
  assert.equal(motionOnly.videoPrompt, suggestion.videoPrompt);

  const shotOnly = applyCameraSuggestionToScene(sampleScenes[0], suggestion, 'shot');
  assert.equal(shotOnly.shotType, 'Medium Close-Up');
  assert.equal(shotOnly.cameraAngle, 'Low Angle');
  assert.equal(shotOnly.videoPrompt, sampleScenes[0].videoPrompt);
});

test('parseImportedScriptFile supports text formats and warns gracefully on docx/pdf', () => {
  const txt = parseImportedScriptFile('script.fountain', 'INT. CAFE - NIGHT\nRain falls.');
  assert.equal(txt.ok, true);
  assert.ok(txt.text?.includes('INT. CAFE'));

  const pdf = parseImportedScriptFile('treatment.pdf', 'binary');
  assert.equal(pdf.ok, false);
  assert.ok(pdf.notice?.includes('.pdf'));

  const docx = parseImportedScriptFile('draft.docx', 'binary');
  assert.equal(docx.ok, false);
  assert.ok(docx.notice?.includes('.docx'));
});

test('getAspectRatioStyle maps all 8 aspect ratios', () => {
  assert.equal(getAspectRatioStyle('21:9'), '21 / 9');
  assert.equal(getAspectRatioStyle('9:16'), '9 / 16');
  assert.equal(getAspectRatioStyle('2:3'), '2 / 3');
  assert.equal(getAspectRatioStyle('3:2'), '3 / 2');
});

test('countWords and sanitizeProjects safely recover from undefined or partial legacy localStorage objects', () => {
  assert.equal(countWords(undefined), 0);
  assert.equal(countWords(null), 0);

  const fallback = (): Project => ({
    id: 'fallback',
    title: 'Seed',
    updatedAt: '2026-11-21T00:00:00.000Z',
    ideaInput: '',
    targetDurationMinutes: 1,
    storyScript: 'Seed script',
    bible: sampleBible,
    scenes: [],
    chatHistory: [],
    directorRole: 'Cinematographer & Prompt Architect',
  });

  // Malformed partial project missing storyScript, bible, scenes, chatHistory
  const recovered = sanitizeProjects([{ id: 'legacy_1', title: 'Old Draft' }], fallback);
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].id, 'legacy_1');
  assert.equal(recovered[0].storyScript, '');
  assert.equal(countWords(recovered[0].storyScript), 0);
  assert.equal(recovered[0].bible.aspectRatio, '16:9');
  assert.deepEqual(recovered[0].scenes, []);

  // Completely invalid payload falls back cleanly
  const fromInvalid = sanitizeProjects({ notAnArray: true }, fallback);
  assert.equal(fromInvalid[0].id, 'fallback');
});
