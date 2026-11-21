import { Eye, EyeOff, X } from 'lucide-react';
import { useState } from 'react';
import type { EngineSettings, ProviderType } from '../types';

interface EngineSettingsBarProps {
  open: boolean;
  settings: EngineSettings;
  onChange: (next: EngineSettings) => void;
  onClose: () => void;
}

const GEMINI_PRESET_MODELS = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

export function EngineSettingsBar({
  open,
  settings,
  onChange,
  onClose,
}: EngineSettingsBarProps) {
  const [showExternalKey, setShowExternalKey] = useState(false);

  if (!open) return null;

  const update = (patch: Partial<EngineSettings>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <section
      aria-label="Model and Provider Settings"
      className="no-print bg-[#F1F1EF] border-b border-[#E4E4E0]"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#141413]">
              Engine &amp; Provider Configuration
            </h2>
            <p className="text-xs text-[#575652] mt-0.5">
              Use the built-in server-side Google Gemini integration or connect an OpenAI-compatible endpoint (OpenAI, Groq, OpenRouter).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close API Settings"
            className="p-2 text-[#575652] hover:text-[#141413] rounded-md hover:bg-[#E4E4E0]/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Provider selector */}
          <div className="md:col-span-4">
            <label
              htmlFor="engine-provider-select"
              className="block text-xs font-medium text-[#575652] mb-1.5"
            >
              AI Provider
            </label>
            <select
              id="engine-provider-select"
              value={settings.provider}
              onChange={(e) => update({ provider: e.target.value as ProviderType })}
              className="w-full h-10 px-3 text-sm bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
            >
              <option value="gemini">Google Gemini (Built-in Server Proxy)</option>
              <option value="openai-compatible">
                OpenAI Compatible (OpenAI / Groq / OpenRouter)
              </option>
            </select>
          </div>

          {settings.provider === 'gemini' ? (
            <>
              <div className="md:col-span-4">
                <label
                  htmlFor="gemini-model-input"
                  className="block text-xs font-medium text-[#575652] mb-1.5"
                >
                  Gemini Model Name
                </label>
                <input
                  id="gemini-model-input"
                  type="text"
                  list="gemini-model-presets"
                  value={settings.geminiModel}
                  onChange={(e) => update({ geminiModel: e.target.value })}
                  placeholder="gemini-4-hydrogen"
                  className="w-full h-10 px-3 text-sm font-mono bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
                />
                <datalist id="gemini-model-presets">
                  {GEMINI_PRESET_MODELS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-4">
                <div className="h-10 px-3 flex items-center text-xs text-[#575652] bg-white/70 border border-[#E4E4E0] rounded-lg">
                  Gemini requests authenticate automatically via server proxy.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-3">
                <label
                  htmlFor="openai-baseurl-input"
                  className="block text-xs font-medium text-[#575652] mb-1.5"
                >
                  Base URL
                </label>
                <input
                  id="openai-baseurl-input"
                  type="url"
                  value={settings.openaiBaseUrl}
                  onChange={(e) => update({ openaiBaseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full h-10 px-3 text-sm font-mono bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="openai-model-input"
                  className="block text-xs font-medium text-[#575652] mb-1.5"
                >
                  Model Name
                </label>
                <input
                  id="openai-model-input"
                  type="text"
                  value={settings.openaiModel}
                  onChange={(e) => update({ openaiModel: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="w-full h-10 px-3 text-sm font-mono bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
                />
              </div>

              <div className="md:col-span-3">
                <label
                  htmlFor="openai-key-input"
                  className="block text-xs font-medium text-[#575652] mb-1.5"
                >
                  External Provider Key (localStorage)
                </label>
                <div className="relative">
                  <input
                    id="openai-key-input"
                    type={showExternalKey ? 'text' : 'password'}
                    value={settings.openaiApiKey}
                    onChange={(e) => update({ openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    autoComplete="off"
                    className="w-full h-10 pl-3 pr-10 text-sm font-mono bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExternalKey((v) => !v)}
                    aria-label={showExternalKey ? 'Hide external key' : 'Show external key'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#575652] hover:text-[#141413] cursor-pointer"
                  >
                    {showExternalKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
