import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProject } from "./actions";

const PROJECT_STATUSES = ["draft", "in_progress", "completed", "archived"] as const;

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  const updateProjectWithId = updateProject.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard label="Type" value={project.type.replace("_", " ")} />
        <InfoCard label="Aspect ratio" value={project.aspect_ratio} />
        <InfoCard label="Target resolution" value={project.target_resolution} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={`/dashboard/projects/${id}/script`}
          className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent"
        >
          <p className="font-medium">Script Studio</p>
          <p className="text-sm text-muted-foreground">Write or import the screenplay.</p>
        </Link>
        <Link
          href={`/dashboard/projects/${id}/assets`}
          className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent"
        >
          <p className="font-medium">Asset Library</p>
          <p className="text-sm text-muted-foreground">Upload and manage project media.</p>
        </Link>
      </div>

      <form
        action={updateProjectWithId}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="text-sm font-medium text-muted-foreground">Project details</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-xs text-muted-foreground">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={project.description ?? ""}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={project.status}
            className="w-fit rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </form>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
