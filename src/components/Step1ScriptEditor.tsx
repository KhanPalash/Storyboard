import { ArrowRight, FileText, Loader2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Project } from '../types';
import {
  calculateTargetSceneCount,
  calculateTargetWordCount,
  countWords,
  estimateDurationMinutes,
  parseImportedScriptFile,
} from '../utils/storyboard';

interface Step1ScriptEditorProps {
  project: Project;
  isGenerating: boolean;
  errorMessage: string | null;
  onUpdateProject: (patch: Partial<Project>) => void;
  onGenerateStory: () => void;
  onNextStep: () => void;
  onNotify: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

const DURATION_PRESETS = [0.5, 1, 2, 3, 5];

export function Step1ScriptEditor({
  project,
  isGenerating,
  errorMessage,
  onUpdateProject,
  onGenerateStory,
  onNextStep,
  onNotify,
}: Step1ScriptEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isCustomDuration, setIsCustomDuration] = useState(
    !DURATION_PRESETS.includes(project.targetDurationMinutes)
  );

  useEffect(() => {
    setIsCustomDuration(!DURATION_PRESETS.includes(project.targetDurationMinutes));
  }, [project.id, project.targetDurationMinutes]);

  const storyText = project.storyScript ?? '';
  const ideaText = project.ideaInput ?? '';
  const titleText = project.title ?? '';

  const wordCount = countWords(storyText);
  const estimatedMin = estimateDurationMinutes(wordCount);
  const targetWords = calculateTargetWordCount(project.targetDurationMinutes || 1);
  const sceneEstimate = calculateTargetSceneCount(project.targetDurationMinutes || 1);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportNotice(null);

    const lower = file.name.toLowerCase();
    if (lower.endsWith('.docx') || lower.endsWith('.pdf')) {
      const res = parseImportedScriptFile(file.name, '');
      setImportNotice(res.notice || 'Please paste text directly from this document.');
      e.target.value = '';
      return;
    }

