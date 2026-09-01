import { createClient } from "@/lib/supabase/server";
import { AssetLibrary } from "./asset-library";

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assets } = await supabase
    .from("assets")
    .select("id, type, file_name, tags, storage_path, mime_type, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return (
    <AssetLibrary
      projectId={projectId}
      userId={user!.id}
      initialAssets={assets ?? []}
    />
  );
}
