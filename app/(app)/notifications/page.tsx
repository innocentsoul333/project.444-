export default function NotificationsPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Notifications</h2>
        <p className="page-subtitle mt-2">
          Alerts, mentions, matches, replies, and moderation updates in one feed.
        </p>
      </header>
      <section className="space-y-3">
        <article className="glass-card">
          <p className="text-xs text-fuchsia-200">Mentions</p>
          <p className="mt-1 text-sm text-zinc-100">Someone replied to your post in Design Lab.</p>
        </article>
        <article className="glass-card">
          <p className="text-xs text-cyan-200">Safety</p>
          <p className="mt-1 text-sm text-zinc-100">An emergency alert was posted near Hostel Block B.</p>
        </article>
      </section>
    </main>
  );
}
