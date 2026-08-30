import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectTabs } from "@/components/nav/project-tabs";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, type, status")
    .eq("id", id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/projects" className="text-xs text-muted-foreground hover:underline">
          ← Projects
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {project.status}
          </span>
        </div>
      </div>

      <ProjectTabs projectId={id} />

      <div>{children}</div>
    </div>
  );
}
