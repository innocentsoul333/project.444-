export default function AdminPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="page-subtitle mt-2">
          Moderation queues, abuse reports, trust signals, and escalation timelines.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-card">
          <p className="text-xs text-rose-200">Open Reports</p>
          <p className="mt-2 text-3xl font-bold">23</p>
        </article>
        <article className="glass-card">
          <p className="text-xs text-amber-200">Flagged Posts</p>
          <p className="mt-2 text-3xl font-bold">8</p>
        </article>
        <article className="glass-card">
          <p className="text-xs text-emerald-200">Resolved Today</p>
          <p className="mt-2 text-3xl font-bold">41</p>
        </article>
      </section>
    </main>
  );
}
