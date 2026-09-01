import { describe, expect, it } from "vitest";
import { extractCharacterNames, extractSceneHeadings, parseSceneHeading } from "@/lib/script/analyze";

describe("parseSceneHeading", () => {
  it("parses INT heading with time of day", () => {
    expect(parseSceneHeading("INT. VILLAGE SQUARE - DAY")).toEqual({
      raw: "INT. VILLAGE SQUARE - DAY",
      intExt: "INT",
      locationName: "VILLAGE SQUARE",
      timeOfDay: "DAY",
    });
  });

  it("parses EXT heading without time of day", () => {
    const result = parseSceneHeading("EXT. MARKET");
    expect(result.intExt).toBe("EXT");
    expect(result.locationName).toBe("MARKET");
    expect(result.timeOfDay).toBeNull();
  });

  it("parses combined INT/EXT headings", () => {
    const result = parseSceneHeading("INT/EXT. CAR - CONTINUOUS");
    expect(result.intExt).toBe("INT/EXT");
    expect(result.locationName).toBe("CAR");
    expect(result.timeOfDay).toBe("CONTINUOUS");
  });
});

describe("extractSceneHeadings", () => {
  it("extracts every scene heading with its parsed parts", () => {
    const script = [
      "INT. VILLAGE SQUARE - DAY",
      "",
      "A quiet morning.",
      "",
      "EXT. MARKET - NIGHT",
      "Chaos.",
    ].join("\n");

    const headings = extractSceneHeadings(script);
    expect(headings).toHaveLength(2);
    expect(headings[0].locationName).toBe("VILLAGE SQUARE");
    expect(headings[1].locationName).toBe("MARKET");
  });
});

describe("extractCharacterNames", () => {
  it("finds character cue lines followed by dialogue", () => {
    const script = [
      "INT. VILLAGE SQUARE - DAY",
      "",
      "KORTO",
      "The market opens at dawn.",
      "",
      "MOMO",
      "Then we should hurry.",
    ].join("\n");

    expect(extractCharacterNames(script)).toEqual(["KORTO", "MOMO"]);
  });

  it("does not treat scene headings as character cues", () => {
    const script = ["INT. VILLAGE SQUARE - DAY", "A quiet morning."].join("\n");
    expect(extractCharacterNames(script)).toEqual([]);
  });

  it("strips a parenthetical from a character cue", () => {
    const script = ["KORTO (V.O.)", "Somewhere far away..."].join("\n");
    expect(extractCharacterNames(script)).toEqual(["KORTO"]);
  });

  it("deduplicates repeated character cues", () => {
    const script = ["KORTO", "Line one.", "", "KORTO", "Line two."].join("\n");
    expect(extractCharacterNames(script)).toEqual(["KORTO"]);
  });
});
