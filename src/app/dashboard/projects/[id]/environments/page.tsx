import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createLocation } from "./actions";

export default async function EnvironmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, time_of_day, weather")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const createLocationWithProject = createLocation.bind(null, projectId);

  return (
    <div className="flex flex-col gap-6">
      <form
        action={createLocationWithProject}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs text-muted-foreground">
            Location name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Village Market"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Add location
        </button>
      </form>

      {locations && locations.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Link
              key={location.id}
              href={`/dashboard/projects/${projectId}/environments/${location.id}`}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent"
            >
              <p className="font-medium">{location.name}</p>
              <p className="text-xs text-muted-foreground">
                {[location.time_of_day, location.weather].filter(Boolean).join(" · ") ||
                  "No details yet"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No locations yet. Add one above to reuse it across scenes.
        </div>
      )}
    </div>
  );
}
