import { describe, expect, it } from "vitest";
import {
  estimateSubtitleTiming,
  extractDialogueLines,
  formatSRT,
  formatVTT,
} from "@/lib/subtitles/generate";

describe("extractDialogueLines", () => {
  it("pairs a character cue with its dialogue text", () => {
    const script = ["KORTO", "The market opens at dawn.", "", "MOMO", "Then we should hurry."].join(
      "\n",
    );
    expect(extractDialogueLines(script)).toEqual([
      { character: "KORTO", text: "The market opens at dawn." },
      { character: "MOMO", text: "Then we should hurry." },
    ]);
  });

  it("joins multi-line dialogue into one entry", () => {
    const script = ["KORTO", "The market opens at dawn.", "We should not be late."].join("\n");
    expect(extractDialogueLines(script)).toEqual([
      { character: "KORTO", text: "The market opens at dawn. We should not be late." },
    ]);
  });

  it("skips a character cue with no following dialogue", () => {
    const script = ["KORTO", "", "EXT. MARKET - DAY"].join("\n");
    expect(extractDialogueLines(script)).toEqual([]);
  });
});

describe("estimateSubtitleTiming", () => {
  it("assigns sequential, non-overlapping timing", () => {
    const cues = estimateSubtitleTiming([
      { character: "KORTO", text: "one two three four five" },
      { character: "MOMO", text: "six seven" },
    ]);

    expect(cues[0].startSeconds).toBe(0);
    expect(cues[1].startSeconds).toBeGreaterThan(cues[0].endSeconds);
    expect(cues[0].index).toBe(1);
    expect(cues[1].index).toBe(2);
  });

  it("gives very short lines at least the minimum duration", () => {
    const cues = estimateSubtitleTiming([{ character: "KORTO", text: "Hi" }]);
    expect(cues[0].endSeconds - cues[0].startSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe("formatSRT", () => {
  it("produces valid SRT blocks", () => {
    const cues = estimateSubtitleTiming([{ character: "KORTO", text: "Hello there" }]);
    const srt = formatSRT(cues);
    expect(srt).toMatch(/^1\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\nKORTO: Hello there\n/);
  });
});

describe("formatVTT", () => {
  it("starts with the WEBVTT header and uses dot-separated timestamps", () => {
    const cues = estimateSubtitleTiming([{ character: "KORTO", text: "Hello there" }]);
    const vtt = formatVTT(cues);
    expect(vtt.startsWith("WEBVTT\n\n")).toBe(true);
    expect(vtt).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/);
  });
});

describe("timestamp formatting edge cases", () => {
  it("never emits a 4-digit millisecond field when rounding lands on a whole second", () => {
    // 675.9999999999999s is exactly the kind of float-drift value cursor
    // accumulation can produce; rounding its fractional part alone (the
    // old implementation) carries to 1000ms without bumping the seconds
    // field, producing an invalid "...,1000" timestamp.
    const cues = [
      { index: 1, startSeconds: 0, endSeconds: 675.9999999999999, character: "A", text: "x" },
    ];
    const srt = formatSRT(cues);
    const timestamps = srt.match(/\d{2}:\d{2}:\d{2},\d{3}/g)!;
    for (const ts of timestamps) {
      expect(ts).toMatch(/,\d{3}$/);
      expect(ts.endsWith(",1000")).toBe(false);
    }
    expect(srt).toContain("00:11:16,000");
  });
});
