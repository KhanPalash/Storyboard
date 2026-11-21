export type WorkflowStep = 1 | 2 | 3;

export type ArtStyleOption =
  | 'Cinematic Live-Action'
  | '3D Pixar/Disney Animation'
  | 'Anime / Studio Ghibli'
  | 'Realistic Documentary'
  | 'Dark Noir'
  | 'Comic Book / Graphic Novel';

export type AspectRatioOption =
  | '16:9'
  | '9:16'
  | '21:9'
  | '1:1'
  | '4:3'
  | '3:4'
  | '3:2'
  | '2:3';

export type ProviderType = 'gemini' | 'openai-compatible';

export interface EngineSettings {
  provider: ProviderType;
  geminiModel: string;
  openaiBaseUrl: string;
  openaiModel: string;
  openaiApiKey: string;
}

export interface CharacterEntry {
  id: string;
  name: string;
  appearance: string;
}

export interface LocationEntry {
  id: string;
  name: string;
  details: string;
}

export interface StoryBible {
  artStyle: ArtStyleOption;
  customStyleModifier: string;
  aspectRatio: AspectRatioOption;
  characters: CharacterEntry[];
  locations: LocationEntry[];
}

export interface CameraSuggestion {
  id: string;
  label: string;
  shotType: string;
  cameraAngle: string;
  rationale: string;
  videoPrompt: string;
}

export interface SceneCard {
  id: string;
  sceneNumber: number;
  durationSec: number;
  shotType: string;
  cameraAngle?: string;
  voiceover: string;
  imagePrompt: string;
  videoPrompt: string;
  audioNote: string;
  charactersPresent: string[];
  locationName: string;
  previewImageUrl?: string;
  cameraSuggestions?: CameraSuggestion[];
  appliedSuggestionId?: string;
}

export type DirectorRole =
  | 'Cinematographer & Prompt Architect'
  | 'Screenplay & Pacing Doctor'
  | 'Visual Continuity Supervisor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Project {
  id: string;
  title: string;
  updatedAt: string;
  ideaInput: string;
  targetDurationMinutes: number;
  storyScript: string;
  bible: StoryBible;
  scenes: SceneCard[];
  chatHistory: ChatMessage[];
  directorRole: DirectorRole;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone?: 'neutral' | 'success' | 'error';
}
