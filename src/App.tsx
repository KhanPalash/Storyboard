import { useCallback, useEffect, useMemo, useState } from 'react';
import { DirectorChatDrawer } from './components/DirectorChatDrawer';
import { EngineSettingsBar } from './components/EngineSettingsBar';
import { HeaderBar } from './components/HeaderBar';
import { PrintSheet } from './components/PrintSheet';
import { ProjectManagerDrawer } from './components/ProjectManagerDrawer';
import { Step1ScriptEditor } from './components/Step1ScriptEditor';
import { Step2StoryBible } from './components/Step2StoryBible';
import { Step3StoryboardWorkspace } from './components/Step3StoryboardWorkspace';
import { ToastContainer } from './components/ToastContainer';
import {
  DEFAULT_ENGINE_SETTINGS,
  createBlankProject,
  createSeedProject,
} from './data/seedProject';
import type {
  AspectRatioOption,
  CameraSuggestion,
  ChatMessage,
  DirectorRole,
  EngineSettings,
  Project,
  SceneCard,
  StoryBible,
  ToastMessage,
  WorkflowStep,
} from './types';
import {
  extractStoryBibleApi,
  generateFullStoryApi,
  generateSceneImageApi,
  generateScenesApi,
  regenerateSingleSceneApi,
  sendDirectorChatApi,
  suggestCameraOptionsApi,
} from './utils/api';
import {
  applyCameraSuggestionToScene,
  deleteSceneAt,
  exportToCsv,
  exportToMarkdown,
  insertBlankScene,
  renumberScenes,
  reorderScenes,
  sanitizeProjects,
} from './utils/storyboard';

const STORAGE_PROJECTS_KEY = 'storyprompt_studio_projects_v1';
const STORAGE_ACTIVE_ID_KEY = 'storyprompt_studio_active_project_v1';
const STORAGE_ENGINE_KEY = 'storyprompt_studio_engine_v1';

function loadInitialProjects(): Project[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return sanitizeProjects(parsed, createSeedProject);
    }
  } catch {
    // Fallback to seed project
  }
  return [createSeedProject()];
}

