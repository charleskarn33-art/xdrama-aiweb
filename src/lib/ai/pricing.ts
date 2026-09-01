import type { ModelDefinition } from "@/types/model-registry";

/**
 * Placeholder pricing used only to size a credit reservation before a job
 * runs. Spec section 17 wants pricing configurable from the database
 * (a `pricing` table alongside `credit_packages`) — that lands with the
 * billing work in Sprint 5. Until then this constant is the single source
 * of the XCredits-per-second rate, so it's easy to find and replace.
 */
const BASE_CREDITS_PER_SECOND = 10;

export function estimateCost(model: ModelDefinition, durationSeconds: number): number {
  return Math.max(1, Math.round(durationSeconds * BASE_CREDITS_PER_SECOND * model.costMultiplier));
}