    try {
      const rawText = await file.text();
      const parsed = parseImportedScriptFile(file.name, rawText);
      if (!parsed.ok) {
        setImportNotice(parsed.notice || 'Unable to read file.');
      } else if (parsed.text) {
        onUpdateProject({ storyScript: parsed.text });
        onNotify(`Imported ${file.name} (${countWords(parsed.text)} words)`, 'success');
      }
    } catch {
      setImportNotice('Could not read the selected file. Try pasting your script directly.');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Project Context Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4E4E0]">
        <div>
          <p className="text-xs font-medium text-[#575652] mb-1">
            Step 1 of 3 · Narrative Foundation
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413]">
            Script Import &amp; Full Story Editor
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="project-title-inline" className="text-xs text-[#575652] whitespace-nowrap">
            Project
          </label>
          <input
            id="project-title-inline"
            type="text"
            value={titleText}
            onChange={(e) => onUpdateProject({ title: e.target.value })}
            placeholder="Project title"
            className="h-9 px-3 text-sm font-medium bg-white border border-[#D4D4CE] rounded-lg text-[#141413] w-56 focus:outline-none focus:border-[#141413]"
          />
        </div>
      </div>

      {/* Main 2-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Brief / Idea Input, File Import, Target Duration */}
        <div className="lg:col-span-5 bg-white border border-[#E4E4E0] rounded-xl p-6 space-y-6">
          <div>
            <label
              htmlFor="idea-context-textarea"
              className="block text-sm font-semibold text-[#141413] mb-1.5"
            >
              Concept, Premise, or Creative Brief
            </label>
            <p className="text-xs text-[#575652] mb-3">
              Describe your story arc, characters, setting, and mood—or import an existing script file below.
            </p>
            <textarea
              id="idea-context-textarea"
              rows={6}
              value={ideaText}
              onChange={(e) => onUpdateProject({ ideaInput: e.target.value })}
              placeholder="e.g. A 1-minute cinematic portrait of a lighthouse keeper discovering an old brass compass washed ashore after a winter storm..."
              className="w-full p-3.5 text-sm leading-relaxed bg-[#F8F8F7] border border-[#D4D4CE] rounded-lg text-[#141413] placeholder:text-[#8A8882] focus:outline-none focus:bg-white focus:border-[#141413] resize-y"
            />
          </div>

          {/* Target Duration Selector */}
          <div className="pt-4 border-t border-[#E4E4E0]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-semibold text-[#141413]">
                Target Video Duration
              </span>
              <span className="text-xs font-mono tabular-nums text-[#575652]">
                ~{targetWords} words · {sceneEstimate.min}–{sceneEstimate.max} scenes
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-[#F1F1EF] rounded-lg">
              {DURATION_PRESETS.map((min) => {
                const active = !isCustomDuration && project.targetDurationMinutes === min;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => {
                      setIsCustomDuration(false);
                      onUpdateProject({ targetDurationMinutes: min });
                    }}
                    className={`h-9 text-xs font-medium font-mono tabular-nums rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-white text-[#141413] shadow-xs border border-[#E4E4E0]'
                        : 'text-[#575652] hover:text-[#141413]'
                    }`}
                  >
                    {min}m
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomDuration(true)}
                className={`h-9 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  isCustomDuration
                    ? 'bg-white text-[#141413] shadow-xs border border-[#E4E4E0]'
                    : 'text-[#575652] hover:text-[#141413]'
                }`}
              >
                Custom
              </button>
            </div>

            {isCustomDuration && (
              <div className="mt-3 flex items-center gap-3">
                <label htmlFor="custom-duration-input" className="text-xs text-[#575652]">
                  Minutes:
                </label>
                <input
                  id="custom-duration-input"
                  type="number"
                  min={0.25}
                  max={30}
                  step={0.25}
                  value={project.targetDurationMinutes}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (Number.isFinite(val) && val > 0) {
                      onUpdateProject({ targetDurationMinutes: val });
                    }
                  }}
                  className="w-28 h-9 px-3 text-sm font-mono tabular-nums bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
                />
                <span className="text-xs text-[#8A8882]">Paced at 140 WPM</span>
              </div>
            )}
          </div>

          {/* Primary Generate Story CTA */}
          <div>
            <button
              type="button"
              disabled={isGenerating}
              onClick={onGenerateStory}
              className="w-full h-11 px-5 text-sm font-semibold text-white bg-[#D9381E] hover:bg-[#B92C16] disabled:opacity-60 rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Writing Screenplay (~{targetWords} words)...
                </>
              ) : (
                'Generate Full Story / Screenplay'
              )}
            </button>
            {errorMessage && (
              <p
                role="alert"
                className="mt-3 p-3 text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg"
              >
                {errorMessage}
              </p>
            )}
          </div>

          {/* File Import Area */}
          <div className="pt-4 border-t border-[#E4E4E0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#141413]">
                Or Import Existing Script File
              </span>
              <span className="text-xs text-[#8A8882]">.txt · .md · .fountain</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.fountain,.docx,.pdf"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Import script file"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 border border-dashed border-[#C7C6BF] hover:border-[#141413] rounded-lg bg-[#F8F8F7] hover:bg-[#F1F1EF] transition-colors flex items-center justify-center gap-2 text-xs font-medium text-[#141413] cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#575652]" />
              Choose Script File (.txt, .md, .fountain, .docx, .pdf)
            </button>
            {importNotice && (
              <div
                role="status"
                className="mt-3 p-3 text-xs text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg leading-relaxed"
              >
                {importNotice}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Full Story Edit Mode */}
        <div className="lg:col-span-7 bg-white border border-[#E4E4E0] rounded-xl p-6 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E4E4E0]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#575652]" />
              <h2 className="text-base font-semibold text-[#141413]">
                Full Story Edit Mode
              </h2>
            </div>

            <div
              data-testid="script-metrics"
              className="flex items-center gap-2.5 text-xs font-mono tabular-nums text-[#575652]"
            >
              <span>{wordCount} words</span>
              <span aria-hidden="true">·</span>
              <span>Est. {estimatedMin} min</span>
              <span aria-hidden="true">·</span>
              <span>140 WPM</span>
            </div>
          </div>

          <label htmlFor="full-story-editor" className="sr-only">
            Full Story Screenplay Editor
          </label>
          <textarea
            id="full-story-editor"
            rows={17}
            value={storyText}
            onChange={(e) => onUpdateProject({ storyScript: e.target.value })}
            placeholder="Your generated screenplay or imported script appears here. Edit dialogue, narration, and scene beats freely before locking your Story Bible in Step 2."
            className="w-full flex-1 p-4 text-[15px] leading-relaxed bg-[#F8F8F7] border border-[#E4E4E0] rounded-lg text-[#141413] placeholder:text-[#8A8882] focus:outline-none focus:bg-white focus:border-[#141413] resize-y"
          />

          <div className="mt-5 pt-4 border-t border-[#E4E4E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-[#575652]">
              Auto-saved locally. Refine every spoken line before extracting characters and locations.
            </p>
            <button
              type="button"
              onClick={onNextStep}
              className="h-11 px-5 text-sm font-semibold text-white bg-[#141413] hover:bg-[#2E2D2B] rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Next: Define Style &amp; Characters
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
