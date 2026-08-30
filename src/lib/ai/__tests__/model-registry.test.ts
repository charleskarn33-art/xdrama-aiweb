import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL_REGISTRY, getModelById } from "@/lib/ai/model-registry";

describe("model registry", () => {
  it("has unique model ids", () => {
    const ids = DEFAULT_MODEL_REGISTRY.map((model) => model.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("declares at least one capability per model", () => {
    for (const model of DEFAULT_MODEL_REGISTRY) {
      expect(model.capabilities.length).toBeGreaterThan(0);
    }
  });

  it("includes the required initial models from the spec", () => {
    const requiredIds = [
      "wan-2.2",
      "hunyuan-video",
      "skyreels-v2",
      "cogvideox",
      "open-sora",
      "ltx-video",
      "stable-video-diffusion",
      "flux",
      "sdxl",
      "musicgen",
      "audiocraft",
      "stable-audio-open",
      "kokoro",
      "piper",
      "coqui-tts",
      "musetalk",
      "latentsync",
      "qwen",
      "llama",
      "deepseek",
    ];
    for (const id of requiredIds) {
      expect(getModelById(id), `missing model ${id}`).toBeDefined();
    }
  });

  it("routes SkyReels V2 to character consistency, per the spec example", () => {
    const skyreels = getModelById("skyreels-v2");
    expect(skyreels?.capabilities).toContain("character_consistency");
  });

  it("routes HunyuanVideo to human performance, per the spec example", () => {
    const hunyuan = getModelById("hunyuan-video");
    expect(hunyuan?.capabilities).toContain("human_performance");
  });
});
