import { Copy, FolderPlus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { Project } from '../types';
import { countWords, formatTimecode, totalStoryboardSeconds } from '../utils/storyboard';

interface ProjectManagerDrawerProps {
  open: boolean;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (title: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameActiveProject: (title: string) => void;
  onClose: () => void;
}

export function ProjectManagerDrawer({
  open,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onRenameActiveProject,
  onClose,
}: ProjectManagerDrawerProps) {
  const [newTitle, setNewTitle] = useState('');

  if (!open) return null;

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTitle.trim() || `Production ${projects.length + 1}`;
    onCreateProject(cleaned);
    setNewTitle('');
  };

  return (
    <div
      className="no-print fixed inset-0 z-40 flex justify-end bg-[#141413]/30 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Project Manager"
    >
      <div className="w-full max-w-md bg-white h-full border-l border-[#E4E4E0] flex flex-col">
        <div className="px-6 py-5 border-b border-[#E4E4E0] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#141413]">Project Library</h2>
            <p className="text-xs text-[#575652] mt-0.5">
              Auto-saved locally in your browser · {projects.length} saved
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Project Manager"
            className="p-2 text-[#575652] hover:text-[#141413] rounded-md hover:bg-[#F1F1EF] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active project rename */}
        {activeProject && (
          <div className="px-6 py-4 bg-[#F8F8F7] border-b border-[#E4E4E0]">
            <label
              htmlFor="active-project-title"
              className="block text-xs font-medium text-[#575652] mb-1.5"
            >
              Active Project Title
            </label>
            <input
              id="active-project-title"
              type="text"
              value={activeProject.title}
              onChange={(e) => onRenameActiveProject(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
            />
          </div>
        )}

        {/* New project form */}
        <form onSubmit={handleCreate} className="px-6 py-4 border-b border-[#E4E4E0]">
          <label
            htmlFor="new-project-name"
            className="block text-xs font-medium text-[#575652] mb-1.5"
          >
            Create New Project
          </label>
          <div className="flex items-center gap-2">
            <input
              id="new-project-name"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Neon Diner Noir"
              className="flex-1 h-10 px-3 text-sm bg-white border border-[#D4D4CE] rounded-lg text-[#141413] focus:outline-none focus:border-[#141413]"
            />
            <button
              type="submit"
              className="h-10 px-4 text-sm font-medium bg-[#141413] text-white rounded-lg hover:bg-[#2E2D2B] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </form>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E4E4E0]">
          {projects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            const words = countWords(proj.storyScript);
            const totalSec = totalStoryboardSeconds(proj.scenes);
            return (
              <div
                key={proj.id}
                className={`px-6 py-4 transition-colors ${
                  isActive ? 'bg-[#F8F8F7]' : 'hover:bg-[#FAFAFA]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(proj.id);
                      onClose();
                    }}
                    className="text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#141413] truncate">
                        {proj.title || 'Untitled Production'}
                      </span>
                      {isActive && (
                        <span className="text-xs font-medium text-[#D9381E] shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#575652] font-mono tabular-nums">
                      <span>{proj.scenes.length} scenes</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatTimecode(totalSec)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{words} words</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.bible.aspectRatio}</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicateProject(proj.id)}
                      aria-label={`Duplicate ${proj.title}`}
                      className="p-2 text-[#575652] hover:text-[#141413] rounded-md hover:bg-[#E4E4E0]/60 transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteProject(proj.id)}
                        aria-label={`Delete ${proj.title}`}
                        className="p-2 text-[#575652] hover:text-[#DC2626] rounded-md hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
