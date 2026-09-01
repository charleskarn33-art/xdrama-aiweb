import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AiJobStatus } from "@/types/database";

const JOB_STATUSES: AiJobStatus[] = [
  "QUEUED",
  "STARTING",
  "PREPARING",
  "MODEL_LOADING",
  "GENERATING",
  "POST_PROCESSING",
  "UPLOADING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

async function checkOrchestratorHealth(): Promise<{ reachable: boolean; detail: string }> {
  const url = process.env.AI_ORCHESTRATOR_URL;
  if (!url) return { reachable: false, detail: "AI_ORCHESTRATOR_URL is not configured." };

  try {
    const response = await fetch(`${url}/health`, { cache: "no-store" });
    if (!response.ok) {
      return { reachable: false, detail: `Orchestrator responded with ${response.status}.` };
    }
    const body = await response.json();
    return { reachable: true, detail: JSON.stringify(body) };
  } catch (err) {
    return {
      reachable: false,
      detail: err instanceof Error ? err.message : "Orchestrator unreachable.",
    };
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    notFound();
  }

  const [
    { count: userCount },
    { count: projectCount },
    jobStatusCounts,
    { data: recentJobs },
    { data: wallets },
    health,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    Promise.all(
      JOB_STATUSES.map(async (status) => {
        const { count } = await supabase
          .from("ai_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        return { status, count: count ?? 0 };
      }),
    ),
    supabase
      .from("ai_jobs")
      .select("id, user_id, job_type, model_id, status, estimated_cost, actual_cost, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("credit_wallets").select("available_credits, reserved_credits, used_credits"),
    checkOrchestratorHealth(),
  ]);

  const totals = (wallets ?? []).reduce(
    (acc, w) => ({
      available: acc.available + Number(w.available_credits),
      reserved: acc.reserved + Number(w.reserved_credits),
      used: acc.used + Number(w.used_credits),
    }),
    { available: 0, reserved: 0, used: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System-wide view — visible to admins only.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={String(userCount ?? 0)} />
        <StatCard label="Projects" value={String(projectCount ?? 0)} />
        <StatCard label="XCredits used (all users)" value={totals.used.toLocaleString()} />
        <StatCard label="XCredits reserved (in-flight)" value={totals.reserved.toLocaleString()} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">System health</h2>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${health.reachable ? "bg-green-500" : "bg-destructive"}`}
          />
          <span>AI Orchestrator: {health.reachable ? "reachable" : "unreachable"}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{health.detail}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Jobs by status</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {jobStatusCounts.map(({ status, count }) => (
            <div key={status} className="rounded-md border border-border p-2 text-center">
              <p className="text-lg font-semibold">{count}</p>
              <p className="text-[10px] text-muted-foreground">{status}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <h2 className="p-5 pb-0 text-sm font-medium text-muted-foreground">Recent jobs</h2>
        <div className="scrollbar-thin overflow-x-auto p-5">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pb-2">Type</th>
                <th className="pb-2">Model</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Est. cost</th>
                <th className="pb-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(recentJobs ?? []).map((job) => (
                <tr key={job.id}>
                  <td className="py-2">{job.job_type}</td>
                  <td className="py-2">{job.model_id ?? "—"}</td>
                  <td className="py-2">{job.status}</td>
                  <td className="py-2">{job.estimated_cost ?? "—"}</td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!recentJobs || recentJobs.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
