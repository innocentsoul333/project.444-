export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Profile: {id}</h2>
        <p className="page-subtitle mt-2">
          Verified identity profile, contribution streaks, and reputation summary.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-card">
          <h3 className="font-semibold">Account overview</h3>
          <p className="mt-2 text-sm text-zinc-200/85">Primary identity details and verification state.</p>
        </article>
        <article className="glass-card">
          <h3 className="font-semibold">Reputation timeline</h3>
          <p className="mt-2 text-sm text-zinc-200/85">Trust signals, badges, and moderation outcomes.</p>
        </article>
      </section>
    </main>
  );
}
