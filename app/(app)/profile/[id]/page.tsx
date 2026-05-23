export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="space-y-4">
      <h2 className="text-2xl font-semibold">Profile: {id}</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        Verified identity profile and reputation history.
      </div>
    </main>
  );
}
