export type ModelType = "video" | "image" | "audio" | "tts" | "lip_sync" | "llm";

export type ModelStatus = "active" | "beta" | "deprecated" | "unavailable";

/**
 * Capability tags used by the AI Router (src/lib/ai/router.ts) to match a
 * generation task to a model. A model is only ever routed to for a
 * capability it explicitly declares — never assumed.
 */
export type ModelCapability =
  | "text_to_video"
  | "image_to_video"
  | "cinematic_video"
  | "character_consistency"
  | "human_performance"
  | "fast_preview"
  | "long_form_video"
  | "text_to_image"
  | "image_to_image"
  | "text_to_music"
  | "text_to_audio"
  | "sound_effects"
  | "text_to_speech"
  | "voice_cloning"
  | "lip_sync"
  | "script_analysis"
  | "reasoning"
  | "prompt_generation";

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  version: string;
  type: ModelType;
  description: string;
  capabilities: ModelCapability[];
  minimumVramGb: number | null;
  recommendedVramGb: number | null;
  supportedResolutions: string[];
  supportedFps: number[];
  maximumDurationSeconds: number | null;
  inputTypes: Array<"text" | "image" | "video" | "audio">;
  outputTypes: Array<"text" | "image" | "video" | "audio">;
  status: ModelStatus;
  enabled: boolean;
  priority: number;
  costMultiplier: number;
}
