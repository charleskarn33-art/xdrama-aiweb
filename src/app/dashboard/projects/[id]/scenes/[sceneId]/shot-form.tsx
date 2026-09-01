"use client";

import { useState } from "react";
import { buildPrompt, type PromptContext } from "@/lib/ai/prompt-engine";
import { createShot } from "../actions";

export function ShotForm({
  sceneId,
  projectId,
  sceneContext,
}: {
  sceneId: string;
  projectId: string;
  sceneContext: Omit<PromptContext, "cameraAngle" | "cameraMovement">;
}) {
  const [cameraAngle, setCameraAngle] = useState("");
  const [cameraMovement, setCameraMovement] = useState("");
  const [prompt, setPrompt] = useState("");

  function handleSuggest() {
    const result = buildPrompt({ ...sceneContext, cameraAngle, cameraMovement }, "video");
    setPrompt(result.prompt);
  }

  return (
    <form
      action={createShot.bind(null, sceneId, projectId)}
      className="flex flex-wrap items-end gap-2"
    >
      <input
        name="cameraAngle"
        placeholder="Camera angle"
        value={cameraAngle}
        onChange={(e) => setCameraAngle(e.target.value)}
        className="w-36 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        name="cameraMovement"
        placeholder="Camera movement"
        value={cameraMovement}
        onChange={(e) => setCameraMovement(e.target.value)}
        className="w-36 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        name="prompt"
        placeholder="Shot prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-64 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        name="durationSeconds"
        type="number"
        placeholder="Sec"
        className="w-16 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        onClick={handleSuggest}
        className="rounded-md border border-accent/40 px-3 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
      >
        Suggest
      </button>
      <button
        type="submit"
        className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
      >
        Add shot
      </button>
    </form>
  );
}
