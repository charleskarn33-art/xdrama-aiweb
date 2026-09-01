"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReferenceRow {
  id: string;
  storage_path: string;
}

export function LocationReferences({
  locationId,
  userId,
  projectId,
  initialReferences,
}: {
  locationId: string;
  userId: string;
  projectId: string;
  initialReferences: ReferenceRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [references, setReferences] = useState(initialReferences);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      references.map(async (ref) => {
        const { data } = await supabase.storage
          .from("assets")
          .createSignedUrl(ref.storage_path, 3600);
        return [ref.id, data?.signedUrl] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      const withUrls = entries.filter((e): e is [string, string] => Boolean(e[1]));
      setPreviewUrls(Object.fromEntries(withUrls));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [references.map((r) => r.id).join(",")]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${userId}/${projectId}/locations/${locationId}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("assets").upload(path, file);
        if (uploadError) throw uploadError;

        const { data: inserted, error: insertError } = await supabase
          .from("location_references")
          .insert({ location_id: locationId, storage_path: path })
          .select("id, storage_path")
          .single();
        if (insertError) throw insertError;

        setReferences((prev) => [...prev, inserted as ReferenceRow]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(ref: ReferenceRow) {
    await supabase.storage.from("assets").remove([ref.storage_path]);
    await supabase.from("location_references").delete().eq("id", ref.id);
    setReferences((prev) => prev.filter((r) => r.id !== ref.id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Reference images</h2>
        <button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {references.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No reference images yet — add some to guide the location&apos;s look.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {references.map((ref) => (
            <div key={ref.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              {previewUrls[ref.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrls[ref.id]} alt="" className="h-full w-full object-cover" />
              )}
              <button
                onClick={() => handleDelete(ref)}
                className="absolute right-1 top-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-destructive opacity-0 transition-opacity group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
