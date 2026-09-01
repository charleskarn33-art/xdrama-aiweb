import { createClient } from "@/lib/supabase/server";
import { getOrCreateScript } from "./actions";
import { ScriptEditor } from "./script-editor";

export default async function ScriptStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const script = await getOrCreateScript(projectId);

  const supabase = await createClient();
  const { data: versions } = await supabase
    .from("script_versions")
    .select("id, version_number, created_at")
    .eq("script_id", script.id)
    .order("version_number", { ascending: false });

  const content = script.content as unknown as { text: string };

  return (
    <ScriptEditor
      scriptId={script.id}
      projectId={projectId}
      initialText={content?.text ?? ""}
      versions={versions ?? []}
    />
  );
}
