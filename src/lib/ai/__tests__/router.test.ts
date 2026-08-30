import { describe, expect, it } from "vitest";
import { NoCompatibleModelError, routeModel } from "@/lib/ai/router";
import type { ModelDefinition } from "@/types/model-registry";

function makeModel(overrides: Partial<ModelDefinition>): ModelDefinition {
  return {
    id: "test-model",
    name: "Test Model",
    provider: "modal",
    version: "1",
    type: "video",
    description: "",
    capabilities: [],
    minimumVramGb: null,
    recommendedVramGb: null,
    supportedResolutions: [],
    supportedFps: [],
    maximumDurationSeconds: null,
    inputTypes: ["text"],
    outputTypes: ["video"],
    status: "active",
    enabled: true,
    priority: 100,
    costMultiplier: 1,
    ...overrides,
  };
}

describe("routeModel (AI Router)", () => {
  it("selects the lowest-priority compatible model in AUTO mode", () => {
    const registry = [
      makeModel({ id: "low-priority", capabilities: ["cinematic_video"], priority: 50 }),
      makeModel({ id: "high-priority", capabilities: ["cinematic_video"], priority: 5 }),
    ];

    const result = routeModel({ capability: "cinematic_video" }, registry);
    expect(result.model.id).toBe("high-priority");
    expect(result.usedFallback).toBe(false);
    expect(result.reason).toBe("auto_routed");
  });

  it("never routes to a model that does not declare the capability", () => {
    const registry = [
      makeModel({ id: "wrong-capability", capabilities: ["text_to_image"] }),
    ];

    expect(() => routeModel({ capability: "cinematic_video" }, registry)).toThrow(
      NoCompatibleModelError,
    );
  });

  it("honors an explicit, compatible user selection", () => {
    const registry = [
      makeModel({ id: "wan-2.2", capabilities: ["cinematic_video"], priority: 10 }),
      makeModel({ id: "skyreels-v2", capabilities: ["character_consistency"], priority: 20 }),
    ];

    const result = routeModel(
      { capability: "character_consistency", requestedModelId: "skyreels-v2" },
      registry,
    );
    expect(result.model.id).toBe("skyreels-v2");
    expect(result.usedFallback).toBe(false);
    expect(result.reason).toBe("user_selected");
  });

  it("falls back to another compatible model when the requested one is disabled", () => {
    const registry = [
      makeModel({ id: "wan-2.2", capabilities: ["cinematic_video"], enabled: false }),
      makeModel({ id: "ltx-video", capabilities: ["cinematic_video"], priority: 90 }),
    ];

    const result = routeModel(
      { capability: "cinematic_video", requestedModelId: "wan-2.2" },
      registry,
    );
    expect(result.model.id).toBe("ltx-video");
    expect(result.usedFallback).toBe(true);
    expect(result.reason).toBe("requested_model_incompatible_or_disabled");
  });

  it("excludes previously failed models from routing", () => {
    const registry = [
      makeModel({ id: "wan-2.2", capabilities: ["cinematic_video"], priority: 5 }),
      makeModel({ id: "ltx-video", capabilities: ["cinematic_video"], priority: 90 }),
    ];

    const result = routeModel(
      { capability: "cinematic_video", excludeModelIds: ["wan-2.2"] },
      registry,
    );
    expect(result.model.id).toBe("ltx-video");
  });

  it("filters by resolution support when a model declares a restricted list", () => {
    const registry = [
      makeModel({
        id: "hunyuan-video",
        capabilities: ["human_performance"],
        supportedResolutions: ["720p"],
      }),
    ];

    expect(() =>
      routeModel(
        { capability: "human_performance", resolution: "4k" },
        registry,
      ),
    ).toThrow(NoCompatibleModelError);
  });
});
