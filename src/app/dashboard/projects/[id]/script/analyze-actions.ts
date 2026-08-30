"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractCharacterNames, extractSceneHeadings } from "@/lib/script/analyze";

export interface AnalyzeScriptResult {
  scenesCreated: number;
  charactersCreated: number;
  locationsCreated: number;
}

/**
 * Seeds the Story Bible (Scenes, Locations, Characters) from the script
 * text via deterministic screenplay parsing — no LLM call. Never creates
 * a duplicate for a name/heading that already exists, so it's safe to
 * re-run after editing the script.
 */
export async function analyzeScript(
  projectId: string,
  scriptId: string,
): Promise<AnalyzeScriptResult> {
  const supabase = await createClient();

  const { data: script, error: scriptError } = await supabase
    .from("scripts")
    .select("content")
    .eq("id", scriptId)
    .single();
  if (scriptError) throw new Error(scriptError.message);

  const text = (script.content as unknown as { text: string })?.text ?? "";
  const headings = extractSceneHeadings(text);
  const characterNames = extractCharacterNames(text);

  const [{ data: existingLocations }, { data: existingScenes }, { data: existingCharacters }] =
    await Promise.all([
      supabase.from("locations").select("id, name").eq("project_id", projectId),
      supabase.from("scenes").select("heading").eq("project_id", projectId),
      supabase.from("characters").select("name").eq("project_id", projectId),
    ]);

  const locationByName = new Map(
    (existingLocations ?? []).map((loc) => [loc.name.toLowerCase(), loc.id]),
  );
  const existingHeadings = new Set(
    (existingScenes ?? []).map((scene) => (scene.heading ?? "").toLowerCase()),
  );
  const existingCharacterNames = new Set(
    (existingCharacters ?? []).map((c) => c.name.toLowerCase()),
  );

  let locationsCreated = 0;
  let scenesCreated = 0;
  let charactersCreated = 0;
  let nextSceneNumber =
    (existingScenes ?? []).length > 0 ? (existingScenes ?? []).length + 1 : 1;

  for (const heading of headings) {
    if (existingHeadings.has(heading.raw.toLowerCase())) continue;

    let locationId = locationByName.get(heading.locationName.toLowerCase());
    if (!locationId) {
      const { data: newLocation, error } = await supabase
        .from("locations")
        .insert({ project_id: projectId, name: heading.locationName })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      locationId = newLocation.id;
      locationByName.set(heading.locationName.toLowerCase(), locationId);
      locationsCreated++;
    }

    const { error: sceneError } = await supabase.from("scenes").insert({
      project_id: projectId,
      script_id: scriptId,
      location_id: locationId,
      scene_number: nextSceneNumber,
      heading: heading.raw,
      int_ext: heading.intExt,
      time_of_day: heading.timeOfDay,
      order_index: nextSceneNumber,
    });
    if (sceneError) throw new Error(sceneError.message);

    existingHeadings.add(heading.raw.toLowerCase());
    nextSceneNumber++;
    scenesCreated++;
  }

  for (const name of characterNames) {
    if (existingCharacterNames.has(name.toLowerCase())) continue;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) continue;

    const { error } = await supabase
      .from("characters")
      .insert({ project_id: projectId, name, created_by: user.id });
    if (error) throw new Error(error.message);

    existingCharacterNames.add(name.toLowerCase());
    charactersCreated++;
  }

  revalidatePath(`/dashboard/projects/${projectId}/scenes`);
  revalidatePath(`/dashboard/projects/${projectId}/characters`);
  revalidatePath(`/dashboard/projects/${projectId}/environments`);

  return { scenesCreated, charactersCreated, locationsCreated };
}
