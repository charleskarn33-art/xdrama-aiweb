const SCENE_HEADING_PATTERN = /^\s*(INT|EXT|INT\.\/EXT|I\/E)[./]/i;

export interface SceneHeading {
  lineNumber: number;
  heading: string;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Detects Fountain/screenplay-style scene headings (INT./EXT./INT-EXT.) so
 * the editor can show a live scene count. This is a preview only — it does
 * not write to the `scenes` table; that sync ships with the Scenes module
 * (Sprint 3), once scene ordering/location linking has a UI to manage it.
 */
export function detectSceneHeadings(text: string): SceneHeading[] {
  return text
    .split("\n")
    .map((line, index) => ({ lineNumber: index + 1, heading: line.trim() }))
    .filter((line) => SCENE_HEADING_PATTERN.test(line.heading));
}
