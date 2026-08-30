"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createScene(projectId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("scenes")
    .select("scene_number")
    .eq("project_id", projectId)
    .order("scene_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (last?.scene_number ?? 0) + 1;
  const heading = String(formData.get("heading") ?? "").trim();

  const { error } = await supabase.from("scenes").insert({
    project_id: projectId,
    scene_number: nextNumber,
    heading: heading || `Scene ${nextNumber}`,
    order_index: nextNumber,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/scenes`);
}

export async function updateScene(sceneId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const locationId = String(formData.get("locationId") ?? "");
  const durationRaw = formData.get("estimatedDurationSeconds");

  const { error } = await supabase
    .from("scenes")
    .update({
      heading: String(formData.get("heading") ?? "").trim(),
      location_id: locationId || null,
      int_ext: (String(formData.get("intExt") ?? "") || null) as "INT" | "EXT" | "INT/EXT" | null,
      time_of_day: String(formData.get("timeOfDay") ?? "") || null,
      mood: String(formData.get("mood") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
      estimated_duration_seconds: durationRaw ? Number(durationRaw) : null,
    })
    .eq("id", sceneId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/scenes/${sceneId}`);
}

export async function deleteScene(sceneId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("scenes").delete().eq("id", sceneId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/scenes`);
}

export async function createShot(sceneId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("shots")
    .select("shot_number")
    .eq("scene_id", sceneId)
    .order("shot_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (last?.shot_number ?? 0) + 1;
  const durationRaw = formData.get("durationSeconds");

  const { error } = await supabase.from("shots").insert({
    scene_id: sceneId,
    shot_number: nextNumber,
    camera_angle: String(formData.get("cameraAngle") ?? "") || null,
    camera_movement: String(formData.get("cameraMovement") ?? "") || null,
    prompt: String(formData.get("prompt") ?? "") || null,
    duration_seconds: durationRaw ? Number(durationRaw) : null,
    order_index: nextNumber,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/scenes/${sceneId}`);
}

export async function deleteShot(shotId: string, sceneId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shots").delete().eq("id", shotId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/scenes/${sceneId}`);
}
