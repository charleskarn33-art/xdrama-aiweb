import type {
  AIComputeProvider,
  JobStatusResult,
  SubmitJobParams,
  SubmitJobResult,
} from "@/lib/ai/provider";
import { ComputeProviderError } from "@/lib/ai/provider";

/**
 * Talks to the XDrama AI Orchestrator (ai-server/), which itself dispatches
 * to Modal GPU functions and ComfyUI. This app never calls Modal or
 * ComfyUI directly — see architecture spec sections 9, 46, 47, 66.
 */
export class ModalComputeProvider implements AIComputeProvider {
  readonly name = "modal";

  constructor(private readonly orchestratorUrl: string) {
    if (!orchestratorUrl) {
      throw new Error(
        "ModalComputeProvider requires AI_ORCHESTRATOR_URL to be configured.",
      );
    }
  }

  async submitJob(params: SubmitJobParams): Promise<SubmitJobResult> {
    const response = await this.post("/jobs/submit", params);
    return { providerJobId: response.provider_job_id as string };
  }

  async getJobStatus(providerJobId: string): Promise<JobStatusResult> {
    const response = await this.post("/jobs/status", { provider_job_id: providerJobId });
    return {
      status: response.status as JobStatusResult["status"],
      progress: (response.progress as number) ?? 0,
      outputMetadata: response.output_metadata as Record<string, unknown> | undefined,
      storagePath: response.storage_path as string | undefined,
      errorMessage: response.error_message as string | undefined,
      gpuType: response.gpu_type as string | undefined,
      gpuSeconds: response.gpu_seconds as number | undefined,
    };
  }

  async cancelJob(providerJobId: string): Promise<void> {
    await this.post("/jobs/cancel", { provider_job_id: providerJobId });
  }

  private async post(path: string, body: unknown): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetch(`${this.orchestratorUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (cause) {
      throw new ComputeProviderError(
        this.name,
        "AI provider unavailable: could not reach the AI orchestrator.",
        true,
        cause,
      );
    }

    if (!response.ok) {
      const retryable = response.status >= 500;
      throw new ComputeProviderError(
        this.name,
        `AI provider unavailable: orchestrator responded with ${response.status}.`,
        retryable,
      );
    }

    return (await response.json()) as Record<string, unknown>;
  }
}
