import { describe, expect, it } from "vitest";
import { countWords, detectSceneHeadings } from "@/lib/script/parse";

describe("countWords", () => {
  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("counts words separated by any whitespace", () => {
    expect(countWords("INT. VILLAGE - DAY\n\nA quiet   morning.")).toBe(7);
  });
});

describe("detectSceneHeadings", () => {
  it("detects INT./EXT. scene headings", () => {
    const script = [
      "INT. VILLAGE SQUARE - DAY",
      "",
      "A quiet morning.",
      "",
      "EXT. MARKET - NIGHT",
      "Chaos.",
      "int/ext. car - continuous",
    ].join("\n");

    const headings = detectSceneHeadings(script);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ lineNumber: 1, heading: "INT. VILLAGE SQUARE - DAY" });
    expect(headings[1].lineNumber).toBe(5);
  });

  it("ignores lines that merely mention interior/exterior in dialogue", () => {
    const script = "She said the interior was beautiful.";
    expect(detectSceneHeadings(script)).toHaveLength(0);
  });
});
