import { createClient } from "@/lib/supabase/server";
import { createProject } from "./actions";

const PROJECT_TYPES = [
  "movie",
  "drama",
  "short_film",
  "trailer",
  "music_video",
  "commercial",
  "documentary",
] as const;

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, type, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Movies, dramas, shorts, trailers, music videos, commercials, and documentaries.
        </p>
      </div>

      <form
        action={createProject}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-xs text-muted-foreground">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="Untitled Project"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-xs text-muted-foreground">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          New Project
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Could not load projects: {error.message}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        {projects && projects.length > 0 ? (
          <ul className="divide-y divide-border">
            {projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.type.replace("_", " ")} · {project.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No projects yet. Create one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
