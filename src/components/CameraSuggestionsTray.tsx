import { Check, Clapperboard, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import type { CameraSuggestion } from '../types';

interface CameraSuggestionsTrayProps {
  sceneLabel: string;
  suggestions: CameraSuggestion[];
  appliedSuggestionId?: string;
  isLoading: boolean;
  errorMessage?: string | null;
  onAnalyze: () => void;
  onApply: (suggestion: CameraSuggestion, mode: 'all' | 'shot' | 'motion') => void;
}

export function CameraSuggestionsTray({
  sceneLabel,
  suggestions,
  appliedSuggestionId,
  isLoading,
  errorMessage,
  onAnalyze,
  onApply,
}: CameraSuggestionsTrayProps) {
  return (
    <section
      aria-label={`AI Camera & Motion Suggestions for ${sceneLabel}`}
      data-testid="camera-suggestions-tray"
      className="border-t border-[#E4E4E0] bg-[#F8F8F7] px-5 py-4 space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-[#D9381E] shrink-0" />
          <div>
            <h3 className="text-xs font-semibold text-[#141413]">
              AI Cinematography &amp; Motion Suggestions
            </h3>
            <p className="text-[11px] text-[#575652]">
              Analyzed from {sceneLabel} dialogue and visual action — apply an entire setup or mix shot framing and motion.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={onAnalyze}
          aria-label={`Analyze ${sceneLabel} with AI`}
          className="h-8 px-3 text-xs font-medium text-[#141413] bg-white hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-55"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D9381E]" />
              Analyzing Scene...
            </>
          ) : suggestions.length > 0 ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Re-analyze Scene
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#D9381E]" />
              Analyze Scene with AI
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="p-2.5 text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg"
        >
          {errorMessage}
        </p>
      )}

      {isLoading && suggestions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="p-4 bg-white border border-[#E4E4E0] rounded-lg space-y-2.5 animate-pulse"
            >
              <div className="h-3.5 w-32 bg-[#E4E4E0] rounded" />
              <div className="h-3 w-44 bg-[#F1F1EF] rounded" />
              <div className="h-12 w-full bg-[#F1F1EF] rounded" />
              <div className="h-7 w-24 bg-[#E4E4E0] rounded" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-5 bg-white border border-dashed border-[#D4D4CE] rounded-lg text-center space-y-2">
          <p className="text-xs text-[#575652]">
            No cinematography options yet for {sceneLabel}. Add voiceover dialogue or scene action above, then click &ldquo;Analyze Scene with AI&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((opt, idx) => {
            const isApplied = appliedSuggestionId === opt.id;
            return (
              <div
                key={opt.id || idx}
                data-testid={`camera-option-${idx + 1}`}
                className={`p-4 bg-white rounded-lg border flex flex-col justify-between gap-3 transition-colors ${
                  isApplied ? 'border-[#141413]' : 'border-[#E4E4E0] hover:border-[#A8A7A0]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#141413]">
                      0{idx + 1}. {opt.label}
                    </span>
                    {isApplied && (
                      <span className="text-[11px] font-medium text-[#16A34A] inline-flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" />
                        Applied
                      </span>
                    )}
                  </div>

                  {/* Clean unboxed typographic metadata (Zero-Pill Discipline) */}
                  <div className="text-xs font-mono text-[#141413] leading-snug">
                    <span>{opt.shotType}</span>
                    <span aria-hidden="true" className="mx-1.5 text-[#8A8882]">
                      ·
                    </span>
                    <span className="text-[#575652]">{opt.cameraAngle}</span>
                  </div>

                  <p className="text-xs text-[#575652] leading-relaxed">
                    {opt.rationale}
                  </p>

                  <div className="pt-2 border-t border-[#F1F1EF]">
                    <span className="block text-[10px] font-medium text-[#8A8882] mb-1">
                      Suggested Video Motion Prompt
                    </span>
                    <p className="text-[11px] font-mono text-[#141413] leading-relaxed">
                      {opt.videoPrompt}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F1F1EF] flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onApply(opt, 'all')}
                    aria-label={`Apply option ${idx + 1} (${opt.label}) to ${sceneLabel}`}
                    className={`h-7 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      isApplied
                        ? 'bg-[#F1F1EF] text-[#141413] hover:bg-[#E4E4E0]'
                        : 'bg-[#141413] text-white hover:bg-[#D9381E]'
                    }`}
                  >
                    Apply All
                  </button>
                  <button
                    type="button"
                    onClick={() => onApply(opt, 'shot')}
                    aria-label={`Apply shot and angle from option ${idx + 1} to ${sceneLabel}`}
                    className="h-7 px-2 text-[11px] font-medium text-[#575652] hover:text-[#141413] hover:bg-[#F1F1EF] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Shot &amp; Angle
                  </button>
                  <button
                    type="button"
                    onClick={() => onApply(opt, 'motion')}
                    aria-label={`Apply motion prompt from option ${idx + 1} to ${sceneLabel}`}
                    className="h-7 px-2 text-[11px] font-medium text-[#575652] hover:text-[#141413] hover:bg-[#F1F1EF] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Motion Only
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
