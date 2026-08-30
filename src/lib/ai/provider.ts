import type { AiJobStatus } from "@/types/database";

export interface SubmitJobParams {
  /** The ai_jobs.id row already created in Postgres (QUEUED) for this generation. */
  jobId: string;
  jobType: string;
  modelId: string;
  workflowId: string;
  userId: string;
  projectId?: string;
  input: Record<string, unknown>;
}

export interface SubmitJobResult {
  /** Opaque ID the provider uses to identify this job (e.g. a Modal call ID). */
  providerJobId: string;
}

export interface JobStatusResult {
  status: AiJobStatus;
  progress: number;
  outputMetadata?: Record<string, unknown>;
  storagePath?: string;
  errorMessage?: string;
  gpuType?: string;
  gpuSeconds?: number;
}

/**
 * Thrown when the compute provider itself cannot be reached or refuses the
 * request. Callers must surface this as "AI provider unavailable" — never
 * synthesize a fake success (see architecture spec section 65).
 */
export class ComputeProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly retryable: boolean,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ComputeProviderError";
  }
}

/**
 * The application talks to GPU infrastructure only through this interface.
 * Modal is the only implementation today (see providers/modal.ts); RunPod,
 * AWS, Lambda, Vast.ai, or a dedicated GPU server can be added later by
 * implementing the same contract without touching call sites.
 */
export interface AIComputeProvider {
  readonly name: string;
  submitJob(params: SubmitJobParams): Promise<SubmitJobResult>;
  getJobStatus(providerJobId: string): Promise<JobStatusResult>;
  cancelJob(providerJobId: string): Promise<void>;
}
