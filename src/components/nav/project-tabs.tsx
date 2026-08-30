"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", segment: "" },
  { label: "Script", segment: "script" },
  { label: "Assets", segment: "assets" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/projects/${projectId}`;

  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const isActive = pathname === href;

        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
