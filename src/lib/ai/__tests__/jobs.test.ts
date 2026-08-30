import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ComputeProviderError } from "@/lib/ai/provider";

vi.mock("@/lib/ai/compute", () => ({
  getComputeProvider: vi.fn(),
}));

const { getComputeProvider } = await import("@/lib/ai/compute");
const { createAndSubmitJob, IncompatibleModelError, InsufficientCreditsError } = await import(
  "@/lib/ai/jobs"
);

interface MockSupabaseHandle {
  client: SupabaseClient<Database>;
  rpcCalls: Array<{ name: string; args: unknown }>;
  eventInserts: Array<Record<string, unknown>>;
  jobUpdates: Array<Record<string, unknown>>;
}

function createMockSupabase(options: { reserveError?: { message: string } } = {}): MockSupabaseHandle {
  const jobRow = { id: "job-1", user_id: "user-1", project_id: "proj-1", estimated_cost: 50 };
  const rpcCalls: Array<{ name: string; args: unknown }> = [];
  const eventInserts: Array<Record<string, unknown>> = [];
  const jobUpdates: Array<Record<string, unknown>> = [];

  const client = {
    from(table: string) {
      if (table === "ai_jobs") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: jobRow, error: null }),
            }),
          }),
          update: (payload: Record<string, unknown>) => {
            jobUpdates.push(payload);
            return { eq: async () => ({ error: null }) };
          },
        };
      }
      if (table === "ai_job_events") {
        return {
          insert: (payload: Record<string, unknown>) => {
            eventInserts.push(payload);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
    rpc(name: string, args: unknown) {
      rpcCalls.push({ name, args });
      if (name === "reserve_credits" && options.reserveError) {
        return Promise.resolve({ error: options.reserveError });
      }
      return Promise.resolve({ error: null });
    },
  };

  return { client: client as unknown as SupabaseClient<Database>, rpcCalls, eventInserts, jobUpdates };
}

const baseParams = {
  userId: "user-1",
  projectId: "proj-1",
  jobType: "text_to_video",
  workflowId: "text-to-video.cinematic-v1",
  capability: "text_to_video" as const,
  prompt: "a quiet village at dawn",
};

describe("createAndSubmitJob", () => {
  beforeEach(() => {
    vi.mocked(getComputeProvider).mockReset();
  });

  it("reserves credits and transitions to STARTING on a successful submit", async () => {
    vi.mocked(getComputeProvider).mockReturnValue({
      name: "modal",
      submitJob: vi.fn().mockResolvedValue({ providerJobId: "prov-123" }),
      getJobStatus: vi.fn(),
      cancelJob: vi.fn(),
    });

    const { client, rpcCalls, jobUpdates } = createMockSupabase();
    const result = await createAndSubmitJob(client, baseParams);

    expect(result).toEqual({ jobId: "job-1", status: "STARTING" });
    expect(rpcCalls.map((c) => c.name)).toContain("reserve_credits");
    expect(jobUpdates.some((u) => u.status === "STARTING")).toBe(true);
  });

  it("marks the job FAILED and refunds credits when the provider is unavailable", async () => {
    vi.mocked(getComputeProvider).mockReturnValue({
      name: "modal",
      submitJob: vi
        .fn()
        .mockRejectedValue(new ComputeProviderError("modal", "AI provider unavailable: orchestrator responded with 501.", false)),
      getJobStatus: vi.fn(),
      cancelJob: vi.fn(),
    });

    const { client, rpcCalls, jobUpdates } = createMockSupabase();
    const result = await createAndSubmitJob(client, baseParams);

    expect(result.status).toBe("FAILED");
    expect(result.errorMessage).toMatch(/AI provider unavailable/);
    expect(jobUpdates.some((u) => u.status === "FAILED")).toBe(true);
    expect(rpcCalls.map((c) => c.name)).toContain("refund_reserved_credits");
  });

  it("throws InsufficientCreditsError and never calls the provider when the wallet can't cover it", async () => {
    const submitJob = vi.fn();
    vi.mocked(getComputeProvider).mockReturnValue({
      name: "modal",
      submitJob,
      getJobStatus: vi.fn(),
      cancelJob: vi.fn(),
    });

    const { client, rpcCalls } = createMockSupabase({ reserveError: { message: "insufficient_credits" } });

    await expect(createAndSubmitJob(client, baseParams)).rejects.toThrow(InsufficientCreditsError);
    expect(submitJob).not.toHaveBeenCalled();
    expect(rpcCalls.map((c) => c.name)).not.toContain("refund_reserved_credits");
  });

  it("throws IncompatibleModelError before creating a job when duration exceeds the model's limit", async () => {
    const { client } = createMockSupabase();

    await expect(
      createAndSubmitJob(client, {
        ...baseParams,
        requestedModelId: "ltx-video",
        durationSeconds: 60,
      }),
    ).rejects.toThrow(IncompatibleModelError);
  });
});
