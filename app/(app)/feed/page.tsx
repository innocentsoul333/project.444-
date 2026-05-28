import { Button } from "@/components/ui/Button";

export default function FeedPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Live Feed</h2>
        <p className="page-subtitle mt-2">
          Nearby posts, rants, alerts, polls, and stories from your campus circles.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button>New Post</Button>
          <Button variant="secondary">Trending</Button>
          <Button variant="outline">Nearby</Button>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-card">
          <p className="text-xs text-cyan-200">Campus Confessions</p>
          <h3 className="mt-1 font-semibold">Most liked post of today</h3>
          <p className="mt-2 text-sm text-zinc-200/85">Engagement and reactions can be shown here.</p>
        </article>
        <article className="glass-card">
          <p className="text-xs text-fuchsia-200">Safety Alerts</p>
          <h3 className="mt-1 font-semibold">Realtime incident updates</h3>
          <p className="mt-2 text-sm text-zinc-200/85">Emergency and moderation alerts appear in this panel.</p>
        </article>
      </section>
    </main>
  );
}
