import { ArrowLeft, ArrowRight, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import type {
  AspectRatioOption,
  ArtStyleOption,
  CharacterEntry,
  LocationEntry,
  Project,
  StoryBible,
} from '../types';
import { ART_STYLES, ASPECT_RATIOS } from '../utils/storyboard';

interface Step2StoryBibleProps {
  project: Project;
  isExtracting: boolean;
  isGeneratingScenes: boolean;
  errorMessage: string | null;
  onUpdateBible: (bible: StoryBible) => void;
  onAutoExtract: () => void;
  onGenerateScenes: () => void;
  onBackStep: () => void;
  onOpenExistingScenes: () => void;
}

export function Step2StoryBible({
  project,
  isExtracting,
  isGeneratingScenes,
  errorMessage,
  onUpdateBible,
  onAutoExtract,
  onGenerateScenes,
  onBackStep,
  onOpenExistingScenes,
}: Step2StoryBibleProps) {
  const { bible } = project;

  const updateField = <K extends keyof StoryBible>(key: K, value: StoryBible[K]) => {
    onUpdateBible({ ...bible, [key]: value });
  };

  const addCharacter = () => {
    const next: CharacterEntry = {
      id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      appearance: '',
    };
    updateField('characters', [...bible.characters, next]);
  };

  const updateCharacter = (id: string, patch: Partial<CharacterEntry>) => {
    updateField(
      'characters',
      bible.characters.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const deleteCharacter = (id: string) => {
    updateField(
      'characters',
      bible.characters.filter((c) => c.id !== id)
    );
  };

  const addLocation = () => {
    const next: LocationEntry = {
      id: `loc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      details: '',
    };
    updateField('locations', [...bible.locations, next]);
  };

  const updateLocation = (id: string, patch: Partial<LocationEntry>) => {
    updateField(
      'locations',
      bible.locations.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const deleteLocation = (id: string) => {
    updateField(
      'locations',
      bible.locations.filter((l) => l.id !== id)
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4E4E0]">
        <div>
          <p className="text-xs font-medium text-[#575652] mb-1">
            Step 2 of 3 · Visual Continuity Lock
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413]">
            Story Bible — Style, Characters &amp; Locations
          </h1>
        </div>

        <button
          type="button"
          disabled={isExtracting}
          onClick={onAutoExtract}
          className="h-10 px-4 text-sm font-medium text-[#141413] bg-white hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting from Story...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#D9381E]" />
              Auto-Extract Characters &amp; Locations
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 text-sm text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl"
        >
          {errorMessage}
        </div>
      )}

      {/* Global Art Style & Aspect Ratio Controls */}
      <section className="bg-white border border-[#E4E4E0] rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Art Style */}
          <div className="lg:col-span-6 space-y-3">
            <span className="block text-sm font-semibold text-[#141413]">
              Global Visual / Art Style
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ART_STYLES.map((style: ArtStyleOption) => {
                const selected = bible.artStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateField('artStyle', style)}
                    className={`px-3 py-2.5 text-left text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#141413] text-white border-[#141413]'
                        : 'bg-[#F8F8F7] text-[#141413] border-[#E4E4E0] hover:border-[#A8A7A0]'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label
                htmlFor="custom-style-modifier"
                className="block text-xs font-medium text-[#575652] mb-1.5"
              >
                Custom Style / Lens / Color Grading Modifier
              </label>
              <input
                id="custom-style-modifier"
                type="text"
                value={bible.customStyleModifier}
                onChange={(e) => updateField('customStyleModifier', e.target.value)}
                placeholder="e.g. 35mm anamorphic lens, Kodak Vision3 500T grain, soft practical tungsten lighting"
                className="w-full h-10 px-3 text-sm bg-[#F8F8F7] border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:bg-white focus:border-[#141413]"
              />
            </div>
          </div>

          {/* Aspect Ratio Picker — Full 8 Ratios */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#141413]">
                Frame Aspect Ratio
              </span>
              <span className="text-xs font-mono tabular-nums text-[#575652]">
                Selected: {bible.aspectRatio}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ASPECT_RATIOS.map((ar) => {
                const selected = bible.aspectRatio === ar.value;
                const maxDim = 22;
                const scale = maxDim / Math.max(ar.width, ar.height);
                const boxW = Math.max(8, Math.round(ar.width * scale));
                const boxH = Math.max(8, Math.round(ar.height * scale));
                return (
                  <button
                    key={ar.value}
                    type="button"
                    onClick={() => updateField('aspectRatio', ar.value as AspectRatioOption)}
                    aria-pressed={selected}
                    className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#141413] text-white border-[#141413]'
                        : 'bg-[#F8F8F7] text-[#141413] border-[#E4E4E0] hover:border-[#A8A7A0]'
                    }`}
                  >
                    <div className="h-6 flex items-center justify-center">
                      <span
                        aria-hidden="true"
                        style={{ width: `${boxW}px`, height: `${boxH}px` }}
                        className={`block border-2 rounded-[2px] ${
                          selected ? 'border-white' : 'border-[#575652]'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold tabular-nums">
                      {ar.label}
                    </span>
                    <span
                      className={`text-[10px] leading-none truncate max-w-full ${
                        selected ? 'text-white/75' : 'text-[#8A8882]'
                      }`}
                    >
                      {ar.descriptor}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#575652] leading-relaxed">
              Applied to every generated image prompt (<code className="font-mono">--ar {bible.aspectRatio}</code>) and live storyboard keyframe preview frames.
            </p>
          </div>
        </div>
      </section>

      {/* Character Bible & Location Bible 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Characters */}
        <section className="bg-white border border-[#E4E4E0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E0]">
            <div>
              <h2 className="text-base font-semibold text-[#141413]">
                Character Consistency Bible
              </h2>
              <p className="text-xs text-[#575652] mt-0.5">
                {bible.characters.length} locked · Age, face, hair, clothing &amp; signature props
              </p>
            </div>
            <button
              type="button"
              onClick={addCharacter}
              className="h-9 px-3 text-xs font-medium text-[#141413] bg-[#F8F8F7] hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Character
            </button>
          </div>

          {bible.characters.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#575652] bg-[#F8F8F7] rounded-lg border border-dashed border-[#D4D4CE]">
              No characters defined yet. Click &ldquo;Auto-Extract Characters &amp; Locations&rdquo; or &ldquo;Add Character&rdquo;.
            </div>
          ) : (
            <div className="space-y-4" data-testid="character-bible-list">
              {bible.characters.map((char, idx) => (
                <div
                  key={char.id}
                  className="p-4 bg-[#F8F8F7] border border-[#E4E4E0] rounded-lg space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <label htmlFor={`char-name-${char.id}`} className="sr-only">
                      Character {idx + 1} Name
                    </label>
                    <input
                      id={`char-name-${char.id}`}
                      type="text"
                      value={char.name}
                      onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                      placeholder="Character Name (e.g. Hana Sato)"
                      className="flex-1 h-9 px-3 text-sm font-semibold bg-white border border-[#D4D4CE] rounded-md text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                    <button
                      type="button"
                      onClick={() => deleteCharacter(char.id)}
                      aria-label={`Delete character ${char.name || idx + 1}`}
                      className="p-2 text-[#575652] hover:text-[#DC2626] rounded-md hover:bg-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <label htmlFor={`char-desc-${char.id}`} className="sr-only">
                    Character {idx + 1} Visual Appearance
                  </label>
                  <textarea
                    id={`char-desc-${char.id}`}
                    rows={3}
                    value={char.appearance}
                    onChange={(e) => updateCharacter(char.id, { appearance: e.target.value })}
                    placeholder="Detailed visual appearance: exact age, facial features, hair length/color, wardrobe garments, colors, props..."
                    className="w-full p-2.5 text-xs leading-relaxed bg-white border border-[#D4D4CE] rounded-md text-[#141413] focus:outline-none focus:border-[#141413] resize-y"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Locations */}
        <section className="bg-white border border-[#E4E4E0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E0]">
            <div>
              <h2 className="text-base font-semibold text-[#141413]">
                Location &amp; Environment Bible
              </h2>
              <p className="text-xs text-[#575652] mt-0.5">
                {bible.locations.length} locked · Architecture, lighting, weather &amp; color palette
              </p>
            </div>
            <button
              type="button"
              onClick={addLocation}
              className="h-9 px-3 text-xs font-medium text-[#141413] bg-[#F8F8F7] hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Location
            </button>
          </div>

          {bible.locations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#575652] bg-[#F8F8F7] rounded-lg border border-dashed border-[#D4D4CE]">
              No locations defined yet. Click &ldquo;Auto-Extract Characters &amp; Locations&rdquo; or &ldquo;Add Location&rdquo;.
            </div>
          ) : (
            <div className="space-y-4" data-testid="location-bible-list">
              {bible.locations.map((loc, idx) => (
                <div
                  key={loc.id}
                  className="p-4 bg-[#F8F8F7] border border-[#E4E4E0] rounded-lg space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <label htmlFor={`loc-name-${loc.id}`} className="sr-only">
                      Location {idx + 1} Name
                    </label>
                    <input
                      id={`loc-name-${loc.id}`}
                      type="text"
                      value={loc.name}
                      onChange={(e) => updateLocation(loc.id, { name: e.target.value })}
                      placeholder="Location Name (e.g. Gion Rain Alley)"
                      className="flex-1 h-9 px-3 text-sm font-semibold bg-white border border-[#D4D4CE] rounded-md text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                    <button
                      type="button"
                      onClick={() => deleteLocation(loc.id)}
                      aria-label={`Delete location ${loc.name || idx + 1}`}
                      className="p-2 text-[#575652] hover:text-[#DC2626] rounded-md hover:bg-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <label htmlFor={`loc-desc-${loc.id}`} className="sr-only">
                    Location {idx + 1} Environment Details
                  </label>
                  <textarea
                    id={`loc-desc-${loc.id}`}
                    rows={3}
                    value={loc.details}
                    onChange={(e) => updateLocation(loc.id, { details: e.target.value })}
                    placeholder="Visual environment & lighting details: materials, time of day, weather, practical lamps, background depth..."
                    className="w-full p-2.5 text-xs leading-relaxed bg-white border border-[#D4D4CE] rounded-md text-[#141413] focus:outline-none focus:border-[#141413] resize-y"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Consistency Guarantee + Step Actions */}
      <div className="bg-white border border-[#E4E4E0] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <p className="text-sm font-semibold text-[#141413]">
            Automatic Verbatim Story Bible Injection
          </p>
          <p className="text-xs text-[#575652] leading-relaxed">
            When generating Step 3 scenes, every Character and Location description above is embedded directly into each image prompt alongside your Art Style and Aspect Ratio so Midjourney, Flux, Sora, Veo, and Kling maintain frame-to-frame visual continuity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackStep}
            className="h-11 px-4 text-sm font-medium text-[#575652] hover:text-[#141413] border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Script
          </button>

          {project.scenes.length > 0 && (
            <button
              type="button"
              onClick={onOpenExistingScenes}
              className="h-11 px-4 text-sm font-medium text-[#141413] bg-[#F8F8F7] hover:bg-[#F1F1EF] border border-[#D4D4CE] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              View Current Scenes ({project.scenes.length})
            </button>
          )}

          <button
            type="button"
            disabled={isGeneratingScenes}
            onClick={onGenerateScenes}
            className="h-11 px-5 text-sm font-semibold text-white bg-[#D9381E] hover:bg-[#B92C16] disabled:opacity-60 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {isGeneratingScenes ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Scene Prompts...
              </>
            ) : (
              <>
                Next: Generate Scene Breakdown &amp; Prompts
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
