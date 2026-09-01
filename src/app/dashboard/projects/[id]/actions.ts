"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types/database";

const PROJECT_STATUSES: ProjectStatus[] = ["draft", "in_progress", "completed", "archived"];

export async function updateProject(projectId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!PROJECT_STATUSES.includes(status as ProjectStatus)) {
    throw new Error("Invalid project status.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ description, status: status as ProjectStatus })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
}

/**
 * Cultural context is entirely user-defined (spec section 75) — the app
 * never assumes a project's language or setting. This is free text plus a
 * couple of structured fields, not a picklist of "supported" cultures.
 */
export async function updateCulturalContext(projectId: string, formData: FormData) {
  const supabase = await createClient();

  const languages = String(formData.get("languages") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const { error } = await supabase.from("project_settings").upsert({
    project_id: projectId,
    cultural_context: {
      languages,
      setting: String(formData.get("setting") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
}
