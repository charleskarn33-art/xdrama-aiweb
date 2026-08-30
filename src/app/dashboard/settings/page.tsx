import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and profile settings.</p>
      </div>

      <form
        action={updateProfile}
        className="flex max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Email</label>
          <input
            disabled
            value={user?.email ?? ""}
            className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="display_name" className="text-xs text-muted-foreground">
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </form>
    </div>
  );
}
