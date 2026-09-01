import { describe, expect, it } from "vitest";
import { buildPrompt } from "@/lib/ai/prompt-engine";

describe("buildPrompt", () => {
  it("composes location, atmosphere, and mood into a single prompt", () => {
    const result = buildPrompt({
      intExt: "EXT",
      locationName: "Village Square",
      timeOfDay: "dawn",
      weather: "misty",
      lighting: "golden hour",
      mood: "hopeful",
    });

    expect(result.prompt).toBe(
      "EXT — Village Square, dawn, misty weather, golden hour lighting, hopeful mood",
    );
  });

  it("includes camera angle and movement for video models", () => {
    const result = buildPrompt(
      { cameraAngle: "wide shot", cameraMovement: "slow dolly in" },
      "video",
    );
    expect(result.prompt).toBe("wide shot, camera slow dolly in");
  });

  it("omits camera movement for image models", () => {
    const result = buildPrompt(
      { cameraAngle: "close up", cameraMovement: "pan left" },
      "image",
    );
    expect(result.prompt).toBe("close up");
  });

  it("lists featured characters", () => {
    const result = buildPrompt({ characterNames: ["Korto", "Momo"] });
    expect(result.prompt).toBe("featuring Korto and Momo");
  });

  it("appends free-text user input last", () => {
    const result = buildPrompt({ locationName: "Market", userPrompt: "cinematic, 35mm film" });
    expect(result.prompt).toBe("Market, cinematic, 35mm film");
  });

  it("always returns the default negative prompt", () => {
    const result = buildPrompt({});
    expect(result.negativePrompt).toMatch(/blurry/);
  });

  it("returns an empty prompt for empty context", () => {
    expect(buildPrompt({}).prompt).toBe("");
  });
});
