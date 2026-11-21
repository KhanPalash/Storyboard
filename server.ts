import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  AspectRatioOption,
  CameraSuggestion,
  ChatMessage,
  DirectorRole,
  EngineSettings,
  Project,
  SceneCard,
  StoryBible,
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '4mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Add your key in Settings > Secrets, or switch Engine Settings to an OpenAI-compatible provider.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function resolveGeminiModel(requested?: string): string {
  const trimmed = (requested || '').trim();
  const prohibited = new Set([
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-2.0-flash',
    'gemini-2.0-pro',
    'gemini-2.0-flash-thinking',
  ]);
  if (!trimmed || prohibited.has(trimmed)) {
    return 'gemini-4-hydrogen';
  }
  return trimmed;
}

function extractReadableMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) return String(parsed.error.message);
    if (parsed?.message) return String(parsed.message);
  } catch {
    // Not JSON
  }
  return raw;
}

function formatUpstreamError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const readable = extractReadableMessage(raw);
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('403')) {
    return {
      status: 403,
      message:
        'Gemini API access denied or key invalid. Check your API key in Settings > Secrets (or switch to a compatible provider in Engine Settings).',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429') || raw.includes('quota')) {
    return {
      status: 429,
      message:
        'API quota reached or paid billing required for this model. Check your key in Settings > Secrets or try gemini-4-hydrogen / gemini-3.1-flash-lite.',
    };
  }
  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return {
      status: 503,
      message:
        'Gemini is experiencing temporary high demand. Please retry in a few seconds or select gemini-3.1-flash-lite in API Settings.',
    };
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return {
      status: 404,
      message: `Requested model was not found (${readable}). Try gemini-4-hydrogen or gemini-3.1-flash-lite in API Settings.`,
    };
  }
  return { status: 500, message: readable || 'Unexpected server error while calling AI engine.' };
}

