"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { filterAssets, guessAssetType, type FilterableAsset } from "@/lib/assets/filter";

interface AssetRow extends FilterableAsset {
  storage_path: string;
  mime_type: string | null;
  created_at: string;
}

const ASSET_TYPES = [
  "all",
  "image",
  "video",
  "audio",
  "character",
  "location",
  "prop",
  "music",
  "voice",
  "storyboard",
] as const;

export function AssetLibrary({
  projectId,
  userId,
  initialAssets,
}: {
  projectId: string;
  userId: string;
  initialAssets: AssetRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [assets, setAssets] = useState(initialAssets);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof ASSET_TYPES)[number]>("all");
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleAssets = useMemo(
    () => filterAssets(assets, { search, type: typeFilter }),
    [assets, search, typeFilter],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPreviews() {
      const entries = await Promise.all(
        visibleAssets.map(async (asset) => {
          const { data } = await supabase.storage
            .from("assets")
            .createSignedUrl(asset.storage_path, 3600);
          return [asset.id, data?.signedUrl] as const;
        }),
      );
      if (!cancelled) {
        const withUrls = entries.filter(
          (entry): entry is [string, string] => Boolean(entry[1]),
        );
        setPreviewUrls(Object.fromEntries(withUrls));
      }
    }

    loadPreviews();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleAssets.map((a) => a.id).join(",")]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      for (const file of Array.from(files)) {
        const type = guessAssetType(file.type);
        const path = `${userId}/${projectId}/${type}/${crypto.randomUUID()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("assets")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: inserted, error: insertError } = await supabase
          .from("assets")
          .insert({
            project_id: projectId,
            user_id: userId,
            type,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            tags,
          })
          .select("*")
          .single();
        if (insertError) throw insertError;

        setAssets((prev) => [inserted as AssetRow, ...prev]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(asset: AssetRow) {
    await supabase.storage.from("assets").remove([asset.storage_path]);
    await supabase.from("assets").delete().eq("id", asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Tags (comma separated)</label>
          <input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="hero, village, night"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload files"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or tag…"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as (typeof ASSET_TYPES)[number])
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {ASSET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {visibleAssets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No assets yet. Upload images, video, or audio above.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex aspect-video items-center justify-center bg-muted">
                {previewUrls[asset.id] && asset.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrls[asset.id]}
                    alt={asset.file_name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs uppercase text-muted-foreground">{asset.type}</span>
                )}
              </div>
              <div className="flex flex-col gap-1 px-3 pb-3">
                <p className="truncate text-xs font-medium">{asset.file_name}</p>
                <div className="flex flex-wrap gap-1">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleDelete(asset)}
                  className="self-start text-[11px] text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
