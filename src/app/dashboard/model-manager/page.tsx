import { DEFAULT_MODEL_REGISTRY } from "@/lib/ai/model-registry";

const TYPE_LABELS: Record<string, string> = {
  video: "Video",
  image: "Image",
  audio: "Audio",
  tts: "Text-to-Speech",
  lip_sync: "Lip Sync",
  llm: "LLM",
};

export default function ModelManagerPage() {
  const grouped = Object.groupBy(DEFAULT_MODEL_REGISTRY, (model) => model.type);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Model Manager</h1>
        <p className="text-sm text-muted-foreground">
          The AI Router selects from these models automatically (AUTO). Advanced
          users may pin a specific model per generation.
        </p>
      </div>

      {Object.entries(grouped).map(([type, models]) => (
        <section key={type} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {TYPE_LABELS[type] ?? type}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {models?.map((model) => (
              <div
                key={model.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{model.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                      model.status === "active"
                        ? "bg-primary/20 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {model.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{model.description}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {model.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {cap.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
                {model.minimumVramGb && (
                  <p className="text-[11px] text-muted-foreground">
                    VRAM: {model.minimumVramGb}GB min · {model.recommendedVramGb}GB recommended
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
