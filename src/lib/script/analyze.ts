import { detectSceneHeadings } from "@/lib/script/parse";

export interface ParsedSceneHeading {
  raw: string;
  intExt: "INT" | "EXT" | "INT/EXT" | null;
  locationName: string;
  timeOfDay: string | null;
}

const PREFIX_PATTERN = /^\s*(INT\.\/EXT\.|INT\/EXT|INT\.|EXT\.|I\/E)[.\s-]*/i;

/**
 * Splits a Fountain-style scene heading ("INT. VILLAGE SQUARE - DAY") into
 * its INT/EXT, location name, and time-of-day parts. Deterministic text
 * parsing only — no model call, so it works with zero AI infrastructure.
 */
export function parseSceneHeading(raw: string): ParsedSceneHeading {
  const prefixMatch = raw.match(PREFIX_PATTERN);
  let intExt: ParsedSceneHeading["intExt"] = null;
  if (prefixMatch) {
    const normalized = prefixMatch[1].toUpperCase().replace(/\./g, "");
    if (normalized === "INT") intExt = "INT";
    else if (normalized === "EXT") intExt = "EXT";
    else intExt = "INT/EXT";
  }

  const withoutPrefix = raw.replace(PREFIX_PATTERN, "").trim();
  const [locationPart, ...timePart] = withoutPrefix.split(" - ");

  return {
    raw,
    intExt,
    locationName: locationPart.trim() || withoutPrefix.trim() || raw.trim(),
    timeOfDay: timePart.length > 0 ? timePart.join(" - ").trim() : null,
  };
}

export function extractSceneHeadings(scriptText: string): ParsedSceneHeading[] {
  return detectSceneHeadings(scriptText).map((h) => parseSceneHeading(h.heading));
}

const ALL_CAPS_LINE = /^[A-Z][A-Z0-9 .'()-]{1,39}$/;
const SCENE_HEADING_START = /^\s*(INT|EXT|INT\.\/EXT|I\/E)[./]/i;

/**
 * Screenplay convention: a character's name is given its own all-caps line
 * immediately before their dialogue. This walks the script looking for
 * that pattern — deterministic, no model call.
 */
export function extractCharacterNames(scriptText: string): string[] {
  const lines = scriptText.split("\n").map((line) => line.trim());
  const names = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || SCENE_HEADING_START.test(line) || !ALL_CAPS_LINE.test(line)) continue;

    const nextLine = lines[i + 1];
    if (nextLine && !ALL_CAPS_LINE.test(nextLine) && !SCENE_HEADING_START.test(nextLine)) {
      names.add(line.replace(/\s*\(.*\)$/, "").trim());
    }
  }

  return Array.from(names);
}
