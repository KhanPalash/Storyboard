import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { AspectRatioOption, CameraSuggestion, Project, SceneCard } from '../types';
import {
  ASPECT_RATIOS,
  formatTimecode,
  totalStoryboardSeconds,
} from '../utils/storyboard';
import { SceneCardItem } from './SceneCardItem';

interface Step3StoryboardWorkspaceProps {
  project: Project;
  selectedSceneId: string | null;
  isGeneratingAll: boolean;
  regeneratingSceneId: string | null;
  generatingImageSceneId: string | null;
  analyzingCameraSceneId: string | null;
  sceneImageErrors: Record<string, string | null>;
  sceneCameraErrors: Record<string, string | null>;
  errorMessage: string | null;
  onSelectScene: (sceneId: string) => void;
  onBackToBible: () => void;
  onChangeAspectRatio: (ratio: AspectRatioOption) => void;
  onRegenerateAll: () => void;
  onUpdateScene: (sceneId: string, patch: Partial<SceneCard>) => void;
  onMoveScene: (index: number, direction: 'up' | 'down') => void;
  onInsertBlankScene: (afterIndex: number) => void;
  onDeleteScene: (index: number) => void;
  onRegenerateSingleScene: (index: number) => void;
  onAnalyzeSceneCamera: (index: number) => void;
  onApplyCameraSuggestion: (
    sceneId: string,
    suggestion: CameraSuggestion,
    mode: 'all' | 'shot' | 'motion'
  ) => void;
  onGenerateSceneImage: (scene: SceneCard) => void;
  onExportMarkdown: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onCopyText: (label: string, value: string) => void;
}

