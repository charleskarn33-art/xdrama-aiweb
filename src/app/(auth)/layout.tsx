export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
        <p className="mb-6 text-center text-lg font-semibold tracking-tight">
          XDrama <span className="text-muted-foreground">AI Studio</span>
        </p>
        {children}
      </div>
    </div>
  );
}
