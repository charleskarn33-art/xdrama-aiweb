import { describe, expect, it } from "vitest";
import { filterAssets, guessAssetType } from "@/lib/assets/filter";

describe("guessAssetType", () => {
  it("classifies by mime prefix", () => {
    expect(guessAssetType("video/mp4")).toBe("video");
    expect(guessAssetType("audio/mpeg")).toBe("audio");
    expect(guessAssetType("image/png")).toBe("image");
    expect(guessAssetType("application/pdf")).toBe("image");
  });
});

describe("filterAssets", () => {
  const assets = [
    { id: "1", type: "image", file_name: "hero-portrait.png", tags: ["hero", "night"] },
    { id: "2", type: "video", file_name: "market-scene.mp4", tags: ["market"] },
    { id: "3", type: "image", file_name: "village.png", tags: ["village", "day"] },
  ];

  it("returns everything when no filters are set", () => {
    expect(filterAssets(assets, { search: "", type: "all" })).toHaveLength(3);
  });

  it("filters by exact type", () => {
    const result = filterAssets(assets, { search: "", type: "video" });
    expect(result.map((a) => a.id)).toEqual(["2"]);
  });

  it("matches search against file name and tags, case-insensitively", () => {
    expect(filterAssets(assets, { search: "HERO", type: "all" }).map((a) => a.id)).toEqual(["1"]);
    expect(filterAssets(assets, { search: "village", type: "all" }).map((a) => a.id)).toEqual(["3"]);
  });

  it("combines type and search filters", () => {
    const result = filterAssets(assets, { search: "night", type: "video" });
    expect(result).toHaveLength(0);
  });
});
