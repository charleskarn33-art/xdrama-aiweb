"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectType } from "@/types/database";

const PROJECT_TYPES: ProjectType[] = [
  "movie",
  "drama",
  "short_film",
  "trailer",
  "music_video",
  "commercial",
  "documentary",
];

export async function createProject(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "");

  if (!title) {
    throw new Error("Title is required.");
  }
  if (!PROJECT_TYPES.includes(type as ProjectType)) {
    throw new Error("Invalid project type.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { error } = await supabase.from("projects").insert({
    title,
    type: type as ProjectType,
    created_by: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
}
