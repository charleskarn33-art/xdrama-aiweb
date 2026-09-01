import { describe, expect, it } from "vitest";
import {
  addClipToTrack,
  createEmptyTracks,
  moveClip,
  removeClip,
  totalDurationSeconds,
} from "@/lib/timeline/tracks";
import type { TimelineClip } from "@/types/timeline";

function makeClip(overrides: Partial<TimelineClip> = {}): TimelineClip {
  return {
    id: "clip-1",
    sourceType: "shot",
    sourceId: "shot-1",
    label: "Shot 1",
    durationSeconds: 5,
    ...overrides,
  };
}

describe("createEmptyTracks", () => {
  it("creates one empty track per track type", () => {
    const tracks = createEmptyTracks();
    expect(tracks).toHaveLength(8);
    expect(tracks.every((t) => t.clips.length === 0)).toBe(true);
    expect(tracks.map((t) => t.type)).toContain("video");
  });
});

describe("addClipToTrack", () => {
  it("appends a clip to the matching track without mutating the input", () => {
    const before = createEmptyTracks();
    const after = addClipToTrack(before, "video", makeClip());

    expect(before.find((t) => t.type === "video")!.clips).toHaveLength(0);
    expect(after.find((t) => t.type === "video")!.clips).toHaveLength(1);
  });

  it("preserves clips on other tracks", () => {
    let tracks = addClipToTrack(createEmptyTracks(), "video", makeClip({ id: "v1" }));
    tracks = addClipToTrack(tracks, "music", makeClip({ id: "m1", sourceType: "asset" }));

    expect(tracks.find((t) => t.type === "video")!.clips.map((c) => c.id)).toEqual(["v1"]);
    expect(tracks.find((t) => t.type === "music")!.clips.map((c) => c.id)).toEqual(["m1"]);
  });
});

describe("removeClip", () => {
  it("removes a clip by id from whichever track holds it", () => {
    let tracks = addClipToTrack(createEmptyTracks(), "video", makeClip({ id: "v1" }));
    tracks = addClipToTrack(tracks, "video", makeClip({ id: "v2" }));
    tracks = removeClip(tracks, "v1");

    expect(tracks.find((t) => t.type === "video")!.clips.map((c) => c.id)).toEqual(["v2"]);
  });
});

describe("moveClip", () => {
  it("swaps a clip with its left neighbor", () => {
    let tracks = addClipToTrack(createEmptyTracks(), "video", makeClip({ id: "v1" }));
    tracks = addClipToTrack(tracks, "video", makeClip({ id: "v2" }));
    tracks = moveClip(tracks, "v2", "left");

    expect(tracks.find((t) => t.type === "video")!.clips.map((c) => c.id)).toEqual(["v2", "v1"]);
  });

  it("is a no-op at the boundary", () => {
    let tracks = addClipToTrack(createEmptyTracks(), "video", makeClip({ id: "v1" }));
    tracks = moveClip(tracks, "v1", "left");

    expect(tracks.find((t) => t.type === "video")!.clips.map((c) => c.id)).toEqual(["v1"]);
  });
});

describe("totalDurationSeconds", () => {
  it("sums clip durations on a track", () => {
    let tracks = addClipToTrack(createEmptyTracks(), "video", makeClip({ id: "v1", durationSeconds: 4 }));
    tracks = addClipToTrack(tracks, "video", makeClip({ id: "v2", durationSeconds: 6 }));

    expect(totalDurationSeconds(tracks.find((t) => t.type === "video")!)).toBe(10);
  });
});
