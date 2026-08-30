export interface NavItem {
  label: string;
  href: string;
  /** Sprint this module ships in; used to render a "Coming soon" stub until then. */
  sprint?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/dashboard/projects" },
  { label: "Script Studio", href: "/dashboard/script-studio" },
  { label: "Storyboard", href: "/dashboard/storyboard", sprint: 3 },
  { label: "Characters", href: "/dashboard/characters", sprint: 3 },
  { label: "Environments", href: "/dashboard/environments", sprint: 3 },
  { label: "Scenes", href: "/dashboard/scenes", sprint: 3 },
  { label: "Timeline", href: "/dashboard/timeline", sprint: 4 },
  { label: "AI Director", href: "/dashboard/ai-director", sprint: 4 },
  { label: "AI Cinematographer", href: "/dashboard/ai-cinematographer", sprint: 4 },
  { label: "Voice", href: "/dashboard/voice", sprint: 4 },
  { label: "Music", href: "/dashboard/music", sprint: 4 },
  { label: "Assets", href: "/dashboard/assets" },
  { label: "Render Queue", href: "/dashboard/render-queue", sprint: 3 },
  { label: "Exports", href: "/dashboard/exports", sprint: 4 },
  { label: "Templates", href: "/dashboard/templates", sprint: 4 },
  { label: "Model Manager", href: "/dashboard/model-manager" },
  { label: "Settings", href: "/dashboard/settings" },
];
