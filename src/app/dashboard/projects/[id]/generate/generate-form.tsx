"use client";

import { useState, useTransition } from "react";
import { JobStatus } from "@/components/jobs/job-status";
import { retryGenerationJob, submitGenerationJob } from "./actions";

const CAPABILITIES = [
  { value: "text_to_video", label: "Text to Video" },
  { value: "cinematic_video", label: "Cinematic Video" },
];

export function GenerateForm({ projectId }: { projectId: string }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRetrying, startRetrying] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await submitGenerationJob(projectId, formData);
      if (result.error) setError(result.error);
      if (result.jobId) setJobId(result.jobId);
    });
  }

  function handleRetry() {
    if (!jobId) return;
    setError(null);

    startRetrying(async () => {
      const result = await retryGenerationJob(jobId);
      if (result.error) setError(result.error);
      if (result.jobId) setJobId(result.jobId);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="prompt" className="text-xs text-muted-foreground">
            Prompt
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows={3}
            required
            placeholder="A wide shot of a quiet village at dawn, warm light, slow push in"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="capability" className="text-xs text-muted-foreground">
              Type
            </label>
            <select
              id="capability"
              name="capability"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {CAPABILITIES.map((cap) => (
                <option key={cap.value} value={cap.value}>
                  {cap.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="model" className="text-xs text-muted-foreground">
              Model
            </label>
            <select
              id="model"
              name="model"
              defaultValue="AUTO"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="AUTO">AUTO — Recommended</option>
              <option value="wan-2.2">Wan 2.2</option>
              <option value="ltx-video">LTX Video</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="durationSeconds" className="text-xs text-muted-foreground">
              Duration (s)
            </label>
            <input
              id="durationSeconds"
              name="durationSeconds"
              type="number"
              min={1}
              max={10}
              defaultValue={5}
              className="w-20 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Generate"}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {jobId && (
        <JobStatus key={jobId} jobId={jobId} onRetry={handleRetry} retrying={isRetrying} />
      )}
    </div>
  );
}
