"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function createCharacter(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase.from("characters").insert({
    project_id: projectId,
    name,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/characters`);
}

export async function updateCharacter(
  characterId: string,
  projectId: string,
  formData: FormData,
) {
  const appearance: Json = {
    hair: String(formData.get("hair") ?? ""),
    eyes: String(formData.get("eyes") ?? ""),
    skin: String(formData.get("skin") ?? ""),
    bodyType: String(formData.get("bodyType") ?? ""),
    clothing: String(formData.get("clothing") ?? ""),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("characters")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      age: String(formData.get("age") ?? "") || null,
      gender: String(formData.get("gender") ?? "") || null,
      appearance,
      personality: String(formData.get("personality") ?? "") || null,
      visual_style: String(formData.get("visualStyle") ?? "") || null,
      negative_attributes: String(formData.get("negativeAttributes") ?? "") || null,
    })
    .eq("id", characterId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/characters/${characterId}`);
}

export async function deleteCharacter(characterId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("characters").delete().eq("id", characterId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}/characters`);
}
