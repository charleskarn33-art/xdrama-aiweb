import type { ModelType } from "@/types/model-registry";

export interface PromptContext {
  locationName?: string | null;
  locationDescription?: string | null;
  lighting?: string | null;
  weather?: string | null;
  timeOfDay?: string | null;
  intExt?: string | null;
  sceneDescription?: string | null;
  mood?: string | null;
  cameraAngle?: string | null;
  cameraMovement?: string | null;
  characterNames?: string[];
  visualStyle?: string | null;
  userPrompt?: string | null;
}

export interface EngineeredPrompt {
  prompt: string;
  negativePrompt: string;
}

const DEFAULT_NEGATIVE_PROMPT =
  "blurry, low quality, distorted anatomy, extra limbs, watermark, text overlay, oversaturated";

/**
 * Turns Story Bible context (scene, location, characters, camera) into a
 * model-ready prompt so users never have to write one by hand (spec
 * section 29). Different model types get different structuring — camera
 * movement matters for video, not for a still image — but this never
 * calls a model itself; it's pure string composition.
 */
export function buildPrompt(context: PromptContext, modelType: ModelType = "video"): EngineeredPrompt {
  const parts: string[] = [];

  if (context.intExt || context.locationName) {
    parts.push([context.intExt, context.locationName].filter(Boolean).join(" — "));
  }
  if (context.timeOfDay) parts.push(context.timeOfDay);
  if (context.weather) parts.push(`${context.weather} weather`);
  if (context.lighting) parts.push(`${context.lighting} lighting`);
  if (context.locationDescription) parts.push(context.locationDescription);
  if (context.mood) parts.push(`${context.mood} mood`);
  if (context.sceneDescription) parts.push(context.sceneDescription);

  if (context.characterNames && context.characterNames.length > 0) {
    parts.push(`featuring ${context.characterNames.join(" and ")}`);
  }

  if (context.cameraAngle) parts.push(context.cameraAngle);
  if (modelType === "video" && context.cameraMovement) {
    parts.push(`camera ${context.cameraMovement}`);
  }

  if (context.visualStyle) parts.push(context.visualStyle);
  if (context.userPrompt) parts.push(context.userPrompt);

  return {
    prompt: parts.filter(Boolean).join(", "),
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  };
}
