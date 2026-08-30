export type TrackType =
  | "video"
  | "audio"
  | "voice"
  | "music"
  | "sfx"
  | "subtitles"
  | "transitions"
  | "overlays";

export const TRACK_TYPES: TrackType[] = [
  "video",
  "audio",
  "voice",
  "music",
  "sfx",
  "subtitles",
  "transitions",
  "overlays",
];

export interface TimelineClip {
  id: string;
  sourceType: "shot" | "asset";
  sourceId: string;
  label: string;
  durationSeconds: number;
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  name: string;
  clips: TimelineClip[];
}
