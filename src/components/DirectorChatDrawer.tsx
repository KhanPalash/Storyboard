import { Copy, Loader2, RotateCcw, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, DirectorRole } from '../types';

interface DirectorChatDrawerProps {
  open: boolean;
  messages: ChatMessage[];
  directorRole: DirectorRole;
  isSending: boolean;
  errorMessage: string | null;
  onChangeRole: (role: DirectorRole) => void;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  onCopyText: (label: string, text: string) => void;
  onClose: () => void;
}

const DIRECTOR_ROLES: DirectorRole[] = [
  'Cinematographer & Prompt Architect',
  'Screenplay & Pacing Doctor',
  'Visual Continuity Supervisor',
];

const QUICK_PROMPTS = [
  'Audit my Story Bible for visual continuity gaps',
  'Tighten Scene 01 image prompt for Midjourney v6',
  'Suggest stronger camera transitions between scenes',
];

export function DirectorChatDrawer({
  open,
  messages,
  directorRole,
  isSending,
  errorMessage,
  onChangeRole,
  onSendMessage,
  onClearHistory,
  onCopyText,
  onClose,
}: DirectorChatDrawerProps) {
  const [draft, setDraft] = useState('');
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, open, isSending]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || isSending) return;
    onSendMessage(cleaned);
    setDraft('');
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="Director AI Chat"
      className="no-print fixed right-0 top-16 bottom-0 z-40 w-full max-w-md bg-white border-l border-[#E4E4E0] shadow-xl flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E4E4E0] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#141413]">
            Director’s Room AI
          </h2>
          <p className="text-xs text-[#575652]">
            Multi-turn assistant synced to your active project
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClearHistory}
            aria-label="Reset chat conversation"
            className="p-2 text-[#575652] hover:text-[#141413] rounded-md hover:bg-[#F1F1EF] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Director Chat"
            className="p-2 text-[#575652] hover:text-[#141413] rounded-md hover:bg-[#F1F1EF] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* System Role Selector */}
      <div className="px-5 py-3 bg-[#F8F8F7] border-b border-[#E4E4E0]">
        <label
          htmlFor="director-role-select"
          className="block text-xs font-medium text-[#575652] mb-1"
        >
          Advisor Persona (System Instruction)
        </label>
        <select
          id="director-role-select"
          value={directorRole}
          onChange={(e) => onChangeRole(e.target.value as DirectorRole)}
          className="w-full h-9 px-2.5 text-xs font-medium bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
        >
          {DIRECTOR_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable Thread */}
      <div
        data-testid="director-chat-thread"
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[11px] font-medium text-[#8A8882] mb-1">
                {isUser ? 'You' : directorRole.split(' ')[0]}
              </span>
              <div
                className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[#141413] text-white'
                    : 'bg-[#F8F8F7] text-[#141413] border border-[#E4E4E0]'
                }`}
              >
                {msg.text}
                {!isUser && (
                  <div className="mt-2 pt-2 border-t border-[#E4E4E0] flex justify-end">
                    <button
                      type="button"
                      onClick={() => onCopyText('Director note', msg.text)}
                      className="text-[11px] text-[#575652] hover:text-[#141413] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Copy reply
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-[#575652]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D9381E]" />
            Reviewing your storyboard...
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="p-3 text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg"
          >
            {errorMessage}
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-5 py-2.5 border-t border-[#E4E4E0] bg-[#FAFAFA] flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isSending}
            onClick={() => onSendMessage(q)}
            className="px-2.5 py-1 text-[11px] font-medium text-[#575652] hover:text-[#141413] bg-white border border-[#E4E4E0] hover:border-[#141413] rounded-md transition-colors text-left cursor-pointer disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-[#E4E4E0] bg-white flex items-center gap-2"
      >
        <label htmlFor="director-chat-input" className="sr-only">
          Message Director AI
        </label>
        <input
          id="director-chat-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about lenses, pacing, prompts, continuity..."
          className="flex-1 h-10 px-3 text-sm bg-[#F8F8F7] border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:bg-white focus:border-[#141413]"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          aria-label="Send message to Director AI"
          className="h-10 w-10 bg-[#D9381E] hover:bg-[#B92C16] disabled:opacity-45 text-white rounded-lg inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}
