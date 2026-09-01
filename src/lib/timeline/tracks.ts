import { TRACK_TYPES, type TimelineClip, type TimelineTrack, type TrackType } from "@/types/timeline";

const TRACK_LABELS: Record<TrackType, string> = {
  video: "Video",
  audio: "Audio",
  voice: "Voice",
  music: "Music",
  sfx: "SFX",
  subtitles: "Subtitles",
  transitions: "Transitions",
  overlays: "Overlays",
};

export function createEmptyTracks(): TimelineTrack[] {
  return TRACK_TYPES.map((type) => ({
    id: type,
    type,
    name: TRACK_LABELS[type],
    clips: [],
  }));
}

function findOrCreateTrack(tracks: TimelineTrack[], type: TrackType): TimelineTrack[] {
  if (tracks.some((track) => track.type === type)) return tracks;
  return [...tracks, { id: type, type, name: TRACK_LABELS[type], clips: [] }];
}

export function addClipToTrack(
  tracks: TimelineTrack[],
  type: TrackType,
  clip: TimelineClip,
): TimelineTrack[] {
  const withTrack = findOrCreateTrack(tracks, type);
  return withTrack.map((track) =>
    track.type === type ? { ...track, clips: [...track.clips, clip] } : track,
  );
}

export function removeClip(tracks: TimelineTrack[], clipId: string): TimelineTrack[] {
  return tracks.map((track) => ({
    ...track,
    clips: track.clips.filter((clip) => clip.id !== clipId),
  }));
}

export function moveClip(
  tracks: TimelineTrack[],
  clipId: string,
  direction: "left" | "right",
): TimelineTrack[] {
  return tracks.map((track) => {
    const index = track.clips.findIndex((clip) => clip.id === clipId);
    if (index === -1) return track;

    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= track.clips.length) return track;

    const clips = [...track.clips];
    [clips[index], clips[targetIndex]] = [clips[targetIndex], clips[index]];
    return { ...track, clips };
  });
}

export function totalDurationSeconds(track: TimelineTrack): number {
  return track.clips.reduce((sum, clip) => sum + clip.durationSeconds, 0);
}
