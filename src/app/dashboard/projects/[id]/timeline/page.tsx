import { createClient } from "@/lib/supabase/server";
import { createEmptyTracks, totalDurationSeconds } from "@/lib/timeline/tracks";
import type { TimelineTrack } from "@/types/timeline";
import { moveClipInTimeline, removeClipFromTimeline } from "./actions";

const PIXELS_PER_SECOND = 12;

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("timelines")
    .select("tracks")
    .eq("project_id", projectId)
    .maybeSingle();

  const tracks = (data?.tracks as unknown as TimelineTrack[] | undefined) ?? createEmptyTracks();
  const removeClipWithProject = removeClipFromTimeline.bind(null, projectId);
  const moveClipWithProject = moveClipInTimeline.bind(null, projectId);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Clips added from Scenes land here on the matching track. Trim, split,
        and drag-to-reorder aren&apos;t built yet — use the arrows to reorder
        and Remove to delete for now.
      </p>

      <div className="scrollbar-thin flex flex-col gap-2 overflow-x-auto rounded-xl border border-border bg-card p-4">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
              {track.name}
              <div className="text-[10px] text-muted-foreground/70">
                {totalDurationSeconds(track)}s
              </div>
            </div>
            <div className="flex min-h-12 flex-1 items-center gap-1">
              {track.clips.length === 0 ? (
                <div className="h-10 flex-1 rounded-md border border-dashed border-border" />
              ) : (
                track.clips.map((clip, index) => (
                  <div
                    key={clip.id}
                    style={{ width: `${Math.max(clip.durationSeconds * PIXELS_PER_SECOND, 60)}px` }}
                    className="group relative flex h-10 shrink-0 flex-col justify-center rounded-md bg-primary/20 px-2 text-accent"
                  >
                    <p className="truncate text-[11px]">{clip.label}</p>
                    <div className="absolute -top-2 right-0 hidden gap-1 group-hover:flex">
                      {index > 0 && (
                        <form action={moveClipWithProject.bind(null, clip.id, "left")}>
                          <button className="rounded bg-background px-1 text-[10px] text-muted-foreground">
                            ←
                          </button>
                        </form>
                      )}
                      {index < track.clips.length - 1 && (
                        <form action={moveClipWithProject.bind(null, clip.id, "right")}>
                          <button className="rounded bg-background px-1 text-[10px] text-muted-foreground">
                            →
                          </button>
                        </form>
                      )}
                      <form action={removeClipWithProject.bind(null, clip.id)}>
                        <button className="rounded bg-background px-1 text-[10px] text-destructive">
                          ✕
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
