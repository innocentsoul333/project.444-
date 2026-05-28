export default function PlacementHubPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Placement Hub</h2>
        <p className="page-subtitle mt-2">
          Interview experiences, OA questions, salary data, and peer tips.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-card">
          <h3 className="font-semibold">Latest placement reports</h3>
          <p className="mt-2 text-sm text-zinc-200/85">Shortlisted student experiences and role details.</p>
        </article>
        <article className="glass-card">
          <h3 className="font-semibold">Package trends</h3>
          <p className="mt-2 text-sm text-zinc-200/85">Company-wise compensation snapshots by year.</p>
        </article>
      </section>
    </main>
  );
}
