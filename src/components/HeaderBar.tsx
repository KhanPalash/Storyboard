import type { WorkflowStep } from '../types';

interface HeaderBarProps {
  activeStep: WorkflowStep;
  onSelectStep: (step: WorkflowStep) => void;
  projectsOpen: boolean;
  onToggleProjects: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
}

export function HeaderBar({
  activeStep,
  onSelectStep,
  projectsOpen,
  onToggleProjects,
  settingsOpen,
  onToggleSettings,
  chatOpen,
  onToggleChat,
}: HeaderBarProps) {
  const navLinks = (
    <>
      <button
        type="button"
        onClick={() => onSelectStep(1)}
        aria-current={activeStep === 1 ? 'step' : undefined}
        className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
          activeStep === 1
            ? 'text-[#141413] border-[#D9381E]'
            : 'text-[#575652] border-transparent hover:text-[#141413]'
        }`}
      >
        1. Script
      </button>
      <button
        type="button"
        onClick={() => onSelectStep(2)}
        aria-current={activeStep === 2 ? 'step' : undefined}
        className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
          activeStep === 2
            ? 'text-[#141413] border-[#D9381E]'
            : 'text-[#575652] border-transparent hover:text-[#141413]'
        }`}
      >
        2. Story Bible
      </button>
      <button
        type="button"
        onClick={() => onSelectStep(3)}
        aria-current={activeStep === 3 ? 'step' : undefined}
        className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
          activeStep === 3
            ? 'text-[#141413] border-[#D9381E]'
            : 'text-[#575652] border-transparent hover:text-[#141413]'
        }`}
      >
        3. Storyboard
      </button>
      <button
        type="button"
        onClick={onToggleProjects}
        aria-expanded={projectsOpen}
        className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
          projectsOpen
            ? 'text-[#141413] border-[#141413]'
            : 'text-[#575652] border-transparent hover:text-[#141413]'
        }`}
      >
        Projects
      </button>
      <button
        type="button"
        onClick={onToggleSettings}
        aria-expanded={settingsOpen}
        className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
          settingsOpen
            ? 'text-[#141413] border-[#141413]'
            : 'text-[#575652] border-transparent hover:text-[#141413]'
        }`}
      >
        API Settings
      </button>
    </>
  );

  return (
    <header className="no-print sticky top-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#E4E4E0]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-14 md:h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectStep(1)}
          className="font-display text-lg font-bold tracking-tight text-[#141413] hover:text-[#D9381E] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9381E] cursor-pointer"
        >
          StoryPrompt Studio
        </button>

        {/* Zone 2 (Desktop): 5 concise single-line navigation links */}
        <nav
          aria-label="Workspace navigation"
          className="hidden md:flex items-center gap-6 py-1"
        >
          {navLinks}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onToggleChat}
            aria-expanded={chatOpen}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9381E] ${
              chatOpen
                ? 'bg-[#141413] text-white'
                : 'bg-[#D9381E] text-white hover:bg-[#B92C16]'
            }`}
          >
            Director Chat
          </button>
        </div>
      </div>

      {/* Mobile-only compact horizontal navigation strip (keeps total sticky header <= 12% of mobile viewport) */}
      <nav
        aria-label="Mobile workspace navigation"
        className="md:hidden border-t border-[#E4E4E0] px-4 h-11 flex items-center gap-5 overflow-x-auto"
      >
        {navLinks}
      </nav>
    </header>
  );
}
