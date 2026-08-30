import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ModelDefinition } from "@/types/model-registry";
import { DEFAULT_MODEL_REGISTRY } from "@/lib/ai/model-registry";
import { routeModel, type RouteRequest } from "@/lib/ai/router";
import { checkModelCompatibility } from "@/lib/ai/compatibility";
import { estimateCost } from "@/lib/ai/pricing";
import { getComputeProvider } from "@/lib/ai/compute";
import { ComputeProviderError } from "@/lib/ai/provider";

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Insufficient XCredits to run this job.");
    this.name = "InsufficientCreditsError";
  }
}

export class IncompatibleModelError extends Error {
  constructor(public readonly reasons: string[]) {
    super(reasons.join(" "));
    this.name = "IncompatibleModelError";
  }
}

export interface CreateJobParams {
  userId: string;
  projectId: string;
  jobType: string;
  workflowId: string;
  capability: RouteRequest["capability"];
  requestedModelId?: string;
  prompt: string;
  negativePrompt?: string;
  resolution?: string;
  fps?: number;
  durationSeconds?: number;
}

export interface CreateJobResult {
  jobId: string;
  status: "STARTING" | "FAILED";
  errorMessage?: string;
}

/**
 * Creates an ai_jobs row, reserves XCredits, and submits the job to the
 * configured AIComputeProvider. Never returns a fake success: if the
 * provider is unreachable (ComputeProviderError, expected until Sprint 3's
 * Modal functions are deployed — see ai-server/), the job is marked FAILED
 * with the real error and the credit reservation is refunded in full.
 */
export async function createAndSubmitJob(
  supabase: SupabaseClient<Database>,
  params: CreateJobParams,
  registry: ModelDefinition[] = DEFAULT_MODEL_REGISTRY,
): Promise<CreateJobResult> {
  const route = routeModel(
    {
      capability: params.capability,
      requestedModelId: params.requestedModelId,
      resolution: params.resolution,
    },
    registry,
  );

  const compatibility = checkModelCompatibility(route.model, {
    resolution: params.resolution,
    fps: params.fps,
    durationSeconds: params.durationSeconds,
  });
  if (!compatibility.compatible) {
    throw new IncompatibleModelError(compatibility.reasons);
  }

  const estimatedCost = estimateCost(route.model, params.durationSeconds ?? 5);

  const { data: job, error: insertError } = await supabase
    .from("ai_jobs")
    .insert({
      user_id: params.userId,
      project_id: params.projectId,
      job_type: params.jobType,
      model_id: route.model.id,
      workflow_id: params.workflowId,
      provider: "modal",
      status: "QUEUED",
      estimated_cost: estimatedCost,
      input_metadata: {
        prompt: params.prompt,
        negativePrompt: params.negativePrompt ?? null,
        resolution: params.resolution ?? null,
        fps: params.fps ?? null,
        durationSeconds: params.durationSeconds ?? null,
        usedFallbackModel: route.usedFallback,
      },
    })
    .select("*")
    .single();

  if (insertError || !job) {
    throw new Error(insertError?.message ?? "Failed to create job.");
  }

  const { error: reserveError } = await supabase.rpc("reserve_credits", {
    p_user_id: params.userId,
    p_amount: estimatedCost,
    p_job_id: job.id,
  });

  if (reserveError) {
    await failJob(supabase, job.id, "Insufficient XCredits.", { skipRefund: true });
    throw new InsufficientCreditsError();
  }

  await logEvent(supabase, job.id, "QUEUED", `Routed to ${route.model.name} (${route.reason}).`);

  try {
    const provider = getComputeProvider();
    const { providerJobId } = await provider.submitJob({
      jobId: job.id,
      jobType: params.jobType,
      modelId: route.model.id,
      workflowId: params.workflowId,
      userId: params.userId,
      projectId: params.projectId,
      input: {
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        resolution: params.resolution,
        fps: params.fps,
        durationSeconds: params.durationSeconds,
      },
    });

    await supabase
      .from("ai_jobs")
      .update({
        status: "STARTING",
        started_at: new Date().toISOString(),
        output_metadata: { providerJobId },
      })
      .eq("id", job.id);
    await logEvent(supabase, job.id, "STARTING", "Submitted to the AI orchestrator.");

    return { jobId: job.id, status: "STARTING" };
  } catch (err) {
    const message =
      err instanceof ComputeProviderError ? err.message : "AI provider unavailable.";
    await failJob(supabase, job.id, message);
    return { jobId: job.id, status: "FAILED", errorMessage: message };
  }
}

async function failJob(
  supabase: SupabaseClient<Database>,
  jobId: string,
  message: string,
  options: { skipRefund?: boolean } = {},
) {
  await supabase
    .from("ai_jobs")
    .update({ status: "FAILED", failed_at: new Date().toISOString(), error_message: message })
    .eq("id", jobId);
  await logEvent(supabase, jobId, "FAILED", message);

  if (!options.skipRefund) {
    await supabase.rpc("refund_reserved_credits", { p_job_id: jobId });
  }
}

async function logEvent(
  supabase: SupabaseClient<Database>,
  jobId: string,
  status: string,
  message: string,
) {
  await supabase.from("ai_job_events").insert({ job_id: jobId, status, message });
}
