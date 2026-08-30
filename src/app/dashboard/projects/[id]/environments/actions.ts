"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createLocation(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert({ project_id: projectId, name });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/environments`);
}

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function updateLocation(
  locationId: string,
  projectId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "") || null,
      lighting: String(formData.get("lighting") ?? "") || null,
      weather: String(formData.get("weather") ?? "") || null,
      time_of_day: String(formData.get("timeOfDay") ?? "") || null,
      architectural_style: String(formData.get("architecturalStyle") ?? "") || null,
      color_palette: splitList(formData.get("colorPalette")),
      camera_presets: splitList(formData.get("cameraPresets")),
    })
    .eq("id", locationId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/environments/${locationId}`);
}

export async function deleteLocation(locationId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", locationId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/environments`);
}
