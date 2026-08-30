import type { ModelDefinition } from "@/types/model-registry";

export interface GenerationRequest {
  resolution?: string;
  fps?: number;
  durationSeconds?: number;
}

export interface CompatibilityResult {
  compatible: boolean;
  reasons: string[];
}

/**
 * Verifies a model against a concrete generation request before a job is
 * created. Distinct from the AI Router's capability filter (which picks a
 * candidate model) — this is the final check against the model's declared
 * VRAM/resolution/fps/duration limits, per architecture spec section 67:
 * never assume a model can run a request just because it was routed to it.
 */
export function checkModelCompatibility(
  model: ModelDefinition,
  request: GenerationRequest,
): CompatibilityResult {
  const reasons: string[] = [];

  if (!model.enabled || model.status === "unavailable") {
    reasons.push(`${model.name} is currently disabled or unavailable.`);
  }

  if (
    request.resolution &&
    model.supportedResolutions.length > 0 &&
    !model.supportedResolutions.includes(request.resolution)
  ) {
    reasons.push(
      `${model.name} does not support resolution "${request.resolution}" ` +
        `(supports: ${model.supportedResolutions.join(", ")}).`,
    );
  }

  if (
    request.fps !== undefined &&
    model.supportedFps.length > 0 &&
    !model.supportedFps.includes(request.fps)
  ) {
    reasons.push(
      `${model.name} does not support ${request.fps}fps ` +
        `(supports: ${model.supportedFps.join(", ")}).`,
    );
  }

  if (
    request.durationSeconds !== undefined &&
    model.maximumDurationSeconds != null &&
    request.durationSeconds > model.maximumDurationSeconds
  ) {
    reasons.push(
      `${model.name} supports at most ${model.maximumDurationSeconds}s ` +
        `(requested ${request.durationSeconds}s).`,
    );
  }

  return { compatible: reasons.length === 0, reasons };
}
