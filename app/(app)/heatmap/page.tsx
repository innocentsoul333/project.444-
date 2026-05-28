export default function HeatmapPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Campus Heatmap</h2>
        <p className="page-subtitle mt-2">
          Live activity pulses, trending spots, and event clusters across communities.
        </p>
      </header>
      <section className="glass-card">
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`h-12 rounded-md ${
                i % 5 === 0
                  ? "bg-fuchsia-500/60"
                  : i % 3 === 0
                    ? "bg-cyan-500/55"
                    : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
