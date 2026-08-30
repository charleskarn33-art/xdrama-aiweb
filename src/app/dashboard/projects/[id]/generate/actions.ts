"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createAndSubmitJob,
  IncompatibleModelError,
  InsufficientCreditsError,
} from "@/lib/ai/jobs";
import type { ModelCapability } from "@/types/model-registry";

const CAPABILITY_WORKFLOWS: Partial<Record<ModelCapability, string>> = {
  text_to_video: "text-to-video.cinematic-v1",
  cinematic_video: "cinematic.cinematic-shot-v1",
};

export interface SubmitGenerationResult {
  jobId: string | null;
  error?: string;
}

export async function submitGenerationJob(
  projectId: string,
  formData: FormData,
): Promise<SubmitGenerationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const capability = String(formData.get("capability") ?? "") as ModelCapability;
  const workflowId = CAPABILITY_WORKFLOWS[capability];
  const prompt = String(formData.get("prompt") ?? "").trim();
  const requestedModelId = String(formData.get("model") ?? "AUTO");
  const resolution = String(formData.get("resolution") ?? "") || undefined;
  const durationSeconds = Number(formData.get("durationSeconds") ?? 5);

  if (!workflowId) {
    return { jobId: null, error: "Unsupported capability." };
  }
  if (!prompt) {
    return { jobId: null, error: "Prompt is required." };
  }

  try {
    const result = await createAndSubmitJob(supabase, {
      userId: user.id,
      projectId,
      jobType: capability,
      workflowId,
      capability,
      requestedModelId: requestedModelId === "AUTO" ? undefined : requestedModelId,
      prompt,
      resolution,
      durationSeconds,
    });

    return { jobId: result.jobId, error: result.errorMessage };
  } catch (err) {
    if (err instanceof IncompatibleModelError || err instanceof InsufficientCreditsError) {
      return { jobId: null, error: err.message };
    }
    throw err;
  }
}
