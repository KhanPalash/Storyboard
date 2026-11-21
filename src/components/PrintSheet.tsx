import type { Project } from '../types';
import { formatTimecode, totalStoryboardSeconds } from '../utils/storyboard';

interface PrintSheetProps {
  project: Project;
}

export function PrintSheet({ project }: PrintSheetProps) {
  const totalSec = totalStoryboardSeconds(project.scenes);

  return (
    <div className="print-only hidden p-4 text-[#141413]">
      <div className="border-b-2 border-[#141413] pb-3 mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-mono text-[#575652]">StoryPrompt Studio · Production Sheet</p>
          <div className="text-2xl font-bold mt-0.5">{project.title}</div>
        </div>
        <div className="text-right text-xs font-mono tabular-nums text-[#575652]">
          <div>
            {project.scenes.length} Scenes · {formatTimecode(totalSec)} ({totalSec}s)
          </div>
          <div>
            {project.bible.artStyle} · Aspect Ratio {project.bible.aspectRatio}
          </div>
        </div>
      </div>

      {/* Story Bible Summary */}
      {(project.bible.characters.length > 0 || project.bible.locations.length > 0) && (
        <div className="grid grid-cols-2 gap-6 mb-6 pb-4 border-b border-[#D4D4CE] text-xs">
          <div>
            <h2 className="font-bold text-sm mb-2">Locked Characters</h2>
            <ul className="space-y-1.5">
              {project.bible.characters.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}:</strong> {c.appearance}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-sm mb-2">Locked Locations</h2>
            <ul className="space-y-1.5">
              {project.bible.locations.map((l) => (
                <li key={l.id}>
                  <strong>{l.name}:</strong> {l.details}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Scene Cards */}
      <div>
        {project.scenes.map((scene) => (
          <div key={scene.id} className="print-scene-card rounded-lg">
            <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-2 mb-3 text-xs font-mono">
              <strong>
                SCENE {String(scene.sceneNumber).padStart(2, '0')} · {scene.durationSec}s ·{' '}
                {scene.shotType}
                {scene.cameraAngle ? ` · ${scene.cameraAngle}` : ''}
              </strong>
              <span>{scene.locationName}</span>
            </div>

            <div className="grid grid-cols-12 gap-4 items-start text-xs">
              {scene.previewImageUrl && (
                <div className="col-span-4">
                  <img
                    src={scene.previewImageUrl}
                    alt={`Scene ${scene.sceneNumber}`}
                    referrerPolicy="no-referrer"
                    className="w-full rounded border border-[#E4E4E0] object-cover"
                  />
                </div>
              )}
              <div className={scene.previewImageUrl ? 'col-span-8 space-y-2' : 'col-span-12 space-y-2'}>
                <div>
                  <strong>Voiceover:</strong> {scene.voiceover || '(Silent beat)'}
                </div>
                <div>
                  <strong>Image Prompt:</strong>{' '}
                  <span className="font-mono text-[11px]">{scene.imagePrompt}</span>
                </div>
                <div>
                  <strong>Video Motion Prompt:</strong>{' '}
                  <span className="font-mono text-[11px]">{scene.videoPrompt}</span>
                </div>
                <div>
                  <strong>Audio / SFX:</strong> {scene.audioNote}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
