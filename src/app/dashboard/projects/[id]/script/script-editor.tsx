"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { countWords, detectSceneHeadings } from "@/lib/script/parse";
import { restoreVersion, saveScript } from "./actions";

const AUTOSAVE_DELAY_MS = 2000;

interface ScriptVersionSummary {
  id: string;
  version_number: number;
  created_at: string;
}

export function ScriptEditor({
  scriptId,
  projectId,
  initialText,
  versions,
}: {
  scriptId: string;
  projectId: string;
  initialText: string;
  versions: ScriptVersionSummary[];
}) {
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isRestoring, startRestoring] = useTransition();
  const router = useRouter();
  const savedTextRef = useRef(initialText);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(() => countWords(text), [text]);
  const sceneHeadings = useMemo(() => detectSceneHeadings(text), [text]);

  useEffect(() => {
    if (text === savedTextRef.current) return;

    setStatus("saving");
    const timeout = setTimeout(async () => {
      await saveScript(scriptId, projectId, text);
      savedTextRef.current = text;
      setStatus("saved");
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [text, scriptId, projectId]);

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleExport() {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "script.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleRestore(versionId: string) {
    startRestoring(async () => {
      await restoreVersion(scriptId, projectId, versionId);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {wordCount} words · {sceneHeadings.length} scene heading
            {sceneHeadings.length === 1 ? "" : "s"} detected
          </span>
          <span>
            {status === "saving" && "Saving…"}
            {status === "saved" && "Saved"}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          placeholder={"INT. VILLAGE SQUARE - DAY\n\nA quiet morning..."}
          className="scrollbar-thin h-[65vh] w-full resize-none rounded-xl border border-border bg-card p-4 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Import .txt
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.fountain"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={handleExport}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Export .txt
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium">Version history</h2>
        {versions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved versions yet.</p>
        ) : (
          <ul className="scrollbar-thin flex max-h-[55vh] flex-col gap-1 overflow-y-auto">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted"
              >
                <div>
                  <p>v{version.version_number}</p>
                  <p className="text-muted-foreground">
                    {new Date(version.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  disabled={isRestoring}
                  onClick={() => handleRestore(version.id)}
                  className="text-accent hover:underline disabled:opacity-50"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
