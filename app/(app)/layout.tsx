import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/feed", label: "Feed" },
    { href: "/chat", label: "Chat" },
    { href: "/stories", label: "Stories" },
    { href: "/notifications", label: "Notifications" },
    { href: "/heatmap", label: "Heatmap" },
    { href: "/placement-hub", label: "Placement Hub" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <div className="app-shell">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-3 py-4 lg:grid-cols-[250px_1fr]">
        <aside className="glass-card hidden h-fit lg:block">
          <Link href="/feed" className="mb-4 block text-lg font-bold tracking-tight">
            Campus Layer
          </Link>
          <p className="mb-5 text-xs text-zinc-200/80">Realtime campus social layer</p>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 mb-4 rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/feed" className="text-lg font-semibold">
                Campus Layer
              </Link>
              <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                Live
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
