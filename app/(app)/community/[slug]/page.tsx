export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Community: {slug}</h2>
        <p className="page-subtitle mt-2">
          Community feed, threads, polls, and announcements scoped to this hub.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-card">
          <h3 className="font-semibold">Pinned discussions</h3>
          <p className="mt-2 text-sm text-zinc-200/85">Top threads and moderator notes are shown here.</p>
        </article>
        <article className="glass-card">
          <h3 className="font-semibold">Active polls</h3>
          <p className="mt-2 text-sm text-zinc-200/85">Vote cards and latest poll outcomes.</p>
        </article>
      </section>
    </main>
  );
}
