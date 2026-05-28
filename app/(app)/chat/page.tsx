export default function ChatPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Chat</h2>
        <p className="page-subtitle mt-2">
          Realtime community channels with typing indicators, presence, and fast replies.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="glass-card">
          <h3 className="font-semibold">Channels</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-200/90">
            <li className="rounded-lg bg-cyan-500/20 px-3 py-2"># general</li>
            <li className="rounded-lg bg-white/5 px-3 py-2"># placements</li>
            <li className="rounded-lg bg-white/5 px-3 py-2"># events</li>
          </ul>
        </div>
        <div className="glass-card">
          <h3 className="font-semibold">Conversation</h3>
          <p className="mt-2 text-sm text-zinc-200/85">
            Message list, reactions, unread badges, and composer can render here.
          </p>
        </div>
      </section>
    </main>
  );
}
