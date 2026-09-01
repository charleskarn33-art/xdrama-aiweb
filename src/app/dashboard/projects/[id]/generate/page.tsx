import { GenerateForm } from "./generate-form";

export default async function GeneratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Submits a real AI job end-to-end: model routing, credit reservation,
        and the orchestrator call. GPU generation itself isn&apos;t deployed
        yet (Modal functions are still skeletons — see{" "}
        <code className="rounded bg-muted px-1">ai-server/modal/</code>), so
        jobs will honestly fail with &quot;AI provider unavailable&quot;
        rather than a fake result, and the credit reservation is refunded.
      </p>
      <GenerateForm projectId={projectId} />
    </div>
  );
}
