import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          XDrama <span className="text-accent">AI Studio</span>
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Script to complete movie. A professional AI filmmaking studio —
          write or upload a script, and XDrama handles casting, cinematography,
          voice, music, and editing behind the scenes.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/sign-up"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
