import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LocationReferences } from "@/components/media/location-references";
import { deleteLocation, updateLocation } from "../actions";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string; locationId: string }>;
}) {
  const { id: projectId, locationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: location }, { data: references }] = await Promise.all([
    supabase.from("locations").select("*").eq("id", locationId).maybeSingle(),
    supabase
      .from("location_references")
      .select("id, storage_path")
      .eq("location_id", locationId),
  ]);

  if (!location) notFound();

  const updateLocationWithIds = updateLocation.bind(null, locationId, projectId);
  const deleteLocationWithIds = deleteLocation.bind(null, locationId, projectId);
  const colorPalette = (location.color_palette as string[] | null) ?? [];
  const cameraPresets = (location.camera_presets as string[] | null) ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form
        action={updateLocationWithIds}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" name="name" defaultValue={location.name} />
          <Field label="Time of day" name="timeOfDay" defaultValue={location.time_of_day ?? ""} />
          <Field label="Weather" name="weather" defaultValue={location.weather ?? ""} />
          <Field label="Lighting" name="lighting" defaultValue={location.lighting ?? ""} />
          <Field
            label="Architectural style"
            name="architecturalStyle"
            defaultValue={location.architectural_style ?? ""}
          />
        </div>
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={location.description ?? ""}
        />
        <Field
          label="Color palette (comma separated)"
          name="colorPalette"
          defaultValue={colorPalette.join(", ")}
        />
        <Field
          label="Camera presets (comma separated)"
          name="cameraPresets"
          defaultValue={cameraPresets.join(", ")}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Save
          </button>
          <button
            formAction={deleteLocationWithIds}
            className="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete location
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <LocationReferences
          locationId={locationId}
          projectId={projectId}
          userId={user!.id}
          initialReferences={references ?? []}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs text-muted-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs text-muted-foreground">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={2}
        defaultValue={defaultValue}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
