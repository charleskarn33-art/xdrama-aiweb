import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createScene } from "./actions";

export default async function ScenesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const { data: scenes } = await supabase
    .from("scenes")
    .select("id, scene_number, heading, int_ext, time_of_day")
    .eq("project_id", projectId)
    .order("scene_number", { ascending: true });

  const createSceneWithProject = createScene.bind(null, projectId);

  return (
    <div className="flex flex-col gap-6">
      <form
        action={createSceneWithProject}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="heading" className="text-xs text-muted-foreground">
            Scene heading
          </label>
          <input
            id="heading"
            name="heading"
            placeholder="INT. VILLAGE SQUARE - DAY"
            className="w-80 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Add scene
        </button>
      </form>

      {scenes && scenes.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {scenes.map((scene) => (
            <li key={scene.id}>
              <Link
                href={`/dashboard/projects/${projectId}/scenes/${scene.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted"
              >
                <div>
                  <p className="font-medium">
                    Scene {scene.scene_number} — {scene.heading}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[scene.int_ext, scene.time_of_day].filter(Boolean).join(" · ") || "No details yet"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No scenes yet. Add one above, then break it into shots.
        </div>
      )}
    </div>
  );
}
