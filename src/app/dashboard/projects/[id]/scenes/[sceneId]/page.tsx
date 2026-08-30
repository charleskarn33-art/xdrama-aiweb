import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createShot, deleteScene, deleteShot, updateScene } from "../actions";
import { addShotToTimeline } from "../../timeline/actions";

const INT_EXT_OPTIONS = ["", "INT", "EXT", "INT/EXT"] as const;

export default async function SceneDetailPage({
  params,
}: {
  params: Promise<{ id: string; sceneId: string }>;
}) {
  const { id: projectId, sceneId } = await params;
  const supabase = await createClient();

  const [{ data: scene }, { data: locations }, { data: shots }] = await Promise.all([
    supabase.from("scenes").select("*").eq("id", sceneId).maybeSingle(),
    supabase.from("locations").select("id, name").eq("project_id", projectId).order("name"),
    supabase
      .from("shots")
      .select("id, shot_number, camera_angle, camera_movement, prompt, duration_seconds, status")
      .eq("scene_id", sceneId)
      .order("shot_number", { ascending: true }),
  ]);

  if (!scene) notFound();

  const updateSceneWithIds = updateScene.bind(null, sceneId, projectId);
  const deleteSceneWithIds = deleteScene.bind(null, sceneId, projectId);
  const createShotWithIds = createShot.bind(null, sceneId, projectId);

  return (
    <div className="flex flex-col gap-6">
      <form
        action={updateSceneWithIds}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-1">
            <label htmlFor="heading" className="text-xs text-muted-foreground">
              Heading
            </label>
            <input
              id="heading"
              name="heading"
              defaultValue={scene.heading ?? ""}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="intExt" className="text-xs text-muted-foreground">
              INT/EXT
            </label>
            <select
              id="intExt"
              name="intExt"
              defaultValue={scene.int_ext ?? ""}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {INT_EXT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt || "—"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="timeOfDay" className="text-xs text-muted-foreground">
              Time of day
            </label>
            <input
              id="timeOfDay"
              name="timeOfDay"
              defaultValue={scene.time_of_day ?? ""}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="locationId" className="text-xs text-muted-foreground">
              Location
            </label>
            <select
              id="locationId"
              name="locationId"
              defaultValue={scene.location_id ?? ""}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {locations?.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mood" className="text-xs text-muted-foreground">
              Mood
            </label>
            <input
              id="mood"
              name="mood"
              defaultValue={scene.mood ?? ""}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="estimatedDurationSeconds" className="text-xs text-muted-foreground">
              Est. duration (s)
            </label>
            <input
              id="estimatedDurationSeconds"
              name="estimatedDurationSeconds"
              type="number"
              defaultValue={scene.estimated_duration_seconds ?? ""}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-xs text-muted-foreground">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={scene.description ?? ""}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Save
          </button>
          <button
            formAction={deleteSceneWithIds}
            className="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete scene
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Shots</h2>

        {shots && shots.length > 0 && (
          <ul className="mb-4 flex flex-col gap-2">
            {shots.map((shot) => {
              const deleteShotWithIds = deleteShot.bind(null, shot.id, sceneId, projectId);
              const addShotWithIds = addShotToTimeline.bind(null, projectId, shot.id);
              return (
                <li
                  key={shot.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      Shot {shot.shot_number}
                      {shot.camera_angle ? ` — ${shot.camera_angle}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shot.prompt || "No prompt yet"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <form action={addShotWithIds}>
                      <button className="text-xs text-accent hover:underline">
                        Add to Timeline
                      </button>
                    </form>
                    <form action={deleteShotWithIds}>
                      <button className="text-xs text-destructive hover:underline">Delete</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form action={createShotWithIds} className="flex flex-wrap items-end gap-2">
          <input
            name="cameraAngle"
            placeholder="Camera angle"
            className="w-36 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            name="cameraMovement"
            placeholder="Camera movement"
            className="w-36 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            name="prompt"
            placeholder="Shot prompt"
            className="w-64 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            name="durationSeconds"
            type="number"
            placeholder="Sec"
            className="w-16 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            Add shot
          </button>
        </form>
      </div>
    </div>
  );
}
