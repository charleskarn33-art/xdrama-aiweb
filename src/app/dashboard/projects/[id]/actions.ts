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