export function Step3StoryboardWorkspace({
  project,
  selectedSceneId,
  isGeneratingAll,
  regeneratingSceneId,
  generatingImageSceneId,
  analyzingCameraSceneId,
  sceneImageErrors,
  sceneCameraErrors,
  errorMessage,
  onSelectScene,
  onBackToBible,
  onChangeAspectRatio,
  onRegenerateAll,
  onUpdateScene,
  onMoveScene,
  onInsertBlankScene,
  onDeleteScene,
  onRegenerateSingleScene,
  onAnalyzeSceneCamera,
  onApplyCameraSuggestion,
  onGenerateSceneImage,
  onExportMarkdown,
  onExportCsv,
  onExportPdf,
  onCopyText,
}: Step3StoryboardWorkspaceProps) {
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const totalSec = totalStoryboardSeconds(project.scenes);

  return (
    <div className="space-y-6">
      {/* Top Production & Export Bar */}
      <div className="pb-6 border-b border-[#E4E4E0] flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <p className="text-xs font-medium text-[#575652] mb-1">
            Step 3 of 3 · Production Workspace
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413]">
            {project.title || 'Untitled Production'}
          </h1>
          <div
            data-testid="storyboard-summary"
            className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-[#575652] font-mono tabular-nums"
          >
            <span>{project.scenes.length} scenes</span>
            <span aria-hidden="true">·</span>
            <span>{formatTimecode(totalSec)} runtime ({totalSec}s)</span>
            <span aria-hidden="true">·</span>
            <span className="font-sans">{project.bible.artStyle}</span>
            <span aria-hidden="true">·</span>
            <span>{project.bible.aspectRatio}</span>
          </div>
        </div>

        {/* Export & Utility Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToBible}
            className="h-9 px-3 text-xs font-medium text-[#575652] hover:text-[#141413] bg-white border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Story Bible
          </button>

          <button
            type="button"
            disabled={isGeneratingAll}
            onClick={onRegenerateAll}
            className="h-9 px-3 text-xs font-medium text-[#141413] bg-white hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            {isGeneratingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Regenerate All
          </button>

          <button
            type="button"
            onClick={onExportMarkdown}
            className="h-9 px-3 text-xs font-medium text-[#141413] bg-white hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Markdown
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="h-9 px-3 text-xs font-medium text-[#141413] bg-white hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="h-9 px-3.5 text-xs font-semibold text-white bg-[#141413] hover:bg-[#2E2D2B] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Live Aspect Ratio Frame Bar */}
      <div className="bg-white border border-[#E4E4E0] rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#575652]">
          <span className="font-semibold text-[#141413]">Frame Aspect Ratio:</span>{' '}
          Switch preview and AI image generation aspect ratio across all cards.
        </div>
        <div
          role="group"
          aria-label="Aspect Ratio Selector"
          className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F1EF] rounded-lg"
        >
          {ASPECT_RATIOS.map((ar) => {
            const active = project.bible.aspectRatio === ar.value;
            return (
              <button
                key={ar.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeAspectRatio(ar.value)}
                className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-[#141413] font-semibold shadow-xs border border-[#E4E4E0]'
                    : 'text-[#575652] hover:text-[#141413]'
                }`}
              >
                {ar.label}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 text-sm text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl"
        >
          {errorMessage}
        </div>
      )}

      {/* Scene Cards List */}
      {project.scenes.length === 0 ? (
        <div className="bg-white border border-dashed border-[#D4D4CE] rounded-xl p-12 text-center space-y-4">
          <h2 className="text-lg font-semibold text-[#141413]">
            No storyboard scenes yet
          </h2>
          <p className="text-sm text-[#575652] max-w-md mx-auto">
            Generate a full scene-by-scene breakdown from your Step 1 script and Step 2 Story Bible, or add a blank scene manually.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={isGeneratingAll}
              onClick={onRegenerateAll}
              className="h-10 px-5 text-sm font-semibold text-white bg-[#D9381E] hover:bg-[#B92C16] rounded-lg inline-flex items-center gap-2 cursor-pointer"
            >
              {isGeneratingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Generate Scenes from Script
            </button>
            <button
              type="button"
              onClick={() => onInsertBlankScene(-1)}
              className="h-10 px-4 text-sm font-medium text-[#141413] bg-white hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Blank Scene
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3" data-testid="scene-list">
          {project.scenes.map((scene, idx) => (
            <div key={scene.id} className="space-y-3">
              <SceneCardItem
                scene={scene}
                index={idx}
                totalCount={project.scenes.length}
                bible={project.bible}
                isSelected={selectedSceneId === scene.id}
                isRegenerating={regeneratingSceneId === scene.id}
                isGeneratingImage={generatingImageSceneId === scene.id}
                isAnalyzingCamera={analyzingCameraSceneId === scene.id}
                imageError={sceneImageErrors[scene.id] ?? null}
                cameraError={sceneCameraErrors[scene.id] ?? null}
                onSelect={() => onSelectScene(scene.id)}
                onUpdate={(patch) => onUpdateScene(scene.id, patch)}
                onMoveUp={() => onMoveScene(idx, 'up')}
                onMoveDown={() => onMoveScene(idx, 'down')}
                onRegenerate={() => onRegenerateSingleScene(idx)}
                onAnalyzeCamera={() => onAnalyzeSceneCamera(idx)}
                onApplyCameraSuggestion={(suggestion, mode) =>
                  onApplyCameraSuggestion(scene.id, suggestion, mode)
                }
                onGenerateImage={() => onGenerateSceneImage(scene)}
                onDelete={() => onDeleteScene(idx)}
                onCopyText={onCopyText}
                onOpenLightbox={(url, title) => setLightbox({ url, title })}
              />

              {/* Insertion divider between cards */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[#E4E4E0]" />
                <button
                  type="button"
                  onClick={() => onInsertBlankScene(idx)}
                  aria-label={`Add Blank Scene after Scene ${String(scene.sceneNumber).padStart(2, '0')}`}
                  className="px-3 py-1 text-xs font-medium text-[#575652] hover:text-[#141413] bg-white hover:bg-[#F1F1EF] border border-[#E4E4E0] rounded-md inline-flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Blank Scene
                </button>
                <div className="h-px flex-1 bg-[#E4E4E0]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Keyframe Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
          className="no-print fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full space-y-3"
          >
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-mono">{lightbox.title}</span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close frame preview"
                className="p-2 text-white/80 hover:text-white rounded-md hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightbox.url}
              alt={lightbox.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[80vh] object-contain rounded-lg border border-white/15 bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
