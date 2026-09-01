"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { countWords, detectSceneHeadings } from "@/lib/script/parse";
import { restoreVersion, saveScript } from "./actions";
import { analyzeScript, type AnalyzeScriptResult } from "./analyze-actions";
import { estimateSubtitleTiming, extractDialogueLines, formatSRT, formatVTT } from "@/lib/subtitles/generate";

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
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeScriptResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
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

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    downloadFile(text, "script.txt", "text/plain");
  }

  function handleExportSubtitles(format: "srt" | "vtt") {
    const cues = estimateSubtitleTiming(extractDialogueLines(text));
    const content = format === "srt" ? formatSRT(cues) : formatVTT(cues);
    downloadFile(content, `subtitles.${format}`, "text/plain");
  }

  function handleRestore(versionId: string) {
    startRestoring(async () => {
      await restoreVersion(scriptId, projectId, versionId);
      router.refresh();
    });
  }

  function handleAnalyze() {
    setAnalyzeError(null);
    startAnalyzing(async () => {
      try {
        await saveScript(scriptId, projectId, text);
        savedTextRef.current = text;
        const result = await analyzeScript(projectId, scriptId);
        setAnalyzeResult(result);
        router.refresh();
      } catch (err) {
        setAnalyzeError(err instanceof Error ? err.message : "Analysis failed.");
      }
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
        <div className="flex flex-wrap gap-2">
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
          <button
            onClick={() => handleExportSubtitles("srt")}
            title="Timing is a words-per-second estimate, not measured from real audio — adjust after Voice Studio generates dialogue."
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Export .srt
          </button>
          <button
            onClick={() => handleExportSubtitles("vtt")}
            title="Timing is a words-per-second estimate, not measured from real audio — adjust after Voice Studio generates dialogue."
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Export .vtt
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="rounded-md border border-accent/40 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing…" : "Analyze Script"}
          </button>
        </div>

        {analyzeError && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {analyzeError}
          </p>
        )}
        {analyzeResult && (
          <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
            Found {analyzeResult.scenesCreated} new scene
            {analyzeResult.scenesCreated === 1 ? "" : "s"}, {analyzeResult.locationsCreated} new
            location{analyzeResult.locationsCreated === 1 ? "" : "s"}, and{" "}
            {analyzeResult.charactersCreated} new character
            {analyzeResult.charactersCreated === 1 ? "" : "s"}. Already-imported scenes and
            characters were skipped.
          </p>
        )}
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
