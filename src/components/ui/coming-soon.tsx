export function ComingSoon({ title, sprint }: { title: string; sprint: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-16 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        This module ships in Sprint {sprint} of the XDrama roadmap. The
        underlying data model and routing are already in place — the UI is
        next.
      </p>
    </div>
  );
}
