import Link from "next/link";
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

  const [{ data: wallet }, { data: packages }, { data: transactions }] = await Promise.all([
    supabase.from("credit_wallets").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("credit_packages").select("*").order("credits", { ascending: true }),
    supabase
      .from("credit_transactions")
      .select("id, type, amount, balance_after, description, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

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

      {profile?.role === "admin" && (
        <Link
          href="/dashboard/admin"
          className="max-w-md rounded-xl border border-accent/40 bg-card p-5 transition-colors hover:bg-accent/10"
        >
          <p className="font-medium text-accent">Admin Dashboard</p>
          <p className="text-sm text-muted-foreground">
            Users, projects, job status, credit issuance, system health.
          </p>
        </Link>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-muted-foreground">Billing — XCredits</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BalanceCard label="Available" value={wallet?.available_credits ?? 0} />
          <BalanceCard label="Reserved" value={wallet?.reserved_credits ?? 0} />
          <BalanceCard label="Used" value={wallet?.used_credits ?? 0} />
        </div>

        {packages && packages.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Credit packages</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>{pkg.name}</span>
                  <span className="text-muted-foreground">
                    {Number(pkg.credits).toLocaleString()} cr · $
                    {(pkg.price_cents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Checkout isn&apos;t wired up yet — billing integration ships in Sprint 5.
            </p>
          </div>
        )}

        {transactions && transactions.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Recent transactions</p>
            <ul className="divide-y divide-border text-sm">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">
                    {tx.type} {tx.description ? `— ${tx.description}` : ""}
                  </span>
                  <span>{Number(tx.amount) > 0 ? "+" : ""}{Number(tx.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function BalanceCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{Number(value).toLocaleString()}</p>
    </div>
  );
}
