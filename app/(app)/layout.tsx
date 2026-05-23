import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/feed" className="text-lg font-semibold">
              Campus Layer
            </Link>
            <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
              Live
            </div>
          </div>
        </header>
        <main className="flex-1 px-3 py-4">{children}</main>
      </div>
    </div>
  );
}