function loadInitialEngine(): EngineSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_ENGINE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_ENGINE_SETTINGS, ...parsed };
      }
    }
  } catch {
    // Default
  }
  return DEFAULT_ENGINE_SETTINGS;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => loadInitialProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
      if (saved && projects.some((p) => p.id === saved)) return saved;
    } catch {
      // Ignore storage access errors
    }
    return projects[0].id;
  });
  const [engineSettings, setEngineSettings] = useState<EngineSettings>(() => loadInitialEngine());
  const [activeStep, setActiveStep] = useState<WorkflowStep>(1);

  const [projectsOpen, setProjectsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Loading & Error States
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  const [isExtractingBible, setIsExtractingBible] = useState(false);
  const [bibleError, setBibleError] = useState<string | null>(null);

  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
  const [scenesError, setScenesError] = useState<string | null>(null);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);
  const [generatingImageSceneId, setGeneratingImageSceneId] = useState<string | null>(null);
  const [analyzingCameraSceneId, setAnalyzingCameraSceneId] = useState<string | null>(null);
  const [sceneImageErrors, setSceneImageErrors] = useState<Record<string, string | null>>({});
  const [sceneCameraErrors, setSceneCameraErrors] = useState<Record<string, string | null>>({});
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const [isChatSending, setIsChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist to localStorage automatically
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    } catch {
      // Ignore quota overflow for large base64 previews
    }
  }, [projects]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeProjectId);
    } catch {
      // Ignore
    }
  }, [activeProjectId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_ENGINE_KEY, JSON.stringify(engineSettings));
    } catch {
      // Ignore
    }
  }, [engineSettings]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeStep]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProjectsOpen(false);
        setChatOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );

  // Select Scene 01 when entering Step 3 or switching projects, without re-opening if user collapsed it
  useEffect(() => {
    if (activeStep !== 3) return;
    if (activeProject.scenes.length === 0) {
      setSelectedSceneId(null);
      return;
    }
    setSelectedSceneId((cur) =>
      cur && activeProject.scenes.some((s) => s.id === cur) ? cur : activeProject.scenes[0].id
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, activeProject.id]);

  const notify = useCallback(
    (text: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts([{ id, text, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    },
    []
  );

  const copyToClipboard = useCallback(
    async (label: string, value: string) => {
      if (!value) {
        notify(`Nothing to copy for ${label}`, 'error');
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
        notify(`Copied! (${label})`, 'success');
      } catch {
        // Fallback copy using hidden textarea
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        notify(`Copied! (${label})`, 'success');
      }
    },
    [notify]
  );

  const updateActiveProject = useCallback(
    (updater: Partial<Project> | ((prev: Project) => Project)) => {
      setProjects((prevList) =>
        prevList.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          const next = typeof updater === 'function' ? updater(proj) : { ...proj, ...updater };
          return { ...next, updatedAt: new Date().toISOString() };
        })
      );
    },
    [activeProject.id]
  );

  // Project Management Handlers
  const handleCreateProject = (title: string) => {
    const fresh = createBlankProject(title);
    setProjects((prev) => [fresh, ...prev]);
    setActiveProjectId(fresh.id);
    setActiveStep(1);
    setProjectsOpen(false);
    notify(`Created "${fresh.title}"`, 'success');
  };

  const handleDuplicateProject = (id: string) => {
    const source = projects.find((p) => p.id === id);
    if (!source) return;
    const clone: Project = {
      ...JSON.parse(JSON.stringify(source)),
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: `${source.title} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [clone, ...prev]);
    setActiveProjectId(clone.id);
    notify(`Duplicated "${source.title}"`, 'success');
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id) {
      setActiveProjectId(remaining[0].id);
    }
    notify('Project deleted', 'neutral');
  };

  // Step 1: Generate Full Story
  const handleGenerateStory = async () => {
    setStoryError(null);
    if (!activeProject.ideaInput.trim()) {
      setStoryError('Enter a story idea, premise, or brief before generating a screenplay.');
      return;
    }
    setIsGeneratingStory(true);
    try {
      const { story } = await generateFullStoryApi({
        idea: activeProject.ideaInput,
        targetDurationMinutes: activeProject.targetDurationMinutes,
        engine: engineSettings,
      });
      updateActiveProject({ storyScript: story });
      notify('Full screenplay generated', 'success');
    } catch (err) {
      setStoryError(err instanceof Error ? err.message : 'Failed to generate screenplay.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Step 2: Auto-Extract Characters & Locations
  const handleAutoExtractBible = async () => {
    setBibleError(null);
    if (!activeProject.storyScript.trim()) {
      setBibleError('Write or generate a story in Step 1 before extracting the Story Bible.');
      return;
    }
    setIsExtractingBible(true);
    try {
      const result = await extractStoryBibleApi({
        storyScript: activeProject.storyScript,
        engine: engineSettings,
      });
      updateActiveProject((prev) => ({
        ...prev,
        bible: {
          ...prev.bible,
          characters: result.characters.map((c, idx) => ({
            id: `char_${Date.now()}_${idx}`,
            name: c.name,
            appearance: c.appearance,
          })),
          locations: result.locations.map((l, idx) => ({
            id: `loc_${Date.now()}_${idx}`,
            name: l.name,
            details: l.details,
          })),
        },
      }));
      notify(
        `Extracted ${result.characters.length} characters & ${result.locations.length} locations`,
        'success'
      );
    } catch (err) {
      setBibleError(err instanceof Error ? err.message : 'Failed to extract Story Bible.');
    } finally {
      setIsExtractingBible(false);
    }
  };

  // Step 3: Generate Full Scene Breakdown
  const handleGenerateScenes = async () => {
    setBibleError(null);
    setScenesError(null);
    if (!activeProject.storyScript.trim()) {
      const msg = 'Add a script in Step 1 before generating storyboard scenes.';
      setBibleError(msg);
      setScenesError(msg);
      return;
    }
    setIsGeneratingScenes(true);
    try {
      const { scenes } = await generateScenesApi({
        storyScript: activeProject.storyScript,
        targetDurationMinutes: activeProject.targetDurationMinutes,
        bible: activeProject.bible,
        engine: engineSettings,
      });
      const hydrated: SceneCard[] = renumberScenes(
        scenes.map((s, idx) => ({
          ...s,
          id: `scene_${Date.now()}_${idx}`,
          durationSec: Number(s.durationSec) || 6,
          cameraAngle: s.cameraAngle || 'Eye-Level',
          charactersPresent: Array.isArray(s.charactersPresent) ? s.charactersPresent : [],
          cameraSuggestions: Array.isArray(s.cameraSuggestions)
            ? s.cameraSuggestions.map((opt, optIdx) => ({
                ...opt,
                id: opt.id || `sug_${Date.now()}_${idx}_${optIdx}`,
              }))
            : [],
        }))
      );
      updateActiveProject({ scenes: hydrated });
      setSelectedSceneId(hydrated[0]?.id ?? null);
      setActiveStep(3);
      notify(`Generated ${hydrated.length} scenes with AI camera suggestions`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate scene prompts.';
      setBibleError(msg);
      setScenesError(msg);
    } finally {
      setIsGeneratingScenes(false);
    }
  };

  // Step 3: Analyze Scene Action & Dialogue for Shot Types, Camera Angles & Video Motion
  const handleAnalyzeSceneCamera = useCallback(
    async (index: number) => {
      const target = activeProject.scenes[index];
      if (!target) return;
      setSceneCameraErrors((prev) => ({ ...prev, [target.id]: null }));
      setAnalyzingCameraSceneId(target.id);
      try {
        const { suggestions } = await suggestCameraOptionsApi({
          storyScript: activeProject.storyScript,
          bible: activeProject.bible,
          scene: target,
          prevScene: activeProject.scenes[index - 1],
          nextScene: activeProject.scenes[index + 1],
          engine: engineSettings,
        });
        updateActiveProject((prev) => ({
          ...prev,
          scenes: prev.scenes.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  cameraSuggestions: suggestions,
                  appliedSuggestionId: undefined,
                }
              : item
          ),
        }));
        notify(
          `Generated ${suggestions.length} camera & motion options for SCENE ${String(target.sceneNumber).padStart(2, '0')}`,
          'success'
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to analyze scene camera options.';
        setSceneCameraErrors((prev) => ({ ...prev, [target.id]: msg }));
      } finally {
        setAnalyzingCameraSceneId(null);
      }
    },
    [activeProject, engineSettings, notify, updateActiveProject]
  );

  const handleSelectScene = (sceneId: string) => {
    if (selectedSceneId === sceneId) {
      setSelectedSceneId(null);
      return;
    }
    setSelectedSceneId(sceneId);
    const idx = activeProject.scenes.findIndex((s) => s.id === sceneId);
    if (idx === -1) return;
    const target = activeProject.scenes[idx];
    const hasSuggestions = (target.cameraSuggestions?.length ?? 0) > 0;
    const hasContent = Boolean(target.voiceover.trim() || target.imagePrompt.trim());
    if (!hasSuggestions && hasContent && analyzingCameraSceneId !== target.id) {
      void handleAnalyzeSceneCamera(idx);
    }
  };

  const handleApplyCameraSuggestion = (
    sceneId: string,
    suggestion: CameraSuggestion,
    mode: 'all' | 'shot' | 'motion'
  ) => {
    const target = activeProject.scenes.find((s) => s.id === sceneId);
    if (!target) return;
    updateActiveProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === sceneId ? applyCameraSuggestionToScene(s, suggestion, mode) : s
      ),
    }));
    const modeLabel =
      mode === 'all' ? 'shot, angle & motion' : mode === 'shot' ? 'shot & angle' : 'motion prompt';
    notify(
      `Applied ${modeLabel} ("${suggestion.label}") to SCENE ${String(target.sceneNumber).padStart(2, '0')}`,
      'success'
    );
  };

  // Step 3: Single Scene AI Regenerate
  const handleRegenerateSingleScene = async (index: number) => {
    const target = activeProject.scenes[index];
    if (!target) return;
    setScenesError(null);
    setRegeneratingSceneId(target.id);
    try {
      const { scene } = await regenerateSingleSceneApi({
        storyScript: activeProject.storyScript,
        bible: activeProject.bible,
        scene: target,
        prevScene: activeProject.scenes[index - 1],
        nextScene: activeProject.scenes[index + 1],
        engine: engineSettings,
      });
      updateActiveProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((item) =>
          item.id === target.id
            ? {
                ...item,
                ...scene,
                id: item.id,
                sceneNumber: item.sceneNumber,
                cameraAngle: scene.cameraAngle || item.cameraAngle || 'Eye-Level',
                cameraSuggestions: Array.isArray(scene.cameraSuggestions)
                  ? scene.cameraSuggestions.map((opt, optIdx) => ({
                      ...opt,
                      id: opt.id || `sug_${Date.now()}_${optIdx}`,
                    }))
                  : item.cameraSuggestions,
                appliedSuggestionId: undefined,
              }
            : item
        ),
      }));
      setSelectedSceneId(target.id);
      notify(`Regenerated SCENE ${String(target.sceneNumber).padStart(2, '0')} with new camera options`, 'success');
    } catch (err) {
      setScenesError(err instanceof Error ? err.message : 'Failed to regenerate scene.');
    } finally {
      setRegeneratingSceneId(null);
    }
  };

  // Step 3: Generate Keyframe Image with Controllable Aspect Ratio
  const handleGenerateSceneImage = async (scene: SceneCard) => {
    setSceneImageErrors((prev) => ({ ...prev, [scene.id]: null }));
    setGeneratingImageSceneId(scene.id);
    try {
      const { imageUrl } = await generateSceneImageApi({
        prompt: scene.imagePrompt,
        aspectRatio: activeProject.bible.aspectRatio,
      });
      updateActiveProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.id === scene.id ? { ...s, previewImageUrl: imageUrl } : s
        ),
      }));
      notify(
        `Rendered ${activeProject.bible.aspectRatio} frame for SCENE ${String(scene.sceneNumber).padStart(2, '0')}`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image generation failed.';
      setSceneImageErrors((prev) => ({ ...prev, [scene.id]: msg }));
    } finally {
      setGeneratingImageSceneId(null);
    }
  };

  // Director Multi-Turn Chat
  const handleSendChat = async (text: string) => {
    setChatError(null);
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    const priorHistory = activeProject.chatHistory;
    updateActiveProject((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMsg],
    }));

    setIsChatSending(true);
    try {
      const { reply } = await sendDirectorChatApi({
        message: text,
        history: priorHistory,
        directorRole: activeProject.directorRole,
        project: activeProject,
        engine: engineSettings,
      });
      const aiMsg: ChatMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: new Date().toISOString(),
      };
      updateActiveProject((prev) => ({
        ...prev,
        chatHistory: [...prev.chatHistory, aiMsg],
      }));
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Director chat failed.');
    } finally {
      setIsChatSending(false);
    }
  };

  // Exports
  const safeSlug = (activeProject.title || 'storyboard')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const handleExportMarkdown = () => {
    const md = exportToMarkdown(activeProject);
    downloadTextFile(`${safeSlug}-storyboard.md`, md, 'text/markdown;charset=utf-8');
    notify('Exported Markdown production script', 'success');
  };

  const handleExportCsv = () => {
    const csv = exportToCsv(activeProject);
    downloadTextFile(`${safeSlug}-storyboard.csv`, csv, 'text/csv;charset=utf-8');
    notify('Exported CSV spreadsheet', 'success');
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7] text-[#141413] flex flex-col">
      <HeaderBar
        activeStep={activeStep}
        onSelectStep={setActiveStep}
        projectsOpen={projectsOpen}
        onToggleProjects={() => setProjectsOpen((v) => !v)}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
      />

      <EngineSettingsBar
        open={settingsOpen}
        settings={engineSettings}
        onChange={setEngineSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <main className="no-print flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-8 py-8">
        {activeStep === 1 && (
          <Step1ScriptEditor
            project={activeProject}
            isGenerating={isGeneratingStory}
            errorMessage={storyError}
            onUpdateProject={(patch) => updateActiveProject(patch)}
            onGenerateStory={handleGenerateStory}
            onNextStep={() => setActiveStep(2)}
            onNotify={notify}
          />
        )}

        {activeStep === 2 && (
          <Step2StoryBible
            project={activeProject}
            isExtracting={isExtractingBible}
            isGeneratingScenes={isGeneratingScenes}
            errorMessage={bibleError}
            onUpdateBible={(bible: StoryBible) => updateActiveProject({ bible })}
            onAutoExtract={handleAutoExtractBible}
            onGenerateScenes={handleGenerateScenes}
            onBackStep={() => setActiveStep(1)}
            onOpenExistingScenes={() => setActiveStep(3)}
          />
        )}

        {activeStep === 3 && (
          <Step3StoryboardWorkspace
            project={activeProject}
            selectedSceneId={selectedSceneId}
            isGeneratingAll={isGeneratingScenes}
            regeneratingSceneId={regeneratingSceneId}
            generatingImageSceneId={generatingImageSceneId}
            analyzingCameraSceneId={analyzingCameraSceneId}
            sceneImageErrors={sceneImageErrors}
            sceneCameraErrors={sceneCameraErrors}
            errorMessage={scenesError}
            onSelectScene={handleSelectScene}
            onBackToBible={() => setActiveStep(2)}
            onChangeAspectRatio={(ratio: AspectRatioOption) =>
              updateActiveProject((prev) => ({
                ...prev,
                bible: { ...prev.bible, aspectRatio: ratio },
              }))
            }
            onRegenerateAll={handleGenerateScenes}
            onUpdateScene={(sceneId, patch) =>
              updateActiveProject((prev) => ({
                ...prev,
                scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
              }))
            }
            onMoveScene={(index, dir) =>
              updateActiveProject((prev) => ({
                ...prev,
                scenes: reorderScenes(prev.scenes, index, dir),
              }))
            }
            onInsertBlankScene={(afterIndex) => {
              const newId = `scene_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
              updateActiveProject((prev) => ({
                ...prev,
                scenes: insertBlankScene(prev.scenes, afterIndex, prev.bible, () => newId),
              }));
              setSelectedSceneId(newId);
              notify('Inserted blank scene card', 'neutral');
            }}
            onDeleteScene={(index) => {
              updateActiveProject((prev) => ({
                ...prev,
                scenes: deleteSceneAt(prev.scenes, index),
              }));
              notify('Scene removed', 'neutral');
            }}
            onRegenerateSingleScene={handleRegenerateSingleScene}
            onAnalyzeSceneCamera={handleAnalyzeSceneCamera}
            onApplyCameraSuggestion={handleApplyCameraSuggestion}
            onGenerateSceneImage={handleGenerateSceneImage}
            onExportMarkdown={handleExportMarkdown}
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            onCopyText={copyToClipboard}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="no-print border-t border-[#E4E4E0] bg-white">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#8A8882]">
          <span>StoryPrompt Studio — Storyboard &amp; Prompt Architect</span>
          <span>Projects auto-saved locally · Prompt output formatted for Midjourney, Flux, Sora, Veo, Kling &amp; Runway</span>
        </div>
      </footer>

      {/* Printable Storyboard Sheet */}
      <PrintSheet project={activeProject} />

      {/* Drawers */}
      <ProjectManagerDrawer
        open={projectsOpen}
        projects={projects}
        activeProjectId={activeProject.id}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          notify('Loaded project', 'neutral');
        }}
        onCreateProject={handleCreateProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onRenameActiveProject={(title) => updateActiveProject({ title })}
        onClose={() => setProjectsOpen(false)}
      />

      <DirectorChatDrawer
        open={chatOpen}
        messages={activeProject.chatHistory}
        directorRole={activeProject.directorRole}
        isSending={isChatSending}
        errorMessage={chatError}
        onChangeRole={(directorRole: DirectorRole) => updateActiveProject({ directorRole })}
        onSendMessage={handleSendChat}
        onClearHistory={() => {
          updateActiveProject({
            chatHistory: [
              {
                id: `msg_reset_${Date.now()}`,
                role: 'model',
                text: 'Conversation cleared. Ready to review your script, Story Bible, or scene prompts.',
                timestamp: new Date().toISOString(),
              },
            ],
          });
          setChatError(null);
        }}
        onCopyText={copyToClipboard}
        onClose={() => setChatOpen(false)}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