async function withGeminiRetry<T>(
  primaryModel: string,
  fn: (modelName: string) => Promise<T>
): Promise<T> {
  const attempts = [primaryModel, primaryModel, 'gemini-3.1-flash-lite'];
  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    try {
      return await fn(attempts[i]);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
      if (!isTransient || i === attempts.length - 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

async function callOpenAiCompatible(
  engine: EngineSettings,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  expectJson: boolean = false
): Promise<string> {
  const baseUrl = (engine.openaiBaseUrl || '').trim().replace(/\/+$/, '');
  const model = (engine.openaiModel || '').trim();
  const apiKey = (engine.openaiApiKey || '').trim();

  if (!baseUrl) {
    throw new Error('OpenAI-compatible Base URL is required in Engine Settings.');
  }
  if (!model) {
    throw new Error('Model name is required in Engine Settings.');
  }
  if (!apiKey) {
    throw new Error('API Key is required for OpenAI-compatible endpoints in Engine Settings.');
  }

  const payload: Record<string, unknown> = {
    model,
    messages,
  };
  if (expectJson) {
    payload.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errMsg = data?.error?.message || `Provider returned HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Provider returned an empty response.');
  }
  return text;
}

function extractJsonObject(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned);
}

// 1. Generate Full Story / Screenplay (~140 WPM)
app.post('/api/ai/story', async (req, res) => {
  try {
    const { idea, targetDurationMinutes, engine } = req.body as {
      idea: string;
      targetDurationMinutes: number;
      engine: EngineSettings;
    };

    if (!idea || !idea.trim()) {
      return res.status(400).json({ error: 'Please provide a story idea or context first.' });
    }

    const duration = Math.max(0.25, Number(targetDurationMinutes) || 1);
    const targetWords = Math.round(duration * 140);

    const systemInstruction = `You are an award-winning screenwriter and narrative director. Write a cohesive, vivid, visual-first short film script / narration paced at approximately 140 words per minute. Aim closely for ${targetWords} words total (for a ${duration}-minute video). Include concrete sensory details, distinct named characters, clear visual locations, and evocative spoken voiceover or dialogue. Output only the clean script text without markdown fences or commentary.`;

    const userPrompt = `Write a complete ${duration}-minute script (~${targetWords} words) based on this concept:\n\n${idea.trim()}`;

    if (engine?.provider === 'openai-compatible') {
      const story = await callOpenAiCompatible(engine, [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ]);
      return res.json({ story: story.trim() });
    }

    const ai = getGeminiClient();
    const model = resolveGeminiModel(engine?.geminiModel);
    const response = await withGeminiRetry(model, (m) =>
      ai.models.generateContent({
        model: m,
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      })
    );

    const story = (response.text ?? '').trim();
    if (!story) {
      return res.status(502).json({ error: 'Model returned an empty script.' });
    }
    return res.json({ story });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

// 2. Auto-Extract Characters & Locations Story Bible
app.post('/api/ai/extract-bible', async (req, res) => {
  try {
    const { storyScript, engine } = req.body as {
      storyScript: string;
      engine: EngineSettings;
    };

    if (!storyScript || !storyScript.trim()) {
      return res.status(400).json({ error: 'Add or generate a story script in Step 1 before extracting the Story Bible.' });
    }

    const systemInstruction = `You are a film production designer and visual continuity supervisor. Extract every key character and distinct physical location from the script. For each character, write a concrete, specific visual appearance description (exact age, ethnicity/build if implied, facial features, hair style/color, exact wardrobe garments, colors, signature props — zero vague words). For each location, write rich environmental and lighting details (architecture, materials, time of day, weather, color temperature, key props).`;

    const userPrompt = `Analyze this script and extract its Story Bible (characters and locations):\n\n${storyScript.trim()}`;

    if (engine?.provider === 'openai-compatible') {
      const raw = await callOpenAiCompatible(
        engine,
        [
          {
            role: 'system',
            content: `${systemInstruction} Return strict JSON with shape: {"characters":[{"name":"","appearance":""}],"locations":[{"name":"","details":""}]}`,
          },
          { role: 'user', content: userPrompt },
        ],
        true
      );
      const parsed = extractJsonObject(raw) as {
        characters?: { name: string; appearance: string }[];
        locations?: { name: string; details: string }[];
      };
      return res.json({
        characters: Array.isArray(parsed.characters) ? parsed.characters : [],
        locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      });
    }

    const ai = getGeminiClient();
    const model = resolveGeminiModel(engine?.geminiModel);
    const response = await withGeminiRetry(model, (m) =>
      ai.models.generateContent({
        model: m,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    appearance: { type: Type.STRING },
                  },
                  required: ['name', 'appearance'],
                },
              },
              locations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                  required: ['name', 'details'],
                },
              },
            },
            required: ['characters', 'locations'],
          },
        },
      })
    );

    const parsed = extractJsonObject(response.text ?? '{}') as {
      characters?: { name: string; appearance: string }[];
      locations?: { name: string; details: string }[];
    };
    return res.json({
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
    });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

// 3. Generate Full Sequential Scene Breakdown & Prompts
app.post('/api/ai/scenes', async (req, res) => {
  try {
    const { storyScript, targetDurationMinutes, bible, engine } = req.body as {
      storyScript: string;
      targetDurationMinutes: number;
      bible: StoryBible;
      engine: EngineSettings;
    };

    if (!storyScript || !storyScript.trim()) {
      return res.status(400).json({ error: 'Story script is required to generate scene prompts.' });
    }

    const duration = Math.max(0.25, Number(targetDurationMinutes) || 1);
    const totalSec = Math.round(duration * 60);
    const recommendedScenes = Math.max(4, Math.min(24, Math.round(totalSec / 6.5)));

    const charactersBlock =
      bible.characters.length > 0
        ? bible.characters.map((c) => `- ${c.name}: ${c.appearance}`).join('\n')
        : 'None explicitly locked — maintain consistent character appearance across all scenes.';
    const locationsBlock =
      bible.locations.length > 0
        ? bible.locations.map((l) => `- ${l.name}: ${l.details}`).join('\n')
        : 'None explicitly locked — maintain consistent setting and lighting details across all scenes.';

    const styleSpec = [bible.artStyle, bible.customStyleModifier].filter(Boolean).join(', ');
    const aspectSpec = bible.aspectRatio === '21:9' ? '21:9 (2.39:1 anamorphic)' : bible.aspectRatio;

    const systemInstruction = `You are a master Cinematographer and AI Prompt Architect crafting production-ready prompts for Midjourney, Flux, Sora, Veo, Kling, and Runway.

CRITICAL CONTINUITY RULE:
Whenever a Character or Location from the Story Bible appears in a scene, you MUST embed their EXACT visual description verbatim inside that scene's "imagePrompt" so external AI image generators maintain rock-solid character and environment consistency across every frame. Never use vague pronouns like "he", "she", or "the room" without restating the locked visual details.

Every "imagePrompt" MUST include:
1. Shot type & camera framing
2. Concrete visual action & subject expression
3. Exact Character Bible visual description(s) for characters in frame
4. Exact Location Bible environment & lighting details
5. Global Art Style (${styleSpec}) and Aspect Ratio marker (--ar ${aspectSpec})

Every "videoPrompt" MUST specify:
- Explicit camera movement (e.g., slow dolly-in, lateral tracking shot, locked-off static, handheld pan)
- Concrete subject motion
- Subtle ambient/environmental motion (rain, wind, dust, light flicker)

Break the script into approximately ${recommendedScenes} sequential scenes (each 5 to 8 seconds long, summing near ${totalSec}s).`;

    const userPrompt = `STORY BIBLE:
Art Style: ${styleSpec}
Aspect Ratio: ${aspectSpec}

Characters:
${charactersBlock}

Locations:
${locationsBlock}

FULL SCRIPT:
${storyScript.trim()}

Generate the sequential storyboard scenes now.`;

    if (engine?.provider === 'openai-compatible') {
      const raw = await callOpenAiCompatible(
        engine,
        [
          {
            role: 'system',
            content: `${systemInstruction}\nAlso include 3 distinct cinematography alternatives per scene in "cameraSuggestions" (each with id, label, shotType, cameraAngle, rationale, videoPrompt).\nReturn strict JSON: {"scenes":[{"sceneNumber":1,"durationSec":6,"shotType":"","cameraAngle":"","voiceover":"","imagePrompt":"","videoPrompt":"","audioNote":"","charactersPresent":[""],"locationName":"","cameraSuggestions":[{"id":"opt_1","label":"","shotType":"","cameraAngle":"","rationale":"","videoPrompt":""}]}]}`,
          },
          { role: 'user', content: userPrompt },
        ],
        true
      );
      const parsed = extractJsonObject(raw) as { scenes?: Omit<SceneCard, 'id'>[] };
      return res.json({ scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [] });
    }

    const ai = getGeminiClient();
    const model = resolveGeminiModel(engine?.geminiModel);
    const response = await withGeminiRetry(model, (m) =>
      ai.models.generateContent({
        model: m,
        contents: userPrompt,
        config: {
          systemInstruction: `${systemInstruction}\nFor EVERY scene, also generate "cameraAngle" and 3 distinct "cameraSuggestions" options offering contrasting shot types, camera angles, concise director rationales, and tailored Image-to-Video animation/motion prompts.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.INTEGER },
                    durationSec: { type: Type.INTEGER },
                    shotType: { type: Type.STRING },
                    cameraAngle: { type: Type.STRING },
                    voiceover: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                    videoPrompt: { type: Type.STRING },
                    audioNote: { type: Type.STRING },
                    charactersPresent: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    locationName: { type: Type.STRING },
                    cameraSuggestions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING },
                          shotType: { type: Type.STRING },
                          cameraAngle: { type: Type.STRING },
                          rationale: { type: Type.STRING },
                          videoPrompt: { type: Type.STRING },
                        },
                        required: [
                          'id',
                          'label',
                          'shotType',
                          'cameraAngle',
                          'rationale',
                          'videoPrompt',
                        ],
                      },
                    },
                  },
                  required: [
                    'sceneNumber',
                    'durationSec',
                    'shotType',
                    'cameraAngle',
                    'voiceover',
                    'imagePrompt',
                    'videoPrompt',
                    'audioNote',
                    'charactersPresent',
                    'locationName',
                    'cameraSuggestions',
                  ],
                },
              },
            },
            required: ['scenes'],
          },
        },
      })
    );

    const parsed = extractJsonObject(response.text ?? '{}') as { scenes?: Omit<SceneCard, 'id'>[] };
    return res.json({ scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [] });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

