import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: projectCount }, { data: wallet }, { data: recentProjects }] =
    await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("credit_wallets").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase
        .from("projects")
        .select("id, title, type, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Script to complete movie — your production overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value={String(projectCount ?? 0)} />
        <StatCard
          label="XCredits available"
          value={wallet ? Number(wallet.available_credits).toLocaleString() : "0"}
        />
        <StatCard
          label="XCredits reserved"
          value={wallet ? Number(wallet.reserved_credits).toLocaleString() : "0"}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-accent hover:underline"
          >
            View all
          </Link>
        </div>

        {recentProjects && recentProjects.length > 0 ? (
          <ul className="divide-y divide-border">
            {recentProjects.map((project) => (
              <li key={project.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.type} · {project.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No projects yet.{" "}
            <Link href="/dashboard/projects" className="text-accent hover:underline">
              Create your first project
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
