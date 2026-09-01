"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="scrollbar-thin flex h-full w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-card/60 p-3">
      <div className="mb-4 px-2 pt-2">
        <span className="text-lg font-semibold tracking-tight">XDrama</span>
        <span className="ml-1 text-sm text-muted-foreground">AI Studio</span>
      </div>
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span>{item.label}</span>
            {item.sprint && (
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                S{item.sprint}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
