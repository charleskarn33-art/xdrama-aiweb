import { describe, expect, it } from "vitest";
import { checkModelCompatibility } from "@/lib/ai/compatibility";
import { getModelById } from "@/lib/ai/model-registry";

describe("checkModelCompatibility", () => {
  it("passes when the request is within the model's declared limits", () => {
    const wan = getModelById("wan-2.2")!;
    const result = checkModelCompatibility(wan, {
      resolution: "1080p",
      fps: 24,
      durationSeconds: 8,
    });
    expect(result.compatible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("rejects an unsupported resolution", () => {
    const hunyuan = getModelById("hunyuan-video")!;
    const result = checkModelCompatibility(hunyuan, { resolution: "4k" });
    expect(result.compatible).toBe(false);
    expect(result.reasons[0]).toMatch(/resolution/i);
  });

  it("rejects a duration beyond the model's maximum", () => {
    const ltx = getModelById("ltx-video")!;
    const result = checkModelCompatibility(ltx, { durationSeconds: 60 });
    expect(result.compatible).toBe(false);
    expect(result.reasons[0]).toMatch(/at most/i);
  });

  it("rejects an unsupported fps", () => {
    const skyreels = getModelById("skyreels-v2")!;
    const result = checkModelCompatibility(skyreels, { fps: 60 });
    expect(result.compatible).toBe(false);
    expect(result.reasons[0]).toMatch(/fps/i);
  });

  it("flags a disabled model regardless of the request", () => {
    const model = { ...getModelById("flux")!, enabled: false };
    const result = checkModelCompatibility(model, {});
    expect(result.compatible).toBe(false);
    expect(result.reasons[0]).toMatch(/disabled|unavailable/i);
  });
});
