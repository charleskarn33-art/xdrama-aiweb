import { DEFAULT_MODEL_REGISTRY } from "@/lib/ai/model-registry";
import type { ModelCapability, ModelDefinition, ModelType } from "@/types/model-registry";

export class NoCompatibleModelError extends Error {
  constructor(request: RouteRequest) {
    super(
      `No enabled model in the registry declares capability "${request.capability}"` +
        (request.type ? ` for type "${request.type}"` : ""),
    );
    this.name = "NoCompatibleModelError";
  }
}

export interface RouteRequest {
  /** The capability the task requires, e.g. "cinematic_video". */
  capability: ModelCapability;
  /** Narrow to a model type (video/image/audio/tts/lip_sync/llm). */
  type?: ModelType;
  /** User's explicit model choice. Skips routing if it is valid; otherwise falls through to AUTO. */
  requestedModelId?: string | "AUTO";
  /** Model IDs to skip — e.g. already tried and failed this job. */
  excludeModelIds?: string[];
  /** Required resolution, checked against the model's supported_resolutions when provided. */
  resolution?: string;
}

export interface RouteResult {
  model: ModelDefinition;
  /** True when the user's requested model could not be used and the router substituted another. */
  usedFallback: boolean;
  reason: string;
}

/**
 * Selects the best model for a task.
 *
 * Never assumes a model supports a capability unless the registry says so:
 * routing always filters on `model.capabilities`, `model.enabled`, and
 * `model.status !== "unavailable"` before considering priority.
 */
export function routeModel(
  request: RouteRequest,
  registry: ModelDefinition[] = DEFAULT_MODEL_REGISTRY,
): RouteResult {
  const excluded = new Set(request.excludeModelIds ?? []);

  const isCompatible = (model: ModelDefinition) =>
    model.enabled &&
    model.status !== "unavailable" &&
    !excluded.has(model.id) &&
    model.capabilities.includes(request.capability) &&
    (!request.type || model.type === request.type) &&
    (!request.resolution || model.supportedResolutions.length === 0 ||
      model.supportedResolutions.includes(request.resolution));

  const candidates = registry.filter(isCompatible).sort((a, b) => a.priority - b.priority);

  if (request.requestedModelId && request.requestedModelId !== "AUTO") {
    const requested = registry.find((model) => model.id === request.requestedModelId);
    if (requested && isCompatible(requested)) {
      return { model: requested, usedFallback: false, reason: "user_selected" };
    }

    const fallback = candidates[0];
    if (!fallback) {
      throw new NoCompatibleModelError(request);
    }
    return {
      model: fallback,
      usedFallback: true,
      reason: requested
        ? "requested_model_incompatible_or_disabled"
        : "requested_model_not_found",
    };
  }

  const best = candidates[0];
  if (!best) {
    throw new NoCompatibleModelError(request);
  }
  return { model: best, usedFallback: false, reason: "auto_routed" };
}
