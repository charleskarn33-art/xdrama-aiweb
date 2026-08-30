"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countWords } from "@/lib/script/parse";
import type { Json } from "@/types/database";

interface ScriptContent {
  text: string;
  [key: string]: Json | undefined;
}

/** Every project has exactly one primary script in Sprint 2 — multiple
 * script variants/drafts as separate rows is left for a later sprint. */
export async function getOrCreateScript(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: existing, error: fetchError } = await supabase
    .from("scripts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("scripts")
    .insert({
      project_id: projectId,
      title: "Untitled Script",
      content: { text: "" } satisfies ScriptContent,
      format: "plain",
      word_count: 0,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);
  return created;
}

export async function saveScript(scriptId: string, projectId: string, text: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const wordCount = countWords(text);
  const content: ScriptContent = { text };

  const { error: updateError } = await supabase
    .from("scripts")
    .update({ content, word_count: wordCount })
    .eq("id", scriptId);
  if (updateError) throw new Error(updateError.message);

  const { data: lastVersion } = await supabase
    .from("script_versions")
    .select("version_number")
    .eq("script_id", scriptId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (lastVersion?.version_number ?? 0) + 1;

  const { error: versionError } = await supabase.from("script_versions").insert({
    script_id: scriptId,
    version_number: nextVersion,
    content,
    created_by: user.id,
  });
  if (versionError) throw new Error(versionError.message);

  revalidatePath(`/dashboard/projects/${projectId}/script`);
  return { wordCount, versionNumber: nextVersion };
}

export async function restoreVersion(
  scriptId: string,
  projectId: string,
  versionId: string,
) {
  const supabase = await createClient();

  const { data: version, error } = await supabase
    .from("script_versions")
    .select("content")
    .eq("id", versionId)
    .single();
  if (error) throw new Error(error.message);

  const content = version.content as unknown as ScriptContent;
  await saveScript(scriptId, projectId, content.text);
}
