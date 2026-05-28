export default async function AnonymousProfilePage({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await params;

  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Anonymous Persona: {persona}</h2>
        <p className="page-subtitle mt-2">
          Anonymous karma, trust score, badges, and reputation history.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-card">
          <p className="text-xs text-cyan-200">Karma</p>
          <p className="mt-2 text-3xl font-bold">+184</p>
        </article>
        <article className="glass-card">
          <p className="text-xs text-fuchsia-200">Trust</p>
          <p className="mt-2 text-3xl font-bold">78</p>
        </article>
        <article className="glass-card">
          <p className="text-xs text-emerald-200">Badge Level</p>
          <p className="mt-2 text-3xl font-bold">4</p>
        </article>
      </section>
    </main>
  );
}
