export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="space-y-4">
      <h2 className="text-2xl font-semibold">Community: {slug}</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        Community feed, threads, polls, and announcements.
      </div>
    </main>
  );
}
