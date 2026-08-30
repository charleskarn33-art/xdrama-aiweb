import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CharacterReferences } from "@/components/media/character-references";
import { deleteCharacter, updateCharacter } from "../actions";

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string; characterId: string }>;
}) {
  const { id: projectId, characterId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: character }, { data: references }] = await Promise.all([
    supabase.from("characters").select("*").eq("id", characterId).maybeSingle(),
    supabase
      .from("character_references")
      .select("id, storage_path, is_primary")
      .eq("character_id", characterId),
  ]);

  if (!character) notFound();

  const appearance = (character.appearance ?? {}) as Record<string, string>;
  const updateCharacterWithIds = updateCharacter.bind(null, characterId, projectId);
  const deleteCharacterWithIds = deleteCharacter.bind(null, characterId, projectId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form
        action={updateCharacterWithIds}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" name="name" defaultValue={character.name} />
          <Field label="Age" name="age" defaultValue={character.age ?? ""} />
          <Field label="Gender" name="gender" defaultValue={character.gender ?? ""} />
          <Field label="Visual style" name="visualStyle" defaultValue={character.visual_style ?? ""} />
          <Field label="Hair" name="hair" defaultValue={appearance.hair ?? ""} />
          <Field label="Eyes" name="eyes" defaultValue={appearance.eyes ?? ""} />
          <Field label="Skin" name="skin" defaultValue={appearance.skin ?? ""} />
          <Field label="Body type" name="bodyType" defaultValue={appearance.bodyType ?? ""} />
        </div>
        <Field label="Clothing" name="clothing" defaultValue={appearance.clothing ?? ""} />
        <TextAreaField
          label="Personality"
          name="personality"
          defaultValue={character.personality ?? ""}
        />
        <TextAreaField
          label="Negative attributes"
          name="negativeAttributes"
          defaultValue={character.negative_attributes ?? ""}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Save
          </button>
          <button
            formAction={deleteCharacterWithIds}
            className="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete character
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <CharacterReferences
          characterId={characterId}
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
