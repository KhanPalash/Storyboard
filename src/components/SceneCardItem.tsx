import {
  ArrowDown,
  ArrowUp,
  Check,
  Clapperboard,
  Copy,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  AspectRatioOption,
  CameraSuggestion,
  SceneCard,
  StoryBible,
} from '../types';
import {
  CAMERA_ANGLES,
  SHOT_TYPES,
  composeConsistentImagePrompt,
  getAspectRatioStyle,
} from '../utils/storyboard';
import { CameraSuggestionsTray } from './CameraSuggestionsTray';

interface SceneCardItemProps {
  scene: SceneCard;
  index: number;
  totalCount: number;
  bible: StoryBible;
  isSelected: boolean;
  isRegenerating: boolean;
  isGeneratingImage: boolean;
  isAnalyzingCamera: boolean;
  imageError?: string | null;
  cameraError?: string | null;
  onSelect: () => void;
  onUpdate: (patch: Partial<SceneCard>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRegenerate: () => void;
  onAnalyzeCamera: () => void;
  onApplyCameraSuggestion: (
    suggestion: CameraSuggestion,
    mode: 'all' | 'shot' | 'motion'
  ) => void;
  onGenerateImage: () => void;
  onDelete: () => void;
  onCopyText: (label: string, value: string) => void;
  onOpenLightbox: (imageUrl: string, title: string) => void;
}

export function SceneCardItem({
  scene,
  index,
  totalCount,
  bible,
  isSelected,
  isRegenerating,
  isGeneratingImage,
  isAnalyzingCamera,
  imageError,
  cameraError,
  onSelect,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRegenerate,
  onAnalyzeCamera,
  onApplyCameraSuggestion,
  onGenerateImage,
  onDelete,
  onCopyText,
  onOpenLightbox,
}: SceneCardItemProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setImgFailed(false);
  }, [scene.previewImageUrl]);

  const sceneLabel = `SCENE ${String(scene.sceneNumber).padStart(2, '0')}`;
  const aspectCss = getAspectRatioStyle(bible.aspectRatio as AspectRatioOption);

  const handleCopy = (fieldKey: string, label: string, text: string) => {
    onCopyText(label, text);
    setCopiedField(fieldKey);
    window.setTimeout(() => {
      setCopiedField((cur) => (cur === fieldKey ? null : cur));
    }, 1500);
  };

  const handleSyncBible = () => {
    const composed = composeConsistentImagePrompt(scene, bible);
    onUpdate({ imagePrompt: composed });
    onCopyText(`${sceneLabel} synced with Story Bible`, composed);
  };

  const hasValidImage = Boolean(scene.previewImageUrl) && !imgFailed;

  const suggestions = scene.cameraSuggestions ?? [];

  return (
    <article
      data-testid={`scene-card-${scene.sceneNumber}`}
      data-selected={isSelected ? 'true' : 'false'}
      className={`bg-white rounded-xl overflow-hidden transition-colors border ${
        isSelected ? 'border-[#141413]' : 'border-[#E4E4E0]'
      }`}
    >
      {/* Scene Header */}
      <div className="px-5 py-3.5 bg-[#F8F8F7] border-b border-[#E4E4E0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={isSelected}
            aria-label={`Select ${sceneLabel}`}
            className="font-mono text-sm font-semibold tracking-tight text-[#141413] hover:text-[#D9381E] tabular-nums transition-colors cursor-pointer"
          >
            {sceneLabel}
          </button>
          <span aria-hidden="true" className="text-[#C7C6BF]">
            ·
          </span>
          <div className="inline-flex items-center gap-1">
            <label htmlFor={`duration-${scene.id}`} className="sr-only">
              {sceneLabel} duration in seconds
            </label>
            <input
              id={`duration-${scene.id}`}
              type="number"
              min={1}
              max={60}
              value={scene.durationSec}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v > 0) onUpdate({ durationSec: v });
              }}
              className="w-12 h-7 px-1.5 text-xs font-mono tabular-nums text-center bg-white border border-[#D4D4CE] rounded text-[#141413] focus:outline-none focus:border-[#141413]"
            />
            <span className="text-xs font-mono text-[#575652]">s</span>
          </div>
          <span aria-hidden="true" className="text-[#C7C6BF]">
            ·
          </span>
          <div>
            <label htmlFor={`shot-type-${scene.id}`} className="sr-only">
              {sceneLabel} shot type
            </label>
            <input
              id={`shot-type-${scene.id}`}
              type="text"
              list={`shot-presets-${scene.id}`}
              value={scene.shotType}
              onChange={(e) => onUpdate({ shotType: e.target.value })}
              placeholder="Shot Type"
              className="h-7 px-2.5 text-xs font-medium bg-white border border-[#D4D4CE] rounded text-[#141413] w-44 focus:outline-none focus:border-[#141413]"
            />
            <datalist id={`shot-presets-${scene.id}`}>
              {SHOT_TYPES.map((st) => (
                <option key={st} value={st} />
              ))}
            </datalist>
          </div>
          <span aria-hidden="true" className="text-[#C7C6BF]">
            ·
          </span>
          <div>
            <label htmlFor={`camera-angle-${scene.id}`} className="sr-only">
              {sceneLabel} camera angle
            </label>
            <input
              id={`camera-angle-${scene.id}`}
              type="text"
              list={`angle-presets-${scene.id}`}
              value={scene.cameraAngle ?? ''}
              onChange={(e) => onUpdate({ cameraAngle: e.target.value })}
              placeholder="Camera Angle"
              className="h-7 px-2.5 text-xs font-medium bg-white border border-[#D4D4CE] rounded text-[#575652] w-36 focus:outline-none focus:border-[#141413] focus:text-[#141413]"
            />
            <datalist id={`angle-presets-${scene.id}`}>
              {CAMERA_ANGLES.map((ang) => (
                <option key={ang} value={ang} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Scene Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onSelect}
            aria-expanded={isSelected}
            aria-label={`Toggle AI Camera Suggestions for ${sceneLabel}`}
            className={`h-8 px-2.5 text-xs font-medium rounded-md border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isSelected
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#141413] border-[#D4D4CE] hover:bg-[#F1F1EF]'
            }`}
          >
            {isAnalyzingCamera ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Clapperboard className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#D9381E]'}`} />
            )}
            AI Camera Ideas{suggestions.length > 0 ? ` (${suggestions.length})` : ''}
          </button>
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label={`Move ${sceneLabel} up`}
            className="h-8 px-2 text-xs font-medium text-[#575652] hover:text-[#141413] disabled:opacity-35 bg-white border border-[#D4D4CE] rounded-md hover:bg-[#F1F1EF] transition-colors inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Up</span>
          </button>
          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={onMoveDown}
            aria-label={`Move ${sceneLabel} down`}
            className="h-8 px-2 text-xs font-medium text-[#575652] hover:text-[#141413] disabled:opacity-35 bg-white border border-[#D4D4CE] rounded-md hover:bg-[#F1F1EF] transition-colors inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Down</span>
          </button>
          <button
            type="button"
            disabled={isRegenerating}
            onClick={onRegenerate}
            aria-label={`Regenerate ${sceneLabel}`}
            className="h-8 px-2.5 text-xs font-medium text-[#141413] bg-white border border-[#D4D4CE] rounded-md hover:bg-[#F1F1EF] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Regenerate
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${sceneLabel}`}
            className="h-8 w-8 text-[#575652] hover:text-[#DC2626] bg-white border border-[#D4D4CE] rounded-md hover:border-[#FECACA] hover:bg-[#FEF2F2] transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Body: Visual Frame Preview + Prompt Fields */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Keyframe Preview Column */}
        <div className="lg:col-span-4 space-y-3">
          <div className="w-full bg-[#141413] rounded-lg overflow-hidden border border-[#E4E4E0] flex items-center justify-center p-2">
            <div
              style={{ aspectRatio: aspectCss }}
              className="relative w-full max-h-[320px] mx-auto bg-[#232220] rounded overflow-hidden flex items-center justify-center"
            >
              {hasValidImage ? (
                <>
                  <img
                    src={scene.previewImageUrl}
                    alt={`${sceneLabel} — ${scene.shotType}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLightbox(
                        scene.previewImageUrl!,
                        `${sceneLabel} · ${scene.shotType} (${bible.aspectRatio})`
                      )
                    }
                    aria-label={`Expand ${sceneLabel} frame`}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/65 text-white hover:bg-black/85 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="p-4 text-center space-y-2">
                  <ImageIcon className="w-6 h-6 text-white/40 mx-auto" />
                  <p className="text-xs font-mono text-white/70">
                    {sceneLabel} · {bible.aspectRatio}
                  </p>
                  <p className="text-[11px] text-white/45 leading-snug max-w-[180px] mx-auto">
                    Render a keyframe preview or paste the image prompt into Midjourney / Flux.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-[#575652] tabular-nums">
              Frame {bible.aspectRatio}
            </span>
            <button
              type="button"
              disabled={isGeneratingImage}
              onClick={() => {
                setImgFailed(false);
                onGenerateImage();
              }}
              className="h-8 px-3 text-xs font-medium text-[#141413] bg-[#F8F8F7] hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-[#D9381E]" />
                  {hasValidImage ? 'Re-render Frame' : 'Generate Frame'}
                </>
              )}
            </button>
          </div>

          {imageError && (
            <p
              role="alert"
              className="p-2.5 text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg leading-relaxed"
            >
              {imageError}
            </p>
          )}

          {/* Voiceover / Dialogue */}
          <div className="pt-2 border-t border-[#E4E4E0] space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor={`vo-${scene.id}`}
                className="text-xs font-semibold text-[#141413]"
              >
                Voiceover / Dialogue
              </label>
              <button
                type="button"
                onClick={() => handleCopy('vo', `${sceneLabel} Voiceover`, scene.voiceover)}
                aria-label={`Copy ${sceneLabel} Voiceover`}
                className="text-xs text-[#575652] hover:text-[#141413] inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'vo' ? (
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copy
              </button>
            </div>
            <textarea
              id={`vo-${scene.id}`}
              rows={3}
              value={scene.voiceover}
              onChange={(e) => onUpdate({ voiceover: e.target.value })}
              placeholder="Spoken voiceover or dialogue line..."
              className="w-full p-2.5 text-sm leading-relaxed bg-[#F8F8F7] border border-[#E4E4E0] rounded-lg text-[#141413] focus:outline-none focus:bg-white focus:border-[#141413] resize-y"
            />
          </div>
        </div>

        {/* Prompt Engineering Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Image Generation Prompt */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor={`img-prompt-${scene.id}`}
                className="text-xs font-semibold text-[#141413]"
              >
                Image Generation Prompt (Midjourney / Flux / Nano Banana)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSyncBible}
                  className="text-xs text-[#575652] hover:text-[#141413] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D9381E]" />
                  Sync Story Bible
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('img', `${sceneLabel} Image Prompt`, scene.imagePrompt)
                  }
                  aria-label={`Copy ${sceneLabel} Image Prompt`}
                  className="h-7 px-2.5 text-xs font-medium text-white bg-[#141413] hover:bg-[#2E2D2B] rounded-md inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  {copiedField === 'img' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedField === 'img' ? 'Copied' : 'Copy Image Prompt'}
                </button>
              </div>
            </div>
            <textarea
              id={`img-prompt-${scene.id}`}
              rows={6}
              value={scene.imagePrompt}
              onChange={(e) => onUpdate({ imagePrompt: e.target.value })}
              placeholder="Detailed image prompt combining shot type, character bible description, location details, lighting, art style, and aspect ratio..."
              className="w-full p-3 text-xs font-mono leading-relaxed bg-[#F8F8F7] border border-[#E4E4E0] rounded-lg text-[#141413] focus:outline-none focus:bg-white focus:border-[#141413] resize-y"
            />
          </div>

          {/* Video Motion Prompt */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor={`vid-prompt-${scene.id}`}
                className="text-xs font-semibold text-[#141413]"
              >
                Video Animation / Motion Prompt (Sora / Veo / Kling / Runway)
              </label>
              <button
                type="button"
                onClick={() =>
                  handleCopy('vid', `${sceneLabel} Video Prompt`, scene.videoPrompt)
                }
                aria-label={`Copy ${sceneLabel} Video Prompt`}
                className="h-7 px-2.5 text-xs font-medium text-[#141413] bg-[#F8F8F7] hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-md inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {copiedField === 'vid' ? (
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedField === 'vid' ? 'Copied' : 'Copy Video Prompt'}
              </button>
            </div>
            <textarea
              id={`vid-prompt-${scene.id}`}
              rows={3}
              value={scene.videoPrompt}
              onChange={(e) => onUpdate({ videoPrompt: e.target.value })}
              placeholder="Camera movement, subject motion, and ambient atmospheric animation..."
              className="w-full p-3 text-xs font-mono leading-relaxed bg-[#F8F8F7] border border-[#E4E4E0] rounded-lg text-[#141413] focus:outline-none focus:bg-white focus:border-[#141413] resize-y"
            />
          </div>

          {/* Audio / SFX Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor={`sfx-${scene.id}`}
                className="text-xs font-semibold text-[#141413]"
              >
                Audio / SFX &amp; Score Note
              </label>
              <button
                type="button"
                onClick={() => handleCopy('sfx', `${sceneLabel} Audio Note`, scene.audioNote)}
                aria-label={`Copy ${sceneLabel} Audio Note`}
                className="text-xs text-[#575652] hover:text-[#141413] inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'sfx' ? (
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copy
              </button>
            </div>
            <input
              id={`sfx-${scene.id}`}
              type="text"
              value={scene.audioNote}
              onChange={(e) => onUpdate({ audioNote: e.target.value })}
              placeholder="Background music mood, ambient room tone, and foley SFX..."
              className="w-full h-9 px-3 text-xs bg-[#F8F8F7] border border-[#E4E4E0] rounded-lg text-[#141413] focus:outline-none focus:bg-white focus:border-[#141413]"
            />
          </div>
        </div>
      </div>

      {/* Expandable AI Cinematography & Motion Suggestions Panel when Scene is Selected */}
      {isSelected && (
        <CameraSuggestionsTray
          sceneLabel={sceneLabel}
          suggestions={suggestions}
          appliedSuggestionId={scene.appliedSuggestionId}
          isLoading={isAnalyzingCamera}
          errorMessage={cameraError}
          onAnalyze={onAnalyzeCamera}
          onApply={onApplyCameraSuggestion}
        />
      )}
    </article>
  );
}
