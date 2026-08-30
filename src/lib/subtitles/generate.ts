const ALL_CAPS_LINE = /^[A-Z][A-Z0-9 .'()-]{1,39}$/;
const SCENE_HEADING_START = /^\s*(INT|EXT|INT\.\/EXT|I\/E)[./]/i;

export interface DialogueLine {
  character: string;
  text: string;
}

/**
 * Same character-cue convention as extractCharacterNames, but keeps the
 * dialogue text (all following non-cue, non-heading lines) paired with the
 * speaker, in script order.
 */
export function extractDialogueLines(scriptText: string): DialogueLine[] {
  const lines = scriptText.split("\n").map((line) => line.trim());
  const dialogue: DialogueLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || SCENE_HEADING_START.test(line) || !ALL_CAPS_LINE.test(line)) continue;

    const character = line.replace(/\s*\(.*\)$/, "").trim();
    const textLines: string[] = [];
    let j = i + 1;
    while (
      j < lines.length &&
      lines[j] &&
      !ALL_CAPS_LINE.test(lines[j]) &&
      !SCENE_HEADING_START.test(lines[j])
    ) {
      textLines.push(lines[j]);
      j++;
    }

    if (textLines.length > 0) {
      dialogue.push({ character, text: textLines.join(" ") });
    }
    i = j - 1;
  }

  return dialogue;
}

export interface SubtitleCue {
  index: number;
  startSeconds: number;
  endSeconds: number;
  character: string;
  text: string;
}

const WORDS_PER_SECOND = 2.5;
const MIN_CUE_SECONDS = 1;
const GAP_SECONDS = 0.25;

/**
 * There's no audio to time against yet (no ASR has run), so duration is a
 * words-per-second reading-pace estimate — a draft to hand-adjust once
 * real voice generation exists, not a claim of measured timing.
 */
export function estimateSubtitleTiming(lines: DialogueLine[]): SubtitleCue[] {
  let cursor = 0;
  return lines.map((line, index) => {
    const wordCount = line.text.trim().split(/\s+/).filter(Boolean).length;
    const duration = Math.max(wordCount / WORDS_PER_SECOND, MIN_CUE_SECONDS);
    const startSeconds = cursor;
    const endSeconds = startSeconds + duration;
    cursor = endSeconds + GAP_SECONDS;

    return { index: index + 1, startSeconds, endSeconds, character: line.character, text: line.text };
  });
}

function formatTimestamp(totalSeconds: number, separator: "," | "."): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${pad(millis, 3)}`;
}

export function formatSRT(cues: SubtitleCue[]): string {
  return cues
    .map(
      (cue) =>
        `${cue.index}\n${formatTimestamp(cue.startSeconds, ",")} --> ${formatTimestamp(cue.endSeconds, ",")}\n${cue.character}: ${cue.text}\n`,
    )
    .join("\n");
}

export function formatVTT(cues: SubtitleCue[]): string {
  const body = cues
    .map(
      (cue) =>
        `${formatTimestamp(cue.startSeconds, ".")} --> ${formatTimestamp(cue.endSeconds, ".")}\n${cue.character}: ${cue.text}\n`,
    )
    .join("\n");
  return `WEBVTT\n\n${body}`;
}
