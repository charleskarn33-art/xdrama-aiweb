export interface FilterableAsset {
  id: string;
  type: string;
  file_name: string | null;
  tags: string[];
}

export function guessAssetType(mimeType: string): "image" | "video" | "audio" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image";
}

export function filterAssets<T extends FilterableAsset>(
  assets: T[],
  { search, type }: { search: string; type: string | "all" },
): T[] {
  const needle = search.trim().toLowerCase();

  return assets.filter((asset) => {
    if (type !== "all" && asset.type !== type) return false;
    if (!needle) return true;

    const haystack = [asset.file_name ?? "", ...asset.tags].join(" ").toLowerCase();
    return haystack.includes(needle);
  });
}
