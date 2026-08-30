import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCharacter } from "./actions";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const { data: characters } = await supabase
    .from("characters")
    .select("id, name, age, gender")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const createCharacterWithProject = createCharacter.bind(null, projectId);

  return (
    <div className="flex flex-col gap-6">
      <form
        action={createCharacterWithProject}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs text-muted-foreground">
            Character name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Old Ma Korto"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Add character
        </button>
      </form>

      {characters && characters.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <Link
              key={character.id}
              href={`/dashboard/projects/${projectId}/characters/${character.id}`}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent"
            >
              <p className="font-medium">{character.name}</p>
              <p className="text-xs text-muted-foreground">
                {[character.age, character.gender].filter(Boolean).join(" · ") || "No details yet"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No characters yet. Add one above to keep their appearance consistent
          across every scene.
        </div>
      )}
    </div>
  );
}
