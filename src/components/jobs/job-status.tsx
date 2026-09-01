"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AiJobStatus } from "@/types/database";

interface JobEvent {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
}

const TERMINAL_STATUSES: AiJobStatus[] = ["COMPLETED", "FAILED", "CANCELLED"];

export function JobStatus({
  jobId,
  onRetry,
  retrying,
}: {
  jobId: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const [status, setStatus] = useState<AiJobStatus>("QUEUED");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadInitial() {
      const { data: job } = await supabase
        .from("ai_jobs")
        .select("status, progress, error_message")
        .eq("id", jobId)
        .single();
      if (active && job) {
        setStatus(job.status);
        setProgress(job.progress);
        setErrorMessage(job.error_message);
      }

      const { data: initialEvents } = await supabase
        .from("ai_job_events")
        .select("id, status, message, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (active && initialEvents) setEvents(initialEvents);
    }
    loadInitial();

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ai_jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          const row = payload.new as {
            status: AiJobStatus;
            progress: number;
            error_message: string | null;
          };
          setStatus(row.status);
          setProgress(row.progress);
          setErrorMessage(row.error_message);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_job_events", filter: `job_id=eq.${jobId}` },
        (payload) => {
          setEvents((prev) => [...prev, payload.new as JobEvent]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const isTerminal = TERMINAL_STATUSES.includes(status);
  const isFailed = status === "FAILED" || status === "CANCELLED";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isFailed
              ? "bg-destructive/20 text-destructive"
              : isTerminal
                ? "bg-primary/20 text-accent"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {status}
        </span>
        {!isTerminal && <span className="text-xs text-muted-foreground">{progress}%</span>}
      </div>

      {!isTerminal && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}

      {isFailed && onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="self-start rounded-md border border-accent/40 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
        >
          {retrying ? "Retrying…" : "Retry this shot"}
        </button>
      )}

      {events.length > 0 && (
        <ul className="scrollbar-thin flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-muted-foreground">
          {events.map((event) => (
            <li key={event.id}>
              <span className="text-foreground">{event.status}</span>
              {event.message ? ` — ${event.message}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
