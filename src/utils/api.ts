import type {
  AspectRatioOption,
  CameraSuggestion,
  CharacterEntry,
  ChatMessage,
  DirectorRole,
  EngineSettings,
  LocationEntry,
  Project,
  SceneCard,
  StoryBible,
} from '../types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function generateFullStoryApi(params: {
  idea: string;
  targetDurationMinutes: number;
  engine: EngineSettings;
}): Promise<{ story: string }> {
  return postJson('/api/ai/story', params);
}

export async function extractStoryBibleApi(params: {
  storyScript: string;
  engine: EngineSettings;
}): Promise<{
  characters: Omit<CharacterEntry, 'id'>[];
  locations: Omit<LocationEntry, 'id'>[];
}> {
  return postJson('/api/ai/extract-bible', params);
}

export async function generateScenesApi(params: {
  storyScript: string;
  targetDurationMinutes: number;
  bible: StoryBible;
  engine: EngineSettings;
}): Promise<{ scenes: Omit<SceneCard, 'id' | 'previewImageUrl'>[] }> {
  return postJson('/api/ai/scenes', params);
}

export async function regenerateSingleSceneApi(params: {
  storyScript: string;
  bible: StoryBible;
  scene: SceneCard;
  prevScene?: SceneCard;
  nextScene?: SceneCard;
  engine: EngineSettings;
}): Promise<{ scene: Omit<SceneCard, 'id' | 'previewImageUrl'> }> {
  return postJson('/api/ai/regenerate-scene', params);
}

export async function suggestCameraOptionsApi(params: {
  storyScript: string;
  bible: StoryBible;
  scene: SceneCard;
  prevScene?: SceneCard;
  nextScene?: SceneCard;
  engine: EngineSettings;
}): Promise<{ suggestions: CameraSuggestion[] }> {
  return postJson('/api/ai/suggest-camera', params);
}

export async function sendDirectorChatApi(params: {
  message: string;
  history: ChatMessage[];
  directorRole: DirectorRole;
  project: Project;
  engine: EngineSettings;
}): Promise<{ reply: string }> {
  return postJson('/api/ai/chat', params);
}

export async function generateSceneImageApi(params: {
  prompt: string;
  aspectRatio: AspectRatioOption;
}): Promise<{ imageUrl: string; appliedAspectRatio: string }> {
  return postJson('/api/ai/generate-image', params);
}
