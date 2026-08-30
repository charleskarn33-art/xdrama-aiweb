"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addClipToTrack, createEmptyTracks, moveClip, removeClip } from "@/lib/timeline/tracks";
import type { TimelineClip, TimelineTrack, TrackType } from "@/types/timeline";
import type { Json } from "@/types/database";

async function loadTracks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
): Promise<TimelineTrack[]> {
  const { data } = await supabase
    .from("timelines")
    .select("tracks")
    .eq("project_id", projectId)
    .maybeSingle();

  return data ? ((data.tracks as unknown as TimelineTrack[]) ?? createEmptyTracks()) : createEmptyTracks();
}

async function saveTracks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  tracks: TimelineTrack[],
) {
  const { error } = await supabase
    .from("timelines")
    .upsert({ project_id: projectId, tracks: tracks as unknown as Json });
  if (error) throw new Error(error.message);
}

export async function addShotToTimeline(projectId: string, shotId: string) {
  const supabase = await createClient();

  const { data: shot, error } = await supabase
    .from("shots")
    .select("shot_number, prompt, duration_seconds")
    .eq("id", shotId)
    .single();
  if (error) throw new Error(error.message);

  const clip: TimelineClip = {
    id: crypto.randomUUID(),
    sourceType: "shot",
    sourceId: shotId,
    label: shot.prompt ? `Shot ${shot.shot_number}: ${shot.prompt}` : `Shot ${shot.shot_number}`,
    durationSeconds: shot.duration_seconds ?? 5,
  };

  const tracks = addClipToTrack(await loadTracks(supabase, projectId), "video", clip);
  await saveTracks(supabase, projectId, tracks);

  revalidatePath(`/dashboard/projects/${projectId}/timeline`);
}

export async function removeClipFromTimeline(projectId: string, clipId: string) {
  const supabase = await createClient();
  const tracks = removeClip(await loadTracks(supabase, projectId), clipId);
  await saveTracks(supabase, projectId, tracks);

  revalidatePath(`/dashboard/projects/${projectId}/timeline`);
}

export async function moveClipInTimeline(
  projectId: string,
  clipId: string,
  direction: "left" | "right",
) {
  const supabase = await createClient();
  const tracks = moveClip(await loadTracks(supabase, projectId), clipId, direction);
  await saveTracks(supabase, projectId, tracks);

  revalidatePath(`/dashboard/projects/${projectId}/timeline`);
}

export type { TrackType };
