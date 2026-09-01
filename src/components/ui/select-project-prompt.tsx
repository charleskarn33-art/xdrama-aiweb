import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/** Script Studio and Assets are project-scoped (`/dashboard/projects/[id]/...`);
 * this renders when someone opens the top-level nav item without a project
 * selected yet, listing projects to jump into instead of a dead-end stub. */
export async function SelectProjectPrompt({ feature }: { feature: string }) {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .order("updated_at", { ascending: false })
    .limit(10);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border p-16 text-center">
      <h2 className="text-xl font-semibold">{feature}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {feature} lives inside a project. Choose one below, or create a new
        project first.
      </p>
      {projects && projects.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="text-accent hover:underline"
              >
                {project.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Link
          href="/dashboard/projects"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Create a project
        </Link>
      )}
    </div>
  );
}
