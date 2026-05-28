export default function StoriesPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Stories</h2>
        <p className="page-subtitle mt-2">
          Anonymous 24-hour stories with reactions, replies, and campus trending signals.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="glass-card min-h-40">
          <p className="text-xs text-fuchsia-200">Anonymous</p>
          <h3 className="mt-1 font-semibold">Late-night coding confessions</h3>
        </article>
        <article className="glass-card min-h-40">
          <p className="text-xs text-cyan-200">Public</p>
          <h3 className="mt-1 font-semibold">Hackathon team wins campus finals</h3>
        </article>
        <article className="glass-card min-h-40">
          <p className="text-xs text-emerald-200">Event</p>
          <h3 className="mt-1 font-semibold">Tech fest registration is now open</h3>
        </article>
      </section>
    </main>
  );
}