// 4. Regenerate Single Scene while keeping neighbors intact
app.post('/api/ai/regenerate-scene', async (req, res) => {
  try {
    const { storyScript, bible, scene, prevScene, nextScene, engine } = req.body as {
      storyScript: string;
      bible: StoryBible;
      scene: SceneCard;
      prevScene?: SceneCard;
      nextScene?: SceneCard;
      engine: EngineSettings;
    };

    const styleSpec = [bible.artStyle, bible.customStyleModifier].filter(Boolean).join(', ');
    const aspectSpec = bible.aspectRatio === '21:9' ? '21:9 (2.39:1 anamorphic)' : bible.aspectRatio;
    const charactersBlock = bible.characters.map((c) => `- ${c.name}: ${c.appearance}`).join('\n') || 'None';
    const locationsBlock = bible.locations.map((l) => `- ${l.name}: ${l.details}`).join('\n') || 'None';

    const systemInstruction = `You are a Cinematographer & Prompt Architect rewriting ONLY Scene ${scene.sceneNumber} to offer a fresher, stronger visual composition and motion choreography while seamlessly matching the preceding and following scenes and strictly injecting exact Story Bible descriptions for characters, locations, style (${styleSpec}), and aspect ratio (--ar ${aspectSpec}).`;

    const userPrompt = `STORY BIBLE:
Art Style: ${styleSpec}
Aspect Ratio: ${aspectSpec}
Characters:\n${charactersBlock}
Locations:\n${locationsBlock}

PREVIOUS SCENE: ${prevScene ? `Scene ${prevScene.sceneNumber} (${prevScene.shotType}): ${prevScene.voiceover}` : 'None (Opening Scene)'}
CURRENT SCENE TO REIMAGINE (Scene ${scene.sceneNumber}, ${scene.durationSec}s):
Voiceover: ${scene.voiceover}
Current Shot Type: ${scene.shotType}
Current Image Prompt: ${scene.imagePrompt}
NEXT SCENE: ${nextScene ? `Scene ${nextScene.sceneNumber} (${nextScene.shotType}): ${nextScene.voiceover}` : 'None (Closing Scene)'}

SCRIPT CONTEXT:
${storyScript.slice(0, 1500)}

Rewrite Scene ${scene.sceneNumber} with elevated cinematic framing, verbatim Story Bible details, and vivid motion direction.`;

    if (engine?.provider === 'openai-compatible') {
      const raw = await callOpenAiCompatible(
        engine,
        [
          {
            role: 'system',
            content: `${systemInstruction}\nInclude "cameraAngle" and 3 distinct cinematography alternatives in "cameraSuggestions".\nReturn strict JSON: {"sceneNumber":${scene.sceneNumber},"durationSec":6,"shotType":"","cameraAngle":"","voiceover":"","imagePrompt":"","videoPrompt":"","audioNote":"","charactersPresent":[""],"locationName":"","cameraSuggestions":[{"id":"opt_1","label":"","shotType":"","cameraAngle":"","rationale":"","videoPrompt":""}]}`,
          },
          { role: 'user', content: userPrompt },
        ],
        true
      );
      const parsed = extractJsonObject(raw) as Omit<SceneCard, 'id'>;
      return res.json({ scene: { ...parsed, sceneNumber: scene.sceneNumber } });
    }

    const ai = getGeminiClient();
    const model = resolveGeminiModel(engine?.geminiModel);
    const response = await withGeminiRetry(model, (m) =>
      ai.models.generateContent({
        model: m,
        contents: userPrompt,
        config: {
          systemInstruction: `${systemInstruction}\nAlso include "cameraAngle" and 3 distinct "cameraSuggestions" options with contrasting shot types, camera angles, director rationales, and tailored video motion prompts.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.INTEGER },
              durationSec: { type: Type.INTEGER },
              shotType: { type: Type.STRING },
              cameraAngle: { type: Type.STRING },
              voiceover: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
              videoPrompt: { type: Type.STRING },
              audioNote: { type: Type.STRING },
              charactersPresent: { type: Type.ARRAY, items: { type: Type.STRING } },
              locationName: { type: Type.STRING },
              cameraSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    shotType: { type: Type.STRING },
                    cameraAngle: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    videoPrompt: { type: Type.STRING },
                  },
                  required: ['id', 'label', 'shotType', 'cameraAngle', 'rationale', 'videoPrompt'],
                },
              },
            },
            required: [
              'sceneNumber',
              'durationSec',
              'shotType',
              'cameraAngle',
              'voiceover',
              'imagePrompt',
              'videoPrompt',
              'audioNote',
              'charactersPresent',
              'locationName',
              'cameraSuggestions',
            ],
          },
        },
      })
    );

    const parsed = extractJsonObject(response.text ?? '{}') as Omit<SceneCard, 'id'>;
    return res.json({ scene: { ...parsed, sceneNumber: scene.sceneNumber } });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

// 4b. Analyze Scene Action & Dialogue -> Suggest Shot Types, Camera Angles & Video Motion Prompts
app.post('/api/ai/suggest-camera', async (req, res) => {
  try {
    const { storyScript, bible, scene, prevScene, nextScene, engine } = req.body as {
      storyScript: string;
      bible: StoryBible;
      scene: SceneCard;
      prevScene?: SceneCard;
      nextScene?: SceneCard;
      engine: EngineSettings;
    };

    const actionContext = [scene.voiceover, scene.imagePrompt].filter((s) => s && s.trim()).join('\n');
    if (!actionContext) {
      return res.status(400).json({
        error: 'Add voiceover dialogue or a visual description to this scene before analyzing camera options.',
      });
    }

    const styleSpec = [bible.artStyle, bible.customStyleModifier].filter(Boolean).join(', ');
    const systemInstruction = `You are a Director of Photography and Motion Prompt Architect. Analyze the selected scene's dialogue/voiceover, visual action, and surrounding story beat to propose exactly 3 DISTINCT cinematography treatments.

Each treatment MUST provide:
- "label": Short evocative 2-4 word name (e.g., "Intimate Dolly Reveal", "Low-Angle Power Frame", "Observational Lateral Track")
- "shotType": Clear standard shot size (e.g., "Wide Establishing Shot", "Medium Close-Up", "Over-the-Shoulder", "Extreme Close-Up", "Tracking Shot")
- "cameraAngle": Distinct camera height/angle (e.g., "Eye-Level", "Low Angle", "High Angle", "Overhead / Top-Down", "Dutch / Tilted Angle", "3/4 Profile Angle")
- "rationale": One crisp sentence explaining why this framing elevates this specific dialogue and dramatic action
- "videoPrompt": A concrete, production-ready Image-to-Video animation & camera movement prompt tailored for Sora, Veo, Kling, and Runway (camera move + subject motion + ambient environmental motion)

Make the 3 options genuinely varied in scale, angle, and camera energy so the filmmaker has real creative choices.`;

    const userPrompt = `STYLE & FORMAT: ${styleSpec} (${bible.aspectRatio})
PREVIOUS SCENE: ${prevScene ? `Scene ${prevScene.sceneNumber} (${prevScene.shotType}, ${prevScene.cameraAngle || 'Eye-Level'}): ${prevScene.voiceover}` : 'Opening scene'}
SELECTED SCENE (Scene ${scene.sceneNumber}, ${scene.durationSec}s):
Voiceover / Dialogue: ${scene.voiceover || '(Silent visual beat)'}
Current Visual Action / Image Prompt: ${scene.imagePrompt || '(None)'}
Current Shot & Angle: ${scene.shotType}${scene.cameraAngle ? ` · ${scene.cameraAngle}` : ''}
NEXT SCENE: ${nextScene ? `Scene ${nextScene.sceneNumber} (${nextScene.shotType}, ${nextScene.cameraAngle || 'Eye-Level'}): ${nextScene.voiceover}` : 'Closing scene'}
STORY CONTEXT: ${(storyScript || '').slice(0, 800)}

Suggest 3 tailored shot type, camera angle, and video animation/motion prompt options for Scene ${scene.sceneNumber}.`;

    if (engine?.provider === 'openai-compatible') {
      const raw = await callOpenAiCompatible(
        engine,
        [
          {
            role: 'system',
            content: `${systemInstruction}\nReturn strict JSON: {"suggestions":[{"id":"opt_1","label":"","shotType":"","cameraAngle":"","rationale":"","videoPrompt":""}]}`,
          },
          { role: 'user', content: userPrompt },
        ],
        true
      );
      const parsed = extractJsonObject(raw) as { suggestions?: CameraSuggestion[] };
      const normalized = (Array.isArray(parsed.suggestions) ? parsed.suggestions : []).map(
        (item, idx) => ({
          ...item,
          id: item.id || `sug_${Date.now()}_${idx}`,
        })
      );
      return res.json({ suggestions: normalized });
    }

    const ai = getGeminiClient();
    const model = resolveGeminiModel(engine?.geminiModel);
    const response = await withGeminiRetry(model, (m) =>
      ai.models.generateContent({
        model: m,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    shotType: { type: Type.STRING },
                    cameraAngle: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    videoPrompt: { type: Type.STRING },
                  },
                  required: ['id', 'label', 'shotType', 'cameraAngle', 'rationale', 'videoPrompt'],
                },
              },
            },
            required: ['suggestions'],
          },
        },
      })
    );

    const parsed = extractJsonObject(response.text ?? '{}') as {
      suggestions?: CameraSuggestion[];
    };
    const normalized = (Array.isArray(parsed.suggestions) ? parsed.suggestions : []).map(
      (item, idx) => ({
        ...item,
        id: item.id || `sug_${Date.now()}_${idx}`,
      })
    );
    return res.json({ suggestions: normalized });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

// 5. Multi-Turn Director's Room Gemini Chatbot
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, directorRole, project, engine } = req.body as {
      message: string;
      history: ChatMessage[];
      directorRole: DirectorRole;
      project: Project;
      engine: EngineSettings;
    };

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const roleInstructions: Record<DirectorRole, string> = {
      'Cinematographer & Prompt Architect':
        'You are a seasoned Director of Photography and AI Prompt Architect. Give concrete lens, lighting, blocking, and ready-to-paste prompt refinements tailored for Midjourney, Flux, Sora, Veo, Kling, and Runway.',
      'Screenplay & Pacing Doctor':
        'You are a sharp Screenplay & Pacing Doctor. Help tighten voiceover rhythm (~140 WPM), strengthen emotional beats, eliminate exposition bloat, and sharpen transitions between scenes.',
      'Visual Continuity Supervisor':
        'You are a meticulous Visual Continuity Supervisor. Audit wardrobe, props, lighting temperature, character descriptions, and environmental consistency across every scene prompt.',
    };

    const projectContext = `ACTIVE PROJECT: "${project.title}"
Target Duration: ${project.targetDurationMinutes} min
Art Style: ${project.bible.artStyle}${project.bible.customStyleModifier ? ` (${project.bible.customStyleModifier})` : ''}
Aspect Ratio: ${project.bible.aspectRatio}
Characters (${project.bible.characters.length}): ${project.bible.characters.map((c) => `${c.name}: ${c.appearance}`).join(' | ') || 'None'}
Locations (${project.bible.locations.length}): ${project.bible.locations.map((l) => `${l.name}: ${l.details}`).join(' | ') || 'None'}
Scenes (${project.scenes.length}): ${project.scenes.map((s) => `Scene ${s.sceneNumber} (${s.durationSec}s, ${s.shotType}): ${s.voiceover}`).join(' || ') || 'No scenes generated yet'}
Script Excerpt: ${project.storyScript.slice(0, 1200) || 'Empty'}`;

    const systemInstruction = `${roleInstructions[directorRole] || roleInstructions['Cinematographer & Prompt Architect']}
Be concise, practical, and directly reference the user's active project details below.

${projectContext}`;

    const recentHistory = (history || []).slice(-14);

    if (engine?.provider === 'openai-compatible') {
      const messages = [
        { role: 'system' as const, content: systemInstruction },
        ...recentHistory.map((m) => ({
          role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
          content: m.text,
        })),
        { role: 'user' as const, content: message.trim() },
      ];
      const reply = await callOpenAiCompatible(engine, messages);
      return res.json({ reply: reply.trim() });
    }

    const ai = getGeminiClient();
    const model = resolveGeminiModel(engine?.geminiModel);

    // Filter history so Gemini multi-turn chat starts with a user turn if needed
    const formattedHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const msg of recentHistory) {
      if (formattedHistory.length === 0 && msg.role === 'model') continue;
      formattedHistory.push({
        role: msg.role,
        parts: [{ text: msg.text }],
      });
    }

    const response = await withGeminiRetry(model, async (m) => {
      const chat = ai.chats.create({
        model: m,
        history: formattedHistory,
        config: {
          systemInstruction,
        },
      });
      return chat.sendMessage({ message: message.trim() });
    });
    const reply = (response.text ?? '').trim();
    if (!reply) {
      return res.status(502).json({ error: 'Director AI returned an empty reply.' });
    }
    return res.json({ reply });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

// 6. Storyboard Keyframe Image Generation with Controllable Aspect Ratios
app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body as {
      prompt: string;
      aspectRatio: AspectRatioOption;
    };

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Image prompt is required to render a keyframe.' });
    }

    const ai = getGeminiClient();
    const validRatios: AspectRatioOption[] = [
      '1:1',
      '2:3',
      '3:2',
      '3:4',
      '4:3',
      '9:16',
      '16:9',
      '21:9',
    ];
    const targetRatio: AspectRatioOption = validRatios.includes(aspectRatio)
      ? aspectRatio
      : '16:9';

    // Map exotic aspect ratios only if needed as fallback
    const fallbackRatioMap: Record<AspectRatioOption, string> = {
      '1:1': '1:1',
      '2:3': '3:4',
      '3:2': '4:3',
      '3:4': '3:4',
      '4:3': '4:3',
      '9:16': '9:16',
      '16:9': '16:9',
      '21:9': '16:9',
    };

    const runGenerate = async (ratioToUse: string) => {
      return ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [
            {
              text: `${prompt.trim()}. Compose cleanly for ${targetRatio} frame geometry.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: ratioToUse,
            imageSize: '1K',
          },
        },
      });
    };

    let response;
    let appliedAspectRatio: string = targetRatio;
    try {
      response = await runGenerate(targetRatio);
    } catch (firstErr) {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      if (msg.toLowerCase().includes('aspect') && fallbackRatioMap[targetRatio] !== targetRatio) {
        appliedAspectRatio = fallbackRatioMap[targetRatio];
        response = await runGenerate(appliedAspectRatio);
      } else {
        throw firstErr;
      }
    }

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType ?? 'image/png';
        return res.json({
          imageUrl: `data:${mime};base64,${part.inlineData.data}`,
          appliedAspectRatio,
        });
      }
    }

    return res.status(502).json({
      error: 'Image model responded without image data. Try refining the prompt and retrying.',
    });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StoryPrompt Studio listening on http://localhost:${PORT}`);
  });
}

startServer();
