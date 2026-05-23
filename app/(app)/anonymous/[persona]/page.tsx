export default async function AnonymousProfilePage({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await params;

  return (
    <main className="space-y-4">
      <h2 className="text-2xl font-semibold">Anonymous Persona: {persona}</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        Anonymous karma, trust score, badges, and reputation.
      </div>
    </main>
  );
}
